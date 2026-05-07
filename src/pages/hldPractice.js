// ═══════════════════════════════════════════════════════════
// HLD Practice Page — MCQs, AI Chat, Situation-Based Questions
// ═══════════════════════════════════════════════════════════

import { hldMCQs } from '../data/hldMCQs.js';
import { hldScenarios, chatResponses } from '../data/hldScenarios.js';
import { callGrokAPI } from '../engine/api.js';
import { AGENT_PROFILES } from '../engine/agents.js';

export function renderHLDPracticePage(container) {
    let activeTab = 'mcq';
    let mcqState = { current: 0, score: 0, answered: new Set(), selected: {} };
    let chatMessages = [];
    let expandedScenario = null;

    function render() {
        container.innerHTML = `
        <div class="page-container hld-practice-page">
          <div class="res-hero animate-fade-in-up">
            <div class="hero-badge badge badge-amber">🏛️ HLD Practice Arena</div>
            <h1 class="hero-title">
              System Design <span class="hero-gradient-amber">Practice</span>
            </h1>
            <p class="hero-subtitle">MCQ quizzes, interactive AI chat, and real-world scenario analysis to ace your HLD interviews.</p>
          </div>

          <div class="hld-tabs animate-fade-in-up">
            <button class="hld-tab ${activeTab === 'mcq' ? 'active' : ''}" data-tab="mcq">
              <span>📝</span> MCQ Quiz <span class="tab-count">${hldMCQs.length}</span>
            </button>
            <button class="hld-tab ${activeTab === 'chat' ? 'active' : ''}" data-tab="chat">
              <span>💬</span> AI Chat
            </button>
            <button class="hld-tab ${activeTab === 'scenarios' ? 'active' : ''}" data-tab="scenarios">
              <span>🎯</span> Scenarios <span class="tab-count">${hldScenarios.length}</span>
            </button>
            <button class="hld-tab ${activeTab === 'excalidraw' ? 'active' : ''}" data-tab="excalidraw">
              <span>📐</span> Excalidraw Critique
            </button>
          </div>

          <div class="hld-content" id="hld-content"></div>
        </div>
        `;
        addHLDStyles(container);
        renderTabContent();
        bindTabEvents();
    }

    function renderTabContent() {
        const content = container.querySelector('#hld-content');
        switch (activeTab) {
            case 'mcq': renderMCQ(content); break;
            case 'chat': renderChat(content); break;
            case 'scenarios': renderScenarios(content); break;
            case 'excalidraw': renderExcalidraw(content); break;
        }
    }

    // ═══════════════════════════════════════════════════════════
    // MCQ QUIZ
    // ═══════════════════════════════════════════════════════════
    function renderMCQ(content) {
        const q = hldMCQs[mcqState.current];
        const isAnswered = mcqState.answered.has(q.id);
        const selectedIdx = mcqState.selected[q.id];

        content.innerHTML = `
        <div class="mcq-container animate-fade-in-up">
          <div class="mcq-progress">
            <div class="mcq-progress-bar">
              <div class="mcq-progress-fill" style="width: ${((mcqState.current + 1) / hldMCQs.length) * 100}%"></div>
            </div>
            <span class="mcq-progress-text">${mcqState.current + 1} / ${hldMCQs.length}</span>
            <span class="mcq-score">Score: ${mcqState.score}/${mcqState.answered.size}</span>
          </div>

          <div class="mcq-card glass">
            <div class="mcq-header">
              <span class="badge badge-amber">${q.topic}</span>
              <span class="badge badge-${q.difficulty === 'easy' ? 'emerald' : q.difficulty === 'hard' ? 'rose' : 'amber'}">${q.difficulty}</span>
            </div>
            <h3 class="mcq-question">${q.question}</h3>
            <div class="mcq-options">
              ${q.options.map((opt, i) => {
            let optClass = 'mcq-option';
            if (isAnswered) {
                if (i === q.correct) optClass += ' correct';
                else if (i === selectedIdx && i !== q.correct) optClass += ' wrong';
            } else if (i === selectedIdx) {
                optClass += ' selected';
            }
            return `<button class="${optClass}" data-idx="${i}" ${isAnswered ? 'disabled' : ''}>
                  <span class="mcq-option-letter">${String.fromCharCode(65 + i)}</span>
                  <span class="mcq-option-text">${opt}</span>
                  ${isAnswered && i === q.correct ? '<span class="mcq-check">✓</span>' : ''}
                  ${isAnswered && i === selectedIdx && i !== q.correct ? '<span class="mcq-cross">✗</span>' : ''}
                </button>`;
        }).join('')}
            </div>

            ${isAnswered ? `<div class="mcq-explanation glass animate-fade-in-up">
              <strong>💡 Explanation:</strong><br>${q.explanation}
            </div>` : ''}

            <div class="mcq-nav">
              <button class="btn btn-secondary btn-sm" id="mcq-prev" ${mcqState.current === 0 ? 'disabled' : ''}>← Previous</button>
              ${!isAnswered ? `<button class="btn btn-primary btn-sm" id="mcq-submit" ${selectedIdx === undefined ? 'disabled' : ''}>Submit Answer</button>` : ''}
              <button class="btn btn-secondary btn-sm" id="mcq-next" ${mcqState.current === hldMCQs.length - 1 ? 'disabled' : ''}>Next →</button>
            </div>
          </div>
        </div>
        `;

        // Option selection
        content.querySelectorAll('.mcq-option:not([disabled])').forEach(btn => {
            btn.addEventListener('click', () => {
                content.querySelectorAll('.mcq-option').forEach(o => o.classList.remove('selected'));
                btn.classList.add('selected');
                mcqState.selected[q.id] = parseInt(btn.dataset.idx);
                const submitBtn = content.querySelector('#mcq-submit');
                if (submitBtn) submitBtn.disabled = false;
            });
        });

        // Submit
        const submitBtn = content.querySelector('#mcq-submit');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                mcqState.answered.add(q.id);
                if (mcqState.selected[q.id] === q.correct) mcqState.score++;
                renderMCQ(content);
            });
        }

        // Nav
        const prevBtn = content.querySelector('#mcq-prev');
        const nextBtn = content.querySelector('#mcq-next');
        if (prevBtn) prevBtn.addEventListener('click', () => { mcqState.current--; renderMCQ(content); });
        if (nextBtn) nextBtn.addEventListener('click', () => { mcqState.current++; renderMCQ(content); });
    }

    // ═══════════════════════════════════════════════════════════
    // AI CHAT
    // ═══════════════════════════════════════════════════════════
    function renderChat(content) {
        if (chatMessages.length === 0) {
            chatMessages.push({ role: 'ai', text: chatResponses.greetings[0] });
        }

        content.innerHTML = `
        <div class="chat-container animate-fade-in-up">
          <div class="chat-window glass" id="chat-window">
            ${chatMessages.map(m => `
              <div class="chat-msg ${m.role}">
                <div class="chat-msg-avatar">${m.role === 'ai' ? '🤖' : '👤'}</div>
                <div class="chat-msg-bubble">${formatMarkdown(m.text)}</div>
              </div>
            `).join('')}
          </div>
          <div class="chat-suggestions" id="chat-suggestions">
            <button class="chat-suggestion" data-text="Explain caching strategies">🗂 Caching</button>
            <button class="chat-suggestion" data-text="Tell me about database design">🗄 Databases</button>
            <button class="chat-suggestion" data-text="How do I scale a system?">📈 Scaling</button>
            <button class="chat-suggestion" data-text="Microservices vs monolith">🔧 Microservices</button>
            <button class="chat-suggestion" data-text="Explain CAP theorem and consistency">🔄 Consistency</button>
          </div>
          <div class="chat-input-bar">
            <input type="text" class="chat-input" id="chat-input" placeholder="Ask me anything about system design..." autocomplete="off" />
            <button class="btn btn-primary btn-sm chat-send" id="chat-send">Send →</button>
          </div>
        </div>
        `;

        // Scroll to bottom
        const window_ = content.querySelector('#chat-window');
        window_.scrollTop = window_.scrollHeight;

        // Send
        const input = content.querySelector('#chat-input');
        const sendBtn = content.querySelector('#chat-send');

        function sendMessage() {
            const text = input.value.trim();
            if (!text) return;
            chatMessages.push({ role: 'user', text });
            input.value = '';
            renderChat(content);

            // AI response after a short delay
            setTimeout(() => {
                const response = generateChatResponse(text);
                chatMessages.push({ role: 'ai', text: response });
                renderChat(content);
            }, 500);
        }

        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });

        // Suggestions
        content.querySelectorAll('.chat-suggestion').forEach(btn => {
            btn.addEventListener('click', () => {
                input.value = btn.dataset.text;
                sendMessage();
            });
        });

        // Focus input
        input.focus();
    }

    function generateChatResponse(input) {
        const text = input.toLowerCase();

        // Check topic matches
        for (const [, topic] of Object.entries(chatResponses.topics)) {
            if (topic.keywords && topic.keywords.some(k => text.includes(k))) {
                const responses = topic.responses;
                return responses[Math.floor(Math.random() * responses.length)];
            }
        }

        // Default/general response
        const general = chatResponses.topics.general.responses;
        return general[Math.floor(Math.random() * general.length)];
    }

    function formatMarkdown(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n- /g, '<br>• ')
            .replace(/\n(\d+)\. /g, '<br>$1. ')
            .replace(/\n\|/g, '<br>|')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    // ═══════════════════════════════════════════════════════════
    // SCENARIOS
    // ═══════════════════════════════════════════════════════════
    function renderScenarios(content) {
        content.innerHTML = `
        <div class="scenarios-grid">
          ${hldScenarios.map((s, i) => `
            <div class="scenario-card glass animate-fade-in-up" style="animation-delay: ${i * 60}ms" data-color="${s.color}" data-id="${s.id}">
              <div class="scenario-header">
                <span class="scenario-icon">${s.icon}</span>
                <span class="badge badge-${s.difficulty === 'hard' ? 'rose' : 'amber'}">${s.difficulty}</span>
              </div>
              <h3 class="scenario-title">${s.title}</h3>
              <p class="scenario-situation">${s.situation.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
              <button class="btn btn-secondary btn-sm scenario-expand-btn" data-id="${s.id}">
                ${expandedScenario === s.id ? 'Hide Solution ↑' : 'Think → Reveal Solution ↓'}
              </button>
              ${expandedScenario === s.id ? `
                <div class="scenario-solution animate-fade-in-up">
                  <h4>✅ Key Points to Address:</h4>
                  <ul>${s.keyPoints.map(p => `<li>${p}</li>`).join('')}</ul>
                  <h4>🤔 Follow-up Questions:</h4>
                  <ul>${s.followUps.map(f => `<li>${f}</li>`).join('')}</ul>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
        `;

        content.querySelectorAll('.scenario-expand-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                expandedScenario = expandedScenario === btn.dataset.id ? null : btn.dataset.id;
                renderScenarios(content);
            });
        });
    }

    // ═══════════════════════════════════════════════════════════
    // EXCALIDRAW CRITIQUE
    // ═══════════════════════════════════════════════════════════
    function renderExcalidraw(content) {
        content.innerHTML = `
        <div class="excalidraw-container animate-fade-in-up" style="max-width: 800px; margin: 0 auto; text-align: center;">
          <h3 class="config-title">Upload .excalidraw File</h3>
          <p class="config-hint" style="margin-bottom: 2rem;">Our FAANG Principal SRE Agent will critique your system architecture.</p>
          
          <div class="upload-box glass" style="padding: 3rem; border-radius: var(--radius-xl); border: 2px dashed var(--glass-border); cursor: pointer; transition: all var(--transition-base);">
             <div style="font-size: 48px; margin-bottom: 1rem;">📁</div>
             <p style="color: var(--text-secondary); font-size: var(--text-lg); font-weight: 600;">Click to upload or drag and drop</p>
             <p style="color: var(--text-muted); font-size: var(--text-sm); margin-top: 0.5rem;">.excalidraw files only</p>
             <input type="file" id="excalidraw-file" accept=".excalidraw" style="display: none;" />
          </div>

          <div id="excalidraw-results" style="display: none; margin-top: 2rem; text-align: left; background: var(--bg-surface); padding: var(--space-6); border-radius: var(--radius-xl); border: 1px solid var(--glass-border);">
            <!-- Agent Critique will appear here -->
          </div>
        </div>
        `;

        const uploadBox = content.querySelector('.upload-box');
        const fileInput = content.querySelector('#excalidraw-file');

        uploadBox.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    uploadBox.innerHTML = '<div style="font-size: 24px; color: var(--accent-indigo);">Parsing Architecture & Sending to Agent...</div>';
                    
                    const excalidrawJson = JSON.parse(event.target.result);
                    // Extract text labels and basic element types to feed to the LLM
                    const elements = excalidrawJson.elements || [];
                    const textElements = elements.filter(el => el.type === 'text').map(el => el.text).join(', ');
                    const objectTypes = elements.map(el => el.type).reduce((acc, val) => {
                        acc[val] = (acc[val] || 0) + 1;
                        return acc;
                    }, {});

                    const architectureSummary = `
Architecture Contains:
- Text Labels: ${textElements}
- Element Counts: ${JSON.stringify(objectTypes)}
                    `;

                    const prompt = AGENT_PROFILES.CODE_REVIEWER.systemPrompt;
                    const response = await callGrokAPI(prompt, "Please critique this architecture diagram data: " + architectureSummary);

                    const resultsDiv = content.querySelector('#excalidraw-results');
                    resultsDiv.style.display = 'block';
                    resultsDiv.innerHTML = `
                        <h4 style="color: var(--accent-rose); margin-bottom: 1rem;">FAANG Principal SRE Critique</h4>
                        <div class="chat-msg-bubble" style="background: rgba(255,255,255,0.05); white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${response.replace(/\n/g, '<br>')}</div>
                    `;
                    
                    uploadBox.style.display = 'none';

                } catch (err) {
                    alert('Invalid .excalidraw file or API error: ' + err.message);
                    renderExcalidraw(content); // Reset
                }
            };
            reader.readAsText(file);
        });
    }

    function bindTabEvents() {
        container.querySelectorAll('.hld-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                activeTab = tab.dataset.tab;
                render();
            });
        });
    }

    render();
}


