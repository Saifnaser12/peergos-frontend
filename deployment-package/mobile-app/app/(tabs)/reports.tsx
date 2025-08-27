import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function ReportsScreen() {
  const financialData = {
    revenue: 125000,
    expenses: 45000,
    netIncome: 80000,
    vatCollected: 6250,
    vatPaid: 2250,
    citLiability: 18750,
  };

  const reports = [
    { id: 1, title: 'Profit & Loss Statement', type: 'P&L', period: 'Q4 2024', icon: 'trending-up' },
    { id: 2, title: 'Balance Sheet', type: 'Balance', period: 'Q4 2024', icon: 'account-balance' },
    { id: 3, title: 'VAT Return', type: 'VAT', period: 'Q4 2024', icon: 'receipt' },
    { id: 4, title: 'CIT Return', type: 'CIT', period: 'FY 2024', icon: 'description' },
    { id: 5, title: 'Cash Flow Statement', type: 'Cash Flow', period: 'Q4 2024', icon: 'payments' },
    { id: 6, title: 'Trial Balance', type: 'Trial', period: 'Dec 2024', icon: 'balance' },
  ];

  const chartData = [
    { label: 'Revenue', value: financialData.revenue, color: '#4CAF50' },
    { label: 'Expenses', value: financialData.expenses, color: '#F44336' },
    { label: 'Net Income', value: financialData.netIncome, color: '#2196F3' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Financial Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financial Overview</Text>
        <View style={styles.overviewGrid}>
          <View style={[styles.overviewCard, { backgroundColor: '#E8F5E8' }]}>
            <MaterialIcons name="trending-up" size={24} color="#4CAF50" />
            <Text style={styles.overviewLabel}>Revenue</Text>
            <Text style={[styles.overviewValue, { color: '#4CAF50' }]}>
              {financialData.revenue.toLocaleString()} AED
            </Text>
          </View>
          
          <View style={[styles.overviewCard, { backgroundColor: '#FFF0F0' }]}>
            <MaterialIcons name="trending-down" size={24} color="#F44336" />
            <Text style={styles.overviewLabel}>Expenses</Text>
            <Text style={[styles.overviewValue, { color: '#F44336' }]}>
              {financialData.expenses.toLocaleString()} AED
            </Text>
          </View>
          
          <View style={[styles.overviewCard, { backgroundColor: '#F0F8FF' }]}>
            <MaterialIcons name="account-balance" size={24} color="#2196F3" />
            <Text style={styles.overviewLabel}>Net Income</Text>
            <Text style={[styles.overviewValue, { color: '#2196F3' }]}>
              {financialData.netIncome.toLocaleString()} AED
            </Text>
          </View>
          
          <View style={[styles.overviewCard, { backgroundColor: '#FFF8E1' }]}>
            <MaterialIcons name="receipt" size={24} color="#FF9800" />
            <Text style={styles.overviewLabel}>VAT Net</Text>
            <Text style={[styles.overviewValue, { color: '#FF9800' }]}>
              {(financialData.vatCollected - financialData.vatPaid).toLocaleString()} AED
            </Text>
          </View>
        </View>
      </View>

      {/* Chart Visualization */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Chart</Text>
        <View style={styles.chartContainer}>
          {chartData.map((item, index) => (
            <View key={index} style={styles.chartItem}>
              <View style={styles.chartBarContainer}>
                <View 
                  style={[
                    styles.chartBar, 
                    { 
                      backgroundColor: item.color,
                      height: (item.value / Math.max(...chartData.map(d => d.value))) * 120
                    }
                  ]} 
                />
              </View>
              <Text style={styles.chartLabel}>{item.label}</Text>
              <Text style={[styles.chartValue, { color: item.color }]}>
                {item.value.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Available Reports */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Reports</Text>
        {reports.map((report) => (
          <TouchableOpacity key={report.id} style={styles.reportCard}>
            <View style={styles.reportLeft}>
              <View style={styles.reportIcon}>
                <MaterialIcons name={report.icon as any} size={24} color="#1976d2" />
              </View>
              <View style={styles.reportDetails}>
                <Text style={styles.reportTitle}>{report.title}</Text>
                <Text style={styles.reportPeriod}>{report.period}</Text>
                <View style={styles.reportType}>
                  <Text style={styles.reportTypeText}>{report.type}</Text>
                </View>
              </View>
            </View>
            <View style={styles.reportActions}>
              <TouchableOpacity style={styles.actionBtn}>
                <MaterialIcons name="visibility" size={20} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <MaterialIcons name="file-download" size={20} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <MaterialIcons name="share" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tax Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tax Summary</Text>
        <View style={styles.taxSummaryCard}>
          <View style={styles.taxSummaryHeader}>
            <MaterialIcons name="account-balance" size={24} color="#1976d2" />
            <Text style={styles.taxSummaryTitle}>Current Tax Position</Text>
          </View>
          
          <View style={styles.taxSummaryItem}>
            <Text style={styles.taxSummaryLabel}>VAT Collected</Text>
            <Text style={styles.taxSummaryValue}>
              {financialData.vatCollected.toLocaleString()} AED
            </Text>
          </View>
          
          <View style={styles.taxSummaryItem}>
            <Text style={styles.taxSummaryLabel}>VAT Paid</Text>
            <Text style={styles.taxSummaryValue}>
              {financialData.vatPaid.toLocaleString()} AED
            </Text>
          </View>
          
          <View style={[styles.taxSummaryItem, styles.taxSummaryTotal]}>
            <Text style={styles.taxSummaryLabel}>VAT Payable</Text>
            <Text style={[styles.taxSummaryValue, { color: '#4CAF50', fontWeight: 'bold' }]}>
              {(financialData.vatCollected - financialData.vatPaid).toLocaleString()} AED
            </Text>
          </View>
          
          <View style={[styles.taxSummaryItem, styles.taxSummaryTotal]}>
            <Text style={styles.taxSummaryLabel}>CIT Liability</Text>
            <Text style={[styles.taxSummaryValue, { color: '#FF9800', fontWeight: 'bold' }]}>
              {financialData.citLiability.toLocaleString()} AED
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  overviewCard: {
    width: (width - 48) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  overviewValue: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartItem: {
    alignItems: 'center',
    flex: 1,
  },
  chartBarContainer: {
    height: 120,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  chartBar: {
    width: 40,
    borderRadius: 4,
  },
  chartLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  chartValue: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  reportCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  reportLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reportDetails: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reportPeriod: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  reportType: {
    alignSelf: 'flex-start',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  reportTypeText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '600',
  },
  reportActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taxSummaryCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  taxSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  taxSummaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  taxSummaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  taxSummaryTotal: {
    borderBottomWidth: 0,
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#e0e0e0',
  },
  taxSummaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  taxSummaryValue: {
    fontSize: 14,
    color: '#333',
  },
});