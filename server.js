// server.js
const express = require('express');
const path = require('path');
const { DialogueExplorer, db } = require('./dialogueExplorer');

const explorer = new DialogueExplorer();
const app = express();

// Resolve actor input (either id or name) to an actor id from the DB
function resolveActorId(actorInput) {
    if (!actorInput || String(actorInput).trim().length === 0) return 0;

    // If it's numeric, just use it
    const asNumber = parseInt(actorInput, 10);
    if (!Number.isNaN(asNumber)) return asNumber;

    // Otherwise treat it as a name (case-insensitive, substring match)
    const name = String(actorInput).toLowerCase();
    const row = db
        .prepare(
            "SELECT id FROM actors WHERE LOWER(name) LIKE ? ORDER BY id LIMIT 1"
        )
        .get(`%${name}%`);

    return row ? row.id : 0; // 0 means "no limit"
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Basic ping
app.get('/api/status', (req, res) => {
    res.json({ ok: true });
});

// Search lines
app.post('/api/search', (req, res) => {
    const { query, actorName, actorId, style } = req.body || {};
    try {
        const actorLimit = resolveActorId(actorName || actorId);
        const results = explorer.searchlines(
            query || '',
            actorLimit,
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
    const { actorName, actorId } = req.body || {};
    try {
        const actorLimit = resolveActorId(actorName || actorId);
        const text = explorer.actorDump(actorLimit, true, false, true);
        res.json({ text });
    } catch (e) {
        res.status(500).json({ error: e.message });
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
