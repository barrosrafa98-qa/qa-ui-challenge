// api/server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const yaml = require('js-yaml');

const app = express();
const PORT = 3000;
app.use(cors());
app.use(express.json());

// Load SQLite DB
const path = require('path');
const dbPath = path.resolve(__dirname, '..', 'db', 'seed.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('Failed to load DB at:', dbPath, err);
    process.exit(1);
  }
  console.log('DB loaded at:', dbPath);
});

// Load Swagger
const swaggerDocument = yaml.load(fs.readFileSync('./swagger.yaml', 'utf8'));
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Endpoints
app.get('/users/:id', (req, res) => {
    db.get('SELECT * FROM users WHERE id=?', [req.params.id], (err, row) => {
        if(err) return res.status(500).json({error: err.message});
        if(!row) return res.status(404).json({error: 'User not found'});
        res.json(row);
    });
});

app.get('/tasks/:userId', (req, res) => {
    db.all('SELECT * FROM tasks WHERE user_id=?', [req.params.userId], (err, rows) => {
        if(err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

app.post('/tasks', (req, res) => {
    const {user_id, title, description, status} = req.body;
    db.run(
        'INSERT INTO tasks(user_id, title, description, status) VALUES(?,?,?,?)',
        [user_id, title, description, status],
        function(err){
            if(err) return res.status(500).json({error: err.message});
            res.json({id: this.lastID});
        }
    );
});

app.put('/tasks/:id', (req, res) => {
    const {title, description, status} = req.body;
    db.run(
        'UPDATE tasks SET title=?, description=?, status=? WHERE id=?',
        [title, description, status, req.params.id],
        function(err){
            if(err) return res.status(500).json({error: err.message});
            res.json({updated: this.changes});
        }
    );
});

app.delete('/tasks/:id', (req, res) => {
    db.run('DELETE FROM tasks WHERE id=?', [req.params.id], function(err){
        if(err) return res.status(500).json({error: err.message});
        res.json({deleted: this.changes});
    });
});

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
