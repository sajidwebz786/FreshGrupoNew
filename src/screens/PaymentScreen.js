import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomHeader from '../components/CustomHeader';
import BottomNavigation from '../components/BottomNavigation';

import Ionicons from 'react-native-vector-icons/Ionicons';

const PaymentScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const { cartItems = [], deliveryAddress, totalAmount = 0 } =
    route.params || {};

  const [processing, setProcessing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [loadingWallet, setLoadingWallet] = useState(true);

  const [timeSlot, setTimeSlot] = useState('');

  const [selectedDate, setSelectedDate] = useState(new Date());

  const dates = Array.from({ length: 10 }, (_, i) => new Date(Date.now() + i * 24 * 60 * 60 * 1000));

  // Fetch wallet balance
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        const currentUser = userData ? JSON.parse(userData) : null;
        
        if (currentUser?.id) {
          const response = await fetch(
            `https://freshgrupo-server.onrender.com/api/wallet/${currentUser.id}`
          );
          const data = await response.json();
          if (data.wallet) {
            setWalletBalance(parseFloat(data.wallet.balance) || 0);
          }
        }
      } catch (err) {
        console.error('Error fetching wallet:', err);
      } finally {
        setLoadingWallet(false);
      }
    };
    
    fetchWallet();
  }, []);

  // Calculate final amount based on wallet usage
  const walletDiscount = useWallet ? Math.min(walletBalance, totalAmount) : 0;
  const finalAmount = totalAmount - walletDiscount;

  /* =========================
      WALLET PAYMENT
   ========================= */
  const handleWalletPayment = async () => {
    if (walletBalance < totalAmount) {
      Alert.alert(
        'Insufficient Wallet Balance',
        `Your wallet balance is ₹${walletBalance.toFixed(2)}. You need ₹${totalAmount.toFixed(2)}. Would you like to add more credits?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Credits', onPress: () => navigation.navigate('BuyCredits') },
        ]
      );
      return;
    }

    try {
      setProcessing(true);

      const userData = await AsyncStorage.getItem('userData');
      const currentUser = userData ? JSON.parse(userData) : null;

      if (!currentUser?.id) {
        Alert.alert('Error', 'User not logged in');
        return;
      }

      // Deduct from wallet
      const res = await fetch(
        'https://freshgrupo-server.onrender.com/api/wallet/deduct',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            amount: totalAmount,
            description: 'Payment for order',
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Payment failed');

      // Create order
      const orderPayload = {
        userId: currentUser.id,
        quantity: cartItems.reduce((s, i) => s + i.quantity, 0),
        deliveryAddress,
        paymentMethod: 'wallet',
        totalAmount,
        packId: cartItems[0]?.packId,
        isCustom: cartItems[0]?.isCustom || false,
        customPackName: cartItems[0]?.customPackName,
        customPackItems: cartItems[0]?.customPackItems,
        timeSlot,
        deliveryDate: selectedDate.toISOString(),
        walletTransactionId: data.transaction?.id,
      };

      const orderRes = await fetch(
        'https://freshgrupo-server.onrender.com/api/orders',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload),
        }
      );

      if (!orderRes.ok) throw new Error('Order failed');

      // Clear all cart items at once using the bulk clear endpoint
      try {
        const userData = await AsyncStorage.getItem('userData');
        const currentUser = userData ? JSON.parse(userData) : null;
        
        if (currentUser?.id) {
          const clearRes = await fetch(`https://freshgrupo-server.onrender.com/api/cart/clear/${currentUser.id}`, {
            method: 'DELETE'
          });
          if (clearRes.ok) {
            console.log('Cart cleared successfully');
          } else {
            console.warn('Failed to clear cart:', clearRes.status);
          }
        }
      } catch (err) {
        console.error('Error clearing cart:', err);
      }

      Alert.alert('Success', 'Order placed successfully! Credits have been deducted from your wallet.');
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Drawer' }],
        })
      );

    } catch (err) {
      console.error('Wallet Payment Error:', err);
      Alert.alert('Error', err.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  /* =========================
      RAZORPAY PAYMENT
   ========================= */
  const handlePayment = () => {
     Alert.alert('Coming Soon', 'Online payment will be available soon. Please use Cash on Delivery for now.');
   };

  /* =========================
     CASH ON DELIVERY
  ========================= */

  const handleCOD = async () => {
    try {
      setProcessing(true);

      const userData = await AsyncStorage.getItem('userData');
      const currentUser = userData ? JSON.parse(userData) : null;

      if (!currentUser?.id) {
        Alert.alert('Error', 'User not logged in');
        return;
      }

      const orderPayload = {
        userId: currentUser.id,
        quantity: cartItems.reduce((s, i) => s + i.quantity, 0),
        deliveryAddress,
        paymentMethod: 'cod',
        totalAmount,
        packId: cartItems[0]?.packId,
        isCustom: cartItems[0]?.isCustom || false,
        customPackName: cartItems[0]?.customPackName,
        customPackItems: cartItems[0]?.customPackItems,
        timeSlot,
        deliveryDate: selectedDate.toISOString(),
      };

      const res = await fetch(
        'https://freshgrupo-server.onrender.com/api/orders',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload),
        }
      );

      if (!res.ok) throw new Error('Order failed');

      // Clear all cart items at once using the bulk clear endpoint
      try {
        const userData = await AsyncStorage.getItem('userData');
        const currentUser = userData ? JSON.parse(userData) : null;
        
        if (currentUser?.id) {
          const clearRes = await fetch(`https://freshgrupo-server.onrender.com/api/cart/clear/${currentUser.id}`, {
            method: 'DELETE'
          });
          if (clearRes.ok) {
            console.log('Cart cleared successfully');
          } else {
            console.warn('Failed to clear cart:', clearRes.status);
          }
        }
      } catch (err) {
        console.error('Error clearing cart:', err);
      }

      Alert.alert('Success', 'Order placed successfully!');
      // Force navigation to home and reset the navigation state
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Drawer' }],
        })
      );

    } catch (err) {
      console.error('COD Error:', err);
      Alert.alert('Error', err.message || 'Order failed');
    } finally {
      setProcessing(false);
    }
  };


  /* =========================
      UI
   ========================= */
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" translucent={true} />
      <View style={styles.headerContainer}>
        <CustomHeader />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Complete Your Payment</Text>

        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amount}>₹{totalAmount}</Text>
        </View>

        {/* Wallet Section */}
        {!loadingWallet && walletBalance > 0 && (
          <View style={styles.walletBox}>
            <View style={styles.walletHeader}>
              <View style={styles.walletInfo}>
                <Ionicons name="wallet" size={24} color="#4CAF50" />
                <View style={styles.walletTextContainer}>
                  <Text style={styles.walletTitle}>Wallet Balance</Text>
                  <Text style={styles.walletBalance}>₹{walletBalance.toFixed(2)}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.walletToggle, useWallet && styles.walletToggleActive]}
                onPress={() => setUseWallet(!useWallet)}
              >
                <Text style={[styles.walletToggleText, useWallet && styles.walletToggleTextActive]}>
                  {useWallet ? 'Using' : 'Use'}
                </Text>
              </TouchableOpacity>
            </View>
            {useWallet && (
              <View style={styles.walletDiscount}>
                <Text style={styles.walletDiscountText}>
                  Wallet Discount: -₹{walletDiscount.toFixed(2)}
                </Text>
                <Text style={styles.finalAmountText}>
                  Final Amount to Pay: ₹{finalAmount.toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.dateContainer}>
          <View style={styles.titleRow}>
            <Ionicons name="calendar-outline" size={20} color="#4CAF50" />
            <Text style={styles.dateTitle}>Select Delivery Date</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
            {dates.map((date, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.dateButton, selectedDate.toDateString() === date.toDateString() && styles.selectedDate]}
                onPress={() => setSelectedDate(date)}
                disabled={processing}
              >
                <Text style={[styles.dateText, selectedDate.toDateString() === date.toDateString() && styles.selectedDateText]}>
                  {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.slotContainer}>
          <View style={styles.titleRow}>
            <Ionicons name="time-outline" size={20} color="#4CAF50" />
            <Text style={styles.slotTitle}>Select Delivery Time Slot</Text>
          </View>
          <View style={styles.slotButtons}>
            {['9 AM - 11 AM', '11 AM - 1 PM', '1 PM - 3 PM', '3 PM - 5 PM'].map((slot) => (
              <TouchableOpacity
                key={slot}
                style={[styles.slotButton, timeSlot === slot && styles.selected]}
                onPress={() => setTimeSlot(slot)}
                disabled={processing}
              >
                <Text style={[styles.slotText, timeSlot === slot && styles.selectedText]}>{slot}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.payButton, processing && styles.disabled]}
          onPress={handlePayment}
          disabled={processing}
        >
          <Text style={styles.payText}>
            {processing ? 'Processing...' : `Pay Online ₹${useWallet ? finalAmount : totalAmount}`}
          </Text>
        </TouchableOpacity>

        {walletBalance > 0 && (
          <TouchableOpacity
            style={[styles.walletPayButton, processing && styles.disabled]}
            onPress={handleWalletPayment}
            disabled={processing}
          >
            <Ionicons name="wallet" size={20} color="#fff" style={{marginRight: 8}} />
            <Text style={styles.walletPayText}>
              {processing ? 'Processing...' : `Pay with Wallet ₹${useWallet ? finalAmount : totalAmount}`}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.codButton, processing && styles.disabled]}
          onPress={handleCOD}
          disabled={processing}
        >
          <Text style={styles.codText}>Cash on Delivery</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNavigation />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  headerContainer: { backgroundColor: '#4CAF50', paddingTop: 50, paddingBottom: 10, alignItems: 'center' },
  scroll: { padding: 20, paddingBottom: 120 },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  amountBox: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 20 },
  amountLabel: { fontSize: 16, color: '#666' },
  amount: { fontSize: 22, fontWeight: 'bold', color: '#4CAF50', marginTop: 5 },
  
  // Wallet styles
  walletBox: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#4CAF50' },
  walletHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  walletInfo: { flexDirection: 'row', alignItems: 'center' },
  walletTextContainer: { marginLeft: 12 },
  walletTitle: { fontSize: 14, color: '#666' },
  walletBalance: { fontSize: 18, fontWeight: 'bold', color: '#4CAF50' },
  walletToggle: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e0e0e0' },
  walletToggleActive: { backgroundColor: '#4CAF50' },
  walletToggleText: { fontSize: 14, fontWeight: 'bold', color: '#666' },
  walletToggleTextActive: { color: '#fff' },
  walletDiscount: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  walletDiscountText: { fontSize: 14, color: '#4CAF50', fontWeight: 'bold' },
  finalAmountText: { fontSize: 16, color: '#333', fontWeight: 'bold', marginTop: 4 },
  
  payButton: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, marginBottom: 15 },
  walletPayButton: { backgroundColor: '#FF9800', padding: 15, borderRadius: 10, marginBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  walletPayText: { color: '#fff', fontSize: 18, textAlign: 'center', fontWeight: 'bold' },
  payText: { color: '#fff', fontSize: 18, textAlign: 'center', fontWeight: 'bold' },
  codButton: { borderWidth: 2, borderColor: '#4CAF50', padding: 15, borderRadius: 10 },
  codText: { color: '#4CAF50', fontSize: 18, textAlign: 'center', fontWeight: 'bold' },
  disabled: { opacity: 0.6 },
  slotContainer: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 20 },
  slotTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginLeft: 8 },
  slotButtons: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  slotButton: { borderWidth: 1, borderColor: '#4CAF50', padding: 10, borderRadius: 5, marginBottom: 10, width: '48%', alignItems: 'center' },
  selected: { backgroundColor: '#4CAF50' },
  slotText: { color: '#4CAF50', fontWeight: 'bold' },
  selectedText: { color: '#fff' },
  dateContainer: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  dateTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginLeft: 8 },
  dateScroll: { marginBottom: 10 },
  dateButton: { borderWidth: 1, borderColor: '#4CAF50', padding: 10, borderRadius: 5, alignItems: 'center', marginRight: 10, minWidth: 80 },
  selectedDate: { backgroundColor: '#4CAF50' },
  dateText: { color: '#4CAF50', fontWeight: 'bold', fontSize: 12 },
  selectedDateText: { color: '#fff' },
});

export default PaymentScreen;
