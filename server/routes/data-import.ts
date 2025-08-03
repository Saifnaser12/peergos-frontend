import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";
import multer from "multer";
import * as XLSX from "xlsx";
import csv from "csv-parser";
import { Readable } from "stream";

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
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/json',
      'application/xml',
      'text/xml'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
});

// Schema for import configuration
const ImportConfigSchema = z.object({
  dataType: z.enum(['TRANSACTIONS', 'INVOICES', 'ACCOUNTS', 'CUSTOMERS', 'SUPPLIERS', 'PRODUCTS']),
  mapping: z.record(z.string()), // Maps CSV columns to database fields
  skipFirstRow: z.boolean().optional().default(true),
  dateFormat: z.string().optional().default('YYYY-MM-DD'),
  duplicateHandling: z.enum(['SKIP', 'UPDATE', 'CREATE_NEW']).optional().default('SKIP'),
  validateOnly: z.boolean().optional().default(false)
});

// Get import templates
router.get("/templates", (req, res) => {
  const templates = {
    TRANSACTIONS: {
      requiredFields: ['date', 'account', 'amount', 'description'],
      optionalFields: ['reference', 'category', 'vatRate', 'vatAmount'],
      sampleData: [
        {
          date: '2024-01-15',
          account: 'Bank Account',
          amount: '1500.00',
          description: 'Invoice payment from customer',
          reference: 'INV-001',
          category: 'Revenue',
          vatRate: '5',
          vatAmount: '71.43'
        }
      ]
    },
    INVOICES: {
      requiredFields: ['invoiceNumber', 'customerName', 'issueDate', 'totalAmount'],
      optionalFields: ['dueDate', 'vatAmount', 'status', 'currency'],
      sampleData: [
        {
          invoiceNumber: 'INV-001',
          customerName: 'ABC Company',
          issueDate: '2024-01-15',
          dueDate: '2024-02-15',
          totalAmount: '1575.00',
          vatAmount: '75.00',
          status: 'SENT',
          currency: 'AED'
        }
      ]
    },
    ACCOUNTS: {
      requiredFields: ['accountCode', 'accountName', 'accountType'],
      optionalFields: ['parentAccount', 'description', 'isActive'],
      sampleData: [
        {
          accountCode: '1001',
          accountName: 'Petty Cash',
          accountType: 'ASSET',
          parentAccount: '1000',
          description: 'Cash on hand',
          isActive: 'true'
        }
      ]
    },
    CUSTOMERS: {
      requiredFields: ['name', 'email'],
      optionalFields: ['phone', 'address', 'taxNumber', 'paymentTerms'],
      sampleData: [
        {
          name: 'ABC Trading LLC',
          email: 'info@abctrading.ae',
          phone: '+971501234567',
          address: 'Dubai, UAE',
          taxNumber: '100123456700003',
          paymentTerms: '30'
        }
      ]
    }
  };
  
  res.json(templates);
});

// Get sample CSV for specific data type
router.get("/sample/:dataType", (req, res) => {
  const { dataType } = req.params;
  
  const templates = {
    TRANSACTIONS: [
      ['Date', 'Account', 'Amount', 'Description', 'Reference', 'Category', 'VAT Rate', 'VAT Amount'],
      ['2024-01-15', 'Bank Account', '1500.00', 'Invoice payment', 'INV-001', 'Revenue', '5', '71.43'],
      ['2024-01-16', 'Office Supplies', '250.00', 'Stationery purchase', 'EXP-001', 'Expenses', '5', '11.90']
    ],
    INVOICES: [
      ['Invoice Number', 'Customer Name', 'Issue Date', 'Due Date', 'Total Amount', 'VAT Amount', 'Status'],
      ['INV-001', 'ABC Company', '2024-01-15', '2024-02-15', '1575.00', '75.00', 'SENT'],
      ['INV-002', 'XYZ Corp', '2024-01-16', '2024-02-16', '2100.00', '100.00', 'PAID']
    ]
  };
  
  const template = templates[dataType as keyof typeof templates];
  if (!template) {
    return res.status(404).json({ message: "Template not found" });
  }
  
  const csvContent = template.map(row => row.join(',')).join('\n');
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${dataType.toLowerCase()}_template.csv"`);
  res.send(csvContent);
});

