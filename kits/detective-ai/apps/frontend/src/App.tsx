import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { LandingScreen } from './components/LandingScreen';
import { GameDashboard } from './components/GameDashboard';

export const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingScreen />} />
        <Route path="/game/:sessionId" element={<GameDashboard />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
