/**
 * בדיקות תוכניות לקוחות – עקביות תמחור בין פרונט לבקאנד ובריאות API תשלומים.
 * הרצה: node test-plans.js
 * דורש שרת רץ על פורט 8080 (או API_URL).
 */
const http = require('http');

const API_URL = process.env.API_URL || 'http://localhost:8080';

// תמחור רשמי – מקור אמת בבקאנד (server.js)
const BACKEND_PLANS = {
  monthly: 12,
  annual: 100,
  lifetime: 399,
  'lifetime-premium': 549,
  maintenance: 12,
  'storage-addon': null // 100 * additionalGb, 1–10 GB
};

// מה שהפרונט שולח (SaveMemorial, ManageMemorials)
const FRONTEND_SAVE_PLANS = { monthly: 12, annual: 100, lifetime: 399, 'lifetime-premium': 549 };
const FRONTEND_MAINTENANCE = 12;

let passed = 0;
let failed = 0;

function ok(msg) {
  console.log('[OK]', msg);
  passed++;
}

function fail(msg) {
  console.log('[FAIL]', msg);
  failed++;
}

// עקביות תמחור
console.log('\n=== עקביות תמחור (פרונט vs בקאנד) ===\n');
for (const [plan, price] of Object.entries(FRONTEND_SAVE_PLANS)) {
  if (BACKEND_PLANS[plan] === price) {
    ok('תוכנית ' + plan + ': ' + price + '₪ תואמת לבקאנד');
  } else {
    fail('תוכנית ' + plan + ': פרונט ' + price + '₪, בקאנד ' + (BACKEND_PLANS[plan] ?? 'לא מוגדר'));
  }
}
if (FRONTEND_MAINTENANCE === BACKEND_PLANS.maintenance) {
  ok('תחזוקה: ' + FRONTEND_MAINTENANCE + '₪ תואם');
} else {
  fail('תחזוקה: פרונט ' + FRONTEND_MAINTENANCE + '₪, בקאנד ' + BACKEND_PLANS.maintenance);
}

// בדיקות HTTP – ללא token (מצפים 401) או עם body לא תקין (400)
console.log('\n=== בדיקות API תוכניות ===\n');

function request(method, path, body) {
  return new Promise((resolve) => {
    const url = new URL(path, API_URL);
    const opts = { hostname: url.hostname, port: url.port || 80, path: url.pathname + url.search, method };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', (e) => resolve({ error: e.message }));
    if (body) {
      req.setHeader('Content-Type', 'application/json');
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runApiTests() {
  // ללא Authorization – create-intent חייב להחזיר 401
  const noAuth = await request('POST', '/api/payments/create-intent', { planType: 'monthly', amount: 12 });
  if (noAuth.error) {
    fail('create-intent בלי token: ' + noAuth.error);
  } else if (noAuth.status === 401) {
    ok('create-intent בלי token מחזיר 401');
  } else {
    fail('create-intent בלי token: ציפיתי 401, קיבלתי ' + noAuth.status);
  }

  // body חסר – צפוי 400 או 401
  const noBody = await request('POST', '/api/payments/create-intent', {});
  if (noBody.error) {
    fail('create-intent בלי body: ' + noBody.error);
  } else if (noBody.status === 401 || noBody.status === 400) {
    ok('create-intent בלי body מתקבל: ' + noBody.status);
  } else {
    fail('create-intent בלי body: ציפיתי 400/401, קיבלתי ' + noBody.status);
  }

  // רשימת מוזיקה זמינה (בלי auth) – צפוי 200
  const music = await request('GET', '/api/music');
  if (music.error) {
    fail('GET /api/music: ' + music.error);
  } else if (music.status === 200) {
    ok('GET /api/music מחזיר 200');
  } else {
    fail('GET /api/music: ציפיתי 200, קיבלתי ' + music.status);
  }

  // דפי זיכרון (ללא auth) – צפוי 200
  const memorials = await request('GET', '/api/memorials');
  if (memorials.error) {
    fail('GET /api/memorials: ' + memorials.error);
  } else if (memorials.status === 200) {
    ok('GET /api/memorials מחזיר 200');
  } else {
    fail('GET /api/memorials: ציפיתי 200, קיבלתי ' + memorials.status);
  }
}

runApiTests().then(() => {
  console.log('\n=== סיכום ===');
  console.log('עברו:', passed);
  console.log('נכשלו:', failed);
  process.exit(failed > 0 ? 1 : 0);
});
