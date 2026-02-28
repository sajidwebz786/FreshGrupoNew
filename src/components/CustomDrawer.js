import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import { DrawerActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const CustomDrawer = (props) => {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    getCurrentUser();
    getCartCount();
  }, []);

  const getCurrentUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        setUser(JSON.parse(userData));
      } else {
        // For demo purposes
        setUser({ id: 1, name: 'Demo User', email: 'demo@freshgroupo.com' });
      }
    } catch (error) {
      console.error('Error getting user:', error);
      // For demo purposes
      setUser({ id: 1, name: 'Demo User', email: 'demo@freshgroupo.com' });
    }
  };

  const getCartCount = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');

      if (token) {
        console.log('Drawer getting cart count');
        const countData = await api.getCartCount(token);
        const totalCount = countData.count || 0;
        console.log('Drawer cart count updated:', totalCount);
        setCartCount(totalCount);
      } else {
        console.log('Drawer: No token available for cart count');
        setCartCount(0);
      }
    } catch (error) {
      console.error('Error getting cart count:', error);
      setCartCount(0);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('userData');
              props.navigation.navigate('Login');
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <DrawerContentScrollView {...props} style={styles.drawerContent}>
        {/* Header Section with User Info */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => props.navigation.dispatch(DrawerActions.closeDrawer())}>
            <Ionicons name="close" size={24} color="#d32f2f" />
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Text style={styles.avatarText}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
            </View>
          </View>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Fresh Groupo</Text>
            <Text style={styles.tagline}>Fresh & Healthy</Text>
          </View>
        </View>

        {/* Cart Info */}
        {cartCount > 0 && (
          <View style={styles.cartInfo}>
            <Text style={styles.cartInfoText}>
              🛒 {cartCount} item{cartCount > 1 ? 's' : ''} in cart
            </Text>
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={[styles.menuItem, props.state.index === 0 && styles.activeMenuItem]}
            onPress={() => props.navigation.navigate('MainStack')}
          >
            <Text style={styles.menuIcon}>🏠</Text>
            <Text style={styles.menuText}>Home</Text>
          </TouchableOpacity>


          <TouchableOpacity
            style={[styles.menuItem, props.state.index === 4 && styles.activeMenuItem]}
            onPress={() => props.navigation.navigate('Address')}
          >
            <Text style={styles.menuIcon}>📍</Text>
            <Text style={styles.menuText}>Address</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => props.navigation.navigate('OrderHistory')}
          >
            <Text style={styles.menuIcon}>📋</Text>
            <Text style={styles.menuText}>Order History</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => props.navigation.navigate('Profile')}
          >
            <Text style={styles.menuIcon}>👤</Text>
            <Text style={styles.menuText}>My Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              Alert.alert('About', 'Fresh Groupo - Your fresh produce partner');
            }}
          >
            <Text style={styles.menuIcon}>ℹ️</Text>
            <Text style={styles.menuText}>About</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Section */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </DrawerContentScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  drawerContent: {
    flex: 1,
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    marginBottom: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  tagline: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  cartInfo: {
    backgroundColor: '#e8f5e8',
    marginHorizontal: 10,
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
  },
  cartInfoText: {
    fontSize: 14,
    color: '#2e7d32',
    textAlign: 'center',
    fontWeight: '500',
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginVertical: 2,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    position: 'relative',
  },
  activeMenuItem: {
    backgroundColor: '#e8f5e8',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 15,
    width: 25,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  cartBadge: {
    backgroundColor: '#ff5722',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#ffebee',
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 15,
    width: 25,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#d32f2f',
  },
});

export default CustomDrawer;