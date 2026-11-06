import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import {
  apr1Hash,
  buildBasicAuth,
  buildServerConfigs,
  md5Bytes,
  parseBulkLines,
  parseHtpasswdLine,
  sha1Bytes,
  shaHash,
  utf8Bytes,
  verifyHtpasswdLine,
} from "./htpasswd-logic.js";

const SEED = Number(process.env.HTPASSWD_PROPERTY_SEED) || 0x48747077;
const APR1_SALT_CHARS = "./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const PASSWORD_POOL = [
  ..."abcXYZ019 !\"#$%&'()*+,-./;<=>?@[\\]^_`{|}~",
  ":", ":", "é", "ß", "ü", "日", "本", "한", "😀", "🔐", "\u0000", "\t",
];
const USERNAME_POOL = [..."abcdefghijklmnopqrstuvwxyz0123456789._-@", "é", "日", "😀"];

function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function randomInt(random, max) {
  return Math.floor(random() * max);
}

function randomString(random, pool, minLength, maxLength) {
  const length = minLength + randomInt(random, maxLength - minLength + 1);
  let out = "";
  for (let index = 0; index < length; index++) out += pool[randomInt(random, pool.length)];
  return out;
}

function randomPassword(random) {
  const long = random() < 0.15;
  return randomString(random, PASSWORD_POOL, 1, long ? 300 : 24);
}

function randomUsername(random) {
  return randomString(random, USERNAME_POOL, 1, 20);
}

function runProperty(name, cases, body) {
  const random = createRandom(SEED ^ [...name].reduce((h, c) => Math.imul(h, 31) + c.charCodeAt(0), 7));
  const stats = { attempted: 0, executed: 0, discarded: 0, failing: 0 };
  for (let index = 0; index < cases; index++) {
    stats.attempted++;
    const outcome = body(random);
    if (outcome === "discard") {
      stats.discarded++;
      continue;
    }
    stats.executed++;
    if (outcome !== true) stats.failing++;
  }
  console.info(
    `[property] ${name}: attempted=${stats.attempted} executed=${stats.executed} discarded=${stats.discarded} failing=${stats.failing} seed=${SEED} replay="HTPASSWD_PROPERTY_SEED=${SEED} npx vitest run src/utils/htpasswd-logic.test.js"`,
  );
  return stats;
}

const bcryptCompare = (password, hash) => bcrypt.compareSync(password, hash);

// Computed with `openssl passwd -apr1 -salt <salt> <password>` (OpenSSL 4.1.0).
const OPENSSL_APR1_VECTORS = [
  ["password", "abc", "$apr1$password$IyG/qTUQAHLm6nlHvosz31"],
  ["Xy7./AbC", "hunter2", "$apr1$Xy7./AbC$PfUh.yF59QLMrFUo421J9/"],
  ["zZ09..zz", "", "$apr1$zZ09..zz$yS.YCovDjvmY6Nv9gXAKl."],
  ["saltsalt", "pässwörd😀", "$apr1$saltsalt$Nnmbz0zDOZFAwG9TphxJ61"],
  ["a", "pass:with:colons", "$apr1$a$yON4kTym.lhhsWulVLa3L1"],
  [
    "abcdefgh",
    "0123456789012345678901234567890123456789012345678901234567890123456789",
    "$apr1$abcdefgh$M7JX3SZ8AtcWsxU5HUngU1",
  ],
];

describe("independent vectors", () => {
  it("apr1 matches hashes produced by openssl passwd -apr1", () => {
    for (const [salt, password, expected] of OPENSSL_APR1_VECTORS) {
      expect(apr1Hash(password, salt)).toBe(expected);
      expect(verifyHtpasswdLine("user:" + expected, password).match).toBe(true);
    }
  });

  it("calibration: a verifier that ignores the stored salt fails on the same vectors", () => {
    const verifyIgnoringSalt = (line, password) => {
      const parsed = parseHtpasswdLine(line);
      return apr1Hash(password, "") === parsed.hash;
    };
    const matches = OPENSSL_APR1_VECTORS.filter(([, password, hash]) =>
      verifyIgnoringSalt("user:" + hash, password),
    );
    expect(matches).toHaveLength(0);
  });

  it("MD5 and SHA-1 agree with node:crypto across block boundaries", () => {
    const stats = runProperty("digests-vs-node-crypto", 400, (random) => {
      const length = random() < 0.3 ? 50 + randomInt(random, 30) : randomInt(random, 300);
      const bytes = Array.from({ length }, () => randomInt(random, 256));
      const buffer = Buffer.from(bytes);
      return (
        Buffer.from(md5Bytes(bytes)).toString("hex") === createHash("md5").update(buffer).digest("hex") &&
        Buffer.from(sha1Bytes(bytes)).toString("hex") === createHash("sha1").update(buffer).digest("hex")
      );
    });
    expect(stats).toEqual({ attempted: 400, executed: 400, discarded: 0, failing: 0 });
  });

  it("{SHA} entries equal base64(sha1(utf8(password))) from node:crypto", () => {
    const stats = runProperty("sha-vs-node-crypto", 500, (random) => {
      const password = randomPassword(random);
      const expected = "{SHA}" + createHash("sha1").update(Buffer.from(password, "utf8")).digest("base64");
      return shaHash(password) === expected;
    });
    expect(stats).toEqual({ attempted: 500, executed: 500, discarded: 0, failing: 0 });
  });

  it("Authorization header equals Buffer base64 of UTF-8 user:pass", () => {
    const stats = runProperty("basic-auth-vs-buffer", 500, (random) => {
      const username = randomUsername(random);
      const password = randomPassword(random);
      const result = buildBasicAuth(username, password);
      const expected = Buffer.from(username + ":" + password, "utf8").toString("base64");
      return (
        result.ok &&
        result.header === "Authorization: Basic " + expected &&
        Buffer.from(result.token, "base64").toString("utf8") === username + ":" + password
      );
    });
    expect(stats).toEqual({ attempted: 500, executed: 500, discarded: 0, failing: 0 });
    expect(buildBasicAuth("a:b", "x").ok).toBe(false);
  });

  it("curl example single-quotes credentials safely", () => {
    expect(buildBasicAuth("ops", "it's:$HOME", "https://x.test/").curl).toBe(
      "curl -u 'ops:it'\\''s:$HOME' 'https://x.test/'",
    );
  });
});

