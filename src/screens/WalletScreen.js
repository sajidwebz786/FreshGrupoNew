import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ImageBackground,
  Image,
  RefreshControl,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import CustomHeader from '../components/CustomHeader';
import BottomNavigation from '../components/BottomNavigation';

const WalletScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [creditPackages, setCreditPackages] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get user from AsyncStorage
      const userData = await AsyncStorage.getItem('user');
      if (!userData) {
        Alert.alert('Error', 'Please login to view your wallet');
        return;
      }
      
      const userObj = JSON.parse(userData);
      setUser(userObj);
      
      const token = await AsyncStorage.getItem('token');
      
      // Load wallet and credit packages in parallel
      const [walletRes, packagesRes] = await Promise.all([
        api.getWallet(token),
        api.getCreditPackages()
      ]);
      
      setWallet(walletRes.wallet);
      setTransactions(walletRes.transactions || []);
      setCreditPackages(packagesRes || []);
    } catch (error) {
      console.error('Error loading wallet:', error);
      Alert.alert('Error', 'Failed to load wallet data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleBuyCredits = (pkg) => {
    navigation.navigate('BuyCredits', { 
      creditPackage: pkg,
      user 
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'credit_purchase':
        return '💳';
      case 'credit_spent':
        return '🛒';
      case 'credit_earned':
      case 'reward':
        return '🎁';
      case 'credit_refund':
        return '↩️';
      default:
        return '💰';
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'credit_purchase':
      case 'credit_earned':
      case 'reward':
        return '#28a745';
      case 'credit_spent':
      case 'credit_refund':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  if (loading) {
    return (
      <ImageBackground
        source={require('../../images/clean_app_bg.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#28a745" />
          <Text style={styles.loadingText}>Loading wallet...</Text>
        </View>
      </ImageBackground>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" translucent={true} />
      <View style={styles.headerContainer}>
        <CustomHeader />
      </View>
      
      <ImageBackground 
        source={require('../../images/innerimage.png')} 
        style={styles.background}
        resizeMode="cover"
        opacity={0.1}
      >
        <ScrollView
          style={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4CAF50']}
            />
          }
        >
          {/* Wallet Balance Card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Your Wallet</Text>
              <Text style={styles.balanceIcon}>💰</Text>
            </View>
            <Text style={styles.balanceAmount}>
              {wallet?.balance ? `₹${parseFloat(wallet.balance).toFixed(2)}` : '₹0.00'}
            </Text>
            <Text style={styles.balanceSubtext}>Available Credits</Text>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {wallet?.totalCreditsEarned ? `₹${parseFloat(wallet.totalCreditsEarned).toFixed(0)}` : '₹0'}
                </Text>
                <Text style={styles.statLabel}>Total Earned</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {wallet?.totalCreditsSpent ? `₹${parseFloat(wallet.totalCreditsSpent).toFixed(0)}` : '₹0'}
                </Text>
                <Text style={styles.statLabel}>Total Spent</Text>
              </View>
            </View>
          </View>

          {/* Buy Credits Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Buy Credits</Text>
            <Text style={styles.sectionSubtitle}>Get credits and earn bonus credits on each purchase!</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.packagesContainer}>
                {creditPackages.map((pkg) => (
                  <TouchableOpacity
                    key={pkg.id}
                    style={[
                      styles.packageCard,
                      pkg.isPopular && styles.packageCardPopular,
                    ]}
                    onPress={() => handleBuyCredits(pkg)}
                  >
                    {pkg.isPopular && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularBadgeText}>Best Value</Text>
                      </View>
                    )}
                    <Text style={styles.packageCredits}>{pkg.credits}</Text>
                    <Text style={styles.packageCreditsLabel}>Credits</Text>
                    {pkg.bonusCredits > 0 && (
                      <View style={styles.bonusBadge}>
                        <Text style={styles.bonusBadgeText}>+{pkg.bonusCredits} Bonus</Text>
                      </View>
                    )}
                    <Text style={styles.packagePrice}>₹{parseFloat(pkg.price).toFixed(0)}</Text>
                    <Text style={styles.packagePriceLabel}>₹{((parseFloat(pkg.price) / (pkg.credits + pkg.bonusCredits)).toFixed(2))}/credit</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Transaction History */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            
            {transactions.length === 0 ? (
              <View style={styles.emptyTransactions}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyText}>No transactions yet</Text>
                <Text style={styles.emptySubtext}>Your credit transactions will appear here</Text>
              </View>
            ) : (
              <View style={styles.transactionsList}>
                {transactions.map((transaction) => (
                  <View key={transaction.id} style={styles.transactionItem}>
                    <View style={styles.transactionIcon}>
                      <Text style={styles.transactionIconText}>
                        {getTransactionIcon(transaction.type)}
                      </Text>
                    </View>
                    <View style={styles.transactionDetails}>
                      <Text style={styles.transactionDescription}>
                        {transaction.description || transaction.type.replace(/_/g, ' ').toUpperCase()}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {formatDate(transaction.createdAt)} at {formatTime(transaction.createdAt)}
                      </Text>
                    </View>
                    <View style={styles.transactionAmount}>
                      <Text
                        style={[
                          styles.amountText,
                          { color: getTransactionColor(transaction.type) },
                        ]}
                      >
                        {transaction.type === 'credit_spent' || transaction.type === 'credit_refund' ? '-' : '+'}
                        ₹{Math.abs(parseFloat(transaction.amount)).toFixed(2)}
                      </Text>
                      <Text style={styles.balanceAfterText}>
                        Balance: ₹{parseFloat(transaction.balanceAfter).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* How it Works */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How it Works</Text>
            <View style={styles.howItWorksContainer}>
              <View style={styles.howItWorksItem}>
                <Text style={styles.howItWorksIcon}>1️⃣</Text>
                <Text style={styles.howItWorksTitle}>Buy Credits</Text>
                <Text style={styles.howItWorksText}>Purchase credits through online payment</Text>
              </View>
              <View style={styles.howItWorksItem}>
                <Text style={styles.howItWorksIcon}>2️⃣</Text>
                <Text style={styles.howItWorksTitle}>Use for Orders</Text>
                <Text style={styles.howItWorksText}>Use credits to pay for your fruit packs</Text>
              </View>
              <View style={styles.howItWorksItem}>
                <Text style={styles.howItWorksIcon}>3️⃣</Text>
                <Text style={styles.howItWorksTitle}>Earn Rewards</Text>
                <Text style={styles.howItWorksText}>Earn 5% back on every order as credits</Text>
              </View>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </ImageBackground>

      <BottomNavigation />
    </View>
  );
};

import { StatusBar } from 'react-native';

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  scrollContainer: {
    flex: 1,
  },
  balanceCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  balanceIcon: {
    fontSize: 28,
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  balanceSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  packagesContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  packageCard: {
    width: 130,
    padding: 16,
    marginRight: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  packageCardPopular: {
    borderColor: '#4CAF50',
    backgroundColor: '#f1f8e9',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  packageCredits: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  packageCreditsLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  bonusBadge: {
    marginTop: 8,
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  bonusBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  packagePrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  packagePriceLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  transactionsList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionIconText: {
    fontSize: 22,
  },
  transactionDetails: {
    flex: 1,
    marginLeft: 12,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  transactionDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  balanceAfterText: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  emptyTransactions: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  howItWorksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  howItWorksItem: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  howItWorksIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  howItWorksTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  howItWorksText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  bottomSpacer: {
    height: 100,
  },
});

export default WalletScreen;
