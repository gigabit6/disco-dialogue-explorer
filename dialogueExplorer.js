// dialogueExplorer.js
// Core logic ported from Ruby (no GUI)

const Database = require('better-sqlite3');

// DB path comes from CLI: node server.js <dbfile>
const DB_PATH = process.argv[2] || process.env.DB_PATH || 'test.db';
const db = new Database(DB_PATH, { readonly: true });

class DialogueEntry {
    constructor(convoID, lineID) {
        const row = db
            .prepare(
                `SELECT id, title, dialoguetext, actor, conversant, conversationid,
                isgroup, hascheck, sequence, hasalts, conditionstring,
                userscript, difficultypass
         FROM dentries
         WHERE conversationid = ? AND id = ?`
            )
            .get(convoID, lineID);

        if (!row) {
            throw new Error(
                `DialogueEntry not found for conversation=${convoID}, line=${lineID}`
            );
        }

        this.id = row.id;
        this.title = row.title;
        this.dialoguetext = row.dialoguetext || '';

        this.actorid = row.actor;
        this.conversantid = row.conversant;
        this.conversationid = row.conversationid;
        this.isgroup = row.isgroup;
        this.hascheck = row.hascheck;
        this.sequence = row.sequence || '';
        this.hasalts = row.hasalts;
        this.conditionstring = row.conditionstring || '';
        this.userscript = row.userscript || '';
        const difficultypass = row.difficultypass || 0;
        this.difficultypass =
            difficultypass > 7 ? (difficultypass - 7) * 2 - 1 : difficultypass * 2;

        // Resolve actor / conversant names
        const actorRow = db
            .prepare('SELECT name FROM actors WHERE id = ?')
            .get(this.actorid);
        this.actor = actorRow && actorRow.name ? actorRow.name : String(this.actorid);

        const convRow = db
            .prepare('SELECT name FROM actors WHERE id = ?')
            .get(this.conversantid);
        this.conversant =
            convRow && convRow.name ? convRow.name : String(this.conversantid);

        // Lazy caches
        this.parents = null;
        this.children = null;
        this.checkData = undefined; // undefined=not loaded, null=no check
        this.modifiers = undefined;
        this.alternates = undefined;
    }

    getTitle() {
        return this.title;
    }

    getParents() {
        if (this.parents) return this.parents;

        const rows = db
            .prepare(
                `SELECT originconversationid AS convo, origindialogueid AS id
         FROM dlinks
         WHERE destinationconversationid = ? AND destinationdialogueid = ?`
            )
            .all(this.conversationid, this.id);

        this.parents = rows.map((r) => new DialogueEntry(r.convo, r.id));
        return this.parents;
    }

    getChildren() {
        if (this.children) return this.children;

        const rows = db
            .prepare(
                `SELECT destinationconversationid AS convo, destinationdialogueid AS id
         FROM dlinks
         WHERE originconversationid = ? AND origindialogueid = ?`
            )
            .all(this.conversationid, this.id);

        this.children = rows.map((r) => new DialogueEntry(r.convo, r.id));
        return this.children;
    }

    isHub() {
        return this.dialoguetext === '0' || this.dialoguetext.length < 2;
    }

    getCheck() {
        if (this.checkData !== undefined) return this.checkData;

        if (this.hascheck > 0) {
            const row = db
                .prepare(
                    `SELECT isred, difficulty, flagname, forced, skilltype
           FROM checks
           WHERE conversationid = ? AND dialogueid = ?`
                )
                .get(this.conversationid, this.id);

            if (!row) {
                this.checkData = null;
            } else {
                this.checkData = {
                    isred: row.isred,
                    difficulty: row.difficulty,
                    flag: row.flagname,
                    forced: row.forced,
                    skill: row.skilltype,
                };
            }
        } else {
            this.checkData = null;
        }

        return this.checkData;
    }

