/**
 * College Department Information Management Portal
 * Default Seed Dataset: Department of Computer Science & Engineering
 */

const DEFAULT_COURSES = [
  { id: 'CS601', code: 'CS601', name: 'Distributed Systems', credits: 4, semester: 6, faculty: 'Dr. Sarah Jenkins' },
  { id: 'CS602', code: 'CS602', name: 'Compiler Design', credits: 4, semester: 6, faculty: 'Prof. David Vance' },
  { id: 'CS603', code: 'CS603', name: 'Artificial Intelligence & Machine Learning', credits: 4, semester: 6, faculty: 'Dr. Anita Roy' },
  { id: 'CS604', code: 'CS604', name: 'Computer Networks', credits: 3, semester: 6, faculty: 'Prof. Marcus Chen' },
  { id: 'CS605', code: 'CS605', name: 'Full-Stack Web Engineering', credits: 3, semester: 6, faculty: 'Dr. Priya Sharma' },
  { id: 'CS606', code: 'CS606', name: 'Cloud Computing Laboratory', credits: 2, semester: 6, faculty: 'Prof. Rahul Verma' },
  { id: 'CS401', code: 'CS401', name: 'Design and Analysis of Algorithms', credits: 4, semester: 4, faculty: 'Dr. Sarah Jenkins' },
  { id: 'CS402', code: 'CS402', name: 'Database Management Systems', credits: 4, semester: 4, faculty: 'Prof. Elena Rostova' }
];

const DEFAULT_FACULTY = [
  {
    id: 'fac-1',
    employeeId: 'EMP-CSE-101',
    name: 'Dr. Sarah Jenkins',
    designation: 'Associate Professor & Academic Head',
    qualification: 'Ph.D. in Distributed Systems, MIT',
    specialization: 'Cloud Architectures & Distributed Consensus',
    email: 'sarah.jenkins@college.edu',
    phone: '+1 (555) 234-8901',
    office: 'Cabin 304, CSE Tech Block',
    joiningDate: '2018-08-15',
    subjects: ['CS601: Distributed Systems', 'CS401: Algorithms'],
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'fac-2',
    employeeId: 'EMP-CSE-102',
    name: 'Prof. David Vance',
    designation: 'Professor & Head of Department (HOD)',
    qualification: 'Ph.D. in Computer Science, Stanford',
    specialization: 'Compilers, Formal Languages & Systems',
    email: 'hod.cse@college.edu',
    phone: '+1 (555) 234-8902',
    office: 'HOD Suite 301, CSE Tech Block',
    joiningDate: '2012-06-01',
    subjects: ['CS602: Compiler Design'],
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'fac-3',
    employeeId: 'EMP-CSE-103',
    name: 'Dr. Anita Roy',
    designation: 'Associate Professor',
    qualification: 'Ph.D. in Deep Learning, IIT Delhi',
    specialization: 'Computer Vision & Natural Language Processing',
    email: 'anita.roy@college.edu',
    phone: '+1 (555) 234-8903',
    office: 'Cabin 308, AI Research Lab',
    joiningDate: '2019-01-10',
    subjects: ['CS603: Artificial Intelligence & Machine Learning'],
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1580894732470-36a894709324?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'fac-4',
    employeeId: 'EMP-CSE-104',
    name: 'Prof. Marcus Chen',
    designation: 'Assistant Professor (Senior Scale)',
    qualification: 'M.Tech, Ph.D. (Pursuing), UC Berkeley',
    specialization: 'Network Security, Protocols & Cryptography',
    email: 'marcus.chen@college.edu',
    phone: '+1 (555) 234-8904',
    office: 'Cabin 312, Cyber Lab Block',
    joiningDate: '2020-07-20',
    subjects: ['CS604: Computer Networks'],
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'fac-5',
    employeeId: 'EMP-CSE-105',
    name: 'Dr. Priya Sharma',
    designation: 'Assistant Professor',
    qualification: 'Ph.D. in Software Engineering',
    specialization: 'Microservices, Web Standards & DevOps',
    email: 'priya.sharma@college.edu',
    phone: '+1 (555) 234-8905',
    office: 'Cabin 315, CSE Tech Block',
    joiningDate: '2021-03-01',
    subjects: ['CS605: Full-Stack Web Engineering'],
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'fac-6',
    employeeId: 'EMP-CSE-106',
    name: 'Prof. Rahul Verma',
    designation: 'Assistant Professor & Lab Incharge',
    qualification: 'M.Tech CSE, Ph.D. Research Scholar',
    specialization: 'Cloud Infrastructure & High Performance Computing',
    email: 'rahul.verma@college.edu',
    phone: '+1 (555) 234-8906',
    office: 'Cloud Lab 202, Tech Block',
    joiningDate: '2022-09-15',
    subjects: ['CS606: Cloud Computing Laboratory'],
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'fac-7',
    employeeId: 'EMP-CSE-107',
    name: 'Prof. Elena Rostova',
    designation: 'Assistant Professor',
    qualification: 'M.S. in Computer Science, Georgia Tech',
    specialization: 'Relational DBs, NoSQL & Distributed Storage',
    email: 'elena.rostova@college.edu',
    phone: '+1 (555) 234-8907',
    office: 'Cabin 310, CSE Tech Block',
    joiningDate: '2021-11-01',
    subjects: ['CS402: Database Management Systems'],
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'fac-8',
    employeeId: 'EMP-CSE-108',
    name: 'Dr. Kevin Sterling',
    designation: 'Associate Professor',
    qualification: 'Ph.D. in Cyber Security & Blockchain',
    specialization: 'Information Security & Zero Trust Architecture',
    email: 'kevin.sterling@college.edu',
    phone: '+1 (555) 234-8908',
    office: 'Cabin 318, Cyber Lab Block',
    joiningDate: '2019-08-01',
    subjects: ['CS701: Network Security & Cryptography'],
    status: 'On Sabbatical',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  }
];

