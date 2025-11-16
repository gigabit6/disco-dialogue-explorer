// server.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { DialogueExplorer, db } = require('./dialogueExplorer');

const explorer = new DialogueExplorer();
const app = express();

const DB_PATH = process.argv[2] || process.env.DB_PATH || "test.db";
const PUBLIC_DIR = path.join(__dirname, "public");
const ACTORS_JSON_PATH = path.join(PUBLIC_DIR, "actors.json");

// Ensure public/ exists
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });

// --- 🧠 Auto-generate actors.json from the DB ---
try {
    console.log(`📦 Generating actors.json from "${DB_PATH}"...`);
    execSync(`node exportActorsJson.js "${DB_PATH}" "${ACTORS_JSON_PATH}"`, {
        stdio: "inherit",
    });
    console.log(`✅ actors.json generated successfully at ${ACTORS_JSON_PATH}`);
} catch (err) {
    console.error("❌ Failed to generate actors.json:", err);
}

// --- 🌍 Serve static files ---
app.use(express.static(PUBLIC_DIR));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic ping
app.get('/api/status', (req, res) => {
    res.json({ ok: true });
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(
        `Server running on http://localhost:${PORT} using DB at ${
            process.argv[2] || 'test.db'
        }`
    );
});


app.get('/actors.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'actors.json'));
});