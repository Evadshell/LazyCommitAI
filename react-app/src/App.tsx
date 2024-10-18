import React, { useEffect, useState } from "react";
import FileTree from "./components/FileTree";
import CodeImprovement from "./components/CodeImprovement";
import "./App.css";

declare global {
    interface Window {
        fileTree: any;
        vscode: any;
    }
}

function App() {
    const [fileTree, setFileTree] = useState(null);
    const [fileSummary, setFileSummary] = useState("");
    const [selectedFile, setSelectedFile] = useState("");
    const [improvedCode, setImprovedCode] = useState("");

    useEffect(() => {
        if (window.fileTree) {
            setFileTree(window.fileTree);
        }

        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            if (message.command === "displayFileSummary") {
                setFileSummary(message.content);
            } else if (message.command === "fileTree") {
                setFileTree(message.content);
            } else if (message.command === "displayImprovedCode") {
                setImprovedCode(message.content);
            }
        };

        window.addEventListener("message", handleMessage);

        return () => {
            window.removeEventListener("message", handleMessage);
        };
    }, []);

    const handleFileClick = (filePath: string) => {
        setSelectedFile(filePath);
        window.vscode?.postMessage({ type: "getFileSummary", data: filePath });
    };

    return (
        <div className="app-container">
            <div className="file-tree-container">
                <h2>Project Structure</h2>
                {fileTree ? (
                    <FileTree
                        fileStructure={fileTree}
                        onFileClick={handleFileClick}
                        selectedFile={selectedFile}
                    />
                ) : (
                    <p>Loading file structure...</p>
                )}
            </div>
            <div className="content-container">
                <div className="file-summary-container">
                    <h2>File Summary: {selectedFile}</h2>
                    <pre>{fileSummary || "Select a file to view its summary."}</pre>
                </div>
                <CodeImprovement setImprovedCode={setImprovedCode} />
                <div className="improved-code-container">
                    <h2>Improved Code</h2>
                    <pre>{improvedCode || "Improved code will appear here."}</pre>
                </div>
            </div>
        </div>
    );
}

export default App;