const DEFAULT_STUDENTS = [
  {
    id: 'stu-1',
    rollNo: 'CS2023042',
    regNo: '23CSE01042',
    name: 'Alex Rivera',
    email: 'student@college.edu',
    phone: '+1 (555) 412-9011',
    semester: 6,
    section: 'A',
    batch: '2023-2027',
    gender: 'Male',
    cgpa: 8.74,
    bloodGroup: 'O+',
    parentContact: '+1 (555) 412-9010 (Robert Rivera, Father)',
    address: '42 Pine Crest Avenue, Tech City',
    attendance: {
      overall: 86.4,
      totalClasses: 184,
      attendedClasses: 159,
      subjects: {
        'CS601': { attended: 38, total: 42, percentage: 90.5 },
        'CS602': { attended: 35, total: 42, percentage: 83.3 },
        'CS603': { attended: 37, total: 40, percentage: 92.5 },
        'CS604': { attended: 29, total: 36, percentage: 80.6 },
        'CS605': { attended: 20, total: 24, percentage: 83.3 }
      }
    },
    marks: {
      'CS601': { ia1: 23, ia2: 24, assignment: 19, maxIa: 25, total: 66, maxTotal: 75, grade: 'A+' },
      'CS602': { ia1: 21, ia2: 22, assignment: 18, maxIa: 25, total: 61, maxTotal: 75, grade: 'A' },
      'CS603': { ia1: 25, ia2: 25, assignment: 20, maxIa: 25, total: 70, maxTotal: 75, grade: 'O' },
      'CS604': { ia1: 19, ia2: 20, assignment: 17, maxIa: 25, total: 56, maxTotal: 75, grade: 'B+' },
      'CS605': { ia1: 24, ia2: 23, assignment: 19, maxIa: 25, total: 66, maxTotal: 75, grade: 'A+' }
    },
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'stu-2',
    rollNo: 'CS2023015',
    regNo: '23CSE01015',
    name: 'Emily Zhang',
    email: 'emily.zhang@college.edu',
    phone: '+1 (555) 412-9015',
    semester: 6,
    section: 'A',
    batch: '2023-2027',
    gender: 'Female',
    cgpa: 9.42,
    bloodGroup: 'A+',
    parentContact: '+1 (555) 412-9014',
    address: '108 University Blvd, Metro District',
    attendance: {
      overall: 95.1,
      totalClasses: 184,
      attendedClasses: 175,
      subjects: {
        'CS601': { attended: 41, total: 42, percentage: 97.6 },
        'CS602': { attended: 40, total: 42, percentage: 95.2 },
        'CS603': { attended: 39, total: 40, percentage: 97.5 },
        'CS604': { attended: 34, total: 36, percentage: 94.4 },
        'CS605': { attended: 21, total: 24, percentage: 87.5 }
      }
    },
    marks: {
      'CS601': { ia1: 25, ia2: 25, assignment: 20, maxIa: 25, total: 70, maxTotal: 75, grade: 'O' },
      'CS602': { ia1: 24, ia2: 25, assignment: 20, maxIa: 25, total: 69, maxTotal: 75, grade: 'O' },
      'CS603': { ia1: 25, ia2: 25, assignment: 20, maxIa: 25, total: 70, maxTotal: 75, grade: 'O' },
      'CS604': { ia1: 24, ia2: 23, assignment: 19, maxIa: 25, total: 66, maxTotal: 75, grade: 'A+' },
      'CS605': { ia1: 25, ia2: 24, assignment: 20, maxIa: 25, total: 69, maxTotal: 75, grade: 'O' }
    },
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'stu-3',
    rollNo: 'CS2023008',
    regNo: '23CSE01008',
    name: 'Liam Peterson',
    email: 'liam.peterson@college.edu',
    phone: '+1 (555) 412-9008',
    semester: 6,
    section: 'A',
    batch: '2023-2027',
    gender: 'Male',
    cgpa: 6.85,
    bloodGroup: 'B+',
    parentContact: '+1 (555) 412-9007',
    address: '77 West Maple Lane',
    attendance: {
      overall: 68.5, // Below 75% for Shortage testing
      totalClasses: 184,
      attendedClasses: 126,
      subjects: {
        'CS601': { attended: 28, total: 42, percentage: 66.7 },
        'CS602': { attended: 29, total: 42, percentage: 69.0 },
        'CS603': { attended: 27, total: 40, percentage: 67.5 },
        'CS604': { attended: 24, total: 36, percentage: 66.7 },
        'CS605': { attended: 18, total: 24, percentage: 75.0 }
      }
    },
    marks: {
      'CS601': { ia1: 14, ia2: 15, assignment: 12, maxIa: 25, total: 41, maxTotal: 75, grade: 'C' },
      'CS602': { ia1: 15, ia2: 14, assignment: 13, maxIa: 25, total: 42, maxTotal: 75, grade: 'C' },
      'CS603': { ia1: 16, ia2: 17, assignment: 14, maxIa: 25, total: 47, maxTotal: 75, grade: 'B' },
      'CS604': { ia1: 13, ia2: 14, assignment: 12, maxIa: 25, total: 39, maxTotal: 75, grade: 'C' },
      'CS605': { ia1: 17, ia2: 18, assignment: 15, maxIa: 25, total: 50, maxTotal: 75, grade: 'B' }
    },
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'stu-4',
    rollNo: 'CS2023019',
    regNo: '23CSE01019',
    name: 'Aisha Patel',
    email: 'aisha.patel@college.edu',
    phone: '+1 (555) 412-9019',
    semester: 6,
    section: 'A',
    batch: '2023-2027',
    gender: 'Female',
    cgpa: 8.92,
    bloodGroup: 'AB+',
    parentContact: '+1 (555) 412-9018',
    address: '12 Emerald Hills, East Coast',
    attendance: {
      overall: 89.1,
      totalClasses: 184,
      attendedClasses: 164,
      subjects: {
        'CS601': { attended: 39, total: 42, percentage: 92.8 },
        'CS602': { attended: 36, total: 42, percentage: 85.7 },
        'CS603': { attended: 38, total: 40, percentage: 95.0 },
        'CS604': { attended: 31, total: 36, percentage: 86.1 },
        'CS605': { attended: 20, total: 24, percentage: 83.3 }
      }
    },
    marks: {
      'CS601': { ia1: 24, ia2: 24, assignment: 19, maxIa: 25, total: 67, maxTotal: 75, grade: 'A+' },
      'CS602': { ia1: 22, ia2: 23, assignment: 18, maxIa: 25, total: 63, maxTotal: 75, grade: 'A' },
      'CS603': { ia1: 24, ia2: 24, assignment: 20, maxIa: 25, total: 68, maxTotal: 75, grade: 'O' },
      'CS604': { ia1: 21, ia2: 22, assignment: 18, maxIa: 25, total: 61, maxTotal: 75, grade: 'A' },
      'CS605': { ia1: 23, ia2: 24, assignment: 19, maxIa: 25, total: 66, maxTotal: 75, grade: 'A+' }
    },
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'stu-5',
    rollNo: 'CS2023027',
    regNo: '23CSE01027',
    name: 'Jordan Miller',
    email: 'jordan.miller@college.edu',
    phone: '+1 (555) 412-9027',
    semester: 6,
    section: 'A',
    batch: '2023-2027',
    gender: 'Male',
    cgpa: 7.65,
    bloodGroup: 'O-',
    parentContact: '+1 (555) 412-9026',
    address: '904 Riverwalk Way',
    attendance: {
      overall: 79.3,
      totalClasses: 184,
      attendedClasses: 146,
      subjects: {
        'CS601': { attended: 33, total: 42, percentage: 78.5 },
        'CS602': { attended: 34, total: 42, percentage: 81.0 },
        'CS603': { attended: 31, total: 40, percentage: 77.5 },
        'CS604': { attended: 29, total: 36, percentage: 80.5 },
        'CS605': { attended: 19, total: 24, percentage: 79.2 }
      }
    },
    marks: {
      'CS601': { ia1: 19, ia2: 20, assignment: 16, maxIa: 25, total: 55, maxTotal: 75, grade: 'B+' },
      'CS602': { ia1: 18, ia2: 19, assignment: 16, maxIa: 25, total: 53, maxTotal: 75, grade: 'B' },
      'CS603': { ia1: 20, ia2: 21, assignment: 17, maxIa: 25, total: 58, maxTotal: 75, grade: 'B+' },
      'CS604': { ia1: 18, ia2: 19, assignment: 15, maxIa: 25, total: 52, maxTotal: 75, grade: 'B' },
      'CS605': { ia1: 21, ia2: 22, assignment: 18, maxIa: 25, total: 61, maxTotal: 75, grade: 'A' }
    },
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'stu-6',
    rollNo: 'CS2023033',
    regNo: '23CSE01033',
    name: 'Maya Lin',
    email: 'maya.lin@college.edu',
    phone: '+1 (555) 412-9033',
    semester: 6,
    section: 'A',
    batch: '2023-2027',
    gender: 'Female',
    cgpa: 9.15,
    bloodGroup: 'B-',
    parentContact: '+1 (555) 412-9032',
    address: '510 Horizon Heights',
    attendance: {
      overall: 91.8,
      totalClasses: 184,
      attendedClasses: 169,
      subjects: {
        'CS601': { attended: 39, total: 42, percentage: 92.8 },
        'CS602': { attended: 38, total: 42, percentage: 90.5 },
        'CS603': { attended: 37, total: 40, percentage: 92.5 },
        'CS604': { attended: 33, total: 36, percentage: 91.7 },
        'CS605': { attended: 22, total: 24, percentage: 91.7 }
      }
    },
    marks: {
      'CS601': { ia1: 24, ia2: 24, assignment: 20, maxIa: 25, total: 68, maxTotal: 75, grade: 'O' },
      'CS602': { ia1: 23, ia2: 24, assignment: 19, maxIa: 25, total: 66, maxTotal: 75, grade: 'A+' },
      'CS603': { ia1: 25, ia2: 24, assignment: 20, maxIa: 25, total: 69, maxTotal: 75, grade: 'O' },
      'CS604': { ia1: 22, ia2: 23, assignment: 18, maxIa: 25, total: 63, maxTotal: 75, grade: 'A' },
      'CS605': { ia1: 24, ia2: 25, assignment: 19, maxIa: 25, total: 68, maxTotal: 75, grade: 'O' }
    },
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'stu-7',
    rollNo: 'CS2023055',
    regNo: '23CSE01055',
    name: 'Devon Brooks',
    email: 'devon.brooks@college.edu',
    phone: '+1 (555) 412-9055',
    semester: 6,
    section: 'A',
    batch: '2023-2027',
    gender: 'Male',
    cgpa: 7.22,
    bloodGroup: 'A-',
    parentContact: '+1 (555) 412-9054',
    address: '334 Birchwood Court',
    attendance: {
      overall: 71.2, // Below 75%
      totalClasses: 184,
      attendedClasses: 131,
      subjects: {
        'CS601': { attended: 30, total: 42, percentage: 71.4 },
        'CS602': { attended: 29, total: 42, percentage: 69.0 },
        'CS603': { attended: 28, total: 40, percentage: 70.0 },
        'CS604': { attended: 27, total: 36, percentage: 75.0 },
        'CS605': { attended: 17, total: 24, percentage: 70.8 }
      }
    },
    marks: {
      'CS601': { ia1: 17, ia2: 18, assignment: 15, maxIa: 25, total: 50, maxTotal: 75, grade: 'B' },
      'CS602': { ia1: 16, ia2: 17, assignment: 14, maxIa: 25, total: 47, maxTotal: 75, grade: 'B' },
      'CS603': { ia1: 19, ia2: 18, assignment: 16, maxIa: 25, total: 53, maxTotal: 75, grade: 'B' },
      'CS604': { ia1: 16, ia2: 17, assignment: 15, maxIa: 25, total: 48, maxTotal: 75, grade: 'B' },
      'CS605': { ia1: 18, ia2: 19, assignment: 16, maxIa: 25, total: 53, maxTotal: 75, grade: 'B' }
    },
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'stu-8',
    rollNo: 'CS2023061',
    regNo: '23CSE01061',
    name: 'Sophia Gallagher',
    email: 'sophia.g@college.edu',
    phone: '+1 (555) 412-9061',
    semester: 6,
    section: 'A',
    batch: '2023-2027',
    gender: 'Female',
    cgpa: 8.50,
    bloodGroup: 'O+',
    parentContact: '+1 (555) 412-9060',
    address: '812 Sunset Ridge',
    attendance: {
      overall: 84.8,
      totalClasses: 184,
      attendedClasses: 156,
      subjects: {
        'CS601': { attended: 36, total: 42, percentage: 85.7 },
        'CS602': { attended: 35, total: 42, percentage: 83.3 },
        'CS603': { attended: 34, total: 40, percentage: 85.0 },
        'CS604': { attended: 31, total: 36, percentage: 86.1 },
        'CS605': { attended: 20, total: 24, percentage: 83.3 }
      }
    },
    marks: {
      'CS601': { ia1: 22, ia2: 23, assignment: 18, maxIa: 25, total: 63, maxTotal: 75, grade: 'A' },
      'CS602': { ia1: 21, ia2: 22, assignment: 18, maxIa: 25, total: 61, maxTotal: 75, grade: 'A' },
      'CS603': { ia1: 23, ia2: 24, assignment: 19, maxIa: 25, total: 66, maxTotal: 75, grade: 'A+' },
      'CS604': { ia1: 20, ia2: 21, assignment: 17, maxIa: 25, total: 58, maxTotal: 75, grade: 'B+' },
      'CS605': { ia1: 22, ia2: 23, assignment: 18, maxIa: 25, total: 63, maxTotal: 75, grade: 'A' }
    },
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'stu-9',
    rollNo: 'CS2023078',
    regNo: '23CSE01078',
    name: 'Karthik Raman',
    email: 'karthik.raman@college.edu',
    phone: '+1 (555) 412-9078',
    semester: 6,
    section: 'A',
    batch: '2023-2027',
    gender: 'Male',
    cgpa: 8.81,
    bloodGroup: 'B+',
    parentContact: '+1 (555) 412-9077',
    address: '601 Park View Estates',
    attendance: {
      overall: 88.0,
      totalClasses: 184,
      attendedClasses: 162,
      subjects: {
        'CS601': { attended: 37, total: 42, percentage: 88.1 },
        'CS602': { attended: 37, total: 42, percentage: 88.1 },
        'CS603': { attended: 35, total: 40, percentage: 87.5 },
        'CS604': { attended: 32, total: 36, percentage: 88.9 },
        'CS605': { attended: 21, total: 24, percentage: 87.5 }
      }
    },
    marks: {
      'CS601': { ia1: 23, ia2: 23, assignment: 19, maxIa: 25, total: 65, maxTotal: 75, grade: 'A+' },
      'CS602': { ia1: 22, ia2: 23, assignment: 18, maxIa: 25, total: 63, maxTotal: 75, grade: 'A' },
      'CS603': { ia1: 24, ia2: 23, assignment: 19, maxIa: 25, total: 66, maxTotal: 75, grade: 'A+' },
      'CS604': { ia1: 22, ia2: 22, assignment: 18, maxIa: 25, total: 62, maxTotal: 75, grade: 'A' },
      'CS605': { ia1: 23, ia2: 24, assignment: 19, maxIa: 25, total: 66, maxTotal: 75, grade: 'A+' }
    },
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'stu-10',
    rollNo: 'CS2023089',
    regNo: '23CSE01089',
    name: 'Chloe Bennett',
    email: 'chloe.b@college.edu',
    phone: '+1 (555) 412-9089',
    semester: 6,
    section: 'A',
    batch: '2023-2027',
    gender: 'Female',
    cgpa: 9.30,
    bloodGroup: 'AB-',
    parentContact: '+1 (555) 412-9088',
    address: '15 Ocean Drive, Bay District',
    attendance: {
      overall: 93.5,
      totalClasses: 184,
      attendedClasses: 172,
      subjects: {
        'CS601': { attended: 40, total: 42, percentage: 95.2 },
        'CS602': { attended: 39, total: 42, percentage: 92.8 },
        'CS603': { attended: 38, total: 40, percentage: 95.0 },
        'CS604': { attended: 33, total: 36, percentage: 91.7 },
        'CS605': { attended: 22, total: 24, percentage: 91.7 }
      }
    },
    marks: {
      'CS601': { ia1: 25, ia2: 24, assignment: 20, maxIa: 25, total: 69, maxTotal: 75, grade: 'O' },
      'CS602': { ia1: 24, ia2: 24, assignment: 19, maxIa: 25, total: 67, maxTotal: 75, grade: 'A+' },
      'CS603': { ia1: 25, ia2: 25, assignment: 20, maxIa: 25, total: 70, maxTotal: 75, grade: 'O' },
      'CS604': { ia1: 23, ia2: 24, assignment: 19, maxIa: 25, total: 66, maxTotal: 75, grade: 'A+' },
      'CS605': { ia1: 25, ia2: 25, assignment: 20, maxIa: 25, total: 70, maxTotal: 75, grade: 'O' }
    },
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  }
];

