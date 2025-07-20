import React, { useState } from 'react';
import VideoChat from './videochat';
import './App.css';

function App() {
  const [role, setRole] = useState(null);

  return (
    <div className="app-container">
      {!role ? (
        <div className="join-box">
          <h1 className="zoom-title">Welcome to LiveStream</h1>
          <button className="join-btn" onClick={() => setRole('host')}>Host a Stream</button>
          <button className="join-btn" onClick={() => setRole('viewer')}>Join a Stream</button>
        </div>
      ) : (
        <VideoChat role={role} />
      )}
    </div>
  );
}

export default App;
