# 🪩 Off-Air Fayde (Disco Dialogue Explorer)

A complete re-implementation of the Fayde Ruby/Tk dialogue explorer in **Node.js**.  
It allows you to explore dialogue trees and branches similarly to Fayde's on-air version, which you can visit in: https://fayde.co.uk/.

The name off-air comes from radiocomputing in Elysium, where you cannot control it remotely, as it is ran on local devices.

## Requirements

Before running the project, make sure you have:

1. **Node.js 18+**

   This is the javascript interpreter, it is necessary to run the server and database exploring logic.
   
   [https://nodejs.org/](https://nodejs.org/)  
   Check installation:
   ```bash
   node -v
   npm -v
   ```
*Note: The most recent version of Node, 25 doesn't work with the current modules for reading Sqlite3, download the LTS (latest version) number 24.*

2. **Git**

   If you are well versed with git, we reccomend intallation, since you can pull any adittins without the need for redownloading.
   
   [https://git-scm.com/](https://git-scm.com/)  
   Check installation:
   ```bash
   git --version
   ```

4. A **dialogue database** (`.db` file) that contains the following tables (or equivalents):
   

---

## Downloading the Database

This repository does **not include** the dialogue database file.

You must download it separately from the original Fayde implementation, found here:

> [Download dialogue.db (Fayde Link)](https://fayde.seadragonlair.co.uk/)



Once downloaded, place the file into the project root folder, the same place with *server.js*:

```
disco-dialogue-explorer/
├─ server.js
├─ dialogueExplorer.js
├─ package.json
├─ public/
│  └─ index.html
└─ dialogue.db   ← your downloaded file
```

You can name it anything you like, just reference it when starting the server.

---

## Installation

### 1️Clone or download the repository

```bash
git clone https://github.com/your-username/disco-dialogue-explorer.git
cd disco-dialogue-explorer
```

or alternatively the Download zip file, once downloaded extract it then acess it.

### 2️Install dependencies

Once in the folder, enter the terminal, this part may seem a tad scary, but it is just a few simple commands. You will be installing a few depepndencies first, namely, Express, the database reader, and other ones needed for the code. To enter the terminal in Windows, you can click the file path, erase everything and type ``cmd``, if you see a black window and the file path to Fayde, you did it right!

Once there, type:

```cmd
npm install
```

That will install:
- `express` – web server framework
- `better-sqlite3` – local SQLite engine
- `helmet`, `express-rate-limit` (security)

---

## Running the App

If everything isntalled correctly, the project is now runnable in your computer, we are at an early stage, so don't close that terminal just yet. The basic syntax of what you need to type is as follows

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
If no error apeared, then open your browser and visit:  
**http://localhost:3000**

---

tl;dr for each operating system you might be in:

### On Windows

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

### On macOS / Linux

```bash
cd /path/to/disco-dialogue-explorer
node server.js dialogue.db
```

---

## Configuration

### Change the Port

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
http://localhost:4000

---

### Use Environment Variable for Database

Instead of passing the path as an argument, set it as an environment variable:

```bash
DB_PATH=/absolute/path/to/dialogue.db node server.js
```

---

## Using the Web UI

When you open `http://localhost:3000`, you’ll see three tabs:

- **Search**
- **Browse**
- **Dump**

Each tab corresponds to the original Ruby GUI functionality.

---

### Search Tab

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

### Browse Tab

Displays dialogue paths and relationships.

- Shows the **current conversation**.
- Clicking **parent** moves backward.
- Clicking **child** moves forward.
- Shows actors, lines, and metadata (conditions, checks, alternates).

Each click updates the conversation graph dynamically.

---

### Dump Tab

Exports dialogue text.

- **Dump current conversation** → full conversation.
- **Dump by actor name** → all lines by a specific actor.

Output appears in a large text area, copy/paste to another file.

---

## Project Structure

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

## Troubleshooting

### `SQLITE_CANTOPEN: unable to open database file`
- The database file doesn’t exist in that path.
- Make sure it’s named correctly and in the project root.

### “Port already in use”
- Another app is using port 3000.
- Either close whatever is running, or run it on another port:  
  `PORT=4000 node server.js dialogue.db`

### No results or crashes
- Check if it's actually the Fayde given database.
- Tables must match those expected by the app.

---

## Example Full Workflow

```bash
git clone https://github.com/your-username/disco-dialogue-explorer.git
cd disco-dialogue-explorer
npm install
# Download and place dialogue.db here
node server.js dialogue.db
```

Then open:  
[http://localhost:3000](http://localhost:3000)

---

## Optional Customizations

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

## Future Improvements

- Dark mode
- Export as Markdown or JSON
- Search suggestions (actor autocomplete)
- Electron desktop wrapper (and executable)
- Graph Explorer

---

## License

**MIT License © 2025**  
You may use, modify, and distribute freely with attribution.

---

## Credits

- Original Ruby/Tk app created by morgue-xiiv: we cannot thank them enough for their contribuitions to their fandom, their work is incredible and extremely helpful to all researchers of Elysium out there.
- Thanks to all testers and contributors!

---