const DEFAULT_NOTICES = [
  {
    id: 'not-1',
    title: 'Mid-Semester Theory & Practical Examination Schedule (Spring 2026)',
    category: 'Examinations',
    priority: 'Urgent',
    target: 'All',
    author: 'Office of the Controller of Examinations',
    date: '2026-10-18',
    summary: 'The Mid-Semester theory tests for 4th, 6th, and 8th semester B.Tech CSE will commence from November 3, 2026. Hall tickets can be downloaded from the student portal starting Oct 28.',
    content: 'All students are hereby notified that the Mid-Semester Examination schedule has been released. The examinations will be conducted in morning and afternoon sessions. Students with attendance below 75% must contact their respective faculty advisors immediately for condonation procedures.',
    attachment: 'MidSem_Exam_Schedule_Spring2026.pdf',
    pinned: true
  },
  {
    id: 'not-2',
    title: 'Urgent: Mandatory Attendance Review & Shortage List Published',
    category: 'Academic',
    priority: 'Urgent',
    target: 'Students',
    author: 'Dr. Sarah Jenkins (Academic Coordinator)',
    date: '2026-10-16',
    summary: 'Students having aggregate attendance below 75% have been marked. Check your student dashboard. Submit legitimate medical certificates or official duty forms before Oct 25.',
    content: 'As per university academic regulations, 75% attendance is mandatory to be eligible for university end-term exams. Any student currently below 75% must meet with their faculty advisor and ensure attendance in all upcoming lectures and lab sessions without fail.',
    attachment: 'Attendance_Notice_Oct2026.pdf',
    pinned: true
  },
  {
    id: 'not-3',
    title: 'Annual Department Hackathon "HackCSE 2026" - Registrations Open!',
    category: 'Events',
    priority: 'High',
    target: 'All',
    author: 'Prof. Marcus Chen (Faculty Coordinator)',
    date: '2026-10-14',
    summary: '36-hour flagship hackathon with cash pool of $10,000 sponsored by Google Cloud and Microsoft. Teams of 2 to 4 members. Theme: AI for Social Good & Sustainable Cities.',
    content: 'Registration is now open for HackCSE 2026! Exciting problem statements across Generative AI, Cloud Native Systems, Cybersecurity, and Web3. Mentorship from industry veterans and direct fast-track interview rounds for winners.',
    attachment: 'HackCSE_2026_Rulebook.pdf',
    pinned: false
  },
  {
    id: 'not-4',
    title: 'Campus Recruitment Drive: Tier-1 Tech Giants Phase-1 Registrations',
    category: 'Placements',
    priority: 'High',
    target: 'Students',
    author: 'Placement & Career Development Cell',
    date: '2026-10-12',
    summary: 'Pre-placement talks and coding assessment rounds for 6th and 8th semester CSE students scheduled for November 10-15. Ensure updated profiles on the portal.',
    content: 'Companies including Google, Amazon, Microsoft, and Atlassian will begin their primary selection process. Eligible students (CGPA >= 7.0 with no active backlogs) must verify their details in the Student Management portal and upload their latest resumes.',
    attachment: 'Campus_Placement_Rounds_2026.pdf',
    pinned: false
  },
  {
    id: 'not-5',
    title: 'Call for Papers: Department Research Symposium & Poster Presentation',
    category: 'Academic',
    priority: 'Normal',
    target: 'All',
    author: 'Dr. Anita Roy (R&D Cell CSE)',
    date: '2026-10-10',
    summary: 'Faculty members and undergraduate students are invited to submit original research papers in Machine Learning, Distributed Computing, and IoT.',
    content: 'Accepted papers will be indexed in Scopus conference proceedings. Outstanding student papers will receive full sponsorship for international conference travel grants.',
    attachment: 'Symposium_CFP_Guidelines.pdf',
    pinned: false
  },
  {
    id: 'not-6',
    title: 'Faculty Development Program (FDP) on Generative AI & LLM Systems',
    category: 'Academic',
    priority: 'Normal',
    target: 'Faculty',
    author: 'Prof. David Vance (HOD CSE)',
    date: '2026-10-08',
    summary: '5-day AICTE-sponsored workshop for CSE faculty members covering state-of-the-art transformer architectures, fine-tuning, and model safety.',
    content: 'All faculty members are requested to nominate themselves for the upcoming FDP. Hands-on labs will be organized in the Cloud Computing Center.',
    attachment: 'FDP_Schedule_Nov2026.pdf',
    pinned: false
  }
];

