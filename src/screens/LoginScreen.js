import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const LoginScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { width, height } = Dimensions.get('window');
  const translateX = useSharedValue(width);
  const titleOpacity = useSharedValue(0);
  const dotsOpacity = useSharedValue(0);

  const images = [
    require('../../images/12.jpeg'),
    require('../../images/13.jpeg'),
    require('../../images/14.jpeg'),
    require('../../images/15.jpeg'),
    require('../../images/16.jpeg'),
  ];

  const imageTitles = [
    'Millets',
    'Vegetables',
    'Fruits',
    'Groceries',
    'Juices'
  ];

  useEffect(() => {
    const cycleImages = () => {
      // Fade in title and dots
      titleOpacity.value = withTiming(1, { duration: 500 });
      dotsOpacity.value = withTiming(1, { duration: 500 });

      // Move current image to center (from right)
      translateX.value = withTiming(0, { duration: 1500, easing: Easing.out(Easing.exp) });

      // After staying for 4 seconds, start exit sequence
      setTimeout(() => {
        // Fade out title and dots
        titleOpacity.value = withTiming(0, { duration: 500 });
        dotsOpacity.value = withTiming(0, { duration: 500 });

        // Slide out to left
        translateX.value = withTiming(-width, { duration: 1500, easing: Easing.in(Easing.exp) });

        // After exit animation, change to next image and prepare for next cycle
        setTimeout(() => {
          setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
          translateX.value = width; // Reset position off-screen to the right
        }, 200);
      }, 4000);
    };

    // Start the cycle
    cycleImages();

    // Set up interval for subsequent cycles
    const interval = setInterval(cycleImages, 7000); // 1.5s enter + 4s stay + 1.5s exit = 7s total

    return () => clearInterval(interval);
  }, [translateX, titleOpacity, dotsOpacity, width, images.length]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const dotsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: dotsOpacity.value,
  }));

  const handleAuth = async () => {
    if (isLogin) {
      if (!email || !password) {
        Alert.alert('Error', 'Please enter email and password');
        return;
      }
    } else {
      if (!name || !email || !password) {
        Alert.alert('Error', 'Please enter all fields');
        return;
      }
    }

    setLoading(true);
    try {
      let response;
      if (isLogin) {
        response = await api.login({ email, password });
      } else {
        response = await api.register({ name, email, password });
      }

      // Store token in AsyncStorage
      await AsyncStorage.setItem('userToken', response.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.user));

      console.log('=== LOGIN/SIGNUP SUCCESS ===');
      console.log('Response token:', response.token ? 'Present' : 'Missing');
      console.log('Response user:', response.user);
      console.log('User ID:', response.user?.id);
      console.log('User role:', response.user?.role);

      Alert.alert('Success', isLogin ? 'Logged in successfully!' : 'Signed up successfully!');
      navigation.navigate('FestivalWishes');
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.background}>
      <View style={styles.container}>
        <Image
          source={require('../../images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Animated.Text style={[styles.imageTitle, titleAnimatedStyle]}>{imageTitles[currentImageIndex]}</Animated.Text>
        <Animated.Image
          source={images[currentImageIndex]}
          style={[styles.animatedImage, animatedStyle]}
          resizeMode="cover"
        />
        <Animated.View style={[styles.dotsContainer, dotsAnimatedStyle]}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentImageIndex && styles.activeDot
              ]}
            />
          ))}
        </Animated.View>
        <View style={styles.modeContainer}>
          <TouchableOpacity
            style={[styles.modeButton, isLogin && styles.activeMode]}
            onPress={() => setIsLogin(true)}
          >
            <Text style={[styles.modeText, isLogin && styles.activeModeText]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, !isLogin && styles.activeMode]}
            onPress={() => setIsLogin(false)}
          >
            <Text style={[styles.modeText, !isLogin && styles.activeModeText]}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>{isLogin ? 'Welcome back!' : 'Create your account'}</Text>

        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#ccc"
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#ccc"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#ccc"
        />

        <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
          <Text style={styles.buttonText}>
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
          </Text>
        </TouchableOpacity>

        <Text style={styles.switchText}>
          {isLogin ? 'New to Fresh Groupo? ' : 'Already have an account? '}
          <Text style={styles.switchLink} onPress={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Create Account' : 'Login Here'}
          </Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: 'white',
  },
  imageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
  animatedImage: {
    width: 280,
    height: 180,
    borderRadius: 90,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ddd',
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: 'green',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: -30,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: -30,
  },
  modeContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 25,
    padding: 5,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modeButton: {
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  activeMode: {
    backgroundColor: '#4CAF50',
  },
  modeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  activeModeText: {
    color: 'white',
  },
  subtitle: {
    fontSize: 18,
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    width: '85%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    marginVertical: 8,
    color: '#333',
    backgroundColor: 'rgba(255,255,255,0.95)',
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  button: {
    width: '85%',
    padding: 15,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchText: {
    color: '#666',
    fontSize: 16,
    marginTop: 15,
    textAlign: 'center',
  },
  switchLink: {
    color: '#4CAF50',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;