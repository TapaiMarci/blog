import express from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Statikus fájlok kiszolgálása a 'public' mappából
app.use(express.static(path.join(__dirname, 'public')));

// Alkalmazás adatbázis létrehozása és inicializálása
const db = new Database(path.join(__dirname, 'data', 'database.sqlite'));

db.prepare(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`).run();

const initialPosts = [
  {author: "Anna", title:"Anna konyhája", category:"Étel", content:"Anna kedvenc sütije", time:"2025-05-20T00:00:00Z", last:"2025-05-21T00:00:00Z"},
  {author: "Bazsi", title:"Földön kívüli a marsról", category:"SCI-FI", content:"Egy új fajta földlakó", time:"2025-03-18T00:00:00Z", last:"2025-03-30T00:00:00Z"},
  {author: "Gábor", title:"Gábor autós sorozata", category:"Motosport", content:"Gábor kedvenc autói", time:"2025-04-13T00:00:00Z", last:"2025-04-14T00:00:00Z"},
];

// Feltöltés, ha üres a tábla
const count = db.prepare('SELECT COUNT(*) as c FROM posts').get().c;
if (count === 0) {
  const insert = db.prepare(`
    INSERT INTO posts (author, title, category, content, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const post of initialPosts) {
    insert.run(post.author, post.title, post.category, post.content, post.time, post.last);
  }
}

// API végpontok

// Összes poszt lekérése
app.get('/posts', (req, res) => {
  const posts = db.prepare('SELECT * FROM posts ORDER BY created_at DESC').all();
  res.json(posts);
});

// Egy poszt lekérése id alapján
app.get('/posts/:id', (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  res.json(post);
});

// Új poszt létrehozása
app.post('/posts', (req, res) => {
  const { author, title, category, content } = req.body;
  if (!author || !title || !category || !content) {
    return res.status(400).json({ message: 'Missing fields' });
  }
  const now = new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO posts (author, title, category, content, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(author, title, category, content, now, now);
  res.status(201).json({ id: result.lastInsertRowid, author, title, category, content });
});

// Poszt szerkesztése
app.put('/posts/:id', (req, res) => {
  const { author, title, category, content } = req.body;
  if (!author || !title || !category || !content) {
    return res.status(400).json({ message: 'Missing fields' });
  }
  const now = new Date().toISOString();
  const result = db.prepare(`
    UPDATE posts SET author = ?, title = ?, category = ?, content = ?, updated_at = ? WHERE id = ?
  `).run(author, title, category, content, now, req.params.id);
  if (result.changes === 0) return res.status(404).json({ message: 'Post not found' });
  res.json({ id: req.params.id, author, title, category, content });
});

// Poszt törlése
app.delete('/posts/:id', (req, res) => {
  const result = db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ message: 'Post not found' });
  res.status(204).end();
});

// 404 kezelő middleware (opcionális, szebb hibaüzenet)
app.use((req, res) => {
  res.status(404).send('Az oldal nem található!');
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server fut a ${PORT} porton`);
});
