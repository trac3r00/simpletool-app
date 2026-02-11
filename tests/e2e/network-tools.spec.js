import { test, expect } from '@playwright/test';
import { TOOL_ACTIONS } from '../helpers/tool-suite.js';

test.describe('Port Reference', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/port-reference', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();
  });

  test('page loads with correct title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Port Reference');
  });

  test('search input is visible', async ({ page }) => {
    await expect(page.locator('#port-search')).toBeVisible();
  });

  test('protocol filter buttons exist', async ({ page }) => {
    await expect(page.locator('.protocol-filter')).toHaveCount(3);
    await expect(page.locator('[data-protocol="all"]')).toBeVisible();
    await expect(page.locator('[data-protocol="tcp"]')).toBeVisible();
    await expect(page.locator('[data-protocol="udp"]')).toBeVisible();
  });

  test('category filter buttons exist', async ({ page }) => {
    await expect(page.locator('.category-filter')).toHaveCount(4);
    await expect(page.locator('[data-category="all"]')).toBeVisible();
    await expect(page.locator('[data-category="well-known"]')).toBeVisible();
  });

  test('search for port number shows results', async ({ page }) => {
    await page.locator('#port-search').fill('443');
    await page.waitForTimeout(300);
    const resultsBody = page.locator('#results-body');
    await expect(resultsBody).toContainText('443');
  });

  test('search for service name shows results', async ({ page }) => {
    await page.locator('#port-search').fill('SSH');
    await page.waitForTimeout(300);
    const resultsBody = page.locator('#results-body');
    await expect(resultsBody).toContainText('22');
  });

  test('clear button clears search', async ({ page }) => {
    await page.locator('#port-search').fill('80');
    await page.locator('#clear-search').click();
    await expect(page.locator('#port-search')).toHaveValue('');
  });

  test('top 50 ports grid is visible', async ({ page }) => {
    await expect(page.locator('#top-ports-grid')).toBeVisible();
  });

  test('stats display shows counts', async ({ page }) => {
    await expect(page.locator('#total-ports')).toBeVisible();
    await expect(page.locator('#filtered-count')).toBeVisible();
  });

  test('dark mode: tool renders in dark mode', async ({ page }) => {
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('#port-search')).toBeVisible();
  });

  test('mobile viewport: renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/port-reference', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('#port-search')).toBeVisible();
  });

  test('TOOL_ACTIONS smoke test', async ({ page }) => {
    const actions = TOOL_ACTIONS['port-reference'];
    await actions.action(page);
    await actions.waitFor(page);
  });
});

