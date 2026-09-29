import { DEFAULT_LANGUAGE, normalizeLanguage } from "../utils/i18n.js";
import { REVIEWED_CONTENT_LOCALES } from "./generated-content-locales.js";

const FAQ_CONTENT = {
  en: [
    {
      id: "json-error",
      category: "Troubleshooting",
      question: "Why does valid-looking JSON fail to format?",
      answer:
        `The <a href="/json-formatter">JSON Formatter</a> accepts strict JSON: double-quoted keys and strings, no comments, no trailing commas, and no NaN or Infinity. Start at the reported line and column. Formatting checks syntax; use <a href="/json-schema-studio">JSON Schema Studio</a> when fields and types also need a contract.`,
    },
    {
      id: "jwt-verification",
      category: "Troubleshooting",
      question: "The JWT payload decoded. Does that mean the token is valid?",
      answer:
        `No. Decoding only reveals untrusted claims. In <a href="/token-studio">Token Studio</a>, verify the signature with a trusted key and then check issuer, audience, expiration, not-before, and the allowed algorithm in your application. The <a href="/blog/inspect-jwt-in-the-browser">browser JWT guide</a> explains this boundary.`,
    },
    {
      id: "regex-no-match",
      category: "Troubleshooting",
      question: "Why does my regular expression match only part of the input?",
      answer:
        `Search patterns can match a substring. Add start and end anchors when the entire field must match, and test both examples and counterexamples in <a href="/regex-visualizer">Regex Studio</a>. Its behavior follows the browser JavaScript engine, so confirm syntax again if production uses PCRE, RE2, or another engine.`,
    },
    {
      id: "curl-not-running",
      category: "Troubleshooting",
      question: "Why does Curl Studio not show the server response?",
      answer:
        `<a href="/curl-studio">Curl Studio</a> builds and parses commands; it does not execute network requests. Run the command in an environment that can reach the host. Add --include or --verbose for diagnostics and --fail-with-body when an HTTP error should fail a script without discarding its body.`,
    },
    {
      id: "cron-timezone",
      category: "Troubleshooting",
      question: "Why does my cron job run at the wrong time?",
      answer:
        `First confirm the scheduler's field count, timezone, and day-of-week rules. Preview several dates in the <a href="/cron-builder">Cron Expression Builder</a>, including a daylight-saving transition. The tool cannot determine how your platform handles overlap, downtime, retries, or missed runs.`,
    },
    {
      id: "password-rejected",
      category: "Troubleshooting",
      question: "Why did a site reject a generated password?",
      answer:
        `The target may impose a maximum length or reject particular characters. Adjust those controls in the <a href="/password-generator">Password Generator</a> and generate again rather than editing a random result into a pattern. The tool cannot inspect a site's undocumented truncation or normalization behavior.`,
    },
    {
      id: "certificate-chain",
      category: "Troubleshooting",
      question: "Why can a certificate parse correctly but still fail in a browser?",
      answer:
        `Parsing is not path validation. The <a href="/certificate-decoder">Certificate Decoder</a> shows names, dates, issuer, key usage, and extensions, but it does not contact the host, fetch intermediates, consult a platform trust store, or check current revocation status.`,
    },
    {
      id: "csp-blocked",
      category: "Troubleshooting",
      question: "How do I identify what a CSP blocked?",
      answer:
        `Read the browser console or report-only event, identify the resource type, and update the narrow directive that governs it. Use the <a href="/csp-builder">CSP Header Builder</a> to draft the header, then test the actual response and every affected workflow before enforcing it.`,
    },
    {
      id: "cidr-range",
      category: "Troubleshooting",
      question: "Why is a CIDR result different from my usable host range?",
      answer:
        `Network range, broadcast rules, and assignable host conventions are different concepts, especially for /31, /32, and IPv6. Enter the address and prefix in the <a href="/cidr-calculator">CIDR Calculator</a>, then apply the conventions of the network platform you are configuring.`,
    },
    {
      id: "base64-not-encryption",
      category: "Limits",
      question: "Does Base64 protect a secret?",
      answer:
        `No. Base64 is reversible encoding, not encryption. Use the <a href="/encoding-workbench">Encoding Workbench</a> to inspect or convert transport encodings, but use an authenticated encryption scheme and managed keys when confidentiality is required.`,
    },
    {
      id: "local-processing",
      category: "Privacy and operation",
      question: "What does client-side processing cover?",
      answer:
        `Supported tool computations are designed to run in the browser instead of posting the payload to an application endpoint. The page and assets still arrive over the network; extensions, clipboard use, exported files, and allow-listed advertising are separate considerations. See <a href="/privacy">Privacy</a> for the current disclosure.`,
    },
    {
      id: "advertising",
      category: "Privacy and operation",
      question: "Where can advertising scripts load?",
      answer:
        `The exact repository allow-list is published in <a href="/terms">Terms</a> and <a href="/privacy">Privacy</a>. Manual units request non-personalized ads. Password, SSH key, token, certificate, WireGuard, secret-scanner, and encoding pages remain outside the script allow-list.`,
    },
    {
      id: "browser-support",
      category: "Privacy and operation",
      question: "Why is a tool unavailable in an older browser?",
      answer:
        `Some tools require ES modules, Web Crypto, File, Canvas, or Streams APIs. Update the browser and retry without script-blocking extensions. If the problem persists, include the browser version, operating system, tool URL, input shape without secrets, and console error in a report through <a href="/contact">Contact</a>.`,
    },
    {
      id: "offline-use",
      category: "Privacy and operation",
      question: "Will tools keep working offline?",
      answer:
        `Some computations continue after required assets have loaded, but the public site is not presented as a guaranteed offline application. For a controlled offline deployment, review and self-host the public project linked from the <a href="/about">About</a> page.`,
    },
  ],
};

export function getFaqEntries(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  return (
    REVIEWED_CONTENT_LOCALES[currentLang]?.faq || FAQ_CONTENT.en
  );
}
