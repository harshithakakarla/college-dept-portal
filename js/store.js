/**
 * College Department Information Management Portal
 * Storage & Data Layer (Persistent LocalStorage with default seeding)
 */

const STORAGE_KEYS = {
  FACULTY: 'cdimp_faculty_v1',
  STUDENTS: 'cdimp_students_v1',
  NOTICES: 'cdimp_notices_v1',
  COURSES: 'cdimp_courses_v1',
  ATTENDANCE: 'cdimp_attendance_logs_v1',
  ACTIVITIES: 'cdimp_activities_v1'
};

const Store = {
  currentUser: null,
  collectionKeys: {
    faculty: STORAGE_KEYS.FACULTY,
    students: STORAGE_KEYS.STUDENTS,
    notices: STORAGE_KEYS.NOTICES,
    courses: STORAGE_KEYS.COURSES,
    attendance: STORAGE_KEYS.ATTENDANCE,
    activities: STORAGE_KEYS.ACTIVITIES
  },

  init() {
    localStorage.removeItem('cdimp_users_v1');
    if (!localStorage.getItem(STORAGE_KEYS.FACULTY)) {
      localStorage.setItem(STORAGE_KEYS.FACULTY, JSON.stringify(DEFAULT_FACULTY));
    }
    if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(DEFAULT_STUDENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTICES)) {
      localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(DEFAULT_NOTICES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.COURSES)) {
      localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(DEFAULT_COURSES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(DEFAULT_ATTENDANCE_LOGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(DEFAULT_ACTIVITIES));
    }
  },

  resetToDefault() {
    localStorage.setItem(STORAGE_KEYS.FACULTY, JSON.stringify(DEFAULT_FACULTY));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(DEFAULT_STUDENTS));
    localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(DEFAULT_NOTICES));
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(DEFAULT_COURSES));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(DEFAULT_ATTENDANCE_LOGS));
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(DEFAULT_ACTIVITIES));
  },

  getCurrentUser() {
    return this.currentUser;
  },

  setCurrentUser(user) {
    if (user) {
      this.currentUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        badge: user.badge,
        rollNo: user.rollNo,
        semester: user.semester,
        employeeId: user.employeeId,
        designation: user.designation
      };
    } else {
      this.currentUser = null;
    }
  },

  async apiRequest(url, options = {}) {
    const response = await fetch(url, {
      credentials: 'same-origin',
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {})
      }
    });
    if (response.status === 204) return null;
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'The portal server rejected the request.');
    return result;
  },

  persistRecord(collection, record) {
    this.apiRequest(`/api/data/${collection}/${encodeURIComponent(record.id)}`, {
      method: 'PUT',
      body: JSON.stringify({ record })
    }).catch(error => {
      if (typeof App !== 'undefined') App.showToast(`Could not save ${collection} data to MySQL: ${error.message}`, 'error');
    });
  },

  deleteRecord(collection, id) {
    this.apiRequest(`/api/data/${collection}/${encodeURIComponent(id)}`, { method: 'DELETE' })
      .catch(error => {
        if (typeof App !== 'undefined') App.showToast(`Could not delete ${collection} data from MySQL: ${error.message}`, 'error');
      });
  },

  async syncCollection(collection, records, removeMissing = false) {
    const result = await this.apiRequest(`/api/data/${collection}`);
    const existing = result.records || [];
    if (records.length === 0 && existing.length === 0) return;
    if (records.length === 0 && !removeMissing) return;
    for (const record of records) {
      await this.apiRequest(`/api/data/${collection}/${encodeURIComponent(record.id)}`, {
        method: 'PUT',
        body: JSON.stringify({ record })
      });
    }
    if (removeMissing) {
      const ids = new Set(records.map(record => String(record.id)));
      for (const record of existing) {
        if (!ids.has(String(record.id))) {
          await this.apiRequest(`/api/data/${collection}/${encodeURIComponent(record.id)}`, { method: 'DELETE' });
        }
      }
    }
  },

  async loadPortalData(seedIfEmpty = false) {
    const user = this.getCurrentUser();
    if (!user) return;
    const collections = user.role === 'administrator'
      ? Object.keys(this.collectionKeys)
      : (user.role === 'faculty'
        ? ['faculty', 'students', 'courses', 'attendance', 'notices']
        : ['students', 'courses', 'attendance', 'notices']);

    for (const collection of collections) {
      const result = await this.apiRequest(`/api/data/${collection}`);
      const records = result.records || [];
      if (records.length === 0 && seedIfEmpty && user.role === 'administrator') {
        const localRecords = JSON.parse(localStorage.getItem(this.collectionKeys[collection])) || [];
        if (localRecords.length > 0) {
          await this.syncCollection(collection, localRecords);
        }
        continue;
      }
      if (records.length > 0 || (user.role === 'student' && collection === 'students')) {
        localStorage.setItem(this.collectionKeys[collection], JSON.stringify(records));
      }
    }
  },

  // Faculty CRUD
  getFaculty() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.FACULTY)) || [];
  },

  addFaculty(facultyData) {
    const list = this.getFaculty();
    const newFac = {
      id: 'fac-' + Date.now(),
      status: 'Active',
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?w=150&auto=format&fit=crop&q=80`,
      joiningDate: new Date().toISOString().split('T')[0],
      ...facultyData
    };
    list.unshift(newFac);
    localStorage.setItem(STORAGE_KEYS.FACULTY, JSON.stringify(list));
    this.persistRecord('faculty', newFac);
    this.logActivity(`Added new faculty member: ${newFac.name} (${newFac.designation})`, 'faculty');
    return newFac;
  },

  updateFaculty(id, data) {
    let list = this.getFaculty();
    const index = list.findIndex(f => f.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...data };
      localStorage.setItem(STORAGE_KEYS.FACULTY, JSON.stringify(list));
      this.persistRecord('faculty', list[index]);
      this.logActivity(`Updated details for faculty: ${list[index].name}`, 'faculty');
      return list[index];
    }
    return null;
  },

  deleteFaculty(id) {
    let list = this.getFaculty();
    const fac = list.find(f => f.id === id);
    list = list.filter(f => f.id !== id);
    localStorage.setItem(STORAGE_KEYS.FACULTY, JSON.stringify(list));
    if (fac) this.deleteRecord('faculty', id);
    if (fac) this.logActivity(`Removed faculty member: ${fac.name}`, 'faculty');
    return true;
  },

  // Student CRUD
  getStudents() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS)) || [];
  },

  getStudentById(id) {
    const list = this.getStudents();
    return list.find(s => s.id === id || s.rollNo === id) || null;
  },

  addStudent(studentData) {
    const list = this.getStudents();
    const newStudent = {
      id: 'stu-' + Date.now(),
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      cgpa: parseFloat(studentData.cgpa) || 8.0,
      semester: parseInt(studentData.semester) || 6,
      section: studentData.section || 'A',
      attendance: studentData.attendance || {
        overall: 85.0,
        totalClasses: 180,
        attendedClasses: 153,
        subjects: {}
      },
      marks: studentData.marks || {},
      ...studentData
    };
    list.unshift(newStudent);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(list));
    this.persistRecord('students', newStudent);
    this.logActivity(`Enrolled new student: ${newStudent.name} (${newStudent.rollNo})`, 'student');
    return newStudent;
  },

  updateStudent(id, data) {
    let list = this.getStudents();
    const index = list.findIndex(s => s.id === id || s.rollNo === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...data };
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(list));
      this.persistRecord('students', list[index]);
      this.logActivity(`Updated profile for student: ${list[index].name} (${list[index].rollNo})`, 'student');
      return list[index];
    }
    return null;
  },

  deleteStudent(id) {
    let list = this.getStudents();
    const student = list.find(s => s.id === id || s.rollNo === id);
    list = list.filter(s => s.id !== id && s.rollNo !== id);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(list));
    if (student) this.deleteRecord('students', student.id);
    if (student) this.logActivity(`Deregistered student: ${student.name} (${student.rollNo})`, 'student');
    return true;
  },

  // Courses
  getCourses() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.COURSES)) || DEFAULT_COURSES;
  },

  // Attendance Records
  getAttendanceLogs() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) || [];
  },

  recordAttendance(attendancePayload) {
    // attendancePayload: { courseId, courseName, facultyName, semester, section, date, period, topic, records: [{ studentId, rollNo, status, remarks }] }
    const logs = this.getAttendanceLogs();
    const newLog = {
      id: 'att-log-' + Date.now(),
      ...attendancePayload
    };
    logs.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(logs));
    this.persistRecord('attendance', newLog);

    // Update students' individual attendance scores
    const students = this.getStudents();
    attendancePayload.records.forEach(rec => {
      const student = students.find(s => s.id === rec.studentId || s.rollNo === rec.rollNo);
      if (student) {
        if (!student.attendance) {
          student.attendance = { overall: 80, totalClasses: 0, attendedClasses: 0, subjects: {} };
        }
        if (!student.attendance.subjects) student.attendance.subjects = {};
        
        const subj = student.attendance.subjects[attendancePayload.courseId] || { attended: 0, total: 0, percentage: 0 };
        subj.total += 1;
        if (rec.status === 'Present') {
          subj.attended += 1;
        }
        subj.percentage = Math.round((subj.attended / subj.total) * 1000) / 10;
        student.attendance.subjects[attendancePayload.courseId] = subj;

        // Recalculate overall
        let totalClassesAll = 0;
        let attendedClassesAll = 0;
        Object.values(student.attendance.subjects).forEach(sub => {
          totalClassesAll += sub.total;
          attendedClassesAll += sub.attended;
        });
        if (totalClassesAll > 0) {
          student.attendance.totalClasses = totalClassesAll;
          student.attendance.attendedClasses = attendedClassesAll;
          student.attendance.overall = Math.round((attendedClassesAll / totalClassesAll) * 1000) / 10;
        }
      }
    });

    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    attendancePayload.records.forEach(record => {
      const student = students.find(item => item.id === record.studentId || item.rollNo === record.rollNo);
      if (student) this.persistRecord('students', student);
    });
    this.logActivity(`Attendance saved for ${attendancePayload.courseId} (${attendancePayload.presentCount}/${attendancePayload.totalStudents} Present)`, 'attendance');
    return newLog;
  },

  // Internal Marks
  saveInternalMarks(courseId, assessmentType, maxMarks, marksEntries) {
    // marksEntries: [{ studentId, rollNo, marks, remarks }]
    const students = this.getStudents();
    let updatedCount = 0;

    marksEntries.forEach(entry => {
      const student = students.find(s => s.id === entry.studentId || s.rollNo === entry.rollNo);
      if (student) {
        if (!student.marks) student.marks = {};
        if (!student.marks[courseId]) {
          student.marks[courseId] = { ia1: 0, ia2: 0, assignment: 0, maxIa: 25, total: 0, maxTotal: 75, grade: 'F' };
        }

        const markRecord = student.marks[courseId];
        const numVal = parseFloat(entry.marks) || 0;

        if (assessmentType === 'IA-1' || assessmentType === 'ia1') {
          markRecord.ia1 = numVal;
        } else if (assessmentType === 'IA-2' || assessmentType === 'ia2') {
          markRecord.ia2 = numVal;
        } else {
          markRecord.assignment = numVal;
        }

        markRecord.maxIa = parseFloat(maxMarks) || 25;
        markRecord.total = (markRecord.ia1 || 0) + (markRecord.ia2 || 0) + (markRecord.assignment || 0);
        markRecord.maxTotal = (markRecord.maxIa * 2) + 25;

        // Calculate Grade
        const pct = (markRecord.total / markRecord.maxTotal) * 100;
        if (pct >= 90) markRecord.grade = 'O';
        else if (pct >= 80) markRecord.grade = 'A+';
        else if (pct >= 70) markRecord.grade = 'A';
        else if (pct >= 60) markRecord.grade = 'B+';
        else if (pct >= 50) markRecord.grade = 'B';
        else markRecord.grade = 'F';

        updatedCount++;
      }
    });

    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    marksEntries.forEach(entry => {
      const student = students.find(item => item.id === entry.studentId || item.rollNo === entry.rollNo);
      if (student) this.persistRecord('students', student);
    });
    this.logActivity(`Published ${assessmentType} marks for ${courseId} (${updatedCount} students)`, 'marks');
    return { success: true, count: updatedCount };
  },

  // Notices CRUD
  getNotices() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTICES)) || [];
  },

  addNotice(noticeData) {
    const list = this.getNotices();
    const newNotice = {
      id: 'not-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      pinned: false,
      attachment: noticeData.attachment || 'Circular_Document.pdf',
      ...noticeData
    };
    list.unshift(newNotice);
    localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(list));
    this.persistRecord('notices', newNotice);
    this.logActivity(`Published notice: ${newNotice.title}`, 'notice');
    return newNotice;
  },

  deleteNotice(id) {
    let list = this.getNotices();
    const notice = list.find(n => n.id === id);
    list = list.filter(n => n.id !== id);
    localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(list));
    if (notice) this.deleteRecord('notices', notice.id);
    if (notice) this.logActivity(`Removed announcement: ${notice.title}`, 'notice');
    return true;
  },

  // Activity Log
  getActivities() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) || [];
  },

  logActivity(text, type = 'general') {
    const activities = this.getActivities();
    activities.unshift({
      id: 'act-' + Date.now(),
      text,
      time: 'Just now',
      type
    });
    // keep max 20
    if (activities.length > 20) activities.pop();
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
    const user = this.getCurrentUser();
    if (!user || user.role !== 'student') this.persistRecord('activities', activities[0]);
  }
};

// Auto-initialize store
Store.init();
