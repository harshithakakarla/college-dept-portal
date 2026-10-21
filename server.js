require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { rateLimit } = require('express-rate-limit');

const requiredEnv = ['SESSION_SECRET', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const EMAIL_PATTERN = /^[a-z0-9]+(?:\.[a-z0-9]+)*@[a-z0-9]+(?:\.[a-z0-9]+)+$/;
const NAME_PATTERN = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9\s]).{8,}$/;
const missingEnv = requiredEnv.filter(name => !process.env[name]);
if (missingEnv.length) {
  throw new Error(`Missing required environment variables: ${missingEnv.join(', ')}`);
}
if (process.env.SESSION_SECRET.length < 32 || process.env.SESSION_SECRET.startsWith('replace-with-')) {
  throw new Error('Set SESSION_SECRET to a random value of at least 32 characters in .env.');
}

const app = express();
const dbSsl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined;
const dbConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: dbSsl,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0
};
const pool = mysql.createPool(dbConfig);
const sessionStore = new MySQLStore({
  clearExpired: true,
  checkExpirationInterval: 15 * 60 * 1000,
  expiration: 24 * 60 * 60 * 1000,
  createDatabaseTable: false,
  schema: { tableName: 'sessions' }
}, pool);

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(session({
  name: 'cdimp.sid',
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false
});
const COLLECTIONS = new Set(['faculty', 'students', 'courses', 'attendance', 'notices', 'activities']);
const READ_ROLES = {
  faculty: ['administrator', 'faculty'],
  students: ['administrator', 'faculty', 'student'],
  courses: ['administrator', 'faculty', 'student'],
  attendance: ['administrator', 'faculty', 'student'],
  notices: ['administrator', 'faculty', 'student'],
  activities: ['administrator']
};
const WRITE_ROLES = {
  faculty: ['administrator', 'faculty'],
  students: ['administrator', 'faculty'],
  courses: ['administrator'],
  attendance: ['administrator', 'faculty'],
  notices: ['administrator', 'faculty'],
  activities: ['administrator', 'faculty']
};

function requireUser(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Sign in to continue.' });
  next();
}

function canAccessCollection(user, collection, write) {
  const permissions = write ? WRITE_ROLES : READ_ROLES;
  return Boolean(permissions[collection] && permissions[collection].includes(user.role));
}

function parseRecordPayload(payload) {
  return typeof payload === 'string' ? JSON.parse(payload) : payload;
}

function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    badge: row.role === 'student' ? `B.Tech CSE - ${row.semester}th Sem` : (row.designation || row.role),
    rollNo: row.roll_no || undefined,
    semester: row.semester || undefined,
    employeeId: row.employee_id || undefined,
    designation: row.designation || undefined
  };
}

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate(error => error ? reject(error) : resolve());
  });
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save(error => error ? reject(error) : resolve());
  });
}

function destroySession(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy(error => error ? reject(error) : resolve());
  });
}

