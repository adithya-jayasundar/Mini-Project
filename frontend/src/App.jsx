
import Feed from './components/Feed';
import SearchBar from './components/SearchBar';
import ChatWithPaper from './components/ChatWithPaper';
import LoginRegister from './components/LoginRegister';

import { useState, useEffect } from 'react';
import SettingsModal from './components/SettingsModal';
import { authAPI } from './utils/api';
import './App.css';


function App() {
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [user, setUser] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState(null);

  // Try to get user profile on app load (in case they're already logged in)
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const profile = await authAPI.getProfile();
        setUser(profile);
      } catch (err) {
        // User not logged in, that's fine
        console.log("User not authenticated");
      }
    };
    checkAuthStatus();
  }, []);

  if (!user) {
    return <LoginRegister onAuth={setUser} />;
  }

  return (
    <div id="root">
      <div className="app-container">
        <aside className="sidebar">
          <div className="profile">
            <div className="profile-icon">
              {user.name ? user.name.charAt(0).toUpperCase() : user.email ? user.email.charAt(0).toUpperCase() : ''}
            </div>
            <div>{user.name ? user.name : user.email ? user.email : user}</div>
          </div>
          <div className="settings" onClick={() => setShowSettings(true)} style={{cursor:'pointer'}}>Settings</div>
        </aside>
        <main className="main-content">
          <SearchBar onSearch={setSearchQuery} currentSearchQuery={searchQuery} />
          <Feed onChat={setSelectedPaper} searchQuery={searchQuery} />
        </main>
        {selectedPaper && (
          <ChatWithPaper 
            paper={selectedPaper} 
            paperTitle={selectedPaper.title || selectedPaper} 
            onClose={() => setSelectedPaper(null)} 
          />
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