    getModifiers() {
        if (this.modifiers !== undefined) return this.modifiers;

        if (this.hascheck > 0) {
            const rows = db
                .prepare(
                    `SELECT tooltip, modifier, variable
           FROM modifiers
           WHERE conversationid = ? AND dialogueid = ?`
                )
                .all(this.conversationid, this.id);

            this.modifiers = rows.length ? rows : null;
        } else {
            this.modifiers = null;
        }
        return this.modifiers;
    }

    getAlternates() {
        if (this.alternates !== undefined) return this.alternates;

        if (this.hasalts > 0) {
            const rows = db
                .prepare(
                    `SELECT condition, alternateline
           FROM alternates
           WHERE conversationid = ? AND dialogueid = ?`
                )
                .all(this.conversationid, this.id);

            this.alternates = rows.length ? rows : null;
        } else {
            this.alternates = null;
        }
        return this.alternates;
    }

    getCheckString(showModifiers = true, markdown = true) {
        const ital = markdown ? '*' : '';

        const check = this.getCheck();
        let out = '';

        if (check) {
            out += `\n\t${ital}${check.skill} `;
            if (check.isred > 0) {
                out += ` RED check${ital}`;
            } else {
                out += ` WHITE check${ital}`;
            }
            out += `\n\t ${ital}Difficulty: ${check.difficulty}${ital} `;
            out += `\n\t ${ital}(flag: ${check.flag})${ital} `;
        }

        if (showModifiers) {
            const mods = this.getModifiers();
            if (mods) {
                mods.forEach((mod) => {
                    const tooltip = mod.tooltip;
                    const modifier = mod.modifier;
                    const variable = mod.variable;
                    out += `\n\t\t ${ital}${modifier} ${tooltip}${ital} `;
                    out += `\n\t\t ${ital}(${variable})${ital} `;
                });
            }
        }

        return out;
    }

    getAltStrings(markdown = true) {
        const ital = markdown ? '*' : '';
        let out = '';

        const alts = this.getAlternates();
        if (alts) {
            alts.forEach((alt) => {
                out += `\n\t ${ital}(replaced with:${alt.alternateline}${ital} `;
                out += `\n\t ${ital}if ${alt.condition})${ital} `;
            });
        }
        return out;
    }

    getLeastHubParentName() {
        const grandparents = [];
        const greatGrandparents = [];

        if (!this.isHub()) {
            return "(this isn't a hub)";
        }

        const parents = this.getParents();
        for (const parent of parents) {
            if (!parent.isHub()) return parent.getTitle();
            grandparents.push(...parent.getParents());
        }

        for (const parent of grandparents) {
            if (!parent.isHub()) return parent.getTitle();
            greatGrandparents.push(...parent.getParents());
        }

        for (const parent of greatGrandparents) {
            if (!parent.isHub()) return parent.getTitle();
            greatGrandparents.push(...parent.getParents());
        }

        return '(no useful parent)';
    }

    extraInfo() {
        const info = [this.conditionstring, this.userscript, this.sequence].filter(
            (s) => s && s.length > 1
        );

        if (this.difficultypass > 0) {
            const hardness = this.difficultypass;
            info.unshift(
                `passive check (estimate; requires ${hardness} in ${this.actor})`
            );
        }

        return info.join(': ');
    }

    toString(long = false, markdown = false, showCheck = false, showAlts = false) {
        const ital = markdown ? '*' : '';
        const bold = markdown ? '**' : '';

        let extra = this.extraInfo();
        let s = '';

        if (this.isHub()) {
            if (!extra || extra.length < 2 || extra === 'Continue()') {
                extra = this.title || '';
            }
            extra += ` (${this.getLeastHubParentName()})`;
            s = `\t${ital}HUB: ${extra}${ital} `;
        } else {
            s = `${bold}${this.actor}:${bold} ${this.dialoguetext}`;
            if (long && extra && extra.length > 1) {
                s += `\n\t${ital}${extra}${ital} `;
            }
            if (showCheck) {
                s += this.getCheckString(true, markdown) || '';
            }
            if (showAlts) {
                s += this.getAltStrings(markdown) || '';
            }
        }

        return s;
    }

