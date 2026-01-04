
import os
import asyncio
import base64
import logging
import random
import secrets
import io
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import bcrypt
import httpx
import jwt
import requests
import uvicorn
import pypdf
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, Query, UploadFile, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection
from pinecone import Pinecone, ServerlessSpec
from pydantic import BaseModel
from pymongo import ReturnDocument
from pymongo.errors import ConfigurationError
from langchain_text_splitters import RecursiveCharacterTextSplitter

# --- Load environment variables ---
load_dotenv()

# Pinecone Config
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME") # Default fallback index

if not PINECONE_API_KEY:
    raise RuntimeError("Missing PINECONE_API_KEY environment variable.")

# Groq Config (Failover Logic)
numbers = [1, 2, 3]
selected = random.choice(numbers)
api_key = "GROQ_API_KEY_" + str(selected)
GROQ_API_KEY = os.getenv(api_key)

EMBEDDING_API_URL = "https://rahulbro123-embedding-model.hf.space/get_embeddings"

# Sarvam Config
SARVAM_API_KEY = "sk_f8fjoda1_s83hQcvwfwwmPIwImLdTaReh"
SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech"
SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text"

# --- Authentication & Persistence Configuration ---
if not logging.getLogger().handlers:
    logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("iomp_backend")

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")
MONGO_USERS_COLLECTION = os.getenv("MONGO_USERS_COLLECTION", "users")
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
try:
    JWT_EXPIRATION_MINUTES = int(os.getenv("JWT_EXPIRATION_MINUTES", "1440"))
except ValueError:
    JWT_EXPIRATION_MINUTES = 1440
BREVO_API_KEY = os.getenv("BREVO_API_KEY")
BREVO_SENDER_EMAIL = "rahulvalavoju123@gmail.com"
BREVO_EMAIL_ENDPOINT = "https://api.brevo.com/v3/smtp/email"

mongo_client: Optional[AsyncIOMotorClient] = None
users_collection: Optional[AsyncIOMotorCollection] = None
database: Optional[Any] = None

conversations_collection: Optional[AsyncIOMotorCollection] = None
analytics_collection: Optional[AsyncIOMotorCollection] = None

if MONGO_URI:
    try:
        mongo_client = AsyncIOMotorClient(MONGO_URI)
        try:
            database = mongo_client.get_default_database()
        except ConfigurationError:
            if MONGO_DB_NAME:
                database = mongo_client[MONGO_DB_NAME]
            else:
                database = None
                logger.warning("Mongo URI does not include a database name and MONGO_DB_NAME is not set.")
        if database is not None:
            users_collection = database[MONGO_USERS_COLLECTION]
            conversations_collection = database["conversations"]
            analytics_collection = database["analytics"]
            logger.info("MongoDB connected for auth features (collection: %s)", MONGO_USERS_COLLECTION)
            logger.info("Conversations and analytics collections initialized")
    except Exception as exc:
        logger.error("MongoDB connection error: %s", exc)
else:
    logger.warning("MONGO_URI not provided. Auth endpoints will be unavailable.")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pinecone Client ---
pc = Pinecone(api_key=PINECONE_API_KEY)

# --- Request/Response Models ---
class QueryRequest(BaseModel):
    question: str
    index_name: Optional[str] = None # Optional: if not provided, uses default

class RegisterRequest(BaseModel):
    username: str
    email: str

class VerifyOtpRequest(BaseModel):
    email: str
    otp: str
    password: str

class LoginRequest(BaseModel):
    identifier: str
    password: str

class MessageModel(BaseModel):
    role: str
    text: str
    timestamp: str

class ConversationRequest(BaseModel):
    sessionId: str
    timestamp: str
    duration: int
    messageCount: int
    messages: List[MessageModel]
    userId: Optional[str] = None

class AnalyticsData(BaseModel):
    totalCalls: int
    totalDuration: int
    avgCallDuration: float
    callsToday: int
    lastUpdated: str

