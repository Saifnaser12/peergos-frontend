import express, { Router } from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import * as xlsx from 'xlsx';
import { Readable } from 'stream';
import { storage } from '../storage';
import { z } from 'zod';

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
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'));
    }
  }
});

// Validation schemas for different import types
const transactionRowSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.string().min(1, 'Amount is required'),
  type: z.enum(['REVENUE', 'EXPENSE'], { required_error: 'Type must be REVENUE or EXPENSE' }),
  category: z.string().min(1, 'Category is required'),
  vat_amount: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

const invoiceRowSchema = z.object({
  invoice_number: z.string().min(1, 'Invoice number is required'),
  customer_name: z.string().min(1, 'Customer name is required'),
  issue_date: z.string().min(1, 'Issue date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  amount: z.string().min(1, 'Amount is required'),
  customer_email: z.string().email().optional(),
  customer_address: z.string().optional(),
  vat_amount: z.string().optional(),
  description: z.string().optional(),
});

const customerRowSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  company: z.string().optional(),
  trn: z.string().optional(),
});

// Template definitions
const IMPORT_TEMPLATES = {
  transactions: {
    name: 'Transactions',
    schema: transactionRowSchema,
    requiredColumns: ['date', 'description', 'amount', 'type', 'category'],
    optionalColumns: ['vat_amount', 'reference', 'notes'],
  },
  invoices: {
    name: 'Invoices',
    schema: invoiceRowSchema,
    requiredColumns: ['invoice_number', 'customer_name', 'issue_date', 'due_date', 'amount'],
    optionalColumns: ['customer_email', 'customer_address', 'vat_amount', 'description'],
  },
  customers: {
    name: 'Customers',
    schema: customerRowSchema,
    requiredColumns: ['name', 'email'],
    optionalColumns: ['phone', 'address', 'company', 'trn'],
  }
};

// Helper function to parse CSV/Excel files
async function parseFile(buffer: Buffer, filename: string): Promise<any[]> {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  if (ext === 'csv') {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const stream = Readable.from(buffer);
      
      stream
        .pipe(csv())
        .on('data', (data: any) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  } else if (ext === 'xlsx' || ext === 'xls') {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(worksheet);
  } else {
    throw new Error('Unsupported file format');
  }
}

// Validate and normalize data based on template
function validateAndNormalizeData(rawData: any[], templateKey: string) {
  const template = IMPORT_TEMPLATES[templateKey as keyof typeof IMPORT_TEMPLATES];
  if (!template) {
    throw new Error(`Unknown template: ${templateKey}`);
  }

  const results = {
    validRows: [] as any[],
    errors: [] as Array<{ row: number; error: string }>,
  };

  rawData.forEach((row, index) => {
    try {
      // Normalize column names (convert to lowercase, replace spaces with underscores)
      const normalizedRow: any = {};
      Object.keys(row).forEach(key => {
        const normalizedKey = key.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '');
        normalizedRow[normalizedKey] = row[key];
      });

      // Validate against schema
      const validatedRow = template.schema.parse(normalizedRow);
      results.validRows.push({
        ...validatedRow,
        originalIndex: index + 1
      });
    } catch (error: any) {
      if (error.errors) {
        // Zod validation errors
        const errorMessages = error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
        results.errors.push({
          row: index + 1,
          error: errorMessages
        });
      } else {
        results.errors.push({
          row: index + 1,
          error: error.message || 'Validation error'
        });
      }
    }
  });

  return results;
}

// Convert validated data to database format
async function processTransactions(validRows: any[], companyId: number, userId: number) {
  const results = {
    successful: 0,
    failed: 0,
    errors: [] as Array<{ row: number; error: string }>
  };

  for (const row of validRows) {
    try {
      await storage.createTransaction({
        companyId,
        type: row.type,
        category: row.category,
        description: row.description,
        amount: row.amount,
        vatAmount: row.vat_amount || '0',
        transactionDate: new Date(row.date),
        attachments: [],
        createdBy: userId,
      });
      results.successful++;
    } catch (error: any) {
      results.failed++;
      results.errors.push({
        row: row.originalIndex,
        error: error.message || 'Failed to create transaction'
      });
    }
  }

  return results;
}

async function processInvoices(validRows: any[], companyId: number, userId: number) {
  const results = {
    successful: 0,
    failed: 0,
    errors: [] as Array<{ row: number; error: string }>
  };

  for (const row of validRows) {
    try {
      // Parse amount and calculate VAT if not provided
      const subtotal = parseFloat(row.amount);
      const vatAmount = row.vat_amount ? parseFloat(row.vat_amount) : subtotal * 0.05;
      const total = subtotal + vatAmount;

      await storage.createInvoice({
        companyId,
        invoiceNumber: row.invoice_number,
        clientName: row.customer_name,
        clientEmail: row.customer_email || '',
        clientAddress: row.customer_address || '',
        issueDate: new Date(row.issue_date),
        dueDate: new Date(row.due_date),
        items: [
          {
            description: row.description || row.customer_name,
            quantity: 1,
            rate: subtotal,
            amount: subtotal
          }
        ],
        subtotal: subtotal.toString(),
        vatAmount: vatAmount.toString(),
        total: total.toString(),
        createdBy: userId,
      });
      results.successful++;
    } catch (error: any) {
      results.failed++;
      results.errors.push({
        row: row.originalIndex,
        error: error.message || 'Failed to create invoice'
      });
    }
  }

  return results;
}

// Data entry statistics endpoint
router.get('/stats', async (req, res) => {
  try {
    // Mock data for now - in real implementation would query database
    const transactions = await storage.getTransactions(1); // Company ID 1
    const stats = {
      totalTransactions: transactions.length,
      pendingValidation: 3,
      lastImport: new Date().toISOString(),
      completionRate: 92
    };
    
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch stats' });
  }
});

// File preview endpoint
router.post('/preview', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const templateKey = req.body.template || 'transactions';
    const rawData = await parseFile(req.file.buffer, req.file.originalname);
    
    // Return first 10 rows for preview
    res.json({
      data: rawData.slice(0, 10),
      totalRows: rawData.length,
      template: templateKey
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to preview file' });
  }
});

// File upload and import endpoint
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const templateKey = req.body.template || 'transactions';
    const companyId = 1; // Mock company ID - would get from session
    const userId = 1; // Mock user ID - would get from session

    // Parse file
    const rawData = await parseFile(req.file.buffer, req.file.originalname);
    
    // Validate data
    const { validRows, errors: validationErrors } = validateAndNormalizeData(rawData, templateKey);

    let processResults;
    let summary = { transactions: 0, invoices: 0, customers: 0 };

    // Process valid rows based on template type
    switch (templateKey) {
      case 'transactions':
        processResults = await processTransactions(validRows, companyId, userId);
        summary.transactions = processResults.successful;
        break;
      case 'invoices':
        processResults = await processInvoices(validRows, companyId, userId);
        summary.invoices = processResults.successful;
        break;
      case 'customers':
        // Customer processing would be implemented here
        processResults = { successful: 0, failed: 0, errors: [] };
        summary.customers = processResults.successful;
        break;
      default:
        return res.status(400).json({ message: 'Invalid template type' });
    }

    // Combine validation and processing errors
    const allErrors = [
      ...validationErrors,
      ...processResults.errors
    ];

    const result = {
      success: allErrors.length === 0,
      totalRows: rawData.length,
      successfulRows: processResults.successful,
      failedRows: processResults.failed + validationErrors.length,
      errors: allErrors,
      summary
    };

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Import failed' });
  }
});

export default router;