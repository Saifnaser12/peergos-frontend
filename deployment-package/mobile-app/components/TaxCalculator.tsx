import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface TaxCalculatorProps {
  type: 'vat' | 'cit';
  title: string;
  rate: number;
  onCalculate?: (amount: number, tax: number) => void;
}

export default function TaxCalculator({ type, title, rate, onCalculate }: TaxCalculatorProps) {
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState<{ tax: number; total: number } | null>(null);

  const calculateTax = () => {
    const numAmount = parseFloat(amount) || 0;
    let tax = 0;

    if (type === 'vat') {
      tax = numAmount * (rate / 100);
    } else if (type === 'cit') {
      // CIT calculation with Small Business Relief
      if (numAmount <= 375000) {
        tax = 0;
      } else {
        tax = (numAmount - 375000) * (rate / 100);
      }
    }

    const total = numAmount + tax;
    setResult({ tax, total });
    onCalculate?.(numAmount, tax);
  };

  const clearCalculation = () => {
    setAmount('');
    setResult(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons 
          name={type === 'vat' ? 'receipt' : 'account-balance'} 
          size={24} 
          color="#1976d2" 
        />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.rate}>{rate}%</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>
          {type === 'vat' ? 'Amount (AED)' : 'Annual Profit (AED)'}
        </Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="numeric"
          onSubmitEditing={calculateTax}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.calculateButton} onPress={calculateTax}>
          <Text style={styles.calculateButtonText}>Calculate</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clearButton} onPress={clearCalculation}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {result && (
        <View style={styles.resultContainer}>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Base Amount:</Text>
            <Text style={styles.resultValue}>{parseFloat(amount).toLocaleString()} AED</Text>
          </View>
          
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>{type.toUpperCase()} Amount:</Text>
            <Text style={[styles.resultValue, styles.taxAmount]}>
              {result.tax.toFixed(2)} AED
            </Text>
          </View>
          
          {type === 'vat' && (
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Total with VAT:</Text>
              <Text style={[styles.resultValue, styles.totalAmount]}>
                {result.total.toFixed(2)} AED
              </Text>
            </View>
          )}

          {type === 'cit' && parseFloat(amount) <= 375000 && (
            <View style={styles.exemptionContainer}>
              <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.exemptionText}>
                Eligible for Small Business Relief
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
    color: '#333',
  },
  rate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  calculateButton: {
    flex: 1,
    backgroundColor: '#1976d2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  calculateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#666',
    fontSize: 16,
  },
  resultContainer: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  taxAmount: {
    color: '#1976d2',
  },
  totalAmount: {
    color: '#4CAF50',
    fontSize: 16,
  },
  exemptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  exemptionText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
    fontStyle: 'italic',
  },
});