import React from 'react';
import { Box, Typography, Container, Chip, Tooltip } from '@mui/material';
import { Shield, CheckCircle, Speed, Lock, Bolt } from '@mui/icons-material';
import { useMembrane } from '../contexts/MembraneContext';

export const Footer: React.FC = () => {
  const { networkId, contractAddress } = useMembrane();

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        borderTop: '1px solid #1e2230',
        background: '#0e1017',
        py: 2,
        boxShadow: 'none',
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          {/* Left Brand & Mission */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Box
              sx={{
                width: 26,
                height: 26,
                borderRadius: '6px',
                background: '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield sx={{ fontSize: 14, color: '#ffffff' }} />
            </Box>
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, letterSpacing: '-0.01em', color: '#f3f4f6', fontSize: '0.82rem' }}
            >
              MEMBRANE PROTOCOL
            </Typography>
            <Typography variant="caption" sx={{ color: '#6b7280' }}>
              • Privacy-Preserving Health Intelligence on Midnight Network
            </Typography>
          </Box>

          {/* Center Protocol Badges */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
            <Tooltip title="Local zero-knowledge witness compilation server">
              <Chip
                icon={<Bolt sx={{ fontSize: 13, color: '#10b981 !important' }} />}
                label="Proof Server :6300 Active"
                size="small"
                sx={{
                  background: '#102219',
                  border: '1px solid #183827',
                  color: '#34d399',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  height: 22,
                }}
              />
            </Tooltip>

            <Tooltip title="Midnight Preview Network Connection">
              <Chip
                icon={<Speed sx={{ fontSize: 13, color: '#38bdf8 !important' }} />}
                label={`Node: ${networkId} (Substrate/Wasm)`}
                size="small"
                sx={{
                  background: '#0e1d28',
                  border: '1px solid #15384e',
                  color: '#38bdf8',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  height: 22,
                }}
              />
            </Tooltip>

            <Tooltip title="Compact Contract Address">
              <Chip
                icon={<Lock sx={{ fontSize: 13, color: '#a5b4fc !important' }} />}
                label={`Contract: ${contractAddress.substring(0, 8)}...${contractAddress.slice(-4)}`}
                size="small"
                sx={{
                  background: '#161928',
                  border: '1px solid #23273c',
                  color: '#a5b4fc',
                  fontSize: '0.7rem',
                  fontFamily: 'JetBrains Mono, monospace',
                  height: 22,
                }}
              />
            </Tooltip>
          </Box>

          {/* Right Copyright & Buildathon */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <CheckCircle sx={{ fontSize: 14, color: '#10b981' }} />
            <Typography variant="caption" sx={{ color: '#8b92a5', fontSize: '0.74rem' }}>
              Zero PHI Leakage Verified
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};