class UploadResponse(BaseModel):
    success: bool
    index_name: str
    message: str

# --- Auth Helper Functions ---
def _require_user_collection() -> AsyncIOMotorCollection:
    if users_collection is None:
        logger.error("User store not configured; check MongoDB settings.")
        raise HTTPException(status_code=500, detail="User store not configured.")
    return users_collection

def _create_access_token(email: str) -> str:
    if not JWT_SECRET:
        logger.error("JWT secret missing; cannot issue tokens.")
        raise HTTPException(status_code=500, detail="Authentication service unavailable.")
    expiry = datetime.utcnow() + timedelta(minutes=JWT_EXPIRATION_MINUTES)
    payload = {"email": email, "exp": expiry}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def _generate_otp() -> int:
    return secrets.randbelow(900000) + 100000

def _normalize_email(email: str) -> str:
    return email.strip().lower()

async def _send_otp_email(recipient: str, otp: int) -> None:
    headers = {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        "accept": "application/json",
    }
    payload = {
        "sender": {"email": BREVO_SENDER_EMAIL},
        "to": [{"email": recipient}],
        "subject": "Your Verification OTP",
        "htmlContent": f"<p>Your OTP is <strong>{otp}</strong></p>",
        "textContent": f"Your OTP is {otp}",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            BREVO_EMAIL_ENDPOINT,
            headers=headers,
            json=payload,
        )
        response.raise_for_status()

# --- TTS Helper ---
def _chunk_text_for_tts(text: str, max_chars: int = 480) -> List[str]:
    """Split text into chunks that comply with the API character limit."""
    words = text.strip().split()
    if not words:
        return []

    chunks: List[str] = []
    current_words: List[str] = []
    current_len = 0

    for word in words:
        word_len = len(word)
        if word_len > max_chars:
            if current_words:
                chunks.append(" ".join(current_words))
                current_words = []
                current_len = 0
            for start in range(0, word_len, max_chars):
                chunks.append(word[start : start + max_chars])
            continue

        additional_len = word_len if not current_words else word_len + 1
        if current_len + additional_len > max_chars:
            chunks.append(" ".join(current_words))
            current_words = [word]
            current_len = word_len
        else:
            if current_words:
                current_len += 1
            current_words.append(word)
            current_len += word_len

    if current_words:
        chunks.append(" ".join(current_words))

    return chunks

# -------------------
# Sarvam TTS/STT Endpoints
# -------------------
@app.get("/tts")
async def tts(text: str, language_code: str = "en-IN", speaker: str = "anushka"):
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Text is required for TTS")

    chunks = _chunk_text_for_tts(text, max_chars=480)
    if not chunks:
        raise HTTPException(status_code=400, detail="Unable to prepare text for TTS")

    headers = {
        "api-subscription-key": SARVAM_API_KEY,
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient(timeout=120) as client:
        tasks = [
            client.post(
                SARVAM_TTS_URL,
                headers=headers,
                json={
                    "inputs": [chunk],
                    "target_language_code": language_code,
                    "speaker": speaker,
                    "audio_format": "mp3"
                },
            )
            for chunk in chunks
        ]
        responses = await asyncio.gather(*tasks, return_exceptions=True)

    audio_segments: List[bytes] = []
    for idx, result in enumerate(responses):
        if isinstance(result, Exception):
            raise HTTPException(status_code=500, detail=f"TTS chunk {idx} failed: {result}")

        if result.status_code != 200:
            return JSONResponse(
                status_code=result.status_code,
                content={"error": result.text, "chunk": idx}
            )

        data = result.json()
        if "audios" not in data or not data["audios"]:
            return JSONResponse(
                status_code=502,
                content={"error": "No audio returned from Sarvam", "chunk": idx}
            )

        audio_segments.append(base64.b64decode(data["audios"][0]))

    if not audio_segments:
        return JSONResponse({"error": "No audio returned from Sarvam"})

    combined_audio = b"".join(audio_segments)
    return Response(content=combined_audio, media_type="audio/mpeg")

@app.post("/stt")
async def stt_sarvam(file: UploadFile = File(...), language_code: Optional[str] = Query(None)):
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty audio file")

    headers = {"api-subscription-key": SARVAM_API_KEY}
    data = {"model": "saarika:v2.5"}
    if language_code:
        data["language_code"] = language_code

    files = {"file": (file.filename, contents, file.content_type)}

    resp = requests.post(SARVAM_STT_URL, headers=headers, data=data, files=files)
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=f"STT error: {resp.text}")

    resp_json = resp.json()
    transcript = resp_json.get("transcript") or resp_json.get("text") or ""
    return JSONResponse({"transcript": transcript})

