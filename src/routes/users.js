import { Router } from 'express';

const router = Router();

// Get user profile
router.get('/me', (req, res) => {
  // Mock user data based on session
  const user = {
    id: 1,
    username: 'admin',
    email: 'admin@peergos.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'ADMIN',
    companyId: 1,
    createdAt: '2024-01-01T00:00:00Z'
  };
  
  res.json({ user });
});

// Update user profile
router.put('/me', (req, res) => {
  const { firstName, lastName, email } = req.body;
  
  // Mock update response
  const updatedUser = {
    id: 1,
    username: 'admin',
    email: email || 'admin@peergos.com',
    firstName: firstName || 'John',
    lastName: lastName || 'Doe',
    role: 'ADMIN',
    companyId: 1,
    updatedAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    user: updatedUser,
    message: 'Profile updated successfully'
  });
});

export default router;