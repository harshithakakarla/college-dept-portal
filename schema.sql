CREATE DATABASE IF NOT EXISTS college_department_portal
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE college_department_portal;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(60) NOT NULL,
  role ENUM('administrator', 'faculty', 'student') NOT NULL,
  roll_no VARCHAR(32) NULL,
  semester TINYINT UNSIGNED NULL,
  employee_id VARCHAR(32) NULL,
  designation VARCHAR(120) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_roll_no (roll_no),
  UNIQUE KEY uq_users_employee_id (employee_id),
  CONSTRAINT chk_users_student_semester CHECK (semester IS NULL OR semester BETWEEN 1 AND 8)
);

CREATE TABLE IF NOT EXISTS student_profiles (
  user_id BIGINT UNSIGNED NOT NULL,
  registration_no VARCHAR(32) NULL,
  phone VARCHAR(32) NULL,
  section CHAR(1) NOT NULL DEFAULT 'A',
  batch VARCHAR(16) NULL,
  gender VARCHAR(32) NULL,
  cgpa DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
  blood_group VARCHAR(8) NULL,
  parent_contact VARCHAR(120) NULL,
  address TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_student_registration_no (registration_no),
  CONSTRAINT fk_student_profile_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT chk_student_cgpa CHECK (cgpa >= 0 AND cgpa <= 10)
);

CREATE TABLE IF NOT EXISTS faculty_profiles (
  user_id BIGINT UNSIGNED NOT NULL,
  qualification VARCHAR(255) NULL,
  specialization VARCHAR(255) NULL,
  phone VARCHAR(32) NULL,
  office VARCHAR(160) NULL,
  joining_date DATE NULL,
  status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_faculty_profile_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS courses (
  code VARCHAR(16) NOT NULL,
  name VARCHAR(160) NOT NULL,
  credits TINYINT UNSIGNED NOT NULL,
  semester TINYINT UNSIGNED NOT NULL,
  faculty_user_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (code),
  KEY idx_courses_semester (semester),
  CONSTRAINT fk_course_faculty FOREIGN KEY (faculty_user_id)
    REFERENCES faculty_profiles (user_id) ON DELETE SET NULL,
  CONSTRAINT chk_course_credits CHECK (credits > 0),
  CONSTRAINT chk_course_semester CHECK (semester BETWEEN 1 AND 8)
);

CREATE TABLE IF NOT EXISTS student_course_attendance (
  student_user_id BIGINT UNSIGNED NOT NULL,
  course_code VARCHAR(16) NOT NULL,
  attended_classes SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  total_classes SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (student_user_id, course_code),
  CONSTRAINT fk_attendance_summary_student FOREIGN KEY (student_user_id)
    REFERENCES student_profiles (user_id) ON DELETE CASCADE,
  CONSTRAINT fk_attendance_summary_course FOREIGN KEY (course_code)
    REFERENCES courses (code) ON DELETE CASCADE,
  CONSTRAINT chk_attendance_counts CHECK (attended_classes <= total_classes)
);

CREATE TABLE IF NOT EXISTS attendance_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_code VARCHAR(16) NOT NULL,
  faculty_user_id BIGINT UNSIGNED NULL,
  semester TINYINT UNSIGNED NOT NULL,
  section CHAR(1) NOT NULL,
  class_date DATE NOT NULL,
  period VARCHAR(80) NOT NULL,
  topic VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_attendance_session_date (class_date),
  KEY idx_attendance_session_course (course_code, class_date),
  CONSTRAINT fk_attendance_session_course FOREIGN KEY (course_code)
    REFERENCES courses (code),
  CONSTRAINT fk_attendance_session_faculty FOREIGN KEY (faculty_user_id)
    REFERENCES faculty_profiles (user_id) ON DELETE SET NULL,
  CONSTRAINT chk_attendance_session_semester CHECK (semester BETWEEN 1 AND 8)
);

