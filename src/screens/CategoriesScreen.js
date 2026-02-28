import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Image, ScrollView, Dimensions, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import CustomHeader from '../components/CustomHeader';
import BottomNavigation from '../components/BottomNavigation';
import api from '../services/api';

const CategoriesScreen = () => {
  const navigation = useNavigation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollViewRef = useRef(null);
  const autoScrollInterval = useRef(null);

  const handleSelectCategory = (category) => {
    console.log('Category object:', category);
    console.log('Category name:', category.name);
    const categoryName = category.name || category;
    console.log('Using category name:', categoryName);
    navigation.navigate('PackTypes', { category: categoryName });
  };

  useEffect(() => {
    fetchCategories();
    startAutoScroll();
    return () => clearInterval(autoScrollInterval.current);
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.getCategories();
      console.log('Raw API response:', response);
      console.log('Response type:', typeof response);
      console.log('Is array:', Array.isArray(response));

      // Ensure response is an array
      const categoriesArray = Array.isArray(response) ? response : [];
      console.log('Categories array:', categoriesArray);

      // Map categories to include appropriate images
      const categoriesWithImages = categoriesArray.map((category, index) => {
        console.log('Processing category:', category);
        return {
          ...category,
          image: getCategoryImage(category.name, index),
          color: getCategoryColor(index)
        };
      });
      console.log('Categories with images:', categoriesWithImages);
      setCategories(categoriesWithImages);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryImage = (name, index) => {
    // Map category names to appropriate images with transparent backgrounds
    const imageMap = {
      'Fruits Pack': require('../../images/fruits-pack-icon-removebg.png'),
      'Vegetables Pack': require('../../images/vegetables-pack-icon-removebg.png'),
      'Grocery Pack': require('../../images/grocery-pack-removebg.png'),
      'Juices Pack': require('../../images/juices-pack-removebg.png'),
      'Millets Pack': require('../../images/millet-pack-removebg.png'),
      'Raw Powder Pack': require('../../images/spices-pack-removebg.png'),
      'Nutrition Pack': require('../../images/nutrition-pack-removebg.png'),
      'Dry Fruit Pack': require('../../images/dryfruits-pack-removebg.png'),
      'Festival Pack': require('../../images/festival-pack-removebg.png'),
      'Flower Pack': require('../../images/flower-pack-removebg.png'),
      'Sprouts Pack': require('../../images/Beansprouts-removebg.png'),
    };

    // Static mapping for fallback images (React Native requires static requires)
    const staticImages = {
      1: require('../../images/1.jpeg'),
      2: require('../../images/2.jpeg'),
      3: require('../../images/3.jpeg'),
      4: require('../../images/4.jpeg'),
      5: require('../../images/5.jpeg'),
      6: require('../../images/6.jpeg'),
      7: require('../../images/7.jpeg'),
      8: require('../../images/8.jpeg'),
      9: require('../../images/9.jpeg'),
      10: require('../../images/10.jpeg'),
      11: require('../../images/11.jpeg'),
      12: require('../../images/12.jpeg'),
      13: require('../../images/13.jpeg'),
      14: require('../../images/14.jpeg'),
    };

    // If name matches, return specific image, otherwise use index-based fallback
    if (imageMap[name]) {
      return imageMap[name];
    }

    // Fallback to static images
    const imageNumber = (index % 14) + 1;
    return staticImages[imageNumber] || staticImages[1];
  };

  const getCategoryColor = (index) => {
    const colors = [
      '#4CAF50', '#FF9800', '#2196F3', '#9C27B0', '#FF5722',
      '#795548', '#607D8B', '#3F51B5', '#009688', '#CDDC39',
      '#FFC107', '#E91E63', '#00BCD4', '#8BC34A'
    ];
    return colors[index % colors.length];
  };

  // Auto-scroll functionality
  const startAutoScroll = () => {
    autoScrollInterval.current = setInterval(() => {
      setActiveSlide((prevSlide) => {
        const nextSlide = (prevSlide + 1) % offers.length;
        scrollViewRef.current?.scrollTo({
          x: nextSlide * Dimensions.get('window').width,
          animated: true,
        });
        return nextSlide;
      });
    }, 3000); // Change slide every 3 seconds
  };

  // Stop auto-scroll when user interacts
  const handleScrollBegin = () => {
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
    }
  };

  // Restart auto-scroll after user interaction
  const handleScrollEnd = () => {
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
    }
    autoScrollInterval.current = setInterval(() => {
      setActiveSlide((prevSlide) => {
        const nextSlide = (prevSlide + 1) % offers.length;
        scrollViewRef.current?.scrollTo({
          x: nextSlide * Dimensions.get('window').width,
          animated: true,
        });
        return nextSlide;
      });
    }, 3000);
  };

  const offers = [
    {
      id: 1,
      category: 'Vegetables',
      image: require('../../images/vegetables_pack.jpg'),
      discount: '20% OFF on',
      title: 'Fresh Vegetables - Launch Offer'
    },
    {
      id: 2,
      category: 'Fruits',
      image: require('../../images/fruits_pack.jpg'),
      discount: '20% OFF on',
      title: 'Juicy Fruits - Launch Offer'
    },
    {
      id: 3,
      category: 'Groceries',
      image: require('../../images/grocery_pack.jpg'),
      discount: '20% OFF on',
      title: 'Essential Groceries - Launch Offer'
    },
  ];



  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#28a745" />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" translucent={true} />
      <View style={styles.headerContainer}>
        <CustomHeader />
      </View>
      <ImageBackground
        source={require('../../images/innerimage.png')} // Light leafy plants background
        style={styles.background}
        resizeMode="cover"
        opacity={0.1}
      >
        <View style={styles.scrollContainer}>
          <View style={styles.offersContainer}>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              style={styles.offersScroll}
              decelerationRate="fast"
              snapToInterval={Dimensions.get('window').width}
              onScroll={(event) => {
                const slideIndex = Math.round(event.nativeEvent.contentOffset.x / Dimensions.get('window').width);
                setActiveSlide(slideIndex);
              }}
              scrollEventThrottle={16}
              onTouchStart={handleScrollBegin}
              onMomentumScrollEnd={handleScrollEnd}
            >
              {offers.map((offer, index) => (
                <View key={offer.id} style={styles.offerCard}>
                  <ImageBackground source={offer.image} style={styles.offerBackground} resizeMode="cover">
                    <View style={styles.discountOverlay}>
                      <Text style={styles.discountText}>{offer.discount}</Text>
                      <Text style={styles.offerTitle}>{offer.title}</Text>
                    </View>
                    <View style={styles.categoryIconContainer}>
                      <Image source={offer.image} style={styles.categoryIcon} />
                    </View>
                  </ImageBackground>
                </View>
              ))}
            </ScrollView>
            <View style={styles.paginationDots}>
              {offers.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    activeSlide === index ? styles.activeDot : styles.inactiveDot
                  ]}
                />
              ))}
            </View>
          </View>
          <Text style={styles.title}>Choose Category</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category, index) => (
              <TouchableOpacity
                key={index}
                style={styles.categoryCard}
                onPress={() => handleSelectCategory(category.name)}
              >
                <Image source={category.image} style={styles.categoryImage} resizeMode="contain" />
                <Text style={styles.categoryTitle}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.sloganContainer}>
            <Text style={styles.sloganText}>Freshness Delivered to Your Doorstep!</Text>            
            <Image source={require('../../images/logo.png')} style={styles.logoImage} />
          </View>
        </View>
      </ImageBackground>
      <BottomNavigation />
    </View>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  mainContainer: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: 50,
    backgroundColor: '#4CAF50',
  },
  background: {
    flex: 1,
    backgroundColor: '#fff', // White background
  },
  topSpacing: {
    height: 30, // Reduced top spacing since logo positioning adjusted
  },
  scrollContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  scrollContent: {
    paddingBottom: 80, // Space for bottom menu
    paddingTop: 10, // Add top padding to compensate for logo positioning
  },
  offersContainer: {
    height: 180,
    marginVertical: 2,
  },
  offersScroll: {
    flex: 1,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#4CAF50',
  },
  inactiveDot: {
    backgroundColor: '#ddd',
  },
  sloganContainer: {
    alignItems: 'center',
    marginVertical: 5,
    paddingHorizontal: 20,
  },
  sloganText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 15,
  },
  sloganSubtext: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 15,
  },
  logoImage: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
    top: -80,
  },
  offerCard: {
    width: Dimensions.get('window').width,
    height: 180,
  },
  offerBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  discountText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  offerTitle: {
    color: '#fff',
    fontSize: 14,
    marginTop: 2,
  },
  categoryIconContainer: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -40 }],
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 50,
    padding: 10,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
    marginTop: 5,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  categoryCard: {
    width: '22%',
    marginVertical: 5,
    marginHorizontal: 3,
    alignItems: 'center',
    paddingVertical: 5,
  },
  categoryImage: {
    width: 60,
    height: 60,
    marginBottom: 5,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    numberOfLines: 2,
  },
  categoryText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    numberOfLines: 1,
  },
});

export default CategoriesScreen;