test.describe('Bandwidth Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bandwidth-calculator', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();
  });

  test('page loads with correct title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Bandwidth Calculator');
  });

  test('all tabs are visible', async ({ page }) => {
    await expect(page.locator('#tab-trigger-transfer')).toBeVisible();
    await expect(page.locator('#tab-trigger-bandwidth')).toBeVisible();
    await expect(page.locator('#tab-trigger-capacity')).toBeVisible();
    await expect(page.locator('#tab-trigger-tcp')).toBeVisible();
  });

  test('transfer time calculation works', async ({ page }) => {
    await page.locator('#tab-trigger-transfer').click();
    await page.locator('#transfer-size').fill('1');
    await page.locator('#transfer-bandwidth').fill('100');
    await expect(page.locator('#transfer-result')).not.toHaveText('--');
  });

  test('preset buttons work', async ({ page }) => {
    await page.locator('[data-preset="size"][data-value="1073741824"]').click();
    await expect(page.locator('#transfer-size')).toHaveValue('1073741824');
  });

  test('unit system toggle works', async ({ page }) => {
    await page.locator('#unit-binary').click();
    const binaryBtn = page.locator('#unit-binary');
    await expect(binaryBtn).toHaveClass(/active/);
  });

  test('tab switching works', async ({ page }) => {
    await page.locator('#tab-trigger-bandwidth').click();
    await expect(page.locator('#tab-bandwidth')).toBeVisible();
    await expect(page.locator('#tab-transfer')).toHaveClass(/hidden/);
  });

  test('required bandwidth calculation works', async ({ page }) => {
    await page.locator('#tab-trigger-bandwidth').click();
    await page.locator('#bw-size').fill('100');
    await page.locator('#bw-minutes').fill('10');
    await expect(page.locator('#bw-result')).not.toHaveText('--');
  });

  test('data capacity calculation works', async ({ page }) => {
    await page.locator('#tab-trigger-capacity').click();
    await page.locator('#cap-bandwidth').fill('100');
    await page.locator('#cap-hours').fill('1');
    await expect(page.locator('#cap-result')).not.toHaveText('--');
  });

  test('TCP overhead calculation works', async ({ page }) => {
    await page.locator('#tab-trigger-tcp').click();
    await page.locator('#tcp-bandwidth').fill('1');
    await page.locator('#tcp-rtt').fill('50');
    await expect(page.locator('#tcp-bdp')).not.toHaveText('--');
  });

  test('dark mode: tool renders in dark mode', async ({ page }) => {
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await expect(page.locator('main')).toBeVisible();
  });

  test('mobile viewport: renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/bandwidth-calculator', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();
  });

  test('TOOL_ACTIONS smoke test', async ({ page }) => {
    const actions = TOOL_ACTIONS['bandwidth-calculator'];
    await actions.action(page);
    await actions.waitFor(page);
  });
});

test.describe('DNS Record Reference', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dns-reference', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();
  });

  test('page loads with correct title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('DNS Record Reference');
  });

  test('record type grid is visible', async ({ page }) => {
    await expect(page.locator('#record-grid')).toBeVisible();
  });

  test('record type cards are clickable', async ({ page }) => {
    const cards = page.locator('.record-card');
    await expect(cards).toHaveCount(15);
    await cards.first().click();
    await expect(page.locator('#detail-panel')).toBeVisible();
  });

   test('search filters record types', async ({ page }) => {
     await page.locator('#search-input').fill('A');
     await page.waitForTimeout(300);
     const visibleCards = page.locator('.record-card:not([style*="display: none"])');
     const count = await visibleCards.count();
     expect(count).toBeGreaterThan(0);
   });

  test('record detail panel shows correct info', async ({ page }) => {
    await page.locator('.record-card[data-type="A"]').click();
    await expect(page.locator('#detail-title')).toHaveText('A');
    await expect(page.locator('#detail-description')).toBeVisible();
    await expect(page.locator('#detail-syntax')).toBeVisible();
  });

  test('command builder exists', async ({ page }) => {
    await expect(page.locator('#cmd-record-type')).toBeVisible();
    await expect(page.locator('#cmd-domain')).toBeVisible();
    await expect(page.locator('#dig-output')).toBeVisible();
    await expect(page.locator('#nslookup-output')).toBeVisible();
  });

  test('command builder generates dig command', async ({ page }) => {
    await page.locator('#cmd-record-type').selectOption('MX');
    await page.locator('#cmd-domain').fill('example.com');
    await expect(page.locator('#dig-output')).toContainText('MX');
    await expect(page.locator('#dig-output')).toContainText('example.com');
  });

  test('copy buttons work in command builder', async ({ page }) => {
    await expect(page.locator('#copy-dig')).toBeVisible();
    await expect(page.locator('#copy-nslookup')).toBeVisible();
  });

  test('close detail button works', async ({ page }) => {
    await page.locator('.record-card').first().click();
    await expect(page.locator('#detail-panel')).toBeVisible();
    await page.locator('#close-detail').click();
    await expect(page.locator('#detail-panel')).toHaveClass(/hidden/);
  });

  test('dark mode: tool renders in dark mode', async ({ page }) => {
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('#record-grid')).toBeVisible();
  });

  test('mobile viewport: renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dns-reference', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();
  });

  test('TOOL_ACTIONS smoke test', async ({ page }) => {
    const actions = TOOL_ACTIONS['dns-reference'];
    await actions.action(page);
    await actions.waitFor(page);
  });
});

