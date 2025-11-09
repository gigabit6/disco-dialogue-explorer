// exportActorsJson.js
//Called on start, used for populating the select list.
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// Usage:
//   node exportActorsJson.js            -> uses dialogue.db, writes actors.json
//   node exportActorsJson.js my.db out.json

const dbPath = process.argv[2] || 'dialogue.db';
const outPath = process.argv[3] || 'actors.json';

const db = new Database(dbPath);

console.log(`📊 Exporting actors (with line counts) from ${dbPath} to ${outPath}...\n`);

const query = `
  SELECT 
    a.id        AS id,
    a.name      AS name,
    COUNT(d.id) AS line_count
  FROM actors a
  LEFT JOIN dentries d ON d.actor = a.id
  GROUP BY a.id, a.name
  ORDER BY line_count DESC;
`;

try {
    const rows = db.prepare(query).all();

    if (!rows || rows.length === 0) {
        console.log('⚠️ No actors found in database. Nothing to export.');
        process.exit(0);
    }

    // Nice compact JSON: [{id, name, line_count}, ...]
    const json = JSON.stringify(rows, null, 2);
    const fullOutPath = path.resolve(outPath);

    fs.writeFileSync(fullOutPath, json, 'utf8');

    console.log(`✅ Exported ${rows.length} actors to ${fullOutPath}`);
} catch (err) {
    console.error('❌ Error during export:', err);
    process.exit(1);
}
