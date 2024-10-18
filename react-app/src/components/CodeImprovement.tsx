import React, { useState } from 'react';
import './CodeImprovement.css';

interface CodeImprovementProps {
    setImprovedCode: (code: string) => void;
}

const CodeImprovement: React.FC<CodeImprovementProps> = ({ setImprovedCode }) => {
    const [code, setCode] = useState('');
    const [instructions, setInstructions] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        window.vscode?.postMessage({ 
            type: "improveCode", 
            data: { code, instructions } 
        });
    };

    return (
        <div className="code-improvement-container">
            <h2>Improve Code</h2>
            <form onSubmit={handleSubmit}>
                <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Paste your code here"
                    rows={10}
                />
                <input
                    type="text"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Enter improvement instructions"
                />
                <button type="submit">Improve Code</button>
            </form>
        </div>
    );
};

export default CodeImprovement;