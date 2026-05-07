// ═══════════════════════════════════════════════════════════
// Questions Page — NeetCode 150 + LLD/HLD/HR
// Features: Complexity Chart, Multi-Language Compiler, Mandatory Explanation
// ═══════════════════════════════════════════════════════════

import { questions, getQuestionsByRound } from '../data/questions.js';
import { NC_TOPICS } from '../data/neetcode150.js';
import { DSA_SOLUTIONS } from '../data/dsaSolutions.js';
import { router } from '../router.js';
import { auth } from '../services/auth.js';
import { fetchProblemData, titleToSlug, getLangSlug } from '../services/leetcodeService.js';

const ROUND_TABS = [
  { id: 'dsa', label: 'DSA (NeetCode 150)', icon: '⚡', color: 'indigo' },
  { id: 'lld', label: 'LLD', icon: '🏗️', color: 'emerald' },
  { id: 'hld', label: 'HLD', icon: '🏛️', color: 'amber' },
  { id: 'hr', label: 'HR', icon: '🤝', color: 'rose' }
];

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', icon: '🟨', canRun: true },
  { id: 'python', label: 'Python', icon: '🐍', canRun: false },
  { id: 'java', label: 'Java', icon: '☕', canRun: false },
  { id: 'cpp', label: 'C++', icon: '⚙️', canRun: false },
];

const COMPLEXITIES = [
  { value: 'O(1)', label: 'O(1)', bar: 5, color: '#10b981' },
  { value: 'O(log n)', label: 'O(log n)', bar: 15, color: '#22d3ee' },
  { value: 'O(n)', label: 'O(n)', bar: 30, color: '#6366f1' },
  { value: 'O(n log n)', label: 'O(n log n)', bar: 50, color: '#f59e0b' },
  { value: 'O(n²)', label: 'O(n²)', bar: 70, color: '#f97316' },
  { value: 'O(n³)', label: 'O(n³)', bar: 85, color: '#ef4444' },
  { value: 'O(2^n)', label: 'O(2ⁿ)', bar: 95, color: '#dc2626' },
  { value: 'O(n!)', label: 'O(n!)', bar: 100, color: '#991b1b' },
];

const SOLUTIONS_KEY = 'user_solutions';
function getSolutions() { return JSON.parse(localStorage.getItem(SOLUTIONS_KEY) || '{}'); }
function saveSolutions(s) { localStorage.setItem(SOLUTIONS_KEY, JSON.stringify(s)); }