test.describe('CIDR Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cidr-calculator', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();
  });

  test('page loads with correct title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('IP Subnet Planner');
  });

  test('CIDR input is visible', async ({ page }) => {
    await expect(page.locator('#cidr-input')).toBeVisible();
  });

  test('prefix slider is visible', async ({ page }) => {
    await expect(page.locator('#prefix-slider')).toBeVisible();
  });

  test('analyze button works', async ({ page }) => {
    await page.locator('#cidr-input').fill('192.168.1.0/24');
    await page.locator('#analyze-btn').click();
    await expect(page.locator('#results-panel')).not.toHaveClass(/hidden/);
  });

  test('CIDR chips populate input', async ({ page }) => {
    await page.locator('[data-cidr-example="10.0.0.0/8"]').click();
    await expect(page.locator('#cidr-input')).toHaveValue('10.0.0.0/8');
  });

  test('host planner calculates ideal prefix', async ({ page }) => {
    await page.locator('#host-requirement').fill('500');
    await page.locator('#host-plan-btn').click();
    await expect(page.locator('#host-plan-result')).not.toContainText('Ready when you need it');
  });

  test('validation list shows results after analysis', async ({ page }) => {
    await page.locator('#cidr-input').fill('192.168.1.0/24');
    await page.locator('#analyze-btn').click();
    const validationItems = page.locator('#validation-list li');
    await expect(validationItems).toHaveCount(3);
  });

  test('summary cards show after analysis', async ({ page }) => {
    await page.locator('#cidr-input').fill('10.0.0.0/8');
    await page.locator('#analyze-btn').click();
    await expect(page.locator('#summary-network')).not.toHaveText('—');
    await expect(page.locator('#summary-capacity')).not.toHaveText('—');
  });

  test('reset button clears form', async ({ page }) => {
    await page.locator('#cidr-input').fill('192.168.1.0/24');
    await page.locator('#reset-btn').click();
    await expect(page.locator('#cidr-input')).toHaveValue('');
    await expect(page.locator('#results-panel')).toHaveClass(/hidden/);
  });

  test('IPv6 example chip works', async ({ page }) => {
    await page.locator('[data-cidr-example="2001:db8::/32"]').click();
    await page.locator('#analyze-btn').click();
    await expect(page.locator('#detail-version')).toHaveText('IPv6');
  });

  test('dark mode: tool renders in dark mode', async ({ page }) => {
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('#cidr-input')).toBeVisible();
  });

  test('mobile viewport: renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/cidr-calculator', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();
  });

  test('TOOL_ACTIONS smoke test', async ({ page }) => {
    const actions = TOOL_ACTIONS['cidr-calculator'];
    await actions.action(page);
    await actions.waitFor(page);
  });
});

