// ...existing code...
/**
 * Clean ApiService for FreshGroupoApp
 * - Set DEFAULT_HOST to your PC LAN IP and port (e.g. https://freshgrupo-server.onrender.com:3001)
 * - Or set process.env.API_BASE_URL to override (useful for ngrok HTTPS URL)
 */

const DEFAULT_HOST = 'http://192.168.1.8:3001'; // Local development
//const DEFAULT_HOST = 'http://localhost:3001'; // Local development
//const DEFAULT_HOST = 'https://freshgrupo-server.onrender.com'; // Production Render server
const API_BASE_URL = (typeof process !== 'undefined' && process.env && process.env.API_BASE_URL)
  ? process.env.API_BASE_URL.replace(/\/+$/, '') // remove trailing slash
  : `${DEFAULT_HOST.replace(/\/+$/, '')}/api`;

const REQUEST_TIMEOUT = 20000; // 20 seconds

class ApiService {
  // Internal fetch helper with timeout, JSON/text handling and unified errors
  async doFetch(path, options = {}) {
    const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);

      const text = await res.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }

      if (!res.ok) {
        // Handle different error response formats
        let message = `HTTP ${res.status}`;
        if (data) {
          if (typeof data === 'string') {
            message = data;
          } else if (data.error) {
            message = data.error;
          } else if (data.message) {
            message = data.message;
          }
        }
        const err = new Error(message);
        err.status = res.status;
        err.response = data;
        throw err;
      }

      return data;
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Request timeout - server may not be reachable');
      }
      throw err;
    }
  }

  // Authentication
  async register(userData) {
    console.log('Register URL:', `${API_BASE_URL}/auth/register`);
    console.log('Register data:', userData);
    return this.doFetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    console.log('Login URL:', `${API_BASE_URL}/auth/login`);
    console.log('Login data:', credentials);
    return this.doFetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
  }

  async updateProfile(userId, profileData) {
    return this.doFetch(`/auth/user/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    });
  }

  async getAddresses(userId) {
    return this.doFetch(`/addresses?userId=${userId}`, { method: 'GET' });
  }

  async createAddress(addressData) {
    return this.doFetch('/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addressData),
    });
  }

  async updateAddress(addressId, addressData) {
    return this.doFetch(`/addresses/${addressId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addressData),
    });
  }

  async deleteAddress(addressId) {
    return this.doFetch(`/addresses/${addressId}`, { method: 'DELETE' });
  }

  // Public endpoints
  async getCategories() {
    return this.doFetch('/public/categories', { method: 'GET' });
  }

  async getPacksByCategory(categoryId) {
    return this.doFetch(`/public/categories/${categoryId}/packs`, { method: 'GET' });
  }

  async getProductsByCategory(categoryId) {
    return this.doFetch(`/public/categories/${categoryId}/products`, { method: 'GET' });
  }

  async getPackDetails(packId) {
    // server exposes /api/packs/:id and /api/public/packs; adjust if needed
    return this.doFetch(`/packs/${packId}`, { method: 'GET' });
  }

  // Cart (protected)
  async getCart(userId, token) {
    return this.doFetch(`/cart/${userId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async addToCart(cartData, token) {
    return this.doFetch('/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(cartData),
    });
  }

  async updateCart(cartId, quantity, token) {
    return this.doFetch(`/cart/${cartId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ quantity }),
    });
  }

  async removeCartItem(cartId, token) {
    return this.doFetch(`/cart/${cartId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getCartCount(token) {
    return this.doFetch('/cart/count', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // Orders
  async createOrder(orderData, token) {
    return this.doFetch('/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(orderData),
    });
  }

  async getOrders(userId, token) {
    // If your server uses a different route adjust accordingly
    return this.doFetch(`/orders/user/${userId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // Payments
  async createPayment(paymentData, token) {
    return this.doFetch('/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(paymentData),
    });
  }

  async getPayments(token) {
    return this.doFetch('/payments', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // Utility: allow runtime override of base URL (useful for testing/ngrok)
  setBaseUrl(url) {
    this._customBaseUrl = url.replace(/\/+$/, '');
  }

  getBaseUrl() {
    return this._customBaseUrl || API_BASE_URL;
  }

  // ============ Wallet & Credits ============
  
  // Get user's wallet balance and transactions
  async getWallet(token) {
    return this.doFetch('/wallet', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // Get available credit packages
  async getCreditPackages() {
    return this.doFetch('/credit-packages', { method: 'GET' });
  }

  // Create Razorpay order for credit purchase
  async createCreditOrder(packageId, amount, token) {
    return this.doFetch('/wallet/purchase/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ packageId, amount }),
    });
  }

  // Verify payment and add credits to wallet
  async verifyCreditPayment(razorpayPaymentId, razorpayOrderId, transactionId, token) {
    return this.doFetch('/wallet/purchase/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ razorpayPaymentId, razorpayOrderId, transactionId }),
    });
  }

  // Spend credits from wallet for order
  async spendCredits(orderId, credits, token) {
    return this.doFetch('/wallet/spend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderId, credits }),
    });
  }

  // Get wallet transaction history
  async getWalletTransactions(token) {
    return this.doFetch('/wallet/transactions', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // Get reward configuration
  async getRewardConfig() {
    return this.doFetch('/reward-config', { method: 'GET' });
  }

  // Calculate reward credits for an order
  async calculateReward(orderAmount) {
    return this.doFetch('/reward-config/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderAmount }),
    });
  }
}

// Export singleton
export default new ApiService();
// ...existing code...