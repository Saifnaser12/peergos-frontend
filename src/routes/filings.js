import { Router } from 'express';

const router = Router();

// Get all filings
router.get('/', (req, res) => {
  const mockFilings = [
    {
      id: 1,
      type: 'VAT',
      period: 'Q4-2024',
      status: 'submitted',
      amount: 2850,
      dueDate: '2025-01-28',
      submittedAt: '2025-01-15T10:30:00Z',
      confirmationNumber: 'VAT-Q4-2024-123456'
    },
    {
      id: 2,
      type: 'CIT',
      period: '2024',
      status: 'pending',
      amount: 63000,
      dueDate: '2025-03-31',
      submittedAt: null,
      confirmationNumber: null
    },
    {
      id: 3,
      type: 'VAT',
      period: 'Q1-2025',
      status: 'draft',
      amount: 3150,
      dueDate: '2025-04-28',
      submittedAt: null,
      confirmationNumber: null
    }
  ];
  
  res.json(mockFilings);
});

// Get filing by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const mockFiling = {
    id: parseInt(id),
    type: 'VAT',
    period: 'Q1-2025',
    status: 'draft',
    amount: 3150,
    dueDate: '2025-04-28',
    details: {
      totalSales: 120000,
      exemptSales: 10000,
      zeroRatedSales: 5000,
      standardRatedSales: 105000,
      outputVAT: 5250,
      inputVAT: 2100,
      netVAT: 3150
    },
    submittedAt: null,
    confirmationNumber: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-15T12:00:00Z'
  };
  
  res.json(mockFiling);
});

// Create new filing
router.post('/', (req, res) => {
  const {
    type,
    period,
    amount,
    dueDate,
    details
  } = req.body;
  
  const newFiling = {
    id: Date.now(),
    type,
    period,
    status: 'draft',
    amount,
    dueDate,
    details,
    submittedAt: null,
    confirmationNumber: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  res.status(201).json({
    success: true,
    filing: newFiling,
    message: 'Filing created successfully'
  });
});

// Update filing
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const updatedFiling = {
    id: parseInt(id),
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    filing: updatedFiling,
    message: 'Filing updated successfully'
  });
});

// Submit filing
router.post('/:id/submit', (req, res) => {
  const { id } = req.params;
  
  const submittedFiling = {
    id: parseInt(id),
    status: 'submitted',
    submittedAt: new Date().toISOString(),
    confirmationNumber: `FILING-${id}-${Date.now()}`,
    updatedAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    filing: submittedFiling,
    message: 'Filing submitted successfully'
  });
});

export default router;