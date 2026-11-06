// Page-side client for /vendor/regex-worker.js. The route inlines this factory with
// fn.toString(), so it must stay self-contained (no references to other top-level names).
//
// The worker cannot interrupt itself mid-match, so the page owns the deadline: when a
// batch does not answer within timeoutMs the worker is terminated (the only way to stop
// a backtracking RegExp) and a fresh one is spawned on the next request.
export function createRegexWorkerClient(options) {
  const opts = options || {};
  const url = opts.url || "/vendor/regex-worker.js";
  const timeoutMs = opts.timeoutMs || 1500;
  const WorkerCtor = opts.Worker || (typeof Worker !== "undefined" ? Worker : null);
  let worker = null;
  let seq = 0;
  let batch = null;

  function settle(outcome) {
    const current = batch;
    if (!current) return;
    batch = null;
    clearTimeout(current.timer);
    current.resolve(outcome);
  }

  function stopWorker() {
    if (worker) worker.terminate();
    worker = null;
  }

  function spawn() {
    worker = new WorkerCtor(url);
    worker.onmessage = function (event) {
      const data = event.data || {};
      if (!batch || !(data.id in batch.replies)) return;
      batch.replies[data.id] = data;
      batch.left -= 1;
      if (batch.left > 0) return;
      const results = batch.ids.map(function (id) { return batch.replies[id]; });
      settle({ status: "ok", results: results });
    };
    worker.onerror = function (event) {
      if (event && event.preventDefault) event.preventDefault();
      stopWorker();
      settle({ status: "error", error: (event && event.message) || "The regex worker failed." });
    };
  }

  // Runs every request in one deadline. A newer batch supersedes an older one: the old
  // promise resolves "cancelled" and the busy worker is replaced, so a slow pattern
  // never delays the next keystroke's result.
  function runBatch(requests) {
    if (batch) {
      stopWorker();
      settle({ status: "cancelled" });
    }
    if (!WorkerCtor) return Promise.resolve({ status: "error", error: "Web Workers are not available in this browser." });
    if (!requests.length) return Promise.resolve({ status: "ok", results: [] });
    if (!worker) spawn();
    return new Promise(function (resolve) {
      const ids = [];
      const replies = {};
      for (let i = 0; i < requests.length; i++) {
        seq += 1;
        ids.push(seq);
        replies[seq] = null;
      }
      const timer = setTimeout(function () {
        stopWorker();
        settle({ status: "timeout" });
      }, timeoutMs);
      batch = { ids: ids, replies: replies, left: ids.length, resolve: resolve, timer: timer };
      for (let i = 0; i < requests.length; i++) {
        worker.postMessage(Object.assign({}, requests[i], { id: ids[i] }));
      }
    });
  }

  function run(request) {
    return runBatch([request]).then(function (outcome) {
      if (outcome.status !== "ok") return outcome;
      const reply = outcome.results[0];
      return reply.ok ? { status: "ok", result: reply } : { status: "error", error: reply.error };
    });
  }

  function cancel() {
    if (!batch) return;
    stopWorker();
    settle({ status: "cancelled" });
  }

  return { run: run, runBatch: runBatch, cancel: cancel };
}

export const REGEX_TIMEOUT_MESSAGE =
  "This pattern took too long and was stopped (possible catastrophic backtracking).";
