import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomHeader from '../components/CustomHeader';
import BottomNavigation from '../components/BottomNavigation';
import api from '../services/api';

const { width } = Dimensions.get('window');

const PackContentsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { category, packType, packId, duration } = route.params || {};

  const [packDetails, setPackDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [grandTotal, setGrandTotal] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    fetchPackDetails();
    fetchWalletBalance();
  }, [packId, duration, category]);

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

  const fetchPackDetails = async () => {
    try {
      setLoading(true);
      let packData = null;
      
      if (packId) {
        // If we have packId, fetch directly
        packData = await api.getPackDetails(packId);
      } else if (category && duration) {
        // Otherwise, fetch by category and duration
        const categories = await api.getCategories();
        const selectedCategory = categories.find(cat => cat.name === category);
        if (selectedCategory) {
          const packs = await api.getPacksByCategory(selectedCategory.id);
          // Find pack with matching duration
          const matchedPack = packs.find(p => p.PackType?.duration === duration);
          if (matchedPack) {
            packData = await api.getPackDetails(matchedPack.id);
          }
        }
      }
      
      setPackDetails(packData);

      if (packData?.Products?.length) {
        const total = packData.Products.reduce((sum, item) => {
          const price = item.PackProduct?.unitPrice || item.price || 0;
          const qty = item.PackProduct?.quantity || 1;
          return sum + price * qty;
        }, 0);
        setGrandTotal(total);
      }
    } catch (error) {
      console.error('Error fetching pack details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProductIcon = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('mango')) return '🥭';
    if (lowerName.includes('grape')) return '🍇';
    if (lowerName.includes('carrot')) return '🥕';
    if (lowerName.includes('apple')) return '🍎';
    if (lowerName.includes('banana')) return '🍌';
    if (lowerName.includes('orange')) return '🍊';
    if (lowerName.includes('juice') || lowerName.includes('drink')) return '🥤';
    if (lowerName.includes('milk')) return '🥛';
    if (lowerName.includes('bread')) return '🍞';
    if (lowerName.includes('rice')) return '🍚';
    if (lowerName.includes('wheat')) return '🌾';
    if (lowerName.includes('sugar')) return '🧂';
    if (lowerName.includes('salt')) return '🧂';
    if (lowerName.includes('oil')) return '🫒';
    if (lowerName.includes('tomato')) return '🍅';
    if (lowerName.includes('potato')) return '🥔';
    if (lowerName.includes('onion')) return '🧅';
    if (lowerName.includes('garlic')) return '🧄';
    if (lowerName.includes('ginger')) return '🫚';
    if (lowerName.includes('spinach')) return '🥬';
    if (lowerName.includes('lettuce')) return '🥬';
    if (lowerName.includes('cucumber')) return '🥒';
    if (lowerName.includes('pepper')) return '🫑';
    if (lowerName.includes('egg')) return '🥚';
    if (lowerName.includes('chicken')) return '🍗';
    if (lowerName.includes('fish')) return '🐟';
    if (lowerName.includes('cheese')) return '🧀';
    if (lowerName.includes('butter')) return '🧈';
    if (lowerName.includes('yogurt')) return '🥛';
    if (lowerName.includes('honey')) return '🍯';
    if (lowerName.includes('nuts') || lowerName.includes('almond')) return '🥜';
    if (lowerName.includes('dates')) return '🌴';
    if (lowerName.includes('raisin')) return '🍇';
    if (lowerName.includes('tea')) return '🍵';
    if (lowerName.includes('coffee')) return '☕';
    if (lowerName.includes('masala') || lowerName.includes('spice')) return '🌶️';
    if (lowerName.includes('dal') || lowerName.includes('lentil')) return '🫘';
    if (lowerName.includes('flour')) return '🌾';
    if (lowerName.includes('atta')) return '🌾';
    if (lowerName.includes('maida')) return '🌾';
    if (lowerName.includes('besan')) return '🌾';
    if (lowerName.includes('corn')) return '🌽';
    if (lowerName.includes('peas')) return '🫛';
    if (lowerName.includes('beans')) return '🫘';
    if (lowerName.includes('chickpea')) return '🫘';
    if (lowerName.includes('moong')) return '🫘';
    if (lowerName.includes('urad')) return '🫘';
    if (lowerName.includes('toor')) return '🫘';
    if (lowerName.includes('masoor')) return '🫘';
    if (lowerName.includes('rajma')) return '🫘';
    if (lowerName.includes('chana')) return '🫘';
    // Default icon
    return '🥦';
  };

  const handleAddToCart = async () => {
    try {
      setAddingToCart(true);
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        alert('Please login first');
        return;
      }
      const user = JSON.parse(userData);
      
      // Validate user.id exists and is valid
      if (!user || !user.id || isNaN(user.id)) {
        alert('Invalid user session. Please login again.');
        return;
      }
      
      const token = await AsyncStorage.getItem('userToken');
      await api.addToCart({ userId: user.id, packId, quantity: 1 }, token);
      alert('Pack added to cart successfully!');
      // Navigate to Cart screen which will refresh the header
      navigation.getParent().navigate('Cart');
    } catch (err) {
      console.error(err);
      // Show the actual error message from the API
      const errorMessage = err.response?.error || err.message || 'Failed to add to cart';
      alert(errorMessage);
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#28a745" />
        <Text style={styles.loadingText}>Loading pack contents...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" translucent={true} />
      <View style={styles.headerContainer}>
        <CustomHeader />
      </View>

      <View style={styles.packInfo}>
        <Text style={styles.packTitle}>{category} - {packType}</Text>
        <Text style={styles.packPrice}>₹{grandTotal}</Text>
        {/* Pack Details Info */}
        {duration && (
          <View style={styles.packDetails}>
            {duration === 'small' && (
              <>
                <Text style={styles.packDetailText}>4–5 Seasonal {category?.replace(' Pack', '') || 'Items'}</Text>
                <Text style={styles.packDetailText}>Approx 3–4 Kg</Text>
                <Text style={styles.packDetailText}>Basic Family Consumption</Text>
              </>
            )}
            {duration === 'medium' && (
              <>
                <Text style={styles.packDetailText}>6–8 {category?.replace(' Pack', '') || 'Item'} Varieties</Text>
                <Text style={styles.packDetailText}>Approx 6–8 Kg</Text>
                <Text style={styles.packDetailText}>Kids + Working Family</Text>
              </>
            )}
            {duration === 'large' && (
              <>
                <Text style={styles.packDetailText}>8–12 Premium + Seasonal {category?.replace(' Pack', '') || 'Items'}</Text>
                <Text style={styles.packDetailText}>10–15 Kg</Text>
                <Text style={styles.packDetailText}>Includes Exotic (Optional)</Text>
              </>
            )}
          </View>
        )}
        {/* Credit Price Info */}
        <View style={styles.creditInfo}>
          <Text style={styles.creditText}>
            💳 {grandTotal} Credits Required
          </Text>
          <Text style={styles.walletText}>
            Your Wallet: {walletBalance.toFixed(0)} Credits
            {walletBalance >= grandTotal ? ' ✓' : ' - Need ' + (grandTotal - walletBalance).toFixed(0) + ' more'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.contentsTitle}>Pack Contents</Text>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.headerText, styles.colIcon]}></Text>
          <Text style={[styles.headerText, styles.colProduct]}>Product</Text>
          <Text style={[styles.headerText, styles.colUnit]}>Unit</Text>
          <Text style={[styles.headerText, styles.colPrice]}>Rate</Text>
          <Text style={[styles.headerText, styles.colQty]}>KG</Text>
          <Text style={[styles.headerText, styles.colTotal]}>Value</Text>
        </View>

        {/* Pack Products */}
        {(packDetails?.Products || []).map((item, index) => {
          const unitPrice = item.PackProduct?.unitPrice || item.price || 0;
          const qty = item.PackProduct?.quantity || 1;
          const totalValue = unitPrice * qty;
          return (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.productIcon, styles.colIcon]}>{getProductIcon(item.name)}</Text>
              <Text style={[styles.productName, styles.colProduct]} numberOfLines={1}>{item.name}</Text>
              <Text style={[styles.unitText, styles.colUnit]}>{item.unitType || 'KG'}</Text>
              <Text style={[styles.priceText, styles.colPrice]}>₹{unitPrice}</Text>
              <Text style={[styles.qtyText, styles.colQty]}>{qty} KG</Text>
              <Text style={[styles.totalText, styles.colTotal]}>₹{totalValue}</Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={handleAddToCart}
          disabled={addingToCart}
        >
          <Text style={styles.addToCartText}>
            {addingToCart ? 'Adding...' : 'Add to Cart'}
          </Text>
        </TouchableOpacity>
      </View>

      <BottomNavigation />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  headerContainer: {
    paddingTop: 50,
    backgroundColor: '#4CAF50',
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  packInfo: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  packTitle: { fontSize: 18, fontWeight: 'bold' },
  packPrice: { fontSize: 20, fontWeight: 'bold', color: '#28a745' },
  packDetails: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  packDetailText: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    marginBottom: 2,
  },
  creditInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    textAlign: 'center',
  },
  creditText: {
    fontSize: 14,
    color: '#E65100',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  walletText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },

  scrollContainer: { marginHorizontal: 10 },
  scrollContent: { paddingBottom: 100 },
  contentsTitle: { fontSize: 16, fontWeight: 'bold', marginVertical: 10 },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2E7D32',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  headerText: { 
    color: '#fff', 
    fontWeight: 'bold',
    fontSize: 12,
  },
  colIcon: { width: 35, textAlign: 'center' },
  colProduct: { flex: 1, marginRight: 5 },
  colUnit: { width: 50, textAlign: 'center' },
  colPrice: { width: 55, textAlign: 'right' },
  colQty: { width: 40, textAlign: 'center' },
  colTotal: { width: 60, textAlign: 'right' },

  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    marginTop: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productIcon: { fontSize: 18, textAlign: 'center' },
  productName: { fontSize: 13, color: '#333' },
  unitText: { fontSize: 12, color: '#666', textAlign: 'center' },
  priceText: { fontSize: 12, color: '#E65100', textAlign: 'right', fontWeight: '500' },
  qtyText: { fontSize: 12, color: '#333', textAlign: 'center', fontWeight: '500' },
  totalText: { fontSize: 13, color: '#2E7D32', textAlign: 'right', fontWeight: 'bold' },

  grandTotalContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  grandTotalLabel: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
    marginBottom: 5,
  },
  grandTotalText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },

  floatingButtonContainer: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
  },
  addToCartButton: {
    backgroundColor: '#28a745',
    padding: 14,
    borderRadius: 20,
    alignItems: 'center',
  },
  addToCartText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  loadingText: { marginTop: 10, color: '#666' },
});

export default PackContentsScreen;
