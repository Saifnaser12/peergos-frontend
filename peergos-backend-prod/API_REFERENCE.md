# Peergos Backend API Reference

## 🔗 Base URL
- **Development**: `http://localhost:8080`
- **Production**: `https://api.peergos.ae`

## 🔐 Authentication

All API endpoints require authentication except health checks. Use session-based authentication:

```javascript
// Login to establish session
POST /api/auth/login
{
  "username": "admin",
  "password": "password"
}

// Session cookie will be set automatically
// Include in subsequent requests
```

## 📚 Core API Endpoints

### Authentication & Users

#### `POST /api/auth/login`
Authenticate user and establish session.

**Request Body**:
```json
{
  "username": "string",
  "password": "string"
}
```

**Response**:
```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@company.com",
    "role": "ADMIN",
    "firstName": "Admin",
    "lastName": "User"
  },
  "message": "Login successful"
}
```

#### `POST /api/auth/logout`
Terminate current session.

**Response**:
```json
{
  "message": "Logout successful"
}
```

#### `GET /api/users/me`
Get current user profile.

**Response**:
```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@company.com",
    "role": "ADMIN",
    "firstName": "Admin",
    "lastName": "User",
    "companyId": 1,
    "isActive": true
  }
}
```

### Company Management

#### `GET /api/companies/:id`
Get company details.

**Response**:
```json
{
  "company": {
    "id": 1,
    "name": "ABC Trading LLC",
    "trn": "100123456789012",
    "address": "Dubai, UAE",
    "phone": "+971-4-1234567",
    "email": "contact@abctrading.ae",
    "industry": "Trading",
    "emirate": "Dubai",
    "freeZone": false,
    "vatRegistered": true,
    "citRegistrationRequired": true,
    "qfzpStatus": false,
    "expectedAnnualRevenue": "10000000.00",
    "setupCompleted": true
  }
}
```

#### `PUT /api/companies/:id`
Update company settings.

**Request Body**:
```json
{
  "name": "ABC Trading LLC",
  "trn": "100123456789012",
  "address": "Dubai, UAE",
  "vatRegistered": true,
  "expectedAnnualRevenue": "12000000.00"
}
```

### Financial Transactions

#### `GET /api/transactions`
List transactions with pagination.

**Query Parameters**:
- `page`: number (default: 1)
- `limit`: number (default: 50)
- `type`: REVENUE | EXPENSE
- `startDate`: ISO date string
- `endDate`: ISO date string

