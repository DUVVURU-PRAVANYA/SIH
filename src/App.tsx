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
    <div className="min-h-screen flex flex-col bg-[#F6FAFD] text-slate-800 selection:bg-[#12B8A6] selection:text-white relative">
      {/* CareNexus Security Watermark: Clearly visible, cute & elegant centered emblem with soft aura */}
      <div className="fixed inset-0 pointer-events-none select-none z-0 flex items-center justify-center overflow-hidden" aria-hidden="true">
        <div className="absolute w-[640px] h-[640px] rounded-full bg-radial from-teal-400/20 via-sky-400/10 to-transparent blur-3xl"></div>
        <img
          src={`${import.meta.env.BASE_URL}carenexus-emblem.png`}
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            if (!target.src.endsWith('/carenexus-emblem.png')) {
              target.src = '/carenexus-emblem.png';
            }
          }}
          alt=""
          className="w-[540px] max-w-[88vw] object-contain opacity-[0.16] select-none filter contrast-110 drop-shadow-sm"
        />
      </div>

      {/* Universal Institutional Header with Role Identity & Secure Logout */}
      <Header />

      {/* Strict Role Guard: Only the Authenticated Role's Dashboard is Accessible */}
      <main className="flex-1 flex flex-col relative z-10">
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
