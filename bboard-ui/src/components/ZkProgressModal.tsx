import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  CircularProgress,
  Button,
  Stepper,
  Step,
  StepLabel,
  Fade,
  Tooltip,
  IconButton,
} from '@mui/material';
import { CheckCircle, Error, Shield, ContentCopy, Terminal } from '@mui/icons-material';
import { useMembrane } from '../contexts/MembraneContext';

const STEPS = ['Witness Private State', 'ZK Proof Server (:6300)', 'Lace Wallet Balancing', 'Midnight Node Ledger'];

export const ZkProgressModal: React.FC = () => {
  const { zkStatus, resetZkStatus } = useMembrane();
  const [copiedTx, setCopiedTx] = useState<boolean>(false);
  const [logLines, setLogLines] = useState<string[]>([]);

  const isOpen = zkStatus.step !== 'idle';

  const getActiveStep = () => {
    switch (zkStatus.step) {
      case 'generating-proof':
        return 1;
      case 'signing':
        return 2;
      case 'submitting':
        return 3;
      case 'confirmed':
        return 4;
      default:
        return 0;
    }
  };

  const isComplete = zkStatus.step === 'confirmed';
  const isFailed = zkStatus.step === 'failed';

  useEffect(() => {
    if (zkStatus.step === 'generating-proof') {
      setLogLines([
        '⚡ [0.0s] Initializing zero-knowledge circuit witness...',
        '🔒 [0.3s] Extracting local hospital EHR aggregates (no PHI disclosure)...',
        '⚙️ [0.8s] Connecting to Midnight Proof Server on ws://localhost:6300...',
        '📐 [1.2s] Synthesizing ZK-SNARK constraint system (R1CS)...',
      ]);
    } else if (zkStatus.step === 'signing') {
      setLogLines((prev) => [
        ...prev,
        '✨ [1.5s] ZK Proof synthesized successfully (Size: 256 bytes)',
        '👛 [1.8s] Requesting Midnight Lace Wallet signature & unshielded dust balancing...',
      ]);
    } else if (zkStatus.step === 'submitting') {
      setLogLines((prev) => [
        ...prev,
        '🌐 [2.2s] Broadcasting shielded transaction to Midnight Node (:9944)...',
        '⛓️ [2.6s] Awaiting consensus inclusion in next block...',
      ]);
    } else if (zkStatus.step === 'confirmed') {
      setLogLines((prev) => [...prev, '🎉 [3.2s] Transaction confirmed and committed to Midnight Ledger!']);
    } else if (zkStatus.step === 'idle') {
      setLogLines([]);
    }
  }, [zkStatus.step]);

  const copyTxHash = () => {
    if (zkStatus.txHash) {
      void navigator.clipboard.writeText(zkStatus.txHash);
      setCopiedTx(true);
      setTimeout(() => setCopiedTx(false), 2000);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={isComplete || isFailed ? resetZkStatus : undefined}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            background: '#11131a',
            border: isComplete ? '1px solid #163826' : isFailed ? '1px solid #3d1b1f' : '1px solid #232738',
            boxShadow: 'none !important',
            borderRadius: '12px',
            p: 1.5,
          },
        },
      }}
    >
      <DialogContent sx={{ textAlign: 'center', py: 2.5, px: 1.5 }}>
        {/* Center Status Icon */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          {isComplete ? (
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#102219',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #183827',
              }}
            >
              <CheckCircle sx={{ fontSize: 40, color: '#10b981' }} />
            </Box>
          ) : isFailed ? (
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#2d1418',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #3d1b1f',
              }}
            >
              <Error sx={{ fontSize: 40, color: '#ef4444' }} />
            </Box>
          ) : (
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress
                size={64}
                thickness={3}
                sx={{
                  color: '#4f46e5',
                }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Shield sx={{ fontSize: 24, color: '#818cf8' }} />
              </Box>
            </Box>
          )}
        </Box>

        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.015em', mb: 0.8, color: '#f3f4f6' }}>
          {isComplete ? 'ZK Transaction Confirmed' : isFailed ? 'Transaction Failed' : 'Zero-Knowledge Proof Execution'}
        </Typography>

        <Typography
          variant="body2"
          sx={{ color: '#8b92a5', mb: 3, px: 2, minHeight: 38, lineHeight: 1.5, fontSize: '0.82rem' }}
        >
          {zkStatus.message}
        </Typography>

        {/* Stepper */}
        <Box sx={{ mb: 3, px: 1 }}>
          <Stepper activeStep={getActiveStep()} alternativeLabel>
            {STEPS.map((label, idx) => (
              <Step key={label} completed={getActiveStep() > idx || isComplete}>
                <StepLabel
                  sx={{
                    '& .MuiStepLabel-label': {
                      color: '#6b7280',
                      fontSize: '0.72rem',
                      fontWeight: 500,
                      mt: 0.4,
                      '&.Mui-active': { color: '#818cf8', fontWeight: 700 },
                      '&.Mui-completed': { color: '#34d399' },
                    },
                    '& .MuiStepIcon-root': {
                      color: '#1a1d2b',
                      '&.Mui-active': { color: '#4f46e5' },
                      '&.Mui-completed': { color: '#10b981' },
                    },
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Technical ZK Log Console */}
        <Box
          sx={{
            background: '#0a0b10',
            border: '1px solid #1e2230',
            borderRadius: '8px',
            p: 1.8,
            mb: 2.5,
            textAlign: 'left',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.8,
              mb: 0.8,
              borderBottom: '1px solid #161824',
              pb: 0.6,
            }}
          >
            <Terminal sx={{ fontSize: 14, color: '#38bdf8' }} />
            <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, letterSpacing: '0.04em' }}>
              MIDNIGHT ZK PROOF LOG CONSOLE
            </Typography>
          </Box>
          <Box
            sx={{
              maxHeight: 110,
              overflowY: 'auto',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.72rem',
              color: '#d1d5db',
              lineHeight: 1.55,
            }}
          >
            {logLines.map((line, idx) => (
              <Box
                key={idx}
                sx={{ color: idx === logLines.length - 1 ? (isComplete ? '#34d399' : '#818cf8') : '#8b92a5' }}
              >
                {line}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Transaction ID Pill */}
        {zkStatus.txHash && (
          <Box
            sx={{
              background: '#0e1813',
              border: '1px solid #163826',
              borderRadius: '8px',
              p: 1.2,
              mb: 2.5,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box sx={{ textAlign: 'left', overflow: 'hidden' }}>
              <Typography
                variant="caption"
                sx={{ color: '#6b7280', display: 'block', fontWeight: 600, fontSize: '0.68rem' }}
              >
                MIDNIGHT TRANSACTION HASH
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'JetBrains Mono, monospace',
                  color: '#34d399',
                  fontSize: '0.78rem',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                {zkStatus.txHash}
              </Typography>
            </Box>
            <Tooltip title={copiedTx ? 'Copied!' : 'Copy Tx Hash'}>
              <IconButton size="small" onClick={copyTxHash} sx={{ color: '#34d399' }}>
                <ContentCopy fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {(isComplete || isFailed) && (
          <Fade in>
            <Button
              variant="contained"
              color={isComplete ? 'primary' : 'inherit'}
              fullWidth
              size="medium"
              onClick={resetZkStatus}
              sx={{
                py: 1,
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.88rem',
                boxShadow: 'none !important',
              }}
            >
              Done
            </Button>
          </Fade>
        )}
      </DialogContent>
    </Dialog>
  );
};