// Preview import data
router.post("/preview", upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const config = ImportConfigSchema.parse(JSON.parse(req.body.config || '{}'));
    
    const preview = await parseFileForPreview(req.file, config);
    
    res.json({
      filename: req.file.originalname,
      fileSize: req.file.size,
      totalRows: preview.totalRows,
      sampleData: preview.sampleData,
      detectedColumns: preview.detectedColumns,
      validationErrors: preview.validationErrors,
      suggestions: preview.suggestions
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid configuration", errors: error.errors });
    }
    console.error("Error previewing import:", error);
    res.status(500).json({ message: "Failed to preview import", error: error.message });
  }
});

// Import data
router.post("/import", upload.single('file'), async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(401).json({ message: "Company ID required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const config = ImportConfigSchema.parse(JSON.parse(req.body.config || '{}'));
    
    // Create import job
    const importJob = await storage.createImportJob({
      companyId,
      userId: req.user.id,
      filename: req.file.originalname,
      fileSize: req.file.size,
      dataType: config.dataType,
      config,
      status: 'PROCESSING',
      createdAt: new Date()
    });

    // Parse and validate data
    const parseResult = await parseFileForImport(req.file, config);
    
    if (config.validateOnly) {
      await storage.updateImportJob(importJob.id, {
        status: 'VALIDATED',
        totalRows: parseResult.totalRows,
        validRows: parseResult.validRows,
        errorRows: parseResult.errorRows,
        validationErrors: parseResult.errors,
        completedAt: new Date()
      });
      
      return res.json({
        jobId: importJob.id,
        status: 'VALIDATED',
        summary: {
          totalRows: parseResult.totalRows,
          validRows: parseResult.validRows,
          errorRows: parseResult.errorRows,
          errors: parseResult.errors
        }
      });
    }

    // Process valid rows
    let processedRows = 0;
    let successRows = 0;
    let errorRows = 0;
    const errors: any[] = [];

    for (const rowData of parseResult.validData) {
      try {
        switch (config.dataType) {
          case 'TRANSACTIONS':
            await storage.createTransactionFromImport(companyId, rowData, config.mapping);
            break;
          case 'INVOICES':
            await storage.createInvoiceFromImport(companyId, rowData, config.mapping);
            break;
          case 'ACCOUNTS':
            await storage.createAccountFromImport(companyId, rowData, config.mapping);
            break;
          case 'CUSTOMERS':
            await storage.createCustomerFromImport(companyId, rowData, config.mapping);
            break;
          default:
            throw new Error('Unsupported data type');
        }
        successRows++;
      } catch (error) {
        errorRows++;
        errors.push({
          row: processedRows + 1,
          error: error.message,
          data: rowData
        });
      }
      processedRows++;
    }

    // Update import job
    await storage.updateImportJob(importJob.id, {
      status: 'COMPLETED',
      totalRows: parseResult.totalRows,
      validRows: successRows,
      errorRows: errorRows,
      processingErrors: errors,
      completedAt: new Date()
    });

    res.json({
      jobId: importJob.id,
      status: 'COMPLETED',
      summary: {
        totalRows: parseResult.totalRows,
        successRows,
        errorRows,
        errors: errors.slice(0, 10) // Return first 10 errors
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid configuration", errors: error.errors });
    }
    console.error("Error importing data:", error);
    res.status(500).json({ message: "Import failed", error: error.message });
  }
});

// Get import job status
router.get("/jobs/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await storage.getImportJob(Number(jobId));
    
    if (!job) {
      return res.status(404).json({ message: "Import job not found" });
    }
    
    res.json(job);
  } catch (error) {
    console.error("Error fetching import job:", error);
    res.status(500).json({ message: "Failed to fetch import job" });
  }
});

// Get import history
router.get("/history", async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const { page = 1, limit = 20 } = req.query;
    
    const history = await storage.getImportHistory(companyId, {
      page: Number(page),
      limit: Number(limit)
    });
    
    res.json(history);
  } catch (error) {
    console.error("Error fetching import history:", error);
    res.status(500).json({ message: "Failed to fetch import history" });
  }
});

