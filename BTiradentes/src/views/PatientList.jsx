import React from 'react';

const PatientList = ({ onSelectPatient }) => {
  const patients = [
    { name: 'Luna', species: 'Canine', breed: 'Golden Retriever', age: '5yo', tutor: 'Beatriz Amaral', lastSession: 'Oct 24, 2023', status: 'Active Rehab' },
    { name: 'Oliver', species: 'Feline', breed: 'Domestic Shorthair', age: '2yo', tutor: 'Ricardo Gomes', lastSession: 'Oct 20, 2023', status: 'Post-Op Recovery' },
    { name: 'Bento', species: 'Canine', breed: 'Corgi', age: '4yo', tutor: 'Juliana Paes', lastSession: 'Oct 15, 2023', status: 'Maintenance' },
    { name: 'Max', species: 'Canine', breed: 'Beagle', age: '7yo', tutor: 'Claudio Mattos', lastSession: 'Sept 28, 2023', status: 'Discharged' },
  ];

  const getStatusClass = (status) => {
    switch (status) {
      case 'Active Rehab': return 'status-active';
      case 'Post-Op Recovery': return 'status-recovery';
      case 'Maintenance': return 'status-maintenance';
      default: return 'status-discharged';
    }
  };

  return (
    <div className="patient-list-view">
      <header className="view-header">
        <div className="header-info">
          <h2>Patient Directory</h2>
          <p>Manage and monitor the recovery of your furry patients.</p>
        </div>
        <button className="btn-primary">
          <span className="material-symbols-outlined">add_circle</span>
          Register Patient
        </button>
      </header>

      <section className="filters-section">
        <div className="filter-card search">
           <span className="material-symbols-outlined search-icon">search</span>
           <div className="filter-inputs">
             <label>Search Patient</label>
             <input type="text" placeholder="Type name or tutor..." />
           </div>
        </div>
        <div className="filter-card species">
           <label>Species</label>
           <div className="toggle-group">
             <button className="toggle-btn active">Canine</button>
             <button className="toggle-btn">Feline</button>
           </div>
        </div>
        <div className="filter-card status">
           <label>Status</label>
           <select className="status-select">
             <option>Active Treatment</option>
             <option>Maintenance</option>
             <option>Discharged</option>
           </select>
        </div>
      </section>

      <section className="patients-grid">
         {patients.map((patient, i) => (
           <div key={i} className="patient-row">
             <div className="patient-avatar">
               <span className="material-symbols-outlined pet-icon">pets</span>
             </div>
             <div className="patient-info">
                <h3>{patient.name}</h3>
                <p>{patient.breed} • {patient.age}</p>
             </div>
             <div className="patient-meta">
                <span className="meta-label">Tutor</span>
                <span className="meta-value">{patient.tutor}</span>
             </div>
             <div className="patient-meta">
                <span className="meta-label">Last Session</span>
                <span className="meta-value">{patient.lastSession}</span>
             </div>
             <div className="patient-status">
                <span className={`status-tag ${getStatusClass(patient.status)}`}>{patient.status}</span>
             </div>
                  <button className="btn-view-record" onClick={() => onSelectPatient(patient.name)}>
                    View Record
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
           </div>
         ))}
      </section>

      <style jsx>{`
        /* I will move these to App.css if build fails again, but I'll try to keep views clean */
      `}</style>
    </div>
  );
};

export default PatientList;
