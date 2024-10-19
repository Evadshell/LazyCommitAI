import React from 'react';
// import './Navbar.css';

interface NavbarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
    return (
        <nav className="navbar">
            <button
                className={`nav-item ${activeTab === 'fileSummary' ? 'active' : ''}`}
                onClick={() => setActiveTab('fileSummary')}
            >
                File Summary
            </button>
            <button
                className={`nav-item ${activeTab === 'codeImprovement' ? 'active' : ''}`}
                onClick={() => setActiveTab('codeImprovement')}
            >
                Code Improvement
            </button>
            <button
                className={`nav-item ${activeTab === 'copilotPrompt' ? 'active' : ''}`}
                onClick={() => setActiveTab('copilotPrompt')}
            >
                Copilot Prompt
            </button>
            <button
                className={`nav-item ${activeTab === 'improvedCode' ? 'active' : ''}`}
                onClick={() => setActiveTab('improvedCode')}
            >
                Improved Code
            </button>
            <button
                className={`nav-item ${activeTab === 'fileBreaker' ? 'active' : ''}`}
                onClick={() => setActiveTab('fileBreaker')}
            >
                File Breaker
            </button>
        </nav>
    );
};

export default Navbar;