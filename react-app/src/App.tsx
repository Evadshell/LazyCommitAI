import React, { useEffect, useState } from "react";
import FileTree from "./components/FileTree";
import "./App.css";

declare global {
    interface Window {
        fileTree: any;
        vscode: any;
    }
}

function App() {
    const [fileTree, setFileTree] = useState(null);
    const [fileContent, setFileContent] = useState("");
    const [selectedFile, setSelectedFile] = useState("");

    useEffect(() => {
        if (window.fileTree) {
            setFileTree(window.fileTree);
        }

        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            if (message.command === "displayFileContent") {
                setFileContent(message.content);
            } else if (message.command === "fileTree") {
                setFileTree(message.content);
            }
        };

        window.addEventListener("message", handleMessage);

        return () => {
            window.removeEventListener("message", handleMessage);
        };
    }, []);

    const handleFileClick = (filePath: string) => {
        setSelectedFile(filePath);
        window.vscode?.postMessage({ type: "getFileContent", data: filePath });
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
            <div className="file-content-container">
                <h2>File Content: {selectedFile}</h2>
                <pre>{fileContent || "Select a file to view its content."}</pre>
            </div>
        </div>
    );
}

export default App;