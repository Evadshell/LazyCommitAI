import React, { useState } from 'react';
import './FileTree.css';

const FileTree = ({ fileStructure = [], onFileClick }) => {
    const [expandedNodes, setExpandedNodes] = useState([]);

    const toggleFolder = (folderPath) => {
        setExpandedNodes((prevState) =>
            prevState.includes(folderPath)
                ? prevState.filter((path) => path !== folderPath)
                : [...prevState, folderPath]
        );
    };

    const renderFileTree = (files) => {
        if (!Array.isArray(files) || files.length === 0) {
            return <p>No files found.</p>;  // Safeguard for empty or invalid file structure
        }

        return files.map((file) => (
            <div key={file.path} className={`file-item ${file.type}`}>
                {file.type === 'folder' ? (
                    <>
                        <span
                            className={`folder-name ${expandedNodes.includes(file.path) ? 'open' : ''}`}
                            onClick={() => toggleFolder(file.path)}
                        >
                            {expandedNodes.includes(file.path) ? '📂' : '📁'} {file.name}
                        </span>
                        {expandedNodes.includes(file.path) && (
                            <div className="folder-contents">{renderFileTree(file.children)}</div>
                        )}
                    </>
                ) : (
                    <span className="file-name" onClick={() => onFileClick(file.path)}>
                        🗎 {file.name}
                    </span>
                )}
            </div>
        ));
    };

    return <div className="file-tree">{renderFileTree(fileStructure)}</div>;
};

export default FileTree;
