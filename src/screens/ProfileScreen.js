import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomHeader from '../components/CustomHeader';
import BottomNavigation from '../components/BottomNavigation';
import api from '../services/api';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setName(parsedUser.name || '');
        setPhone(parsedUser.phone || '');

        // Load addresses
        const userAddresses = await api.getAddresses(parsedUser.id);
        setAddresses(userAddresses || []);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    try {
      setSaving(true);
      const response = await api.updateProfile(user.id, { name: name.trim(), phone: phone.trim() });

      if (response.user) {
        // Update local storage
        const updatedUser = { ...user, name: response.user.name };
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setEditing(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
        <View style={styles.headerContainer}>
          <CustomHeader />
        </View>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
        <BottomNavigation />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
        <View style={styles.headerContainer}>
          <CustomHeader />
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>User not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
        <BottomNavigation />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
      <View style={styles.headerContainer}>
        <CustomHeader />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.title}>👤 My Profile</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Personal Information</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
              />
            ) : (
              <Text style={styles.value}>{user.name}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <Text style={[styles.value, styles.disabled]}>{user.email}</Text>
            <Text style={styles.note}>Contact details cannot be changed</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Phone</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.value}>{user.phone || 'Not provided'}</Text>
            )}
          </View>


          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Addresses</Text>

            {addresses.length === 0 ? (
              <View style={styles.addressesContainer}>
                <Text style={styles.emptyText}>No addresses saved</Text>
                <TouchableOpacity style={styles.manageButton} onPress={() => navigation.navigate('Address')}>
                  <Text style={styles.manageButtonText}>Manage Addresses</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.addressesContainer}>
                {addresses.map((addr, index) => (
                  <View key={addr.id} style={[styles.addressItem, index < addresses.length - 1 && styles.addressItemBorder]}>
                    <View style={styles.addressHeader}>
                      <Text style={styles.addressName}>{addr.name}</Text>
                      {addr.isDefault && (
                        <Text style={styles.defaultBadge}>Default</Text>
                      )}
                    </View>
                    <Text style={[styles.addressType, styles[`addressType${addr.type.charAt(0).toUpperCase() + addr.type.slice(1)}`]]}>{addr.type.charAt(0).toUpperCase() + addr.type.slice(1)}</Text>
                    <Text style={styles.addressText}>{addr.address}</Text>
                  </View>
                ))}
                <TouchableOpacity style={styles.manageButton} onPress={() => navigation.navigate('Address')}>
                  <Text style={styles.manageButtonText}>Manage Addresses</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          {editing ? (
            <>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.buttonText}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.editButton]}
              onPress={() => setEditing(true)}
            >
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <BottomNavigation />
    </View>
  );
};

const styles = StyleSheet.create({
   container: { flex: 1, backgroundColor: '#e8f5e9' },
  headerContainer: { paddingTop: 50, backgroundColor: '#4CAF50' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#666' },
  errorText: { fontSize: 18, color: '#666' },
  backButton: { marginTop: 20, padding: 10, backgroundColor: '#4CAF50', borderRadius: 5 },
  backButtonText: { color: '#fff', fontSize: 16 },
  content: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#000000', textAlign: 'center', marginBottom: 20, textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 2 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#393d39', marginBottom: 15, textDecorationLine: 'underline', textDecorationColor: '#4CAF50', textDecorationStyle: 'solid' },
  field: { marginBottom: 15 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 5 },
  value: { fontSize: 16, color: '#666', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#f8f9fa', borderRadius: 5 },
  disabled: { backgroundColor: '#e9ecef', color: '#6c757d' },
  note: { fontSize: 12, color: '#6c757d', marginTop: 3 },
  input: { fontSize: 16, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 5, backgroundColor: '#fff' },
  buttonContainer: { marginTop: 20 },
  button: { padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  editButton: { backgroundColor: '#4CAF50' },
  saveButton: { backgroundColor: '#28a745' },
  cancelButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#6c757d' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cancelButtonText: { color: '#6c757d', fontSize: 16, fontWeight: 'bold' },
  addressesContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 3,
    padding: 15,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  addressItem: {
    paddingVertical: 10,
  },
  addressItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  defaultBadge: {
    backgroundColor: '#FFD700',
    color: '#333',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: '#FFA000',
  },
  addressType: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  addressTypeHome: {
    color: '#2196F3', // Blue for home
  },
  addressTypeWork: {
    color: '#FF9800', // Orange for work
  },
  addressTypeOther: {
    color: '#9C27B0', // Purple for other
  },
  addressText: {
    fontSize: 14,
    color: '#333',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
  },
  manageButton: {
    padding: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 1,
    borderColor: '#45a049',
  },
  manageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;