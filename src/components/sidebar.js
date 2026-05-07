// ═══════════════════════════════════════════════════════════
// Sidebar Component — with Auth Toggle
// ═══════════════════════════════════════════════════════════

import { router } from '../router.js';
import { auth } from '../services/auth.js';

export function renderSidebar(container, activePage = 'home') {
  const isAdmin = auth.isAdmin();

  container.innerHTML = `
    <div class="sidebar">
      <div class="sidebar-brand">
        <div class="sidebar-brand-icon">IO</div>
        <div class="sidebar-brand-text">Interview<span>OS</span></div>
      </div>

      <nav class="sidebar-nav">
        <div class="sidebar-section-label">Main</div>
        <button class="sidebar-nav-item ${activePage === 'home' ? 'active' : ''}" data-page="home">
          <span class="nav-icon">🏠</span>
          <span>Dashboard</span>
        </button>
        <button class="sidebar-nav-item ${activePage === 'questions' ? 'active' : ''}" data-page="questions">
          <span class="nav-icon">📚</span>
          <span>Question Bank</span>
        </button>

        <div class="sidebar-section-label">Practice</div>
        <button class="sidebar-nav-item ${activePage === 'hld-practice' ? 'active' : ''}" data-page="hld-practice">
          <span class="nav-icon">🏛️</span>
          <span>HLD Practice</span>
        </button>
        <button class="sidebar-nav-item ${activePage === 'study-planner' ? 'active' : ''}" data-page="study-planner">
          <span class="nav-icon">📅</span>
          <span>90-Day Planner</span>
        </button>

        <div class="sidebar-section-label">Resources</div>
        <button class="sidebar-nav-item ${activePage === 'resources' ? 'active' : ''}" data-page="resources">
          <span class="nav-icon">📖</span>
          <span>LLD Resources</span>
        </button>

        <div class="sidebar-section-label" style="color: var(--accent-indigo);">🤖 AI Engine</div>
        <button class="sidebar-nav-item ${activePage === 'jd-parser' ? 'active' : ''}" data-page="jd-parser" style="${activePage === 'jd-parser' ? '' : 'border: 1px solid rgba(99,102,241,0.2);'}">
          <span class="nav-icon">🧠</span>
          <span>JD Analyzer</span>
        </button>

        <div class="sidebar-section-label">Quick Start</div>
        <button class="sidebar-nav-item" data-quick="dsa">
          <span class="nav-icon">⚡</span>
          <span>DSA Round</span>
        </button>
        <button class="sidebar-nav-item" data-quick="lld">
          <span class="nav-icon">🏗️</span>
          <span>LLD Round</span>
        </button>
        <button class="sidebar-nav-item" data-quick="hld">
          <span class="nav-icon">🏛️</span>
          <span>HLD Round</span>
        </button>
        <button class="sidebar-nav-item" data-quick="hr">
          <span class="nav-icon">🤝</span>
          <span>HR Round</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <button class="sidebar-nav-item auth-toggle" id="auth-toggle">
          <span class="nav-icon">${isAdmin ? '🔓' : '🔐'}</span>
          <span style="font-size:12px;">${isAdmin ? 'Admin Mode ✓' : 'Unlock Solutions'}</span>
        </button>
        <div class="sidebar-nav-item" style="cursor:default; opacity:0.5;">
          <span class="nav-icon">💡</span>
          <span style="font-size:11px;">v2.0 — Built with ♥</span>
        </div>
      </div>
    </div>
  `;

  // Add auth toggle styles
  if (!container.querySelector('#auth-toggle-style')) {
    const style = document.createElement('style');
    style.id = 'auth-toggle-style';
    style.textContent = `
        .auth-toggle { transition: all var(--transition-fast); }
        .auth-toggle:hover { background: rgba(99,102,241,0.1) !important; }
        .auth-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.7);
          display: flex; align-items: center; justify-content: center; z-index: 1000;
          animation: fadeIn 200ms ease-out;
        }
        .auth-modal {
          background: var(--bg-secondary); border: 1px solid var(--glass-border);
          border-radius: var(--radius-xl); padding: var(--space-8);
          width: 360px; max-width: 90vw; animation: scaleIn 300ms ease-out;
        }
        .auth-modal h3 { font-size: var(--text-xl); font-weight: 700; margin-bottom: var(--space-2); }
        .auth-modal p { font-size: var(--text-sm); color: var(--text-muted); margin-bottom: var(--space-5); }
        .auth-modal input {
          width: 100%; padding: var(--space-3) var(--space-4); border-radius: var(--radius-md);
          background: var(--bg-surface); border: 1px solid var(--glass-border);
          color: var(--text-primary); font-size: var(--text-sm); outline: none;
          margin-bottom: var(--space-4); font-family: var(--font-sans);
        }
        .auth-modal input:focus { border-color: var(--accent-indigo); }
        .auth-modal-btns { display: flex; gap: var(--space-2); justify-content: flex-end; }
        .auth-error { color: var(--accent-rose); font-size: var(--text-xs); margin-bottom: var(--space-3); display: none; }
        `;
    container.appendChild(style);
  }

  // Event listeners
  container.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      router.navigate(page === 'home' ? '/' : '/' + page);
    });
  });

  container.querySelectorAll('[data-quick]').forEach(btn => {
    btn.addEventListener('click', () => {
      router.navigate(`/interview?round=${btn.dataset.quick}&mode=coaching&difficulty=medium`);
    });
  });

  // Auth toggle
  container.querySelector('#auth-toggle').addEventListener('click', () => {
    if (isAdmin) {
      auth.logout();
      router.navigate(window.location.hash.slice(1) || '/');
    } else {
      showAuthModal(container);
    }
  });
}

function showAuthModal(container) {
  const overlay = document.createElement('div');
  overlay.className = 'auth-modal-overlay';
  overlay.innerHTML = `
    <div class="auth-modal">
      <h3>🔐 Admin Access</h3>
      <p>Enter password to unlock solutions and admin features.</p>
      <input type="password" id="auth-password" placeholder="Enter password..." autofocus />
      <div class="auth-error" id="auth-error">Incorrect password. Try again.</div>
      <div class="auth-modal-btns">
        <button class="btn btn-ghost btn-sm" id="auth-cancel">Cancel</button>
        <button class="btn btn-primary btn-sm" id="auth-submit">Unlock</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const input = overlay.querySelector('#auth-password');
  const error = overlay.querySelector('#auth-error');

  overlay.querySelector('#auth-cancel').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  function submit() {
    if (auth.login(input.value)) {
      overlay.remove();
      router.navigate(window.location.hash.slice(1) || '/');
    } else {
      error.style.display = 'block';
      input.value = '';
      input.focus();
    }
  }

  overlay.querySelector('#auth-submit').addEventListener('click', submit);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  input.focus();
}
