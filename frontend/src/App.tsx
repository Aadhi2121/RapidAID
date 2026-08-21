import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, NavItem } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { NotificationDrawer } from './components/NotificationDrawer';

// Pages
import { Dashboard } from './pages/Dashboard';
import { LiveCalls } from './pages/LiveCalls';
import { Complaints } from './pages/Complaints';
import { ComplaintDetail } from './pages/ComplaintDetail';
import { OfficerDashboard } from './pages/OfficerDashboard';
import { CitizenPortal } from './pages/CitizenPortal';
import { Hotspots } from './pages/Hotspots';
import { Analytics } from './pages/Analytics';
import { EmergencyCommand } from './pages/EmergencyCommand';
import { Login } from './pages/Login';

const MainApp: React.FC = () => {
  const { isAuthenticated, role } = useAuth();
  const [currentView, setCurrentView] = useState<NavItem>('dashboard');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  const handleSelectComplaint = (id: string) => {
    setSelectedComplaintId(id);
  };

  const handleBackFromDetail = () => {
    setSelectedComplaintId(null);
  };

  const handleComplaintCreated = (id: string) => {
    setSelectedComplaintId(id);
  };

  const handleNavigate = (view: NavItem) => {
    setSelectedComplaintId(null);
    setCurrentView(view);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Persistent Navigation Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onOpenNotifications={() => setIsNotificationsOpen(true)} />

        <main className="flex-1 overflow-y-auto bg-slate-950">
          {selectedComplaintId ? (
            <ComplaintDetail
              complaintId={selectedComplaintId}
              onBack={handleBackFromDetail}
            />
          ) : currentView === 'dashboard' ? (
            <Dashboard
              onNavigateToCalls={() => handleNavigate('live-calls')}
              onNavigateToComplaints={() => handleNavigate('complaints')}
              onSelectComplaint={handleSelectComplaint}
            />
          ) : currentView === 'live-calls' ? (
            <LiveCalls onComplaintCreated={handleComplaintCreated} />
          ) : currentView === 'complaints' ? (
            <Complaints
              onSelectComplaint={handleSelectComplaint}
              onNavigateToCalls={() => handleNavigate('live-calls')}
            />
          ) : currentView === 'officer-dashboard' ? (
            <OfficerDashboard onSelectComplaint={handleSelectComplaint} />
          ) : currentView === 'citizen-portal' ? (
            <CitizenPortal onSelectComplaint={handleSelectComplaint} />
          ) : currentView === 'hotspots' ? (
            <Hotspots onSelectComplaint={handleSelectComplaint} />
          ) : currentView === 'analytics' ? (
            <Analytics />
          ) : currentView === 'emergency-command' ? (
            <EmergencyCommand />
          ) : (
            <Dashboard
              onNavigateToCalls={() => handleNavigate('live-calls')}
              onNavigateToComplaints={() => handleNavigate('complaints')}
              onSelectComplaint={handleSelectComplaint}
            />
          )}
        </main>
      </div>

      {/* Live Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onSelectComplaint={handleSelectComplaint}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
