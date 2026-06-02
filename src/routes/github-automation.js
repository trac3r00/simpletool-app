import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { createRelatedToolsSection } from '../utils/content-ui.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

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

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      ${header}

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Configuration Section -->
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

          <!-- Kanban Task Input Section -->
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

        <!-- Preview & Action Section -->
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
                  placeholder="Issue title" data-i18n-placeholder="tools.github-automation.ui.placeholder4" value="[Automation] Task created by GitHub Automation tool">
              </div>
              
              <div>
                <label for="issue-body" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1" data-i18n="tools.github-automation.ui.label6">Description</label>
                <textarea id="issue-body" rows="8" 
                  class="w-full p-3 bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm resize-y"
                  placeholder="Issue description" data-i18n-placeholder="tools.github-automation.ui.placeholder5">## Automation Task

This issue was automatically generated by the GitHub Automation tool to track work identified through Kanban analysis.

### Description
Task automatically created from recurring Kanban demand patterns. This represents work that should be processed through the standard development pipeline.

### Next Steps
1. Triage this issue to determine if it's ready for development
2. Assign to appropriate team members
3. Add detailed requirements if needed
4. Move through the standard development workflow

### Labels
- automation: This issue was created automatically
- trac3r00: Related to Trac3r00 automation system

---
_Automatically generated issue. Please review and update with specific details as needed._</textarea>
              </div>
            </div>
          </div>
          
          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-5">
            <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4" data-i18n="tools.github-automation.ui.heading3">Status</h2>
            <div id="status-message" class="text-sm text-surface-700 dark:text-surface-300">
              <p data-i18n="tools.github-automation.ui.text0">Please configure GitHub connection to begin automation.</p>
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
    
    <script>
      // DOM Elements
      const connectBtn = document.getElementById('connect-btn');
      const createIssueBtn = document.getElementById('create-issue-btn');
      const githubToken = document.getElementById('github-token');
      const repoOwner = document.getElementById('repo-owner');
      const repoName = document.getElementById('repo-name');
      const statusMessage = document.getElementById('status-message');
      const issuesList = document.getElementById('issues-list');
      const issuesContainer = document.getElementById('issues-container');
      const kanbanTaskInput = document.getElementById('kanban-task-input');
      const parseKanbanBtn = document.getElementById('parse-kanban-btn');
      const clearKanbanBtn = document.getElementById('clear-kanban-btn');
      const kanbanParseStatus = document.getElementById('kanban-parse-status');
      const issueTitleInput = document.getElementById('issue-title');
      const issueBodyInput = document.getElementById('issue-body');
      
      // State
      let isConnected = false;
      let issues = [];
      let parsedAssignee = "";
      
      // Event Listeners
      connectBtn.addEventListener('click', connectToGitHub);
      createIssueBtn.addEventListener('click', createIssue);
      parseKanbanBtn.addEventListener('click', parseKanbanTask);
      clearKanbanBtn.addEventListener('click', clearKanbanTask);
      
      // Functions
      async function connectToGitHub() {
        const token = githubToken.value.trim();
        const owner = repoOwner.value.trim();
        const name = repoName.value.trim();
        
        if (!token || !owner || !name) {
          updateStatus('Please fill in all required fields.', 'error');
          return;
        }
        
        try {
          // Test connection to GitHub API
          const response = await fetch(\`https://api.github.com/repos/\${owner}/\${name}\`, {
            headers: {
              'Authorization': \`Bearer \${token}\`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });
          
          if (!response.ok) {
            throw new window.Error(\`GitHub API error: \${response.status} \${response.statusText}\`);
          }
          
          isConnected = true;
          updateStatus('Successfully connected to GitHub repository!', 'success');
          createIssueBtn.disabled = false;
          
          // Load recent issues
          loadRecentIssues(token, owner, name);
        } catch (error) {
          updateStatus(\`Connection failed: \${error.message}\`, 'error');
        }
      }
      
      async function loadRecentIssues(token, owner, name) {
        try {
          const response = await fetch(\`https://api.github.com/repos/\${owner}/\${name}/issues?state=open&sort=created&direction=desc&per_page=5\`, {
            headers: {
              'Authorization': \`Bearer \${token}\`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });
          
          if (!response.ok) {
            throw new window.Error(\`Failed to load issues: \${response.status} \${response.statusText}\`);
          }
          
          issues = await response.json();
          displayIssues();
        } catch (error) {
          updateStatus(\`Failed to load issues: \${error.message}\`, 'error');
        }
      }
      
      function displayIssues() {
        if (issues.length === 0) {
          issuesContainer.innerHTML = '<p class="text-sm text-surface-500 dark:text-surface-400" data-i18n="tools.github-automation.js.text0">No open issues found</p>';
        } else {
          issuesContainer.innerHTML = issues.map(issue => \`
            <div class="bg-surface-50 dark:bg-surface-900 rounded-lg p-3 border border-surface-200 dark:border-surface-800">
              <div class="flex justify-between">
                <a href="\${issue.html_url}" target="_blank" class="text-sm font-medium text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">#\${issue.number} \${issue.title}</a>
                <span class="text-xs text-surface-500 dark:text-surface-400">\${new window.Date(issue.created_at).toLocaleDateString()}</span>
              </div>
              <div class="mt-1 flex flex-wrap gap-1">
                \${issue.labels.map(label => \`
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium \${label.color ? 'text-white' : 'bg-surface-100 text-surface-800 dark:bg-surface-800 dark:text-surface-100'}" style="\${label.color ? \`background-color: #\${label.color}\` : ''}">
                    \${label.name}
                  </span>
                \`).join('')}
              </div>
            </div>
          \`).join('');
        }
        
        issuesList.classList.remove('hidden');
      }
      
      // Kanban Task Parsing
      function parseKanbanTask() {
        const rawInput = kanbanTaskInput.value.trim();
        if (!rawInput) {
          showKanbanStatus('Please paste a Kanban task JSON first.', 'error');
          return;
        }

        let task;
        try {
          task = JSON.parse(rawInput);
        } catch (e) {
          showKanbanStatus('Invalid JSON. Please check the format and try again.', 'error');
          return;
        }

        if (!task.title) {
          showKanbanStatus('Kanban task must include a "title" field.', 'error');
          return;
        }

        parsedAssignee = task.assignee || "";

        // Build issue title: prefix with task id if present
        let issueTitle = task.title;
        if (task.id) {
          issueTitle = '[' + task.id + '] ' + issueTitle;
        }

        // Build issue body with Kanban task details
        const sections = [];
        sections.push('## Kanban Task → GitHub Issue');
        sections.push('');
        const taskBody = task.body || task.description;
        if (taskBody) {
          sections.push('### Description\\n' + taskBody);
          sections.push('');
        }

        // Priority mapping
        const priorityLabels = { 0: 'critical', 1: 'high', 2: 'medium', 3: 'low' };
        if (task.priority !== undefined) {
          const pLabel = priorityLabels[task.priority] || ('p' + task.priority);
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
        sections.push('_This issue was auto-generated from a Kanban task via the GitHub Automation tool._');

        // Populate the preview form
        issueTitleInput.value = issueTitle;
        issueBodyInput.value = sections.join('\\n');

        // Auto-fill custom labels from Kanban task if provided
        if (task.labels && Array.isArray(task.labels) && task.labels.length > 0) {
          const customLabelsInput = document.getElementById('custom-labels');
          if (customLabelsInput && task.labels.length > 0) {
            customLabelsInput.value = task.labels.join(', ');
          }
        }

        showKanbanStatus('Kanban task parsed successfully! Preview updated below.', 'success');

        // Scroll preview into view
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
          updateStatus('Please connect to GitHub first.', 'error');
          return;
        }
        
        const token = githubToken.value.trim();
        const owner = repoOwner.value.trim();
        const name = repoName.value.trim();
        const title = document.getElementById('issue-title').value.trim();
        let body = document.getElementById('issue-body').value.trim();
        const templateToggle = document.getElementById("use-trac3r00-template");
        if (templateToggle && !templateToggle.checked) {
          body = 'This issue was automatically generated by the GitHub Automation tool to track work identified through Kanban analysis.';
        }
        
        if (!title || !body) {
          updateStatus('Please provide both title and description for the issue.', 'error');
          return;
        }
        
        try {
          createIssueBtn.disabled = true;
          createIssueBtn.textContent = _t('tools.github-automation.js.text1', 'Creating...');
          
          const customLabelsInput = document.getElementById('custom-labels').value;
          const customLabels = customLabelsInput
            .split(',')
            .map(l => l.trim())
            .filter(l => l.length > 0);
          const defaultLabels = ['automation', 'trac3r00'];
          const labels = customLabels.length > 0 ? [...new Set([...defaultLabels, ...customLabels])] : defaultLabels;
          
          const requestBody = {
            title,
            body,
            labels
          };
          
          if (parsedAssignee) {
            requestBody.assignees = [parsedAssignee];
          }
          
          const response = await fetch(\`https://api.github.com/repos/\${owner}/\${name}/issues\`, {
            method: 'POST',
            headers: {
              'Authorization': \`Bearer \${token}\`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          });
          
          if (!response.ok) {
            throw new window.Error(\`Failed to create issue: \${response.status} \${response.statusText}\`);
          }
          
          const newIssue = await response.json();
          updateStatus(\`Issue created successfully: <a href="\${newIssue.html_url}" target="_blank" class="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">#\${newIssue.number} \${newIssue.title}</a>\`, 'success');
          
          // Reload issues
          loadRecentIssues(token, owner, name);
        } catch (error) {
          updateStatus(\`Failed to create issue: \${error.message}\`, 'error');
        } finally {
          createIssueBtn.disabled = false;
          createIssueBtn.textContent = _t('tools.github-automation.ui.button1', 'Create Issue');
        }
      }
      
      function updateStatus(message, type = 'info') {
        statusMessage.innerHTML = message;
        statusMessage.className = \`text-sm \${type === 'error' ? 'text-red-600 dark:text-red-400' : type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-surface-700 dark:text-surface-300'}\`;
      }
      
      // Initialize with defaults for this repository
      repoOwner.value = 'trac3r00';
      repoName.value = 'simpletool-app';
    </script>
  `;

  const scripts = `
    <script>
      // Client-side only - all processing happens in the browser
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