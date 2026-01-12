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

console.log('🚀 SERVER STARTING - VERSION WITH FIXES');
console.log('🚀 Timestamp:', new Date().toISOString());

const app = express();
const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || 'development';

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
    qrCodePath TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
    console.log('✅ Memorials table ready');
    
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
    
    // Create index (MySQL doesn't support IF NOT EXISTS for indexes)
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

// Handle OPTIONS preflight for /api/memorials
app.options('/api/memorials', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.sendStatus(200);
});

// Create new memorial
app.post('/api/memorials', checkDbReady, validateInput, upload.fields([
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
    // Use BASE_URL from environment if available, otherwise use request host
    // IMPORTANT: BASE_URL should be set to Netlify URL (e.g., https://memoriesman.netlify.app)
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    console.log('🔗 QR Code baseUrl:', baseUrl);
    console.log('🔗 BASE_URL env var:', process.env.BASE_URL || 'NOT SET');
    const memorialUrl = `${baseUrl}/memorial/${id}`;
    console.log('🔗 Memorial URL for QR:', memorialUrl);
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
      
      await db.execute(`
      INSERT INTO memorials (id, name, hebrewName, birthDate, deathDate, biography, images, videos, backgroundMusic, heroImage, heroSummary, timeline, tehilimChapters, qrCodePath)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
      id,
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
      `/${qrCodePath}`
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
        qrCodePath: `/${qrCodePath}`,
        url: memorialUrl
      }
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
app.get('/api/memorials/:id', checkDbReady, async (req, res) => {
  const { id } = req.params;
  
  try {
    const [rows] = await db.execute('SELECT * FROM memorials WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Memorial not found' });
    }
    
    const row = rows[0];
    res.json({
      success: true,
      memorial: {
        ...row,
        images: JSON.parse(row.images || '[]'),
        videos: JSON.parse(row.videos || '[]'),
        backgroundMusic: row.backgroundMusic || '',
        heroImage: row.heroImage || '',
        heroSummary: row.heroSummary || '',
        timeline: parseTimeline(row.timeline)
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

// Get all memorials
app.get('/api/memorials', checkDbReady, async (req, res) => {
  // Explicitly set CORS headers for this endpoint
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  try {
    const [rows] = await db.execute('SELECT * FROM memorials ORDER BY createdAt DESC');
    
    const memorials = rows.map(row => ({
      ...row,
      images: JSON.parse(row.images || '[]'),
      videos: JSON.parse(row.videos || '[]'),
      backgroundMusic: row.backgroundMusic || '',
      heroImage: row.heroImage || '',
      heroSummary: row.heroSummary || '',
      timeline: parseTimeline(row.timeline)
    }));
    
    res.json({ success: true, memorials });
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

