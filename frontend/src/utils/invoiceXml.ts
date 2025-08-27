/**
 * UAE E-Invoicing XML Generation Utilities
 * Generates UBL 2.1 compliant XML for FTA Phase 2 e-invoicing
 */

import CryptoJS from 'crypto-js';
import QRCode from 'qrcode';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import type { UBLInvoiceData } from '@/components/invoice/ubl-invoice-generator';

export interface UBLValidationResult {
  isValid: boolean;
  errors: Array<{
    message: string;
    type: 'STRUCTURE' | 'BUSINESS_RULE' | 'FTA_SPECIFIC';
    path?: string;
  }>;
  warnings: Array<{
    message: string;
    type: 'RECOMMENDATION' | 'BEST_PRACTICE';
    path?: string;
  }>;
}

/**
 * Generate UBL 2.1 XML invoice according to FTA specifications
 */
export async function generateUBLXML(invoiceData: UBLInvoiceData): Promise<string> {
  const invoice = {
    Invoice: {
      '@xmlns': 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
      '@xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
      '@xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
      '@xmlns:ext': 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',

      // UBL Extensions for FTA-specific data
      'ext:UBLExtensions': {
        'ext:UBLExtension': {
          'ext:ExtensionURI': 'urn:oasis:names:specification:ubl:dsig:enveloped:xades',
          'ext:ExtensionContent': {
            // Digital signature placeholder - would contain actual signature in production
            '#text': 'Digital Signature Placeholder'
          }
        }
      },

      // UBL Version
      'cbc:UBLVersionID': '2.1',
      'cbc:CustomizationID': 'urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0',

      // Invoice identification
      'cbc:ID': invoiceData.invoiceNumber,
      'cbc:IssueDate': invoiceData.issueDate,
      'cbc:DueDate': invoiceData.dueDate || invoiceData.issueDate,
      'cbc:InvoiceTypeCode': {
        '@listID': 'UN/ECE 1001 Subset',
        '#text': invoiceData.invoiceTypeCode
      },
      'cbc:DocumentCurrencyCode': {
        '@listID': 'ISO 4217 Alpha',
        '#text': invoiceData.currencyCode
      },
      'cbc:TaxCurrencyCode': {
        '@listID': 'ISO 4217 Alpha',
        '#text': invoiceData.currencyCode
      },

      // Order reference (if applicable)
      'cac:OrderReference': {
        'cbc:ID': 'N/A'
      },

      // Supplier party (AccountingSupplierParty)
      'cac:AccountingSupplierParty': {
        'cac:Party': {
          'cac:PartyName': {
            'cbc:Name': invoiceData.supplier.name
          },
          'cac:PostalAddress': {
            'cbc:StreetName': invoiceData.supplier.address.street,
            'cbc:CityName': invoiceData.supplier.address.city,
            'cbc:PostalZone': invoiceData.supplier.address.postalCode,
            'cac:Country': {
              'cbc:IdentificationCode': {
                '@listID': 'ISO3166-1:Alpha2',
                '#text': invoiceData.supplier.address.country
              }
            }
          },
          'cac:PartyTaxScheme': {
            'cbc:CompanyID': {
              '@schemeID': 'TRN',
              '#text': invoiceData.supplier.trn
            },
            'cac:TaxScheme': {
              'cbc:ID': {
                '@schemeID': 'UN/ECE 5153',
                '@schemeAgencyID': '6',
                '#text': 'VAT'
              }
            }
          },
          'cac:PartyLegalEntity': {
            'cbc:RegistrationName': invoiceData.supplier.name,
            'cbc:CompanyID': {
              '@schemeID': 'CRN',
              '#text': invoiceData.supplier.trn // Using TRN as placeholder for CRN
            }
          },
          'cac:Contact': {
            'cbc:Telephone': invoiceData.supplier.contact?.telephone || '',
            'cbc:ElectronicMail': invoiceData.supplier.contact?.email || ''
          }
        }
      },

      // Customer party (AccountingCustomerParty)
      'cac:AccountingCustomerParty': {
        'cac:Party': {
          'cac:PartyName': {
            'cbc:Name': invoiceData.customer.name
          },
          'cac:PostalAddress': {
            'cbc:StreetName': invoiceData.customer.address.street,
            'cbc:CityName': invoiceData.customer.address.city,
            'cbc:PostalZone': invoiceData.customer.address.postalCode,
            'cac:Country': {
              'cbc:IdentificationCode': {
                '@listID': 'ISO3166-1:Alpha2',
                '#text': invoiceData.customer.address.country
              }
            }
          },
          ...(invoiceData.customer.trn && {
            'cac:PartyTaxScheme': {
              'cbc:CompanyID': {
                '@schemeID': 'TRN',
                '#text': invoiceData.customer.trn
              },
              'cac:TaxScheme': {
                'cbc:ID': {
                  '@schemeID': 'UN/ECE 5153',
                  '@schemeAgencyID': '6',
                  '#text': 'VAT'
                }
              }
            }
          }),
          'cac:PartyLegalEntity': {
            'cbc:RegistrationName': invoiceData.customer.name
          }
        }
      },

      // Payment means
      'cac:PaymentMeans': {
        'cbc:PaymentMeansCode': {
          '@listID': 'UN/ECE 4461',
          '#text': '30' // Credit transfer
        },
        'cbc:InstructionNote': invoiceData.paymentMeans || 'Bank Transfer'
      },

      // Payment terms
      'cac:PaymentTerms': {
        'cbc:Note': invoiceData.paymentTerms || 'Payment due within 30 days'
      },

      // Invoice lines
      'cac:InvoiceLine': invoiceData.invoiceLines.map(line => ({
        'cbc:ID': line.id,
        'cbc:InvoicedQuantity': {
          '@unitCode': 'EA', // Each
          '#text': line.quantity.toString()
        },
        'cbc:LineExtensionAmount': {
          '@currencyID': invoiceData.currencyCode,
          '#text': line.lineTotal.toFixed(2)
        },
        'cac:Item': {
          'cbc:Name': line.description,
          'cac:ClassifiedTaxCategory': {
            'cbc:ID': {
              '@schemeID': 'UN/ECE 5305',
              '@schemeAgencyID': '6',
              '#text': line.vatCategoryCode
            },
            'cbc:Percent': (line.vatRate * 100).toFixed(1),
            'cac:TaxScheme': {
              'cbc:ID': {
                '@schemeID': 'UN/ECE 5153',
                '@schemeAgencyID': '6',
                '#text': 'VAT'
              }
            }
          }
        },
        'cac:Price': {
          'cbc:PriceAmount': {
            '@currencyID': invoiceData.currencyCode,
            '#text': line.unitPrice.toFixed(2)
          }
        }
      })),

      // Tax totals
      'cac:TaxTotal': [
        {
          'cbc:TaxAmount': {
            '@currencyID': invoiceData.currencyCode,
            '#text': invoiceData.vatBreakdown.reduce((sum, vat) => sum + vat.taxAmount, 0).toFixed(2)
          },
          'cac:TaxSubtotal': invoiceData.vatBreakdown.map(vat => ({
            'cbc:TaxableAmount': {
              '@currencyID': invoiceData.currencyCode,
              '#text': vat.taxableAmount.toFixed(2)
            },
            'cbc:TaxAmount': {
              '@currencyID': invoiceData.currencyCode,
              '#text': vat.taxAmount.toFixed(2)
            },
            'cac:TaxCategory': {
              'cbc:ID': {
                '@schemeID': 'UN/ECE 5305',
                '@schemeAgencyID': '6',
                '#text': vat.categoryCode
              },
              'cbc:Percent': (vat.rate * 100).toFixed(1),
              'cac:TaxScheme': {
                'cbc:ID': {
                  '@schemeID': 'UN/ECE 5153',
                  '@schemeAgencyID': '6',
                  '#text': 'VAT'
                }
              }
            }
          }))
        }
      ],

      // Legal monetary totals
      'cac:LegalMonetaryTotal': {
        'cbc:LineExtensionAmount': {
          '@currencyID': invoiceData.currencyCode,
          '#text': invoiceData.lineExtensionAmount.toFixed(2)
        },
        'cbc:TaxExclusiveAmount': {
          '@currencyID': invoiceData.currencyCode,
          '#text': invoiceData.taxExclusiveAmount.toFixed(2)
        },
        'cbc:TaxInclusiveAmount': {
          '@currencyID': invoiceData.currencyCode,
          '#text': invoiceData.taxInclusiveAmount.toFixed(2)
        },
        'cbc:PayableAmount': {
          '@currencyID': invoiceData.currencyCode,
          '#text': invoiceData.payableAmount.toFixed(2)
        }
      }
    }
  };

  // Convert to XML
  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '@',
    textNodeName: '#text',
    format: true,
    indentBy: '  ',
    suppressEmptyNode: true
  });

  const xmlString = builder.build(invoice);
  return `<?xml version="1.0" encoding="UTF-8"?>\n${xmlString}`;
}

