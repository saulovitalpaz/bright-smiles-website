import React from 'react';

const Dashboard = ({ onSelectPatient }) => {
  const stats = [
    { label: 'Active Patients', value: '42', trend: '+12% from last month', icon: 'pets', type: 'primary' },
    { label: 'Sessions Today', value: '08', progress: 37.5, info: '3 completed / 5 remaining', type: 'secondary' },
    { label: 'Recovery Rate', value: '94%', info: '+5 fully recovered this week', icon: 'trending_up', type: 'tertiary' },
  ];

  const appointments = [
    { name: 'Luna', breed: 'French Bulldog', session: 'Hydrotherapy Session #4', time: '15m', status: 'Start Session', img: 'https://via.placeholder.com/56' },
    { name: 'Milo', breed: 'Siamese Cat', session: 'Laser Therapy · Post-Op Check', time: '55m', status: 'Checking In', img: 'https://via.placeholder.com/56' },
  ];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h2>Good morning, Dra. Brenda</h2>
        <p>You have 8 rehabilitation sessions scheduled for today.</p>
      </header>

      <section className="stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className={`stat-card ${stat.type}`}>
            <div className="stat-info">
              <span className="stat-label">{stat.label}</span>
              <h3 className="stat-value">{stat.value}</h3>
            </div>
            {stat.progress !== undefined ? (
              <div className="progress-container">
                <div className="progress-bar" style={{ width: `${stat.progress}%` }}></div>
                <p className="stat-subtext">{stat.info}</p>
              </div>
            ) : (
              <p className="stat-subtext">{stat.trend || stat.info}</p>
            )}
            {stat.icon && <span className="material-symbols-outlined stat-icon">{stat.icon}</span>}
          </div>
        ))}
      </section>

      <section className="main-grid">
        <div className="appointments-card">
          <div className="section-header">
            <h3>Upcoming Appointments <span className="subtitle">(Next 2 Hours)</span></h3>
            <button className="link-btn">View Schedule</button>
          </div>
          <div className="appointments-list">
            {appointments.map((apt, i) => (
                <div className="appointment-item" onClick={() => onSelectPatient(apt.name)} style={{cursor: 'pointer'}}>
                  <div className="apt-time">
                    <span className="apt-label">Starts in</span>
                    <span className="apt-value">{apt.time}</span>
                  </div>
                  <div className="divider"></div>
                  <div className="apt-patient">
                    <img src={apt.img} alt={apt.name} className="apt-img" />
                    <div className="apt-details">
                      <p className="apt-name">{apt.name} <span className="apt-breed">· {apt.breed}</span></p>
                      <p className="apt-session">{apt.session}</p>
                    </div>
                  </div>
                  <button className={`btn-status ${apt.status === 'Start Session' ? 'primary' : 'secondary'}`}>
                    {apt.status}
                  </button>
                </div>
            ))}
          </div>
        </div>

        <div className="quick-actions">
          <div className="quick-start-card">
            <h4>New Session</h4>
            <p>Instantly start a new rehabilitation record for a walk-in or unscheduled session.</p>
            <button className="btn-quick-start">
              <span className="material-symbols-outlined">bolt</span>
              Quick Start
            </button>
          </div>
          
          <div className="insight-card">
             <div className="insight-header">
               <span className="material-symbols-outlined insight-icon">lightbulb</span>
               <span>Clinical Insight</span>
             </div>
             <p className="insight-text">
               "Patients receiving low-level laser therapy within 48h of surgery show a 30% faster initial recovery in joint mobility."
             </p>
             <div className="insight-footer">
               <span className="source">SOURCE: VETMED JOURNALS</span>
               <button className="read-more">Read more <span className="material-symbols-outlined">arrow_forward</span></button>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
