import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";
import * as XLSX from "xlsx";
import { format } from "date-fns";

const router = Router();

// Schema for export configuration
const ExportConfigSchema = z.object({
  format: z.enum(['CSV', 'XLSX', 'JSON', 'XML', 'PDF']),
  dataType: z.enum(['TRANSACTIONS', 'INVOICES', 'ACCOUNTS', 'TAX_RETURNS', 'FINANCIAL_STATEMENTS', 'ALL']),
  dateRange: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional()
  }).optional(),
  filters: z.record(z.any()).optional(),
  includeAttachments: z.boolean().optional().default(false)
});

// Get available export formats
router.get("/formats", (req, res) => {
  const formats = [
    {
      format: 'CSV',
      description: 'Comma Separated Values - Compatible with Excel and most accounting software',
      mimeType: 'text/csv',
      extension: '.csv'
    },
    {
      format: 'XLSX',
      description: 'Excel Workbook - Full formatting and multiple sheets support',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      extension: '.xlsx'
    },
    {
      format: 'JSON',
      description: 'JavaScript Object Notation - For API integrations',
      mimeType: 'application/json',
      extension: '.json'
    },
    {
      format: 'XML',
      description: 'eXtensible Markup Language - For enterprise systems',
      mimeType: 'application/xml',
      extension: '.xml'
    },
    {
      format: 'PDF',
      description: 'Portable Document Format - For sharing and archival',
      mimeType: 'application/pdf',
      extension: '.pdf'
    }
  ];
  
  res.json(formats);
});

// Get supported accounting software formats
router.get("/accounting-formats", (req, res) => {
  const accountingSoftware = [
    {
      name: 'QuickBooks',
      format: 'IIF',
      description: 'QuickBooks Interchange Format',
      fields: ['Date', 'Account', 'Amount', 'Description', 'Reference']
    },
    {
      name: 'Sage',
      format: 'CSV',
      description: 'Sage 50 Import Format',
      fields: ['Date', 'Reference', 'Account Code', 'Debit', 'Credit', 'Description']
    },
    {
      name: 'Xero',
      format: 'CSV',
      description: 'Xero Bank Import Format',
      fields: ['Date', 'Amount', 'Payee', 'Description', 'Reference']
    },
    {
      name: 'Tally',
      format: 'XML',
      description: 'Tally Data Exchange Format',
      fields: ['VoucherType', 'Date', 'PartyName', 'Amount', 'Narration']
    },
    {
      name: 'SAP',
      format: 'TXT',
      description: 'SAP Business One Import Format',
      fields: ['TransId', 'RefDate', 'Account', 'Debit', 'Credit', 'LineMemo']
    }
  ];
  
  res.json(accountingSoftware);
});

