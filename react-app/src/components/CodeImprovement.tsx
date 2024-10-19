import React, { useState } from 'react';
import './CodeImprovement.css';
import { LightAsync as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';

interface CodeImprovementProps {
    setImprovedCode: (code: string) => void;
}

const CodeImprovement: React.FC<CodeImprovementProps> = ({ setImprovedCode }) => {
    const [code, setCode] = useState('');
    const [instructions, setInstructions] = useState('');
    const [improvedCode, setImprovedCodeState] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        window.vscode?.postMessage({ 
            type: "improveCode", 
            data: { code, instructions } 
        });
    };

    // Example listener for receiving improved code from the VSCode extension
    window.addEventListener('message', (event) => {
        if (event.data.type === 'improvedCode') {
            setImprovedCodeState(event.data.code); // Update the improved code state
        }
    });

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

            {/* Improved code display */}
            {improvedCode && (
                <div className="improved-code-section">
                    <h3>Improved Code:</h3>
                    <SyntaxHighlighter language="javascript" style={vs2015}>
                        {improvedCode}
                    </SyntaxHighlighter>
                </div>
            )}
        </div>
    );
};

export default CodeImprovement;
