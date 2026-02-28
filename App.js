import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SplashScreen from './src/screens/SplashScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import PackTypesScreen from './src/screens/PackTypesScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import FestivalWishesScreen from './src/screens/FestivalWishesScreen';
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
import {enableScreens} from 'react-native-screens';

enableScreens(true); // disable if causing issues

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Stack navigator for main app flow
function MainStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Categories"
      screenOptions={{
        headerShown: false, // We'll use CustomHeader in screens
      }}
    >
      <Stack.Screen name="Categories" component={CategoriesScreen} />
      <Stack.Screen name="PackTypes" component={PackTypesScreen} />
      <Stack.Screen name="PackContents" component={PackContentsScreen} />
      <Stack.Screen name="CustomPack" component={CustomPackScreen} />
    </Stack.Navigator>
  );
}

// Drawer navigator for main app
function DrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="MainStack"
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: false, // Hide default header since we use CustomHeader
        drawerStyle: {
          backgroundColor: '#fff',
          width: 280,
        },
        drawerType: 'front', // This ensures drawer slides from front
        swipeEnabled: false, // Disable swipe gesture to avoid conflicts
        gestureEnabled: false, // Disable default drawer gesture
      }}
    >
      <Drawer.Screen
        name="MainStack"
        component={MainStackNavigator}
        options={{
          title: 'Fresh Groupo',
          headerLeft: () => null, // We'll add custom header in screen component
        }}
      />
      <Drawer.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: 'Shopping Cart',
        }}
      />
      <Drawer.Screen
        name="Address"
        component={AddressScreen}
        options={{
          title: 'Delivery Address',
        }}
      />
      <Drawer.Screen
        name="Payment"
        component={PaymentScreen}
        options={{
          title: 'Payment',
        }}
      />
      <Drawer.Screen
        name="OrderHistory"
        component={OrderHistoryScreen}
        options={{
          title: 'Order History',
        }}
      />
      <Drawer.Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
        options={{
          title: 'Order Details',
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'My Profile',
        }}
      />
      <Drawer.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          title: 'My Wallet',
        }}
      />
      <Drawer.Screen
        name="BuyCredits"
        component={BuyCreditsScreen}
        options={{
          title: 'Buy Credits',
        }}
      />
    </Drawer.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
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
            name="FestivalWishes"
            component={FestivalWishesScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Drawer"
            component={DrawerNavigator}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