describe("generate -> verify round trips", () => {
  it("apr1 round-trips random usernames, passwords, and salts", () => {
    const stats = runProperty("apr1-round-trip", 300, (random) => {
      const username = randomUsername(random);
      const password = randomPassword(random);
      const salt = randomString(random, [...APR1_SALT_CHARS], 1, 8);
      const line = username + ":" + apr1Hash(password, salt);
      const good = verifyHtpasswdLine(line, password);
      const bad = verifyHtpasswdLine(line, password + "x");
      return good.ok && good.match && good.username === username && good.algorithm === "apr1" && !bad.match;
    });
    expect(stats).toEqual({ attempted: 300, executed: 300, discarded: 0, failing: 0 });
  }, 30_000);

  it("{SHA} and plaintext round-trip random credentials", () => {
    const stats = runProperty("sha-plain-round-trip", 400, (random) => {
      const username = randomUsername(random);
      const password = randomPassword(random);
      if (/[\r\n]/.test(password) || password.startsWith("$") || password.startsWith("{")) return "discard";
      const sha = verifyHtpasswdLine(username + ":" + shaHash(password), password);
      const plain = verifyHtpasswdLine(username + ":" + password, password);
      const shaWrong = verifyHtpasswdLine(username + ":" + shaHash(password), password.slice(1));
      return sha.match && sha.algorithm === "sha" && plain.match && plain.algorithm === "plain" && !shaWrong.match;
    });
    expect(stats.failing).toBe(0);
    expect(stats.executed).toBeGreaterThan(300);
  });

  it("bcrypt ($2y$, as htpasswd writes it) round-trips through the injected compare", () => {
    const stats = runProperty("bcrypt-round-trip", 25, (random) => {
      const username = randomUsername(random);
      const password = randomPassword(random);
      if (utf8Bytes(password).length > 72) return "discard";
      const hash = "$2y$" + bcrypt.hashSync(password, 4).slice(4);
      const line = username + ":" + hash;
      const good = verifyHtpasswdLine(line, password, bcryptCompare);
      const bad = verifyHtpasswdLine(line, password + "!", bcryptCompare);
      return good.ok && good.match && good.algorithm === "bcrypt" && !bad.match;
    });
    expect(stats.failing).toBe(0);
    expect(stats.executed).toBeGreaterThan(15);
  });

  it("bulk lines keep colons inside passwords and map one entry per line", () => {
    const stats = runProperty("bulk-parse", 300, (random) => {
      const count = 1 + randomInt(random, 6);
      const expected = [];
      const used = new Set();
      for (let index = 0; index < count; index++) {
        const username = randomUsername(random) + index;
        if (used.has(username)) continue;
        used.add(username);
        const password = randomPassword(random).replace(/[\r\n]/g, "") || "p";
        expected.push({ username, password });
      }
      const text = expected.map((entry) => entry.username + ":" + entry.password).join(random() < 0.5 ? "\n" : "\r\n");
      const parsed = parseBulkLines(text + "\n\n");
      return (
        parsed.errors.length === 0 &&
        JSON.stringify(parsed.entries.map(({ username, password }) => ({ username, password }))) ===
          JSON.stringify(expected)
      );
    });
    expect(stats).toEqual({ attempted: 300, executed: 300, discarded: 0, failing: 0 });
  });
});