# -------------------
# Embedding & Retrieval
# -------------------
async def embed_texts(texts: List[str]) -> List[List[float]]:
    """Embed texts using the remote Hugging Face API."""
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(EMBEDDING_API_URL, json={"texts": texts})
            response.raise_for_status()
            return response.json()["embeddings"]
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Embedding API error: {e.response.text}",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {e}")

async def retrieve_context(query_vector: List[float], index_name: Optional[str] = None, top_k: int = 5) -> str:
    """Search Pinecone for relevant context. Supports dynamic indexes."""
    target_index_name = index_name or PINECONE_INDEX_NAME
    
    if not target_index_name:
        logger.warning("No index name provided for context retrieval.")
        return "" 

    try:
        # Connect to specific index
        target_index = pc.Index(target_index_name)
        
        results = target_index.query(vector=query_vector, top_k=top_k, include_metadata=True)
        if not results.matches:
            return ""
        return "\n\n---\n\n".join([m["metadata"]["text"] for m in results.matches if "metadata" in m])
    except Exception as e:
        logger.error(f"Context retrieval failed for {target_index_name}: {e}")
        return ""

async def get_answer(query: str, context: str) -> str:
    """Use Groq LLM to answer based on retrieved context."""
    if not context.strip():
        return "Sorry I can't find the details in the knowledge base."

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}"}
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a helpful Business Document Assistant Chatbot speaking directly to a user. "
                    "Answer the user's question based ONLY on the provided context. "
                    "If the answer is not in the context, say: "
                    "'I can't tell you, please contact the nearest expert.'"
                ),
            },
            {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {query}"},
        ],
        "temperature": 0.2,
    }

    async with httpx.AsyncClient() as client:
        r = await client.post(url, headers=headers, json=payload)
        if r.status_code != 200:
            error_detail = r.json()
            raise HTTPException(
                status_code=r.status_code,
                detail=f"Groq answering failed: {error_detail}",
            )
        return r.json()["choices"][0]["message"]["content"].strip()

