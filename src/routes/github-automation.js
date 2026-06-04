/**
 * GitHub Automation Tool
 * - Parses Hermes Kanban tasks into structured GitHub issue data
 * - Generates GitHub new-issue URLs and API payloads client-side
 */

import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { createRelatedToolsSection } from '../utils/content-ui.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

export function parseKanbanTask(raw) {
  if (typeof raw !== 'string') return null;

  const mdMatch = raw.match(/^\s*# Kanban task\s+(t_[a-zA-Z0-9_]+):\s*(.+?)\s*(?:\r?\n){2,}([\s\S]+)/m);
  if (mdMatch) {
    return {
      id: mdMatch[1].trim(),
      title: mdMatch[2].trim(),
      body: mdMatch[3].trim(),
    };
  }

  const match = raw.match(/^\s*Task\s*#(\d+)\s*[\r\n]+\s*Title:\s*(.+?)[\r\n]+\s*Body:\s*([\s\S]+)/m);
  if (!match) return null;
  return {
    id: match[1].trim(),
    title: match[2].trim(),
    body: match[3].trim(),
  };
}

export function buildGitHubIssueTitle(task) {
  return `[#${task.id}] ${task.title}`;
}

export function buildGitHubIssueBody(task) {
  return [
    `Hermes Kanban Task #${task.id}`,
    `Original Title: ${task.title}`,
    '',
    task.body,
    '',
    '---',
    'Auto-generated from Hermes Kanban',
  ].join('\n');
}

export function getRecommendedLabels(task) {
  const text = `${task.title} ${task.body}`.toLowerCase();
  const labels = [];
  if (text.includes('bug') || text.includes('fix')) labels.push('bug');
  if (text.includes('feature') || text.includes('add')) labels.push('enhancement');
  if (text.includes('doc')) labels.push('documentation');
  return [...new Set(labels)];
}

export function buildGitHubNewIssueURL(owner, repo, title, body, labels) {
  let url = `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/new`;
  url += `?title=${encodeURIComponent(title)}`;
  url += `&body=${encodeURIComponent(body)}`;
  if (labels.length > 0) {
    url += `&labels=${encodeURIComponent(labels.join(','))}`;
  }
  return url;
}

export function buildGitHubIssuePayload(owner, repo, title, body, labels) {
  return {
    owner,
    repo,
    title,
    body,
    labels: labels || [],
  };
}

export async function handleGithubAutomationRoutes(request, url) {
  const { pathname } = url;
  if (pathname === '/github-automation' || pathname === '/github-automation/') {
    if (request.method === 'GET') return respondHTML(renderGithubAutomationPage(resolveRequestLanguage(request, url)));
    return new Response('Method not allowed', { status: 405 });
  }
  return null;
}

function renderGithubAutomationPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('github-automation', currentLang);
  const title = translation?.name || 'GitHub Automation';
  const description = translation?.desc || 'Convert Hermes Kanban tasks into GitHub issues. Client-side parsing and URL generation.';

  const header = createToolHeader(
    { emoji: '🐙' },
    title,
    description,
    [
      { text: translation?.ui?.badge0 || 'Client-Side Only', tooltip: 'All parsing and URL generation happen in your browser. No data is sent to a server.' },
    ],
    { toolId: 'github-automation' }
  );

  const currentTool = TOOLS.find(t => t.id === 'github-automation');
  const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${header}

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div class="flex flex-wrap gap-2 bg-surface-50 dark:bg-surface-950/50 p-2 rounded-lg border border-surface-100 dark:border-surface-800">
              <button id="load-sample" class="btn btn-secondary">🧪 <span data-i18n="tools.github-automation.ui.button0">Load Sample</span></button>
              <button id="clear-btn" class="btn btn-ghost ml-auto">🗑️ <span data-i18n="tools.github-automation.ui.button1">Clear</span></button>
            </div>

            <label class="label" data-i18n="tools.github-automation.ui.label0">Hermes Kanban Task</label>
            <textarea id="task-input" rows="10" class="input-mono resize-y" placeholder="Paste a Kanban task here..." data-i18n-placeholder="tools.github-automation.ui.placeholder0"></textarea>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="label" data-i18n="tools.github-automation.ui.label1">Owner</label>
                <input id="owner" type="text" class="input" placeholder="acme" data-i18n-placeholder="tools.github-automation.ui.placeholder1" />
              </div>
              <div>
                <label class="label" data-i18n="tools.github-automation.ui.label2">Repository</label>
                <input id="repo" type="text" class="input" placeholder="repo" data-i18n-placeholder="tools.github-automation.ui.placeholder2" />
              </div>
            </div>

            <button id="generate-btn" class="btn btn-primary w-full">
              <span data-i18n="tools.github-automation.ui.button2">Generate Issue Data</span>
            </button>

            <div id="error-display" role="alert" class="hidden rounded-lg border border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/30 text-sm text-error-700 dark:text-error-200 px-4 py-3"></div>
          </div>

          <div class="space-y-4">
            <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
              <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-2" data-i18n="tools.github-automation.ui.stat0">Parsed Task</div>
              <pre id="parsed-task" class="text-sm font-mono text-surface-700 dark:text-surface-300 whitespace-pre-wrap">—</pre>
            </div>

            <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
              <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-2" data-i18n="tools.github-automation.ui.stat1">Recommended Labels</div>
              <div id="recommended-labels" class="text-sm font-mono text-surface-700 dark:text-surface-300">—</div>
            </div>

            <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
              <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-2" data-i18n="tools.github-automation.ui.stat2">GitHub URL</div>
              <a id="github-url" href="#" target="_blank" rel="noopener noreferrer" class="text-sm text-primary-600 dark:text-primary-400 break-all hover:underline">—</a>
            </div>

            <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800">
              <div class="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-2" data-i18n="tools.github-automation.ui.stat3">API Payload</div>
              <pre id="api-payload" class="text-sm font-mono text-surface-700 dark:text-surface-300 whitespace-pre-wrap">—</pre>
            </div>
          </div>
        </div>

        ${createRelatedToolsSection(relatedToolsData, currentLang)}
      </div>
    </main>

    <script>
      (function() {
        var taskInput = document.getElementById('task-input');
        var ownerInput = document.getElementById('owner');
        var repoInput = document.getElementById('repo');
        var generateBtn = document.getElementById('generate-btn');
        var loadSampleBtn = document.getElementById('load-sample');
        var clearBtn = document.getElementById('clear-btn');
        var errorDisplay = document.getElementById('error-display');
        var parsedTaskEl = document.getElementById('parsed-task');
        var labelsEl = document.getElementById('recommended-labels');
        var urlEl = document.getElementById('github-url');
        var payloadEl = document.getElementById('api-payload');

        var sample = 'Task #76\\nTitle: Implement GitHub Automation tool\\nBody: Create a new tool that converts Hermes Kanban tasks into GitHub issues. Must support id/title/body extraction and be client-side only.';

        function showError(msg) {
          errorDisplay.textContent = msg;
          errorDisplay.classList.remove('hidden');
        }
        function hideError() {
          errorDisplay.textContent = '';
          errorDisplay.classList.add('hidden');
        }

        function parseKanbanTask(raw) {
          var mdMatch = raw.match(/^\\s*# Kanban task\\s+(t_[a-zA-Z0-9_]+):\\s*(.+?)\\s*(?:\\r?\\n){2,}([\\s\\S]+)/m);
          if (mdMatch) {
            return { id: mdMatch[1].trim(), title: mdMatch[2].trim(), body: mdMatch[3].trim() };
          }
          var match = raw.match(/^Task #(\\d+)\\nTitle: (.+)\\nBody: ([\\s\\S]+)$/m);
          if (!match) return null;
          return { id: match[1].trim(), title: match[2].trim(), body: match[3].trim() };
        }

        function buildGitHubIssueTitle(task) {
          return '[#' + task.id + '] ' + task.title;
        }

        function buildGitHubIssueBody(task) {
          return [
            'Hermes Kanban Task #' + task.id,
            'Original Title: ' + task.title,
            '',
            task.body,
            '',
            '---',
            'Auto-generated from Hermes Kanban'
          ].join('\\n');
        }

        function getRecommendedLabels(task) {
          var text = (task.title + ' ' + task.body).toLowerCase();
          var labels = [];
          if (text.indexOf('bug') >= 0 || text.indexOf('fix') >= 0) labels.push('bug');
          if (text.indexOf('feature') >= 0 || text.indexOf('add') >= 0) labels.push('enhancement');
          if (text.indexOf('doc') >= 0) labels.push('documentation');
          return labels.filter(function(v, i, a) { return a.indexOf(v) === i; });
        }

        function buildGitHubNewIssueURL(owner, repo, title, body, labels) {
          var url = 'https://github.com/' + encodeURIComponent(owner) + '/' + encodeURIComponent(repo) + '/issues/new';
          url += '?title=' + encodeURIComponent(title);
          url += '&body=' + encodeURIComponent(body);
          if (labels.length > 0) {
            url += '&labels=' + encodeURIComponent(labels.join(','));
          }
          return url;
        }

        function buildGitHubIssuePayload(owner, repo, title, body, labels) {
          return { owner: owner, repo: repo, title: title, body: body, labels: labels || [] };
        }

        function generate() {
          hideError();
          var raw = taskInput.value;
          var owner = ownerInput.value.trim();
          var repo = repoInput.value.trim();

          if (!owner || !repo) {
            showError('Please enter both an owner and a repository name.');
            return;
          }

          var task = parseKanbanTask(raw);
          if (!task) {
            showError('Could not parse the Kanban task. Expected format: Task #<id>\\nTitle: <title>\\nBody: <body>');
            return;
          }

          var issueTitle = buildGitHubIssueTitle(task);
          var issueBody = buildGitHubIssueBody(task);
          var labels = getRecommendedLabels(task);
          var issueUrl = buildGitHubNewIssueURL(owner, repo, issueTitle, issueBody, labels);
          var payload = buildGitHubIssuePayload(owner, repo, issueTitle, issueBody, labels);

          parsedTaskEl.textContent = JSON.stringify(task, null, 2);
          labelsEl.textContent = labels.length > 0 ? labels.join(', ') : 'None';
          urlEl.href = issueUrl;
          urlEl.textContent = issueUrl;
          payloadEl.textContent = JSON.stringify(payload, null, 2);
        }

        loadSampleBtn.addEventListener('click', function() {
          taskInput.value = sample;
          ownerInput.value = 'acme';
          repoInput.value = 'repo';
          hideError();
        });

        clearBtn.addEventListener('click', function() {
          taskInput.value = '';
          ownerInput.value = '';
          repoInput.value = '';
          parsedTaskEl.textContent = '—';
          labelsEl.textContent = '—';
          urlEl.href = '#';
          urlEl.textContent = '—';
          payloadEl.textContent = '—';
          hideError();
        });

        generateBtn.addEventListener('click', generate);
      })();
    </script>
  `;

  return createPageTemplate({ title, description, content, path: '/github-automation' });
}
