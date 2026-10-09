import React, { useState } from 'react';
import { Box, Typography, Chip, Button } from '@mui/material';
import {
  Science,
  LocalHospital,
  Public,
  Shield,
  AutoAwesome,
  Memory,
  LockOutlined,
  SwapHoriz,
  Storage,
  VerifiedUser,
} from '@mui/icons-material';
import { useMembrane } from '../contexts/MembraneContext';
import { PortalSwitcherDialog } from './PortalSwitcherDialog';

export const RoleHeroBar: React.FC = () => {
  const { role, activeTrials } = useMembrane();
  const [switcherOpen, setSwitcherOpen] = useState<boolean>(false);

  const getRoleConfig = () => {
    switch (role) {
      case 'research-lab':
        return {
          roleType: 'RESEARCH SPONSOR WORKSPACE',
          organization: 'Apex BioTherapeutics Protocol Command Center',
          subtitle:
            'Design and publish cryptographic clinical trial protocols to the Midnight blockchain. Eligibility parameters are strictly verified via zero-knowledge circuits without exposing raw patient data.',
          icon: <Science sx={{ fontSize: 24, color: '#818cf8' }} />,
          accentColor: '#6366f1',
          bg: '#11131a',
          border: '#232738',
          securityBadge: 'SPONSOR DATA BOUNDARY',
          tags: [
            { label: 'Compact Smart Contract', icon: <Memory sx={{ fontSize: 13 }} /> },
            { label: `${activeTrials.length} Active Protocols`, icon: <AutoAwesome sx={{ fontSize: 13 }} /> },
            { label: 'Zero PHI Exposure', icon: <Shield sx={{ fontSize: 13 }} /> },
          ],
        };
      case 'hospital':
      case 'ehr-database':
        return {
          roleType: 'HEALTHCARE PROVIDER PORTAL',
          organization: 'St. Jude Clinical Research Network (Institutional Node)',
          subtitle:
            'Match active research trials against institutional Electronic Health Records locally. Execute zero-knowledge witness proofs on-premise without releasing patient records off-site.',
          icon: <LocalHospital sx={{ fontSize: 24, color: '#34d399' }} />,
          accentColor: '#10b981',
          bg: '#11131a',
          border: '#1a3326',
          securityBadge: 'HIPAA & GDPR AIR-GAPPED',
          tags: [
            { label: 'Air-Gapped Private EHR Vault', icon: <Storage sx={{ fontSize: 13 }} /> },
            { label: 'Proof Server :6300 Ready', icon: <Memory sx={{ fontSize: 13 }} /> },
            { label: 'Anonymous Identity Commitments', icon: <Shield sx={{ fontSize: 13 }} /> },
          ],
        };
      case 'ledger-explorer':
        return {
          roleType: 'PUBLIC LEDGER & AUDIT EXPLORER',
          organization: 'Midnight Decentralized Ledger State Observer',
          subtitle:
            'Inspect on-chain Compact smart contract state, verified hospital set commitments, and zero-knowledge circuit guarantees with total cryptographic transparency.',
          icon: <Public sx={{ fontSize: 24, color: '#fbbf24' }} />,
          accentColor: '#f59e0b',
          bg: '#11131a',
          border: '#332917',
          securityBadge: 'PUBLIC ZERO-KNOWLEDGE PROOFS',
          tags: [
            { label: 'Midnight Preview Network', icon: <Memory sx={{ fontSize: 13 }} /> },
            { label: 'Cryptographic Set Commitments', icon: <Shield sx={{ fontSize: 13 }} /> },
            { label: 'Zero Data Leaks Confirmed', icon: <VerifiedUser sx={{ fontSize: 13 }} /> },
          ],
        };
    }
  };

  const config = getRoleConfig();

  return (
    <>
      <Box
        sx={{
          p: { xs: 2.2, md: 2.8 },
          mb: 3,
          borderRadius: '12px',
          background: config.bg,
          border: `1px solid ${config.border}`,
          boxShadow: 'none !important',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.8 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '8px',
                background: '#161924',
                border: `1px solid ${config.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                mt: 0.2,
              }}
            >
              {config.icon}
            </Box>

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3, flexWrap: 'wrap' }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: config.accentColor,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    fontSize: '0.72rem',
                  }}
                >
                  {config.roleType}
                </Typography>
                <Chip
                  icon={<LockOutlined sx={{ fontSize: 12, color: `${config.accentColor} !important` }} />}
                  label={config.securityBadge}
                  size="small"
                  sx={{
                    background: '#161924',
                    color: '#d1d5db',
                    border: `1px solid ${config.border}`,
                    fontSize: '0.62rem',
                    fontWeight: 600,
                    height: 19,
                  }}
                />
              </Box>

              <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.015em', color: '#f3f4f6', mb: 0.4 }}>
                {config.organization}
              </Typography>
              <Typography variant="body2" sx={{ color: '#8b92a5', maxWidth: '820px', lineHeight: 1.5, fontSize: '0.82rem' }}>
                {config.subtitle}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', md: 'flex-end' }, gap: 1.2, flexShrink: 0 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<SwapHoriz />}
              onClick={() => setSwitcherOpen(true)}
              sx={{
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.78rem',
                borderColor: '#262a3b',
                color: '#f3f4f6',
                background: '#141722',
                boxShadow: 'none !important',
                '&:hover': {
                  borderColor: '#3b425b',
                  background: '#1a1e2c',
                },
              }}
            >
              Switch Stakeholder Portal
            </Button>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
              {config.tags.map((tag, idx) => (
                <Chip
                  key={idx}
                  icon={tag.icon}
                  label={tag.label}
                  size="small"
                  sx={{
                    background: '#141722',
                    border: '1px solid #232738',
                    color: '#9ca3af',
                    fontSize: '0.68rem',
                    fontWeight: 500,
                    height: 22,
                  }}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </Box>

      <PortalSwitcherDialog open={switcherOpen} onClose={() => setSwitcherOpen(false)} />
    </>
  );
};
