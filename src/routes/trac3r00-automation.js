import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

function createRelatedToolsSection(tools, lang) {
  if (!tools || tools.length === 0) return '';
  const cards = tools.map(t => `
    <a href="/${t.id}" class="card p-4 hover:shadow-md transition-shadow">
      <div class="flex items-center gap-3">
        <span class="text-2xl">${t.icon}</span>
        <div>
          <h4 class="font-medium text-surface-900 dark:text-white">${t.name}</h4>
          <p class="text-sm text-surface-500 dark:text-surface-400">${t.description}</p>
        </div>
      </div>
    </a>
  `).join('');
  return `
    <section class="mt-12">
      <h3 class="text-lg font-semibold text-surface-900 dark:text-white mb-4">Related Tools</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">${cards}</div>
    </section>
  `;
}

export async function handleTrac3r00AutomationRoutes(request, url) {
  if (url.pathname !== '/trac3r00-automation' && url.pathname !== '/trac3r00-automation/') return null;
  if (request.method !== 'GET') return null;
  const lang = resolveRequestLanguage(request, url);
  return renderTrac3r00AutomationPage(lang);
}

function renderTrac3r00AutomationPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('trac3r00-automation', currentLang);
  const title = translation?.name || 'Trac3r00 Automation';
  const description = translation?.desc || 'Convert Kanban tasks to GitHub issues for trac3r00/simpletool-app.';

  const header = createToolHeader(
    { emoji: '🤖' },
    title,
    description,
    [{ text: translation?.ui?.badge0 || 'Client-Side Only', tooltip: 'All processing happens in your browser — no data is sent to any server.' }],
    { toolId: 'trac3r00-automation' }
  );

  const currentTool = TOOLS.find(t => t.id === 'trac3r00-automation');
  const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      ${header}

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Configuration Section -->
        <div class="space-y-6">
          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-5">
            <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4" data-i18n="tools.trac3r00-automation.ui.heading0">GitHub Configuration</h2>
            <div class="space-y-4">
              <div>
                <label for="github-token" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1" data-i18n="tools.trac3r00-automation.ui.label0">Personal Access Token</label>
                <input type="password" id="github-token"
                  class="w-full p-3 bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  placeholder="Enter your GitHub personal access token" data-i18n-placeholder="tools.trac3r00-automation.ui.placeholder0">
                <p class="mt-1 text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.trac3r00-automation.ui.desc0">Token requires repo scope for issue management</p>
              </div>

              <div>
                <label for="repo-owner" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1" data-i18n="tools.trac3r00-automation.ui.label1">Repository Owner</label>
                <input type="text" id="repo-owner"
                  class="w-full p-3 bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  placeholder="e.g., trac3r00" data-i18n-placeholder="tools.trac3r00-automation.ui.placeholder1" value="trac3r00">
              </div>

              <div>
                <label for="repo-name" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1" data-i18n="tools.trac3r00-automation.ui.label2">Repository Name</label>
                <input type="text" id="repo-name"
                  class="w-full p-3 bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  placeholder="e.g., simpletool-app" data-i18n-placeholder="tools.trac3r00-automation.ui.placeholder2" value="simpletool-app">
              </div>

              <button id="connect-btn" class="btn btn-primary w-full" data-i18n="tools.trac3r00-automation.ui.button0">Connect to GitHub</button>
            </div>
          </div>

          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-5">
            <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4" data-i18n="tools.trac3r00-automation.ui.heading1">Label Configuration</h2>
            <div class="space-y-4">
              <div id="labels-config">
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2" data-i18n="tools.trac3r00-automation.ui.label3">Issue Labels</label>
                <div class="flex flex-wrap gap-2 mb-3">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-100">automation</span>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-100">trac3r00</span>
                </div>
                <input type="text" id="custom-labels"
                  class="w-full p-2 bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                  placeholder="Add custom labels (comma separated)" data-i18n-placeholder="tools.trac3r00-automation.ui.placeholder3">
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-5">
            <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4" data-i18n="tools.trac3r00-automation.ui.heading2">Kanban Task Input</h2>
            <p class="text-sm text-surface-500 dark:text-surface-400 mb-3" data-i18n="tools.trac3r00-automation.ui.desc1">Paste a Kanban task (JSON) to auto-generate a GitHub issue with title, body, labels, and assignee.</p>
            <div class="space-y-3">
              <textarea id="kanban-task-input" rows="6"
                class="w-full p-3 bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm font-mono resize-y"
                placeholder='{"title": "Add feature", "body": "Description...", "assignee": "bob", "labels": ["enhancement"]}'
                data-i18n-placeholder="tools.trac3r00-automation.ui.placeholder4"></textarea>
              <div class="flex gap-2">
                <button id="parse-kanban-btn" class="btn btn-secondary flex-1" data-i18n="tools.trac3r00-automation.ui.button1">Parse Kanban Task</button>
                <button id="clear-btn" class="btn btn-ghost flex-1" data-i18n="tools.trac3r00-automation.ui.button2">Clear</button>
              </div>
              <div id="parse-status" class="text-xs hidden"></div>
            </div>
          </div>
        </div>

        <!-- Preview & Action Section -->
        <div class="space-y-6">
          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-5">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-semibold text-surface-900 dark:text-white" data-i18n="tools.trac3r00-automation.ui.heading3">Issue Preview</h2>
              <button id="create-issue-btn" class="btn btn-primary" disabled data-i18n="tools.trac3r00-automation.ui.button3">Create Issue</button>
            </div>
            <div class="space-y-4">
              <div>
                <label for="issue-title" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1" data-i18n="tools.trac3r00-automation.ui.label4">Title</label>
                <input type="text" id="issue-title"
                  class="w-full p-3 bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  placeholder="Issue title" data-i18n-placeholder="tools.trac3r00-automation.ui.placeholder5">
              </div>

              <div>
                <label for="issue-body" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1" data-i18n="tools.trac3r00-automation.ui.label5">Body</label>
                <textarea id="issue-body" rows="10"
                  class="w-full p-3 bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm font-mono resize-y"
                  placeholder="Issue body (Markdown)" data-i18n-placeholder="tools.trac3r00-automation.ui.placeholder6"></textarea>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-5">
            <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4" data-i18n="tools.trac3r00-automation.ui.heading4">Status</h2>
            <div id="status-message" class="text-sm text-surface-700 dark:text-surface-300">
              <p data-i18n="tools.trac3r00-automation.ui.text0">Configure your GitHub connection and paste a Kanban task to get started.</p>
            </div>
          </div>
        </div>
      </div>

      ${createRelatedToolsSection(relatedToolsData, currentLang)}
    </main>

    <script>
      (function() {
        var connectBtn = document.getElementById('connect-btn');
        var createIssueBtn = document.getElementById('create-issue-btn');
        var githubToken = document.getElementById('github-token');
        var repoOwner = document.getElementById('repo-owner');
        var repoName = document.getElementById('repo-name');
        var statusMessage = document.getElementById('status-message');
        var kanbanTaskInput = document.getElementById('kanban-task-input');
        var parseKanbanBtn = document.getElementById('parse-kanban-btn');
        var clearBtn = document.getElementById('clear-btn');
        var parseStatus = document.getElementById('parse-status');
        var issueTitleInput = document.getElementById('issue-title');
        var issueBodyInput = document.getElementById('issue-body');
        var customLabelsInput = document.getElementById('custom-labels');

        var isConnected = false;
        var parsedAssignee = '';

        function showParseStatus(message, type) {
          parseStatus.textContent = message;
          parseStatus.className = 'text-xs ' + (type === 'error'
            ? 'text-red-600 dark:text-red-400'
            : 'text-green-600 dark:text-green-400');
          parseStatus.classList.remove('hidden');
        }

        function updateStatus(message, type) {
          statusMessage.textContent = '';
          if (typeof message === 'string') {
            statusMessage.textContent = message;
          } else if (message instanceof Node) {
            statusMessage.appendChild(message);
          }
          statusMessage.className = 'text-sm ' + (type === 'error'
            ? 'text-red-600 dark:text-red-400'
            : type === 'success'
            ? 'text-green-600 dark:text-green-400'
            : 'text-surface-700 dark:text-surface-300');
        }

        connectBtn.addEventListener('click', function() {
          var token = githubToken.value.trim();
          var owner = repoOwner.value.trim();
          var name = repoName.value.trim();

          if (!token || !owner || !name) {
            updateStatus('Please fill in all required fields.', 'error');
            return;
          }

          fetch('https://api.github.com/repos/' + owner + '/' + name, {
            headers: {
              'Authorization': 'Bearer ' + token,
              'Accept': 'application/vnd.github.v3+json'
            }
          })
          .then(function(response) {
            if (!response.ok) {
              throw new Error('GitHub API error: ' + response.status + ' ' + response.statusText);
            }
            isConnected = true;
            updateStatus('Connected to ' + owner + '/' + name, 'success');
            createIssueBtn.disabled = false;
          })
          .catch(function(error) {
            updateStatus('Connection failed: ' + error.message, 'error');
          });
        });

        function parseKanbanTask() {
          var raw = kanbanTaskInput.value.trim();
          if (!raw) {
            showParseStatus('Please paste a Kanban task JSON first.', 'error');
            return;
          }

          var task;
          try {
            task = JSON.parse(raw);
          } catch (e) {
            showParseStatus('Invalid JSON. Check the format and try again.', 'error');
            return;
          }

          if (!task.title) {
            showParseStatus('Kanban task must include a "title" field.', 'error');
            return;
          }

          parsedAssignee = task.assignee || '';

          var issueTitle = task.title;
          if (task.id) {
            issueTitle = '[' + task.id + '] ' + issueTitle;
          }

          var sections = [];
          sections.push('## Kanban Task → GitHub Issue');
          sections.push('');

          var taskBody = task.body || task.description;
          if (taskBody) {
            sections.push('### Description');
            sections.push('');
            sections.push(taskBody);
            sections.push('');
          }

          var priorityLabels = { 0: 'critical', 1: 'high', 2: 'medium', 3: 'low' };
          if (task.priority !== undefined) {
            var pLabel = priorityLabels[task.priority] || ('p' + task.priority);
            sections.push('**Priority:** ' + pLabel + ' (' + task.priority + ')');
            sections.push('');
          }

          if (task.assignee) {
            sections.push('**Assignee:** @' + task.assignee);
            sections.push('');
          }

          if (task.labels && Array.isArray(task.labels) && task.labels.length > 0) {
            sections.push('**Suggested Labels:** ' + task.labels.join(', '));
            sections.push('');
          }

          if (task.status) {
            sections.push('**Kanban Status:** ' + task.status);
            sections.push('');
          }

          sections.push('---');
          sections.push('_This issue was auto-generated from a Kanban task._');

          issueTitleInput.value = issueTitle;
          issueBodyInput.value = sections.join('\\n');

          if (task.labels && Array.isArray(task.labels) && task.labels.length > 0) {
            customLabelsInput.value = task.labels.join(', ');
          }

          showParseStatus('Kanban task parsed! Preview updated below.', 'success');
          issueTitleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        parseKanbanBtn.addEventListener('click', parseKanbanTask);

        clearBtn.addEventListener('click', function() {
          kanbanTaskInput.value = '';
          parsedAssignee = '';
          parseStatus.classList.add('hidden');
          parseStatus.textContent = '';
          issueTitleInput.value = '';
          issueBodyInput.value = '';
          customLabelsInput.value = '';
        });

        function createIssue() {
          if (!isConnected) {
            updateStatus('Please connect to GitHub first.', 'error');
            return;
          }

          var token = githubToken.value.trim();
          var owner = repoOwner.value.trim();
          var name = repoName.value.trim();
          var title = issueTitleInput.value.trim();
          var body = issueBodyInput.value.trim();

          if (!title || !body) {
            updateStatus('Please provide both title and body for the issue.', 'error');
            return;
          }

          var labelsVal = customLabelsInput.value.trim();
          var customLabels = labelsVal
            ? labelsVal.split(',').map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; })
            : [];
          var defaultLabels = ['automation', 'trac3r00'];
          var allLabels = defaultLabels.concat(customLabels);
          var seen = {};
          var labels = [];
          for (var i = 0; i < allLabels.length; i++) {
            var l = allLabels[i].toLowerCase();
            if (!seen[l]) {
              seen[l] = true;
              labels.push(allLabels[i]);
            }
          }

          var requestBody = { title: title, body: body, labels: labels };
          if (parsedAssignee) {
            requestBody.assignees = [parsedAssignee];
          }

          createIssueBtn.disabled = true;
          createIssueBtn.textContent = 'Creating...';

          fetch('https://api.github.com/repos/' + owner + '/' + name + '/issues', {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + token,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          })
          .then(function(response) {
            if (!response.ok) {
              throw new Error('Failed to create issue: ' + response.status + ' ' + response.statusText);
            }
            return response.json();
          })
          .then(function(issue) {
            var container = document.createElement('span');
            container.appendChild(document.createTextNode('Issue created: '));
            var link = document.createElement('a');
            link.href = issue.html_url;
            link.target = '_blank';
            link.className = 'text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300';
            link.textContent = '#' + issue.number + ' ' + issue.title;
            container.appendChild(link);
            updateStatus(container, 'success');
          })
          .catch(function(error) {
            updateStatus('Failed to create issue: ' + error.message, 'error');
          })
          .finally(function() {
            createIssueBtn.disabled = false;
            createIssueBtn.textContent = 'Create Issue';
          });
        }

        createIssueBtn.addEventListener('click', createIssue);
      })();
    </script>
  `;

  return respondHTML(createPageTemplate({
    title,
    description,
    lang: currentLang,
    path: '/trac3r00-automation',
    content
  }));
}