app.get('/api/health', async (req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/register', authLimiter, async (req, res, next) => {
  try {
    const { name, email, password, role, rollNo, semester } = req.body || {};
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim() : '';
    const cleanRollNo = typeof rollNo === 'string' ? rollNo.trim().toUpperCase() : '';
    const requestedSemester = Number(semester);

    if (role !== 'student') {
      return res.status(400).json({ error: 'Only student self-registration is available. Contact the department for staff access.' });
    }
    if (cleanName.length < 2 || cleanName.length > 120 || !NAME_PATTERN.test(cleanName)) {
      return res.status(400).json({ error: 'Name may contain English letters and single spaces only.' });
    }
    if (cleanEmail.length > 254 || !EMAIL_PATTERN.test(cleanEmail)) {
      return res.status(400).json({ error: 'Use a lowercase email address with letters, numbers, and dots only.' });
    }
    if (typeof password !== 'string' || !PASSWORD_PATTERN.test(password) || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ error: 'Password needs 8 or more characters, uppercase and lowercase letters, and a special character.' });
    }
    if (!/^[A-Z0-9-]{3,32}$/.test(cleanRollNo)) {
      return res.status(400).json({ error: 'Enter a valid roll number (3 to 32 letters, numbers, or hyphens).' });
    }
    if (!Number.isInteger(requestedSemester) || requestedSemester < 1 || requestedSemester > 8) {
      return res.status(400).json({ error: 'Choose a semester from 1 to 8.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const connection = await pool.getConnection();
    let insertResult;
    let studentRecord;
    try {
      await connection.beginTransaction();
      [insertResult] = await connection.execute(
        'INSERT INTO users (name, email, password_hash, role, roll_no, semester) VALUES (?, ?, ?, ?, ?, ?)',
        [cleanName, cleanEmail, passwordHash, 'student', cleanRollNo, requestedSemester]
      );
      await connection.execute(
        'INSERT INTO student_profiles (user_id, section) VALUES (?, ?)',
        [insertResult.insertId, 'A']
      );
      studentRecord = {
        id: `stu-${insertResult.insertId}`,
        rollNo: cleanRollNo,
        regNo: '',
        name: cleanName,
        email: cleanEmail,
        phone: '',
        semester: requestedSemester,
        section: 'A',
        batch: '',
        gender: 'Not specified',
        cgpa: 0,
        attendance: { overall: 0, totalClasses: 0, attendedClasses: 0, subjects: {} },
        marks: {}
      };
      await connection.execute(
        'INSERT INTO portal_records (collection_name, record_id, owner_user_id, payload) VALUES (?, ?, ?, ?)',
        ['students', studentRecord.id, insertResult.insertId, JSON.stringify(studentRecord)]
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    const user = publicUser({
      id: insertResult.insertId,
      name: cleanName,
      email: cleanEmail,
      role: 'student',
      roll_no: cleanRollNo,
      semester: requestedSemester
    });
    await regenerateSession(req);
    req.session.user = user;
    await saveSession(req);
    res.status(201).json({ user, studentRecord });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'That email address or roll number is already registered.' });
    }
    next(error);
  }
});

app.post('/api/auth/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password, role } = req.body || {};
    const cleanEmail = typeof email === 'string' ? email.trim() : '';
    if (!EMAIL_PATTERN.test(cleanEmail) || typeof password !== 'string' || !['administrator', 'faculty', 'student'].includes(role)) {
      return res.status(400).json({ error: 'Enter your email, password, and account role.' });
    }
    if (Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ error: 'Password is too long.' });
    }

    const [rows] = await pool.execute(
      'SELECT id, name, email, password_hash, role, roll_no, semester, employee_id, designation FROM users WHERE email = ? LIMIT 1',
      [cleanEmail]
    );
    const account = rows[0];
    if (!account || account.role !== role || !(await bcrypt.compare(password, account.password_hash))) {
      return res.status(401).json({ error: 'Invalid email, password, or account role.' });
    }

    const user = publicUser(account);
    await regenerateSession(req);
    req.session.user = user;
    await saveSession(req);
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not signed in.' });
  res.json({ user: req.session.user });
});

