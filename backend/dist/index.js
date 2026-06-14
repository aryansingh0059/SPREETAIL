"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
// Initialize the Prisma Client to interact with our Database Schema
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const groups_routes_1 = __importDefault(require("./routes/groups.routes"));
const expenses_routes_1 = __importDefault(require("./routes/expenses.routes"));
const settlements_routes_1 = __importDefault(require("./routes/settlements.routes"));
const balances_routes_1 = __importDefault(require("./routes/balances.routes"));
const imports_routes_1 = __importDefault(require("./routes/imports.routes"));
const app = (0, express_1.default)();
// Middleware to parse JSON bodies and allow Cross-Origin requests from the frontend
app.use(express_1.default.json());
app.use((0, cors_1.default)());
// Mount the authentication routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/groups', groups_routes_1.default);
app.use('/api/groups', balances_routes_1.default); // This catches /api/groups/:id/balances
app.use('/api/expenses', expenses_routes_1.default);
app.use('/api/settlements', settlements_routes_1.default);
app.use('/api/imports', imports_routes_1.default);
// A basic health check endpoint to ensure our server is up
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Shared Expenses API is running.' });
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map