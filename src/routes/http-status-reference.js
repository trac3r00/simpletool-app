import { respondHTML } from '../utils/respond.js';
import { createPageTemplate, createToolHeader, createCheatsheet } from '../utils/common-ui.js';
import { TOOLS } from '../utils/tool-registry.js';
import { createRelatedToolsSection } from '../utils/content-ui.js';
import { DEFAULT_LANGUAGE, getToolTranslation, normalizeLanguage, resolveRequestLanguage } from '../utils/i18n.js';

const STATUS_CODES = [
  { code: 100, name: 'Continue', class: '1xx', description: 'The initial part of the request was received and the client should continue sending the request body.', use: 'Use when a client sends Expect: 100-continue and the server is ready to receive the payload.', safe: 'Method-dependent', idempotent: 'Method-dependent', cacheable: 'No' },
  { code: 101, name: 'Switching Protocols', class: '1xx', description: 'The server accepts the client request to switch protocols.', use: 'Use during protocol upgrades such as switching from HTTP to WebSocket.', safe: 'Method-dependent', idempotent: 'Method-dependent', cacheable: 'No' },
  { code: 102, name: 'Processing', class: '1xx', description: 'The server has received and is processing the request, but no response is available yet.', use: 'Use for long-running operations to indicate progress before a final response is ready.', safe: 'Method-dependent', idempotent: 'Method-dependent', cacheable: 'No' },
  { code: 103, name: 'Early Hints', class: '1xx', description: 'The server sends preliminary response headers before the final response.', use: 'Use to hint linked resources early, such as preload links, while the final response is prepared.', safe: 'Method-dependent', idempotent: 'Method-dependent', cacheable: 'No' },

  { code: 200, name: 'OK', class: '2xx', description: 'The request succeeded and the response body contains the result.', use: 'Use for successful reads and successful operations that return a representation.', safe: 'Common for GET/HEAD', idempotent: 'Method-dependent', cacheable: 'Default cacheable' },
  { code: 201, name: 'Created', class: '2xx', description: 'The request succeeded and created a new resource.', use: 'Use after POST or PUT creates a resource; include a Location header when possible.', safe: 'No', idempotent: 'Usually PUT only', cacheable: 'With explicit headers' },
  { code: 202, name: 'Accepted', class: '2xx', description: 'The request was accepted for processing but processing has not completed.', use: 'Use for asynchronous jobs, queues, or workflows that continue after the response.', safe: 'No', idempotent: 'Method-dependent', cacheable: 'With explicit headers' },
  { code: 203, name: 'Non-Authoritative Information', class: '2xx', description: 'The response is a transformed or otherwise modified version of an origin response.', use: 'Use when a proxy or intermediary returns modified metadata or content.', safe: 'Common for GET/HEAD', idempotent: 'Method-dependent', cacheable: 'Default cacheable' },
  { code: 204, name: 'No Content', class: '2xx', description: 'The request succeeded and there is no response body to send.', use: 'Use for successful updates or deletes where the client does not need a body.', safe: 'Method-dependent', idempotent: 'Common for PUT/DELETE', cacheable: 'Default cacheable' },
  { code: 205, name: 'Reset Content', class: '2xx', description: 'The request succeeded and the client should reset the document view.', use: 'Use after form-like submissions where the user agent should clear the input view.', safe: 'No', idempotent: 'Method-dependent', cacheable: 'No' },
  { code: 206, name: 'Partial Content', class: '2xx', description: 'The server is sending one or more byte ranges from the selected representation.', use: 'Use for successful Range requests and resumable downloads.', safe: 'Common for GET', idempotent: 'Yes for same range', cacheable: 'Default cacheable' },
  { code: 207, name: 'Multi-Status', class: '2xx', description: 'The response conveys status information for multiple independent operations.', use: 'Use for batch or collection operations where each sub-operation may have a different result.', safe: 'Method-dependent', idempotent: 'Method-dependent', cacheable: 'With explicit headers' },
  { code: 208, name: 'Already Reported', class: '2xx', description: 'The members of a DAV binding have already been reported in a previous part of the response.', use: 'Use in WebDAV multistatus responses to avoid repeatedly enumerating the same resource.', safe: 'Method-dependent', idempotent: 'Method-dependent', cacheable: 'With explicit headers' },
  { code: 226, name: 'IM Used', class: '2xx', description: 'The server fulfilled a GET request and applied one or more instance manipulations to the response.', use: 'Use when returning a delta-encoded or transformed representation based on instance manipulations.', safe: 'Common for GET', idempotent: 'Yes for same request', cacheable: 'With explicit headers' },

  { code: 300, name: 'Multiple Choices', class: '3xx', description: 'The target resource has more than one representation or response option.', use: 'Use when the client or user can choose from several resource alternatives.', safe: 'Common for GET/HEAD', idempotent: 'Method-dependent', cacheable: 'Default cacheable' },
  { code: 301, name: 'Moved Permanently', class: '3xx', description: 'The target resource has been assigned a new permanent URI.', use: 'Use for permanent URL moves; clients may update bookmarks and links.', safe: 'Common for GET/HEAD', idempotent: 'Redirect target dependent', cacheable: 'Default cacheable' },
  { code: 302, name: 'Found', class: '3xx', description: 'The target resource is temporarily available at a different URI.', use: 'Use for temporary redirects where the original URI remains authoritative.', safe: 'Common for GET/HEAD', idempotent: 'Redirect target dependent', cacheable: 'With explicit headers' },
  { code: 303, name: 'See Other', class: '3xx', description: 'The client should retrieve another URI using GET.', use: 'Use after POST when redirecting to a confirmation or result page.', safe: 'Redirected request is safe', idempotent: 'Original method dependent', cacheable: 'With explicit headers' },
  { code: 304, name: 'Not Modified', class: '3xx', description: 'A conditional request found the cached representation still valid.', use: 'Use with validators such as ETag or Last-Modified to avoid resending content.', safe: 'Common for GET/HEAD', idempotent: 'Yes', cacheable: 'Revalidates cache' },
  { code: 305, name: 'Use Proxy', class: '3xx', description: 'Defined in RFC 9110 as deprecated and not generated by origin servers.', use: 'Do not use in new applications; configure proxies out of band instead.', safe: 'No new use', idempotent: 'No new use', cacheable: 'No' },
  { code: 306, name: 'Unused', class: '3xx', description: 'Reserved status code that is no longer used.', use: 'Do not use; it is reserved to avoid conflict with previous definitions.', safe: 'No new use', idempotent: 'No new use', cacheable: 'No' },
  { code: 307, name: 'Temporary Redirect', class: '3xx', description: 'The target resource is temporarily available at another URI and the method must not change.', use: 'Use for temporary redirects that must preserve the original method and body.', safe: 'Method preserved', idempotent: 'Method preserved', cacheable: 'With explicit headers' },
  { code: 308, name: 'Permanent Redirect', class: '3xx', description: 'The target resource has permanently moved and the method must not change.', use: 'Use for permanent redirects that preserve the original method and body.', safe: 'Method preserved', idempotent: 'Method preserved', cacheable: 'Default cacheable' },

  { code: 400, name: 'Bad Request', class: '4xx', description: 'The server cannot process the request because of malformed syntax or invalid framing.', use: 'Use for invalid request structure, parsing failures, or invalid parameters at the HTTP boundary.', safe: 'Method-dependent', idempotent: 'Method-dependent', cacheable: 'With explicit headers' },
  { code: 401, name: 'Unauthorized', class: '4xx', description: 'The request lacks valid authentication credentials.', use: 'Use when authentication is required or credentials are invalid; include WWW-Authenticate.', safe: 'Method-dependent', idempotent: 'Method-dependent', cacheable: 'With explicit headers' },
  { code: 402, name: 'Payment Required', class: '4xx', description: 'Reserved for future use.', use: 'Avoid for general payment flows unless your API documents exact semantics.', safe: 'Method-dependent', idempotent: 'Method-dependent', cacheable: 'With explicit headers' },
  { code: 403, name: 'Forbidden', class: '4xx', description: 'The server understood the request but refuses to authorize it.', use: 'Use when credentials are valid or irrelevant but access is not allowed.', safe: 'Method-dependent', idempotent: 'Method-dependent', cacheable: 'With explicit headers' },
  { code: 404, name: 'Not Found', class: '4xx', description: 'The server has no current representation for the target resource or is not willing to disclose one.', use: 'Use for missing resources or to intentionally hide whether a resource exists.', safe: 'Common for GET/HEAD', idempotent: 'Yes for same request', cacheable: 'Default cacheable' },
  { code: 405, name: 'Method Not Allowed', class: '4xx', description: 'The method is known by the server but not supported by the target resource.', use: 'Use when the path exists but does not support the request method; include Allow.', safe: 'Method-dependent', idempotent: 'Method-dependent', cacheable: 'Default cacheable' },
  { code: 406, name: 'Not Acceptable', class: '4xx', description: 'The server cannot produce a response matching the client content negotiation headers.', use: 'Use when Accept, Accept-Language, or similar preferences cannot be satisfied.', safe: 'Common for GET/HEAD', idempotent: 'Yes for same request', cacheable: 'With explicit headers' },
  { code: 407, name: 'Proxy Authentication Required', class: '4xx', description: 'The client must authenticate with a proxy.', use: 'Use from proxies that require credentials; include Proxy-Authenticate.', safe: 'Method-dependent', idempotent: 'Method-dependent', cacheable: 'With explicit headers' },
  { code: 408, name: 'Request Timeout', class: '4xx', description: 'The server timed out waiting for the complete request.', use: 'Use when the client did not send the request quickly enough.', safe: 'Method-dependent', idempotent: 'Retry only if safe/idempotent', cacheable: 'With explicit headers' },
  { code: 409, name: 'Conflict', class: '4xx', description: 'The request conflicts with the current state of the target resource.', use: 'Use for edit conflicts, version mismatches, or business-state conflicts the client can resolve.', safe: 'No', idempotent: 'Common for PUT', cacheable: 'With explicit headers' },
  { code: 410, name: 'Gone', class: '4xx', description: 'The target resource is intentionally unavailable and likely permanent.', use: 'Use when a resource was removed permanently and that fact should be visible.', safe: 'Common for GET/HEAD', idempotent: 'Yes for same request', cacheable: 'Default cacheable' },
  { code: 411, name: 'Length Required', class: '4xx', description: 'The server refuses the request because Content-Length is required.', use: 'Use when a request body must include a valid Content-Length header.', safe: 'No', idempotent: 'Retry with length', cacheable: 'With explicit headers' },
  { code: 412, name: 'Precondition Failed', class: '4xx', description: 'A precondition in the request headers evaluated to false.', use: 'Use for failed If-Match, If-Unmodified-Since, or similar conditional update checks.', safe: 'Method-dependent', idempotent: 'Yes for same precondition', cacheable: 'With explicit headers' },
  { code: 413, name: 'Content Too Large', class: '4xx', description: 'The request content is larger than the server is willing or able to process.', use: 'Use for upload or payload size limits; include Retry-After if the limit is temporary.', safe: 'No', idempotent: 'Retry with smaller body', cacheable: 'With explicit headers' },
  { code: 414, name: 'URI Too Long', class: '4xx', description: 'The request target is longer than the server is willing to interpret.', use: 'Use when query strings or paths exceed server limits.', safe: 'Common for GET', idempotent: 'Yes for same request', cacheable: 'Default cacheable' },
  { code: 415, name: 'Unsupported Media Type', class: '4xx', description: 'The request content format is not supported by the target resource.', use: 'Use when Content-Type or content encoding is unsupported.', safe: 'No', idempotent: 'Method-dependent', cacheable: 'With explicit headers' },
  { code: 416, name: 'Range Not Satisfiable', class: '4xx', description: 'The requested range cannot be served for the selected representation.', use: 'Use when Range requests ask for bytes outside the available content.', safe: 'Common for GET', idempotent: 'Yes for same range', cacheable: 'With explicit headers' },
  { code: 417, name: 'Expectation Failed', class: '4xx', description: 'The server cannot meet the expectation given in the Expect request header.', use: 'Use when an Expect header asks for behavior the server cannot support.', safe: 'Method-dependent', idempotent: 'Method-dependent', cacheable: 'With explicit headers' },
  { code: 418, name: "I'm a teapot", class: '4xx', description: 'Reserved status code originally defined by HTCPCP; RFC 9110 reserves it as unusable.', use: 'Do not use for production API semantics; keep it for compatibility, tests, and jokes.', safe: 'No new use', idempotent: 'No new use', cacheable: 'No' },
  { code: 421, name: 'Misdirected Request', class: '4xx', description: 'The request was directed at a server that cannot produce a response for the target URI.', use: 'Use when connection reuse or routing sends a request to the wrong origin server.', safe: 'Method-dependent', idempotent: 'Retry on another connection', cacheable: 'With explicit headers' },
  { code: 422, name: 'Unprocessable Content', class: '4xx', description: 'The content type is understood but the request instructions are semantically invalid.', use: 'Use for validation errors where syntax is correct but domain rules fail.', safe: 'No', idempotent: 'Method-dependent', cacheable: 'With explicit headers' },
  { code: 423, name: 'Locked', class: '4xx', description: 'The source or destination resource is locked.', use: 'Use when an operation cannot proceed because a lock on the resource blocks the request.', safe: 'Method-dependent', idempotent: 'Method-dependent', cacheable: 'With explicit headers' },
  { code: 424, name: 'Failed Dependency', class: '4xx', description: 'The method could not be performed because it depended on another action that failed.', use: 'Use in chained or batch operations when a prerequisite operation failure blocks this request.', safe: 'Method-dependent', idempotent: 'Method-dependent', cacheable: 'With explicit headers' },
  { code: 425, name: 'Too Early', class: '4xx', description: 'The server is unwilling to process a request that might be replayed.', use: 'Use to reject early data when processing could create replay risk before handshake completion.', safe: 'Method-dependent', idempotent: 'Retry after handshake', cacheable: 'With explicit headers' },
  { code: 426, name: 'Upgrade Required', class: '4xx', description: 'The server refuses the request using the current protocol and requires an upgrade.', use: 'Use with an Upgrade header when a newer or different protocol is required.', safe: 'Method-dependent', idempotent: 'Retry after upgrade', cacheable: 'With explicit headers' },
  { code: 428, name: 'Precondition Required', class: '4xx', description: 'The origin server requires the request to be conditional.', use: 'Use to require conditions like If-Match and prevent lost updates from concurrent modifications.', safe: 'Method-dependent', idempotent: 'Yes for same precondition', cacheable: 'With explicit headers' },
  { code: 429, name: 'Too Many Requests', class: '4xx', description: 'The user has sent too many requests in a given amount of time.', use: 'Use for rate limits; include Retry-After or rate-limit headers when useful.', safe: 'Method-dependent', idempotent: 'Retry later if safe/idempotent', cacheable: 'With explicit headers' },
  { code: 431, name: 'Request Header Fields Too Large', class: '4xx', description: 'The server is unwilling to process the request because its header fields are too large.', use: 'Use when one or more request headers exceed acceptable limits in size or total length.', safe: 'Method-dependent', idempotent: 'Retry with smaller headers', cacheable: 'With explicit headers' },
  { code: 451, name: 'Unavailable For Legal Reasons', class: '4xx', description: 'The server is denying access because of a legal demand or legal restriction.', use: 'Use when a resource is blocked by law, court order, or similar legal requirement.', safe: 'Common for GET/HEAD', idempotent: 'Yes for same request', cacheable: 'With explicit headers' },

  { code: 500, name: 'Internal Server Error', class: '5xx', description: 'The server encountered an unexpected condition that prevented it from fulfilling the request.', use: 'Use for unexpected server failures that do not have a more specific status code.', safe: 'Method-dependent', idempotent: 'Retry only if safe/idempotent', cacheable: 'With explicit headers' },
  { code: 501, name: 'Not Implemented', class: '5xx', description: 'The server does not support the functionality required to fulfill the request.', use: 'Use when the server does not recognize or cannot support the method or feature.', safe: 'Method-dependent', idempotent: 'Method-dependent', cacheable: 'Default cacheable' },
  { code: 502, name: 'Bad Gateway', class: '5xx', description: 'A gateway or proxy received an invalid response from an upstream server.', use: 'Use from intermediaries when an upstream response is malformed or unusable.', safe: 'Method-dependent', idempotent: 'Retry only if safe/idempotent', cacheable: 'With explicit headers' },
  { code: 503, name: 'Service Unavailable', class: '5xx', description: 'The server is temporarily unable to handle the request because of overload or maintenance.', use: 'Use for temporary outages or overload; include Retry-After when possible.', safe: 'Method-dependent', idempotent: 'Retry later if safe/idempotent', cacheable: 'With explicit headers' },
  { code: 504, name: 'Gateway Timeout', class: '5xx', description: 'A gateway or proxy did not receive a timely response from an upstream server.', use: 'Use from intermediaries when an upstream service times out.', safe: 'Method-dependent', idempotent: 'Retry only if safe/idempotent', cacheable: 'With explicit headers' },
  { code: 505, name: 'HTTP Version Not Supported', class: '5xx', description: 'The server does not support or refuses to support the HTTP version used in the request.', use: 'Use when the request uses an unsupported HTTP major version.', safe: 'Method-dependent', idempotent: 'Retry with supported version', cacheable: 'With explicit headers' },
  { code: 506, name: 'Variant Also Negotiates', class: '5xx', description: 'The server has an internal configuration error where the chosen variant resource is itself subject to content negotiation.', use: 'Use when transparent content negotiation creates a recursive or misconfigured variant selection.', safe: 'Method-dependent', idempotent: 'Method-dependent', cacheable: 'With explicit headers' },
  { code: 507, name: 'Insufficient Storage', class: '5xx', description: 'The server is unable to store the representation needed to complete the request.', use: 'Use when temporary storage exhaustion prevents completing the current operation.', safe: 'Method-dependent', idempotent: 'Retry later if safe/idempotent', cacheable: 'With explicit headers' },
  { code: 508, name: 'Loop Detected', class: '5xx', description: 'The server detected an infinite loop while processing the request.', use: 'Use when recursive processing of a request causes a loop the server cannot resolve.', safe: 'Method-dependent', idempotent: 'Method-dependent', cacheable: 'With explicit headers' },
  { code: 510, name: 'Not Extended', class: '5xx', description: 'Further extensions to the request are required for the server to fulfill it.', use: 'Use when the client must include required extension declarations before the request can be processed.', safe: 'Method-dependent', idempotent: 'Method-dependent', cacheable: 'With explicit headers' },
  { code: 511, name: 'Network Authentication Required', class: '5xx', description: 'The client needs to authenticate to gain network access.', use: 'Use by intercepting proxies when network login or captive portal authentication is required.', safe: 'Method-dependent', idempotent: 'Retry after network auth', cacheable: 'With explicit headers' }
];