// ═══════════════════════════════════════════════════════════
// MAIN RENDER
// ═══════════════════════════════════════════════════════════
export function renderQuestionsPage(container) {
  let activeTab = 'dsa';
  let activeTopic = 'all';
  let expandedQ = null;
  let editorState = null; // { qid, approach, lang }
  let compilerOutput = {};
  let validationErrors = {};
  let problemDataCache = {}; // { [qid]: { testCases, codeSnippets, loading, error } }

  function render() {
    const roundQs = getQuestionsByRound(activeTab);
    const allQuestions = [...roundQs];
    const solutions = getSolutions();

    let topics = [];
    let filteredQs = allQuestions;
    if (activeTab === 'dsa') {
      topics = NC_TOPICS;
      if (activeTopic !== 'all') filteredQs = allQuestions.filter(q => q.topic === activeTopic);
    }

    const solvedCount = allQuestions.filter(q => {
      const s = solutions[q.id];
      return s && (s.brute?.code || s.better?.code || s.optimal?.code);
    }).length;
    const diffCounts = { easy: 0, medium: 0, hard: 0 };
    allQuestions.forEach(q => { if (q.difficulty) diffCounts[q.difficulty]++; });

    container.innerHTML = `
    <div class="page-container qb">
      <div class="qb-hero animate-fade-in-up">
        <div class="hero-badge badge badge-indigo">📚 Question Bank</div>
        <h1 class="hero-title">NeetCode <span class="hero-gradient-qb">150</span></h1>
        <p class="hero-subtitle">Write → Compile → Explain → Tag Complexity → Save</p>
        <div class="qb-stats-row">
          <span class="qb-stat">${filteredQs.length} questions</span>
          <span class="qb-stat-sep">·</span>
          <span class="qb-stat qb-solved">${solvedCount} solved</span>
          <span class="qb-stat-sep">·</span>
          <span class="qb-stat qb-easy">🟢 ${diffCounts.easy}</span>
          <span class="qb-stat qb-medium">🟡 ${diffCounts.medium}</span>
          <span class="qb-stat qb-hard">🔴 ${diffCounts.hard}</span>
        </div>
      </div>

      <div class="qb-tabs animate-fade-in-up">
        ${ROUND_TABS.map(t => `
          <button class="qb-tab ${t.id === activeTab ? 'active' : ''}" data-tab="${t.id}">
            ${t.icon} ${t.label}
            <span class="tab-count">${getQuestionsByRound(t.id).length}</span>
          </button>
        `).join('')}
      </div>

      ${activeTab === 'dsa' ? `
      <div class="topic-filter animate-fade-in-up">
        <button class="topic-pill ${activeTopic === 'all' ? 'active' : ''}" data-topic="all">All Topics</button>
        ${topics.map(t => {
      const count = allQuestions.filter(q => q.topic === t).length;
      return `<button class="topic-pill ${activeTopic === t ? 'active' : ''}" data-topic="${t}">${t} <span class="tp-count">${count}</span></button>`;
    }).join('')}
      </div>` : ''}

      <div class="qb-list">
        ${activeTab === 'dsa' && activeTopic === 'all'
        ? topics.map(topic => {
          const topicQs = allQuestions.filter(q => q.topic === topic);
          if (!topicQs.length) return '';
          return `<div class="topic-group">
                <h3 class="topic-heading">${topic} <span class="topic-count">(${topicQs.length})</span></h3>
                ${topicQs.map(q => renderCard(q, solutions)).join('')}
              </div>`;
        }).join('')
        : filteredQs.map(q => renderCard(q, solutions)).join('')
      }
        ${!filteredQs.length ? '<div class="empty-state"><span style="font-size:48px;opacity:0.3;">📭</span><p>No questions found.</p></div>' : ''}
      </div>
    </div>`;

    addQBStyles(container);
    bindEvents();
  }

  // ─── CARD ────────────────────────────────────────────────
  function renderCard(q, solutions) {
    const diffColor = q.difficulty === 'easy' ? 'emerald' : q.difficulty === 'hard' ? 'rose' : 'amber';
    const isExpanded = expandedQ === q.id;
    const sol = solutions[q.id] || {};
    const hasSol = sol.brute?.code || sol.better?.code || sol.optimal?.code;
    const lcNum = q.leetcodeNum ? `#${q.leetcodeNum}` : '';

    return `
    <div class="qb-card glass ${isExpanded ? 'expanded' : ''} ${hasSol ? 'has-solution' : ''}">
      <div class="qb-card-header" data-expand="${q.id}">
        <div class="qb-card-left">
          ${lcNum ? `<span class="lc-num">${lcNum}</span>` : ''}
          <span class="qb-card-title">${q.title}</span>
        </div>
        <div class="qb-card-right">
          ${hasSol ? '<span class="sol-badge">✅</span>' : ''}
          <span class="badge badge-${diffColor}" style="font-size:10px;">${q.difficulty}</span>
          <span class="expand-arrow">${isExpanded ? '▲' : '▼'}</span>
        </div>
      </div>

      ${isExpanded ? `
      <div class="qb-card-body animate-fade-in-up">
        <p class="qb-statement">${q.statement || ''}</p>
        <div class="qb-tags">
          ${(q.tags || []).map(t => `<span class="q-tag">${t}</span>`).join('')}
          ${q.topic ? `<span class="q-tag topic-tag">${q.topic}</span>` : ''}
          ${lcNum ? `<a href="https://leetcode.com/problems/${q.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')}" target="_blank" class="lc-link">🔗 LeetCode</a>` : ''}
        </div>

        ${renderInsightPanel(q)}

        <!-- Test Cases from LeetCode API -->
        ${renderTestCases(q)}

        ${renderComplexityChart(q, sol)}

        <div class="sol-editor">
          <div class="sol-editor-header">
            <h4 class="sol-editor-title">📝 Your Solutions</h4>
            <span class="sol-editor-hint">Code + Explanation required to save</span>
          </div>
          ${['brute', 'better', 'optimal'].map(approach => renderApproach(q, approach, sol)).join('')}
        </div>
      </div>` : ''}
    </div>`;
  }

  // ─── TEST CASES (from LeetCode API) ──────────────────────
  function renderTestCases(q) {
    const pd = problemDataCache[q.id];
    if (!pd) return `<div class="tc-panel glass-dark"><div class="tc-loading"><span class="tc-spinner"></span> Loading test cases from LeetCode...</div></div>`;
    if (pd.error) return `<div class="tc-panel glass-dark"><div class="tc-error">⚠ ${pd.error}</div></div>`;
    if (!pd.testCases || pd.testCases.length === 0) return `<div class="tc-panel glass-dark"><div class="tc-empty">No test cases available</div></div>`;

    return `
    <div class="tc-panel glass-dark">
      <div class="tc-header">
        <h4 class="tc-title">🧪 Test Cases <span class="tc-count">${pd.testCases.length}</span></h4>
        <span class="tc-source">via LeetCode API</span>
      </div>
      <div class="tc-grid">
        ${pd.testCases.map(tc => `
        <div class="tc-case">
          <div class="tc-case-id">Case ${tc.id}</div>
          <div class="tc-io">
            <div class="tc-input">
              <span class="tc-label">Input</span>
              <pre class="tc-pre">${esc(tc.input)}</pre>
            </div>
            <div class="tc-expected">
              <span class="tc-label">Expected</span>
              <pre class="tc-pre tc-exp">${esc(tc.expected || 'N/A')}</pre>
            </div>
          </div>
          ${tc.explanation ? `<div class="tc-explanation">💡 ${esc(tc.explanation)}</div>` : ''}
        </div>`).join('')}
      </div>
    </div>`;
  }

  async function fetchTestCasesForQuestion(q) {
    if (problemDataCache[q.id]) return;
    problemDataCache[q.id] = null; // mark as loading
    render(); // show loading state

    const slug = titleToSlug(q.title);
    const data = await fetchProblemData(slug);
    if (data) {
      problemDataCache[q.id] = {
        testCases: data.testCases,
        codeSnippets: data.codeSnippets,
        error: null
      };
    } else {
      problemDataCache[q.id] = { testCases: [], codeSnippets: {}, error: 'Could not load from LeetCode API' };
    }
    render();
  }

  // Helper to get code template for current language
  function getCodeTemplate(qid, langId) {
    const pd = problemDataCache[qid];
    if (!pd || !pd.codeSnippets) return '';
    const slug = getLangSlug(langId);
    return pd.codeSnippets[slug]?.code || '';
  }

  // ─── COMPLEXITY CHART ────────────────────────────────────
  function renderComplexityChart(q, sol) {
    const approaches = ['brute', 'better', 'optimal'];
    const labels = { brute: '🐢 Brute', better: '🚀 Better', optimal: '💎 Optimal' };
    const colors = { brute: '#f43f5e', better: '#f59e0b', optimal: '#10b981' };
    const hasAny = approaches.some(a => sol[a]?.timeComplexity || sol[a]?.spaceComplexity);

    return `
    <div class="complexity-chart glass-dark">
      <div class="cc-header">
        <h4 class="cc-title">📊 Complexity Analysis</h4>
        ${!hasAny ? '<span class="cc-empty">Tag complexities below to see the chart</span>' : ''}
      </div>
      ${hasAny ? `
      <div class="cc-grid">
        <div class="cc-column">
          <div class="cc-col-label">⏱ Time</div>
          ${approaches.map(a => {
      const tc = sol[a]?.timeComplexity;
      const info = tc ? COMPLEXITIES.find(c => c.value === tc) : null;
      return `<div class="cc-bar-row">
              <span class="cc-bar-label" style="color:${colors[a]}">${labels[a]}</span>
              ${info ? `<div class="cc-bar-track"><div class="cc-bar-fill" style="width:${info.bar}%;background:${info.color}"></div></div>
                <span class="cc-bar-value" style="color:${info.color}">${info.label}</span>`
          : '<span class="cc-bar-na">—</span>'}
            </div>`;
    }).join('')}
        </div>
        <div class="cc-column">
          <div class="cc-col-label">💾 Space</div>
          ${approaches.map(a => {
      const sc = sol[a]?.spaceComplexity;
      const info = sc ? COMPLEXITIES.find(c => c.value === sc) : null;
      return `<div class="cc-bar-row">
              <span class="cc-bar-label" style="color:${colors[a]}">${labels[a]}</span>
              ${info ? `<div class="cc-bar-track"><div class="cc-bar-fill" style="width:${info.bar}%;background:${info.color}"></div></div>
                <span class="cc-bar-value" style="color:${info.color}">${info.label}</span>`
          : '<span class="cc-bar-na">—</span>'}
            </div>`;
    }).join('')}
        </div>
      </div>
      <div class="cc-scale">
        ${COMPLEXITIES.map(c => `<span class="cc-scale-item" style="color:${c.color}">${c.label}</span>`).join('')}
      </div>` : `
      <div class="cc-placeholder">
        <div class="cc-placeholder-bars">
          ${[5, 15, 30, 50, 70, 85, 95, 100].map((w, i) => `<div class="cc-placeholder-bar" style="width:${w}%;opacity:${0.15 + i * 0.05}"></div>`).join('')}
        </div>
        <p class="cc-placeholder-text">O(1) → O(n!) bars appear when you tag complexities</p>
      </div>`}
    </div>`;
  }

  // ─── APPROACH SECTION ────────────────────────────────────
  function renderApproach(q, approach, sol) {
    const label = approach === 'brute' ? '🐢 Brute Force' : approach === 'better' ? '🚀 Better' : '💎 Optimal';
    const approachColor = approach === 'brute' ? 'rose' : approach === 'better' ? 'amber' : 'emerald';
    const isEditing = editorState && editorState.qid === q.id && editorState.approach === approach;
    const saved = sol[approach] || {};
    const hasCode = !!saved.code;
    const compKey = `${q.id}-${approach}`;
    const output = compilerOutput[compKey];
    const vErr = validationErrors[compKey];
    const lang = editorState?.lang || saved.language || 'javascript';
    const langInfo = LANGUAGES.find(l => l.id === lang) || LANGUAGES[0];

    return `
    <div class="sol-approach ${hasCode ? 'filled' : ''}">
      <div class="sol-approach-header" style="border-left: 3px solid var(--accent-${approachColor});">
        <span class="sol-approach-label">${label}</span>
        <div class="sol-approach-meta">
          ${saved.language ? `<span class="sol-lang-badge">${LANGUAGES.find(l => l.id === saved.language)?.icon || ''} ${saved.language}</span>` : ''}
          ${saved.timeComplexity ? `<span class="sol-tc-badge" style="color:${COMPLEXITIES.find(c => c.value === saved.timeComplexity)?.color || '#888'}">⏱ ${saved.timeComplexity}</span>` : ''}
          ${saved.spaceComplexity ? `<span class="sol-tc-badge" style="color:${COMPLEXITIES.find(c => c.value === saved.spaceComplexity)?.color || '#888'}">💾 ${saved.spaceComplexity}</span>` : ''}
          ${hasCode && !isEditing ? '<span class="sol-saved-badge">✓ saved</span>' : ''}
        </div>
      </div>

      ${isEditing ? `
      <div class="compiler-box">
        <!-- Language Selector + Run -->
        <div class="compiler-toolbar">
          <div class="lang-selector">
            ${LANGUAGES.map(l => `
              <button class="lang-btn ${lang === l.id ? 'active' : ''}" data-qid="${q.id}" data-approach="${approach}" data-lang="${l.id}" title="${l.label}">
                ${l.icon} ${l.label}
              </button>
            `).join('')}
          </div>
          <div class="compiler-actions">
            ${langInfo.canRun ? `
              <button class="btn-compiler btn-run" data-qid="${q.id}" data-approach="${approach}" title="Run Code (Ctrl+Enter)">▶ Run</button>
            ` : `<span class="run-na">⚠ Run available in JS only</span>`}
          </div>
        </div>

        <!-- Code Editor -->
        <textarea
          class="code-editor"
          id="code-${q.id}-${approach}"
          rows="12"
          spellcheck="false"
          placeholder="// Write your ${approach} approach in ${langInfo.label}..."
        >${saved.code || ''}</textarea>

        <!-- Console Output -->
        <div class="console-panel ${output?.error ? 'has-error' : ''}" id="console-${q.id}-${approach}">
          <div class="console-header">
            <span>🖥 Console Output</span>
            ${output ? `<span class="console-status ${output.error ? 'error' : 'success'}">${output.error ? '✗ Error' : '✓ Passed'}</span>` : ''}
          </div>
          <pre class="console-output">${output ? esc(output.output || output.error || 'No output') : `<span class="console-hint">${langInfo.canRun ? 'Click ▶ Run to execute your code' : `${langInfo.label} execution is editor-only (save your code to track it)`}</span>`}</pre>
        </div>

        <!-- Explanation (MANDATORY) -->
        <div class="explanation-box">
          <label class="explanation-label">📖 Explanation <span class="required-star">*required</span></label>
          <textarea
            class="explanation-editor"
            id="explain-${q.id}-${approach}"
            rows="4"
            placeholder="Explain your approach step-by-step:\n1. What data structure/algorithm did you use?\n2. Why does it work?\n3. Walk through an example..."
          >${saved.explanation || ''}</textarea>
        </div>

        <!-- Complexity Selectors -->
        <div class="complexity-selectors">
          <div class="cx-group">
            <label class="cx-label">⏱ Time Complexity</label>
            <div class="cx-pills">
              ${COMPLEXITIES.map(c => `
                <button class="cx-pill ${saved.timeComplexity === c.value ? 'active' : ''}"
                  data-qid="${q.id}" data-approach="${approach}" data-type="time" data-value="${c.value}"
                  style="${saved.timeComplexity === c.value ? `background:${c.color}22;border-color:${c.color};color:${c.color}` : ''}"
                >${c.label}</button>
              `).join('')}
            </div>
          </div>
          <div class="cx-group">
            <label class="cx-label">💾 Space Complexity</label>
            <div class="cx-pills">
              ${COMPLEXITIES.map(c => `
                <button class="cx-pill ${saved.spaceComplexity === c.value ? 'active' : ''}"
                  data-qid="${q.id}" data-approach="${approach}" data-type="space" data-value="${c.value}"
                  style="${saved.spaceComplexity === c.value ? `background:${c.color}22;border-color:${c.color};color:${c.color}` : ''}"
                >${c.label}</button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Validation Error -->
        ${vErr ? `<div class="validation-error animate-fade-in-up">⚠️ ${vErr}</div>` : ''}

        <!-- Actions -->
        <div class="editor-actions">
          <button class="btn btn-primary btn-sm sol-save" data-qid="${q.id}" data-approach="${approach}">💾 Save Solution</button>
          <button class="btn btn-ghost btn-sm sol-cancel" data-qid="${q.id}" data-approach="${approach}">Cancel</button>
        </div>
      </div>

      ` : `
      ${hasCode ? `
        <div class="saved-solution-view">
          ${saved.language ? `<div class="saved-lang">${LANGUAGES.find(l => l.id === saved.language)?.icon || ''} ${saved.language}</div>` : ''}
          <pre class="sol-code">${esc(saved.code)}</pre>
          ${saved.explanation ? `<div class="saved-explanation">
            <span class="saved-exp-label">📖 Explanation</span>
            <p>${esc(saved.explanation)}</p>
          </div>` : ''}
        </div>
      ` : '<p class="sol-empty">Not written yet</p>'}
      <button class="btn btn-ghost btn-sm sol-edit-btn" data-qid="${q.id}" data-approach="${approach}">${hasCode ? '✏️ Edit' : '➕ Write Code'}</button>
      `}
    </div>`;
  }

  function esc(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ─── ANTIGRAVITY INSIGHT PANEL ───────────────────────────
  function renderInsightPanel(q) {
    const s = DSA_SOLUTIONS[q.id];
    if (!s) return '';
    return `
    <div class="insight-panel">
      <div class="insight-header">
        <span class="insight-icon">🤖</span>
        <span class="insight-title">AntiGravity Engine — Approach Breakdown</span>
      </div>
      <div class="insight-grid">
        <div class="insight-block">
          <div class="insight-label">✅ Optimal Approach</div>
          <p class="insight-text">${esc(s.approach)}</p>
        </div>
        <div class="insight-block">
          <div class="insight-label">🐢 Brute Force</div>
          <p class="insight-text insight-brute">${esc(s.brute)}</p>
        </div>
        <div class="insight-block insight-block-wide">
          <div class="insight-label">⚡ Why This Complexity?</div>
          <p class="insight-text insight-why">${esc(s.why)}</p>
        </div>
        <div class="insight-block">
          <div class="insight-label">💎 Optimal Complexity</div>
          <p class="insight-text insight-opt">${esc(s.optimal)}</p>
        </div>
      </div>
    </div>`;
  }

  // ─── CODE RUNNER ─────────────────────────────────────────
  function runCode(code, qid, approach) {
    const key = `${qid}-${approach}`;
    try {
      let logs = [];
      const sandboxConsole = {
        log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
        error: (...args) => logs.push('ERROR: ' + args.map(String).join(' ')),
        warn: (...args) => logs.push('WARN: ' + args.map(String).join(' ')),
        info: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
        table: (data) => logs.push(JSON.stringify(data, null, 2)),
      };
      const fn = new Function('console', `"use strict";\n${code}`);
      const t0 = performance.now();
      fn(sandboxConsole);
      const ms = (performance.now() - t0).toFixed(2);
      compilerOutput[key] = {
        output: logs.length ? logs.join('\n') + `\n\n✓ Executed in ${ms}ms` : `✓ Code ran successfully (no output) — ${ms}ms`,
        error: ''
      };
    } catch (err) {
      compilerOutput[key] = { output: '', error: `${err.name}: ${err.message}` };
    }
    render();
  }

  // ─── EVENTS ──────────────────────────────────────────────
  function bindEvents() {
    container.querySelectorAll('.qb-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        activeTab = tab.dataset.tab; activeTopic = 'all'; expandedQ = null; editorState = null; render();
      });
    });

    container.querySelectorAll('.topic-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        activeTopic = pill.dataset.topic; expandedQ = null; editorState = null; render();
      });
    });

    container.querySelectorAll('.qb-card-header').forEach(header => {
      header.addEventListener('click', () => {
        const qid = header.dataset.expand;
        expandedQ = expandedQ === qid ? null : qid;
        editorState = null;
        render();
        // Fetch test cases from LeetCode API when expanding a DSA question
        if (expandedQ && activeTab === 'dsa') {
          const allQs = getQuestionsByRound('dsa');
          const question = allQs.find(q => q.id === qid);
          if (question) fetchTestCasesForQuestion(question);
        }
      });
    });

    container.querySelectorAll('.sol-edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const qid = btn.dataset.qid;
        const approach = btn.dataset.approach;
        const sol = getSolutions()[qid]?.[approach] || {};
        const lang = sol.language || 'javascript';
        editorState = { qid, approach, lang };
        // Auto-populate with LeetCode template if no saved code
        if (!sol.code) {
          const template = getCodeTemplate(qid, lang);
          if (template) {
            const solutions = getSolutions();
            if (!solutions[qid]) solutions[qid] = {};
            if (!solutions[qid][approach]) solutions[qid][approach] = {};
            solutions[qid][approach].code = template;
            saveSolutions(solutions);
          }
        }
        render();
      });
    });

    // Language switching
    container.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (editorState) editorState.lang = btn.dataset.lang;
        render();
      });
    });

    // Run code
    container.querySelectorAll('.btn-run').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const ta = container.querySelector(`#code-${btn.dataset.qid}-${btn.dataset.approach}`);
        if (ta && ta.value.trim()) runCode(ta.value, btn.dataset.qid, btn.dataset.approach);
      });
    });

    // Ctrl+Enter to run + Tab for indent
    container.querySelectorAll('.code-editor').forEach(editor => {
      editor.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          const parts = editor.id.replace('code-', '');
          const lastDash = parts.lastIndexOf('-');
          const qid = parts.substring(0, lastDash);
          const approach = parts.substring(lastDash + 1);
          if (editor.value.trim()) runCode(editor.value, qid, approach);
        }
        if (e.key === 'Tab') {
          e.preventDefault();
          const s = editor.selectionStart, end = editor.selectionEnd;
          editor.value = editor.value.substring(0, s) + '  ' + editor.value.substring(end);
          editor.selectionStart = editor.selectionEnd = s + 2;
        }
      });
    });

    // Complexity pills
    container.querySelectorAll('.cx-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        const { qid, approach, type, value } = pill.dataset;
        const solutions = getSolutions();
        if (!solutions[qid]) solutions[qid] = {};
        if (!solutions[qid][approach]) solutions[qid][approach] = {};
        const key = type === 'time' ? 'timeComplexity' : 'spaceComplexity';
        solutions[qid][approach][key] = solutions[qid][approach][key] === value ? '' : value;
        saveSolutions(solutions);
        render();
      });
    });

    // Save with VALIDATION
    container.querySelectorAll('.sol-save').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const { qid, approach } = btn.dataset;
        const codeEl = container.querySelector(`#code-${qid}-${approach}`);
        const explainEl = container.querySelector(`#explain-${qid}-${approach}`);
        const code = codeEl?.value?.trim() || '';
        const explanation = explainEl?.value?.trim() || '';
        const compKey = `${qid}-${approach}`;

        // VALIDATION: both code and explanation are mandatory
        if (!code && !explanation) {
          validationErrors[compKey] = 'Both code and explanation are required. Write your solution code and explain your approach.';
          render(); return;
        }
        if (!code) {
          validationErrors[compKey] = 'Code is required. Write your solution before saving.';
          render(); return;
        }
        if (!explanation) {
          validationErrors[compKey] = 'Explanation is required. Describe your approach step-by-step.';
          render(); return;
        }

        // Save
        const solutions = getSolutions();
        if (!solutions[qid]) solutions[qid] = {};
        if (!solutions[qid][approach]) solutions[qid][approach] = {};
        solutions[qid][approach].code = code;
        solutions[qid][approach].explanation = explanation;
        solutions[qid][approach].language = editorState?.lang || 'javascript';
        saveSolutions(solutions);
        delete validationErrors[compKey];
        editorState = null;
        render();
      });
    });

    container.querySelectorAll('.sol-cancel').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        delete validationErrors[`${btn.dataset.qid}-${btn.dataset.approach}`];
        editorState = null;
        render();
      });
    });
  }

  render();
}


// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════
function addQBStyles(container) {
  if (container.querySelector('#qb-styles')) return;
  const style = document.createElement('style');
  style.id = 'qb-styles';
  style.textContent = `
  .qb { max-width: 1000px; }
  .qb-hero { text-align: center; padding: var(--space-10) 0 var(--space-6); }
  .hero-gradient-qb {
    background: linear-gradient(135deg, var(--accent-indigo), var(--accent-cyan), var(--accent-emerald));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .qb-stats-row { display: flex; gap: var(--space-3); justify-content: center; align-items: center; margin-top: var(--space-3); flex-wrap: wrap; }
  .qb-stat { font-size: 13px; color: var(--text-muted); }
  .qb-stat-sep { color: rgba(255,255,255,0.1); }
  .qb-solved { color: var(--accent-emerald); font-weight: 600; }
  .qb-easy { color: var(--accent-emerald); }
  .qb-medium { color: var(--accent-amber); }
  .qb-hard { color: var(--accent-rose); }

  /* AntiGravity Insight Panel */
  .insight-panel {
    margin-bottom: var(--space-5); padding: var(--space-5);
    border-radius: var(--radius-xl);
    background: linear-gradient(135deg, rgba(99,102,241,0.07), rgba(6,182,212,0.04));
    border: 1px solid rgba(99,102,241,0.2);
  }
  .insight-header { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-4); }
  .insight-icon { font-size: 18px; }
  .insight-title { font-size: 13px; font-weight: 700; color: var(--accent-indigo); letter-spacing: 0.02em; }
  .insight-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
  .insight-block-wide { grid-column: 1 / -1; }
  .insight-block {
    background: rgba(0,0,0,0.25); border-radius: var(--radius-lg);
    padding: var(--space-3); border: 1px solid rgba(255,255,255,0.05);
  }
  .insight-label { font-size: 11px; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.08em; }
  .insight-text { font-size: 13px; color: var(--text-secondary); line-height: 1.65; margin: 0; }
  .insight-brute { color: #f87171; }
  .insight-why { color: var(--accent-cyan); }
  .insight-opt { color: var(--accent-emerald); font-weight: 600; }

  .qb-tabs { display: flex; gap: var(--space-2); margin-bottom: var(--space-4); flex-wrap: wrap; }
  .qb-tab {
    padding: var(--space-3) var(--space-5); border-radius: var(--radius-full);
    background: rgba(255,255,255,0.04); border: 1px solid var(--glass-border);
    color: var(--text-secondary); font-weight: 600; font-size: var(--text-sm);
    cursor: pointer; transition: all var(--transition-fast); display: flex; align-items: center; gap: var(--space-2);
    font-family: var(--font-sans);
  }
  .qb-tab:hover { background: rgba(255,255,255,0.08); }
  .qb-tab.active { background: var(--accent-indigo); color: white; border-color: var(--accent-indigo); }
  .tab-count { background: rgba(255,255,255,0.15); padding: 1px 8px; border-radius: var(--radius-full); font-size: 11px; font-weight: 700; }

  .topic-filter {
    display: flex; gap: var(--space-2); margin-bottom: var(--space-6); flex-wrap: wrap;
    padding: var(--space-3); background: rgba(255,255,255,0.02); border-radius: var(--radius-lg);
  }
  .topic-pill {
    padding: 6px 14px; border-radius: var(--radius-full); font-size: 12px; font-weight: 600;
    background: rgba(255,255,255,0.04); border: 1px solid transparent;
    color: var(--text-muted); cursor: pointer; transition: all var(--transition-fast);
    display: flex; align-items: center; gap: 4px; font-family: var(--font-sans);
  }
  .topic-pill:hover { background: rgba(255,255,255,0.08); color: var(--text-primary); }
  .topic-pill.active { background: rgba(99,102,241,0.15); color: var(--accent-indigo); border-color: var(--accent-indigo); }
  .tp-count { font-size: 10px; opacity: 0.6; }

  .topic-group { margin-bottom: var(--space-6); }
  .topic-heading { font-size: var(--text-sm); font-weight: 700; color: var(--text-secondary); margin-bottom: var(--space-3); padding-left: var(--space-2); }
  .topic-count { color: var(--text-muted); font-weight: 500; }

  .qb-list { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-8); }
  .qb-card { border-radius: var(--radius-lg); transition: all var(--transition-fast); overflow: hidden; }
  .qb-card.has-solution { border-left: 3px solid var(--accent-emerald); }
  .qb-card-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: var(--space-3) var(--space-4); cursor: pointer; transition: background var(--transition-fast);
  }
  .qb-card-header:hover { background: rgba(255,255,255,0.03); }
  .qb-card-left { display: flex; align-items: center; gap: var(--space-3); min-width: 0; }
  .qb-card-right { display: flex; align-items: center; gap: var(--space-2); flex-shrink: 0; }
  .lc-num { font-size: 12px; color: var(--text-muted); font-weight: 700; min-width: 40px; }
  .qb-card-title { font-size: var(--text-sm); font-weight: 600; }
  .sol-badge { font-size: 12px; }
  .expand-arrow { font-size: 10px; color: var(--text-muted); }

  .qb-card-body { padding: 0 var(--space-4) var(--space-4); }
  .qb-statement { font-size: 13px; color: var(--text-secondary); line-height: 1.7; margin-bottom: var(--space-3); }
  .qb-tags { display: flex; gap: var(--space-2); flex-wrap: wrap; margin-bottom: var(--space-4); }
  .q-tag { padding: 2px 8px; border-radius: var(--radius-full); background: var(--bg-surface); font-size: 11px; color: var(--text-muted); font-weight: 500; }
  .topic-tag { background: rgba(99,102,241,0.12); color: var(--accent-indigo); }
  .lc-link { font-size: 11px; color: var(--accent-cyan); text-decoration: none; font-weight: 600; }

  /* Complexity Chart */
  .complexity-chart {
    padding: var(--space-5); border-radius: var(--radius-lg);
    background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06); margin-bottom: var(--space-5);
  }
  .glass-dark { backdrop-filter: blur(12px); }
  .cc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
  .cc-title { font-size: 14px; font-weight: 700; }
  .cc-empty { font-size: 11px; color: var(--text-muted); font-style: italic; }
  .cc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); }
  .cc-col-label { font-size: 12px; font-weight: 700; color: var(--text-secondary); margin-bottom: var(--space-3); }
  .cc-bar-row { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-2); }
  .cc-bar-label { font-size: 11px; font-weight: 700; min-width: 70px; }
  .cc-bar-track { flex: 1; height: 8px; border-radius: 4px; background: rgba(255,255,255,0.06); overflow: hidden; }
  .cc-bar-fill { height: 100%; border-radius: 4px; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 0 8px rgba(255,255,255,0.1); }
  .cc-bar-value { font-size: 11px; font-weight: 700; min-width: 65px; text-align: right; }
  .cc-bar-na { font-size: 11px; color: var(--text-muted); flex: 1; text-align: center; }
  .cc-scale { display: flex; justify-content: space-between; margin-top: var(--space-4); padding-top: var(--space-3); border-top: 1px solid rgba(255,255,255,0.06); }
  .cc-scale-item { font-size: 10px; font-weight: 600; }
  .cc-placeholder { text-align: center; padding: var(--space-4); }
  .cc-placeholder-bars { display: flex; flex-direction: column; gap: 4px; margin-bottom: var(--space-3); }
  .cc-placeholder-bar { height: 6px; border-radius: 3px; background: rgba(255,255,255,0.06); }
  .cc-placeholder-text { font-size: 11px; color: var(--text-muted); }

  /* Solution Editor */
  .sol-editor { border-top: 1px solid var(--glass-border); padding-top: var(--space-4); }
  .sol-editor-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3); }
  .sol-editor-title { font-size: 14px; font-weight: 700; }
  .sol-editor-hint { font-size: 11px; color: var(--accent-amber); font-weight: 600; }
  .sol-approach { margin-bottom: var(--space-4); padding: var(--space-3); border-radius: var(--radius-md); background: rgba(0,0,0,0.2); }
  .sol-approach.filled { background: rgba(0,0,0,0.3); }
  .sol-approach-header { display: flex; justify-content: space-between; align-items: center; padding-left: var(--space-3); margin-bottom: var(--space-2); }
  .sol-approach-label { font-size: 13px; font-weight: 700; }
  .sol-approach-meta { display: flex; gap: var(--space-2); align-items: center; flex-wrap: wrap; }
  .sol-lang-badge { font-size: 10px; font-weight: 700; color: var(--accent-cyan); background: rgba(6,182,212,0.12); padding: 1px 8px; border-radius: var(--radius-full); }
  .sol-tc-badge { font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: var(--radius-full); background: rgba(0,0,0,0.3); }
  .sol-saved-badge { font-size: 10px; color: var(--accent-emerald); background: rgba(16,185,129,0.12); padding: 1px 8px; border-radius: var(--radius-full); }
  .sol-code {
    background: rgba(0,0,0,0.4); border: 1px solid var(--glass-border);
    border-radius: var(--radius-md); padding: var(--space-3);
    font-family: var(--font-mono); font-size: 13px; line-height: 1.6;
    overflow-x: auto; color: var(--text-secondary); white-space: pre-wrap; max-height: 200px; overflow-y: auto;
  }
  .sol-empty { font-size: 12px; color: var(--text-muted); font-style: italic; margin-bottom: var(--space-2); }
  .sol-edit-btn { font-size: 12px !important; }

  /* Saved solution view */
  .saved-solution-view { margin-bottom: var(--space-2); }
  .saved-lang { font-size: 10px; font-weight: 700; color: var(--accent-cyan); margin-bottom: var(--space-2); }
  .saved-explanation {
    margin-top: var(--space-2); padding: var(--space-3); background: rgba(99,102,241,0.06);
    border-radius: var(--radius-md); border-left: 3px solid var(--accent-indigo);
  }
  .saved-exp-label { font-size: 11px; font-weight: 700; color: var(--accent-indigo); }
  .saved-explanation p { font-size: 12px; color: var(--text-secondary); line-height: 1.6; margin-top: 4px; white-space: pre-wrap; }

  /* Compiler Box */
  .compiler-box { border-radius: var(--radius-md); overflow: hidden; border: 1px solid rgba(99,102,241,0.2); background: rgba(0,0,0,0.2); }
  .compiler-toolbar {
    display: flex; justify-content: space-between; align-items: center;
    padding: 6px 10px; background: rgba(99,102,241,0.08); border-bottom: 1px solid rgba(99,102,241,0.15);
  }
  .lang-selector { display: flex; gap: 2px; }
  .lang-btn {
    padding: 4px 10px; border-radius: var(--radius-full); font-size: 11px; font-weight: 700;
    background: transparent; border: 1px solid transparent; color: var(--text-muted);
    cursor: pointer; transition: all var(--transition-fast); font-family: var(--font-sans);
  }
  .lang-btn:hover { background: rgba(255,255,255,0.06); color: var(--text-primary); }
  .lang-btn.active { background: rgba(99,102,241,0.2); color: var(--accent-indigo); border-color: rgba(99,102,241,0.3); }
  .run-na { font-size: 11px; color: var(--text-muted); font-style: italic; }
  .compiler-actions { display: flex; gap: var(--space-2); }
  .btn-compiler {
    padding: 4px 14px; border-radius: var(--radius-full); font-size: 12px; font-weight: 700;
    border: none; cursor: pointer; transition: all var(--transition-fast); font-family: var(--font-sans);
  }
  .btn-run {
    background: linear-gradient(135deg, #10b981, #059669); color: white;
    box-shadow: 0 2px 8px rgba(16,185,129,0.3);
  }
  .btn-run:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(16,185,129,0.4); }

  .code-editor {
    width: 100%; padding: var(--space-4); border: none;
    background: rgba(0,0,0,0.5); color: #e2e8f0;
    font-family: 'JetBrains Mono', 'Fira Code', var(--font-mono); font-size: 13px;
    line-height: 1.7; resize: vertical; outline: none; tab-size: 2; min-height: 180px;
  }
  .code-editor:focus { box-shadow: inset 0 0 0 1px rgba(99,102,241,0.3); }
  .code-editor::placeholder { color: rgba(255,255,255,0.2); }

  .console-panel { border-top: 1px solid rgba(255,255,255,0.06); background: rgba(0,0,0,0.6); }
  .console-panel.has-error { border-top-color: rgba(239,68,68,0.3); }
  .console-header { display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; font-size: 11px; font-weight: 600; color: var(--text-muted); }
  .console-status { font-weight: 700; }
  .console-status.success { color: var(--accent-emerald); }
  .console-status.error { color: var(--accent-rose); }
  .console-output {
    padding: 8px 12px; font-family: var(--font-mono); font-size: 12px;
    line-height: 1.6; color: #a3e635; white-space: pre-wrap; max-height: 200px; overflow-y: auto; margin: 0;
  }
  .has-error .console-output { color: #fca5a5; }
  .console-hint { color: var(--text-muted); font-style: italic; }

  /* Mandatory Explanation */
  .explanation-box { padding: var(--space-3) var(--space-4); border-top: 1px solid rgba(255,255,255,0.06); }
  .explanation-label { font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 6px; }
  .required-star { color: var(--accent-rose); font-size: 10px; font-weight: 600; }
  .explanation-editor {
    width: 100%; padding: var(--space-3); border-radius: var(--radius-md);
    background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border);
    color: var(--text-primary); font-family: var(--font-sans); font-size: 13px;
    line-height: 1.6; resize: vertical; outline: none;
  }
  .explanation-editor:focus { border-color: var(--accent-indigo); }
  .explanation-editor::placeholder { color: rgba(255,255,255,0.2); }

  /* Validation Error */
  .validation-error {
    margin: var(--space-2) var(--space-4); padding: 8px 14px; border-radius: var(--radius-md);
    background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
    color: var(--accent-rose); font-size: 12px; font-weight: 600;
  }

  .complexity-selectors {
    padding: var(--space-3) var(--space-4);
    border-top: 1px solid rgba(255,255,255,0.06);
    display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);
  }
  .cx-label { font-size: 11px; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px; display: block; }
  .cx-pills { display: flex; flex-wrap: wrap; gap: 4px; }
  .cx-pill {
    padding: 3px 10px; border-radius: var(--radius-full); font-size: 11px; font-weight: 700;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    color: var(--text-muted); cursor: pointer; transition: all var(--transition-fast); font-family: var(--font-mono);
  }
  .cx-pill:hover { background: rgba(255,255,255,0.08); color: var(--text-primary); }
  .cx-pill.active { font-weight: 800; }

  .editor-actions {
    padding: var(--space-3) var(--space-4);
    border-top: 1px solid rgba(255,255,255,0.06);
    display: flex; gap: var(--space-2);
  }

  /* Test Cases Panel */
  .tc-panel { padding: var(--space-4); border-radius: var(--radius-lg); background: rgba(0,0,0,0.3); border: 1px solid rgba(34,211,238,0.15); margin-bottom: var(--space-4); }
  .tc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3); }
  .tc-title { font-size: 14px; font-weight: 700; }
  .tc-count { font-size: 11px; font-weight: 700; color: var(--accent-cyan); background: rgba(34,211,238,0.12); padding: 1px 8px; border-radius: var(--radius-full); margin-left: 6px; }
  .tc-source { font-size: 10px; color: var(--text-muted); font-style: italic; }
  .tc-grid { display: flex; flex-direction: column; gap: var(--space-2); }
  .tc-case { padding: var(--space-3); border-radius: var(--radius-md); background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.04); }
  .tc-case-id { font-size: 11px; font-weight: 700; color: var(--accent-cyan); margin-bottom: var(--space-2); }
  .tc-io { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
  .tc-label { font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px; }
  .tc-pre { font-family: var(--font-mono); font-size: 12px; line-height: 1.5; color: var(--text-secondary); margin: 0; white-space: pre-wrap; background: rgba(0,0,0,0.3); padding: 6px 10px; border-radius: var(--radius-sm); }
  .tc-exp { color: var(--accent-emerald); }
  .tc-explanation { font-size: 11px; color: var(--text-muted); margin-top: var(--space-2); }
  .tc-loading { text-align: center; padding: var(--space-4); color: var(--text-muted); font-size: 13px; }
  .tc-spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(34,211,238,0.3); border-top-color: var(--accent-cyan); border-radius: 50%; animation: spin 0.6s linear infinite; vertical-align: middle; margin-right: 6px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .tc-error { text-align: center; padding: var(--space-3); color: var(--accent-amber); font-size: 12px; }
  .tc-empty { text-align: center; padding: var(--space-3); color: var(--text-muted); font-size: 12px; }

  .empty-state { text-align: center; padding: var(--space-16) 0; }
  .empty-state p { color: var(--text-muted); margin-top: var(--space-3); }

  @media (max-width: 768px) {
    .topic-filter { gap: var(--space-1); }
    .topic-pill { font-size: 11px; padding: 4px 10px; }
    .cc-grid { grid-template-columns: 1fr; }
    .complexity-selectors { grid-template-columns: 1fr; }
    .lang-selector { flex-wrap: wrap; }
  }
  `;
  container.appendChild(style);
}
