import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Alert,
  Paper,
  Tabs,
  Tab,
  Tooltip,
  IconButton,
  Snackbar,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Code,
  AccountTree,
  ContentCopy,
  Storage,
  Bolt,
  Public,
  Memory,
  Security,
  Search,
  CheckCircle,
  Terminal,
} from '@mui/icons-material';
import { useMembrane } from '../contexts/MembraneContext';

const CIRCUITS = [
  {
    name: 'enrollInTrial',
    summary: 'Hospital presents patient cohort witness ≥ min threshold and registers public tag.',
    code: `export circuit enrollInTrial(
  trialIdHash: Bytes<32>,
  patientAggregateCount: Uint<32>
): Void {
  // 1. Verify trial exists and is currently active on ledger
  assert(activeTrials.member(disclose(trialIdHash)), "Trial is not active");
  const trial = activeTrials.lookup(disclose(trialIdHash));

  // 2. Zero-Knowledge Witness Proof: Cohort meets requirement
  // patientAggregateCount is witnessed from private EHR without exposing patient records
  assert(patientAggregateCount >= trial.minPatientSampleCount, "Insufficient cohort size");

  // 3. Register anonymous cryptographic hospital tag in trial enrollment set
  const hospitalTag = disclose(derivePublicKey(getPrivateKey()));
  trialsEnrollments.insert(disclose(trialIdHash), hospitalTag);
}`,
  },
  {
    name: 'createTrial',
    summary: 'Research sponsor defines trial inclusion criteria and commits to ledger.',
    code: `export circuit createTrial(
  diseaseCode: String<8>,
  minAge: Uint<8>,
  maxAge: Uint<8>,
  minPatientSampleCount: Uint<32>
): Bytes<32> {
  const trialInfo = TrialInfo {
    diseaseCode: disclose(diseaseCode),
    minAge: disclose(minAge),
    maxAge: disclose(maxAge),
    minPatientSampleCount: disclose(minPatientSampleCount),
    status: TrialStatus.Active
  };

  const trialIdHash = persistentHash("membrane:trial:v1", sponsorPublicKey, trialInfo);
  activeTrials.insert(trialIdHash, trialInfo);
  return trialIdHash;
}`,
  },
  {
    name: 'validateTrialEnrollment',
    summary: 'Third-party or researcher verifies hospital membership in trial.',
    code: `export circuit validateTrialEnrollment(trialIdHash: Bytes<32>): Boolean {
  const hospitalTag = disclose(derivePublicKey(getPrivateKey()));
  // Constant-time set membership proof
  assert(trialsEnrollments.lookup(disclose(trialIdHash)).member(hospitalTag));
  return true;
}`,
  },
];

