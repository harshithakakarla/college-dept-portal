USE college_department_portal;

ALTER TABLE users
  DROP CHECK chk_users_student_semester,
  ADD CONSTRAINT chk_users_student_semester
    CHECK (semester IS NULL OR semester BETWEEN 1 AND 8);

ALTER TABLE courses
  DROP CHECK chk_course_semester,
  ADD CONSTRAINT chk_course_semester
    CHECK (semester BETWEEN 1 AND 8);

ALTER TABLE attendance_sessions
  DROP CHECK chk_attendance_session_semester,
  ADD CONSTRAINT chk_attendance_session_semester
    CHECK (semester BETWEEN 1 AND 8);
