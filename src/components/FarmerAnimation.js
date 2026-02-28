import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const FarmerAnimation = () => {
  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/farmer.png')} 
        style={styles.farmerImage}
        resizeMode="cover"
      />
      {/* Overlay gradient effect */}
      <View style={styles.overlay} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: screenWidth,
    height: 180,
    position: 'relative',
  },
  farmerImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
});

export default FarmerAnimation;
