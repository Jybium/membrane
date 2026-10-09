import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Card,
  CardActionArea,
  Chip,
  Button,
  IconButton,
} from '@mui/material';
import {
  Science,
  LocalHospital,
  Public,
  Close,
  Shield,
  Lock,
  VerifiedUser,
} from '@mui/icons-material';
import { useMembrane, type UserRole } from '../contexts/MembraneContext';

interface PortalSwitcherDialogProps {
  open: boolean;
  onClose: () => void;
}

export const PortalSwitcherDialog: React.FC<PortalSwitcherDialogProps> = ({ open, onClose }) => {
  const { role, setRole, activeTrials } = useMembrane();

  const portals: {
    role: UserRole;
    title: string;
    organization: string;
    badge: string;
    accentColor: string;
    bg: string;
    border: string;
    icon: React.ReactElement;
    description: string;
    dataBoundary: string;
    capabilities: string[];
  }[] = [
    {
      role: 'research-lab',
      title: 'Research Sponsor Studio',
      organization: 'Apex BioTherapeutics • CRO & Sponsor Hub',
      badge: 'SPONSOR PERIMETER',
      accentColor: '#6366f1',
      bg: '#141522',
      border: '#282b42',
      icon: <Science sx={{ fontSize: 26, color: '#818cf8' }} />,
      description:
        'Author and deploy cryptographic clinical trial protocols to Midnight. Define inclusion criteria (ICD-10, Age, Min Cohort) verified strictly via ZK circuits.',
      dataBoundary: 'No access to patient health information (PHI) or hospital raw databases.',
      capabilities: [
        'Deploy Compact Smart Contracts',
        `Monitor ${activeTrials.length} Active Protocols`,
        'Track Hospital Enrolled Commitments',
        'Trial Lifecycle Management',
      ],
    },
    {
      role: 'hospital',
      title: 'Healthcare Provider Portal',
      organization: 'St. Jude Clinical Research Network • Site Node',
      badge: 'HIPAA AIR-GAPPED',
      accentColor: '#10b981',
      bg: '#0f1f18',
      border: '#1a3b2b',
      icon: <LocalHospital sx={{ fontSize: 26, color: '#34d399' }} />,
      description:
        'Evaluate active research trials against hospital patient records locally. Generate ZK proofs on-premise without exposing patient identities or medical histories.',
      dataBoundary: 'Institutional EHR records remain 100% air-gapped behind hospital firewall.',
      capabilities: [
        'Local Trial Cohort Eligibility Matching',
        'Private EHR Records Custody & Vault',
        'Zero-Knowledge Witness Enrollment (:6300)',
        'Anonymous Cryptographic Commitment',
      ],
    },
    {
      role: 'ledger-explorer',
      title: 'Ledger & Protocol Explorer',
      organization: 'Midnight Public Verifier • Compliance & Audit',
      badge: 'PUBLIC VERIFIER',
      accentColor: '#f59e0b',
      bg: '#211a10',
      border: '#3d301b',
      icon: <Public sx={{ fontSize: 26, color: '#fbbf24' }} />,
      description:
        'Transparent inspection of on-chain Compact contract state, verified hospital set commitments, and zero-knowledge circuit guarantees.',
      dataBoundary: 'Zero private keys or sensitive inputs. 100% publicly verifiable proofs.',
      capabilities: [
        'Compact Smart Contract Ledger State',
        'Inspect Zero-Knowledge Circuits',
        'Verifiable Set Commitments',
        'Regulatory & Ethics Audit Trails',
      ],
    },
  ];

  const handleSelectRole = (newRole: UserRole) => {
    setRole(newRole);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            background: '#11131a',
            border: '1px solid #232738',
            boxShadow: 'none !important',
            borderRadius: '12px',
            p: { xs: 1, sm: 2 },
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1.5,
          borderBottom: '1px solid #1e2230',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: '8px',
              background: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Shield sx={{ color: '#ffffff', fontSize: 18 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#f3f4f6', fontSize: '1.05rem' }}>
              Select Stakeholder Portal & Perimeter
            </Typography>
            <Typography variant="caption" sx={{ color: '#8b92a5' }}>
              Membrane enforces cryptographic separation of duties across all actors.
            </Typography>
          </Box>
        </Box>

        <IconButton onClick={onClose} sx={{ color: '#6b7280', '&:hover': { color: '#f3f4f6' } }}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 2.5 }}>
        {/* Security Isolation Callout */}
        <Box
          sx={{
            background: '#141722',
            borderRadius: '8px',
            border: '1px solid #232738',
            p: 1.8,
            mb: 2.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
          }}
        >
          <Lock sx={{ color: '#60a5fa', fontSize: 18, flexShrink: 0 }} />
          <Typography variant="body2" sx={{ color: '#9ca3af', fontSize: '0.8rem' }}>
            <strong>Cryptographic Stakeholder Isolation:</strong> Each portal operates in its own security domain. Research Sponsors cannot access hospital patient records; Healthcare Providers cannot alter sponsor protocols; Public Auditors only inspect verified zero-knowledge proofs.
          </Typography>
        </Box>

        {/* 3 Portal Cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 2,
          }}
        >
          {portals.map((p) => {
            const isCurrent = role === p.role || (role === 'ehr-database' && p.role === 'hospital');
            return (
              <Card
                key={p.role}
                sx={{
                  background: isCurrent ? p.bg : '#141722',
                  border: isCurrent
                    ? `1px solid ${p.accentColor}`
                    : '1px solid #232738',
                  boxShadow: 'none !important',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'border-color 0.15s ease',
                  '&:hover': {
                    borderColor: p.accentColor,
                  },
                }}
              >
                <CardActionArea
                  onClick={() => handleSelectRole(p.role)}
                  sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                >
                  {/* Top Bar: Icon & Badge */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.8 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '8px',
                        background: '#0e1017',
                        border: `1px solid ${p.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {p.icon}
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                      <Chip
                        label={p.badge}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.62rem',
                          background: 'transparent',
                          color: p.accentColor,
                          border: `1px solid ${p.border}`,
                          height: 20,
                        }}
                      />
                      {isCurrent && (
                        <Chip
                          icon={<VerifiedUser sx={{ fontSize: 12, color: `${p.accentColor} !important` }} />}
                          label="ACTIVE"
                          size="small"
                          sx={{
                            background: '#161926',
                            color: p.accentColor,
                            fontWeight: 700,
                            fontSize: '0.6rem',
                            height: 18,
                            border: `1px solid ${p.border}`,
                          }}
                        />
                      )}
                    </Box>
                  </Box>

                  {/* Title & Organization */}
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f3f4f6', mb: 0.3 }}>
                    {p.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: p.accentColor, fontWeight: 600, mb: 1.2, display: 'block' }}>
                    {p.organization}
                  </Typography>

                  {/* Description */}
                  <Typography variant="body2" sx={{ color: '#8b92a5', lineHeight: 1.5, mb: 2, minHeight: 60, fontSize: '0.8rem' }}>
                    {p.description}
                  </Typography>

                  {/* Data Boundary Box */}
                  <Box
                    sx={{
                      background: '#0e1017',
                      borderRadius: '6px',
                      p: 1.2,
                      mb: 2,
                      border: '1px solid #1e2230',
                    }}
                  >
                    <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 700, display: 'block', mb: 0.2 }}>
                      DATA PERIMETER GUARANTEE
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#9ca3af', lineHeight: 1.35, display: 'block' }}>
                      {p.dataBoundary}
                    </Typography>
                  </Box>

                  {/* Capabilities List */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6, mt: 'auto', mb: 2 }}>
                    {p.capabilities.map((cap, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <Box sx={{ width: 4, height: 4, borderRadius: '50%', background: p.accentColor }} />
                        <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 500, fontSize: '0.74rem' }}>
                          {cap}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  <Button
                    variant={isCurrent ? 'contained' : 'outlined'}
                    fullWidth
                    size="small"
                    sx={{
                      mt: 1,
                      borderRadius: '8px',
                      fontWeight: 600,
                      boxShadow: 'none !important',
                      borderColor: '#262a3b',
                      color: isCurrent ? '#ffffff' : '#d1d5db',
                      background: isCurrent ? p.accentColor : '#141722',
                      '&:hover': {
                        background: isCurrent ? p.accentColor : '#1a1e2c',
                        borderColor: p.accentColor,
                        boxShadow: 'none !important',
                      },
                    }}
                  >
                    {isCurrent ? 'Current Workspace' : 'Enter Portal'}
                  </Button>
                </CardActionArea>
              </Card>
            );
          })}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: '1px solid #1e2230', justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ color: '#6b7280' }}>
          Midnight Network (Preview) • Zero PHI Leakage Guaranteed
        </Typography>
        <Button onClick={onClose} variant="outlined" color="inherit" size="small" sx={{ borderRadius: '6px', color: '#8b92a5', borderColor: '#262a3b' }}>
          Dismiss
        </Button>
      </DialogActions>
    </Dialog>
  );
};
