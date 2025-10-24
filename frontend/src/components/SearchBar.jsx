import React, { useState } from 'react';

const SearchBar = ({ onSearch, currentSearchQuery }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const handleHome = () => {
    setSearchQuery('');
    onSearch(null); // Clear search to return to personalized feed
  };

  return (
    <div className="search-bar">
      {currentSearchQuery && (
        <button 
          className="home-btn" 
          onClick={handleHome}
          title="Back to personalized feed"
        >
          <span role="img" aria-label="home">🏠</span> Home
        </button>
      )}
      <input 
        type="text" 
        placeholder="Search for research papers..." 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyPress={handleKeyPress}
      />
      <button onClick={handleSubmit}>Search</button>
    </div>
  );
};

export default SearchBar;
