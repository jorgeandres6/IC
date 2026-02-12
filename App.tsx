
import React, { useState } from 'react';
import AuthScreen from './components/AuthScreen';
import ChatInterface from './components/ChatInterface';
import HomeScreen from './components/HomeScreen';
import ModuleDetail from './components/ModuleDetail';
import { AuthResponse, User, ModuleId } from './types';

type AppView = 'AUTH' | 'HOME' | 'CHAT' | 'MODULE';

const App: React.FC = () => {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<AppView>('AUTH');
  const [activeModule, setActiveModule] = useState<ModuleId | null>(null);

  const handleAuthSuccess = (data: AuthResponse) => {
    setAuthToken(data.token);
    setCurrentUser(data.user);
    setView('HOME');
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setView('AUTH');
    setActiveModule(null);
  };

  const handleEnterChat = () => setView('CHAT');
  const handleBackToHome = () => {
    setView('HOME');
    setActiveModule(null);
  };

  const handleOpenModule = (id: ModuleId) => {
    setActiveModule(id);
    setView('MODULE');
  };

  if (view === 'AUTH') {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  if (view === 'HOME' && currentUser) {
    return (
      <HomeScreen 
        user={currentUser} 
        onEnterChat={handleEnterChat} 
        onLogout={handleLogout} 
        onOpenModule={handleOpenModule}
      />
    );
  }

  if (view === 'MODULE' && currentUser && activeModule) {
    return (
      <ModuleDetail 
        moduleId={activeModule} 
        onBack={handleBackToHome}
        onEnterChat={handleEnterChat}
      />
    );
  }

  if (view === 'CHAT' && currentUser && authToken) {
    return (
      <ChatInterface 
        token={authToken} 
        user={currentUser} 
        onLogout={handleLogout}
        onBackToHome={handleBackToHome}
      />
    );
  }

  return null;
};

export default App;
