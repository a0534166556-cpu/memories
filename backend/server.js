// Load environment variables from .env file (for local development only)
// This must be at the very top, before any other imports
// Only load .env in development mode - Railway has its own environment variables
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config();
    console.log('📁 Loaded .env file for local development');
  } catch (err) {
    // dotenv not available or .env file not found - that's OK
    console.log('ℹ️  No .env file found (this is OK in production)');
  }
}

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// אחסון קבוע: ב-Railway הוסף Volume למשאב memories, Mount Path: /app/data. משתמש ב-RAILWAY_VOLUME_MOUNT_PATH (אוטומטי) או STORAGE_PATH
const STORAGE_PATH = (process.env.RAILWAY_VOLUME_MOUNT_PATH || process.env.STORAGE_PATH || '').trim();
if (STORAGE_PATH) {
  console.log('📁 Persistent storage enabled:', STORAGE_PATH);
}
function storageDir(...segments) {
  return path.join(STORAGE_PATH, ...segments);
}
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Cloudinary (optional – תמונות/וידאו/אודיו בענן)
let cloudinary = null;
const CLOUDINARY_CLOUD = (process.env.CLOUDINARY_CLOUD_NAME || '').trim();
const CLOUDINARY_KEY = (process.env.CLOUDINARY_API_KEY || '').trim();
const CLOUDINARY_SECRET = (process.env.CLOUDINARY_API_SECRET || '').trim();
if (CLOUDINARY_CLOUD && CLOUDINARY_KEY && CLOUDINARY_SECRET) {
  cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD,
    api_key: CLOUDINARY_KEY,
    api_secret: CLOUDINARY_SECRET
  });
  console.log('☁️ Cloudinary enabled – media will be stored in the cloud');
}

async function uploadToCloudinary(file, folder = 'memorials') {
  if (!cloudinary || !file.buffer) throw new Error('Cloudinary not configured or no file buffer');
  const resourceType = file.mimetype.startsWith('video/') ? 'video' : (file.mimetype.startsWith('image/') ? 'image' : 'raw');
  return new Promise((resolve, reject) => {
    const opts = { resource_type: resourceType, folder, public_id: uuidv4() };
    const stream = cloudinary.uploader.upload_stream(opts, (err, result) => {
      if (err) return reject(err);
      resolve(result.secure_url);
    });
    stream.end(file.buffer);
  });
}

async function getFileUrl(file) {
  if (cloudinary && file.buffer) return await uploadToCloudinary(file);
  return `/${file.path.replace(/\\/g, '/')}`;
}

// הגבלת מדיה למסלולים בתשלום (לכל דף יש media_limit_bytes; ברירת מחדל 1GB)
const DEFAULT_MEDIA_LIMIT_1GB = 1 * 1024 * 1024 * 1024;
const MEDIA_LIMIT_3GB = 3 * 1024 * 1024 * 1024;
function getMemorialMediaLimitBytes(row) {
  if (!row || row.status === 'temporary') return 0;
  const limit = Number(row.media_limit_bytes);
  return Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_MEDIA_LIMIT_1GB;
}
function getFileSize(file) {
  try {
    if (file.size != null && !Number.isNaN(Number(file.size))) return Number(file.size);
    if (file.buffer && file.buffer.length) return Number(file.buffer.length);
    if (file.path && fs.existsSync(file.path)) return fs.statSync(file.path).size;
  } catch (e) {
    console.warn('getFileSize failed:', e.message);
  }
  return 0;
}

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

// כתובת דף הזיכרון (הפרונט) – תמיד Netlify, כדי שסריקת ה-QR תפתח תמיד את הדף
const MEMORIAL_PAGE_BASE_URL = 'https://memoriesman.netlify.app';
function getMemorialPageUrl(memorialId) {
  return `${MEMORIAL_PAGE_BASE_URL}/memorial/${memorialId}`;
}

// Middleware
// CORS configuration - Add headers to ALL responses
app.use((req, res, next) => {
  // Log all API requests for debugging (only in development)
  if (req.path.startsWith('/api') && process.env.NODE_ENV === 'development') {
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

// Rate limiting for auth and sensitive endpoints (per IP)
const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: { success: false, message: 'יותר מדי ניסיונות. נסה שוב בעוד 15 דקות.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Health check for Railway/monitoring (no DB required)
app.get('/api/health', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    db: dbReady ? 'connected' : 'not_ready'
  });
});

// Serve static files with CORS headers
const staticOptions = {
  setHeaders: (res, path) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  }
};

app.use('/uploads', express.static(storageDir('uploads') || path.join(__dirname, 'uploads'), staticOptions));

// QR codes: אם הקובץ לא קיים (למשל אחרי deploy ב-Railway), יוצרים את ה-QR דינמית
app.get('/qrcodes/:filename', async (req, res) => {
  const filename = req.params.filename;
  if (!filename || !filename.endsWith('.png')) {
    return res.status(404).end();
  }
  const id = filename.replace(/\.png$/, '');
  const filePath = storageDir('qrcodes', filename);
  if (fs.existsSync(filePath)) {
    return res.sendFile(path.resolve(filePath));
  }
  try {
    const memorialUrl = getMemorialPageUrl(id);
    const buffer = await QRCode.toBuffer(memorialUrl, { type: 'png' });
    const qrDir = storageDir('qrcodes');
    if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });
    fs.writeFileSync(filePath, buffer);
    res.contentType('image/png').send(buffer);
  } catch (err) {
    console.error('QR generate on-demand error:', err.message);
    res.status(500).end();
  }
});
app.use('/qrcodes', express.static(storageDir('qrcodes') || path.join(__dirname, 'qrcodes'), staticOptions));

// Note: Frontend static files will be served at the end, after all API routes