// Export data
router.post("/export", async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(401).json({ message: "Company ID required" });
    }

    const config = ExportConfigSchema.parse(req.body);
    
    // Create export job
    const exportJob = await storage.createExportJob({
      companyId,
      userId: req.user.id,
      config,
      status: 'PROCESSING',
      createdAt: new Date()
    });

    // Generate export data based on type
    let exportData: any = {};
    
    switch (config.dataType) {
      case 'TRANSACTIONS':
        exportData = await storage.getTransactionsForExport(companyId, config.dateRange, config.filters);
        break;
      case 'INVOICES':
        exportData = await storage.getInvoicesForExport(companyId, config.dateRange, config.filters);
        break;
      case 'ACCOUNTS':
        exportData = await storage.getAccountsForExport(companyId);
        break;
      case 'TAX_RETURNS':
        exportData = await storage.getTaxReturnsForExport(companyId, config.dateRange);
        break;
      case 'FINANCIAL_STATEMENTS':
        exportData = await storage.getFinancialStatementsForExport(companyId, config.dateRange);
        break;
      case 'ALL':
        exportData = {
          transactions: await storage.getTransactionsForExport(companyId, config.dateRange, config.filters),
          invoices: await storage.getInvoicesForExport(companyId, config.dateRange, config.filters),
          accounts: await storage.getAccountsForExport(companyId),
          taxReturns: await storage.getTaxReturnsForExport(companyId, config.dateRange),
          financialStatements: await storage.getFinancialStatementsForExport(companyId, config.dateRange)
        };
        break;
    }

    // Generate file based on format
    let fileBuffer: Buffer;
    let mimeType: string;
    let filename: string;
    
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    
    switch (config.format) {
      case 'CSV':
        fileBuffer = generateCSV(exportData);
        mimeType = 'text/csv';
        filename = `${config.dataType}_export_${timestamp}.csv`;
        break;
      case 'XLSX':
        fileBuffer = generateExcel(exportData);
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `${config.dataType}_export_${timestamp}.xlsx`;
        break;
      case 'JSON':
        fileBuffer = Buffer.from(JSON.stringify(exportData, null, 2));
        mimeType = 'application/json';
        filename = `${config.dataType}_export_${timestamp}.json`;
        break;
      case 'XML':
        fileBuffer = generateXML(exportData);
        mimeType = 'application/xml';
        filename = `${config.dataType}_export_${timestamp}.xml`;
        break;
      default:
        throw new Error('Unsupported export format');
    }

    // Update export job with file info
    await storage.updateExportJob(exportJob.id, {
      status: 'COMPLETED',
      filename,
      fileSize: fileBuffer.length,
      completedAt: new Date()
    });

    // Set response headers
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', fileBuffer.length);
    
    res.send(fileBuffer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid export configuration", errors: error.errors });
    }
    console.error("Error exporting data:", error);
    res.status(500).json({ message: "Export failed", error: error.message });
  }
});

// Export for specific accounting software
router.post("/export/:software", async (req, res) => {
  try {
    const { software } = req.params;
    const companyId = req.user?.companyId;
    
    const { dateRange, includeReconciled = false } = req.body;
    
    let exportData;
    let fileBuffer: Buffer;
    let filename: string;
    
    const timestamp = format(new Date(), 'yyyy-MM-dd');
    
    switch (software.toLowerCase()) {
      case 'quickbooks':
        exportData = await storage.getTransactionsForQuickBooks(companyId, dateRange);
        fileBuffer = generateQuickBooksIIF(exportData);
        filename = `quickbooks_import_${timestamp}.iif`;
        res.setHeader('Content-Type', 'text/plain');
        break;
        
      case 'sage':
        exportData = await storage.getTransactionsForSage(companyId, dateRange);
        fileBuffer = generateSageCSV(exportData);
        filename = `sage_import_${timestamp}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        break;
        
      case 'xero':
        exportData = await storage.getTransactionsForXero(companyId, dateRange);
        fileBuffer = generateXeroCSV(exportData);
        filename = `xero_import_${timestamp}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        break;
        
      default:
        return res.status(400).json({ message: "Unsupported accounting software" });
    }
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(fileBuffer);
  } catch (error) {
    console.error("Error exporting for accounting software:", error);
    res.status(500).json({ message: "Export failed", error: error.message });
  }
});

// Get export history
router.get("/history", async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const { page = 1, limit = 20 } = req.query;
    
    const history = await storage.getExportHistory(companyId, {
      page: Number(page),
      limit: Number(limit)
    });
    
    res.json(history);
  } catch (error) {
    console.error("Error fetching export history:", error);
    res.status(500).json({ message: "Failed to fetch export history" });
  }
});

// Helper functions for generating different file formats
function generateCSV(data: any): Buffer {
  if (Array.isArray(data)) {
    if (data.length === 0) return Buffer.from('');
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' && value.includes(',') 
          ? `"${value.replace(/"/g, '""')}"` 
          : value
      ).join(',')
    );
    
    return Buffer.from([headers, ...rows].join('\n'));
  }
  
  // Handle object with multiple sheets
  let csvContent = '';
  for (const [sheetName, sheetData] of Object.entries(data)) {
    if (Array.isArray(sheetData) && sheetData.length > 0) {
      csvContent += `\n=== ${sheetName.toUpperCase()} ===\n`;
      const headers = Object.keys(sheetData[0]).join(',');
      const rows = sheetData.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' && value.includes(',') 
            ? `"${value.replace(/"/g, '""')}"` 
            : value
        ).join(',')
      );
      csvContent += [headers, ...rows].join('\n') + '\n';
    }
  }
  
  return Buffer.from(csvContent);
}

