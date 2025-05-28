// LC Document Discrepancy Detection System - Frontend Code Sample

import React, { useState, useEffect } from 'react';
import { 
  Container, Box, Typography, Paper, Grid, Button, 
  TextField, CircularProgress, Tabs, Tab, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, Accordion, AccordionSummary, AccordionDetails,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import axios from 'axios';

// Mock API service for demonstration
const api = {
  uploadDocument: async (file, documentType) => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: `doc-${Math.floor(Math.random() * 10000)}`,
          name: file.name,
          type: documentType,
          status: 'processed',
          uploadDate: new Date().toISOString()
        });
      }, 1500);
    });
  },
  
  getDocuments: async () => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 'doc-1234',
            name: 'MT700_LC123456.txt',
            type: 'mt700',
            status: 'processed',
            uploadDate: '2025-05-28T10:30:00Z'
          },
          {
            id: 'doc-5678',
            name: 'Commercial_Invoice_INV2025001.pdf',
            type: 'commercial_invoice',
            status: 'processed',
            uploadDate: '2025-05-28T10:35:00Z'
          },
          {
            id: 'doc-9012',
            name: 'BL_2025123456.pdf',
            type: 'bill_of_lading',
            status: 'processed',
            uploadDate: '2025-05-28T10:40:00Z'
          }
        ]);
      }, 1000);
    });
  },
  
  getDiscrepancies: async () => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 'disc-001',
            type: 'data_inconsistency',
            field: 'description_of_goods',
            documents: ['commercial_invoice', 'mt700'],
            values: {
              commercial_invoice: '100 units of Model X Widgets',
              mt700: '100 units of Model X Machines'
            },
            ucp_reference: 'article_14d',
            severity: 'high',
            description: 'Description of goods differs between Commercial Invoice and MT700',
            rule_explanation: 'Data in a document, when read in context with the credit, the document itself and international standard banking practice, need not be identical to, but must not conflict with, data in that document, any other stipulated document or the credit.',
            advice: 'Ensure descriptions are consistent or use more general terms in documents other than the commercial invoice.'
          },
          {
            id: 'disc-002',
            type: 'quantitative_discrepancy',
            field: 'amount',
            documents: ['commercial_invoice', 'mt700'],
            values: {
              commercial_invoice: 50000,
              mt700: 45000
            },
            ucp_reference: 'article_18b',
            severity: 'high',
            description: 'Invoice amount (50000) exceeds credit amount (45000)',
            rule_explanation: 'A nominated bank acting on its nomination, a confirming bank, if any, or the issuing bank may accept a commercial invoice issued for an amount in excess of the amount permitted by the credit, and its decision will be binding upon all parties, provided the bank in question has not honoured or negotiated for an amount in excess of that permitted by the credit.',
            advice: 'Check if the nominated bank is willing to accept the invoice with an amount exceeding the credit amount.'
          },
          {
            id: 'disc-003',
            type: 'contextual_violation',
            field: 'shipping_date',
            documents: ['bill_of_lading', 'mt700'],
            values: {
              bill_of_lading: '2025-05-20',
              mt700: '2025-05-18'
            },
            ucp_reference: 'article_14c',
            severity: 'critical',
            description: 'Shipping date (2025-05-20) is after LC expiry date (2025-05-18)',
            rule_explanation: 'A presentation including one or more original transport documents must be made not later than 21 calendar days after the date of shipment, but in any event not later than the expiry date of the credit.',
            advice: 'Request amendment to the LC to extend the expiry date or consider requesting a new LC.'
          }
        ]);
      }, 1200);
    });
  },
  
  getDocumentDetails: async (documentId) => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        if (documentId === 'doc-1234') {
          resolve({
            id: 'doc-1234',
            name: 'MT700_LC123456.txt',
            type: 'mt700',
            status: 'processed',
            uploadDate: '2025-05-28T10:30:00Z',
            fields: {
              '27': '1/1',
              '40A': 'IRREVOCABLE',
              '20': 'LC123456789',
              '31D': '250518',
              '50': 'XYZ Imports Ltd.',
              '59': 'ABC Trading Co.',
              '32B': 'USD45000,00',
              '39A': '5PCT',
              '41D': 'BY NEGOTIATION',
              '42C': 'AT SIGHT',
              '42D': 'CITIBANK NY',
              '43P': 'NOT ALLOWED',
              '44A': 'SHANGHAI/CHINA',
              '44B': 'NEW YORK/USA',
              '45A': '100 units of Model X Machines'
            }
          });
        } else if (documentId === 'doc-5678') {
          resolve({
            id: 'doc-5678',
            name: 'Commercial_Invoice_INV2025001.pdf',
            type: 'commercial_invoice',
            status: 'processed',
            uploadDate: '2025-05-28T10:35:00Z',
            fields: {
              'invoice_number': 'INV-2025-001',
              'date': '2025-05-15',
              'applicant': 'XYZ Imports Ltd.',
              'beneficiary': 'ABC Trading Co.',
              'currency': 'USD',
              'amount': '50000.00',
              'description_of_goods': '100 units of Model X Widgets',
              'shipment_terms': 'CIF New York',
              'payment_terms': '30 days'
            }
          });
        } else if (documentId === 'doc-9012') {
          resolve({
            id: 'doc-9012',
            name: 'BL_2025123456.pdf',
            type: 'bill_of_lading',
            status: 'processed',
            uploadDate: '2025-05-28T10:40:00Z',
            fields: {
              'bl_number': 'BL-2025-123456',
              'carrier': 'Ocean Shipping Co.',
              'vessel_name': 'Pacific Star',
              'port_of_loading': 'Shanghai',
              'port_of_discharge': 'New York',
              'shipper': 'ABC Trading Co.',
              'consignee': 'XYZ Imports Ltd.',
              'description_of_goods': '100 units of Model X Widgets',
              'shipping_date': '2025-05-20',
              'notify_party': 'XYZ Imports Ltd.',
              'freight_terms': 'Prepaid'
            }
          });
        } else {
          resolve({
            error: 'Document not found'
          });
        }
      }, 800);
    });
  }
};

