import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomHeader from '../components/CustomHeader';
import BottomNavigation from '../components/BottomNavigation';
import api from '../services/api';

const CustomPackScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { category } = route.params || {};

  const [currentCategory, setCurrentCategory] = useState(category);
  const [allProducts, setAllProducts] = useState({});
  const [selectedProducts, setSelectedProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [weeklyPackValue, setWeeklyPackValue] = useState(0);

  const categoryMap = {
    'Fruits Pack': 1,
    'Vegetables Pack': 2,
    'Grocery Pack': 3,
    'Juices Pack': 4,
    'Millets Pack': 5,
    'Raw Powder Pack': 6,
    'Nutrition Pack': 7,
    'Dry Fruit Pack': 8,
    'Festival Pack': 9,
    'Flower Pack': 10,
    'Sprouts Pack': 11
  };
  const categoryNames = {
    1: 'Fruits Pack',
    2: 'Vegetables Pack',
    3: 'Grocery Pack',
    4: 'Juices Pack',
    5: 'Millets Pack',
    6: 'Raw Powder Pack',
    7: 'Nutrition Pack',
    8: 'Dry Fruit Pack',
    9: 'Festival Pack',
    10: 'Flower Pack',
    11: 'Sprouts Pack'
  };

  useEffect(() => {
    fetchAllProducts();
    fetchWeeklyPackValue();
  }, []);

  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      const allProductsData = {};

      // Fetch products from all categories
      for (const [categoryName, categoryId] of Object.entries(categoryMap)) {
        try {
          const data = await api.getProductsByCategory(categoryId);
          allProductsData[categoryName] = data;
        } catch (error) {
          console.error(`Error fetching ${categoryName} products:`, error);
        }
      }

      setAllProducts(allProductsData);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch products. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // renamed to fetchSmallPackValue since smallest pack is now used as minimum threshold
  const fetchWeeklyPackValue = async () => {
    try {
      const categoryId = categoryMap[category];
      if (categoryId) {
        const packs = await api.getPacksByCategory(categoryId);
        // use 'small' duration instead of 'weekly' as per new naming
        const smallPack = packs.find(p => p.PackType.duration === 'small');
        if (smallPack) {
          setWeeklyPackValue(smallPack.finalPrice);
        }
      }
    } catch (error) {
      console.error('Error fetching small pack value:', error);
    }
  };

  const handleProductSelect = (productId, quantity) => {
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: quantity
    }));
  };

  const getTotalValue = () => {
    let total = 0;
    Object.values(allProducts).forEach(categoryProducts => {
      categoryProducts.forEach(product => {
        const quantity = selectedProducts[product.id] || 0;
        total += product.price * quantity;
      });
    });
    return total;
  };

  const getCurrentCategoryProducts = () => {
    return allProducts[currentCategory] || [];
  };

  const handleAddToCart = async () => {
    const totalValue = getTotalValue();

    if (totalValue < weeklyPackValue) {
      Alert.alert(
        'Insufficient Value',
        `Your custom pack value (₹${totalValue}) is less than the minimum weekly pack value (₹${weeklyPackValue}). Please add more products to meet the minimum requirement.`,
        [{ text: 'OK' }]
      );
      return;
    }

    const selectedItems = Object.entries(selectedProducts).filter(([_, qty]) => qty > 0);

    if (selectedItems.length === 0) {
      Alert.alert('No Products Selected', 'Please select at least one product for your custom pack.');
      return;
    }

    try {
      setAddingToCart(true);
      const userData = await AsyncStorage.getItem('userData');
      const userToken = await AsyncStorage.getItem('userToken');

      if (!userData || !userToken) {
        Alert.alert('Please login first');
        setAddingToCart(false);
        return;
      }

      const user = JSON.parse(userData);
      
      // Validate user.id exists and is valid
      if (!user || !user.id || isNaN(user.id)) {
        Alert.alert('Invalid user session', 'Please login again.');
        setAddingToCart(false);
        return;
      }
      
      const userId = user.id;

      // Prepare custom pack data
      const customPackItems = Object.entries(selectedProducts)
        .filter(([_, qty]) => qty > 0)
        .map(([productId, quantity]) => {
          const product = allProducts[currentCategory]?.find(p => p.id == productId);
          return {
            productId: parseInt(productId),
            name: product?.name || 'Unknown Product',
            price: product?.price || 0,
            quantity: quantity,
            unit: product?.UnitType?.abbreviation || 'PC'
          };
        });

      const customPackData = {
        userId,
        quantity: 1, // Custom packs are added as single items
        isCustom: true,
        customPackName: `${category} Custom Pack`,
        customPackItems: JSON.stringify(customPackItems)
      };

      console.log('Adding custom pack to cart:', customPackData);

      const response = await api.addToCart(customPackData, userToken);

      if (response) {
        Alert.alert(
          'Success',
          'Custom pack added to cart successfully!',
          [
            { text: 'Continue Shopping', style: 'default' },
            {
              text: 'Go to Cart',
              onPress: () => navigation.navigate('Cart')
            }
          ]
        );
      } else {
        throw new Error('Failed to add to cart');
      }
    } catch (error) {
      console.error('Error processing custom pack:', error);
      // Show the actual error message from the API
      const errorMessage = error.response?.error || error.message || 'Please check your connection and try again.';
      Alert.alert('Failed to add custom pack to cart', errorMessage);
    } finally {
      setAddingToCart(false);
    }
  };

  const getProductIcon = (name) => {
    const n = name.toLowerCase();
    // Beverages
    if (n.includes('juice')) return '🥤';
    if (n.includes('tea')) return '☕';
    if (n.includes('coffee')) return '☕';
    // Vegetables
    if (n.includes('tomato')) return '🍅';
    if (n.includes('potato')) return '🥔';
    if (n.includes('carrot')) return '🥕';
    if (n.includes('onion')) return '🧅';
    if (n.includes('garlic')) return '🧄';
    if (n.includes('ginger')) return '🫚';
    if (n.includes('spinach')) return '🥬';
    if (n.includes('lettuce')) return '🥬';
    if (n.includes('broccoli')) return '🥦';
    if (n.includes('cauliflower')) return '🥬';
    if (n.includes('cucumber')) return '🥒';
    if (n.includes('bell pepper') || n.includes('capsicum')) return '🫑';
    if (n.includes('eggplant') || n.includes('brinjal')) return '🍆';
    if (n.includes('corn')) return '🌽';
    if (n.includes('peas')) return '🫛';
    if (n.includes('beans')) return '🫘';
    // Fruits
    if (n.includes('apple')) return '🍎';
    if (n.includes('banana')) return '🍌';
    if (n.includes('orange')) return '🍊';
    if (n.includes('grape')) return '🍇';
    if (n.includes('strawberry')) return '🍓';
    if (n.includes('papaya')) return '🥭';
    if (n.includes('kiwi')) return '🥝';
    if (n.includes('mango')) return '🥭';
    if (n.includes('pineapple')) return '🍍';
    if (n.includes('watermelon')) return '🍉';
    if (n.includes('lemon')) return '🍋';
    if (n.includes('lime')) return '🍋';
    // Dairy and Proteins
    if (n.includes('milk')) return '🥛';
    if (n.includes('cheese')) return '🧀';
    if (n.includes('yogurt') || n.includes('curd')) return '🥛';
    if (n.includes('egg')) return '🥚';
    if (n.includes('chicken')) return '🍗';
    if (n.includes('fish')) return '🐟';
    if (n.includes('meat') || n.includes('beef') || n.includes('pork')) return '🥩';
    // Grains and Staples
    if (n.includes('rice')) return '🍚';
    if (n.includes('wheat') || n.includes('flour')) return '🌾';
    if (n.includes('bread')) return '🍞';
    if (n.includes('pasta') || n.includes('noodle')) return '🍝';
    // Oils and Condiments
    if (n.includes('oil')) return '🫒';
    if (n.includes('ghee')) return '🫒';
    if (n.includes('butter')) return '🧈';
    if (n.includes('sugar')) return '🧂';
    if (n.includes('salt')) return '🧂';
    if (n.includes('pepper') && !n.includes('bell')) return '🌶️';
    if (n.includes('spice') || n.includes('cumin') || n.includes('turmeric') || n.includes('coriander')) return '🧂';
    // Nutrition and Supplements
    if (n.includes('protein')) return '💪';
    if (n.includes('multivitamin') || n.includes('multi vitamin') || n.includes('vitamin')) return '🧴';
    if (n.includes('omega') || n.includes('capsule') || n.includes('caps')) return '💊';
    if (n.includes('calcium') || n.includes('tabs')) return '🦴';
    if (n.includes('supplement')) return '🧪';

    // Others
    if (n.includes('honey')) return '🍯';
    if (n.includes('jam')) return '🍯';
    if (n.includes('nut') || n.includes('almond') || n.includes('cashew')) return '🥜';
    if (n.includes('seed') || n.includes('chia') || n.includes('flax')) return '🌱';
    return '📦'; // Default icon
  };

  if (!category) {
    return (
      <View style={styles.centered}>
        <Text>No category selected</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#28a745" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  const totalValue = getTotalValue();

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#28a745" barStyle="light-content" translucent={true} />

      <View style={styles.headerContainer}>
        <CustomHeader />
      </View>

      <View style={styles.categorySelector}>
        <Text style={styles.selectorTitle}>Select Products for {category} Custom Pack</Text>
        <Text style={styles.minValueText}>Minimum value: ₹{weeklyPackValue}</Text>
        <Text style={styles.crossCategoryCaption}>
          💡 You can add items from any category to meet the minimum value requirement
        </Text>
        <View style={styles.categoryButtons}>
          {Object.entries(categoryNames).map(([id, name]) => (
            <TouchableOpacity
              key={id}
              style={[
                styles.categoryButton,
                currentCategory === name && styles.activeCategoryButton
              ]}
              onPress={() => setCurrentCategory(name)}
            >
              <Text style={[
                styles.categoryButtonText,
                currentCategory === name && styles.activeCategoryButtonText
              ]}>
                {name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={true}>
        <Text style={styles.sectionTitle}>Available {currentCategory} Products</Text>
        <View style={styles.productsContainer}>
          {getCurrentCategoryProducts().map((product) => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productIconContainer}>
                <Text style={styles.productIcon}>{getProductIcon(product.name)}</Text>
              </View>
              <View style={styles.productDetails}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productUnit}>
                  Unit: {product.UnitType?.abbreviation || 'PC'} (₹{product.price})
                </Text>
              </View>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => {
                    const currentQty = selectedProducts[product.id] || 0;
                    if (currentQty > 0) {
                      handleProductSelect(product.id, currentQty - 1);
                    }
                  }}
                >
                  <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityText}>{selectedProducts[product.id] || 0}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => {
                    const currentQty = selectedProducts[product.id] || 0;
                    handleProductSelect(product.id, currentQty + 1);
                  }}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>Total: ₹{totalValue}</Text>
          {totalValue < weeklyPackValue && (
            <Text style={styles.warningText}>
              Add ₹{weeklyPackValue - totalValue} more to meet minimum
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.addToCartButton,
            (addingToCart || totalValue < weeklyPackValue) && styles.disabledButton
          ]}
          onPress={handleAddToCart}
          disabled={addingToCart || totalValue < weeklyPackValue}
        >
          <Text style={styles.addToCartText}>
            {addingToCart ? 'Adding...' : 'Add Custom Pack to Cart'}
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
  loadingText: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 10 },

  categorySelector: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
  },
  selectorTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5, color: '#333' },
  minValueText: { fontSize: 14, color: '#666', marginBottom: 5 },
  crossCategoryCaption: { fontSize: 12, color: '#28a745', fontStyle: 'italic', marginBottom: 10, textAlign: 'center' },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center'
  },
  categoryButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginVertical: 3,
    marginHorizontal: 4,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#4CAF50',
    backgroundColor: '#f8f9fa',
    minWidth: 80,
  },
  activeCategoryButton: { backgroundColor: '#4CAF50' },
  categoryButtonText: { textAlign: 'center', fontSize: 12, color: '#4CAF50' },
  activeCategoryButtonText: { color: '#fff' },

  scrollContainer: { flex: 1, marginHorizontal: 10, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginVertical: 8, textAlign: 'center' },
  productsContainer: { paddingBottom: 120 },

  productCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
  },
  productIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productIcon: { fontSize: 20 },
  productDetails: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 2 },
  productUnit: { fontSize: 12, color: '#666', marginBottom: 2 },
  productPrice: { fontSize: 12, color: '#28a745', fontWeight: 'bold' },
  quantityControls: { flexDirection: 'row', alignItems: 'center' },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  quantityText: { marginHorizontal: 10, fontSize: 14, fontWeight: 'bold', minWidth: 20, textAlign: 'center' },

  footer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 15,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: -2 },
  },
  totalContainer: { marginBottom: 10 },
  totalText: { fontSize: 18, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  warningText: { fontSize: 12, color: '#dc3545', textAlign: 'center', marginTop: 5 },
  addToCartButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
  },
  disabledButton: { backgroundColor: '#ccc' },
  addToCartText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});

export default CustomPackScreen;