// Load environment variables from .env file (for local development)
// This must be at the very top, before any other imports
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// PayPal Configuration (optional - only load if available)
let paypal = null;
let paypalClient = null;
try {
  paypal = require('@paypal/checkout-server-sdk');
  const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
  const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
  const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox'; // 'sandbox' or 'live'

  // PayPal SDK Setup
  if (PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET) {
    paypalClient = () => {
      const environment = PAYPAL_MODE === 'live'
        ? new paypal.core.LiveEnvironment(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET)
        : new paypal.core.SandboxEnvironment(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET);
      
      return new paypal.core.PayPalHttpClient(environment);
    };
    console.log('✅ PayPal SDK loaded');
  } else {
    console.log('⚠️  PayPal not configured - payment features disabled');
  }
} catch (err) {
  console.log('⚠️  PayPal SDK not available - payment features disabled');
  console.log('⚠️  Install with: npm install @paypal/checkout-server-sdk');
}

console.log('🚀 SERVER STARTING - VERSION WITH FIXES');
console.log('🚀 Timestamp:', new Date().toISOString());

const app = express();
const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
// CORS configuration - Add headers to ALL responses
app.use((req, res, next) => {
  // Log all API requests for debugging
  if (req.path.startsWith('/api')) {
    console.log(`🌐 API Request: ${req.method} ${req.path}`);
  }
  
  // Use setHeader to ensure headers are set
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Also use cors middleware as backup
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type']
}));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files with CORS headers
const staticOptions = {
  setHeaders: (res, path) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  }
};

app.use('/uploads', express.static('uploads', staticOptions));
app.use('/qrcodes', express.static('qrcodes', staticOptions));

// Note: Frontend static files will be served at the end, after all API routes

// Create directories if they don't exist
['uploads/images', 'uploads/videos', 'uploads/audio', 'qrcodes'].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Database setup
let db = null;
let dbReady = false;
let dbError = false;
let serverStarted = false;

// MySQL connection configuration
const dbConfig = {
  host: process.env.MYSQL_HOST || process.env.MYSQLHOST || 'localhost',
  user: process.env.MYSQL_USER || process.env.MYSQLUSER || 'root',
  password: process.env.MYSQL_PASSWORD || process.env.MYSQLPASSWORD || '',
  database: process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE || 'memorial',
  port: process.env.MYSQL_PORT || process.env.MYSQLPORT || 3306
};

// Initialize MySQL connection
let retryCount = 0;
const MAX_RETRIES = 5; // Try 5 times, then start server anyway

// Function to check if connection is alive and reconnect if needed
async function ensureDbConnection() {
  if (!db) {
    console.log('🔄 No database connection, attempting to connect...');
    await initDatabaseConnection();
    return;
  }
  
  try {
    // Try a simple query to check if connection is alive
    await db.execute('SELECT 1');
    return; // Connection is alive
  } catch (err) {
    if (err.message && (err.message.includes('closed state') || err.message.includes('PROTOCOL_CONNECTION_LOST'))) {
      console.error('❌ Database connection is closed, reconnecting...');
      db = null;
      dbReady = false;
      retryCount = 0; // Reset retry count for reconnection
      await initDatabaseConnection();
    } else {
      throw err; // Re-throw other errors
    }
  }
}

async function initDatabaseConnection() {
  try {
    console.log('Connecting to MySQL database...');
    console.log('Database config:', {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
      password: dbConfig.password ? '***' : '(empty)'
    });
    db = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL database');
    
    // Handle connection errors and reconnection
    db.on('error', async (err) => {
      console.error('❌ MySQL connection error:', err.message);
      if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
        console.log('🔄 Connection lost, will reconnect on next query...');
        db = null;
        dbReady = false;
      }
    });
    
    // Enable foreign keys (MySQL uses different syntax)
    await db.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Foreign keys enabled');
    
    // Initialize database tables
    await initDatabase();
    console.log('✅ Database initialization successful');
    dbReady = true;
    startServer();
  } catch (err) {
    retryCount++;
    console.error('❌ Database connection failed:', err.message);
    
    if (retryCount >= MAX_RETRIES) {
      console.error('⚠️  Max retries reached. Starting server anyway - database may be available later');
      console.error('⚠️  Endpoints that require database will return 503 until database is available');
      dbError = true;
      dbReady = true; // Set to true so server can start
      startServer(); // Start server even without database
  } else {
      console.error(`⏳ Retrying in 3 seconds... (${retryCount}/${MAX_RETRIES})`);
      setTimeout(async () => {
        try {
          await initDatabaseConnection();
        } catch (retryErr) {
          // This will be caught by the outer catch
        }
      }, 3000);
    }
  }
}

// Start server immediately (for endpoints that don't need database)
startServer();

// Start database connection (will retry in background)
initDatabaseConnection();

