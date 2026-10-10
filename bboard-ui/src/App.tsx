import './App.css';
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { LandingPage, ResearchLabPage, HospitalPage, EhrVaultPage, NetworkAuditorPage } from './pages';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<Navigate to="/" replace />} />
          <Route path="/lab" element={<ResearchLabPage />} />
          <Route path="/research-lab" element={<Navigate to="/lab" replace />} />
          <Route path="/hospital" element={<HospitalPage />} />
          <Route path="/vault" element={<EhrVaultPage />} />
          <Route path="/hospital/vault" element={<Navigate to="/vault" replace />} />
          <Route path="/ehr-vault" element={<Navigate to="/vault" replace />} />
          <Route path="/network" element={<NetworkAuditorPage />} />
          <Route path="/ledger" element={<Navigate to="/network" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
