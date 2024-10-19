import React, { useState } from 'react'
import { Input, List, Typography, message } from 'antd'
import { SearchOutlined } from '@ant-design/icons'

const { Search } = Input
const { Text, Title } = Typography

interface SearchResult {
  file: string
  summary: string
  features: string[]
}

interface GlobalSearchProps {
  onSearch: (query: string) => void
  searchResults: SearchResult[]
  isLoading: boolean
  error: string | null
}

export default function GlobalSearch({ onSearch, searchResults, isLoading, error }: GlobalSearchProps) {
  const [query, setQuery] = useState('')

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query)
    } else {
      message.warning('Please enter a search query')
    }
  }

  return (
    <div className="global-search p-4 bg-background">
      <Search
        placeholder="Search codebase..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onSearch={handleSearch}
        enterButton={<SearchOutlined />}
        loading={isLoading}
        className="mb-4"
      />
      {error && <Text type="danger" className="mb-2 block">{error}</Text>}
      {searchResults.length > 0 && (
  <List
    className="search-results"
    itemLayout="vertical"
    dataSource={searchResults}
    renderItem={(item) => (
      <List.Item key={item.file} className="bg-card rounded-md p-4 mb-2">
        <Title level={5} className="text-primary">{item.file}</Title>
        <Text className="block mb-2">{item.summary}</Text>
        <Text type="secondary" className="block">
          Matching Features: {item.features.join(', ')}
        </Text>
      </List.Item>
    )}
  />
)}

      {searchResults.length === 0 && !isLoading && !error && query && (
        <Text className="text-muted-foreground">No results found</Text>
      )}
    </div>
  )
}