/**
 * Kanban Open Automation
 * - Parses pasted Kanban/GitHub backlog text
 * - Extracts issue references (repo#issue)
 * - Detects recurring themes via keyword frequency
 * - Computes a product-value / readiness score
 * - Generates a GitHub issue/PR-ready triage proposal
 * - Entirely client-side
 */

import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';
import { createRelatedToolsSection } from '../utils/content-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

// Exported helpers for unit testing

export function extractIssueRefs(text) {
  const refs = new Set();
  const re = /\b([a-zA-Z0-9._-]+)#(\d+)\b/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    refs.add(`${m[1]}#${m[2]}`);
  }
  return Array.from(refs);
}

export function detectThemes(text) {
  const stopWords = new Set([
    'the','a','an','and','or','but','in','on','at','to','for','of','with','by',
    'is','are','was','were','be','been','have','has','had','do','does','did',
    'will','would','could','should','may','might','can','this','that','these',
    'those','it','its','from','as','into','through','during','before','after',
    'above','below','up','down','out','off','over','under','again','further',
    'then','once','here','there','when','where','why','how','all','any','both',
    'each','few','more','most','other','some','such','no','nor','not','only',
    'own','same','so','than','too','very','just','now','also','see','fix',
    'add','update','remove','create','issue','bug','feature','request','pr',
    'open','closed','merged','done','todo','backlog','kanban','github'
  ]);

  const words = String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !stopWords.has(w));

  const freq = new Map();
  for (const w of words) {
    freq.set(w, (freq.get(w) || 0) + 1);
  }

  const sorted = Array.from(freq.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return sorted.map(([word, count]) => ({ word, count }));
}

export function computeScore(refs, themes, text) {
  const t = String(text || '').toLowerCase();
  let score = 0;

  // Issue volume (max 30 pts)
  score += Math.min(refs.length * 5, 30);

  // Theme density (max 20 pts)
  score += Math.min(themes.length * 5, 20);

  // Severity signals (max 30 pts)
  const highSignals = ['security','critical','urgent','blocker','crash','data loss','leak','vulnerability'];
  const mediumSignals = ['performance','slow','memory','latency','regression','bug','error'];
  const lowSignals = ['ui','ux','typo','spacing','color','label','copy','documentation','readme'];

  for (const s of highSignals) {
    if (t.includes(s)) score += 6;
  }
  for (const s of mediumSignals) {
    if (t.includes(s)) score += 3;
  }
  for (const s of lowSignals) {
    if (t.includes(s)) score += 1;
  }
  score = Math.min(score, 80);

  // Readiness bonus (max 20 pts)
  if (t.includes('repro') || t.includes('steps') || t.includes('acceptance')) score += 10;
  if (refs.length >= 2) score += 10;
  score = Math.min(score, 100);

  let readiness;
  if (score >= 70) readiness = 'High — ready for triage';
  else if (score >= 40) readiness = 'Medium — needs details';
  else readiness = 'Low — gather more context';

  return { score, readiness };
}