// Create directories if they don't exist (תומך ב-STORAGE_PATH לאחסון קבוע)
[storageDir('uploads', 'images'), storageDir('uploads', 'videos'), storageDir('uploads', 'audio'), storageDir('qrcodes')].forEach(dir => {
  if (dir && !fs.existsSync(dir)) {
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
    // If still no connection after retry, throw error
    if (!db) {
      throw new Error('Database connection failed. Please check your MySQL settings and make sure MySQL is running.');
    }
    return;
  }
  
  try {
    // Try a simple query to check if connection is alive
    await db.execute('SELECT 1');
    return; // Connection is alive
  } catch (err) {
    const errMsg = err.message || '';
    const shouldReconnect = 
      errMsg.includes('closed state') || 
      errMsg.includes('PROTOCOL_CONNECTION_LOST') ||
      errMsg.includes('disconnected by the server') ||
      errMsg.includes('inactivity') ||
      err.code === 'PROTOCOL_CONNECTION_LOST' ||
      err.code === 'ECONNRESET';
    
    if (shouldReconnect) {
      console.error('❌ Database connection is closed/lost, reconnecting...', err.message);
      db = null;
      // אל תגדיר dbReady = false – כדי שהבקשה הבאה או ה־keep-alive יוכלו לנסות שוב
      retryCount = 0; // Reset retry count for reconnection
      await initDatabaseConnection();
      // If still no connection after retry, throw error
      if (!db) {
        throw new Error('Database reconnection failed. Please check your MySQL settings and make sure MySQL is running.');
      }
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
    
    // נסה להגדיל טיימאאוט של הסשן כדי לצמצם ניתוקים מחוסר פעילות
    try {
      await db.execute('SET SESSION wait_timeout = 28800');
      await db.execute('SET SESSION interactive_timeout = 28800');
      console.log('✅ MySQL session timeouts set to 8 hours');
    } catch (e) {
      console.log('⚠️ Could not set MySQL timeouts:', e.message);
    }
    
    // Handle connection errors and reconnection
    db.on('error', async (err) => {
      console.error('❌ MySQL connection error:', err.message);
      const errMsg = err.message || '';
      const shouldReconnect = 
        err.code === 'PROTOCOL_CONNECTION_LOST' || 
        err.code === 'ECONNRESET' ||
        errMsg.includes('disconnected by the server') ||
        errMsg.includes('inactivity');
      
      if (shouldReconnect) {
        console.log('🔄 Connection lost (timeout/inactivity), will reconnect on next query...');
        db = null;
        // אל תגדיר dbReady = false – אחרת כל הבקשות מקבלות 503 ואף אחת לא מגיעה ל־ensureDbConnection שמתחבר מחדש
      }
    });
    
    // Enable foreign keys (MySQL uses different syntax)
    await db.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Foreign keys enabled');
    
    // Initialize database tables
    await initDatabase();
    console.log('✅ Database initialization successful');
    dbReady = true;
    console.log('✅ Database ready - all endpoints available');
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

// Keep-alive: כל 5 דקות – אם יש חיבור שולחים SELECT 1; אם אין (db null) מנסים להתחבר מחדש
setInterval(async () => {
  try {
    await ensureDbConnection();
  } catch (err) {
    console.error('❌ DB keep-alive failed:', err.message);
  }
}, 5 * 60 * 1000);

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
    
    // Add location columns if they don't exist (for existing tables)
    try {
      await db.execute(`ALTER TABLE memorials ADD COLUMN cemeteryName VARCHAR(255)`);
      console.log('✅ Added cemeteryName column to memorials');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ cemeteryName column already exists in memorials');
      } else {
        throw err;
      }
    }
    
    try {
      await db.execute(`ALTER TABLE memorials ADD COLUMN cemeteryAddress VARCHAR(500)`);
      console.log('✅ Added cemeteryAddress column to memorials');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ cemeteryAddress column already exists in memorials');
      } else {
        throw err;
      }
    }
    
    try {
      await db.execute(`ALTER TABLE memorials ADD COLUMN latitude DECIMAL(10, 8)`);
      console.log('✅ Added latitude column to memorials');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ latitude column already exists in memorials');
      } else {
        throw err;
      }
    }
    
    try {
      await db.execute(`ALTER TABLE memorials ADD COLUMN longitude DECIMAL(11, 8)`);
      console.log('✅ Added longitude column to memorials');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ longitude column already exists in memorials');
      } else {
        throw err;
      }
    }
    try {
      await db.execute(`ALTER TABLE memorials ADD COLUMN media_used_bytes BIGINT DEFAULT 0`);
      console.log('✅ Added media_used_bytes column to memorials');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ media_used_bytes column already exists in memorials');
      } else {
        throw err;
      }
    }
    try {
      await db.execute(`ALTER TABLE memorials ADD COLUMN media_limit_bytes BIGINT NULL`);
      console.log('✅ Added media_limit_bytes column to memorials');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ media_limit_bytes column already exists in memorials');
      } else {
        throw err;
      }
    }
    try {
      await db.execute(`ALTER TABLE memorials ADD COLUMN maintenance_paid_until DATETIME NULL`);
      console.log('✅ Added maintenance_paid_until column to memorials');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ maintenance_paid_until column already exists in memorials');
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
    try {
      await db.execute(`ALTER TABLE payments ADD COLUMN additional_gb INT NULL`);
      console.log('✅ Added additional_gb column to payments');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ additional_gb column already exists in payments');
      } else {
        throw err;
      }
    }

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

    // Create password_reset_tokens table for forgot-password flow
    await db.execute(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token VARCHAR(255) PRIMARY KEY,
      userId VARCHAR(255) NOT NULL,
      expiresAt DATETIME NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )`);
    console.log('✅ Password reset tokens table ready');

    // Memorial reminders (yahrzeit – תזכורת ביום הפטירה + 10 ימים לפני)
    await db.execute(`CREATE TABLE IF NOT EXISTS memorial_reminders (
      id VARCHAR(36) PRIMARY KEY,
      memorialId VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      remindOnDay INT DEFAULT 1,
      remind10DaysBefore INT DEFAULT 0,
      lastSentYear INT NULL,
      lastSentYear10 INT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_memorial_email (memorialId, email),
      FOREIGN KEY (memorialId) REFERENCES memorials(id) ON DELETE CASCADE
    )`);
    try { await db.execute('ALTER TABLE memorial_reminders ADD COLUMN remindOnDay INT DEFAULT 1'); } catch (e) { if (e.code !== 'ER_DUP_FIELDNAME' && e.errno !== 1060) throw e; }
    try { await db.execute('ALTER TABLE memorial_reminders ADD COLUMN remind10DaysBefore INT DEFAULT 0'); } catch (e) { if (e.code !== 'ER_DUP_FIELDNAME' && e.errno !== 1060) throw e; }
    try { await db.execute('ALTER TABLE memorial_reminders ADD COLUMN lastSentYear10 INT NULL'); } catch (e) { if (e.code !== 'ER_DUP_FIELDNAME' && e.errno !== 1060) throw e; }
    console.log('✅ Memorial reminders table ready');
    
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
    if (NODE_ENV === 'development') {
      console.log(`\n🌐 Local Development URLs:`);
      console.log(`   Backend API: http://localhost:${PORT}`);
      console.log(`   Frontend: http://localhost:3000`);
      console.log(`   → Open http://localhost:3000 in your browser\n`);
    } else if (NODE_ENV === 'production') {
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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (!err) {
    return res.status(500).json({ success: false, error: 'Database error' });
  }

  const code = err.code || '';
  const msg = (err.message || '').toLowerCase();

  const dbUnavailable = [
    'ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN',
    'PROTOCOL_CONNECTION_LOST', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR',
    'ER_DBACCESS_DENIED_ERROR', 'ER_CON_COUNT_ERROR'
  ].includes(code) || msg.includes('connection') || msg.includes('connect econnrefused');

  if (err.code === 'ER_NO_SUCH_TABLE' || err.code === 'SQLITE_ERROR' ||
      (msg.includes('doesn\'t exist') || msg.includes('no such table'))) {
    return res.status(503).json({
      success: false,
      error: 'Database is initializing. Please try again in a moment.',
      message: 'מסד הנתונים מאותחל. נסה שוב בעוד רגע.'
    });
  }

  if (dbUnavailable) {
    return res.status(503).json({
      success: false,
      error: 'Database unavailable.',
      message: 'מסד הנתונים לא זמין. בדוק ש-MySQL רץ והגדרות ב-.env נכונות (או השתמש במסד של Railway – ראה env.example).'
    });
  }

  return res.status(500).json({ success: false, error: err.message || 'Database error' });
}

