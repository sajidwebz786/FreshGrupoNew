import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
  Image,
  Animated,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { useRoute, useNavigation } from '@react-navigation/native';
import api from '../services/api';
import CustomHeader from '../components/CustomHeader';
import BottomNavigation from '../components/BottomNavigation';
import FarmerAnimation from '../components/FarmerAnimation';

const PackTypesScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { category } = route.params || {};
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollViewRef = useRef(null);
  const autoScrollInterval = useRef(null);

  console.log('PackTypesScreen route params:', route.params);
  console.log('PackTypesScreen category:', category);

  const cardAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const packOffers = [
    { id: 1, category: 'Weekly Pack', image: require('../../images/12.jpeg'), discount: '15% OFF on', title: 'Weekly Pack Special Offer' },
    { id: 2, category: 'Bi-Weekly Pack', image: require('../../images/13.jpeg'), discount: '20% OFF on', title: 'Bi-Weekly Pack Launch Offer' },
    { id: 3, category: 'Monthly Pack', image: require('../../images/14.jpeg'), discount: '25% OFF on', title: 'Monthly Pack Mega Offer' },
    { id: 4, category: 'Premium Pack', image: require('../../images/15.jpeg'), discount: '30% OFF on', title: 'Premium Pack Exclusive Deal' },
    { id: 5, category: 'Seasonal Pack', image: require('../../images/16.jpeg'), discount: '35% OFF on', title: 'Seasonal Pack Limited Time' },
  ];

  useEffect(() => {
    const startAutoScroll = () => {
      autoScrollInterval.current = setInterval(() => {
        setActiveSlide(prev => {
          const next = (prev + 1) % packOffers.length;
          scrollViewRef.current?.scrollTo({ x: next * Dimensions.get('window').width, animated: true });
          return next;
        });
      }, 4000);
    };
    startAutoScroll();
    return () => clearInterval(autoScrollInterval.current);
  }, []);

  const handleScrollBegin = () => clearInterval(autoScrollInterval.current);
  const handleScrollEnd = () => {
    clearInterval(autoScrollInterval.current);
    autoScrollInterval.current = setInterval(() => {
      setActiveSlide(prev => {
        const next = (prev + 1) % packOffers.length;
        scrollViewRef.current?.scrollTo({ x: next * Dimensions.get('window').width, animated: true });
        return next;
      });
    }, 4000);
  };

  useEffect(() => {
    console.log('PackTypesScreen mounted with category:', category);
    fetchPacks();
  }, [category]);

  const fetchPacks = async () => {
    try {
      setLoading(true);
      console.log('Fetching packs for category:', category);
      // Find category by name to get ID
      const categories = await api.getCategories();
      const selectedCategory = categories.find(cat => cat.name === category);
      console.log('Selected category:', selectedCategory);

      if (selectedCategory) {
        const data = await api.getPacksByCategory(selectedCategory.id);
        console.log('Packs data:', data);
        setPacks(data);
      } else {
        console.log('Category not found:', category);
        Alert.alert('Error', `Category "${category}" not found`);
      }
    } catch (error) {
      console.error('Error fetching packs:', error);
      Alert.alert('Error', 'Failed to fetch packs. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && packs.length > 0) {
      const animations = cardAnimations.map((anim, i) =>
        Animated.spring(anim, { toValue: 1, tension: 50, friction: 7, delay: i * 150, useNativeDriver: true })
      );
      Animated.stagger(100, animations).start();
    }
  }, [loading, packs]);

  const handleSelectPack = pack => {
    navigation.navigate('PackContents', {
      category: category,
      packType: pack.PackType.name,
      packId: pack.id,
      duration: pack.PackType.duration,
    });
  };

  if (!category) {
    return (
      <View style={styles.centeredContainer}>
        <Text>No category selected</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <ImageBackground
        source={require('../../images/clean_app_bg.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#28a745" />
          <Text style={styles.loadingText}>Loading packs...</Text>
        </View>
      </ImageBackground>
    );
  }

  const getAvailablePackTypes = cat => {
    // mapping from category parameter to human-friendly prefix and icon
    // make sure keys exactly match actual category names from API
    const prefixMap = {
      'Fruits Pack': 'Fruit Pack',
      'Vegetables Pack': 'Veggie Pack',
      'Grocery Pack': 'Grocery Pack',
      'Juices Pack': 'Juice Pack',
      'Millets Pack': 'Millet Pack',
      'Raw Powder Pack': 'Raw Powder Pack',
      'Nutrition Pack': 'Nutrition Pack',
      'Dry Fruit Pack': 'Dry Fruit Pack',
      'Festival Pack': 'Festival Pack',
      'Flower Pack': 'Flower Pack',
      'Sprouts Pack': 'Sprouts Pack',
    };
    const iconMap = {
      'Fruits Pack': '🍎🍉🍇',
      'Vegetables Pack': '🥕🥦🌽',
      'Grocery Pack': '🛒',
      'Juices Pack': '🧃',
      'Millets Pack': '🌾',
      'Raw Powder Pack': '🫙',
      'Nutrition Pack': '💊',
      'Dry Fruit Pack': '🥜',
      'Festival Pack': '🎁',
      'Flower Pack': '💐',
      'Sprouts Pack': '🌱',
    };
    
    // Get category-specific item names (fruits, vegetables, etc.)
    const itemTypeMap = {
      'Fruits Pack': 'Fruits',
      'Vegetables Pack': 'Vegetables',
      'Grocery Pack': 'Items',
      'Juices Pack': 'Juices',
      'Millets Pack': 'Millets',
      'Raw Powder Pack': 'Spices',
      'Nutrition Pack': 'Supplements',
      'Dry Fruit Pack': 'Dry Fruits',
      'Festival Pack': 'Special Items',
      'Flower Pack': 'Flowers',
      'Sprouts Pack': 'Sprouts',
    };
    
    const prefix = prefixMap[cat] || cat;
    const icon = iconMap[cat] || '🎯';
    const itemType = itemTypeMap[cat] || 'Items';

    const base = [
      { 
        name: `Small ${prefix}`, 
        description: '1–2 Persons | 3–4 Days', 
        color: '#2E7D32', 
        gradientColors: ['#66BB6A', '#43A047', '#2E7D32'],
        duration: 'small', 
        available: true, 
        price: '₹2,500',
        badge: 'Best Value'
      },
      { 
        name: `Medium ${prefix}`, 
        description: '3–4 Persons | 1 Week', 
        color: '#E65100', 
        gradientColors: ['#FFB74D', '#F57C00', '#E65100'],
        duration: 'medium', 
        available: true, 
        price: '₹4,500',
        badge: 'Popular'
      },
      { 
        name: `Large ${prefix}`, 
        description: 'Joint Family / Health Lovers', 
        color: '#C62828', 
        gradientColors: ['#EF5350', '#E53935', '#C62828'],
        duration: 'large', 
        available: true, 
        price: '₹7,500',
        badge: 'Premium'
      },
      { 
        name: 'Custom Pack', 
        description: 'Your Choice', 
        color: '#7B1FA2', 
        gradientColors: ['#BA68C8', '#8E24AA', '#6A1B9A'],
        duration: 'custom', 
        available: true, 
        price: 'Customize',
        badge: 'Customize'
      },
    ];

    return base;
  };

  const packTypes = getAvailablePackTypes(category);

  // Merge base pack types with API pack data to get actual prices
  const mergedPackTypes = packTypes.map(basePack => {
    if (basePack.duration === 'custom') return basePack;
    
    // Debug: Log what's being compared
    console.log('Looking for pack with duration:', basePack.duration);
    console.log('Available packs:', packs.map(p => ({ id: p.id, name: p.name, duration: p.PackType?.duration, productsCount: p.Products?.length })));
    
    // Find matching pack from API data
    const apiPack = packs.find(p => p.PackType?.duration === basePack.duration);
    console.log('Found matching pack:', apiPack ? { id: apiPack.id, name: apiPack.name, hasProducts: !!apiPack.Products } : 'none');
    
    if (apiPack) {
      // First try to calculate from Products
      if (apiPack.Products && apiPack.Products.length > 0) {
        console.log('Products in pack:', apiPack.Products.map(p => ({ name: p.name, price: p.price, packProduct: p.PackProduct })));
        // Calculate total price from products
        const totalPrice = apiPack.Products.reduce((sum, item) => {
          const price = item.PackProduct?.unitPrice || item.price || 0;
          const qty = item.PackProduct?.quantity || 1;
          return sum + (price * qty);
        }, 0);
        console.log('Calculated total price from products:', totalPrice);
        
        if (totalPrice > 0) {
          return {
            ...basePack,
            price: `₹${Math.round(totalPrice).toLocaleString('en-IN')}`,
            finalPrice: totalPrice,
            apiPackId: apiPack.id
          };
        }
      }
      
      // Fallback: Use Pack's finalPrice or basePrice from API
      if (apiPack.finalPrice > 0) {
        console.log('Using finalPrice from API:', apiPack.finalPrice);
        return {
          ...basePack,
          price: `₹${Math.round(apiPack.finalPrice).toLocaleString('en-IN')}`,
          finalPrice: apiPack.finalPrice,
          apiPackId: apiPack.id
        };
      }
      
      // Fallback: Use PackType basePrice
      if (apiPack.PackType?.basePrice > 0) {
        console.log('Using PackType basePrice:', apiPack.PackType.basePrice);
        return {
          ...basePack,
          price: `₹${Math.round(apiPack.PackType.basePrice).toLocaleString('en-IN')}`,
          finalPrice: apiPack.PackType.basePrice,
          apiPackId: apiPack.id
        };
      }
    }
    
    console.log('Using default price:', basePack.price);
    return basePack;
  });


  return (
    <View style={styles.mainContainer}>
      {/* Only status bar green; rest is normal */}
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" translucent={true} />
      <View style={styles.headerContainer}>
        <CustomHeader />
      </View>
      <ImageBackground source={require('../../images/innerimage.png')} style={styles.background} resizeMode="cover" opacity={0.1}>
        <View style={styles.scrollContainer}>
          {/* Farmer with Bulls - Full Width Hero Image */}
          <View style={styles.animationContainer}>
            <FarmerAnimation />
          </View>

          {/* Branded Title Section - Text Background Only */}
          <View style={styles.titleContainer}>
            <View style={styles.titleTextBackground}>
              <Text style={styles.title}>Choose Your {category}</Text>
              <Text style={styles.subtitle}>Select a delivery plan that works for you</Text>
            </View>
            <Text style={styles.tapGuidance}>👆 Tap on a pack to select</Text>
          </View>

          {/* Pack Cards - 2x2 Grid */}
          <View style={styles.packsContainer}>
            <View style={styles.categoriesGrid}>
            {mergedPackTypes.map((pack, i) => (
              <View key={i} style={styles.cardWithBadgeContainer}>
                <Animated.View
                  style={[
                    styles.categoryCard,
                    {
                      opacity: pack.available ? cardAnimations[i] : 0.5,
                      transform: pack.available
                        ? [
                            { scale: cardAnimations[i].interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
                            { translateY: cardAnimations[i].interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
                          ]
                        : [],
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.cardTouchable}
                    disabled={!pack.available}
                    onPress={() => {
                      if (pack.duration === 'custom') {
                        navigation.navigate('CustomPack', { category });
                      } else {
                        // Let PackContentsScreen fetch the pack and calculate price fresh
                        navigation.navigate('PackContents', {
                          category: category,
                          packType: pack.name,
                          duration: pack.duration,
                          packId: pack.apiPackId,
                        });
                      }
                    }}
                  >
                    <LinearGradient
                      colors={pack.gradientColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.gradientBackground}
                    >
                      <Text style={styles.categoryTitle}>{pack.name}</Text>
                      <Text style={styles.categoryText}>{pack.description}</Text>
                      <View style={styles.priceContainer}>
                        <Text style={styles.priceText}>{pack.price}</Text>
                      </View>
                      {!pack.available && <Text style={styles.unavailableText}>Coming Soon</Text>}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
                {/* Badge outside card in white space */}
                {pack.badge && (
                  <View style={styles.outsideBadgeContainer}>
                    <Text style={styles.outsideBadgeText}>{pack.badge}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
          </View>

          {/* Logo at Top - Under Header */}
          <View style={styles.topLogoContainer}>
            <Image source={require('../../images/logo.png')} style={styles.topLogo} />
          </View>

          {/* Branded Title Section - Text Background Only */}
        </View>
      </ImageBackground>

      <BottomNavigation />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f5f5f5' },
  headerContainer: {
    paddingTop: 50,
    backgroundColor: '#4CAF50',
  },
  background: { flex: 1 },
  scrollContainer: { flex: 1, paddingBottom: 100 },  // reduced padding to accommodate logo


  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: 'white', marginTop: 10, textAlign: 'center' },
  
  // Animation Container - Full Width
  animationContainer: { 
    marginVertical: 0,
    height: 80, // Reduced height to make room for cards
  },
  
  // Branded Title Section - No Background
  titleContainer: {
    paddingTop: 10,
    paddingBottom: 15,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  titleTextBackground: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 15,
    alignItems: 'center',
  },
  tapGuidance: {
    fontSize: 15,
    color: '#4CAF50',
    marginTop: 15,
    fontStyle: 'italic',
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#fff', 
    marginBottom: 3, 
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
  },
  topLogoContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  topLogo: {
    width: 200,
    height: 100,
    resizeMode: 'contain',
  },

  // Logo at Bottom (removed)
  bottomLogoContainer: {
    display: 'none',
  },
  bottomLogo: {
    display: 'none',
  },
  
  // Pack Cards Container
  packsContainer: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
  
  // Pack Cards - 2x2 Grid Layout
  categoriesGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    paddingHorizontal: 5,
    gap: 10,
  },
  cardWithBadgeContainer: {
    width: '47%',
    alignItems: 'center',
    marginBottom: 5,
  },
  
  // Individual Card - Smaller for 2x2 Grid
  categoryCard: { 
    width: '100%', 
    height: 140, 
    marginVertical: 4, 
    borderRadius: 18, 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 3 }, 
    shadowOpacity: 0.25, 
    shadowRadius: 4, 
    elevation: 6,
    overflow: 'hidden',
  },
  cardTouchable: { 
    width: '100%', 
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradientBackground: {
    width: '100%',
    height: '100%',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  badgeContainer: {
    display: 'none',
  },
  badgeText: {
    display: 'none',
  },
  badgeContainer: {
    display: 'none',
  },
  badgeText: {
    display: 'none',
  },
  outsideBadgeContainer: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 2,
  },
  outsideBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  packIcon: {
    display: 'none',
  },
  categoryTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#fff', 
    marginBottom: 6, 
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  categoryText: { 
    fontSize: 13, 
    color: 'rgba(255,255,255,0.95)', 
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  emojiIndicator: {
    fontSize: 24,
    marginBottom: 4,
  },
  detailsContainer: {
    marginTop: 4,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  detailText: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 1,
  },
  priceContainer: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
    marginTop: 10,
  },
  priceText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  unavailableText: { 
    fontSize: 11, 
    color: '#999', 
    textAlign: 'center', 
    marginTop: 10, 
    fontStyle: 'italic' 
  },
});

export default PackTypesScreen;
