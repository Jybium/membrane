import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Verified,
  HowToReg,
  CheckCircle,
  WarningAmber,
  Security,
  Refresh,
  Lock,
  Search,
  Storage,
  FactCheck,
  TrendingUp,
} from '@mui/icons-material';
import { useMembrane, type TrialItem } from '../contexts/MembraneContext';
import { MembraneBackendService } from '../services/membraneBackendService';
import { HospitalEhrView } from './HospitalEhrView';

interface HospitalEvaluation {
  patientCount: number;
  isEligible: boolean;
  isLoading: boolean;
}

export const HospitalView: React.FC = () => {
  const { activeTrials, enrolledTrialIds, enrollInTrial, verifyEnrollment } = useMembrane();

  const [currentTab, setCurrentTab] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [eligibilityFilter, setEligibilityFilter] = useState<'all' | 'qualified' | 'enrolled'>('all');

  // Local EHR candidate counts per trial: trialIdHex -> evaluation
  const [evaluations, setEvaluations] = useState<Record<string, HospitalEvaluation>>({});
  const [verifyingTrial, setVerifyingTrial] = useState<TrialItem | null>(null);
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
  const [isReevaluating, setIsReevaluating] = useState<boolean>(false);

  // Evaluate each trial against the hospital's local EHR database
  const evaluateTrialCohort = useCallback(async (trial: TrialItem) => {
    setEvaluations((prev) => ({
      ...prev,
      [trial.trialIdHex]: {
        patientCount: prev[trial.trialIdHex]?.patientCount ?? 0,
        isEligible: false,
        isLoading: true,
      },
    }));

    const count = await MembraneBackendService.getPatientRequirementCount(
      trial.diseaseCode,
      trial.minAge,
      trial.maxAge
    );

    setEvaluations((prev) => ({
      ...prev,
      [trial.trialIdHex]: {
        patientCount: count,
        isEligible: count >= trial.minPatientSampleCount,
        isLoading: false,
      },
    }));
  }, []);

  const evaluateAll = useCallback(async () => {
    setIsReevaluating(true);
    try {
      for (const trial of activeTrials) {
        await evaluateTrialCohort(trial);
      }
    } finally {
      setIsReevaluating(false);
    }
  }, [activeTrials, evaluateTrialCohort]);

  useEffect(() => {
    activeTrials.forEach((trial) => {
      if (!evaluations[trial.trialIdHex]) {
        void evaluateTrialCohort(trial);
      }
    });
  }, [activeTrials, evaluateTrialCohort, evaluations]);

  const handleEnroll = async (trial: TrialItem) => {
    const evaluation = evaluations[trial.trialIdHex];
    const aggregateCount = evaluation?.patientCount || trial.minPatientSampleCount;
    await enrollInTrial(trial.trialIdHex, aggregateCount);
  };

  const handleVerify = async (trial: TrialItem) => {
    setVerifyingTrial(trial);
    const result = await verifyEnrollment(trial.trialIdHex);
    setVerificationResult(result);
  };

  // Hospital Metrics
  const qualifiedTrialsCount = useMemo(() => {
    return activeTrials.filter((t) => evaluations[t.trialIdHex]?.isEligible).length;
  }, [activeTrials, evaluations]);

  const enrolledCount = useMemo(() => {
    return activeTrials.filter((t) => enrolledTrialIds.includes(t.trialIdHex)).length;
  }, [activeTrials, enrolledTrialIds]);

  // Filtered Trials
  const filteredTrials = useMemo(() => {
    return activeTrials.filter((trial) => {
      const isEnrolled = enrolledTrialIds.includes(trial.trialIdHex);
      const isEligible = evaluations[trial.trialIdHex]?.isEligible ?? false;

      if (eligibilityFilter === 'qualified' && !isEligible) return false;
      if (eligibilityFilter === 'enrolled' && !isEnrolled) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          trial.diseaseCode.toLowerCase().includes(q) ||
          trial.diseaseName.toLowerCase().includes(q) ||
          trial.trialIdHex.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [activeTrials, enrolledTrialIds, evaluations, eligibilityFilter, searchQuery]);

  return (
    <Box sx={{ py: 1 }}>
      {/* Top Level Hospital Sub-Navigation Tabs */}
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
                background: '#12251c',
                border: '1px solid #1a422d',
              },
            },
            '& .MuiTabs-indicator': { display: 'none' },
          }}
        >
          <Tab
            icon={<FactCheck sx={{ fontSize: 16 }} />}
            iconPosition="start"
            label={`Trial Matching & ZK Enrollment (${activeTrials.length})`}
          />
          <Tab
            icon={<Storage sx={{ fontSize: 16 }} />}
            iconPosition="start"
            label="Institutional EHR Vault (Air-Gapped)"
          />
          <Tab
            icon={<Verified sx={{ fontSize: 16 }} />}
            iconPosition="start"
            label={`Enrolled Protocols (${enrolledCount})`}
          />
        </Tabs>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 1 }}>
          <Chip
            icon={<Lock sx={{ fontSize: 12, color: '#34d399 !important' }} />}
            label="Air-Gapped Institutional Node"
            size="small"
            sx={{
              background: '#0f1f18',
              color: '#34d399',
              border: '1px solid #1a3b2b',
              fontWeight: 600,
              fontSize: '0.68rem',
              height: 22,
            }}
          />
        </Box>
      </Box>

      {/* TAB 0: Trial Matching & ZK Enrollment */}
      {currentTab === 0 && (
        <>
          {/* Hospital KPI Stats Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
              gap: 2,
              mb: 3,
            }}
          >
            <Card sx={{ background: '#11131a', border: '1px solid #1e2230', boxShadow: 'none' }}>
              <CardContent sx={{ p: 2.2 }}>
                <Typography variant="caption" sx={{ color: '#8b92a5', fontWeight: 600, letterSpacing: '0.04em' }}>
                  ACTIVE TRIALS AVAILABLE
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: '#f3f4f6' }}>
                  {activeTrials.length}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mt: 0.8, fontSize: '0.72rem' }}>
                  Published on Midnight Ledger
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ background: '#11131a', border: '1px solid #1e2230', boxShadow: 'none' }}>
              <CardContent sx={{ p: 2.2 }}>
                <Typography variant="caption" sx={{ color: '#8b92a5', fontWeight: 600, letterSpacing: '0.04em' }}>
                  QUALIFIED EHR COHORTS
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: '#34d399' }}>
                  {qualifiedTrialsCount}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.8 }}>
                  <TrendingUp sx={{ fontSize: 13, color: '#10b981' }} />
                  <Typography variant="caption" sx={{ color: '#34d399', fontWeight: 600, fontSize: '0.72rem' }}>
                    Sample threshold met
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ background: '#11131a', border: '1px solid #1e2230', boxShadow: 'none' }}>
              <CardContent sx={{ p: 2.2 }}>
                <Typography variant="caption" sx={{ color: '#8b92a5', fontWeight: 600, letterSpacing: '0.04em' }}>
                  ENROLLED ON-CHAIN
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: '#38bdf8' }}>
                  {enrolledCount}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mt: 0.8, fontSize: '0.72rem' }}>
                  Cryptographic commitments active
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ background: '#11131a', border: '1px solid #1e2230', boxShadow: 'none' }}>
              <CardContent sx={{ p: 2.2 }}>
                <Typography variant="caption" sx={{ color: '#8b92a5', fontWeight: 600, letterSpacing: '0.04em' }}>
                  PHI EXPOSURE RISK
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.6, color: '#10b981' }}>
                  0.00% (ZERO)
                </Typography>
                <Typography variant="caption" sx={{ color: '#34d399', display: 'block', mt: 0.8, fontWeight: 600, fontSize: '0.72rem' }}>
                  HIPAA & GDPR Compliant
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Security Architecture Callout */}
          <Alert
            icon={<Security sx={{ color: '#38bdf8' }} />}
            sx={{
              mb: 3,
              background: '#0e1d28',
              border: '1px solid #15384e',
              color: '#bae6fd',
              borderRadius: '10px',
              p: 1.8,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.4 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#38bdf8', fontSize: '0.84rem' }}>
                Zero-Knowledge Patient Confidentiality Architecture
              </Typography>
              <Chip
                label="Air-Gapped Witness"
                size="small"
                sx={{ height: 18, fontSize: '0.62rem', background: '#142738', color: '#38bdf8', border: '1px solid #1d4666' }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: '#cbd5e1', lineHeight: 1.55, fontSize: '0.82rem' }}>
              Your hospital's internal database calculates candidate cohort size locally. The Midnight Proof Server produces a
              mathematical proof that your cohort meets or exceeds the required threshold (<code>Count ≥ Min Patients</code>). No patient
              names, medical records, or exact cohort numbers are ever broadcast to the blockchain.
            </Typography>
          </Alert>

          {/* Filter & Search Bar */}
          <Card sx={{ p: 1.8, mb: 2.5, background: '#11131a', border: '1px solid #1e2230', boxShadow: 'none' }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'stretch', md: 'center' },
                gap: 1.5,
              }}
            >
              <TextField
                size="small"
                placeholder="Search active trials by ICD-10 code, disease, or hash..."
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
                  minWidth: { xs: '100%', sm: 340 },
                  '& .MuiOutlinedInput-root': { background: '#141722', borderColor: '#232738' },
                }}
              />

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  variant={eligibilityFilter === 'all' ? 'contained' : 'outlined'}
                  color="inherit"
                  onClick={() => setEligibilityFilter('all')}
                  sx={{ borderRadius: '8px', fontSize: '0.78rem', color: eligibilityFilter === 'all' ? '#fff' : '#8b92a5', borderColor: '#232738', boxShadow: 'none !important' }}
                >
                  All Trials ({activeTrials.length})
                </Button>
                <Button
                  size="small"
                  variant={eligibilityFilter === 'qualified' ? 'contained' : 'outlined'}
                  color="success"
                  onClick={() => setEligibilityFilter('qualified')}
                  sx={{ borderRadius: '8px', fontSize: '0.78rem', boxShadow: 'none !important' }}
                >
                  Qualified Cohorts ({qualifiedTrialsCount})
                </Button>
                <Button
                  size="small"
                  variant={eligibilityFilter === 'enrolled' ? 'contained' : 'outlined'}
                  color="primary"
                  onClick={() => setEligibilityFilter('enrolled')}
                  sx={{ borderRadius: '8px', fontSize: '0.78rem', boxShadow: 'none !important' }}
                >
                  Enrolled ({enrolledCount})
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Refresh />}
                  onClick={() => void evaluateAll()}
                  disabled={isReevaluating}
                  sx={{ borderRadius: '8px', borderColor: '#262a3b', color: '#d1d5db', ml: { md: 1 }, boxShadow: 'none !important' }}
                >
                  {isReevaluating ? 'Evaluating...' : 'Re-check EHR'}
                </Button>
              </Box>
            </Box>
          </Card>

          {/* Trial Cards Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
              gap: 2.5,
            }}
          >
            {filteredTrials.map((trial) => {
              const evalState = evaluations[trial.trialIdHex];
              const isEnrolled = enrolledTrialIds.includes(trial.trialIdHex);
              const patientCount = evalState?.patientCount ?? 0;
              const isEligible = evalState?.isEligible ?? false;
              const isLoading = evalState?.isLoading ?? false;
              const percentage = Math.min(100, Math.round((patientCount / trial.minPatientSampleCount) * 100));

              return (
                <Card
                  key={trial.trialIdHex}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#11131a',
                    border: isEnrolled
                      ? '1px solid #059669'
                      : isEligible
                      ? '1px solid #1a3b2b'
                      : '1px solid #1e2230',
                    boxShadow: 'none !important',
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                    {/* Top Bar: Disease Code & Status */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.6 }}>
                          <Chip
                            label={`ICD-10: ${trial.diseaseCode}`}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              background: '#161928',
                              color: '#a5b4fc',
                              border: '1px solid #23273c',
                              height: 22,
                            }}
                          />
                          <Typography variant="caption" sx={{ color: '#6b7280' }}>
                            Threshold: ≥ {trial.minPatientSampleCount} patients
                          </Typography>
                        </Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3, color: '#f3f4f6' }}>
                          {trial.diseaseName}
                        </Typography>
                      </Box>

                      {isEnrolled ? (
                        <Chip
                          icon={<Verified sx={{ fontSize: 14 }} />}
                          label="ENROLLED ON-CHAIN"
                          color="success"
                          sx={{ fontWeight: 700, fontSize: '0.68rem', height: 22 }}
                        />
                      ) : isEligible ? (
                        <Chip
                          label="QUALIFIED"
                          sx={{
                            background: '#102219',
                            color: '#34d399',
                            border: '1px solid #183827',
                            fontWeight: 700,
                            fontSize: '0.68rem',
                            height: 22,
                          }}
                        />
                      ) : (
                        <Chip
                          label="INSUFFICIENT SAMPLE"
                          size="small"
                          sx={{
                            background: '#231b12',
                            color: '#fbbf24',
                            border: '1px solid #3d301b',
                            fontWeight: 600,
                            fontSize: '0.66rem',
                            height: 20,
                          }}
                        />
                      )}
                    </Box>

                    {/* Criteria Details Box */}
                    <Box
                      sx={{
                        background: '#0e1017',
                        borderRadius: '8px',
                        p: 1.6,
                        my: 1.8,
                        border: '1px solid #1e2230',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 1.5,
                      }}
                    >
                      <Box>
                        <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, letterSpacing: '0.04em' }}>
                          AGE QUALIFICATION
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#f3f4f6', mt: 0.2 }}>
                          {trial.minAge} – {trial.maxAge} years old
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, letterSpacing: '0.04em' }}>
                          ENROLLED PARTICIPANTS
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#f3f4f6', mt: 0.2 }}>
                          {trial.enrolledCount} Hospital{trial.enrolledCount === 1 ? '' : 's'} Registered
                        </Typography>
                      </Box>
                    </Box>

                    {/* Local EHR Match Progress */}
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                        <Typography variant="caption" sx={{ color: '#8b92a5', fontWeight: 600 }}>
                          Local Hospital EHR Match:
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            color: isEligible ? '#34d399' : '#fbbf24',
                          }}
                        >
                          {isLoading
                            ? 'Evaluating internal EHR records...'
                            : `${patientCount} matching patients (${percentage}% of threshold)`}
                        </Typography>
                      </Box>

                      {isLoading ? (
                        <LinearProgress sx={{ borderRadius: 2, my: 0.8 }} />
                      ) : (
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{
                            height: 7,
                            borderRadius: 4,
                            background: '#1a1d2b',
                            '& .MuiLinearProgress-bar': {
                              background: isEligible ? '#059669' : '#d97706',
                            },
                          }}
                        />
                      )}
                    </Box>
                  </CardContent>

                  <Divider sx={{ borderColor: '#1e2230' }} />

                  <CardActions sx={{ p: 2, justifyContent: 'space-between', background: '#0e1017' }}>
                    <Tooltip title={trial.trialIdHex}>
                      <Typography variant="caption" sx={{ color: '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}>
                        ID: {trial.trialIdHex.substring(0, 12)}...
                      </Typography>
                    </Tooltip>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {isEnrolled ? (
                        <Button
                          variant="outlined"
                          color="success"
                          size="small"
                          startIcon={<Verified />}
                          onClick={() => void handleVerify(trial)}
                          sx={{ borderRadius: '8px', fontWeight: 600, borderColor: '#10b981', boxShadow: 'none !important' }}
                        >
                          Verify Commitment
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={<HowToReg />}
                          disabled={!isEligible || isLoading}
                          onClick={() => void handleEnroll(trial)}
                          sx={{
                            borderRadius: '8px',
                            fontWeight: 600,
                            px: 2,
                            background: '#059669',
                            boxShadow: 'none !important',
                            '&:hover': { background: '#047857', boxShadow: 'none !important' },
                          }}
                        >
                          Enroll with ZK Proof
                        </Button>
                      )}
                    </Box>
                  </CardActions>
                </Card>
              );
            })}
          </Box>
        </>
      )}

      {/* TAB 1: Institutional EHR Vault (Air-Gapped) */}
      {currentTab === 1 && (
        <Box>
          <HospitalEhrView />
        </Box>
      )}

      {/* TAB 2: Enrolled Protocols */}
      {currentTab === 2 && (
        <Box>
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.3, color: '#f3f4f6' }}>
              Enrolled Clinical Protocols on Midnight
            </Typography>
            <Typography variant="body2" sx={{ color: '#8b92a5', fontSize: '0.84rem' }}>
              These protocols represent clinical trials where this hospital node has mathematically proven compliance and committed an anonymous public identity tag to the Midnight ledger.
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
              gap: 2.5,
            }}
          >
            {activeTrials
              .filter((t) => enrolledTrialIds.includes(t.trialIdHex))
              .map((trial) => (
                <Card
                  key={trial.trialIdHex}
                  sx={{
                    background: '#11131a',
                    border: '1px solid #059669',
                    p: 2.2,
                    boxShadow: 'none !important',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box>
                      <Chip
                        label={trial.diseaseCode}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          background: '#102219',
                          color: '#34d399',
                          border: '1px solid #183827',
                          mb: 0.6,
                          height: 22,
                        }}
                      />
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f3f4f6' }}>
                        {trial.diseaseName}
                      </Typography>
                    </Box>
                    <Chip
                      icon={<CheckCircle sx={{ fontSize: 14 }} />}
                      label="CONFIRMED"
                      color="success"
                      sx={{ fontWeight: 700, height: 22 }}
                    />
                  </Box>

                  <Typography
                    variant="caption"
                    sx={{ fontFamily: 'JetBrains Mono, monospace', color: '#6b7280', display: 'block', mb: 1.8 }}
                  >
                    Commitment Hash: {trial.trialIdHex}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#8b92a5' }}>
                      Window: {trial.minAge} – {trial.maxAge} yrs • Required: ≥ {trial.minPatientSampleCount}
                    </Typography>
                    <Button
                      variant="outlined"
                      color="success"
                      size="small"
                      startIcon={<Verified />}
                      onClick={() => void handleVerify(trial)}
                      sx={{ borderRadius: '8px', fontWeight: 600, borderColor: '#10b981', boxShadow: 'none !important' }}
                    >
                      Verify Membership Proof
                    </Button>
                  </Box>
                </Card>
              ))}
          </Box>
        </Box>
      )}

      {/* Verification Dialog */}
      <Dialog
        open={verifyingTrial !== null}
        onClose={() => setVerifyingTrial(null)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              background: '#11131a',
              border: '1px solid #262a3b',
              boxShadow: 'none !important',
              borderRadius: '12px',
              p: 1,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', borderBottom: '1px solid #1e2230' }}>
          Cryptographic Proof Verification
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: '#1e2230' }}>
          {verificationResult === true ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: '#102219',
                  border: '1px solid #183827',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 1.8,
                }}
              >
                <CheckCircle sx={{ color: '#10b981', fontSize: 36 }} />
              </Box>

              <Typography variant="h6" sx={{ fontWeight: 700, color: '#34d399', mb: 0.8 }}>
                Proof Verified On-Chain!
              </Typography>
              <Typography variant="body2" sx={{ color: '#8b92a5', mb: 2.5, maxWidth: '440px', mx: 'auto', fontSize: '0.82rem' }}>
                Your hospital cryptographic public identity tag is permanently registered in the trial's enrollment set on
                the Midnight blockchain.
              </Typography>

              <Box
                sx={{
                  background: '#0e1017',
                  borderRadius: '8px',
                  p: 1.8,
                  textAlign: 'left',
                  border: '1px solid #1e2230',
                }}
              >
                <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 700, display: 'block', mb: 0.4 }}>
                  VERIFIED MEMBERSHIP WITNESS
                </Typography>
                <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono, monospace', color: '#38bdf8', display: 'block' }}>
                  trialsEnrollments.lookup(trialId).member(hospitalTag) === true
                </Typography>
                <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600, display: 'block', mt: 0.6 }}>
                  ✓ In-Person Clinical Trial Protocol Authorized
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <WarningAmber sx={{ color: '#f59e0b', fontSize: 48, mb: 1.2 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#fbbf24', mb: 0.8 }}>
                Not Found in Enrollment Set
              </Typography>
              <Typography variant="body2" sx={{ color: '#8b92a5', fontSize: '0.82rem' }}>
                This hospital identity tag is not currently registered in the trial's on-chain enrollment registry.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 1.5 }}>
          <Button onClick={() => setVerifyingTrial(null)} color="primary" variant="contained" size="small" sx={{ px: 2.5, borderRadius: '8px', boxShadow: 'none !important' }}>
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
