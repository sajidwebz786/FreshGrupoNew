import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  ScrollView,
  Platform
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomHeader from '../components/CustomHeader';
import BottomNavigation from '../components/BottomNavigation';
import api from '../services/api';
import AddressAutocomplete from '../components/AddressAutocomplete';
import Ionicons from 'react-native-vector-icons/Ionicons';


const CartScreen = () => {
  const navigation = useNavigation();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [newAddressType, setNewAddressType] = useState('home');
  const [newAddressName, setNewAddressName] = useState('Home');
  const [addingAddress, setAddingAddress] = useState(false);

  useEffect(() => {
    initializeUserAndCart();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Always refresh cart items when screen comes into focus
      console.log('Cart screen focused, refreshing data...');
      fetchCartItems();
      fetchAddresses();
    }, [user])
  );

  const initializeUserAndCart = async () => {
    await getCurrentUser();
    setTimeout(() => {
      if (user && user.id) {
        fetchCartItems();
        fetchAddresses();
      }
    }, 100);
  };

  const getCurrentUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        setUser(JSON.parse(userData));
      } else {
        const demoUser = { id: 1, name: 'Demo User' };
        setUser(demoUser);
        await AsyncStorage.setItem('userData', JSON.stringify(demoUser));
      }
    } catch {
      const demoUser = { id: 1, name: 'Demo User' };
      setUser(demoUser);
    }
  };

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');

      if (token && user && user.id) {
        const data = await api.getCart(user.id, token);
        setCartItems(data);
      } else setCartItems([]);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const currentUser = userData ? JSON.parse(userData) : null;

      if (currentUser && currentUser.id) {
        const response = await fetch(`https://freshgrupo-server.onrender.com/api/addresses?userId=${currentUser.id}`);
        const data = response.ok ? await response.json() : [];
        setAddresses(data);
        // If no selected and addresses exist, select the default or first
        if (!selectedAddressId && data.length > 0) {
          const defaultAddr = data.find(addr => addr.isDefault) || data[0];
          setSelectedAddressId(defaultAddr.id);
          setDeliveryAddress(defaultAddr.address);
        }
      } else {
        setAddresses([]);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setAddresses([]);
    }
  };

  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      await api.updateCart(cartItemId, newQuantity, token);
      // Update local state without fetching
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === cartItemId
            ? { ...item, quantity: newQuantity, totalPrice: (newQuantity * item.unitPrice).toFixed(2) }
            : item
        )
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
      // Re-fetch on error
      fetchCartItems();
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      await api.removeCartItem(cartItemId, token);
      // Update local state without fetching
      setCartItems(prevItems => prevItems.filter(item => item.id !== cartItemId));
    } catch (error) {
      console.error('Error removing item:', error);
      // Re-fetch on error
      fetchCartItems();
    }
  };

  const calculateTotal = () =>
    cartItems.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0).toFixed(2);

  const addNewAddress = async () => {
    if (!newAddress.trim() || !newAddressName.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setAddingAddress(true);
    try {
      const userData = await AsyncStorage.getItem('userData');
      const currentUser = userData ? JSON.parse(userData) : null;

      if (!currentUser || !currentUser.id) {
        Alert.alert('Error', 'User not found');
        return;
      }

      const response = await fetch('https://freshgrupo-server.onrender.com/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          type: newAddressType,
          name: newAddressName,
          address: newAddress,
          isDefault: addresses.length === 0 // Make first address default
        })
      });

      if (response.ok) {
        const newAddr = await response.json();
        setAddresses(prev => [...prev, newAddr]);
        setSelectedAddressId(newAddr.id);
        setDeliveryAddress(newAddr.address);
        setShowAddNew(false);
        setNewAddress('');
        setNewAddressName('Home');
        setNewAddressType('home');
        Alert.alert('Success', 'Address added successfully');
      } else {
        Alert.alert('Error', 'Failed to add address');
      }
    } catch (error) {
      console.error('Error adding address:', error);
      Alert.alert('Error', 'Failed to add address');
    } finally {
      setAddingAddress(false);
    }
  };

  const selectAddress = (address) => {
    setSelectedAddressId(address.id);
    setDeliveryAddress(address.address);
  };

  const handleCheckout = () => {
    if (!selectedAddressId) {
      Alert.alert('Error', 'Please select a delivery address');
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    navigation.navigate('Payment', {
      cartItems,
      deliveryAddress,
      totalAmount: calculateTotal(),
    });
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.loadingText}>Loading cart...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar backgroundColor="#1a8b43" barStyle="light-content" translucent={true} />
      <View style={styles.headerContainer}>
        <CustomHeader />
        {/* <Text style={styles.headerTitle}>🛒 Your Cart</Text> */}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContainer}>
        {cartItems.length === 0 ? (
          <View style={styles.emptyCart}>
            <Text style={styles.emptyEmoji}>🛍️</Text>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptySubtitle}>Add some packs to get started!</Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => navigation.navigate('MainStack')}
            >
              <Text style={styles.browseButtonText}>Browse Categories</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={styles.sectionTitle}>Cart Items ({cartItems.length})</Text>
            {cartItems.map((item) => (
              <View key={item.id} style={styles.cartItem}>
                <View style={styles.cartTopRow}>
                  <View>
                    <Text style={styles.itemName}>
                      {item.isCustom ? item.customPackName : (item.Pack?.name || 'Unknown Pack')}
                    </Text>
                    <Text style={styles.itemType}>
                      {item.isCustom ? '🛒 Custom Pack' : `⏰ ${item.Pack?.PackType?.name || 'Unknown Type'}`}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                    <Text style={styles.trashIcon}>🗑️</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.cartBottomRow}>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.qtyButton}
                      onPress={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Text style={styles.qtyButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyButton}
                      onPress={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Text style={styles.qtyButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.itemPrice}>₹{item.totalPrice || 0}</Text>
                </View>
              </View>
            ))}

            <View style={styles.addressSection}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Ionicons name="navigate-outline" size={20} color="#1a8b43" style={{ marginRight: 6 }} />
                <Text style={styles.sectionTitle}>Delivery Location</Text>
              </View>
              <Text style={styles.instructionText}>Please select from any of the below addresses for delivery or create new address.</Text>

              {addresses.length === 0 && !showAddNew ? (
                <Text style={styles.noAddressText}>No addresses saved. Add your first delivery location.</Text>
              ) : (
                addresses.map((addr) => (
                  <TouchableOpacity
                    key={addr.id}
                    style={[
                      styles.addressOption,
                      selectedAddressId === addr.id && styles.selectedAddress
                    ]}
                    onPress={() => selectAddress(addr)}
                  >
                    <Text style={styles.addressText}>{addr.address}</Text>
                    {addr.isDefault && <Text style={styles.defaultBadge}>Default</Text>}
                  </TouchableOpacity>
                ))
              )}

              {showAddNew ? (
                <View style={styles.addNewContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Address Name (e.g., Home, Office)"
                    value={newAddressName}
                    onChangeText={setNewAddressName}
                  />
                  <View style={styles.typeSelector}>
                    <TouchableOpacity
                      style={[styles.typeButton, newAddressType === 'home' && styles.typeSelected]}
                      onPress={() => setNewAddressType('home')}
                    >
                      <Text style={[styles.typeText, newAddressType === 'home' && styles.selectedTypeText]}>Home</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.typeButton, newAddressType === 'work' && styles.typeSelected]}
                      onPress={() => setNewAddressType('work')}
                    >
                      <Text style={[styles.typeText, newAddressType === 'work' && styles.selectedTypeText]}>Work</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.typeButton, newAddressType === 'other' && styles.typeSelected]}
                      onPress={() => setNewAddressType('other')}
                    >
                      <Text style={[styles.typeText, newAddressType === 'other' && styles.selectedTypeText]}>Other</Text>
                    </TouchableOpacity>
                  </View>
                  <AddressAutocomplete
                    value={newAddress}
                    onChangeText={setNewAddress}
                    onSelect={(prediction) => {
                      console.log('Selected address:', prediction);
                    }}
                    placeholder="Enter your complete delivery address"
                    style={{ zIndex: 1000 }}
                  />
                  <View style={styles.addButtons}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => {
                        setShowAddNew(false);
                        setNewAddress('');
                        setNewAddressName('Home');
                        setNewAddressType('home');
                      }}
                    >
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={addNewAddress}
                      disabled={addingAddress}
                    >
                      <Text style={styles.saveText}>{addingAddress ? 'Saving...' : 'Save Address'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addNewButton}
                  onPress={() => setShowAddNew(true)}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#1a8b43" />
                  <Text style={styles.addNewText}>Add New Location</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>💰 Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>₹{calculateTotal()}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery</Text>
                <Text style={[styles.summaryValue, { color: '#1a8b43' }]}>Free</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₹{calculateTotal()}</Text>
              </View>
            </View>

            {cartItems.length > 0 && (
              <View style={styles.checkoutContainer}>
                <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
                  <Text style={styles.checkoutText}>💳 Proceed to Payment</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <BottomNavigation />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f2fdf5' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#666' },
  headerContainer: {
    backgroundColor: '#1a8b43',
    paddingTop: 50,
    paddingBottom: 10,
    alignItems: 'center',
    elevation: 4,
  },
  headerTitle: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  scrollContainer: { padding: 15, paddingBottom: 100 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginVertical: 10 },
  instructionText: { fontSize: 14, color: '#666', marginBottom: 10 },
  cartItem: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 0.8,
    borderColor: '#d9f0df',
  },
  cartTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  itemType: { fontSize: 14, color: '#1a8b43', marginTop: 4 },
  trashIcon: { fontSize: 20, color: '#dc3545' },
  cartBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
  },
  quantityControls: { flexDirection: 'row', alignItems: 'center' },
  qtyButton: {
    backgroundColor: '#1a8b43',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  qtyText: { marginHorizontal: 10, fontSize: 16, fontWeight: '600', color: '#333' },
  itemPrice: { fontSize: 16, fontWeight: 'bold', color: '#1a8b43' },
  addressSection: { marginTop: 10 },
  noAddressText: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 10 },
  addressOption: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#d9f0df',
  },
  selectedAddress: {
    borderColor: '#1a8b43',
    backgroundColor: '#f0f9f0',
  },
  addressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  addressName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  defaultBadge: { fontSize: 12, color: '#1a8b43', backgroundColor: '#e6f7e6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  addressText: { fontSize: 14, color: '#555', marginBottom: 5 },
  addressType: { fontSize: 12, color: '#1a8b43', textTransform: 'capitalize' },
  addNewContainer: { backgroundColor: '#ffffff', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#d9f0df' },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 10,
  },
  typeSelector: { flexDirection: 'row', marginBottom: 10 },
  typeButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d9f0df',
    marginHorizontal: 2,
  },
  typeSelected: { backgroundColor: '#1a8b43', borderColor: '#1a8b43' },
  typeText: { fontSize: 14, color: '#333' },
  selectedTypeText: { color: '#fff' },
  addButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 10,
  },
  cancelText: { fontSize: 14, color: '#666' },
  saveButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#1a8b43',
  },
  saveText: { fontSize: 14, color: '#fff', fontWeight: 'bold' },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a8b43',
    borderStyle: 'dashed',
  },
  addNewText: { fontSize: 14, color: '#1a8b43', marginLeft: 5 },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 0.8,
    borderColor: '#d9f0df',
  },
  summaryTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 5 },
  summaryDivider: { borderTopWidth: 1, borderColor: '#d9f0df', marginVertical: 8 },
  summaryLabel: { fontSize: 15, color: '#333' },
  summaryValue: { fontSize: 15, color: '#333', fontWeight: '600' },
  totalLabel: { fontSize: 17, fontWeight: 'bold', color: '#1a8b43' },
  totalValue: { fontSize: 17, fontWeight: 'bold', color: '#1a8b43' },
  checkoutContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e6e6e6',
  },
  checkoutButton: {
    backgroundColor: '#1a8b43',
    marginHorizontal: 20,
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    elevation: 3,
  },
  checkoutText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  emptyCart: { alignItems: 'center', marginTop: 80 },
  emptyEmoji: { fontSize: 60 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 10 },
  emptySubtitle: { fontSize: 14, color: '#555', marginTop: 5 },
  browseButton: {
    backgroundColor: '#1a8b43',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 20,
  },
  browseButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});

export default CartScreen;
