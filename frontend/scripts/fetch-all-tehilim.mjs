/**
 * ממלא את frontend/src/data/tehilim.js בכל 150 פרקי תהילים (עברית, ספריא).
 * הרצה: node frontend/scripts/fetch-all-tehilim.mjs
 */
import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '..', 'src', 'data', 'tehilim.js');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          try {
            const d = Buffer.concat(chunks).toString('utf8');
            resolve(JSON.parse(d));
          } catch (e) {
            reject(new Error(`${e.message} for ${url}`));
          }
        });
      })
      .on('error', reject);
  });
}

function clean(s) {
  return String(s || '')
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&thinsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const data = {};
for (let ch = 1; ch <= 150; ch += 1) {
  const url = `https://www.sefaria.org/api/texts/Psalms.${ch}?lang=he&context=0&commentary=0`;
  const j = await fetchJson(url);
  const verses = Array.isArray(j.he) ? j.he.map(clean).filter(Boolean) : [];
  if (!verses.length) {
    throw new Error(`Chapter ${ch}: no verses`);
  }
  if (verses.some((v) => v.includes('\uFFFD'))) {
    throw new Error(`Chapter ${ch}: replacement char in verse (UTF-8?)`);
  }
  data[ch] = {
    verses,
    isPlaceholder: false
  };
  if (ch % 25 === 0) {
    console.log(`Fetched chapters 1–${ch}`);
  }
}

const header = '// מאגר תהילים מלא - 150 פרקים (מקרא דרך ספריא)\n';
const body = header + 'export const tehilimData = ' + JSON.stringify(data, null, 2) + ';\n';
fs.writeFileSync(outPath, body, 'utf8');
console.log('Wrote', outPath);
console.log('Chapter 119 verses:', data[119].verses.length);
