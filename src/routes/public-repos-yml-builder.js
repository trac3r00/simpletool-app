import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader, infoHint } from '../utils/common-ui.js';
import { createRelatedToolsSection } from '../utils/content-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

export async function handlePublicReposYmlBuilderRoutes(request, url) {
  const { pathname } = url;
  if (pathname === '/public-repos-yml-builder' || pathname === '/public-repos-yml-builder/') {
    if (request.method === 'GET') {
      return respondHTML(renderPublicReposYmlBuilderPage(resolveRequestLanguage(request, url)));
    }
    return new Response('Method not allowed', { status: 405 });
  }
  return null;
}

function renderPublicReposYmlBuilderPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('public-repos-yml-builder', currentLang);
  const title = translation?.name || 'Public Repos YAML Builder';
  const description = translation?.desc || 'Generate and validate repos.yml inventories for public repository automation.';
  const currentTool = TOOLS.find((tool) => tool.id === 'public-repos-yml-builder');
  const relatedToolsData = currentTool?.relatedTools?.map((id) => TOOLS.find((tool) => tool.id === id)).filter(Boolean) || [];

  const header = createToolHeader(
    { emoji: '📦' },
    title,
    description,
    [
      { text: '<span data-i18n="tools.public-repos-yml-builder.ui.badge0">Client-Side Only</span>', tooltip: 'All parsing and YAML generation runs in your browser.' },
      { text: '<span data-i18n="tools.public-repos-yml-builder.ui.badge1">Kanban Automation</span>', tooltip: 'Build inventories for recurring public repository audits.' }
    ],
    { toolId: 'public-repos-yml-builder' }
  );

  const sampleRepos = [
    'trac3r00/simpletool-app team=maintainers cadence=weekly sha=missing branch=unknown secrets=review monetization=ready',
    'https://github.com/trac3r00/docs-site team=docs cadence=monthly sha=ok branch=protected secrets=ok monetization=todo'
  ].join('&#10;');

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${header}

        <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <section class="lg:col-span-2 space-y-5">
            <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
              <div class="flex items-center justify-between gap-3 mb-3">
                <label for="repo-input" class="label flex items-center gap-2">
                  <span data-i18n="tools.public-repos-yml-builder.ui.label0">Repository slugs or URLs</span>
                  ${infoHint('Use one repository per line. Add metadata as key=value pairs after the slug, for example team=platform cadence=weekly sha=ok.', 'Help', { i18nKey: 'tools.public-repos-yml-builder.ui.desc0' })}
                </label>
                <button id="load-sample" class="btn btn-ghost btn-xs" type="button" data-i18n="tools.public-repos-yml-builder.ui.button0">Sample</button>
              </div>
              <textarea id="repo-input" rows="13" class="input-mono resize-y" placeholder="${sampleRepos}" data-i18n-placeholder="tools.public-repos-yml-builder.ui.placeholder0"></textarea>
              <p class="mt-2 text-xs text-surface-500 dark:text-surface-400" data-i18n="tools.public-repos-yml-builder.ui.desc1">Accepted metadata: team, cadence, topic, sha, branch, secrets, monetization, notes.</p>
            </div>

            <div class="p-5 bg-surface-50 dark:bg-surface-950 rounded-xl border border-surface-200 dark:border-surface-800">
              <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400 mb-4" data-i18n="tools.public-repos-yml-builder.ui.heading0">Inventory defaults</h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label for="inventory-owner" class="label" data-i18n="tools.public-repos-yml-builder.ui.label1">Owner</label>
                  <input id="inventory-owner" class="input" value="trac3r00" placeholder="trac3r00" />
                </div>
                <div>
                  <label for="automation-cadence" class="label" data-i18n="tools.public-repos-yml-builder.ui.label2">Default cadence</label>
                  <select id="automation-cadence" class="input">
                    <option value="weekly" data-i18n="tools.public-repos-yml-builder.ui.option0">Weekly</option>
                    <option value="biweekly" data-i18n="tools.public-repos-yml-builder.ui.option1">Biweekly</option>
                    <option value="monthly" data-i18n="tools.public-repos-yml-builder.ui.option2">Monthly</option>
                  </select>
                </div>
              </div>
              <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                ${policyCheckbox('sha-pinning', 'SHA pinning', 'Require GitHub Actions and external references to use immutable SHAs.', true)}
                ${policyCheckbox('branch-protection', 'branch protection', 'Require protected default branches and review gates.', true)}
                ${policyCheckbox('secrets-posture', 'secrets posture', 'Require secret scanning and no public repo secrets.', true)}
                ${policyCheckbox('monetization-readiness', 'monetization readiness', 'Track README, license, support, and sponsor readiness.', false)}
              </div>
            </div>

            <div class="flex flex-wrap gap-3 bg-surface-50 dark:bg-surface-950/50 p-2 rounded-lg border border-surface-100 dark:border-surface-800">
              <button id="build-inventory" class="btn btn-primary" type="button" data-i18n="tools.public-repos-yml-builder.ui.button1">Build YAML</button>
              <button id="clear-builder" class="btn btn-ghost" type="button" data-i18n="tools.public-repos-yml-builder.ui.button2">Clear</button>
            </div>
          </section>

          <section class="lg:col-span-3 space-y-5">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3" aria-live="polite">
              ${statBox('repo-count', 'Repos', '0')}
              ${statBox('finding-count', 'Findings', '0')}
              ${statBox('ready-count', 'Ready', '0')}
              ${statBox('policy-count', 'Policies', '3')}
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
                <div class="flex items-center justify-between gap-3 mb-3">
                  <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400" data-i18n="tools.public-repos-yml-builder.ui.heading1">repos.yml</h2>
                  <button id="copy-yaml" class="btn btn-secondary btn-xs" type="button" disabled data-i18n="tools.public-repos-yml-builder.ui.button3">Copy</button>
                </div>
                <textarea id="repos-yaml-output" rows="18" class="input-mono resize-y bg-surface-50 dark:bg-surface-950" readonly placeholder="repositories: []" data-i18n-placeholder="tools.public-repos-yml-builder.ui.placeholder1"></textarea>
              </div>

              <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
                <div class="flex items-center justify-between gap-3 mb-3">
                  <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400" data-i18n="tools.public-repos-yml-builder.ui.heading2">GitHub Actions audit</h2>
                  <button id="copy-actions" class="btn btn-secondary btn-xs" type="button" disabled data-i18n="tools.public-repos-yml-builder.ui.button3">Copy</button>
                </div>
                <textarea id="actions-output" rows="18" class="input-mono resize-y bg-surface-50 dark:bg-surface-950" readonly placeholder="name: Public repos audit" data-i18n-placeholder="tools.public-repos-yml-builder.ui.placeholder2"></textarea>
              </div>
            </div>

            <div class="p-5 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800">
              <div class="flex items-center justify-between gap-3 mb-3">
                <h2 class="text-sm font-bold uppercase tracking-wide text-surface-600 dark:text-surface-400" data-i18n="tools.public-repos-yml-builder.ui.heading3">Policy findings</h2>
                <span id="validation-status" class="text-xs font-medium text-surface-500 dark:text-surface-400" data-i18n="tools.public-repos-yml-builder.ui.text0">Waiting for input</span>
              </div>
              <div id="findings-list" class="space-y-2 text-sm text-surface-700 dark:text-surface-200">
                <p class="text-surface-500 dark:text-surface-400" data-i18n="tools.public-repos-yml-builder.ui.desc2">Paste repositories and build YAML to validate recurring automation policy needs.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
      ${createRelatedToolsSection(relatedToolsData)}
    </main>
  `;

  const scripts = String.raw`
    <script src="/vendor/js-yaml.min.js" integrity="sha384-ZeqCzuWczURac3RacSufGD7oSbzeaX7xxnnOr3PTcYTLx4Av0qBj0kBq7AeCtHLA" crossorigin="anonymous"></script>
    <script>
      (function() {
        const tr = (key, fallback) => (window._t ? window._t('tools.public-repos-yml-builder.js.' + key, fallback) : fallback);
        const $ = (id) => document.getElementById(id);
        const els = {
          repoInput: $('repo-input'),
          owner: $('inventory-owner'),
          cadence: $('automation-cadence'),
          build: $('build-inventory'),
          clear: $('clear-builder'),
          sample: $('load-sample'),
          yaml: $('repos-yaml-output'),
          actions: $('actions-output'),
          copyYaml: $('copy-yaml'),
          copyActions: $('copy-actions'),
          findings: $('findings-list'),
          status: $('validation-status'),
          repoCount: $('repo-count'),
          findingCount: $('finding-count'),
          readyCount: $('ready-count'),
          policyCount: $('policy-count')
        };

        const sample = [
          'trac3r00/simpletool-app team=maintainers cadence=weekly sha=missing branch=unknown secrets=review monetization=ready',
          'https://github.com/trac3r00/docs-site team=docs cadence=monthly sha=ok branch=protected secrets=ok monetization=todo'
        ].join('\n');

        function selectedPolicies() {
          return {
            sha_pinning: $('policy-sha-pinning').checked,
            branch_protection: $('policy-branch-protection').checked,
            secrets_posture: $('policy-secrets-posture').checked,
            monetization_readiness: $('policy-monetization-readiness').checked
          };
        }

        function normalizeRepoToken(token, fallbackOwner) {
          const value = String(token || '').trim();
          if (!value) return null;
          let match = value.match(/^https?:\/\/github\.com\/([^\/\s]+)\/([^\/\s#?]+)(?:[\/#?].*)?$/i);
          if (match) return { owner: match[1], name: match[2].replace(/\.git$/i, '') };
          match = value.match(/^git@github\.com:([^\/\s]+)\/([^\/\s#?]+?)(?:\.git)?$/i);
          if (match) return { owner: match[1], name: match[2].replace(/\.git$/i, '') };
          match = value.match(/^([^\/\s]+)\/([^\/\s]+)$/);
          if (match) return { owner: match[1], name: match[2].replace(/\.git$/i, '') };
          if (/^[A-Za-z0-9._-]+$/.test(value) && fallbackOwner) return { owner: fallbackOwner, name: value.replace(/\.git$/i, '') };
          return null;
        }

        function parseMetadata(parts) {
          const metadata = {};
          parts.forEach((part) => {
            const match = String(part).match(/^([A-Za-z][A-Za-z0-9_-]*)=(.*)$/);
            if (!match) return;
            metadata[match[1].replace(/-/g, '_').toLowerCase()] = match[2];
          });
          return metadata;
        }

        function parseRepositories() {
          const fallbackOwner = els.owner.value.trim();
          return String(els.repoInput.value || '').split(/\n+/).map((line, index) => {
            const raw = line.replace(/\s+#.*$/, '').trim();
            if (!raw) return null;
            const parts = raw.split(/[,\s]+/).filter(Boolean);
            const repo = normalizeRepoToken(parts[0], fallbackOwner);
            if (!repo) {
              return { invalid: true, line: index + 1, raw };
            }
            const metadata = parseMetadata(parts.slice(1));
            return {
              slug: repo.owner + '/' + repo.name,
              owner: repo.owner,
              name: repo.name,
              visibility: 'public',
              automation: {
                cadence: metadata.cadence || els.cadence.value,
                kanban: true,
                recurring_demand: true
              },
              stewardship: {
                team: metadata.team || 'maintainers',
                topic: metadata.topic || 'public-repo-audit'
              },
              policy: {
                sha_pinning: metadata.sha || 'review',
                branch_protection: metadata.branch || 'review',
                secrets_posture: metadata.secrets || 'review',
                monetization_readiness: metadata.monetization || 'review'
              },
              notes: metadata.notes || ''
            };
          }).filter(Boolean);
        }

        function isOk(value, allowed) {
          return allowed.indexOf(String(value || '').toLowerCase()) !== -1;
        }

        function validateRepos(repos, policies) {
          const findings = [];
          repos.forEach((repo) => {
            if (repo.invalid) {
              findings.push({ level: 'high', repo: 'line ' + repo.line, text: tr('invalidRepo', 'Could not parse repository slug or GitHub URL.') });
              return;
            }
            if (policies.sha_pinning && !isOk(repo.policy.sha_pinning, ['ok', 'pinned', 'sha', 'true'])) {
              findings.push({ level: 'medium', repo: repo.slug, text: tr('shaPinning', 'SHA pinning needs review for workflow actions and third-party references.') });
            }
            if (policies.branch_protection && !isOk(repo.policy.branch_protection, ['ok', 'protected', 'true'])) {
              findings.push({ level: 'high', repo: repo.slug, text: tr('branchProtection', 'branch protection is not marked protected.') });
            }
            if (policies.secrets_posture && !isOk(repo.policy.secrets_posture, ['ok', 'clean', 'enabled', 'true'])) {
              findings.push({ level: 'medium', repo: repo.slug, text: tr('secretsPosture', 'secrets posture needs confirmation before public automation.') });
            }
            if (policies.monetization_readiness && !isOk(repo.policy.monetization_readiness, ['ok', 'ready', 'true'])) {
              findings.push({ level: 'low', repo: repo.slug, text: tr('monetizationReadiness', 'monetization readiness is not marked ready.') });
            }
          });
          return findings;
        }

        function buildInventory(validRepos, policies) {
          return {
            version: 1,
            generated_by: 'simpletool-public-repos-yml-builder',
            defaults: {
              visibility: 'public',
              automation_cadence: els.cadence.value,
              policies
            },
            repositories: validRepos.map((repo) => ({
              slug: repo.slug,
              visibility: repo.visibility,
              team: repo.stewardship.team,
              topic: repo.stewardship.topic,
              automation: repo.automation,
              policy: repo.policy,
              notes: repo.notes
            }))
          };
        }

        function buildActionsSnippet() {
          return [
            'name: Public repos audit',
            '',
            'on:',
            '  schedule:',
            "    - cron: '21 13 * * 1'",
            '  workflow_dispatch:',
            '',
            'permissions:',
            '  contents: read',
            '  security-events: read',
            '',
            'jobs:',
            '  audit:',
            '    runs-on: ubuntu-latest',
            '    steps:',
            '      # Replace action ref placeholders with approved full 40-character commit SHAs.',
            '      - uses: actions/checkout@<actions_checkout_commit_sha>',
            '      - name: Initialize CodeQL for public repo posture',
            '        uses: github/codeql-action/init@<codeql_action_init_commit_sha>',
            '        with:',
            '          languages: javascript',
            '      - name: Validate repos.yml inventory',
            '        shell: bash',
            '        run: |',
            '          test -s repos.yml',
            '          grep -q "visibility: public" repos.yml',
            '          grep -q "sha_pinning:" repos.yml',
            '          grep -q "branch_protection:" repos.yml',
            '          grep -q "secrets_posture:" repos.yml',
            '          grep -q "monetization_readiness:" repos.yml',
            '          echo "Review generated findings in Kanban automation."'
          ].join('\n');
        }

        function setOutput(value) {
          if (window.jsyaml && typeof window.jsyaml.dump === 'function') {
            els.yaml.value = window.jsyaml.dump(value, { lineWidth: 110, noRefs: true });
          } else {
            els.yaml.value = JSON.stringify(value, null, 2);
          }
          els.actions.value = buildActionsSnippet();
          els.copyYaml.disabled = !els.yaml.value.trim();
          els.copyActions.disabled = !els.actions.value.trim();
        }

        function renderFindings(findings) {
          els.findings.innerHTML = '';
          if (findings.length === 0) {
            const p = document.createElement('p');
            p.className = 'text-success-700 dark:text-success-300';
            p.textContent = tr('noFindings', 'No findings for the selected policy checks.');
            els.findings.appendChild(p);
            return;
          }
          findings.forEach((finding) => {
            const row = document.createElement('div');
            row.className = 'rounded-lg border p-3 ' + (
              finding.level === 'high'
                ? 'bg-error-50 dark:bg-error-900/20 text-error-800 dark:text-error-200 border-error-200 dark:border-error-800'
                : finding.level === 'medium'
                  ? 'bg-warning-50 dark:bg-warning-900/20 text-warning-800 dark:text-warning-200 border-warning-200 dark:border-warning-800'
                  : 'bg-surface-50 dark:bg-surface-950 text-surface-800 dark:text-surface-200 border-surface-200 dark:border-surface-800'
            );
            row.textContent = finding.repo + ': ' + finding.text;
            els.findings.appendChild(row);
          });
        }

        function updateStats(repos, findings, policies) {
          const validRepos = repos.filter((repo) => !repo.invalid);
          const repoSlugsWithFindings = new Set(findings.map((finding) => finding.repo).filter((repo) => repo.indexOf('/') > 0));
          els.repoCount.textContent = String(validRepos.length);
          els.findingCount.textContent = String(findings.length);
          els.readyCount.textContent = String(validRepos.length - repoSlugsWithFindings.size);
          els.policyCount.textContent = String(Object.values(policies).filter(Boolean).length);
          els.status.textContent = findings.length ? tr('needsReview', 'Needs review') : tr('ready', 'Ready');
        }

        function build() {
          const repos = parseRepositories();
          const policies = selectedPolicies();
          const findings = validateRepos(repos, policies);
          const validRepos = repos.filter((repo) => !repo.invalid);
          setOutput(buildInventory(validRepos, policies));
          renderFindings(findings);
          updateStats(repos, findings, policies);
        }

        async function copyFrom(el, button) {
          const value = el.value;
          if (!value.trim()) return;
          try {
            await navigator.clipboard.writeText(value);
            const old = button.textContent;
            button.textContent = tr('copied', 'Copied');
            setTimeout(() => { button.textContent = old; }, 1200);
          } catch (error) {
            console.error('Copy failed:', error);
          }
        }

        els.build.addEventListener('click', build);
        els.sample.addEventListener('click', () => {
          els.repoInput.value = sample;
          build();
        });
        els.clear.addEventListener('click', () => {
          els.repoInput.value = '';
          els.yaml.value = '';
          els.actions.value = '';
          els.copyYaml.disabled = true;
          els.copyActions.disabled = true;
          renderFindings([]);
          updateStats([], [], selectedPolicies());
          els.status.textContent = tr('waiting', 'Waiting for input');
        });
        els.copyYaml.addEventListener('click', () => copyFrom(els.yaml, els.copyYaml));
        els.copyActions.addEventListener('click', () => copyFrom(els.actions, els.copyActions));
        ['sha-pinning', 'branch-protection', 'secrets-posture', 'monetization-readiness'].forEach((id) => {
          $('policy-' + id).addEventListener('change', build);
        });

        els.repoInput.value = sample;
        build();
      })();
    </script>
  `;

  return createPageTemplate({
    title,
    description,
    path: '/public-repos-yml-builder',
    content,
    scripts,
    lang: currentLang
  });
}

function policyCheckbox(id, label, help, checked) {
  return `
    <label class="flex items-start gap-3 rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-3 cursor-pointer">
      <input id="policy-${id}" type="checkbox" class="mt-1 w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500" ${checked ? 'checked' : ''}>
      <span>
        <span class="block text-sm font-semibold text-surface-900 dark:text-surface-100">${label}</span>
        <span class="block text-xs text-surface-500 dark:text-surface-400">${help}</span>
      </span>
    </label>
  `;
}

function statBox(id, label, value) {
  return `
    <div class="p-4 bg-surface-50 dark:bg-surface-950 rounded-xl border border-surface-200 dark:border-surface-800">
      <div class="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400">${label}</div>
      <div id="${id}" class="mt-1 text-2xl font-bold font-mono text-surface-900 dark:text-surface-50">${value}</div>
    </div>
  `;
}