/**
 * Generate FTA-compliant QR code for invoice
 */
export async function generateInvoiceQRCode(invoiceData: UBLInvoiceData): Promise<string> {
  // FTA QR Code format as per Phase 2 requirements
  const qrData = {
    sellerName: invoiceData.supplier.name,
    vatNumber: invoiceData.supplier.trn,
    timestamp: new Date().toISOString(),
    invoiceTotal: invoiceData.payableAmount.toFixed(2),
    vatAmount: invoiceData.vatBreakdown.reduce((sum, vat) => sum + vat.taxAmount, 0).toFixed(2),
    invoiceHash: await generateInvoiceHash(invoiceData)
  };

  // Create base64 encoded QR data
  const qrString = btoa(JSON.stringify(qrData));
  
  // Generate QR code as data URL (in production, this would be a proper QR code image)
  try {
    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return qrString; // Return the data string if QR generation fails
  }
}

/**
 * Generate invoice hash for integrity verification
 */
export async function generateInvoiceHash(invoiceData: UBLInvoiceData): Promise<string> {
  // Create a canonical string representation of key invoice data
  const canonicalData = {
    invoiceNumber: invoiceData.invoiceNumber,
    issueDate: invoiceData.issueDate,
    supplierTRN: invoiceData.supplier.trn,
    customerName: invoiceData.customer.name,
    total: invoiceData.payableAmount.toFixed(2),
    vatTotal: invoiceData.vatBreakdown.reduce((sum, vat) => sum + vat.taxAmount, 0).toFixed(2)
  };

  const dataString = JSON.stringify(canonicalData);
  const hash = CryptoJS.SHA256(dataString).toString(CryptoJS.enc.Hex);
  
  return hash.substring(0, 32); // Return first 32 characters
}