function addHLDStyles(container) {
    if (container.querySelector('#hld-styles')) return;
    const style = document.createElement('style');
    style.id = 'hld-styles';
    style.textContent = `
    /* ── Hero ──────────────────────────────────────────────── */
    .hero-gradient-amber {
      background: linear-gradient(135deg, var(--accent-amber), var(--accent-rose), #f97316);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }

    /* ── Tabs ─────────────────────────────────────────────── */
    .hld-tabs {
      display: flex; gap: var(--space-2); margin-bottom: var(--space-6);
      border-bottom: 1px solid var(--glass-border); padding-bottom: var(--space-2);
    }
    .hld-tab {
      display: inline-flex; align-items: center; gap: var(--space-2);
      padding: var(--space-3) var(--space-5); border-radius: var(--radius-md) var(--radius-md) 0 0;
      background: transparent; border: none; color: var(--text-muted);
      font-size: var(--text-sm); font-weight: 600; cursor: pointer;
      transition: all var(--transition-fast); font-family: var(--font-sans);
    }
    .hld-tab:hover { color: var(--text-primary); background: var(--bg-surface); }
    .hld-tab.active {
      color: var(--accent-amber); background: rgba(245,158,11,0.08);
      border-bottom: 2px solid var(--accent-amber); margin-bottom: -3px;
    }
    .hld-tab .tab-count {
      background: rgba(255,255,255,0.08); padding: 1px 8px;
      border-radius: var(--radius-full); font-size: 11px;
    }
    .hld-tab.active .tab-count { background: rgba(245,158,11,0.15); color: var(--accent-amber); }

    /* ── MCQ ──────────────────────────────────────────────── */
    .mcq-container { max-width: 720px; margin: 0 auto; }
    .mcq-progress {
      display: flex; align-items: center; gap: var(--space-4); margin-bottom: var(--space-5);
    }
    .mcq-progress-bar {
      flex: 1; height: 6px; background: var(--bg-surface);
      border-radius: var(--radius-full); overflow: hidden;
    }
    .mcq-progress-fill {
      height: 100%; background: linear-gradient(90deg, var(--accent-amber), var(--accent-rose));
      border-radius: var(--radius-full); transition: width var(--transition-base);
    }
    .mcq-progress-text { font-size: var(--text-xs); color: var(--text-muted); font-weight: 600; white-space: nowrap; }
    .mcq-score { font-size: var(--text-xs); color: var(--accent-emerald); font-weight: 700; white-space: nowrap; }
    .mcq-card { padding: var(--space-8); border-radius: var(--radius-xl); }
    .mcq-header { display: flex; gap: var(--space-2); margin-bottom: var(--space-4); }
    .mcq-question { font-size: var(--text-lg); font-weight: 700; margin-bottom: var(--space-6); line-height: 1.5; }
    .mcq-options { display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-6); }
    .mcq-option {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-4) var(--space-5); border-radius: var(--radius-lg);
      background: var(--bg-surface); border: 1px solid var(--glass-border);
      color: var(--text-primary); cursor: pointer; transition: all var(--transition-fast);
      font-size: var(--text-sm); text-align: left; font-family: var(--font-sans);
    }
    .mcq-option:not([disabled]):hover { border-color: rgba(255,255,255,0.2); background: var(--bg-surface-hover); }
    .mcq-option.selected { border-color: var(--accent-indigo); background: rgba(99,102,241,0.08); }
    .mcq-option.correct { border-color: var(--accent-emerald); background: rgba(16,185,129,0.1); }
    .mcq-option.wrong { border-color: var(--accent-rose); background: rgba(244,63,94,0.08); opacity: 0.7; }
    .mcq-option-letter {
      width: 28px; height: 28px; border-radius: var(--radius-sm);
      background: rgba(255,255,255,0.06); display: flex; align-items: center;
      justify-content: center; font-weight: 700; font-size: var(--text-xs); flex-shrink: 0;
    }
    .mcq-option.correct .mcq-option-letter { background: rgba(16,185,129,0.2); color: var(--accent-emerald); }
    .mcq-option.wrong .mcq-option-letter { background: rgba(244,63,94,0.2); color: var(--accent-rose); }
    .mcq-option-text { flex: 1; }
    .mcq-check { color: var(--accent-emerald); font-size: 18px; font-weight: 700; }
    .mcq-cross { color: var(--accent-rose); font-size: 18px; font-weight: 700; }
    .mcq-explanation {
      padding: var(--space-5); border-radius: var(--radius-lg); margin-bottom: var(--space-5);
      font-size: var(--text-sm); color: var(--text-secondary); line-height: 1.7;
      background: rgba(245,158,11,0.05); border: 1px solid rgba(245,158,11,0.15);
    }
    .mcq-explanation strong { color: var(--accent-amber); }
    .mcq-nav { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); }
    .mcq-nav button:disabled { opacity: 0.3; cursor: not-allowed; }

    /* ── Chat ──────────────────────────────────────────────── */
    .chat-container { max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; }
    .chat-window {
      height: 420px; overflow-y: auto; padding: var(--space-5);
      border-radius: var(--radius-xl) var(--radius-xl) 0 0;
      display: flex; flex-direction: column; gap: var(--space-4);
      border-bottom: none;
    }
    .chat-msg { display: flex; gap: var(--space-3); max-width: 90%; }
    .chat-msg.user { align-self: flex-end; flex-direction: row-reverse; }
    .chat-msg-avatar {
      width: 32px; height: 32px; border-radius: var(--radius-full);
      background: var(--bg-surface); display: flex; align-items: center;
      justify-content: center; font-size: 16px; flex-shrink: 0;
    }
    .chat-msg-bubble {
      padding: var(--space-3) var(--space-4); border-radius: var(--radius-lg);
      font-size: var(--text-sm); line-height: 1.7; color: var(--text-primary);
    }
    .chat-msg.ai .chat-msg-bubble { background: var(--bg-surface); border: 1px solid var(--glass-border); }
    .chat-msg.user .chat-msg-bubble {
      background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.15));
      border: 1px solid rgba(99,102,241,0.2);
    }
    .chat-msg-bubble code {
      background: rgba(0,0,0,0.3); padding: 1px 5px; border-radius: 4px;
      font-size: 0.85em; color: #a5b4fc; font-family: var(--font-mono);
    }
    .chat-msg-bubble strong { color: var(--accent-amber); }
    .chat-suggestions {
      display: flex; gap: var(--space-2); padding: var(--space-3) var(--space-4);
      overflow-x: auto; background: var(--bg-tertiary);
      border-left: 1px solid var(--glass-border); border-right: 1px solid var(--glass-border);
    }
    .chat-suggestion {
      padding: var(--space-2) var(--space-3); border-radius: var(--radius-full);
      background: var(--bg-surface); border: 1px solid var(--glass-border);
      color: var(--text-secondary); font-size: 12px; cursor: pointer;
      transition: all var(--transition-fast); white-space: nowrap; font-family: var(--font-sans);
    }
    .chat-suggestion:hover { background: var(--bg-surface-hover); color: var(--text-primary); border-color: rgba(255,255,255,0.15); }
    .chat-input-bar {
      display: flex; gap: var(--space-2); padding: var(--space-3) var(--space-4);
      background: var(--bg-tertiary); border: 1px solid var(--glass-border);
      border-radius: 0 0 var(--radius-xl) var(--radius-xl);
    }
    .chat-input {
      flex: 1; padding: var(--space-3) var(--space-4); border-radius: var(--radius-md);
      background: var(--bg-surface); border: 1px solid var(--glass-border);
      color: var(--text-primary); font-size: var(--text-sm); font-family: var(--font-sans);
      outline: none; transition: border-color var(--transition-fast);
    }
    .chat-input:focus { border-color: var(--accent-indigo); }
    .chat-input::placeholder { color: var(--text-muted); }

    /* ── Scenarios ────────────────────────────────────────── */
    .scenarios-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(440px, 1fr));
      gap: var(--space-5);
    }
    .scenario-card {
      padding: var(--space-6); border-radius: var(--radius-xl);
      transition: all var(--transition-base); position: relative;
    }
    .scenario-card:hover { transform: translateY(-2px); border-color: rgba(255,255,255,0.15); }
    .scenario-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3); }
    .scenario-icon { font-size: 28px; }
    .scenario-title { font-size: var(--text-lg); font-weight: 700; margin-bottom: var(--space-3); }
    .scenario-situation { font-size: var(--text-sm); color: var(--text-secondary); line-height: 1.7; margin-bottom: var(--space-4); }
    .scenario-situation strong { color: var(--accent-amber); }
    .scenario-expand-btn { width: 100%; justify-content: center; }
    .scenario-solution {
      margin-top: var(--space-5); padding-top: var(--space-5);
      border-top: 1px solid var(--glass-border);
    }
    .scenario-solution h4 { font-size: var(--text-sm); font-weight: 700; margin-bottom: var(--space-3); color: var(--text-primary); }
    .scenario-solution ul { list-style: none; padding: 0; margin: 0 0 var(--space-5) 0; }
    .scenario-solution li {
      padding: var(--space-2) 0; padding-left: var(--space-5);
      position: relative; font-size: var(--text-sm); color: var(--text-secondary); line-height: 1.6;
    }
    .scenario-solution li::before {
      content: '→'; position: absolute; left: 0; color: var(--accent-emerald); font-weight: 700;
    }

    @media (max-width: 768px) {
      .scenarios-grid { grid-template-columns: 1fr; }
      .chat-suggestions { flex-wrap: wrap; }
    }
    `;
    container.appendChild(style);
}
