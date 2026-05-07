// ═══════════════════════════════════════════════════════════
// JD Parser Page — AntiGravity Agent: Job Description Analyzer
// ═══════════════════════════════════════════════════════════

import { callGrokAPI } from '../engine/api.js';
import { AGENT_PROFILES } from '../engine/agents.js';
import { router } from '../router.js';

export function renderJDParserPage(container) {
    container.innerHTML = `
    <div class="page-container">

      <!-- Hero Section -->
      <div class="jd-hero animate-fade-in-up">
        <div class="jd-hero-badge">
          <span class="jd-badge-dot"></span>
          <span>AntiGravity Agent — Powered by Grok xAI</span>
        </div>
        <h1 class="jd-hero-title">AI Job Description <span class="jd-gradient">Analyzer</span></h1>
        <p class="jd-hero-subtitle">
          Paste any JD and get a custom FAANG-caliber Take-Home assessment, FOSS repository recommendations,
          and a full evaluation rubric — generated in seconds.
        </p>

        <!-- Feature Pills -->
        <div class="jd-feature-pills">
          <div class="jd-pill">⚡ Tech Stack Detection</div>
          <div class="jd-pill">📋 Take-Home Generator</div>
          <div class="jd-pill">📦 FOSS Repos</div>
          <div class="jd-pill">📊 FAANG Rubric</div>
        </div>
      </div>

      <!-- Main Input Card -->
      <div class="jd-input-card glass animate-fade-in-up">
        <div class="jd-card-header">
          <div class="jd-card-icon">🤖</div>
          <div>
            <h2 class="jd-card-title">Paste Your Job Description</h2>
            <p class="jd-card-subtitle">The agent will extract signals and craft a personalized assessment plan</p>
          </div>
        </div>

        <textarea
          id="jd-input"
          class="jd-textarea"
          placeholder="Paste the full Job Description here... (e.g. Senior Backend Engineer at Google, requirements: Python, distributed systems, Kubernetes...)"
        ></textarea>

        <div class="jd-input-footer">
          <span class="jd-char-count" id="jd-char-count">0 characters</span>
          <button class="btn btn-primary jd-submit-btn" id="parse-jd-btn">
            <span id="btn-icon">🚀</span>
            <span id="btn-text">Generate Assessment</span>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div id="jd-loading" class="jd-loading" style="display:none;">
        <div class="jd-loading-spinner"></div>
        <p class="jd-loading-text">AntiGravity Agent is parsing your JD<span class="jd-dots"></span></p>
      </div>

      <!-- Results Section -->
      <div id="jd-results" class="jd-results animate-fade-in-up" style="display:none;">

        <!-- Domain & Tech Row -->
        <div class="jd-result-row" id="jd-meta-row">
          <div class="jd-meta-card glass">
            <div class="jd-meta-label">Detected Domain</div>
            <div class="jd-meta-value" id="jd-domain">—</div>
          </div>
          <div class="jd-meta-card glass">
            <div class="jd-meta-label">Signal Mode</div>
            <div class="jd-meta-value" id="jd-signal">—</div>
          </div>
          <div class="jd-meta-card glass">
            <div class="jd-meta-label">Company</div>
            <div class="jd-meta-value" id="jd-company">—</div>
          </div>
          <div class="jd-meta-card glass">
            <div class="jd-meta-label">Tech Stack</div>
            <div class="jd-tech-tags" id="jd-tech">—</div>
          </div>
        </div>

        <!-- Take-Home Assessment -->
        <div class="jd-section-card glass" id="jd-takehome-card">
          <div class="jd-section-header">
            <div class="jd-section-icon" style="background: rgba(99,102,241,0.15); color: var(--accent-indigo);">📋</div>
            <div>
              <h3 class="jd-section-title">Take-Home Assessment</h3>
              <p class="jd-section-subtitle" id="jd-deadline"></p>
            </div>
          </div>
          <pre id="jd-readme" class="jd-readme-pre"></pre>

          <div class="jd-stretch-goals" id="jd-stretch">
            <h4 class="jd-stretch-title">🌟 Stretch Goals</h4>
            <ul id="jd-stretch-list" class="jd-stretch-list"></ul>
          </div>
        </div>

        <!-- FOSS Repos -->
        <div class="jd-section-card glass">
          <div class="jd-section-header">
            <div class="jd-section-icon" style="background: rgba(16,185,129,0.15); color: var(--accent-emerald);">📦</div>
            <div>
              <h3 class="jd-section-title">Recommended FOSS Repositories</h3>
              <p class="jd-section-subtitle">Study these real-world codebases to align with the JD</p>
            </div>
          </div>
          <div class="jd-repo-grid" id="jd-repos"></div>
        </div>

        <!-- FAANG Rubric -->
        <div class="jd-section-card glass">
          <div class="jd-section-header">
            <div class="jd-section-icon" style="background: rgba(245,158,11,0.15); color: var(--accent-amber);">📊</div>
            <div>
              <h3 class="jd-section-title">FAANG Evaluation Rubric</h3>
              <p class="jd-section-subtitle">What interviewers will look for based on this JD</p>
            </div>
          </div>
          <div class="jd-rubric-grid" id="jd-rubric"></div>
        </div>

        <!-- CTA -->
        <div class="jd-cta-row">
          <button class="btn btn-primary btn-lg" id="jd-start-interview">
            🎯 Start FAANG Interview Round
          </button>
          <button class="btn btn-ghost btn-lg" id="jd-reset">
            🔄 Analyze Another JD
          </button>
        </div>

      </div>
    </div>
  `;

    addJDStyles(container);
    bindJDEvents(container);
}