// MySQL doesn't need ensureColumn - all columns are created with the table

// Configure multer: memory when Cloudinary is used (buffer → cloud), disk otherwise
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|webm|mp3|wav|m4a|ogg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype) || file.mimetype.startsWith('audio/');
  if (mimetype && extname) return cb(null, true);
  cb(new Error('Only images, videos and audio files are allowed!'));
};

const memoryStorage = multer.memoryStorage();
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = storageDir('uploads', 'images');
    if (file.mimetype.startsWith('video/')) uploadPath = storageDir('uploads', 'videos');
    else if (file.mimetype.startsWith('audio/')) uploadPath = storageDir('uploads', 'audio');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});

const upload = multer({
  storage: (CLOUDINARY_CLOUD && CLOUDINARY_KEY && CLOUDINARY_SECRET) ? memoryStorage : diskStorage,
  limits: { fileSize: 100 * 1024 * 1024, files: 20 },
  fileFilter
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
  // Only log headers in development to avoid too much logging in production
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Auth header received:', authHeader ? 'Yes' : 'No');
    console.log('🔍 All headers:', JSON.stringify(req.headers, null, 2));
  }
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
app.post('/api/auth/signup', authLimiter, checkDbReady, async (req, res) => {
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
app.post('/api/auth/login', authLimiter, checkDbReady, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'אימייל וסיסמה נדרשים' });
    }

    // Check if database is ready
    if (!db || !dbReady) {
      console.error('❌ Login attempted but database is not connected');
      return res.status(503).json({ 
        success: false, 
        message: 'מסד הנתונים לא זמין. אנא בדוק ש-MySQL רץ והגדרות ההתחברות נכונות.' 
      });
    }

    await ensureDbConnection();

    // Double check db is available
    if (!db) {
      return res.status(503).json({ 
        success: false, 
        message: 'לא ניתן להתחבר למסד הנתונים. אנא בדוק את הגדרות MySQL ב-.env וודא ש-MySQL רץ.' 
      });
    }

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
    console.error('❌ Login error:', err);
    console.error('❌ Login error stack:', err.stack);
    console.error('❌ Login error details:', {
      message: err.message,
      code: err.code,
      name: err.name
    });
    // Provide more helpful error messages
    if (err.message && err.message.includes('Database connection failed')) {
      return res.status(503).json({ 
        success: false, 
        message: 'לא ניתן להתחבר למסד הנתונים. אנא בדוק ש-MySQL רץ ושההגדרות ב-.env נכונות.' 
      });
    }
    handleDbError(err, res);
  }
});

// Forgot password: nodemailer/SMTP, Resend, or SendGrid
let mailTransport = null;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
try {
  const nodemailer = require('nodemailer');
  const smtpUser = process.env.SMTP_USER || process.env.MAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.MAIL_PASS;
  if (smtpUser && smtpPass) {
    mailTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false,
      auth: { user: smtpUser, pass: smtpPass }
    });
    console.log('✅ Email (nodemailer) configured for password reset');
  }
} catch (e) {
  console.log('ℹ️  Nodemailer not installed');
}
if (RESEND_API_KEY && !mailTransport) {
  console.log('✅ Email (Resend) configured for password reset');
} else if (SENDGRID_API_KEY && !mailTransport) {
  console.log('✅ Email (SendGrid) configured for password reset');
}

