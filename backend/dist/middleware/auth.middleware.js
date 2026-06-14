"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';
const authenticateToken = (req, res, next) => {
    // Extract token from Authorization header (e.g., "Bearer <token>")
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    try {
        // Verify the token
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Attach the decoded payload to the request object
        req.user = decoded;
        // Pass control to the next middleware or route handler
        next();
    }
    catch (error) {
        res.status(403).json({ error: 'Invalid or expired token.' });
    }
};
exports.authenticateToken = authenticateToken;
//# sourceMappingURL=auth.middleware.js.map