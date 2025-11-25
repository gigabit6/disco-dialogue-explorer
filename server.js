// server.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require('multer');
const { DialogueExplorer, db } = require('./dialogueExplorer');

const explorer = new DialogueExplorer();
const app = express();

const PUBLIC_DIR = path.join(__dirname, "public");

// Ensure public/ exists
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });

// --- 🌍 Serve static files ---
app.use(express.static(PUBLIC_DIR));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic ping
app.get('/api/status', (req, res) => {
    res.json({ ok: true });
});


const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

// simple middleware to protect admin routes
function authenticateAdmin(req, res, next) {
    const token = req.query.token || req.headers['x-admin-token'];
    if (token !== ADMIN_TOKEN) {
        return res.status(401).send('Unauthorized');
    }
    next();
}

const upload = multer({
    dest: '/data',  // temp path for uploaded files, in the volume
});

// TEMPORARY: upload a new DB file
app.post('/admin/upload-db', authenticateAdmin, upload.single('file'), (req, res) => {
    const fs = require('fs');
    const path = require('path');

    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }

    const tempPath = req.file.path;
    const finalPath = DB_PATH; // e.g. /data/dialogue.db

    // move/overwrite into place
    fs.rename(tempPath, finalPath, (err) => {
        if (err) {
            console.error('Error moving uploaded DB file:', err);
            return res.status(500).send('Failed to store DB file');
        }
        console.log(`New DB uploaded to ${finalPath}`);
        return res.send('DB uploaded successfully. Redeploy to reload DB.');
    });
});

// Search lines
app.post('/api/search', (req, res) => {
    const { query, actorId, style } = req.body || {};
    try {
        const results = explorer.searchlines(
            query || '',
            actorId,
            style || 'all'
        );
        res.json({ results });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Select one search result as current line & initialise browse context
app.post('/api/select-search', (req, res) => {
    const { index } = req.body || {};
    try {
        const selected = explorer.selectSearchOption(parseInt(index, 10));
        // prime forward/back choices
        explorer.traceBackOrForth(false);
        explorer.traceBackOrForth(true);
        res.json({
            selectedLine: selected,
            convoText: explorer.outputLineCollectionStr(true, false, true, true, true),
            forwardOptions: explorer.getForwardOptStrs(true),
            backwardOptions: explorer.getBackwardOptStrs(true),
            conversationInfo: explorer.conversationinfo(),
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- NEW: search checks ---
app.post('/api/search-checks', (req, res) => {
    const { skill, minDifficulty, maxDifficulty } = req.body || {};
    try {
        const results = explorer.searchChecks(
            skill || null,
            minDifficulty !== undefined ? minDifficulty : null,
            maxDifficulty !== undefined ? maxDifficulty : null
        );
        res.json({ results });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- NEW: select a check result & prime browse ---
app.post('/api/select-check', (req, res) => {
    const { index } = req.body || {};
    try {
        const selected = explorer.selectCheckOption(parseInt(index, 10));
        // same priming logic as select-search
        explorer.traceBackOrForth(false);
        explorer.traceBackOrForth(true);
        res.json({
            selectedLine: selected,
            convoText: explorer.outputLineCollectionStr(true, false, true, true, true),
            forwardOptions: explorer.getForwardOptStrs(true),
            backwardOptions: explorer.getBackwardOptStrs(true),
            conversationInfo: explorer.conversationinfo(),
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- NEW: checks meta (skills + difficulty bounds) ---
app.get('/api/checks-meta', (req, res) => {
    try {
        const meta = explorer.getCheckSearchMeta();
        res.json(meta);
    } catch (e) {
        console.error('Error in /api/checks-meta:', e);
        res.status(500).json({ error: e.message });
    }
});

// Trace forward/back by picking an option index
app.post('/api/trace', (req, res) => {
    const { direction, index } = req.body || {};
    try {
        if (direction === 'forward') {
            explorer.selectForwTraceOpt(parseInt(index, 10));
        } else if (direction === 'backward') {
            explorer.selectBackTraceOpt(parseInt(index, 10));
        }
        // recompute frontier
        explorer.traceBackOrForth(false);
        explorer.traceBackOrForth(true);

        res.json({
            convoText: explorer.outputLineCollectionStr(true, false, true, true, true),
            forwardOptions: explorer.getForwardOptStrs(true),
            backwardOptions: explorer.getBackwardOptStrs(true),
            conversationInfo: explorer.conversationinfo(),
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Dump current conversation
app.post('/api/dump-convo', (req, res) => {
    try {
        const text = explorer.dialoguedump(true, false, true);
        res.json({ text, conversationInfo: explorer.conversationinfo() });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Dump by actor id
app.post('/api/dump-actor', (req, res) => {
    const { actorId } = req.body || {};
    try {
        const text = explorer.actorDump(actorId, true, false, true);
        res.json({ text });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


app.get("/api/variables", (req, res) => {
    try {
        const raw = String(req.query.q || "").trim();
        const q = raw.toLowerCase();

        const data = explorer.variableSearch(q);

        res.json(data);
    } catch (err) {
        console.error("Error in /api/variables:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/actors', (req, res) => {
    try {
        const data = explorer.getActorNameAndId();

        if (!data || data.length === 0) {
            // Return an empty array is usually nicer for the frontend
            return res.json([]);
        }

        res.json(data);
    } catch (err) {
        console.error('Error fetching actors:', err);
        res.status(500).json({ error: 'Failed to fetch actors' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(
        `Server running on http://localhost:${PORT} using DB at ${
            process.argv[2] || 'test.db'
        }`
    );
});