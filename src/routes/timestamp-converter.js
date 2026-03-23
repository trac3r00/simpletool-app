/**
 * Timestamp Converter Tool
 * Convert between Unix timestamps and human-readable dates
 */

import { respondHTML, respondJSON } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';
import { createEducationalSection, createRelatedToolsSection } from '../utils/content-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

export async function handleTimestampConverterRoutes(request, url) {
  const { pathname } = url;
  const method = request.method;

  try {
    if (pathname === '/timestamp-converter' || pathname === '/timestamp-converter/') {
      if (method === 'GET') {
        return renderTimestampConverterPage(resolveRequestLanguage(request, url));
      }
    }

    return respondJSON({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('Timestamp Converter Route Error:', error);
    return respondJSON(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

function renderTimestampConverterPage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('timestamp-converter', currentLang);
  const toolHeader = createToolHeader(
    { emoji: '⏰' },
    translation?.name || 'Timestamp Converter',
    translation?.desc || 'Convert between Unix timestamps and human-readable dates with timezone support',
    [{ text: translation?.ui?.badge17 || 'ISO 8601', color: 'orange', tooltip: 'Outputs converted timestamps in ISO 8601 format (e.g. 2025-01-30T12:00:00Z).' }],
    { toolId: 'timestamp-converter' }
  );

  const currentTool = TOOLS.find(t => t.id === 'timestamp-converter');
    const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];


  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">

        ${toolHeader}

        <!-- Current Time -->
        <div class="mb-8 p-6 bg-gradient-to-r from-primary-50 to-surface-50 dark:from-primary-900/20 dark:to-surface-900/20 border-2 border-primary-200 dark:border-primary-800 rounded-xl text-center">
          <div class="text-sm font-semibold text-primary-900 dark:text-primary-300 mb-2 uppercase tracking-wide" data-i18n="tools.timestamp-converter.ui.stat13">Current Time</div>
          <div id="current-unix" class="text-4xl font-mono font-bold text-primary-600 dark:text-primary-400 mb-2">0</div>
          <div id="current-human" class="text-lg text-surface-700 dark:text-surface-300"></div>
          <button id="copy-current" class="mt-4 btn btn-secondary text-sm">
            <span class="material-symbols-rounded text-sm" data-i18n="tools.timestamp-converter.ui.desc14">content_copy</span> Copy Timestamp
          </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <!-- Unix to Human -->
          <div class="space-y-6">
            <h2 class="text-xl font-bold text-surface-900 dark:text-surface-50 flex items-center gap-2">
              <span class="material-symbols-rounded text-primary-600">arrow_forward</span>
              Unix to Human
            </h2>
            
            <div class="card p-6 space-y-4">
              <div>
                <label for="unix-input" class="label"><span data-i18n="tools.timestamp-converter.ui.label1">Unix Timestamp</span></label>
                <div class="flex gap-2">
                  <input type="text" id="unix-input" placeholder="e.g. 1700000000" class="input font-mono" data-tooltip="Seconds since Jan 1, 1970 00:00:00 UTC" data-i18n-tooltip="tools.timestamp-converter.ui.tip0">
                  <button id="now-btn" class="btn btn-primary whitespace-nowrap">
                    <span data-i18n="tools.timestamp-converter.ui.button0">Now</span>
                  </button>
                </div>
                <div class="flex gap-4 mt-3">
                  <label class="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="unix-unit" value="seconds" checked class="w-4 h-4 text-primary-600 focus:ring-primary-500">
                    <span class="text-sm text-surface-700 dark:text-surface-300" data-i18n="tools.timestamp-converter.ui.desc15" data-tooltip="Standard Unix epoch (10 digits)" data-i18n-tooltip="tools.timestamp-converter.ui.tip1">Seconds</span>
                  </label>
                  <label class="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="unix-unit" value="milliseconds" class="w-4 h-4 text-primary-600 focus:ring-primary-500">
                    <span class="text-sm text-surface-700 dark:text-surface-300" data-i18n="tools.timestamp-converter.ui.desc16" data-tooltip="JavaScript Date.now() format (13 digits)" data-i18n-tooltip="tools.timestamp-converter.ui.tip2">Milliseconds</span>
                  </label>
                </div>
              </div>

              <div id="unix-result" class="space-y-3 pt-2">
                <div class="bg-surface-50 dark:bg-surface-950 p-3 rounded-lg border border-surface-200 dark:border-surface-800">
                  <div class="text-xs text-surface-500 dark:text-surface-400 uppercase mb-1">ISO 8601</div>
                  <div id="iso-output" class="font-mono text-sm break-all text-surface-900 dark:text-surface-100">-</div>
                </div>
                <div class="bg-surface-50 dark:bg-surface-950 p-3 rounded-lg border border-surface-200 dark:border-surface-800">
                  <div class="text-xs text-surface-500 dark:text-surface-400 uppercase mb-1" data-i18n="tools.timestamp-converter.ui.label0">Local Time</div>
                  <div id="local-output" class="font-mono text-sm break-all text-surface-900 dark:text-surface-100">-</div>
                </div>
                <div class="bg-surface-50 dark:bg-surface-950 p-3 rounded-lg border border-surface-200 dark:border-surface-800">
                  <div class="text-xs text-surface-500 dark:text-surface-400 uppercase mb-1">UTC</div>
                  <div id="utc-output" class="font-mono text-sm break-all text-surface-900 dark:text-surface-100">-</div>
                </div>
                <div class="bg-surface-50 dark:bg-surface-950 p-3 rounded-lg border border-surface-200 dark:border-surface-800">
                  <div class="text-xs text-surface-500 dark:text-surface-400 uppercase mb-1" data-i18n="tools.timestamp-converter.ui.label1">Relative</div>
                  <div id="relative-output" class="font-mono text-sm break-all text-surface-900 dark:text-surface-100">-</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Human to Unix -->
          <div class="space-y-6">
            <h2 class="text-xl font-bold text-surface-900 dark:text-surface-50 flex items-center gap-2">
              <span class="material-symbols-rounded text-primary-600">arrow_back</span>
              Human to Unix
            </h2>
            
            <div class="card p-6 space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label for="date-input" class="label"><span data-i18n="tools.timestamp-converter.ui.label2">Date</span></label>
                  <input type="date" id="date-input" class="input">
                </div>
                <div>
                  <label for="time-input" class="label"><span data-i18n="tools.timestamp-converter.ui.label3">Time</span></label>
                  <input type="time" id="time-input" step="1" class="input">
                </div>
              </div>

              <div>
                <label for="timezone-select" class="label"><span data-i18n="tools.timestamp-converter.ui.label4">Timezone</span></label>
                <select id="timezone-select" class="input">
                  <option value="local" data-i18n="tools.timestamp-converter.ui.option5">Local Time</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York" data-i18n="tools.timestamp-converter.ui.option6">America/New_York (EST/EDT)</option>
                  <option value="America/Los_Angeles" data-i18n="tools.timestamp-converter.ui.option7">America/Los_Angeles (PST/PDT)</option>
                  <option value="Europe/London" data-i18n="tools.timestamp-converter.ui.option8">Europe/London (GMT/BST)</option>
                  <option value="Europe/Paris" data-i18n="tools.timestamp-converter.ui.option9">Europe/Paris (CET/CEST)</option>
                  <option value="Asia/Tokyo" data-i18n="tools.timestamp-converter.ui.option10">Asia/Tokyo (JST)</option>
                  <option value="Asia/Shanghai" data-i18n="tools.timestamp-converter.ui.option11">Asia/Shanghai (CST)</option>
                  <option value="Australia/Sydney" data-i18n="tools.timestamp-converter.ui.option12">Australia/Sydney (AEDT)</option>
                </select>
              </div>

              <div id="human-result" class="grid grid-cols-1 gap-3 pt-2">
                <div class="bg-surface-50 dark:bg-surface-950 p-3 rounded-lg border border-surface-200 dark:border-surface-800">
                  <div class="text-xs text-surface-500 dark:text-surface-400 uppercase mb-1">Unix (seconds)</div>
                  <div id="seconds-output" class="font-mono text-lg font-bold text-primary-600 dark:text-primary-400 break-all">-</div>
                </div>
                <div class="bg-surface-50 dark:bg-surface-950 p-3 rounded-lg border border-surface-200 dark:border-surface-800">
                  <div class="text-xs text-surface-500 dark:text-surface-400 uppercase mb-1">Unix (milliseconds)</div>
                  <div id="milliseconds-output" class="font-mono text-sm break-all text-surface-900 dark:text-surface-100">-</div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </main>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      ${createEducationalSection([
        {
          title: 'What is Unix Time?',
          content: '<p>Unix time (also known as Epoch time, POSIX time, or Unix timestamp) is a system for describing a point in time. It is the number of seconds that have elapsed since the Unix Epoch, minus leap seconds; the Unix Epoch is 00:00:00 UTC on 1 January 1970. It is widely used in operating systems and file formats because it is a single integer, making it easy for computers to store and manipulate.</p><p>This standard allows different systems to communicate time accurately regardless of their local timezone settings. While it might seem abstract to humans, it is the backbone of time representation in software development, database indexing, and performance-critical applications where string parsing would be too slow.</p>'
        },
        {
          title: 'How to Use This Tool',
          content: '<ol><li>To convert Unix to Human: Enter the timestamp in the "Unix Timestamp" field. Select whether it\'s in seconds or milliseconds.</li><li>To convert Human to Unix: Select the date and time using the pickers, then choose your desired timezone.</li><li>Use the "Now" button to quickly grab the current timestamp for either conversion direction.</li><li>View the results in real-time, including ISO 8601, Local Time, UTC, and relative time (e.g., "2 hours ago").</li><li>Click the "Copy" button next to any result to save it to your clipboard.</li></ol>'
        },
        {
          title: 'Common Use Cases',
          content: '<ul><li><strong>Log Analysis:</strong> Convert cryptic timestamps found in server logs or database entries into readable dates for debugging.</li><li><strong>API Development:</strong> Verify that your backend is sending the correct epoch values to your frontend or third-party integrations.</li><li><strong>Data Migration:</strong> Ensure time-based data remains consistent when moving between systems with different default time representations.</li><li><strong>Scheduling:</strong> Calculate future or past timestamps for cron jobs, expiration dates, or event triggers.</li></ul>'
        },
        {
          title: 'Pro Tips',
          content: '<ul><li>When working with JavaScript, remember that <code>Date.now()</code> returns milliseconds, while standard Unix timestamps are in seconds. Divide by 1000 to convert.</li><li>Always use the ISO 8601 format (e.g., 2025-01-30T12:00:00Z) for data exchange between systems to ensure maximum compatibility and readability.</li><li>Be aware of the "Year 2038 problem," where 32-bit signed integers will overflow. Modern systems use 64-bit integers, which solves this for the foreseeable future.</li></ul>'
        }
      ], 'timestamp-converter', currentLang)}
    ${createRelatedToolsSection(relatedToolsData)}
    </div>
  `;

  const script = `
    <script>
      const unixInput = document.getElementById('unix-input');
      const dateInput = document.getElementById('date-input');
      const timeInput = document.getElementById('time-input');
      const timezoneSelect = document.getElementById('timezone-select');

      // Update current time
      function updateCurrentTime() {
        const now = Date.now();
        const unixSeconds = Math.floor(now / 1000);

        document.getElementById('current-unix').textContent = unixSeconds.toLocaleString();
        document.getElementById('current-human').textContent = new Date(now).toLocaleString();
      }

      updateCurrentTime();
      setInterval(updateCurrentTime, 1000);

      // Copy current timestamp
      document.getElementById('copy-current').addEventListener('click', async () => {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        
        if(window.copyToClipboard) {
            window.copyToClipboard(timestamp, document.getElementById('copy-current'));
        } else {
            await navigator.clipboard.writeText(timestamp);
            if (window.Toast) window.Toast.success(_t('common.copied', 'Copied!'));
        }
      });

      // Set to now
      document.getElementById('now-btn').addEventListener('click', () => {
        const unit = document.querySelector('input[name="unix-unit"]:checked').value;
        const timestamp = unit === 'seconds' ? Math.floor(Date.now() / 1000) : Date.now();
        unixInput.value = timestamp;
        convertUnixToHuman();
      });

      // Relative time
      function getRelativeTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(Math.abs(diff) / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        const future = diff < 0;
        const prefix = future ? 'in ' : '';
        const suffix = future ? '' : ' ago';

        if (seconds < 60) return prefix + seconds + ' second' + (seconds !== 1 ? 's' : '') + suffix;
        if (minutes < 60) return prefix + minutes + ' minute' + (minutes !== 1 ? 's' : '') + suffix;
        if (hours < 24) return prefix + hours + ' hour' + (hours !== 1 ? 's' : '') + suffix;
        return prefix + days + ' day' + (days !== 1 ? 's' : '') + suffix;
      }

      // Unix to Human conversion
      function convertUnixToHuman() {
        const input = unixInput.value.trim();
        if (!input) return;

        const unit = document.querySelector('input[name="unix-unit"]:checked').value;
        let timestamp = parseInt(input);

        if (unit === 'seconds') {
          timestamp *= 1000;
        }

        const date = new Date(timestamp);

        if (isNaN(date.getTime())) {
          document.getElementById('iso-output').textContent = _t('tools.timestamp-converter.js.text0', 'Invalid timestamp');
          return;
        }

        document.getElementById('iso-output').textContent = date.toISOString();
        document.getElementById('local-output').textContent = date.toLocaleString();
        document.getElementById('utc-output').textContent = date.toUTCString();
        document.getElementById('relative-output').textContent = getRelativeTime(timestamp);
      }

      // Human to Unix conversion with proper timezone support
      function convertHumanToUnix() {
        const dateValue = dateInput.value;
        const timeValue = timeInput.value || '00:00:00';

        if (!dateValue) return;

        const datetimeString = dateValue + 'T' + timeValue;
        const timezone = timezoneSelect.value;

        let date;
        if (timezone === 'local') {
          date = new Date(datetimeString);
        } else if (timezone === 'UTC') {
          date = new Date(datetimeString + 'Z');
        } else {
          // For other timezones, interpret as that timezone
          // Parse the date/time components
          const [year, month, day] = dateValue.split('-').map(Number);
          const [hours, minutes, seconds] = timeValue.split(':').map(Number);

          // Create a formatter for the target timezone
          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          });

          // Create a date in UTC that represents the same wall-clock time in the target timezone
          // We do this by finding the UTC offset for the target timezone at a reference point
          const testDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds || 0));

          // Get the parts in the target timezone
          const parts = formatter.formatToParts(testDate);
          const tzYear = parseInt(parts.find(p => p.type === 'year').value);
          const tzMonth = parseInt(parts.find(p => p.type === 'month').value);
          const tzDay = parseInt(parts.find(p => p.type === 'day').value);
          const tzHour = parseInt(parts.find(p => p.type === 'hour').value);
          const tzMinute = parseInt(parts.find(p => p.type === 'minute').value);
          const tzSecond = parseInt(parts.find(p => p.type === 'second').value);

          // Calculate the offset in milliseconds
          const targetTime = Date.UTC(year, month - 1, day, hours, minutes, seconds || 0);
          const actualTime = Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMinute, tzSecond);
          const offset = actualTime - testDate.getTime();

          // Apply the offset to get the correct UTC time
          date = new Date(targetTime - offset);
        }

        const milliseconds = date.getTime();
        const seconds = Math.floor(milliseconds / 1000);

        document.getElementById('seconds-output').textContent = seconds.toLocaleString();
        document.getElementById('milliseconds-output').textContent = milliseconds.toLocaleString();
      }

      // Event listeners
      unixInput.addEventListener('input', convertUnixToHuman);
      document.querySelectorAll('input[name="unix-unit"]').forEach(radio => {
        radio.addEventListener('change', convertUnixToHuman);
      });

      dateInput.addEventListener('change', convertHumanToUnix);
      timeInput.addEventListener('change', convertHumanToUnix);
      timezoneSelect.addEventListener('change', convertHumanToUnix);

      // Initialize with current date/time
      const now = new Date();
      dateInput.value = now.toISOString().split('T')[0];
      timeInput.value = now.toTimeString().split(' ')[0];
      convertHumanToUnix();
    </script>
  `;

  return respondHTML(createPageTemplate({
    title: translation?.name || 'Timestamp Converter',
    description: translation?.desc || 'Convert Unix timestamps to human dates.',
    path: '/timestamp-converter',
    content,
    scripts: script,
    lang: currentLang
  }));
}
