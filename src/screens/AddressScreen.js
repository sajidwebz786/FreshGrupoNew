import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Switch,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomHeader from '../components/CustomHeader';
import BottomNavigation from '../components/BottomNavigation';
import api from '../services/api';
import AddressAutocomplete from '../components/AddressAutocomplete';

const AddressScreen = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    type: 'home',
    name: '',
    address: '',
    isDefault: false
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        const userAddresses = await api.getAddresses(parsedUser.id);
        setAddresses(userAddresses || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (address = null) => {
    if (address) {
      setEditingAddress(address);
      setAddressForm({
        type: address.type,
        name: address.name,
        address: address.address,
        isDefault: address.isDefault
      });
    } else {
      setEditingAddress(null);
      setAddressForm({
        type: 'home',
        name: '',
        address: '',
        isDefault: false
      });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingAddress(null);
    setAddressForm({
      type: 'home',
      name: '',
      address: '',
      isDefault: false
    });
  };

  const saveAddress = async () => {
    if (!addressForm.name.trim() || !addressForm.address.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setSaving(true);
      const addressData = {
        ...addressForm,
        userId: user.id
      };

      if (editingAddress) {
        await api.updateAddress(editingAddress.id, addressData);
        setAddresses(prev => prev.map(addr =>
          addr.id === editingAddress.id ? { ...addr, ...addressData } : addr
        ));
      } else {
        const newAddress = await api.createAddress(addressData);
        setAddresses(prev => [...prev, newAddress]);
      }

      closeModal();
      Alert.alert('Success', 'Address saved successfully');
    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert('Error', 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = async (addressId) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteAddress(addressId);
              setAddresses(prev => prev.filter(addr => addr.id !== addressId));
              Alert.alert('Success', 'Address deleted successfully');
            } catch (error) {
              console.error('Error deleting address:', error);
              Alert.alert('Error', 'Failed to delete address');
            }
          }
        }
      ]
    );
  };

  const renderAddress = (addr) => (
    <View key={addr.id} style={styles.addressCard}>
      <View style={styles.addressHeader}>
        <Text style={styles.addressName}>{addr.name}</Text>
        {addr.isDefault && (
          <Text style={[styles.defaultBadge, { color: '#fff', fontSize: 12, fontWeight: 'bold' }]}>Default</Text>
        )}
      </View>
      <Text style={styles.addressText}>{addr.address}</Text>
      <View style={styles.addressActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => openModal(addr)}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteAddress(addr.id)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
        <View style={styles.headerContainer}>
          <CustomHeader />
        </View>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading addresses...</Text>
        </View>
        <BottomNavigation />
      </View>
    );
  }

  const homeAddresses = addresses.filter(addr => addr.type === 'home');
  const workAddresses = addresses.filter(addr => addr.type === 'work');
  const otherAddresses = addresses.filter(addr => addr.type === 'other');

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <CustomHeader />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.title}>Manage Addresses</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Home Addresses</Text>
          {homeAddresses.length === 0 ? (
            <Text style={styles.emptyText}>No home addresses</Text>
          ) : (
            homeAddresses.map(renderAddress)
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work Addresses</Text>
          {workAddresses.length === 0 ? (
            <Text style={styles.emptyText}>No work addresses</Text>
          ) : (
            workAddresses.map(renderAddress)
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Other Addresses</Text>
          {otherAddresses.length === 0 ? (
            <Text style={styles.emptyText}>No other addresses</Text>
          ) : (
            otherAddresses.map(renderAddress)
          )}
        </View>

        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <Text style={styles.addButtonText}>+ Add Address</Text>
        </TouchableOpacity>

      </ScrollView>

      <BottomNavigation />

      {modalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingAddress ? 'Edit Address' : 'Add Address'}</Text>
            <ScrollView style={styles.modalScroll}>
              <View style={styles.field}>
                <Text style={styles.label}>Type</Text>
                <View style={styles.typeButtons}>
                  <TouchableOpacity
                    style={[styles.typeButton, addressForm.type === 'home' && styles.typeButtonSelected]}
                    onPress={() => setAddressForm(prev => ({ ...prev, type: 'home' }))}
                  >
                    <Text style={[styles.typeButtonText, addressForm.type === 'home' && styles.selectedText]}>Home</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeButton, addressForm.type === 'work' && styles.typeButtonSelected]}
                    onPress={() => setAddressForm(prev => ({ ...prev, type: 'work' }))}
                  >
                    <Text style={[styles.typeButtonText, addressForm.type === 'work' && styles.selectedText]}>Work</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeButton, addressForm.type === 'other' && styles.typeButtonSelected]}
                    onPress={() => setAddressForm(prev => ({ ...prev, type: 'other' }))}
                  >
                    <Text style={[styles.typeButtonText, addressForm.type === 'other' && styles.selectedText]}>Other</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={addressForm.name}
                  onChangeText={(text) => setAddressForm(prev => ({ ...prev, name: text }))}
                  placeholder="e.g., Home, Office"
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Address</Text>
                <AddressAutocomplete
                  value={addressForm.address}
                  onChangeText={(text) => setAddressForm(prev => ({ ...prev, address: text }))}
                  onSelect={(prediction) => {
                    // Optionally handle place details here
                    console.log('Selected address:', prediction);
                  }}
                  placeholder="Enter full address"
                  style={styles.addressInput}
                />
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Set as Default</Text>
                <Switch
                  value={addressForm.isDefault}
                  onValueChange={(value) => setAddressForm(prev => ({ ...prev, isDefault: value }))}
                />
              </View>
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={closeModal}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={saveAddress}
                disabled={saving}
              >
                <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerContainer: { paddingTop: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#666' },
  content: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 20 },
  section: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 20, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#4CAF50', marginBottom: 15 },
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center', marginVertical: 20 },
  addressCard: { backgroundColor: '#f8f9fa', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 1 },
  addressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  addressName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  defaultBadge: { backgroundColor: '#4CAF50', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5 },
  addressText: { fontSize: 16, color: '#333', marginBottom: 10 },
  addressActions: { flexDirection: 'row', justifyContent: 'space-around' },
  editButton: { backgroundColor: '#4CAF50', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25 },
  editButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  deleteButton: { backgroundColor: '#dc3545', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25 },
  deleteButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  addButton: { padding: 15, backgroundColor: '#4CAF50', borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 10, width: '90%', maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 20 },
  modalScroll: { maxHeight: 300 },
  field: { marginBottom: 15 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 5 },
  input: { fontSize: 16, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 5, backgroundColor: '#fff' },
  addressInput: { minHeight: 80, zIndex: 1000 },
  typeButtons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 5 },
  typeButton: { padding: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 5, backgroundColor: '#f8f9fa' },
  typeButtonSelected: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  typeButtonText: { fontSize: 14 },
  selectedText: { color: '#fff' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  button: { padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  saveButton: { backgroundColor: '#28a745' },
  cancelButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#6c757d' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cancelButtonText: { color: '#6c757d', fontSize: 16, fontWeight: 'bold' },
});

export default AddressScreen;