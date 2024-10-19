import React, { useState } from 'react';
import './FileBreaker.css';

interface FileBreakdownProps {
    filePath: string;
  }
export default function FileBreakdown({ filePath }: FileBreakdownProps) {
    const [suggestion, setSuggestion] = useState<string | null>(null);
  
    const handleBreakdown = () => {
      window.vscode.postMessage({ type: 'breakFile', data: filePath });
    };
  
    const handleApplyBreakdown = () => {
      if (suggestion) {
        window.vscode.postMessage({ 
          type: 'applyBreakdown', 
          data: { filePath, suggestion } 
        });
      }
    };
  
    React.useEffect(() => {
      const messageHandler = (event: MessageEvent) => {
        const message = event.data;
        switch (message.command) {
          case 'displayBreakSuggestion':
            setSuggestion(message.content);
            break;
        }
      };
  
      window.addEventListener('message', messageHandler);
  
      return () => {
        window.removeEventListener('message', messageHandler);
      };
    }, []);
  
    return (
      <div className="file-breakdown">
        <button onClick={handleBreakdown}>Break Down File</button>
        {suggestion && (
          <>
            <pre className="suggestion">{suggestion}</pre>
            <button onClick={handleApplyBreakdown}>Apply Breakdown</button>
          </>
        )}
      </div>
    );
  }