async function initDatabase() {
  console.log('Starting database initialization...');
  
  try {
    // Create memorials table
    await db.execute(`CREATE TABLE IF NOT EXISTS memorials (
      id VARCHAR(255) PRIMARY KEY,
      userId VARCHAR(255),
      name VARCHAR(255) NOT NULL,
      hebrewName VARCHAR(255),
      birthDate VARCHAR(255),
      deathDate VARCHAR(255),
      biography TEXT,
      images TEXT,
      videos TEXT,
      backgroundMusic TEXT,
      heroImage TEXT,
      heroSummary TEXT,
      timeline TEXT,
      tehilimChapters TEXT,
      mishnayot TEXT,
      qrCodePath TEXT,
      status VARCHAR(50) DEFAULT 'temporary',
      expiryDate DATETIME,
      canEdit BOOLEAN DEFAULT TRUE,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    console.log('✅ Memorials table ready');
    
    // Add status and expiryDate columns if they don't exist (for existing tables)
    try {
      await db.execute(`ALTER TABLE memorials ADD COLUMN status VARCHAR(50) DEFAULT 'temporary'`);
      console.log('✅ Added status column to memorials');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ status column already exists in memorials');
      } else {
        throw err;
      }
    }
    
    try {
      await db.execute(`ALTER TABLE memorials ADD COLUMN expiryDate DATETIME`);
      console.log('✅ Added expiryDate column to memorials');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ expiryDate column already exists in memorials');
      } else {
        throw err;
      }
    }
    
    try {
      await db.execute(`ALTER TABLE memorials ADD COLUMN canEdit BOOLEAN DEFAULT TRUE`);
      console.log('✅ Added canEdit column to memorials');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ canEdit column already exists in memorials');
      } else {
        throw err;
      }
    }
    
    // Add mishnayot column if it doesn't exist (for existing tables)
    try {
      await db.execute(`ALTER TABLE memorials ADD COLUMN mishnayot TEXT`);
      console.log('✅ Added mishnayot column to memorials');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ mishnayot column already exists in memorials');
      } else {
        throw err;
      }
    }
    
    // Create condolences table
    await db.execute(`CREATE TABLE IF NOT EXISTS condolences (
      id VARCHAR(255) PRIMARY KEY,
      memorialId VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
      approved INT DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (memorialId) REFERENCES memorials(id) ON DELETE CASCADE
    )`);
    console.log('✅ Condolences table ready');
    
    // Create candles table
    await db.execute(`CREATE TABLE IF NOT EXISTS candles (
      id VARCHAR(255) PRIMARY KEY,
      memorialId VARCHAR(255) NOT NULL,
      litBy VARCHAR(255),
      visitorId VARCHAR(255),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (memorialId) REFERENCES memorials(id) ON DELETE CASCADE
    )`);
    console.log('✅ Candles table ready');
    
    // Create indexes (MySQL doesn't support IF NOT EXISTS for indexes)
    try {
      await db.execute(`CREATE INDEX idx_candles_memorial_visitor ON candles(memorialId, visitorId)`);
      console.log('✅ Candles index ready');
    } catch (indexErr) {
      // Index might already exist, that's okay
      if (indexErr.code !== 'ER_DUP_KEYNAME') {
        throw indexErr;
      }
      console.log('✅ Candles index already exists');
    }
    
    // Create index on createdAt for faster sorting
    try {
      await db.execute(`CREATE INDEX idx_memorials_createdAt ON memorials(createdAt DESC)`);
      console.log('✅ Memorials createdAt index ready');
    } catch (indexErr) {
      // Index might already exist, that's okay
      if (indexErr.code !== 'ER_DUP_KEYNAME') {
        throw indexErr;
      }
      console.log('✅ Memorials createdAt index already exists');
    }

    // Create users table
    await db.execute(`CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    console.log('✅ Users table ready');

    // Add userId column to memorials table if it doesn't exist
    try {
      await db.execute(`ALTER TABLE memorials ADD COLUMN userId VARCHAR(255)`);
      console.log('✅ Added userId column to memorials');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ userId column already exists in memorials');
      } else {
        throw err;
      }
    }

    // Create payments table
    await db.execute(`CREATE TABLE IF NOT EXISTS payments (
      id VARCHAR(255) PRIMARY KEY,
      userId VARCHAR(255) NOT NULL,
      memorialId VARCHAR(255),
      planType VARCHAR(50) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      paymentMethod VARCHAR(50),
      transactionId VARCHAR(255),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (memorialId) REFERENCES memorials(id) ON DELETE SET NULL
    )`);
    console.log('✅ Payments table ready');

    // Create subscriptions table
    await db.execute(`CREATE TABLE IF NOT EXISTS subscriptions (
      id VARCHAR(255) PRIMARY KEY,
      userId VARCHAR(255) NOT NULL,
      memorialId VARCHAR(255),
      planType VARCHAR(50) NOT NULL,
      startDate DATETIME NOT NULL,
      endDate DATETIME NOT NULL,
      status VARCHAR(50) DEFAULT 'active',
      autoRenew BOOLEAN DEFAULT TRUE,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (memorialId) REFERENCES memorials(id) ON DELETE SET NULL
    )`);
    console.log('✅ Subscriptions table ready');

    // Create indexes for users, payments, subscriptions
    try {
      await db.execute(`CREATE INDEX idx_memorials_userId ON memorials(userId)`);
      await db.execute(`CREATE INDEX idx_payments_userId ON payments(userId)`);
      await db.execute(`CREATE INDEX idx_payments_memorialId ON payments(memorialId)`);
      await db.execute(`CREATE INDEX idx_subscriptions_userId ON subscriptions(userId)`);
      await db.execute(`CREATE INDEX idx_subscriptions_status ON subscriptions(status)`);
      console.log('✅ User/payment/subscription indexes ready');
    } catch (indexErr) {
      if (indexErr.code !== 'ER_DUP_KEYNAME') {
        throw indexErr;
      }
      console.log('✅ User/payment/subscription indexes already exist');
    }
    
    console.log('✅ Database initialization complete!');
  } catch (err) {
    console.error('❌ Error initializing database:', err);
    throw err;
  }
}

function startServer() {
  if (serverStarted) {
    console.log('Server already started');
    return;
  }
  
  if (app.listening) {
    console.log('Server already listening');
    return;
  }
  
  serverStarted = true;
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`✅ Environment: ${NODE_ENV}`);
    if (NODE_ENV === 'production') {
      console.log(`✅ Frontend URL: ${process.env.FRONTEND_URL || 'Not set'}`);
      console.log(`✅ Base URL: ${process.env.BASE_URL || 'NOT SET - Using request host (will be Railway URL!)'}`);
      if (!process.env.BASE_URL) {
        console.log(`⚠️  WARNING: BASE_URL not set! QR codes will point to Railway instead of Netlify!`);
      }
    }
    if (dbReady && !dbError) {
      console.log('✅ Database connected - all endpoints available');
    } else {
      console.log('⚠️  Database not connected - endpoints requiring database will return 503');
      console.log('⚠️  Endpoints like /api/music will work without database');
    }
    
    // Verify that /api/music endpoint is registered
    console.log('🔍 Verifying API endpoints are registered...');
    const routes = app._router.stack
      .filter(r => r.route)
      .map(r => {
        const methods = r.route.stack.map(s => s.method.toUpperCase()).join(', ');
        return `${methods} ${r.route.path}`;
      });
    const musicRoutes = routes.filter(r => r.includes('/api/music'));
    if (musicRoutes.length > 0) {
      console.log(`✅ /api/music endpoints registered:`);
      musicRoutes.forEach(route => console.log(`   - ${route}`));
    } else {
      console.log('❌ ERROR: /api/music endpoint NOT registered!');
      console.log('❌ Available routes:', routes.filter(r => r.includes('/api')).join(', '));
    }
  });
}

function parseTimeline(rawValue) {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Failed to parse stored timeline', error);
    return [];
  }
}

// Helper function to handle database errors
function handleDbError(err, res) {
  // Ensure CORS headers are set even on errors
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  if (err && (err.code === 'ER_NO_SUCH_TABLE' || err.code === 'SQLITE_ERROR') && err.message && (err.message.includes('doesn\'t exist') || err.message.includes('no such table'))) {
    return res.status(503).json({ 
      success: false, 
      error: 'Database is initializing. Please try again in a moment.' 
    });
  }
  return res.status(500).json({ success: false, error: err ? err.message : 'Database error' });
}

// MySQL doesn't need ensureColumn - all columns are created with the table

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/images';
    if (file.mimetype.startsWith('video/')) {
      uploadPath = 'uploads/videos';
    } else if (file.mimetype.startsWith('audio/')) {
      uploadPath = 'uploads/audio';
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { 
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 20 // Max 20 files per request
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|webm|mp3|wav|m4a|ogg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype.startsWith('audio/');
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, videos and audio files are allowed!'));
    }
  }
});

// Security: Basic input validation
const validateInput = (req, res, next) => {
  // Sanitize string inputs
  if (req.body.name && typeof req.body.name === 'string') {
    req.body.name = req.body.name.trim().substring(0, 200);
  }
  if (req.body.hebrewName && typeof req.body.hebrewName === 'string') {
    req.body.hebrewName = req.body.hebrewName.trim().substring(0, 200);
  }
  if (req.body.biography && typeof req.body.biography === 'string') {
    req.body.biography = req.body.biography.trim().substring(0, 10000);
  }
  next();
};

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log('🔍 Auth header received:', authHeader ? 'Yes' : 'No');
  console.log('🔍 All headers:', JSON.stringify(req.headers, null, 2));
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('❌ No token found in request');
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  console.log('✅ Token found, length:', token.length);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Get user from database
    await ensureDbConnection();
    const [users] = await db.execute('SELECT id, name, email FROM users WHERE id = ?', [decoded.userId]);
    
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = users[0];
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid token' });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      await ensureDbConnection();
      const [users] = await db.execute('SELECT id, name, email FROM users WHERE id = ?', [decoded.userId]);
      if (users.length > 0) {
        req.user = users[0];
      }
    } catch (err) {
      // Ignore token errors for optional auth
    }
  }
  next();
};

