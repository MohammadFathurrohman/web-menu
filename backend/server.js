const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const sequelize = require('./database');
require('./models/index');

const authRoutes      = require('./routes/auth');
const menuRoutes      = require('./routes/menu');
const userRoutes      = require('./routes/users');
const categoryRoutes  = require('./routes/categories');
const orderRoutes     = require('./routes/orders');
const analyticsRoutes = require('./routes/analytics');

const { User, MenuItem, AuditLog } = require('./models/index');
const PORT = process.env.PORT || 3001;

const app = express();
const httpServer = createServer(app);

// ── CORS — must be FIRST so preflight OPTIONS is always answered ───────────
const corsOptions = {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // pre-flight for all routes

// ── Socket.io ──────────────────────────────────
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});
app.set('io', io);
io.on('connection', (socket) => {
  socket.on('join-admin', () => socket.join('admin'));
  socket.on('join-user', (userId) => socket.join(`user_${userId}`));
});

// ── Security Middleware ────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, max: 500,
  standardHeaders: true, legacyHeaders: false,
  message: { message: 'Too many requests, try again later.' }
}));
// Strict limit only for login & register (brute-force protection)
app.use(['/auth/login', '/auth/register'], rateLimit({
  windowMs: 15 * 60 * 1000, max: 30,
  message: { message: 'Too many auth attempts, try again later.' }
}));
app.use(express.json());

// ── Health ─────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', db: 'connected', uptime: process.uptime() });
  } catch { res.status(503).json({ status: 'error', db: 'disconnected' }); }
});

// ── Routes ─────────────────────────────────────
app.use('/auth',       authRoutes);
app.use('/menu',       menuRoutes);
app.use('/users',      userRoutes);
app.use('/categories', categoryRoutes);
app.use('/orders',     orderRoutes);
app.use('/analytics',  analyticsRoutes);

// (inline routes moved to routes/ directory)

// ── Dev endpoints ──────────────────────────────────────────────────────────
app.get('/db/stats', async (req, res) => {
  try {
    const [users, menu] = await Promise.all([User.findAll(), MenuItem.findAll()]);
    const adminCount = users.filter(u => u.role === 'admin').length;
    res.json({
      database: { type: 'PostgreSQL', host: process.env.DB_HOST, dialect: 'postgres' },
      users: { total: users.length, admins: adminCount, regularUsers: users.length - adminCount },
      menu: { total: menu.length }
    });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

app.get('/db/audit', async (req, res) => {
  try {
    const logs = await AuditLog.findAll({ order: [['createdAt', 'DESC']], limit: 100 });
    res.json(logs);
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

// ── Startup ────────────────────────────────────────────────────────────────
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced');
    httpServer.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`🔌 WebSocket ready on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Startup error:', err?.message || err);
    if (err?.stack) console.error(err.stack);
    process.exit(1);
  }
})();