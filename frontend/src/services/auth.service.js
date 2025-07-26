import api from './api';

class AuthService {
  constructor() {
    this.tokenKey = 'artemis_token';
    this.userKey = 'artemis_user';
  }

  /**
   * Sign up new user
   */
  async signUp({ email, password, fullName }) {
    try {
      const response = await api.post('/auth/signup', {
        email,
        password,
        fullName
      });

      if (response.data.success) {
        this.setSession(response.data.data.token, response.data.data.user);
        return response.data.data;
      }

      throw new Error(response.data.error || 'Signup failed');
    } catch (error) {
      console.error('Signup error:', error);
      throw error.response?.data?.error || error.message;
    }
  }

  /**
   * Sign in with email/password
   */
  async signIn({ email, password }) {
    try {
      const response = await api.post('/auth/signin', {
        email,
        password
      });

      if (response.data.success) {
        this.setSession(response.data.data.token, response.data.data.user);
        return response.data.data;
      }

      throw new Error(response.data.error || 'Sign in failed');
    } catch (error) {
      console.error('Sign in error:', error);
      throw error.response?.data?.error || error.message;
    }
  }

  /**
   * Sign in with Google
   */
  signInWithGoogle() {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`;
  }

  /**
   * Send magic link
   */
  async sendMagicLink(email) {
    try {
      const response = await api.post('/auth/magic-link', { email });

      if (response.data.success) {
        return response.data;
      }

      throw new Error(response.data.error || 'Failed to send magic link');
    } catch (error) {
      console.error('Magic link error:', error);
      throw error.response?.data?.error || error.message;
    }
  }

  /**
   * Verify magic link
   */
  async verifyMagicLink(token, email) {
    try {
      const response = await api.post('/auth/verify-magic-link', {
        token,
        email
      });

      if (response.data.success) {
        this.setSession(response.data.data.token, response.data.data.user);
        return response.data.data;
      }

      throw new Error(response.data.error || 'Invalid magic link');
    } catch (error) {
      console.error('Verify magic link error:', error);
      throw error.response?.data?.error || error.message;
    }
  }

  /**
   * Sign out
   */
  async signOut() {
    try {
      await api.post('/auth/signout');
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      this.clearSession();
      window.location.href = '/auth/login';
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me');

      if (response.data.success) {
        // Update stored user data
        this.setUser(response.data.data);
        return response.data.data;
      }

      throw new Error('Failed to get user');
    } catch (error) {
      console.error('Get current user error:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Create workspace
   */
  async createWorkspace({ name, slug }) {
    try {
      const response = await api.post('/auth/workspace', {
        name,
        slug
      });

      if (response.data.success) {
        // Update user data with new workspace
        const user = this.getUser();
        if (user) {
          user.workspace_id = response.data.data.id;
          user.workspaces = response.data.data;
          this.setUser(user);
        }
        return response.data.data;
      }

      throw new Error(response.data.error || 'Failed to create workspace');
    } catch (error) {
      console.error('Create workspace error:', error);
      throw error.response?.data?.error || error.message;
    }
  }

  /**
   * Invite user to workspace
   */
  async inviteUser(email, role = 'member') {
    try {
      const response = await api.post('/auth/invite', {
        email,
        role
      });

      if (response.data.success) {
        return response.data.data;
      }

      throw new Error(response.data.error || 'Failed to send invitation');
    } catch (error) {
      console.error('Invite user error:', error);
      throw error.response?.data?.error || error.message;
    }
  }

  /**
   * Accept invitation
   */
  async acceptInvitation(token) {
    try {
      const response = await api.post('/auth/accept-invite', {
        token
      });

      if (response.data.success) {
        // Refresh user data
        await this.getCurrentUser();
        return response.data.data;
      }

      throw new Error(response.data.error || 'Failed to accept invitation');
    } catch (error) {
      console.error('Accept invitation error:', error);
      throw error.response?.data?.error || error.message;
    }
  }

  /**
   * Check session
   */
  async checkSession() {
    try {
      const response = await api.get('/auth/session');

      if (response.data.success && response.data.data.authenticated) {
        this.setUser(response.data.data.user);
        return response.data.data;
      }

      return { authenticated: false };
    } catch (error) {
      console.error('Session check error:', error);
      this.clearSession();
      return { authenticated: false };
    }
  }

  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(params) {
    const { token, isNewUser } = params;

    if (token) {
      // Set token and get user data
      this.setToken(token);
      
      try {
        const user = await this.getCurrentUser();
        return {
          success: true,
          user,
          isNewUser: isNewUser === 'true'
        };
      } catch (error) {
        this.clearSession();
        throw error;
      }
    }

    throw new Error('No authentication token received');
  }

  /**
   * Session management
   */
  setSession(token, user) {
    this.setToken(token);
    this.setUser(user);
  }

  setToken(token) {
    localStorage.setItem(this.tokenKey, token);
    // Update API default headers
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  setUser(user) {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  getUser() {
    const userJson = localStorage.getItem(this.userKey);
    return userJson ? JSON.parse(userJson) : null;
  }

  clearSession() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    delete api.defaults.headers.common['Authorization'];
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  hasWorkspace() {
    const user = this.getUser();
    return user && user.workspace_id;
  }

  isOwner() {
    const user = this.getUser();
    return user && user.role === 'owner';
  }

  isAdmin() {
    const user = this.getUser();
    return user && ['owner', 'admin'].includes(user.role);
  }

  /**
   * Initialize auth (called on app startup)
   */
  initialize() {
    const token = this.getToken();
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }
}

// Create singleton instance
const authService = new AuthService();

// Initialize on import
authService.initialize();

export default authService;