// Middleware to check if database is ready
const checkDbReady = (req, res, next) => {
  if (!dbReady) {
    return res.status(503).json({ 
      success: false, 
      error: 'Database is initializing. Please try again in a moment.' 
    });
  }
  if (dbError) {
    return res.status(503).json({ 
      success: false, 
      error: 'Database error. Please try again later.' 
    });
  }
  next();
};

// Routes

// ==================== AUTHENTICATION ENDPOINTS ====================

// Handle OPTIONS preflight for /api/auth
app.options('/api/auth/*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

// Sign up endpoint
app.post('/api/auth/signup', checkDbReady, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'שם, אימייל וסיסמה נדרשים' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'סיסמה חייבת להיות לפחות 6 תווים' });
    }

    await ensureDbConnection();

    // Check if user already exists
    const [existingUsers] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: 'כתובת אימייל זו כבר רשומה' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = uuidv4();
    await db.execute(
      'INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)',
      [userId, name, email, hashedPassword]
    );

    // Generate JWT token
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      token,
      user: { id: userId, name, email }
    });
  } catch (err) {
    console.error('Signup error:', err);
    handleDbError(err, res);
  }
});

// Login endpoint
app.post('/api/auth/login', checkDbReady, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'אימייל וסיסמה נדרשים' });
    }

    await ensureDbConnection();

    // Find user
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'אימייל או סיסמה שגויים' });
    }

    const user = users[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'אימייל או סיסמה שגויים' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Login error:', err);
    handleDbError(err, res);
  }
});

// Get current user endpoint
app.get('/api/auth/me', checkDbReady, authenticateToken, async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// ==================== PAYMENT ENDPOINTS ====================

// Handle OPTIONS preflight for /api/payments
app.options('/api/payments', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

// Create payment endpoint with PayPal
app.post('/api/payments/create', checkDbReady, authenticateToken, async (req, res) => {
  try {
    const { memorialId, planType, amount } = req.body;

    if (!planType || !amount) {
      return res.status(400).json({ success: false, message: 'סוג תוכנית וסכום נדרשים' });
    }

    await ensureDbConnection();

    const paymentId = uuidv4();
    
    // Create payment record in database
    await db.execute(
      'INSERT INTO payments (id, userId, memorialId, planType, amount, status) VALUES (?, ?, ?, ?, ?, ?)',
      [paymentId, req.user.id, memorialId || null, planType, amount, 'pending']
    );

    // Create PayPal order
    if (!paypal || !paypalClient) {
      return res.status(500).json({ 
        success: false, 
        message: 'PayPal לא מוגדר. אנא התקן את הספרייה והגדר PAYPAL_CLIENT_ID ו-PAYPAL_CLIENT_SECRET' 
      });
    }

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: paymentId,
        amount: {
          currency_code: 'ILS',
          value: amount.toString()
        },
        description: `תשלום עבור ${planType === 'lifetime' ? 'הנצחה לכל החיים (עם עריכה)' : planType === 'lifetime-no-edit' ? 'הנצחה לכל החיים (בלי עריכה)' : planType === 'annual' ? 'שמירה שנתית' : 'דף זיכרון'}`
      }],
      application_context: {
        brand_name: 'דפי זיכרון דיגיטליים',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: `${process.env.BASE_URL || 'http://localhost:3000'}/payment/success?paymentId=${paymentId}`,
        cancel_url: `${process.env.BASE_URL || 'http://localhost:3000'}/payment/cancel?paymentId=${paymentId}`
      }
    });

    const client = paypalClient();
    const order = await client.execute(request);

    // Update payment with PayPal order ID
    await db.execute(
      'UPDATE payments SET transactionId = ? WHERE id = ?',
      [order.result.id, paymentId]
    );

    res.json({
      success: true,
      paymentId,
      orderId: order.result.id,
      approveUrl: order.result.links.find(link => link.rel === 'approve')?.href,
      message: 'תשלום נוצר בהצלחה'
    });
  } catch (err) {
    console.error('Payment creation error:', err);
    handleDbError(err, res);
  }
});

// Confirm PayPal payment
app.post('/api/payments/confirm', checkDbReady, authenticateToken, async (req, res) => {
  try {
    const { orderId, paymentId } = req.body;

    if (!orderId || !paymentId) {
      return res.status(400).json({ success: false, message: 'Order ID ו-Payment ID נדרשים' });
    }

    await ensureDbConnection();

    // Capture PayPal order
    if (!paypal || !paypalClient) {
      return res.status(500).json({ 
        success: false, 
        message: 'PayPal לא מוגדר. אנא התקן את הספרייה והגדר PAYPAL_CLIENT_ID ו-PAYPAL_CLIENT_SECRET' 
      });
    }

    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    const client = paypalClient();
    const order = await client.execute(request);

    if (order.result.status === 'COMPLETED') {
      // Update payment status
      await db.execute(
        'UPDATE payments SET status = ?, transactionId = ? WHERE id = ?',
        ['completed', orderId, paymentId]
      );

      // Get payment details
      const [payments] = await db.execute(
        'SELECT * FROM payments WHERE id = ?',
        [paymentId]
      );

      if (payments.length > 0) {
        const payment = payments[0];

        // Update memorial status based on plan type
        if (payment.memorialId) {
          if (payment.planType === 'annual') {
            // Annual subscription - set expiry to 1 year from now
            const expiryDate = new Date();
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);
            
            await db.execute(
              'UPDATE memorials SET status = ?, expiryDate = ? WHERE id = ?',
              ['active', expiryDate, payment.memorialId]
            );

            // Create subscription record
            const subscriptionId = uuidv4();
            await db.execute(
              'INSERT INTO subscriptions (id, userId, memorialId, planType, startDate, endDate, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [subscriptionId, req.user.id, payment.memorialId, payment.planType, new Date(), expiryDate, 'active']
            );
          } else if (payment.planType === 'lifetime') {
            // Lifetime with editing - no expiry, can edit
            await db.execute(
              'UPDATE memorials SET status = ?, expiryDate = NULL, canEdit = TRUE WHERE id = ?',
              ['active', payment.memorialId]
            );
          } else if (payment.planType === 'lifetime-no-edit') {
            // Lifetime without editing - no expiry, cannot edit
            await db.execute(
              'UPDATE memorials SET status = ?, expiryDate = NULL, canEdit = FALSE WHERE id = ?',
              ['active', payment.memorialId]
            );
          }
        }

        res.json({
          success: true,
          paymentId,
          memorialId: payment.memorialId,
          message: 'תשלום בוצע בהצלחה',
          redirectUrl: payment.memorialId ? `/memorial/${payment.memorialId}` : '/'
        });
      } else {
        res.status(404).json({ success: false, message: 'תשלום לא נמצא' });
      }
    } else {
      res.status(400).json({ success: false, message: 'תשלום לא הושלם' });
    }
  } catch (err) {
    console.error('Payment confirmation error:', err);
    handleDbError(err, res);
  }
});