function generateExcel(data: any): Buffer {
  const workbook = XLSX.utils.book_new();
  
  if (Array.isArray(data)) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Export');
  } else {
    // Multiple sheets
    for (const [sheetName, sheetData] of Object.entries(data)) {
      if (Array.isArray(sheetData)) {
        const worksheet = XLSX.utils.json_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      }
    }
  }
  
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

function generateXML(data: any): Buffer {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<export>\n';
  
  if (Array.isArray(data)) {
    xml += '  <records>\n';
    data.forEach(record => {
      xml += '    <record>\n';
      for (const [key, value] of Object.entries(record)) {
        xml += `      <${key}>${escapeXml(String(value))}</${key}>\n`;
      }
      xml += '    </record>\n';
    });
    xml += '  </records>\n';
  } else {
    for (const [section, sectionData] of Object.entries(data)) {
      xml += `  <${section}>\n`;
      if (Array.isArray(sectionData)) {
        sectionData.forEach(record => {
          xml += '    <record>\n';
          for (const [key, value] of Object.entries(record)) {
            xml += `      <${key}>${escapeXml(String(value))}</${key}>\n`;
          }
          xml += '    </record>\n';
        });
      }
      xml += `  </${section}>\n`;
    }
  }
  
  xml += '</export>';
  return Buffer.from(xml);
}

function generateQuickBooksIIF(data: any[]): Buffer {
  let iif = '!TRNS\tTRNSTYPE\tDATE\tACCNT\tNAME\tCLASS\tAMOUNT\tDOCNUM\tMEMO\tCLEAR\tTOPRINT\tNAMETYPE\tTERMS\tSHIPDATE\n';
  iif += '!SPL\tSPLID\tTRNSTYPE\tDATE\tACCNT\tNAME\tCLASS\tAMOUNT\tDOCNUM\tMEMO\tCLEAR\tQNTY\tPRICE\tINVITEM\tPAYMETH\tTAXABLE\tREIMBEXP\tSERVICEDATE\tOTHER2\n!ENDTRNS\n';
  
  data.forEach(transaction => {
    iif += `TRNS\t${transaction.type}\t${transaction.date}\t\t${transaction.name}\t\t${transaction.amount}\t${transaction.reference}\t${transaction.description}\tN\tN\tNAME\t\t\n`;
    iif += `SPL\t\t${transaction.type}\t${transaction.date}\t${transaction.account}\t${transaction.name}\t\t${-transaction.amount}\t${transaction.reference}\t${transaction.description}\tN\t\t\t\t\t\t\t\t\n`;
    iif += 'ENDTRNS\n';
  });
  
  return Buffer.from(iif);
}

function generateSageCSV(data: any[]): Buffer {
  const headers = 'Type,Account Reference,Nominal A/C Ref,Department Code,Date,Reference,Ex.Ref,Details,Net Amount,Tax Code,Tax Amount,Exchange Rate,Gross Amount';
  const rows = data.map(row => 
    `${row.type},${row.accountRef},${row.nominalAccount},,${row.date},${row.reference},,${row.details},${row.netAmount},${row.taxCode},${row.taxAmount},1,${row.grossAmount}`
  );
  
  return Buffer.from([headers, ...rows].join('\n'));
}

function generateXeroCSV(data: any[]): Buffer {
  const headers = 'Date,Amount,Payee,Description,Reference';
  const rows = data.map(row => 
    `${row.date},${row.amount},"${row.payee}","${row.description}",${row.reference}`
  );
  
  return Buffer.from([headers, ...rows].join('\n'));
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default router;