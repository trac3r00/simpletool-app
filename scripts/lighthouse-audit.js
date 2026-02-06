#!/usr/bin/env node

/**
 * Lighthouse Audit Script for SimpleTool App
 *
 * Runs comprehensive Lighthouse audits on all pages of the app.
 * Requires: lighthouse, chrome-launcher packages
 *
 * Install missing dependencies:
 *   npm install --save-dev lighthouse chrome-launcher
 *
 * Usage:
 *   node scripts/lighthouse-audit.js
 */

import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const BASE_URL = 'http://localhost:8787';
const OUTPUT_PATH = join(__dirname, 'lighthouse-report.json');

// All pages to audit
const PAGES = [
  // Core pages
  { path: '/', name: 'Home' },

  // Tools - Encoding & Crypto
  { path: '/json-formatter', name: 'JSON Formatter' },
  { path: '/jwt-decoder', name: 'JWT Decoder' },
  { path: '/uuid-generator', name: 'UUID Generator' },
  { path: '/password-generator', name: 'Password Generator' },
  { path: '/hash-calculator', name: 'Hash Calculator' },

  // Tools - Network & Development
  { path: '/cidr-calculator', name: 'CIDR Calculator' },
  { path: '/text-diff', name: 'Text Diff' },
  { path: '/regex-visualizer', name: 'Regex Visualizer' },
  { path: '/universal-decoder', name: 'Universal Decoder' },
  { path: '/cron-builder', name: 'Cron Builder' },

  // Tools - Security & Keys
  { path: '/ssh-key-generator', name: 'SSH Key Generator' },
  { path: '/certificate-decoder', name: 'Certificate Decoder' },
  { path: '/saml-decoder', name: 'SAML Decoder' },
  { path: '/user-agent-decoder', name: 'User Agent Decoder' },
  { path: '/qr-code', name: 'QR Code' },

  // Tools - Converters
  { path: '/timestamp-converter', name: 'Timestamp Converter' },
  { path: '/color-converter', name: 'Color Converter' },
  { path: '/unit-converter', name: 'Unit Converter' },
  { path: '/yaml-toml-converter', name: 'YAML/TOML Converter' },
  { path: '/htpasswd-generator', name: 'Htpasswd Generator' },

  // Tools - Data & Development
  { path: '/mock-data-generator', name: 'Mock Data Generator' },
  { path: '/markdown-preview', name: 'Markdown Preview' },
  { path: '/log-viewer', name: 'Log Viewer' },
  { path: '/case-converter', name: 'Case Converter' },
  { path: '/code-minifier', name: 'Code Minifier' },

  // Tools - Visual & Advanced
  { path: '/image-converter', name: 'Image Converter' },
  { path: '/css-gradient', name: 'CSS Gradient' },
  { path: '/curl-studio', name: 'Curl Studio' },
  { path: '/log-masker', name: 'Log Masker' },
  { path: '/mermaid-studio', name: 'Mermaid Studio' },
  { path: '/json-schema-studio', name: 'JSON Schema Studio' },
  { path: '/caffeniate', name: 'Caffeniate' },

  // Static pages
  { path: '/terms', name: 'Terms of Service' },
  { path: '/privacy', name: 'Privacy Policy' },
  { path: '/about', name: 'About' },
  { path: '/contact', name: 'Contact' },
  { path: '/security', name: 'Security' },
  { path: '/careers', name: 'Careers' },

  // Meta files
  { path: '/ads.txt', name: 'Ads.txt' },
  { path: '/robots.txt', name: 'Robots.txt' },
  { path: '/sitemap.xml', name: 'Sitemap' },
];

// Lighthouse configuration
const LIGHTHOUSE_CONFIG = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    formFactor: 'desktop',
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
    },
  },
};

// Chrome flags for headless operation
const CHROME_FLAGS = [
  '--headless',
  '--disable-gpu',
  '--no-sandbox',
  '--disable-dev-shm-usage',
];

/**
 * Run Lighthouse audit on a single page
 */