// Get user's payments
app.get('/api/payments', checkDbReady, authenticateToken, async (req, res) => {
  try {
    await ensureDbConnection();
    const [payments] = await db.execute(
      'SELECT * FROM payments WHERE userId = ? ORDER BY createdAt DESC',
      [req.user.id]
    );

    res.json({ success: true, payments });
  } catch (err) {
    console.error('Get payments error:', err);
    handleDbError(err, res);
  }
});

// Get user's subscriptions
app.get('/api/subscriptions', checkDbReady, authenticateToken, async (req, res) => {
  try {
    await ensureDbConnection();
    const [subscriptions] = await db.execute(
      'SELECT * FROM subscriptions WHERE userId = ? AND status = ? ORDER BY endDate DESC',
      [req.user.id, 'active']
    );

    res.json({ success: true, subscriptions });
  } catch (err) {
    console.error('Get subscriptions error:', err);
    handleDbError(err, res);
  }
});

// ==================== MEMORIAL ENDPOINTS ====================

// Handle OPTIONS preflight for /api/memorials
app.options('/api/memorials', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.sendStatus(200);
});

// Create new memorial
app.post('/api/memorials', checkDbReady, optionalAuth, validateInput, upload.fields([
  { name: 'files', maxCount: 20 },
  { name: 'headerImage', maxCount: 1 }
]), async (req, res) => {
  console.log('📝📝📝 /api/memorials POST endpoint called - REQUEST RECEIVED 📝📝📝');
  console.log('📝 Request method:', req.method);
  console.log('📝 Request path:', req.path);
  console.log('📝 Request URL:', req.url);
  
  // Explicitly set CORS headers for this endpoint
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  try {
    const {
      name,
      hebrewName,
      birthDate,
      deathDate,
      biography,
      tehilimChapters,
      mishnayot,
      heroSummary = '',
      heroImageIndex
    } = req.body;
    const id = uuidv4();
    let timeline = [];

    if (req.body.timeline) {
      try {
        const parsed = JSON.parse(req.body.timeline);
        if (Array.isArray(parsed)) {
          timeline = parsed
            .slice(0, 20)
            .map(event => ({
              year: String(event.year || '').trim(),
              title: String(event.title || '').trim(),
              description: String(event.description || '').trim()
            }))
            .filter(event => event.year || event.title || event.description);
        }
      } catch (error) {
        console.warn('Failed to parse timeline payload', error);
      }
    }

    
    // Process uploaded files
    const images = [];
    const videos = [];
    let backgroundMusic = req.body.backgroundMusicPath || ''; // Allow direct path for existing music
    let heroImage = '';
    
    // Process regular files
    if (req.files && req.files.files) {
      req.files.files.forEach(file => {
        const filePath = `/${file.path.replace(/\\/g, '/')}`;
        if (file.mimetype.startsWith('video/')) {
          videos.push(filePath);
        } else if (file.mimetype.startsWith('audio/')) {
          backgroundMusic = filePath; // Only one background music file (overrides path if new file uploaded)
        } else {
          images.push(filePath);
        }
      });
    }

    // Process header image (separate upload)
    if (req.files && req.files.headerImage && req.files.headerImage.length > 0) {
      const headerFile = req.files.headerImage[0];
      heroImage = `/${headerFile.path.replace(/\\/g, '/')}`;
    } else if (heroImageIndex !== undefined && heroImageIndex !== null && heroImageIndex !== '') {
      // Fallback to heroImageIndex if headerImage not provided
      const heroIndex = Number(heroImageIndex);
      if (!Number.isNaN(heroIndex) && heroIndex >= 0 && heroIndex < images.length) {
        heroImage = images[heroIndex];
      }
    }
    
    // Generate QR Code
    // IMPORTANT: QR codes MUST always point to Netlify URL, never Railway URL
    // This is because QR codes are scanned by users who should access the frontend, not the backend API
    let baseUrl = process.env.BASE_URL;
    
    // Normalize BASE_URL if it exists
    if (baseUrl) {
      baseUrl = baseUrl.trim();
      // Remove trailing slash
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }
    }
    
    // Check various headers to detect Netlify URL
    const forwardedHost = req.get('X-Forwarded-Host') || req.get('host');
    const referer = req.get('referer') || req.get('origin') || '';
    
    // Try to extract Netlify URL from referer/origin if BASE_URL not set
    if (!baseUrl && referer) {
      try {
        const refererUrl = new URL(referer);
        if (refererUrl.hostname.includes('netlify.app')) {
          baseUrl = `${refererUrl.protocol}//${refererUrl.hostname}`;
          console.log('🔗 Detected Netlify URL from referer:', baseUrl);
        }
      } catch (e) {
        // Ignore URL parsing errors
      }
    }
    
    // Try X-Forwarded-Host header
    if (!baseUrl && forwardedHost && forwardedHost.includes('netlify.app')) {
      const protocol = req.get('X-Forwarded-Proto') || req.protocol || 'https';
      baseUrl = `${protocol}://${forwardedHost}`;
      console.log('🔗 Detected Netlify URL from X-Forwarded-Host:', baseUrl);
    }
    
    // ALWAYS use Netlify URL as fallback - NEVER use Railway URL for QR codes
    if (!baseUrl || baseUrl.includes('railway.app') || baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
      baseUrl = 'https://memoriesman.netlify.app';
      console.log('🔗 Using default Netlify URL (fallback):', baseUrl);
    }
    
    // Final validation - ensure it's Netlify URL
    if (!baseUrl.includes('netlify.app')) {
      console.log('⚠️ WARNING: baseUrl does not contain netlify.app, forcing to Netlify URL');
      baseUrl = 'https://memoriesman.netlify.app';
    }
    
    console.log('🔗 BASE_URL env var:', process.env.BASE_URL || 'NOT SET');
    console.log('🔗 Final baseUrl for QR code:', baseUrl);
    
    // CRITICAL: Ensure memorial ID is present
    if (!id) {
      console.error('❌ ERROR: No memorial ID provided for QR code generation!');
      throw new Error('Memorial ID is required for QR code generation');
    }
    
    const memorialUrl = `${baseUrl}/memorial/${id}`;
    console.log('🔗 Memorial ID:', id);
    console.log('🔗 Memorial URL for QR:', memorialUrl);
    console.log('🔗 QR Code will contain URL:', memorialUrl);
    
    // Validate URL format
    if (!memorialUrl.includes('/memorial/')) {
      console.error('❌ ERROR: Memorial URL does not contain /memorial/ path!');
      console.error('❌ URL:', memorialUrl);
      throw new Error('Invalid memorial URL format');
    }
    const qrCodePath = `qrcodes/${id}.png`;
    
    try {
      // Ensure qrcodes directory exists
      if (!fs.existsSync('qrcodes')) {
        fs.mkdirSync('qrcodes', { recursive: true });
        console.log('✅ Created qrcodes directory');
      }
    await QRCode.toFile(qrCodePath, memorialUrl);
      console.log('✅ QR Code generated successfully:', qrCodePath);
    } catch (qrError) {
      console.error('❌ Error generating QR code:', qrError);
      console.error('❌ QR Error details:', {
        message: qrError.message,
        code: qrError.code,
        stack: qrError.stack
      });
      // Don't fail the whole request if QR code fails - just log it
      // The memorial will still be created, just without QR code
    }
    
    // Save to database
    try {
      // Ensure database connection is alive before executing query
      await ensureDbConnection();
      
      // Get userId from authenticated user (if logged in)
      const userId = req.user ? req.user.id : null;

      // Set status to 'temporary' by default (48 hours expiry)
      // User can upgrade later through SaveMemorial page
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 48); // 48 hours from now

      await db.execute(`
      INSERT INTO memorials (id, userId, name, hebrewName, birthDate, deathDate, biography, images, videos, backgroundMusic, heroImage, heroSummary, timeline, tehilimChapters, mishnayot, qrCodePath, status, expiryDate, canEdit)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
      id,
      userId,
      name,
      hebrewName || '',
      birthDate || '',
      deathDate || '',
      biography || '',
      JSON.stringify(images),
      JSON.stringify(videos),
      backgroundMusic,
      heroImage,
      heroSummary,
      JSON.stringify(timeline),
      tehilimChapters || '',
      mishnayot || '',
      `/${qrCodePath}`,
      'temporary',
      expiryDate,
      true  // canEdit default for new memorials (they can upgrade later)
      ]);
    
    res.json({
      success: true,
      memorial: {
        id,
        name,
        hebrewName,
        birthDate,
        deathDate,
        biography,
        images,
        videos,
        backgroundMusic,
        heroImage,
        heroSummary,
        timeline,
        tehilimChapters,
        mishnayot: mishnayot || '',
        qrCodePath: `/${qrCodePath}`,
        url: memorialUrl,
        status: 'temporary',
        expiryDate: expiryDate.toISOString()
      },
      redirectTo: `/save/${id}` // Redirect to save page
    });
    } catch (err) {
      console.error('Error saving memorial:', err);
      // Ensure CORS headers are set on error
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      
      if (err.code === 'ER_NO_SUCH_TABLE' || err.message.includes('doesn\'t exist')) {
        return res.status(503).json({ 
          success: false, 
          error: 'Database is initializing. Please try again in a moment.' 
        });
      }
      return res.status(500).json({ success: false, error: err.message });
    }
  } catch (error) {
    console.error('❌ Error creating memorial:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      name: error.name
    });
    // Ensure CORS headers are set on error
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get memorial by ID
app.get('/api/memorials/:id', checkDbReady, optionalAuth, async (req, res) => {
  const { id } = req.params;
  
  console.log('🔍 GET /api/memorials/:id - Requested ID:', id);
  console.log('🔍 User authenticated:', !!req.user);
  if (req.user) {
    console.log('🔍 User ID:', req.user.id, 'Email:', req.user.email);
  }
  
  try {
    await ensureDbConnection();
    const [rows] = await db.execute('SELECT * FROM memorials WHERE id = ?', [id]);
    
    console.log('🔍 Found rows:', rows.length);
    
    if (rows.length === 0) {
      console.log('❌ Memorial not found for ID:', id);
      return res.status(404).json({ success: false, error: 'Memorial not found' });
    }
    
    const row = rows[0];
    console.log('✅ Memorial found:', row.name, 'Status:', row.status, 'User ID:', row.userId);
    
    // Check if memorial has expired (for temporary status)
    if (row.status === 'temporary' && row.expiryDate) {
      const expiryDate = new Date(row.expiryDate);
      const now = new Date();
      
      if (now > expiryDate) {
        return res.status(410).json({ 
          success: false, 
          error: 'Memorial expired',
          expired: true,
          message: 'דף הזיכרון פג. יש לשדרג לשמירה קבועה.'
        });
      }
    }
    
    res.json({
      success: true,
      memorial: {
        ...row,
        images: JSON.parse(row.images || '[]'),
        videos: JSON.parse(row.videos || '[]'),
        backgroundMusic: row.backgroundMusic || '',
        heroImage: row.heroImage || '',
        heroSummary: row.heroSummary || '',
        timeline: parseTimeline(row.timeline),
        mishnayot: row.mishnayot || ''
      }
    });
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE' || err.message.includes('doesn\'t exist')) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database is initializing. Please try again in a moment.' 
  });
    }
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Get all memorials (with pagination support)
app.get('/api/memorials', checkDbReady, async (req, res) => {
  // Explicitly set CORS headers for this endpoint
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  try {
    // Parse pagination parameters (optional - defaults to all results if not provided)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || null; // null = no limit (backward compatible)
    
    // Validate pagination parameters
    if (page < 1) {
      return res.status(400).json({ success: false, error: 'Page must be >= 1' });
    }
    if (limit !== null && limit < 1) {
      return res.status(400).json({ success: false, error: 'Limit must be >= 1' });
    }
    if (limit !== null && limit > 100) {
      return res.status(400).json({ success: false, error: 'Limit cannot exceed 100' });
    }
    
    // Get total count for pagination metadata
    const [countRows] = await db.execute('SELECT COUNT(*) as total FROM memorials');
    const total = countRows[0].total;
    
    let rows;
    
    if (limit !== null) {
      // Pagination is requested
      const offset = (page - 1) * limit;
      [rows] = await db.execute(
        'SELECT * FROM memorials ORDER BY createdAt DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
    } else {
      // No pagination - return all (backward compatible)
      [rows] = await db.execute('SELECT * FROM memorials ORDER BY createdAt DESC');
    }
    
    const memorials = rows.map(row => ({
      ...row,
      images: JSON.parse(row.images || '[]'),
      videos: JSON.parse(row.videos || '[]'),
      backgroundMusic: row.backgroundMusic || '',
      heroImage: row.heroImage || '',
      heroSummary: row.heroSummary || '',
      timeline: parseTimeline(row.timeline)
    }));
    
    // Build response
    const response = {
      success: true,
      memorials
    };
    
    // Add pagination metadata if pagination is used
    if (limit !== null) {
      response.pagination = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      };
    }
    
    res.json(response);
  } catch (err) {
    // Ensure CORS headers are set on error
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    if (err.code === 'ER_NO_SUCH_TABLE' || err.message.includes('doesn\'t exist')) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database is initializing. Please try again in a moment.' 
      });
    }
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Delete all old test memorials (with no userId) - for admin only
app.delete('/api/memorials/cleanup/test', checkDbReady, authenticateToken, async (req, res) => {
  try {
    // Only admin can cleanup test memorials
    if (!isAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'רק מנהל יכול למחוק דפי בדיקה ישנים' });
    }
    
    await ensureDbConnection();
    
    // Delete all memorials where userId is NULL (old test memorials)
    const [result] = await db.execute('DELETE FROM memorials WHERE userId IS NULL OR userId = ""');
    
    const deletedCount = result.affectedRows || 0;
    
    res.json({ 
      success: true, 
      message: `נמחקו ${deletedCount} דפי בדיקה ישנים`,
      deletedCount: deletedCount
    });
  } catch (err) {
    console.error('Error cleaning up test memorials:', err);
    handleDbError(err, res);
  }
});

// Get all memorials for the authenticated user (or all for admin)
app.get('/api/memorials/user/my', checkDbReady, authenticateToken, async (req, res) => {
  try {
    await ensureDbConnection();
    
    let rows;
    
    // If user is admin, show ALL memorials (including old ones without userId)
    if (isAdmin(req.user)) {
      console.log('🔍 Admin requesting memorials - returning ALL memorials');
      [rows] = await db.execute(
        'SELECT * FROM memorials ORDER BY createdAt DESC'
      );
    } else {
      // Regular user - get memorials linked to their userId
      // Also include memorials from localStorage IDs if provided
      let memorialIds = [];
      try {
        if (req.query.ids) {
          memorialIds = JSON.parse(decodeURIComponent(req.query.ids));
        }
      } catch (parseErr) {
        console.warn('Failed to parse memorial IDs from query:', parseErr);
      }
      
      let query;
      let params;
      
      if (memorialIds && Array.isArray(memorialIds) && memorialIds.length > 0) {
        // Include both userId-linked memorials AND memorials from localStorage IDs
        const placeholders = memorialIds.map(() => '?').join(',');
        query = `SELECT * FROM memorials WHERE userId = ? OR id IN (${placeholders}) ORDER BY createdAt DESC`;
        params = [req.user.id, ...memorialIds];
      } else {
        // Only userId-linked memorials
        query = 'SELECT * FROM memorials WHERE userId = ? ORDER BY createdAt DESC';
        params = [req.user.id];
      }
      
      [rows] = await db.execute(query, params);
    }
    
    const memorials = rows.map(row => ({
      id: row.id,
      name: row.name,
      hebrewName: row.hebrewName,
      status: row.status,
      expiryDate: row.expiryDate,
      canEdit: row.canEdit,
      createdAt: row.createdAt,
      qrCodePath: row.qrCodePath,
      userId: row.userId // Include userId so we can show which are old test memorials
    }));
    
    res.json({ success: true, memorials });
  } catch (err) {
    console.error('Error fetching user memorials:', err);
    handleDbError(err, res);
  }
});

// Link memorials to current user account (for temporary memorials created before login)
app.post('/api/memorials/link-to-user', checkDbReady, authenticateToken, async (req, res) => {
  try {
    const { memorialIds } = req.body;
    
    if (!memorialIds || !Array.isArray(memorialIds) || memorialIds.length === 0) {
      return res.status(400).json({ success: false, error: 'memorialIds array required' });
    }
    
    await ensureDbConnection();
    
    // Update memorials to link them to current user
    // Only update if they don't already have a userId (temporary memorials)
    const placeholders = memorialIds.map(() => '?').join(',');
    const [result] = await db.execute(
      `UPDATE memorials SET userId = ? WHERE id IN (${placeholders}) AND (userId IS NULL OR userId = '')`,
      [req.user.id, ...memorialIds]
    );
    
    console.log(`✅ Linked ${result.affectedRows} memorial(s) to user ${req.user.id}`);
    
    res.json({ 
      success: true, 
      linkedCount: result.affectedRows,
      message: `Linked ${result.affectedRows} memorial(s) to your account`
    });
  } catch (err) {
    console.error('Error linking memorials to user:', err);
    handleDbError(err, res);
  }
});

// Regenerate QR code for existing memorial
app.post('/api/memorials/:id/regenerate-qr', checkDbReady, authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await ensureDbConnection();
    
    // Get memorial
    const [rows] = await db.execute('SELECT * FROM memorials WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Memorial not found' });
    }
    
    const memorial = rows[0];
    
    // Check if user owns this memorial or is admin
    if (memorial.userId !== req.user.id && !isAdmin(req.user)) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    
    // Generate new QR code with correct URL
    // IMPORTANT: QR codes MUST always point to Netlify URL, never Railway URL
    let baseUrl = process.env.BASE_URL;
    
    // Normalize BASE_URL if it exists
    if (baseUrl) {
      baseUrl = baseUrl.trim();
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }
    }
    
    // Check various headers to detect Netlify URL
    const forwardedHost = req.get('X-Forwarded-Host') || req.get('host');
    const referer = req.get('referer') || req.get('origin') || '';
    
    // Try to extract Netlify URL from referer/origin if BASE_URL not set
    if (!baseUrl && referer) {
      try {
        const refererUrl = new URL(referer);
        if (refererUrl.hostname.includes('netlify.app')) {
          baseUrl = `${refererUrl.protocol}//${refererUrl.hostname}`;
        }
      } catch (e) {
        // Ignore URL parsing errors
      }
    }
    
    // Try X-Forwarded-Host header
    if (!baseUrl && forwardedHost && forwardedHost.includes('netlify.app')) {
      const protocol = req.get('X-Forwarded-Proto') || req.protocol || 'https';
      baseUrl = `${protocol}://${forwardedHost}`;
    }
    
    // ALWAYS use Netlify URL as fallback - NEVER use Railway URL for QR codes
    if (!baseUrl || baseUrl.includes('railway.app') || baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
      baseUrl = 'https://memoriesman.netlify.app';
    }
    
    // Final validation - ensure it's Netlify URL
    if (!baseUrl.includes('netlify.app')) {
      baseUrl = 'https://memoriesman.netlify.app';
    }
    
    const memorialUrl = `${baseUrl}/memorial/${id}`;
    const qrCodePath = `qrcodes/${id}.png`;
    
    try {
      // Ensure qrcodes directory exists
      if (!fs.existsSync('qrcodes')) {
        fs.mkdirSync('qrcodes', { recursive: true });
      }
      
      // Generate new QR code
      await QRCode.toFile(qrCodePath, memorialUrl);
      console.log('✅ QR Code regenerated successfully:', qrCodePath);
      
      // Update database
      await db.execute(
        'UPDATE memorials SET qrCodePath = ? WHERE id = ?',
        [`/${qrCodePath}`, id]
      );
      
      res.json({
        success: true,
        qrCodePath: `/${qrCodePath}`,
        url: memorialUrl,
        message: 'QR Code נוצר מחדש בהצלחה'
      });
    } catch (qrError) {
      console.error('❌ Error regenerating QR code:', qrError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to regenerate QR code',
        details: qrError.message 
      });
    }
  } catch (err) {
    console.error('Error regenerating QR code:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Helper function to check if user is admin
const isAdmin = (user) => {
  if (!user || !user.email) {
    console.log('❌ isAdmin check: No user or email');
    return false;
  }
  // Normalize email for comparison (lowercase and trim)
  const normalizedUserEmail = user.email.toLowerCase().trim();
  const adminEmail = 'a0534166556@gmail.com';
  const isAdminResult = normalizedUserEmail === adminEmail;
  console.log('🔍 isAdmin check - User email:', user.email, 'Normalized:', normalizedUserEmail, 'Admin email:', adminEmail, 'Result:', isAdminResult);
  return isAdminResult;
};

// Delete memorial (users can delete their own, admin can delete any)
app.delete('/api/memorials/:id', checkDbReady, authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await ensureDbConnection();
    
    // Check if memorial exists
    const [memorialRows] = await db.execute('SELECT * FROM memorials WHERE id = ?', [id]);
    
    if (memorialRows.length === 0) {
      return res.status(404).json({ success: false, message: 'דף זיכרון לא נמצא' });
    }
    
    const memorial = memorialRows[0];
    
    // Admin can delete any memorial, regular users can only delete their own
    if (!isAdmin(req.user)) {
      // Regular user - check if memorial belongs to them
      // Also check localStorage IDs for temporary memorials created before login
      const myMemorialIds = JSON.parse(req.headers['x-memorial-ids'] || '[]');
      const isOwnMemorial = memorial.userId === req.user.id || myMemorialIds.includes(id);
      
      if (!isOwnMemorial) {
        return res.status(403).json({ 
          success: false, 
          message: 'אין לך הרשאה למחוק את דף הזיכרון הזה. אתה יכול למחוק רק את הדפים שיצרת.' 
        });
      }
    }
    
    // Delete memorial from database
    await db.execute('DELETE FROM memorials WHERE id = ?', [id]);
    
    // Remove from localStorage if it's there
    // This will be handled on frontend, but we log it here for debugging
    console.log(`✅ Deleted memorial ${id} by user ${req.user.id} (admin: ${isAdmin(req.user)})`);
    
    // TODO: Optionally delete files from disk (images, videos, QR codes)
    // For now, just delete from database
    
    res.json({ success: true, message: 'דף הזיכרון נמחק בהצלחה' });
  } catch (err) {
    console.error('Error deleting memorial:', err);
    handleDbError(err, res);
  }
});