async function sendPasswordResetEmail(toEmail, resetLink) {
  const fromEmail = process.env.RESET_EMAIL_FROM || process.env.SMTP_USER || 'noreply@memoriesman.netlify.app';
  const subject = 'איפוס סיסמה – דפי זיכרון דיגיטליים';
  const textBody = `שלום,\n\nביקשת לאפס את הסיסמה. לחץ על הקישור הבא (תקף לשעה):\n${resetLink}\n\nאם לא ביקשת איפוס, התעלם מהאימייל.\n\nדפי זיכרון דיגיטליים`;
  const htmlBody = `<p>שלום,</p><p>ביקשת לאפס את הסיסמה. <a href="${resetLink}">לחץ כאן לאיפוס סיסמה</a> (הקישור תקף לשעה).</p><p>אם לא ביקשת איפוס, התעלם מהאימייל.</p><p>דפי זיכרון דיגיטליים</p>`;

  if (mailTransport) {
    await mailTransport.sendMail({
      from: fromEmail,
      to: toEmail,
      subject,
      text: textBody,
      html: htmlBody
    });
    return true;
  }
  if (RESEND_API_KEY) {
    try {
      const axios = require('axios');
      const resendFrom = process.env.RESEND_FROM || 'onboarding@resend.dev';
      await axios.post(
        'https://api.resend.com/emails',
        {
          from: resendFrom,
          to: [toEmail],
          subject,
          html: htmlBody
        },
        {
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return true;
    } catch (err) {
      console.error('Resend error:', err.response?.data || err.message);
      return false;
    }
  }
  if (SENDGRID_API_KEY) {
    try {
      const axios = require('axios');
      await axios.post(
        'https://api.sendgrid.com/v3/mail/send',
        {
          personalizations: [{ to: [{ email: toEmail }] }],
          from: { email: fromEmail, name: 'דפי זיכרון דיגיטליים' },
          subject,
          content: [
            { type: 'text/plain', value: textBody },
            { type: 'text/html', value: htmlBody }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return true;
    } catch (err) {
      console.error('SendGrid error:', err.response?.data || err.message);
      return false;
    }
  }
  return false;
}

async function sendYahrzeitReminderEmail(toEmail, memorialName, memorialUrl, deathDateDisplay, is10DaysBefore) {
  const fromEmail = process.env.RESET_EMAIL_FROM || process.env.SMTP_USER || process.env.RESEND_FROM || 'onboarding@resend.dev';
  const subject = is10DaysBefore
    ? `תזכורת – בעוד 10 ימים יום הפטירה של ${memorialName} | דפי זיכרון דיגיטליים`
    : `תזכורת – יום הפטירה של ${memorialName} | דפי זיכרון דיגיטליים`;
  const intro = is10DaysBefore
    ? `בעוד 10 ימים יחול יום הפטירה של ${memorialName}${deathDateDisplay ? ' (' + deathDateDisplay + ')' : ''}.`
    : `היום הוא יום הפטירה של ${memorialName}${deathDateDisplay ? ' (' + deathDateDisplay + ')' : ''}.`;
  const textBody = `שלום,\n\n${intro}\n\nלחץ כאן כדי להיכנס לדף הזיכרון:\n${memorialUrl}\n\nתהא נשמתו/ה צרורה בצרור החיים.\n\nדפי זיכרון דיגיטליים`;
  const htmlBody = `<p>שלום,</p><p>${intro}</p><p><a href="${memorialUrl}">לחץ כאן כדי להיכנס לדף הזיכרון</a></p><p>תהא נשמתו/ה צרורה בצרור החיים.</p><p>דפי זיכרון דיגיטליים</p>`;

  if (mailTransport) {
    await mailTransport.sendMail({ from: fromEmail, to: toEmail, subject, text: textBody, html: htmlBody });
    return true;
  }
  if (RESEND_API_KEY) {
    try {
      const axios = require('axios');
      const resendFrom = process.env.RESEND_FROM || 'onboarding@resend.dev';
      await axios.post('https://api.resend.com/emails', { from: resendFrom, to: [toEmail], subject, html: htmlBody }, { headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' } });
      return true;
    } catch (err) {
      console.error('Resend yahrzeit error:', err.response?.data || err.message);
      return false;
    }
  }
  if (SENDGRID_API_KEY) {
    try {
      const axios = require('axios');
      await axios.post('https://api.sendgrid.com/v3/mail/send', {
        personalizations: [{ to: [{ email: toEmail }] }],
        from: { email: fromEmail, name: 'דפי זיכרון דיגיטליים' },
        subject,
        content: [{ type: 'text/plain', value: textBody }, { type: 'text/html', value: htmlBody }]
      }, { headers: { 'Authorization': `Bearer ${SENDGRID_API_KEY}`, 'Content-Type': 'application/json' } });
      return true;
    } catch (err) {
      console.error('SendGrid yahrzeit error:', err.response?.data || err.message);
      return false;
    }
  }
  return false;
}

app.post('/api/auth/forgot-password', authLimiter, checkDbReady, async (req, res) => {
  console.log('📧 POST /api/auth/forgot-password – request received');
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'נא להזין כתובת אימייל' });
    }
    const trimmedEmail = email.trim().toLowerCase();
    await ensureDbConnection();

    const [users] = await db.execute('SELECT id, name FROM users WHERE email = ?', [trimmedEmail]);
    if (users.length === 0) {
      return res.json({ success: true, message: 'אם החשבון קיים במערכת, נשלח אליך אימייל עם קישור לאיפוס סיסמה.' });
    }
    const user = users[0];

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await db.execute(
      'INSERT INTO password_reset_tokens (token, userId, expiresAt) VALUES (?, ?, ?)',
      [token, user.id, expiresAt]
    );

    const baseUrl = (process.env.BASE_URL || process.env.FRONTEND_URL || 'https://memoriesman.netlify.app').replace(/\/$/, '');
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    const emailSent = await sendPasswordResetEmail(trimmedEmail, resetLink);
    if (!emailSent && process.env.NODE_ENV === 'development') {
      console.log('📧 [Dev] Reset link (email not configured):', resetLink);
    }

    const message = emailSent
      ? 'אם החשבון קיים במערכת, נשלח אליך אימייל עם קישור לאיפוס סיסמה.'
      : 'שירות שליחת אימייל לא מוגדר. לאיפוס סיסמה פנה ל־a0534166556@gmail.com עם האימייל שלך.';
    return res.json({ success: true, message });
  } catch (err) {
    console.error('Forgot password error:', err);
    const code = err.code || '';
    if (code === 'ER_NO_SUCH_TABLE' || (err.message && err.message.includes('password_reset_tokens'))) {
      return res.status(503).json({
        success: false,
        message: 'מסד הנתונים מאותחל. נסה שוב בעוד רגע.'
      });
    }
    handleDbError(err, res);
  }
});

app.post('/api/auth/reset-password', authLimiter, checkDbReady, async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'נדרשים קישור איפוס וסיסמה חדשה' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'סיסמה חייבת להיות לפחות 6 תווים' });
    }
    await ensureDbConnection();

    const [rows] = await db.execute(
      'SELECT userId FROM password_reset_tokens WHERE token = ? AND expiresAt > NOW()',
      [token]
    );
    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'קישור איפוס לא תקף או שפג תוקפו. נא לבקש קישור חדש.' });
    }
    const userId = rows[0].userId;
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
    await db.execute('DELETE FROM password_reset_tokens WHERE token = ?', [token]);

    return res.json({ success: true, message: 'הסיסמה עודכנה. אפשר להתחבר עם הסיסמה החדשה.' });
  } catch (err) {
    console.error('Reset password error:', err);
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
    let additionalGb = null;
    const allowedAmounts = { annual: 100, lifetime: 445, 'lifetime-premium': 620, maintenance: 35 };
    if (planType === 'storage-addon') {
      additionalGb = Math.max(1, Math.min(10, parseInt(req.body.additionalGb, 10) || 1));
      const expectedAmount = 100 * additionalGb;
      if (Number(amount) !== expectedAmount || !memorialId) {
        return res.status(400).json({ success: false, message: 'סכום או מזהה דף לא תואם' });
      }
    } else if (planType === 'maintenance') {
      if (Number(amount) !== 35 || !memorialId) {
        return res.status(400).json({ success: false, message: 'תשלום תחזוקה 35₪ דורש מזהה דף זיכרון' });
      }
    } else {
      const expectedAmount = allowedAmounts[planType];
      if (expectedAmount == null || Number(amount) !== expectedAmount) {
        return res.status(400).json({ success: false, message: 'סכום לא תואם לתוכנית הנבחרת' });
      }
    }

    await ensureDbConnection();

    const paymentId = uuidv4();
    
    await db.execute(
      'INSERT INTO payments (id, userId, memorialId, planType, amount, status, additional_gb) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [paymentId, req.user.id, memorialId || null, planType, amount, 'pending', additionalGb]
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
        description: `תשלום עבור ${planType === 'lifetime' ? 'הנצחה לכל החיים (עם עריכה)' : planType === 'lifetime-no-edit' ? 'הנצחה לכל החיים (בלי עריכה)' : planType === 'lifetime-premium' ? 'הנצחה פרימיום 3 גיגה' : planType === 'storage-addon' ? `תוספת אחסון ${additionalGb} גיגה` : planType === 'maintenance' ? 'תחזוקת אתר לשנה' : planType === 'annual' ? 'שמירה שנתית' : 'דף זיכרון'}`
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
            await db.execute(
              'UPDATE memorials SET status = ?, expiryDate = NULL, canEdit = TRUE, media_limit_bytes = ?, maintenance_paid_until = DATE_ADD(NOW(), INTERVAL 1 YEAR) WHERE id = ?',
              ['active', DEFAULT_MEDIA_LIMIT_1GB, payment.memorialId]
            );
          } else if (payment.planType === 'lifetime-no-edit') {
            await db.execute(
              'UPDATE memorials SET status = ?, expiryDate = NULL, canEdit = FALSE, media_limit_bytes = ?, maintenance_paid_until = DATE_ADD(NOW(), INTERVAL 1 YEAR) WHERE id = ?',
              ['active', DEFAULT_MEDIA_LIMIT_1GB, payment.memorialId]
            );
          } else if (payment.planType === 'lifetime-premium') {
            await db.execute(
              'UPDATE memorials SET status = ?, expiryDate = NULL, canEdit = TRUE, media_limit_bytes = ?, maintenance_paid_until = DATE_ADD(NOW(), INTERVAL 1 YEAR) WHERE id = ?',
              ['active', MEDIA_LIMIT_3GB, payment.memorialId]
            );
          } else if (payment.planType === 'maintenance' && payment.memorialId) {
            await db.execute(
              'UPDATE memorials SET maintenance_paid_until = DATE_ADD(COALESCE(maintenance_paid_until, NOW()), INTERVAL 1 YEAR) WHERE id = ?',
              [payment.memorialId]
            );
          } else if (payment.planType === 'storage-addon' && payment.memorialId && payment.additional_gb) {
            const addBytes = Number(payment.additional_gb) * 1024 * 1024 * 1024;
            await db.execute(
              'UPDATE memorials SET media_limit_bytes = COALESCE(media_limit_bytes, ?) + ? WHERE id = ?',
              [DEFAULT_MEDIA_LIMIT_1GB, addBytes, payment.memorialId]
            );
          }
          if (payment.planType === 'annual' && payment.memorialId) {
            await db.execute(
              'UPDATE memorials SET media_limit_bytes = ? WHERE id = ?',
              [DEFAULT_MEDIA_LIMIT_1GB, payment.memorialId]
            );
          }
        }

        const redirectUrl = payment.planType === 'storage-addon'
          ? '/add-storage'
          : payment.planType === 'maintenance'
          ? '/manage'
          : (payment.memorialId ? `/memorial/${payment.memorialId}` : '/');
        res.json({
          success: true,
          paymentId,
          memorialId: payment.memorialId,
          message: 'תשלום בוצע בהצלחה',
          redirectUrl
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
      heroImageIndex,
      cemeteryName,
      cemeteryAddress,
      latitude,
      longitude
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
    
    // Process regular files (Cloudinary or local path) + check media limit (1GB default)
    let newMediaBytes = 0;
    if (req.files && req.files.files) {
      for (const file of req.files.files) {
        newMediaBytes += getFileSize(file);
        const url = await getFileUrl(file);
        if (file.mimetype.startsWith('video/')) videos.push(url);
        else if (file.mimetype.startsWith('audio/')) backgroundMusic = url;
        else images.push(url);
      }
    }
    if (req.files && req.files.headerImage && req.files.headerImage.length > 0) {
      newMediaBytes += getFileSize(req.files.headerImage[0]);
    }
    // אין הגבלת גיגה ביצירת דף חדש – רק אחרי רכישת תוכנית

    // Process header image (separate upload)
    if (req.files && req.files.headerImage && req.files.headerImage.length > 0) {
      heroImage = await getFileUrl(req.files.headerImage[0]);
    } else if (heroImageIndex !== undefined && heroImageIndex !== null && heroImageIndex !== '') {
      // Fallback to heroImageIndex if headerImage not provided
      const heroIndex = Number(heroImageIndex);
      if (!Number.isNaN(heroIndex) && heroIndex >= 0 && heroIndex < images.length) {
        heroImage = images[heroIndex];
      }
    }
    
    // Generate QR Code – תמיד אותו URL (Netlify) כדי שסריקת ה-QR תפתח תמיד את הדף
    if (!id) {
      console.error('❌ ERROR: No memorial ID provided for QR code generation!');
      throw new Error('Memorial ID is required for QR code generation');
    }
    const memorialUrl = getMemorialPageUrl(id);
    console.log('🔗 Memorial ID:', id);
    console.log('🔗 Memorial URL for QR:', memorialUrl);
    const qrCodeFsPath = storageDir('qrcodes', `${id}.png`);
    const qrCodePath = `qrcodes/${id}.png`;
    
    try {
      const qrDir = storageDir('qrcodes');
      if (!fs.existsSync(qrDir)) {
        fs.mkdirSync(qrDir, { recursive: true });
        console.log('✅ Created qrcodes directory');
      }
    await QRCode.toFile(qrCodeFsPath, memorialUrl);
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
      expiryDate.setHours(expiryDate.getHours() + 24); // 24 hours from now

      await db.execute(`
      INSERT INTO memorials (id, userId, name, hebrewName, birthDate, deathDate, biography, images, videos, backgroundMusic, heroImage, heroSummary, timeline, tehilimChapters, mishnayot, qrCodePath, status, expiryDate, canEdit, cemeteryName, cemeteryAddress, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      true,  // canEdit default for new memorials (they can upgrade later)
      cemeteryName || null,
      cemeteryAddress || null,
      latitude ? parseFloat(latitude) : null,
      longitude ? parseFloat(longitude) : null
      ]);
      if (newMediaBytes > 0) {
        await db.execute('UPDATE memorials SET media_used_bytes = ? WHERE id = ?', [newMediaBytes, id]);
      }
    
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
        expiryDate: expiryDate.toISOString(),
        cemeteryName: cemeteryName || null,
        cemeteryAddress: cemeteryAddress || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null
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
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Found rows:', rows.length);
    }
    
    if (rows.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Memorial not found for ID:', id);
      }
      return res.status(404).json({ success: false, error: 'Memorial not found' });
    }
    
    const row = rows[0];
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Memorial found:', row.name, 'Status:', row.status, 'User ID:', row.userId);
    }
    
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
      userId: row.userId,
      media_used_bytes: row.media_used_bytes,
      media_limit_bytes: row.media_limit_bytes,
      maintenance_paid_until: row.maintenance_paid_until
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
    
    // Generate new QR code – תמיד אותו URL (Netlify) כדי שסריקת ה-QR תפתח תמיד את הדף
    const memorialUrl = getMemorialPageUrl(id);
    const qrCodeFsPath = storageDir('qrcodes', `${id}.png`);
    const qrCodePath = `qrcodes/${id}.png`;
    
    try {
      const qrDir = storageDir('qrcodes');
      if (!fs.existsSync(qrDir)) {
        fs.mkdirSync(qrDir, { recursive: true });
      }
      
      await QRCode.toFile(qrCodeFsPath, memorialUrl);
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
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ isAdmin check: No user or email');
    }
    return false;
  }
  // Normalize email for comparison (lowercase and trim)
  const normalizedUserEmail = user.email.toLowerCase().trim();
  const adminEmail = 'a0534166556@gmail.com';
  const isAdminResult = normalizedUserEmail === adminEmail;
  // Only log in development to avoid too much logging in production
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 isAdmin check - User email:', user.email, 'Normalized:', normalizedUserEmail, 'Admin email:', adminEmail, 'Result:', isAdminResult);
  }
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
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Deleted memorial ${id} by user ${req.user.id} (admin: ${isAdmin(req.user)})`);
    }
    
    // TODO: Optionally delete files from disk (images, videos, QR codes)
    // For now, just delete from database
    
    res.json({ success: true, message: 'דף הזיכרון נמחק בהצלחה' });
  } catch (err) {
    console.error('Error deleting memorial:', err);
    handleDbError(err, res);
  }
});

