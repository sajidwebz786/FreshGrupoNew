import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ImageBackground,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import CustomHeader from '../components/CustomHeader';

const BuyCreditsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { creditPackage, user } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  const handlePurchase = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      let packageId = creditPackage?.id;
      let amount = creditPackage?.price;
      
      // If custom amount
      if (!creditPackage && customAmount) {
        amount = parseFloat(customAmount);
        if (isNaN(amount) || amount < 10) {
          Alert.alert('Error', 'Minimum amount should be ₹10');
          setLoading(false);
          return;
        }
      }
      
      if (!amount || amount <= 0) {
        Alert.alert('Error', 'Please select a package or enter a valid amount');
        setLoading(false);
        return;
      }

      // Create Razorpay order
      const orderResponse = await api.createCreditOrder(packageId, amount, token);
      
      Alert.alert(
        'Payment Initiated',
        `Please complete the payment of ₹${amount} using Razorpay. In production, this would open the Razorpay payment gateway.`,
        [
          {
            text: 'Simulate Success',
            onPress: async () => {
              try {
                // Simulate successful payment
                const verifyResponse = await api.verifyCreditPayment(
                  'simulated_payment_id',
                  orderResponse.orderId,
                  orderResponse.transactionId,
                  token
                );
                
                Alert.alert(
                  'Success!',
                  `🎉 ${verifyResponse.creditsAdded} credits have been added to your wallet!`,
                  [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
              } catch (error) {
                console.error('Error verifying payment:', error);
                Alert.alert('Error', 'Failed to verify payment');
              }
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setLoading(false),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert('Error', 'Failed to create payment order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.headerContainer}>
        <CustomHeader title="Buy Credits" />
      </View>
      
      <ImageBackground 
        source={require('../../images/innerimage.png')} 
        style={styles.background}
        resizeMode="cover"
        opacity={0.1}
      >
        <ScrollView style={styles.scrollContainer}>
          {/* Package Details */}
          {creditPackage && (
            <View style={styles.packageCard}>
              <View style={styles.packageHeader}>
                <Text style={styles.packageName}>{creditPackage.name}</Text>
                {creditPackage.isPopular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>Popular</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.packageDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Credits</Text>
                  <Text style={styles.detailValue}>{creditPackage.credits}</Text>
                </View>
                
                {creditPackage.bonusCredits > 0 && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Bonus Credits</Text>
                    <Text style={[styles.detailValue, { color: '#FF9800' }]}>
                      +{creditPackage.bonusCredits}
                    </Text>
                  </View>
                )}
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Credits</Text>
                  <Text style={[styles.detailValue, { color: '#4CAF50' }]}>
                    {creditPackage.credits + creditPackage.bonusCredits}
                  </Text>
                </View>
                
                <View style={[styles.detailRow, styles.highlightRow]}>
                  <Text style={styles.detailLabel}>Price</Text>
                  <Text style={styles.priceValue}>₹{parseFloat(creditPackage.price).toFixed(2)}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Cost per Credit</Text>
                  <Text style={styles.detailValue}>
                    ₹{((parseFloat(creditPackage.price) / (creditPackage.credits + creditPackage.bonusCredits)).toFixed(2))}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Custom Amount Input */}
          {!creditPackage && (
            <View style={styles.customAmountCard}>
              <Text style={styles.customAmountTitle}>Enter Custom Amount</Text>
              <Text style={styles.customAmountHint}>Minimum ₹10</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter amount"
                  keyboardType="numeric"
                  value={customAmount}
                  onChangeText={setCustomAmount}
                  placeholderTextColor="#999"
                />
              </View>
              
              {customAmount && parseFloat(customAmount) >= 10 && (
                <View style={styles.customPreview}>
                  <Text style={styles.customPreviewText}>
                    You will get: {parseFloat(customAmount)} credits
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Payment Info */}
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentTitle}>Payment Methods</Text>
            <View style={styles.paymentMethods}>
              <View style={styles.paymentMethod}>
                <Text style={styles.paymentMethodIcon}>💳</Text>
                <Text style={styles.paymentMethodText}>Razorpay</Text>
              </View>
              <View style={styles.paymentMethod}>
                <Text style={styles.paymentMethodIcon}>🏦</Text>
                <Text style={styles.paymentMethodText}>UPI</Text>
              </View>
              <View style={styles.paymentMethod}>
                <Text style={styles.paymentMethodIcon}>📱</Text>
                <Text style={styles.paymentMethodText}>Wallets</Text>
              </View>
            </View>
          </View>

          {/* Terms */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By proceeding, you agree to our Terms of Service and Privacy Policy.
              Credits purchased are non-refundable.
            </Text>
          </View>

          {/* Purchase Button */}
          <TouchableOpacity
            style={[styles.purchaseButton, loading && styles.purchaseButtonDisabled]}
            onPress={handlePurchase}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.purchaseButtonText}>
                {creditPackage 
                  ? `Pay ₹${parseFloat(creditPackage.price).toFixed(2)} & Get Credits`
                  : customAmount 
                    ? `Pay ₹${customAmount} & Get Credits`
                    : 'Select a Package'
                }
              </Text>
            )}
          </TouchableOpacity>

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Go Back</Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </ImageBackground>
    </View>
  );
};

import { StatusBar, TextInput } from 'react-native';

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    paddingTop: 50,
    backgroundColor: '#4CAF50',
  },
  background: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  packageCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  packageName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  popularBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  packageDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  highlightRow: {
    backgroundColor: '#f1f8e9',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    marginTop: 10,
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 15,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  customAmountCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  customAmountTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  customAmountHint: {
    fontSize: 13,
    color: '#999',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    paddingVertical: 12,
    paddingLeft: 8,
  },
  customPreview: {
    marginTop: 16,
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
  },
  customPreviewText: {
    color: '#2e7d32',
    fontWeight: '600',
    textAlign: 'center',
  },
  paymentInfo: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  paymentMethods: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  paymentMethod: {
    alignItems: 'center',
  },
  paymentMethodIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  paymentMethodText: {
    fontSize: 12,
    color: '#666',
  },
  termsContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  termsText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
  purchaseButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  purchaseButtonDisabled: {
    opacity: 0.7,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default BuyCreditsScreen;
