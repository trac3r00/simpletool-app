import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader, getCopyToClipboardScript, createCheatsheet, infoHint } from '../utils/common-ui.js';
import { createEducationalSection, createRelatedToolsSection } from '../utils/content-ui.js';
import { TOOLS } from '../utils/tool-registry.js';

export async function handleCronBuilderRoutes(request) {
  const requestPath = new URL(request.url).pathname;
  const canonicalPath = requestPath.replace(/\/$/, '') || '/';
  const currentTool = TOOLS.find(t => t.id === 'cron-builder');
    const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6 lg:h-[calc(100vh-9rem)] min-h-[800px]">
      ${createToolHeader(
        { emoji: '⏰' },
        'Cron Builder',
        'Visually build, parse, and schedule cron jobs with next execution previews.',
        [{ text: 'Bi-directional', color: 'blue', tooltip: 'Parse cron expressions and build them visually in either direction without leaving the page.' }],
        { toolId: 'cron-builder' }
      )}

      <div class="flex-grow flex flex-col lg:flex-row gap-6 min-h-0">
        
        <!-- Left Column: Visual Builder (Editor) -->
        <div class="flex-1 flex flex-col min-h-0 bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 overflow-hidden">
          <div class="border-b border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-950/50">
            <nav class="flex -mb-px" aria-label="Tabs" id="builder-tabs">
              <button class="tab-btn active group inline-flex items-center py-4 px-6 border-b-2 font-medium text-sm transition-colors border-primary-500 text-primary-600 dark:text-primary-400 focus:outline-none" data-target="minute" data-tooltip="0-59, which minutes to run">
                <span data-i18n="tools.cron-builder.ui.button0">Minute</span>
              </button>
              <button class="tab-btn group inline-flex items-center py-4 px-6 border-b-2 border-transparent font-medium text-sm text-surface-500 hover:text-surface-700 hover:border-surface-300 dark:text-surface-400 dark:hover:text-surface-300 focus:outline-none" data-target="hour" data-tooltip="0-23, which hours to run">
                <span data-i18n="tools.cron-builder.ui.button1">Hour</span>
              </button>
              <button class="tab-btn group inline-flex items-center py-4 px-6 border-b-2 border-transparent font-medium text-sm text-surface-500 hover:text-surface-700 hover:border-surface-300 dark:text-surface-400 dark:hover:text-surface-300 focus:outline-none" data-target="dom" data-tooltip="1-31, which days of the month">
                <span data-i18n="tools.cron-builder.ui.button2">Day</span>
              </button>
              <button class="tab-btn group inline-flex items-center py-4 px-6 border-b-2 border-transparent font-medium text-sm text-surface-500 hover:text-surface-700 hover:border-surface-300 dark:text-surface-400 dark:hover:text-surface-300 focus:outline-none" data-target="month" data-tooltip="1-12, which months">
                <span data-i18n="tools.cron-builder.ui.button3">Month</span>
              </button>
              <button class="tab-btn group inline-flex items-center py-4 px-6 border-b-2 border-transparent font-medium text-sm text-surface-500 hover:text-surface-700 hover:border-surface-300 dark:text-surface-400 dark:hover:text-surface-300 focus:outline-none" data-target="dow" data-tooltip="0-6 (Sun-Sat), which days of week">
                <span data-i18n="tools.cron-builder.ui.button4">Week</span>
              </button>
            </nav>
          </div>

          <div class="p-6 flex-grow overflow-y-auto bg-surface-50/30 dark:bg-surface-950/30">
            <!-- Minute Tab -->
            <div id="tab-minute" class="tab-content flex flex-col gap-6">
              <div class="flex flex-col sm:flex-row gap-4">
                <label class="flex-1 relative flex items-center p-3 rounded-full border border-surface-200 dark:border-surface-700 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors group select-none">
                  <input type="radio" name="minute-type" value="*" class="peer sr-only" checked>
                  <div class="absolute inset-0 z-0 pointer-events-none rounded-full border border-transparent peer-checked:border-2 peer-checked:border-primary-500 peer-checked:bg-primary-50 dark:peer-checked:bg-primary-900/20 transition-all"></div>
                  <div class="relative z-10 flex-shrink-0 w-5 h-5 rounded-full border-2 border-surface-400 peer-checked:border-primary-500 peer-checked:bg-primary-500 mr-3 transition-all after:content-[''] after:absolute after:left-1/2 after:top-1/2 after:w-2 after:h-2 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-white after:opacity-0 after:transition-opacity peer-checked:after:opacity-100"></div>
                  <span class="relative z-10 text-surface-700 dark:text-surface-300 font-medium peer-checked:text-primary-700 dark:peer-checked:text-primary-300" data-i18n="tools.cron-builder.ui.desc9">Every minute (*)</span>
                </label>
                
                <label class="flex-1 relative flex items-center p-3 rounded-full border border-surface-200 dark:border-surface-700 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors group select-none">
                  <input type="radio" name="minute-type" value="range" class="peer sr-only">
                  <div class="absolute inset-0 z-0 pointer-events-none rounded-full border border-transparent peer-checked:border-2 peer-checked:border-primary-500 peer-checked:bg-primary-50 dark:peer-checked:bg-primary-900/20 transition-all"></div>
                  <div class="relative z-10 flex-shrink-0 w-5 h-5 rounded-full border-2 border-surface-400 peer-checked:border-primary-500 peer-checked:bg-primary-500 mr-3 transition-all after:content-[''] after:absolute after:left-1/2 after:top-1/2 after:w-2 after:h-2 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-white after:opacity-0 after:transition-opacity peer-checked:after:opacity-100"></div>
                  <span class="relative z-10 text-surface-700 dark:text-surface-300 font-medium peer-checked:text-primary-700 dark:peer-checked:text-primary-300" data-i18n="tools.cron-builder.ui.desc10">Specific minutes</span>
                </label>
              </div>
              
              <div id="minute-grid" class="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-3 opacity-50 pointer-events-none transition-opacity content-start">
                <!-- Generated by JS -->
              </div>
            </div>

            <!-- Hour Tab -->
            <div id="tab-hour" class="tab-content hidden flex flex-col gap-6">
              <div class="flex flex-col sm:flex-row gap-4">
                <label class="flex-1 relative flex items-center p-3 rounded-full border border-surface-200 dark:border-surface-700 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors group select-none">
                  <input type="radio" name="hour-type" value="*" class="peer sr-only" checked>
                  <div class="absolute inset-0 z-0 pointer-events-none rounded-full border border-transparent peer-checked:border-2 peer-checked:border-primary-500 peer-checked:bg-primary-50 dark:peer-checked:bg-primary-900/20 transition-all"></div>
                  <div class="relative z-10 flex-shrink-0 w-5 h-5 rounded-full border-2 border-surface-400 peer-checked:border-primary-500 peer-checked:bg-primary-500 mr-3 transition-all after:content-[''] after:absolute after:left-1/2 after:top-1/2 after:w-2 after:h-2 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-white after:opacity-0 after:transition-opacity peer-checked:after:opacity-100"></div>
                  <span class="relative z-10 text-surface-700 dark:text-surface-300 font-medium peer-checked:text-primary-700 dark:peer-checked:text-primary-300" data-i18n="tools.cron-builder.ui.desc11">Every hour (*)</span>
                </label>
                
                <label class="flex-1 relative flex items-center p-3 rounded-full border border-surface-200 dark:border-surface-700 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors group select-none">
                  <input type="radio" name="hour-type" value="range" class="peer sr-only">
                  <div class="absolute inset-0 z-0 pointer-events-none rounded-full border border-transparent peer-checked:border-2 peer-checked:border-primary-500 peer-checked:bg-primary-50 dark:peer-checked:bg-primary-900/20 transition-all"></div>
                  <div class="relative z-10 flex-shrink-0 w-5 h-5 rounded-full border-2 border-surface-400 peer-checked:border-primary-500 peer-checked:bg-primary-500 mr-3 transition-all after:content-[''] after:absolute after:left-1/2 after:top-1/2 after:w-2 after:h-2 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-white after:opacity-0 after:transition-opacity peer-checked:after:opacity-100"></div>
                  <span class="relative z-10 text-surface-700 dark:text-surface-300 font-medium peer-checked:text-primary-700 dark:peer-checked:text-primary-300" data-i18n="tools.cron-builder.ui.desc12">Specific hours</span>
                </label>
              </div>
              <div id="hour-grid" class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 opacity-50 pointer-events-none transition-opacity content-start">
                <!-- Generated by JS -->
              </div>
            </div>

            <!-- Day of Month Tab -->
            <div id="tab-dom" class="tab-content hidden flex flex-col gap-6">
              <div class="flex flex-col sm:flex-row gap-4">
                <label class="flex-1 relative flex items-center p-3 rounded-full border border-surface-200 dark:border-surface-700 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors group select-none">
                  <input type="radio" name="dom-type" value="*" class="peer sr-only" checked>
                  <div class="absolute inset-0 z-0 pointer-events-none rounded-full border border-transparent peer-checked:border-2 peer-checked:border-primary-500 peer-checked:bg-primary-50 dark:peer-checked:bg-primary-900/20 transition-all"></div>
                  <div class="relative z-10 flex-shrink-0 w-5 h-5 rounded-full border-2 border-surface-400 peer-checked:border-primary-500 peer-checked:bg-primary-500 mr-3 transition-all after:content-[''] after:absolute after:left-1/2 after:top-1/2 after:w-2 after:h-2 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-white after:opacity-0 after:transition-opacity peer-checked:after:opacity-100"></div>
                  <span class="relative z-10 text-surface-700 dark:text-surface-300 font-medium peer-checked:text-primary-700 dark:peer-checked:text-primary-300" data-i18n="tools.cron-builder.ui.desc13">Every day (*)</span>
                </label>
                
                <label class="flex-1 relative flex items-center p-3 rounded-full border border-surface-200 dark:border-surface-700 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors group select-none">
                  <input type="radio" name="dom-type" value="?" class="peer sr-only">
                  <div class="absolute inset-0 z-0 pointer-events-none rounded-full border border-transparent peer-checked:border-2 peer-checked:border-primary-500 peer-checked:bg-primary-50 dark:peer-checked:bg-primary-900/20 transition-all"></div>
                  <div class="relative z-10 flex-shrink-0 w-5 h-5 rounded-full border-2 border-surface-400 peer-checked:border-primary-500 peer-checked:bg-primary-500 mr-3 transition-all after:content-[''] after:absolute after:left-1/2 after:top-1/2 after:w-2 after:h-2 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-white after:opacity-0 after:transition-opacity peer-checked:after:opacity-100"></div>
                  <span class="relative z-10 text-surface-700 dark:text-surface-300 font-medium peer-checked:text-primary-700 dark:peer-checked:text-primary-300" data-i18n="tools.cron-builder.ui.desc14">No specific day (?)</span>
                </label>
                
                <label class="flex-1 relative flex items-center p-3 rounded-full border border-surface-200 dark:border-surface-700 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors group select-none">
                  <input type="radio" name="dom-type" value="range" class="peer sr-only">
                  <div class="absolute inset-0 z-0 pointer-events-none rounded-full border border-transparent peer-checked:border-2 peer-checked:border-primary-500 peer-checked:bg-primary-50 dark:peer-checked:bg-primary-900/20 transition-all"></div>
                  <div class="relative z-10 flex-shrink-0 w-5 h-5 rounded-full border-2 border-surface-400 peer-checked:border-primary-500 peer-checked:bg-primary-500 mr-3 transition-all after:content-[''] after:absolute after:left-1/2 after:top-1/2 after:w-2 after:h-2 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-white after:opacity-0 after:transition-opacity peer-checked:after:opacity-100"></div>
                  <span class="relative z-10 text-surface-700 dark:text-surface-300 font-medium peer-checked:text-primary-700 dark:peer-checked:text-primary-300" data-i18n="tools.cron-builder.ui.desc15">Specific days</span>
                </label>
              </div>
              <div id="dom-grid" class="grid grid-cols-7 gap-3 opacity-50 pointer-events-none transition-opacity content-start">
                <!-- Generated by JS -->
              </div>
            </div>

            <!-- Month Tab -->
            <div id="tab-month" class="tab-content hidden flex flex-col gap-6">
              <div class="flex flex-col sm:flex-row gap-4">
                <label class="flex-1 relative flex items-center p-3 rounded-full border border-surface-200 dark:border-surface-700 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors group select-none">
                  <input type="radio" name="month-type" value="*" class="peer sr-only" checked>
                  <div class="absolute inset-0 z-0 pointer-events-none rounded-full border border-transparent peer-checked:border-2 peer-checked:border-primary-500 peer-checked:bg-primary-50 dark:peer-checked:bg-primary-900/20 transition-all"></div>
                  <div class="relative z-10 flex-shrink-0 w-5 h-5 rounded-full border-2 border-surface-400 peer-checked:border-primary-500 peer-checked:bg-primary-500 mr-3 transition-all after:content-[''] after:absolute after:left-1/2 after:top-1/2 after:w-2 after:h-2 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-white after:opacity-0 after:transition-opacity peer-checked:after:opacity-100"></div>
                  <span class="relative z-10 text-surface-700 dark:text-surface-300 font-medium peer-checked:text-primary-700 dark:peer-checked:text-primary-300" data-i18n="tools.cron-builder.ui.desc16">Every month (*)</span>
                </label>
                
                <label class="flex-1 relative flex items-center p-3 rounded-full border border-surface-200 dark:border-surface-700 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors group select-none">
                  <input type="radio" name="month-type" value="range" class="peer sr-only">
                  <div class="absolute inset-0 z-0 pointer-events-none rounded-full border border-transparent peer-checked:border-2 peer-checked:border-primary-500 peer-checked:bg-primary-50 dark:peer-checked:bg-primary-900/20 transition-all"></div>
                  <div class="relative z-10 flex-shrink-0 w-5 h-5 rounded-full border-2 border-surface-400 peer-checked:border-primary-500 peer-checked:bg-primary-500 mr-3 transition-all after:content-[''] after:absolute after:left-1/2 after:top-1/2 after:w-2 after:h-2 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-white after:opacity-0 after:transition-opacity peer-checked:after:opacity-100"></div>
                  <span class="relative z-10 text-surface-700 dark:text-surface-300 font-medium peer-checked:text-primary-700 dark:peer-checked:text-primary-300" data-i18n="tools.cron-builder.ui.desc17">Specific months</span>
                </label>
              </div>
              <div id="month-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 opacity-50 pointer-events-none transition-opacity content-start">
                <!-- Generated by JS -->
              </div>
            </div>

            <!-- Day of Week Tab -->
            <div id="tab-dow" class="tab-content hidden flex flex-col gap-6">
              <div class="flex flex-col sm:flex-row gap-4">
                <label class="flex-1 relative flex items-center p-3 rounded-full border border-surface-200 dark:border-surface-700 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors group select-none">
                  <input type="radio" name="dow-type" value="*" class="peer sr-only" checked>
                  <div class="absolute inset-0 z-0 pointer-events-none rounded-full border border-transparent peer-checked:border-2 peer-checked:border-primary-500 peer-checked:bg-primary-50 dark:peer-checked:bg-primary-900/20 transition-all"></div>
                  <div class="relative z-10 flex-shrink-0 w-5 h-5 rounded-full border-2 border-surface-400 peer-checked:border-primary-500 peer-checked:bg-primary-500 mr-3 transition-all after:content-[''] after:absolute after:left-1/2 after:top-1/2 after:w-2 after:h-2 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-white after:opacity-0 after:transition-opacity peer-checked:after:opacity-100"></div>
                  <span class="relative z-10 text-surface-700 dark:text-surface-300 font-medium peer-checked:text-primary-700 dark:peer-checked:text-primary-300" data-i18n="tools.cron-builder.ui.desc18">Every day of the week (*)</span>
                </label>
                
                <label class="flex-1 relative flex items-center p-3 rounded-full border border-surface-200 dark:border-surface-700 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors group select-none">
                  <input type="radio" name="dow-type" value="?" class="peer sr-only">
                  <div class="absolute inset-0 z-0 pointer-events-none rounded-full border border-transparent peer-checked:border-2 peer-checked:border-primary-500 peer-checked:bg-primary-50 dark:peer-checked:bg-primary-900/20 transition-all"></div>
                  <div class="relative z-10 flex-shrink-0 w-5 h-5 rounded-full border-2 border-surface-400 peer-checked:border-primary-500 peer-checked:bg-primary-500 mr-3 transition-all after:content-[''] after:absolute after:left-1/2 after:top-1/2 after:w-2 after:h-2 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-white after:opacity-0 after:transition-opacity peer-checked:after:opacity-100"></div>
                  <span class="relative z-10 text-surface-700 dark:text-surface-300 font-medium peer-checked:text-primary-700 dark:peer-checked:text-primary-300" data-i18n="tools.cron-builder.ui.desc14">No specific day (?)</span>
                </label>
                
                <label class="flex-1 relative flex items-center p-3 rounded-full border border-surface-200 dark:border-surface-700 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors group select-none">
                  <input type="radio" name="dow-type" value="range" class="peer sr-only">
                  <div class="absolute inset-0 z-0 pointer-events-none rounded-full border border-transparent peer-checked:border-2 peer-checked:border-primary-500 peer-checked:bg-primary-50 dark:peer-checked:bg-primary-900/20 transition-all"></div>
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
          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-6">
            <label for="cron-expression" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              <span data-i18n="tools.cron-builder.ui.label6">Cron Expression</span> ${infoHint('Enter five fields (min hour day month dow); use * or lists/ranges to control scheduling.')}
            </label>
            <div class="flex gap-3 mb-4">
              <div class="relative flex-grow">
                <input type="text" id="cron-expression" 
                  class="w-full text-2xl font-mono tracking-wider p-4 rounded-lg border border-surface-300 dark:border-surface-700 bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors" 
                  value="* * * * *" 
                  spellcheck="false"
                  autocomplete="off">
              </div>
              <button id="copy-cron-btn" 
                class="flex-shrink-0 px-6 py-2 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-surface-900">
                <span data-i18n="tools.cron-builder.ui.button5">Copy</span>
              </button>
            </div>
            
            <div class="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-100 dark:border-primary-900/30">
              <div class="flex items-start gap-3">
                <svg class="w-6 h-6 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p id="human-readable" role="status" class="text-lg text-primary-800 dark:text-primary-200 font-medium leading-relaxed">
                  Every minute
                </p>
              </div>
            </div>
          </div>

          <!-- Next Executions -->
          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-50" data-i18n="tools.cron-builder.ui.heading7">Next Runs</h2>
              <span class="text-xs px-2 py-1 rounded bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400" data-i18n="tools.cron-builder.ui.desc20">Local Time</span>
            </div>
            <div class="relative">
              <div class="absolute left-2 top-2 bottom-2 w-0.5 bg-surface-200 dark:bg-surface-700"></div>
              <ul id="next-executions" class="space-y-4 pl-6">
                <!-- Populated by JS -->
              </ul>
            </div>
          </div>

          <!-- Recipes -->
          <div class="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-800 p-6">
            <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4" data-i18n="tools.cron-builder.ui.heading8">Common Recipes</h2>
            <div class="space-y-2" id="recipes-list">
              <!-- Populated by JS -->
            </div>
          </div>

           <!-- Tips -->
           <div class="bg-info-50 dark:bg-info-900/20 rounded-xl p-6 border border-info-100 dark:border-info-800">
             <h3 class="font-semibold text-info-800 dark:text-info-300 mb-2 flex items-center gap-2">
               <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
               Quick Tips
             </h3>
             <ul class="text-sm text-info-700 dark:text-info-400 space-y-1 list-disc list-inside">
              <li>Use <code>*</code> for "every"</li>
              <li>Use <code>*/n</code> for intervals (e.g. */5)</li>
              <li>Use <code>,</code> for lists (e.g. 1,3,5)</li>
              <li>Use <code>-</code> for ranges (e.g. 1-5)</li>
            </ul>
          </div>

        </div>
      </div>

      ${createCheatsheet('cron-builder', 'Cron Syntax Reference', [
        { heading: 'Field Order', content: `
          <table>
            <tr><th>Position</th><th>Field</th><th>Range</th></tr>
            <tr><td>1</td><td>Minute</td><td>0–59</td></tr>
            <tr><td>2</td><td>Hour</td><td>0–23</td></tr>
            <tr><td>3</td><td>Day of Month</td><td>1–31</td></tr>
            <tr><td>4</td><td>Month</td><td>1–12</td></tr>
            <tr><td>5</td><td>Day of Week</td><td>0–7 (0,7 = Sun)</td></tr>
          </table>` },
        { heading: 'Special Characters', content: `
          <table>
            <tr><th>Char</th><th>Meaning</th><th>Example</th></tr>
            <tr><td><code>*</code></td><td>Any value</td><td>Every minute</td></tr>
            <tr><td><code>,</code></td><td>List</td><td><code>1,15</code> (1st and 15th)</td></tr>
            <tr><td><code>-</code></td><td>Range</td><td><code>1-5</code> (Mon–Fri)</td></tr>
            <tr><td><code>/</code></td><td>Step</td><td><code>*/5</code> (every 5 min)</td></tr>
          </table>` },
        { heading: 'Common Examples', content: `
          <table>
            <tr><th>Expression</th><th>Description</th></tr>
            <tr><td><code>0 * * * *</code></td><td>Every hour</td></tr>
            <tr><td><code>0 0 * * *</code></td><td>Daily at midnight</td></tr>
            <tr><td><code>0 0 * * 1</code></td><td>Every Monday</td></tr>
            <tr><td><code>*/5 * * * *</code></td><td>Every 5 minutes</td></tr>
            <tr><td><code>0 9-17 * * 1-5</code></td><td>Hourly 9am–5pm weekdays</td></tr>
          </table>` }
      ])}
    ${createRelatedToolsSection(relatedToolsData)}
    </main>

    <script>
      /**
       * Cron Logic & UI Controller
       */
      (function() {
        // --- Constants & Data ---
        const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const MONTH_MAP = {JAN:1,FEB:2,MAR:3,APR:4,MAY:5,JUN:6,JUL:7,AUG:8,SEP:9,OCT:10,NOV:11,DEC:12};
        const DAY_MAP = {SUN:0,MON:1,TUE:2,WED:3,THU:4,FRI:5,SAT:6};
        
        const RECIPES = [
          { name: 'Every minute', cron: '* * * * *' },
          { name: 'Every 5 minutes', cron: '*/5 * * * *' },
          { name: 'Every hour', cron: '0 * * * *' },
          { name: 'Every day at midnight', cron: '0 0 * * *' },
          { name: 'Every day at 8am', cron: '0 8 * * *' },
          { name: 'Every Monday at 9am', cron: '0 9 * * 1' },
          { name: 'Every 1st of month', cron: '0 0 1 * *' },
          { name: 'Weekdays at 9am', cron: '0 9 * * 1-5' },
        ];

        // --- State ---
        let state = {
          minute: '*',
          hour: '*',
          dom: '*',
          month: '*',
          dow: '*'
        };

        // --- DOM Elements ---
        const input = document.getElementById('cron-expression');
        const humanReadable = document.getElementById('human-readable');
        const nextExecutionsList = document.getElementById('next-executions');
        const recipesList = document.getElementById('recipes-list');
        const tabs = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        // --- Initialization ---
        function init() {
          renderGrids();
          renderRecipes();
          
          // Event Listeners
          input.addEventListener('input', handleInput);
          
          document.getElementById('copy-cron-btn').addEventListener('click', function() {
             copyToClipboard(input.value, this);
          });
          
          tabs.forEach(tab => {
            tab.addEventListener('click', () => switchTab(tab.dataset.target));
          });

          // Radio buttons for types
          ['minute', 'hour', 'dom', 'month', 'dow'].forEach(part => {
            document.querySelectorAll(\`input[name="\${part}-type"]\`).forEach(radio => {
              radio.addEventListener('change', (e) => handleTypeChange(part, e.target.value));
            });
          });

          // Initial Parse
          handleInput();
        }

        // --- Core Logic: Parsing & Stringifying ---

        function parseCron(cronStr) {
          const parts = cronStr.trim().split(/\\s+/);
          if (parts.length < 5) return null;
          
          return {
            minute: parts[0],
            hour: parts[1],
            dom: parts[2],
            month: parts[3],
            dow: parts[4]
          };
        }

        function stringifyState() {
          return \`\${state.minute} \${state.hour} \${state.dom} \${state.month} \${state.dow}\`;
        }

        function updateStateFromInput() {
          const parsed = parseCron(input.value);
          if (parsed) {
            state = parsed;
            updateUIFromState();
            updateHumanReadable();
            updateNextExecutions();
          }
        }

        function updateInputFromState() {
          const str = stringifyState();
          input.value = str;
          updateHumanReadable();
          updateNextExecutions();
        }

        // --- UI Updates ---

        function handleInput() {
          updateStateFromInput();
        }

        function handleTypeChange(part, type) {
          if (type === '*' || type === '?') {
            state[part] = type;
            toggleGrid(part, false);
          } else {
            // If switching to range, default to '0' or '1' if currently *
            if (state[part] === '*' || state[part] === '?') {
              state[part] = (part === 'dom' || part === 'month') ? '1' : '0';
            }
            toggleGrid(part, true);
          }
          updateInputFromState();
          updateUIFromState(); // To refresh grid selection
        }

        function toggleGrid(part, enabled) {
          const grid = document.getElementById(\`\${part}-grid\`);
          if (enabled) {
            grid.classList.remove('opacity-50', 'pointer-events-none');
          } else {
            grid.classList.add('opacity-50', 'pointer-events-none');
          }
        }

        function updateUIFromState() {
          ['minute', 'hour', 'dom', 'month', 'dow'].forEach(part => {
            const val = state[part];
            const radios = document.querySelectorAll(\`input[name="\${part}-type"]\`);
            const grid = document.getElementById(\`\${part}-grid\`);
            
            // Update Radios
            let type = 'range';
            if (val === '*') type = '*';
            else if (val === '?') type = '?';
            
            // Simple check for * or ?
            radios.forEach(r => {
              if (r.value === type) r.checked = true;
            });

            toggleGrid(part, type === 'range');

            // Update Grid Selections
            const selected = parsePartToSet(val, part);
            const checkboxes = grid.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => {
              cb.checked = selected.has(parseInt(cb.value));
            });
          });
        }

        function parsePartToSet(partStr, partType) {
          const set = new Set();
          if (partStr === '*' || partStr === '?') return set;

          const parseVal = (v) => {
            if (!isNaN(v)) return parseInt(v);
            const u = v.toUpperCase();
            if (partType === 'month' && MONTH_MAP[u] !== undefined) return MONTH_MAP[u];
            if (partType === 'dow' && DAY_MAP[u] !== undefined) return DAY_MAP[u];
            return parseInt(v);
          };

          // Handle lists
          const items = partStr.split(',');
          items.forEach(item => {
            if (item.includes('-')) {
              const [s, e] = item.split('-');
              const start = parseVal(s);
              const end = parseVal(e);
              for (let i = start; i <= end; i++) set.add(i);
            } else if (item.includes('/')) {
              // Handle step values like */5 or 0/5
              const [range, step] = item.split('/');
              let start = 0, end = 0;
              
              if (partType === 'minute') end = 59;
              if (partType === 'hour') end = 23;
              if (partType === 'dom') { start = 1; end = 31; }
              if (partType === 'month') { start = 1; end = 12; }
              if (partType === 'dow') end = 6;

              if (range !== '*') {
                 if (range.includes('-')) {
                    const [s, e] = range.split('-');
                    start = parseVal(s);
                    end = parseVal(e);
                 } else {
                    start = parseVal(range);
                 }
              }
              
              const stepNum = parseInt(step);
              for (let i = start; i <= end; i += stepNum) set.add(i);

            } else {
              set.add(parseVal(item));
            }
          });
          return set;
        }

        function updatePartFromGrid(part) {
          const grid = document.getElementById(\`\${part}-grid\`);
          const checked = Array.from(grid.querySelectorAll('input:checked')).map(cb => parseInt(cb.value));
          
          if (checked.length === 0) {
            state[part] = '*';
            document.querySelector(\`input[name="\${part}-type"][value="*"]\`).checked = true;
            toggleGrid(part, false);
          } else {
            checked.sort((a, b) => a - b);
            state[part] = compressSelection(checked);
          }
          updateInputFromState();
        }

        function compressSelection(nums) {
          if (nums.length === 0) return '*';
          
          let ranges = [];
          let start = nums[0];
          let prev = nums[0];

          for (let i = 1; i < nums.length; i++) {
            if (nums[i] === prev + 1) {
              prev = nums[i];
            } else {
              ranges.push(start === prev ? \`\${start}\` : \`\${start}-\${prev}\`);
              start = nums[i];
              prev = nums[i];
            }
          }
          ranges.push(start === prev ? \`\${start}\` : \`\${start}-\${prev}\`);
          
          return ranges.join(',');
        }

        // --- Rendering ---

        function renderGrids() {
          // Minute (0-59)
          renderGrid('minute', 0, 59, (i) => i.toString().padStart(2, '0'));
          // Hour (0-23)
          renderGrid('hour', 0, 23, (i) => i.toString().padStart(2, '0'));
          // DOM (1-31)
          renderGrid('dom', 1, 31, (i) => i.toString());
          // Month (1-12)
          renderGrid('month', 1, 12, (i) => MONTHS[i-1]);
          // DOW (0-6)
          renderGrid('dow', 0, 6, (i) => DAYS[i]);
        }

        function renderGrid(part, start, end, labelFn) {
          const container = document.getElementById(\`\${part}-grid\`);
          container.innerHTML = '';
          
          for (let i = start; i <= end; i++) {
            const label = document.createElement('label');
            label.className = 'flex items-center justify-center w-8 h-8 border border-surface-200 dark:border-surface-700 rounded-full cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors select-none text-sm';
            
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.value = i;
            input.className = 'hidden peer'; 
            
            const span = document.createElement('span');
            span.textContent = labelFn(i);
            span.className = 'peer-checked:font-bold peer-checked:text-primary-600 dark:peer-checked:text-primary-400';
            
            input.addEventListener('change', () => {
              if (input.checked) {
                label.classList.add('bg-primary-50', 'dark:bg-primary-900/30', 'border-primary-200', 'dark:border-primary-800');
              } else {
                label.classList.remove('bg-primary-50', 'dark:bg-primary-900/30', 'border-primary-200', 'dark:border-primary-800');
              }
              updatePartFromGrid(part);
            });

            label.appendChild(input);
            label.appendChild(span);
            container.appendChild(label);
          }
        }

        function renderRecipes() {
          recipesList.innerHTML = RECIPES.map(r => \`
            <button class="recipe-btn w-full text-left px-4 py-3 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors flex justify-between items-center group" data-cron="\${r.cron}">
              <span class="text-sm font-medium text-surface-700 dark:text-surface-300 group-hover:text-primary-600 dark:group-hover:text-primary-400">\${r.name}</span>
              <code class="text-xs bg-surface-100 dark:bg-surface-950 px-2 py-1 rounded text-surface-500 dark:text-surface-400 font-mono">\${r.cron}</code>
            </button>
          \`).join('');
          
          recipesList.querySelectorAll('.recipe-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              input.value = btn.dataset.cron;
              handleInput();
            });
          });
        }

        function switchTab(target) {
          tabs.forEach(t => {
            if (t.dataset.target === target) {
              t.classList.add('border-primary-500', 'text-primary-600', 'dark:text-primary-400');
              t.classList.remove('border-transparent', 'text-surface-500', 'dark:text-surface-400');
            } else {
              t.classList.remove('border-primary-500', 'text-primary-600', 'dark:text-primary-400');
              t.classList.add('border-transparent', 'text-surface-500', 'dark:text-surface-400');
            }
          });
          
          tabContents.forEach(c => {
            if (c.id === \`tab-\${target}\`) c.classList.remove('hidden');
            else c.classList.add('hidden');
          });
        }

        // --- Human Readable & Next Execution Logic ---

         function updateHumanReadable() {
           try {
             const desc = describeCron(state);
             humanReadable.textContent = desc;
             humanReadable.classList.remove('text-error-500');
             humanReadable.classList.add('text-primary-800', 'dark:text-primary-200');
           } catch (e) {
             humanReadable.textContent = _t('tools.cron-builder.js.text0', 'Invalid cron expression');
             humanReadable.classList.add('text-error-500');
             humanReadable.classList.remove('text-primary-800', 'dark:text-primary-200');
           }
         }

        function describeCron(s) {
          if (s.minute === '*' && s.hour === '*' && s.dom === '*' && s.month === '*' && s.dow === '*') return 'Every minute';
          
          let desc = '';
          
          // Time
          if (s.minute === '0' && s.hour === '0') desc += 'At midnight';
          else if (s.minute === '0' && s.hour !== '*') desc += \`At \${s.hour}:00\`;
          else if (s.minute !== '*' && s.hour !== '*') desc += \`At \${s.hour}:\${s.minute.padStart(2,'0')}\`;
          else if (s.minute !== '*' && s.hour === '*') desc += \`At minute \${s.minute} of every hour\`;
          else desc += 'Every minute';

          // Day
          if (s.dom !== '*' && s.dom !== '?') desc += \` on day \${s.dom} of the month\`;
          
          // Weekday
          if (s.dow !== '*' && s.dow !== '?') {
             const days = s.dow.split(',').map(d => {
               if(d.includes('-')) return d; // keep ranges simple for now
               return DAYS[parseInt(d)];
             }).join(', ');
             desc += \` on \${days}\`;
          }
          
          // Month
          if (s.month !== '*') desc += \` in \${s.month}\`;

          return desc.charAt(0).toUpperCase() + desc.slice(1);
        }

         function updateNextExecutions() {
           nextExecutionsList.innerHTML = '';
           try {
             const dates = calculateNextRuns(input.value, 5);
             dates.forEach(date => {
               const li = document.createElement('li');
               li.className = 'flex items-center gap-3 text-sm';
               li.innerHTML = \`
                 <span class="font-mono text-surface-500 dark:text-surface-400">\${formatDate(date)}</span>
                 <span class="text-xs text-surface-400 dark:text-surface-400">(\${timeFromNow(date)})</span>
               \`;
               nextExecutionsList.appendChild(li);
             });
           } catch (e) {
             nextExecutionsList.innerHTML = '<li class="text-error-500 text-sm">Invalid expression</li>';
           }
         }

        function formatDate(date) {
          return date.toLocaleString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: false 
          });
        }

        function timeFromNow(date) {
          const diff = date - new Date();
          const mins = Math.floor(diff / 60000);
          const hours = Math.floor(mins / 60);
          const days = Math.floor(hours / 24);
          
          if (days > 0) return \`in \${days}d \${hours % 24}h\`;
          if (hours > 0) return \`in \${hours}h \${mins % 60}m\`;
          return \`in \${mins}m\`;
        }

        // --- Scheduler Logic (Simplified) ---
        
        function calculateNextRuns(cronStr, count) {
          const parsed = parseCron(cronStr);
          if (!parsed) throw new Error('Invalid');

          const schedule = {
            m: parsePartToSet(parsed.minute, 'minute'),
            h: parsePartToSet(parsed.hour, 'hour'),
            D: parsePartToSet(parsed.dom, 'dom'),
            M: parsePartToSet(parsed.month, 'month'),
            d: parsePartToSet(parsed.dow, 'dow')
          };

          let results = [];
          let current = new Date();
          current.setSeconds(0);
          current.setMilliseconds(0);
          current.setMinutes(current.getMinutes() + 1); // Start from next minute

          let safety = 0;
          while (results.length < count && safety < 5000) { // 5000 iterations max
            safety++;
            
            // Check Month
            if (schedule.M.size > 0 && !schedule.M.has(current.getMonth() + 1)) {
              current.setMonth(current.getMonth() + 1);
              current.setDate(1);
              current.setHours(0, 0, 0, 0);
              continue;
            }

            // Check Day (DOM and DOW)
            const domMatch = schedule.D.size === 0 || schedule.D.has(current.getDate());
            const dowMatch = schedule.d.size === 0 || schedule.d.has(current.getDay());
            
            let dayOk = false;
            const domRestricted = schedule.D.size > 0;
            const dowRestricted = schedule.d.size > 0;

            if (domRestricted && dowRestricted) {
              dayOk = domMatch || dowMatch;
            } else if (domRestricted) {
              dayOk = domMatch;
            } else if (dowRestricted) {
              dayOk = dowMatch;
            } else {
              dayOk = true;
            }

            if (!dayOk) {
              current.setDate(current.getDate() + 1);
              current.setHours(0, 0, 0, 0);
              continue;
            }

            // Check Hour
            if (schedule.h.size > 0 && !schedule.h.has(current.getHours())) {
              current.setHours(current.getHours() + 1);
              current.setMinutes(0);
              continue;
            }

            // Check Minute
            if (schedule.m.size > 0 && !schedule.m.has(current.getMinutes())) {
              current.setMinutes(current.getMinutes() + 1);
              continue;
            }

            // Match found
            results.push(new Date(current));
            current.setMinutes(current.getMinutes() + 1);
          }
          
          return results;
        }

        // Start
        init();
      })();
    </script>
  `;

  return respondHTML(createPageTemplate({
    title: 'Cron Builder',
    description: 'Visual cron expression editor and scheduler. Build, debug, and preview cron jobs with next execution times.',
    path: canonicalPath,
    content: content,
    scripts: getCopyToClipboardScript()
  }), {
    headers: {
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
