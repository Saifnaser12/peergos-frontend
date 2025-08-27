import { FinancialStatements } from './financial-statements';
import { formatCurrency } from './business-logic';

// PDF Export using browser's print functionality
export async function exportToPDF(statements: FinancialStatements): Promise<void> {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const htmlContent = generatePrintableHTML(statements);
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Wait for content to load
  printWindow.onload = () => {
    printWindow.print();
    printWindow.close();
  };
}

// Excel Export (CSV format for simplicity)
export async function exportToExcel(statements: FinancialStatements): Promise<void> {
  const csvContent = generateCSVContent(statements);
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${statements.companyInfo.name}_Financial_Statements.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// JSON Export
export async function exportToJSON(statements: FinancialStatements): Promise<void> {
  const jsonContent = JSON.stringify(statements, null, 2);
  
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${statements.companyInfo.name}_Financial_Statements.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// XML Export for e-auditing
export async function exportToXML(statements: FinancialStatements): Promise<void> {
  const xmlContent = generateXMLContent(statements);
  
  const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${statements.companyInfo.name}_Financial_Statements.xml`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function generatePrintableHTML(statements: FinancialStatements): string {
  const { companyInfo, period, incomeStatement, balanceSheet, cashFlow, notes } = statements;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Financial Statements - ${companyInfo.name}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
          line-height: 1.5;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .company-name {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .statement-title {
          font-size: 18px;
          color: #666;
        }
        .company-details {
          display: flex;
          justify-content: space-between;
          margin: 20px 0;
          font-size: 12px;
        }
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .section-title {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 15px;
          padding-bottom: 5px;
          border-bottom: 1px solid #ccc;
        }
        .financial-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .financial-table th,
        .financial-table td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        .financial-table th {
          background-color: #f8f9fa;
          font-weight: 600;
        }
        .amount {
          text-align: right;
          font-family: 'SF Mono', Monaco, monospace;
        }
        .total-row {
          border-top: 2px solid #333;
          font-weight: bold;
        }
        .subtotal-row {
          border-top: 1px solid #666;
          font-weight: 600;
        }
        .notes {
          font-size: 12px;
          margin-top: 30px;
        }
        .notes h4 {
          margin-bottom: 10px;
          font-weight: 600;
        }
        .notes p {
          margin-bottom: 15px;
          text-align: justify;
        }
        @media print {
          body { margin: 0; }
          .section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        <div class="company-name">${companyInfo.name}</div>
        <div class="statement-title">Financial Statements</div>
        <div>For the period ended ${new Date(period.endDate).toLocaleDateString()}</div>
        ${companyInfo.isFreeZone ? '<div style="color: #10b981; font-weight: 600;">Free Zone Entity</div>' : ''}
      </div>

      <!-- Company Details -->
      <div class="company-details">
        <div><strong>TRN:</strong> ${companyInfo.trn}</div>
        <div><strong>License:</strong> ${companyInfo.licenseNumber}</div>
        <div><strong>Basis:</strong> ${companyInfo.accountingBasis}</div>
        <div><strong>Generated:</strong> ${new Date().toLocaleDateString()}</div>
      </div>

      <!-- Income Statement -->
      <div class="section">
        <div class="section-title">Income Statement</div>
        <table class="financial-table">
          <tbody>
            <tr><th colspan="2">Revenue</th></tr>
            <tr><td>Operating Revenue</td><td class="amount">${formatCurrency(incomeStatement.revenue.operatingRevenue)}</td></tr>
            <tr><td>Other Income</td><td class="amount">${formatCurrency(incomeStatement.revenue.otherIncome)}</td></tr>
            <tr class="subtotal-row"><td>Total Revenue</td><td class="amount">${formatCurrency(incomeStatement.revenue.totalRevenue)}</td></tr>
            
            <tr><th colspan="2">Expenses</th></tr>
            <tr><td>Cost of Sales</td><td class="amount">(${formatCurrency(incomeStatement.expenses.costOfSales)})</td></tr>
            <tr><td>Operating Expenses</td><td class="amount">(${formatCurrency(incomeStatement.expenses.operatingExpenses)})</td></tr>
            <tr><td>Administrative Expenses</td><td class="amount">(${formatCurrency(incomeStatement.expenses.administrativeExpenses)})</td></tr>
            <tr><td>Finance Expenses</td><td class="amount">(${formatCurrency(incomeStatement.expenses.financeExpenses)})</td></tr>
            <tr><td>Other Expenses</td><td class="amount">(${formatCurrency(incomeStatement.expenses.otherExpenses)})</td></tr>
            <tr class="subtotal-row"><td>Total Expenses</td><td class="amount">(${formatCurrency(incomeStatement.expenses.totalExpenses)})</td></tr>
            
            <tr><th colspan="2">Results</th></tr>
            <tr><td>Gross Profit</td><td class="amount">${formatCurrency(incomeStatement.grossProfit)}</td></tr>
            <tr><td>Operating Profit</td><td class="amount">${formatCurrency(incomeStatement.operatingProfit)}</td></tr>
            <tr class="total-row"><td><strong>Net Income</strong></td><td class="amount"><strong>${formatCurrency(incomeStatement.netIncome)}</strong></td></tr>
          </tbody>
        </table>
      </div>

      <!-- Balance Sheet -->
      <div class="section">
        <div class="section-title">Balance Sheet</div>
        <table class="financial-table">
          <tbody>
            <tr><th colspan="2">Assets</th></tr>
            <tr><th colspan="2">Current Assets</th></tr>
            <tr><td>Cash and Bank</td><td class="amount">${formatCurrency(balanceSheet.assets.currentAssets.cash)}</td></tr>
            <tr><td>Accounts Receivable</td><td class="amount">${formatCurrency(balanceSheet.assets.currentAssets.accountsReceivable)}</td></tr>
            <tr><td>Inventory</td><td class="amount">${formatCurrency(balanceSheet.assets.currentAssets.inventory)}</td></tr>
            <tr><td>Prepaid Expenses</td><td class="amount">${formatCurrency(balanceSheet.assets.currentAssets.prepaidExpenses)}</td></tr>
            <tr class="subtotal-row"><td>Total Current Assets</td><td class="amount">${formatCurrency(balanceSheet.assets.currentAssets.totalCurrentAssets)}</td></tr>
            
            <tr><th colspan="2">Non-Current Assets</th></tr>
            <tr><td>Property, Plant & Equipment</td><td class="amount">${formatCurrency(balanceSheet.assets.nonCurrentAssets.propertyPlantEquipment)}</td></tr>
            <tr><td>Intangible Assets</td><td class="amount">${formatCurrency(balanceSheet.assets.nonCurrentAssets.intangibleAssets)}</td></tr>
            <tr><td>Investments</td><td class="amount">${formatCurrency(balanceSheet.assets.nonCurrentAssets.investments)}</td></tr>
            <tr class="subtotal-row"><td>Total Non-Current Assets</td><td class="amount">${formatCurrency(balanceSheet.assets.nonCurrentAssets.totalNonCurrentAssets)}</td></tr>
            <tr class="total-row"><td><strong>Total Assets</strong></td><td class="amount"><strong>${formatCurrency(balanceSheet.assets.totalAssets)}</strong></td></tr>
            
            <tr><th colspan="2">Liabilities and Equity</th></tr>
            <tr><th colspan="2">Current Liabilities</th></tr>
            <tr><td>Accounts Payable</td><td class="amount">${formatCurrency(balanceSheet.liabilities.currentLiabilities.accountsPayable)}</td></tr>
            <tr><td>Short-term Loans</td><td class="amount">${formatCurrency(balanceSheet.liabilities.currentLiabilities.shortTermLoans)}</td></tr>
            <tr><td>Accrued Expenses</td><td class="amount">${formatCurrency(balanceSheet.liabilities.currentLiabilities.accruedExpenses)}</td></tr>
            <tr><td>Tax Payable</td><td class="amount">${formatCurrency(balanceSheet.liabilities.currentLiabilities.taxPayable)}</td></tr>
            <tr class="subtotal-row"><td>Total Current Liabilities</td><td class="amount">${formatCurrency(balanceSheet.liabilities.currentLiabilities.totalCurrentLiabilities)}</td></tr>
            
            <tr><th colspan="2">Equity</th></tr>
            <tr><td>Share Capital</td><td class="amount">${formatCurrency(balanceSheet.equity.shareCapital)}</td></tr>
            <tr><td>Retained Earnings</td><td class="amount">${formatCurrency(balanceSheet.equity.retainedEarnings)}</td></tr>
            <tr><td>Current Year Earnings</td><td class="amount">${formatCurrency(balanceSheet.equity.currentYearEarnings)}</td></tr>
            <tr class="subtotal-row"><td>Total Equity</td><td class="amount">${formatCurrency(balanceSheet.equity.totalEquity)}</td></tr>
            <tr class="total-row"><td><strong>Total Liabilities & Equity</strong></td><td class="amount"><strong>${formatCurrency(balanceSheet.totalLiabilitiesAndEquity)}</strong></td></tr>
          </tbody>
        </table>
      </div>

      <!-- Cash Flow -->
      <div class="section">
        <div class="section-title">Cash Flow Statement</div>
        <table class="financial-table">
          <tbody>
            <tr><th colspan="2">Operating Activities</th></tr>
            <tr><td>Net Income</td><td class="amount">${formatCurrency(cashFlow.operatingActivities.netIncome)}</td></tr>
            <tr><td>Depreciation</td><td class="amount">${formatCurrency(cashFlow.operatingActivities.adjustments.depreciation)}</td></tr>
            <tr><td>Change in Receivables</td><td class="amount">(${formatCurrency(Math.abs(cashFlow.operatingActivities.adjustments.changeInReceivables))})</td></tr>
            <tr><td>Change in Inventory</td><td class="amount">(${formatCurrency(Math.abs(cashFlow.operatingActivities.adjustments.changeInInventory))})</td></tr>
            <tr><td>Change in Payables</td><td class="amount">${formatCurrency(cashFlow.operatingActivities.adjustments.changeInPayables)}</td></tr>
            <tr class="subtotal-row"><td>Net Cash from Operating</td><td class="amount">${formatCurrency(cashFlow.operatingActivities.netCashFromOperating)}</td></tr>
            
            <tr><th colspan="2">Summary</th></tr>
            <tr><td>Net Cash Flow</td><td class="amount">${formatCurrency(cashFlow.netCashFlow)}</td></tr>
            <tr><td>Opening Cash</td><td class="amount">${formatCurrency(cashFlow.openingCash)}</td></tr>
            <tr class="total-row"><td><strong>Closing Cash</strong></td><td class="amount"><strong>${formatCurrency(cashFlow.closingCash)}</strong></td></tr>
          </tbody>
        </table>
      </div>

      <!-- Notes -->
      <div class="notes">
        <div class="section-title">Notes to Financial Statements</div>
        ${notes.map((note, index) => {
          const lines = note.split('\n');
          const title = lines[0];
          const content = lines.slice(1).join('<br>');
          return `<h4>${title}</h4>${content ? `<p>${content}</p>` : ''}`;
        }).join('')}
      </div>
    </body>
    </html>
  `;
}

function generateCSVContent(statements: FinancialStatements): string {
  const { companyInfo, incomeStatement, balanceSheet } = statements;
  
  let csv = `Financial Statements - ${companyInfo.name}\n`;
  csv += `TRN,${companyInfo.trn}\n`;
  csv += `Period,${statements.period.startDate} to ${statements.period.endDate}\n\n`;
  
  // Income Statement
  csv += `Income Statement\n`;
  csv += `Revenue,,\n`;
  csv += `Operating Revenue,${incomeStatement.revenue.operatingRevenue}\n`;
  csv += `Other Income,${incomeStatement.revenue.otherIncome}\n`;
  csv += `Total Revenue,${incomeStatement.revenue.totalRevenue}\n\n`;
  
  csv += `Expenses,,\n`;
  csv += `Cost of Sales,${incomeStatement.expenses.costOfSales}\n`;
  csv += `Operating Expenses,${incomeStatement.expenses.operatingExpenses}\n`;
  csv += `Administrative Expenses,${incomeStatement.expenses.administrativeExpenses}\n`;
  csv += `Finance Expenses,${incomeStatement.expenses.financeExpenses}\n`;
  csv += `Other Expenses,${incomeStatement.expenses.otherExpenses}\n`;
  csv += `Total Expenses,${incomeStatement.expenses.totalExpenses}\n\n`;
  
  csv += `Net Income,${incomeStatement.netIncome}\n\n`;
  
  // Balance Sheet
  csv += `Balance Sheet\n`;
  csv += `Assets,,\n`;
  csv += `Cash,${balanceSheet.assets.currentAssets.cash}\n`;
  csv += `Accounts Receivable,${balanceSheet.assets.currentAssets.accountsReceivable}\n`;
  csv += `Total Assets,${balanceSheet.assets.totalAssets}\n\n`;
  
  csv += `Liabilities,,\n`;
  csv += `Accounts Payable,${balanceSheet.liabilities.currentLiabilities.accountsPayable}\n`;
  csv += `Total Liabilities,${balanceSheet.liabilities.totalLiabilities}\n\n`;
  
  csv += `Equity,,\n`;
  csv += `Share Capital,${balanceSheet.equity.shareCapital}\n`;
  csv += `Retained Earnings,${balanceSheet.equity.retainedEarnings}\n`;
  csv += `Total Equity,${balanceSheet.equity.totalEquity}\n`;
  
  return csv;
}

function generateXMLContent(statements: FinancialStatements): string {
  const { companyInfo, period, incomeStatement, balanceSheet, cashFlow, notes } = statements;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<FinancialStatements xmlns="http://fta.gov.ae/schemas/financial-statements" version="1.0">
  <CompanyInfo>
    <Name>${companyInfo.name}</Name>
    <TRN>${companyInfo.trn}</TRN>
    <LicenseNumber>${companyInfo.licenseNumber}</LicenseNumber>
    <Address>${companyInfo.address}</Address>
    <IsFreeZone>${companyInfo.isFreeZone}</IsFreeZone>
    <AccountingBasis>${companyInfo.accountingBasis}</AccountingBasis>
    <FiscalYearEnd>${companyInfo.fiscalYearEnd}</FiscalYearEnd>
  </CompanyInfo>
  
  <Period>
    <StartDate>${period.startDate}</StartDate>
    <EndDate>${period.endDate}</EndDate>
  </Period>
  
  <IncomeStatement>
    <Revenue>
      <OperatingRevenue>${incomeStatement.revenue.operatingRevenue}</OperatingRevenue>
      <OtherIncome>${incomeStatement.revenue.otherIncome}</OtherIncome>
      <TotalRevenue>${incomeStatement.revenue.totalRevenue}</TotalRevenue>
    </Revenue>
    <Expenses>
      <CostOfSales>${incomeStatement.expenses.costOfSales}</CostOfSales>
      <OperatingExpenses>${incomeStatement.expenses.operatingExpenses}</OperatingExpenses>
      <AdministrativeExpenses>${incomeStatement.expenses.administrativeExpenses}</AdministrativeExpenses>
      <FinanceExpenses>${incomeStatement.expenses.financeExpenses}</FinanceExpenses>
      <OtherExpenses>${incomeStatement.expenses.otherExpenses}</OtherExpenses>
      <TotalExpenses>${incomeStatement.expenses.totalExpenses}</TotalExpenses>
    </Expenses>
    <NetIncome>${incomeStatement.netIncome}</NetIncome>
  </IncomeStatement>
  
  <BalanceSheet>
    <Assets>
      <CurrentAssets>
        <Cash>${balanceSheet.assets.currentAssets.cash}</Cash>
        <AccountsReceivable>${balanceSheet.assets.currentAssets.accountsReceivable}</AccountsReceivable>
        <Inventory>${balanceSheet.assets.currentAssets.inventory}</Inventory>
        <PrepaidExpenses>${balanceSheet.assets.currentAssets.prepaidExpenses}</PrepaidExpenses>
        <Total>${balanceSheet.assets.currentAssets.totalCurrentAssets}</Total>
      </CurrentAssets>
      <NonCurrentAssets>
        <PropertyPlantEquipment>${balanceSheet.assets.nonCurrentAssets.propertyPlantEquipment}</PropertyPlantEquipment>
        <IntangibleAssets>${balanceSheet.assets.nonCurrentAssets.intangibleAssets}</IntangibleAssets>
        <Investments>${balanceSheet.assets.nonCurrentAssets.investments}</Investments>
        <Total>${balanceSheet.assets.nonCurrentAssets.totalNonCurrentAssets}</Total>
      </NonCurrentAssets>
      <TotalAssets>${balanceSheet.assets.totalAssets}</TotalAssets>
    </Assets>
    <Liabilities>
      <CurrentLiabilities>
        <AccountsPayable>${balanceSheet.liabilities.currentLiabilities.accountsPayable}</AccountsPayable>
        <ShortTermLoans>${balanceSheet.liabilities.currentLiabilities.shortTermLoans}</ShortTermLoans>
        <AccruedExpenses>${balanceSheet.liabilities.currentLiabilities.accruedExpenses}</AccruedExpenses>
        <TaxPayable>${balanceSheet.liabilities.currentLiabilities.taxPayable}</TaxPayable>
        <Total>${balanceSheet.liabilities.currentLiabilities.totalCurrentLiabilities}</Total>
      </CurrentLiabilities>
      <NonCurrentLiabilities>
        <LongTermLoans>${balanceSheet.liabilities.nonCurrentLiabilities.longTermLoans}</LongTermLoans>
        <Provisions>${balanceSheet.liabilities.nonCurrentLiabilities.provisions}</Provisions>
        <Total>${balanceSheet.liabilities.nonCurrentLiabilities.totalNonCurrentLiabilities}</Total>
      </NonCurrentLiabilities>
      <TotalLiabilities>${balanceSheet.liabilities.totalLiabilities}</TotalLiabilities>
    </Liabilities>
    <Equity>
      <ShareCapital>${balanceSheet.equity.shareCapital}</ShareCapital>
      <RetainedEarnings>${balanceSheet.equity.retainedEarnings}</RetainedEarnings>
      <CurrentYearEarnings>${balanceSheet.equity.currentYearEarnings}</CurrentYearEarnings>
      <TotalEquity>${balanceSheet.equity.totalEquity}</TotalEquity>
    </Equity>
  </BalanceSheet>
  
  <CashFlow>
    <OperatingActivities>
      <NetIncome>${cashFlow.operatingActivities.netIncome}</NetIncome>
      <NetCashFromOperating>${cashFlow.operatingActivities.netCashFromOperating}</NetCashFromOperating>
    </OperatingActivities>
    <InvestingActivities>
      <NetCashFromInvesting>${cashFlow.investingActivities.netCashFromInvesting}</NetCashFromInvesting>
    </InvestingActivities>
    <FinancingActivities>
      <NetCashFromFinancing>${cashFlow.financingActivities.netCashFromFinancing}</NetCashFromFinancing>
    </FinancingActivities>
    <NetCashFlow>${cashFlow.netCashFlow}</NetCashFlow>
    <OpeningCash>${cashFlow.openingCash}</OpeningCash>
    <ClosingCash>${cashFlow.closingCash}</ClosingCash>
  </CashFlow>
  
  <Notes>
    ${notes.map(note => `<Note>${note.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Note>`).join('\n    ')}
  </Notes>
  
  <GenerationInfo>
    <GeneratedDate>${statements.generationDate}</GeneratedDate>
    <GeneratedBy>Peergos UAE Tax Compliance System</GeneratedBy>
  </GenerationInfo>
</FinancialStatements>`;
}