// Update existing memorial
app.put('/api/memorials/:id', checkDbReady, authenticateToken, validateInput, upload.fields([
  { name: 'files', maxCount: 20 },
  { name: 'headerImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const { id } = req.params;
    await ensureDbConnection();
    
    // Verify memorial belongs to user and can be edited
    // Also check localStorage IDs for temporary memorials created before login
    const myMemorialIds = req.headers['x-memorial-ids'] ? JSON.parse(req.headers['x-memorial-ids']) : [];
    const [memorialRows] = await db.execute('SELECT * FROM memorials WHERE id = ?', [id]);
    
    if (memorialRows.length === 0) {
      return res.status(404).json({ success: false, message: 'דף זיכרון לא נמצא' });
    }
    
    const memorial = memorialRows[0];
    
    // Check if user owns this memorial (either by userId or localStorage ID)
    // Admin can edit any memorial
    if (!isAdmin(req.user)) {
      const isOwnMemorial = memorial.userId === req.user.id || myMemorialIds.includes(id);
      
      if (!isOwnMemorial) {
        return res.status(403).json({ 
          success: false, 
          message: 'אין לך הרשאה לערוך את דף הזיכרון הזה. אתה יכול לערוך רק את הדפים שיצרת.' 
        });
      }
    }
    
    const existingMemorial = memorialRows[0];
    
    // Check if editing is allowed
    if (!existingMemorial.canEdit) {
      return res.status(403).json({ success: false, message: 'אין אפשרות לערוך את דף הזיכרון הזה' });
    }
    
    // Link temporary memorial to user account if it's not already linked
    if (!existingMemorial.userId && !isAdmin(req.user)) {
      await db.execute('UPDATE memorials SET userId = ? WHERE id = ?', [req.user.id, id]);
      console.log(`✅ Auto-linked temporary memorial ${id} to user ${req.user.id}`);
    }
    
    const {
      name,
      hebrewName,
      birthDate,
      deathDate,
      biography,
      tehilimChapters,
      mishnayot,
      heroSummary = '',
      heroImageIndex
    } = req.body;
    
    let timeline = [];
    if (req.body.timeline) {
      try {
        const parsed = JSON.parse(req.body.timeline);
        if (Array.isArray(parsed)) {
          timeline = parsed
            .slice(0, 20)
            .map(event => ({
              year: String(event.year || '').trim(),
              title: String(event.title || '').trim(),
              description: String(event.description || '').trim()
            }))
            .filter(event => event.year || event.title || event.description);
        }
      } catch (error) {
        console.warn('Failed to parse timeline payload', error);
      }
    }
    
    // Process uploaded files
    let images = JSON.parse(existingMemorial.images || '[]');
    let videos = JSON.parse(existingMemorial.videos || '[]');
    let backgroundMusic = req.body.backgroundMusicPath || existingMemorial.backgroundMusic || '';
    let heroImage = existingMemorial.heroImage || '';
    
    // Process regular files
    if (req.files && req.files.files) {
      req.files.files.forEach(file => {
        const filePath = `/${file.path.replace(/\\/g, '/')}`;
        if (file.mimetype.startsWith('video/')) {
          videos.push(filePath);
        } else if (file.mimetype.startsWith('audio/')) {
          backgroundMusic = filePath;
        } else {
          images.push(filePath);
        }
      });
    }
    
    // Process header image
    if (req.files && req.files.headerImage && req.files.headerImage.length > 0) {
      heroImage = `/${req.files.headerImage[0].path.replace(/\\/g, '/')}`;
    } else if (heroImageIndex !== undefined && heroImageIndex !== null && images[heroImageIndex]) {
      heroImage = images[parseInt(heroImageIndex)];
    }
    
    // Update database
    await db.execute(`
      UPDATE memorials 
      SET name = ?, hebrewName = ?, birthDate = ?, deathDate = ?, biography = ?, 
          images = ?, videos = ?, backgroundMusic = ?, heroImage = ?, heroSummary = ?, 
          timeline = ?, tehilimChapters = ?, mishnayot = ?
      WHERE id = ? AND userId = ?
    `, [
      name,
      hebrewName || '',
      birthDate || '',
      deathDate || '',
      biography || '',
      JSON.stringify(images),
      JSON.stringify(videos),
      backgroundMusic,
      heroImage,
      heroSummary,
      JSON.stringify(timeline),
      tehilimChapters || '',
      mishnayot || '',
      id,
      req.user.id
    ]);
    
    res.json({
      success: true,
      message: 'דף הזיכרון עודכן בהצלחה'
    });
  } catch (err) {
    console.error('Error updating memorial:', err);
    handleDbError(err, res);
  }
});

// Upload additional files to existing memorial
app.post('/api/memorials/:id/upload', checkDbReady, validateInput, upload.array('files', 10), async (req, res) => {
  const { id } = req.params;
  
  try {
    const [rows] = await db.execute('SELECT * FROM memorials WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Memorial not found' });
    }
    
    const row = rows[0];
    const existingImages = JSON.parse(row.images || '[]');
    const existingVideos = JSON.parse(row.videos || '[]');
    let backgroundMusic = row.backgroundMusic || '';
    
    req.files.forEach(file => {
      const filePath = `/${file.path.replace(/\\/g, '/')}`;
      if (file.mimetype.startsWith('video/')) {
        existingVideos.push(filePath);
      } else if (file.mimetype.startsWith('audio/')) {
        backgroundMusic = filePath;
      } else {
        existingImages.push(filePath);
      }
    });
    
    await db.execute(
      'UPDATE memorials SET images = ?, videos = ?, backgroundMusic = ? WHERE id = ?',
      [JSON.stringify(existingImages), JSON.stringify(existingVideos), backgroundMusic, id]
    );
    
    res.json({ success: true, images: existingImages, videos: existingVideos, backgroundMusic });
  } catch (err) {
          return res.status(500).json({ success: false, error: err.message });
        }
});

