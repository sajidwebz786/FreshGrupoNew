import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  StatusBar,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomHeader from '../components/CustomHeader';
import BottomNavigation from '../components/BottomNavigation';

const OrderHistoryScreen = () => {
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state for pack contents
  const [modalVisible, setModalVisible] = useState(false);
  const [packDetails, setPackDetails] = useState(null);
  const [packLoading, setPackLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  const fetchOrderHistory = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const currentUser = userData ? JSON.parse(userData) : null;

      if (!currentUser || !currentUser.id) {
        Alert.alert('Error', 'User not found. Please login again.');
        return;
      }

      const response = await fetch(`https://freshgrupo-server.onrender.com/api/orders/${currentUser.id}`);
      if (response.ok) {
        const orderData = await response.json();
        setOrders(orderData);
      } else {
        Alert.alert('Error', 'Failed to fetch order history');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to fetch order history');
    } finally {
      setLoading(false);
    }
  };

  // Fetch pack details when user clicks on order ID or pack
  const fetchPackDetails = async (order) => {
    try {
      setPackLoading(true);
      setSelectedOrder(order);
      setModalVisible(true);
      
      // If it's a custom pack, show custom pack items
      if (order.isCustom && order.customPackItems) {
        setPackDetails({
          isCustom: true,
          name: order.customPackName || 'Custom Pack',
          items: order.customPackItems,
        });
        setPackLoading(false);
        return;
      }
      
      // Otherwise fetch order details from server which includes pack contents
      if (order.id) {
        const response = await fetch(`https://freshgrupo-server.onrender.com/api/orders/details/${order.id}`);
        if (response.ok) {
          const orderDetails = await response.json();
          
          // Check if order has pack with products
          if (orderDetails.Pack && orderDetails.Pack.PackProducts) {
            setPackDetails({
              name: orderDetails.Pack.name,
              items: orderDetails.Pack.PackProducts.map(pp => ({
                name: pp.Product?.name || 'Unknown Product',
                category: pp.Product?.category?.name || '',
                quantity: pp.quantity,
                unit: pp.unit || 'pcs'
              })),
            });
          } else if (orderDetails.packContents && orderDetails.packContents.length > 0) {
            // Use packContents from the order
            setPackDetails({
              name: orderDetails.Pack?.name || 'Pack',
              items: orderDetails.packContents.map(pc => ({
                name: pc.productName,
                quantity: pc.quantity,
                unit: pc.unitPrice ? '₹' + pc.unitPrice : 'pcs'
              })),
            });
          } else {
            setPackDetails({ error: 'No pack contents found for this order' });
          }
        } else {
          setPackDetails({ error: 'Failed to load order details' });
        }
      } else {
        setPackDetails({ error: 'No order ID found' });
      }
    } catch (error) {
      console.error('Error fetching pack details:', error);
      setPackDetails({ error: 'Failed to load pack details' });
    } finally {
      setPackLoading(false);
    }
  };

  const getGradientColors = () => {
    return ['#E8F5E8', '#F1F8E9'];
  };

  const getPaymentMethodDisplay = (method) => {
    if (!method) return 'N/A';
    switch (method.toLowerCase()) {
      case 'razorpay':
        return 'Online Payment';
      case 'wallet':
        return 'Wallet';
      case 'cod':
        return 'Cash on Delivery';
      default:
        return method.charAt(0).toUpperCase() + method.slice(1);
    }
  };

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}>
      <LinearGradient
        colors={getGradientColors(item.status || 'Processing')}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.orderItem}
      >
        <View style={styles.orderContent}>
          {/* Order ID - Clickable */}
          <View style={styles.row}>
            <Text style={styles.label}>Order ID:</Text>
            <TouchableOpacity onPress={() => fetchPackDetails(item)}>
              <Text style={[styles.value, styles.clickableText]}>#{item.id}</Text>
            </TouchableOpacity>
          </View>
          
          {/* Pack Name - Clickable */}
          {(item.packId || item.isCustom) && (
            <View style={styles.row}>
              <Text style={styles.label}>Pack:</Text>
              <TouchableOpacity onPress={() => fetchPackDetails(item)}>
                <Text style={[styles.value, styles.clickableText]}>
                  {item.isCustom ? (item.customPackName || 'Custom Pack') : `Pack #${item.packId}`}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total:</Text>
            <Text style={styles.value}>₹{item.totalAmount}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment:</Text>
            <Text style={styles.value}>{getPaymentMethodDisplay(item.paymentMethod)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Order Status:</Text>
            <Text style={styles.value}>{item.status || 'Processing'}</Text>
          </View>
          {item.payment && (
            <View style={styles.row}>
              <Text style={styles.label}>Payment Status:</Text>
              <Text style={styles.value}>{item.payment.status}</Text>
            </View>
          )}
          
          {/* Tap for details hint */}
          <Text style={styles.tapHint}>Tap to view order details</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  // Render pack contents modal
  const renderPackModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedOrder?.isCustom ? 'Custom Pack Contents' : 'Pack Contents'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close-circle" size={28} color="#4CAF50" />
            </TouchableOpacity>
          </View>
          
          {packLoading ? (
            <ActivityIndicator size="large" color="#4CAF50" style={styles.modalLoader} />
          ) : packDetails?.error ? (
            <Text style={styles.errorText}>{packDetails.error}</Text>
          ) : packDetails ? (
            <ScrollView style={styles.modalScroll}>
              {/* Pack Name */}
              <View style={styles.packNameContainer}>
                <Text style={styles.packName}>
                  {packDetails.isCustom ? packDetails.name : packDetails.name}
                </Text>
              </View>
              
              {/* Pack Items */}
              <View style={styles.itemsContainer}>
                {packDetails.items && packDetails.items.length > 0 ? (
                  packDetails.items.map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.name || item.productName}</Text>
                        {item.category && (
                          <Text style={styles.itemCategory}>{item.category}</Text>
                        )}
                      </View>
                      <Text style={styles.itemQuantity}>
                        {item.quantity || item.qty || 1} {item.unit || 'pcs'}
                      </Text>
                    </View>
                  ))
                ) : packDetails.products && packDetails.products.length > 0 ? (
                  packDetails.products.map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        {item.category && (
                          <Text style={styles.itemCategory}>{item.category}</Text>
                        )}
                      </View>
                      <Text style={styles.itemQuantity}>
                        {item.quantity || 1} {item.unit || 'pcs'}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noItemsText}>No items found</Text>
                )}
              </View>
              
              {/* Order Info in Modal */}
              {selectedOrder && (
                <View style={styles.orderInfoContainer}>
                  <Text style={styles.orderInfoTitle}>Order Details</Text>
                  <Text style={styles.orderInfoText}>Order ID: #{selectedOrder.id}</Text>
                  <Text style={styles.orderInfoText}>Quantity: {selectedOrder.quantity}</Text>
                  <Text style={styles.orderInfoText}>Total: ₹{selectedOrder.totalAmount}</Text>
                </View>
              )}
            </ScrollView>
          ) : (
            <Text style={styles.noItemsText}>No pack details available</Text>
          )}
          
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <LinearGradient colors={['#f8f9fa', '#e0e0e0']} style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" translucent={true} />
      <View style={styles.headerContainer}>
        <CustomHeader />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Order History</Text>

        {loading ? (
          <Text style={styles.loadingText}>Loading orders...</Text>
        ) : orders.length === 0 ? (
          <Text style={styles.emptyText}>No orders found</Text>
        ) : (
          <FlatList
            data={orders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <BottomNavigation />
      {renderPackModal()}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    paddingTop: 50,
    backgroundColor: '#4CAF50',
  },
  content: { flex: 1, padding: 20, paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#4CAF50', textAlign: 'center', marginBottom: 20 },
  loadingText: { textAlign: 'center', fontSize: 16, color: '#666' },
  emptyText: { textAlign: 'center', fontSize: 16, color: '#666' },
  orderItem: {
    borderRadius: 10,
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderContent: {
    padding: 15,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 16, fontWeight: '600', color: '#000', flex: 1 },
  value: { fontSize: 16, color: '#000', flex: 2, textAlign: 'right' },
  clickableText: { color: '#4CAF50', textDecorationLine: 'underline', fontWeight: 'bold' },
  tapHint: { fontSize: 12, color: '#666', textAlign: 'center', marginTop: 8 },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  modalLoader: {
    marginVertical: 30,
  },
  modalScroll: {
    maxHeight: 400,
  },
  packNameContainer: {
    backgroundColor: '#E8F5E8',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  packName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  itemsContainer: {
    marginBottom: 15,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  itemQuantity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  noItemsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    paddingVertical: 20,
  },
  orderInfoContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  orderInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  orderInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  closeButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OrderHistoryScreen;
