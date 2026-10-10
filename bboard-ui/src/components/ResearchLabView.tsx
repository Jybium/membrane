import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Slider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  InputAdornment,
  Tabs,
  Tab,
} from '@mui/material';
import {
  AddCircle,
  CancelOutlined,
  Science,
  People,
  LocalHospital,
  Search,
  CheckCircle,
  ContentCopy,
  TrendingUp,
  Code,
  Tune,
  LibraryBooks,
  AutoAwesome,
} from '@mui/icons-material';
import { useMembrane, ICD10_DICTIONARY } from '../contexts/MembraneContext';

const QUICK_DISEASE_PRESETS = [
  { code: 'E11', label: 'Diabetes T2', category: 'Endocrine' },
  { code: 'I10', label: 'Hypertension', category: 'Cardiology' },
  { code: 'J45', label: 'Severe Asthma', category: 'Respiratory' },
  { code: 'C34', label: 'Lung Carcinoma', category: 'Oncology' },
  { code: 'G43', label: 'Migraine', category: 'Neurology' },
];

export const ResearchLabView: React.FC = () => {
  const { activeTrials, inactiveTrials, createTrial, cancelTrial } = useMembrane();

  const [currentTab, setCurrentTab] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');

  // Create Trial Modal & Tab state
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [diseaseCode, setDiseaseCode] = useState<string>('E11');
  const [customDiseaseCode, setCustomDiseaseCode] = useState<string>('');
  const [ageRange, setAgeRange] = useState<number[]>([35, 70]);
  const [minSampleCount, setMinSampleCount] = useState<number>(15);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const selectedCode = diseaseCode === 'CUSTOM' ? customDiseaseCode.toUpperCase() : diseaseCode;
  const selectedDiseaseName = ICD10_DICTIONARY[selectedCode] || (selectedCode ? `Condition (${selectedCode})` : '');

  const handleCreateTrial = async () => {
    if (!selectedCode) return;
    setIsSubmitting(true);
    try {
      await createTrial(selectedCode, ageRange[0], ageRange[1], minSampleCount);
      setOpenModal(false);
      setCurrentTab(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelTrial = async (trialIdHex: string) => {
    if (window.confirm('Are you sure you want to deactivate this trial on the Midnight blockchain?')) {
      await cancelTrial(trialIdHex);
    }
  };

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Metrics
  const totalTrials = activeTrials.length + inactiveTrials.length;
  const totalEnrollments = activeTrials.reduce((sum, t) => sum + t.enrolledCount, 0);

  // Filtered Trials
  const filteredActiveTrials = useMemo(() => {
    return activeTrials.filter((t) => {
      const q = searchQuery.toLowerCase();
      return (
        t.diseaseCode.toLowerCase().includes(q) ||
        t.diseaseName.toLowerCase().includes(q) ||
        t.trialIdHex.toLowerCase().includes(q)
      );
    });
  }, [activeTrials, searchQuery]);

  const filteredInactiveTrials = useMemo(() => {
    return inactiveTrials.filter((t) => {
      const q = searchQuery.toLowerCase();
      return (
        t.diseaseCode.toLowerCase().includes(q) ||
        t.diseaseName.toLowerCase().includes(q) ||
        t.trialIdHex.toLowerCase().includes(q)
      );
    });
  }, [inactiveTrials, searchQuery]);

  return (
    <Box sx={{ py: 1 }}>
      {/* Sponsor Studio Sub-Navigation */}
      <Box
        sx={{
          mb: 3,
          background: '#11131a',
          borderRadius: '10px',
          p: 0.6,
          border: '1px solid #1e2230',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5,
          boxShadow: 'none',
        }}
      >
        <Tabs
          value={currentTab}
          onChange={(_, val) => setCurrentTab(val)}
          sx={{
            minHeight: 44,
            '& .MuiTab-root': {
              minHeight: 40,
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.84rem',
              color: '#9ca3af',
              px: 2,
              transition: 'all 0.15s ease',
              '&.Mui-selected': {
                color: '#ffffff',
                background: '#1a1d2b',
                border: '1px solid #2d3348',
              },
            },
            '& .MuiTabs-indicator': { display: 'none' },
          }}
        >
          <Tab
            icon={<LibraryBooks sx={{ fontSize: 16 }} />}
            iconPosition="start"
            label={`Active Protocols (${activeTrials.length})`}
          />
          <Tab icon={<Tune sx={{ fontSize: 16 }} />} iconPosition="start" label="Protocol Designer" />
          <Tab
            icon={<CheckCircle sx={{ fontSize: 16 }} />}
            iconPosition="start"
            label={`Concluded Protocols (${inactiveTrials.length})`}
          />
        </Tabs>

        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={<AddCircle />}
          onClick={() => setOpenModal(true)}
          sx={{
            mr: 0.5,
            px: 2,
            py: 0.8,
            fontWeight: 600,
            borderRadius: '8px',
            boxShadow: 'none !important',
          }}
        >
          Register Trial
        </Button>
      </Box>

      {/* KPI Cards Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <Card sx={{ background: '#11131a', border: '1px solid #1e2230', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2.4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#8b92a5', fontWeight: 600, letterSpacing: '0.04em' }}>
                  ACTIVE PROTOCOLS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: '#818cf8' }}>
                  {activeTrials.length}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.8 }}>
                  <TrendingUp sx={{ fontSize: 13, color: '#10b981' }} />
                  <Typography variant="caption" sx={{ color: '#34d399', fontWeight: 600, fontSize: '0.72rem' }}>
                    Live on Midnight
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  p: 1.2,
                  borderRadius: '8px',
                  background: '#161928',
                  border: '1px solid #23273c',
                }}
              >
                <Science sx={{ color: '#818cf8', fontSize: 22 }} />
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ background: '#11131a', border: '1px solid #1e2230', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2.4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#8b92a5', fontWeight: 600, letterSpacing: '0.04em' }}>
                  HOSPITAL ENROLLMENTS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: '#34d399' }}>
                  {totalEnrollments}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mt: 0.8, fontSize: '0.72rem' }}>
                  Verified cryptographic tags
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.2,
                  borderRadius: '8px',
                  background: '#102219',
                  border: '1px solid #183827',
                }}
              >
                <LocalHospital sx={{ color: '#34d399', fontSize: 22 }} />
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ background: '#11131a', border: '1px solid #1e2230', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2.4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#8b92a5', fontWeight: 600, letterSpacing: '0.04em' }}>
                  TOTAL REGISTERED
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: '#f3f4f6' }}>
                  {totalTrials}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mt: 0.8, fontSize: '0.72rem' }}>
                  {inactiveTrials.length} concluded protocols
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.2,
                  borderRadius: '8px',
                  background: '#161822',
                  border: '1px solid #232738',
                }}
              >
                <People sx={{ color: '#9ca3af', fontSize: 22 }} />
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ background: '#11131a', border: '1px solid #1e2230', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2.4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#8b92a5', fontWeight: 600, letterSpacing: '0.04em' }}>
                  PRIVACY ARCHITECTURE
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.8, color: '#38bdf8' }}>
                  ZK-SNARK
                </Typography>
                <Chip
                  label="Zero PHI Exposure"
                  size="small"
                  sx={{
                    mt: 0.8,
                    background: '#0e1d28',
                    color: '#38bdf8',
                    border: '1px solid #15384e',
                    fontWeight: 600,
                    fontSize: '0.66rem',
                    height: 20,
                  }}
                />
              </Box>
              <Box
                sx={{
                  p: 1.2,
                  borderRadius: '8px',
                  background: '#0e1d28',
                  border: '1px solid #15384e',
                }}
              >
                <AutoAwesome sx={{ color: '#38bdf8', fontSize: 22 }} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* TAB 0: Active Protocols & Recruitment */}
      {currentTab === 0 && (
        <>
          {/* Search & Status Filters Bar */}
          <Card sx={{ p: 1.8, mb: 2.5, background: '#11131a', border: '1px solid #1e2230', boxShadow: 'none' }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: 1.5,
              }}
            >
              <TextField
                size="small"
                placeholder="Search by ICD-10 code, disease name, or trial hash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: '#6b7280', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  minWidth: { xs: '100%', sm: 360 },
                  '& .MuiOutlinedInput-root': {
                    background: '#141722',
                    borderRadius: '8px',
                    borderColor: '#232738',
                  },
                }}
              />

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant={statusFilter === 'active' ? 'contained' : 'outlined'}
                  color="primary"
                  onClick={() => setStatusFilter('active')}
                  sx={{ borderRadius: '8px', fontSize: '0.78rem', boxShadow: 'none !important' }}
                >
                  Active ({activeTrials.length})
                </Button>
                <Button
                  size="small"
                  variant={statusFilter === 'inactive' ? 'contained' : 'outlined'}
                  color="inherit"
                  onClick={() => setStatusFilter('inactive')}
                  sx={{
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    color: '#8b92a5',
                    borderColor: '#232738',
                    boxShadow: 'none !important',
                  }}
                >
                  Concluded ({inactiveTrials.length})
                </Button>
                <Button
                  size="small"
                  variant={statusFilter === 'all' ? 'contained' : 'outlined'}
                  color="inherit"
                  onClick={() => setStatusFilter('all')}
                  sx={{
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    color: '#8b92a5',
                    borderColor: '#232738',
                    boxShadow: 'none !important',
                  }}
                >
                  All ({totalTrials})
                </Button>
              </Box>
            </Box>
          </Card>

          {/* Active Trials Table */}
          {(statusFilter === 'active' || statusFilter === 'all') && (
            <Card sx={{ mb: 3, background: '#11131a', border: '1px solid #1e2230', boxShadow: 'none' }}>
              <Box
                sx={{
                  px: 2.5,
                  py: 1.8,
                  borderBottom: '1px solid #1e2230',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f3f4f6' }}>
                    Active Protocols on Midnight
                  </Typography>
                  <Chip
                    label={`${filteredActiveTrials.length} Registered`}
                    size="small"
                    sx={{
                      background: '#161928',
                      color: '#818cf8',
                      border: '1px solid #23273c',
                      fontWeight: 600,
                      height: 22,
                    }}
                  />
                </Box>
                <Chip
                  icon={<CheckCircle sx={{ fontSize: 13, color: '#10b981 !important' }} />}
                  label="Midnight Ledger State"
                  size="small"
                  sx={{
                    background: '#102219',
                    color: '#34d399',
                    border: '1px solid #183827',
                    fontWeight: 600,
                    height: 22,
                  }}
                />
              </Box>

              <TableContainer>
                <Table>
                  <TableHead sx={{ background: '#0e1017' }}>
                    <TableRow>
                      <TableCell sx={{ color: '#8b92a5', fontWeight: 600, fontSize: '0.74rem' }}>
                        DISEASE (ICD-10)
                      </TableCell>
                      <TableCell sx={{ color: '#8b92a5', fontWeight: 600, fontSize: '0.74rem' }}>
                        TRIAL HASH COMMITMENT
                      </TableCell>
                      <TableCell sx={{ color: '#8b92a5', fontWeight: 600, fontSize: '0.74rem' }}>AGE WINDOW</TableCell>
                      <TableCell sx={{ color: '#8b92a5', fontWeight: 600, fontSize: '0.74rem' }}>
                        MIN PATIENTS
                      </TableCell>
                      <TableCell sx={{ color: '#8b92a5', fontWeight: 600, fontSize: '0.74rem' }}>
                        ENROLLED SITES
                      </TableCell>
                      <TableCell sx={{ color: '#8b92a5', fontWeight: 600, fontSize: '0.74rem' }}>STATUS</TableCell>
                      <TableCell align="right" sx={{ color: '#8b92a5', fontWeight: 600, fontSize: '0.74rem' }}>
                        ACTIONS
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredActiveTrials.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: '#6b7280' }}>
                          No active protocols match your search. Click &quot;Register Trial&quot; to deploy one.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredActiveTrials.map((trial) => (
                        <TableRow key={trial.trialIdHex} hover sx={{ '&:hover': { background: '#141722' } }}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip
                                label={trial.diseaseCode}
                                size="small"
                                sx={{
                                  fontWeight: 700,
                                  background: '#161928',
                                  color: '#a5b4fc',
                                  border: '1px solid #23273c',
                                  height: 22,
                                }}
                              />
                              <Box>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 600, color: '#f3f4f6', fontSize: '0.84rem' }}
                                >
                                  {trial.diseaseName}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                  Created {trial.createdAt || '2026-10-01'}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>

                          <TableCell>
                            <Tooltip title={copiedHash === trial.trialIdHex ? 'Copied!' : 'Click to copy full hash'}>
                              <Box
                                onClick={() => copyToClipboard(trial.trialIdHex)}
                                sx={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 0.6,
                                  cursor: 'pointer',
                                  background: '#141722',
                                  border: '1px solid #232738',
                                  px: 1,
                                  py: 0.3,
                                  borderRadius: '6px',
                                  '&:hover': { borderColor: '#3b425b' },
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{ fontFamily: 'JetBrains Mono, monospace', color: '#38bdf8', fontWeight: 500 }}
                                >
                                  {trial.trialIdHex.substring(0, 10)}...{trial.trialIdHex.slice(-6)}
                                </Typography>
                                <ContentCopy sx={{ fontSize: 12, color: '#6b7280' }} />
                              </Box>
                            </Tooltip>
                          </TableCell>

                          <TableCell>
                            <Box
                              sx={{
                                display: 'inline-block',
                                px: 1,
                                py: 0.2,
                                borderRadius: '4px',
                                background: '#161924',
                                border: '1px solid #232738',
                              }}
                            >
                              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.78rem' }}>
                                {trial.minAge} – {trial.maxAge} yrs
                              </Typography>
                            </Box>
                          </TableCell>

                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#f3f4f6' }}>
                              ≥ {trial.minPatientSampleCount} patients
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Chip
                              icon={<LocalHospital sx={{ fontSize: 13 }} />}
                              label={`${trial.enrolledCount} Hospital${trial.enrolledCount === 1 ? '' : 's'}`}
                              size="small"
                              sx={{
                                background: trial.enrolledCount > 0 ? '#102219' : '#161822',
                                color: trial.enrolledCount > 0 ? '#34d399' : '#8b92a5',
                                border: trial.enrolledCount > 0 ? '1px solid #183827' : '1px solid #232738',
                                fontWeight: 600,
                                height: 22,
                              }}
                            />
                          </TableCell>

                          <TableCell>
                            <Chip
                              label="ACTIVE"
                              size="small"
                              sx={{
                                background: '#102219',
                                color: '#34d399',
                                border: '1px solid #183827',
                                fontSize: '0.64rem',
                                fontWeight: 700,
                                height: 20,
                              }}
                            />
                          </TableCell>

                          <TableCell align="right">
                            <Tooltip title="Deactivate / Cancel Protocol">
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => void handleCancelTrial(trial.trialIdHex)}
                                sx={{
                                  borderRadius: '6px',
                                  '&:hover': { background: '#2d1418' },
                                }}
                              >
                                <CancelOutlined fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}
        </>
      )}

      {/* TAB 1: Protocol Designer */}
      {currentTab === 1 && (
        <Card sx={{ p: 3, mb: 3, background: '#11131a', border: '1px solid #1e2230', boxShadow: 'none' }}>
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#f3f4f6', mb: 0.3 }}>
              Protocol Designer & Compact Circuit Studio
            </Typography>
            <Typography variant="body2" sx={{ color: '#8b92a5', fontSize: '0.84rem' }}>
              Define the cryptographic inclusion boundaries for your clinical trial. Once registered, only hospitals
              whose private EHR meets these bounds can synthesize valid zero-knowledge proofs.
            </Typography>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3.5 }}>
            {/* Left Column: Form Controls */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.8, color: '#f3f4f6', fontSize: '0.82rem' }}>
                Quick Presets
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 2 }}>
                {QUICK_DISEASE_PRESETS.map((preset) => (
                  <Chip
                    key={preset.code}
                    label={`${preset.code} (${preset.label})`}
                    onClick={() => setDiseaseCode(preset.code)}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: '6px',
                      background: diseaseCode === preset.code ? '#1a1d2b' : '#141722',
                      color: diseaseCode === preset.code ? '#a5b4fc' : '#8b92a5',
                      border: diseaseCode === preset.code ? '1px solid #4f46e5' : '1px solid #232738',
                      fontWeight: 600,
                      height: 26,
                    }}
                  />
                ))}
              </Box>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.8, color: '#f3f4f6', fontSize: '0.82rem' }}>
                ICD-10 Diagnosis Classification
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={diseaseCode}
                onChange={(e) => setDiseaseCode(e.target.value)}
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { background: '#141722', borderColor: '#232738' } }}
              >
                {Object.entries(ICD10_DICTIONARY).map(([code, name]) => (
                  <MenuItem key={code} value={code}>
                    <strong>{code}</strong> &nbsp;—&nbsp; {name}
                  </MenuItem>
                ))}
                <MenuItem value="CUSTOM">Custom Diagnosis Code...</MenuItem>
              </TextField>

              {diseaseCode === 'CUSTOM' && (
                <TextField
                  fullWidth
                  size="small"
                  label="Enter Custom ICD-10 Code"
                  placeholder="e.g. M17, N18"
                  value={customDiseaseCode}
                  onChange={(e) => setCustomDiseaseCode(e.target.value)}
                  sx={{ mb: 2, '& .MuiOutlinedInput-root': { background: '#141722' } }}
                />
              )}

              {/* Age Bounds */}
              <Box sx={{ mt: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    Age Qualification Window
                  </Typography>
                  <Chip
                    label={`${ageRange[0]} – ${ageRange[1]} years old`}
                    size="small"
                    sx={{
                      background: '#1a1d2b',
                      color: '#a5b4fc',
                      border: '1px solid #2d3348',
                      fontWeight: 600,
                      height: 22,
                    }}
                  />
                </Box>
                <Slider
                  value={ageRange}
                  onChange={(_, val) => setAgeRange(val)}
                  valueLabelDisplay="auto"
                  min={1}
                  max={95}
                  sx={{ color: '#4f46e5' }}
                />
              </Box>

              {/* Minimum Sample Count */}
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.8, fontSize: '0.82rem' }}>
                  Minimum Patient Cohort Threshold
                </Typography>
                <TextField
                  type="number"
                  fullWidth
                  size="small"
                  value={minSampleCount}
                  onChange={(e) => setMinSampleCount(Math.max(1, parseInt(e.target.value) || 1))}
                  helperText="Participating hospitals must prove cohort size is ≥ this threshold."
                  sx={{ '& .MuiOutlinedInput-root': { background: '#141722' } }}
                />
              </Box>

              <Button
                variant="contained"
                color="primary"
                fullWidth
                startIcon={<AddCircle />}
                onClick={() => void handleCreateTrial()}
                disabled={isSubmitting}
                sx={{
                  py: 1,
                  borderRadius: '8px',
                  fontWeight: 600,
                  boxShadow: 'none !important',
                }}
              >
                {isSubmitting ? 'Registering on Midnight...' : 'Deploy Protocol to Midnight'}
              </Button>
            </Box>

            {/* Right Column: Live Compact Circuit & State Preview */}
            <Box
              sx={{
                background: '#0e1017',
                borderRadius: '8px',
                border: '1px solid #1e2230',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.2 }}>
                <Code sx={{ fontSize: 16, color: '#0ea5e9' }} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#38bdf8', letterSpacing: '0.04em' }}>
                  COMPACT SMART CONTRACT RECORD PREVIEW
                </Typography>
              </Box>

              <Box
                component="pre"
                sx={{
                  background: '#08090d',
                  p: 1.8,
                  borderRadius: '6px',
                  border: '1px solid #1a1c27',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.76rem',
                  color: '#a5b4fc',
                  flexGrow: 1,
                  overflowX: 'auto',
                  m: 0,
                  lineHeight: 1.55,
                }}
              >
                {`// Compact Trial Definition
export struct TrialInfo {
  diseaseCode: "${selectedCode}",
  minAge: ${ageRange[0]},
  maxAge: ${ageRange[1]},
  minPatientSampleCount: ${minSampleCount},
  status: TrialStatus.Active
}

// On-Chain Commitment Hash
trialIdHash = persistentHash(
  "membrane:trial:v1",
  sponsorPublicKey,
  TrialInfo
);`}
              </Box>

              <Box sx={{ mt: 1.5, p: 1.2, borderRadius: '6px', background: '#102219', border: '1px solid #183827' }}>
                <Typography variant="caption" sx={{ color: '#34d399', fontWeight: 600, display: 'block' }}>
                  ✓ Cryptographically Binding Zero-Knowledge Contract
                </Typography>
                <Typography variant="caption" sx={{ color: '#8b92a5', display: 'block', mt: 0.2 }}>
                  Condition: {selectedDiseaseName || selectedCode} • Target: ≥ {minSampleCount} patients
                </Typography>
              </Box>
            </Box>
          </Box>
        </Card>
      )}

      {/* TAB 2: Concluded Protocols */}
      {currentTab === 2 && (
        <Card sx={{ mb: 3, background: '#11131a', border: '1px solid #1e2230', boxShadow: 'none' }}>
          <Box sx={{ px: 2.5, py: 1.8, borderBottom: '1px solid #1e2230' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#8b92a5' }}>
              Concluded Protocols & Archives ({filteredInactiveTrials.length})
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead sx={{ background: '#0e1017' }}>
                <TableRow>
                  <TableCell sx={{ color: '#6b7280' }}>DISEASE</TableCell>
                  <TableCell sx={{ color: '#6b7280' }}>TRIAL HASH</TableCell>
                  <TableCell sx={{ color: '#6b7280' }}>AGE CRITERIA</TableCell>
                  <TableCell sx={{ color: '#6b7280' }}>TOTAL ENROLLED</TableCell>
                  <TableCell sx={{ color: '#6b7280' }}>STATUS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInactiveTrials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, color: '#6b7280' }}>
                      No concluded protocols found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInactiveTrials.map((trial) => (
                    <TableRow key={trial.trialIdHex} sx={{ opacity: 0.65 }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label={trial.diseaseCode} size="small" sx={{ fontWeight: 600, height: 22 }} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {trial.diseaseName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell
                        sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', color: '#8b92a5' }}
                      >
                        {trial.trialIdHex.substring(0, 14)}...
                      </TableCell>
                      <TableCell>
                        {trial.minAge} – {trial.maxAge} yrs
                      </TableCell>
                      <TableCell>{trial.enrolledCount} Hospitals</TableCell>
                      <TableCell>
                        <Chip
                          label="CONCLUDED"
                          size="small"
                          sx={{ background: '#1e2230', color: '#8b92a5', fontSize: '0.68rem', height: 20 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Modal: Quick Register New Trial */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              background: '#11131a',
              border: '1px solid #232738',
              boxShadow: 'none !important',
              borderRadius: '12px',
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: '1.1rem',
            borderBottom: '1px solid #1e2230',
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
            py: 1.8,
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '6px',
              background: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Science sx={{ color: '#fff', fontSize: 18 }} />
          </Box>
          Register Clinical Trial on Midnight
        </DialogTitle>

        <DialogContent sx={{ p: 2.5 }}>
          <Alert
            severity="info"
            sx={{
              mb: 2.5,
              background: '#0e1d28',
              border: '1px solid #15384e',
              color: '#bae6fd',
              borderRadius: '8px',
            }}
          >
            This protocol will be immutably registered on Midnight blockchain. Participating hospitals will evaluate
            candidate cohorts locally and register zero-knowledge proofs.
          </Alert>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.8, color: '#f3f4f6', fontSize: '0.82rem' }}>
                Quick Presets
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 2 }}>
                {QUICK_DISEASE_PRESETS.map((preset) => (
                  <Chip
                    key={preset.code}
                    label={`${preset.code} (${preset.label})`}
                    onClick={() => setDiseaseCode(preset.code)}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: '6px',
                      background: diseaseCode === preset.code ? '#1a1d2b' : '#141722',
                      color: diseaseCode === preset.code ? '#a5b4fc' : '#8b92a5',
                      border: diseaseCode === preset.code ? '1px solid #4f46e5' : '1px solid #232738',
                      fontWeight: 600,
                      height: 26,
                    }}
                  />
                ))}
              </Box>

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.8, color: '#f3f4f6', fontSize: '0.82rem' }}>
                ICD-10 Diagnosis Classification
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={diseaseCode}
                onChange={(e) => setDiseaseCode(e.target.value)}
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { background: '#141722' } }}
              >
                {Object.entries(ICD10_DICTIONARY).map(([code, name]) => (
                  <MenuItem key={code} value={code}>
                    <strong>{code}</strong> &nbsp;—&nbsp; {name}
                  </MenuItem>
                ))}
                <MenuItem value="CUSTOM">Custom Diagnosis Code...</MenuItem>
              </TextField>

              {diseaseCode === 'CUSTOM' && (
                <TextField
                  fullWidth
                  size="small"
                  label="Enter Custom ICD-10 Code"
                  placeholder="e.g. M17, N18"
                  value={customDiseaseCode}
                  onChange={(e) => setCustomDiseaseCode(e.target.value)}
                  sx={{ mb: 2, '& .MuiOutlinedInput-root': { background: '#141722' } }}
                />
              )}

              <Box sx={{ mt: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    Age Qualification Window
                  </Typography>
                  <Chip
                    label={`${ageRange[0]} – ${ageRange[1]} years old`}
                    size="small"
                    sx={{
                      background: '#1a1d2b',
                      color: '#a5b4fc',
                      border: '1px solid #2d3348',
                      fontWeight: 600,
                      height: 22,
                    }}
                  />
                </Box>
                <Slider
                  value={ageRange}
                  onChange={(_, val) => setAgeRange(val)}
                  valueLabelDisplay="auto"
                  min={1}
                  max={95}
                  sx={{ color: '#4f46e5' }}
                />
              </Box>

              <Box sx={{ mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.8, fontSize: '0.82rem' }}>
                  Minimum Patient Cohort Threshold
                </Typography>
                <TextField
                  type="number"
                  fullWidth
                  size="small"
                  value={minSampleCount}
                  onChange={(e) => setMinSampleCount(Math.max(1, parseInt(e.target.value) || 1))}
                  helperText="Hospital ZK proofs must attest that eligible cohort size is ≥ this threshold."
                  sx={{ '& .MuiOutlinedInput-root': { background: '#141722' } }}
                />
              </Box>
            </Box>

            <Box
              sx={{
                background: '#0e1017',
                borderRadius: '8px',
                border: '1px solid #1e2230',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.2 }}>
                <Code sx={{ fontSize: 16, color: '#0ea5e9' }} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#38bdf8', letterSpacing: '0.04em' }}>
                  COMPACT SMART CONTRACT RECORD PREVIEW
                </Typography>
              </Box>

              <Box
                component="pre"
                sx={{
                  background: '#08090d',
                  p: 1.8,
                  borderRadius: '6px',
                  border: '1px solid #1a1c27',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.76rem',
                  color: '#a5b4fc',
                  flexGrow: 1,
                  overflowX: 'auto',
                  m: 0,
                  lineHeight: 1.55,
                }}
              >
                {`// Compact Trial Definition
export struct TrialInfo {
  diseaseCode: "${selectedCode}",
  minAge: ${ageRange[0]},
  maxAge: ${ageRange[1]},
  minPatientSampleCount: ${minSampleCount},
  status: TrialStatus.Active
}

// On-Chain Commitment Hash
trialIdHash = persistentHash(
  "membrane:trial:v1",
  sponsorPublicKey,
  TrialInfo
);`}
              </Box>

              <Box sx={{ mt: 1.5, p: 1.2, borderRadius: '6px', background: '#102219', border: '1px solid #183827' }}>
                <Typography variant="caption" sx={{ color: '#34d399', fontWeight: 600, display: 'block' }}>
                  ✓ Cryptographically Binding Inclusion
                </Typography>
                <Typography variant="caption" sx={{ color: '#8b92a5', display: 'block', mt: 0.2 }}>
                  Target: {selectedDiseaseName || selectedCode} (≥ {minSampleCount} patients)
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: '1px solid #1e2230' }}>
          <Button onClick={() => setOpenModal(false)} color="inherit" size="small" sx={{ color: '#8b92a5' }}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleCreateTrial()}
            variant="contained"
            color="primary"
            size="small"
            disabled={isSubmitting || !selectedCode}
            sx={{ px: 2.5, borderRadius: '8px', fontWeight: 600, boxShadow: 'none !important' }}
          >
            {isSubmitting ? 'Submitting to Midnight...' : 'Deploy to Blockchain'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
