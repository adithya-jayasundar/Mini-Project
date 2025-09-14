import React from 'react';

const papers = [
  {
    id: 1,
    title: 'Deep Learning for Natural Language Processing',
    authors: 'Jane Doe, John Smith',
    abstract: 'A comprehensive overview of deep learning methods for NLP tasks.'
  },
  {
    id: 2,
    title: 'Graph Neural Networks: A Review',
    authors: 'Alice Lee, Bob Brown',
    abstract: 'Survey of graph neural network architectures and applications.'
  },
  {
    id: 3,
    title: 'Efficient Transformers for Large-Scale Language Models',
    authors: 'Carol White, David Black',
    abstract: 'Techniques for scaling transformers efficiently.'
  },
  {
    id: 4,
    title: 'Contrastive Learning in Computer Vision',
    authors: 'Eve Green, Frank Blue',
    abstract: 'Contrastive learning approaches for visual representation.'
  },
  {
    id: 5,
    title: 'Reinforcement Learning: State of the Art',
    authors: 'Grace Red, Henry Yellow',
    abstract: 'Recent advances in reinforcement learning.'
  },
  {
    id: 6,
    title: 'Self-Supervised Learning in AI',
    authors: 'Ivy Orange, Jack Purple',
    abstract: 'Self-supervised learning methods and applications.'
  },
  {
    id: 7,
    title: 'Federated Learning for Privacy',
    authors: 'Karen Pink, Leo Cyan',
    abstract: 'Federated learning and privacy-preserving AI.'
  },
  {
    id: 8,
    title: 'Explainable AI: Methods and Trends',
    authors: 'Mona Lime, Nick Navy',
    abstract: 'Overview of explainable AI techniques.'
  }
];

const Feed = ({ onChat }) => {
  return (
    <div className="feed-scrollable">
      <h2>Recommended Papers</h2>
      <div className="feed">
        {papers.map((paper) => (
          <div className="paper-card small" key={paper.id}>
            <div className="paper-title">{paper.title}</div>
            <div className="paper-authors">{paper.authors}</div>
            <div style={{ fontSize: '0.92em', color: '#2563eb', marginBottom: '0.7em' }}>{paper.abstract}</div>
            <button className="chat-icon-btn" onClick={() => onChat(paper.title)}>
              <span role="img" aria-label="chat">💬</span> Chat with the paper
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Feed;