// Add condolence message
app.post('/api/memorials/:id/condolences', checkDbReady, validateInput, async (req, res) => {
  const { id } = req.params;
  let { name, message } = req.body;
  
  // Additional validation and sanitization
  if (name && typeof name === 'string') {
    name = name.trim().substring(0, 100);
  }
  if (message && typeof message === 'string') {
    message = message.trim().substring(0, 2000);
  }

  if (!name || !message) {
    return res.status(400).json({ success: false, error: 'שם והודעה נדרשים' });
  }

  try {
  const condolenceId = uuidv4();
    await db.execute(
    'INSERT INTO condolences (id, memorialId, name, message, approved) VALUES (?, ?, ?, ?, ?)',
      [condolenceId, id, name, message, 1] // 1 = approved (appear immediately)
    );
    res.json({ success: true, condolence: { id: condolenceId, name, message, approved: true } });
  } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
});

// Get condolences for a memorial (only approved)
app.get('/api/memorials/:id/condolences', checkDbReady, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.execute(
    'SELECT id, name, message, createdAt FROM condolences WHERE memorialId = ? AND approved = 1 ORDER BY createdAt DESC',
      [id]
    );
      res.json({ success: true, condolences: rows || [] });
  } catch (err) {
    return handleDbError(err, res);
    }
});

