const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const sessions = new Map();
const ADMIN_ONLY_PATHS = new Set([
    '/signup.html',
    '/add_department.html',
    '/manage_leaves.html',
    '/manage_payroll.html',
    '/create_payroll.html'
]);

const parseCookies = (cookieHeader = '') => {
    const cookies = {};
    cookieHeader.split(';').forEach(part => {
        const [rawKey, ...rawValue] = part.trim().split('=');
        if (!rawKey) return;
        cookies[rawKey] = decodeURIComponent(rawValue.join('=') || '');
    });
    return cookies;
};

const createSession = (user) => {
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, {
        userId: user.id,
        username: user.username,
        role: user.role
    });
    return token;
};

const getSessionFromRequest = (req) => {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies.sessionToken;
    if (!token) return null;
    return sessions.get(token) || null;
};

const setSessionCookie = (res, token) => {
    const maxAge = 24 * 60 * 60; // 1 day
    res.setHeader('Set-Cookie', `sessionToken=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}`);
};

const clearSessionCookie = (res) => {
    res.setHeader('Set-Cookie', 'sessionToken=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0');
};

const requireAdminApi = (req, res, next) => {
    const session = getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required.' });
    }
    next();
};

app.use((req, res, next) => {
    if (!ADMIN_ONLY_PATHS.has(req.path)) return next();
    const session = getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
        return res.redirect('/dashboard.html');
    }
    next();
});

// Initialize SQLite Database
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        // Create users table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            firstname TEXT,
            lastname TEXT,
            department TEXT,
            salary REAL,
            birthday TEXT,
            experience INTEGER,
            role TEXT DEFAULT 'employee'
        )`, async (err) => {
            if (err) {
                console.error('Error creating users table', err.message);
            } else {
                // Ensure admin exists
                const sql = `SELECT * FROM users WHERE username = 'admin'`;
                db.get(sql, [], async (err, row) => {
                    if (!row) {
                        const salt = await bcrypt.genSalt(10);
                        const hash = await bcrypt.hash('admin123', salt);
                        db.run(`INSERT INTO users (username, email, password_hash, role) VALUES ('admin', 'admin@ems.com', ?, 'admin')`, [hash], (err) => {
                            if (err) console.error('Error creating default admin', err.message);
                            else console.log('Default admin account created (admin/admin123)');
                        });
                    }
                });
            }
        });
    }
});

// Signup Endpoint (admin only)
app.post('/api/auth/signup', requireAdminApi, async (req, res) => {
    const { username, email, password, firstname, lastname, department, salary, birthday, experience } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ success: false, error: 'Username, email, and password are required.' });
    }

    try {
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const sql = `INSERT INTO users (username, email, password_hash, firstname, lastname, department, salary, birthday, experience) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const params = [username, email, password_hash, firstname, lastname, department, salary, birthday, experience];

        db.run(sql, params, function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ success: false, error: 'Username or email already exists.' });
                }
                return res.status(500).json({ success: false, error: err.message });
            }
            
            console.log(`--- NEW USER SIGNED UP: ${username} ---`);
            
            res.status(201).json({
                success: true,
                user: {
                    id: this.lastID,
                    username,
                    email,
                    firstname,
                    lastname,
                    department,
                    role: 'employee'
                }
            });
        });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error during signup.' });
    }
});

// Login Endpoint
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and password are required.' });
    }

    const sql = `SELECT * FROM users WHERE username = ?`;
    db.get(sql, [username], async (err, user) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid username or password.' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid username or password.' });
        }

        console.log(`--- USER LOGGED IN: ${username} ---`);

        const sessionToken = createSession(user);
        setSessionCookie(res, sessionToken);

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstname: user.firstname,
                lastname: user.lastname,
                department: user.department,
                role: user.role
            }
        });
    });
});

app.post('/api/auth/logout', (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies.sessionToken;
    if (token) sessions.delete(token);
    clearSessionCookie(res);
    res.json({ success: true });
});

app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
    console.log(`Backend Server is running on http://localhost:${PORT}`);
});
