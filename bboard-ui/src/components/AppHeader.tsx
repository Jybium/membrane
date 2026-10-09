import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { shortAddress } from '../midnight/wallet';
import { MIDNIGHT_CONFIG } from '../midnight/config';

export function Mark() {
  return (
    <span className="mark">
      <i />
      <i />
      <i />
    </span>
  );
}

export function Arrow() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export const AppHeader: React.FC = () => {
  const { walletSession, toggleWallet, isWalletInstalled } = useApp();
  const location = useLocation();
  const path = location.pathname;

  return (
    <>
      <header>
        <Link to="/" className="brand" title="Return to Landing Page">
          <img src="/membrane-logo.png" alt="Membrane logo" className="brand-logo h-10 w-10" />
          Membrane
        </Link>

        <nav aria-label="Select workspace">
          <NavLink to="/lab" className={({ isActive }) => (isActive ? 'active' : '')}>
            Research lab
          </NavLink>
          <NavLink to="/hospital" className={({ isActive }) => (isActive ? 'active' : '')}>
            Hospital
          </NavLink>
          <NavLink to="/vault" className={({ isActive }) => (isActive ? 'active' : '')}>
            Consented EHR Vault
          </NavLink>
          <NavLink to="/network" className={({ isActive }) => (isActive ? 'active' : '')}>
            Network Auditor
          </NavLink>
        </nav>

        <div className="header-actions">
          <span className="network">
            <i /> {MIDNIGHT_CONFIG.networkLabel}
          </span>
          <button
            type="button"
            className={`wallet-button ${walletSession ? 'connected' : ''}`}
            onClick={toggleWallet}
            title={
              walletSession
                ? `Connected: ${walletSession.address} (click to disconnect)`
                : isWalletInstalled
                  ? 'Connect Midnight Lace wallet'
                  : 'Connect simulated testnet wallet'
            }
          >
            <span className="wallet-dot" />
            {walletSession ? shortAddress(walletSession.address) : 'Connect wallet'}
          </button>
        </div>
      </header>

      <div className="flow-bar">
        <span className={path === '/lab' ? 'active' : ''}>Lab creates request</span>
        <Arrow />
        <span className={path === '/network' ? 'active' : ''}>Contract indexes</span>
        <Arrow />
        <span className={path === '/hospital' || path === '/vault' ? 'active' : ''}>Hospital proves locally</span>
        <Arrow />
        <span>Lab receives result</span>
      </div>
    </>
  );
};
