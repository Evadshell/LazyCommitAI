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
    const [filesAndFolders, setFilesAndFolders] = useState([]);
    const [fileContent, setFileContent] = useState("");

    useEffect(() => {
        // Log window.fileTree to check if it's being passed correctly
        console.log('Initial window.fileTree:', window.fileTree);

        // Initialize file tree on mount
        if (window.fileTree) {
            setFilesAndFolders(window.fileTree);
        } else {
            console.log('fileTree is undefined or empty');
        }

        // Listen to messages from the VS Code extension
        window.addEventListener("message", (event) => {
            const message = event.data;
            console.log('Received message from VS Code:', message);
            if (message.command === "displayFileContent") {
                setFileContent(message.content);
            } else if (message.command === "fileTree") {
                setFilesAndFolders(message.content);
            }
        });

        return () => {
            window.removeEventListener("message", () => {});
        };
    }, []);

    const vscodeApi = (window as any).vscode;

    // Handle file click to request file content from the VS Code extension
    const handleFileClick = (filePath: string) => {
        vscodeApi.postMessage({ type: "getFileContent", data: filePath });
    };

    return (
        <div className="app-container">
            <div className="file-tree-container">
                <h3>Project File Structure</h3>
                <FileTree
                    fileStructure={filesAndFolders}
                    onFileClick={handleFileClick}
                />
            </div>
            <div className="file-content-container">
                <h3>File Content</h3>
                <pre>{fileContent || "Select a file to view its content."}</pre>
            </div>
        </div>
    );
}

export default App;
