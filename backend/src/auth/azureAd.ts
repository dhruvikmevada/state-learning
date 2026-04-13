import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../utils/prisma';
import { generateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Azure AD / Entra ID authentication flow.
 *
 * When AUTH_MODE=azure, the frontend redirects to /auth/azure/login
 * which sends the user to the Microsoft login page. After authentication,
 * Microsoft redirects back to /auth/callback with an authorization code.
 *
 * This module handles the code exchange and user provisioning.
 *
 * For a complete implementation, install and configure:
 *   npm install passport-azure-ad
 *
 * Below is the scaffolding that needs the actual passport-azure-ad
 * strategy wired in based on your specific tenant configuration.
 */

// GET /auth/azure/login — redirect to Microsoft login
router.get('/azure/login', (_req: Request, res: Response) => {
  const { tenantId, clientId, redirectUri } = config.auth.azure;

  if (!tenantId || !clientId) {
    res.status(500).json({ error: 'Azure AD not configured' });
    return;
  }

  const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
    new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: 'openid profile email User.Read',
      response_mode: 'query',
    }).toString();

  res.redirect(authUrl);
});

// GET /auth/callback — handle Microsoft redirect
router.get('/callback', async (req: Request, res: Response) => {
  const { code } = req.query;

  if (!code) {
    res.redirect(`${config.frontend.url}/login?error=no_code`);
    return;
  }

  try {
    const { tenantId, clientId, clientSecret, redirectUri } = config.auth.azure;

    // Exchange code for tokens
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: code as string,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          scope: 'openid profile email User.Read',
        }),
      }
    );

    if (!tokenResponse.ok) {
      logger.error('Azure token exchange failed', { status: tokenResponse.status });
      res.redirect(`${config.frontend.url}/login?error=token_exchange_failed`);
      return;
    }

    const tokens = await tokenResponse.json();
    const idToken = tokens.id_token;

    // Decode the ID token (in production, verify signature with Azure public keys)
    const decoded = jwt.decode(idToken) as any;

    if (!decoded || !decoded.email) {
      res.redirect(`${config.frontend.url}/login?error=invalid_token`);
      return;
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email: decoded.email.toLowerCase() } });

    if (!user) {
      // Auto-provision new user as Standard Contributor
      user = await prisma.user.create({
        data: {
          email: decoded.email.toLowerCase(),
          displayName: decoded.name || decoded.email,
          role: 'STANDARD_CONTRIBUTOR',
          department: 'Unassigned',
          azureAdId: decoded.oid || decoded.sub,
          active: true,
        },
      });
      logger.info('Auto-provisioned new user from Azure AD', { email: user.email });
    }

    if (!user.active) {
      res.redirect(`${config.frontend.url}/login?error=user_inactive`);
      return;
    }

    // Update Azure AD ID if missing
    if (!user.azureAdId && (decoded.oid || decoded.sub)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { azureAdId: decoded.oid || decoded.sub },
      });
    }

    // Generate app JWT
    const appToken = generateToken({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      department: user.department,
    });

    logger.info('Azure AD login successful', { email: user.email, role: user.role });

    // Redirect to frontend with token
    res.redirect(`${config.frontend.url}/auth/callback?token=${appToken}`);
  } catch (error) {
    logger.error('Azure AD callback error', { error });
    res.redirect(`${config.frontend.url}/login?error=auth_failed`);
  }
});

export default router;
