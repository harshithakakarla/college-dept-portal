# Vel Tech University Department Information Management Portal (CDIMP)

A responsive web portal for Vel Tech University's Department of Computer Science & Engineering. A Node.js/Express REST API uses MySQL for authentication, sessions, and persistent portal records; LocalStorage is used as a responsive browser cache.

## Authentication

- Separate login and registration routes: `#login` and `#register`.
- Students can register with a department roll number, semester, email, and password.
- Names allow English letters and spaces; email addresses must be lowercase and use letters, numbers, dots, and the required email separators (including `.edu.in` domains such as `name@veltech.edu.in`). Passwords require at least 8 characters, including uppercase, lowercase, and a special character.
- Faculty and administrator accounts must be provisioned by department staff with `npm run create-user`.
- Passwords are bcrypt-hashed. Sessions use an HTTP-only cookie and are persisted in the MySQL `sessions` table.
- Login attempts are rate-limited. Never expose the app directly to the internet without HTTPS and suitable deployment protections.
- Portal records (faculty, students, courses, attendance, notices, and activities) are read and written through role-protected `/api/data` endpoints and stored in MySQL.
- Student users can read only their own student profile and attendance rows. Administrators manage all records; faculty workflows have role-limited access.

## Set up and run on Windows

Requirements: Node.js 18 or newer and MySQL 8.0.16 or newer.

1. Create the schema by running `schema.sql` with a MySQL administrator account, for example from PowerShell:

   ```powershell
   Get-Content .\schema.sql | mysql -u root -p
   ```

   If you already created the database with an earlier schema, apply `migrations/20261020-semesters-1-through-8.sql` to update the semester constraints.

2. Create a restricted MySQL account for the portal (use your own strong password):

   ```sql
   CREATE USER 'cdimp_app'@'localhost' IDENTIFIED BY 'change-this-password';
   GRANT SELECT, INSERT, UPDATE, DELETE ON college_department_portal.* TO 'cdimp_app'@'localhost';
   ```

3. Copy `.env.example` to `.env`. Set the MySQL connection values and replace `SESSION_SECRET` with a random value of at least 32 characters.
4. Install dependencies from the project folder:

   ```powershell
   npm install
   ```

5. Create an administrator (and faculty accounts as required):

   ```powershell
   npm run create-user
   ```

   Follow the prompts. The account password is not echoed to the terminal.

6. Start the server and open `http://localhost:3000`:

   ```powershell
   npm start
   ```

   Alternatively, run `run_portal.bat`; it installs dependencies on first use, starts the server, waits for the MySQL health check, and opens the app.

## Deploy to Vercel

The Express server can be deployed to Vercel with the repository connected to a Vercel project. Set `SESSION_SECRET`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and `NODE_ENV=production` in the Vercel project's Production environment. The MySQL server must accept secure connections from Vercel; `DB_HOST=localhost` is not suitable for hosted deployment. Apply `schema.sql` to that database before using the portal.

The frontend is in `public/` so Vercel can serve its static files. Deployments require a Vercel account linked to the GitHub repository.

The server's `/api/health` endpoint returns `{"status":"ok"}` only when its MySQL connection succeeds. If startup fails, check the `DB_*` values in `.env`, confirm MySQL is running, and grant the configured user access to the database.

Opening `index.html` directly with `file://` is not supported because the browser must reach the server API. The API stores the portal's module records in MySQL's `portal_records` table and mirrors them into LocalStorage for rendering. The normalized academic tables in `schema.sql` are available for future migration; the current module CRUD API uses the JSON record table.

## Included portal modules

- Department home and notice board
- Administrator dashboard and analytics
- Faculty and student directory management
- Attendance marking and internal marks entry
- Student dashboard, attendance warnings, and printable hall ticket
- LocalStorage browser cache with MySQL-backed REST persistence for portal records
