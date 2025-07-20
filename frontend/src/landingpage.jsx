// src/components/LandingPage.jsx
import React, { useState } from 'react';
import './LandingPage.css';
import VideoChat from './videochat';

const LandingPage = () => {
  const [role, setRole] = useState(null);

  const handleSelect = (selectedRole) => {
    setRole(selectedRole);
  };

  return role ? (
    <VideoChat role={role} />
  ) : (
    <div className="landing-container">
      <h1 className="zoom-title">Welcome to StreamZone</h1>
      <p className="zoom-subtitle">Choose your role to start</p>
      <div className="btn-group">
        <button className="btn host" onClick={() => handleSelect('host')}>
          Host a Stream
        </button>
        <button className="btn viewer" onClick={() => handleSelect('viewer')}>
          Join a Stream
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
