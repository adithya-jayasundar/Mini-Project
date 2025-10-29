
import React, { useEffect, useState, useRef } from 'react';
import { chatAPI } from '../utils/api';

const ChatWithPaper = ({ paper, paperTitle, onClose }) => {
  const title = paper?.title || paperTitle || 'Select a paper';
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [indexing, setIndexing] = useState(false);
  const [indexReady, setIndexReady] = useState(false);
  const [statusDetail, setStatusDetail] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let mounted = true;
    if (!paper && !paperTitle) return;
    const url = paper?.pdf_url || paper?.link || paperTitle;

    const startIndexing = async () => {
      setIndexing(true);
      setIndexReady(false);
      setStatusDetail(null);
      
      // Add system message
      setMessages([{
        role: 'system',
        content: 'Preparing paper for chat... This may take a moment.',
        timestamp: new Date().toISOString()
      }]);

      try {
        await chatAPI.buildIndex({ url, chunk_size: 3000, chunk_overlap: 300, rebuild_index: false });

        // poll for status
        const poll = async () => {
          try {
            const res = await chatAPI.getIndexStatus(url);
            if (!mounted) return;
            setStatusDetail(res.detail || null);
            if (res.status === 'ready') {
              setIndexing(false);
              setIndexReady(true);
              setMessages([{
                role: 'system',
                content: 'Paper indexed successfully! Ask me anything about this paper.',
                timestamp: new Date().toISOString()
              }]);
              return;
            }
            if (res.status === 'error') {
              setIndexing(false);
              setIndexReady(false);
              setError(res.detail || 'Index build failed');
              setMessages([{
                role: 'system',
                content: 'Failed to index paper. Please try again.',
                timestamp: new Date().toISOString()
              }]);
              return;
            }
            // still building - poll again
            setTimeout(poll, 2000);
          } catch (err) {
            if (!mounted) return;
            setIndexing(false);
            setError(err.message || String(err));
          }
        };

        poll();
      } catch (err) {
        setIndexing(false);
        setError(err.message || String(err));
        setMessages([{
          role: 'system',
          content: 'Error: ' + (err.message || String(err)),
          timestamp: new Date().toISOString()
        }]);
      }
    };

    startIndexing();
    return () => { mounted = false; };
  }, [paper, paperTitle]);

  const handleAsk = async () => {
    if (!question.trim() || !indexReady || loading) return;

    const userMessage = {
      role: 'user',
      content: question.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);
    setError(null);

    // Add loading message
    const loadingMsg = {
      role: 'assistant',
      content: '',
      loading: true,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, loadingMsg]);

    try {
      const url = paper?.pdf_url || paper?.link || paperTitle;
      const res = await chatAPI.queryIndex({ url, question: userMessage.content, k: 6 });
      
      // Replace loading message with actual response
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: 'assistant',
          content: res.answer,
          timestamp: new Date().toISOString()
        };
        return newMessages;
      });
    } catch (err) {
      // Replace loading message with error
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: 'assistant',
          content: 'Error: ' + (err.message || String(err)),
          error: true,
          timestamp: new Date().toISOString()
        };
        return newMessages;
      });
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="chat-with-paper">
      <div className="chat-header">
        <div>
          <h3>Chat with Paper</h3>
          <div style={{ 
            fontSize: '0.85em', 
            opacity: 0.9, 
            marginTop: '0.3em',
            fontWeight: 400,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {title}
          </div>
        </div>
        <button
          onClick={onClose}
          className="close-btn"
          aria-label="Close chat"
        >
          ×
        </button>
      </div>
      
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'user' ? 'U' : 'A'}
            </div>
            <div className="message-content">
              {msg.loading ? (
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              ) : (
                <div className={msg.error ? 'message-error' : ''}>
                  {msg.content}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        {paper?.pdf_url && (
          <a href={paper.pdf_url} target="_blank" rel="noopener noreferrer" className="pdf-link-inline">
            View PDF
          </a>
        )}
        <div className="chat-input-wrapper">
          <textarea
            ref={textareaRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={indexing ? "Indexing paper..." : indexReady ? "Ask a question... (Enter to send, Shift+Enter for new line)" : "Preparing..."}
            disabled={!indexReady || loading || indexing}
            rows={1}
          />
          <button 
            onClick={handleAsk} 
            disabled={!question.trim() || loading || indexing || !indexReady} 
            className="send-btn"
            title="Send message"
          >
            {loading ? '...' : '→'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWithPaper;
