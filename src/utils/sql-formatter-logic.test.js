// @vitest-environment node
import { describe, expect, it } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { buildSqlKeywords, formatSql, minifySql, tokenizeSql } from "./sql-formatter-logic.js";

// Oracle: SQLite executes the original, formatted and minified text against
// the same data; identical result rows mean formatting kept the query's meaning.
// Only values are compared: SQLite names an unaliased column after its source
// text, so keyword case changes the name but not the data.
const rows = (db, sql) => db.prepare(sql).all().map((row) => Object.values(row));

function makeDb() {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, created_at TEXT);
    CREATE TABLE orders (id INTEGER PRIMARY KEY, uid INTEGER, total REAL, note TEXT);
    INSERT INTO users VALUES (1, 'ann', '2024-01-01'), (2, 'bob', '2024-02-01'), (3, 'a''x', '2024-03-01');
    INSERT INTO orders VALUES (1, 1, 10.5, 'x -- not a comment'), (2, 1, 2e1, NULL), (3, 3, 0.25, '/* no */');
  `);
  return db;
}

const QUERIES = [
  "select count(*), max(total) from users u left outer join orders o on u.id = o.uid where name like 'a%' and o.total between 1 and 100 order by 1 desc",
  "SELECT name FROM users WHERE id IN (SELECT uid FROM orders WHERE total > 1e0) ORDER BY name",
  "select a.name, (select count(*) from orders b where b.uid = a.id) as n from users a group by a.name, a.id having count(*) >= 1 order by n desc, a.name limit 2 offset 0",
  "select id from users union select uid from orders union all select 99 order by 1",
  "select note from orders where note like '%--%' or note = '/* no */' -- trailing comment\norder by id",
  "select name || '!' as x, case when id = 1 then 'one' else 'many' end from users where not exists (select 1 from orders where uid = users.id and total < 0) order by id",
  "with t as (select uid, sum(total) s from orders group by uid) select users.name, t.s from users join t on t.uid = users.id order by t.s",
  "select id from users intersect select uid from orders except select 3",
];

describe("formatSql / minifySql preserve query results (SQLite oracle)", () => {
  const db = makeDb();
  const keywords = buildSqlKeywords("sqlite");
  it.each(QUERIES)("%s", (sql) => {
    const expected = rows(db, sql);
    for (const kwcase of ["upper", "lower", "keep"]) {
      for (const indentSize of [2, 4]) {
        const formatted = formatSql(sql, { dialect: "sqlite", kwcase, indentSize }, keywords);
        expect(rows(db, formatted), formatted).toEqual(expected);
      }
    }
    expect(rows(db, minifySql(sql, "sqlite", keywords))).toEqual(expected);
  });
});

describe("tokenizeSql", () => {
  const values = (sql, dialect = "postgres") => tokenizeSql(sql, dialect).map((t) => t.value);

  it("keeps parameters, exponents and dollar-quoted bodies whole", () => {
    expect(values("x = $1 and y = :name and z = @v and w = 1e5 and q = 2.5E-3")).toEqual([
      "x", "=", "$1", "and", "y", "=", ":name", "and", "z", "=", "@v", "and", "w", "=", "1e5", "and", "q", "=", "2.5E-3",
    ]);
    expect(values("AS $fn$ select ';' $fn$ LANGUAGE sql")).toEqual(["AS", "$fn$ select ';' $fn$", "LANGUAGE", "sql"]);
  });

  it("does not mistake a cast for a named parameter", () => {
    expect(values("a::text")).toEqual(["a", "::", "text"]);
  });
});

describe("formatSql layout", () => {
  const kw = buildSqlKeywords("postgres");
  const opts = { dialect: "postgres", kwcase: "upper", indentSize: 2 };

  it("writes function calls without a space and keeps LEFT OUTER JOIN together", () => {
    const out = formatSql("select count(*) from a left outer join b on a.id = b.id", opts, kw);
    expect(out).toBe("SELECT\n  count(*)\nFROM\n  a\nLEFT OUTER JOIN\n  b\nON\n    a.id = b.id\n");
  });

  it("keeps BETWEEN ... AND on one line", () => {
    expect(formatSql("select 1 from t where x between 1 and 2 and y = 3", opts, kw)).toBe(
      "SELECT\n  1\nFROM\n  t\nWHERE\n  x BETWEEN 1 AND 2\n  AND y = 3\n",
    );
  });

  it("indents by exactly the chosen width", () => {
    expect(formatSql("select a, b from t", { ...opts, indentSize: 4 }, kw)).toBe("SELECT\n    a,\n    b\nFROM\n    t\n");
  });
});

describe("subquery layout", () => {
  const kw = buildSqlKeywords("sqlite");
  const opts = { indentSize: 2, kwcase: "upper", dialect: "sqlite" };
  const db = new DatabaseSync(":memory:");
  db.exec("CREATE TABLE users(id INTEGER, name TEXT); CREATE TABLE orders(uid INTEGER, total INTEGER);" +
    "INSERT INTO users VALUES (1,'a'),(2,'b'),(3,'c'); INSERT INTO orders VALUES (1,5),(1,20),(2,50),(3,1);");
  const queries = [
    "SELECT u.name, (SELECT COUNT(*) FROM orders o WHERE o.uid = u.id) AS n FROM users u WHERE u.id IN (SELECT uid FROM orders WHERE total > 10) AND EXISTS (SELECT 1 FROM orders x WHERE x.uid = u.id) ORDER BY u.name",
    "SELECT * FROM (SELECT uid, SUM(total) AS t FROM orders GROUP BY uid) s WHERE s.t > (SELECT AVG(total) FROM orders) ORDER BY uid",
    "SELECT name FROM users WHERE id NOT IN (SELECT uid FROM orders WHERE total IN (SELECT MAX(total) FROM orders)) ORDER BY name",
  ];

  it("puts a parenthesised SELECT on its own indented lines", () => {
    const out = formatSql("SELECT a FROM t WHERE id IN (SELECT uid FROM o WHERE x > 1)", opts, kw);
    expect(out).toBe("SELECT\n  a\nFROM\n  t\nWHERE\n  id IN (\n    SELECT\n      uid\n    FROM\n      o\n    WHERE\n      x > 1\n  )\n");
  });

  it("keeps non-subquery parentheses inline", () => {
    expect(formatSql("SELECT (1 + 2) * 3 FROM t WHERE c IN ('a', 'b')", opts, kw)).toContain("c IN ('a', 'b')");
  });

  it("returns the same rows as the original for nested subqueries", () => {
    for (const q of queries) {
      const values = (sql) => db.prepare(sql).all().map((row) => Object.values(row));
      expect(values(formatSql(q, opts, kw))).toEqual(values(q));
    }
  });
});
