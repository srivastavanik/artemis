import express from 'express';
import authService from '../services/auth.service.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Sign up new user
 * @access  Public
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // Validate input
    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and full name are required'
      });
    }

    const result = await authService.signUp({ email, password, fullName });

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Signup error:', error);
    res.status(error.message.includes('already registered') ? 409 : 500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/signin
 * @desc    Sign in user
 * @access  Public
 */
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const result = await authService.signIn({ email, password });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Signin error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
});

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth
 * @access  Public
 */
router.get('/google', async (req, res) => {
  try {
    const result = await authService.signInWithGoogle();
    res.redirect(result.url);
  } catch (error) {
    logger.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/auth/callback
 * @desc    Handle OAuth callback
 * @access  Public
 */
router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=No authorization code`);
    }

    const result = await authService.handleOAuthCallback(code);

    // Redirect to frontend with token and user info
    const redirectUrl = new URL(`${process.env.FRONTEND_URL}/auth/success`);
    redirectUrl.searchParams.append('token', result.token);
    redirectUrl.searchParams.append('isNewUser', result.isNewUser);

    res.redirect(redirectUrl.toString());
  } catch (error) {
    logger.error('OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent(error.message)}`);
  }
});

/**
 * @route   POST /api/auth/magic-link
 * @desc    Send magic link for passwordless login
 * @access  Public
 */
router.post('/magic-link', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    await authService.sendMagicLink(email);

    res.json({
      success: true,
      message: 'Magic link sent to your email'
    });
  } catch (error) {
    logger.error('Magic link error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/verify-magic-link
 * @desc    Verify magic link token
 * @access  Public
 */
router.post('/verify-magic-link', async (req, res) => {
  try {
    const { token, email } = req.body;

    if (!token || !email) {
      return res.status(400).json({
        success: false,
        error: 'Token and email are required'
      });
    }

    const result = await authService.verifyMagicLink(token, email);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Verify magic link error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid or expired link'
    });
  }
});

/**
 * @route   POST /api/auth/signout
 * @desc    Sign out user
 * @access  Private
 */
router.post('/signout', authenticate, async (req, res) => {
  try {
    await authService.signOut();

    res.json({
      success: true,
      message: 'Signed out successfully'
    });
  } catch (error) {
    logger.error('Signout error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    // Get fresh user data including workspace
    const { data: user, error } = await authService.supabase
      .from('users')
      .select('*, workspaces(*)')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/workspace
 * @desc    Create workspace
 * @access  Private
 */
router.post('/workspace', authenticate, async (req, res) => {
  try {
    const { name, slug } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        error: 'Name and slug are required'
      });
    }

    const workspace = await authService.createWorkspace(req.user.id, { name, slug });

    // Log audit event
    await authService.logAudit(workspace.id, req.user.id, 'workspace_created', {
      workspaceName: name,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      data: workspace
    });
  } catch (error) {
    logger.error('Create workspace error:', error);
    res.status(error.message.includes('already taken') ? 409 : 500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/invite
 * @desc    Invite user to workspace
 * @access  Private (admin/owner only)
 */
router.post('/invite', authenticate, async (req, res) => {
  try {
    const { email, role = 'member' } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Check if user has permission to invite
    if (!['owner', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    // Get user's workspace
    const { data: userData } = await authService.supabase
      .from('users')
      .select('workspace_id')
      .eq('id', req.user.id)
      .single();

    if (!userData?.workspace_id) {
      return res.status(400).json({
        success: false,
        error: 'You must be part of a workspace to invite users'
      });
    }

    const invitation = await authService.inviteToWorkspace(
      userData.workspace_id,
      email,
      role,
      req.user.id
    );

    // Log audit event
    await authService.logAudit(userData.workspace_id, req.user.id, 'user_invited', {
      invitedEmail: email,
      invitedRole: role,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: invitation
    });
  } catch (error) {
    logger.error('Invite user error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/accept-invite
 * @desc    Accept workspace invitation
 * @access  Private
 */
router.post('/accept-invite', authenticate, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Invitation token is required'
      });
    }

    const workspace = await authService.acceptInvitation(token, req.user.id);

    // Log audit event
    await authService.logAudit(workspace.id, req.user.id, 'invitation_accepted', {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: workspace
    });
  } catch (error) {
    logger.error('Accept invite error:', error);
    res.status(error.message.includes('Invalid') ? 400 : 500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/auth/session
 * @desc    Check session status
 * @access  Optional auth
 */
router.get('/session', optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.json({
        success: true,
        data: { authenticated: false }
      });
    }

    // Get fresh user data
    const { data: user, error } = await authService.supabase
      .from('users')
      .select('*, workspaces(*)')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: {
        authenticated: true,
        user
      }
    });
  } catch (error) {
    logger.error('Session check error:', error);
    res.json({
      success: true,
      data: { authenticated: false }
    });
  }
});

export default router;
