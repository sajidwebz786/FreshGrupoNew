import React, { useState, useEffect } from 'react';
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
  StatusBar,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RazorpayCheckout from 'react-native-razorpay';
import api from '../services/api';
import CustomHeader from '../components/CustomHeader';

const BuyCreditsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { creditPackage, user } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [isAuthed, setIsAuthed] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // Check auth status on focus
  useFocusEffect(
    React.useCallback(() => {
      const checkAuth = async () => {
        try {
          const token = await AsyncStorage.getItem('userToken');
          const userData = await AsyncStorage.getItem('userData');
          
          if (!token || !userData) {
            console.warn('BuyCreditsScreen: No auth token found');
            setIsAuthed(false);
            setErrorMessage('Your session has expired. Please log in again.');
            return;
          }
          setIsAuthed(true);
          setErrorMessage(null);
        } catch (error) {
          console.error('Auth check error:', error);
        }
      };
      
      checkAuth();
    }, [navigation])
  );

  const handlePurchase = async () => {
    setErrorMessage(null);

    if (!isAuthed) {
      setErrorMessage('Your session has expired. Please log in again.');
      return;
    }

    setLoading(true);
    let sessionExtensionInterval = null;

    try {
      // Extend session immediately
      await AsyncStorage.setItem('lastActivityTime', Date.now().toString());

      // Start periodic session extension during payment (every 30 seconds)
      sessionExtensionInterval = setInterval(async () => {
        try {
          await AsyncStorage.setItem('lastActivityTime', Date.now().toString());
        } catch (e) {
          console.warn('Session extension error:', e);
        }
      }, 30000);

      const userData = await AsyncStorage.getItem('userData');
      const token = await AsyncStorage.getItem('userToken');
      const currentUser = userData ? JSON.parse(userData) : null;

      if (!token || !userData) {
        setErrorMessage('Your session has expired. Please log in again.');
        setIsAuthed(false);
        return;
      }

      let packageId = creditPackage?.id;
      let amount = creditPackage?.price;

      if (!creditPackage && customAmount) {
        amount = parseFloat(customAmount);
        if (isNaN(amount) || amount < 10) {
          setErrorMessage('Minimum amount should be ₹10');
          return;
        }
      }

      if (!amount || amount <= 0) {
        setErrorMessage('Please select a package or enter a valid amount');
        return;
      }

      // Create order
      let orderResponse;
      try {
        orderResponse = await api.createCreditOrder(packageId, amount, token);
      } catch (apiError) {
        if (apiError.status === 401) {
          setErrorMessage('Session expired. Please log in again.');
          setIsAuthed(false);
          return;
        }
        setErrorMessage(apiError.message || 'Failed to create payment order');
        return;
      }

      if (!orderResponse?.orderId) {
        setErrorMessage('Failed to create payment order');
        return;
      }

      // Open Razorpay
      const options = {
        description: `Buy ${creditPackage?.credits || customAmount} credits`,
        currency: 'INR',
        key: orderResponse.razorpayKeyId,
        amount: Math.round(amount * 100),
        name: 'Fresh Grupo',
        prefill: {
          email: currentUser?.email || '',
          contact: currentUser?.phone || '',
          name: currentUser?.name || '',
        },
        theme: { color: '#4CAF50' },
      };

      const paymentData = await RazorpayCheckout.open(options);

      // Verify payment
      let verifyResponse;
      try {
        verifyResponse = await api.verifyCreditPayment(
          paymentData.razorpay_payment_id,
          orderResponse.orderId,
          orderResponse.transactionId,
          token
        );
      } catch (verifyError) {
        if (verifyError.status === 401) {
          setErrorMessage('Session expired. Payment may have succeeded. Please log in.');
          setIsAuthed(false);
          return;
        }
        setErrorMessage(verifyError.message || 'Payment verification failed');
        return;
      }

      if (!verifyResponse?.creditsAdded) {
        setErrorMessage('Failed to verify payment');
        return;
      }

      // Success
      setLoading(false);
      Alert.alert(
        'Success!',
        `🎉 ${verifyResponse.creditsAdded} credits added!`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Payment error:', error);
      if (error.code === 'USER_CANCELLED') {
        setErrorMessage(null);
        Alert.alert('Cancelled', 'Payment cancelled. Try again when ready.');
      } else {
        setErrorMessage(error.message || 'Payment error. Please try again.');
      }
    } finally {
      if (sessionExtensionInterval) {
        clearInterval(sessionExtensionInterval);
      }
      setLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.headerContainer}>
        <CustomHeader title="Buy Credits" />
      </View>

      {!isAuthed && (
        <View style={styles.authErrorContainer}>
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>🔒</Text>
            <Text style={styles.errorTitle}>Session Expired</Text>
            <Text style={styles.errorMessage}>
              Your session has expired. Please log in again to continue.
            </Text>
            <TouchableOpacity
              style={styles.reloginButton}
              onPress={() => navigation.replace('Login')}
            >
              <Text style={styles.reloginButtonText}>Log In Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {errorMessage && isAuthed && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>⚠️ {errorMessage}</Text>
          <TouchableOpacity onPress={() => setErrorMessage(null)}>
            <Text style={styles.errorBannerClose}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {isAuthed && (
        <>
          <ImageBackground
            source={require('../../assets/images/innerimage.png')}
            style={styles.background}
            resizeMode="cover"
            opacity={0.1}
          >
            <ScrollView
              style={styles.scrollContainer}
              scrollEnabled={!loading}
            >
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

          {/* Loading Overlay */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Processing Payment...</Text>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    paddingTop: 50,
    backgroundColor: '#4CAF50',
  },
  authErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  reloginButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  reloginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorBanner: {
    backgroundColor: '#FFF3CD',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE69C',
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorBannerText: {
    color: '#856404',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  errorBannerClose: {
    color: '#856404',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  background: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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
