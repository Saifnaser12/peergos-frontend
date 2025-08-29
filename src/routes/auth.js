import { Router } from 'express';

const router = Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Mock authentication for demo
    if (username === 'admin' && password === 'admin') {
      const user = {
        id: 1,
        username: 'admin',
        email: 'admin@peergos.com',
        role: 'ADMIN',
        companyId: 1
      };
      
      // Set session
      req.session.userId = user.id;
      req.session.companyId = user.companyId;
      
      res.json({
        success: true,
        user,
        message: 'Login successful'
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Could not log out'
      });
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});

// Get current user session
router.get('/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }
  
  // Mock user data
  const user = {
    id: req.session.userId,
    username: 'admin',
    email: 'admin@peergos.com',
    role: 'ADMIN',
    companyId: req.session.companyId || 1
  };
  
  res.json({
    success: true,
    user
  });
});

export default router;