import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

const AuthContext = createContext({
  isLoading: true,
  isLoggedIn: false,
  user: null,
  login: async (user, token) => {},
  logout: async () => {},
  checkAuth: async () => {},
  updateActivity: async () => {},
  extendSession: async () => {},
});

// 7 days in milliseconds
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [lastActivity, setLastActivity] = useState(null);

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const [userData, token, loginTime, lastActive] = await Promise.all([
        AsyncStorage.getItem('userData'),
        AsyncStorage.getItem('userToken'),
        AsyncStorage.getItem('loginTime'),
        AsyncStorage.getItem('lastActivityTime'),
      ]);

      if (!userData || !token) {
        // No user data or token - not logged in
        await clearAuthData();
        setIsLoading(false);
        return false;
      }

      const parsedUser = JSON.parse(userData);
      const loginTimestamp = loginTime ? parseInt(loginTime, 10) : 0;
      const lastActivityTimestamp = lastActive ? parseInt(lastActive, 10) : Date.now();
      
      // Check if 7 days have passed since login
      const now = Date.now();
      if (now - loginTimestamp > SESSION_DURATION) {
        // Session expired (7 days since login)
        console.log('Session expired: 7 days since login');
        await clearAuthData();
        setIsLoading(false);
        return false;
      }

      // Check if 7 days of inactivity (no activity for 7 days)
      if (now - lastActivityTimestamp > SESSION_DURATION) {
        // Inactivity timeout (7 days of no activity)
        console.log('Session expired: 7 days of inactivity');
        await clearAuthData();
        setIsLoading(false);
        return false;
      }

      // Valid session - update user and activity
      setUser(parsedUser);
      setIsLoggedIn(true);
      setLastActivity(lastActivityTimestamp);
      
      // Update last activity time
      await AsyncStorage.setItem('lastActivityTime', now.toString());
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error checking auth:', error);
      await clearAuthData();
      setIsLoading(false);
      return false;
    }
  }, []);

  const clearAuthData = async () => {
    try {
      await AsyncStorage.multiRemove(['userData', 'userToken', 'loginTime', 'lastActivityTime']);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
    setUser(null);
    setIsLoggedIn(false);
    setLastActivity(null);
  };

  const login = async (userData, token) => {
    try {
      const now = Date.now();
      
      await AsyncStorage.multiSet([
        ['userData', JSON.stringify(userData)],
        ['userToken', token],
        ['loginTime', now.toString()],
        ['lastActivityTime', now.toString()],
      ]);

      setUser(userData);
      setIsLoggedIn(true);
      setLastActivity(now);
    } catch (error) {
      console.error('Error in login:', error);
      throw error;
    }
  };

  const logout = async () => {
    await clearAuthData();
  };

  const updateActivity = useCallback(async () => {
    if (isLoggedIn) {
      const now = Date.now();
      setLastActivity(now);
      await AsyncStorage.setItem('lastActivityTime', now.toString());
    }
  }, [isLoggedIn]);

  const extendSession = useCallback(async () => {
    // Extend the session by updating both loginTime and lastActivityTime
    if (isLoggedIn) {
      const now = Date.now();
      try {
        await AsyncStorage.multiSet([
          ['loginTime', now.toString()],
          ['lastActivityTime', now.toString()],
        ]);
        setLastActivity(now);
        console.log('Session extended');
      } catch (error) {
        console.error('Error extending session:', error);
      }
    }
  }, [isLoggedIn]);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Track app state changes for activity tracking
  useEffect(() => {
    if (!isLoggedIn) return;

    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        // App came to foreground - check if session is still valid
        checkAuth();
      } else if (nextAppState === 'background') {
        // App went to background - update last activity
        updateActivity();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [isLoggedIn, checkAuth, updateActivity]);

  // Periodic activity check (every minute when app is active)
  useEffect(() => {
    if (!isLoggedIn) return;

    const interval = setInterval(() => {
      const now = Date.now();
      
      // Check if 7 days of inactivity - if so, logout
      if (lastActivity && (now - lastActivity > SESSION_DURATION)) {
        console.log('Auto logout: 7 days of inactivity');
        logout();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isLoggedIn, lastActivity]);

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isLoggedIn,
        user,
        login,
        logout,
        checkAuth,
        updateActivity,
        extendSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
