/**
 * Global Keyboard Shortcuts Framework
 * Provides consistent shortcuts across all tools
 */

export function getKeyboardShortcutsScript() {
  return `<script>
// Global keyboard shortcuts framework
(function() {
  'use strict';

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? 'metaKey' : 'ctrlKey';
  const modKeyName = isMac ? '⌘' : 'Ctrl';

  // Keyboard shortcuts configuration
  const shortcuts = {
    execute: { key: 'Enter', mod: true, action: 'execute', label: 'Execute/Generate' },
    clear: { key: 'k', mod: true, action: 'clear', label: 'Clear all fields' },
    copy: { key: 'c', mod: true, shift: true, action: 'copy', label: 'Copy output' },
    download: { key: 'd', mod: true, action: 'download', label: 'Download output' },
    help: { key: '/', mod: true, action: 'help', label: 'Show shortcuts' }
  };

  // Track if help modal is open
  let helpModalOpen = false;

  // Global keyboard event handler
  document.addEventListener('keydown', (e) => {
    // Check each shortcut
    for (const [name, config] of Object.entries(shortcuts)) {
      const modMatch = config.mod ? e[modKey] : !e[modKey];
      const shiftMatch = config.shift ? e.shiftKey : !e.shiftKey;
      const keyMatch = e.key.toLowerCase() === config.key.toLowerCase();

      if (modMatch && shiftMatch && keyMatch) {
        // Special handling for copy - only prevent if Shift is required
        if (config.action === 'copy' && config.shift) {
          e.preventDefault();
          handleShortcut(config.action);
        } else if (config.action !== 'copy') {
          e.preventDefault();
          handleShortcut(config.action);
        }
      }
    }
  });

  function handleShortcut(action) {
    const event = new CustomEvent('keyboard-shortcut', { detail: { action } });
    document.dispatchEvent(event);

    // Built-in handlers
    switch (action) {
      case 'execute':
        executeAction();
        break;
      case 'clear':
        clearAction();
        break;
      case 'copy':
        copyAction();
        break;
      case 'download':
        downloadAction();
        break;
      case 'help':
        toggleHelpModal();
        break;
    }
  }

  function executeAction() {
    // Find and click primary action button
    const buttons = [
      document.querySelector('[data-shortcut="execute"]'),
      document.querySelector('button[type="submit"]'),
      document.getElementById('generate-btn'),
      document.getElementById('analyze-btn'),
      document.getElementById('calculate-btn')
    ];

    const btn = buttons.find(b => b && !b.disabled);
    if (btn) {
      btn.click();
      showShortcutFeedback('⚡ Executed');
    }
  }

  function clearAction() {
    // Find and click clear button
    const clearBtn =
      document.querySelector('[data-shortcut="clear"]') ||
      document.getElementById('clear-btn');

    if (clearBtn) {
      clearBtn.click();
      showShortcutFeedback('🗑️ Cleared');
    } else {
      // Fallback: clear all text inputs and textareas
      document.querySelectorAll('input[type="text"], textarea').forEach(el => {
        el.value = '';
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
      showShortcutFeedback('🗑️ Fields cleared');
    }
  }

  function copyAction() {
    // Find and click copy button
    const copyBtn =
      document.querySelector('[data-shortcut="copy"]') ||
      document.getElementById('copy-btn');

    if (copyBtn) {
      copyBtn.click();
    } else {
      // Fallback: copy output text
      const output =
        document.getElementById('output') ||
        document.getElementById('result') ||
        document.querySelector('[data-output]') ||
        document.querySelector('code, pre');

      if (output) {
        const text = output.textContent || output.value;
        if (text && text.trim()) {
          navigator.clipboard.writeText(text).then(() => {
            showShortcutFeedback('📋 Copied to clipboard');
          });
        }
      }
    }
  }

  function downloadAction() {
    const downloadBtn =
      document.querySelector('[data-shortcut="download"]') ||
      document.getElementById('download-btn');

    if (downloadBtn) {
      downloadBtn.click();
      showShortcutFeedback('💾 Downloaded');
    }
  }

  function toggleHelpModal() {
    if (helpModalOpen) {
      closeHelpModal();
    } else {
      showHelpModal();
    }
  }

  function createKeyboardShortcutRow(label, keys) {
    const row = document.createElement('div');
    row.className = 'flex items-center justify-between py-2 border-b border-surface-200 dark:border-surface-800 last:border-0';

    const labelSpan = document.createElement('span');
    labelSpan.className = 'text-sm text-surface-700 dark:text-surface-300';
    labelSpan.textContent = label;

    const keysContainer = document.createElement('div');
    keysContainer.className = 'flex gap-1';

    keys.forEach((key, index) => {
      const kbd = document.createElement('kbd');
      kbd.className = 'px-2 py-1 text-xs font-mono bg-surface-100 dark:bg-surface-800 text-surface-800 dark:text-surface-200 rounded border border-surface-300 dark:border-surface-700';
      kbd.textContent = key;
      keysContainer.appendChild(kbd);

      if (index < keys.length - 1) {
        const plus = document.createElement('span');
        plus.textContent = '+';
        plus.className = 'text-surface-400';
        keysContainer.appendChild(plus);
      }
    });

    row.appendChild(labelSpan);
    row.appendChild(keysContainer);
    return row;
  }

  function showHelpModal() {
    helpModalOpen = true;

    const modal = document.createElement('div');
    modal.id = 'keyboard-shortcuts-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm';

    const content = document.createElement('div');
    content.className = 'bg-white dark:bg-surface-900 rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up';

    // Header
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between mb-6';

    const title = document.createElement('h3');
    title.className = 'text-xl font-bold text-surface-900 dark:text-surface-50';
    title.textContent = '⌨️ Keyboard Shortcuts';

    const closeBtn = document.createElement('button');
    closeBtn.id = 'close-shortcuts-modal';
    closeBtn.className = 'text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors';
    closeBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Shortcuts list
    const list = document.createElement('div');
    list.className = 'space-y-3';

    Object.entries(shortcuts).forEach(([name, config]) => {
      const keys = [];
      if (config.mod) keys.push(modKeyName);
      if (config.shift) keys.push('Shift');
      keys.push(config.key === 'Enter' ? '⏎' : config.key.toUpperCase());

      list.appendChild(createKeyboardShortcutRow(config.label, keys));
    });

    // Tip box
    const tip = document.createElement('div');
    tip.className = 'mt-6 p-3 bg-surface-50 dark:bg-surface-950 rounded-lg border border-surface-200 dark:border-surface-800';
    const tipText = document.createElement('p');
    tipText.className = 'text-xs text-surface-700 dark:text-surface-300';
    tipText.innerHTML = '<strong>💡 Tip:</strong> Most tools have additional shortcuts. Look for underlined letters in button labels.';
    tip.appendChild(tipText);

    content.appendChild(header);
    content.appendChild(list);
    content.appendChild(tip);
    modal.appendChild(content);
    document.body.appendChild(modal);

    // Close handlers
    closeBtn.addEventListener('click', closeHelpModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeHelpModal();
    });
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        closeHelpModal();
        document.removeEventListener('keydown', escHandler);
      }
    });
  }

  function closeHelpModal() {
    const modal = document.getElementById('keyboard-shortcuts-modal');
    if (modal) {
      modal.remove();
      helpModalOpen = false;
    }
  }

  function showShortcutFeedback(message) {
    const existing = document.getElementById('shortcut-feedback');
    if (existing) existing.remove();

    const feedback = document.createElement('div');
    feedback.id = 'shortcut-feedback';
    feedback.className = 'fixed bottom-4 right-4 z-50 px-4 py-2 bg-surface-900 dark:bg-surface-50 text-white dark:text-surface-900 text-sm font-medium rounded-lg shadow-lg animate-fade-in-up';
    feedback.textContent = message;
    document.body.appendChild(feedback);

    setTimeout(() => {
      feedback.classList.add('opacity-0', 'transition-opacity', 'duration-300');
      setTimeout(() => feedback.remove(), 300);
    }, 1500);
  }

  // Add visual indicator for shortcut availability
  const indicator = document.createElement('button');
  indicator.className = 'fixed bottom-4 left-4 z-40 p-2 bg-surface-900/90 dark:bg-surface-800 text-white rounded-full shadow-lg hover:bg-surface-900 dark:hover:bg-surface-700 transition-all opacity-70 hover:opacity-100';
  indicator.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>';
  indicator.title = 'Press ' + modKeyName + '+/ for keyboard shortcuts';
  indicator.addEventListener('click', showHelpModal);
  document.body.appendChild(indicator);

  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = \`
    @keyframes fade-in-up {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in-up { animation: fade-in-up 0.3s ease-out; }
  \`;
  document.head.appendChild(style);

})();
</script>`;
}
