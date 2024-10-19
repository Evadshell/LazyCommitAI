import React, { useState, useEffect } from "react";
import { Timeline, Card, Button, Typography } from "antd";
import { ClockCircleOutlined, RollbackOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface CommitNode {
  hash: string;
  message:  string;
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
      } else if (message.command === "revertSuccess") {
        alert("Commit successfully reverted!");
        window.location.reload(); // Refresh the window after revert
      } else if (message.command === "revertFailed") {
        alert(`Revert failed: ${message.content}`);
      }
    };
  
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);
  

const handleRevert = (commitHash: string) => {
  window.vscode?.postMessage({ type: "revertCommit", data: commitHash });
};

  return (
    <Card className="commit-tree-container">
      <Title level={3}>Commit History</Title>
      <Timeline mode="left">
        {commitHistory.map((commit) => (
          <Timeline.Item
            key={commit.hash}
            dot={<ClockCircleOutlined style={{ fontSize: '16px' }} />}
          >
            <Card className="commit-card">
              <Text strong>{commit.message}</Text>
              <br />
              <Text type="secondary">{commit.date}</Text>
              <br />
              <Text code>{commit.hash.substring(0, 7)}</Text>
              <Button
                icon={<RollbackOutlined />}
                onClick={() => handleRevert(commit.hash)}
                size="small"
                style={{ marginLeft: '8px' }}
              >
                Revert
              </Button>
            </Card>
          </Timeline.Item>
        ))}
      </Timeline>
    </Card>
  );
};

export default CommitTree;