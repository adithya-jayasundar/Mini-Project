
import React from 'react';

const ChatWithPaper = ({ paperTitle, onClose }) => {
  // Placeholder: Replace with LLM chat integration
  return (
    <div className="chat-with-paper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Chat about: {paperTitle || 'Select a paper'}</h3>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', fontSize: '1.5em', cursor: 'pointer', color: '#888', marginLeft: '1em' }}
          aria-label="Close chat"
        >
          ×
        </button>
      </div>
      <div className="chat-window">
        <p>LLM: Ask me anything about this paper!</p>
      </div>
      <input type="text" placeholder="Type your question..." />
      <button>Send</button>
    </div>
  );
};

export default ChatWithPaper;
