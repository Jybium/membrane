import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Chip,
  Container,
  Tooltip,
  IconButton,
  Snackbar,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  Science,
  LocalHospital,
  Public,
  AccountBalanceWallet,
  ContentCopy,
  CheckCircle,
  Shield,
  SwapHoriz,
  LockOutlined,
  ExpandMore,
} from '@mui/icons-material';
import { useMembrane, type UserRole } from '../contexts/MembraneContext';
import { MembraneBackendService, type BackendMode } from '../services/membraneBackendService';
import { PortalSwitcherDialog } from './PortalSwitcherDialog';

export const Navbar: React.FC = () => {
  const {
    role,
    setRole,
    isWalletConnected,
    walletAddress,
    networkId,
    connectWallet,
  } = useMembrane();

  const [copied, setCopied] = useState<boolean>(false);
  const [switcherOpen, setSwitcherOpen] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [backendMode, setBackendMode] = useState<BackendMode>(MembraneBackendService.getMode());
  const [isCheckingBackend, setIsCheckingBackend] = useState<boolean>(false);
  const [backendStatusMsg, setBackendStatusMsg] = useState<string | null>(null);

  React.useEffect(() => {
    return MembraneBackendService.subscribeModeChange((newMode) => {
      setBackendMode(newMode);
    });
  }, []);

  const handleTestBackend = async () => {
    setIsCheckingBackend(true);
    try {
      const res = await MembraneBackendService.checkBackendConnection();
      setBackendStatusMsg(res.message);
    } finally {
      setIsCheckingBackend(false);
    }
  };

  const handleCopyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (walletAddress) {
      void navigator.clipboard.writeText(walletAddress);
      setCopied(true);
    }
  };

  const currentRoleConfig = () => {
    switch (role) {
      case 'research-lab':
        return {
          label: 'Research Sponsor',
          organization: 'Apex BioTherapeutics',
          badge: 'SPONSOR PERIMETER',
          color: '#6366f1',
          bg: '#141522',
          border: '#282b42',
          icon: <Science sx={{ fontSize: 18, color: '#818cf8' }} />,
        };
      case 'hospital':
      case 'ehr-database':
        return {
          label: 'Healthcare Provider',
          organization: 'St. Jude Clinical Site',
          badge: 'HIPAA AIR-GAPPED',
          color: '#10b981',
          bg: '#0f1f18',
          border: '#1a3b2b',
          icon: <LocalHospital sx={{ fontSize: 18, color: '#34d399' }} />,
        };
      case 'ledger-explorer':
        return {
          label: 'Ledger & Protocol Explorer',
          organization: 'Midnight Public Observer',
          badge: 'PUBLIC VERIFIER',
          color: '#f59e0b',
          bg: '#211a10',
          border: '#3d301b',
          icon: <Public sx={{ fontSize: 18, color: '#fbbf24' }} />,
        };
    }
  };

  const roleInfo = currentRoleConfig();

  const navPortals: { role: UserRole; label: string; org: string; icon: React.ReactElement; color: string }[] = [
    { role: 'research-lab', label: 'Research Sponsor', org: 'Apex BioTherapeutics', icon: <Science sx={{ fontSize: 16 }} />, color: '#6366f1' },
    { role: 'hospital', label: 'Healthcare Provider', org: 'St. Jude Clinical Site', icon: <LocalHospital sx={{ fontSize: 16 }} />, color: '#10b981' },
    { role: 'ledger-explorer', label: 'Ledger Explorer', org: 'Public Verifier', icon: <Public sx={{ fontSize: 16 }} />, color: '#f59e0b' },
  ];

  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          background: '#0e1017',
          borderBottom: '1px solid #1e2230',
          boxShadow: 'none !important',
          zIndex: 1100,
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', py: 1.2, minHeight: 64 }}>
            {/* Left: Brand Identity */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: '8px',
                  background: '#4f46e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: 'none',
                }}
              >
                <Shield sx={{ color: '#ffffff', fontSize: 22 }} />
              </Box>

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      fontSize: '1.15rem',
                      color: '#f3f4f6',
                    }}
                  >
                    MEMBRANE
                  </Typography>
                  <Chip
                    label="Midnight Preview"
                    size="small"
                    sx={{
                      background: '#1a1d2b',
                      color: '#a5b4fc',
                      border: '1px solid #292e45',
                      fontSize: '0.66rem',
                      fontWeight: 600,
                      height: 19,
                    }}
                  />
                </Box>
                <Typography variant="caption" sx={{ color: '#8b92a5', display: 'block', mt: -0.2, fontWeight: 500 }}>
                  Zero-Knowledge Clinical Trial Recruitment
                </Typography>
              </Box>
            </Box>

            {/* Center: Active Stakeholder Perimeter Pill & Portal Selector */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1.5 }}>
              <Box
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 1.8,
                  py: 0.7,
                  borderRadius: '8px',
                  background: roleInfo.bg,
                  border: `1px solid ${roleInfo.border}`,
                  cursor: 'pointer',
                  boxShadow: 'none',
                  transition: 'background-color 0.15s ease',
                  '&:hover': {
                    background: '#181b28',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: '6px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {roleInfo.icon}
                </Box>

                <Box sx={{ textAlign: 'left' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#f3f4f6', fontSize: '0.82rem' }}>
                      {roleInfo.label}
                    </Typography>
                    <Chip
                      label={roleInfo.badge}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        background: 'transparent',
                        color: roleInfo.color,
                        border: `1px solid ${roleInfo.border}`,
                      }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ color: '#8b92a5', fontSize: '0.7rem', display: 'block' }}>
                    {roleInfo.organization}
                  </Typography>
                </Box>

                <ExpandMore sx={{ color: '#8b92a5', fontSize: 18, ml: 0.5 }} />
              </Box>

              <Button
                variant="outlined"
                size="small"
                startIcon={<SwapHoriz />}
                onClick={() => setSwitcherOpen(true)}
                sx={{
                  borderRadius: '8px',
                  px: 1.6,
                  py: 0.6,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  borderColor: '#262a3b',
                  color: '#d1d5db',
                  background: 'transparent',
                  boxShadow: 'none !important',
                  '&:hover': {
                    borderColor: '#3b425b',
                    background: 'rgba(255, 255, 255, 0.04)',
                  },
                }}
              >
                Switch Stakeholder
              </Button>
            </Box>

            {/* Right: Proof Server Live & Web3 Wallet */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {/* Air-Gapped Vault / API Status Indicator */}
              <Tooltip
                title={
                  backendMode === 'online'
                    ? 'Connected to live Membrane API on port 3000'
                    : 'Operating in Air-Gapped Privacy Vault Mode (Zero Network Leaks). Click to test connection to live API.'
                }
              >
                <Box
                  onClick={backendMode === 'airgapped' ? handleTestBackend : undefined}
                  sx={{
                    display: { xs: 'none', lg: 'flex' },
                    alignItems: 'center',
                    gap: 0.8,
                    background: backendMode === 'online' ? '#0e1813' : '#12141f',
                    border: `1px solid ${backendMode === 'online' ? '#163826' : '#232738'}`,
                    px: 1.2,
                    py: 0.5,
                    borderRadius: '8px',
                    cursor: backendMode === 'airgapped' ? 'pointer' : 'default',
                    transition: 'border-color 0.15s ease',
                    '&:hover': {
                      borderColor: backendMode === 'airgapped' ? '#3b425b' : '#163826',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: backendMode === 'online' ? '#10b981' : '#6366f1',
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: backendMode === 'online' ? '#34d399' : '#a5b4fc',
                      fontWeight: 600,
                      fontSize: '0.72rem',
                    }}
                  >
                    {isCheckingBackend
                      ? 'Probing :3000...'
                      : backendMode === 'online'
                      ? 'API :3000 Live'
                      : 'Vault: Air-Gapped'}
                  </Typography>
                </Box>
              </Tooltip>

              {/* Local Proof Server Indicator */}
              <Tooltip title="Local Zero-Knowledge Proof Server running on ws://localhost:6300">
                <Box
                  sx={{
                    display: { xs: 'none', sm: 'flex' },
                    alignItems: 'center',
                    gap: 0.8,
                    background: '#0e1813',
                    border: '1px solid #163826',
                    px: 1.2,
                    py: 0.5,
                    borderRadius: '8px',
                  }}
                >
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: '#10b981',
                    }}
                  />
                  <Typography variant="caption" sx={{ color: '#34d399', fontWeight: 600, fontSize: '0.72rem' }}>
                    ZK Server :6300
                  </Typography>
                </Box>
              </Tooltip>

              {/* Lace Shielded Wallet */}
              {isWalletConnected ? (
                <Tooltip title="Lace Shielded Wallet Connected • Click to Copy Address">
                  <Box
                    onClick={handleCopyAddress}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      background: '#0e1813',
                      border: '1px solid #163826',
                      px: 1.4,
                      py: 0.6,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      boxShadow: 'none',
                      transition: 'border-color 0.15s ease',
                      '&:hover': {
                        borderColor: '#10b981',
                      },
                    }}
                  >
                    <CheckCircle sx={{ color: '#10b981', fontSize: 16 }} />
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#34d399',
                        fontWeight: 600,
                        fontSize: '0.78rem',
                        fontFamily: 'JetBrains Mono, monospace',
                      }}
                    >
                      {walletAddress ? `${walletAddress.substring(0, 10)}...${walletAddress.slice(-4)}` : 'Shielded'}
                    </Typography>
                    <ContentCopy sx={{ color: '#6b7280', fontSize: 13 }} />
                  </Box>
                </Tooltip>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={<AccountBalanceWallet />}
                  onClick={() => void connectWallet()}
                  sx={{
                    px: 2,
                    py: 0.7,
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    borderRadius: '8px',
                    boxShadow: 'none !important',
                  }}
                >
                  Connect Lace Wallet
                </Button>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Quick Stakeholder Switcher Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        slotProps={{
          paper: {
            sx: {
              background: '#11131a',
              border: '1px solid #262a3b',
              boxShadow: 'none !important',
              borderRadius: '10px',
              minWidth: 260,
              p: 0.5,
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 700, letterSpacing: '0.04em', display: 'block' }}>
            SELECT STAKEHOLDER PORTAL
          </Typography>
        </Box>
        <Divider sx={{ borderColor: '#1e2230' }} />
        {navPortals.map((item) => (
          <MenuItem
            key={item.role}
            onClick={() => {
              setRole(item.role);
              setAnchorEl(null);
            }}
            selected={role === item.role || (role === 'ehr-database' && item.role === 'hospital')}
            sx={{
              borderRadius: '6px',
              my: 0.4,
              py: 1,
              '&.Mui-selected': {
                background: '#1a1d2b',
                border: '1px solid #2d3348',
              },
            }}
          >
            <ListItemIcon sx={{ color: item.color, minWidth: 32 }}>{item.icon}</ListItemIcon>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: '0.84rem', color: '#f3f4f6' }}>
                {item.label}
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: '#8b92a5' }}>
                {item.org}
              </Typography>
            </Box>
          </MenuItem>
        ))}
        <Divider sx={{ borderColor: '#1e2230', my: 0.8 }} />
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            setSwitcherOpen(true);
          }}
          sx={{ borderRadius: '6px', py: 0.8, color: '#60a5fa' }}
        >
          <ListItemIcon sx={{ color: '#60a5fa', minWidth: 32 }}>
            <LockOutlined sx={{ fontSize: 16 }} />
          </ListItemIcon>
          <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#60a5fa' }}>
            View Security Boundaries
          </Typography>
        </MenuItem>
      </Menu>

      {/* Stakeholder Switcher Dialog */}
      <PortalSwitcherDialog open={switcherOpen} onClose={() => setSwitcherOpen(false)} />

      {/* Mobile Stakeholder Switcher Bar */}
      <Box
        sx={{
          display: { xs: 'flex', md: 'none' },
          background: '#0e1017',
          borderBottom: '1px solid #1e2230',
          px: 2,
          py: 0.8,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {roleInfo.icon}
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#f3f4f6' }}>
            {roleInfo.label}
          </Typography>
        </Box>
        <Button
          size="small"
          variant="outlined"
          startIcon={<SwapHoriz />}
          onClick={() => setSwitcherOpen(true)}
          sx={{ fontSize: '0.74rem', py: 0.3, borderColor: '#262a3b' }}
        >
          Switch
        </Button>
      </Box>

      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        message="Shielded Address copied to clipboard!"
      />

      <Snackbar
        open={Boolean(backendStatusMsg)}
        autoHideDuration={4000}
        onClose={() => setBackendStatusMsg(null)}
        message={backendStatusMsg || ''}
      />
    </>
  );
};
