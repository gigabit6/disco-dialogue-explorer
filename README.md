# 🗣️ Disco Dialogue Explorer (Node + SQLite)

A complete re-implementation of the classic Ruby/Tk dialogue explorer in **Node.js**.  
It allows you to explore and search a game’s dialogue stored in a SQLite database — all through a modern browser interface.

---

## ✨ Features

- 🔍 Search dialogue lines by **text**, **actor name**, or **variable**
- 🧭 Browse **forward/backward** through dialogue links
- 📘 Dump **entire conversations** or **actor lines**
- 🧱 No native dependencies — works everywhere Node.js does
- 🖥️ Simple web UI accessible at `http://localhost:3000`
- ⚡ Fast local database access using `better-sqlite3`

---

## 🧰 Requirements

Before running the project, make sure you have:

1. **Node.js 20.x, 22.x, 23.x, or 24.x**  
   👉 [https://nodejs.org/](https://nodejs.org/)  
   Check installation:
   ```bash
   node -v
   npm -v

2. **Git**  
   👉 [https://git-scm.com/](https://git-scm.com/)  
   Check installation:
   ```bash
   git --version
   ```

3. A **dialogue database** (`.db` file) that contains the following tables (or equivalents):
   ```
   actors, dentries, dlinks, dialogues, alternates, checks, modifiers
   ```

---

## 📦 Downloading the Database

This repository does **not include** the dialogue database file.

You must download it separately from your project’s storage or distribution source.

> 🗂️ Example:  
> [Download dialogue.db (Fayde Link)](https://fayde.seadragonlair.co.uk/)

Download Final Cut version

Once downloaded, place the file into the project root folder:

```
disco-dialogue-explorer/
├─ server.js
├─ dialogueExplorer.js
├─ package.json
├─ public/
│  └─ index.html
└─ dialogue.db   ← your downloaded file
```

You can name it anything you like — just reference it when starting the server.

---

## ⚙️ Installation

### 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/disco-dialogue-explorer.git
cd disco-dialogue-explorer
```

### 2️⃣ Install dependencies

```bash
npm install
```

That installs:
- `express` – web server framework
- `better-sqlite3` – local SQLite engine
- `helmet`, `express-rate-limit` (optional security)

---

## 🚀 Running the App

### Basic syntax
```bash
node server.js <database-path>
```

For example:
```bash
node server.js dialogue.db
```

Expected output:
```
Server running on http://localhost:3000 using DB at dialogue.db
```

Then open your browser and visit:  
👉 **http://localhost:3000**

---

### 🪟 On Windows

#### PowerShell
```powershell
cd "C:\path\to\disco-dialogue-explorer"
node server.js dialogue.db
```

#### Command Prompt
```bat
cd C:\path\to\disco-dialogue-explorer
node server.js dialogue.db
```

---

### 💻 On macOS / Linux

```bash
cd /path/to/disco-dialogue-explorer
node server.js dialogue.db
```

---

## ⚙️ Configuration

### 🔸 Change the Port

Default port: `3000`

**macOS / Linux**
```bash
PORT=4000 node server.js dialogue.db
```

**Windows PowerShell**
```powershell
$env:PORT = 4000
node server.js dialogue.db
```

Then open:  
👉 http://localhost:4000

---

### 🔸 Use Environment Variable for Database

Instead of passing the path as an argument, set it as an environment variable:

```bash
DB_PATH=/absolute/path/to/dialogue.db node server.js
```

---

## 🌐 Using the Web UI

When you open `http://localhost:3000`, you’ll see three tabs:

- **Search**
- **Browse**
- **Dump**

Each tab corresponds to the original Ruby GUI functionality.

---

### 🔍 Search Tab

Search the dialogue database.

**Inputs**
- **Search text** — words, phrases, or variable names.
- **Actor name** — partial match (e.g. “Kim” finds “Kim Kitsuragi”).
- **Search style:**
    - `all words`
    - `any word`
    - `exact phrase`
    - `variable / condition`

**How to use**
1. Enter search text.
2. Optionally specify an actor name.
3. Click **Search**.
4. Results appear below — click a line to preview.
5. Click **Open in Browse tab** to view it in context.

---

### 🧭 Browse Tab

Displays dialogue paths and relationships.

- Shows the **current conversation**.
- Clicking **parent** moves backward.
- Clicking **child** moves forward.
- Shows actors, lines, and metadata (conditions, checks, alternates).

Each click updates the conversation graph dynamically.

---

### 📘 Dump Tab

Exports dialogue text.

- **Dump current conversation** → full conversation.
- **Dump by actor name** → all lines by a specific actor.

Output appears in a large text area — copy/paste to another file.

---

## 🗂️ Project Structure

```
disco-dialogue-explorer/
├─ server.js              # Express backend + routes
├─ dialogueExplorer.js    # Core dialogue model and DB logic
├─ package.json           # Dependencies
├─ public/
│  ├─ index.html          # Browser UI
│  └─ ...
└─ dialogue.db            # Your SQLite database
```

---

## 🧩 Troubleshooting

### ❌ `SQLITE_CANTOPEN: unable to open database file`
- The database file doesn’t exist in that path.
- Make sure it’s named correctly and in the project root.

### ❌ “Port already in use”
- Another app is using port 3000.
- Run on another port:  
  `PORT=4000 node server.js dialogue.db`

### ❌ No results or crashes
- Check your DB structure.
- Tables must match those expected by the app.

---

## 🧪 Example Full Workflow

```bash
git clone https://github.com/your-username/disco-dialogue-explorer.git
cd disco-dialogue-explorer
npm install
# Download and place dialogue.db here
node server.js dialogue.db
```

Then open:  
👉 [http://localhost:3000](http://localhost:3000)

---

## 🔧 Optional Customizations

### Change default port permanently
Edit `server.js`:

```js
const PORT = process.env.PORT || 3000;
```

Change `3000` to another value (e.g. `8080`).

### Auto-load a specific DB file
Edit `server.js` to default to your file name:

```js
const dbPath = process.argv[2] || process.env.DB_PATH || "dialogue.db";
```

---

## 🧠 Future Improvements

- Dark mode
- Export as Markdown or JSON
- Search suggestions (actor autocomplete)
- Electron desktop wrapper
- Multi-database support
- Authentication / multi-user login

---

## 📜 License

**MIT License © 2025**  
You may use, modify, and distribute freely with attribution.

---

## ❤️ Credits

- Original Ruby/Tk app — *FAYDE project*
- Rewritten and modernized in Node.js + Express
- Thanks to all testers and contributors!

---


