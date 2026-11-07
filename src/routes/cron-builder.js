import { respondHTML } from "../utils/respond.js";
import {
  createPageTemplate,
  createToolHeader,
  createCheatsheet,
  infoHint,
} from "../utils/common-ui.js";
import {
  createRelatedToolsSection,
  createVisibleArticle,
} from "../utils/content-ui.js";
import { TOOLS } from "../utils/tool-registry.js";
import {
  DEFAULT_LANGUAGE,
  getToolTranslation,
  normalizeLanguage,
  resolveRequestLanguage,
} from "../utils/i18n.js";
import { createCronLogic } from "../utils/cron-builder-logic.js";

export async function handleCronBuilderRoutes(request) {
  const requestPath = new URL(request.url).pathname;
  const canonicalPath = requestPath.replace(/\/$/, "") || "/";
  const currentLang = resolveRequestLanguage(request, new URL(request.url));
  const normalizedLang = normalizeLanguage(currentLang);
  const translation = getToolTranslation("cron-builder", normalizedLang);
  const currentTool = TOOLS.find((t) => t.id === "cron-builder");
  const relatedToolsData =
    currentTool?.relatedTools
      ?.map((id) => TOOLS.find((t) => t.id === id))
      .filter(Boolean) || [];

  const content = `
    <main class="tool-page-shell">
      <div class="tool-page-panel">
      ${createToolHeader(
        { emoji: "⏰" },
        translation?.name || "Cron Builder",
        translation?.desc ||
          "Visually build, parse, and schedule cron jobs with next execution previews.",
        [
          {
            text: translation?.ui?.badge21 || "Bi-directional",
            color: "blue",
            tooltip:
              "Parse cron expressions and build them visually in either direction without leaving the page.",
            tooltipI18nKey: "tools.cron-builder.ui.r62_0",
          },
        ],
        { toolId: "cron-builder" },
      )}

      ${createVisibleArticle({
        title: `<span data-i18n="tools.cron-builder.ui.r62_1">Five-field crontab, explained in this tab</span>`,
        paragraphs: [
          `<span data-i18n-html="tools.cron-builder.ui.r62_2">This builder speaks classic Vixie/crontab syntax: minute, hour, day of month, month, day of week. It does not accept a sixth seconds field, Quartz, or systemd <code>OnCalendar=</code>. If your scheduler wants those, this page will not silently translate them.</span>`,
          `<span data-i18n-html="tools.cron-builder.ui.r62_3">The next-run list is computed in the browser from the expression and your current timezone. It is a preview, not a job runner. Nothing is stored and no webhook is registered.</span>`,
          `<span data-i18n-html="tools.cron-builder.ui.r62_4">Day-of-week <code>0</code> and <code>7</code> are both Sunday. Lists, ranges, and steps (<code>1,15</code>, <code>1-5</code>, <code>*/5</code>) work; named months and days are accepted where crontab does, and so are macros like <code>@daily</code>. If the parser cannot read a field, the page names the field and the problem instead of inventing a schedule. Quartz's <code>?</code> is rejected for the same reason.</span>`,
        ],
      })}

      <div class="flex-grow flex flex-col lg:flex-row gap-6 min-h-0">
        
        <!-- Left Column: Visual Builder (Editor) -->
        <div class="tool-group tool-group--flush flex-1 flex flex-col min-h-0 overflow-hidden">
          <div class="border-b border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-950/50">
            <div data-i18n-aria="tools.cron-builder.ui.r6_0" class="flex -mb-px" role="tablist" aria-label="Cron field" id="builder-tabs">
              <button data-i18n-tooltip="tools.cron-builder.ui.r6_1" type="button" role="tab" id="tabbtn-minute" aria-controls="tab-minute" aria-selected="true" tabindex="0" class="tab-trigger tab-btn active" data-target="minute" data-tooltip="0-59, which minutes to run">
                <span data-i18n="tools.cron-builder.ui.button0">Minute</span>
              </button>
              <button data-i18n-tooltip="tools.cron-builder.ui.r6_2" type="button" role="tab" id="tabbtn-hour" aria-controls="tab-hour" aria-selected="false" tabindex="-1" class="tab-trigger tab-btn" data-target="hour" data-tooltip="0-23, which hours to run">
                <span data-i18n="tools.cron-builder.ui.button1">Hour</span>
              </button>
              <button data-i18n-tooltip="tools.cron-builder.ui.r6_3" type="button" role="tab" id="tabbtn-dom" aria-controls="tab-dom" aria-selected="false" tabindex="-1" class="tab-trigger tab-btn" data-target="dom" data-tooltip="1-31, which days of the month">
                <span data-i18n="tools.cron-builder.ui.button2">Day</span>
              </button>
              <button data-i18n-tooltip="tools.cron-builder.ui.r6_4" type="button" role="tab" id="tabbtn-month" aria-controls="tab-month" aria-selected="false" tabindex="-1" class="tab-trigger tab-btn" data-target="month" data-tooltip="1-12, which months">
                <span data-i18n="tools.cron-builder.ui.button3">Month</span>
              </button>
              <button data-i18n-tooltip="tools.cron-builder.ui.r6_5" type="button" role="tab" id="tabbtn-dow" aria-controls="tab-dow" aria-selected="false" tabindex="-1" class="tab-trigger tab-btn" data-target="dow" data-tooltip="0-6 (Sun-Sat), which days of week">
                <span data-i18n="tools.cron-builder.ui.button4">Week</span>
              </button>
            </div>
          </div>

          <div class="p-6 flex-grow overflow-y-auto bg-surface-50/30 dark:bg-surface-950/30">
            <!-- Minute Tab -->
            <div id="tab-minute" role="tabpanel" aria-labelledby="tabbtn-minute" class="tab-content flex flex-col gap-6">
              <div class="flex flex-col sm:flex-row gap-4">
                <label class="flex-1 relative flex items-center p-3 rounded-full border border-surface-200 dark:border-surface-700 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors group select-none">
                  <input type="radio" name="minute-type" value="*" class="peer sr-only" checked>
                  <div class="absolute inset-0 z-0 pointer-events-none rounded-full peer-checked:bg-primary-50 dark:peer-checked:bg-primary-900/20 transition-all"></div>
                  <div class="relative z-10 flex-shrink-0 w-5 h-5 rounded-full border-2 border-surface-400 peer-checked:border-primary-500 peer-checked:bg-primary-500 mr-3 transition-all after:content-[''] after:absolute after:left-1/2 after:top-1/2 after:w-2 after:h-2 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-white after:opacity-0 after:transition-opacity peer-checked:after:opacity-100"></div>
                  <span class="relative z-10 text-surface-700 dark:text-surface-300 font-medium peer-checked:text-primary-700 dark:peer-checked:text-primary-300" data-i18n="tools.cron-builder.ui.desc9">Every minute (*)</span>
                </label>
                
                <label class="flex-1 relative flex items-center p-3 rounded-full border border-surface-200 dark:border-surface-700 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors group select-none">
                  <input type="radio" name="minute-type" value="range" class="peer sr-only">
                  <div class="absolute inset-0 z-0 pointer-events-none rounded-full peer-checked:bg-primary-50 dark:peer-checked:bg-primary-900/20 transition-all"></div>
                  <div class="relative z-10 flex-shrink-0 w-5 h-5 rounded-full border-2 border-surface-400 peer-checked:border-primary-500 peer-checked:bg-primary-500 mr-3 transition-all after:content-[''] after:absolute after:left-1/2 after:top-1/2 after:w-2 after:h-2 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-white after:opacity-0 after:transition-opacity peer-checked:after:opacity-100"></div>
                  <span class="relative z-10 text-surface-700 dark:text-surface-300 font-medium peer-checked:text-primary-700 dark:peer-checked:text-primary-300" data-i18n="tools.cron-builder.ui.desc10">Specific minutes</span>
                </label>
              </div>
              
              <div id="minute-grid" class="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-3 opacity-50 pointer-events-none transition-opacity content-start">
                <!-- Generated by JS -->
              </div>
            </div>

            <!-- Hour Tab -->
            <div id="tab-hour" role="tabpanel" aria-labelledby="tabbtn-hour" class="tab-content hidden flex flex-col gap-6">
              <div class="flex flex-col sm:flex-row gap-4">
                <label class="flex-1 relative flex items-center p-3 rounded-full border border-surface-200 dark:border-surface-700 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors group select-none">
                  <input type="radio" name="hour-type" value="*" class="peer sr-only" checked>
                  <div class="absolute inset-0 z-0 pointer-events-none rounded-full peer-checked:bg-primary-50 dark:peer-checked:bg-primary-900/20 transition-all"></div>
                  <div class="relative z-10 flex-shrink-0 w-5 h-5 rounded-full border-2 border-surface-400 peer-checked:border-primary-500 peer-checked:bg-primary-500 mr-3 transition-all after:content-[''] after:absolute after:left-1/2 after:top-1/2 after:w-2 after:h-2 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-white after:opacity-0 after:transition-opacity peer-checked:after:opacity-100"></div>
                  <span class="relative z-10 text-surface-700 dark:text-surface-300 font-medium peer-checked:text-primary-700 dark:peer-checked:text-primary-300" data-i18n="tools.cron-builder.ui.desc11">Every hour (*)</span>
                </label>
                
                <label class="flex-1 relative flex items-center p-3 rounded-full border border-surface-200 dark:border-surface-700 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors group select-none">
                  <input type="radio" name="hour-type" value="range" class="peer sr-only">
                  <div class="absolute inset-0 z-0 pointer-events-none rounded-full peer-checked:bg-primary-50 dark:peer-checked:bg-primary-900/20 transition-all"></div>
                  <div class="relative z-10 flex-shrink-0 w-5 h-5 rounded-full border-2 border-surface-400 peer-checked:border-primary-500 peer-checked:bg-primary-500 mr-3 transition-all after:content-[''] after:absolute after:left-1/2 after:top-1/2 after:w-2 after:h-2 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-white after:opacity-0 after:transition-opacity peer-checked:after:opacity-100"></div>
                  <span class="relative z-10 text-surface-700 dark:text-surface-300 font-medium peer-checked:text-primary-700 dark:peer-checked:text-primary-300" data-i18n="tools.cron-builder.ui.desc12">Specific hours</span>
                </label>
              </div>
              <div id="hour-grid" class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 opacity-50 pointer-events-none transition-opacity content-start">
                <!-- Generated by JS -->
              </div>
            </div>

            <!-- Day of Month Tab -->
            <div id="tab-dom" role="tabpanel" aria-labelledby="tabbtn-dom" class="tab-content hidden flex flex-col gap-6">
              <div class="flex flex-col sm:flex-row gap-4">
                <label class="flex-1 relative flex items-center p-3 rounded-full border border-surface-200 dark:border-surface-700 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors group select-none">
                  <input type="radio" name="dom-type" value="*" class="peer sr-only" checked>
                  <div class="absolute inset-0 z-0 pointer-events-none rounded-full peer-checked:bg-primary-50 dark:peer-checked:bg-primary-900/20 transition-all"></div>
                  <div class="relative z-10 flex-shrink-0 w-5 h-5 rounded-full border-2 border-surface-400 peer-checked:border-primary-500 peer-checked:bg-primary-500 mr-3 transition-all after:content-[''] after:absolute after:left-1/2 after:top-1/2 after:w-2 after:h-2 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-white after:opacity-0 after:transition-opacity peer-checked:after:opacity-100"></div>
                  <span class="relative z-10 text-surface-700 dark:text-surface-300 font-medium peer-checked:text-primary-700 dark:peer-checked:text-primary-300" data-i18n="tools.cron-builder.ui.desc13">Every day (*)</span>
                </label>
                
                <label class="flex-1 relative flex items-center p-3 rounded-full border border-surface-200 dark:border-surface-700 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors group select-none">
                  <input type="radio" name="dom-type" value="range" class="peer sr-only">
                  <div class="absolute inset-0 z-0 pointer-events-none rounded-full peer-checked:bg-primary-50 dark:peer-checked:bg-primary-900/20 transition-all"></div>
                  <div class="relative z-10 flex-shrink-0 w-5 h-5 rounded-full border-2 border-surface-400 peer-checked:border-primary-500 peer-checked:bg-primary-500 mr-3 transition-all after:content-[''] after:absolute after:left-1/2 after:top-1/2 after:w-2 after:h-2 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-white after:opacity-0 after:transition-opacity peer-checked:after:opacity-100"></div>
                  <span class="relative z-10 text-surface-700 dark:text-surface-300 font-medium peer-checked:text-primary-700 dark:peer-checked:text-primary-300" data-i18n="tools.cron-builder.ui.desc15">Specific days</span>
                </label>
              </div>
              <div id="dom-grid" class="grid grid-cols-7 gap-3 opacity-50 pointer-events-none transition-opacity content-start">
                <!-- Generated by JS -->
              </div>
            </div>

            <!-- Month Tab -->
            <div id="tab-month" role="tabpanel" aria-labelledby="tabbtn-month" class="tab-content hidden flex flex-col gap-6">
              <div class="flex flex-col sm:flex-row gap-4">
                <label class="flex-1 relative flex items-center p-3 rounded-full border border-surface-200 dark:border-surface-700 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors group select-none">
                  <input type="radio" name="month-type" value="*" class="peer sr-only" checked>
                  <div class="absolute inset-0 z-0 pointer-events-none rounded-full peer-checked:bg-primary-50 dark:peer-checked:bg-primary-900/20 transition-all"></div>
                  <div class="relative z-10 flex-shrink-0 w-5 h-5 rounded-full border-2 border-surface-400 peer-checked:border-primary-500 peer-checked:bg-primary-500 mr-3 transition-all after:content-[''] after:absolute after:left-1/2 after:top-1/2 after:w-2 after:h-2 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-white after:opacity-0 after:transition-opacity peer-checked:after:opacity-100"></div>
                  <span class="relative z-10 text-surface-700 dark:text-surface-300 font-medium peer-checked:text-primary-700 dark:peer-checked:text-primary-300" data-i18n="tools.cron-builder.ui.desc16">Every month (*)</span>
                </label>
                
                <label class="flex-1 relative flex items-center p-3 rounded-full border border-surface-200 dark:border-surface-700 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors group select-none">
                  <input type="radio" name="month-type" value="range" class="peer sr-only">
                  <div class="absolute inset-0 z-0 pointer-events-none rounded-full peer-checked:bg-primary-50 dark:peer-checked:bg-primary-900/20 transition-all"></div>
                  <div class="relative z-10 flex-shrink-0 w-5 h-5 rounded-full border-2 border-surface-400 peer-checked:border-primary-500 peer-checked:bg-primary-500 mr-3 transition-all after:content-[''] after:absolute after:left-1/2 after:top-1/2 after:w-2 after:h-2 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-white after:opacity-0 after:transition-opacity peer-checked:after:opacity-100"></div>
                  <span class="relative z-10 text-surface-700 dark:text-surface-300 font-medium peer-checked:text-primary-700 dark:peer-checked:text-primary-300" data-i18n="tools.cron-builder.ui.desc17">Specific months</span>
                </label>
              </div>
              <div id="month-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 opacity-50 pointer-events-none transition-opacity content-start">
                <!-- Generated by JS -->
              </div>
            </div>

            <!-- Day of Week Tab -->
            <div id="tab-dow" role="tabpanel" aria-labelledby="tabbtn-dow" class="tab-content hidden flex flex-col gap-6">
              <div class="flex flex-col sm:flex-row gap-4">
                <label class="flex-1 relative flex items-center p-3 rounded-full border border-surface-200 dark:border-surface-700 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors group select-none">
                  <input type="radio" name="dow-type" value="*" class="peer sr-only" checked>
                  <div class="absolute inset-0 z-0 pointer-events-none rounded-full peer-checked:bg-primary-50 dark:peer-checked:bg-primary-900/20 transition-all"></div>
                  <div class="relative z-10 flex-shrink-0 w-5 h-5 rounded-full border-2 border-surface-400 peer-checked:border-primary-500 peer-checked:bg-primary-500 mr-3 transition-all after:content-[''] after:absolute after:left-1/2 after:top-1/2 after:w-2 after:h-2 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-white after:opacity-0 after:transition-opacity peer-checked:after:opacity-100"></div>
                  <span class="relative z-10 text-surface-700 dark:text-surface-300 font-medium peer-checked:text-primary-700 dark:peer-checked:text-primary-300" data-i18n="tools.cron-builder.ui.desc18">Every day of the week (*)</span>
                </label>
                
                <label class="flex-1 relative flex items-center p-3 rounded-full border border-surface-200 dark:border-surface-700 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors group select-none">
                  <input type="radio" name="dow-type" value="range" class="peer sr-only">
                  <div class="absolute inset-0 z-0 pointer-events-none rounded-full peer-checked:bg-primary-50 dark:peer-checked:bg-primary-900/20 transition-all"></div>
                  <div class="relative z-10 flex-shrink-0 w-5 h-5 rounded-full border-2 border-surface-400 peer-checked:border-primary-500 peer-checked:bg-primary-500 mr-3 transition-all"></div>
                  <span class="relative z-10 text-surface-700 dark:text-surface-300 font-medium peer-checked:text-primary-700 dark:peer-checked:text-primary-300" data-i18n="tools.cron-builder.ui.desc19">Specific days of week</span>
                </label>
              </div>
              <div id="dow-grid" class="grid grid-cols-2 sm:grid-cols-4 gap-3 opacity-50 pointer-events-none transition-opacity content-start">
                <!-- Generated by JS -->
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Output & Info (Preview) -->
        <div class="flex-1 flex flex-col gap-6 overflow-y-auto pr-1">
          
          <!-- Main Output -->
          <div class="tool-group p-6">
            <label for="cron-expression" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              <span data-i18n="tools.cron-builder.ui.label6">Cron Expression</span> ${infoHint("Enter five fields (min hour day month dow); use * or lists/ranges to control scheduling.", undefined, { i18nKey: "tools.cron-builder.ui.r62_5", ariaI18nKey: "tools.cron-builder.ui.r62_5" })}
            </label>
            <div class="flex gap-3 mb-4">
              <div class="relative flex-grow">
                <input type="text" id="cron-expression" 
                  class="input-mono w-full tracking-wider" 
                  value="* * * * *" 
                  spellcheck="false"
                  autocomplete="off"
                  aria-describedby="human-readable">
              </div>
              <button id="copy-cron-btn" type="button"
                class="btn btn-secondary flex-shrink-0">
                <span data-i18n="tools.cron-builder.ui.button5">Copy</span>
              </button>
            </div>
            
            <div class="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-100 dark:border-primary-900/30">
              <div class="flex items-start gap-3">
                <svg class="w-6 h-6 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p data-i18n="tools.cron-builder.ui.r6_6" id="human-readable" role="status" class="text-lg text-primary-800 dark:text-primary-200 font-medium leading-relaxed">
                  Every minute
                </p>
              </div>
            </div>
          </div>

          <!-- Next Executions -->
          <div class="tool-group p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-50" data-i18n="tools.cron-builder.ui.heading7">Next Runs</h2>
              <div class="flex flex-wrap items-center justify-end gap-2">
                <span class="text-xs px-2 py-1 rounded bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300" data-i18n="tools.cron-builder.ui.desc20">Local Time</span>
                <span id="tz-name" class="text-xs text-surface-500 dark:text-surface-400 font-mono"></span>
                <label class="inline-flex items-center gap-2 min-h-[44px] text-sm text-surface-700 dark:text-surface-300 cursor-pointer">
                  <input type="checkbox" id="use-utc" class="w-5 h-5 accent-primary-600">
                  <span data-i18n="tools.cron-builder.ui.r62_6">Show in UTC</span>
                </label>
              </div>
            </div>
            <div class="relative">
              <div class="absolute left-2 top-2 bottom-2 w-0.5 bg-surface-200 dark:bg-surface-700"></div>
              <ul id="next-executions" class="space-y-4 pl-6">
                <!-- Populated by JS -->
              </ul>
            </div>
          </div>

          <!-- Recipes -->
          <div class="tool-group p-6">
            <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4" data-i18n="tools.cron-builder.ui.heading8">Common Recipes</h2>
            <div class="space-y-2" id="recipes-list">
              <!-- Populated by JS -->
            </div>
          </div>

           <!-- Tips -->
           <div class="bg-info-50 dark:bg-info-900/20 rounded-xl p-6 border border-info-100 dark:border-info-800">
             <h3 class="font-semibold text-info-800 dark:text-info-300 mb-2 flex items-center gap-2">
               <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
               <span data-i18n="tools.cron-builder.ui.r62_7">Quick Tips</span>
             </h3>
             <ul class="text-sm text-info-700 dark:text-info-400 space-y-1 list-disc list-inside">
              <li data-i18n-html="tools.cron-builder.ui.r6_7">Use <code>*</code> for "every"</li>
              <li data-i18n-html="tools.cron-builder.ui.r6_8">Use <code>*/n</code> for intervals (e.g. */5)</li>
              <li data-i18n-html="tools.cron-builder.ui.r6_9">Use <code>,</code> for lists (e.g. 1,3,5)</li>
              <li data-i18n-html="tools.cron-builder.ui.r6_10">Use <code>-</code> for ranges (e.g. 1-5)</li>
            </ul>
          </div>

        </div>
      </div>

      ${createCheatsheet("cron-builder", "Cron Syntax Reference", [
        {
          heading: "Field Order",
          content: `
          <table>
            <tr><th data-i18n="tools.cron-builder.ui.th0">Position</th><th data-i18n="tools.cron-builder.ui.th1">Field</th><th data-i18n="tools.cron-builder.ui.th2">Range</th></tr>
            <tr><td>1</td><td>Minute</td><td>0–59</td></tr>
            <tr><td>2</td><td>Hour</td><td>0–23</td></tr>
            <tr><td>3</td><td>Day of Month</td><td>1–31</td></tr>
            <tr><td>4</td><td>Month</td><td>1–12</td></tr>
            <tr><td>5</td><td>Day of Week</td><td data-i18n="tools.cron-builder.ui.r3_0">0–7 (0,7 = Sun)</td></tr>
          </table>`,
        },
        {
          heading: "Special Characters",
          content: `
          <table>
            <tr><th data-i18n="tools.cron-builder.ui.th3">Char</th><th data-i18n="tools.cron-builder.ui.th4">Meaning</th><th data-i18n="tools.cron-builder.ui.th5">Example</th></tr>
            <tr><td><code>*</code></td><td>Any value</td><td>Every minute</td></tr>
            <tr><td><code>,</code></td><td>List</td><td><code>1,15</code> (1st and 15th)</td></tr>
            <tr><td><code>-</code></td><td>Range</td><td><code>1-5</code> (Mon–Fri)</td></tr>
            <tr><td><code>/</code></td><td data-i18n="tools.cron-builder.ui.r3_1">Step</td><td><code>*/5</code> (every 5 min)</td></tr>
          </table>`,
        },
        {
          heading: "Common Examples",
          content: `
          <table>
            <tr><th data-i18n="tools.cron-builder.ui.th6">Expression</th><th data-i18n="tools.cron-builder.ui.th7">Description</th></tr>
            <tr><td><code>0 * * * *</code></td><td>Every hour</td></tr>
            <tr><td><code>0 0 * * *</code></td><td>Daily at midnight</td></tr>
            <tr><td><code>0 0 * * 1</code></td><td>Every Monday</td></tr>
            <tr><td><code>*/5 * * * *</code></td><td>Every 5 minutes</td></tr>
            <tr><td><code>0 9-17 * * 1-5</code></td><td data-i18n="tools.cron-builder.ui.r3_2">Hourly 9am–5pm weekdays</td></tr>
          </table>`,
        },
      ])}
    ${createRelatedToolsSection(relatedToolsData)}
      </div>
    </main>

    <style>
      .cron-cell:focus-within { outline: 2px solid hsl(var(--ring)); outline-offset: 2px; }
    </style>
    <script>
      (function() {
        const cronLogic = (${createCronLogic.toString()})();
        const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const PARTS = ['minute', 'hour', 'dom', 'month', 'dow'];
        const SELECTED = ['bg-primary-50', 'dark:bg-primary-900/30', 'border-primary-200', 'dark:border-primary-800'];

        const RECIPES = [
          { key: 'r62_0', name: 'Every minute', cron: '* * * * *' },
          { key: 'r62_1', name: 'Every 5 minutes', cron: '*/5 * * * *' },
          { key: 'r62_2', name: 'Every hour', cron: '0 * * * *' },
          { key: 'r62_3', name: 'Every day at midnight', cron: '0 0 * * *' },
          { key: 'r62_4', name: 'Every day at 8am', cron: '0 8 * * *' },
          { key: 'r62_5', name: 'Every Monday at 9am', cron: '0 9 * * 1' },
          { key: 'r62_6', name: 'Every 1st of month', cron: '0 0 1 * *' },
          { key: 'r62_7', name: 'Weekdays at 9am', cron: '0 9 * * 1-5' },
        ];

        const tr = function(k, f) { return window._t ? window._t('tools.cron-builder.js.' + k, f) : f; };
        const GRID_LABELS = {
          minute: 'Minute selector',
          hour: 'Hour selector',
          dom: 'Day of month selector',
          month: 'Month selector',
          dow: 'Day of week selector',
        };
        const GRID_KEYS = { minute: 'r62_8', hour: 'r62_9', dom: 'r62_10', month: 'r62_11', dow: 'r62_12' };
        const CELL_KEYS = { minute: 'r62_13', hour: 'r62_14', dom: 'r62_15', month: 'r62_16', dow: 'r62_17' };

        let state = { minute: '*', hour: '*', dom: '*', month: '*', dow: '*' };
        let parsed = null;

        const input = document.getElementById('cron-expression');
        const humanReadable = document.getElementById('human-readable');
        const nextExecutionsList = document.getElementById('next-executions');
        const recipesList = document.getElementById('recipes-list');
        const useUtc = document.getElementById('use-utc');
        const tzName = document.getElementById('tz-name');
        const tabs = Array.from(document.querySelectorAll('.tab-btn'));
        const tabContents = document.querySelectorAll('.tab-content');
        const localZone = (Intl.DateTimeFormat().resolvedOptions().timeZone) || 'local';

        function init() {
          renderGrids();
          renderRecipes();
          // init runs before the i18n bootstrap defines window._t; re-render once the page has loaded.
          if (!window._t) window.addEventListener('load', renderRecipes);
          input.addEventListener('input', handleInput);
          useUtc.addEventListener('change', function() {
            updateZoneLabel();
            updateNextExecutions();
          });
          document.getElementById('copy-cron-btn').addEventListener('click', function() {
            copyToClipboard(input.value.trim(), this);
          });
          tabs.forEach(function(tab) {
            tab.addEventListener('click', function() { switchTab(tab.dataset.target, false); });
          });
          document.getElementById('builder-tabs').addEventListener('keydown', function(e) {
            const keys = { ArrowLeft: -1, ArrowRight: 1, Home: 'first', End: 'last' };
            if (!(e.key in keys)) return;
            e.preventDefault();
            const cur = tabs.findIndex(function(t) { return t.getAttribute('aria-selected') === 'true'; });
            let next = keys[e.key] === 'first' ? 0 : keys[e.key] === 'last' ? tabs.length - 1 : (cur + keys[e.key] + tabs.length) % tabs.length;
            switchTab(tabs[next].dataset.target, true);
          });
          PARTS.forEach(function(part) {
            document.querySelectorAll('input[name="' + part + '-type"]').forEach(function(radio) {
              radio.addEventListener('change', function(e) { handleTypeChange(part, e.target.value); });
            });
          });
          updateZoneLabel();
          handleInput();
        }

        function updateZoneLabel() {
          tzName.textContent = useUtc.checked ? 'UTC' : localZone;
        }

        function stringifyState() {
          return PARTS.map(function(p) { return state[p]; }).join(' ');
        }

        function handleInput() {
          parsed = cronLogic.parseCron(input.value);
          if (parsed.ok) {
            const f = parsed.fields;
            state = { minute: f.minute.raw, hour: f.hour.raw, dom: f.dom.raw, month: f.month.raw, dow: f.dow.raw };
            updateUIFromState();
          }
          render();
        }

        function updateInputFromState() {
          input.value = stringifyState();
          parsed = cronLogic.parseCron(input.value);
          render();
        }

        function render() {
          updateHumanReadable();
          updateNextExecutions();
        }

        function handleTypeChange(part, type) {
          if (type === '*') {
            state[part] = '*';
          } else if (state[part] === '*') {
            state[part] = (part === 'dom' || part === 'month') ? '1' : '0';
          }
          updateInputFromState();
          updateUIFromState();
        }

        function toggleGrid(part, enabled) {
          const grid = document.getElementById(part + '-grid');
          grid.classList.toggle('opacity-50', !enabled);
          grid.classList.toggle('pointer-events-none', !enabled);
          grid.querySelectorAll('input').forEach(function(cb) { cb.disabled = !enabled; });
        }

        function updateUIFromState() {
          if (!parsed || !parsed.ok) return;
          PARTS.forEach(function(part) {
            const isAll = state[part] === '*';
            document.querySelectorAll('input[name="' + part + '-type"]').forEach(function(r) {
              r.checked = r.value === (isAll ? '*' : 'range');
            });
            toggleGrid(part, !isAll);
            const selected = isAll ? [] : parsed.fields[part].values;
            document.getElementById(part + '-grid').querySelectorAll('input[type="checkbox"]').forEach(function(cb) {
              const on = selected.indexOf(parseInt(cb.value, 10)) !== -1;
              cb.checked = on;
              SELECTED.forEach(function(c) { cb.closest('label').classList.toggle(c, on); });
            });
          });
        }

        function updatePartFromGrid(part) {
          const grid = document.getElementById(part + '-grid');
          const checked = Array.from(grid.querySelectorAll('input:checked')).map(function(cb) { return parseInt(cb.value, 10); });
          if (checked.length === 0) {
            state[part] = '*';
          } else {
            checked.sort(function(a, b) { return a - b; });
            state[part] = compressSelection(checked);
          }
          updateInputFromState();
          updateUIFromState();
        }

        function compressSelection(nums) {
          const ranges = [];
          let start = nums[0];
          let prev = nums[0];
          for (let i = 1; i <= nums.length; i++) {
            if (i < nums.length && nums[i] === prev + 1) { prev = nums[i]; continue; }
            ranges.push(start === prev ? String(start) : start + '-' + prev);
            start = nums[i];
            prev = nums[i];
          }
          return ranges.join(',');
        }

        function renderGrids() {
          renderGrid('minute', 0, 59, function(i) { return String(i).padStart(2, '0'); });
          renderGrid('hour', 0, 23, function(i) { return String(i).padStart(2, '0'); });
          renderGrid('dom', 1, 31, function(i) { return String(i); });
          renderGrid('month', 1, 12, function(i) { return MONTHS[i - 1]; });
          renderGrid('dow', 0, 6, function(i) { return DAYS[i]; });
        }

        function renderGrid(part, start, end, labelFn) {
          const container = document.getElementById(part + '-grid');
          container.innerHTML = '';
          container.setAttribute('role', 'group');
          container.setAttribute('aria-label', tr(GRID_KEYS[part], GRID_LABELS[part]));
          for (let i = start; i <= end; i++) {
            const label = document.createElement('label');
            label.className = 'cron-cell relative flex items-center justify-center w-8 h-8 border border-surface-200 dark:border-surface-700 rounded-full cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors select-none text-sm';
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.value = i;
            cb.className = 'sr-only peer';
            cb.setAttribute('aria-label', tr(CELL_KEYS[part], GRID_LABELS[part].replace(' selector', '') + ' {label}').replace('{label}', labelFn(i)));
            const span = document.createElement('span');
            span.textContent = labelFn(i);
            span.setAttribute('aria-hidden', 'true');
            span.className = 'peer-checked:font-bold peer-checked:text-primary-600 dark:peer-checked:text-primary-400';
            cb.addEventListener('change', function() { updatePartFromGrid(part); });
            label.appendChild(cb);
            label.appendChild(span);
            container.appendChild(label);
          }
        }

        function renderRecipes() {
          recipesList.innerHTML = RECIPES.map(function(r) {
            return '<button type="button" class="recipe-btn w-full text-left px-4 py-3 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors flex justify-between items-center group" data-cron="' + r.cron + '">' +
              '<span class="text-sm font-medium text-surface-700 dark:text-surface-300 group-hover:text-primary-600 dark:group-hover:text-primary-400">' + tr(r.key, r.name) + '</span>' +
              '<code class="text-xs bg-surface-100 dark:bg-surface-950 px-2 py-1 rounded text-surface-600 dark:text-surface-300 font-mono">' + r.cron + '</code></button>';
          }).join('');
          recipesList.querySelectorAll('.recipe-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
              input.value = btn.dataset.cron;
              handleInput();
            });
          });
        }

        function switchTab(target, focus) {
          tabs.forEach(function(t) {
            const on = t.dataset.target === target;
            t.classList.toggle('active', on);
            t.setAttribute('aria-selected', on ? 'true' : 'false');
            t.setAttribute('tabindex', on ? '0' : '-1');
            if (on && focus) t.focus();
          });
          tabContents.forEach(function(c) { c.classList.toggle('hidden', c.id !== 'tab-' + target); });
        }

        function showError(message) {
          humanReadable.textContent = message;
          humanReadable.classList.add('text-error-700');
          humanReadable.classList.remove('text-primary-800', 'dark:text-primary-200');
          input.setAttribute('aria-invalid', 'true');
        }

        function updateHumanReadable() {
          if (!parsed.ok) {
            showError(_t('tools.cron-builder.js.text0', 'Invalid cron expression') + ': ' + parsed.error);
            return;
          }
          input.removeAttribute('aria-invalid');
          humanReadable.textContent = cronLogic.describeCron(parsed) + (parsed.macro ? ' (' + parsed.macro + ' = ' + parsed.expression + ')' : '');
          humanReadable.classList.remove('text-error-700');
          humanReadable.classList.add('text-primary-800', 'dark:text-primary-200');
        }

        function addListItem(text, cls) {
          const li = document.createElement('li');
          li.className = cls;
          li.textContent = text;
          nextExecutionsList.appendChild(li);
        }

        function updateNextExecutions() {
          nextExecutionsList.innerHTML = '';
          if (!parsed.ok) {
            addListItem(_t('tools.cron-builder.js.text0', 'Invalid cron expression'), 'text-error-700 text-sm');
            return;
          }
          const dates = cronLogic.nextRuns(parsed, new Date(), 5, { utc: useUtc.checked });
          if (dates.length === 0) {
            addListItem('This schedule never runs: no matching date exists (for example, February 30).', 'text-error-700 text-sm');
            return;
          }
          dates.forEach(function(date) {
            const li = document.createElement('li');
            li.className = 'flex flex-wrap items-center gap-x-3 text-sm';
            const when = document.createElement('span');
            when.className = 'font-mono text-surface-700 dark:text-surface-300';
            when.textContent = formatDate(date);
            const rel = document.createElement('span');
            rel.className = 'text-xs text-surface-500 dark:text-surface-400';
            rel.textContent = '(' + timeFromNow(date) + ')';
            li.appendChild(when);
            li.appendChild(rel);
            nextExecutionsList.appendChild(li);
          });
        }

        function formatDate(date) {
          return date.toLocaleString(document.documentElement.lang || 'en-US', {
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: false,
            timeZone: useUtc.checked ? 'UTC' : undefined,
          });
        }

        function timeFromNow(date) {
          const mins = Math.max(0, Math.ceil((date - new Date()) / 60000));
          const hours = Math.floor(mins / 60);
          const days = Math.floor(hours / 24);
          if (days > 365) return tr('r62_18', 'in {a}y {b}d').replace('{a}', Math.floor(days / 365)).replace('{b}', days % 365);
          if (days > 0) return tr('r62_19', 'in {a}d {b}h').replace('{a}', days).replace('{b}', hours % 24);
          if (hours > 0) return tr('r62_20', 'in {a}h {b}m').replace('{a}', hours).replace('{b}', mins % 60);
          return tr('r62_21', 'in {a}m').replace('{a}', mins);
        }

        init();
      })();
    </script>
  `;

  return respondHTML(
    createPageTemplate({
      title: translation?.name || "Cron Builder",
      description:
        translation?.desc ||
        "Visual cron editor with human-readable descriptions and next-run preview.",
      path: canonicalPath,
      content: content,
      scripts: "",
      lang: normalizedLang,
    }),
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
