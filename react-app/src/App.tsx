import React, { useEffect, useState } from "react";
import FileTree from "./components/FileTree";
import CodeImprovement from "./components/CodeImprovement";
import Navbar from "./components/Navbar";
import FileBreaker from "./components/FileBreaker";
import {    Menu, Input,    Button } from 'antd';
import {
  FileTextOutlined,
  CodeOutlined,
  RobotOutlined,
  BranchesOutlined,
  HistoryOutlined,
  SearchOutlined
} from '@ant-design/icons';
import CopilotPromptGenerator from "./components/CopilotPromptGenerator";
import CommitTree from "./components/CommitTree";
import GlobalSearch from "./components/GlobalSearch";
import { Spin, message, Layout, Typography, Switch } from 'antd';
import { motion } from "framer-motion";
import "./App.css";

const { Content, Sider } = Layout;
const { Title } = Typography;
const { Search } = Input;

 
interface SearchResult {
  file: string;
  summary: string;
  features: string[];
}

declare global {
  interface Window {
    fileTree: any;
    vscode: any;
  }
}

function App() {
  const [fileTree, setFileTree] = useState (null);
  const [fileSummary, setFileSummary] = useState("");
  const [selectedFile, setSelectedFile] = useState("");
  const [improvedCode, setImprovedCode] = useState("");
  const [breakSuggestion, setBreakSuggestion] = useState("");
  const [activeTab, setActiveTab] = useState("fileSummary");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [siderCollapsed, setSiderCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);
  useEffect(() => {
    if (window.fileTree) {
      setFileTree(window.fileTree);
    }

    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      setIsLoading(false);
      console.log("Received message:", message); // Log to check incoming message
      switch (message.command) {
        case "displayFileSummary":
          setFileSummary(message.content);
          break;
        case "fileTree":
          setFileTree(message.content);
          break;
        case "displayImprovedCode":
          setImprovedCode(message.content);
          break;
        case "displayBreakSuggestion":
          setBreakSuggestion(message.content);
          break;
        case "searchResults":
          if (message.results) {
            setSearchResults(message.results);
          } else {
            console.error("No results in search message:", message);
          }
          break;
        default:
          console.warn("Unhandled message:", message);
      }
    };
    

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const handleFileClick = (filePath: string) => {
    setSelectedFile(filePath);
    setIsLoading(true);
    window.vscode?.postMessage({ type: "getFileSummary", data: filePath });
  };

  const handleBreakFile = () => {
    setIsLoading(true);
    window.vscode?.postMessage({ type: "breakFile", data: selectedFile });
  };

  const handleSearch = (query: string) => {
    if (window.vscode) {
      try {
        console.log("Sending global search query:", query);
        window.vscode.postMessage({ type: 'globalSearch', data: query });
        setSearchError(null);
      } catch (error) {
        setSearchError("An error occurred while searching.");
      }
    } else {
      console.error("VSCode API not available");
      setSearchError("VSCode messaging is not available.");
    }
  };
  
  
  const handleFileSelect = (filePath: string) => {
    setSelectedFile(filePath);
    setIsLoading(true);
    window.vscode.postMessage({ type: 'getFileSummary', data: filePath });
  };
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };
  const renderContent = () => {
    if (isLoading) {
      return <Spin size="large" />;
    }

    switch (activeTab) {
      case "fileSummary":
        return (
          <div className="content-card">
            <Title level={4}>File Summary: {selectedFile}</Title>
            <pre>{fileSummary || "Select a file to view its summary."}</pre>
            <Button onClick={handleBreakFile} type="primary">Suggest File Break</Button>
          </div>
        );
      case "codeImprovement":
        return <CodeImprovement setImprovedCode={setImprovedCode} />;
      case "copilotPrompt":
        return <CopilotPromptGenerator />;
      case "improvedCode":
        return (
          <div className="content-card">
            <Title level={4}>Improved Code</Title>
            <pre>{improvedCode || "Improved code will appear here."}</pre>
          </div>
        );
      case "fileBreaker":
        return <FileBreaker filePath={selectedFile} />;
      case "commitHistory":
        return <CommitTree />;
      default:
        return null;
    }
  };

  return (
    <Layout className="app-container">
    <Sider
      width={250}
      collapsible
      collapsed={siderCollapsed}
      onCollapse={setSiderCollapsed}
      theme="light"
    >
      <div className="logo">CodeSnip</div>
      {/* <GlobalSearch 
          onSearch={handleSearch} 
          searchResults={searchResults} 
          isLoading={isLoading}
          error={searchError}
        /> */}
      <Menu mode="inline" selectedKeys={[activeTab]} onClick={({ key }) => setActiveTab(key as string)}>
        <Menu.Item key="fileSummary" icon={<FileTextOutlined />}>File Summary</Menu.Item>
        <Menu.Item key="codeImprovement" icon={<CodeOutlined />}>Code Improvement</Menu.Item>
        <Menu.Item key="copilotPrompt" icon={<RobotOutlined />}>Copilot Prompt</Menu.Item>
        <Menu.Item key="fileBreaker" icon={<BranchesOutlined />}>File Breaker</Menu.Item>
        <Menu.Item key="commitHistory" icon={<HistoryOutlined />}>Commit History</Menu.Item>
      </Menu>
      <div className="file-tree-container">
        <Title level={5}>Project Structure</Title>
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
    </Sider>
    <Layout>
      <Content className="main-content">
        <div className="content-header">
          <Title level={3}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace(/([A-Z])/g, ' $1').trim()}</Title>
          <Search
            placeholder="Global search..."
            onSearch={handleSearch}
            style={{ width: 250 }}
          />
        </div>
        <div className="content-container">{renderContent()}</div>
        {searchResults.length > 0 && (
          <div className="search-results content-card">
            <Title level={4}>Search Results</Title>
            <ul>
            {searchResults.map((result, index) => (
  <li key={index} onClick={() => handleFileClick(result.file)}>
    <strong>{result.file}</strong>
    <p>Summary: {result.summary}</p>
    <p>Matching Features: {Array.isArray(result.features) ? result.features.join(", ") : result.features}</p>
  </li>
))}

            </ul>
          </div>
        )}
      </Content>
    </Layout>
  </Layout>
  );
}

export default App;