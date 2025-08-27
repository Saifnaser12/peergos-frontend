import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface Transaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  category: string;
}

export default function BookkeepingScreen() {
  const [transactions] = useState<Transaction[]>([
    { id: 1, type: 'income', amount: 5000, description: 'Software License Sale', date: '2025-08-06', category: 'Revenue' },
    { id: 2, type: 'expense', amount: 1200, description: 'Office Rent', date: '2025-08-05', category: 'Operating Expenses' },
    { id: 3, type: 'income', amount: 3500, description: 'Consulting Services', date: '2025-08-04', category: 'Service Revenue' },
    { id: 4, type: 'expense', amount: 800, description: 'Utilities', date: '2025-08-03', category: 'Utilities' },
  ]);

  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  const filteredTransactions = transactions.filter(t => 
    filter === 'all' || t.type === filter
  );

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netIncome = totalIncome - totalExpenses;

  return (
    <ScrollView style={styles.container}>
      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: '#E8F5E8' }]}>
          <MaterialIcons name="trending-up" size={24} color="#4CAF50" />
          <Text style={styles.summaryTitle}>Total Income</Text>
          <Text style={[styles.summaryAmount, { color: '#4CAF50' }]}>
            {totalIncome.toLocaleString()} AED
          </Text>
        </View>
        
        <View style={[styles.summaryCard, { backgroundColor: '#FFF0F0' }]}>
          <MaterialIcons name="trending-down" size={24} color="#F44336" />
          <Text style={styles.summaryTitle}>Total Expenses</Text>
          <Text style={[styles.summaryAmount, { color: '#F44336' }]}>
            {totalExpenses.toLocaleString()} AED
          </Text>
        </View>
        
        <View style={[styles.summaryCard, { backgroundColor: '#F0F8FF' }]}>
          <MaterialIcons name="account-balance" size={24} color="#2196F3" />
          <Text style={styles.summaryTitle}>Net Income</Text>
          <Text style={[styles.summaryAmount, { color: netIncome >= 0 ? '#4CAF50' : '#F44336' }]}>
            {netIncome.toLocaleString()} AED
          </Text>
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {(['all', 'income', 'expense'] as const).map((filterType) => (
          <TouchableOpacity
            key={filterType}
            style={[
              styles.filterButton,
              filter === filterType && styles.activeFilterButton
            ]}
            onPress={() => setFilter(filterType)}
          >
            <Text style={[
              styles.filterText,
              filter === filterType && styles.activeFilterText
            ]}>
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transactions List */}
      <View style={styles.transactionsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity style={styles.addButton}>
            <MaterialIcons name="add" size={20} color="#1976d2" />
          </TouchableOpacity>
        </View>

        {filteredTransactions.map((transaction) => (
          <View key={transaction.id} style={styles.transactionCard}>
            <View style={styles.transactionLeft}>
              <View style={[
                styles.transactionIcon,
                { backgroundColor: transaction.type === 'income' ? '#E8F5E8' : '#FFF0F0' }
              ]}>
                <MaterialIcons 
                  name={transaction.type === 'income' ? 'add' : 'remove'} 
                  size={20} 
                  color={transaction.type === 'income' ? '#4CAF50' : '#F44336'} 
                />
              </View>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionDescription}>{transaction.description}</Text>
                <Text style={styles.transactionCategory}>{transaction.category}</Text>
                <Text style={styles.transactionDate}>{transaction.date}</Text>
              </View>
            </View>
            <Text style={[
              styles.transactionAmount,
              { color: transaction.type === 'income' ? '#4CAF50' : '#F44336' }
            ]}>
              {transaction.type === 'income' ? '+' : '-'}{transaction.amount.toLocaleString()} AED
            </Text>
          </View>
        ))}
      </View>

      {/* Add Transaction Button */}
      <TouchableOpacity style={styles.fabButton}>
        <MaterialIcons name="add" size={24} color="white" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
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
  summaryTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeFilterButton: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: 'white',
    fontWeight: '600',
  },
  transactionsContainer: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  transactionCard: {
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
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  fabButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
});