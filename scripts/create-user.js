require('dotenv').config();

const readline = require('readline');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const EMAIL_PATTERN = /^[a-z0-9]+(?:\.[a-z0-9]+)*@[a-z0-9]+(?:\.[a-z0-9]+)+$/;
const NAME_PATTERN = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9\s]).{8,}$/;

function ask(question) {
  const terminal = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => terminal.question(question, answer => {
    terminal.close();
    resolve(answer.trim());
  }));
}

function askPassword() {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    throw new Error('Run this command from an interactive terminal to enter the password securely.');
  }
  return new Promise((resolve, reject) => {
    process.stdout.write('Password (8-72 characters): ');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    let password = '';
    const onData = key => {
      const character = key.toString();
      if (character === '\u0003') {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener('data', onData);
        reject(new Error('Cancelled.'));
      } else if (character === '\r' || character === '\n') {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(password);
      } else if (character === '\u007f' || character === '\b') {
        password = password.slice(0, -1);
      } else if (character >= ' ') {
        password += character;
      }
    };
    process.stdin.on('data', onData);
  });
}

async function main() {
  const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const missingEnv = requiredEnv.filter(name => !process.env[name]);
  if (missingEnv.length) throw new Error(`Missing required environment variables: ${missingEnv.join(', ')}`);

  const name = await ask('Full name (letters and spaces only): ');
  const email = await ask('Email address (e.g. name@veltech.edu.in): ');
  const role = (await ask('Role (administrator/faculty): ')).toLowerCase();
  if (!['administrator', 'faculty'].includes(role)) {
    throw new Error('Only administrator and faculty accounts can be created with this tool.');
  }
  const employeeId = role === 'faculty' ? (await ask('Employee ID: ')).toUpperCase() : null;
  const designation = role === 'faculty' ? await ask('Designation: ') : null;
  const password = await askPassword();
  if (name.length < 2 || name.length > 120 || !NAME_PATTERN.test(name)) throw new Error('Name must use English letters and single spaces only.');
  if (!EMAIL_PATTERN.test(email) || email.length > 254) throw new Error('Email must use lowercase letters, numbers, and dots only.');
  if (!PASSWORD_PATTERN.test(password) || Buffer.byteLength(password, 'utf8') > 72) throw new Error('Password needs 8 or more characters, uppercase and lowercase letters, and a special character.');
  if (role === 'faculty' && (!employeeId || !designation)) throw new Error('Faculty employee ID and designation are required.');

  const hash = await bcrypt.hash(password, 12);
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined
  });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      'INSERT INTO users (name, email, password_hash, role, employee_id, designation) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hash, role, employeeId, designation]
    );
    if (role === 'faculty') {
      await connection.execute(
        'INSERT INTO faculty_profiles (user_id) VALUES (?)',
        [result.insertId]
      );
    }
    await connection.commit();
    console.log(`${role} account created for ${email}.`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch(error => {
  console.error(`Could not create account: ${error.message}`);
  process.exitCode = 1;
});