function bindJDEvents(container) {
    const textarea = container.querySelector('#jd-input');
    const charCount = container.querySelector('#jd-char-count');
    const parseBtn = container.querySelector('#parse-jd-btn');

    // Char count
    textarea.addEventListener('input', () => {
        const len = textarea.value.length;
        charCount.textContent = `${len} character${len !== 1 ? 's' : ''}`;
        charCount.style.color = len < 100 ? 'var(--accent-rose)' : 'var(--text-muted)';
    });

    // Submit
    parseBtn.addEventListener('click', async () => {
        const jd = textarea.value.trim();
        if (jd.length < 100) {
            textarea.style.borderColor = 'var(--accent-rose)';
            textarea.placeholder = '⚠️ Please paste a full Job Description (minimum 100 characters)';
            return;
        }
        textarea.style.borderColor = '';
        await runParser(container, jd);
    });

    // Reset
    container.querySelector('#jd-reset')?.addEventListener('click', () => {
        container.querySelector('#jd-results').style.display = 'none';
        container.querySelector('#jd-loading').style.display = 'none';
        textarea.value = '';
        charCount.textContent = '0 characters';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Start interview
    container.querySelector('#jd-start-interview')?.addEventListener('click', () => {
        router.navigate('/interview?round=dsa&mode=coaching&difficulty=medium');
    });
}

async function runParser(container, jd) {
    const loading = container.querySelector('#jd-loading');
    const results = container.querySelector('#jd-results');
    const btnText = container.querySelector('#btn-text');
    const btnIcon = container.querySelector('#btn-icon');
    const parseBtn = container.querySelector('#parse-jd-btn');

    // Show loading
    results.style.display = 'none';
    loading.style.display = 'flex';
    parseBtn.disabled = true;
    btnIcon.textContent = '⏳';
    btnText.textContent = 'Analyzing...';

    // Animate dots
    let dotCount = 0;
    const dotInterval = setInterval(() => {
        const dots = container.querySelector('.jd-dots');
        if (dots) dots.textContent = '.'.repeat((++dotCount % 3) + 1);
    }, 500);

    try {
        const rawResponse = await callGrokAPI(AGENT_PROFILES.JD_PARSER.systemPrompt, jd);

        let parsed = null;
        try {
            const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            parsed = JSON.parse(cleanJson);
        } catch (e) {
            throw new Error('Agent returned invalid JSON. Please try again.');
        }

        clearInterval(dotInterval);
        loading.style.display = 'none';
        renderResults(container, parsed);
        results.style.display = 'block';
        results.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (err) {
        clearInterval(dotInterval);
        loading.style.display = 'none';
        loading.innerHTML = `<p style="color:var(--accent-rose);">❌ Error: ${err.message}</p>`;
        loading.style.display = 'flex';
    } finally {
        parseBtn.disabled = false;
        btnIcon.textContent = '🚀';
        btnText.textContent = 'Generate Assessment';
    }
}

function renderResults(container, parsed) {
    // Meta
    container.querySelector('#jd-domain').textContent = parsed.domain || 'N/A';
    container.querySelector('#jd-signal').textContent = parsed.signal_mode || 'N/A';
    container.querySelector('#jd-company').textContent = parsed.company || 'Unknown';

    const techContainer = container.querySelector('#jd-tech');
    techContainer.innerHTML = (parsed.tech_stack_detected || [])
        .map(t => `<span class="jd-tech-tag">${t}</span>`)
        .join('') || '—';

    // Take-home
    const assessment = parsed.assessment || {};
    container.querySelector('#jd-deadline').textContent =
        assessment.deadline_suggestion ? `⏱️ Suggested deadline: ${assessment.deadline_suggestion}` : '';
    container.querySelector('#jd-readme').textContent = assessment.takehome_readme || 'No readme generated.';

    const stretchList = container.querySelector('#jd-stretch-list');
    stretchList.innerHTML = (assessment.stretch_goals || []).map(g => `<li>${g}</li>`).join('');

    // FOSS Repos
    const repoGrid = container.querySelector('#jd-repos');
    repoGrid.innerHTML = (parsed.foss_projects || []).map(repo => `
        <a href="${repo.repo_url}" target="_blank" class="jd-repo-card glass">
          <div class="jd-repo-name">📦 ${repo.name}</div>
          <div class="jd-repo-why">${repo.why}</div>
          <div class="jd-repo-stars">⭐ ${(repo.stars || 0).toLocaleString()}</div>
        </a>
    `).join('') || '<p style="color:var(--text-muted);">No repositories found.</p>';

    // Rubric
    const rubric = parsed.faang_rubric || {};
    const rubricLabels = { coding: '⚡ Coding', lld: '🏗️ LLD', hld: '🏛️ HLD', behavioral: '🤝 Behavioral', bar_raiser: '🎯 Bar Raiser' };
    const rubricGrid = container.querySelector('#jd-rubric');
    rubricGrid.innerHTML = Object.entries(rubricLabels).map(([key, label]) => `
        <div class="jd-rubric-item">
          <div class="jd-rubric-label">${label}</div>
          <div class="jd-rubric-text">${rubric[key] || 'Standard FAANG bar applies.'}</div>
        </div>
    `).join('');
}

function addJDStyles(container) {
    const style = document.createElement('style');
    style.textContent = `
    /* ── Hero ── */
    .jd-hero { text-align: center; padding: var(--space-12) 0 var(--space-8); }
    .jd-hero-badge {
      display: inline-flex; align-items: center; gap: 8px;
      background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.25);
      border-radius: 999px; padding: 6px 16px; font-size: 13px;
      color: var(--accent-indigo); font-weight: 600; margin-bottom: var(--space-5);
    }
    .jd-badge-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--accent-indigo);
      box-shadow: 0 0 8px var(--accent-indigo);
      animation: pulse 2s infinite;
    }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
    .jd-hero-title {
      font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 800;
      letter-spacing: -0.03em; line-height: 1.1; margin-bottom: var(--space-4);
    }
    .jd-gradient {
      background: linear-gradient(135deg, var(--accent-indigo), var(--accent-cyan), var(--accent-emerald));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .jd-hero-subtitle {
      font-size: var(--text-lg); color: var(--text-secondary);
      max-width: 640px; margin: 0 auto var(--space-6); line-height: 1.7;
    }
    .jd-feature-pills {
      display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;
    }
    .jd-pill {
      background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border);
      border-radius: 999px; padding: 6px 14px; font-size: 13px; font-weight: 500;
      color: var(--text-secondary);
    }

    /* ── Input Card ── */
    .jd-input-card {
      max-width: 840px; margin: 0 auto var(--space-8); padding: var(--space-7);
      border-radius: var(--radius-xl);
    }
    .jd-card-header {
      display: flex; align-items: flex-start; gap: var(--space-4);
      margin-bottom: var(--space-5);
    }
    .jd-card-icon {
      font-size: 32px; width: 56px; height: 56px; border-radius: var(--radius-lg);
      background: rgba(99,102,241,0.12); display: flex; align-items: center;
      justify-content: center; flex-shrink: 0;
    }
    .jd-card-title { font-size: var(--text-xl); font-weight: 700; }
    .jd-card-subtitle { font-size: var(--text-sm); color: var(--text-muted); margin-top: 4px; }
    .jd-textarea {
      width: 100%; min-height: 180px; padding: var(--space-4);
      border-radius: var(--radius-lg); border: 1px solid var(--glass-border);
      background: rgba(255,255,255,0.03); color: var(--text-primary);
      font-family: var(--font-sans); font-size: var(--text-sm); line-height: 1.7;
      resize: vertical; outline: none; transition: border-color var(--transition-fast);
      box-sizing: border-box;
    }
    .jd-textarea:focus { border-color: var(--accent-indigo); }
    .jd-input-footer {
      display: flex; align-items: center; justify-content: space-between;
      margin-top: var(--space-4);
    }
    .jd-char-count { font-size: var(--text-xs); color: var(--text-muted); }
    .jd-submit-btn { display: flex; align-items: center; gap: 8px; min-width: 200px; justify-content: center; }

    /* ── Loading ── */
    .jd-loading {
      display: flex; flex-direction: column; align-items: center;
      gap: var(--space-4); padding: var(--space-10); max-width: 840px; margin: 0 auto;
    }
    .jd-loading-spinner {
      width: 48px; height: 48px; border: 3px solid var(--glass-border);
      border-top-color: var(--accent-indigo); border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .jd-loading-text { color: var(--text-secondary); font-size: var(--text-lg); font-weight: 600; }

    /* ── Results ── */
    .jd-results { max-width: 840px; margin: 0 auto; display: flex; flex-direction: column; gap: var(--space-6); }

    .jd-result-row {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: var(--space-4);
    }
    .jd-meta-card {
      padding: var(--space-4); border-radius: var(--radius-lg);
    }
    .jd-meta-label { font-size: var(--text-xs); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
    .jd-meta-value { font-size: var(--text-lg); font-weight: 700; color: var(--text-primary); }
    .jd-tech-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
    .jd-tech-tag {
      background: rgba(99,102,241,0.15); color: var(--accent-indigo);
      border: 1px solid rgba(99,102,241,0.25); border-radius: 999px;
      padding: 2px 10px; font-size: 12px; font-weight: 600;
    }

    .jd-section-card { padding: var(--space-6); border-radius: var(--radius-xl); }
    .jd-section-header { display: flex; align-items: flex-start; gap: var(--space-4); margin-bottom: var(--space-5); }
    .jd-section-icon {
      width: 48px; height: 48px; border-radius: var(--radius-lg);
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; flex-shrink: 0;
    }
    .jd-section-title { font-size: var(--text-xl); font-weight: 700; }
    .jd-section-subtitle { font-size: var(--text-sm); color: var(--text-muted); margin-top: 4px; }

    .jd-readme-pre {
      white-space: pre-wrap; font-family: var(--font-mono); font-size: 13px;
      color: var(--text-secondary); line-height: 1.7;
      background: rgba(0,0,0,0.25); padding: var(--space-5);
      border-radius: var(--radius-lg); border: 1px solid var(--glass-border);
      margin-bottom: var(--space-5);
    }
    .jd-stretch-title { font-size: var(--text-sm); font-weight: 700; color: var(--accent-amber); margin-bottom: var(--space-3); }
    .jd-stretch-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 8px; }
    .jd-stretch-list li {
      padding: var(--space-3) var(--space-4);
      background: rgba(245,158,11,0.08); border-left: 3px solid var(--accent-amber);
      border-radius: 0 var(--radius-md) var(--radius-md) 0;
      font-size: var(--text-sm); color: var(--text-secondary);
    }

    .jd-repo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: var(--space-4); }
    .jd-repo-card {
      padding: var(--space-5); border-radius: var(--radius-lg);
      text-decoration: none; transition: all var(--transition-base);
      display: block;
    }
    .jd-repo-card:hover { transform: translateY(-3px); border-color: var(--accent-emerald); }
    .jd-repo-name { font-weight: 700; font-size: var(--text-sm); color: var(--accent-cyan); margin-bottom: 6px; }
    .jd-repo-why { font-size: var(--text-xs); color: var(--text-secondary); line-height: 1.5; margin-bottom: 8px; }
    .jd-repo-stars { font-size: var(--text-xs); color: var(--text-muted); }

    .jd-rubric-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--space-4); }
    .jd-rubric-item {
      padding: var(--space-4); background: rgba(255,255,255,0.03);
      border-radius: var(--radius-lg); border: 1px solid var(--glass-border);
    }
    .jd-rubric-label { font-size: var(--text-sm); font-weight: 700; color: var(--text-primary); margin-bottom: 6px; }
    .jd-rubric-text { font-size: var(--text-xs); color: var(--text-secondary); line-height: 1.6; }

    .jd-cta-row { display: flex; gap: var(--space-4); justify-content: center; flex-wrap: wrap; padding-bottom: var(--space-8); }
  `;
    container.appendChild(style);
}