    myStory(long = true) {
        let story =
            this.actor === 0
                ? 'this is a hub '
                : `${this.actor} says ${this.dialoguetext} to ${this.conversant}`;

        if (long) {
            story +=
                this.conditionstring && this.conditionstring.length > 1
                    ? ` if ${this.conditionstring}`
                    : ' unconditionally';
            story +=
                this.userscript && this.userscript.length > 1
                    ? ` and causing ${this.userscript}`
                    : ' with no action';
            story +=
                this.sequence && this.sequence.length > 1
                    ? ` and showing ${this.sequence}`
                    : ' normally';
        }

        return story;
    }

    getConvoID() {
        return this.conversationid;
    }
}

class DialogueExplorer {
    constructor() {
        this.nowLine = null;
        this.lineCollection = [];
        this.forwOptions = [];
        this.backOptions = [];
        this.searchOptions = [];
        this.nowJob = '';
    }

    lineSelected() {
        return !!this.nowLine;
    }

    collectionStarted() {
        return this.lineCollection && this.lineCollection.length > 0;
    }

    outputLineCollectionStr(
        long = false,
        removeHubs = false,
        markdown = false,
        showChecks = true,
        showAlts = false
    ) {
        let arr = this.lineCollection.map((e) =>
            e.toString(long, markdown, showChecks, showAlts)
        );
        if (removeHubs) {
            arr = arr.filter((s) => !s.includes('HUB:'));
        }
        return arr.join('\n');
    }

    getCurrentLineStr(long = false) {
        return this.nowLine ? this.nowLine.toString(long) : '';
    }

    // ---- Search ----

    getSearchOptStrs() {
        if (!this.searchOptions) return [];
        return this.searchOptions.map((e) => {
            const prefix = e.isAlt ? '(ALT) ' : '';
            const main =
                e.text && e.text.length > 3 ? `${e.actor}: ${e.text}` : e.title || e.text || '';
            return prefix + main;
        });
    }

