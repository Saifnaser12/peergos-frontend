import { Router } from 'express';

const router = Router();

// Mock chart of accounts data
const mockChartOfAccounts = [
  { id: 1, code: '1000', name: 'Cash', vatCode: 'STD', citDeductible: true, qualifiesForQFZP: true },
  { id: 2, code: '1100', name: 'Accounts Receivable', vatCode: 'STD', citDeductible: true, qualifiesForQFZP: true },
  { id: 3, code: '1200', name: 'Inventory', vatCode: 'STD', citDeductible: true, qualifiesForQFZP: true },
  { id: 4, code: '2000', name: 'Accounts Payable', vatCode: 'STD', citDeductible: false, qualifiesForQFZP: true },
  { id: 5, code: '3000', name: 'Owner Equity', vatCode: 'EXM', citDeductible: false, qualifiesForQFZP: false },
  { id: 6, code: '4000', name: 'Sales Revenue', vatCode: 'STD', citDeductible: false, qualifiesForQFZP: true },
  { id: 7, code: '5000', name: 'Cost of Goods Sold', vatCode: 'STD', citDeductible: true, qualifiesForQFZP: true },
  { id: 8, code: '6000', name: 'Operating Expenses', vatCode: 'STD', citDeductible: true, qualifiesForQFZP: true },
  { id: 9, code: '7000', name: 'Professional Services', vatCode: 'STD', citDeductible: true, qualifiesForQFZP: true },
  { id: 10, code: '8000', name: 'Other Income', vatCode: 'STD', citDeductible: false, qualifiesForQFZP: true }
];

// Get all chart of accounts
router.get('/', (req, res) => {
  try {
    const accounts = mockChartOfAccounts.map(account => ({
      ...account,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }));
    
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching chart of accounts:', error);
    res.status(500).json({ error: 'Failed to fetch chart of accounts' });
  }
});

// Get specific account by code
router.get('/:code', (req, res) => {
  try {
    const { code } = req.params;
    const account = mockChartOfAccounts.find(acc => acc.code === code);
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    res.json({
      ...account,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    });
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({ error: 'Failed to fetch account' });
  }
});

// Create new account
router.post('/', (req, res) => {
  try {
    const { code, name, vatCode, citDeductible, qualifiesForQFZP, notes } = req.body;
    
    const newAccount = {
      id: mockChartOfAccounts.length + 1,
      code,
      name,
      vatCode: vatCode || 'STD',
      citDeductible: citDeductible || false,
      qualifiesForQFZP: qualifiesForQFZP || false,
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    mockChartOfAccounts.push(newAccount);
    
    res.status(201).json({
      success: true,
      account: newAccount,
      message: 'Account created successfully'
    });
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

export default router;