import React from 'react';

const TopBar = () => {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="topbar-title">The Radiant Clinician</span>
        <nav className="topbar-nav">
          <a href="#" className="topbar-link active">Overview</a>
          <a href="#" className="topbar-link">Today</a>
          <a href="#" className="topbar-link">Analytics</a>
        </nav>
      </div>

      <div className="topbar-right">
        <div className="search-container">
          <span className="material-symbols-outlined search-icon">search</span>
          <input type="text" placeholder="Search patients..." className="search-input" />
        </div>
        
        <button className="icon-btn">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="icon-btn">
          <span className="material-symbols-outlined">help_outline</span>
        </button>
      </div>
    </header>
  );
};

export default TopBar;