CREATE TABLE IF NOT EXISTS attendance_records (
  session_id BIGINT UNSIGNED NOT NULL,
  student_user_id BIGINT UNSIGNED NOT NULL,
  status ENUM('Present', 'Absent', 'Late') NOT NULL,
  remarks VARCHAR(255) NULL,
  PRIMARY KEY (session_id, student_user_id),
  KEY idx_attendance_records_student (student_user_id),
  CONSTRAINT fk_attendance_record_session FOREIGN KEY (session_id)
    REFERENCES attendance_sessions (id) ON DELETE CASCADE,
  CONSTRAINT fk_attendance_record_student FOREIGN KEY (student_user_id)
    REFERENCES student_profiles (user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assessments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_code VARCHAR(16) NOT NULL,
  assessment_type ENUM('IA-1', 'IA-2', 'Assignment') NOT NULL,
  max_marks DECIMAL(6, 2) NOT NULL,
  passing_marks DECIMAL(6, 2) NOT NULL DEFAULT 0,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_assessment_course_type (course_code, assessment_type),
  CONSTRAINT fk_assessment_course FOREIGN KEY (course_code)
    REFERENCES courses (code) ON DELETE CASCADE,
  CONSTRAINT fk_assessment_creator FOREIGN KEY (created_by)
    REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT chk_assessment_marks CHECK (max_marks > 0 AND passing_marks <= max_marks)
);

CREATE TABLE IF NOT EXISTS student_marks (
  assessment_id BIGINT UNSIGNED NOT NULL,
  student_user_id BIGINT UNSIGNED NOT NULL,
  marks DECIMAL(6, 2) NOT NULL DEFAULT 0,
  remarks VARCHAR(255) NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (assessment_id, student_user_id),
  CONSTRAINT fk_student_marks_assessment FOREIGN KEY (assessment_id)
    REFERENCES assessments (id) ON DELETE CASCADE,
  CONSTRAINT fk_student_marks_student FOREIGN KEY (student_user_id)
    REFERENCES student_profiles (user_id) ON DELETE CASCADE,
  CONSTRAINT chk_student_marks_nonnegative CHECK (marks >= 0)
);

CREATE TABLE IF NOT EXISTS notices (
  id VARCHAR(64) NOT NULL,
  title VARCHAR(200) NOT NULL,
  category ENUM('Academic', 'Examinations', 'Placements', 'Events') NOT NULL,
  priority ENUM('Urgent', 'High', 'Normal') NOT NULL DEFAULT 'Normal',
  target ENUM('Students', 'Faculty', 'All') NOT NULL DEFAULT 'All',
  author_user_id BIGINT UNSIGNED NULL,
  author_name VARCHAR(160) NOT NULL,
  summary VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  attachment VARCHAR(255) NULL,
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  published_on DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notices_published (published_on),
  KEY idx_notices_audience (target, category),
  CONSTRAINT fk_notice_author FOREIGN KEY (author_user_id)
    REFERENCES users (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  activity_type VARCHAR(32) NOT NULL DEFAULT 'general',
  message VARCHAR(500) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_activity_created (created_at),
  CONSTRAINT fk_activity_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS portal_records (
  collection_name ENUM('faculty', 'students', 'courses', 'attendance', 'notices', 'activities') NOT NULL,
  record_id VARCHAR(128) NOT NULL,
  owner_user_id BIGINT UNSIGNED NULL,
  payload JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (collection_name, record_id),
  KEY idx_portal_records_owner (owner_user_id, collection_name),
  CONSTRAINT fk_portal_record_owner FOREIGN KEY (owner_user_id)
    REFERENCES users (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  session_id VARCHAR(128) NOT NULL,
  expires BIGINT UNSIGNED NOT NULL,
  data MEDIUMTEXT,
  PRIMARY KEY (session_id),
  KEY idx_sessions_expires (expires)
);
