import { Router, Request, Response } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { register, login, getMe } from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Email/Password routes
router.post('/register', register);
router.post('/login', login);

// Protected route - get current user
router.get('/me', authenticateToken, getMe);

// GitHub OAuth routes
router.get('/github', passport.authenticate('github', { scope: ['user:email', 'repo'] }));

router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: `${FRONTEND_URL}/auth?error=failed` }),
  (req: Request, res: Response) => {
    const user = req.user as any;

    if (!user) {
      return res.redirect(`${FRONTEND_URL}/auth?error=no_user`);
    }

    try {
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );

      // Redirect to frontend with token
      res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (error) {
      res.redirect(`${FRONTEND_URL}/auth?error=token_error`);
    }
  }
);

export default router;
