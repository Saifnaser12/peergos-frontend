import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = React.useState(false);
  const [autoBackup, setAutoBackup] = React.useState(true);

  const userInfo = {
    name: 'Ahmed Al-Mahmoud',
    email: 'ahmed@example.com',
    company: 'Al-Mahmoud Trading LLC',
    role: 'Business Owner',
    trn: '100123456789123',
    vatRegistration: 'Valid until Dec 2025',
    citRegistration: 'Active',
  };

  const settingsGroups = [
    {
      title: 'Account Settings',
      items: [
        { icon: 'person', title: 'Edit Profile', onPress: () => {} },
        { icon: 'business', title: 'Company Information', onPress: () => {} },
        { icon: 'security', title: 'Security Settings', onPress: () => {} },
        { icon: 'language', title: 'Language & Region', subtitle: 'English (UAE)', onPress: () => {} },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { 
          icon: 'notifications', 
          title: 'Push Notifications', 
          toggle: true,
          value: notificationsEnabled,
          onValueChange: setNotificationsEnabled
        },
        { 
          icon: 'fingerprint', 
          title: 'Biometric Login', 
          toggle: true,
          value: biometricsEnabled,
          onValueChange: setBiometricsEnabled
        },
        { 
          icon: 'backup', 
          title: 'Auto Backup', 
          subtitle: 'Sync data automatically',
          toggle: true,
          value: autoBackup,
          onValueChange: setAutoBackup
        },
      ]
    },
    {
      title: 'Support & Legal',
      items: [
        { icon: 'help', title: 'Help Center', onPress: () => {} },
        { icon: 'phone', title: 'Contact Support', onPress: () => {} },
        { icon: 'description', title: 'Terms of Service', onPress: () => {} },
        { icon: 'privacy-tip', title: 'Privacy Policy', onPress: () => {} },
        { icon: 'info', title: 'About', subtitle: 'Version 1.0.0', onPress: () => {} },
      ]
    }
  ];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => {} }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* User Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userInfo.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
          <TouchableOpacity style={styles.editAvatarButton}>
            <MaterialIcons name="camera-alt" size={16} color="white" />
          </TouchableOpacity>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{userInfo.name}</Text>
          <Text style={styles.userEmail}>{userInfo.email}</Text>
          <Text style={styles.userCompany}>{userInfo.company}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{userInfo.role}</Text>
          </View>
        </View>
      </View>

      {/* Compliance Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Compliance Status</Text>
        <View style={styles.complianceCard}>
          <View style={styles.complianceItem}>
            <MaterialIcons name="receipt" size={20} color="#4CAF50" />
            <View style={styles.complianceDetails}>
              <Text style={styles.complianceTitle}>TRN</Text>
              <Text style={styles.complianceValue}>{userInfo.trn}</Text>
            </View>
            <MaterialIcons name="verified" size={20} color="#4CAF50" />
          </View>
          
          <View style={styles.complianceItem}>
            <MaterialIcons name="account-balance" size={20} color="#4CAF50" />
            <View style={styles.complianceDetails}>
              <Text style={styles.complianceTitle}>VAT Registration</Text>
              <Text style={styles.complianceValue}>{userInfo.vatRegistration}</Text>
            </View>
            <MaterialIcons name="verified" size={20} color="#4CAF50" />
          </View>
          
          <View style={styles.complianceItem}>
            <MaterialIcons name="business" size={20} color="#4CAF50" />
            <View style={styles.complianceDetails}>
              <Text style={styles.complianceTitle}>CIT Registration</Text>
              <Text style={styles.complianceValue}>{userInfo.citRegistration}</Text>
            </View>
            <MaterialIcons name="verified" size={20} color="#4CAF50" />
          </View>
        </View>
      </View>

      {/* Settings Groups */}
      {settingsGroups.map((group, groupIndex) => (
        <View key={groupIndex} style={styles.section}>
          <Text style={styles.sectionTitle}>{group.title}</Text>
          <View style={styles.settingsCard}>
            {group.items.map((item, itemIndex) => (
              <TouchableOpacity 
                key={itemIndex} 
                style={[
                  styles.settingsItem,
                  itemIndex === group.items.length - 1 && styles.lastSettingsItem
                ]}
                onPress={item.onPress}
                disabled={item.toggle}
              >
                <View style={styles.settingsLeft}>
                  <MaterialIcons name={item.icon as any} size={24} color="#666" />
                  <View style={styles.settingsDetails}>
                    <Text style={styles.settingsTitle}>{item.title}</Text>
                    {item.subtitle && (
                      <Text style={styles.settingsSubtitle}>{item.subtitle}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.settingsRight}>
                  {item.toggle ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onValueChange}
                      trackColor={{ false: '#ccc', true: '#1976d2' }}
                      thumbColor={item.value ? '#1976d2' : '#f4f3f4'}
                    />
                  ) : (
                    <MaterialIcons name="keyboard-arrow-right" size={24} color="#ccc" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* Logout Button */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color="#F44336" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Peergos Mobile v1.0.0</Text>
        <Text style={styles.versionSubtext}>Made with ❤️ for UAE businesses</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileHeader: {
    backgroundColor: '#1976d2',
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  userCompany: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
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
  complianceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  complianceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  complianceDetails: {
    flex: 1,
    marginLeft: 12,
  },
  complianceTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  complianceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  settingsCard: {
    backgroundColor: 'white',
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
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  lastSettingsItem: {
    borderBottomWidth: 0,
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsDetails: {
    marginLeft: 12,
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  settingsSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  settingsRight: {
    marginLeft: 12,
  },
  logoutButton: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
    marginLeft: 8,
  },
  versionContainer: {
    alignItems: 'center',
    padding: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  versionSubtext: {
    fontSize: 12,
    color: '#999',
  },
});