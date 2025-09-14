import Feed from './components/Feed';
import SearchBar from './components/SearchBar';
import ChatWithPaper from './components/ChatWithPaper';
import { useState } from 'react';
import './App.css';

function App() {
  const [selectedPaper, setSelectedPaper] = useState(null);

  return (
    <div id="root">
      <div className="app-container">
        <aside className="sidebar">
          <div className="profile">
            <div className="profile-icon">👤</div>
            <div>User Name</div>
          </div>
          <div className="settings">⚙️ Settings</div>
        </aside>
        <main className="main-content">
          <SearchBar onSearch={() => {}} />
          <Feed onChat={setSelectedPaper} />
        </main>
        {selectedPaper && <ChatWithPaper paperTitle={selectedPaper} />}
      </div>
    </div>
  );
}

export default App;