// Grant lifetime storage to a memorial (admin only)
app.patch('/api/memorials/:id/grant-lifetime', checkDbReady, authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'רק מנהל יכול להעניק שמירה לכל החיים' });
    }
    await ensureDbConnection();

    const [rows] = await db.execute('SELECT * FROM memorials WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'דף זיכרון לא נמצא' });
    }

    await db.execute(
      'UPDATE memorials SET status = ?, expiryDate = NULL, canEdit = 1 WHERE id = ?',
      ['lifetime', id]
    );

    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Admin granted lifetime to memorial ${id}`);
    }
    res.json({ success: true, message: 'הוענקה שמירה לכל החיים לדף הזיכרון' });
  } catch (err) {
    console.error('Error granting lifetime:', err);
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
      heroImageIndex,
      cemeteryName,
      cemeteryAddress,
      latitude,
      longitude
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
    const currentMediaBytes = Number(existingMemorial.media_used_bytes) || 0;
    let newMediaBytes = 0;
    
    // Process regular files (Cloudinary or local path)
    if (req.files && req.files.files) {
      for (const file of req.files.files) {
        newMediaBytes += getFileSize(file);
        const url = await getFileUrl(file);
        if (file.mimetype.startsWith('video/')) videos.push(url);
        else if (file.mimetype.startsWith('audio/')) backgroundMusic = url;
        else images.push(url);
      }
    }
    if (req.files && req.files.headerImage && req.files.headerImage.length > 0) {
      newMediaBytes += getFileSize(req.files.headerImage[0]);
    }
    const limitBytes = getMemorialMediaLimitBytes(existingMemorial);
    if (limitBytes > 0 && currentMediaBytes + newMediaBytes > limitBytes) {
      const limitGb = Math.round(limitBytes / (1024 * 1024 * 1024));
      return res.status(400).json({ success: false, error: `הגעת להגבלת האחסון (${limitGb} גיגה). נא להקטין נפח או לרכוש תוספת אחסון.` });
    }
    
    // Process header image
    if (req.files && req.files.headerImage && req.files.headerImage.length > 0) {
      heroImage = await getFileUrl(req.files.headerImage[0]);
    } else if (heroImageIndex !== undefined && heroImageIndex !== null && images[heroImageIndex]) {
      heroImage = images[parseInt(heroImageIndex)];
    }
    
    // Update database
    await db.execute(`
      UPDATE memorials 
      SET name = ?, hebrewName = ?, birthDate = ?, deathDate = ?, biography = ?, 
          images = ?, videos = ?, backgroundMusic = ?, heroImage = ?, heroSummary = ?, 
          timeline = ?, tehilimChapters = ?, mishnayot = ?,
          cemeteryName = ?, cemeteryAddress = ?, latitude = ?, longitude = ?
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
      cemeteryName || null,
      cemeteryAddress || null,
      latitude ? parseFloat(latitude) : null,
      longitude ? parseFloat(longitude) : null,
      id,
      req.user.id
    ]);
    if (newMediaBytes > 0) {
      await db.execute('UPDATE memorials SET media_used_bytes = media_used_bytes + ? WHERE id = ?', [newMediaBytes, id]);
    }
    
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
    const currentMediaBytes = Number(row.media_used_bytes) || 0;
    let addBytes = 0;
    for (const file of req.files) {
      addBytes += getFileSize(file);
    }
    const limitBytes = getMemorialMediaLimitBytes(row);
    if (limitBytes > 0 && currentMediaBytes + addBytes > limitBytes) {
      const limitGb = Math.round(limitBytes / (1024 * 1024 * 1024));
      return res.status(400).json({ success: false, error: `הגעת להגבלת האחסון (${limitGb} גיגה). נא להקטין נפח או לרכוש תוספת אחסון.` });
    }
    
    for (const file of req.files) {
      const url = await getFileUrl(file);
      if (file.mimetype.startsWith('video/')) existingVideos.push(url);
      else if (file.mimetype.startsWith('audio/')) backgroundMusic = url;
      else existingImages.push(url);
    }
    
    await db.execute(
      'UPDATE memorials SET images = ?, videos = ?, backgroundMusic = ?, media_used_bytes = COALESCE(media_used_bytes,0) + ? WHERE id = ?',
      [JSON.stringify(existingImages), JSON.stringify(existingVideos), backgroundMusic, addBytes, id]
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

// Subscribe to yahrzeit reminder (email on death anniversary, optional 10 days before)
app.post('/api/memorials/:id/remind', checkDbReady, async (req, res) => {
  const { id } = req.params;
  const { email, remindOnDay, remind10DaysBefore } = req.body || {};
  const trimmedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!trimmedEmail) {
    return res.status(400).json({ success: false, message: 'נא להזין כתובת אימייל' });
  }
  const onDay = remindOnDay !== false && remindOnDay !== 0;
  const tenDays = !!remind10DaysBefore;
  if (!onDay && !tenDays) {
    return res.status(400).json({ success: false, message: 'נא לבחור לפחות תזכורת אחת.' });
  }
  try {
    await ensureDbConnection();
    const [memorials] = await db.execute(
      'SELECT id, name, deathDate FROM memorials WHERE id = ?',
      [id]
    );
    if (memorials.length === 0) {
      return res.status(404).json({ success: false, message: 'דף זיכרון לא נמצא' });
    }
    const memorial = memorials[0];
    if (!memorial.deathDate || memorial.deathDate.trim() === '') {
      return res.status(400).json({ success: false, message: 'לדף זיכרון זה לא מוגדר תאריך פטירה – לא ניתן להפעיל תזכורת.' });
    }
    const reminderId = uuidv4();
    try {
      await db.execute(
        'INSERT INTO memorial_reminders (id, memorialId, email, remindOnDay, remind10DaysBefore) VALUES (?, ?, ?, ?, ?)',
        [reminderId, id, trimmedEmail, onDay ? 1 : 0, tenDays ? 1 : 0]
      );
    } catch (insErr) {
      if (insErr.code === 'ER_DUP_ENTRY' || insErr.errno === 1062) {
        await db.execute(
          'UPDATE memorial_reminders SET remindOnDay = ?, remind10DaysBefore = ? WHERE memorialId = ? AND email = ?',
          [onDay ? 1 : 0, tenDays ? 1 : 0, id, trimmedEmail]
        );
      } else {
        throw insErr;
      }
    }
  } catch (err) {
    console.error('Remind subscribe error:', err);
    handleDbError(err, res);
    return;
  }
  const parts = [];
  if (onDay) parts.push('ביום הפטירה');
  if (tenDays) parts.push('10 ימים לפני');
  res.json({
    success: true,
    message: 'נרשמת לתזכורת במייל (' + parts.join(' ו־') + '). נשלח אליך אימייל בכל שנה.'
  });
});