**Response**:
```json
{
  "transactions": [
    {
      "id": 1,
      "companyId": 1,
      "type": "REVENUE",
      "category": "Sales",
      "description": "Product sales",
      "amount": "1000.00",
      "vatAmount": "50.00",
      "transactionDate": "2025-08-29T00:00:00Z",
      "status": "PROCESSED"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

#### `POST /api/transactions`
Create new transaction.

**Request Body**:
```json
{
  "type": "REVENUE",
  "category": "Sales",
  "description": "Product sales",
  "amount": 1000.00,
  "vatAmount": 50.00,
  "transactionDate": "2025-08-29T00:00:00Z",
  "attachments": ["invoice_001.pdf"]
}
```

### Tax Calculations

#### `POST /api/vat/calculate`
Calculate VAT for given transactions.

**Request Body**:
```json
{
  "items": [
    {
      "description": "Software License",
      "amount": 1000,
      "vatRate": 5,
      "isExempt": false,
      "isZeroRated": false
    }
  ],
  "customerType": "B2B",
  "isExport": false,
  "reverseLiability": false
}
```

**Response**:
```json
{
  "calculation": {
    "subtotal": 1000.00,
    "vatAmount": 50.00,
    "total": 1050.00,
    "effectiveRate": 5.0,
    "breakdown": [
      {
        "item": "Software License",
        "amount": 1000.00,
        "vatRate": 5.0,
        "vatAmount": 50.00
      }
    ]
  },
  "metadata": {
    "calculatedAt": "2025-08-29T10:00:00Z",
    "calculationId": "calc_123456"
  }
}
```

#### `POST /api/cit/calculate`
Calculate Corporate Income Tax.

**Request Body**:
```json
{
  "revenue": 5000000,
  "expenses": 3000000,
  "otherIncome": 100000,
  "allowableDeductions": 200000,
  "isQFZP": false,
  "hasSmallBusinessRelief": true,
  "previousLosses": 0,
  "financialYear": "2024"
}
```

**Response**:
```json
{
  "calculation": {
    "grossProfit": 2000000,
    "taxableIncome": 1900000,
    "smallBusinessRelief": 1900000,
    "taxableAfterRelief": 0,
    "citRate": 9.0,
    "citAmount": 0,
    "effectiveRate": 0.0,
    "breakdown": {
      "revenue": 5000000,
      "expenses": 3000000,
      "grossProfit": 2000000,
      "deductions": 200000,
      "taxableIncome": 1900000,
      "reliefApplied": 1900000,
      "finalTaxableAmount": 0
    }
  },
  "eligibility": {
    "smallBusinessRelief": true,
    "qfzpBenefit": false,
    "lossCarryForward": false
  }
}
```

### E-Invoicing

#### `GET /api/invoices`
List invoices.

**Response**:
```json
{
  "invoices": [
    {
      "id": 1,
      "invoiceNumber": "INV-2025-001",
      "companyId": 1,
      "customerName": "Customer LLC",
      "customerTRN": "100987654321098",
      "totalAmount": 1050.00,
      "vatAmount": 50.00,
      "status": "ISSUED",
      "issueDate": "2025-08-29T00:00:00Z",
      "dueDate": "2025-09-28T00:00:00Z"
    }
  ]
}
```

#### `POST /api/invoices`
Create new invoice.

**Request Body**:
```json
{
  "customerName": "Customer LLC",
  "customerTRN": "100987654321098",
  "customerAddress": "Abu Dhabi, UAE",
  "items": [
    {
      "description": "Software License",
      "quantity": 1,
      "unitPrice": 1000.00,
      "vatRate": 5.0
    }
  ],
  "dueDate": "2025-09-28T00:00:00Z"
}
```

#### `GET /api/invoices/:id/xml`
Generate UBL 2.1 XML for invoice.

**Response**: XML file download

#### `GET /api/invoices/:id/qr`
Generate QR code for invoice.

**Response**: PNG image

### Document Management

#### `GET /api/documents`
List documents.

**Query Parameters**:
- `type`: string (invoice, receipt, contract, etc.)
- `companyId`: number

**Response**:
```json
{
  "documents": [
    {
      "id": 1,
      "filename": "invoice_001.pdf",
      "originalName": "Invoice 001.pdf",
      "mimeType": "application/pdf",
      "size": 245760,
      "type": "invoice",
      "companyId": 1,
      "uploadedAt": "2025-08-29T10:00:00Z"
    }
  ]
}
```

#### `POST /api/documents/upload`
Upload document.

**Request**: Multipart form data
- `file`: File upload
- `type`: Document type
- `description`: Optional description

**Response**:
```json
{
  "document": {
    "id": 1,
    "filename": "invoice_001.pdf",
    "originalName": "Invoice 001.pdf",
    "mimeType": "application/pdf",
    "size": 245760,
    "type": "invoice"
  }
}
```

### Reporting & Analytics

#### `GET /api/kpi-data`
Get key performance indicators.

**Response**:
```json
{
  "kpiData": [
    {
      "period": "2025-08",
      "revenue": 150000.00,
      "expenses": 80000.00,
      "profit": 70000.00,
      "vatCollected": 7500.00,
      "vatPaid": 4000.00,
      "transactionCount": 45,
      "invoiceCount": 12
    }
  ]
}
```

#### `GET /api/calculation-audit`
Get tax calculation audit trail.

**Response**:
```json
{
  "auditTrail": [
    {
      "id": 1,
      "calculationType": "VAT",
      "inputData": { "amount": 1000, "rate": 5 },
      "result": { "vatAmount": 50, "total": 1050 },
      "calculatedAt": "2025-08-29T10:00:00Z",
      "calculatedBy": 1
    }
  ]
}
```

#### `GET /api/cross-module-data`
Get unified dashboard data.

**Response**:
```json
{
  "transactions": [],
  "company": {
    "id": 1,
    "name": "ABC Trading LLC",
    "setupCompleted": true
  },
  "kpiSummary": {
    "monthlyRevenue": 150000,
    "monthlyExpenses": 80000,
    "vatLiability": 3500
  },
  "recentActivity": [
    {
      "type": "transaction",
      "description": "New sale recorded",
      "timestamp": "2025-08-29T10:00:00Z"
    }
  ]
}
```

### Data Management

#### `POST /api/data-export`
Export company data.

**Request Body**:
```json
{
  "format": "csv", // csv, xlsx, json
  "dataTypes": ["transactions", "invoices", "tax_filings"],
  "dateRange": {
    "startDate": "2025-01-01",
    "endDate": "2025-12-31"
  }
}
```

**Response**:
```json
{
  "exportJob": {
    "id": "export_123456",
    "status": "processing",
    "createdAt": "2025-08-29T10:00:00Z",
    "downloadUrl": null
  }
}
```

#### `POST /api/data-import`
Import transactions or data.

**Request**: Multipart form data
- `file`: CSV/Excel file
- `type`: Data type (transactions, chart_of_accounts)
- `mapping`: Field mapping configuration

## 🔧 System Endpoints

#### `GET /health`
Basic health check.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-08-29T10:00:00Z"
}
```

#### `GET /api/health`
Detailed health check.

**Response**:
```json
{
  "status": "healthy",
  "database": "connected",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "production"
}
```

## 📊 Chart of Accounts

#### `GET /api/chart-of-accounts`
Get UAE Chart of Accounts.

**Response**:
```json
{
  "accounts": [
    {
      "code": "1000",
      "name": "Cash",
      "type": "ASSET",
      "category": "CURRENT_ASSET",
      "vatTreatment": "N/A",
      "citDeductible": false
    }
  ]
}
```

## ❌ Error Responses

All error responses follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {},
    "timestamp": "2025-08-29T10:00:00Z",
    "requestId": "req_123456"
  }
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `422` - Unprocessable Entity (business logic error)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## 🚦 Rate Limiting

- **Default**: 200 requests per minute per IP
- **Burst**: Up to 50 requests in 10 seconds
- **Headers**: Rate limit info in response headers
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

## 📝 Request/Response Examples

### Complete Transaction Flow

1. **Login**:
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' \
  -c cookies.txt
```

2. **Create Transaction**:
```bash
curl -X POST http://localhost:8080/api/transactions \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "type": "REVENUE",
    "category": "Sales",
    "description": "Product sales",
    "amount": 1000.00,
    "vatAmount": 50.00,
    "transactionDate": "2025-08-29T00:00:00Z"
  }'
```

3. **Calculate VAT**:
```bash
curl -X POST http://localhost:8080/api/vat/calculate \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "items": [
      {
        "description": "Software License",
        "amount": 1000,
        "vatRate": 5
      }
    ],
    "customerType": "B2B"
  }'
```

---

**Last Updated**: August 29, 2025  
**API Version**: 1.0.0  
**Base URL**: `https://api.peergos.ae`