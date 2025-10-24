import React, { useState, useEffect } from 'react';
import { feedAPI, transformPaperData } from '../utils/api';

const Feed = ({ onChat, searchQuery = null }) => {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPapers = async () => {
      try {
        setLoading(true);
        setError("");
        
        let response;
        if (searchQuery && searchQuery.trim()) {
          response = await feedAPI.searchPapers(searchQuery.trim());
        } else {
          response = await feedAPI.getPersonalizedFeed();
        }
        
        const transformedPapers = response.map(transformPaperData);
        setPapers(transformedPapers);
      } catch (err) {
        setError(err.message || "Failed to fetch papers");
        console.error("Feed fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPapers();
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="feed-scrollable">
        <h2 style={{ marginBottom: '2rem', fontSize: '1.8em' }}>
          {searchQuery ? `🔍 Search: "${searchQuery}"` : "📚 Recommended Papers"}
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
          {searchQuery ? `🔍 Search: "${searchQuery}"` : "📚 Recommended Papers"}
        </h2>
        <div className="error-message" style={{ maxWidth: '600px', margin: '0 auto' }}>
          ⚠️ {error}
        </div>
      </div>
    );
  }

  return (
    <div className="feed-scrollable">
      <h2 style={{ marginBottom: '2rem', fontSize: '1.8em' }}>
        {searchQuery ? `🔍 Search: "${searchQuery}"` : "📚 Recommended Papers"}
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
          <div style={{ fontSize: '3em', marginBottom: '1rem' }}>📭</div>
          <p style={{ fontSize: '1.1em' }}>No papers found</p>
        </div>
      ) : (
        <div className="feed">
          {papers.map((paper) => (
            <div className="paper-card" key={paper.id}>
              <div className="paper-title">{paper.title}</div>
              <div className="paper-authors">{paper.authors}</div>
              <div className="paper-abstract">{paper.abstract}</div>
              <div className="paper-actions">
                <button className="chat-icon-btn" onClick={() => onChat(paper)}>
                  💬 Chat
                </button>
                {paper.pdf_url && (
                  <button 
                    className="pdf-btn" 
                    onClick={() => window.open(paper.pdf_url, '_blank')}
                    title="Open PDF in new tab"
                  >
                    📄 PDF
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Feed;