// Cron: send yahrzeit reminders (call daily with ?token=CRON_SECRET)
app.get('/api/cron/send-yahrzeit-reminders', (req, res) => {
  const secret = process.env.CRON_SECRET || process.env.YAHRZEIT_CRON_SECRET;
  if (secret && req.query.token !== secret) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  res.setHeader('Access-Control-Allow-Origin', '*');
  (async () => {
    try {
      await ensureDbConnection();
      const today = new Date();
      const todayMonth = today.getMonth() + 1;
      const todayDay = today.getDate();
      const year = today.getFullYear();
      const [allWithDeath] = await db.execute(
        'SELECT id, name, deathDate FROM memorials WHERE deathDate IS NOT NULL AND deathDate != ""'
      );
      const baseUrl = (process.env.BASE_URL || process.env.FRONTEND_URL || 'https://memoriesman.netlify.app').replace(/\/$/, '');
      let sent = 0;

      const memorialsToday = (allWithDeath || []).filter((m) => {
        const d = m.deathDate;
        if (!d) return false;
        const parsed = new Date(d);
        if (isNaN(parsed.getTime())) return false;
        return (parsed.getMonth() + 1) === todayMonth && parsed.getDate() === todayDay;
      });
      for (const m of memorialsToday) {
        const [subs] = await db.execute(
          'SELECT id, email FROM memorial_reminders WHERE memorialId = ? AND remindOnDay = 1 AND (lastSentYear IS NULL OR lastSentYear < ?)',
          [m.id, year]
        );
        const deathD = m.deathDate ? new Date(m.deathDate).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
        const memorialUrl = `${baseUrl}/memorial/${m.id}`;
        for (const sub of subs) {
          const ok = await sendYahrzeitReminderEmail(sub.email, m.name, memorialUrl, deathD, false);
          if (ok) {
            await db.execute('UPDATE memorial_reminders SET lastSentYear = ? WHERE id = ?', [year, sub.id]);
            sent++;
          }
        }
      }

      const in10Days = new Date(today);
      in10Days.setDate(in10Days.getDate() + 10);
      const month10 = in10Days.getMonth() + 1;
      const day10 = in10Days.getDate();
      const memorials10Days = (allWithDeath || []).filter((m) => {
        const d = m.deathDate;
        if (!d) return false;
        const parsed = new Date(d);
        if (isNaN(parsed.getTime())) return false;
        return (parsed.getMonth() + 1) === month10 && parsed.getDate() === day10;
      });
      for (const m of memorials10Days) {
        const [subs] = await db.execute(
          'SELECT id, email FROM memorial_reminders WHERE memorialId = ? AND remind10DaysBefore = 1 AND (lastSentYear10 IS NULL OR lastSentYear10 < ?)',
          [m.id, year]
        );
        const deathD = m.deathDate ? new Date(m.deathDate).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
        const memorialUrl = `${baseUrl}/memorial/${m.id}`;
        for (const sub of subs) {
          const ok = await sendYahrzeitReminderEmail(sub.email, m.name, memorialUrl, deathD, true);
          if (ok) {
            await db.execute('UPDATE memorial_reminders SET lastSentYear10 = ? WHERE id = ?', [year, sub.id]);
            sent++;
          }
        }
      }

      res.json({ success: true, sent, memorialsToday: memorialsToday.length, memorials10Days: memorials10Days.length });
    } catch (err) {
      console.error('Yahrzeit cron error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  })();
});

// Handle OPTIONS preflight for /api/music
app.options('/api/music', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.sendStatus(200);
});

// שירי רקע ברירת מחדל – מוצגים כשלא יש קבצים בתיקיית השרת (production / אחרי דיפלוי).
// אפשר להחליף ב-URLs משלכם (למשל מ-Cloudinary) או להשאיר ריק [].
const DEFAULT_BACKGROUND_MUSIC = [
  { name: 'רקע 1', path: 'https://cdn.pixabay.com/audio/2022/05/27/audio_3e2f1f0f1c.mp3', displayName: 'שיר רקע רגוע 1' },
  { name: 'רקע 2', path: 'https://cdn.pixabay.com/audio/2022/03/10/audio_369f1f0f1c.mp3', displayName: 'שיר רקע רגוע 2' }
];

// Get list of available background music files (from server folder + defaults)
app.get('/api/music', (req, res) => {
  console.log('📻 /api/music endpoint called');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  try {
    let files = [];
    const audioDir = storageDir('uploads', 'audio') || path.join(__dirname, 'uploads', 'audio');
    if (fs.existsSync(audioDir)) {
      files = fs.readdirSync(audioDir)
        .filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ['.mp3', '.wav', '.m4a', '.ogg', '.aac'].includes(ext);
        })
        .map(file => ({
          name: file,
          path: `/uploads/audio/${file}`,
          displayName: path.basename(file, path.extname(file))
        }));
    }
    // אם אין קבצים בשרת (למשל ב-production אחרי דיפלוי) – החזר שירי ברירת מחדל
    if (files.length === 0) {
      files = [...DEFAULT_BACKGROUND_MUSIC];
    }
    console.log('✅ Music list:', files.length, 'files');
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

