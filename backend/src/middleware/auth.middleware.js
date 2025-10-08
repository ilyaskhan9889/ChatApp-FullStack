import jwt from 'jsonwebtoken';
import {User} from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

// Middleware to protect routes
export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;// Get token from cookies
        if (!token) { 
            return res.status(401).json({ message: 'No token provided, authorization denied' });
        }// Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);// Decode token
        if (!decoded) {
            return res.status(401).json({ message: 'Token is not valid' });
        }
        const user = await User.findById(decoded.userId).select("-password");// Find user by ID
        if (!user) {
            return res.status(401).json({ message: 'User not found, authorization denied' });
        }
        req.user = user; // Attach user to request object
       
        next();
    } catch (error) {
        console.log("Error in protectRoute middleware:", error);
        return res.status(500).json({ message: 'Internal Server error' });
        
    }
};