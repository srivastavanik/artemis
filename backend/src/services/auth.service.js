import { createClient } from '@supabase/supabase-js';
import config from '../../config/index.js';
import { logger } from '../utils/logger.js';
import { generateToken } from '../middleware/auth.middleware.js';
import crypto from 'crypto';

class AuthService {
  constructor() {
    this.supabase = createClient(
      config.supabase.url,
      config.supabase.serviceKey, // Use service key for admin operations
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  /**
   * Sign up a new user
   */
  async signUp({ email, password, fullName }) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName }
      });

      if (authError) throw authError;

      // Create user profile
      const { data: userProfile, error: profileError } = await this.supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          full_name: fullName,
          avatar_url: this.generateGravatar(email)
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Generate JWT token
      const token = generateToken(userProfile);

      return {
        user: userProfile,
        token,
        session: authData.session
      };
    } catch (error) {
      logger.error('Sign up failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Sign in with email/password
   */
  async signIn({ email, password }) {
    try {
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      // Get user profile
      const { data: userProfile, error: profileError } = await this.supabase
        .from('users')
        .select('*, workspaces(*)')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      // Generate JWT token
      const token = generateToken(userProfile);

      return {
        user: userProfile,
        token,
        session: authData.session
      };
    } catch (error) {
      logger.error('Sign in failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle() {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${config.app.frontendUrl}/auth/callback`,
          scopes: 'email profile https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar'
        }
      });

      if (error) throw error;

      return data;
    } catch (error) {
      logger.error('Google sign in failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(code) {
    try {
      const { data: authData, error: authError } = await this.supabase.auth.exchangeCodeForSession(code);

      if (authError) throw authError;

      // Check if user profile exists
      const { data: existingUser } = await this.supabase
        .from('users')
        .select('*, workspaces(*)')
        .eq('id', authData.user.id)
        .single();

      let userProfile = existingUser;

      // Create profile if doesn't exist
      if (!existingUser) {
        const { data: newUser, error: profileError } = await this.supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: authData.user.email,
            full_name: authData.user.user_metadata.full_name || authData.user.email.split('@')[0],
            avatar_url: authData.user.user_metadata.avatar_url || this.generateGravatar(authData.user.email),
            google_connected: true
          })
          .select('*, workspaces(*)')
          .single();

        if (profileError) throw profileError;
        userProfile = newUser;
      } else {
        // Update Google connection status
        await this.supabase
          .from('users')
          .update({ google_connected: true })
          .eq('id', authData.user.id);
      }

      // Generate JWT token
      const token = generateToken(userProfile);

      return {
        user: userProfile,
        token,
        session: authData.session,
        isNewUser: !existingUser
      };
    } catch (error) {
      logger.error('OAuth callback failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Sign out
   */
  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      logger.error('Sign out failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get current session
   */
  async getSession(token) {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      logger.error('Get session failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Create workspace
   */
  async createWorkspace(userId, { name, slug }) {
    try {
      // Check if slug is available
      const { data: existing } = await this.supabase
        .from('workspaces')
        .select('id')
        .eq('slug', slug)
        .single();

      if (existing) {
        throw new Error('Workspace slug already taken');
      }

      // Create workspace
      const { data: workspace, error: workspaceError } = await this.supabase
        .from('workspaces')
        .insert({
          name,
          slug,
          owner_id: userId
        })
        .select()
        .single();

      if (workspaceError) throw workspaceError;

      // Update user's workspace
      const { error: updateError } = await this.supabase
        .from('users')
        .update({ 
          workspace_id: workspace.id,
          role: 'owner'
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      return workspace;
    } catch (error) {
      logger.error('Create workspace failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Send magic link
   */
  async sendMagicLink(email) {
    try {
      const { data, error } = await this.supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${config.app.frontendUrl}/auth/callback`
        }
      });

      if (error) throw error;

      return data;
    } catch (error) {
      logger.error('Send magic link failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Verify magic link token
   */
  async verifyMagicLink(token, email) {
    try {
      const { data: authData, error: authError } = await this.supabase.auth.verifyOtp({
        token,
        email,
        type: 'magiclink'
      });

      if (authError) throw authError;

      // Get or create user profile
      const { data: existingUser } = await this.supabase
        .from('users')
        .select('*, workspaces(*)')
        .eq('id', authData.user.id)
        .single();

      let userProfile = existingUser;

      if (!existingUser) {
        const { data: newUser, error: profileError } = await this.supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: authData.user.email,
            full_name: authData.user.email.split('@')[0],
            avatar_url: this.generateGravatar(authData.user.email)
          })
          .select('*, workspaces(*)')
          .single();

        if (profileError) throw profileError;
        userProfile = newUser;
      }

      // Generate JWT token
      const jwtToken = generateToken(userProfile);

      return {
        user: userProfile,
        token: jwtToken,
        session: authData.session,
        isNewUser: !existingUser
      };
    } catch (error) {
      logger.error('Verify magic link failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Invite user to workspace
   */
  async inviteToWorkspace(workspaceId, email, role, invitedBy) {
    try {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const { data: invitation, error } = await this.supabase
        .from('workspace_invitations')
        .insert({
          workspace_id: workspaceId,
          email,
          role,
          invited_by: invitedBy,
          token,
          expires_at: expiresAt
        })
        .select()
        .single();

      if (error) throw error;

      // TODO: Send invitation email

      return invitation;
    } catch (error) {
      logger.error('Invite to workspace failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Accept workspace invitation
   */
  async acceptInvitation(token, userId) {
    try {
      // Get invitation
      const { data: invitation, error: inviteError } = await this.supabase
        .from('workspace_invitations')
        .select('*, workspaces(*)')
        .eq('token', token)
        .eq('accepted', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (inviteError || !invitation) {
        throw new Error('Invalid or expired invitation');
      }

      // Update user's workspace and role
      const { error: updateError } = await this.supabase
        .from('users')
        .update({
          workspace_id: invitation.workspace_id,
          role: invitation.role
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Mark invitation as accepted
      const { error: acceptError } = await this.supabase
        .from('workspace_invitations')
        .update({ accepted: true })
        .eq('id', invitation.id);

      if (acceptError) throw acceptError;

      return invitation.workspaces;
    } catch (error) {
      logger.error('Accept invitation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Log audit event
   */
  async logAudit(workspaceId, userId, action, details = {}) {
    try {
      const { error } = await this.supabase
        .from('audit_logs')
        .insert({
          workspace_id: workspaceId,
          user_id: userId,
          action,
          resource_type: details.resourceType,
          resource_id: details.resourceId,
          details,
          ip_address: details.ipAddress,
          user_agent: details.userAgent
        });

      if (error) {
        logger.error('Audit log failed', { error: error.message });
      }
    } catch (error) {
      logger.error('Audit log failed', { error: error.message });
    }
  }

  /**
   * Generate Gravatar URL
   */
  generateGravatar(email) {
    const hash = crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
    return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=200`;
  }
}

export default new AuthService();