app.post('/api/auth/logout', async (req, res, next) => {
  try {
    if (req.session) await destroySession(req);
    res.clearCookie('cdimp.sid', {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.get('/api/data/:collection', async (req, res, next) => {
  try {
    const { collection } = req.params;
    if (!COLLECTIONS.has(collection)) return res.status(404).json({ error: 'Unknown data collection.' });
    if (collection !== 'notices' && !req.session.user) {
      return res.status(401).json({ error: 'Sign in to access portal data.' });
    }
    if (req.session.user && !canAccessCollection(req.session.user, collection, false)) {
      return res.status(403).json({ error: 'Your account cannot access this data.' });
    }

    if (req.session.user && req.session.user.role === 'student' && collection === 'students') {
      const [rows] = await pool.execute(
        'SELECT payload FROM portal_records WHERE collection_name = ? AND owner_user_id = ?',
        [collection, req.session.user.id]
      );
      return res.json({ records: rows.map(row => parseRecordPayload(row.payload)) });
    }
    if (req.session.user && req.session.user.role === 'faculty' && collection === 'students') {
      const [rows] = await pool.execute(
        'SELECT payload FROM portal_records WHERE collection_name = ? ORDER BY created_at, record_id',
        [collection]
      );
      const records = rows.map(row => parseRecordPayload(row.payload)).map(record => ({
        id: record.id,
        rollNo: record.rollNo,
        name: record.name,
        email: record.email,
        semester: record.semester,
        section: record.section,
        avatar: record.avatar,
        attendance: record.attendance,
        marks: record.marks
      }));
      return res.json({ records });
    }

    const [rows] = await pool.execute(
      'SELECT payload FROM portal_records WHERE collection_name = ? ORDER BY created_at, record_id',
      [collection]
    );
    const records = rows.map(row => parseRecordPayload(row.payload));
    if (req.session.user && req.session.user.role === 'student' && collection === 'attendance') {
      const visibleRecords = records.map(record => ({
        ...record,
        records: Array.isArray(record.records)
          ? record.records.filter(attendance => attendance.rollNo === req.session.user.rollNo)
          : []
      })).filter(record => record.records.length > 0);
      return res.json({ records: visibleRecords });
    }
    res.json({ records });
  } catch (error) {
    next(error);
  }
});

app.put('/api/data/:collection/:id', requireUser, async (req, res, next) => {
  try {
    const { collection, id } = req.params;
    const { record } = req.body || {};
    if (!COLLECTIONS.has(collection)) return res.status(404).json({ error: 'Unknown data collection.' });
    if (!id || id.length > 128 || !record || typeof record !== 'object' || Array.isArray(record)) {
      return res.status(400).json({ error: 'A valid record is required.' });
    }
    if (Buffer.byteLength(JSON.stringify(record), 'utf8') > 1024 * 1024) {
      return res.status(413).json({ error: 'Record is larger than 1 MB.' });
    }
    if (String(record.id) !== id) return res.status(400).json({ error: 'Record ID does not match the request.' });
    if (!canAccessCollection(req.session.user, collection, true)) {
      return res.status(403).json({ error: 'Your account cannot modify this data.' });
    }
    if (collection === 'faculty' && req.session.user.role === 'faculty' && record.email !== req.session.user.email) {
      return res.status(403).json({ error: 'Faculty can only update their own profile.' });
    }
    if (collection === 'attendance' && req.session.user.role === 'student') {
      return res.status(403).json({ error: 'Students cannot modify attendance records.' });
    }

    const ownerUserId = req.session.user.role === 'student'
      ? req.session.user.id
      : (record.email === req.session.user.email ? req.session.user.id : null);
    let recordToSave = record;
    if (collection === 'students' && req.session.user.role === 'faculty') {
      const [existingRows] = await pool.execute(
        'SELECT payload FROM portal_records WHERE collection_name = ? AND record_id = ?',
        [collection, id]
      );
      if (!existingRows.length) {
        return res.status(403).json({ error: 'Faculty cannot create student records.' });
      }
      const existing = parseRecordPayload(existingRows[0].payload);
      if (record.rollNo !== existing.rollNo || record.email !== existing.email) {
        return res.status(403).json({ error: 'Faculty cannot change student identity or enrollment details.' });
      }
      recordToSave = {
        ...existing,
        attendance: record.attendance,
        marks: record.marks
      };
    }
    await pool.execute(
      `INSERT INTO portal_records (collection_name, record_id, owner_user_id, payload)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         owner_user_id = COALESCE(VALUES(owner_user_id), owner_user_id),
         payload = VALUES(payload)`,
      [collection, id, ownerUserId, JSON.stringify(recordToSave)]
    );
    res.json({ record: recordToSave });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/data/:collection/:id', requireUser, async (req, res, next) => {
  try {
    const { collection, id } = req.params;
    if (!COLLECTIONS.has(collection)) return res.status(404).json({ error: 'Unknown data collection.' });
    if (!canAccessCollection(req.session.user, collection, true)) {
      return res.status(403).json({ error: 'Your account cannot delete this data.' });
    }
    if (req.session.user.role !== 'administrator' && ['faculty', 'students', 'courses'].includes(collection)) {
      return res.status(403).json({ error: 'Only administrators can delete this data.' });
    }
    await pool.execute(
      'DELETE FROM portal_records WHERE collection_name = ? AND record_id = ?',
      [collection, id]
    );
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.use('/css', express.static(path.join(__dirname, 'public', 'css')));
app.use('/js', express.static(path.join(__dirname, 'public', 'js')));
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request is too large.' });
  }
  console.error('Portal request failed:', error);
  res.status(500).json({ error: 'The server could not complete the request.' });
});

async function start() {
  await pool.query('SELECT 1');
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => console.log(`Portal available at http://localhost:${port}`));
}

if (require.main === module) {
  start().catch(error => {
    console.error('Could not start portal:', error.message);
    process.exit(1);
  });
}

module.exports = app;
