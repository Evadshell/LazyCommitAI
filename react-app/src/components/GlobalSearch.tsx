import React, { useState } from 'react';
import { Input, Button, List, Typography, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { Search } = Input;
const { Text } = Typography;

interface SearchResult {
  file: string;
  summary: string;
  features: string[];
}

interface GlobalSearchProps {
  onSearch: (query: string) => void;
  searchResults: SearchResult[];
  isLoading: boolean;
  error: string | null;
}

export default function GlobalSearch({ onSearch, searchResults, isLoading, error }: GlobalSearchProps) {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (query.trim()) {
      console.log(`Searching for query: ${query}`);
      onSearch(query);
    } else {
      message.warning('Please enter a search query');
    }
  };
  
  return (
    <div className="global-search">
      <Search
        placeholder="Search codebase..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onSearch={handleSearch}
        enterButton={<Button icon={<SearchOutlined />}>Search</Button>}
        loading={isLoading}
      />
      {error && <Text type="danger">{error}</Text>}
      {searchResults.length > 0 && (
        <List
          className="search-results"
          itemLayout="vertical"
          dataSource={searchResults}
          renderItem={(item) => (
            <List.Item>
              <Text strong>{item.file}</Text>
              <Text>{item.summary}</Text>
              <Text type="secondary">Matching Features: {item.features.join(', ')}</Text>
            </List.Item>
          )}
        />
      )}
      {searchResults.length === 0 && !isLoading && !error && query && (
        <Text>No results found</Text>
      )}
    </div>
  );
}