/**
 * Validate UBL XML against FTA business rules
 */
export async function validateUBLXML(xmlString: string): Promise<UBLValidationResult> {
  const errors: UBLValidationResult['errors'] = [];
  const warnings: UBLValidationResult['warnings'] = [];

  try {
    // Parse XML to validate structure
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@',
      textNodeName: '#text'
    });

    const parsedXML = parser.parse(xmlString);
    const invoice = parsedXML.Invoice;

    if (!invoice) {
      errors.push({
        message: 'Invalid UBL structure: Root Invoice element not found',
        type: 'STRUCTURE',
        path: '/Invoice'
      });
      return { isValid: false, errors, warnings };
    }

    // Validate required UBL elements
    const requiredFields = [
      { path: 'cbc:ID', name: 'Invoice Number' },
      { path: 'cbc:IssueDate', name: 'Issue Date' },
      { path: 'cbc:InvoiceTypeCode', name: 'Invoice Type Code' },
      { path: 'cbc:DocumentCurrencyCode', name: 'Currency Code' },
      { path: 'cac:AccountingSupplierParty', name: 'Supplier Party' },
      { path: 'cac:AccountingCustomerParty', name: 'Customer Party' },
      { path: 'cac:LegalMonetaryTotal', name: 'Legal Monetary Total' }
    ];

    for (const field of requiredFields) {
      if (!getNestedValue(invoice, field.path)) {
        errors.push({
          message: `Missing required field: ${field.name}`,
          type: 'STRUCTURE',
          path: field.path
        });
      }
    }

    // Validate FTA-specific requirements
    validateFTARequirements(invoice, errors, warnings);

    // Validate business rules
    validateBusinessRules(invoice, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };

  } catch (error) {
    errors.push({
      message: `XML parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      type: 'STRUCTURE'
    });

    return {
      isValid: false,
      errors,
      warnings
    };
  }
}

/**
 * Validate FTA-specific business rules
 */
function validateFTARequirements(
  invoice: any,
  errors: UBLValidationResult['errors'],
  warnings: UBLValidationResult['warnings']
): void {
  // Check supplier TRN format (15 digits)
  const supplierTRN = getNestedValue(invoice, 'cac:AccountingSupplierParty.cac:Party.cac:PartyTaxScheme.cbc:CompanyID.#text');
  if (supplierTRN && !/^\d{15}$/.test(supplierTRN)) {
    errors.push({
      message: 'Supplier TRN must be 15 digits',
      type: 'FTA_SPECIFIC',
      path: 'cac:AccountingSupplierParty.cac:Party.cac:PartyTaxScheme.cbc:CompanyID'
    });
  }

  // Check customer TRN format if present
  const customerTRN = getNestedValue(invoice, 'cac:AccountingCustomerParty.cac:Party.cac:PartyTaxScheme.cbc:CompanyID.#text');
  if (customerTRN && !/^\d{15}$/.test(customerTRN)) {
    errors.push({
      message: 'Customer TRN must be 15 digits when provided',
      type: 'FTA_SPECIFIC',
      path: 'cac:AccountingCustomerParty.cac:Party.cac:PartyTaxScheme.cbc:CompanyID'
    });
  }

  // Check currency is AED
  const currency = getNestedValue(invoice, 'cbc:DocumentCurrencyCode.#text') || 
                  getNestedValue(invoice, 'cbc:DocumentCurrencyCode');
  if (currency !== 'AED') {
    warnings.push({
      message: 'UAE businesses typically use AED currency',
      type: 'RECOMMENDATION',
      path: 'cbc:DocumentCurrencyCode'
    });
  }

  // Check VAT rates are valid (0%, 5%)
  const invoiceLines = invoice['cac:InvoiceLine'];
  const lines = Array.isArray(invoiceLines) ? invoiceLines : [invoiceLines];
  
  if (lines) {
    lines.forEach((line: any, index: number) => {
      const vatPercent = parseFloat(getNestedValue(line, 'cac:Item.cac:ClassifiedTaxCategory.cbc:Percent') || '0');
      if (vatPercent !== 0 && vatPercent !== 5) {
        warnings.push({
          message: `Line ${index + 1}: UAE VAT rate should be 0% or 5%`,
          type: 'RECOMMENDATION',
          path: `cac:InvoiceLine[${index}].cac:Item.cac:ClassifiedTaxCategory.cbc:Percent`
        });
      }
    });
  }
}

/**
 * Validate general business rules
 */
function validateBusinessRules(
  invoice: any,
  errors: UBLValidationResult['errors'],
  warnings: UBLValidationResult['warnings']
): void {
  // Check that issue date is not in the future
  const issueDate = getNestedValue(invoice, 'cbc:IssueDate');
  if (issueDate && new Date(issueDate) > new Date()) {
    warnings.push({
      message: 'Issue date is in the future',
      type: 'BEST_PRACTICE',
      path: 'cbc:IssueDate'
    });
  }

  // Check that due date is after issue date
  const dueDate = getNestedValue(invoice, 'cbc:DueDate');
  if (issueDate && dueDate && new Date(dueDate) < new Date(issueDate)) {
    errors.push({
      message: 'Due date must be after issue date',
      type: 'BUSINESS_RULE',
      path: 'cbc:DueDate'
    });
  }

  // Validate monetary totals consistency
  const lineExtension = parseFloat(getNestedValue(invoice, 'cac:LegalMonetaryTotal.cbc:LineExtensionAmount.#text') || '0');
  const taxExclusive = parseFloat(getNestedValue(invoice, 'cac:LegalMonetaryTotal.cbc:TaxExclusiveAmount.#text') || '0');
  const taxInclusive = parseFloat(getNestedValue(invoice, 'cac:LegalMonetaryTotal.cbc:TaxInclusiveAmount.#text') || '0');
  
  if (Math.abs(lineExtension - taxExclusive) > 0.01) {
    errors.push({
      message: 'Line extension amount must equal tax exclusive amount when no allowances/charges',
      type: 'BUSINESS_RULE',
      path: 'cac:LegalMonetaryTotal'
    });
  }

  if (taxInclusive < taxExclusive) {
    errors.push({
      message: 'Tax inclusive amount must be greater than or equal to tax exclusive amount',
      type: 'BUSINESS_RULE',
      path: 'cac:LegalMonetaryTotal'
    });
  }
}

/**
 * Helper function to get nested object values
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

/**
 * Sign UBL XML with digital signature (placeholder implementation)
 * In production, this would use proper cryptographic signing
 */
export async function signUBLXML(xmlString: string, privateKey: string): Promise<string> {
  // This is a placeholder - actual implementation would use xml-crypto
  // or similar library for proper XML digital signatures
  
  const signature = CryptoJS.HmacSHA256(xmlString, privateKey).toString();
  
  // Insert signature into UBL extensions
  const signatureBlock = `
    <ext:UBLExtension>
      <ext:ExtensionURI>urn:oasis:names:specification:ubl:dsig:enveloped:xades</ext:ExtensionURI>
      <ext:ExtensionContent>
        <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
          <ds:SignatureValue>${signature}</ds:SignatureValue>
        </ds:Signature>
      </ext:ExtensionContent>
    </ext:UBLExtension>`;
  
  return xmlString.replace(
    '<ext:ExtensionContent>',
    `<ext:ExtensionContent>${signatureBlock}`
  );
}