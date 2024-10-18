import React, { useState } from 'react';
import './FileTree.css';

interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'folder';
    children?: FileNode[];
}

interface FileTreeProps {
    fileStructure: FileNode;
    onFileClick: (path: string) => void;
    selectedFile: string;
}

const FileTree: React.FC<FileTreeProps> = ({ fileStructure, onFileClick, selectedFile }) => {
    const [expandedNodes, setExpandedNodes] = useState<string[]>([]);

    const toggleFolder = (folderPath: string) => {
        setExpandedNodes((prevState) =>
            prevState.includes(folderPath)
                ? prevState.filter((path) => path !== folderPath)
                : [...prevState, folderPath]
        );
    };

    const renderFileTree = (node: FileNode) => {
        return (
            <div key={node.path} className={`file-item ${node.type}`}>
                {node.type === 'folder' ? (
                    <>
                        <span
                            className={`folder-name ${expandedNodes.includes(node.path) ? 'open' : ''}`}
                            onClick={() => toggleFolder(node.path)}
                        >
                            {node.name}
                        </span>
                        {expandedNodes.includes(node.path) && node.children && (
                            <div className="folder-contents">
                                {node.children.map(child => renderFileTree(child))}
                            </div>
                        )}
                    </>
                ) : (
                    <span 
                        className={`file-name ${selectedFile === node.path ? 'selected' : ''}`} 
                        onClick={() => onFileClick(node.path)}
                    >
                        {node.name}
                    </span>
                )}
            </div>
        );
    };

    return <div className="file-tree">{renderFileTree(fileStructure)}</div>;
};

export default FileTree;