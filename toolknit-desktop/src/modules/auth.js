/**
 * Authentication module — login, register, session management, API key settings.
 * Migrated from main.js (lines ~4436-5520).
 */
import { AUTH_API_BASE } from '../config.js';
import { AVATAR_MAX_SIZE_BYTES, ALLOWED_AVATAR_TYPES } from '../constants.js';
import { escapeHtml } from '../utils/dom.js';

// ===== Auth Overlay =====
let authOverlay, authCircle, authClose, loginForm, registerForm;
let switchToRegister, switchToLogin, authHeroTitle, authHeroSubtitle;
let loginError, registerError, loginSubmit, registerSubmit;
let registerNext, registerBack, registerStep1, registerStep2;
let registerAvatarZone, registerAvatarFile, registerAvatarPreview, registerError2, registerSpider2;
let registerAvatarData = null;
let authLoadingOverlay, authLoadingCircle;
let loginSpider, registerSpider;
let isAuthSwitching = false;

// Logout elements
let btnLogout, logoutConfirmOverlay, logoutCancelBtn, logoutConfirmBtn;

// API Key elements
let btnApiKey, apiKeyOverlay, apiKeyBack, apiKeyInput, apiKeyToggle, apiKeySave, apiKeyClear;
let apiKeyStatus, apiKeyDropdown, apiKeyDropdownTrigger, apiKeyDropdownMenu, apiKeyDropdownValue;
let apiKeyPlatformValue = 'deepseek';
let apiKeyCustomWrap, apiKeyCustomUrl, apiKeyCustomModel;

// AI Login elements
let aiLoginOverlay, aiLoginCancel, aiLoginGoSettings;

