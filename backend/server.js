const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
// CORS configuration - TEMPORARILY ALLOW ALL ORIGINS (for debugging)
// TODO: Restrict to specific domains after testing
app.use(cors({
  origin: '*', // Allow all origins - TEMPORARY FIX
  credentials: false, // Set to false when using origin: '*'
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type']
}));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.sendStatus(200);
});

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use('/uploads', express.static('uploads'));
app.use('/qrcodes', express.static('qrcodes'));

// Serve frontend build in production
if (NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../frontend/dist');
  if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    // Handle React Router - serve index.html for all routes
    app.get('*', (req, res) => {
      // Don't serve index.html for API routes
      if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/qrcodes')) {
        return res.status(404).json({ error: 'Not found' });
      }
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
  }
}

// Create directories if they don't exist
['uploads/images', 'uploads/videos', 'uploads/audio', 'qrcodes'].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Database setup
let dbReady = false;
let dbError = false;

const db = new sqlite3.Database('./memorial.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
    console.error('Server will start anyway - database may be created later');
    dbError = true;
    // Don't exit - let server start and handle errors in routes
    dbReady = true;
    startServer();
  } else {
    console.log('Connected to SQLite database');
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON', (err) => {
      if (err) {
        console.error('Error enabling foreign keys:', err);
        console.error('Server will start anyway - foreign keys may not work');
        // Don't exit - let server start
        dbError = true;
        dbReady = true;
        startServer();
      } else {
        console.log('Foreign keys enabled');
        initDatabase((err) => {
          if (err) {
            console.error('Database initialization failed:', err);
            console.error('Server will start anyway - tables may already exist');
            // Don't exit - let server start and handle errors in routes
          } else {
            console.log('Database initialization successful');
          }
          dbReady = true;
          startServer();
        });
      }
    });
  }
});

function initDatabase(callback) {
  console.log('Starting database initialization...');
  
  // Create all tables sequentially using callbacks
  db.run(`CREATE TABLE IF NOT EXISTS memorials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    hebrewName TEXT,
    birthDate TEXT,
    deathDate TEXT,
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
  )`, (err) => {
    if (err) {
      console.error('Error creating memorials table:', err);
      if (callback) callback(err);
      return;
    }
    console.log('Memorials table ready');
    
    // Create condolences table
    db.run(`CREATE TABLE IF NOT EXISTS condolences (
      id TEXT PRIMARY KEY,
      memorialId TEXT NOT NULL,
      name TEXT NOT NULL,
      message TEXT NOT NULL,
      approved INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (memorialId) REFERENCES memorials(id)
    )`, (err) => {
      if (err) {
        console.error('Error creating condolences table:', err);
        if (callback) callback(err);
        return;
      }
      console.log('Condolences table ready');
      
      // Create candles table
      db.run(`CREATE TABLE IF NOT EXISTS candles (
        id TEXT PRIMARY KEY,
        memorialId TEXT NOT NULL,
        litBy TEXT,
        visitorId TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (memorialId) REFERENCES memorials(id)
      )`, (err) => {
        if (err) {
          console.error('Error creating candles table:', err);
          if (callback) callback(err);
          return;
        }
        console.log('Candles table ready');
        
        // Create index
        db.run(`CREATE INDEX IF NOT EXISTS idx_candles_memorial_visitor ON candles(memorialId, visitorId)`, (err) => {
          if (err) {
            console.error('Error creating candles index:', err);
            if (callback) callback(err);
            return;
          }
          console.log('Candles index ready');
          
          // Ensure columns exist after all tables are created
          ensureColumn('memorials', 'backgroundMusic', 'TEXT');
          ensureColumn('memorials', 'heroImage', 'TEXT');
          ensureColumn('memorials', 'heroSummary', 'TEXT');
          ensureColumn('memorials', 'timeline', 'TEXT');
          
          console.log('Database initialization complete!');
          if (callback) callback(null);
        });
      });
    });
  });
}

function startServer() {
  if (app.listening) {
    console.log('Server already listening');
    return;
  }
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${NODE_ENV}`);
    if (NODE_ENV === 'production') {
      console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'Not set'}`);
      console.log(`Base URL: ${process.env.BASE_URL || 'Using request host'}`);
    }
    if (dbReady) {
      console.log('Database initialization complete');
    } else {
      console.log('Database initialization may still be in progress');
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

function ensureColumn(tableName, columnName, columnDefinition) {
  db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
    if (err) {
      console.error(`Error checking columns for ${tableName}:`, err);
      return;
    }

    const columnExists = columns.some(column => column.name === columnName);
    if (!columnExists) {
      db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`, (alterErr) => {
        if (alterErr) {
          console.error(`Error adding column ${columnName} to ${tableName}:`, alterErr);
        } else {
          console.log(`Added column ${columnName} to ${tableName}`);
        }
      });
    }
  });
}

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

// Routes

// Create new memorial
app.post('/api/memorials', validateInput, upload.fields([
  { name: 'files', maxCount: 20 },
  { name: 'headerImage', maxCount: 1 }
]), async (req, res) => {
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
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const memorialUrl = `${baseUrl}/memorial/${id}`;
    const qrCodePath = `qrcodes/${id}.png`;
    await QRCode.toFile(qrCodePath, memorialUrl);
    
    // Save to database
    const stmt = db.prepare(`
      INSERT INTO memorials (id, name, hebrewName, birthDate, deathDate, biography, images, videos, backgroundMusic, heroImage, heroSummary, timeline, tehilimChapters, qrCodePath)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
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
    );
    
    stmt.finalize();
    
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
  } catch (error) {
    console.error('Error creating memorial:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get memorial by ID
app.get('/api/memorials/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM memorials WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ success: false, error: 'Memorial not found' });
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
        timeline: parseTimeline(row.timeline)
      }
    });
  });
});

