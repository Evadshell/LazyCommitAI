import React, { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";

interface CommitNode {
  hash: string;
  message: string;
  date: string;
}

const CommitTree: React.FC = () => {
  const [commitHistory, setCommitHistory] = useState<CommitNode[]>([]);

  useEffect(() => {
    window.vscode?.postMessage({ type: "getCommitHistory" });

    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.command === "displayCommitHistory") {
        setCommitHistory(message.content);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleRevert = (commitHash: string) => {
    const confirmRevert = window.confirm(
      "Are you sure you want to revert to this commit?"
    );
    if (confirmRevert) {
      window.vscode?.postMessage({ type: "revertCommit", data: commitHash });
    }
  };

  return (
    <div>
      <Toaster position="top-right" reverseOrder={false} />

      <h2>Commit History</h2>
      <ul className="commit-tree">
        {commitHistory.map((commit) => (
          <li key={commit.hash}>
            <div className="commit-details">
              <span className="commit-message">{commit.message}</span> -{" "}
              <span className="commit-date">{commit.date}</span>
              <button onClick={() => handleRevert(commit.hash)}>Revert</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CommitTree;
