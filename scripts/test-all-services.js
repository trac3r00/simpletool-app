#!/usr/bin/env node
/**
 * Comprehensive Service Testing Script
 * Tests all 33 services for:
 * - Page load (200 status)
 * - Dark/Light mode support
 * - UI rendering
 */

const services = [
  { path: '/caffeniate', name: 'Caffeniate' },
  { path: '/password-generator', name: 'Password Generator' },
  { path: '/json-formatter', name: 'JSON Formatter' },
  { path: '/qr-code', name: 'QR Code Generator' },
  { path: '/encoder-decoder', name: 'Encoder/Decoder' },
  { path: '/universal-decoder', name: 'Universal Decoder' },
  { path: '/regex-tester', name: 'Regex Tester' },
  { path: '/regex-visualizer', name: 'Regex Visualizer' },
  { path: '/uuid-generator', name: 'UUID Generator' },
  { path: '/timestamp-converter', name: 'Timestamp Converter' },
  { path: '/color-converter', name: 'Color Converter' },
  { path: '/unit-converter', name: 'Unit Converter' },
  { path: '/markdown-preview', name: 'Markdown Preview' },
  { path: '/text-diff', name: 'Text Diff' },
  { path: '/lorem-ipsum', name: 'Lorem Ipsum' },
  { path: '/jwt-decoder', name: 'JWT Decoder' },
  { path: '/certificate-decoder', name: 'Certificate Decoder' },
  { path: '/hash-calculator', name: 'Hash Calculator' },
  { path: '/case-converter', name: 'Case Converter' },
  { path: '/log-viewer', name: 'Log Viewer' },
  { path: '/image-converter', name: 'Image Converter' },
  { path: '/css-gradient', name: 'CSS Gradient Generator' },
  { path: '/code-minifier', name: 'Code Minifier' },
  { path: '/cidr-calculator', name: 'CIDR Calculator' },
  { path: '/saml-decoder', name: 'SAML Decoder' },
  { path: '/htpasswd-generator', name: 'HTPasswd Generator' },
  { path: '/yaml-toml-converter', name: 'YAML/TOML Converter' },
  { path: '/cron-builder', name: 'Cron Builder' },
  { path: '/mock-data-generator', name: 'Mock Data Generator' },
  { path: '/user-agent-decoder', name: 'User Agent Decoder' },
  { path: '/ssh-key-generator', name: 'SSH Key Generator' },
  { path: '/domain-status', name: 'Domain Status' }
];

const baseUrl = 'http://localhost:8787';

async function testService(service) {
  const url = `${baseUrl}${service.path}`;

  try {
    const response = await fetch(url);
    const html = await response.text();

    // Check if page loaded successfully
    if (response.status !== 200) {
      return {
        name: service.name,
        path: service.path,
        status: 'FAILED',
        error: `HTTP ${response.status}`
      };
    }

    // Check for dark mode classes
    const hasDarkModeClasses = html.includes('dark:') || html.includes('data-theme');
    const hasThemeToggle = html.includes('theme-toggle') || html.includes('Toggle dark mode');
    const hasNavigation = html.includes('Back to Home') || html.includes('navigation');
    const hasMainContent = html.includes('<main') || html.includes('role="main"');

    return {
      name: service.name,
      path: service.path,
      status: 'PASSED',
      httpStatus: response.status,
      hasDarkMode: hasDarkModeClasses,
      hasThemeToggle: hasThemeToggle,
      hasNavigation: hasNavigation,
      hasMainContent: hasMainContent,
      contentLength: html.length
    };
  } catch (error) {
    return {
      name: service.name,
      path: service.path,
      status: 'ERROR',
      error: error.message
    };
  }
}

async function runTests() {
  console.log('🚀 Starting comprehensive service testing...\n');
  console.log(`Testing ${services.length} services at ${baseUrl}\n`);
  console.log('='.repeat(80));

  const results = [];
  let passCount = 0;
  let failCount = 0;
  let errorCount = 0;

  for (const service of services) {
    process.stdout.write(`Testing ${service.name.padEnd(30)}... `);
    const result = await testService(service);
    results.push(result);

    if (result.status === 'PASSED') {
      console.log('✅ PASSED');
      passCount++;
    } else if (result.status === 'FAILED') {
      console.log(`❌ FAILED (${result.error})`);
      failCount++;
    } else {
      console.log(`⚠️  ERROR (${result.error})`);
      errorCount++;
    }
  }

  console.log('='.repeat(80));
  console.log('\n📊 Test Summary:');
  console.log(`   Total:  ${services.length}`);
  console.log(`   ✅ Pass:   ${passCount}`);
  console.log(`   ❌ Fail:   ${failCount}`);
  console.log(`   ⚠️  Error:  ${errorCount}`);

  // Detailed results
  console.log('\n📋 Detailed Results:');
  console.log('='.repeat(80));

  const passedServices = results.filter(r => r.status === 'PASSED');
  if (passedServices.length > 0) {
    console.log('\n✅ Passed Services:');
    passedServices.forEach(r => {
      console.log(`   ${r.name.padEnd(30)} | Dark Mode: ${r.hasDarkMode ? '✓' : '✗'} | Toggle: ${r.hasThemeToggle ? '✓' : '✗'} | Nav: ${r.hasNavigation ? '✓' : '✗'}`);
    });
  }

  const failedServices = results.filter(r => r.status === 'FAILED' || r.status === 'ERROR');
  if (failedServices.length > 0) {
    console.log('\n❌ Failed/Error Services:');
    failedServices.forEach(r => {
      console.log(`   ${r.name.padEnd(30)} | ${r.error}`);
    });
  }

  // Dark mode support check
  console.log('\n🌙 Dark Mode Support Analysis:');
  const darkModeSupport = passedServices.filter(r => r.hasDarkMode && r.hasThemeToggle);
  console.log(`   Services with full dark mode: ${darkModeSupport.length}/${passedServices.length}`);

  const missingDarkMode = passedServices.filter(r => !r.hasDarkMode || !r.hasThemeToggle);
  if (missingDarkMode.length > 0) {
    console.log('\n   ⚠️  Services missing dark mode features:');
    missingDarkMode.forEach(r => {
      console.log(`      ${r.name} - Missing: ${!r.hasDarkMode ? 'dark classes' : ''} ${!r.hasThemeToggle ? 'theme toggle' : ''}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n${passCount === services.length ? '✅ ALL TESTS PASSED!' : '⚠️  Some tests failed - review above'}`);

  return {
    total: services.length,
    passed: passCount,
    failed: failCount,
    errors: errorCount,
    results
  };
}

// Run tests
runTests().then(summary => {
  process.exit(summary.failed + summary.errors > 0 ? 1 : 0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
