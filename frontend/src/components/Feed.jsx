import React, { useState, useEffect } from 'react';
import { feedAPI, transformPaperData } from '../utils/api';

const Feed = ({ onChat, searchQuery = null }) => {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  const papersPerPage = 12;
  const maxPages = 10;

  useEffect(() => {
    const fetchPapers = async () => {
      try {
        setLoading(true);
        setError("");
        
        let response;
        // Fetch 120 papers (10 pages × 12 papers/page)
        if (searchQuery && searchQuery.trim()) {
          response = await feedAPI.searchPapers(searchQuery.trim(), 120);
        } else {
          response = await feedAPI.getPersonalizedFeed(120);
        }
        
        const transformedPapers = response.map(transformPaperData);
        setPapers(transformedPapers);
        setCurrentPage(1); // reset to page 1 on new search/fetch
      } catch (err) {
        setError(err.message || "Failed to fetch papers");
        console.error("Feed fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPapers();
  }, [searchQuery]);

  // Pagination logic
  const totalPages = Math.min(Math.ceil(papers.length / papersPerPage), maxPages);
  const startIdx = (currentPage - 1) * papersPerPage;
  const endIdx = startIdx + papersPerPage;
  const currentPapers = papers.slice(startIdx, endIdx);

  const getPageButtons = () => {
    const buttons = [];
    const maxVisible = 4;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(i);
    }
    return buttons;
  };

  if (loading) {
    return (
      <div className="feed-scrollable">
        <h2 style={{ marginBottom: '2rem', fontSize: '1.8em' }}>
          {searchQuery ? `Search: "${searchQuery}"` : "Recommended Papers"}
        </h2>
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem',
          background: 'var(--white)',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div className="spinner" style={{ 
            width: '48px', 
            height: '48px', 
            borderWidth: '4px',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1em' }}>Loading papers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="feed-scrollable">
        <h2 style={{ marginBottom: '2rem', fontSize: '1.8em' }}>
          {searchQuery ? `Search: "${searchQuery}"` : "Recommended Papers"}
        </h2>
        <div className="error-message" style={{ maxWidth: '600px', margin: '0 auto' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="feed-scrollable">
      <h2 style={{ marginBottom: '2rem', fontSize: '1.8em' }}>
        {searchQuery ? `Search: "${searchQuery}"` : "Recommended Papers"}
      </h2>
      {papers.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem',
          background: 'var(--white)',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-md)',
          color: 'var(--text-secondary)'
        }}>
          <p style={{ fontSize: '1.1em' }}>No papers found</p>
        </div>
      ) : (
        <>
          <div className="feed">
            {currentPapers.map((paper) => (
              <div className="paper-card" key={paper.id}>
                <div className="paper-title">{paper.title}</div>
                <div className="paper-authors">{paper.authors}</div>
                <div className="paper-abstract">{paper.abstract}</div>
                <div className="paper-actions">
                  <button className="chat-icon-btn" onClick={() => onChat(paper)}>
                    Chat
                  </button>
                  {paper.pdf_url && (
                    <button 
                      className="pdf-btn" 
                      onClick={() => window.open(paper.pdf_url, '_blank')}
                      title="Open PDF in new tab"
                    >
                      PDF
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                Previous
              </button>
              
              {getPageButtons().map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                >
                  {page}
                </button>
              ))}
              
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Feed;
