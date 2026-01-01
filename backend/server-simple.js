// Simple version - server doesn't start until database is ready
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || 'development';

// CORS - Simple and direct
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(cors({ origin: '*' }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Create directories
['uploads/images', 'uploads/videos', 'uploads/audio', 'qrcodes'].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Database - Simple initialization
let db = null;
let dbReady = false;

function initDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database('./memorial.db', (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      
      console.log('Connected to SQLite database');
      
      // Enable foreign keys
      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) {
          console.error('Error enabling foreign keys:', err);
        }
        
        // Create tables one by one
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
            reject(err);
            return;
          }
          console.log('Memorials table ready');
          
          db.run(`CREATE TABLE IF NOT EXISTS condolences (
            id TEXT PRIMARY KEY,
            memorialId TEXT NOT NULL,
            name TEXT NOT NULL,
            message TEXT NOT NULL,
            approved INTEGER DEFAULT 1,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (memorialId) REFERENCES memorials(id)
          )`, (err) => {
            if (err) {
              console.error('Error creating condolences table:', err);
              reject(err);
              return;
            }
            console.log('Condolences table ready');
            
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
                reject(err);
                return;
              }
              console.log('Candles table ready');
              
              db.run(`CREATE INDEX IF NOT EXISTS idx_candles_memorial_visitor ON candles(memorialId, visitorId)`, (err) => {
                if (err) {
                  console.error('Error creating index:', err);
                }
                console.log('Database initialization complete!');
                dbReady = true;
                resolve();
              });
            });
          });
        });
      });
    });
  });
}

// Start server ONLY after database is ready
async function start() {
  try {
    console.log('Initializing database...');
    await initDatabase();
    console.log('Database ready!');
    
    // Now start the server
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ Environment: ${NODE_ENV}`);
      console.log('✅ Server is ready to accept requests!');
    });
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    console.error('Server will not start without database');
    process.exit(1);
  }
}

// Routes - Only defined after database is ready
// (We'll add them after start() is called)

// Start everything
start();


