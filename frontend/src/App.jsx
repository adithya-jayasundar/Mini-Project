
import Feed from './components/Feed';
import SearchBar from './components/SearchBar';
import ChatWithPaper from './components/ChatWithPaper';
import LoginRegister from './components/LoginRegister';

import { useState } from 'react';
import SettingsModal from './components/SettingsModal';
import './App.css';


function App() {
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [user, setUser] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  if (!user) {
    return <LoginRegister onAuth={setUser} />;
  }

  return (
    <div id="root">
      <div className="app-container">
        <aside className="sidebar">
          <div className="profile">
            <div className="profile-icon">👤</div>
            <div>{user.name ? user.name : user.email ? user.email : user}</div>
          </div>
          <div className="settings" onClick={() => setShowSettings(true)} style={{cursor:'pointer'}}>⚙️ Settings</div>
        </aside>
        <main className="main-content">
          <SearchBar onSearch={() => {}} />
          <Feed onChat={setSelectedPaper} />
        </main>
        {selectedPaper && (
          <ChatWithPaper paperTitle={selectedPaper} onClose={() => setSelectedPaper(null)} />
        )}
        {showSettings && (
          <SettingsModal
            user={typeof user === 'object' ? user : { email: user }}
            onClose={() => setShowSettings(false)}
            onUpdate={(updated) => setUser({ ...user, ...updated })}
            onLogout={() => { setUser(null); setShowSettings(false); }}
          />
        )}
      </div>
    </div>
  );
}

export default App;