// Get all memorials
app.get('/api/memorials', (req, res) => {
  db.all('SELECT * FROM memorials ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
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
    
    res.json({ success: true, memorials });
  });
});

// Upload additional files to existing memorial
app.post('/api/memorials/:id/upload', validateInput, upload.array('files', 10), (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM memorials WHERE id = ?', [id], (err, row) => {
    if (err || !row) {
      return res.status(404).json({ success: false, error: 'Memorial not found' });
    }
    
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
    
    db.run(
      'UPDATE memorials SET images = ?, videos = ?, backgroundMusic = ? WHERE id = ?',
      [JSON.stringify(existingImages), JSON.stringify(existingVideos), backgroundMusic, id],
      (err) => {
        if (err) {
          return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, images: existingImages, videos: existingVideos, backgroundMusic });
      }
    );
  });
});

// Add condolence message
app.post('/api/memorials/:id/condolences', validateInput, (req, res) => {
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

  const condolenceId = uuidv4();
  db.run(
    'INSERT INTO condolences (id, memorialId, name, message, approved) VALUES (?, ?, ?, ?, ?)',
    [condolenceId, id, name, message, 1], // 1 = approved (appear immediately)
    (err) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true, condolence: { id: condolenceId, name, message, approved: true } });
    }
  );
});

// Get condolences for a memorial (only approved)
app.get('/api/memorials/:id/condolences', (req, res) => {
  const { id } = req.params;
  db.all(
    'SELECT id, name, message, createdAt FROM condolences WHERE memorialId = ? AND approved = 1 ORDER BY createdAt DESC',
    [id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true, condolences: rows || [] });
    }
  );
});

// Light a virtual candle
app.post('/api/memorials/:id/candles', (req, res) => {
  const { id } = req.params;
  const { litBy, visitorId } = req.body;

  if (!visitorId) {
    return res.status(400).json({ success: false, error: 'נדרש מזהה מבקר' });
  }

  // Check if this visitor already lit a candle
  db.get(
    'SELECT id FROM candles WHERE memorialId = ? AND visitorId = ?',
    [id, visitorId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      
      if (row) {
        // Visitor already lit a candle
        return res.status(400).json({ 
          success: false, 
          error: 'כבר הדלקת נר זיכרון לדף זה',
          alreadyLit: true 
        });
      }

      // Create new candle
      const candleId = uuidv4();
      db.run(
        'INSERT INTO candles (id, memorialId, litBy, visitorId) VALUES (?, ?, ?, ?)',
        [candleId, id, litBy || 'אנונימי', visitorId],
        (err) => {
          if (err) {
            return res.status(500).json({ success: false, error: err.message });
          }
          // Get all candles for this memorial
          db.all(
            'SELECT id, litBy, createdAt FROM candles WHERE memorialId = ? ORDER BY createdAt DESC',
            [id],
            (err, rows) => {
              if (err) {
                return res.status(500).json({ success: false, error: err.message });
              }
              res.json({ success: true, candles: rows || [], candleCount: rows.length });
            }
          );
        }
      );
    }
  );
});

// Get candles for a memorial
app.get('/api/memorials/:id/candles', (req, res) => {
  const { id } = req.params;
  const { visitorId } = req.query;
  
  // Get all candles
  db.all(
    'SELECT id, litBy, createdAt FROM candles WHERE memorialId = ? ORDER BY createdAt DESC',
    [id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      
      // Check if visitor already lit a candle
      let hasLitCandle = false;
      if (visitorId) {
        db.get(
          'SELECT id FROM candles WHERE memorialId = ? AND visitorId = ?',
          [id, visitorId],
          (err, row) => {
            if (!err && row) {
              hasLitCandle = true;
            }
            res.json({ 
              success: true, 
              candles: rows || [], 
              candleCount: rows.length,
              hasLitCandle 
            });
          }
        );
      } else {
        res.json({ 
          success: true, 
          candles: rows || [], 
          candleCount: rows.length,
          hasLitCandle: false 
        });
      }
    }
  );
});

// Get list of available background music files
app.get('/api/music', (req, res) => {
  try {
    const audioDir = path.join(__dirname, 'uploads', 'audio');
    if (!fs.existsSync(audioDir)) {
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

    res.json({ success: true, musicFiles: files });
  } catch (error) {
    console.error('Error reading music files:', error);
    res.json({ success: true, musicFiles: [] });
  }
});

