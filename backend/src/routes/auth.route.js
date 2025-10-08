import express from 'express';
import { signup,login,logout,onboard } from '../controllers/auth.controller.js';

import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

// Signup route
router.post('/signup', signup);

// Login route
router.post('/login', login);

// Logout route
router.post('/logout', logout);
// onboarding route
router.post("/onboarding",protectRoute,onboard);
// Get current user route and check if user is logged in
router.get("/me",protectRoute,(req,res)=>{
  res.status(200).json({success:true,user:req.user});
});
export default router;