const CLASS_LABELS = {
  '1xx': 'Informational',
  '2xx': 'Successful',
  '3xx': 'Redirection',
  '4xx': 'Client Error',
  '5xx': 'Server Error'
};

export async function handleHTTPStatusReferenceRoutes(request, url) {
  if (url.pathname !== '/http-status-reference' && url.pathname !== '/http-status-reference/') return null;
  if (request.method !== 'GET') return null;
  const lang = resolveRequestLanguage(request, url);
  return respondHTML(renderHTTPStatusReferencePage(lang));
}

function renderHTTPStatusReferencePage(lang = DEFAULT_LANGUAGE) {
  const currentLang = normalizeLanguage(lang);
  const translation = getToolTranslation('http-status-reference', currentLang);
  const title = translation?.name || 'HTTP Status Reference';
  const description = translation?.desc || 'Searchable reference for standard HTTP status codes with usage and caching guidance.';

  const header = createToolHeader(
    { emoji: '📡' },
    title,
    description,
    [
      { text: translation?.ui?.badge0 || 'RFC 9110', tooltip: 'Includes HTTP Semantics status codes from RFC 9110.' },
      { text: translation?.ui?.badge1 || 'Searchable', tooltip: 'Filter by code, name, class, and usage guidance.' },
      { text: translation?.ui?.badge2 || 'Client-Side Only', tooltip: 'All reference data is embedded locally.' }
    ],
    { toolId: 'http-status-reference' }
  );

  const currentTool = TOOLS.find(t => t.id === 'http-status-reference');
  const relatedToolsData = currentTool?.relatedTools?.map(id => TOOLS.find(t => t.id === id)).filter(Boolean) || [];

  const content = `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      ${header}

      <section class="card rounded-xl shadow-sm p-6 sm:p-8 mb-8" aria-labelledby="http-status-search-heading">
        <div class="flex flex-col gap-6">
          <div>
            <h2 id="http-status-search-heading" class="text-lg font-semibold text-surface-900 dark:text-white mb-2" data-i18n="tools.http-status-reference.ui.heading0">Search HTTP statuses</h2>
            <p class="text-sm text-surface-600 dark:text-surface-400" data-i18n="tools.http-status-reference.ui.desc0">Search by code, phrase, class, description, or when-to-use guidance.</p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-end">
            <div>
              <label for="status-search" class="label" data-i18n="tools.http-status-reference.ui.label0">Status code search</label>
              <input id="status-search" class="input w-full" type="search" autocomplete="off" placeholder="e.g., 404, redirect, cacheable, rate limit" data-i18n-placeholder="tools.http-status-reference.ui.placeholder0">
            </div>
            <button id="clear-search" type="button" class="btn btn-secondary" data-i18n="tools.http-status-reference.ui.button0">Clear</button>
          </div>

          <div aria-label="Status class filters" class="flex flex-wrap gap-2">
            <button type="button" class="class-filter btn btn-primary btn-sm active" data-class="all" data-i18n="tools.http-status-reference.ui.button1">All</button>
            <button type="button" class="class-filter btn btn-secondary btn-sm" data-class="1xx" data-i18n="tools.http-status-reference.ui.button2">1xx Informational</button>
            <button type="button" class="class-filter btn btn-secondary btn-sm" data-class="2xx" data-i18n="tools.http-status-reference.ui.button3">2xx Success</button>
            <button type="button" class="class-filter btn btn-secondary btn-sm" data-class="3xx" data-i18n="tools.http-status-reference.ui.button4">3xx Redirection</button>
            <button type="button" class="class-filter btn btn-secondary btn-sm" data-class="4xx" data-i18n="tools.http-status-reference.ui.button5">4xx Client Error</button>
            <button type="button" class="class-filter btn btn-secondary btn-sm" data-class="5xx" data-i18n="tools.http-status-reference.ui.button6">5xx Server Error</button>
          </div>

          <div id="status-error" class="hidden rounded-xl border border-error-200 bg-error-50 p-4 text-sm text-error-800 dark:border-error-900 dark:bg-error-950 dark:text-error-200" role="alert"></div>
        </div>
      </section>

      <section class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" aria-label="HTTP status summary">
        <div class="card rounded-xl shadow-sm p-4">
          <div id="total-statuses" class="text-2xl font-bold text-primary-600 dark:text-primary-400">${STATUS_CODES.length}</div>
          <div class="text-sm text-surface-600 dark:text-surface-400" data-i18n="tools.http-status-reference.ui.stat0">Total statuses</div>
        </div>
        <div class="card rounded-xl shadow-sm p-4">
          <div id="filtered-count" class="text-2xl font-bold text-primary-600 dark:text-primary-400">${STATUS_CODES.length}</div>
          <div class="text-sm text-surface-600 dark:text-surface-400" data-i18n="tools.http-status-reference.ui.stat1">Matching results</div>
        </div>
        <div class="card rounded-xl shadow-sm p-4">
          <div class="text-2xl font-bold text-primary-600 dark:text-primary-400">5</div>
          <div class="text-sm text-surface-600 dark:text-surface-400" data-i18n="tools.http-status-reference.ui.stat2">Status classes</div>
        </div>
        <div class="card rounded-xl shadow-sm p-4">
          <div class="text-2xl font-bold text-primary-600 dark:text-primary-400">12</div>
          <div class="text-sm text-surface-600 dark:text-surface-400" data-i18n="tools.http-status-reference.ui.stat3">Default cacheable</div>
        </div>
      </section>

      <section class="card rounded-xl shadow-sm p-6 sm:p-8 mb-8" aria-labelledby="http-status-results-heading">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h2 id="http-status-results-heading" class="text-lg font-semibold text-surface-900 dark:text-white" data-i18n="tools.http-status-reference.ui.heading1">Status codes</h2>
            <p id="result-summary" class="text-sm text-surface-600 dark:text-surface-400" data-i18n="tools.http-status-reference.ui.status0">Showing all HTTP status codes.</p>
          </div>
        </div>
        <div id="results-body" class="grid grid-cols-1 lg:grid-cols-2 gap-4" aria-live="polite"></div>
        <div id="empty-state" class="hidden rounded-xl border border-surface-200 dark:border-surface-800 p-8 text-center text-surface-600 dark:text-surface-400" data-i18n="tools.http-status-reference.ui.status1">
          No HTTP status codes match the current search and class filter.
        </div>
      </section>

      ${createCheatsheet('http-status-reference', 'HTTP Status Code Guide', [
        { heading: 'Class meanings', content: `
          <table>
            <tr><th data-i18n="tools.http-status-reference.ui.th0">Class</th><th data-i18n="tools.http-status-reference.ui.th1">Meaning</th><th data-i18n="tools.http-status-reference.ui.th2">Typical use</th></tr>
            <tr><td><code>1xx</code></td><td>Informational</td><td>Interim responses while a request continues.</td></tr>
            <tr><td><code>2xx</code></td><td>Successful</td><td>The request was received, understood, and accepted.</td></tr>
            <tr><td><code>3xx</code></td><td>Redirection</td><td>The client needs another request or cached representation.</td></tr>
            <tr><td><code>4xx</code></td><td>Client Error</td><td>The request has a client-side problem or cannot be fulfilled.</td></tr>
            <tr><td><code>5xx</code></td><td>Server Error</td><td>The server failed to fulfill an apparently valid request.</td></tr>
          </table>` },
        { heading: 'Safety, idempotency, and caching', content: `
          <p>Status codes do not make a request safe or idempotent by themselves. Safety and idempotency come from the request method and application semantics.</p>
          <p>RFC caching rules allow some responses to be reused by default, including common statuses such as <code>200</code>, <code>203</code>, <code>204</code>, <code>206</code>, <code>300</code>, <code>301</code>, <code>308</code>, <code>404</code>, <code>405</code>, <code>410</code>, <code>414</code>, and <code>501</code>. Other statuses generally need explicit cache headers.</p>` }
      ])}

      ${relatedToolsData.length > 0 ? createRelatedToolsSection(relatedToolsData, 'Related Network Tools') : ''}
    </main>
  `;

  const scripts = `
    <script>
      (function() {
        const STATUS_CODES = ${JSON.stringify(STATUS_CODES)};
        const CLASS_LABELS = ${JSON.stringify(CLASS_LABELS)};
        let searchQuery = '';
        let classFilter = 'all';

        const searchInput = document.getElementById('status-search');
        const clearSearchBtn = document.getElementById('clear-search');
        const classFilters = document.querySelectorAll('.class-filter');
        const resultsBody = document.getElementById('results-body');
        const emptyState = document.getElementById('empty-state');
        const filteredCount = document.getElementById('filtered-count');
        const resultSummary = document.getElementById('result-summary');
        const statusError = document.getElementById('status-error');

        function showError(message) {
          statusError.textContent = message;
          statusError.classList.remove('hidden');
        }

        function getClassBadge(statusClass) {
          switch (statusClass) {
            case '1xx': return 'bg-info-100 text-info-800 dark:bg-info-900 dark:text-info-200';
            case '2xx': return 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200';
            case '3xx': return 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200';
            case '4xx': return 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200';
            case '5xx': return 'bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200';
            default: return 'bg-surface-100 text-surface-800 dark:bg-surface-800 dark:text-surface-200';
          }
        }

        function getCacheBadge(cacheable) {
          if (cacheable === 'Default cacheable' || cacheable === 'Revalidates cache') {
            return 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200';
          }
          if (cacheable === 'No') {
            return 'bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300';
          }
          return 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200';
        }

        function matchesStatus(status) {
          if (classFilter !== 'all' && status.class !== classFilter) return false;
          if (!searchQuery) return true;
          const haystack = [
            String(status.code),
            status.name,
            status.class,
            CLASS_LABELS[status.class],
            status.description,
            status.use,
            status.safe,
            status.idempotent,
            status.cacheable
          ].join(' ').toLowerCase();
          return haystack.includes(searchQuery);
        }

        function createTextElement(tagName, className, text) {
          const element = document.createElement(tagName);
          if (className) element.className = className;
          element.textContent = text;
          return element;
        }

        function createStatusCard(status) {
          const card = document.createElement('article');
          card.className = 'status-card rounded-xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900';
          card.dataset.code = String(status.code);
          card.dataset.class = status.class;

          const header = document.createElement('div');
          header.className = 'flex items-start justify-between gap-4 mb-4';

          const titleGroup = document.createElement('div');
          const code = createTextElement('div', 'text-3xl font-bold text-primary-600 dark:text-primary-400', String(status.code));
          const name = createTextElement('h3', 'text-lg font-semibold text-surface-900 dark:text-white', status.name);
          titleGroup.append(code, name);

          const classBadge = createTextElement('span', 'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ' + getClassBadge(status.class), status.class + ' ' + CLASS_LABELS[status.class]);
          header.append(titleGroup, classBadge);

          const description = createTextElement('p', 'text-sm text-surface-700 dark:text-surface-300 mb-4', status.description);

          const useBlock = document.createElement('div');
          useBlock.className = 'rounded-xl bg-surface-50 p-3 text-sm dark:bg-surface-950 mb-4';
          useBlock.append(
            createTextElement('div', 'font-semibold text-surface-900 dark:text-white mb-1', 'When to use'),
            createTextElement('p', 'text-surface-700 dark:text-surface-300', status.use)
          );

          const hints = document.createElement('div');
          hints.className = 'grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs';
          const safe = createTextElement('span', 'rounded-lg bg-surface-100 px-2 py-1 text-surface-700 dark:bg-surface-800 dark:text-surface-300', 'Safe: ' + status.safe);
          const idempotent = createTextElement('span', 'rounded-lg bg-surface-100 px-2 py-1 text-surface-700 dark:bg-surface-800 dark:text-surface-300', 'Idempotent: ' + status.idempotent);
          const cacheable = createTextElement('span', 'rounded-lg px-2 py-1 ' + getCacheBadge(status.cacheable), 'Cache: ' + status.cacheable);
          hints.append(safe, idempotent, cacheable);

          card.append(header, description, useBlock, hints);
          return card;
        }

        function renderStatuses() {
          const filtered = STATUS_CODES.filter(matchesStatus);
          resultsBody.replaceChildren(...filtered.map(createStatusCard));
          filteredCount.textContent = String(filtered.length);
          emptyState.classList.toggle('hidden', filtered.length > 0);
          resultSummary.textContent = filtered.length === STATUS_CODES.length
            ? 'Showing all HTTP status codes.'
            : 'Showing ' + filtered.length + ' matching HTTP status code' + (filtered.length === 1 ? '.' : 's.');
        }

        function setActiveFilter(button) {
          classFilters.forEach((filterButton) => {
            const active = filterButton === button;
            filterButton.classList.toggle('active', active);
            filterButton.classList.toggle('btn-primary', active);
            filterButton.classList.toggle('btn-secondary', !active);
            filterButton.setAttribute('aria-pressed', active ? 'true' : 'false');
          });
        }

        function init() {
          if (!searchInput || !resultsBody) {
            showError('HTTP status reference could not initialize. Please refresh the page.');
            return;
          }

          classFilters.forEach((button) => {
            button.setAttribute('aria-pressed', button.dataset.class === 'all' ? 'true' : 'false');
            button.addEventListener('click', () => {
              classFilter = button.dataset.class || 'all';
              setActiveFilter(button);
              renderStatuses();
            });
          });

          searchInput.addEventListener('input', (event) => {
            searchQuery = event.target.value.trim().toLowerCase();
            renderStatuses();
          });

          clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchQuery = '';
            searchInput.focus();
            renderStatuses();
          });

          renderStatuses();
        }

        try {
          init();
        } catch (error) {
          showError('HTTP status reference failed to render. Please refresh the page.');
        }
      })();
    </script>
  `;

  return createPageTemplate({
    title,
    description,
    content,
    path: '/http-status-reference',
    lang: currentLang,
    scripts
  });
}