async function auditPage(chrome, url, pageName) {
  try {
    console.log(`\n🔍 Auditing: ${pageName} (${url})`);

    const runnerResult = await lighthouse(url, {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
    }, LIGHTHOUSE_CONFIG);

    const { lhr } = runnerResult;

    // Extract category scores
    const scores = {
      performance: Math.round(lhr.categories.performance.score * 100),
      accessibility: Math.round(lhr.categories.accessibility.score * 100),
      bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
      seo: Math.round(lhr.categories.seo.score * 100),
    };

    // Extract key issues
    const issues = [];

    // Collect failed audits
    Object.values(lhr.audits).forEach(audit => {
      if (audit.score !== null && audit.score < 1 && audit.scoreDisplayMode === 'binary') {
        issues.push({
          id: audit.id,
          title: audit.title,
          description: audit.description,
          category: getAuditCategory(audit.id, lhr.categories),
        });
      }
    });

    console.log(`  ✅ Performance: ${scores.performance}%`);
    console.log(`  ✅ Accessibility: ${scores.accessibility}%`);
    console.log(`  ✅ Best Practices: ${scores.bestPractices}%`);
    console.log(`  ✅ SEO: ${scores.seo}%`);

    return {
      url,
      name: pageName,
      scores,
      issues,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`  ❌ Error auditing ${pageName}: ${error.message}`);
    return {
      url,
      name: pageName,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Determine which category an audit belongs to
 */
function getAuditCategory(auditId, categories) {
  for (const [categoryId, category] of Object.entries(categories)) {
    if (category.auditRefs?.some(ref => ref.id === auditId)) {
      return categoryId;
    }
  }
  return 'unknown';
}

/**
 * Calculate grade based on average score
 */
function getGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Format score with color indicator
 */
function formatScore(score) {
  const icon = score >= 90 ? '🟢' : score >= 50 ? '🟡' : '🔴';
  return `${icon} ${score}%`;
}

/**
 * Generate human-readable summary
 */
function generateSummary(results) {
  console.log('\n\n' + '='.repeat(80));
  console.log('LIGHTHOUSE AUDIT SUMMARY');
  console.log('='.repeat(80));

  // Filter out errored results
  const validResults = results.filter(r => !r.error);
  const erroredResults = results.filter(r => r.error);

  if (erroredResults.length > 0) {
    console.log('\n⚠️  ERRORS ENCOUNTERED:');
    erroredResults.forEach(r => {
      console.log(`   ${r.name}: ${r.error}`);
    });
  }

  if (validResults.length === 0) {
    console.log('\n❌ No valid results to summarize');
    return;
  }

  // Calculate averages
  const averages = {
    performance: 0,
    accessibility: 0,
    bestPractices: 0,
    seo: 0,
  };

  validResults.forEach(result => {
    averages.performance += result.scores.performance;
    averages.accessibility += result.scores.accessibility;
    averages.bestPractices += result.scores.bestPractices;
    averages.seo += result.scores.seo;
  });

  const count = validResults.length;
  averages.performance = Math.round(averages.performance / count);
  averages.accessibility = Math.round(averages.accessibility / count);
  averages.bestPractices = Math.round(averages.bestPractices / count);
  averages.seo = Math.round(averages.seo / count);

  const overallAverage = Math.round(
    (averages.performance + averages.accessibility + averages.bestPractices + averages.seo) / 4
  );

  // Per-page scores table
  console.log('\n📊 PER-PAGE SCORES:');
  console.log('-'.repeat(80));
  console.log('Page'.padEnd(30) + 'Perf  Accs  Best  SEO');
  console.log('-'.repeat(80));

  validResults.forEach(result => {
    const name = result.name.length > 28 ? result.name.substring(0, 25) + '...' : result.name;
    console.log(
      name.padEnd(30) +
      `${result.scores.performance}%`.padEnd(6) +
      `${result.scores.accessibility}%`.padEnd(6) +
      `${result.scores.bestPractices}%`.padEnd(6) +
      `${result.scores.seo}%`
    );
  });

  // Average scores
  console.log('\n📈 AVERAGE SCORES ACROSS ALL PAGES:');
  console.log(`   Performance:    ${formatScore(averages.performance)}`);
  console.log(`   Accessibility:  ${formatScore(averages.accessibility)}`);
  console.log(`   Best Practices: ${formatScore(averages.bestPractices)}`);
  console.log(`   SEO:            ${formatScore(averages.seo)}`);
  console.log(`   Overall:        ${formatScore(overallAverage)}`);

  // Overall grade
  const grade = getGrade(overallAverage);
  const gradeEmoji = grade === 'A' ? '🏆' : grade === 'B' ? '👍' : grade === 'C' ? '👌' : grade === 'D' ? '⚠️' : '❌';
  console.log(`\n${gradeEmoji} OVERALL GRADE: ${grade}`);

  // Pages that fail any category (score < 50)
  const failedPages = validResults.filter(r =>
    r.scores.performance < 50 ||
    r.scores.accessibility < 50 ||
    r.scores.bestPractices < 50 ||
    r.scores.seo < 50
  );

  if (failedPages.length > 0) {
    console.log('\n⚠️  PAGES WITH FAILING SCORES (<50):');
    failedPages.forEach(result => {
      console.log(`   ${result.name}:`);
      if (result.scores.performance < 50) console.log(`      Performance: ${result.scores.performance}%`);
      if (result.scores.accessibility < 50) console.log(`      Accessibility: ${result.scores.accessibility}%`);
      if (result.scores.bestPractices < 50) console.log(`      Best Practices: ${result.scores.bestPractices}%`);
      if (result.scores.seo < 50) console.log(`      SEO: ${result.scores.seo}%`);
    });
  } else {
    console.log('\n✅ No pages with failing scores!');
  }

  // Top issues across all pages
  const issueMap = new Map();
  validResults.forEach(result => {
    result.issues.forEach(issue => {
      const count = issueMap.get(issue.id) || 0;
      issueMap.set(issue.id, count + 1);
    });
  });

  const topIssues = Array.from(issueMap.entries())
    .map(([id, count]) => {
      const firstOccurrence = validResults.find(r => r.issues.some(i => i.id === id));
      const issue = firstOccurrence.issues.find(i => i.id === id);
      return { ...issue, occurrences: count };
    })
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, 10);

  if (topIssues.length > 0) {
    console.log('\n🔥 TOP ISSUES FOUND ACROSS ALL PAGES:');
    topIssues.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.title}`);
      console.log(`   Category: ${issue.category}`);
      console.log(`   Occurrences: ${issue.occurrences}/${count} pages`);
      console.log(`   ${issue.description.substring(0, 100)}...`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n✅ Audit complete! Report saved to: ${OUTPUT_PATH}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Lighthouse Audit for SimpleTool App');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`📄 Total pages to audit: ${PAGES.length}`);
  console.log(`⚙️  Categories: Performance, Accessibility, Best Practices, SEO`);

  let chrome;

  try {
    // Launch Chrome
    console.log('\n🌐 Launching Chrome...');
    chrome = await chromeLauncher.launch({
      chromeFlags: CHROME_FLAGS,
    });
    console.log(`✅ Chrome launched on port ${chrome.port}`);

    // Run audits sequentially
    const results = [];
    for (const page of PAGES) {
      const url = `${BASE_URL}${page.path}`;
      const result = await auditPage(chrome, url, page.name);
      results.push(result);

      // Small delay between audits to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Save results to JSON
    const reportData = {
      baseUrl: BASE_URL,
      timestamp: new Date().toISOString(),
      totalPages: PAGES.length,
      results,
    };

    writeFileSync(OUTPUT_PATH, JSON.stringify(reportData, null, 2));
    console.log(`\n💾 Results saved to: ${OUTPUT_PATH}`);

    // Generate human-readable summary
    generateSummary(results);

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  } finally {
    // Clean up Chrome
    if (chrome) {
      console.log('\n🧹 Closing Chrome...');
      await chrome.kill();
    }
  }
}

// Run the audit
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
