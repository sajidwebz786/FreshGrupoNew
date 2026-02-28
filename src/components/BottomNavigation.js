import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BottomNavigation = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    // Fetch wallet balance when component mounts
    const unsubscribe = navigation.addListener('focus', () => {
      fetchWalletBalance();
    });
    
    return unsubscribe;
  }, [navigation]);

  const fetchWalletBalance = async () => {
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
      console.error('Error fetching wallet balance:', err);
    }
  };

  const menuItems = [
    { icon: 'home-outline', text: 'Home', onPress: () => navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Drawer' }] })) },
    { icon: 'list-outline', text: 'Categories', onPress: () => navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Drawer' }] })) },
    { icon: 'cart-outline', text: 'Cart', onPress: () => navigation.navigate('Cart') },
    { icon: 'wallet-outline', text: 'Wallet', onPress: () => navigation.navigate('Wallet'), showBadge: true },
    { icon: 'document-text-outline', text: 'Orders', onPress: () => navigation.navigate('OrderHistory') },
  ];

  return (
    <View style={[styles.bottomMenu, { bottom: insets.bottom }]}>
      {menuItems.map((item, index) => (
        <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
          <View>
            <Ionicons name={item.icon} size={20} color="#fff" />
            {item.showBadge && walletBalance > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{walletBalance.toFixed(0)}</Text>
              </View>
            )}
          </View>
          <Text style={styles.menuText}>{item.text}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomMenu: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    justifyContent: 'space-around',
    position: 'absolute',
    left: 0,
    right: 0,
    elevation: 6,
  },
  menuItem: { alignItems: 'center' },
  menuText: { fontSize: 12, color: '#fff', fontWeight: 'bold' },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF9800',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default BottomNavigation;