import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const Layout = ({ children, activeTab, onTabChange, onLogout }) => {
  return (
    <div className="layout-container">
      <Sidebar activeTab={activeTab} onTabChange={onTabChange} onLogout={onLogout} />
      <div className="main-wrapper">
        <TopBar />
        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