// Main App Component
function App() {
  const [activeTab, setActiveTab] = useState(0);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          LC Document Discrepancy Detection System
        </Typography>
        
        <Paper sx={{ width: '100%', mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="Dashboard" />
            <Tab label="Document Management" />
            <Tab label="Discrepancy Analysis" />
            <Tab label="Reports" />
          </Tabs>
          
          <Box p={3}>
            {activeTab === 0 && <Dashboard />}
            {activeTab === 1 && <DocumentManagement />}
            {activeTab === 2 && <DiscrepancyAnalysis />}
            {activeTab === 3 && <Reports />}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

// Dashboard Component
function Dashboard() {
  const [stats, setStats] = useState({
    documentsProcessed: 0,
    discrepanciesFound: 0,
    criticalDiscrepancies: 0,
    pendingReview: 0
  });
  
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading dashboard data
    const fetchData = async () => {
      try {
        const documents = await api.getDocuments();
        const discrepancies = await api.getDiscrepancies();
        
        setStats({
          documentsProcessed: documents.length,
          discrepanciesFound: discrepancies.length,
          criticalDiscrepancies: discrepancies.filter(d => d.severity === 'critical').length,
          pendingReview: discrepancies.length
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h5" gutterBottom>Dashboard</Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Typography variant="h6" color="textSecondary">Documents Processed</Typography>
            <Typography variant="h3">{stats.documentsProcessed}</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Typography variant="h6" color="textSecondary">Discrepancies Found</Typography>
            <Typography variant="h3">{stats.discrepanciesFound}</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%', bgcolor: stats.criticalDiscrepancies > 0 ? '#ffebee' : 'inherit' }}>
            <Typography variant="h6" color="error">Critical Discrepancies</Typography>
            <Typography variant="h3" color={stats.criticalDiscrepancies > 0 ? 'error' : 'inherit'}>
              {stats.criticalDiscrepancies}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
            <Typography variant="h6" color="textSecondary">Pending Review</Typography>
            <Typography variant="h3">{stats.pendingReview}</Typography>
          </Paper>
        </Grid>
      </Grid>
      
      <Typography variant="h6" gutterBottom>Recent Activity</Typography>
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date/Time</TableCell>
                <TableCell>Activity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>User</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>2025-05-28 10:40:00</TableCell>
                <TableCell>Document Upload: BL_2025123456.pdf</TableCell>
                <TableCell>
                  <Chip label="Processed" color="success" size="small" />
                </TableCell>
                <TableCell>John Smith</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>2025-05-28 10:35:00</TableCell>
                <TableCell>Document Upload: Commercial_Invoice_INV2025001.pdf</TableCell>
                <TableCell>
                  <Chip label="Processed" color="success" size="small" />
                </TableCell>
                <TableCell>John Smith</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>2025-05-28 10:30:00</TableCell>
                <TableCell>Document Upload: MT700_LC123456.txt</TableCell>
                <TableCell>
                  <Chip label="Processed" color="success" size="small" />
                </TableCell>
                <TableCell>John Smith</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>2025-05-28 10:45:00</TableCell>
                <TableCell>Discrepancy Analysis: LC123456</TableCell>
                <TableCell>
                  <Chip label="Completed" color="primary" size="small" />
                </TableCell>
                <TableCell>System</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

// Document Management Component
function DocumentManagement() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentDetails, setDocumentDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const data = await api.getDocuments();
        setDocuments(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching documents:', error);
        setLoading(false);
      }
    };
    
    fetchDocuments();
  }, []);
  
  const handleUploadDialogOpen = () => {
    setUploadDialogOpen(true);
  };
  
  const handleUploadDialogClose = () => {
    setUploadDialogOpen(false);
    setSelectedFile(null);
    setDocumentType('');
  };
  
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };
  
  const handleDocumentTypeChange = (event) => {
    setDocumentType(event.target.value);
  };
  
  const handleUpload = async () => {
    if (!selectedFile || !documentType) return;
    
    setUploading(true);
    
    try {
      const uploadedDocument = await api.uploadDocument(selectedFile, documentType);
      setDocuments([uploadedDocument, ...documents]);
      handleUploadDialogClose();
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setUploading(false);
    }
  };
  
  const handleViewDocument = async (documentId) => {
    setSelectedDocument(documentId);
    setDetailsLoading(true);
    
    try {
      const details = await api.getDocumentDetails(documentId);
      setDocumentDetails(details);
      setDetailsLoading(false);
    } catch (error) {
      console.error('Error fetching document details:', error);
      setDetailsLoading(false);
    }
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Document Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<CloudUploadIcon />}
          onClick={handleUploadDialogOpen}
        >
          Upload Document
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={selectedDocument ? 6 : 12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Document Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Upload Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.map((document) => (
                  <TableRow 
                    key={document.id}
                    selected={document.id === selectedDocument}
                    hover
                  >
                    <TableCell>{document.name}</TableCell>
                    <TableCell>
                      <Chip 
                        label={document.type.replace('_', ' ').toUpperCase()} 
                        color={
                          document.type === 'mt700' ? 'primary' :
                          document.type === 'commercial_invoice' ? 'secondary' :
                          'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(document.uploadDate).toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip 
                        label={document.status} 
                        color={document.status === 'processed' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => handleViewDocument(document.id)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        
        {selectedDocument && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Document Details</Typography>
              
              {detailsLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                  <CircularProgress />
                </Box>
              ) : documentDetails ? (
                <Box>
                  <Typography variant="subtitle1">
                    {documentDetails.name} ({documentDetails.type.replace('_', ' ').toUpperCase()})
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Uploaded on {new Date(documentDetails.uploadDate).toLocaleString()}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>Extracted Fields:</Typography>
                  
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Field</TableCell>
                          <TableCell>Value</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {documentDetails.fields && Object.entries(documentDetails.fields).map(([field, value]) => (
                          <TableRow key={field}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {field}
                              </Typography>
                            </TableCell>
                            <TableCell>{value}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ) : (
                <Typography>No document selected</Typography>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>
      
      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={handleUploadDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Document Type</Typography>
            <TextField
              select
              fullWidth
              value={documentType}
              onChange={handleDocumentTypeChange}
              SelectProps={{
                native: true,
              }}
              margin="normal"
              variant="outlined"
            >
              <option value="">Select document type</option>
              <option value="mt700">MT700 - Issue of a Documentary Credit</option>
              <option value="mt710">MT710 - Advice of a Documentary Credit</option>
              <option value="commercial_invoice">Commercial Invoice</option>
              <option value="bill_of_lading">Bill of Lading</option>
              <option value="packing_list">Packing List</option>
              <option value="certificate_of_origin">Certificate of Origin</option>
              <option value="insurance_certificate">Insurance Certificate</option>
              <option value="master_document">Master Reference Document</option>
            </TextField>
            
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Select File</Typography>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<CloudUploadIcon />}
              sx={{ py: 1.5, mb: 2 }}
            >
              {selectedFile ? selectedFile.name : 'Choose File'}
              <input
                type="file"
                hidden
                onChange={handleFileChange}
              />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUploadDialogClose}>Cancel</Button>
          <Button 
            onClick={handleUpload} 
            variant="contained" 
            color="primary"
            disabled={!selectedFile || !documentType || uploading}
          >
            {uploading ? <CircularProgress size={24} /> : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Discrepancy Analysis Component
function DiscrepancyAnalysis() {
  const [discrepancies, setDiscrepancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState(null);
  
  useEffect(() => {
    const fetchDiscrepancies = async () => {
      try {
        const data = await api.getDiscrepancies();
        setDiscrepancies(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching discrepancies:', error);
        setLoading(false);
      }
    };
    
    fetchDiscrepancies();
  }, []);
  
  const handleDiscrepancySelect = (discrepancyId) => {
    const discrepancy = discrepancies.find(d => d.id === discrepancyId);
    setSelectedDiscrepancy(discrepancy);
  };
  
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'high':
        return <WarningIcon color="warning" />;
      case 'medium':
        return <InfoIcon color="info" />;
      case 'low':
        return <CheckCircleIcon color="success" />;
      default:
        return <InfoIcon />;
    }
  };
  
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h5" gutterBottom>Discrepancy Analysis</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={selectedDiscrepancy ? 6 : 12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Severity</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Field</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>UCP Reference</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {discrepancies.map((discrepancy) => (
                  <TableRow 
                    key={discrepancy.id}
                    selected={selectedDiscrepancy && selectedDiscrepancy.id === discrepancy.id}
                    hover
                    sx={{
                      bgcolor: discrepancy.severity === 'critical' ? '#ffebee' : 
                              discrepancy.severity === 'high' ? '#fff8e1' : 'inherit'
                    }}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {getSeverityIcon(discrepancy.severity)}
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          {discrepancy.severity.toUpperCase()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{discrepancy.type.replace('_', ' ')}</TableCell>
                    <TableCell>{discrepancy.field}</TableCell>
                    <TableCell>{discrepancy.description}</TableCell>
                    <TableCell>{discrepancy.ucp_reference}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => handleDiscrepancySelect(discrepancy.id)}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        
        {selectedDiscrepancy && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Discrepancy Details</Typography>
              
              <Box sx={{ mb: 2 }}>
                <Chip 
                  icon={getSeverityIcon(selectedDiscrepancy.severity)}
                  label={selectedDiscrepancy.severity.toUpperCase()}
                  color={getSeverityColor(selectedDiscrepancy.severity)}
                  sx={{ mr: 1 }}
                />
                <Chip 
                  label={selectedDiscrepancy.type.replace('_', ' ')}
                  variant="outlined"
                />
              </Box>
              
              <Typography variant="subtitle1" gutterBottom>
                {selectedDiscrepancy.description}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>Field Values:</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Document</TableCell>
                      <TableCell>Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(selectedDiscrepancy.values).map(([document, value]) => (
                      <TableRow key={document}>
                        <TableCell>{document.replace('_', ' ').toUpperCase()}</TableCell>
                        <TableCell>{value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Typography variant="subtitle2" gutterBottom>UCP 600 Reference:</Typography>
              <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
                <Typography variant="body2" gutterBottom>
                  <strong>{selectedDiscrepancy.ucp_reference.toUpperCase()}</strong>
                </Typography>
                <Typography variant="body2">
                  {selectedDiscrepancy.rule_explanation}
                </Typography>
              </Paper>
              
              <Typography variant="subtitle2" gutterBottom>Recommended Action:</Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#e8f5e9' }}>
                <Typography variant="body2">
                  {selectedDiscrepancy.advice}
                </Typography>
              </Paper>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button variant="outlined" color="primary">
                  Mark as Reviewed
                </Button>
                <Button variant="contained" color="primary">
                  Generate Report
                </Button>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

// Reports Component
function Reports() {
  const [reports, setReports] = useState([
    {
      id: 'rep-001',
      title: 'LC123456 Discrepancy Report',
      date: '2025-05-28T11:00:00Z',
      status: 'completed',
      discrepancyCount: 3,
      criticalCount: 1,
      recommendation: 'Reject'
    }
  ]);
  
  return (
    <Box>
      <Typography variant="h5" gutterBottom>Reports</Typography>
      
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Report Title</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Discrepancies</TableCell>
              <TableCell>Critical Issues</TableCell>
              <TableCell>Recommendation</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>{report.title}</TableCell>
                <TableCell>{new Date(report.date).toLocaleString()}</TableCell>
                <TableCell>{report.discrepancyCount}</TableCell>
                <TableCell>
                  <Chip 
                    label={report.criticalCount} 
                    color={report.criticalCount > 0 ? 'error' : 'success'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={report.recommendation} 
                    color={
                      report.recommendation === 'Reject' ? 'error' :
                      report.recommendation === 'Accept with Caution' ? 'warning' :
                      'success'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Button size="small" variant="outlined">View</Button>
                  <Button size="small" sx={{ ml: 1 }}>Export</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Typography variant="h6" gutterBottom>Sample Report Preview</Typography>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>LC123456 Discrepancy Report</Typography>
        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
          Generated on May 28, 2025 at 11:00 AM
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="h6" gutterBottom>Executive Summary</Typography>
        <Typography variant="body1" paragraph>
          Analysis of documents for LC123456 has identified 3 discrepancies (1 Critical, 2 High). 
          The documents are likely to be rejected due to the critical discrepancy related to the shipping date 
          being after the LC expiry date.
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Chip 
            icon={<ErrorIcon />}
            label="RECOMMENDATION: REJECT" 
            color="error"
            sx={{ fontWeight: 'bold' }}
          />
        </Box>
        
        <Typography variant="h6" gutterBottom>Discrepancy Details</Typography>
        
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center">
              <ErrorIcon color="error" sx={{ mr: 1 }} />
              <Typography variant="subtitle1">
                Critical: Shipping date is after LC expiry date
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              The Bill of Lading shows a shipping date of May 20, 2025, which is after the LC expiry date of May 18, 2025.
            </Typography>
            <Typography variant="subtitle2" gutterBottom>UCP 600 Reference:</Typography>
            <Typography variant="body2" paragraph>
              Article 14(c): A presentation including one or more original transport documents must be made not later than 21 calendar days after the date of shipment, but in any event not later than the expiry date of the credit.
            </Typography>
            <Typography variant="subtitle2" gutterBottom>Recommendation:</Typography>
            <Typography variant="body2">
              Request amendment to the LC to extend the expiry date or consider requesting a new LC.
            </Typography>
          </AccordionDetails>
        </Accordion>
        
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center">
              <WarningIcon color="warning" sx={{ mr: 1 }} />
              <Typography variant="subtitle1">
                High: Description of goods differs between documents
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              The Commercial Invoice describes the goods as "100 units of Model X Widgets" while the MT700 describes them as "100 units of Model X Machines".
            </Typography>
            <Typography variant="subtitle2" gutterBottom>UCP 600 Reference:</Typography>
            <Typography variant="body2" paragraph>
              Article 14(d): Data in a document, when read in context with the credit, the document itself and international standard banking practice, need not be identical to, but must not conflict with, data in that document, any other stipulated document or the credit.
            </Typography>
            <Typography variant="subtitle2" gutterBottom>Recommendation:</Typography>
            <Typography variant="body2">
              Ensure descriptions are consistent or use more general terms in documents other than the commercial invoice.
            </Typography>
          </AccordionDetails>
        </Accordion>
        
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center">
              <WarningIcon color="warning" sx={{ mr: 1 }} />
              <Typography variant="subtitle1">
                High: Invoice amount exceeds credit amount
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              The Commercial Invoice shows an amount of USD 50,000.00, which exceeds the credit amount of USD 45,000.00.
            </Typography>
            <Typography variant="subtitle2" gutterBottom>UCP 600 Reference:</Typography>
            <Typography variant="body2" paragraph>
              Article 18(b): A nominated bank acting on its nomination, a confirming bank, if any, or the issuing bank may accept a commercial invoice issued for an amount in excess of the amount permitted by the credit, and its decision will be binding upon all parties, provided the bank in question has not honoured or negotiated for an amount in excess of that permitted by the credit.
            </Typography>
            <Typography variant="subtitle2" gutterBottom>Recommendation:</Typography>
            <Typography variant="body2">
              Check if the nominated bank is willing to accept the invoice with an amount exceeding the credit amount.
            </Typography>
          </AccordionDetails>
        </Accordion>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="outlined" sx={{ mr: 2 }}>
            Export as PDF
          </Button>
          <Button variant="contained" color="primary">
            Send Report
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default App;
