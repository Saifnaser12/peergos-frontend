import { Router } from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import XLSX from 'xlsx';
import { Readable } from 'stream';
import { z } from 'zod';
import { db } from '../db';
import { transactions, invoices, chartOfAccounts } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV, XLS, and XLSX files are allowed.'));
    }
  },
});

// Validation schemas for different import types
const transactionImportSchema = z.object({
  date: z.string().transform(str => new Date(str)),
  description: z.string().min(1),
  amount: z.string().transform(str => parseFloat(str)),
  type: z.enum(['REVENUE', 'EXPENSE']),
  category: z.string().min(1),
  reference: z.string().optional(),
  vat_amount: z.string().transform(str => parseFloat(str || '0')).optional(),
});

const invoiceImportSchema = z.object({
  invoice_number: z.string().min(1),
  client_name: z.string().min(1),
  client_email: z.string().email().optional(),
  client_address: z.string().optional(),
  issue_date: z.string().transform(str => new Date(str)),
  due_date: z.string().transform(str => new Date(str)),
  amount: z.string().transform(str => parseFloat(str)),
  vat_amount: z.string().transform(str => parseFloat(str || '0')),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE']).optional().default('DRAFT'),
});

const expenseImportSchema = z.object({
  date: z.string().transform(str => new Date(str)),
  vendor: z.string().min(1),
  description: z.string().min(1),
  amount: z.string().transform(str => parseFloat(str)),
  category: z.string().min(1),
  vat_amount: z.string().transform(str => parseFloat(str || '0')),
  reference: z.string().optional(),
});

const chartOfAccountsImportSchema = z.object({
  account_code: z.string().min(1),
  account_name: z.string().min(1),
  account_type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  parent_code: z.string().optional(),
  is_active: z.string().transform(str => str.toLowerCase() === 'true').optional().default(true),
});

// Helper function to parse file content
async function parseFileContent(buffer: Buffer, filename: string): Promise<any[]> {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  if (ext === 'csv') {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const stream = Readable.from(buffer.toString());
      
      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  } else if (ext === 'xlsx' || ext === 'xls') {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet);
  } else {
    throw new Error('Unsupported file format');
  }
}

// Helper function to validate and transform data
function validateImportData(data: any[], type: string, companyId: number) {
  const results = {
    valid: [] as any[],
    invalid: [] as any[],
    errors: [] as string[],
  };

  let schema;
  switch (type) {
    case 'transactions':
      schema = transactionImportSchema;
      break;
    case 'invoices':
      schema = invoiceImportSchema;
      break;
    case 'expenses':
      schema = expenseImportSchema;
      break;
    case 'chart_of_accounts':
      schema = chartOfAccountsImportSchema;
      break;
    default:
      throw new Error('Invalid import type');
  }

  data.forEach((row, index) => {
    try {
      const validatedRow = schema.parse(row);
      
      // Add company ID and convert to database format
      if (type === 'transactions' || type === 'expenses') {
        results.valid.push({
          companyId,
          type: validatedRow.type,
          amount: validatedRow.amount,
          description: validatedRow.description,
          category: validatedRow.category,
          transactionDate: validatedRow.date,
          reference: validatedRow.reference,
          vatAmount: validatedRow.vat_amount || 0,
        });
      } else if (type === 'invoices') {
        results.valid.push({
          companyId,
          invoiceNumber: validatedRow.invoice_number,
          clientName: validatedRow.client_name,
          clientEmail: validatedRow.client_email,
          clientAddress: validatedRow.client_address,
          issueDate: validatedRow.issue_date,
          dueDate: validatedRow.due_date,
          totalAmount: validatedRow.amount,
          vatAmount: validatedRow.vat_amount || 0,
          description: validatedRow.description,
          status: validatedRow.status,
        });
      } else if (type === 'chart_of_accounts') {
        results.valid.push({
          companyId,
          code: validatedRow.account_code,
          name: validatedRow.account_name,
          type: validatedRow.account_type,
          parentCode: validatedRow.parent_code,
          isActive: validatedRow.is_active,
        });
      }
    } catch (error: any) {
      results.invalid.push({ row: index + 1, data: row, error: error.message });
      results.errors.push(`Row ${index + 1}: ${error.message}`);
    }
  });

  return results;
}

