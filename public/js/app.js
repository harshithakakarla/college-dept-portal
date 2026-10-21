/**
 * College Department Information Management Portal
 * Core Application Controller, Router & UI Renderer
 */

const App = {
  currentView: 'home',
  chartInstances: {},

  async init() {
    this.bindGlobalEvents();
    Store.setCurrentUser(null);
    try {
      const response = await fetch('/api/auth/me', { credentials: 'same-origin' });
      if (response.ok) {
        const result = await response.json();
        Store.setCurrentUser(result.user);
        await Store.loadPortalData(result.user.role === 'administrator');
      } else if (response.status !== 401) {
        throw new Error('Unable to restore your sign-in session.');
      }
    } catch (error) {
      this.showToast(window.location.protocol === 'file:'
        ? 'This page is opened directly from a file. Start the portal with run_portal.bat, then open http://localhost:3000.'
        : 'Could not connect to the portal server. Start it with run_portal.bat.', 'error');
    }
    this.updateUserNav();
    
    // Check URL hash or default to home
    const hash = window.location.hash.replace('#', '') || 'home';
    this.navigateTo(hash, false);
  },

  bindGlobalEvents() {
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '') || 'home';
      this.navigateTo(hash, false);
    });
  },

  navigateTo(view, updateHash = true) {
    const user = Store.getCurrentUser();
    const viewRoles = {
      'admin-dashboard': ['administrator'],
      'faculty-management': ['administrator'],
      'student-management': ['administrator'],
      'attendance-marking': ['administrator', 'faculty'],
      'internal-marks': ['administrator', 'faculty'],
      'student-dashboard': ['administrator', 'student']
    };
    if (viewRoles[view] && (!user || !viewRoles[view].includes(user.role))) {
      this.showToast(user ? 'Your account does not have access to that page.' : 'Sign in to access that page.', 'warning');
      if (!user) {
        this.navigateTo('login');
      } else {
        this.navigateTo(user.role === 'administrator' ? 'admin-dashboard' : (user.role === 'faculty' ? 'attendance-marking' : 'student-dashboard'));
      }
      return;
    }
    this.currentView = view;
    if (updateHash) {
      window.location.hash = view;
    }

    // Destroy any existing charts before view switch
    Object.keys(this.chartInstances).forEach(key => {
      if (this.chartInstances[key]) {
        this.chartInstances[key].destroy();
        delete this.chartInstances[key];
      }
    });

    const mainContainer = document.getElementById('main-content');
    if (!mainContainer) return;

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update active nav styling
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.dataset.view === view) {
        link.classList.add('text-indigo-600', 'font-bold', 'border-b-2', 'border-indigo-600');
        link.classList.remove('text-slate-600');
      } else {
        link.classList.remove('text-indigo-600', 'font-bold', 'border-b-2', 'border-indigo-600');
        link.classList.add('text-slate-600');
      }
    });

    // Render corresponding view
    switch (view) {
      case 'home':
        this.renderHome(mainContainer);
        break;
      case 'auth':
      case 'login':
      case 'register':
        this.renderAuth(mainContainer);
        this.toggleAuthTab(view === 'register' ? 'register' : 'login');
        break;
      case 'admin-dashboard':
        this.renderAdminDashboard(mainContainer);
        break;
      case 'faculty-management':
        this.renderFacultyManagement(mainContainer);
        break;
      case 'student-management':
        this.renderStudentManagement(mainContainer);
        break;
      case 'attendance-marking':
        this.renderAttendanceMarking(mainContainer);
        break;
      case 'internal-marks':
        this.renderInternalMarks(mainContainer);
        break;
      case 'student-dashboard':
        this.renderStudentDashboard(mainContainer);
        break;
      case 'notices':
        this.renderNotices(mainContainer);
        break;
      default:
        this.renderHome(mainContainer);
    }

    this.updateUserNav();
  },

  updateUserNav() {
    const user = Store.getCurrentUser();
    const userBadge = document.getElementById('user-badge-container');
    const userRolePill = document.getElementById('current-role-indicator');
    
    if (userRolePill) {
      if (user) {
        let roleColor = 'bg-indigo-100 text-indigo-800';
        let roleIcon = '👑';
        if (user.role === 'faculty') {
          roleColor = 'bg-emerald-100 text-emerald-800';
          roleIcon = '👨‍🏫';
        } else if (user.role === 'student') {
          roleColor = 'bg-blue-100 text-blue-800';
          roleIcon = '🎓';
        }
        userRolePill.className = `px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${roleColor}`;
        userRolePill.innerHTML = `<span>${roleIcon}</span> <span>${user.role.toUpperCase()}: ${this.escapeHtml(user.name)}</span>`;
      } else {
        userRolePill.className = 'px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600';
        userRolePill.innerHTML = `<span>🌐</span> <span>Guest (Not Logged In)</span>`;
      }
    }

    if (userBadge) {
      if (user) {
        userBadge.innerHTML = `
          <div class="flex items-center gap-3">
            <button onclick="App.navigateTo('${user.role === 'administrator' ? 'admin-dashboard' : (user.role === 'faculty' ? 'attendance-marking' : 'student-dashboard')}')" class="text-xs bg-slate-900 text-white font-medium px-3 py-2 rounded-lg hover:bg-slate-800 transition">
              My Dashboard
            </button>
            <button onclick="App.logout()" class="text-xs text-rose-600 font-semibold hover:underline">
              Sign Out
            </button>
          </div>
        `;
      } else {
        userBadge.innerHTML = `
          <button onclick="App.navigateTo('login')" class="text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg shadow-sm transition">
            Sign In / Portal Access
          </button>
        `;
      }
    }
  },

  logout() {
    fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
      .then(response => {
        if (!response.ok) throw new Error('Unable to sign out.');
        Store.setCurrentUser(null);
        this.showToast('Signed out successfully.', 'info');
        this.navigateTo('home');
      })
      .catch(() => this.showToast('Sign out failed. Please try again.', 'error'));
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';

    const iconElement = document.createElement('span');
    iconElement.className = 'text-lg';
    iconElement.textContent = icon;
    const messageElement = document.createElement('div');
    messageElement.className = 'flex-1 font-medium text-slate-800';
    messageElement.textContent = message;
    toast.append(iconElement, messageElement);

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]);
  },

  openModal(title, bodyHtml, footerHtml = '') {
    const modalEl = document.getElementById('global-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementById('modal-footer');

    if (!modalEl) return;

    modalTitle.textContent = title;
    modalBody.innerHTML = bodyHtml;
    modalFooter.innerHTML = footerHtml || `
      <button onclick="App.closeModal()" class="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">Close</button>
    `;

    modalEl.classList.remove('hidden');
    modalEl.classList.add('flex');
  },

  closeModal() {
    const modalEl = document.getElementById('global-modal');
    if (modalEl) {
      modalEl.classList.add('hidden');
      modalEl.classList.remove('flex');
    }
  },

  /* =========================================================================
     1. HOME PAGE OF PORTAL
     ========================================================================= */
  renderHome(container) {
    const notices = Store.getNotices();
    const urgentNotice = notices.find(n => n.priority === 'Urgent') || notices[0];

    container.innerHTML = `
      <div class="animate-fade-in space-y-12 pb-16">
        <!-- Urgent Notice Ticker Banner -->
        ${urgentNotice ? `
        <div class="bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 p-0.5 rounded-2xl shadow-sm">
          <div class="bg-white px-4 py-3 rounded-[14px] flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <span class="px-2.5 py-1 text-xs font-bold uppercase rounded-md bg-rose-100 text-rose-700 pulse-urgent">Urgent Notice</span>
              <span class="text-sm font-semibold text-slate-800 line-clamp-1">${urgentNotice.title}</span>
            </div>
            <button onclick="App.navigateTo('notices')" class="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              Read Announcement &rarr;
            </button>
          </div>
        </div>
        ` : ''}

        <!-- Hero Section -->
        <div class="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-8 md:p-14 shadow-2xl">
          <div class="absolute -right-16 -bottom-16 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -left-16 -top-16 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div class="relative z-10 max-w-3xl space-y-6">
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold tracking-wide text-indigo-200 border border-white/10">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Department of Computer Science & Engineering
            </div>
            <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              College Department Information <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">Management Portal</span>
            </h1>
            <p class="text-slate-300 text-base md:text-lg leading-relaxed">
              A unified digital ecosystem for students, faculty, and academic administrators. Seamlessly manage attendance, internal continuous assessment marks, academic records, and real-time department circulars.
            </p>

            <div class="flex flex-wrap gap-4 pt-4">
              <button onclick="App.navigateTo('login')" class="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition transform active:scale-95">
                <span>Access Portal &rarr;</span>
              </button>
              <button onclick="App.navigateTo('notices')" class="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl backdrop-blur-md border border-white/15 flex items-center gap-2 transition">
                <span>Notice Board</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Department Highlights & Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm card-hover">
            <div class="text-3xl font-extrabold text-indigo-600 mb-1">450+</div>
            <div class="text-sm font-semibold text-slate-800">Enrolled Students</div>
            <div class="text-xs text-slate-500 mt-1">Undergraduate & Postgraduate</div>
          </div>
          <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm card-hover">
            <div class="text-3xl font-extrabold text-emerald-600 mb-1">28</div>
            <div class="text-sm font-semibold text-slate-800">Distinguished Faculty</div>
            <div class="text-xs text-slate-500 mt-1">Ph.D. & Industry Mentors</div>
          </div>
          <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm card-hover">
            <div class="text-3xl font-extrabold text-sky-600 mb-1">98.4%</div>
            <div class="text-sm font-semibold text-slate-800">Placement Record</div>
            <div class="text-xs text-slate-500 mt-1">Tier-1 Product & Tech Cos</div>
          </div>
          <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm card-hover">
            <div class="text-3xl font-extrabold text-amber-600 mb-1">NBA & A++</div>
            <div class="text-sm font-semibold text-slate-800">NAAC Accreditation</div>
            <div class="text-xs text-slate-500 mt-1">Tier-1 Global Washington Accord</div>
          </div>
        </div>

        <!-- Three Dedicated Portal Gateways -->
        <div class="space-y-6">
          <div class="text-center max-w-xl mx-auto space-y-2">
            <h2 class="text-2xl md:text-3xl font-bold text-slate-900">Dedicated Role Portals</h2>
            <p class="text-slate-600 text-sm">Choose your designated module to access customized departmental workflows.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Administrator Portal Card -->
            <div class="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm card-hover flex flex-col justify-between">
              <div class="space-y-4">
                <div class="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-2xl font-bold">
                  👑
                </div>
                <div>
                  <h3 class="text-xl font-bold text-slate-900">Administrator Console</h3>
                  <p class="text-slate-500 text-sm mt-1">Department management, faculty workload, enrollment analytics, and notice broadcasting.</p>
                </div>
                <ul class="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
                  <li class="flex items-center gap-2">✓ Faculty & Student Directory CRUD</li>
                  <li class="flex items-center gap-2">✓ Department Analytics & Charts</li>
                  <li class="flex items-center gap-2">✓ Audit Log & Academic Governance</li>
                </ul>
              </div>
              <div class="pt-6">
                <button onclick="App.navigateTo('admin-dashboard')" class="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition">
                  Sign in to Admin Console
                </button>
              </div>
            </div>

            <!-- Faculty Portal Card -->
            <div class="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm card-hover flex flex-col justify-between">
              <div class="space-y-4">
                <div class="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-bold">
                  👨‍🏫
                </div>
                <div>
                  <h3 class="text-xl font-bold text-slate-900">Faculty Workspace</h3>
                  <p class="text-slate-500 text-sm mt-1">Mark lecture attendance, enter continuous internal assessment marks, and post student circulars.</p>
                </div>
                <ul class="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
                  <li class="flex items-center gap-2">✓ 1-Click Batch Attendance Marking</li>
                  <li class="flex items-center gap-2">✓ IA-1, IA-2 & Lab Marks Entry</li>
                  <li class="flex items-center gap-2">✓ Auto-calculated Grades & Export</li>
                </ul>
              </div>
              <div class="pt-6">
                <button onclick="App.navigateTo('attendance-marking')" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition">
                  Sign in to Faculty Desk
                </button>
              </div>
            </div>

            <!-- Student Portal Card -->
            <div class="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm card-hover flex flex-col justify-between">
              <div class="space-y-4">
                <div class="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold">
                  🎓
                </div>
                <div>
                  <h3 class="text-xl font-bold text-slate-900">Student Corner</h3>
                  <p class="text-slate-500 text-sm mt-1">Live attendance tracking with 75% shortage alert, internal scorecard, and hall ticket download.</p>
                </div>
                <ul class="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
                  <li class="flex items-center gap-2">✓ Attendance Percentage & Shortage Alarm</li>
                  <li class="flex items-center gap-2">✓ Internal Assessment Scorecard</li>
                  <li class="flex items-center gap-2">✓ Examination Hall Ticket Printable</li>
                </ul>
              </div>
              <div class="pt-6">
                <button onclick="App.navigateTo('student-dashboard')" class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition">
                  Sign in to Student Portal
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Vision, Mission & Programs Section -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-8 md:p-10 rounded-3xl border border-slate-200/80 shadow-sm">
          <div class="space-y-4">
            <div class="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold uppercase tracking-wider">
              Department Ethos
            </div>
            <h3 class="text-2xl font-bold text-slate-900">Vision & Mission</h3>
            <div class="space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>
                <strong class="text-slate-800">Vision:</strong> To be a center of excellence in Computer Science & Engineering education, research, and innovation, producing socially conscious technocrats capable of solving complex global challenges.
              </p>
              <p>
                <strong class="text-slate-800">Mission:</strong> Impart cutting-edge technical curriculum with high industrial relevance, foster interdisciplinary research in Artificial Intelligence and Distributed Systems, and uphold high ethical values.
              </p>
            </div>
          </div>

          <div class="space-y-4">
            <div class="inline-block px-3 py-1 bg-sky-50 text-sky-700 rounded-lg text-xs font-bold uppercase tracking-wider">
              Academic Offerings
            </div>
            <h3 class="text-2xl font-bold text-slate-900">Programs Offered</h3>
            <div class="space-y-3">
              <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <h4 class="font-bold text-sm text-slate-800">B.Tech - Computer Science & Engineering</h4>
                  <p class="text-xs text-slate-500">4-Year Full-Time | AICTE Approved | 180 Intake</p>
                </div>
                <span class="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-1 rounded">UG</span>
              </div>
              <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <h4 class="font-bold text-sm text-slate-800">M.Tech - Data Science & Artificial Intelligence</h4>
                  <p class="text-xs text-slate-500">2-Year Specialized Program | Research Oriented</p>
                </div>
                <span class="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-1 rounded">PG</span>
              </div>
              <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <h4 class="font-bold text-sm text-slate-800">Ph.D. in Computer Science & Engineering</h4>
                  <p class="text-xs text-slate-500">Full-Time / Part-Time Doctoral Fellowships</p>
                </div>
                <span class="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-1 rounded">Doctoral</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Latest Notices Quick Preview -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-bold text-slate-900">Recent Department Announcements</h3>
            <button onclick="App.navigateTo('notices')" class="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
              View All Notices &rarr;
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            ${notices.slice(0, 3).map(n => `
              <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm card-hover flex flex-col justify-between">
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full ${n.category === 'Examinations' ? 'bg-rose-100 text-rose-700' : (n.category === 'Placements' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700')}">
                      ${n.category}
                    </span>
                    <span class="text-xs text-slate-400 font-medium">${n.date}</span>
                  </div>
                  <h4 class="font-bold text-slate-800 text-sm line-clamp-2">${n.title}</h4>
                  <p class="text-xs text-slate-500 line-clamp-3">${n.summary}</p>
                </div>
                <div class="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between">
                  <span class="text-[11px] text-slate-400 font-medium">By: ${n.author.split('(')[0]}</span>
                  <button onclick="App.navigateTo('notices')" class="text-xs text-indigo-600 font-bold hover:underline">Read</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  /* =========================================================================
     2. SIGN UP AND LOGIN PAGE
     ========================================================================= */
  renderAuth(container) {
    container.innerHTML = `
      <div class="animate-fade-in max-w-xl mx-auto py-8">
        <div class="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl">
          <!-- Auth Header -->
          <div class="text-center space-y-2 mb-8">
            <div class="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-inner">
              🎓
            </div>
            <h2 class="text-2xl font-bold text-slate-900">Portal Authentication</h2>
            <p class="text-xs text-slate-500">Sign in to your academic dashboard or create a student account.</p>
          </div>

          <!-- Separate login and registration routes -->
          <div class="flex rounded-xl bg-slate-100 p-1 mb-6">
            <button id="tab-login-btn" onclick="App.navigateTo('login')" class="flex-1 py-2 text-xs font-bold rounded-lg bg-white text-slate-800 shadow-sm transition">
              Sign In
            </button>
            <button id="tab-register-btn" onclick="App.navigateTo('register')" class="flex-1 py-2 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-800 transition">
              Create Account
            </button>
          </div>

          <!-- Sign In Form -->
          <form id="form-login" onsubmit="App.handleLogin(event)" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Account Role</label>
              <select id="login-role" class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="administrator">Administrator (HOD / Dept Management)</option>
                <option value="faculty">Faculty Member</option>
                <option value="student" selected>Student</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input type="email" id="login-email" required pattern="[a-z0-9]+([.][a-z0-9]+)*@[a-z0-9]+([.][a-z0-9]+)+" title="Use lowercase letters, numbers, and dots only; .edu.in addresses are accepted." autocomplete="email" placeholder="e.g. student@veltech.edu.in" class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>

            <div>
              <div class="flex justify-between items-center mb-1">
                <label class="text-xs font-bold text-slate-700">Password</label>
                <span class="text-xs text-slate-400">Use your department account</span>
              </div>
              <input type="password" id="login-password" required autocomplete="current-password" placeholder="Password" class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>

            <button type="submit" class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition">
              Sign In to Dashboard &rarr;
            </button>
          </form>

          <!-- Register Form -->
          <form id="form-register" onsubmit="App.handleRegister(event)" class="space-y-4 hidden">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Account Type</label>
              <input type="text" value="Student" disabled class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-600">
              <input type="hidden" id="reg-role" value="student">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Full Legal Name</label>
              <input type="text" id="reg-name" required maxlength="120" pattern="[A-Za-z]+([ ][A-Za-z]+)*" title="Use English letters and single spaces only. Numbers and symbols are removed as you type." autocomplete="name" placeholder="e.g. John Doe" class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Official Email Address</label>
              <input type="email" id="reg-email" required maxlength="254" pattern="[a-z0-9]+([.][a-z0-9]+)*@[a-z0-9]+([.][a-z0-9]+)+" title="Use lowercase letters, numbers, and dots only; .edu.in addresses are accepted." autocomplete="email" placeholder="e.g. student@veltech.edu.in" class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>

            <!-- Dynamic Student Fields -->
            <div id="reg-student-fields" class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Roll Number</label>
                <input type="text" id="reg-rollno" required maxlength="32" placeholder="e.g. CS2023099" class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Current Semester</label>
                <select id="reg-sem" class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                  <option value="3">Semester 3</option>
                  <option value="4">Semester 4</option>
                  <option value="5">Semester 5</option>
                  <option value="6" selected>Semester 6</option>
                  <option value="7">Semester 7</option>
                  <option value="8">Semester 8</option>
                </select>
              </div>
            </div>

            <p class="text-xs text-slate-500">Faculty and administrator accounts are provisioned by the department.</p>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Create Password</label>
              <input type="password" id="reg-password" required minlength="8" maxlength="72" pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9\s]).{8,72}" title="Use at least 8 characters, including an uppercase letter, a lowercase letter, and a special character." autocomplete="new-password" placeholder="8+ chars with uppercase, lowercase & special character" class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <p class="mt-1 text-[11px] text-slate-500">At least 8 characters, with uppercase and lowercase letters and one special character.</p>
            </div>

            <button type="submit" class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition">
              Complete Registration &rarr;
            </button>
          </form>
        </div>
      </div>
    `;
    const nameInput = document.getElementById('reg-name');
    nameInput.addEventListener('input', () => {
      const originalValue = nameInput.value;
      const cursorPosition = nameInput.selectionStart;
      const sanitize = value => value.replace(/[^A-Za-z ]/g, '').replace(/ {2,}/g, ' ');
      const cleanValue = sanitize(originalValue);
      if (cleanValue !== originalValue) {
        nameInput.value = cleanValue;
        const cleanCursorPosition = sanitize(originalValue.slice(0, cursorPosition)).length;
        nameInput.setSelectionRange(cleanCursorPosition, cleanCursorPosition);
      }
    });
  },

  toggleAuthTab(tab) {
    const loginBtn = document.getElementById('tab-login-btn');
    const registerBtn = document.getElementById('tab-register-btn');
    const loginForm = document.getElementById('form-login');
    const registerForm = document.getElementById('form-register');

    if (tab === 'login') {
      loginBtn.className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-white text-slate-800 shadow-sm transition';
      registerBtn.className = 'flex-1 py-2 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-800 transition';
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
    } else {
      registerBtn.className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-white text-slate-800 shadow-sm transition';
      loginBtn.className = 'flex-1 py-2 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-800 transition';
      registerForm.classList.remove('hidden');
      loginForm.classList.add('hidden');
    }
  },

  async handleLogin(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (window.location.protocol === 'file:') {
      this.showToast('Login needs the portal server. Start it with run_portal.bat, then open http://localhost:3000.', 'error');
      return;
    }
    const role = document.getElementById('login-role').value;
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password, role })
      });
      const result = await this.readAuthResponse(response, 'Sign in failed.');
      Store.setCurrentUser(result.user);
      if (result.user.role === 'faculty') this.ensureLocalProfile(result.user);
      await Store.loadPortalData(result.user.role === 'administrator');
      Store.logActivity(`${result.user.name} logged in as ${result.user.role.toUpperCase()}`, 'auth');
      this.showToast(`Welcome back, ${result.user.name}!`, 'success');
      this.navigateTo(result.user.role === 'administrator' ? 'admin-dashboard' : (result.user.role === 'faculty' ? 'attendance-marking' : 'student-dashboard'));
    } catch (error) {
      this.showToast(error.message || 'Could not connect to the portal server.', 'error');
    }
  },

  async handleRegister(e) {
    e.preventDefault();
    if (window.location.protocol === 'file:') {
      this.showToast('Registration needs the portal server. Start it with run_portal.bat, then open http://localhost:3000.', 'error');
      return;
    }
    const role = document.getElementById('reg-role').value;
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    const payload = {
      role,
      name,
      email,
      password,
      rollNo: document.getElementById('reg-rollno').value,
      semester: document.getElementById('reg-sem').value
    };

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload)
      });
      const result = await this.readAuthResponse(response, 'Registration failed.');
      const user = result.user;
      Store.setCurrentUser(user);
      const students = Store.getStudents();
      if (!students.some(student => student.email === user.email)) {
        students.unshift(result.studentRecord);
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
      }
      Store.logActivity(`New user registered: ${user.name} (${user.role})`, 'auth');
      this.showToast(`Welcome, ${user.name}! Your account is ready.`, 'success');
      this.navigateTo(user.role === 'faculty' ? 'attendance-marking' : 'student-dashboard');
    } catch (error) {
      this.showToast(error.message || 'Could not connect to the portal server.', 'error');
    }
  },

  async readAuthResponse(response, fallbackMessage) {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(response.status === 403
        ? 'The portal server returned Forbidden. Start it with run_portal.bat and open http://localhost:3000.'
        : 'The portal server returned an unexpected response. Confirm it is running at http://localhost:3000.');
    }
    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error('The portal server returned invalid JSON. Confirm it is running correctly at http://localhost:3000.');
    }
    if (!response.ok) throw new Error(result.error || fallbackMessage);
    return result;
  },

  ensureLocalProfile(user) {
    if (user.role === 'faculty' && !Store.getFaculty().some(faculty => faculty.email === user.email)) {
      Store.addFaculty({
        name: user.name,
        employeeId: user.employeeId,
        designation: user.designation || 'Faculty Member',
        qualification: 'Not provided',
        specialization: 'Computer Science & Engineering',
        email: user.email,
        phone: '',
        office: 'CSE Department',
        subjects: []
      });
    }
  },

  /* =========================================================================
     3. ADMINISTRATOR DASHBOARD
     ========================================================================= */
  renderAdminDashboard(container) {
    const faculty = Store.getFaculty();
    const students = Store.getStudents();
    const notices = Store.getNotices();
    const activities = Store.getActivities();
    const courses = Store.getCourses();

    // Calculate averages
    let totalAtt = 0;
    students.forEach(s => totalAtt += (s.attendance ? s.attendance.overall : 85));
    const avgAttendance = (totalAtt / (students.length || 1)).toFixed(1);

    const shortageStudents = students.filter(s => (s.attendance ? s.attendance.overall : 85) < 75);

    container.innerHTML = `
      <div class="animate-fade-in space-y-8 pb-16">
        <!-- Top Title & Quick Actions -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div>
            <div class="flex items-center gap-2 text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-full w-fit">
              <span>👑</span> Administrator Command Center
            </div>
            <h1 class="text-2xl font-extrabold text-slate-900 mt-2">Department Overview & Analytics</h1>
            <p class="text-xs text-slate-500">Real-time status of faculty, student enrollment, academic metrics, and circulars.</p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button onclick="App.navigateTo('faculty-management')" class="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition">
              + Manage Faculty
            </button>
            <button onclick="App.navigateTo('student-management')" class="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition">
              + Manage Students
            </button>
            <button onclick="App.openAddNoticeModal()" class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition">
              + Post Notice
            </button>
            <button onclick="App.confirmResetData()" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-xs transition" title="Restore seed demo records">
              🔄 Reset Data
            </button>
          </div>
        </div>

        <!-- 5 Key KPI Metric Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm card-hover">
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Students</div>
            <div class="text-3xl font-extrabold text-slate-900 mt-2">${students.length}</div>
            <div class="text-[11px] text-emerald-600 font-semibold mt-1">● Active in 6th Sem</div>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm card-hover">
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Faculty Members</div>
            <div class="text-3xl font-extrabold text-slate-900 mt-2">${faculty.length}</div>
            <div class="text-[11px] text-indigo-600 font-semibold mt-1">100% Workload Met</div>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm card-hover">
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Dept Attendance</div>
            <div class="text-3xl font-extrabold ${avgAttendance >= 75 ? 'text-emerald-600' : 'text-rose-600'} mt-2">${avgAttendance}%</div>
            <div class="text-[11px] text-slate-500 mt-1">Target >= 75%</div>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm card-hover">
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Shortage Alerts</div>
            <div class="text-3xl font-extrabold text-rose-600 mt-2">${shortageStudents.length}</div>
            <div class="text-[11px] text-rose-600 font-semibold mt-1">Need Condonation</div>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm card-hover">
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Notices</div>
            <div class="text-3xl font-extrabold text-slate-900 mt-2">${notices.length}</div>
            <div class="text-[11px] text-blue-600 font-semibold mt-1">Broadcasted</div>
          </div>
        </div>

        <!-- Charts Grid (Chart.js) -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Attendance Trend Chart -->
          <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="font-bold text-slate-900">Attendance Trends by Subject</h3>
                <p class="text-xs text-slate-500">Average student participation across core 6th semester subjects</p>
              </div>
              <span class="text-xs bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-lg">Spring 2026</span>
            </div>
            <div class="h-64 relative">
              <canvas id="chart-attendance-trend"></canvas>
            </div>
          </div>

          <!-- Academic Performance Distribution Chart -->
          <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="font-bold text-slate-900">Internal Grade Distribution</h3>
                <p class="text-xs text-slate-500">Student performance across Continuous Assessments (IA-1 & IA-2)</p>
              </div>
              <span class="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-lg">Grading Scale</span>
            </div>
            <div class="h-64 relative">
              <canvas id="chart-grades-distribution"></canvas>
            </div>
          </div>
        </div>

        <!-- Lower Section: Recent Activity Audit Stream & Quick Notices List -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Audit Activities -->
          <div class="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-slate-900">System Activity Audit Log</h3>
              <span class="text-xs text-slate-400">Live Department Feeds</span>
            </div>
            <div class="space-y-3">
              ${activities.slice(0, 7).map(act => `
                <div class="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <span class="mt-0.5 text-base">
                    ${act.type === 'attendance' ? '📋' : (act.type === 'marks' ? '📊' : (act.type === 'notice' ? '📢' : (act.type === 'faculty' ? '👨‍🏫' : '🎓')))}
                  </span>
                  <div class="flex-1">
                    <p class="font-semibold text-slate-800">${this.escapeHtml(act.text)}</p>
                    <span class="text-[10px] text-slate-400">${act.time}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Shortage Warning Spotlight -->
          <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-2 mb-3">
                <span class="text-rose-500 font-bold text-lg">⚠️</span>
                <h3 class="font-bold text-slate-900">Attendance Watchlist (< 75%)</h3>
              </div>
              <p class="text-xs text-slate-500 mb-4">Students ineligible to appear for end-term exams without condonation sanction:</p>

              <div class="space-y-3">
                ${shortageStudents.length > 0 ? shortageStudents.map(s => `
                  <div class="flex items-center justify-between p-3 rounded-xl bg-rose-50/60 border border-rose-100">
                    <div>
                      <div class="font-bold text-xs text-slate-900">${this.escapeHtml(s.name)}</div>
                      <div class="text-[10px] text-slate-500">Roll: ${s.rollNo}</div>
                    </div>
                    <span class="px-2 py-1 rounded-md bg-rose-100 text-rose-700 text-xs font-extrabold">
                      ${s.attendance ? s.attendance.overall : 0}%
                    </span>
                  </div>
                `).join('') : `
                  <div class="text-xs text-slate-400 text-center py-4">No students below 75% attendance.</div>
                `}
              </div>
            </div>

            <div class="pt-4 border-t border-slate-100">
              <button onclick="App.navigateTo('student-management')" class="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition">
                Review Student Directory &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Render Charts after DOM injection
    setTimeout(() => {
      this.initAdminCharts(students);
    }, 50);
  },

  initAdminCharts(students) {
    // Attendance by Subject Chart
    const ctx1 = document.getElementById('chart-attendance-trend');
    if (ctx1) {
      this.chartInstances['att-trend'] = new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: ['CS601 (Distributed)', 'CS602 (Compilers)', 'CS603 (AI/ML)', 'CS604 (Networks)', 'CS605 (Web Eng)'],
          datasets: [{
            label: 'Average Attendance %',
            data: [87.4, 84.1, 89.2, 82.5, 83.8],
            backgroundColor: '#4f46e5',
            borderRadius: 6
          }, {
            label: 'Benchmark (75%)',
            data: [75, 75, 75, 75, 75],
            type: 'line',
            borderColor: '#ef4444',
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { min: 50, max: 100 }
          }
        }
      });
    }

    // Grade Distribution Doughnut Chart
    const ctx2 = document.getElementById('chart-grades-distribution');
    if (ctx2) {
      this.chartInstances['grade-dist'] = new Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels: ['Outstanding (O)', 'Excellent (A+)', 'Very Good (A)', 'Good (B+)', 'Needs Focus (B/C)'],
          datasets: [{
            data: [3, 4, 2, 1, 0],
            backgroundColor: ['#10b981', '#06b6d4', '#4f46e5', '#f59e0b', '#ef4444']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    }
  },

  confirmResetData() {
    if (confirm('Restore portal to default seed records? Any temporary edits will be refreshed.')) {
      Store.resetToDefault();
      Promise.all(Object.entries(Store.collectionKeys).map(([collection, key]) => {
        const records = JSON.parse(localStorage.getItem(key)) || [];
        return Store.syncCollection(collection, records, true);
      })).then(() => {
        this.showToast('Reset to default seed data completed!', 'success');
        this.navigateTo('admin-dashboard');
      }).catch(error => {
        this.showToast(`Local sample data reset, but MySQL synchronization failed: ${error.message}`, 'error');
      });
    }
  },

  /* =========================================================================
     4. FACULTY MANAGEMENT PAGE
     ========================================================================= */
  renderFacultyManagement(container) {
    const faculty = Store.getFaculty();

    container.innerHTML = `
      <div class="animate-fade-in space-y-6 pb-16">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div>
            <h1 class="text-2xl font-extrabold text-slate-900">Faculty Management Directory</h1>
            <p class="text-xs text-slate-500">Manage teaching staff credentials, academic designations, and assigned subject workloads.</p>
          </div>
          <button onclick="App.openAddFacultyModal()" class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-2">
            <span>+</span> Add Faculty Member
          </button>
        </div>

        <!-- Filter & Search Controls -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div class="relative w-full sm:w-80">
            <input type="text" id="faculty-search-input" onkeyup="App.filterFacultyList()" placeholder="Search by name, employee ID, or subject..." class="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <span class="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
          </div>

          <div class="flex items-center gap-2 w-full sm:w-auto">
            <label class="text-xs text-slate-500 font-medium">Designation:</label>
            <select id="faculty-designation-filter" onchange="App.filterFacultyList()" class="text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="ALL">All Designations</option>
              <option value="Professor">Professors</option>
              <option value="Associate">Associate Professors</option>
              <option value="Assistant">Assistant Professors</option>
            </select>
          </div>
        </div>

        <!-- Faculty Grid -->
        <div id="faculty-grid-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${this.renderFacultyCardsHtml(faculty)}
        </div>
      </div>
    `;
  },

  renderFacultyCardsHtml(facultyList) {
    if (facultyList.length === 0) {
      return `
        <div class="col-span-full py-12 text-center text-slate-400 text-sm">
          No faculty members matching current filters.
        </div>
      `;
    }

    return facultyList.map(f => `
      <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm card-hover flex flex-col justify-between">
        <div class="space-y-4">
          <div class="flex items-start gap-4">
            <img src="${f.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}" alt="${f.name}" class="w-14 h-14 rounded-2xl object-cover border border-slate-100 shadow-sm">
            <div class="flex-1 min-w-0">
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">${f.employeeId}</span>
              <h3 class="font-bold text-slate-900 text-base truncate mt-1">${f.name}</h3>
              <p class="text-xs text-indigo-600 font-semibold truncate">${f.designation}</p>
            </div>
          </div>

          <div class="text-xs space-y-1.5 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div><strong class="text-slate-700">Qualification:</strong> ${f.qualification || 'Ph.D.'}</div>
            <div><strong class="text-slate-700">Specialization:</strong> ${f.specialization || 'Computer Science'}</div>
            <div><strong class="text-slate-700">Office:</strong> ${f.office || 'CSE Tech Block'}</div>
            <div><strong class="text-slate-700">Email:</strong> <a href="mailto:${f.email}" class="text-indigo-600 hover:underline">${f.email}</a></div>
          </div>

          <div>
            <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Assigned Subjects:</div>
            <div class="flex flex-wrap gap-1.5">
              ${(f.subjects || []).map(s => `
                <span class="text-[11px] bg-indigo-50 text-indigo-700 font-medium px-2 py-0.5 rounded-md border border-indigo-100">
                  ${s}
                </span>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between">
          <button onclick="App.openFacultyProfileModal('${f.id}')" class="text-xs font-bold text-indigo-600 hover:text-indigo-800">
            View Full Bio &rarr;
          </button>
          <div class="flex items-center gap-2">
            <button onclick="App.openEditFacultyModal('${f.id}')" class="text-xs px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold">
              Edit
            </button>
            <button onclick="App.handleDeleteFaculty('${f.id}')" class="text-xs px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg font-semibold">
              Delete
            </button>
          </div>
        </div>
      </div>
    `).join('');
  },

  filterFacultyList() {
    const search = document.getElementById('faculty-search-input').value.toLowerCase().trim();
    const filter = document.getElementById('faculty-designation-filter').value;
    const allFaculty = Store.getFaculty();

    const filtered = allFaculty.filter(f => {
      const matchSearch = f.name.toLowerCase().includes(search) || 
                          f.employeeId.toLowerCase().includes(search) ||
                          (f.subjects && f.subjects.some(s => s.toLowerCase().includes(search)));
      
      let matchFilter = true;
      if (filter !== 'ALL') {
        matchFilter = f.designation.toLowerCase().includes(filter.toLowerCase());
      }
      return matchSearch && matchFilter;
    });

    const container = document.getElementById('faculty-grid-container');
    if (container) {
      container.innerHTML = this.renderFacultyCardsHtml(filtered);
    }
  },

  openAddFacultyModal() {
    const html = `
      <form id="form-add-faculty" onsubmit="App.handleAddFacultySubmit(event)" class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Employee ID</label>
            <input type="text" id="mfac-id" required value="EMP-CSE-${Math.floor(110 + Math.random() * 890)}" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
            <input type="text" id="mfac-name" required placeholder="e.g. Dr. Jennifer Taylor" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300">
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Designation</label>
            <select id="mfac-designation" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300">
              <option value="Associate Professor">Associate Professor</option>
              <option value="Professor">Professor</option>
              <option value="Assistant Professor" selected>Assistant Professor</option>
              <option value="Lab Instructor">Lab Instructor</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Qualification</label>
            <input type="text" id="mfac-qualification" required placeholder="e.g. Ph.D. in AI, Stanford" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300">
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Specialization</label>
          <input type="text" id="mfac-specialization" placeholder="e.g. Distributed Systems & Edge Computing" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300">
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <input type="email" id="mfac-email" required placeholder="faculty.name@college.edu" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Office Cabin</label>
            <input type="text" id="mfac-office" value="Cabin 320, Tech Block" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300">
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Assigned Subjects (comma separated)</label>
          <input type="text" id="mfac-subjects" value="CS601: Distributed Systems" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300">
        </div>

        <div class="pt-4 flex justify-end gap-2 border-t border-slate-100">
          <button type="button" onclick="App.closeModal()" class="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl">Cancel</button>
          <button type="submit" class="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow">Save Faculty</button>
        </div>
      </form>
    `;
    this.openModal('Add New Faculty Member', html);
  },

  handleAddFacultySubmit(e) {
    e.preventDefault();
    const newFaculty = {
      employeeId: document.getElementById('mfac-id').value,
      name: document.getElementById('mfac-name').value,
      designation: document.getElementById('mfac-designation').value,
      qualification: document.getElementById('mfac-qualification').value,
      specialization: document.getElementById('mfac-specialization').value,
      email: document.getElementById('mfac-email').value,
      office: document.getElementById('mfac-office').value,
      subjects: document.getElementById('mfac-subjects').value.split(',').map(s => s.trim()).filter(Boolean)
    };

    Store.addFaculty(newFaculty);
    this.closeModal();
    this.showToast('Faculty member added successfully!', 'success');
    this.navigateTo('faculty-management');
  },

  openEditFacultyModal(id) {
    const f = Store.getFaculty().find(item => item.id === id);
    if (!f) return;

    const html = `
      <form id="form-edit-faculty" onsubmit="App.handleEditFacultySubmit(event, '${f.id}')" class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Employee ID</label>
            <input type="text" id="efac-id" required value="${f.employeeId}" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
            <input type="text" id="efac-name" required value="${f.name}" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300">
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Designation</label>
            <input type="text" id="efac-designation" value="${f.designation}" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Qualification</label>
            <input type="text" id="efac-qualification" value="${f.qualification}" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300">
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Office Cabin</label>
          <input type="text" id="efac-office" value="${f.office || ''}" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300">
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
          <input type="email" id="efac-email" value="${f.email}" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300">
        </div>

        <div class="pt-4 flex justify-end gap-2 border-t border-slate-100">
          <button type="button" onclick="App.closeModal()" class="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl">Cancel</button>
          <button type="submit" class="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow">Update Details</button>
        </div>
      </form>
    `;
    this.openModal('Edit Faculty Information', html);
  },

  handleEditFacultySubmit(e, id) {
    e.preventDefault();
    Store.updateFaculty(id, {
      employeeId: document.getElementById('efac-id').value,
      name: document.getElementById('efac-name').value,
      designation: document.getElementById('efac-designation').value,
      qualification: document.getElementById('efac-qualification').value,
      office: document.getElementById('efac-office').value,
      email: document.getElementById('efac-email').value
    });

    this.closeModal();
    this.showToast('Faculty updated successfully!', 'success');
    this.navigateTo('faculty-management');
  },

  handleDeleteFaculty(id) {
    if (confirm('Are you sure you want to remove this faculty record?')) {
      Store.deleteFaculty(id);
      this.showToast('Faculty removed.', 'info');
      this.navigateTo('faculty-management');
    }
  },

  openFacultyProfileModal(id) {
    const f = Store.getFaculty().find(item => item.id === id);
    if (!f) return;

    const html = `
      <div class="space-y-4">
        <div class="flex items-center gap-4">
          <img src="${f.avatar}" class="w-16 h-16 rounded-2xl object-cover shadow-sm">
          <div>
            <h3 class="text-base font-bold text-slate-900">${f.name}</h3>
            <p class="text-xs text-indigo-600 font-semibold">${f.designation}</p>
            <span class="text-[10px] text-slate-400 font-mono">${f.employeeId}</span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div><strong>Qualification:</strong> ${f.qualification}</div>
          <div><strong>Specialization:</strong> ${f.specialization}</div>
          <div><strong>Email:</strong> ${f.email}</div>
          <div><strong>Office:</strong> ${f.office}</div>
          <div><strong>Joining Date:</strong> ${f.joiningDate || '2020-08-01'}</div>
          <div><strong>Status:</strong> <span class="text-emerald-600 font-bold">${f.status || 'Active'}</span></div>
        </div>

        <div>
          <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Courses Taught This Semester</h4>
          <div class="space-y-1.5">
            ${(f.subjects || []).map(s => `
              <div class="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs font-medium text-indigo-900 flex items-center justify-between">
                <span>📚 ${s}</span>
                <span class="text-[10px] bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded font-bold">4 Credits</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    this.openModal(`Faculty Profile - ${f.name}`, html);
  },

  /* =========================================================================
     5. STUDENT MANAGEMENT PAGE
     ========================================================================= */
  renderStudentManagement(container) {
    const students = Store.getStudents();

    container.innerHTML = `
      <div class="animate-fade-in space-y-6 pb-16">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <div>
            <h1 class="text-2xl font-extrabold text-slate-900">Student Directory & Academic Records</h1>
            <p class="text-xs text-slate-500">Manage student enrollment, track individual attendance percentages, and monitor performance.</p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="App.exportStudentsCSV()" class="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5">
              <span>📥</span> Export CSV
            </button>
            <button onclick="App.openAddStudentModal()" class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-2">
              <span>+</span> Enroll New Student
            </button>
          </div>
        </div>

        <!-- Filter Controls -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-3 items-center justify-between">
          <div class="relative w-full sm:w-72">
            <input type="text" id="student-search-input" onkeyup="App.filterStudentList()" placeholder="Search by name, roll no..." class="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <span class="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <select id="student-sem-filter" onchange="App.filterStudentList()" class="text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="ALL">All Semesters</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
              <option value="3">Semester 3</option>
              <option value="4">Semester 4</option>
              <option value="5">Semester 5</option>
              <option value="6" selected>Semester 6</option>
              <option value="7">Semester 7</option>
              <option value="8">Semester 8</option>
            </select>

            <select id="student-status-filter" onchange="App.filterStudentList()" class="text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="ALL">All Attendance Status</option>
              <option value="ELIGIBLE">Eligible (>= 75%)</option>
              <option value="SHORTAGE">Shortage Warning (< 75%)</option>
            </select>
          </div>
        </div>

        <!-- Students Table -->
        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse data-table">
              <thead>
                <tr>
                  <th>Roll / Reg No</th>
                  <th>Student Name</th>
                  <th>Sem & Sec</th>
                  <th>CGPA</th>
                  <th>Overall Attendance</th>
                  <th>Contact Info</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody id="student-table-body">
                ${this.renderStudentRowsHtml(students)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  renderStudentRowsHtml(studentList) {
    if (studentList.length === 0) {
      return `
        <tr>
          <td colspan="7" class="text-center py-8 text-slate-400 text-xs">No student records found matching the filter criteria.</td>
        </tr>
      `;
    }

    return studentList.map(s => {
      const att = s.attendance ? s.attendance.overall : 85;
      const isShortage = att < 75;

      return `
        <tr>
          <td>
            <div class="font-bold text-xs text-slate-900 font-mono">${s.rollNo}</div>
            <div class="text-[10px] text-slate-400">${s.regNo || ''}</div>
          </td>
          <td>
            <div class="flex items-center gap-3">
              <img src="${s.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}" class="w-8 h-8 rounded-full object-cover">
              <div>
                <div class="font-bold text-xs text-slate-900">${this.escapeHtml(s.name)}</div>
                <div class="text-[10px] text-slate-500">${s.gender || 'Student'}</div>
              </div>
            </div>
          </td>
          <td>
            <span class="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">Sem ${s.semester} - ${s.section}</span>
          </td>
          <td>
            <span class="font-bold text-xs text-indigo-700">${s.cgpa ? s.cgpa.toFixed(2) : '8.00'}</span>
          </td>
          <td>
            <div class="flex items-center gap-2">
              <span class="badge ${isShortage ? 'badge-danger' : 'badge-success'}">
                ${att}% ${isShortage ? '⚠️ Shortage' : '✓ Safe'}
              </span>
            </div>
          </td>
          <td>
            <div class="text-xs text-slate-600">${s.email}</div>
            <div class="text-[10px] text-slate-400">${s.phone}</div>
          </td>
          <td class="text-right">
            <div class="flex items-center justify-end gap-1">
              <button onclick="App.openStudentProfileModal('${s.id}')" class="px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 rounded font-semibold" title="View Full Report Card">
                View
              </button>
              <button onclick="App.openEditStudentModal('${s.id}')" class="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded font-semibold">
                Edit
              </button>
              <button onclick="App.handleDeleteStudent('${s.id}')" class="px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded font-semibold">
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  filterStudentList() {
    const search = document.getElementById('student-search-input').value.toLowerCase().trim();
    const semFilter = document.getElementById('student-sem-filter').value;
    const statusFilter = document.getElementById('student-status-filter').value;
    const all = Store.getStudents();

    const filtered = all.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(search) || s.rollNo.toLowerCase().includes(search);
      let matchSem = true;
      if (semFilter !== 'ALL') {
        matchSem = String(s.semester) === semFilter;
      }
      let matchStatus = true;
      const att = s.attendance ? s.attendance.overall : 85;
      if (statusFilter === 'SHORTAGE') matchStatus = att < 75;
      if (statusFilter === 'ELIGIBLE') matchStatus = att >= 75;

      return matchSearch && matchSem && matchStatus;
    });

    const tbody = document.getElementById('student-table-body');
    if (tbody) tbody.innerHTML = this.renderStudentRowsHtml(filtered);
  },

  openAddStudentModal() {
    const html = `
      <form id="form-add-student" onsubmit="App.handleAddStudentSubmit(event)" class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Roll Number</label>
            <input type="text" id="mstu-roll" required value="CS2023${Math.floor(100 + Math.random() * 890)}" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Full Legal Name</label>
            <input type="text" id="mstu-name" required placeholder="e.g. Rachel Adams" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300">
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Semester</label>
            <select id="mstu-sem" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300">
              <option value="1">1st Sem</option>
              <option value="2">2nd Sem</option>
              <option value="3">3rd Sem</option>
              <option value="4">4th Sem</option>
              <option value="5">5th Sem</option>
              <option value="6" selected>6th Sem</option>
              <option value="7">7th Sem</option>
              <option value="8">8th Sem</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Section</label>
            <select id="mstu-sec" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300">
              <option value="A" selected>Section A</option>
              <option value="B">Section B</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">CGPA</label>
            <input type="number" step="0.01" min="0" max="10" id="mstu-cgpa" value="8.50" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300">
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Email</label>
            <input type="email" id="mstu-email" required placeholder="rachel.adams@college.edu" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Phone</label>
            <input type="text" id="mstu-phone" value="+1 (555) 412-9099" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300">
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Initial Overall Attendance %</label>
          <input type="number" min="0" max="100" id="mstu-att" value="85" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300">
        </div>

        <div class="pt-4 flex justify-end gap-2 border-t border-slate-100">
          <button type="button" onclick="App.closeModal()" class="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl">Cancel</button>
          <button type="submit" class="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow">Enroll Student</button>
        </div>
      </form>
    `;
    this.openModal('Enroll New Student', html);
  },

  handleAddStudentSubmit(e) {
    e.preventDefault();
    const attVal = parseFloat(document.getElementById('mstu-att').value) || 85;

    Store.addStudent({
      rollNo: document.getElementById('mstu-roll').value,
      regNo: '23CSE' + Math.floor(10000 + Math.random() * 90000),
      name: document.getElementById('mstu-name').value,
      semester: parseInt(document.getElementById('mstu-sem').value),
      section: document.getElementById('mstu-sec').value,
      cgpa: parseFloat(document.getElementById('mstu-cgpa').value) || 8.0,
      email: document.getElementById('mstu-email').value,
      phone: document.getElementById('mstu-phone').value,
      attendance: {
        overall: attVal,
        totalClasses: 180,
        attendedClasses: Math.round(180 * (attVal / 100)),
        subjects: {
          'CS601': { attended: 35, total: 42, percentage: attVal }
        }
      }
    });

    this.closeModal();
    this.showToast('Student enrolled successfully!', 'success');
    this.navigateTo('student-management');
  },

  openEditStudentModal(id) {
    const s = Store.getStudents().find(item => item.id === id);
    if (!s) return;

    const html = `
      <form id="form-edit-student" onsubmit="App.handleEditStudentSubmit(event, '${s.id}')" class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Roll Number</label>
            <input type="text" id="estu-roll" required value="${s.rollNo}" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Student Name</label>
            <input type="text" id="estu-name" required value="${this.escapeHtml(s.name)}" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300">
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Email</label>
            <input type="email" id="estu-email" required value="${s.email}" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Phone</label>
            <input type="text" id="estu-phone" value="${s.phone}" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300">
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">CGPA</label>
            <input type="number" step="0.01" id="estu-cgpa" value="${s.cgpa || 8.0}" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Section</label>
            <input type="text" id="estu-sec" value="${s.section || 'A'}" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300">
          </div>
        </div>

        <div class="pt-4 flex justify-end gap-2 border-t border-slate-100">
          <button type="button" onclick="App.closeModal()" class="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl">Cancel</button>
          <button type="submit" class="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow">Update Student</button>
        </div>
      </form>
    `;
    this.openModal('Edit Student Details', html);
  },

  handleEditStudentSubmit(e, id) {
    e.preventDefault();
    Store.updateStudent(id, {
      rollNo: document.getElementById('estu-roll').value,
      name: document.getElementById('estu-name').value,
      email: document.getElementById('estu-email').value,
      phone: document.getElementById('estu-phone').value,
      cgpa: parseFloat(document.getElementById('estu-cgpa').value),
      section: document.getElementById('estu-sec').value
    });

    this.closeModal();
    this.showToast('Student record updated.', 'success');
    this.navigateTo('student-management');
  },

  handleDeleteStudent(id) {
    if (confirm('Are you sure you want to delete this student record?')) {
      Store.deleteStudent(id);
      this.showToast('Student removed.', 'info');
      this.navigateTo('student-management');
    }
  },

  openStudentProfileModal(id) {
    const s = Store.getStudents().find(item => item.id === id);
    if (!s) return;

    const att = s.attendance ? s.attendance.overall : 85;
    const isShortage = att < 75;

    const html = `
      <div class="space-y-5">
        <div class="flex items-center gap-4">
          <img src="${s.avatar}" class="w-16 h-16 rounded-2xl object-cover shadow-sm">
          <div>
            <h3 class="text-base font-bold text-slate-900">${this.escapeHtml(s.name)}</h3>
            <p class="text-xs text-indigo-600 font-semibold">Roll: ${s.rollNo} | Reg: ${s.regNo || '23CSE01000'}</p>
            <p class="text-xs text-slate-500">B.Tech CSE - Semester ${s.semester}, Section ${s.section}</p>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <span class="text-[10px] text-slate-400 font-bold uppercase">CGPA</span>
            <div class="text-xl font-extrabold text-slate-900">${s.cgpa ? s.cgpa.toFixed(2) : '8.50'}</div>
          </div>
          <div class="p-3 rounded-xl ${isShortage ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'} border text-center">
            <span class="text-[10px] font-bold uppercase">Attendance</span>
            <div class="text-xl font-extrabold">${att}%</div>
          </div>
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <span class="text-[10px] text-slate-400 font-bold uppercase">Eligibility</span>
            <div class="text-xs font-bold mt-1.5 ${isShortage ? 'text-rose-600' : 'text-emerald-600'}">
              ${isShortage ? '⚠️ Ineligible' : '✓ Exam Eligible'}
            </div>
          </div>
        </div>

        <div>
          <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Subject Attendance Breakdown</h4>
          <div class="space-y-1.5">
            ${s.attendance && s.attendance.subjects ? Object.entries(s.attendance.subjects).map(([code, sub]) => `
              <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
                <span class="font-bold text-slate-800">${code}</span>
                <span class="text-slate-500">${sub.attended} / ${sub.total} classes</span>
                <span class="font-extrabold ${sub.percentage < 75 ? 'text-rose-600' : 'text-emerald-600'}">${sub.percentage}%</span>
              </div>
            `).join('') : '<div class="text-xs text-slate-400">No subject records available.</div>'}
          </div>
        </div>

        <div>
          <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Internal Assessment Summary</h4>
          <div class="space-y-1.5">
            ${s.marks ? Object.entries(s.marks).map(([code, m]) => `
              <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
                <span class="font-bold text-slate-800">${code}</span>
                <span class="text-slate-500">IA-1: ${m.ia1} | IA-2: ${m.ia2} | Total: ${m.total}/${m.maxTotal}</span>
                <span class="font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">Grade ${m.grade}</span>
              </div>
            `).join('') : '<div class="text-xs text-slate-400">No internal marks published.</div>'}
          </div>
        </div>
      </div>
    `;
    this.openModal(`Academic Dossier: ${s.name}`, html);
  },

  exportStudentsCSV() {
    const students = Store.getStudents();
    let csv = "RollNo,RegNo,Name,Semester,Section,CGPA,OverallAttendance,Email,Phone\n";
    students.forEach(s => {
      const att = s.attendance ? s.attendance.overall : 85;
      csv += `"${s.rollNo}","${s.regNo || ''}","${s.name}","${s.semester}","${s.section}","${s.cgpa || 8.0}","${att}%","${s.email}","${s.phone}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Students_Directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast('CSV export downloaded!', 'success');
  },

  /* =========================================================================
     6. ATTENDANCE MARKING PAGE (FACULTY)
     ========================================================================= */
  renderAttendanceMarking(container) {
    const courses = Store.getCourses();
    const students = Store.getStudents();
    const logs = Store.getAttendanceLogs();

    container.innerHTML = `
      <div class="animate-fade-in space-y-6 pb-16">
        <!-- Faculty Header -->
        <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full w-fit">
              <span>👨‍🏫</span> Faculty Attendance Desk
            </div>
            <h1 class="text-2xl font-extrabold text-slate-900 mt-2">Class Attendance Marking</h1>
            <p class="text-xs text-slate-500">Record daily attendance by course, period, and section. Updates live student eligibility records instantly.</p>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-500 font-medium">Logged in as:</span>
            <span class="text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-xl">Dr. Sarah Jenkins</span>
          </div>
        </div>

        <!-- Session Selector Controls -->
        <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Select Course / Subject</label>
              <select id="att-course-select" onchange="App.handleAttendanceCourseChange()" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                ${courses.map(c => `
                  <option value="${c.code}" ${c.code === 'CS601' ? 'selected' : ''}>${c.code}: ${c.name}</option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Semester & Section</label>
              <select id="att-section-select" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="6-A" selected>6th Sem - Section A</option>
                <option value="6-B">6th Sem - Section B</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Session Date</label>
              <input type="date" id="att-date-input" value="${new Date().toISOString().split('T')[0]}" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Lecture Period / Hour</label>
              <select id="att-period-select" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="Period 1 (09:00 - 10:00 AM)">Period 1 (09:00 - 10:00 AM)</option>
                <option value="Period 2 (10:00 - 11:00 AM)" selected>Period 2 (10:00 - 11:00 AM)</option>
                <option value="Period 3 (11:15 - 12:15 PM)">Period 3 (11:15 - 12:15 PM)</option>
                <option value="Period 4 (01:30 - 02:30 PM)">Period 4 (01:30 - 02:30 PM)</option>
                <option value="Period 5 (02:30 - 03:30 PM)">Period 5 (02:30 - 03:30 PM)</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Topic Covered (Optional)</label>
              <input type="text" id="att-topic-input" placeholder="e.g. Distributed Hash Tables" value="Byzantine Fault Tolerance & Consensus" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>
          </div>
        </div>

        <!-- Live Live Attendance Counter & Bulk Controls -->
        <div class="bg-indigo-50/80 border border-indigo-100 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-6">
            <div>
              <span class="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Enrolled</span>
              <div id="stat-total-students" class="text-xl font-extrabold text-slate-900">${students.length}</div>
            </div>
            <div>
              <span class="text-[10px] text-emerald-700 uppercase font-bold tracking-wider">Present</span>
              <div id="stat-present-count" class="text-xl font-extrabold text-emerald-600">${students.length}</div>
            </div>
            <div>
              <span class="text-[10px] text-rose-700 uppercase font-bold tracking-wider">Absent</span>
              <div id="stat-absent-count" class="text-xl font-extrabold text-rose-600">0</div>
            </div>
            <div>
              <span class="text-[10px] text-indigo-700 uppercase font-bold tracking-wider">Attendance %</span>
              <div id="stat-attendance-pct" class="text-xl font-extrabold text-indigo-700">100%</div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="App.setAllAttendanceStatus('Present')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition">
              ✓ All Present
            </button>
            <button onclick="App.setAllAttendanceStatus('Absent')" class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition">
              ✗ All Absent
            </button>
            <button onclick="App.invertAttendanceStatus()" class="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition">
              🔄 Invert
            </button>
          </div>
        </div>

        <!-- Student Attendance Marking Roster Table -->
        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse data-table">
              <thead>
                <tr>
                  <th style="width: 140px;">Roll Number</th>
                  <th>Student Name</th>
                  <th>Past Attendance</th>
                  <th style="width: 220px;">Mark Status</th>
                  <th>Remarks (Optional)</th>
                </tr>
              </thead>
              <tbody id="attendance-roster-body">
                ${students.map((s, index) => `
                  <tr data-student-id="${s.id}" data-roll="${s.rollNo}">
                    <td class="font-mono font-bold text-xs text-slate-900">${s.rollNo}</td>
                    <td>
                      <div class="flex items-center gap-2.5">
                        <img src="${s.avatar}" class="w-7 h-7 rounded-full object-cover">
                        <span class="font-bold text-xs text-slate-800">${this.escapeHtml(s.name)}</span>
                      </div>
                    </td>
                    <td>
                      <span class="text-xs font-semibold ${s.attendance && s.attendance.overall < 75 ? 'text-rose-600' : 'text-emerald-600'}">
                        ${s.attendance ? s.attendance.overall : 85}%
                      </span>
                    </td>
                    <td>
                      <div class="inline-flex rounded-lg p-1 bg-slate-100 gap-1">
                        <button type="button" onclick="App.setStudentAttStatus('${s.id}', 'Present')" id="btn-att-${s.id}-Present" class="btn-att-status active-present">
                          Present
                        </button>
                        <button type="button" onclick="App.setStudentAttStatus('${s.id}', 'Absent')" id="btn-att-${s.id}-Absent" class="btn-att-status">
                          Absent
                        </button>
                        <button type="button" onclick="App.setStudentAttStatus('${s.id}', 'Late')" id="btn-att-${s.id}-Late" class="btn-att-status">
                          Late
                        </button>
                      </div>
                      <input type="hidden" id="status-val-${s.id}" value="Present">
                    </td>
                    <td>
                      <input type="text" id="remarks-${s.id}" placeholder="e.g. On-duty slip" class="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Bottom Submission Bar -->
          <div class="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="text-xs text-slate-500">
              * Committing attendance will automatically recalculate student aggregate percentages and eligibility statuses.
            </div>
            <button onclick="App.commitAttendanceSession()" class="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-600/30 transition transform active:scale-95 flex items-center gap-2">
              <span>💾</span> Save & Submit Attendance Record
            </button>
          </div>
        </div>

        <!-- Recent Historical Attendance Logs -->
        <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-slate-900">Recent Attendance Sessions Logged</h3>
            <span class="text-xs text-slate-400">Showing last logged classes</span>
          </div>

          <div class="space-y-3">
            ${logs.slice(0, 5).map(log => `
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-indigo-700">${log.courseId}: ${log.courseName}</span>
                    <span class="text-slate-400">•</span>
                    <span class="font-semibold text-slate-700">${log.period}</span>
                  </div>
                  <div class="text-slate-500">
                    Date: <strong>${log.date}</strong> | Topic: <em>${log.topic || 'General Lecture'}</em> | Logged by: ${log.facultyName}
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <div class="text-right">
                    <span class="text-emerald-600 font-bold">${log.presentCount} Present</span> /
                    <span class="text-rose-600 font-bold">${log.absentCount} Absent</span>
                  </div>
                  <span class="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold">
                    ${Math.round((log.presentCount / log.totalStudents) * 100)}%
                  </span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    this.updateAttendanceStats();
  },

  setStudentAttStatus(studentId, status) {
    const input = document.getElementById(`status-val-${studentId}`);
    if (input) input.value = status;

    const btnP = document.getElementById(`btn-att-${studentId}-Present`);
    const btnA = document.getElementById(`btn-att-${studentId}-Absent`);
    const btnL = document.getElementById(`btn-att-${studentId}-Late`);

    [btnP, btnA, btnL].forEach(b => {
      if (b) b.className = 'btn-att-status';
    });

    if (status === 'Present' && btnP) btnP.className = 'btn-att-status active-present';
    if (status === 'Absent' && btnA) btnA.className = 'btn-att-status active-absent';
    if (status === 'Late' && btnL) btnL.className = 'btn-att-status active-late';

    this.updateAttendanceStats();
  },

  setAllAttendanceStatus(status) {
    const students = Store.getStudents();
    students.forEach(s => {
      this.setStudentAttStatus(s.id, status);
    });
  },

  invertAttendanceStatus() {
    const students = Store.getStudents();
    students.forEach(s => {
      const input = document.getElementById(`status-val-${s.id}`);
      if (input) {
        const next = input.value === 'Present' ? 'Absent' : 'Present';
        this.setStudentAttStatus(s.id, next);
      }
    });
  },

  updateAttendanceStats() {
    const students = Store.getStudents();
    let present = 0;
    let absent = 0;

    students.forEach(s => {
      const input = document.getElementById(`status-val-${s.id}`);
      if (input && (input.value === 'Present' || input.value === 'Late')) {
        present++;
      } else {
        absent++;
      }
    });

    const total = students.length || 1;
    const pct = Math.round((present / total) * 100);

    const statTotal = document.getElementById('stat-total-students');
    const statP = document.getElementById('stat-present-count');
    const statA = document.getElementById('stat-absent-count');
    const statPct = document.getElementById('stat-attendance-pct');

    if (statTotal) statTotal.textContent = total;
    if (statP) statP.textContent = present;
    if (statA) statA.textContent = absent;
    if (statPct) statPct.textContent = `${pct}%`;
  },

  commitAttendanceSession() {
    const courseSelect = document.getElementById('att-course-select');
    const courseId = courseSelect.value;
    const courseName = courseSelect.options[courseSelect.selectedIndex].text.split(':')[1]?.trim() || courseId;
    const date = document.getElementById('att-date-input').value;
    const period = document.getElementById('att-period-select').value;
    const topic = document.getElementById('att-topic-input').value;

    const students = Store.getStudents();
    const records = [];
    let presentCount = 0;
    let absentCount = 0;

    students.forEach(s => {
      const statusInput = document.getElementById(`status-val-${s.id}`);
      const remarksInput = document.getElementById(`remarks-${s.id}`);
      const status = statusInput ? statusInput.value : 'Present';
      const remarks = remarksInput ? remarksInput.value : '';

      if (status === 'Present' || status === 'Late') presentCount++;
      else absentCount++;

      records.push({
        studentId: s.id,
        rollNo: s.rollNo,
        status,
        remarks
      });
    });

    const payload = {
      courseId,
      courseName,
      facultyName: 'Dr. Sarah Jenkins',
      semester: 6,
      section: 'A',
      date,
      period,
      topic,
      totalStudents: students.length,
      presentCount,
      absentCount,
      records
    };

    Store.recordAttendance(payload);
    this.showToast(`Attendance submitted for ${courseId}! (${presentCount}/${students.length} Present)`, 'success');
    this.navigateTo('attendance-marking');
  },

  /* =========================================================================
     7. INTERNAL MARKS ENTRY PAGE
     ========================================================================= */
  renderInternalMarks(container) {
    const courses = Store.getCourses();
    const students = Store.getStudents();

    container.innerHTML = `
      <div class="animate-fade-in space-y-6 pb-16">
        <!-- Header -->
        <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full w-fit">
              <span>📊</span> Continuous Internal Assessment Portal
            </div>
            <h1 class="text-2xl font-extrabold text-slate-900 mt-2">Internal Marks Entry & Evaluation</h1>
            <p class="text-xs text-slate-500">Record marks for Mid-Terms, IA-1, IA-2, and Lab Projects with auto-grade calculations.</p>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="App.autoFillMarksDemo()" class="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-xl text-xs transition">
              ⚡ Quick Fill Sample Marks
            </button>
            <button onclick="window.print()" class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition">
              🖨️ Print Marksheet
            </button>
          </div>
        </div>

        <!-- Assessment Configuration Card -->
        <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Select Subject</label>
              <select id="marks-course-select" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                ${courses.map(c => `
                  <option value="${c.code}" ${c.code === 'CS601' ? 'selected' : ''}>${c.code}: ${c.name}</option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Assessment Type</label>
              <select id="marks-assessment-type" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="IA-1" selected>Internal Assessment 1 (IA-1)</option>
                <option value="IA-2">Internal Assessment 2 (IA-2)</option>
                <option value="Assignment">Assignment / Mini-Project</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Maximum Marks</label>
              <input type="number" id="marks-max-input" value="25" onchange="App.recalculateMarksPreview()" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Pass Benchmark (Marks)</label>
              <input type="number" id="marks-pass-input" value="10" class="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>
          </div>
        </div>

        <!-- Marks Entry Table -->
        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse data-table">
              <thead>
                <tr>
                  <th style="width: 140px;">Roll Number</th>
                  <th>Student Name</th>
                  <th>Attendance %</th>
                  <th style="width: 180px;">Marks Scored (Max: <span id="header-max-marks">25</span>)</th>
                  <th>Percentage</th>
                  <th>Grade</th>
                  <th>Faculty Comments</th>
                </tr>
              </thead>
              <tbody id="marks-entry-body">
                ${students.map(s => {
                  const currMark = (s.marks && s.marks['CS601']) ? s.marks['CS601'].ia1 : 22;
                  const pct = Math.round((currMark / 25) * 100);
                  let grade = 'A';
                  if (pct >= 90) grade = 'O';
                  else if (pct >= 80) grade = 'A+';
                  else if (pct >= 70) grade = 'A';
                  else if (pct >= 60) grade = 'B+';
                  else if (pct >= 50) grade = 'B';
                  else grade = 'F';

                  return `
                    <tr data-student-id="${s.id}" data-roll="${s.rollNo}">
                      <td class="font-mono font-bold text-xs text-slate-900">${s.rollNo}</td>
                      <td>
                        <div class="flex items-center gap-2">
                          <img src="${s.avatar}" class="w-7 h-7 rounded-full object-cover">
                          <span class="font-bold text-xs text-slate-800">${this.escapeHtml(s.name)}</span>
                        </div>
                      </td>
                      <td>
                        <span class="text-xs font-semibold ${s.attendance && s.attendance.overall < 75 ? 'text-rose-600' : 'text-slate-600'}">
                          ${s.attendance ? s.attendance.overall : 85}%
                        </span>
                      </td>
                      <td>
                        <input type="number" step="0.5" min="0" max="25" id="input-mark-${s.id}" value="${currMark}" oninput="App.handleSingleMarkChange('${s.id}')" class="w-28 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      </td>
                      <td>
                        <span id="preview-pct-${s.id}" class="text-xs font-bold text-slate-700">${pct}%</span>
                      </td>
                      <td>
                        <span id="preview-grade-${s.id}" class="badge ${grade === 'O' || grade === 'A+' ? 'badge-success' : (grade === 'F' ? 'badge-danger' : 'badge-indigo')}">
                          ${grade}
                        </span>
                      </td>
                      <td>
                        <input type="text" id="input-rem-${s.id}" placeholder="e.g. Good theoretical depth" class="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200">
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Commit Marks Bar -->
          <div class="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="text-xs text-slate-500">
              * Published marks reflect immediately on student scorecards and overall cumulative grade reports.
            </div>
            <button onclick="App.commitInternalMarks()" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition transform active:scale-95 flex items-center gap-2">
              <span>🚀</span> Save & Publish Marks
            </button>
          </div>
        </div>
      </div>
    `;
  },

  handleSingleMarkChange(studentId) {
    const maxMarks = parseFloat(document.getElementById('marks-max-input').value) || 25;
    const input = document.getElementById(`input-mark-${studentId}`);
    const pctSpan = document.getElementById(`preview-pct-${studentId}`);
    const gradeSpan = document.getElementById(`preview-grade-${studentId}`);

    let val = parseFloat(input.value) || 0;
    if (val > maxMarks) {
      input.value = maxMarks;
      val = maxMarks;
    }
    if (val < 0) {
      input.value = 0;
      val = 0;
    }

    const pct = Math.round((val / maxMarks) * 100);
    let grade = 'A';
    let badgeClass = 'badge-indigo';

    if (pct >= 90) { grade = 'O'; badgeClass = 'badge-success'; }
    else if (pct >= 80) { grade = 'A+'; badgeClass = 'badge-success'; }
    else if (pct >= 70) { grade = 'A'; badgeClass = 'badge-indigo'; }
    else if (pct >= 60) { grade = 'B+'; badgeClass = 'badge-blue'; }
    else if (pct >= 50) { grade = 'B'; badgeClass = 'badge-warning'; }
    else { grade = 'F'; badgeClass = 'badge-danger'; }

    if (pctSpan) pctSpan.textContent = `${pct}%`;
    if (gradeSpan) {
      gradeSpan.textContent = grade;
      gradeSpan.className = `badge ${badgeClass}`;
    }
  },

  recalculateMarksPreview() {
    const maxVal = parseFloat(document.getElementById('marks-max-input').value) || 25;
    document.getElementById('header-max-marks').textContent = maxVal;
    const students = Store.getStudents();
    students.forEach(s => {
      this.handleSingleMarkChange(s.id);
    });
  },

  autoFillMarksDemo() {
    const students = Store.getStudents();
    const maxVal = parseFloat(document.getElementById('marks-max-input').value) || 25;
    students.forEach((s, idx) => {
      const input = document.getElementById(`input-mark-${s.id}`);
      if (input) {
        // High scores with a couple varied
        const simulated = Math.max(12, Math.min(maxVal, Math.round(maxVal * (0.75 + (idx % 4) * 0.08))));
        input.value = simulated;
        this.handleSingleMarkChange(s.id);
      }
    });
    this.showToast('Sample scores populated across roster!', 'info');
  },

  commitInternalMarks() {
    const courseId = document.getElementById('marks-course-select').value;
    const assessmentType = document.getElementById('marks-assessment-type').value;
    const maxMarks = parseFloat(document.getElementById('marks-max-input').value) || 25;

    const students = Store.getStudents();
    const entries = [];

    students.forEach(s => {
      const input = document.getElementById(`input-mark-${s.id}`);
      const remInput = document.getElementById(`input-rem-${s.id}`);
      entries.push({
        studentId: s.id,
        rollNo: s.rollNo,
        marks: parseFloat(input ? input.value : 0) || 0,
        remarks: remInput ? remInput.value : ''
      });
    });

    Store.saveInternalMarks(courseId, assessmentType, maxMarks, entries);
    this.showToast(`Published ${assessmentType} marks for ${courseId} successfully!`, 'success');
  },

  /* =========================================================================
     8. STUDENT DASHBOARD
     ========================================================================= */
  renderStudentDashboard(container) {
    const students = Store.getStudents();
    // Use Alex Rivera as default or first student
    const currentUser = Store.getCurrentUser();
    let student = students[0];
    if (currentUser && currentUser.role === 'student') {
      const matched = students.find(s => s.email === currentUser.email || s.rollNo === currentUser.rollNo);
      if (matched) student = matched;
    }

    const att = student.attendance ? student.attendance.overall : 86.4;
    const isShortage = att < 75;

    // Calculate classes needed to reach 75% if shortage
    let classesNeededToReach75 = 0;
    if (isShortage) {
      const attended = student.attendance.attendedClasses || 120;
      const total = student.attendance.totalClasses || 180;
      // Solve: (attended + x) / (total + x) >= 0.75 => attended + x >= 0.75 * total + 0.75 * x => 0.25 * x >= 0.75 * total - attended => x >= (0.75 * total - attended) / 0.25
      classesNeededToReach75 = Math.max(1, Math.ceil((0.75 * total - attended) / 0.25));
    }

    container.innerHTML = `
      <div class="animate-fade-in space-y-6 pb-16">
        <!-- Student Profile Top Banner -->
        <div class="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="flex items-center gap-5">
            <img src="${student.avatar}" class="w-20 h-20 rounded-2xl object-cover border-2 border-white/20 shadow-lg">
            <div>
              <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-xs font-semibold text-indigo-200 border border-white/10 mb-1">
                <span>🎓</span> B.Tech CSE • 6th Semester
              </div>
              <h1 class="text-2xl font-extrabold">${this.escapeHtml(student.name)}</h1>
              <p class="text-xs text-indigo-200 font-mono">Roll: ${student.rollNo} | Reg: ${student.regNo || '23CSE01042'} | Section: ${student.section}</p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <button onclick="App.openHallTicketModal('${student.id}')" class="px-4 py-2.5 bg-white text-indigo-900 hover:bg-indigo-50 font-bold rounded-xl text-xs shadow-md transition flex items-center gap-1.5">
              <span>🎫</span> Download Hall Ticket
            </button>
            <button onclick="window.print()" class="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs backdrop-blur-md border border-white/15 transition flex items-center gap-1.5">
              <span>🖨️</span> Print Grade Dossier
            </button>
          </div>
        </div>

        <!-- Attendance Shortage Banner or Safe Banner -->
        ${isShortage ? `
          <div class="bg-rose-50 border-2 border-rose-200 rounded-3xl p-6 text-rose-900 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-2xl bg-rose-200 text-rose-700 flex items-center justify-center text-2xl font-bold flex-shrink-0">
                ⚠️
              </div>
              <div>
                <h3 class="text-lg font-extrabold text-rose-900">Attendance Shortage Alert (${att}% < 75%)</h3>
                <p class="text-xs text-rose-700 mt-1">
                  You are currently <strong>ineligible</strong> to appear for the upcoming university end-semester examinations without official condonation.
                  You must attend at least <strong>${classesNeededToReach75} consecutive upcoming lectures</strong> to restore your attendance to 75%.
                </p>
              </div>
            </div>
            <button onclick="App.showToast('Please consult HOD Dr. Robert Chen with legitimate documentation for condonation approval.', 'warning')" class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold whitespace-nowrap shadow">
              Apply for Condonation
            </button>
          </div>
        ` : `
          <div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-900 flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <span class="text-xl">✅</span>
              <div>
                <span class="font-bold text-xs">Examination Clearance Active (${att}%):</span>
                <span class="text-xs text-emerald-800 ml-1">You satisfy the university mandatory 75% attendance threshold.</span>
              </div>
            </div>
            <span class="badge badge-success text-xs font-extrabold">Good Standing</span>
          </div>
        `}

        <!-- Snapshot Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm card-hover">
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Attendance</div>
            <div class="text-3xl font-extrabold ${isShortage ? 'text-rose-600' : 'text-emerald-600'} mt-1">${att}%</div>
            <div class="text-[11px] text-slate-500 mt-1">${student.attendance ? student.attendance.attendedClasses : 159} / ${student.attendance ? student.attendance.totalClasses : 184} Conducted</div>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm card-hover">
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Cumulative CGPA</div>
            <div class="text-3xl font-extrabold text-indigo-600 mt-1">${student.cgpa ? student.cgpa.toFixed(2) : '8.74'}</div>
            <div class="text-[11px] text-emerald-600 font-semibold mt-1">First Class with Distinction</div>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm card-hover">
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Credits</div>
            <div class="text-3xl font-extrabold text-slate-900 mt-1">132 / 160</div>
            <div class="text-[11px] text-slate-500 mt-1">82.5% Degree Progress</div>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm card-hover">
            <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Backlogs</div>
            <div class="text-3xl font-extrabold text-emerald-600 mt-1">0</div>
            <div class="text-[11px] text-emerald-600 font-semibold mt-1">Clear Academic Record</div>
          </div>
        </div>

        <!-- Subject Attendance Breakdown Table -->
        <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-bold text-slate-900">Course-wise Attendance Breakdown</h3>
              <p class="text-xs text-slate-500">Live lecture attendance stats for Spring 2026</p>
            </div>
            <span class="text-xs bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-lg">6 Courses</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse data-table">
              <thead>
                <tr>
                  <th>Course Code & Title</th>
                  <th>Faculty Instructor</th>
                  <th>Held</th>
                  <th>Attended</th>
                  <th>Absent</th>
                  <th>Percentage</th>
                  <th>Eligibility Status</th>
                </tr>
              </thead>
              <tbody>
                ${student.attendance && student.attendance.subjects ? Object.entries(student.attendance.subjects).map(([code, sub]) => {
                  const subShortage = sub.percentage < 75;
                  return `
                    <tr>
                      <td class="font-bold text-xs text-slate-900">${code}</td>
                      <td class="text-xs text-slate-600">${code === 'CS601' ? 'Dr. Sarah Jenkins' : (code === 'CS602' ? 'Prof. David Vance' : (code === 'CS603' ? 'Dr. Anita Roy' : 'Prof. Marcus Chen'))}</td>
                      <td class="text-xs font-mono">${sub.total}</td>
                      <td class="text-xs font-mono font-bold text-emerald-700">${sub.attended}</td>
                      <td class="text-xs font-mono font-bold text-rose-700">${sub.total - sub.attended}</td>
                      <td>
                        <div class="flex items-center gap-2">
                          <div class="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div class="h-full ${subShortage ? 'bg-rose-500' : 'bg-emerald-500'}" style="width: ${sub.percentage}%;"></div>
                          </div>
                          <span class="text-xs font-extrabold ${subShortage ? 'text-rose-600' : 'text-emerald-700'}">${sub.percentage}%</span>
                        </div>
                      </td>
                      <td>
                        <span class="badge ${subShortage ? 'badge-danger' : 'badge-success'}">
                          ${subShortage ? '⚠️ Shortage' : '✓ Permitted'}
                        </span>
                      </td>
                    </tr>
                  `;
                }).join('') : `
                  <tr><td colspan="7" class="text-center py-4 text-xs text-slate-400">No course attendance loaded.</td></tr>
                `}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Internal Continuous Assessment Scorecard -->
        <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-bold text-slate-900">Continuous Assessment Marks (Internal Scorecard)</h3>
              <p class="text-xs text-slate-500">Includes IA-1, IA-2, and lab/seminar assessment components</p>
            </div>
            <span class="text-xs bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-lg">Weightage: 40%</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse data-table">
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>IA-1 (25M)</th>
                  <th>IA-2 (25M)</th>
                  <th>Assignment / Lab (25M)</th>
                  <th>Total Score (75M)</th>
                  <th>Percentage</th>
                  <th>Letter Grade</th>
                </tr>
              </thead>
              <tbody>
                ${student.marks ? Object.entries(student.marks).map(([code, m]) => {
                  const pct = Math.round((m.total / m.maxTotal) * 100);
                  return `
                    <tr>
                      <td class="font-bold text-xs text-slate-900">${code}</td>
                      <td class="text-xs font-mono font-bold">${m.ia1} / 25</td>
                      <td class="text-xs font-mono font-bold">${m.ia2} / 25</td>
                      <td class="text-xs font-mono font-bold">${m.assignment || 18} / 25</td>
                      <td class="text-xs font-mono font-extrabold text-indigo-700">${m.total} / ${m.maxTotal}</td>
                      <td class="text-xs font-bold text-slate-700">${pct}%</td>
                      <td>
                        <span class="badge ${m.grade === 'O' || m.grade === 'A+' ? 'badge-success' : 'badge-indigo'}">
                          ${m.grade}
                        </span>
                      </td>
                    </tr>
                  `;
                }).join('') : `
                  <tr><td colspan="7" class="text-center py-4 text-xs text-slate-400">No marks records available.</td></tr>
                `}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Today's Schedule & Academic Timetable -->
        <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-slate-900">Today's Academic Timetable (Tuesday)</h3>
            <span class="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-medium">CSE Lab Block 3</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div class="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1">
              <span class="text-[10px] font-bold text-indigo-700 uppercase">09:00 - 10:00 AM</span>
              <h4 class="font-bold text-xs text-slate-900">CS602: Compiler Design</h4>
              <p class="text-[11px] text-slate-500">Prof. David Vance • Room 302</p>
            </div>
            <div class="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1">
              <span class="text-[10px] font-bold text-emerald-700 uppercase">10:00 - 11:00 AM</span>
              <h4 class="font-bold text-xs text-slate-900">CS601: Distributed Systems</h4>
              <p class="text-[11px] text-slate-500">Dr. Sarah Jenkins • Room 304</p>
            </div>
            <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span class="text-[10px] font-bold text-slate-400 uppercase">11:15 - 12:15 PM</span>
              <h4 class="font-bold text-xs text-slate-900">CS603: Artificial Intelligence</h4>
              <p class="text-[11px] text-slate-500">Dr. Anita Roy • AI Lab</p>
            </div>
            <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span class="text-[10px] font-bold text-slate-400 uppercase">01:30 - 03:30 PM</span>
              <h4 class="font-bold text-xs text-slate-900">CS606: Cloud Computing Lab</h4>
              <p class="text-[11px] text-slate-500">Prof. Rahul Verma • Cloud Lab</p>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  openHallTicketModal(studentId) {
    const s = Store.getStudents().find(item => item.id === studentId) || Store.getStudents()[0];
    const att = s.attendance ? s.attendance.overall : 86.4;

    const html = `
      <div class="p-4 border-2 border-slate-800 rounded-2xl space-y-4 bg-white text-slate-900 font-sans print-only">
        <div class="text-center border-b pb-3 border-slate-300">
          <h2 class="text-lg font-black uppercase tracking-wider">VEL TECH UNIVERSITY</h2>
          <p class="text-xs font-semibold text-slate-600">OFFICE OF THE CONTROLLER OF EXAMINATIONS</p>
          <p class="text-[11px] font-bold uppercase mt-1 px-3 py-1 bg-slate-100 inline-block rounded">MID-SEMESTER EXAMINATION ADMIT CARD (HALL TICKET)</p>
        </div>

        <div class="flex items-start justify-between text-xs">
          <div class="space-y-1">
            <div><strong>Student Name:</strong> ${this.escapeHtml(s.name)}</div>
            <div><strong>Roll Number:</strong> <span class="font-mono font-bold">${s.rollNo}</span></div>
            <div><strong>Register Number:</strong> ${s.regNo || '23CSE01042'}</div>
            <div><strong>Program:</strong> B.Tech - Computer Science & Engineering</div>
            <div><strong>Semester:</strong> 6th Semester (Sec ${s.section})</div>
          </div>
          <div class="text-right">
            <img src="${s.avatar}" class="w-16 h-16 rounded object-cover border border-slate-400 ml-auto">
            <span class="text-[10px] text-slate-500 block mt-1">Verified Photo ID</span>
          </div>
        </div>

        <table class="w-full text-left text-xs border border-slate-300">
          <thead class="bg-slate-100">
            <tr>
              <th class="p-2 border">Sub Code</th>
              <th class="p-2 border">Course Title</th>
              <th class="p-2 border">Exam Date</th>
              <th class="p-2 border">Session</th>
              <th class="p-2 border">Invigilator Sign</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="p-2 border font-mono">CS601</td>
              <td class="p-2 border">Distributed Systems</td>
              <td class="p-2 border">03-Nov-2026</td>
              <td class="p-2 border">10:00 - 12:00</td>
              <td class="p-2 border"></td>
            </tr>
            <tr>
              <td class="p-2 border font-mono">CS602</td>
              <td class="p-2 border">Compiler Design</td>
              <td class="p-2 border">05-Nov-2026</td>
              <td class="p-2 border">10:00 - 12:00</td>
              <td class="p-2 border"></td>
            </tr>
            <tr>
              <td class="p-2 border font-mono">CS603</td>
              <td class="p-2 border">Artificial Intelligence & ML</td>
              <td class="p-2 border">07-Nov-2026</td>
              <td class="p-2 border">10:00 - 12:00</td>
              <td class="p-2 border"></td>
            </tr>
            <tr>
              <td class="p-2 border font-mono">CS604</td>
              <td class="p-2 border">Computer Networks</td>
              <td class="p-2 border">09-Nov-2026</td>
              <td class="p-2 border">10:00 - 12:00</td>
              <td class="p-2 border"></td>
            </tr>
          </tbody>
        </table>

        <div class="pt-6 flex justify-between items-end text-xs">
          <div>
            <div class="text-[11px] text-slate-500">Attendance Status: <strong>${att}% (${att >= 75 ? 'ELIGIBLE' : 'CONDONED'})</strong></div>
            <div class="text-[10px] text-slate-400">Barcode: *${s.rollNo}*</div>
          </div>
          <div class="text-center">
            <div class="w-32 border-b border-slate-700 pb-1 font-signature text-xs italic font-bold">R. Chen, Ph.D.</div>
            <span class="text-[10px] font-bold text-slate-600 uppercase">Controller of Examinations</span>
          </div>
        </div>
      </div>
    `;

    const footer = `
      <button onclick="window.print()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold">Print Admit Card</button>
      <button onclick="App.closeModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold">Close</button>
    `;
    this.openModal('Examination Hall Ticket', html, footer);
  },

  /* =========================================================================
     9. NOTICES AND ANNOUNCEMENTS PAGE
     ========================================================================= */
  renderNotices(container) {
    const notices = Store.getNotices();
    const currentUser = Store.getCurrentUser();
    const canPostNotice = currentUser && (currentUser.role === 'administrator' || currentUser.role === 'faculty');

    container.innerHTML = `
      <div class="animate-fade-in space-y-6 pb-16">
        <!-- Header -->
        <div class="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-1 rounded-full w-fit">
              <span>📢</span> Department Digital Circulars
            </div>
            <h1 class="text-2xl font-extrabold text-slate-900 mt-2">Notices & Department Announcements</h1>
            <p class="text-xs text-slate-500">Official circulars, exam schedules, campus recruitment alerts, and academic deadlines.</p>
          </div>

          <div class="flex items-center gap-2">
            ${canPostNotice ? `
              <button onclick="App.openAddNoticeModal()" class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-2">
                <span>+</span> Post Announcement
              </button>
            ` : `
              <span class="text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border">Posting restricted to Faculty & Admin</span>
            `}
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-3 items-center justify-between">
          <div class="relative w-full sm:w-80">
            <input type="text" id="notice-search-input" onkeyup="App.filterNoticeList()" placeholder="Search notices by keyword..." class="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <span class="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <select id="notice-category-filter" onchange="App.filterNoticeList()" class="text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="ALL">All Categories</option>
              <option value="Examinations">Examinations</option>
              <option value="Academic">Academic</option>
              <option value="Placements">Placements</option>
              <option value="Events">Events</option>
            </select>

            <select id="notice-target-filter" onchange="App.filterNoticeList()" class="text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="ALL">Target: Everyone</option>
              <option value="Students">For Students</option>
              <option value="Faculty">For Faculty</option>
            </select>
          </div>
        </div>

        <!-- Notices Grid -->
        <div id="notices-container" class="space-y-4">
          ${this.renderNoticesListHtml(notices)}
        </div>
      </div>
    `;
  },

  renderNoticesListHtml(noticesList) {
    if (noticesList.length === 0) {
      return `
        <div class="bg-white p-12 text-center rounded-3xl border border-slate-200 text-slate-400 text-sm">
          No notices found matching the selected criteria.
        </div>
      `;
    }

    const currentUser = Store.getCurrentUser();
    const canDelete = currentUser && (currentUser.role === 'administrator' || currentUser.role === 'faculty');

    return noticesList.map(n => `
      <div class="bg-white rounded-3xl p-6 border ${n.priority === 'Urgent' ? 'border-rose-200 shadow-rose-100/50' : 'border-slate-200/80'} shadow-sm card-hover space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${n.category === 'Examinations' ? 'bg-rose-100 text-rose-800' : (n.category === 'Placements' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800')}">
              ${n.category}
            </span>
            ${n.priority === 'Urgent' ? `
              <span class="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-rose-600 text-white pulse-urgent">
                Urgent Priority
              </span>
            ` : ''}
            <span class="text-xs text-slate-400">• Audience: <strong>${n.target}</strong></span>
          </div>

          <div class="flex items-center gap-3 text-xs text-slate-400">
            <span>📅 ${n.date}</span>
            ${canDelete ? `
              <button onclick="App.handleDeleteNotice('${n.id}')" class="text-rose-500 hover:text-rose-700 font-bold ml-2">
                ✕ Delete
              </button>
            ` : ''}
          </div>
        </div>

        <div>
          <h3 class="text-lg font-bold text-slate-900">${n.title}</h3>
          <p class="text-xs text-slate-600 mt-2 leading-relaxed">${n.content || n.summary}</p>
        </div>

        <div class="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div class="text-slate-500 font-medium">
            Published by: <strong class="text-slate-700">${n.author}</strong>
          </div>

          ${n.attachment ? `
            <button onclick="App.downloadSimulatedAttachment('${n.attachment}')" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 transition">
              <span>📄</span> ${n.attachment}
            </button>
          ` : ''}
        </div>
      </div>
    `).join('');
  },

  filterNoticeList() {
    const search = document.getElementById('notice-search-input').value.toLowerCase().trim();
    const cat = document.getElementById('notice-category-filter').value;
    const target = document.getElementById('notice-target-filter').value;
    const all = Store.getNotices();

    const filtered = all.filter(n => {
      const matchSearch = n.title.toLowerCase().includes(search) || (n.content && n.content.toLowerCase().includes(search));
      let matchCat = true;
      if (cat !== 'ALL') matchCat = n.category === cat;
      let matchTarget = true;
      if (target !== 'ALL') matchTarget = n.target === 'All' || n.target === target;
      return matchSearch && matchCat && matchTarget;
    });

    const container = document.getElementById('notices-container');
    if (container) {
      container.innerHTML = this.renderNoticesListHtml(filtered);
    }
  },

  openAddNoticeModal() {
    const html = `
      <form id="form-add-notice" onsubmit="App.handleAddNoticeSubmit(event)" class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Notice Title / Subject</label>
          <input type="text" id="mnot-title" required placeholder="e.g. Schedule for Lab Practical Examinations" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300">
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Category</label>
            <select id="mnot-cat" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300">
              <option value="Academic">Academic</option>
              <option value="Examinations">Examinations</option>
              <option value="Placements">Placements</option>
              <option value="Events">Events</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Priority</label>
            <select id="mnot-priority" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300">
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Target Audience</label>
            <select id="mnot-target" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300">
              <option value="All" selected>Everyone (All)</option>
              <option value="Students">Students Only</option>
              <option value="Faculty">Faculty Only</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Announcement Body / Content</label>
          <textarea id="mnot-content" rows="4" required placeholder="Enter full detailed circular text..." class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"></textarea>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Attachment File Name (Optional)</label>
          <input type="text" id="mnot-file" value="Notice_Circular_2026.pdf" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300">
        </div>

        <div class="pt-4 flex justify-end gap-2 border-t border-slate-100">
          <button type="button" onclick="App.closeModal()" class="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl">Cancel</button>
          <button type="submit" class="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow">Publish Circular</button>
        </div>
      </form>
    `;
    this.openModal('Broadcast New Department Announcement', html);
  },

  handleAddNoticeSubmit(e) {
    e.preventDefault();
    const currentUser = Store.getCurrentUser();
    const authorName = currentUser ? currentUser.name : 'Department Office';

    Store.addNotice({
      title: document.getElementById('mnot-title').value,
      category: document.getElementById('mnot-cat').value,
      priority: document.getElementById('mnot-priority').value,
      target: document.getElementById('mnot-target').value,
      content: document.getElementById('mnot-content').value,
      summary: document.getElementById('mnot-content').value.slice(0, 140) + '...',
      attachment: document.getElementById('mnot-file').value || 'Circular_Document.pdf',
      author: authorName
    });

    this.closeModal();
    this.showToast('Announcement published successfully!', 'success');
    this.navigateTo('notices');
  },

  handleDeleteNotice(id) {
    if (confirm('Delete this announcement?')) {
      Store.deleteNotice(id);
      this.showToast('Announcement removed.', 'info');
      this.navigateTo('notices');
    }
  },

  downloadSimulatedAttachment(filename) {
    const content = `DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING\nVEL TECH UNIVERSITY\n\nOFFICIAL CIRCULAR ATTACHMENT: ${filename}\nDate of Issue: ${new Date().toLocaleDateString()}\nStatus: Verified Document\n\nThis is an official departmental document archive.`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename.replace('.pdf', '.txt'));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast(`Downloaded document: ${filename}`, 'info');
  }
};

// Initialize App on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
