import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { createRelatedToolsSection } from '../utils/content-ui.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage, getLanguageScript } from '../utils/i18n.js';

export async function handleGithubAutomationRoutes(request, url) {
  if (url.pathname !== '/github-automation' && url.pathname !== '/github-automation/') return null;
  if (request.method !== 'GET') return null;
  const lang = resolveRequestLanguage(request, url);
  return renderGithubAutomationPage(lang);
}

function renderGithubAutomationPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('github-automation', currentLang);
  const title = translation?.name || 'GitHub Automation';
  const description = translation?.desc || 'Automate GitHub workflows and issue tracking with Trac3r00.';

  const header = createToolHeader(
    { emoji: '🤖' },
    title,
    description,
    [{ text: translation?.ui?.badge1 || 'Client-Side Only', tooltip: 'All processing happens in your browser — no data is sent to any server.' }],
    { toolId: 'github-automation' }
  );

  const currentTool = TOOLS.find(t => t.id === 'github-automation');
  const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];

  const i18nScript = getLanguageScript('github-automation', currentLang);

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      ${header}

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="space-y-6">
          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-5">
            <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4" data-i18n="tools.github-automation.ui.heading0">GitHub Configuration</h2>
            <div class="space-y-4">
              <div>
                <label for="github-token" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1" data-i18n="tools.github-automation.ui.label0">Personal Access Token</label>
                <input type="password" id="github-token"
                  class="w-full p-3 bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  placeholder="Enter your GitHub personal access token" data-i18n-placeholder="tools.github-automation.ui.placeholder0">
                <p class="mt-1 text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.github-automation.ui.tip0">Token requires repo scope for issue management</p>
              </div>

              <div>
                <label for="repo-owner" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1" data-i18n="tools.github-automation.ui.label1">Repository Owner</label>
                <input type="text" id="repo-owner"
                  class="w-full p-3 bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  placeholder="e.g., trac3r00" data-i18n-placeholder="tools.github-automation.ui.placeholder1">
              </div>

              <div>
                <label for="repo-name" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1" data-i18n="tools.github-automation.ui.label2">Repository Name</label>
                <input type="text" id="repo-name"
                  class="w-full p-3 bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  placeholder="e.g., simpletool-app" data-i18n-placeholder="tools.github-automation.ui.placeholder2">
              </div>

              <button id="connect-btn" class="btn btn-primary w-full" data-i18n="tools.github-automation.ui.button0">Connect to GitHub</button>
            </div>
          </div>

          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-5">
            <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4" data-i18n="tools.github-automation.ui.heading1">Automation Settings</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2" data-i18n="tools.github-automation.ui.label3">Issue Labels</label>
                <div class="flex flex-wrap gap-2">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-100">automation</span>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-100">trac3r00</span>
                  <input type="text" id="custom-labels"
                    class="flex-1 min-w-0 p-2 bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                    placeholder="Add custom labels (comma separated)" data-i18n-placeholder="tools.github-automation.ui.placeholder3">
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-5">
            <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4" data-i18n="tools.github-automation.ui.heading6">Create from Kanban Task</h2>
            <p class="text-sm text-surface-500 dark:text-surface-400 mb-3" data-i18n="tools.github-automation.ui.desc0">Paste a Kanban task (JSON) to auto-generate a GitHub issue with title, description, labels, and assignee.</p>
            <div class="space-y-3">
              <textarea id="kanban-task-input" rows="6"
                class="w-full p-3 bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm font-mono resize-y"
                placeholder='{"title": "Add dark mode toggle", "description": "Users need a manual toggle...", "assignee": "bob-fixer", "priority": 2, "labels": ["enhancement", "ui"]}'
                data-i18n-placeholder="tools.github-automation.ui.placeholder6"></textarea>
              <div class="flex gap-2">
                <button id="parse-kanban-btn" class="btn btn-secondary flex-1" data-i18n="tools.github-automation.ui.button2">Parse Kanban Task</button>
                <button id="clear-kanban-btn" class="btn btn-ghost flex-1" data-i18n="tools.github-automation.ui.button3">Clear</button>
              </div>
              <div id="kanban-parse-status" class="text-xs hidden"></div>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-5">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-semibold text-surface-900 dark:text-white" data-i18n="tools.github-automation.ui.heading2">Preview Issue</h2>
              <button id="create-issue-btn" class="btn btn-primary" disabled data-i18n="tools.github-automation.ui.button1">Create Issue</button>
            </div>
            <div class="space-y-4">
              <div>
                <label for="issue-title" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1" data-i18n="tools.github-automation.ui.label5">Title</label>
                <input type="text" id="issue-title"
                  class="w-full p-3 bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  placeholder="Issue title" data-i18n-placeholder="tools.github-automation.ui.placeholder4">
              </div>

              <div>
                <label for="issue-body" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1" data-i18n="tools.github-automation.ui.label6">Description</label>
                <textarea id="issue-body" rows="8"
                  class="w-full p-3 bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm resize-y"
                  placeholder="Issue description" data-i18n-placeholder="tools.github-automation.ui.placeholder5"></textarea>
              </div>

              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" id="use-trac3r00-template" checked
                  class="w-4 h-4 rounded border-surface-300 dark:border-surface-700 text-primary-600 focus:ring-primary-500">
                <span class="text-sm text-surface-700 dark:text-surface-300" data-i18n="tools.github-automation.ui.label7">Use Trac3r00 template</span>
              </label>
            </div>
          </div>

          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-5">
            <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4" data-i18n="tools.github-automation.ui.heading3">Status</h2>
            <div id="status-message" class="text-sm text-surface-700 dark:text-surface-300" data-i18n="tools.github-automation.ui.text0">
              Please configure GitHub connection to begin automation.
            </div>
            <div id="issues-list" class="mt-4 space-y-2 max-h-60 overflow-y-auto hidden">
              <h3 class="text-sm font-medium text-surface-900 dark:text-white" data-i18n="tools.github-automation.ui.heading4">Recent Issues</h3>
              <div id="issues-container" class="space-y-2"></div>
            </div>
          </div>
        </div>
      </div>

      ${createRelatedToolsSection(relatedToolsData, currentLang)}
    </main>
  `;

  const scripts = i18nScript + `
    <script>
      var connectBtn = document.getElementById('connect-btn');
      var createIssueBtn = document.getElementById('create-issue-btn');
      var githubToken = document.getElementById('github-token');
      var repoOwner = document.getElementById('repo-owner');
      var repoName = document.getElementById('repo-name');
      var statusMessage = document.getElementById('status-message');
      var issuesList = document.getElementById('issues-list');
      var issuesContainer = document.getElementById('issues-container');
      var kanbanTaskInput = document.getElementById('kanban-task-input');
      var parseKanbanBtn = document.getElementById('parse-kanban-btn');
      var clearKanbanBtn = document.getElementById('clear-kanban-btn');
      var kanbanParseStatus = document.getElementById('kanban-parse-status');
      var issueTitleInput = document.getElementById('issue-title');
      var issueBodyInput = document.getElementById('issue-body');
      var useTemplateCheckbox = document.getElementById('use-trac3r00-template');

      var isConnected = false;
      var issues = [];
      var parsedAssignee = "";

      connectBtn.addEventListener('click', connectToGitHub);
      createIssueBtn.addEventListener('click', createIssue);
      parseKanbanBtn.addEventListener('click', parseKanbanTask);
      clearKanbanBtn.addEventListener('click', clearKanbanTask);

      function sanitizeLabelColor(color) {
        if (!color) return '';
        return color.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
      }

      async function connectToGitHub() {
        var token = githubToken.value.trim();
        var owner = repoOwner.value.trim();
        var name = repoName.value.trim();

        if (!token || !owner || !name) {
          var msg = _t('tools.github-automation.js.text10', 'Please fill in all required fields.');
          updateStatus(msg, 'error');
          return;
        }

        try {
          var response = await fetch('https://api.github.com/repos/' + owner + '/' + name, {
            headers: {
              'Authorization': 'Bearer ' + token,
              'Accept': 'application/vnd.github.v3+json'
            }
          });

          if (!response.ok) {
            var errMsg = _t('tools.github-automation.js.text11', 'GitHub API error:');
            throw new Error(errMsg + ' ' + response.status + ' ' + response.statusText);
          }

          isConnected = true;
          var successMsg = _t('tools.github-automation.js.text12', 'Successfully connected to GitHub repository!');
          updateStatus(successMsg, 'success');
          createIssueBtn.disabled = false;
          loadRecentIssues(token, owner, name);
        } catch (error) {
          var failMsg = _t('tools.github-automation.js.text13', 'Connection failed:');
          updateStatus(failMsg + ' ' + error.message, 'error');
        }
      }

      async function loadRecentIssues(token, owner, name) {
        try {
          var response = await fetch('https://api.github.com/repos/' + owner + '/' + name + '/issues?state=open&sort=created&direction=desc&per_page=5', {
            headers: {
              'Authorization': 'Bearer ' + token,
              'Accept': 'application/vnd.github.v3+json'
            }
          });

          if (!response.ok) {
            var errMsg = _t('tools.github-automation.js.text14', 'Failed to load issues:');
            throw new Error(errMsg + ' ' + response.status + ' ' + response.statusText);
          }

          issues = (await response.json()).filter(function(issue) { return !issue.pull_request; });
          displayIssues();
        } catch (error) {
          var errMsg = _t('tools.github-automation.js.text14', 'Failed to load issues:');
          updateStatus(errMsg + ' ' + error.message, 'error');
        }
      }

      function displayIssues() {
        if (issues.length === 0) {
          var noIssues = _t('tools.github-automation.js.text0', 'No open issues found');
          issuesContainer.innerHTML = '<p class="text-sm text-surface-500 dark:text-surface-400">' + noIssues + '</p>';
        } else {
          issuesContainer.innerHTML = issues.map(function(issue) {
            var labelsHtml = issue.labels.map(function(label) {
              var safeColor = sanitizeLabelColor(label.color);
              var styleAttr = safeColor ? ' style="background-color: #' + safeColor + ';color:#fff"' : '';
              return '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"' + styleAttr + '>' + escapeHtml(label.name) + '</span>';
            }).join('');
            return '<div class="bg-surface-50 dark:bg-surface-900 rounded-lg p-3 border border-surface-200 dark:border-surface-800">' +
              '<div class="flex justify-between">' +
              '<a href="' + issue.html_url + '" target="_blank" class="text-sm font-medium text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">#' + issue.number + ' ' + escapeHtml(issue.title) + '</a>' +
              '<span class="text-xs text-surface-500 dark:text-surface-400">' + new Date(issue.created_at).toLocaleDateString() + '</span>' +
              '</div>' +
              '<div class="mt-1 flex flex-wrap gap-1">' + labelsHtml + '</div>' +
              '</div>';
          }).join('');
        }
        issuesList.classList.remove('hidden');
      }

      function escapeHtml(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
      }

      function parseKanbanTask() {
        var rawInput = kanbanTaskInput.value.trim();
        if (!rawInput) {
          var msg = _t('tools.github-automation.js.text1', 'Please paste a Kanban task JSON first.');
          showKanbanStatus(msg, 'error');
          return;
        }

        var task;
        try {
          task = JSON.parse(rawInput);
        } catch (e) {
          var msg = _t('tools.github-automation.js.text2', 'Invalid JSON. Please check the format and try again.');
          showKanbanStatus(msg, 'error');
          return;
        }

        if (!task.title) {
          var msg = _t('tools.github-automation.js.text3', 'Kanban task must include a "title" field.');
          showKanbanStatus(msg, 'error');
          return;
        }

        parsedAssignee = task.assignee || '';

        var issueTitle = task.title;
        if (task.id) {
          issueTitle = '[' + task.id + '] ' + issueTitle;
        }

        var sections = [];
        sections.push('## Kanban Task \\u2192 GitHub Issue');
        sections.push('');
        var taskBody = task.body || task.description;
        if (taskBody) {
          sections.push('### Description');
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
        var autoMsg = _t('tools.github-automation.js.text4', 'This issue was auto-generated from a Kanban task via the GitHub Automation tool.');
        sections.push('_' + autoMsg + '_');

        issueTitleInput.value = issueTitle;
        issueBodyInput.value = sections.join('\\n');

        if (task.labels && Array.isArray(task.labels) && task.labels.length > 0) {
          var customLabelsInput = document.getElementById('custom-labels');
          if (customLabelsInput) {
            customLabelsInput.value = task.labels.join(', ');
          }
        }

        var successMsg = _t('tools.github-automation.js.text5', 'Kanban task parsed successfully! Preview updated below.');
        showKanbanStatus(successMsg, 'success');

        issueTitleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      function clearKanbanTask() {
        kanbanTaskInput.value = '';
        parsedAssignee = '';
        kanbanParseStatus.classList.add('hidden');
        kanbanParseStatus.textContent = '';
      }

      function showKanbanStatus(message, type) {
        kanbanParseStatus.textContent = message;
        var errorClass = 'text-xs text-red-600 dark:text-red-400';
        var successClass = 'text-xs text-green-600 dark:text-green-400';
        kanbanParseStatus.className = (type === 'error') ? errorClass : successClass;
        kanbanParseStatus.classList.remove('hidden');
      }

      async function createIssue() {
        if (!isConnected) {
          var msg = _t('tools.github-automation.js.text6', 'Please connect to GitHub first.');
          updateStatus(msg, 'error');
          return;
        }

        var token = githubToken.value.trim();
        var owner = repoOwner.value.trim();
        var name = repoName.value.trim();
        var title = document.getElementById('issue-title').value.trim();

        var body;
        if (!useTemplateCheckbox.checked) {
          body = _t('tools.github-automation.js.text7', 'This issue was automatically generated by the GitHub Automation tool to track work identified through Kanban analysis.');
        } else {
          body = document.getElementById('issue-body').value.trim();
        }

        if (!title || !body) {
          var msg = _t('tools.github-automation.js.text8', 'Please provide both title and description for the issue.');
          updateStatus(msg, 'error');
          return;
        }

        try {
          createIssueBtn.disabled = true;
          createIssueBtn.textContent = _t('tools.github-automation.js.text9', 'Creating...');

          var customLabelsInput = document.getElementById('custom-labels').value;
          var customLabels = customLabelsInput
            .split(',')
            .map(function(l) { return l.trim(); })
            .filter(function(l) { return l.length > 0; });
          var labels = customLabels.length > 0 ? customLabels : ['automation', 'trac3r00'];

          var requestBody = {
            title: title,
            body: body,
            labels: labels
          };

          if (parsedAssignee) {
            requestBody.assignees = [parsedAssignee];
          }

          var response = await fetch('https://api.github.com/repos/' + owner + '/' + name + '/issues', {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + token,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            throw new Error('Failed to create issue: ' + response.status + ' ' + response.statusText);
          }

          var newIssue = await response.json();
          var createdMsg = _t('tools.github-automation.js.text15', 'Issue created successfully:');
          updateStatus(createdMsg + ' <a href="' + newIssue.html_url + '" target="_blank" class="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">#' + newIssue.number + ' ' + escapeHtml(newIssue.title) + '</a>', 'success');

          loadRecentIssues(token, owner, name);
        } catch (error) {
          var failMsg = _t('tools.github-automation.js.text16', 'Failed to create issue:');
          updateStatus(failMsg + ' ' + escapeHtml(error.message), 'error');
        } finally {
          createIssueBtn.disabled = false;
          createIssueBtn.textContent = _t('tools.github-automation.ui.button1', 'Create Issue');
        }
      }

      function updateStatus(message, type) {
        if (!type) type = 'info';
        statusMessage.innerHTML = message;
        statusMessage.className = 'text-sm ' + (type === 'error' ? 'text-red-600 dark:text-red-400' : type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-surface-700 dark:text-surface-300');
      }

      repoOwner.value = 'trac3r00';
      repoName.value = 'simpletool-app';
    </script>
  `;

  return respondHTML(createPageTemplate({
    title,
    description,
    lang: currentLang,
    path: '/github-automation',
    content,
    scripts
  }));
}