// Helper functions
async function parseFileForPreview(file: Express.Multer.File, config: any) {
  const data = await parseFile(file, config);
  
  return {
    totalRows: data.length,
    sampleData: data.slice(0, 5), // First 5 rows for preview
    detectedColumns: data.length > 0 ? Object.keys(data[0]) : [],
    validationErrors: [], // TODO: Add validation
    suggestions: generateMappingSuggestions(data.length > 0 ? Object.keys(data[0]) : [], config.dataType)
  };
}

async function parseFileForImport(file: Express.Multer.File, config: any) {
  const data = await parseFile(file, config);
  
  // Apply field mapping
  const mappedData = data.map(row => {
    const mapped: any = {};
    for (const [sourceField, targetField] of Object.entries(config.mapping)) {
      if (row[sourceField] !== undefined) {
        mapped[targetField] = row[sourceField];
      }
    }
    return mapped;
  });
  
  // Validate data
  const validData: any[] = [];
  const errors: any[] = [];
  
  mappedData.forEach((row, index) => {
    try {
      // Basic validation based on data type
      validateRow(row, config.dataType);
      validData.push(row);
    } catch (error) {
      errors.push({
        row: index + 1,
        error: error.message,
        data: row
      });
    }
  });
  
  return {
    totalRows: data.length,
    validRows: validData.length,
    errorRows: errors.length,
    validData,
    errors
  };
}

async function parseFile(file: Express.Multer.File, config: any): Promise<any[]> {
  const { mimetype, buffer } = file;
  
  if (mimetype === 'text/csv' || mimetype === 'application/vnd.ms-excel') {
    return parseCSV(buffer, config);
  } else if (mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    return parseExcel(buffer, config);
  } else if (mimetype === 'application/json') {
    return JSON.parse(buffer.toString());
  } else {
    throw new Error('Unsupported file type');
  }
}

function parseCSV(buffer: Buffer, config: any): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    const stream = Readable.from(buffer.toString());
    
    stream
      .pipe(csv({
        skipEmptyLines: true,
        skipLinesWithError: true
      }))
      .on('data', (data) => {
        if (!config.skipFirstRow || results.length > 0) {
          results.push(data);
        }
      })
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

function parseExcel(buffer: Buffer, config: any): any[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const data = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: ''
  });
  
  if (data.length === 0) return [];
  
  const headers = data[0] as string[];
  const rows = config.skipFirstRow ? data.slice(1) : data;
  
  return rows.map((row: any[]) => {
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj;
  });
}

function validateRow(row: any, dataType: string): void {
  switch (dataType) {
    case 'TRANSACTIONS':
      if (!row.date || !row.account || !row.amount) {
        throw new Error('Missing required fields: date, account, amount');
      }
      if (isNaN(parseFloat(row.amount))) {
        throw new Error('Invalid amount');
      }
      break;
    case 'INVOICES':
      if (!row.invoiceNumber || !row.customerName || !row.totalAmount) {
        throw new Error('Missing required fields: invoiceNumber, customerName, totalAmount');
      }
      break;
    case 'ACCOUNTS':
      if (!row.accountCode || !row.accountName || !row.accountType) {
        throw new Error('Missing required fields: accountCode, accountName, accountType');
      }
      break;
  }
}

function generateMappingSuggestions(detectedColumns: string[], dataType: string): any {
  const mappingSuggestions: any = {};
  
  const commonMappings: any = {
    TRANSACTIONS: {
      date: ['date', 'transaction_date', 'trans_date'],
      account: ['account', 'account_name', 'acc_name'],
      amount: ['amount', 'value', 'total'],
      description: ['description', 'memo', 'details', 'narration']
    },
    INVOICES: {
      invoiceNumber: ['invoice_number', 'invoice_no', 'inv_no'],
      customerName: ['customer_name', 'customer', 'client_name'],
      totalAmount: ['total_amount', 'total', 'amount'],
      issueDate: ['issue_date', 'date', 'invoice_date']
    }
  };
  
  const mappings = commonMappings[dataType] || {};
  
  for (const [targetField, possibleNames] of Object.entries(mappings)) {
    const match = detectedColumns.find(col => 
      possibleNames.some((name: string) => 
        col.toLowerCase().includes(name.toLowerCase())
      )
    );
    if (match) {
      mappingSuggestions[match] = targetField;
    }
  }
  
  return mappingSuggestions;
}

export default router;