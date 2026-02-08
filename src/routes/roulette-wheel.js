import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader } from '../utils/common-ui.js';

function renderRouletteWheelPage() {
  const toolHeader = createToolHeader(
    { emoji: '🎯' },
    'Roulette Wheel',
    'Spin the wheel for fair random picks.',
    [{ text: '<span data-i18n="tools.roulette-wheel.ui.badge0">Client-Side Only</span>' }],
    { toolId: 'roulette-wheel' }
  );

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl shadow-sm p-6 sm:p-8">
        ${toolHeader}
        <div class="text-center py-12">
          <p class="text-surface-600 dark:text-surface-400">Roulette Wheel - Rebuilding</p>
        </div>
      </div>
    </main>
  `;

  return createPageTemplate({
    title: 'Roulette Wheel',
    description: 'Spin the wheel for fair random picks.',
    content,
    path: '/roulette-wheel'
  });
}

export async function handleRouletteWheelRoutes(request, url) {
  if (url.pathname === '/roulette-wheel' || url.pathname === '/roulette-wheel/') {
    if (request.method === 'GET') {
      return respondHTML(renderRouletteWheelPage());
    }
  }
  return null;
}