// Light a virtual candle
app.post('/api/memorials/:id/candles', checkDbReady, async (req, res) => {
  const { id } = req.params;
  const { litBy, visitorId } = req.body;

  if (!visitorId) {
    return res.status(400).json({ success: false, error: 'נדרש מזהה מבקר' });
  }

  try {
  // Check if this visitor already lit a candle
    const [existing] = await db.execute(
    'SELECT id FROM candles WHERE memorialId = ? AND visitorId = ?',
      [id, visitorId]
    );
    
    if (existing.length > 0) {
        // Visitor already lit a candle
        return res.status(400).json({ 
          success: false, 
          error: 'כבר הדלקת נר זיכרון לדף זה',
          alreadyLit: true 
        });
      }

      // Create new candle
      const candleId = uuidv4();
    await db.execute(
        'INSERT INTO candles (id, memorialId, litBy, visitorId) VALUES (?, ?, ?, ?)',
      [candleId, id, litBy || 'אנונימי', visitorId]
    );
    
          // Get all candles for this memorial
    const [rows] = await db.execute(
            'SELECT id, litBy, createdAt FROM candles WHERE memorialId = ? ORDER BY createdAt DESC',
      [id]
    );
    
              res.json({ success: true, candles: rows || [], candleCount: rows.length });
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE' || err.message.includes('doesn\'t exist')) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database is initializing. Please try again in a moment.' 
      });
    }
    return handleDbError(err, res);
  }
});

