import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const CustomHeader = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    getCurrentUser();
    getCartCount();

    // Listen for focus events
    const unsubscribeFocus = navigation.addListener('focus', () => {
      console.log('Header focused, refreshing cart count');
      getCartCount();
    });

    // Also listen for navigation state changes
    const unsubscribeState = navigation.addListener('state', () => {
      console.log('Navigation state changed, refreshing cart count');
      getCartCount();
    });

    return () => {
      unsubscribeFocus();
      unsubscribeState();
    };
  }, [navigation]);

  const getCurrentUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        setUser(JSON.parse(userData));
      } else {
        // For demo purposes
        setUser({ id: 1, name: 'Demo User' });
      }
    } catch (error) {
      console.error('Error getting user:', error);
      // For demo purposes
      setUser({ id: 1, name: 'Demo User' });
    }
  };

  const getCartCount = async () => {
    try {
      // Get current user data
      const userData = await AsyncStorage.getItem('userData');
      const userToken = await AsyncStorage.getItem('userToken');
      const currentUser = userData ? JSON.parse(userData) : null;

      // Validate user.id exists and is valid
      if (!currentUser || !currentUser.id || isNaN(currentUser.id)) {
        console.log('Invalid user for cart count');
        setCartCount(0);
        return;
      }

      console.log('Getting cart count for user:', currentUser.id);
      
      // Use the API service to get cart items
      const cartItems = await api.getCart(currentUser.id, userToken);
      
      if (cartItems && Array.isArray(cartItems)) {
        const totalCount = cartItems.reduce((total, item) => total + item.quantity, 0);
        console.log('Cart count updated:', totalCount);
        setCartCount(totalCount);
      } else {
        setCartCount(0);
      }
    } catch (error) {
      console.log('Error getting cart count:', error.message);
      // Don't show alert - just set to 0 silently
      setCartCount(0);
    }
  };

  const handleCartPress = () => {
    navigation.navigate('Cart');
  };

  const handleDrawerPress = () => {
    navigation.openDrawer();
  };

  // Don't show header on auth screens
  if (route.name === 'Login' || route.name === 'Register' || route.name === 'Splash') {
    return null;
  }

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={handleDrawerPress}
      >
        <Text style={styles.menuIcon}>☰</Text>
      </TouchableOpacity>

      <Text style={styles.headerTitle}>
        {route.params?.title || getScreenTitle(route.name)}
      </Text>

      <TouchableOpacity
        style={styles.cartButton}
        onPress={handleCartPress}
      >
        <Text style={styles.cartIcon}>🛒</Text>
        {cartCount > 0 && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cartCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const getScreenTitle = (screenName) => {
  const titleMap = {
    'Categories': 'Fresh Grupo',
    'PackTypes': 'Select Package',
    'PackContents': 'Package Details',
    'Cart': 'Shopping Cart',
    'Address': 'Delivery Address',
  };
  return titleMap[screenName] || 'Fresh Grupo';
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuButton: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  menuIcon: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  cartButton: {
    position: 'relative',
    padding: 10,
    backgroundColor: 'rgba(248, 243, 243, 1)',
    borderRadius: 20,
  },
  cartIcon: {
    fontSize: 20,
    color: '#e50b0bff',
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ff5722',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ef140dff',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default CustomHeader;