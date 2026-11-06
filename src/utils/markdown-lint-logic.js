// Format linters for the Markdown editor's "Lint as" select.
//
// The route inlines this factory into its client script with fn.toString(), so it
// must stay self-contained. A factory keeps the inner names local: the worker
// bundler may rename colliding top-level names.
//
// Sources for every rule:
// - llms.txt: https://llmstxt.org ("Format" section) and the reference parser in
//   https://github.com/AnswerDotAI/llms-txt (parse_llms_file: title `^#`, summary `^>`,
//   sections split on `^##`, links matched as `-\s*[title](url)(: desc)?`).
// - SKILL.md: Agent Skills specification, https://agentskills.io/specification
//   (frontmatter table, `name` and `description` field rules, progressive disclosure),
//   the format used by https://github.com/anthropics/skills.
// - AGENTS.md: https://agents.md ("just standard Markdown", no required fields;
//   recommended sections such as setup/build/test commands and code style).
export function createMarkdownLint() {
  const FORMATS = ["agents", "skill", "llms"];
  const SEVERITY_RANK = { error: 0, warning: 1, info: 2 };

  // Agent Skills spec: the six frontmatter fields it defines.
  const SKILL_FIELDS = ["name", "description", "license", "compatibility", "metadata", "allowed-tools"];
  const SKILL_NAME_MAX = 64;
  const SKILL_DESCRIPTION_MAX = 1024;
  const SKILL_COMPATIBILITY_MAX = 500;
  const SKILL_MAX_LINES = 500; // "Keep your main SKILL.md under 500 lines."
  const SKILL_BODY_TOKENS = 5000; // "< 5000 tokens recommended" for the body.

  // Codex reads at most project_doc_max_bytes (default 32 KiB) of AGENTS.md.
  const AGENTS_MAX_BYTES = 32 * 1024;

  const SECRET_PATTERNS = [
    { label: "private key block", re: /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----/ },
    { label: "AWS access key ID", re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/ },
    { label: "GitHub token", re: /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,})\b/ },
    { label: "Slack token", re: /\bxox[abposr]-[A-Za-z0-9-]{10,}\b/ },
    { label: "Anthropic API key", re: /\bsk-ant-[A-Za-z0-9_-]{20,}/ },
    { label: "OpenAI-style API key", re: /\bsk-(?!ant-)(?:proj-)?[A-Za-z0-9_-]{20,}/ },
    { label: "Google API key", re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
    { label: "Stripe secret key", re: /\b[rs]k_live_[0-9A-Za-z]{16,}\b/ },
    { label: "JSON Web Token", re: /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/ },
  ];
  const SECRET_ASSIGNMENT =
    /\b(api[_-]?key|secret(?:[_-]?key)?|access[_-]?token|auth[_-]?token|client[_-]?secret|password|passwd)\b["']?\s*[:=]\s*["']?([^\s"'`,;]{8,})/i;
  const PLACEHOLDER = /^(?:<.*|\$.*|\{.*|%.*|x{4,}.*|\*{3,}.*|\.{3}.*|your[_-].*|example.*|changeme.*|placeholder.*|dummy.*|redacted.*|replace[_-]?me.*)$/i;

  const COMMAND_START =
    /^(?:npm|npx|pnpm|yarn|bun|bunx|node|deno|pip|pip3|python|python3|uv|uvx|poetry|cargo|rustup|go|make|cmake|docker|docker-compose|kubectl|helm|git|mvn|gradle|\.\/gradlew|bundle|rails|rake|composer|php|dotnet|terraform|brew|apt|apt-get|curl|wget|pytest|tox|nox|ruff|eslint|prettier|tsc|vitest|jest|wrangler)\s+\S/;
  const COMMAND_PROSE = /^(?:make\s+(?:sure|it|the|a|an|this|that|your|any|changes|use)\b|go\s+(?:to|back|through|ahead|with|over|for|into|on|up|down)\b)/i;

  function splitLines(text) {
    return String(text == null ? "" : text).replace(/^\uFEFF/, "").split(/\r\n|\r|\n/);
  }

  function finding(line, severity, rule, message, hint) {
    return { line: line, severity: severity, rule: rule, message: message, hint: hint };
  }

  // CommonMark fences: up to 3 spaces, then 3+ backticks or tildes; the closer uses the
  // same character, is at least as long, and carries nothing but whitespace.
  function scanFences(lines, startIndex) {
    const inCode = new Array(lines.length).fill(false);
    let open = null;
    for (let i = startIndex || 0; i < lines.length; i++) {
      const line = lines[i];
      if (open) {
        inCode[i] = true;
        const close = line.match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/);
        if (close && close[1][0] === open.ch && close[1].length >= open.len) open = null;
        continue;
      }
      const start = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
      if (start && !(start[1][0] === "`" && start[2].indexOf("`") !== -1)) {
        inCode[i] = true;
        open = { ch: start[1][0], len: start[1].length, line: i + 1 };
      }
    }
    return { inCode: inCode, unclosedLine: open ? open.line : 0 };
  }

  function parseHeading(line) {
    const m = line.match(/^ {0,3}(#{1,6})(?=[ \t]|$)[ \t]*(.*?)(?:[ \t]+#+)?[ \t]*$/);
    return m ? { level: m[1].length, text: m[2].trim() } : null;
  }

  function maskSecret(value) {
    const v = String(value);
    return v.length <= 6 ? "***" : v.slice(0, 4) + "..." + " (" + v.length + " chars)";
  }

  function secretFindings(lines, startIndex) {
    const out = [];
    for (let i = startIndex || 0; i < lines.length; i++) {
      const line = lines[i];
      let hit = null;
      for (let p = 0; p < SECRET_PATTERNS.length && !hit; p++) {
        const m = line.match(SECRET_PATTERNS[p].re);
        if (m) hit = { label: SECRET_PATTERNS[p].label, value: m[0] };
      }
      if (!hit) {
        const m = line.match(SECRET_ASSIGNMENT);
        if (m && !PLACEHOLDER.test(m[2]) && /\d/.test(m[2]) && /[A-Za-z]/.test(m[2])) {
          hit = { label: m[1].toLowerCase() + " value", value: m[2] };
        }
      }
      if (hit) {
        out.push(finding(i + 1, "error", "secret-like",
          "Looks like a " + hit.label + ": " + maskSecret(hit.value) + ".",
          "Remove it and rotate the credential. Reference an environment variable or a placeholder such as <API_KEY> instead."));
      }
    }
    return out;
  }

  function fenceFinding(scan) {
    return scan.unclosedLine
      ? [finding(scan.unclosedLine, "error", "fence-unclosed",
          "Code fence opened here is never closed, so everything after it renders as code.",
          "Add a closing fence with the same character and at least the same length.")]
      : [];
  }

  function lintLlms(lines) {
    const out = [];
    const scan = scanFences(lines, 0);
    out.push.apply(out, fenceFinding(scan));

    const firstIdx = lines.findIndex(function (l, i) { return !scan.inCode[i] && l.trim() !== ""; });
    if (firstIdx === -1) {
      out.push(finding(1, "error", "llms-empty", "The file is empty; an H1 title is the one required section.",
        "Start with a line like: # Project name"));
      return out;
    }

    let h1Line = 0;
    const firstHeading = parseHeading(lines[firstIdx]);
    if (firstHeading && firstHeading.level === 1 && firstHeading.text) {
      h1Line = firstIdx + 1;
    } else {
      const laterH1 = lines.findIndex(function (l, i) {
        const h = !scan.inCode[i] && parseHeading(l);
        return h && h.level === 1;
      });
      out.push(finding(firstIdx + 1, "error", "llms-h1-first",
        laterH1 === -1
          ? "llms.txt must start with an H1 title; none was found."
          : "llms.txt must start with its H1 title, but the H1 is on line " + (laterH1 + 1) + ".",
        "Make the first line '# Project name' (ATX style; the reference parser does not read setext '===' titles)."));
    }

    // Summary blockquote: optional, but it must directly follow the H1 to be parsed as the summary.
    if (h1Line) {
      let next = h1Line;
      while (next < lines.length && lines[next].trim() === "") next++;
      if (next >= lines.length || !/^ {0,3}>/.test(lines[next])) {
        out.push(finding(h1Line, "info", "llms-summary-missing",
          "No summary blockquote after the title.",
          "Add a line like '> One-sentence summary with the key facts' right below the H1."));
      }
    }

    const sections = [];
    let current = null;
    let seenH1 = 0;
    for (let i = 0; i < lines.length; i++) {
      if (scan.inCode[i]) {
        if (current) current.otherLines.push(i + 1);
        continue;
      }
      const line = lines[i];
      const h = parseHeading(line);
      if (h) {
        if (h.level === 1) {
          seenH1++;
          if (seenH1 > 1 || (h1Line && i + 1 !== h1Line)) {
            out.push(finding(i + 1, "error", "llms-h1-multiple", "Only one H1 is allowed; the title is the first H1.",
              "Demote this heading to '##' if it starts a file list, or remove it."));
          }
          continue;
        }
        if (h.level === 2) {
          current = { title: h.text, line: i + 1, links: 0, otherLines: [] };
          sections.push(current);
          continue;
        }
        out.push(finding(i + 1, "warning", "llms-heading-level",
          current
            ? "H" + h.level + " inside a file-list section is not parsed; sections are split on H2 only."
            : "Headings are not allowed in the details area before the first H2.",
          current
            ? "Use a separate '## " + (h.text || "Section") + "' section, or drop the heading."
            : "Turn it into bold text or a paragraph, or move it into an '##' section."));
        continue;
      }
      if (!current || line.trim() === "") continue;

      const item = line.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
      if (!item) {
        if (/^\s{2,}\S/.test(line)) continue; // continuation of the previous list item
        out.push(finding(i + 1, "warning", "llms-section-prose",
          "Text in a file-list section is not parsed as a link.",
          "Move explanations into the details area above the first H2, or put them after a link as '- [Name](url): notes'."));
        continue;
      }
      if (item[2] !== "-") {
        out.push(finding(i + 1, "warning", "llms-list-marker",
          "List marker '" + item[2] + "' is not matched by the reference parser, which only reads '-' items.",
          "Start the item with '- '."));
      }
      const link = item[3].match(/^\[([^\]]*)\]\(([^)]*)\)(.*)$/);
      if (!link) {
        out.push(finding(i + 1, "error", "llms-link-missing",
          "File-list items must start with a markdown link.",
          "Write it as '- [Name](https://example.com/page.md): optional notes'."));
        continue;
      }
      current.links++;
      if (!link[1].trim()) {
        out.push(finding(i + 1, "error", "llms-link-name-empty", "The link has no name.", "Put a short title inside the brackets."));
      }
      const url = link[2].trim().split(/\s+/)[0] || "";
      if (!url) {
        out.push(finding(i + 1, "error", "llms-link-url-empty", "The link has no URL.", "Put the target URL inside the parentheses."));
      }
      const rest = link[3].trim();
      if (rest && rest[0] !== ":") {
        out.push(finding(i + 1, "warning", "llms-link-notes",
          "Notes after a link must follow a colon to be parsed as its description.",
          "Write '- [Name](url): notes'."));
      }
    }

    const titles = {};
    let optionalCount = 0;
    sections.forEach(function (s, idx) {
      const key = s.title.toLowerCase();
      if (titles[key]) {
        out.push(finding(s.line, "warning", "llms-section-duplicate",
          "Section '" + s.title + "' repeats the one on line " + titles[key] + ".", "Merge the two lists under one heading."));
      } else {
        titles[key] = s.line;
      }
      if (!s.links) {
        out.push(finding(s.line, "warning", "llms-section-empty",
          "Section '" + (s.title || "(untitled)") + "' has no links.", "Add '- [Name](url)' items or remove the heading."));
      }
      if (key === "optional") {
        optionalCount++;
        if (s.title !== "Optional") {
          out.push(finding(s.line, "warning", "llms-optional-case",
            "The skippable section is named exactly 'Optional' by convention.", "Rename the heading to '## Optional'."));
        }
        if (optionalCount > 1) {
          out.push(finding(s.line, "warning", "llms-optional-duplicate", "There is more than one Optional section.", "Merge them into one '## Optional' section."));
        } else if (idx !== sections.length - 1) {
          out.push(finding(s.line, "info", "llms-optional-order",
            "The Optional section is usually last, so trimming it leaves the essential links intact.", "Move '## Optional' to the end."));
        }
      } else if (/^optional\b/i.test(s.title)) {
        out.push(finding(s.line, "info", "llms-optional-name",
          "Only a section named exactly 'Optional' is treated as skippable.", "Rename it to '## Optional' if agents may skip these links."));
      }
    });

    out.push.apply(out, secretFindings(lines, 0));
    return out;
  }

  // Small YAML subset parser: top-level `key: value`, quoted scalars, block scalars,
  // folded plain continuations, block maps and lists. Enough for skill frontmatter;
  // anything outside the subset is reported rather than guessed.
  function parseFrontmatter(lines, endIndex) {
    const fields = [];
    const out = [];
    let i = 1;
    while (i < endIndex) {
      const line = lines[i];
      if (line.trim() === "" || /^\s*#/.test(line)) { i++; continue; }
      if (/^\s/.test(line)) {
        out.push(finding(i + 1, "error", "skill-yaml-indent", "Indented line has no parent key.",
          "Remove the leading spaces, or nest it under a key such as metadata:"));
        i++;
        continue;
      }
      const m = line.match(/^([A-Za-z0-9_.-]+)[ \t]*:(?:[ \t]+(.*?))?[ \t]*$/);
      if (!m) {
        out.push(finding(i + 1, "error", "skill-yaml-syntax", "Frontmatter line is not 'key: value'.",
          "Write each field as 'key: value' and quote values that contain special characters."));
        i++;
        continue;
      }
      const field = { key: m[1], line: i + 1, raw: (m[2] || "").trim(), type: "string", value: "", entries: [] };
      const cont = [];
      let j = i + 1;
      while (j < endIndex && (lines[j].trim() === "" || /^\s/.test(lines[j]))) {
        cont.push({ text: lines[j], line: j + 1 });
        j++;
      }
      while (cont.length && cont[cont.length - 1].text.trim() === "") cont.pop();
      const raw = field.raw;
      const contText = cont.map(function (c) { return c.text.trim(); });

      if (/^[|>][+-]?[0-9]?$/.test(raw)) {
        field.value = contText.join(raw[0] === "|" ? "\n" : " ").trim();
      } else if (raw === "" && cont.length) {
        const first = cont.find(function (c) { return c.text.trim() !== ""; });
        if (/^\s*-(\s|$)/.test(first.text)) {
          field.type = "list";
        } else if (/^\s*[^\s:#]+[ \t]*:(\s|$)/.test(first.text)) {
          field.type = "map";
          cont.forEach(function (c) {
            const e = c.text.match(/^\s+([^\s:#][^:]*?)[ \t]*:(?:[ \t]+(.*?))?[ \t]*$/);
            if (e) field.entries.push({ key: e[1], raw: (e[2] || "").trim(), line: c.line });
          });
        } else {
          field.value = contText.join(" ").trim();
        }
      } else if (raw === "") {
        field.type = "null";
      } else if (raw[0] === '"' || raw[0] === "'") {
        const q = raw[0];
        const joined = [raw].concat(contText).join(" ");
        const closeAt = joined.lastIndexOf(q);
        if (closeAt <= 0) {
          out.push(finding(field.line, "error", "skill-yaml-quote", "Quoted value is never closed.", "Add the closing " + q + "."));
          field.value = joined.slice(1);
        } else {
          const inner = joined.slice(1, closeAt);
          field.value = q === "'" ? inner.replace(/''/g, "'") : inner.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
        }
      } else if (raw[0] === "[") {
        field.type = "list";
      } else if (raw[0] === "{") {
        field.type = "map";
      } else {
        const plain = [raw.replace(/\s+#.*$/, "")].concat(contText).join(" ").trim();
        if (/:\s/.test(plain) || /:$/.test(plain)) {
          out.push(finding(field.line, "error", "skill-yaml-colon",
            "Unquoted '" + field.key + "' value contains ': ', which YAML reads as a nested mapping.",
            "Wrap the whole value in double quotes, or use a block scalar ('" + field.key + ": >' with the text on the next lines)."));
        } else if (/^[&*!%@`]/.test(plain)) {
          out.push(finding(field.line, "error", "skill-yaml-indicator",
            "Value starts with the YAML indicator '" + plain[0] + "'.", "Wrap the value in double quotes."));
        }
        field.value = plain;
      }
      fields.push(field);
      i = j;
    }
    return { fields: fields, findings: out };
  }

  function lintSkillName(field) {
    const out = [];
    const name = field.value;
    const hint = "Use 1-64 lowercase letters, digits and single hyphens, matching the skill's folder name (for example pdf-processing).";
    if (field.type !== "string" || !name) {
      out.push(finding(field.line, "error", "skill-name-empty", "'name' is empty.", hint));
      return out;
    }
    if (name.length > SKILL_NAME_MAX) {
      out.push(finding(field.line, "error", "skill-name-length", "'name' is " + name.length + " characters; the limit is 64.", hint));
    }
    if (/[^a-z0-9-]/.test(name)) {
      out.push(finding(field.line, "error", "skill-name-charset",
        /[A-Z]/.test(name) ? "'name' contains uppercase letters." : "'name' contains characters other than a-z, 0-9 and '-'.", hint));
    }
    if (name[0] === "-" || name[name.length - 1] === "-") {
      out.push(finding(field.line, "error", "skill-name-hyphen-edge", "'name' must not start or end with a hyphen.", hint));
    }
    if (name.indexOf("--") !== -1) {
      out.push(finding(field.line, "error", "skill-name-hyphen-double", "'name' must not contain consecutive hyphens.", hint));
    }
    if (!out.length) {
      out.push(finding(field.line, "info", "skill-name-directory",
        "'name' must match the parent directory: save this file as " + name + "/SKILL.md.",
        "Rename the folder or the name so they agree."));
    }
    return out;
  }

  function lintSkill(lines) {
    const out = [];
    if (lines[0].trim() !== "---") {
      out.push(finding(1, "error", "skill-frontmatter-missing",
        "SKILL.md must begin with YAML frontmatter on line 1.",
        "Start the file with '---', then 'name:' and 'description:' lines, then a closing '---'."));
      const scan = scanFences(lines, 0);
      out.push.apply(out, fenceFinding(scan));
      out.push.apply(out, secretFindings(lines, 0));
      return out;
    }
    let end = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === "---" || lines[i].trim() === "...") { end = i; break; }
    }
    if (end === -1) {
      out.push(finding(1, "error", "skill-frontmatter-unclosed", "Frontmatter is never closed.",
        "Add a line containing only '---' after the last field."));
      out.push.apply(out, secretFindings(lines, 0));
      return out;
    }

    const parsed = parseFrontmatter(lines, end);
    out.push.apply(out, parsed.findings);
    const byKey = {};
    parsed.fields.forEach(function (f) {
      if (byKey[f.key]) {
        out.push(finding(f.line, "error", "skill-field-duplicate",
          "'" + f.key + "' is defined twice (first on line " + byKey[f.key].line + ").", "Keep one definition."));
        return;
      }
      byKey[f.key] = f;
      if (SKILL_FIELDS.indexOf(f.key) === -1) {
        out.push(finding(f.line, "warning", "skill-field-unknown",
          "'" + f.key + "' is not a field defined by the Agent Skills spec; validators reject it.",
          "Move custom data under 'metadata:' as string key-value pairs."));
      }
    });

    if (!byKey.name) {
      out.push(finding(1, "error", "skill-name-missing", "Required field 'name' is missing.", "Add 'name: my-skill' to the frontmatter."));
    } else {
      out.push.apply(out, lintSkillName(byKey.name));
    }

    const d = byKey.description;
    if (!d) {
      out.push(finding(1, "error", "skill-description-missing", "Required field 'description' is missing.",
        "Add 'description:' saying what the skill does and when to use it."));
    } else if (d.type !== "string" || !d.value.trim()) {
      out.push(finding(d.line, "error", "skill-description-empty", "'description' is empty.",
        "Describe what the skill does and when an agent should use it."));
    } else {
      if (d.value.length > SKILL_DESCRIPTION_MAX) {
        out.push(finding(d.line, "error", "skill-description-length",
          "'description' is " + d.value.length + " characters; the limit is 1024.", "Shorten it and move detail into the body."));
      }
      if (!/\bwhen\b/i.test(d.value)) {
        out.push(finding(d.line, "info", "skill-description-when",
          "'description' does not say when to use the skill.",
          "Add a trigger such as 'Use when the user mentions PDFs or forms.' The description is what agents match tasks against."));
      }
    }

    const c = byKey.compatibility;
    if (c && (c.type !== "string" || !c.value || c.value.length > SKILL_COMPATIBILITY_MAX)) {
      out.push(finding(c.line, "error", "skill-compatibility-length",
        "'compatibility' must be 1-500 characters" + (c.value ? " (it is " + c.value.length + ")." : "."),
        "Summarize the environment requirements, or remove the field."));
    }

    const meta = byKey.metadata;
    if (meta) {
      if (meta.type !== "map") {
        out.push(finding(meta.line, "warning", "skill-metadata-type", "'metadata' must be a map of string keys to string values.",
          "Write it as 'metadata:' followed by indented 'key: \"value\"' lines."));
      } else {
        meta.entries.forEach(function (e) {
          if (!e.raw || e.raw[0] === "[" || e.raw[0] === "{") {
            out.push(finding(e.line, "warning", "skill-metadata-value", "metadata '" + e.key + "' is not a string value.",
              "Use a single string value, for example " + e.key + ": \"...\"."));
          } else if (/^(?:-?\d+(?:\.\d+)?|true|false|null|~)$/i.test(e.raw)) {
            out.push(finding(e.line, "warning", "skill-metadata-scalar",
              "metadata '" + e.key + "' parses as a " + (/^\-?\d/.test(e.raw) ? "number" : "boolean/null") + ", not a string.",
              "Quote it: " + e.key + ": \"" + e.raw + "\"."));
          }
        });
      }
    }

    const tools = byKey["allowed-tools"];
    if (tools && tools.type !== "string") {
      out.push(finding(tools.line, "warning", "skill-allowed-tools-type", "'allowed-tools' is a space-separated string, not a list.",
        "Write it as allowed-tools: Bash(git:*) Read"));
    }

    const bodyLines = lines.slice(end + 1);
    const bodyText = bodyLines.join("\n");
    if (!bodyText.trim()) {
      out.push(finding(end + 1, "warning", "skill-body-empty", "The skill has no instructions after the frontmatter.",
        "Add step-by-step instructions, examples and edge cases below the closing '---'."));
    }
    if (lines.length > SKILL_MAX_LINES) {
      out.push(finding(SKILL_MAX_LINES + 1, "warning", "skill-too-long",
        "SKILL.md is " + lines.length + " lines; the spec recommends staying under 500.",
        "Move reference material into references/ files and link them from the body."));
    }
    const tokens = Math.ceil(bodyText.length / 4);
    if (tokens > SKILL_BODY_TOKENS) {
      out.push(finding(end + 2, "info", "skill-body-tokens",
        "The body is about " + tokens + " tokens (estimated at 4 characters each); the spec recommends under 5000.",
        "Split detail into referenced files that agents load on demand."));
    }

    const scan = scanFences(lines, end + 1);
    out.push.apply(out, fenceFinding(scan));
    out.push.apply(out, secretFindings(lines, 0));
    return out;
  }

  function lintAgents(lines, text) {
    const out = [];
    if (!lines.some(function (l) { return l.trim() !== ""; })) {
      out.push(finding(1, "warning", "agents-empty", "The file is empty.",
        "Add sections such as '## Setup commands', '## Testing instructions' and '## Code style'."));
      return out;
    }
    const scan = scanFences(lines, 0);
    out.push.apply(out, fenceFinding(scan));

    const headings = [];
    let prevBlank = true;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (scan.inCode[i]) { prevBlank = false; continue; }
      const h = parseHeading(line);
      if (h) { headings.push({ line: i + 1, level: h.level, text: h.text }); prevBlank = false; continue; }
      if (/^(?: {4}|\t)/.test(line) && prevBlank && !/^\s*(?:[-*+]|\d+[.)])\s/.test(line)) continue; // indented code
      prevBlank = line.trim() === "";
      if (prevBlank) continue;

      let s = line.replace(/^\s*(?:>\s*)?(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s+)?/, "").trim();
      const labelled = s.match(/^[^:`]{1,48}:\s+(.*)$/);
      if (labelled && COMMAND_START.test(labelled[1])) s = labelled[1];
      s = s.replace(/^\$\s+/, "");
      if (COMMAND_START.test(s) && !COMMAND_PROSE.test(s) && s.indexOf("`") === -1) {
        out.push(finding(i + 1, "warning", "agents-command-unformatted",
          "Command '" + s.split(/\s+/).slice(0, 3).join(" ") + "' is not in a code span or block.",
          "Wrap it in backticks (`" + s + "`) or a fenced block so agents can copy and run it verbatim."));
      }
    }

    if (!headings.length) {
      out.push(finding(1, "warning", "agents-no-headings", "The file has no headings.",
        "Group instructions under headings such as '## Setup commands' and '## Code style' so agents can find them."));
    }
    headings.forEach(function (h, idx) {
      const next = headings[idx + 1];
      const endLine = next ? next.line - 1 : lines.length;
      const hasContent = lines.slice(h.line, endLine).some(function (l) { return l.trim() !== ""; });
      if (!hasContent && (!next || next.level <= h.level)) {
        out.push(finding(h.line, "info", "agents-section-empty", "Section '" + h.text + "' is empty.",
          "Add the instructions for this section, or remove the heading."));
      }
    });

    const bytes = typeof TextEncoder === "function" ? new TextEncoder().encode(text).length : text.length;
    if (bytes > AGENTS_MAX_BYTES) {
      out.push(finding(1, "warning", "agents-size",
        "AGENTS.md is " + Math.round(bytes / 1024) + " KiB; Codex reads only the first 32 KiB by default (project_doc_max_bytes).",
        "Move package-specific detail into nested AGENTS.md files next to the code they describe."));
    }

    out.push.apply(out, secretFindings(lines, 0));
    return out;
  }

  function lint(text, format) {
    const source = String(text == null ? "" : text);
    const lines = splitLines(source);
    let findings;
    if (format === "llms") findings = lintLlms(lines);
    else if (format === "skill") findings = lintSkill(lines);
    else if (format === "agents") findings = lintAgents(lines, source);
    else return { format: "off", findings: [], counts: { error: 0, warning: 0, info: 0 } };

    findings.sort(function (a, b) {
      return a.line - b.line || SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    });
    const counts = { error: 0, warning: 0, info: 0 };
    findings.forEach(function (f) { counts[f.severity]++; });
    return { format: format, findings: findings, counts: counts };
  }

  function detectFormat(fileName) {
    const base = String(fileName || "").split(/[\\/]/).pop().toLowerCase();
    if (base === "skill.md") return "skill";
    if (base === "agents.md") return "agents";
    if (base === "llms.txt" || base === "llms-full.txt") return "llms";
    return "";
  }

  function lineRange(text, line) {
    const source = String(text == null ? "" : text);
    let start = 0;
    for (let n = 1; n < line; n++) {
      const next = source.indexOf("\n", start);
      if (next === -1) return { start: source.length, end: source.length };
      start = next + 1;
    }
    let end = source.indexOf("\n", start);
    if (end === -1) end = source.length;
    if (end > start && source[end - 1] === "\r") end--;
    return { start: start, end: end };
  }

  return { FORMATS: FORMATS, lint: lint, detectFormat: detectFormat, lineRange: lineRange };
}

export const { FORMATS, lint, detectFormat, lineRange } = createMarkdownLint();