test.describe('Wireshark Filter Builder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/wireshark-filter', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();
  });

  test('page loads with correct title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Wireshark Filter Builder');
  });

  test('display filter tab is active by default', async ({ page }) => {
    await expect(page.locator('#tab-display')).toHaveClass(/text-primary-600/);
    await expect(page.locator('#panel-display')).toBeVisible();
  });

  test('BPF tab switching works', async ({ page }) => {
    await page.locator('#tab-bpf').click();
    await expect(page.locator('#tab-bpf')).toHaveClass(/text-primary-600/);
    await expect(page.locator('#panel-bpf')).toBeVisible();
    await expect(page.locator('#panel-display')).toHaveClass(/hidden/);
  });

   test('display filter protocol selection works', async ({ page }) => {
     await page.locator('#df-protocol').selectOption('tcp');
     const dfField = page.locator('#df-field');
     const optionCount = await dfField.locator('option').count();
     expect(optionCount).toBeGreaterThan(1);
   });

  test('preset filters work', async ({ page }) => {
    await page.locator('[data-filter="http"]').click();
    await expect(page.locator('#filter-preview')).toContainText('http');
  });

  test('logical operator buttons work', async ({ page }) => {
    await page.locator('[data-filter="http"]').click();
    await page.locator('.logic-btn[data-op="&&"]').click();
    await expect(page.locator('#filter-preview')).toContainText('&&');
  });

  test('clear filter button works', async ({ page }) => {
    await page.locator('[data-filter="http"]').click();
    await page.locator('#clear-filter-btn').click();
    await expect(page.locator('#filter-preview')).toContainText('(empty)');
  });

  test('BPF primitive selection works', async ({ page }) => {
    await page.locator('#tab-bpf').click();
    await page.locator('#bpf-primitive').selectOption('port');
    await page.locator('#bpf-value').fill('80');
    await page.locator('#bpf-add-btn').click();
    await expect(page.locator('#filter-preview')).toContainText('port 80');
  });

   test('protocol reference accordion exists', async ({ page }) => {
     await expect(page.locator('#protocol-reference')).toBeVisible();
     const detailsCount = await page.locator('#protocol-reference details').count();
     expect(detailsCount).toBeGreaterThan(0);
   });

  test('protocol reference details expand', async ({ page }) => {
    const tcpDetails = page.locator('#protocol-reference details').first();
    await tcpDetails.locator('summary').click();
    await expect(tcpDetails.locator('table')).toBeVisible();
  });

  test('dark mode: tool renders in dark mode', async ({ page }) => {
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('#filter-preview')).toBeVisible();
  });

  test('mobile viewport: renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/wireshark-filter', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();
  });

  test('TOOL_ACTIONS smoke test', async ({ page }) => {
    const actions = TOOL_ACTIONS['wireshark-filter'];
    await actions.action(page);
    await actions.waitFor(page);
  });
});

test.describe('Protocol Header Visualizer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/protocol-headers', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();
  });

  test('page loads with correct title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Protocol Header Visualizer');
  });

  test('protocol tabs are visible', async ({ page }) => {
    await expect(page.locator('.protocol-tab')).toHaveCount(7);
  });

  test('Ethernet is default protocol', async ({ page }) => {
    await expect(page.locator('#diagram-title')).toContainText('Ethernet II');
    await expect(page.locator('.protocol-tab[data-protocol="ethernet"]')).toHaveClass(/active/);
  });

  test('protocol switching works', async ({ page }) => {
    await page.locator('.protocol-tab[data-protocol="tcp"]').click();
    await expect(page.locator('#diagram-title')).toContainText('TCP');
  });

  test('protocol diagram is visible', async ({ page }) => {
    await expect(page.locator('#protocol-diagram')).toBeVisible();
  });

  test('hex dump parser exists', async ({ page }) => {
    await expect(page.locator('#hex-input')).toBeVisible();
    await expect(page.locator('#parse-hex-btn')).toBeVisible();
    await expect(page.locator('#clear-hex-btn')).toBeVisible();
  });

  test('hex dump parsing works', async ({ page }) => {
    const hexDump = '00 1a 2b 3c 4d 5e 00 50 56 c0 00 08 08 00 45 00';
    await page.locator('#hex-input').fill(hexDump);
    await page.locator('#parse-hex-btn').click();
    await expect(page.locator('#parsed-output-section')).not.toHaveClass(/hidden/);
  });

  test('clicking diagram field shows details', async ({ page }) => {
    await page.locator('.diagram-field').first().click();
    const fieldDetail = page.locator('#field-detail');
    await expect(fieldDetail).not.toContainText('Click on any field');
  });

  test('clear hex button works', async ({ page }) => {
    await page.locator('#hex-input').fill('00 1a 2b 3c');
    await page.locator('#clear-hex-btn').click();
    await expect(page.locator('#hex-input')).toHaveValue('');
    await expect(page.locator('#parsed-output-section')).toHaveClass(/hidden/);
  });

  test('invalid hex shows error', async ({ page }) => {
    await page.locator('#hex-input').fill('invalid hex data');
    await page.locator('#parse-hex-btn').click();
    await expect(page.locator('#hex-error')).not.toHaveClass(/hidden/);
  });

  test('dark mode: tool renders in dark mode', async ({ page }) => {
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('#protocol-diagram')).toBeVisible();
  });

  test('mobile viewport: renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/protocol-headers', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();
  });

  test('TOOL_ACTIONS smoke test', async ({ page }) => {
    const actions = TOOL_ACTIONS['protocol-headers'];
    await actions.action(page);
    await actions.waitFor(page);
  });
});

