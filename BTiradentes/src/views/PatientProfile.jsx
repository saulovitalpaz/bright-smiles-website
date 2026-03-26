import React from 'react';

const PatientProfile = ({ onBack }) => {
  const patient = {
    id: '#PR-2024-089',
    name: 'Maximus Aurelius',
    breed: 'Golden Retriever',
    age: '7 Years, 2 Months',
    weight: '32.4 kg',
    status: 'In Rehabilitation',
    description: 'Ongoing treatment for Hip Dysplasia and post-surgical recovery.',
    img: 'https://via.placeholder.com/200x260'
  };

  const history = [
    { date: '24 May 2024', type: 'Physiotherapy', title: 'Post-Op Hydrotherapy Session 04', notes: 'Significant improvement in right hind limb flexion. Patient showed less resistance during aquatic treadmill exercise.', tags: ['Hydrotherapy', 'ROM Exercises'] },
    { date: '17 May 2024', type: 'Acupuncture', title: 'Pain Management Focus', notes: 'Laser therapy applied to L7-S1 segment. Acupuncture points BL23, BL25, and BL40 stimulated.', tags: ['Laser Therapy', 'Dry Needling'] },
  ];

  return (
    <div className="patient-profile">
      <header className="profile-header">
        <img src={patient.img} alt={patient.name} className="patient-photo" />
        <div className="patient-basic-info">
          <span className="patient-id">Patient ID: {patient.id}</span>
          <h2>{patient.name}</h2>
          <div className="info-cards">
            <div className="info-card">
              <span className="material-symbols-outlined">category</span>
              <div>
                <p className="meta-label">Breed</p>
                <p className="meta-value">{patient.breed}</p>
              </div>
            </div>
            <div className="info-card">
              <span className="material-symbols-outlined">cake</span>
              <div>
                <p className="meta-label">Age</p>
                <p className="meta-value">{patient.age}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="profile-status-card">
           <div className="status-top">
             <h3 className="meta-value">Status: {patient.status}</h3>
             <p className="meta-label" style={{textTransform: 'none', marginTop: '4px'}}>{patient.description}</p>
           </div>
           <button className="link-btn" onClick={onBack}>
             <span className="material-symbols-outlined">arrow_back</span>
             Back to Directory
           </button>
        </div>
      </header>

      <section className="profile-content">
        <div className="history-section">
          <div className="chart-card">
            <div className="section-header">
              <h3>Evolution Chart</h3>
              <p className="subtitle">Pain level tracking over time</p>
            </div>
            <div className="chart-placeholder" style={{height: '150px', background: 'var(--surface-container)', borderRadius: 'var(--radius-default)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
               <svg width="100%" height="100%" viewBox="0 0 400 100">
                 <path d="M0,80 Q50,70 100,50 T200,30 T300,60 T400,20" fill="none" stroke="var(--primary)" strokeWidth="3" />
               </svg>
            </div>
          </div>

          <div className="history-list">
             <h3>History</h3>
             {history.map((item, i) => (
               <div key={i} className="patient-row" style={{flexDirection: 'column', alignItems: 'flex-start', marginTop: '16px'}}>
                 <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
                   <span className="status-tag status-active">{item.type} - {item.date}</span>
                 </div>
                 <h4 style={{marginTop: '8px'}}>{item.title}</h4>
                 <p style={{fontSize: '0.875rem', color: 'var(--on-surface-variant)', marginTop: '4px'}}>{item.notes}</p>
                 <div style={{display: 'flex', gap: '8px', marginTop: '12px'}}>
                   {item.tags.map(tag => <span key={tag} className="status-tag" style={{background: 'var(--surface-container-high)'}}>{tag}</span>)}
                 </div>
               </div>
             ))}
          </div>
        </div>

        <aside className="new-session-form">
          <div className="form-header">
            <h3>New Session</h3>
            <p style={{fontSize: '0.75rem', opacity: 0.8}}>Recording details for today</p>
          </div>
          <form className="form-body">
            <div className="form-group">
              <label>Pain Scale (0-10)</label>
              <input type="range" min="0" max="10" className="form-range" />
            </div>
            <div className="form-group">
              <label>Observation & Progress Notes</label>
              <textarea className="form-textarea" placeholder="Describe the response..." rows="4"></textarea>
            </div>
            <button type="submit" className="btn-submit">Complete Session</button>
          </form>
        </aside>
      </section>
    </div>
  );
};

export default PatientProfile;
