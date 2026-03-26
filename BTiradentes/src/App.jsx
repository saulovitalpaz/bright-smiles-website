import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import PatientList from './views/PatientList';
import PatientProfile from './views/PatientProfile';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  const { logout } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState(null);


  const handlePatientSelect = (id) => {
    setSelectedPatientId(id);
    setCurrentView('patient-profile');
  };

  const handleLogout = () => {
    logout();
    setCurrentView('dashboard');
  };

  const renderContent = () => {
    if (currentView === 'patient-profile') {
      return <PatientProfile onBack={() => setCurrentView('patients')} />;
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard onSelectPatient={handlePatientSelect} />;
      case 'patients':
        return <PatientList onSelectPatient={handlePatientSelect} />;
      case 'calendar':
        return <div className="placeholder-view"><h2>Calendar</h2><p>Coming soon...</p></div>;
      case 'sessions':
        return <div className="placeholder-view"><h2>Sessions Management</h2><p>Coming soon...</p></div>;
      default:
        return <Dashboard onSelectPatient={handlePatientSelect} />;
    }
  };

  return (
    <ProtectedRoute>
      <Layout
        activeTab={currentView.startsWith('patient') ? 'patients' : currentView}
        onTabChange={setCurrentView}
        onLogout={handleLogout}
      >
        {renderContent()}
      </Layout>
    </ProtectedRoute>
  );
}

export default App;
