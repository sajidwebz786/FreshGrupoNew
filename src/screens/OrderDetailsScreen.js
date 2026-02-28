import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';
import CustomHeader from '../components/CustomHeader';
import BottomNavigation from '../components/BottomNavigation';

const OrderDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { orderId } = route.params || {};

  const [order, setOrder] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);

      // Fetch order details
      const orderRes = await fetch(`https://freshgrupo-server.onrender.com/api/orders/details/${orderId}`);
      if (!orderRes.ok) {
        const errorText = await orderRes.text();
        throw new Error(`Failed to fetch order: ${orderRes.status} - ${errorText}`);
      }
      const orderData = await orderRes.json();
      setOrder(orderData);

      // Fetch user details
      const userRes = await fetch(`https://freshgrupo-server.onrender.com/api/auth/user/${orderData.userId}`);
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
        <View style={styles.headerContainer}>
          <CustomHeader />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
        <BottomNavigation />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
        <View style={styles.headerContainer}>
          <CustomHeader />
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Order not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
        <BottomNavigation />
      </View>
    );
  }

  return (
    <LinearGradient colors={['#f8f9fa', '#e0e0e0']} style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
      <View style={styles.headerContainer}>
        <CustomHeader />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Order Details</Text>

        <LinearGradient colors={['#E8F5E8', '#F1F8E9']} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={24} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Order Information</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Order ID:</Text>
            <Text style={styles.value}>#{order.id}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{new Date(order.createdAt).toLocaleDateString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>{order.status || 'Processing'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Amount:</Text>
            <Text style={styles.value}>₹{order.totalAmount}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Method:</Text>
            <Text style={styles.value}>{order.paymentMethod}</Text>
          </View>
          {order.payment && (
            <View style={styles.row}>
              <Text style={styles.label}>Payment Status:</Text>
              <Text style={styles.value}>{order.payment.status}</Text>
            </View>
          )}
        </LinearGradient>

        <LinearGradient colors={['#FFF3E0', '#FFEBCD']} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cube" size={24} color="#FF9800" />
            <Text style={styles.sectionTitle}>Pack Details</Text>
          </View>
          {order.Pack && (
            <View style={styles.packInfo}>
              <Text style={styles.detailText}>Pack: {order.Pack.name}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('PackContents', {
                category: order.Pack.Category?.name,
                packType: order.Pack.PackType?.name,
                packId: order.packId
              })}>
                <Text style={styles.linkText}>Category: {order.Pack.Category?.name} - Pack Type: {order.Pack.PackType?.name}</Text>
              </TouchableOpacity>
            </View>
          )}
          {order.packContents && order.packContents.length > 0 ? (
            order.packContents.map((content, index) => (
              <View key={index} style={styles.packItem}>
                <View style={styles.row}>
                  <Text style={styles.label}>Product:</Text>
                  <Text style={styles.value}>{content.productName}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Quantity:</Text>
                  <Text style={styles.value}>{content.quantity}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Price:</Text>
                  <Text style={styles.value}>₹{content.unitPrice}</Text>
                </View>
              </View>
            ))
          ) : order.isCustom && order.customPackItems ? (
            <View>
              <Text style={styles.detailText}>Custom Pack: {order.customPackName}</Text>
              {(() => {
                try {
                  const customItems = JSON.parse(order.customPackItems);
                  return customItems.map((item, index) => (
                    <View key={index} style={styles.packItem}>
                      <View style={styles.row}>
                        <Text style={styles.label}>Product:</Text>
                        <Text style={styles.value}>{item.productName}</Text>
                      </View>
                      <View style={styles.row}>
                        <Text style={styles.label}>Quantity:</Text>
                        <Text style={styles.value}>{item.quantity}</Text>
                      </View>
                      <View style={styles.row}>
                        <Text style={styles.label}>Price:</Text>
                        <Text style={styles.value}>₹{item.unitPrice}</Text>
                      </View>
                    </View>
                  ));
                } catch (error) {
                  return <Text style={styles.detailText}>Error parsing custom pack items</Text>;
                }
              })()}
            </View>
          ) : (
            <Text style={styles.detailText}>No pack details available</Text>
          )}
        </LinearGradient>

        <LinearGradient colors={['#E3F2FD', '#BBDEFB']} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={24} color="#2196F3" />
            <Text style={styles.sectionTitle}>Delivery Information</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>{order.deliveryAddress}</Text>
          </View>
        </LinearGradient>

        {user && (
          <LinearGradient colors={['#E3F2FD', '#BBDEFB']} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person" size={24} color="#2196F3" />
              <Text style={styles.sectionTitle}>Customer Information</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>{user.name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{user.email}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{user.phone}</Text>
            </View>
          </LinearGradient>
        )}
      </ScrollView>

      <BottomNavigation />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { paddingTop: 50, backgroundColor: '#4CAF50' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#666' },
  errorText: { fontSize: 18, color: '#666' },
  backButton: { marginTop: 20, padding: 10, backgroundColor: '#4CAF50', borderRadius: 5 },
  backButtonText: { color: '#fff', fontSize: 16 },
  scrollContainer: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#4CAF50', textAlign: 'center', marginBottom: 20 },
  section: { padding: 15, borderRadius: 10, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginLeft: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', flex: 1 },
  value: { fontSize: 16, color: '#333', flex: 2, textAlign: 'right' },
  packItem: { marginBottom: 10, padding: 10, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 5 },
  packText: { fontSize: 14, color: '#333' },
  packInfo: { marginBottom: 10 },
  linkText: { fontSize: 16, color: '#4CAF50', textDecorationLine: 'underline' },
});

export default OrderDetailsScreen;