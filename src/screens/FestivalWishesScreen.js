import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, Dimensions, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const FestivalWishesScreen = () => {
  const navigation = useNavigation();
  const { width, height } = Dimensions.get('window');
  const titleFade = useRef(new Animated.Value(0)).current;

  // Fireworks particles
  const particles = Array.from({ length: 20 }, (_, i) => ({
    scale: useRef(new Animated.Value(0)).current,
    translateX: useRef(new Animated.Value(0)).current,
    translateY: useRef(new Animated.Value(0)).current,
    opacity: useRef(new Animated.Value(0)).current,
  }));

  const styles = {
    container: {
      flex: 1,
    },
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: width * 0.053, // Responsive padding
      backgroundColor: 'rgba(0,0,0,0.3)', // Semi-transparent overlay for text readability
    },
    particle: {
      position: 'absolute',
      width: width * 0.027, // Responsive particle size
      height: width * 0.027,
      borderRadius: width * 0.013,
    },
    title: {
      fontSize: width * 0.085, // Responsive font size
      fontWeight: 'bold',
      color: '#FFF',
      textAlign: 'center',
      marginBottom: width * 0.053,
      textShadowColor: '#000',
      textShadowOffset: { width: 2, height: 2 },
      textShadowRadius: 5,
    },
    teluguText: {
      fontSize: width * 0.075,
      fontWeight: 'bold',
      color: '#FFD700',
      textAlign: 'center',
      marginBottom: width * 0.04,
      textShadowColor: '#000',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 3,
    },
    englishText: {
      fontSize: width * 0.048,
      color: '#FFF',
      textAlign: 'center',
      marginBottom: width * 0.027,
      textShadowColor: '#000',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
    },
    subtitle: {
      fontSize: width * 0.043,
      color: '#FFD700',
      textAlign: 'center',
      fontStyle: 'italic',
    },
  };

  useEffect(() => {
    // Animate title
    Animated.timing(titleFade, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Animate fireworks
    particles.forEach((particle, index) => {
      const delay = Math.random() * 3000;
      const duration = 1000 + Math.random() * 2000;

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(particle.scale, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(particle.translateX, {
            toValue: (Math.random() - 0.5) * width,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(particle.translateY, {
            toValue: (Math.random() - 0.5) * height,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(particle.opacity, {
            toValue: 1,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // Navigate to Drawer after 6 seconds
    const timer = setTimeout(() => {
      navigation.replace('Drawer');
    }, 6000);

    return () => clearTimeout(timer);
  }, [navigation, particles, width, height]);

  return (
    <ImageBackground
      source={require('../../images/innerimage.png')} // Use existing background image
      style={styles.container}
      resizeMode="cover"
    >
      {/* Fireworks particles */}
      {particles.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              transform: [
                { scale: particle.scale },
                { translateX: particle.translateX },
                { translateY: particle.translateY },
              ],
              opacity: particle.opacity,
              backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][index % 5],
            },
          ]}
        />
      ))}

      <View style={styles.overlay}>
        <Animated.Text style={[styles.title, { opacity: titleFade }]}>
          Happy Makar Sankranti!
        </Animated.Text>
        <Animated.Text style={[styles.teluguText, { opacity: titleFade }]}>
          మకర సంక్రాంతి శుభాకాంక్షలు!
        </Animated.Text>
        <Animated.Text style={[styles.englishText, { opacity: titleFade }]}>
          Wishing you a prosperous and joyful festival!
        </Animated.Text>
        <Animated.Text style={[styles.subtitle, { opacity: titleFade }]}>
          May this harvest festival bring you happiness and abundance.
        </Animated.Text>
      </View>
    </ImageBackground>
  );
};

export default FestivalWishesScreen;