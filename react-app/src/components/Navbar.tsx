import React from "react";
import { Menu } from "antd";
import {
  FileTextOutlined,
  CodeOutlined,
  RobotOutlined,
  BranchesOutlined,
  HistoryOutlined,
} from "@ant-design/icons";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { key: "fileSummary", icon: <FileTextOutlined />, label: "File Summary" },
    { key: "codeImprovement", icon: <CodeOutlined />, label: "Code Improvement" },
    { key: "copilotPrompt", icon: <RobotOutlined />, label: "Copilot Prompt" },
    { key: "fileBreaker", icon: <BranchesOutlined />, label: "File Breaker" },
    { key: "commitHistory", icon: <HistoryOutlined />, label: "Commit History" },
  ];

  return (
    <Menu
      mode="horizontal"
      selectedKeys={[activeTab]}
      onClick={({ key }) => setActiveTab(key)}
      className="navbar"
    >
      {menuItems.map((item) => (
        <Menu.Item key={item.key} icon={item.icon}>
          {item.label}
        </Menu.Item>
      ))}
    </Menu>
  );
};

export default Navbar;