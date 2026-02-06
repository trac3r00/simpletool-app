import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader, createCheatsheet, infoHint } from '../utils/common-ui.js';

export async function handleRegexVisualizerRoutes(request) {
  const requestPath = new URL(request.url).pathname;
  const canonicalPath = requestPath.replace(/\/$/, '') || '/';
  const title = 'Regex Studio';
  const description = 'Visualize regular expressions with railroad diagrams, test matches in real-time, and generate code snippets.';

  const header = createToolHeader(
    { emoji: '🧩' },
    title,
    'Understand, test, and debug regular expressions with interactive visualizations and real-time explanations.',
    [{ text: 'Visualizer', tooltip: 'Renders interactive railroad diagrams so you can explore the regex structure.' },
     { text: 'Tester', tooltip: 'Run the regex against example text instantly to validate matches.' },
     { text: 'Code Gen', tooltip: 'Generate ready-to-use snippets showing how to use the pattern in code.' }],
    { toolId: 'regex-visualizer' }
  );

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      ${header}

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Left Column: Input & Controls -->
        <div class="lg:col-span-4 space-y-6">
          
          <!-- Regex Input -->
          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-5">
            <label for="regex-input" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"><span data-i18n="tools.regex-visualizer.ui.label3">Regular Expression</span> ${infoHint('Use JS regex syntax; escape backslashes (\\\\) and omit surrounding / delimiters.')}</label>
            <div class="relative flex items-center">
              <span class="absolute left-3 text-surface-400 font-mono text-lg">/</span>
              <input type="text" id="regex-input" data-tooltip="Enter a regular expression pattern" 
                class="w-full pl-6 pr-16 py-2.5 bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-surface-900 dark:text-white"
                placeholder="e.g. [a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}"
                value="([A-Z])\\w+"
                spellcheck="false"
              >
              <span class="absolute right-3 text-surface-400 font-mono text-lg">/</span>
            </div>
            
            <!-- Flags -->
            <div class="mt-3 flex flex-wrap gap-2">
              <label class="inline-flex items-center px-2 py-1 rounded bg-surface-100 dark:bg-surface-800 cursor-pointer hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors">
                <input type="checkbox" id="flag-g" data-tooltip="Global — find all matches, not just the first" class="rounded border-surface-300 text-primary-600 focus:ring-primary-500" checked>
                <span class="ml-2 text-xs font-mono text-surface-700 dark:text-surface-300" data-i18n="tools.regex-visualizer.ui.desc13">g (global)</span>
              </label>
              <label class="inline-flex items-center px-2 py-1 rounded bg-surface-100 dark:bg-surface-800 cursor-pointer hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors">
                <input type="checkbox" id="flag-i" data-tooltip="Case-insensitive — A matches a" class="rounded border-surface-300 text-primary-600 focus:ring-primary-500">
                <span class="ml-2 text-xs font-mono text-surface-700 dark:text-surface-300" data-i18n="tools.regex-visualizer.ui.desc14">i (insensitive)</span>
              </label>
              <label class="inline-flex items-center px-2 py-1 rounded bg-surface-100 dark:bg-surface-800 cursor-pointer hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors">
                <input type="checkbox" id="flag-m" data-tooltip="Multiline — ^ and $ match line boundaries" class="rounded border-surface-300 text-primary-600 focus:ring-primary-500">
                <span class="ml-2 text-xs font-mono text-surface-700 dark:text-surface-300" data-i18n="tools.regex-visualizer.ui.desc15">m (multiline)</span>
              </label>
            </div>
          </div>

          <!-- Test String Input -->
          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-5">
            <div class="flex justify-between items-center mb-2">
              <label for="test-string" class="block text-sm font-medium text-surface-700 dark:text-surface-300"><span data-i18n="tools.regex-visualizer.ui.label4">Test String</span> ${infoHint('Enter sample text to test against; matches highlight instantly below.')}</label>
              <span id="match-count" class="text-xs font-medium px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400" data-i18n="tools.regex-visualizer.ui.desc16">2 matches</span>
            </div>
            <textarea id="test-string" rows="6" data-tooltip="Text to test the regex pattern against" 
              class="w-full p-3 bg-surface-50 dark:bg-surface-950 border border-surface-300 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm text-surface-900 dark:text-white resize-y"
              placeholder="Enter text to test against..." data-i18n-placeholder="tools.regex-visualizer.ui.placeholder6"
              spellcheck="false"></textarea>
          </div>

          <!-- Code Generator -->
          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-5">
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3"><span data-i18n="tools.regex-visualizer.ui.label5">Code Snippet</span></label>
            <div class="flex gap-2 mb-3 overflow-x-auto pb-1">
              <button class="lang-btn active px-3 py-1 text-xs font-medium rounded-md bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300 whitespace-nowrap" data-lang="js"><span data-i18n="tools.regex-visualizer.ui.button0">JavaScript</span></button>
              <button class="lang-btn px-3 py-1 text-xs font-medium rounded-md bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 whitespace-nowrap" data-lang="python"><span data-i18n="tools.regex-visualizer.ui.button1">Python</span></button>
              <button class="lang-btn px-3 py-1 text-xs font-medium rounded-md bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 whitespace-nowrap" data-lang="php">PHP</button>
              <button class="lang-btn px-3 py-1 text-xs font-medium rounded-md bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 whitespace-nowrap" data-lang="java"><span data-i18n="tools.regex-visualizer.ui.button2">Java</span></button>
            </div>
            <div class="relative group">
              <pre class="bg-surface-900 text-surface-50 p-3 rounded-lg text-xs font-mono overflow-x-auto"><code id="code-output">const regex = /([A-Z])\w+/g;
const str = '';
let m;

while ((m = regex.exec(str)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
        regex.lastIndex++;
    }
    
    // The result can be accessed through the \`m\`-variable.
    m.forEach((match, groupIndex) => {
        console.log(\`Found match, group \${groupIndex}: \${match}\`);
    });
}</code></pre>
              <button onclick="copyCode()" class="absolute top-2 right-2 p-1.5 rounded-md bg-surface-700 text-surface-300 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface-600" title="Copy code" data-i18n-title="tools.regex-visualizer.ui.title7">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
              </button>
            </div>
          </div>

        </div>

        <!-- Right Column: Visualization & Results -->
        <div class="lg:col-span-8 space-y-6">
          
          <!-- Railroad Diagram -->
          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-5 overflow-hidden">
            <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"></path></svg>
              Visualization
            </h2>
            <div id="railroad-container" class="w-full overflow-x-auto flex justify-center py-4 min-h-[120px] bg-surface-50 dark:bg-surface-950/50 rounded-lg border border-surface-100 dark:border-surface-800/50">
              <!-- SVG injected here -->
              <div class="flex items-center justify-center text-surface-400 text-sm italic">Generating diagram...</div>
            </div>
            <div id="explanation-container" class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30">
              <h3 class="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2" data-i18n="tools.regex-visualizer.ui.heading12">Explanation</h3>
              <ul id="explanation-list" class="list-disc list-inside text-sm text-blue-700 dark:text-blue-200 space-y-1">
                <!-- Explanation items injected here -->
              </ul>
            </div>
          </div>

          <!-- Match Results -->
          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-5">
            <h2 class="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Match Results
            </h2>
            
            <!-- Highlighted Text Display -->
            <div class="relative mb-6">
              <div id="highlight-display" class="w-full p-4 bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-700 rounded-lg font-mono text-sm whitespace-pre-wrap break-all min-h-[100px] max-h-[300px] overflow-y-auto text-surface-800 dark:text-surface-200"></div>
            </div>

            <!-- Groups Table -->
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-surface-200 dark:divide-surface-700">
                <thead class="bg-surface-50 dark:bg-surface-800">
                  <tr>
                    <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider" data-i18n="tools.regex-visualizer.ui.stat8">Match #</th>
                    <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider" data-i18n="tools.regex-visualizer.ui.stat9">Full Match</th>
                    <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider" data-i18n="tools.regex-visualizer.ui.stat10">Groups</th>
                    <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider" data-i18n="tools.regex-visualizer.ui.stat11">Index</th>
                  </tr>
                </thead>
                <tbody id="groups-table-body" class="bg-white dark:bg-surface-900 divide-y divide-surface-200 dark:divide-surface-800">
                  <!-- Rows injected here -->
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      ${createCheatsheet('regex-visualizer', 'Regex Quick Reference', [
        { heading: 'Character Classes', content: `
          <table>
            <tr><th>Pattern</th><th>Matches</th></tr>
            <tr><td><code>\\\\d</code></td><td>Any digit (0-9)</td></tr>
            <tr><td><code>\\\\w</code></td><td>Word char (a-z, A-Z, 0-9, _)</td></tr>
            <tr><td><code>\\\\s</code></td><td>Whitespace</td></tr>
            <tr><td><code>.</code></td><td>Any char except newline</td></tr>
            <tr><td><code>[abc]</code></td><td>Any of a, b, or c</td></tr>
            <tr><td><code>[^abc]</code></td><td>Not a, b, or c</td></tr>
          </table>` },
        { heading: 'Quantifiers', content: `
          <table>
            <tr><th>Pattern</th><th>Meaning</th></tr>
            <tr><td><code>*</code></td><td>0 or more</td></tr>
            <tr><td><code>+</code></td><td>1 or more</td></tr>
            <tr><td><code>?</code></td><td>0 or 1</td></tr>
            <tr><td><code>{n}</code></td><td>Exactly n</td></tr>
            <tr><td><code>{n,m}</code></td><td>Between n and m</td></tr>
          </table>` },
        { heading: 'Anchors &amp; Groups', content: `
          <table>
            <tr><th>Pattern</th><th>Meaning</th></tr>
            <tr><td><code>^</code></td><td>Start of string</td></tr>
            <tr><td><code>$</code></td><td>End of string</td></tr>
            <tr><td><code>(...)</code></td><td>Capture group</td></tr>
            <tr><td><code>(?:...)</code></td><td>Non-capture group</td></tr>
            <tr><td><code>(?=...)</code></td><td>Lookahead</td></tr>
            <tr><td><code>\\\\b</code></td><td>Word boundary</td></tr>
          </table>` },
        { heading: 'Common Patterns', content: `
          <table>
            <tr><th>Pattern</th><th>Matches</th></tr>
            <tr><td><code>^[\\\\w.+-]+@[\\\\w-]+\\\\.[\\\\w.]+$</code></td><td>Email</td></tr>
            <tr><td><code>^https?:\\/\\/</code></td><td>URL</td></tr>
            <tr><td><code>^\\\\d{4}-\\\\d{2}-\\\\d{2}$</code></td><td>Date (YYYY-MM-DD)</td></tr>
            <tr><td><code>^\\\\d{1,3}\\\\.\\\\d{1,3}\\\\.\\\\d{1,3}\\\\.\\\\d{1,3}$</code></td><td>IPv4</td></tr>
          </table>` }
      ])}
    </main>
  `;

  const scripts = `
    <!-- Load Railroad Diagrams Library -->
    <script src="/vendor/railroad-diagrams.min.js" integrity="sha384-YdMeBSsZY+jPBk0rvaqrK8azzGbq4/u4q0mUM0hvkB2lwutweqQcwoVyiM8hhz6G" crossorigin="anonymous" defer></script>
    <style>
      svg.railroad-diagram {
          background-color: hsl(30,20%,95%);
      }
      svg.railroad-diagram path {
          stroke-width: 3;
          stroke: black;
          fill: rgba(0,0,0,0);
      }
      svg.railroad-diagram text {
          font: bold 14px monospace;
          text-anchor: middle;
      }
      svg.railroad-diagram text.label {
          text-anchor: start;
      }
      svg.railroad-diagram text.comment {
          font: italic 12px monospace;
      }
      svg.railroad-diagram rect {
          stroke-width: 3;
          stroke: black;
          fill: hsl(120,100%,90%);
      }

      /* Custom styles for railroad diagrams in dark mode */
      .dark svg.railroad-diagram { background-color: transparent; }
      .dark svg.railroad-diagram path { stroke: #94a3b8; }
      .dark svg.railroad-diagram text { fill: #e2e8f0; }
      .dark svg.railroad-diagram rect { fill: #1e293b; stroke: #475569; }
      
      /* Highlight styles */
      .match-highlight { background-color: rgba(59, 130, 246, 0.2); border-bottom: 2px solid #3b82f6; border-radius: 2px; }
      .match-highlight:hover { background-color: rgba(59, 130, 246, 0.3); }
      .dark .match-highlight { background-color: rgba(96, 165, 250, 0.2); border-bottom: 2px solid #60a5fa; }
    </style>

    <script>
      // --- Simple Regex Parser for Railroad Diagrams ---
      // Note: This is a simplified parser for visualization purposes. 
      // It handles common regex constructs but may not support advanced features like lookbehinds perfectly in the diagram.
      
      // Wait for Railroad to be defined
      function waitForRailroad(callback) {
        if (typeof Railroad !== 'undefined') {
          callback();
        } else {
          const check = setInterval(() => {
            if (typeof Railroad !== 'undefined') {
              clearInterval(check);
              callback();
            }
          }, 50);
          
          setTimeout(() => clearInterval(check), 5000);
        }
      }

      class RegexParser {
        constructor(regexStr) {
          this.str = regexStr;
          this.pos = 0;
        }

        peek() { return this.str[this.pos]; }
        consume() { return this.str[this.pos++]; }
        more() { return this.pos < this.str.length; }

        parse() {
          const branches = this.parseAlternation();
          
          if (typeof Railroad === 'undefined') return null;
          return branches.length === 1 ? branches[0] : Railroad.Choice(0, ...branches);
        }

        parseAlternation() {
          if (typeof Railroad === 'undefined') return [];
          const branches = [];
          let currentSequence = [];
          
          while (this.more()) {
            const char = this.peek();
            if (char === '|') {
              this.consume();
              branches.push(currentSequence.length === 1 ? currentSequence[0] : Railroad.Sequence(...currentSequence));
              currentSequence = [];
            } else if (char === ')') {
              break; // Handled by parseGroup
            } else {
              const term = this.parseTerm();
              if (term) currentSequence.push(term);
            }
          }
          
          branches.push(currentSequence.length === 1 ? currentSequence[0] : Railroad.Sequence(...currentSequence));
          return branches;
        }

        parseTerm() {
          if (typeof Railroad === 'undefined') return null;
          let node;
          const char = this.peek();

          if (char === '(') {
            node = this.parseGroup();
          } else if (char === '[') {
            node = this.parseClass();
          } else if (char === '.') {
            this.consume();
            node = Railroad.NonTerminal('any char');
          } else if (char === '^') {
            this.consume();
            node = Railroad.Start();
          } else if (char === '$') {
            this.consume();
            node = Railroad.End();
          } else if (char === '\\\\') {
            node = this.parseEscaped();
          } else {
            this.consume();
            node = Railroad.Terminal(char);
          }

          // Check for quantifier
          if (this.more()) {
            const next = this.peek();
            if (['*', '+', '?', '{'].includes(next)) {
              node = this.parseQuantifier(node);
            }
          }

          return node;
        }

        parseGroup() {
          if (typeof Railroad === 'undefined') return null;
          this.consume(); // (
          
          // Check for non-capturing or other group types
          let comment = 'group';
          if (this.peek() === '?') {
            this.consume();
            if (this.peek() === ':') {
              this.consume();
              comment = null; // Non-capturing
            }
            // Add more group types here if needed
          }

          const branches = this.parseAlternation();
          this.consume(); // )
          
          const content = branches.length === 1 ? branches[0] : Railroad.Choice(0, ...branches);
          return comment ? Railroad.Group(content, comment) : content;
        }

        parseClass() {
          if (typeof Railroad === 'undefined') return null;
          this.consume(); // [
          let content = '';
          let negative = false;
          
          if (this.peek() === '^') {
            negative = true;
            this.consume();
            content += '^';
          }

          while (this.more() && this.peek() !== ']') {
            const char = this.consume();
            content += char;
            if (char === '\\\\' && this.more()) {
              content += this.consume();
            }
          }
          this.consume(); // ]
          
          return Railroad.NonTerminal((negative ? 'not ' : '') + '[' + content.replace('^', '') + ']');
        }

        parseEscaped() {
          if (typeof Railroad === 'undefined') return null;
          this.consume(); // \\
          const char = this.consume();
          const map = {
            'w': 'word char', 'W': 'non-word',
            'd': 'digit', 'D': 'non-digit',
            's': 'whitespace', 'S': 'non-whitespace',
            'b': 'word boundary', 'B': 'non-boundary'
          };
          return map[char] ? Railroad.NonTerminal(map[char]) : Railroad.Terminal(char);
        }

        parseQuantifier(node) {
          if (typeof Railroad === 'undefined') return node;
          const char = this.consume();
          if (char === '*') return Railroad.ZeroOrMore(node);
          if (char === '+') return Railroad.OneOrMore(node);
          if (char === '?') return Railroad.Optional(node);
          if (char === '{') {
            let range = '';
            while (this.more() && this.peek() !== '}') {
              range += this.consume();
            }
            this.consume(); // }
            return Railroad.Comment(node, '{' + range + '}');
          }
          return node;
        }
      }

      // --- Main Application Logic ---

      const regexInput = document.getElementById('regex-input');
      const testStringInput = document.getElementById('test-string');
      const flagG = document.getElementById('flag-g');
      const flagI = document.getElementById('flag-i');
      const flagM = document.getElementById('flag-m');
      const railroadContainer = document.getElementById('railroad-container');
      const explanationList = document.getElementById('explanation-list');
      const highlightDisplay = document.getElementById('highlight-display');
      const groupsTableBody = document.getElementById('groups-table-body');
      const matchCount = document.getElementById('match-count');
      const codeOutput = document.getElementById('code-output');
      const langBtns = document.querySelectorAll('.lang-btn');

      let currentLang = 'js';

      function updateAll() {
        const pattern = regexInput.value;
        const text = testStringInput.value;
        const flags = (flagG.checked ? 'g' : '') + (flagI.checked ? 'i' : '') + (flagM.checked ? 'm' : '');

        updateVisualization(pattern);
        updateMatches(pattern, flags, text);
        updateCode(pattern, flags, text);
        updateExplanation(pattern);
      }

      function updateVisualization(pattern) {
        railroadContainer.innerHTML = '';
        if (!pattern) return;

        try {
          const parser = new RegexParser(pattern);
          const result = parser.parse();
          
          if (!result) {
             railroadContainer.innerHTML = '<div class="flex items-center justify-center text-surface-400 text-sm italic">Loading visualization library...</div>';
             return;
          }
          
          const diagram = Railroad.Diagram(result);
          diagram.addTo(railroadContainer);
        } catch (e) {
          railroadContainer.innerHTML = '<div class="text-red-500 text-sm p-4">Invalid Regex for Visualization</div>';
          console.error(e);
        }
      }

      function updateMatches(pattern, flags, text) {
        highlightDisplay.innerHTML = '';
        groupsTableBody.innerHTML = '';
        
        if (!pattern) {
          highlightDisplay.textContent = text;
          matchCount.textContent = _t('tools.regex-visualizer.js.text0', '0 matches');
          return;
        }

        try {
          const regex = new RegExp(pattern, flags);
          let match;
          let matches = [];
          
          // Prevent infinite loop with empty matches
          if (regex.global) {
            let lastIndex = 0;
            while ((match = regex.exec(text)) !== null) {
              matches.push(match);
              if (match.index === regex.lastIndex) {
                regex.lastIndex++;
              }
              if (matches.length > 1000) break; // Safety break
            }
          } else {
            match = regex.exec(text);
            if (match) matches.push(match);
          }

          matchCount.textContent = \`\${matches.length} match\${matches.length !== 1 ? 'es' : ''}\`;

          // Render Highlights
          let lastIdx = 0;
          let html = '';
          
          matches.forEach((m, i) => {
            // Text before match
            html += escapeHtml(text.substring(lastIdx, m.index));
            // Match
            html += \`<span class="match-highlight" title="Match \${i + 1}">\${escapeHtml(m[0])}</span>\`;
            lastIdx = m.index + m[0].length;

            // Add to table
            const row = document.createElement('tr');
            row.className = 'hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors';
            
            let groupsHtml = '';
            if (m.length > 1) {
              groupsHtml = '<div class="flex flex-wrap gap-1">';
              for (let g = 1; g < m.length; g++) {
                groupsHtml += \`<span class="px-1.5 py-0.5 rounded text-xs bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">$\${g}: \${escapeHtml(m[g] || '')}</span>\`;
              }
              groupsHtml += '</div>';
            } else {
              groupsHtml = '<span class="text-surface-400 text-xs italic" data-i18n="tools.regex-visualizer.ui.desc17">No groups</span>';
            }

            row.innerHTML = \`
              <td class="px-4 py-2 whitespace-nowrap text-sm text-surface-500 dark:text-surface-400">#\${i + 1}</td>
              <td class="px-4 py-2 whitespace-nowrap text-sm font-mono text-surface-900 dark:text-white">\${escapeHtml(m[0])}</td>
              <td class="px-4 py-2 text-sm text-surface-500 dark:text-surface-400">\${groupsHtml}</td>
              <td class="px-4 py-2 whitespace-nowrap text-sm text-surface-500 dark:text-surface-400">\${m.index}-\${m.index + m[0].length}</td>
            \`;
            groupsTableBody.appendChild(row);
          });

          html += escapeHtml(text.substring(lastIdx));
          highlightDisplay.innerHTML = html;

        } catch (e) {
          highlightDisplay.textContent = text;
          matchCount.textContent = _t('tools.regex-visualizer.js.text1', 'Error');
          groupsTableBody.innerHTML = '<tr><td colspan="4" class="px-4 py-2 text-red-500 text-sm">Invalid Regular Expression</td></tr>';
        }
      }

      function updateExplanation(pattern) {
        explanationList.innerHTML = '';
        if (!pattern) return;

        // Basic explanation logic (can be expanded)
        const explanations = [];
        
        // Simple token analysis
        if (pattern.startsWith('^')) explanations.push('Asserts position at start of the string');
        if (pattern.endsWith('$')) explanations.push('Asserts position at end of the string');
        
        // Character classes
        if (pattern.includes('\\\\d')) explanations.push('Matches any digit (0-9)');
        if (pattern.includes('\\\\w')) explanations.push('Matches any word character (alphanumeric + underscore)');
        if (pattern.includes('\\\\s')) explanations.push('Matches any whitespace character');
        if (pattern.includes('.')) explanations.push('Matches any character (except newline)');
        
        // Quantifiers
        if (pattern.includes('*')) explanations.push('Matches the previous token zero or more times');
        if (pattern.includes('+')) explanations.push('Matches the previous token one or more times');
        if (pattern.includes('?')) explanations.push('Matches the previous token zero or one time');
        
        // Groups
        const groupCount = (pattern.match(/\\((?!\\?)/g) || []).length;
        if (groupCount > 0) explanations.push(\`Contains \${groupCount} capturing group\${groupCount > 1 ? 's' : ''}\`);

        // Custom classes
        const classes = pattern.match(/\\[.*?\\]/g);
        if (classes) {
          classes.forEach(c => explanations.push(\`Matches any character in the set \${escapeHtml(c)}\`));
        }

        if (explanations.length === 0) {
          explanations.push('Matches the literal characters exactly');
        }

        explanations.forEach(text => {
          const li = document.createElement('li');
          li.textContent = text;
          explanationList.appendChild(li);
        });
      }

      function updateCode(pattern, flags, text) {
        let code = '';
        
        const bt = String.fromCharCode(96);
        
        const escJSString = s => s.replace(/\\\\/g, '\\\\\\\\').replace(/'/g, "\\\\'");
        const escJSRegex = s => s.replace(/\\//g, '\\\\/');
        const escDoubleQuoteString = s => s.replace(/\\\\/g, '\\\\\\\\').replace(/"/g, '\\\\"');
        const escSingleQuoteString = s => s.replace(/\\\\/g, '\\\\\\\\').replace(/'/g, "\\\\'");

        if (currentLang === 'js') {
          const jsPattern = escJSRegex(pattern);
          const jsText = escJSString(text);
          
          code = \`const regex = /\${jsPattern}/\${flags};
const str = '\${jsText}';
let m;

while ((m = regex.exec(str)) !== null) {
    if (m.index === regex.lastIndex) {
        regex.lastIndex++;
    }
    
    m.forEach((match, groupIndex) => {
        console.log(\\\`Found match, group \\\${groupIndex}: \\\${match}\\\`);
    });
}\`;
        } else if (currentLang === 'python') {
          let pyFlags = [];
          if (flags.includes('i')) pyFlags.push('re.IGNORECASE');
          if (flags.includes('m')) pyFlags.push('re.MULTILINE');
          const pyFlagStr = pyFlags.length ? \`, \${pyFlags.join(' | ')}\` : '';
          
          // Use normal string for regex to be safe
          const pyPattern = escDoubleQuoteString(pattern);
          const pyText = escDoubleQuoteString(text);
          
          code = \`import re

regex = "\${pyPattern}"
test_str = "\${pyText}"

matches = re.finditer(regex, test_str\${pyFlagStr})

for matchNum, match in enumerate(matches, start=1):
    print ("Match {matchNum} was found at {start}-{end}: {match}".format(matchNum = matchNum, start = match.start(), end = match.end(), match = match.group()))
    
    for groupNum in range(0, len(match.groups())):
        groupNum = groupNum + 1
        print ("Group {groupNum} found at {start}-{end}: {group}".format(groupNum = groupNum, start = match.start(groupNum), end = match.end(groupNum), group = match.group(groupNum)))\`;
        } else if (currentLang === 'php') {
           const phpPattern = escSingleQuoteString(pattern);
           const phpText = escSingleQuoteString(text);
           
           code = \`$re = '/\${phpPattern}/\${flags}';
$str = '\${phpText}';

preg_match_all($re, $str, $matches, PREG_SET_ORDER, 0);

// Print the entire match result
var_dump($matches);\`;
        } else if (currentLang === 'java') {
           const javaPattern = escDoubleQuoteString(pattern);
           const javaText = escDoubleQuoteString(text);
           
           code = \`import java.util.regex.Matcher;
import java.util.regex.Pattern;

final String regex = "\${javaPattern}";
final String string = "\${javaText}";

final Pattern pattern = Pattern.compile(regex\${flags.includes('i') ? ', Pattern.CASE_INSENSITIVE' : ''}\${flags.includes('m') ? ', Pattern.MULTILINE' : ''});
final Matcher matcher = pattern.matcher(string);

while (matcher.find()) {
    System.out.println("Full match: " + matcher.group(0));
    for (int i = 1; i <= matcher.groupCount(); i++) {
        System.out.println("Group " + i + ": " + matcher.group(i));
    }
}\`;
        }

        codeOutput.textContent = code;
      }

      function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }

      function copyCode() {
        const text = codeOutput.textContent;
        navigator.clipboard.writeText(text).then(() => {
          // Optional: Show toast
        });
      }

      // Event Listeners
      [regexInput, testStringInput, flagG, flagI, flagM].forEach(el => {
        el.addEventListener('input', updateAll);
      });

      langBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          langBtns.forEach(b => {
            b.classList.remove('bg-primary-100', 'text-primary-700', 'dark:bg-primary-900/50', 'dark:text-primary-300');
            b.classList.add('bg-surface-100', 'text-surface-600', 'dark:bg-surface-800', 'dark:text-surface-400');
          });
          btn.classList.remove('bg-surface-100', 'text-surface-600', 'dark:bg-surface-800', 'dark:text-surface-400');
          btn.classList.add('bg-primary-100', 'text-primary-700', 'dark:bg-primary-900/50', 'dark:text-primary-300');
          currentLang = btn.dataset.lang;
          updateAll();
        });
      });

      // Initial render
      waitForRailroad(updateAll);
    </script>
  `;

  return respondHTML(createPageTemplate({
    title,
    description,
    path: canonicalPath,
    content,
    scripts
  }));
}