test.describe('WireGuard Config Studio', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/wireguard-config', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();
  });

  test('page loads with correct title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('WireGuard Config Studio');
  });

  test('key generation button exists', async ({ page }) => {
    await expect(page.locator('#generate-keys-btn')).toBeVisible();
  });

  test('template selector exists', async ({ page }) => {
    await expect(page.locator('#template-select')).toBeVisible();
  });

  test('interface section form exists', async ({ page }) => {
    await expect(page.locator('#iface-private-key')).toBeVisible();
    await expect(page.locator('#iface-address')).toBeVisible();
    await expect(page.locator('#iface-listen-port')).toBeVisible();
  });

  test('peer section exists', async ({ page }) => {
    await expect(page.locator('.peer-card')).toBeVisible();
    await expect(page.locator('#add-peer-btn')).toBeVisible();
  });

  test('add peer button adds new peer', async ({ page }) => {
    const initialCount = await page.locator('.peer-card').count();
    await page.locator('#add-peer-btn').click();
    await expect(page.locator('.peer-card')).toHaveCount(initialCount + 1);
  });

  test('remove peer button works', async ({ page }) => {
    await page.locator('#add-peer-btn').click();
    const countBefore = await page.locator('.peer-card').count();
    await page.locator('.remove-peer-btn').last().click();
    await expect(page.locator('.peer-card')).toHaveCount(countBefore - 1);
  });

  test('config preview updates on input', async ({ page }) => {
    await page.locator('#iface-address').fill('10.0.0.1/24');
    await expect(page.locator('#config-preview')).toContainText('10.0.0.1/24');
  });

  test('template selection populates fields', async ({ page }) => {
    await page.locator('#template-select').selectOption('p2p-server');
    await expect(page.locator('#iface-listen-port')).toHaveValue('51820');
  });

  test('copy config button exists', async ({ page }) => {
    await expect(page.locator('#copy-config-btn')).toBeVisible();
  });

  test('download config button exists', async ({ page }) => {
    await expect(page.locator('#download-config-btn')).toBeVisible();
  });

  test('QR code generation section exists', async ({ page }) => {
    await expect(page.locator('#qr-container')).toBeVisible();
    await expect(page.locator('#generate-qr-btn')).toBeVisible();
  });

  test('config parser section exists', async ({ page }) => {
    await expect(page.locator('#config-parser-input')).toBeVisible();
    await expect(page.locator('#parse-config-btn')).toBeVisible();
  });

  test('toggle private key visibility works', async ({ page }) => {
    const input = page.locator('#private-key');
    const btn = page.locator('#toggle-private-key');
    await expect(input).toHaveAttribute('type', 'password');
    await btn.click();
    await expect(input).toHaveAttribute('type', 'text');
  });

  test('validation status appears on config update', async ({ page }) => {
    await page.locator('#iface-address').fill('10.0.0.1/24');
    await expect(page.locator('#validation-status')).toBeVisible();
  });

  test('dark mode: tool renders in dark mode', async ({ page }) => {
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('#config-preview')).toBeVisible();
  });

  test('mobile viewport: renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/wireguard-config', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();
  });

  test('TOOL_ACTIONS smoke test', async ({ page }) => {
    const actions = TOOL_ACTIONS['wireguard-config'];
    await actions.action(page);
    await actions.waitFor(page);
  });
});
