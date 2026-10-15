import React, { useState } from 'react';
import { MIDNIGHT_CONFIG } from '../midnight/config';

export interface TransactionReceiptCardProps {
  txHash: string;
  label?: string;
  sublabel?: string;
  trialIdHash?: string;
  statusBadge?: string;
  variant?: 'emerald' | 'blue' | 'navy';
  className?: string;
  style?: React.CSSProperties;
}

export const TransactionReceiptCard: React.FC<TransactionReceiptCardProps> = ({
  txHash,
  label = 'Midnight On-Chain Transaction',
  sublabel = 'Zero-Knowledge Proof Verified & Settled on Midnight Preview',
  trialIdHash,
  statusBadge = 'Settled On-Chain',
  variant = 'emerald',
  className = '',
  style,
}) => {
  const [copiedTx, setCopiedTx] = useState(false);
  const [copiedTrial, setCopiedTrial] = useState(false);
  const [showFullTx, setShowFullTx] = useState(false);
  const [showFullTrial, setShowFullTrial] = useState(false);

  const cleanTx = (txHash || '').trim();
  const cleanTrial = (trialIdHash || '').trim().replace(/^0x/, '');

  const copyToClipboard = async (text: string, isTrial = false) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isTrial) {
        setCopiedTrial(true);
        setTimeout(() => setCopiedTrial(false), 2200);
      } else {
        setCopiedTx(true);
        setTimeout(() => setCopiedTx(false), 2200);
      }
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  const formatShort = (h: string) => {
    if (!h) return '';
    const formatted = h.startsWith('0x') ? h : `0x${h}`;
    if (formatted.length <= 22) return formatted;
    return `${formatted.slice(0, 12)}…${formatted.slice(-10)}`;
  };

  const explorerUrl = MIDNIGHT_CONFIG.explorerTxUrl(cleanTx);

  return (
    <div className={`membrane-tx-card ${variant} ${className}`} style={style}>
      {/* Header bar */}
      <div className="membrane-tx-header">
        <div className="membrane-tx-header-left">
          <span className="membrane-beacon">
            <span className="membrane-beacon-ping" />
            <span className="membrane-beacon-core" />
          </span>
          <div className="membrane-tx-titles">
            <span className="membrane-tx-title">{label}</span>
            <span className="membrane-tx-sublabel">{sublabel}</span>
          </div>
        </div>
        <div className="membrane-tx-header-right">
          <span className="membrane-badge network">Preview Testnet</span>
          <span className="membrane-badge verified">
            <svg
              className="badge-icon"
              viewBox="0 0 20 20"
              fill="currentColor"
              width="13"
              height="13"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clipRule="evenodd"
              />
            </svg>
            {statusBadge}
          </span>
        </div>
      </div>

      {/* Main Tx Hash Box */}
      <div className="membrane-tx-body">
        <div className="membrane-hash-row">
          <div className="membrane-hash-pill" onClick={() => copyToClipboard(cleanTx)} title="Click to copy full hash">
            <span className="hash-prefix">TXID</span>
            <code className="hash-code">
              {showFullTx ? (cleanTx.startsWith('0x') ? cleanTx : `0x${cleanTx}`) : formatShort(cleanTx)}
            </code>
            <button
              type="button"
              className="toggle-view-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowFullTx(!showFullTx);
              }}
              title={showFullTx ? 'Show truncated view' : 'Show full 64-character hash'}
            >
              {showFullTx ? 'collapse' : 'expand'}
            </button>
          </div>

          <div className="membrane-hash-actions">
            <button
              type="button"
              className={`action-btn copy-btn ${copiedTx ? 'copied' : ''}`}
              onClick={() => copyToClipboard(cleanTx)}
              title="Copy full transaction hash to clipboard"
            >
              {copiedTx ? (
                <>
                  <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>Copy Hash</span>
                </>
              )}
            </button>

            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="action-btn explorer-btn"
              title="View on Midnight Preview Explorer"
            >
              <span>Explorer</span>
              <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
                <path
                  fillRule="evenodd"
                  d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h4a.75.75 0 010 1.5h-4z"
                  clipRule="evenodd"
                />
                <path
                  fillRule="evenodd"
                  d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.156 8.35a.75.75 0 00-.053 1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </div>
        </div>

        {/* Optional Secondary Trial ID Hash */}
        {cleanTrial && (
          <div className="membrane-aux-row">
            <span className="aux-label">Trial Identifier:</span>
            <div className="aux-pill" onClick={() => copyToClipboard(cleanTrial, true)} title="Click to copy trial hash">
              <code>
                {showFullTrial ? cleanTrial : `CT-${cleanTrial.slice(0, 10).toUpperCase()}…${cleanTrial.slice(-6).toUpperCase()}`}
              </code>
              <button
                type="button"
                className="toggle-view-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFullTrial(!showFullTrial);
                }}
              >
                {showFullTrial ? 'collapse' : 'expand'}
              </button>
            </div>
            <button
              type="button"
              className={`aux-copy-btn ${copiedTrial ? 'copied' : ''}`}
              onClick={() => copyToClipboard(cleanTrial, true)}
              title="Copy trial ID hash"
            >
              {copiedTrial ? 'Copied!' : 'Copy ID'}
            </button>
          </div>
        )}
      </div>

      {/* Footer verification note */}
      <div className="membrane-tx-footer">
        <div className="footer-item">
          <svg viewBox="0 0 20 20" fill="currentColor" width="11" height="11" style={{ opacity: 0.7 }}>
            <path
              fillRule="evenodd"
              d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
              clipRule="evenodd"
            />
          </svg>
          <span>Institutional Air-Gap: 0 patient EHR records revealed</span>
        </div>
        <div className="footer-item">
          <span>Protocol: Compact v0.23 • R1CS ZK-SNARK</span>
        </div>
      </div>
    </div>
  );
};
