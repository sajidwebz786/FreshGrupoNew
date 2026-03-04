import React from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Modal, View, TouchableOpacity, StyleSheet, Animated, Dimensions, BackHandler } from 'react-native';
import SplashScreen from './src/screens/SplashScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import PackTypesScreen from './src/screens/PackTypesScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

import PackContentsScreen from './src/screens/PackContentsScreen';
import CustomPackScreen from './src/screens/CustomPackScreen';
import CartScreen from './src/screens/CartScreen';
import AddressScreen from './src/screens/AddressScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import OrderHistoryScreen from './src/screens/OrderHistoryScreen';
import OrderDetailsScreen from './src/screens/OrderDetailsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import WalletScreen from './src/screens/WalletScreen';
import BuyCreditsScreen from './src/screens/BuyCreditsScreen';
import CustomDrawer from './src/components/CustomDrawer';
import { DrawerProvider, useDrawer } from './src/context/DrawerContext';
import {enableScreens} from 'react-native-screens';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;

enableScreens(true);

const Stack = createNativeStackNavigator();

// Custom Drawer Modal Component
function DrawerModal() {
  const { isDrawerOpen, closeDrawer } = useDrawer();
  const navigation = useNavigation();
  // Start from left (negative width means off-screen to the left)
  const slideAnim = React.useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  React.useEffect(() => {
    if (isDrawerOpen) {
      // Slide in from left to position 0
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      // Slide out to the left
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isDrawerOpen, slideAnim]);

  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isDrawerOpen) {
        closeDrawer();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [isDrawerOpen, closeDrawer]);

  return (
    <Modal
      visible={isDrawerOpen}
      transparent
      animationType="none"
      onRequestClose={closeDrawer}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.drawerContainer,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <CustomDrawer navigation={navigation} onClose={closeDrawer} />
        </Animated.View>
        <TouchableOpacity 
          style={styles.overlayTouchable} 
          activeOpacity={1} 
          onPress={closeDrawer}
        />
      </View>
    </Modal>
  );
}

// Main Stack Navigator that contains the drawer
function MainStackNavigator() {
  return (
    <>
      <Stack.Navigator
        initialRouteName="Categories"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Categories" component={CategoriesScreen} />
        <Stack.Screen name="PackTypes" component={PackTypesScreen} />
        <Stack.Screen name="PackContents" component={PackContentsScreen} />
        <Stack.Screen name="CustomPack" component={CustomPackScreen} />
        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen name="Address" component={AddressScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
        <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Wallet" component={WalletScreen} />
        <Stack.Screen name="BuyCredits" component={BuyCreditsScreen} />
      </Stack.Navigator>
      
      <DrawerModal />
    </>
  );
}

function AppContent() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Drawer"
          component={MainStackNavigator}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <DrawerProvider>
        <AppContent />
      </DrawerProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
  },
  drawerContainer: {
    width: DRAWER_WIDTH,
    backgroundColor: '#fff',
    height: '100%',
    // Ensure it starts from the left edge
    left: 0,
    position: 'absolute',
  },
  overlayTouchable: {
    flex: 1,
    // Takes remaining space after drawer
    marginLeft: DRAWER_WIDTH,
  },
});