// Get candles for a memorial
app.get('/api/memorials/:id/candles', checkDbReady, async (req, res) => {
  const { id } = req.params;
  const { visitorId } = req.query;
  
  try {
  // Get all candles
    const [rows] = await db.execute(
    'SELECT id, litBy, createdAt FROM candles WHERE memorialId = ? ORDER BY createdAt DESC',
      [id]
    );
      
      // Check if visitor already lit a candle
      let hasLitCandle = false;
      if (visitorId) {
      try {
        const [visitorCandles] = await db.execute(
          'SELECT id FROM candles WHERE memorialId = ? AND visitorId = ?',
          [id, visitorId]
        );
        hasLitCandle = visitorCandles.length > 0;
      } catch (err) {
        // If table doesn't exist, just return empty result
        if (err.code === 'ER_NO_SUCH_TABLE' || err.message.includes('doesn\'t exist')) {
          return res.json({ 
          success: true, 
          candles: rows || [], 
          candleCount: rows.length,
          hasLitCandle: false 
        });
      }
        return handleDbError(err, res);
      }
    }
    
    res.json({ 
      success: true, 
      candles: rows || [], 
      candleCount: rows.length,
      hasLitCandle 
    });
  } catch (err) {
    return handleDbError(err, res);
  }
});

// Handle OPTIONS preflight for /api/music
app.options('/api/music', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.sendStatus(200);
});

// Get list of available background music files
app.get('/api/music', (req, res) => {
  console.log('📻📻📻 /api/music endpoint called - REQUEST RECEIVED 📻📻📻');
  console.log('📻 Request method:', req.method);
  console.log('📻 Request path:', req.path);
  console.log('📻 Request URL:', req.url);
  // Explicitly set CORS headers for this endpoint
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  try {
    const audioDir = path.join(__dirname, 'uploads', 'audio');
    console.log('📁 Audio directory:', audioDir);
    if (!fs.existsSync(audioDir)) {
      console.log('📁 Audio directory does not exist, returning empty array');
      return res.json({ success: true, musicFiles: [] });
    }

    const files = fs.readdirSync(audioDir)
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.mp3', '.wav', '.m4a', '.ogg', '.aac'].includes(ext);
      })
      .map(file => ({
        name: file,
        path: `/uploads/audio/${file}`,
        displayName: path.basename(file, path.extname(file))
      }));

    console.log('✅ Found', files.length, 'music files');
    res.json({ success: true, musicFiles: files });
  } catch (error) {
    console.error('❌ Error reading music files:', error);
    console.error('❌ Error stack:', error.stack);
    // Ensure CORS headers are set on error
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    // Return error response instead of empty array
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Error reading music files',
      musicFiles: [] 
    });
  }
});

// Global error handler for database errors
process.on('uncaughtException', (error) => {
  if ((error.code === 'ER_NO_SUCH_TABLE' || error.code === 'SQLITE_ERROR') && error.message && (error.message.includes('doesn\'t exist') || error.message.includes('no such table'))) {
    console.error('Database table not found:', error.message);
    console.error('This is OK during startup - database is still initializing');
    // Don't crash - let the server continue
    return;
  }
  console.error('Uncaught Exception:', error);
  // Only exit for critical errors
  if (error.code !== 'ER_NO_SUCH_TABLE' && error.code !== 'SQLITE_ERROR') {
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  if (reason && (reason.code === 'ER_NO_SUCH_TABLE' || reason.code === 'SQLITE_ERROR') && reason.message && (reason.message.includes('doesn\'t exist') || reason.message.includes('no such table'))) {
    console.error('Database table not found (unhandled rejection):', reason.message);
    console.error('This is OK during startup - database is still initializing');
    return;
  }
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 404 handler for API routes - MUST be after all specific API routes but before frontend catch-all
// NOTE: This should NOT catch /api/music or /api/memorials because they're defined above
app.all('/api/*', (req, res, next) => {
  // Check if this is a known route that should have been handled
  if ((req.path === '/api/music' && req.method === 'GET') || 
      (req.path === '/api/memorials' && (req.method === 'POST' || req.method === 'GET'))) {
    console.log(`⚠️ WARNING: ${req.method} ${req.path} should have been handled by specific handler!`);
    console.log(`⚠️ Calling next() to continue to actual handler`);
    // Don't return 404, let it continue to the actual handler
    return next();
  }
  
  console.log('❌ 404 - API route not found:', req.method, req.path);
  console.log('❌ All registered routes should be above this handler');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.status(404).json({ 
    success: false, 
    error: 'API endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Serve frontend build in production - MUST be after all API routes
if (NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../frontend/dist');
  if (fs.existsSync(frontendPath)) {
    // Only serve static files, not API routes
    app.use(express.static(frontendPath, {
      // Don't serve index.html for API routes
      index: false
    }));
    // Handle React Router - serve index.html for all routes (except API routes)
    app.get('*', (req, res, next) => {
      // Skip API routes, uploads, and qrcodes - they should be handled by API routes above
      if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/qrcodes')) {
        return next(); // Let Express continue to next route handler (should be 404 if no route matches)
      }
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
  }
}

