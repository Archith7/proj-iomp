import React from 'react';

export const formatNumberedText = (text) => {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className="formatted-text">
      {lines.map((line, index) => {
        const trimmedLine = line.trim();
        
        // Handle empty lines
        if (!trimmedLine) {
          return <div key={index} style={{ height: '10px' }}></div>;
        }

        // Check for numbered points (e.g., "1. Something")
        // Regex looks for start of string, digit(s), dot, space
        const numberMatch = trimmedLine.match(/^(\d+\.)\s+(.*)/);
        if (numberMatch) {
          return (
            <div key={index} style={{ marginTop: '16px', marginBottom: '8px' }}>
              <strong>{numberMatch[1]} {numberMatch[2]}</strong>
            </div>
          );
        }

        // Check for bullet points
        if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
          return (
            <div key={index} style={{ marginLeft: '20px', marginBottom: '4px' }}>
              • {trimmedLine.substring(2)}
            </div>
          );
        }

        // Regular text
        return (
          <div key={index} style={{ marginBottom: '4px' }}>
            {line}
          </div>
        );
      })}
    </div>
  );
};