# -------------------
# Document Upload Helpers
# -------------------
def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Reads PDF bytes and extracts text."""
    try:
        pdf_stream = io.BytesIO(file_bytes)
        reader = pypdf.PdfReader(pdf_stream)
        text = []
        for page in reader.pages:
            content = page.extract_text()
            if content:
                text.append(content)
        return "\n".join(text)
    except Exception as e:
        logger.error(f"Error extracting PDF: {e}")
        return ""

def manage_indexes_and_create_sync(new_index_name: str, dimension: int = 768):
    """
    Checks current indexes. If >= 5, deletes the first one found.
    Then creates the new index.
    """
    existing_indexes = pc.list_indexes()
    try:
        index_names = [i.name for i in existing_indexes]
    except:
        index_names = list(existing_indexes.names())

    logger.info(f"Current indexes ({len(index_names)}): {index_names}")

    if len(index_names) >= 5:
        to_delete = index_names[0]
        logger.info(f"Limit reached (5). Deleting index: {to_delete}")
        pc.delete_index(to_delete)
    
    logger.info(f"Creating new index: {new_index_name}")
    pc.create_index(
        name=new_index_name,
        dimension=dimension,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1")
    )

async def process_pdf_and_upsert(index_name: str, full_text: str):
    # 1. Chunk
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = splitter.split_text(full_text)
    
    if not chunks:
        return

    # 2. Embed
    logger.info(f"Embedding {len(chunks)} chunks...")
    vectors = []
    batch_size = 32
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i+batch_size]
        batch_vectors = await embed_texts(batch)
        vectors.extend(batch_vectors)

    # 3. Upsert
    to_upsert = []
    for i, (chunk, vec) in enumerate(zip(chunks, vectors)):
        to_upsert.append({
            "id": f"doc_{i}_{uuid.uuid4().hex[:8]}",
            "values": vec,
            "metadata": {"text": chunk}
        })
    
    def _upsert_sync(vectors_batch):
        target_index = pc.Index(index_name)
        # Upsert in batches
        for i in range(0, len(vectors_batch), 100):
            target_index.upsert(vectors=vectors_batch[i:i+100])
    
    await asyncio.to_thread(_upsert_sync, to_upsert)

# -------------------
# Document Upload Endpoint
# -------------------
@app.post("/document-upload", response_model=UploadResponse)
async def document_upload(
    file: UploadFile = File(...), 
    authorization: Optional[str] = Header(None)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    # 1. Read File
    content = await file.read()
    text = extract_text_from_pdf(content)
    
    if not text or len(text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Could not extract enough text from PDF.")

    # 2. Manage Index (Delete old if needed, Create new)
    new_index_name = f"pdf-{uuid.uuid4().hex[:8]}"
    try:
        await asyncio.to_thread(manage_indexes_and_create_sync, new_index_name)
    except Exception as e:
        logger.error(f"Index management error: {e}")
        raise HTTPException(status_code=500, detail=f"Pinecone Error: {str(e)}")

    # 3. Chunk, Embed, Upsert
    await process_pdf_and_upsert(new_index_name, text)

    return UploadResponse(
        success=True, 
        index_name=new_index_name, 
        message="PDF processed and uploaded successfully."
    )

# -------------------
# Chat Endpoint
# -------------------
@app.post("/chat")
async def chat(request: QueryRequest) -> Dict[str, Any]:
    try:
        # 1. Embed query
        query_vector = (await embed_texts([request.question]))[0]
        
        # 2. Retrieve from specific index or default
        context = await retrieve_context(query_vector, request.index_name, top_k=5)

        # Debug logs
        print(f"Query: {request.question}")
        print(f"Index: {request.index_name}")
        print(f"Context found: {bool(context)}")

        # 3. Answer
        answer = await get_answer(request.question, context)

        return {
            "original_query": request.question,
            "used_index": request.index_name or PINECONE_INDEX_NAME,
            "answer": answer,
            "context_found": bool(context.strip())
        }
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# -------------------
# Chat with Voice Endpoint (Combined Chat + TTS)
# -------------------
@app.post("/chat-voice")
async def chat_voice(request: QueryRequest, language_code: str = "en-IN", speaker: str = "anushka"):
    """
    Combined endpoint that returns both text answer and audio in one call.
    Returns: {"answer": str, "audio_base64": str}
    """
    try:
        # 1. Embed query
        query_vector = (await embed_texts([request.question]))[0]
        
        # 2. Retrieve from specific index or default
        context = await retrieve_context(query_vector, request.index_name, top_k=5)

        # Debug logs
        print(f"Query: {request.question}")
        print(f"Index: {request.index_name}")
        print(f"Context found: {bool(context)}")

        # 3. Get answer
        answer = await get_answer(request.question, context)

        # 4. Generate TTS for the answer
        chunks = _chunk_text_for_tts(answer, max_chars=480)
        if not chunks:
            return {
                "answer": answer,
                "audio_base64": None,
                "error": "Unable to generate audio"
            }

        headers = {
            "api-subscription-key": SARVAM_API_KEY,
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient(timeout=120) as client:
            tasks = [
                client.post(
                    SARVAM_TTS_URL,
                    headers=headers,
                    json={
                        "inputs": [chunk],
                        "target_language_code": language_code,
                        "speaker": speaker,
                        "audio_format": "mp3"
                    },
                )
                for chunk in chunks
            ]
            responses = await asyncio.gather(*tasks, return_exceptions=True)

        audio_segments: List[bytes] = []
        for idx, result in enumerate(responses):
            if isinstance(result, Exception):
                logger.error(f"TTS chunk {idx} failed: {result}")
                continue

            if result.status_code == 200:
                data = result.json()
                if "audios" in data and data["audios"]:
                    audio_segments.append(base64.b64decode(data["audios"][0]))

        if audio_segments:
            combined_audio = b"".join(audio_segments)
            audio_base64 = base64.b64encode(combined_audio).decode('utf-8')
        else:
            audio_base64 = None

        return {
            "answer": answer,
            "audio_base64": audio_base64,
            "context_found": bool(context.strip())
        }
    except Exception as e:
        logger.error(f"Chat-voice error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# -------------------
# Auth Endpoints
# -------------------
@app.post("/register")
async def register_user(payload: RegisterRequest) -> Dict[str, str]:
    collection = _require_user_collection()
    if not BREVO_API_KEY:
        logger.error("BREVO_API_KEY missing; cannot send OTP emails.")
        raise HTTPException(status_code=500, detail="Email service unavailable.")

    email = _normalize_email(payload.email)
    username = payload.username.strip()

    existing_user = await collection.find_one({
        "email": email,
        "otp": {"$exists": False},
    })
    if existing_user:
        raise HTTPException(status_code=400, detail="User already registered")

    otp = _generate_otp()
    await collection.update_one(
        {"email": email},
        {"$set": {"username": username, "email": email, "otp": otp}},
        upsert=True,
    )

    try:
        await _send_otp_email(email, otp)
        logger.info("OTP sent to %s", email)
    except httpx.HTTPStatusError as exc:
        logger.error("Brevo API error while sending OTP to %s: %s", email, exc.response.text)
        raise HTTPException(status_code=500, detail="Error sending OTP") from exc
    except httpx.HTTPError as exc:
        logger.error("Failed to send OTP to %s: %s", email, exc)
        raise HTTPException(status_code=500, detail="Error sending OTP") from exc

    return {"message": "OTP sent to email"}


@app.post("/verify-otp")
async def verify_otp(payload: VerifyOtpRequest) -> Dict[str, Any]:
    collection = _require_user_collection()
    email = _normalize_email(payload.email)

    temp_user = await collection.find_one({"email": email})
    if not temp_user or "otp" not in temp_user:
        raise HTTPException(status_code=404, detail="No OTP record")

    try:
        submitted_otp = int(payload.otp)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid OTP") from exc

    if temp_user["otp"] != submitted_otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    hashed_password = bcrypt.hashpw(payload.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    updated_user = await collection.find_one_and_update(
        {"email": email},
        {"$set": {"password": hashed_password}, "$unset": {"otp": ""}},
        return_document=ReturnDocument.AFTER,
    )

    if not updated_user:
        raise HTTPException(status_code=500, detail="Server error")

    token = _create_access_token(updated_user["email"])

    return {
        "message": "Verified successfully",
        "token": token,
        "user": {
            "username": updated_user.get("username"),
            "email": updated_user.get("email"),
        },
    }


@app.post("/login")
async def login_user(payload: LoginRequest) -> Dict[str, Any]:
    collection = _require_user_collection()
    identifier_raw = payload.identifier.strip()
    email_candidate = _normalize_email(identifier_raw)

    query_conditions = [
        {"username": identifier_raw},
        {"email": identifier_raw},
    ]
    if email_candidate != identifier_raw:
        query_conditions.append({"email": email_candidate})

    user = await collection.find_one(
        {
            "$or": query_conditions,
            "otp": {"$exists": False},
        }
    )
    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    stored_password = user.get("password")
    if not stored_password:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not bcrypt.checkpw(payload.password.encode("utf-8"), stored_password.encode("utf-8")):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = _create_access_token(user["email"])

    return {
        "message": "Login successful",
        "token": token,
        "user": {
            "username": user.get("username"),
            "email": user.get("email"),
        },
    }

@app.post("/save-conversation")
async def save_conversation(conversation: ConversationRequest) -> Dict[str, Any]:
    if conversations_collection is None:
        raise HTTPException(status_code=503, detail="Conversations collection not available")
    
    try:
        conversation_data = {
            "sessionId": conversation.sessionId,
            "timestamp": conversation.timestamp,
            "duration": conversation.duration,
            "messageCount": conversation.messageCount,
            "messages": [msg.dict() for msg in conversation.messages],
            "userId": conversation.userId,
            "createdAt": datetime.utcnow()
        }
        
        result = await conversations_collection.insert_one(conversation_data)
        
        return {
            "success": True,
            "message": "Conversation saved successfully",
            "id": str(result.inserted_id)
        }
    except Exception as e:
        logger.error(f"Error saving conversation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save conversation: {str(e)}")

@app.get("/get-conversations")
async def get_conversations(
    limit: int = Query(50, ge=1, le=100),
    userId: Optional[str] = Query(None)
) -> Dict[str, Any]:
    if conversations_collection is None:
        raise HTTPException(status_code=503, detail="Conversations collection not available")
    
    try:
        # Build query filter
        query_filter = {}
        if userId:
            query_filter["userId"] = userId
        
        cursor = conversations_collection.find(query_filter).sort("createdAt", -1).limit(limit)
        conversations = []
        
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            conversations.append(doc)
        
        return {
            "success": True,
            "conversations": conversations,
            "count": len(conversations),
            "userId": userId
        }
    except Exception as e:
        logger.error(f"Error fetching conversations: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch conversations: {str(e)}")

@app.post("/save-analytics")
async def save_analytics(analytics: AnalyticsData) -> Dict[str, Any]:
    if analytics_collection is None:
        raise HTTPException(status_code=503, detail="Analytics collection not available")
    
    try:
        analytics_data = {
            "totalCalls": analytics.totalCalls,
            "totalDuration": analytics.totalDuration,
            "avgCallDuration": analytics.avgCallDuration,
            "callsToday": analytics.callsToday,
            "lastUpdated": analytics.lastUpdated,
            "updatedAt": datetime.utcnow()
        }
        
        # Upsert analytics (update if exists, insert if not)
        result = await analytics_collection.update_one(
            {},  # Match first document (singleton pattern)
            {"$set": analytics_data},
            upsert=True
        )
        
        return {
            "success": True,
            "message": "Analytics saved successfully"
        }
    except Exception as e:
        logger.error(f"Error saving analytics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save analytics: {str(e)}")

@app.get("/get-analytics")
async def get_analytics() -> Dict[str, Any]:
    if analytics_collection is None:
        raise HTTPException(status_code=503, detail="Analytics collection not available")
    
    try:
        analytics = await analytics_collection.find_one()
        
        if not analytics:
            # Return default analytics if none exist
            return {
                "success": True,
                "analytics": {
                    "totalCalls": 0,
                    "totalDuration": 0,
                    "avgCallDuration": 0,
                    "callsToday": 0,
                    "lastUpdated": datetime.utcnow().isoformat()
                }
            }
        
        analytics["_id"] = str(analytics["_id"])
        
        return {
            "success": True,
            "analytics": analytics
        }
    except Exception as e:
        logger.error(f"Error fetching analytics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch analytics: {str(e)}")

@app.get("/")
def read_root():
    return {"status": "Customer support API is online"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
