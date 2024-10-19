import React from 'react';
import './FileBreaker.css';

interface FileBreakerProps {
    breakSuggestion: string;
}

const FileBreaker: React.FC<FileBreakerProps> = ({ breakSuggestion }) => {
    return (
        <div className="file-breaker">
            <h2>File Break Suggestion</h2>
            <pre>{breakSuggestion || "Click 'Suggest File Break' in the File Summary tab to get suggestions."}</pre>
        </div>
    );
};

export default FileBreaker;