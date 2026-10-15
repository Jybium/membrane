import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Pagination,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import { Lock, VerifiedUser, Search, Security, People, MedicalServices, ContentCopy } from '@mui/icons-material';
import { MembraneBackendService, type PatientDto } from '../services/membraneBackendService';
import { ICD10_DICTIONARY } from '../contexts/MembraneContext';

export const HospitalEhrView: React.FC = () => {
  const [patients, setPatients] = useState<PatientDto[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [filterCode, setFilterCode] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await MembraneBackendService.getHospitalPatients(page, 15, filterCode || undefined);
      setPatients(res.data);
      setTotalItems(res.meta?.totalItems ?? res.data.length);
      setTotalPages(res.meta?.totalPages ?? 1);
    } finally {
      setIsLoading(false);
    }
  }, [page, filterCode]);

  useEffect(() => {
    void fetchPatients();
  }, [fetchPatients]);

  const copyPatientId = (id: string) => {
    void navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredPatients = useMemo(() => {
    if (!searchQuery) return patients;
    const q = searchQuery.toLowerCase();
    return patients.filter(
      (p) =>
        (p.patientId || '').toLowerCase().includes(q) ||
        (p.firstName || '').toLowerCase().includes(q) ||
        (p.lastName || '').toLowerCase().includes(q) ||
        (p.diseaseCode || '').toLowerCase().includes(q),
    );
  }, [patients, searchQuery]);

  return (
    <Box sx={{ py: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#f3f4f6', mb: 0.3 }}>
          Institutional Electronic Health Records (EHR) Vault
        </Typography>
        <Typography variant="body2" sx={{ color: '#8b92a5', fontSize: '0.84rem' }}>
          Simulated institutional patient database. This repository is air-gapped and strictly private to the healthcare
          facility.
        </Typography>
      </Box>

      {/* Security Banner */}
      <Alert
        icon={<Lock sx={{ color: '#10b981' }} />}
        sx={{
          mb: 3,
          background: '#0f1f18',
          border: '1px solid #1a3b2b',
          color: '#d1fae5',
          borderRadius: '10px',
          p: 1.8,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.4 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#34d399', fontSize: '0.84rem' }}>
            Zero External Exposure Guarantee (HIPAA Compliant Sandbox)
          </Typography>
          <Chip
            label="100% On-Premise"
            size="small"
            sx={{
              height: 18,
              fontSize: '0.62rem',
              background: '#122e20',
              color: '#34d399',
              border: '1px solid #1d4833',
            }}
          />
        </Box>
        <Typography variant="body2" sx={{ color: '#cbd5e1', lineHeight: 1.55, fontSize: '0.82rem' }}>
          Patient names, institutional medical IDs, and individual histories never leave this hospital boundary. When
          participating in a clinical trial, the local Midnight proof server (:6300) runs a zero-knowledge circuit
          witness locally to prove eligibility without leaking records.
        </Typography>
      </Alert>

      {/* EHR Stat Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <Card sx={{ background: '#11131a', border: '1px solid #1e2230', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2.2, display: 'flex', alignItems: 'center', gap: 1.8 }}>
            <Box
              sx={{
                p: 1.2,
                borderRadius: '8px',
                background: '#102219',
                border: '1px solid #183827',
              }}
            >
              <People sx={{ color: '#34d399', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#8b92a5', fontWeight: 600 }}>
                CONSENTED PATIENTS
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#f3f4f6', mt: 0.2 }}>
                {totalItems} Records
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ background: '#11131a', border: '1px solid #1e2230', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2.2, display: 'flex', alignItems: 'center', gap: 1.8 }}>
            <Box
              sx={{
                p: 1.2,
                borderRadius: '8px',
                background: '#161928',
                border: '1px solid #23273c',
              }}
            >
              <MedicalServices sx={{ color: '#818cf8', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#8b92a5', fontWeight: 600 }}>
                DISEASE COVERAGE
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#f3f4f6', mt: 0.2 }}>
                14 Diagnoses
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ background: '#11131a', border: '1px solid #1e2230', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2.2, display: 'flex', alignItems: 'center', gap: 1.8 }}>
            <Box
              sx={{
                p: 1.2,
                borderRadius: '8px',
                background: '#0e1d28',
                border: '1px solid #15384e',
              }}
            >
              <Security sx={{ color: '#38bdf8', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#8b92a5', fontWeight: 600 }}>
                AIR-GAP INTEGRITY
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#38bdf8', mt: 0.2 }}>
                0 Leakage
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Filter and Search Bar */}
      <Card sx={{ p: 1.8, mb: 2.5, background: '#11131a', border: '1px solid #1e2230', boxShadow: 'none' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'stretch', md: 'center' },
            justifyContent: 'space-between',
            gap: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, flexGrow: 1 }}>
            <TextField
              size="small"
              placeholder="Search by patient ID or name..."
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

            <TextField
              select
              size="small"
              label="Filter by Diagnosis"
              value={filterCode}
              onChange={(e) => {
                setFilterCode(e.target.value);
                setPage(1);
              }}
              sx={{ minWidth: 240, '& .MuiOutlinedInput-root': { background: '#141722', borderColor: '#232738' } }}
            >
              <MenuItem value="">All Diagnosis Codes</MenuItem>
              {Object.entries(ICD10_DICTIONARY).map(([code, name]) => (
                <MenuItem key={code} value={code}>
                  <strong>{code}</strong> &nbsp;—&nbsp; {name}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Chip
            icon={<VerifiedUser sx={{ fontSize: 14, color: '#10b981 !important' }} />}
            label={`Matching Patients: ${filteredPatients.length}`}
            color="success"
            variant="outlined"
            sx={{ fontWeight: 600, borderColor: '#1a3b2b', height: 26 }}
          />
        </Box>
      </Card>

      {/* Patients Table */}
      <Card sx={{ background: '#11131a', border: '1px solid #1e2230', boxShadow: 'none' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ background: '#0e1017' }}>
              <TableRow>
                <TableCell sx={{ color: '#8b92a5', fontWeight: 600, fontSize: '0.74rem' }}>PATIENT ID</TableCell>
                <TableCell sx={{ color: '#8b92a5', fontWeight: 600, fontSize: '0.74rem' }}>FULL NAME</TableCell>
                <TableCell sx={{ color: '#8b92a5', fontWeight: 600, fontSize: '0.74rem' }}>AGE</TableCell>
                <TableCell sx={{ color: '#8b92a5', fontWeight: 600, fontSize: '0.74rem' }}>
                  DIAGNOSIS (ICD-10)
                </TableCell>
                <TableCell sx={{ color: '#8b92a5', fontWeight: 600, fontSize: '0.74rem' }}>RECORD DATE</TableCell>
                <TableCell sx={{ color: '#8b92a5', fontWeight: 600, fontSize: '0.74rem' }}>CONSENT STATUS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 5 }}>
                    <CircularProgress size={30} sx={{ color: '#4f46e5' }} />
                  </TableCell>
                </TableRow>
              ) : filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: '#6b7280' }}>
                    No matching patient records found in EHR vault.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((p) => (
                  <TableRow key={p.id} hover sx={{ '&:hover': { background: '#141722' } }}>
                    <TableCell>
                      <Tooltip title={copiedId === p.patientId ? 'Copied!' : 'Click to copy ID'}>
                        <Box
                          onClick={() => p.patientId && copyPatientId(p.patientId)}
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.6,
                            cursor: 'pointer',
                            background: '#141722',
                            border: '1px solid #232738',
                            px: 0.8,
                            py: 0.2,
                            borderRadius: '4px',
                            '&:hover': { borderColor: '#3b425b' },
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{ fontFamily: 'JetBrains Mono, monospace', color: '#38bdf8', fontWeight: 600 }}
                          >
                            {p.patientId}
                          </Typography>
                          <ContentCopy sx={{ fontSize: 11, color: '#6b7280' }} />
                        </Box>
                      </Tooltip>
                    </TableCell>

                    <TableCell sx={{ fontWeight: 600, color: '#f3f4f6', fontSize: '0.84rem' }}>
                      {p.firstName} {p.lastName}
                    </TableCell>

                    <TableCell>
                      <Box
                        sx={{
                          display: 'inline-block',
                          px: 0.8,
                          py: 0.2,
                          borderRadius: '4px',
                          background: '#161924',
                          fontWeight: 600,
                          fontSize: '0.78rem',
                        }}
                      >
                        {p.age} yrs
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <Chip
                          label={p.diseaseCode}
                          size="small"
                          sx={{
                            background: '#161928',
                            color: '#a5b4fc',
                            border: '1px solid #23273c',
                            fontWeight: 600,
                            height: 22,
                          }}
                        />
                        <Typography variant="caption" sx={{ color: '#8b92a5' }}>
                          {ICD10_DICTIONARY[p.diseaseCode] || p.diseaseCode}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell sx={{ color: '#6b7280', fontSize: '0.78rem' }}>{p.createdAt || '2026-09-15'}</TableCell>

                    <TableCell>
                      <Chip
                        icon={<VerifiedUser sx={{ fontSize: 12, color: '#10b981 !important' }} />}
                        label="CONSENT ACTIVE"
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
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {totalPages > 1 && (
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', borderTop: '1px solid #1e2230' }}>
            <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" size="small" />
          </Box>
        )}
      </Card>
    </Box>
  );
};
