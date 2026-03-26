import React from 'react';

const Sidebar = ({ activeTab, onTabChange, onLogout }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'patients', label: 'Patients', icon: 'pets' },
    { id: 'calendar', label: 'Calendar', icon: 'calendar_month' },
    { id: 'sessions', label: 'Sessions', icon: 'rebase_edit' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>Dra. Brenda</h1>
        <p>Veterinary Rehab</p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              onTabChange(item.id);
            }}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </a>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="btn-new-session">
          <span className="material-symbols-outlined">add_circle</span>
          <span>New Session</span>
        </button>

        <div className="sidebar-actions">
          <a href="#settings" className="action-item">
            <span className="material-symbols-outlined">settings</span>
            <span>Settings</span>
          </a>
          <a href="#logout" className="action-item" onClick={(e) => { e.preventDefault(); onLogout && onLogout(); }}>
            <span className="material-symbols-outlined">logout</span>
            <span>Logout</span>
          </a>
        </div>

        <div className="sidebar-profile">
          <img
            src="perfil.jpg"
            alt="Dra. Brenda"
            className="profile-img"
            onError={(e) => { e.target.src = 'https://via.placeholder.com/40'; }}
          />
          <div className="profile-info">
            <p className="profile-name">Dra. Brenda</p>
            <p className="profile-role">Rehab Specialist</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