const DEFAULT_ATTENDANCE_LOGS = [
  {
    id: 'att-log-1',
    courseId: 'CS601',
    courseName: 'Distributed Systems',
    facultyName: 'Dr. Sarah Jenkins',
    semester: 6,
    section: 'A',
    date: '2026-10-19',
    period: 'Period 2 (10:00 - 11:00 AM)',
    topic: 'Paxos and Raft Consensus Protocols in Distributed Storage',
    totalStudents: 10,
    presentCount: 9,
    absentCount: 1,
    records: [
      { studentId: 'stu-1', rollNo: 'CS2023042', status: 'Present' },
      { studentId: 'stu-2', rollNo: 'CS2023015', status: 'Present' },
      { studentId: 'stu-3', rollNo: 'CS2023008', status: 'Absent', remarks: 'Medical Leave' },
      { studentId: 'stu-4', rollNo: 'CS2023019', status: 'Present' },
      { studentId: 'stu-5', rollNo: 'CS2023027', status: 'Present' },
      { studentId: 'stu-6', rollNo: 'CS2023033', status: 'Present' },
      { studentId: 'stu-7', rollNo: 'CS2023055', status: 'Present' },
      { studentId: 'stu-8', rollNo: 'CS2023061', status: 'Present' },
      { studentId: 'stu-9', rollNo: 'CS2023078', status: 'Present' },
      { studentId: 'stu-10', rollNo: 'CS2023089', status: 'Present' }
    ]
  },
  {
    id: 'att-log-2',
    courseId: 'CS603',
    courseName: 'Artificial Intelligence & Machine Learning',
    facultyName: 'Dr. Anita Roy',
    semester: 6,
    section: 'A',
    date: '2026-10-18',
    period: 'Period 4 (01:30 - 02:30 PM)',
    topic: 'Transformer Attention Mechanisms & Self-Attention',
    totalStudents: 10,
    presentCount: 8,
    absentCount: 2,
    records: [
      { studentId: 'stu-1', rollNo: 'CS2023042', status: 'Present' },
      { studentId: 'stu-2', rollNo: 'CS2023015', status: 'Present' },
      { studentId: 'stu-3', rollNo: 'CS2023008', status: 'Absent' },
      { studentId: 'stu-4', rollNo: 'CS2023019', status: 'Present' },
      { studentId: 'stu-5', rollNo: 'CS2023027', status: 'Present' },
      { studentId: 'stu-6', rollNo: 'CS2023033', status: 'Present' },
      { studentId: 'stu-7', rollNo: 'CS2023055', status: 'Absent' },
      { studentId: 'stu-8', rollNo: 'CS2023061', status: 'Present' },
      { studentId: 'stu-9', rollNo: 'CS2023078', status: 'Present' },
      { studentId: 'stu-10', rollNo: 'CS2023089', status: 'Present' }
    ]
  }
];

const DEFAULT_ACTIVITIES = [
  { id: 'act-1', text: 'Dr. Sarah Jenkins marked attendance for CS601 (Distributed Systems)', time: '20 mins ago', type: 'attendance' },
  { id: 'act-2', text: 'Prof. David Vance entered IA-1 Internal Marks for CS602 (Compiler Design)', time: '1 hour ago', type: 'marks' },
  { id: 'act-3', text: 'Published urgent notice: Mid-Semester Examination Schedule', time: '3 hours ago', type: 'notice' },
  { id: 'act-4', text: 'New student enrolled: Liam Peterson (CS2023008)', time: 'Yesterday', type: 'student' },
  { id: 'act-5', text: 'Faculty workload allocation verified for Spring 2026', time: '2 days ago', type: 'admin' }
];