describe("explicit rejection", () => {
  it.each([
    ["", "empty"],
    ["# comment:x", "comment"],
    ["nocolon", "missing ':'"],
    [":hash", "empty username"],
    ["user:", "empty hash"],
    ["user:$2y$10$short", "truncated bcrypt"],
    ["user:$2y$99$" + "a".repeat(53), "bcrypt cost out of range"],
    ["user:$apr1$saltsalt9$" + "a".repeat(22), "apr1 salt too long"],
    ["user:$apr1$salt$tooShort", "apr1 digest too short"],
    ["user:{SHA}notbase64", "bad {SHA}"],
    ["user:$1$abc$def", "unsupported md5-crypt"],
    ["user:{SSHA}abcd", "unsupported {SSHA}"],
    ["a:b\nc:d", "two lines"],
    ["user:$2y$10$" + "a".repeat(53) + ":extra", "trailing field"],
  ])("rejects %j (%s)", (line) => {
    const parsed = parseHtpasswdLine(line);
    expect(parsed.ok).toBe(false);
    expect(parsed.error).toMatch(/\S/);
    expect(verifyHtpasswdLine(line, "x", bcryptCompare).ok).toBe(false);
  });

  it("reports bulk errors with line numbers", () => {
    const { entries, errors } = parseBulkLines("ok:pw\nnocolon\n:pw\nuser:\nok:dup");
    expect(entries.map((entry) => entry.username)).toEqual(["ok"]);
    expect(errors.map((error) => error.lineNumber)).toEqual([2, 3, 4, 5]);
  });

  it("refuses bcrypt costs that would hang the page instead of calling compare", () => {
    const body = bcrypt.hashSync("pw", 4).slice(6); // "$" + 53-char salt+hash
    const compare = (password, hash) => bcrypt.compareSync(password, hash.replace(/^\$2a\$\d\d/, "$2a$04"));
    const refused = verifyHtpasswdLine("u:$2y$31" + body, "pw", () => {
      throw new Error("compare must not run");
    });
    expect(refused.ok).toBe(false);
    expect(refused.error).toContain("31");
    // The limit is inclusive: cost 16 still reaches the comparator.
    expect(verifyHtpasswdLine("u:$2y$16" + body, "pw", compare)).toMatchObject({ ok: true, match: true });
  });

  it("flags 13-character values that may be DES crypt rather than plaintext", () => {
    expect(verifyHtpasswdLine("u:abcdefghijklm", "x").possiblyCrypt).toBe(true);
  });
});

describe("server config snippets", () => {
  const bcryptHash = "$2y$05$" + "a".repeat(53);

  it("uses the username, file path, and hash in every snippet", () => {
    const configs = buildServerConfigs({
      filePath: "/srv/auth/.htpasswd",
      entries: [{ username: "deploy", hash: bcryptHash, algorithm: "bcrypt" }],
    });
    expect(configs.apache).toContain("AuthType Basic");
    expect(configs.apache).toContain("AuthUserFile /srv/auth/.htpasswd");
    expect(configs.nginx).toContain("auth_basic_user_file /srv/auth/.htpasswd;");
    expect(configs.kubernetes).toContain("kubectl create secret generic basic-auth --from-file=auth");
    expect(configs.kubernetes).toContain("nginx.ingress.kubernetes.io/auth-type: basic");
    expect(configs.kubernetes).toContain("nginx.ingress.kubernetes.io/auth-secret: basic-auth");
    expect(configs.kubernetes).toContain("deploy:" + bcryptHash);
    expect(configs.caddy).toContain("basic_auth");
    expect(configs.caddy).toContain("deploy " + bcryptHash);
    expect(configs.caddy).not.toContain("bcrypt hashes only");
    expect(configs.traefik).toContain("basicauth.users=deploy:" + bcryptHash.replace(/\$/g, "$$$$"));
  });

  it("escapes every $ as $$ for docker-compose and nothing else", () => {
    const stats = runProperty("traefik-dollar-escape", 200, (random) => {
      const hash = apr1Hash(randomPassword(random), randomString(random, [...APR1_SALT_CHARS], 1, 8));
      const { traefik } = buildServerConfigs({ entries: [{ username: "u", hash, algorithm: "apr1" }] });
      const value = /basicauth\.users=([^"]*)"/.exec(traefik)[1];
      return value.replace(/\$\$/g, "$") === "u:" + hash && !/(^|[^$])\$([^$]|$)/.test(value);
    });
    expect(stats).toEqual({ attempted: 200, executed: 200, discarded: 0, failing: 0 });
  });

  it("warns that Caddy needs bcrypt and Traefik rejects plaintext", () => {
    const configs = buildServerConfigs({ entries: [{ username: "u", hash: "pw", algorithm: "plain" }] });
    expect(configs.caddy).toContain("bcrypt hashes only");
    expect(configs.traefik).toContain("does not accept plaintext");
  });

  it("rejects file paths that would break the config syntax", () => {
    expect(buildServerConfigs({ filePath: "/a b/.htpasswd" }).ok).toBe(false);
    expect(buildServerConfigs({ filePath: '/x";' }).ok).toBe(false);
  });
});
