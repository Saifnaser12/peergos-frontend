import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const quickActions = [
    { id: 1, title: 'Add Transaction', icon: 'add-circle', color: '#4CAF50' },
    { id: 2, title: 'VAT Calculator', icon: 'calculator', color: '#2196F3' },
    { id: 3, title: 'Generate Invoice', icon: 'receipt', color: '#FF9800' },
    { id: 4, title: 'View Reports', icon: 'assessment', color: '#9C27B0' },
  ];

  const stats = [
    { title: 'Monthly Revenue', value: '125,000 AED', trend: '+12%', trendUp: true },
    { title: 'VAT Collected', value: '6,250 AED', trend: '+5%', trendUp: true },
    { title: 'Outstanding VAT', value: '2,100 AED', trend: '-8%', trendUp: false },
    { title: 'CIT Liability', value: '18,750 AED', trend: '+15%', trendUp: true },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome to Peergos</Text>
        <Text style={styles.subText}>UAE Tax Compliance Made Simple</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity key={action.id} style={styles.actionCard}>
              <MaterialIcons name={action.icon as any} size={32} color={action.color} />
              <Text style={styles.actionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Key Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Statistics</Text>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <View style={styles.statContent}>
              <Text style={styles.statTitle}>{stat.title}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
            </View>
            <View style={[styles.trendContainer, { backgroundColor: stat.trendUp ? '#E8F5E8' : '#FFF0F0' }]}>
              <MaterialIcons 
                name={stat.trendUp ? 'trending-up' : 'trending-down'} 
                size={16} 
                color={stat.trendUp ? '#4CAF50' : '#F44336'} 
              />
              <Text style={[styles.trendText, { color: stat.trendUp ? '#4CAF50' : '#F44336' }]}>
                {stat.trend}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Compliance Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Compliance Status</Text>
        <View style={styles.complianceCard}>
          <View style={styles.complianceHeader}>
            <MaterialIcons name="verified" size={24} color="#4CAF50" />
            <Text style={styles.complianceTitle}>All Systems Compliant</Text>
          </View>
          <Text style={styles.complianceText}>
            Your business is fully compliant with UAE VAT and CIT regulations.
          </Text>
          <View style={styles.complianceDetails}>
            <Text style={styles.complianceDetail}>✓ VAT Returns: Up to date</Text>
            <Text style={styles.complianceDetail}>✓ CIT Filing: On track</Text>
            <Text style={styles.complianceDetail}>✓ Records: 7-year retention active</Text>
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
  header: {
    backgroundColor: '#1976d2',
    padding: 20,
    paddingTop: 40,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
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
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: 'white',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
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
  actionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
  },
  statCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
  complianceCard: {
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
  complianceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  complianceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  complianceText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  complianceDetails: {
    marginTop: 8,
  },
  complianceDetail: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 4,
  },
});