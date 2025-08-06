import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function TaxesScreen() {
  const [vatAmount, setVatAmount] = useState('');
  const [citAmount, setCitAmount] = useState('');
  
  const calculateVAT = (amount: number) => amount * 0.05; // 5% UAE VAT rate
  const calculateCIT = (amount: number) => {
    if (amount <= 375000) return 0; // Small business relief
    return (amount - 375000) * 0.09; // 9% CIT rate on excess
  };

  const vatCalculated = vatAmount ? calculateVAT(parseFloat(vatAmount) || 0) : 0;
  const citCalculated = citAmount ? calculateCIT(parseFloat(citAmount) || 0) : 0;

  const taxDeadlines = [
    { title: 'VAT Return Q4 2024', date: 'Jan 28, 2025', status: 'upcoming', priority: 'high' },
    { title: 'CIT Return 2024', date: 'Mar 31, 2025', status: 'upcoming', priority: 'medium' },
    { title: 'VAT Payment Q4 2024', date: 'Jan 28, 2025', status: 'upcoming', priority: 'high' },
    { title: 'ESR Filing 2024', date: 'Jun 30, 2025', status: 'upcoming', priority: 'low' },
  ];

  const complianceItems = [
    { title: 'VAT Registration', status: 'compliant', description: 'Valid until Dec 2025' },
    { title: 'CIT Registration', status: 'compliant', description: 'Active status' },
    { title: 'E-Invoicing', status: 'compliant', description: 'Phase 2 ready' },
    { title: 'Record Keeping', status: 'compliant', description: '7-year retention active' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Tax Calculators */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tax Calculators</Text>
        
        {/* VAT Calculator */}
        <View style={styles.calculatorCard}>
          <View style={styles.calculatorHeader}>
            <MaterialIcons name="calculate" size={24} color="#2196F3" />
            <Text style={styles.calculatorTitle}>VAT Calculator (5%)</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Enter amount (AED)"
            value={vatAmount}
            onChangeText={setVatAmount}
            keyboardType="numeric"
          />
          {vatCalculated > 0 && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultLabel}>VAT Amount:</Text>
              <Text style={styles.resultValue}>{vatCalculated.toFixed(2)} AED</Text>
            </View>
          )}
        </View>

        {/* CIT Calculator */}
        <View style={styles.calculatorCard}>
          <View style={styles.calculatorHeader}>
            <MaterialIcons name="account-balance" size={24} color="#4CAF50" />
            <Text style={styles.calculatorTitle}>CIT Calculator (9%)</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Enter annual profit (AED)"
            value={citAmount}
            onChangeText={setCitAmount}
            keyboardType="numeric"
          />
          {citAmount && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultLabel}>CIT Amount:</Text>
              <Text style={styles.resultValue}>{citCalculated.toFixed(2)} AED</Text>
              {parseFloat(citAmount) <= 375000 && (
                <Text style={styles.exemptionText}>
                  ✓ Eligible for Small Business Relief
                </Text>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Tax Deadlines */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Deadlines</Text>
        {taxDeadlines.map((deadline, index) => (
          <View key={index} style={styles.deadlineCard}>
            <View style={styles.deadlineLeft}>
              <View style={[
                styles.priorityIndicator,
                { backgroundColor: 
                  deadline.priority === 'high' ? '#F44336' :
                  deadline.priority === 'medium' ? '#FF9800' : '#4CAF50'
                }
              ]} />
              <View style={styles.deadlineDetails}>
                <Text style={styles.deadlineTitle}>{deadline.title}</Text>
                <Text style={styles.deadlineDate}>{deadline.date}</Text>
              </View>
            </View>
            <MaterialIcons name="keyboard-arrow-right" size={24} color="#ccc" />
          </View>
        ))}
      </View>

      {/* Compliance Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Compliance Status</Text>
        {complianceItems.map((item, index) => (
          <View key={index} style={styles.complianceCard}>
            <View style={styles.complianceLeft}>
              <MaterialIcons 
                name={item.status === 'compliant' ? 'check-circle' : 'error'} 
                size={24} 
                color={item.status === 'compliant' ? '#4CAF50' : '#F44336'} 
              />
              <View style={styles.complianceDetails}>
                <Text style={styles.complianceTitle}>{item.title}</Text>
                <Text style={styles.complianceDescription}>{item.description}</Text>
              </View>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: item.status === 'compliant' ? '#E8F5E8' : '#FFF0F0' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: item.status === 'compliant' ? '#4CAF50' : '#F44336' }
              ]}>
                {item.status === 'compliant' ? 'Compliant' : 'Action Required'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="file-upload" size={20} color="white" />
            <Text style={styles.actionButtonText}>File VAT Return</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}>
            <MaterialIcons name="payment" size={20} color="white" />
            <Text style={styles.actionButtonText}>Pay Taxes</Text>
          </TouchableOpacity>
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
  calculatorCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calculatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  calculatorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  resultContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
  },
  resultValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginTop: 4,
  },
  exemptionText: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 4,
    fontStyle: 'italic',
  },
  deadlineCard: {
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
  deadlineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  priorityIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  deadlineDetails: {
    flex: 1,
  },
  deadlineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  deadlineDate: {
    fontSize: 14,
    color: '#666',
  },
  complianceCard: {
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
  complianceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  complianceDetails: {
    marginLeft: 12,
    flex: 1,
  },
  complianceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  complianceDescription: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#1976d2',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});