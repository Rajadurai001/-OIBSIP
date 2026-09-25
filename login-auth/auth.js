/* ══════════════════════════════════════════════
   AUTH SYSTEM — Core Authentication Logic
   ══════════════════════════════════════════════ */

const Auth = (() => {
  'use strict';

  const USERS_KEY   = 'authsys_users';
  const SESSION_KEY = 'authsys_session';

  // ── SVG icons ─────────────────────────────
  const ICON_EYE_ON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  const ICON_EYE_OFF = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

  // ══════════════════════════════════════════
  // CRYPTO — SHA-256 hashing via Web Crypto API
  // ══════════════════════════════════════════
  async function hashPassword(password, salt) {
    const data = new TextEncoder().encode(salt + password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function generateSalt() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ══════════════════════════════════════════
  // STORAGE
  // ══════════════════════════════════════════
  function getUsers() {
    try {
      const data = localStorage.getItem(USERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function getSession() {
    try {
      const data = sessionStorage.getItem(SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  }

  function setSession(session) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  // ══════════════════════════════════════════
  // VALIDATION
  // ══════════════════════════════════════════
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validatePassword(pw) {
    const errors = [];
    if (pw.length < 8) errors.push('At least 8 characters required');
    if (!/\d/.test(pw)) errors.push('Must contain at least 1 number');
    return errors;
  }

  function getPasswordStrength(pw) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/\d/.test(pw)) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    // Map to 0-4
    if (score <= 1) return { level: 0, label: 'Weak' };
    if (score === 2) return { level: 1, label: 'Fair' };
    if (score === 3) return { level: 2, label: 'Good' };
    return { level: 3, label: 'Strong' };
  }

  // ══════════════════════════════════════════
  // REGISTER
  // ══════════════════════════════════════════
  async function register(email, password) {
    email = email.trim().toLowerCase();

    if (!email) return { ok: false, msg: 'Please enter your email address.' };
    if (!validateEmail(email)) return { ok: false, msg: 'Please enter a valid email address.' };

    const pwErrors = validatePassword(password);
    if (pwErrors.length) return { ok: false, msg: pwErrors.join('. ') + '.' };

    const users = getUsers();
    if (users.find(u => u.email === email)) {
      return { ok: false, msg: 'An account with this email already exists.' };
    }

    const salt = generateSalt();
    const hash = await hashPassword(password, salt);

    users.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      email,
      salt,
      hash,
      createdAt: new Date().toISOString(),
    });

    saveUsers(users);
    return { ok: true, msg: 'Account created successfully! You can now log in.' };
  }

  // ══════════════════════════════════════════
  // LOGIN
  // ══════════════════════════════════════════
  async function login(email, password) {
    email = email.trim().toLowerCase();

    if (!email || !password) {
      return { ok: false, msg: 'Please enter both email and password.' };
    }

    const users = getUsers();
    const user = users.find(u => u.email === email);

    // Deliberately vague error — don't reveal which field is wrong
    const genericError = 'Invalid email or password. Please try again.';

    if (!user) return { ok: false, msg: genericError };

    const hash = await hashPassword(password, user.salt);
    if (hash !== user.hash) return { ok: false, msg: genericError };

    setSession({
      userId: user.id,
      email: user.email,
      loginAt: new Date().toISOString(),
    });

    return { ok: true };
  }

  // ══════════════════════════════════════════
  // SESSION
  // ══════════════════════════════════════════
  function isLoggedIn() {
    return getSession() !== null;
  }

  function requireAuth() {
    if (!isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  function requireGuest() {
    if (isLoggedIn()) {
      window.location.href = 'dashboard.html';
      return false;
    }
    return true;
  }

  function logout() {
    clearSession();
    window.location.href = 'login.html';
  }

  function getCurrentUser() {
    const session = getSession();
    if (!session) return null;
    const users = getUsers();
    const user = users.find(u => u.id === session.userId);
    return user ? { ...user, loginAt: session.loginAt } : null;
  }

  // ══════════════════════════════════════════
  // UI HELPERS
  // ══════════════════════════════════════════

  /** Setup password visibility toggle */
  function setupPasswordToggle(inputId, toggleId) {
    const input = document.getElementById(inputId);
    const toggle = document.getElementById(toggleId);
    if (!input || !toggle) return;

    toggle.innerHTML = ICON_EYE_OFF;
    let visible = false;

    toggle.addEventListener('click', () => {
      visible = !visible;
      input.type = visible ? 'text' : 'password';
      toggle.innerHTML = visible ? ICON_EYE_ON : ICON_EYE_OFF;
      toggle.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
    });
  }

  /** Setup password strength meter */
  function setupStrengthMeter(inputId, meterId) {
    const input = document.getElementById(inputId);
    const meter = document.getElementById(meterId);
    if (!input || !meter) return;

    const bars = meter.querySelectorAll('.pw-strength__bar');
    const classes = ['active-weak', 'active-fair', 'active-good', 'active-strong'];

    input.addEventListener('input', () => {
      const { level } = getPasswordStrength(input.value);
      bars.forEach((bar, i) => {
        bar.className = 'pw-strength__bar';
        if (i <= level && input.value.length > 0) {
          bar.classList.add(classes[level]);
        }
      });
    });
  }

  /** Show / hide alert */
  function showAlert(id, msg, type = 'error') {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = `alert alert--${type}`;
    el.innerHTML = `<span class="alert__icon" aria-hidden="true">${type === 'error' ? '⚠️' : '✅'}</span><span>${msg}</span>`;
    el.hidden = false;
  }

  function hideAlert(id) {
    const el = document.getElementById(id);
    if (el) el.hidden = true;
  }

  /** Field validation visual feedback */
  function setFieldState(inputId, state, hintId, hintMsg) {
    const input = document.getElementById(inputId);
    const hint = hintId ? document.getElementById(hintId) : null;
    if (input) {
      input.classList.remove('is-invalid', 'is-valid');
      if (state === 'error') input.classList.add('is-invalid');
      if (state === 'success') input.classList.add('is-valid');
    }
    if (hint) {
      hint.className = 'field__hint';
      hint.textContent = hintMsg || '';
      if (state === 'error') hint.classList.add('is-error');
      if (state === 'success') hint.classList.add('is-success');
    }
  }

  // ── Public API ─────────────────────────────
  return {
    register,
    login,
    logout,
    isLoggedIn,
    requireAuth,
    requireGuest,
    getCurrentUser,
    validateEmail,
    validatePassword,
    getPasswordStrength,
    setupPasswordToggle,
    setupStrengthMeter,
    showAlert,
    hideAlert,
    setFieldState,
  };
})();