const AI_PLATFORMS = {
  deepseek: { url: 'https://api.deepseek.com/v1/chat/completions', model: 'deepseek-chat', label: 'DeepSeek' },
  openai: { url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini', label: 'OpenAI' },
  qwen: { url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', model: 'qwen-plus', label: 'Qwen' },
  moonshot: { url: 'https://api.moonshot.cn/v1/chat/completions', model: 'moonshot-v1-8k', label: 'Moonshot' },
  custom: { url: '', model: '' },
};

const SERVER_ERROR_MAP = {
  'Email already registered': 'auth.errEmailExists',
  'Invalid email or password': 'auth.errInvalidCredentials',
  'Account banned': 'auth.errAccountBanned',
  'Server error': 'auth.errServer',
  'Not found': 'auth.errNotFound',
  'Daily usage limit reached': 'auth.errDailyLimit',
  'Invalid email format': 'auth.errInvalidEmail',
  'Password must be 6-64 characters': 'auth.errPasswordMax',
  'Username must be 1-64 characters': 'auth.errUsernameRequired',
  'No fields to update': 'auth.errUnknown',
  'Old password incorrect': 'auth.errInvalidCredentials',
  'Password changed successfully': null,
};

// Need to import i18n t function at runtime (avoid circular dep)
function t(key) {
  if (typeof window.__i18n_t === 'function') return window.__i18n_t(key);
  return key;
}

function translateServerError(msg) {
  if (!msg) return t('auth.errUnknown');
  const key = SERVER_ERROR_MAP[msg];
  if (key === null) return msg;
  if (key) return t(key);
  return msg;
}

export function authHeaders(extra = {}) {
  const token = localStorage.getItem('toolknit_token');
  const headers = { 'Content-Type': 'application/json', ...extra };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export function updatePersonalPanel(user) {
  if (!user) return;
  const panel = document.getElementById('personalPanel');
  if (!panel) return;
  panel.classList.add('logged-in');
  const nameEl = panel.querySelector('.logged-in-view .info-name');
  const metaEls = panel.querySelectorAll('.logged-in-view .info-meta');
  const avatarImg = panel.querySelector('.logged-in-view .avatar img');
  if (nameEl) nameEl.textContent = user.username || user.email || 'User';
  if (metaEls[0]) metaEls[0].textContent = user.email || '';
  if (metaEls[1]) metaEls[1].textContent = `ID: ${user.id || ''}`;
  if (avatarImg) {
    const avatarParent = avatarImg.parentElement;
    if (user.avatar) {
      avatarImg.onerror = function () {
        this.style.display = 'none';
        if (avatarParent) avatarParent.classList.add('avatar-fallback');
      };
      avatarImg.onload = function () {
        this.style.display = '';
        if (avatarParent) avatarParent.classList.remove('avatar-fallback');
      };
      avatarImg.src = user.avatar;
    } else {
      avatarImg.style.display = 'none';
      if (avatarParent) avatarParent.classList.add('avatar-fallback');
    }
  }
}

function hideAutoLoginMask() {
  const mask = document.getElementById('autoLoginMask');
  if (!mask) return;
  mask.classList.remove('active');
  mask.classList.add('fade-out');
  setTimeout(() => { mask.classList.remove('fade-out'); }, 400);
}

export async function restoreSession() {
  const token = localStorage.getItem('toolknit_token');
  if (!token) return;

  const mask = document.getElementById('autoLoginMask');
  if (mask) mask.classList.add('active');

  let maskHidden = false;
  function hideMaskOnce() {
    if (maskHidden) return;
    maskHidden = true;
    hideAutoLoginMask();
  }

  const timeoutId = setTimeout(hideMaskOnce, 8000);

  try {
    const res = await fetch(`${AUTH_API_BASE}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    clearTimeout(timeoutId);
    if (data.code === 0 && data.data && data.data.user) {
      localStorage.setItem('toolknit_user', JSON.stringify(data.data.user));
      try {
        updatePersonalPanel(data.data.user);
        if (typeof window.renderFavorites === 'function') window.renderFavorites();
      } catch (uiErr) {
        console.error('[restoreSession] UI update error:', uiErr);
      }
      requestAnimationFrame(() => { requestAnimationFrame(() => { hideMaskOnce(); }); });
    } else {
      console.warn('[restoreSession] Auth failed, clearing token:', data.msg);
      localStorage.removeItem('toolknit_token');
      localStorage.removeItem('toolknit_user');
      hideMaskOnce();
    }
  } catch (e) {
    clearTimeout(timeoutId);
    console.error('[restoreSession] Network error:', e);
    hideMaskOnce();
  }
}

export function logout() {
  localStorage.removeItem('toolknit_token');
  localStorage.removeItem('toolknit_user');
  const panel = document.getElementById('personalPanel');
  if (panel) panel.classList.remove('logged-in');
  if (typeof window.renderFavorites === 'function') window.renderFavorites();
}

export function isLoggedIn() {
  return !!localStorage.getItem('toolknit_token');
}

function showAuthLoading(originX, originY) {
  const dx = Math.max(originX, window.innerWidth - originX);
  const dy = Math.max(originY, window.innerHeight - originY);
  const radius = Math.sqrt(dx * dx + dy * dy);
  const diameter = radius * 2;
  authLoadingCircle.style.width = diameter + 'px';
  authLoadingCircle.style.height = diameter + 'px';
  authLoadingCircle.style.left = (originX - radius) + 'px';
  authLoadingCircle.style.top = (originY - radius) + 'px';
  authLoadingOverlay.classList.remove('closing');
  authLoadingOverlay.classList.remove('active');
  authLoadingCircle.style.transform = 'scale(0)';
  void authLoadingCircle.offsetWidth;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      authLoadingCircle.style.transform = '';
      authLoadingOverlay.classList.add('active');
    });
  });
}

function hideAuthLoading() {
  authLoadingOverlay.classList.remove('active');
  authLoadingOverlay.classList.add('closing');
  setTimeout(() => { authLoadingOverlay.classList.remove('closing'); }, 600);
}

function showSpider(spiderEl) {
  spiderEl.classList.remove('exit');
  spiderEl.classList.add('show');
}

function hideSpider(spiderEl) {
  spiderEl.classList.remove('show');
  spiderEl.classList.add('exit');
}

function showSpiderAfterDelay(spiderEl, delay) {
  setTimeout(() => { showSpider(spiderEl); }, delay);
}

export function openAuthOverlay(originX, originY) {
  const dx = Math.max(originX, window.innerWidth - originX);
  const dy = Math.max(originY, window.innerHeight - originY);
  const radius = Math.sqrt(dx * dx + dy * dy);
  const diameter = radius * 2;
  authCircle.style.width = diameter + 'px';
  authCircle.style.height = diameter + 'px';
  authCircle.style.left = (originX - radius) + 'px';
  authCircle.style.top = (originY - radius) + 'px';
  authCircle.style.transform = '';
  authOverlay.classList.remove('closing');
  authOverlay.classList.remove('active');
  authOverlay.classList.add('initial-open');
  requestAnimationFrame(() => { requestAnimationFrame(() => { authOverlay.classList.add('active'); }); });
  setTimeout(() => { authOverlay.classList.remove('initial-open'); }, 2500);
  showSpiderAfterDelay(loginSpider, 1500);
}

function closeAuthOverlay() {
  authOverlay.classList.remove('active');
  hideSpider(loginSpider);
  hideSpider(registerSpider);
  authOverlay.classList.add('closing');
  setTimeout(() => {
    authOverlay.classList.remove('closing');
    registerForm.classList.remove('visible', 'exiting');
    loginForm.classList.remove('exiting');
    loginForm.classList.add('visible');
    loginSpider.classList.remove('show', 'exit');
    registerSpider.classList.remove('show', 'exit');
    if (registerSpider2) registerSpider2.classList.remove('show', 'exit');
    const heroEl = document.querySelector('.auth-hero');
    heroEl.classList.remove('hero-exit', 'hero-enter');
    loginError.classList.remove('show');
    registerError.classList.remove('show');
    if (registerError2) registerError2.classList.remove('show');
    loginError.textContent = '';
    registerError.textContent = '';
    if (registerError2) registerError2.textContent = '';
    authHeroTitle.textContent = t('auth.loginTitle');
    authHeroSubtitle.textContent = t('auth.loginSubtitle');
    if (registerStep1) registerStep1.style.display = '';
    if (registerStep2) registerStep2.style.display = 'none';
    registerAvatarData = null;
    if (registerAvatarPreview) registerAvatarPreview.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:48px;height:48px;color:#bbb;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
    if (registerAvatarFile) registerAvatarFile.value = '';
  }, 800);
}

function switchForm(fromEl, toEl, titleText, subtitleText, fromSpider, toSpider) {
  if (isAuthSwitching) return;
  isAuthSwitching = true;
  hideSpider(fromSpider);
  const heroEl = document.querySelector('.auth-hero');
  heroEl.classList.add('hero-exit');
  fromEl.classList.remove('visible');
  fromEl.classList.add('exiting');
  setTimeout(() => {
    fromEl.classList.remove('exiting');
    fromSpider.classList.remove('exit');
    authHeroTitle.textContent = titleText;
    authHeroSubtitle.textContent = subtitleText;
    heroEl.classList.remove('hero-exit');
    heroEl.classList.add('hero-enter');
    requestAnimationFrame(() => { requestAnimationFrame(() => { heroEl.classList.remove('hero-enter'); }); });
    toEl.classList.add('visible');
    showSpiderAfterDelay(toSpider, 1100);
    setTimeout(() => { isAuthSwitching = false; }, 2300);
  }, 1200);
}

function showLoginForm() {
  switchForm(registerForm, loginForm, t('auth.loginTitle'), t('auth.loginSubtitle'), registerSpider, loginSpider);
  loginError.classList.remove('show');
}

function showRegisterForm() {
  switchForm(loginForm, registerForm, t('auth.registerTitle'), t('auth.registerSubtitle'), loginSpider, registerSpider);
  registerError.classList.remove('show');
  if (registerError2) registerError2.classList.remove('show');
  if (registerStep1) registerStep1.style.display = '';
  if (registerStep2) registerStep2.style.display = 'none';
  registerAvatarData = null;
  if (registerSubmit) registerSubmit.classList.add('disabled-avatar');
  if (registerAvatarPreview) registerAvatarPreview.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:48px;height:48px;color:#bbb;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
}

function showAuthError(el, msg) {
  el.textContent = msg;
  el.classList.add('show');
}

function showLogoutConfirm() {
  if (logoutConfirmOverlay) logoutConfirmOverlay.classList.add('visible');
}
function hideLogoutConfirm() {
  if (logoutConfirmOverlay) logoutConfirmOverlay.classList.remove('visible');
}

export function openToolWithAiCheck(openFn) {
  if (!isLoggedIn() || !hasAiApiKey()) {
    showAiLoginOverlay();
    return;
  }
  openFn();
}

function showAiLoginOverlay() {
  if (aiLoginOverlay) aiLoginOverlay.classList.add('visible');
}
function hideAiLoginOverlay() {
  if (aiLoginOverlay) aiLoginOverlay.classList.remove('visible');
}

export function hasAiApiKey() {
  return !!localStorage.getItem('ai_api_key');
}

export function getAiPlatformConfig() {
  const platform = localStorage.getItem('ai_platform') || 'deepseek';
  const base = AI_PLATFORMS[platform] || AI_PLATFORMS.deepseek;
  if (platform === 'custom') {
    return {
      url: localStorage.getItem('ai_custom_url') || '',
      model: localStorage.getItem('ai_custom_model') || '',
    };
  }
  return { url: base.url, model: base.model };
}

function setApiKeyPlatform(value) {
  apiKeyPlatformValue = value;
  const items = apiKeyDropdownMenu.querySelectorAll('.api-key-dropdown-item');
  items.forEach(item => {
    item.classList.toggle('active', item.dataset.value === value);
    if (item.dataset.value === value) {
      apiKeyDropdownValue.textContent = item.textContent;
    }
  });
  if (value === 'custom') {
    if (apiKeyCustomWrap) apiKeyCustomWrap.style.display = '';
  } else {
    if (apiKeyCustomWrap) apiKeyCustomWrap.style.display = 'none';
  }
}

export function init() {
  authOverlay = document.getElementById('authOverlay');
  authCircle = document.getElementById('authCircle');
  authClose = document.getElementById('authClose');
  loginForm = document.getElementById('loginForm');
  registerForm = document.getElementById('registerForm');
  switchToRegister = document.getElementById('switchToRegister');
  switchToLogin = document.getElementById('switchToLogin');
  authHeroTitle = document.getElementById('authHeroTitle');
  authHeroSubtitle = document.getElementById('authHeroSubtitle');
  loginError = document.getElementById('loginError');
  registerError = document.getElementById('registerError');
  loginSubmit = document.getElementById('loginSubmit');
  registerSubmit = document.getElementById('registerSubmit');
  registerNext = document.getElementById('registerNext');
  registerBack = document.getElementById('registerBack');
  registerStep1 = document.getElementById('registerStep1');
  registerStep2 = document.getElementById('registerStep2');
  registerAvatarZone = document.getElementById('registerAvatarZone');
  registerAvatarFile = document.getElementById('registerAvatarFile');
  registerAvatarPreview = document.getElementById('registerAvatarPreview');
  registerError2 = document.getElementById('registerError2');
  registerSpider2 = document.getElementById('registerSpider2');
  authLoadingOverlay = document.getElementById('authLoadingOverlay');
  authLoadingCircle = document.getElementById('authLoadingCircle');
  loginSpider = document.getElementById('loginSpider');
  registerSpider = document.getElementById('registerSpider');
  btnLogout = document.getElementById('btnLogout');
  logoutConfirmOverlay = document.getElementById('logoutConfirmOverlay');
  logoutCancelBtn = document.getElementById('logoutCancelBtn');
  logoutConfirmBtn = document.getElementById('logoutConfirmBtn');
  btnApiKey = document.getElementById('btnApiKey');
  apiKeyOverlay = document.getElementById('apiKeyOverlay');
  apiKeyBack = document.getElementById('apiKeyBack');
  apiKeyInput = document.getElementById('apiKeyInput');
  apiKeyToggle = document.getElementById('apiKeyToggle');
  apiKeySave = document.getElementById('apiKeySave');
  apiKeyClear = document.getElementById('apiKeyClear');
  apiKeyStatus = document.getElementById('apiKeyStatus');
  apiKeyDropdown = document.getElementById('apiKeyDropdown');
  apiKeyDropdownTrigger = document.getElementById('apiKeyDropdownTrigger');
  apiKeyDropdownMenu = document.getElementById('apiKeyDropdownMenu');
  apiKeyDropdownValue = document.getElementById('apiKeyDropdownValue');
  apiKeyCustomWrap = document.getElementById('apiKeyCustomWrap');
  apiKeyCustomUrl = document.getElementById('apiKeyCustomUrl');
  apiKeyCustomModel = document.getElementById('apiKeyCustomModel');
  aiLoginOverlay = document.getElementById('aiLoginOverlay');
  aiLoginCancel = document.getElementById('aiLoginCancel');
  aiLoginGoSettings = document.getElementById('aiLoginGoSettings');

  restoreSession();

  if (authClose) authClose.addEventListener('click', closeAuthOverlay);
  if (switchToRegister) switchToRegister.addEventListener('click', (e) => { e.preventDefault(); showRegisterForm(); });
  if (switchToLogin) switchToLogin.addEventListener('click', (e) => { e.preventDefault(); showLoginForm(); });

  const loginPassword = document.getElementById('loginPassword');
  if (loginPassword) loginPassword.addEventListener('keydown', (e) => { if (e.key === 'Enter') loginSubmit.click(); });
  const registerPassword = document.getElementById('registerPassword');
  if (registerPassword) registerPassword.addEventListener('keydown', (e) => { if (e.key === 'Enter') registerNext.click(); });

  const personalPanel = document.getElementById('personalPanel');
  const loginBtn = personalPanel ? personalPanel.querySelector('.login-btn') : null;
  if (loginBtn) {
    loginBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const rect = loginBtn.getBoundingClientRect();
      openAuthOverlay(rect.left + rect.width / 2, rect.top + rect.height / 2);
    });
  }

  if (btnLogout) btnLogout.addEventListener('click', (e) => { e.stopPropagation(); showLogoutConfirm(); });
  if (logoutCancelBtn) logoutCancelBtn.addEventListener('click', hideLogoutConfirm);
  if (logoutConfirmBtn) logoutConfirmBtn.addEventListener('click', () => { hideLogoutConfirm(); logout(); });
  if (logoutConfirmOverlay) logoutConfirmOverlay.addEventListener('click', (e) => { if (e.target === logoutConfirmOverlay) hideLogoutConfirm(); });

  if (loginSubmit) {
    loginSubmit.addEventListener('click', async () => {
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      if (!email || !password) { showAuthError(loginError, t('auth.errFillEmailPassword')); return; }
      loginSubmit.disabled = true;
      const btnRect = loginSubmit.getBoundingClientRect();
      showAuthLoading(btnRect.left + btnRect.width / 2, btnRect.top + btnRect.height / 2);
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const res = await fetch(`${AUTH_API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const data = await res.json();
        if (data.code === 0 && data.data) {
          localStorage.setItem('toolknit_token', data.data.token);
          localStorage.setItem('toolknit_user', JSON.stringify(data.data.user));
          updatePersonalPanel(data.data.user);
          closeAuthOverlay();
        } else {
          showAuthError(loginError, translateServerError(data.msg) || t('auth.errLoginFailed'));
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          showAuthError(loginError, t('auth.errTimeout'));
        } else {
          showAuthError(loginError, t('auth.errNetwork'));
        }
      } finally {
        hideAuthLoading();
        loginSubmit.disabled = false;
        loginSubmit.textContent = t('auth.loginBtn');
      }
    });
  }

  if (registerNext) {
    registerNext.addEventListener('click', () => {
      const username = document.getElementById('registerUsername').value.trim();
      const email = document.getElementById('registerEmail').value.trim();
      const password = document.getElementById('registerPassword').value;
      if (!username || !email || !password) { showAuthError(registerError, t('auth.errFillAll')); return; }
      if (password.length < 6) { showAuthError(registerError, t('auth.errPasswordShort')); return; }
      registerError.classList.remove('show');
      registerStep1.style.display = 'none';
      registerStep2.style.display = '';
      registerSubmit.classList.add('disabled-avatar');
    });
  }

  if (registerBack) {
    registerBack.addEventListener('click', (e) => {
      e.preventDefault();
      registerStep2.style.display = 'none';
      registerStep1.style.display = '';
      if (registerError2) registerError2.classList.remove('show');
    });
  }

  if (registerAvatarZone) registerAvatarZone.addEventListener('click', () => { registerAvatarFile.click(); });
  if (registerAvatarFile) {
    registerAvatarFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > AVATAR_MAX_SIZE_BYTES) {
        showAuthError(registerError2, t('auth.errAvatarTooLarge'));
        registerAvatarFile.value = '';
        return;
      }
      if (!ALLOWED_AVATAR_TYPES[file.type]) {
        showAuthError(registerError2, t('auth.errAvatarType'));
        registerAvatarFile.value = '';
        return;
      }
      registerAvatarData = file;
      registerSubmit.classList.remove('disabled-avatar');
      const reader = new FileReader();
      reader.onload = (ev) => { registerAvatarPreview.innerHTML = `<img src="${ev.target.result}" alt="avatar-preview">`; };
      reader.readAsDataURL(file);
      if (registerError2) registerError2.classList.remove('show');
    });
  }

  if (registerSubmit) {
    registerSubmit.addEventListener('click', async () => {
      if (!registerAvatarData) { window.showToast(t('auth.errAvatarRequired')); return; }
      const username = document.getElementById('registerUsername').value.trim();
      const email = document.getElementById('registerEmail').value.trim();
      const password = document.getElementById('registerPassword').value;
      if (!username || !email || !password) {
        if (registerError2) showAuthError(registerError2, t('auth.errFillAll'));
        return;
      }
      if (password.length < 6) {
        if (registerError2) showAuthError(registerError2, t('auth.errPasswordShort'));
        return;
      }
      registerSubmit.disabled = true;
      const btnRect = registerSubmit.getBoundingClientRect();
      showAuthLoading(btnRect.left + btnRect.width / 2, btnRect.top + btnRect.height / 2);
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const res = await fetch(`${AUTH_API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, username }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const data = await res.json();
        if (data.code === 0 && data.data) {
          localStorage.setItem('toolknit_token', data.data.token);
          localStorage.setItem('toolknit_user', JSON.stringify(data.data.user));
          if (registerAvatarData && data.data.token) {
            try {
              const formData = new FormData();
              formData.append('avatar', registerAvatarData);
              const avatarRes = await fetch(`${AUTH_API_BASE}/api/upload/avatar`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${data.data.token}` },
                body: formData,
              });
              const avatarData = await avatarRes.json();
              if (avatarData.code === 0 && avatarData.data && avatarData.data.user) {
                localStorage.setItem('toolknit_user', JSON.stringify(avatarData.data.user));
                updatePersonalPanel(avatarData.data.user);
              } else {
                updatePersonalPanel(data.data.user);
              }
            } catch (avatarErr) {
              console.error('Avatar upload after register failed:', avatarErr);
              updatePersonalPanel(data.data.user);
            }
          } else {
            updatePersonalPanel(data.data.user);
          }
          closeAuthOverlay();
        } else {
          if (registerError2) showAuthError(registerError2, translateServerError(data.msg) || t('auth.errRegisterFailed'));
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          if (registerError2) showAuthError(registerError2, t('auth.errTimeout'));
        } else {
          if (registerError2) showAuthError(registerError2, t('auth.errNetwork'));
        }
      } finally {
        hideAuthLoading();
        registerSubmit.disabled = false;
        registerSubmit.textContent = t('auth.registerBtn');
      }
    });
  }

  if (apiKeyDropdownTrigger && apiKeyDropdown) {
    apiKeyDropdownTrigger.addEventListener('click', (e) => { e.stopPropagation(); apiKeyDropdown.classList.toggle('open'); });
    document.addEventListener('click', (e) => { if (!apiKeyDropdown.contains(e.target)) apiKeyDropdown.classList.remove('open'); });
  }
  if (apiKeyDropdownMenu) {
    apiKeyDropdownMenu.querySelectorAll('.api-key-dropdown-item').forEach(item => {
      item.addEventListener('click', () => { setApiKeyPlatform(item.dataset.value); apiKeyDropdown.classList.remove('open'); });
    });
  }
  if (btnApiKey && apiKeyOverlay) {
    btnApiKey.addEventListener('click', (e) => {
      e.stopPropagation();
      const savedPlatform = localStorage.getItem('ai_platform') || 'deepseek';
      const savedKey = localStorage.getItem('ai_api_key') || '';
      setApiKeyPlatform(savedPlatform);
      apiKeyInput.value = savedKey;
      if (apiKeyCustomUrl) apiKeyCustomUrl.value = localStorage.getItem('ai_custom_url') || '';
      if (apiKeyCustomModel) apiKeyCustomModel.value = localStorage.getItem('ai_custom_model') || '';
      apiKeyStatus.classList.remove('show', 'success', 'error');
      apiKeyOverlay.classList.add('visible');
    });
  }
  if (apiKeyBack && apiKeyOverlay) { apiKeyBack.addEventListener('click', () => { apiKeyOverlay.classList.remove('visible'); }); }
  if (apiKeyToggle) { apiKeyToggle.addEventListener('click', () => { apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password'; }); }
  if (apiKeySave) {
    apiKeySave.addEventListener('click', () => {
      const key = apiKeyInput.value.trim();
      if (!key) { apiKeyStatus.textContent = t('apiKey.errEmpty'); apiKeyStatus.className = 'api-key-status show error'; return; }
      const platform = apiKeyPlatformValue;
      localStorage.setItem('ai_platform', platform);
      localStorage.setItem('ai_api_key', key);
      if (platform === 'custom') {
        const customUrl = apiKeyCustomUrl ? apiKeyCustomUrl.value.trim() : '';
        const customModel = apiKeyCustomModel ? apiKeyCustomModel.value.trim() : '';
        if (!customUrl || !customModel) { apiKeyStatus.textContent = t('apiKey.errCustom'); apiKeyStatus.className = 'api-key-status show error'; return; }
        localStorage.setItem('ai_custom_url', customUrl);
        localStorage.setItem('ai_custom_model', customModel);
      }
      apiKeyStatus.textContent = t('apiKey.saved'); apiKeyStatus.className = 'api-key-status show success';
      setTimeout(() => apiKeyOverlay.classList.remove('visible'), 800);
    });
  }
  if (apiKeyClear) {
    apiKeyClear.addEventListener('click', () => {
      apiKeyInput.value = '';
      localStorage.removeItem('ai_api_key');
      localStorage.removeItem('ai_platform');
      localStorage.removeItem('ai_custom_url');
      localStorage.removeItem('ai_custom_model');
      localStorage.removeItem('deepseek_api_key');
      apiKeyStatus.textContent = t('apiKey.cleared'); apiKeyStatus.className = 'api-key-status show success';
      setTimeout(() => apiKeyOverlay.classList.remove('visible'), 800);
    });
  }

  if (aiLoginCancel) aiLoginCancel.addEventListener('click', hideAiLoginOverlay);
  if (aiLoginGoSettings) {
    aiLoginGoSettings.addEventListener('click', () => {
      hideAiLoginOverlay();
      if (!isLoggedIn()) {
        const pp = document.getElementById('personalPanel');
        const lb = pp ? pp.querySelector('.login-btn') : null;
        if (lb) {
          const rect = lb.getBoundingClientRect();
          openAuthOverlay(rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
      } else {
        if (btnApiKey) btnApiKey.click();
      }
    });
  }
}
