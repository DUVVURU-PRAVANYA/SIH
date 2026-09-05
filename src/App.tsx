import React from 'react';
import { QueueFlowProvider, useQueueFlow } from './context/QueueFlowContext';
import { Header } from './components/common/Header';
import { RoleAuthScreen } from './components/auth/RoleAuthScreen';
import { PatientHome } from './components/patient/PatientHome';
import { DoctorPortal } from './components/doctor/DoctorPortal';
import { ScanLabPortal } from './components/scan_lab/ScanLabPortal';
import { PharmacyPortal } from './components/pharmacy/PharmacyPortal';

const MainAppContent: React.FC = () => {
  const { role } = useQueueFlow();

  // If on Auth Portal, render full-screen Role Authentication
  if (role === 'auth') {
    return <RoleAuthScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 selection:bg-teal-500 selection:text-white">
      {/* Universal Institutional Header with Role Identity & Secure Logout */}
      <Header />

      {/* Strict Role Guard: Only the Authenticated Role's Dashboard is Accessible */}
      <main className="flex-1 flex flex-col">
        {role === 'patient' && <PatientHome />}
        {role === 'doctor' && <DoctorPortal />}
        {role === 'scan_lab' && <ScanLabPortal />}
        {role === 'pharmacy' && <PharmacyPortal />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <QueueFlowProvider>
      <MainAppContent />
    </QueueFlowProvider>
  );
}