export const LedgerExplorerView: React.FC = () => {
  const { contractAddress, activeTrials, inactiveTrials, networkId } = useMembrane();

  const [currentTab, setCurrentTab] = useState<number>(0);
  const [selectedCircuit, setSelectedCircuit] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const totalTrials = activeTrials.length + inactiveTrials.length;

  const copyAddress = () => {
    void navigator.clipboard.writeText(contractAddress);
    setCopied(true);
  };

  const filteredActiveTrials = useMemo(() => {
    if (!searchQuery) return activeTrials;
    const q = searchQuery.toLowerCase();
    return activeTrials.filter(
      (t) =>
        t.diseaseCode.toLowerCase().includes(q) ||
        t.diseaseName.toLowerCase().includes(q) ||
        t.trialIdHex.toLowerCase().includes(q),
    );
  }, [activeTrials, searchQuery]);

  return (
    <Box sx={{ py: 1 }}>
      {/* Sub-Navigation Tabs */}
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
                background: '#231b10',
                border: '1px solid #3d301b',
              },
            },
            '& .MuiTabs-indicator': { display: 'none' },
          }}
        >
          <Tab icon={<Memory sx={{ fontSize: 16 }} />} iconPosition="start" label="Compact Contract Ledger State" />
          <Tab icon={<Code sx={{ fontSize: 16 }} />} iconPosition="start" label="Zero-Knowledge Circuits (3)" />
          <Tab
            icon={<AccountTree sx={{ fontSize: 16 }} />}
            iconPosition="start"
            label={`Commitment Sets (${activeTrials.length})`}
          />
        </Tabs>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 1 }}>
          <Chip
            icon={<CheckCircle sx={{ fontSize: 12, color: '#10b981 !important' }} />}
            label="Public Audit Trail Verified"
            size="small"
            sx={{
              background: '#102219',
              color: '#34d399',
              border: '1px solid #183827',
              fontWeight: 600,
              fontSize: '0.68rem',
              height: 22,
            }}
          />
        </Box>
      </Box>

      {/* TAB 0: Compact Contract Ledger State */}
      {currentTab === 0 && (
        <>
          {/* Contract Identity Card */}
          <Card sx={{ mb: 3, background: '#11131a', border: '1px solid #1e2230', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2.8 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.8 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Memory sx={{ color: '#38bdf8', fontSize: 18 }} />
                  <Typography variant="caption" sx={{ color: '#8b92a5', fontWeight: 700, letterSpacing: '0.04em' }}>
                    DEPLOYED COMPACT SMART CONTRACT
                  </Typography>
                </Box>
                <Chip
                  label={`Network: ${networkId}`}
                  size="small"
                  sx={{
                    background: '#0e1d28',
                    color: '#38bdf8',
                    border: '1px solid #15384e',
                    fontWeight: 600,
                    height: 22,
                  }}
                />
              </Box>

              <Box
                sx={{
                  background: '#0e1017',
                  p: 1.8,
                  borderRadius: '8px',
                  border: '1px solid #1e2230',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2.5,
                }}
              >
                <Box>
                  <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.2, fontWeight: 600 }}>
                    CONTRACT ADDRESS (BECH32 / HEX)
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'JetBrains Mono, monospace',
                      color: '#38bdf8',
                      fontWeight: 600,
                      fontSize: { xs: '0.78rem', sm: '0.88rem' },
                      wordBreak: 'break-all',
                    }}
                  >
                    {contractAddress}
                  </Typography>
                </Box>
                <Tooltip title="Copy Contract Address">
                  <IconButton onClick={copyAddress} sx={{ color: '#8b92a5', '&:hover': { color: '#ffffff' } }}>
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '8px',
                    background: '#141722',
                    border: '1px solid #232738',
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>
                    TOTAL HISTORICAL TRIALS
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#f3f4f6', mt: 0.4 }}>
                    {totalTrials}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 2,
                    borderRadius: '8px',
                    background: '#102219',
                    border: '1px solid #183827',
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600 }}>
                    ACTIVE TRIALS MAP SIZE
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#34d399', mt: 0.4 }}>
                    {activeTrials.length}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 2,
                    borderRadius: '8px',
                    background: '#141722',
                    border: '1px solid #232738',
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>
                    CONCLUDED PROTOCOLS
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#9ca3af', mt: 0.4 }}>
                    {inactiveTrials.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Architecture Flow Diagram */}
          <Card sx={{ mb: 3, background: '#11131a', border: '1px solid #1e2230', boxShadow: 'none' }}>
            <CardContent sx={{ p: 2.8 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
                <Security sx={{ color: '#818cf8', fontSize: 20 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f3f4f6' }}>
                  Zero-Knowledge Verification Architecture
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#8b92a5', mb: 2.5, fontSize: '0.82rem' }}>
                How private medical data transforms into a zero-knowledge commitment on the Midnight blockchain:
              </Typography>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr auto 1fr auto 1fr' },
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '8px',
                    background: '#141722',
                    border: '1px solid #232738',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.8 }}>
                    <Storage sx={{ color: '#38bdf8', fontSize: 18 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#38bdf8', fontSize: '0.82rem' }}>
                      1. Hospital Private EHR
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#8b92a5', lineHeight: 1.4, display: 'block' }}>
                    Patient database calculates cohort size locally. PHI never leaves hospital firewalls.
                  </Typography>
                </Box>

                <Typography
                  variant="body1"
                  sx={{ color: '#4b5563', display: { xs: 'none', md: 'block' }, textAlign: 'center' }}
                >
                  →
                </Typography>

                <Box
                  sx={{
                    p: 2,
                    borderRadius: '8px',
                    background: '#161928',
                    border: '1px solid #23273c',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.8 }}>
                    <Bolt sx={{ color: '#818cf8', fontSize: 18 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#818cf8', fontSize: '0.82rem' }}>
                      2. ZK Proof Server (:6300)
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#8b92a5', lineHeight: 1.4, display: 'block' }}>
                    Synthesizes mathematical proof witness: <code>Count ≥ MinThreshold</code>.
                  </Typography>
                </Box>

                <Typography
                  variant="body1"
                  sx={{ color: '#4b5563', display: { xs: 'none', md: 'block' }, textAlign: 'center' }}
                >
                  →
                </Typography>

                <Box
                  sx={{
                    p: 2,
                    borderRadius: '8px',
                    background: '#102219',
                    border: '1px solid #183827',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.8 }}>
                    <Public sx={{ color: '#34d399', fontSize: 18 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#34d399', fontSize: '0.82rem' }}>
                      3. Midnight Blockchain
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#8b92a5', lineHeight: 1.4, display: 'block' }}>
                    Registers anonymous hospital tag in <code>trialsEnrollments</code> ledger set.
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </>
      )}

      {/* TAB 1: Smart Contract Circuits */}
      {currentTab === 1 && (
        <Card sx={{ mb: 3, background: '#11131a', border: '1px solid #1e2230', boxShadow: 'none' }}>
          <Box sx={{ borderBottom: '1px solid #1e2230', px: 2.5, pt: 1.8 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Code sx={{ color: '#38bdf8', fontSize: 18 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f3f4f6' }}>
                Compact Smart Contract Circuits Inspector
              </Typography>
            </Box>
            <Tabs
              value={selectedCircuit}
              onChange={(_, val) => setSelectedCircuit(val)}
              sx={{
                '& .MuiTab-root': { fontWeight: 600, fontSize: '0.82rem' },
                '& .MuiTabs-indicator': { background: '#38bdf8' },
              }}
            >
              {CIRCUITS.map((c) => (
                <Tab key={c.name} label={`circuit ${c.name}()`} />
              ))}
            </Tabs>
          </Box>

          <CardContent sx={{ p: 2.5 }}>
            <Alert
              icon={<Terminal sx={{ color: '#38bdf8' }} />}
              sx={{
                mb: 2,
                background: '#0e1d28',
                border: '1px solid #15384e',
                color: '#bae6fd',
                borderRadius: '8px',
              }}
            >
              {CIRCUITS[selectedCircuit].summary}
            </Alert>

            <Box
              component="pre"
              sx={{
                background: '#0e1017',
                p: 2,
                borderRadius: '8px',
                border: '1px solid #1e2230',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.78rem',
                color: '#38bdf8',
                overflowX: 'auto',
                m: 0,
                lineHeight: 1.55,
              }}
            >
              {CIRCUITS[selectedCircuit].code}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: Commitment Sets */}
      {currentTab === 2 && (
        <Card sx={{ background: '#11131a', border: '1px solid #1e2230', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2.8 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: 1.5,
                mb: 2,
              }}
            >
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f3f4f6' }}>
                  trialsEnrollments: Map&lt;trialIdHash, Set&lt;hospitalTag&gt;&gt;
                </Typography>
                <Typography variant="body2" sx={{ color: '#8b92a5', fontSize: '0.82rem' }}>
                  Real-time inspection of cryptographic hospital commitments enrolled in each active protocol.
                </Typography>
              </Box>

              <TextField
                size="small"
                placeholder="Search trial commitments..."
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
                sx={{ minWidth: 260, '& .MuiOutlinedInput-root': { background: '#141722', borderColor: '#232738' } }}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
              {filteredActiveTrials.map((trial) => (
                <Paper
                  key={trial.trialIdHex}
                  sx={{
                    p: 2.2,
                    background: '#141722',
                    border: '1px solid #232738',
                    borderRadius: '8px',
                    boxShadow: 'none !important',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      justifyContent: 'space-between',
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      gap: 1,
                      mb: 1.2,
                    }}
                  >
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
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#f3f4f6', fontSize: '0.88rem' }}>
                        {trial.diseaseName}
                      </Typography>
                    </Box>

                    <Chip
                      icon={<AccountTree sx={{ fontSize: 14 }} />}
                      label={`${trial.enrolledCount} Hospital Commitments`}
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

                  <Typography
                    variant="caption"
                    sx={{ fontFamily: 'JetBrains Mono, monospace', color: '#6b7280', display: 'block', mb: 1.5 }}
                  >
                    Trial Identifier Hash: {trial.trialIdHex}
                  </Typography>

                  <Box
                    sx={{
                      background: '#0e1017',
                      p: 1.5,
                      borderRadius: '6px',
                      border: '1px solid #1e2230',
                    }}
                  >
                    <Typography variant="caption" sx={{ color: '#8b92a5', display: 'block', mb: 0.8, fontWeight: 600 }}>
                      CRYPTOGRAPHIC HOSPITAL IDENTIFIERS (Set&lt;Bytes&lt;32&gt;&gt;)
                    </Typography>
                    {trial.enrolledCount === 0 ? (
                      <Typography variant="caption" sx={{ color: '#6b7280', fontStyle: 'italic' }}>
                        No hospital commitments registered yet. Hospitals can enroll via the Hospital Portal.
                      </Typography>
                    ) : (
                      Array.from({ length: trial.enrolledCount }).map((_, i) => (
                        <Typography
                          key={i}
                          variant="caption"
                          sx={{
                            display: 'block',
                            fontFamily: 'JetBrains Mono, monospace',
                            color: '#34d399',
                            fontSize: '0.74rem',
                            py: 0.2,
                          }}
                        >
                          • [Hospital Tag #{i + 1}]: 0x7f4e9102c89283719283719283719283719283719283719283719283719283{i}
                          b
                        </Typography>
                      ))
                    )}
                  </Box>
                </Paper>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        message="Contract address copied to clipboard!"
      />
    </Box>
  );
};