export function generateProposal(refs, themes, score, readiness) {
  const today = new Date().toISOString().split('T')[0];
  const lines = [
    `## Triage Brief — ${today}`,
    '',
    '### Summary',
    `Extracted ${refs.length} recurring issue reference(s) from backlog text.`,
    ''
  ];

  if (refs.length > 0) {
    lines.push('### Issue References');
    for (const ref of refs) {
      lines.push(`- ${ref}`);
    }
    lines.push('');
  }

  if (themes.length > 0) {
    lines.push('### Recurring Themes');
    for (const th of themes) {
      lines.push(`- **${th.word}** (mentioned ${th.count} times)`);
    }
    lines.push('');
  }

  lines.push('### Product-Value Score');
  lines.push(`- **Score:** ${score}/100`);
  lines.push(`- **Readiness:** ${readiness}`);
  lines.push('');

  lines.push('### Recommended Next Steps');
  if (score >= 70) {
    lines.push('1. Convert extracted refs into a GitHub issue with acceptance criteria.');
    lines.push('2. Link related PRs and close duplicates.');
    lines.push('3. Assign to the next sprint.');
  } else if (score >= 40) {
    lines.push('1. Add reproduction steps or acceptance criteria to each issue.');
    lines.push('2. Consolidate similar themes into a single epic.');
    lines.push('3. Re-score after next backlog review.');
  } else {
    lines.push('1. Add more detailed descriptions and user stories.');
    lines.push('2. Tag with appropriate labels (bug, feature, tech-debt).');
    lines.push('3. Revisit in the next grooming session.');
  }
  lines.push('');

  if (refs.length > 0) {
    lines.push('### Copy-ready checklist');
    for (const ref of refs) {
      lines.push(`- [ ] ${ref}`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('*Generated by SimpleTool Kanban Open Automation*');

  return lines.join('\n');
}

export async function handleKanbanAutomationRoutes(request, url) {
  if (url.pathname !== '/kanban-automation' && url.pathname !== '/kanban-automation/') return null;
  if (request.method !== 'GET') return null;
  const lang = resolveRequestLanguage(request, url);
  return renderKanbanAutomationPage(lang);
}

function renderKanbanAutomationPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('kanban-automation', currentLang);
  const title = translation?.name || 'Kanban Open Automation';
  const description = translation?.desc || 'Turn pasted recurring Kanban / GitHub backlog text into an actionable triage brief. Extracts issue refs, detects themes, scores readiness, and generates a proposal.';

  const header = createToolHeader(
    { emoji: '🤖' },
    translation?.name || title,
    translation?.desc || description,
    [
      { text: translation?.ui?.badge0 || 'Client-Side Only', tooltip: 'All analysis runs in your browser.' },
      { text: translation?.ui?.badge1 || 'Privacy First', tooltip: 'Backlog text never leaves your device.' }
    ],
    { toolId: 'kanban-automation' }
  );

  const currentTool = TOOLS.find(t => t.id === 'kanban-automation');
  const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${header}

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Input -->
          <div class="space-y-6">
            <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-5">
              <div class="flex justify-between items-center mb-2">
                <label for="kanban-input" class="block text-sm font-medium text-surface-700 dark:text-surface-300">
                  <span data-i18n="tools.kanban-automation.ui.label0">Backlog Text</span>
                </label>
                <button id="analyze-btn" class="btn btn-primary btn-sm">
                  <span data-i18n="tools.kanban-automation.ui.button0">Analyze</span>
                </button>
              </div>
              <textarea id="kanban-input" rows="15"
                class="w-full p-3 bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm text-surface-900 dark:text-white resize-y"
                placeholder="Paste recurring Kanban / GitHub backlog text here..."
                data-i18n-placeholder="tools.kanban-automation.ui.placeholder0"></textarea>
              <div class="mt-2 flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400">
                <span data-i18n="tools.kanban-automation.ui.desc0">Looks for patterns like</span>
                <code class="px-1 py-0.5 bg-surface-100 dark:bg-surface-800 rounded">simpletool-app#34</code>
              </div>
            </div>

            <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-5">
              <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4" data-i18n="tools.kanban-automation.ui.heading0">How it works</h2>
              <ul class="space-y-2 text-sm text-surface-600 dark:text-surface-300 list-disc list-inside">
                <li data-i18n="tools.kanban-automation.ui.desc1">Extracts issue references (repo#issue).</li>
                <li data-i18n="tools.kanban-automation.ui.desc2">Detects recurring keywords and themes.</li>
                <li data-i18n="tools.kanban-automation.ui.desc3">Computes a product-value readiness score.</li>
                <li data-i18n="tools.kanban-automation.ui.desc4">Generates a shareable triage proposal.</li>
              </ul>
            </div>
          </div>

          <!-- Output -->
          <div class="space-y-6">
            <!-- Stats -->
            <div class="grid grid-cols-3 gap-3">
              <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
                <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.kanban-automation.ui.stat0">Issues</div>
                <div class="text-xl font-bold font-mono" id="issue-count">0</div>
              </div>
              <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
                <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.kanban-automation.ui.stat1">Themes</div>
                <div class="text-xl font-bold font-mono" id="theme-count">0</div>
              </div>
              <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
                <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide" data-i18n="tools.kanban-automation.ui.stat2">Score</div>
                <div class="text-xl font-bold font-mono" id="score-value">—</div>
              </div>
            </div>

            <!-- Proposal -->
            <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-5 flex flex-col">
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-lg font-semibold text-surface-900 dark:text-white" data-i18n="tools.kanban-automation.ui.heading1">Triage Proposal</h2>
                <button id="copy-proposal-btn" type="button" class="btn btn-ghost btn-xs" disabled>
                  <span data-i18n="tools.kanban-automation.ui.button1">Copy Proposal</span>
                </button>
              </div>
              <textarea id="proposal-output" rows="18" readonly
                class="w-full p-3 bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg font-mono text-sm text-surface-900 dark:text-white resize-y"
                placeholder="Proposal will appear here after analysis..."
                data-i18n-placeholder="tools.kanban-automation.ui.placeholder1"></textarea>
              <div id="status-msg" class="mt-2 text-sm text-surface-500 dark:text-surface-400 min-h-[1.25rem]"></div>
            </div>
          </div>
        </div>
      </div>
    </main>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      ${createRelatedToolsSection(relatedToolsData)}
    </div>
  `;

  const scripts = `
    <script>
      (function() {
        const $ = (id) => document.getElementById(id);

        const kanbanInput = $('kanban-input');
        const analyzeBtn = $('analyze-btn');
        const proposalOutput = $('proposal-output');
        const copyBtn = $('copy-proposal-btn');
        const statusMsg = $('status-msg');
        const issueCountEl = $('issue-count');
        const themeCountEl = $('theme-count');
        const scoreValueEl = $('score-value');

        function setStatus(msg, type) {
          statusMsg.textContent = msg || '';
          statusMsg.className = 'mt-2 text-sm min-h-[1.25rem]';
          if (type === 'error') {
            statusMsg.classList.add('text-error-600', 'dark:text-error-400');
          } else if (type === 'success') {
            statusMsg.classList.add('text-success-600', 'dark:text-success-400');
          } else {
            statusMsg.classList.add('text-surface-500', 'dark:text-surface-400');
          }
        }

        function extractIssueRefs(text) {
          const refs = new Set();
          const re = /\\b([a-zA-Z0-9._-]+)#(\\d+)\\b/g;
          let m;
          while ((m = re.exec(text)) !== null) {
            refs.add(m[1] + '#' + m[2]);
          }
          return Array.from(refs);
        }

        function detectThemes(text) {
          const stopWords = new Set([
            'the','a','an','and','or','but','in','on','at','to','for','of','with','by',
            'is','are','was','were','be','been','have','has','had','do','does','did',
            'will','would','could','should','may','might','can','this','that','these',
            'those','it','its','from','as','into','through','during','before','after',
            'above','below','up','down','out','off','over','under','again','further',
            'then','once','here','there','when','where','why','how','all','any','both',
            'each','few','more','most','other','some','such','no','nor','not','only',
            'own','same','so','than','too','very','just','now','also','see','fix',
            'add','update','remove','create','issue','bug','feature','request','pr',
            'open','closed','merged','done','todo','backlog','kanban','github'
          ]);

          const words = String(text || '')
            .toLowerCase()
            .replace(/[^a-z0-9\\s]/g, ' ')
            .split(/\\s+/)
            .filter(function(w) { return w.length >= 3 && !stopWords.has(w); });

          const freq = new Map();
          for (let i = 0; i < words.length; i++) {
            const w = words[i];
            freq.set(w, (freq.get(w) || 0) + 1);
          }

          const sorted = Array.from(freq.entries())
            .filter(function(entry) { return entry[1] >= 2; })
            .sort(function(a, b) { return b[1] - a[1]; })
            .slice(0, 8);

          return sorted.map(function(entry) { return { word: entry[0], count: entry[1] }; });
        }

        function computeScore(refs, themes, text) {
          const t = String(text || '').toLowerCase();
          let score = 0;

          score += Math.min(refs.length * 5, 30);
          score += Math.min(themes.length * 5, 20);

          const highSignals = ['security','critical','urgent','blocker','crash','data loss','leak','vulnerability'];
          const mediumSignals = ['performance','slow','memory','latency','regression','bug','error'];
          const lowSignals = ['ui','ux','typo','spacing','color','label','copy','documentation','readme'];

          for (let i = 0; i < highSignals.length; i++) {
            if (t.indexOf(highSignals[i]) !== -1) score += 6;
          }
          for (let i = 0; i < mediumSignals.length; i++) {
            if (t.indexOf(mediumSignals[i]) !== -1) score += 3;
          }
          for (let i = 0; i < lowSignals.length; i++) {
            if (t.indexOf(lowSignals[i]) !== -1) score += 1;
          }
          score = Math.min(score, 80);

          if (t.indexOf('repro') !== -1 || t.indexOf('steps') !== -1 || t.indexOf('acceptance') !== -1) score += 10;
          if (refs.length >= 2) score += 10;
          score = Math.min(score, 100);

          let readiness;
          if (score >= 70) readiness = 'High — ready for triage';
          else if (score >= 40) readiness = 'Medium — needs details';
          else readiness = 'Low — gather more context';

          return { score: score, readiness: readiness };
        }

        function generateProposal(refs, themes, score, readiness) {
          const today = new Date().toISOString().split('T')[0];
          const lines = [
            '## Triage Brief — ' + today,
            '',
            '### Summary',
            'Extracted ' + refs.length + ' recurring issue reference(s) from backlog text.',
            ''
          ];

          if (refs.length > 0) {
            lines.push('### Issue References');
            for (let i = 0; i < refs.length; i++) {
              lines.push('- ' + refs[i]);
            }
            lines.push('');
          }

          if (themes.length > 0) {
            lines.push('### Recurring Themes');
            for (let i = 0; i < themes.length; i++) {
              lines.push('- **' + themes[i].word + '** (mentioned ' + themes[i].count + ' times)');
            }
            lines.push('');
          }

          lines.push('### Product-Value Score');
          lines.push('- **Score:** ' + score + '/100');
          lines.push('- **Readiness:** ' + readiness);
          lines.push('');

          lines.push('### Recommended Next Steps');
          if (score >= 70) {
            lines.push('1. Convert extracted refs into a GitHub issue with acceptance criteria.');
            lines.push('2. Link related PRs and close duplicates.');
            lines.push('3. Assign to the next sprint.');
          } else if (score >= 40) {
            lines.push('1. Add reproduction steps or acceptance criteria to each issue.');
            lines.push('2. Consolidate similar themes into a single epic.');
            lines.push('3. Re-score after next backlog review.');
          } else {
            lines.push('1. Add more detailed descriptions and user stories.');
            lines.push('2. Tag with appropriate labels (bug, feature, tech-debt).');
            lines.push('3. Revisit in the next grooming session.');
          }
          lines.push('');

          if (refs.length > 0) {
            lines.push('### Copy-ready checklist');
            for (let i = 0; i < refs.length; i++) {
              lines.push('- [ ] ' + refs[i]);
            }
            lines.push('');
          }

          lines.push('---');
          lines.push('*Generated by SimpleTool Kanban Open Automation*');

          return lines.join('\\n');
        }

        function runAnalysis() {
          const text = kanbanInput.value;
          if (!text.trim()) {
            setStatus('Please paste backlog text first.', 'error');
            return;
          }

          setStatus('Analyzing...');

          try {
            const refs = extractIssueRefs(text);
            const themes = detectThemes(text);
            const { score, readiness } = computeScore(refs, themes, text);
            const proposal = generateProposal(refs, themes, score, readiness);

            issueCountEl.textContent = String(refs.length);
            themeCountEl.textContent = String(themes.length);
            scoreValueEl.textContent = String(score);

            proposalOutput.value = proposal;
            copyBtn.disabled = !proposal.trim();
            setStatus('Analysis complete.', 'success');
          } catch (e) {
            setStatus('Analysis error: ' + e.message, 'error');
          }
        }

        analyzeBtn.addEventListener('click', runAnalysis);

        copyBtn.addEventListener('click', function() {
          const text = proposalOutput.value;
          if (!text.trim()) return;
          navigator.clipboard.writeText(text).then(function() {
            const old = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            if (window.Toast) window.Toast.success('Copied!');
            setTimeout(function() { copyBtn.textContent = old; }, 1200);
          }).catch(function(err) {
            setStatus('Copy failed: ' + err.message, 'error');
          });
        });
      })();
    </script>
  `;

  return respondHTML(createPageTemplate({
    title: translation?.name || title,
    description: translation?.desc || description,
    path: '/kanban-automation',
    content,
    scripts,
    lang: currentLang
  }));
}
