
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001; // Use env PORT for deployment
const SECRET_KEY = 'super-secret-key-change-this-in-prod';
const DB_FILE = path.resolve(__dirname, 'database.json');

// --- HELPER: UUID Polyfill ---
const generateUUID = () => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// --- DATABASE SYSTEM (JSON FILE BASED) ---
const db = {
  data: {
    users: [],
    decks: [],
    notes: [],
    tests: [],
    stats: [], 
    chat_sessions: [],
    community: []
  },
  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileData = fs.readFileSync(DB_FILE, 'utf8');
        this.data = { ...this.data, ...JSON.parse(fileData) };
        console.log("Database loaded from file.");
      } else {
        console.log("No database found, creating new one.");
        this.seed();
        this.save();
      }
    } catch (e) {
      console.error("Error loading database:", e);
      this.seed();
    }
  },
  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2));
    } catch (e) {
      console.error("Error saving database:", e);
    }
  },
  seed() {
    const seeds = [
      {
          id: generateUUID(), type: 'deck', title: 'Biology: Cell Structure', description: 'Comprehensive guide to organelles and functions.', author: 'Dr. Science', downloads: 124, 
          data: { id: 's1', title: 'Biology: Cell Structure', description: 'Deep dive into mitochondria.', cards: [{id:'c1', front:'Powerhouse?', back:'Mitochondria', color:'bg-green-100'}], createdAt: Date.now() },
          timestamp: Date.now()
      },
      {
          id: generateUUID(), type: 'deck', title: 'Spanish Verbs 101', description: 'Conjugations for ser, estar, and ir.', author: 'Señorita A', downloads: 45, 
          data: { id: 's2', title: 'Spanish Verbs 101', description: 'Conjugations.', cards: [{id:'c2', front:'Ser', back:'To be', color:'bg-orange-100'}], createdAt: Date.now() },
          timestamp: Date.now() - 10000
      },
      {
          id: generateUUID(), type: 'note', title: 'Calculus Cheat Sheet', description: 'Derivatives and Integrals quick ref.', author: 'MathWhiz', downloads: 89, 
          data: { id: 's3', title: 'Calculus Cheat Sheet', subject: 'Math', content: '<b>Power Rule:</b> nx^(n-1)', background: 'grid', createdAt: Date.now(), lastModified: Date.now() },
          timestamp: Date.now() - 20000
      },
      {
          id: generateUUID(), type: 'deck', title: 'World Capitals', description: 'Test your geography knowledge.', author: 'GeoMaster', downloads: 12,
          data: { id: 's4', title: 'World Capitals', description: 'Hard mode geography.', cards: [{id:'c3', front:'Capital of Australia?', back:'Canberra', color:'bg-blue-100'}], createdAt: Date.now() },
          timestamp: Date.now() - 30000
      },
      {
          id: generateUUID(), type: 'note', title: 'React Hooks Guide', description: 'useEffect, useState, and custom hooks.', author: 'CodeNinja', downloads: 156,
          data: { id: 's5', title: 'React Hooks', subject: 'CS', content: '<b>useEffect:</b> Side effects.', background: 'lined', createdAt: Date.now(), lastModified: Date.now() },
          timestamp: Date.now() - 40000
      }
    ];
    this.data.community = seeds;
  }
};

db.load();

app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));

// API Logger
app.use((req, res, next) => {
  // console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// --- API Routes (Prefix /api) ---

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.get('/api/health', (req, res) => {
    res.json({ status: 'online', message: 'Card Snaps Backend Functional' });
});

// AUTH
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });

    if (db.data.users.find(u => u.email === email)) {
        return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = generateUUID();
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

    const newUser = {
        id, email, password: hashedPassword, name, avatar,
        gradeLevel: '10th Grade',
        themeMode: 'dark', colorScheme: 'midnight', enableSeasonal: true,
        created_at: Date.now()
    };

    db.data.users.push(newUser);
    db.data.stats.push({ userId: id, xp: 0, goals: [] });
    db.save();

    const token = jwt.sign({ id, email }, SECRET_KEY);
    const { password: _, ...userSafe } = newUser;
    res.json({ token, user: userSafe });
  } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Server Error" });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.data.users.find(u => u.email === email);
  
  if (!user) return res.status(400).json({ error: "User not found" });
  
  if (await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY);
    const { password: _, ...userSafe } = user;
    res.json({ token, user: userSafe });
  } else {
    res.status(403).json({ error: "Invalid password" });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
    const user = db.data.users.find(u => u.id === req.user.id);
    if(!user) return res.sendStatus(404);
    const { password: _, ...userSafe } = user;
    res.json(userSafe);
});

app.put('/api/user/preferences', authenticateToken, (req, res) => {
    const { themeMode, colorScheme, enableSeasonal } = req.body;
    const user = db.data.users.find(u => u.id === req.user.id);
    if (user) {
        user.themeMode = themeMode;
        user.colorScheme = colorScheme;
        user.enableSeasonal = enableSeasonal;
        db.save();
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "User not found" });
    }
});

// DECKS
app.get('/api/decks', authenticateToken, (req, res) => {
    const userDecks = db.data.decks.filter(d => d.userId === req.user.id).sort((a,b) => b.created_at - a.created_at);
    const processed = userDecks.map(d => ({
        ...d,
        cards: typeof d.cards === 'string' ? JSON.parse(d.cards) : d.cards,
        createdAt: d.created_at
    }));
    res.json(processed);
});