// Preview endpoint
router.post('/preview', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { type } = req.body;
    if (!type) {
      return res.status(400).json({ error: 'Import type is required' });
    }

    const rawData = await parseFileContent(req.file.buffer, req.file.originalname);
    
    // Return preview of first 10 rows
    const preview = rawData.slice(0, 10);
    
    res.json({
      preview,
      totalRows: rawData.length,
      columns: Object.keys(rawData[0] || {}),
    });
  } catch (error: any) {
    console.error('Preview error:', error);
    res.status(500).json({ error: error.message || 'Failed to preview file' });
  }
});

// Import endpoint
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { type } = req.body;
    const companyId = 1; // TODO: Get from authenticated user session

    if (!type) {
      return res.status(400).json({ error: 'Import type is required' });
    }

    const rawData = await parseFileContent(req.file.buffer, req.file.originalname);
    const validation = validateImportData(rawData, type, companyId);

    if (validation.valid.length === 0) {
      return res.status(400).json({
        error: 'No valid records found',
        errors: validation.errors,
        invalid: validation.invalid,
      });
    }

    // Import valid records to database
    let imported = 0;
    const errors: string[] = [];

    if (type === 'transactions' || type === 'expenses') {
      try {
        const result = await db.insert(transactions).values(validation.valid).returning();
        imported = result.length;
      } catch (error: any) {
        errors.push(`Database error: ${error.message}`);
      }
    } else if (type === 'invoices') {
      try {
        const result = await db.insert(invoices).values(validation.valid).returning();
        imported = result.length;
      } catch (error: any) {
        errors.push(`Database error: ${error.message}`);
      }
    } else if (type === 'chart_of_accounts') {
      try {
        // Handle chart of accounts with potential conflicts
        for (const account of validation.valid) {
          try {
            await db.insert(chartOfAccounts).values(account);
            imported++;
          } catch (error: any) {
            if (error.code === '23505') { // Unique constraint violation
              errors.push(`Account code ${account.code} already exists`);
            } else {
              errors.push(`Failed to import account ${account.code}: ${error.message}`);
            }
          }
        }
      } catch (error: any) {
        errors.push(`Database error: ${error.message}`);
      }
    }

    res.json({
      imported,
      skipped: validation.invalid.length,
      errors: [...validation.errors, ...errors],
      invalid: validation.invalid,
    });
  } catch (error: any) {
    console.error('Import error:', error);
    res.status(500).json({ error: error.message || 'Failed to import data' });
  }
});

// Get import templates
router.get('/templates/:type', (req, res) => {
  const { type } = req.params;
  
  const templates: Record<string, any> = {
    transactions: {
      headers: ['date', 'description', 'amount', 'type', 'category', 'reference', 'vat_amount'],
      example: [
        {
          date: '2025-01-15',
          description: 'Software License Revenue',
          amount: '5000.00',
          type: 'REVENUE',
          category: 'Services',
          reference: 'INV-001',
          vat_amount: '250.00'
        }
      ]
    },
    invoices: {
      headers: ['invoice_number', 'client_name', 'client_email', 'client_address', 'issue_date', 'due_date', 'amount', 'vat_amount', 'description'],
      example: [
        {
          invoice_number: 'INV-2025-001',
          client_name: 'ABC Trading LLC',
          client_email: 'billing@abctrading.ae',
          client_address: 'Dubai, UAE',
          issue_date: '2025-01-15',
          due_date: '2025-02-15',
          amount: '10000.00',
          vat_amount: '500.00',
          description: 'Consulting Services'
        }
      ]
    },
    expenses: {
      headers: ['date', 'vendor', 'description', 'amount', 'category', 'vat_amount', 'reference'],
      example: [
        {
          date: '2025-01-15',
          vendor: 'DEWA',
          description: 'Electricity bill',
          amount: '800.00',
          category: 'Utilities',
          vat_amount: '40.00',
          reference: 'BILL-001'
        }
      ]
    },
    chart_of_accounts: {
      headers: ['account_code', 'account_name', 'account_type', 'parent_code', 'is_active'],
      example: [
        {
          account_code: '1000',
          account_name: 'Cash in Bank',
          account_type: 'ASSET',
          parent_code: '',
          is_active: 'true'
        }
      ]
    }
  };

  const template = templates[type];
  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }

  res.json(template);
});

export default router;