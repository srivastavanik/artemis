import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/auth.service';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if user is stored locally
        const storedUser = authService.getUser();
        if (storedUser) {
          setUser(storedUser);
          
          // Verify session is still valid
          const freshUser = await authService.getCurrentUser();
          if (freshUser) {
            setUser(freshUser);
          } else {
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async ({ email, password }) => {
    try {
      setError(null);
      const result = await authService.signIn({ email, password });
      setUser(result.user);
      return result;
    } catch (err) {
      setError(err.toString());
      throw err;
    }
  };

  const signUp = async ({ email, password, fullName }) => {
    try {
      setError(null);
      const result = await authService.signUp({ email, password, fullName });
      setUser(result.user);
      return result;
    } catch (err) {
      setError(err.toString());
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
      setUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
      // Still clear user state even if API call fails
      setUser(null);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    authService.setUser(updatedUser);
  };

  const refreshUser = async () => {
    try {
      const freshUser = await authService.getCurrentUser();
      if (freshUser) {
        setUser(freshUser);
        return freshUser;
      }
      return null;
    } catch (err) {
      console.error('Refresh user error:', err);
      return null;
    }
  };

  const value = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    updateUser,
    refreshUser,
    isAuthenticated: !!user,
    hasWorkspace: user && user.workspace_id,
    isOwner: user && user.role === 'owner',
    isAdmin: user && ['owner', 'admin'].includes(user.role)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