app.post('/api/decks', authenticateToken, (req, res) => {
    const { id, title, description, cards } = req.body;
    const deckId = id || generateUUID();
    const newDeck = {
        id: deckId,
        userId: req.user.id,
        title,
        description,
        cards: cards, 
        created_at: Date.now()
    };
    db.data.decks.unshift(newDeck);
    db.save();
    res.json(newDeck);
});

app.put('/api/decks/:id', authenticateToken, (req, res) => {
    const { title, description, cards } = req.body;
    const deck = db.data.decks.find(d => d.id === req.params.id && d.userId === req.user.id);
    if (deck) {
        deck.title = title;
        deck.description = description;
        deck.cards = cards;
        db.save();
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "Deck not found" });
    }
});

app.delete('/api/decks/:id', authenticateToken, (req, res) => {
    const initialLen = db.data.decks.length;
    db.data.decks = db.data.decks.filter(d => !(d.id === req.params.id && d.userId === req.user.id));
    if (db.data.decks.length !== initialLen) {
        db.save();
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "Deck not found" });
    }
});

// NOTES
app.get('/api/notes', authenticateToken, (req, res) => {
    const userNotes = db.data.notes.filter(n => n.userId === req.user.id).sort((a,b) => b.updated_at - a.updated_at);
    res.json(userNotes.map(n => ({
        ...n,
        createdAt: n.created_at,
        lastModified: n.updated_at
    })));
});

app.post('/api/notes', authenticateToken, (req, res) => {
    const { id, title, subject, content, background } = req.body;
    const existing = db.data.notes.find(n => n.id === id && n.userId === req.user.id);
    
    if (existing) {
        existing.title = title;
        existing.subject = subject;
        existing.content = content;
        existing.background = background;
        existing.updated_at = Date.now();
    } else {
        db.data.notes.unshift({
            id: id || generateUUID(),
            userId: req.user.id,
            title, subject, content, background,
            created_at: Date.now(),
            updated_at: Date.now()
        });
    }
    db.save();
    res.json(req.body);
});

app.delete('/api/notes/:id', authenticateToken, (req, res) => {
    db.data.notes = db.data.notes.filter(n => !(n.id === req.params.id && n.userId === req.user.id));
    db.save();
    res.json({ success: true });
});

// TESTS
app.get('/api/tests', authenticateToken, (req, res) => {
    const userTests = db.data.tests.filter(t => t.userId === req.user.id).sort((a,b) => a.date - b.date);
    res.json(userTests.map(t => ({...t, topics: Array.isArray(t.topics) ? t.topics : JSON.parse(t.topics)})));
});

app.post('/api/tests', authenticateToken, (req, res) => {
    const { id, title, date, topics } = req.body;
    const newTest = {
        id: id || generateUUID(),
        userId: req.user.id,
        title, date, topics
    };
    db.data.tests.push(newTest);
    db.save();
    res.json(newTest);
});

app.delete('/api/tests/:id', authenticateToken, (req, res) => {
    db.data.tests = db.data.tests.filter(t => !(t.id === req.params.id && t.userId === req.user.id));
    db.save();
    res.json({ success: true });
});

// STATS
app.get('/api/stats', authenticateToken, (req, res) => {
    const s = db.data.stats.find(s => s.userId === req.user.id);
    if (!s) return res.json(null);
    res.json(s);
});

app.post('/api/stats', authenticateToken, (req, res) => {
    const newStats = req.body;
    const index = db.data.stats.findIndex(s => s.userId === req.user.id);
    if (index !== -1) {
        db.data.stats[index] = { ...db.data.stats[index], ...newStats };
    } else {
        db.data.stats.push({ userId: req.user.id, ...newStats });
    }
    db.save();
    res.json({ success: true });
});

// CHATS
app.get('/api/chats', authenticateToken, (req, res) => {
    const chats = db.data.chat_sessions.filter(c => c.userId === req.user.id).sort((a,b) => b.lastActive - a.lastActive);
    res.json(chats);
});

app.post('/api/chats', authenticateToken, (req, res) => {
    const { id, title, messages, lastActive } = req.body;
    const existing = db.data.chat_sessions.find(c => c.id === id && c.userId === req.user.id);
    
    if (existing) {
        existing.title = title;
        existing.messages = messages;
        existing.lastActive = lastActive;
    } else {
        db.data.chat_sessions.unshift({
            id, userId: req.user.id, title, messages, lastActive
        });
    }
    db.save();
    res.json({ success: true });
});

// COMMUNITY
app.get('/api/community', (req, res) => {
    const items = db.data.community.sort((a,b) => b.timestamp - a.timestamp).slice(0, 50);
    res.json(items);
});

app.post('/api/community', (req, res) => {
    const { id, type, title, description, author, data } = req.body;
    if (db.data.community.find(i => i.id === id)) {
        return res.json({ success: true, message: "Already shared" });
    }
    
    const newItem = {
        id: id || generateUUID(),
        type, title, description, author, data,
        downloads: 0,
        timestamp: Date.now()
    };
    
    db.data.community.unshift(newItem);
    db.save();
    res.json({ success: true, id: newItem.id });
});

app.post('/api/community/:id/download', (req, res) => {
    const item = db.data.community.find(i => i.id === req.params.id);
    if (item) {
        item.downloads += 1;
        db.save();
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "Item not found" });
    }
});

// --- SERVE FRONTEND (Deployment Support) ---
// Serve static files from the build folder (e.g., 'dist' or 'build')
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all route to serve the React index.html for non-API routes
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found' });
    }
    // Check if dist/index.html exists (production)
    if (fs.existsSync(path.join(__dirname, 'dist', 'index.html'))) {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    } else {
        res.send("Backend running. Frontend build not found. To deploy: build React app to 'dist' folder.");
    }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`CardSnaps Server running on port ${PORT}`);
});