    searchlines(searchQ = '', actorlimit = 0, searchStyle = 'all') {
        let q = searchQ || '';
        q = q.replace(/'/g, '_').replace(/"/g, '_');

        let query =
            "SELECT dentries.conversationid AS convo, dentries.id AS id, actors.name AS actor, dentries.dialoguetext AS text, dentries.title AS title " +
            'FROM dentries INNER JOIN actors ON dentries.actor = actors.id ';
        let altquery =
            "SELECT dentries.conversationid AS convo, dentries.id AS id, actors.name AS actor, alternates.alternateline AS text, 'ALT' AS title " +
            'FROM dentries ' +
            'INNER JOIN actors ON dentries.actor = actors.id ' +
            'LEFT JOIN alternates ON alternates.conversationid = dentries.conversationid AND alternates.dialogueid = dentries.id ';

        const trimmed = q.trim();

        if (trimmed.length === 0) {
            query += `WHERE actor='${actorlimit | 0}'`;
            altquery += `WHERE actor='${actorlimit | 0}'`;
        } else if (searchStyle === 'variable') {
            const searchwords = trimmed
                .split(/\s+/)
                .filter((w) => w.length >= 2);
            if (searchwords.length > 0 && searchwords.length < 5) {
                const clauses = searchwords.map(
                    (w) => `(dentries.userscript LIKE '%${w}%')`
                );
                const joined = clauses.join(' AND ');
                query += `WHERE (${joined}) OR (${joined.replace(
                    /userscript/g,
                    'conditionstring'
                )})`;
                altquery = ''; // Ruby discards altquery here
            } else {
                const like = trimmed.replace(/\s+/g, '%');
                query += `WHERE dentries.userscript LIKE '%${like}%' OR dentries.conditionstring LIKE '%${like}%'`;
                altquery = '';
            }
        } else if (searchStyle === 'phrase') {
            query += `WHERE dentries.dialoguetext LIKE '%${trimmed}%'`;
            altquery += `WHERE alternates.alternateline LIKE '%${trimmed}%'`;
        } else {
            let searchwords = trimmed
                .split(/\s+/)
                .filter((w) => w.length >= 3);
            if (searchwords.length > 0 && searchwords.length < 20) {
                const corewords = searchwords.map(
                    (w) => `(dentries.dialoguetext LIKE '%${w}%')`
                );
                const altwords = searchwords.map(
                    (w) => `(alternates.alternateline LIKE '%${w}%')`
                );
                const boolop = searchStyle === 'any' ? ' OR ' : ' AND ';
                query += `WHERE (${corewords.join(boolop)})`;
                altquery += `WHERE (${altwords.join(boolop)})`;
            } else {
                query += `WHERE dentries.dialoguetext LIKE '%${trimmed}%'`;
                altquery += `WHERE alternates.alternateline LIKE '%${trimmed}%'`;
            }
        }

        if (actorlimit > 0) {
            query += ` AND actor='${actorlimit | 0}'`;
            if (altquery) altquery += ` AND actor='${actorlimit | 0}'`;
        }

        const mainRows = db.prepare(query).all();
        let allRows = mainRows.map((r) => ({
            convoId: r.convo,
            lineId: r.id,
            actor: r.actor,
            text: r.text,
            title: r.title,
            isAlt: false,
        }));

        if (altquery) {
            const altRows = db.prepare(altquery).all();
            allRows = allRows.concat(
                altRows.map((r) => ({
                    convoId: r.convo,
                    lineId: r.id,
                    actor: r.actor,
                    text: r.text,
                    title: 'ALT',
                    isAlt: true,
                }))
            );
        }

        this.searchOptions = allRows;
        return this.getSearchOptStrs();
    }

    selectSearchOption(index) {
        const sel = this.searchOptions[index];
        if (!sel) return null;
        this.nowLine = new DialogueEntry(sel.convoId, sel.lineId);
        this.lineCollection = [this.nowLine];
        return this.nowLine.toString(true);
    }

    getForwardOptStrs(long = false) {
        return (this.forwOptions || []).map((e) => e.toString(long));
    }

    getBackwardOptStrs(long = false) {
        return (this.backOptions || []).map((e) => e.toString(long));
    }

    selectForwTraceOpt(index) {
        const sel = this.forwOptions[index];
        if (!sel) return null;
        this.lineCollection.push(sel);
        return this.lineCollection[this.lineCollection.length - 1].toString(true);
    }

    selectBackTraceOpt(index) {
        const sel = this.backOptions[index];
        if (!sel) return null;
        this.lineCollection.unshift(sel);
        return this.lineCollection[0].toString(true);
    }

    traceBackOrForth(backw = false) {
        if (!this.collectionStarted()) {
            throw new Error('No Starting Point In Line Collection.');
        }

        const lineToWorkOn = backw
            ? this.lineCollection[0]
            : this.lineCollection[this.lineCollection.length - 1];

        const nowOptions = backw
            ? lineToWorkOn.getParents()
            : lineToWorkOn.getChildren();

        if (nowOptions.length === 1) {
            if (backw) {
                this.lineCollection.unshift(nowOptions[0]);
            } else {
                this.lineCollection.push(nowOptions[0]);
            }
            this.traceBackOrForth(backw);
        } else if (backw) {
            this.backOptions = nowOptions;
        } else {
            this.forwOptions = nowOptions;
        }
    }

    removeLine(backw = false) {
        const ret = [];
        if (!this.collectionStarted()) return ret;

        if (backw) {
            for (;;) {
                if (this.lineCollection.length > 1) {
                    ret.push(this.lineCollection.shift());
                } else {
                    break;
                }
                if (this.lineCollection[0].getParents().length > 1) break;
            }
        } else {
            for (;;) {
                if (this.lineCollection.length > 1) {
                    ret.unshift(this.lineCollection.pop());
                } else {
                    break;
                }
                if (
                    this.lineCollection[this.lineCollection.length - 1].getChildren()
                        .length > 1
                )
                    break;
            }
        }
        this.traceBackOrForth(backw);
        return ret;
    }

    lineFromArray(row, long = false, markdown = false) {
        const ital = markdown ? '*' : '';
        const bold = markdown ? '**' : '';

        const actor = row.name;
        let dialoguetext = row.dialoguetext || '';
        const conditionstring = row.conditionstring || '';
        const userscript = row.userscript || '';
        const sequence = row.sequence || '';
        const difficultypass = row.difficultypass || 0;
        const title = row.title || '';
        const hascheck = row.hascheck || 0;
        const hasalts = row.hasalts || 0;

        let longInfo = '';
        if (long || dialoguetext.length < 3) {
            const parts = [conditionstring, userscript, sequence].filter(
                (s) => s && s.length > 1
            );
            if (difficultypass > 0) {
                const hardness = difficultypass;
                parts.unshift(
                    `passive ${actor} check, (difficulty ${hardness}-ish)`
                );
            }
            if (hascheck > 0 && long) parts.push(' (has an active check) ');
            if (hasalts > 0 && long) parts.push(' (has alternate lines) ');
            longInfo = parts.join(': ');
        }

        if (dialoguetext.length < 3) {
            dialoguetext = title;
        }

        let str = `${bold}${actor}:${bold} ${dialoguetext}`;
        if (longInfo && longInfo.length > 3) {
            str += `\n\t${ital}${longInfo}${ital}`;
        }
        return str;
    }

    dialoguedump(long = false, removeHubs = false, markdown = false) {
        let convoID;
        if (this.lineSelected()) {
            convoID = this.nowLine.getConvoID();
        } else if (this.collectionStarted()) {
            convoID = this.lineCollection[0].getConvoID();
        } else {
            return '';
        }

        const rows = db
            .prepare(
                `SELECT actors.name, dentries.dialoguetext, dentries.conditionstring,
                dentries.userscript, dentries.sequence, dentries.difficultypass,
                dentries.title, dentries.hascheck, dentries.hasalts
         FROM dentries
         INNER JOIN actors ON dentries.actor = actors.id
         WHERE dentries.conversationid = ?`
            )
            .all(convoID);

        let out = '';
        for (const row of rows) {
            if (removeHubs && (!row.dialoguetext || row.dialoguetext.length < 3)) {
                continue;
            }
            out += this.lineFromArray(row, long, markdown) + '\n';
        }
        return out;
    }

    actorDump(actorID, long = false, removeHubs = false, markdown = false) {
        const rows = db
            .prepare(
                `SELECT actors.name, dentries.dialoguetext, dentries.conditionstring,
                dentries.userscript, dentries.sequence, dentries.difficultypass,
                dentries.title, dentries.hascheck, dentries.hasalts
         FROM dentries
         INNER JOIN actors ON dentries.actor = actors.id
         WHERE dentries.actor = ?`
            )
            .all(actorID);

        let out = '';
        for (const row of rows) {
            if (removeHubs && (!row.dialoguetext || row.dialoguetext.length < 3)) {
                continue;
            }
            out += this.lineFromArray(row, long, markdown) + '\n';
        }
        return out;
    }

    conversationinfo() {
        let convoID;
        if (this.lineSelected()) {
            convoID = this.nowLine.getConvoID();
        } else if (this.collectionStarted()) {
            convoID = this.lineCollection[0].getConvoID();
        } else {
            return '';
        }

        const row = db
            .prepare('SELECT title, description FROM dialogues WHERE id = ?')
            .get(convoID);
        if (!row) return '';
        return `${row.title}: ${row.description}`;
    }
}

module.exports = { DialogueEntry, DialogueExplorer, db };
