// Script to check local setup
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSetup() {
  console.log('🔍 Checking local setup...\n');
  
  // Check .env file
  console.log('1. Checking .env file...');
  const requiredVars = ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_DATABASE'];
  let envOk = true;
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      console.log(`   ❌ Missing: ${varName}`);
      envOk = false;
    } else {
      console.log(`   ✅ ${varName} = ${process.env[varName]}`);
    }
  });
  
  if (!envOk) {
    console.log('\n❌ .env file is missing or incomplete!');
    console.log('   Copy env.example.txt to .env and update the values.\n');
    return;
  }
  
  // Check MySQL connection
  console.log('\n2. Checking MySQL connection...');
  const dbConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    port: process.env.MYSQL_PORT || 3306
  };
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('   ✅ Connected to MySQL server');
    
    // Check if database exists
    const [databases] = await connection.execute('SHOW DATABASES');
    const dbName = process.env.MYSQL_DATABASE || 'memorial';
    const dbExists = databases.some(db => db.Database === dbName);
    
    if (dbExists) {
      console.log(`   ✅ Database '${dbName}' exists`);
      
      // Try to use the database
      await connection.execute(`USE ${dbName}`);
      console.log(`   ✅ Can access database '${dbName}'`);
      
      // Check if tables exist
      const [tables] = await connection.execute('SHOW TABLES');
      if (tables.length > 0) {
        console.log(`   ✅ Found ${tables.length} table(s)`);
      } else {
        console.log('   ⚠️  Database is empty (tables will be created on first run)');
      }
    } else {
      console.log(`   ❌ Database '${dbName}' does not exist!`);
      console.log(`   Create it with: CREATE DATABASE ${dbName};`);
    }
    
    await connection.end();
    console.log('\n✅ All checks passed! Your local setup is ready.');
  } catch (err) {
    console.log(`   ❌ MySQL connection failed: ${err.message}`);
    console.log('\n   Possible issues:');
    console.log('   - MySQL is not running');
    console.log('   - Wrong host/port in .env');
    console.log('   - Wrong username/password in .env');
    console.log('\n   To fix:');
    console.log('   1. Make sure MySQL is running');
    console.log('   2. Check your .env file settings');
    console.log('   3. Try connecting manually: mysql -u root -p');
  }
}

checkSetup().catch(console.error);
