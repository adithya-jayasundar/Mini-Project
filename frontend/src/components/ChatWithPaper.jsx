import React from 'react';

const ChatWithPaper = ({ paperTitle }) => {
  // Placeholder: Replace with LLM chat integration
  return (
    <div className="chat-with-paper">
      <h3>Chat about: {paperTitle || 'Select a paper'}</h3>
      <div className="chat-window">
        <p>LLM: Ask me anything about this paper!</p>
      </div>
      <input type="text" placeholder="Type your question..." />
      <button>Send</button>
    </div>
  );
};

export default ChatWithPaper;
