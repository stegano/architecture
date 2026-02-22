/**
 * node query.js "<query1>" ... --session "<sessionId>"
 * node query.js "<query1>" ... -s "<sessionId>"
 * default sessionId: unknown
 */
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const https = require("node:https");

const SKILLS_API = `https://api.searchify.fuzziee.com/search/fe8a06cc634f0a74824afa147a2dc52be4242a3cc54867987b89cb197f671d48/skills`;
const TIMEOUT_MS = 10000,
  SESSION = "unknown";
const s = (v) => (typeof v === "string" ? v.trim() : "");
const o = (v) => Boolean(v) && typeof v === "object" && !Array.isArray(v);
const ok = (j, c) =>
  c >= 200 && c < 300 && s(j?.status).toLowerCase() === "success";
const sid = (v) => {
  const n = s(v).replace(/[^a-zA-Z0-9._-]/g, "_");
  if (!n || n === "." || n === "..") return "";
  return n;
};
const dname = (v) => {
  const n = s(v);
  if (/[\\/]/.test(n)) return "";
  if (!n || n === "." || n === "..") return "";
  return n;
};
const rel = (p) => {
  const n = path.posix.normalize(s(p).replace(/\\/g, "/").replace(/^\/+/, ""));
  if (!n || n === "." || n.startsWith("..") || path.posix.isAbsolute(n))
    return "";
  return n;
};
const content = (v) =>
  typeof v === "string"
    ? v
    : o(v) && typeof v.content === "string"
      ? v.content
      : "";
const merge = (to, from) => {
  if (!o(from)) return to;
  for (const [k, v] of Object.entries(from)) {
    const c = content(v);
    if (c) to[s(k)] = c;
  }
  return to;
};
const filesOf = (d) => {
  const files = {};
  merge(files, d?.files);
  merge(files, d?.dir);
  return files;
};
const skillOf = (files) =>
  content(files["/SKILL.md"]) || content(files["SKILL.md"]);

const req = (url, m = "GET", body = null) =>
  new Promise((resv) => {
    const u = new URL(url),
      p = body ? JSON.stringify(body) : null;
    const req = https.request(
      {
        method: m,
        hostname: u.hostname,
        path: `${u.pathname}${u.search}`,
        headers: p
          ? {
              "content-type": "application/json",
              "content-length": Buffer.byteLength(p),
            }
          : undefined,
      },
      (rr) => {
        let raw = "";
        rr.on("data", (c) => (raw += c));
        rr.on("end", () => {
          let j = null;
          try {
            j = raw ? JSON.parse(raw) : null;
          } catch {}
          resv({ status: rr.statusCode || 0, json: j, raw, error: null });
        });
      },
    );
    req.on("error", (e) =>
      resv({ status: 0, json: null, raw: "", error: e.message }),
    );
    req.setTimeout(TIMEOUT_MS, () =>
      req.destroy(new Error(`timeout ${TIMEOUT_MS}ms`)),
    );
    if (p) req.write(p);
    req.end();
  });

const fetchData = async (query) => {
  const q = s(query);
  if (!q) return { status: "Error", data: { itemList: [] } };
  const a = await req(`${SKILLS_API}?q=${encodeURIComponent(q)}`);
  if (!ok(a.json, a.status))
    return {
      status: "Error",
      data: {
        query: q,
        itemList: [],
        error: s(a.json?.reason) || a.error || a.raw,
      },
    };
  const ids = (a.json?.data?.itemList || [])
    .map((x) => Number(x?.id))
    .filter(Number.isFinite);
  const token = s(a.json?.data?.detailToken);
  if (!token || !ids.length)
    return { status: "Success", data: { query: q, itemList: [] } };
  const d = await req(
    `${SKILLS_API}/detail?detailToken=${encodeURIComponent(token)}`,
    "POST",
    { itemIdList: ids },
  );
  if (!ok(d.json, d.status))
    return {
      status: "Error",
      data: {
        query: q,
        itemList: [],
        error: s(d.json?.reason) || d.error || d.raw,
      },
    };
  const list = (d.json?.data?.itemList || [])
    .map((x) => {
      const files = filesOf(x?.data);
      const skill = skillOf(files);
      const name = s(x?.data?.name);
      return {
        id: Number(x?.id) || 0,
        data: {
          ...x?.data,
          name,
          files,
          skill,
          detailToken: token,
        },
      };
    })
    .filter((x) => x.data?.name && x.data?.skill);
  return { status: "Success", data: { query: q, itemList: list } };
};

const cli = async (qs, sessionId) => {
  const queries = (qs || []).map(s).filter(Boolean);
  const session = sid(sessionId) || SESSION;
  const out = path.resolve(process.cwd(), ".tmp", session);
  const old = path.resolve(process.cwd(), ".tmp", `${session}.tmp`);
  await fs.promises.rm(old, { force: true });
  await fs.promises.rm(out, { recursive: true, force: true });
  await fs.promises.mkdir(out, { recursive: true });
  if (!queries.length) {
    return {
      status: "Success",
      queryCount: 0,
      itemCount: 0,
      outputFile: out,
      outputDir: out,
    };
  }
  const responses = await Promise.all(queries.map(fetchData));
  const items = responses.flatMap((r) => r.data?.itemList || []);
  const used = new Set();
  const created = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i] || {};
    const files = filesOf(item?.data);
    const skill = skillOf(files);
    if (!skill) continue;
    const dir = dname(item?.data?.name);
    if (!dir || used.has(dir)) continue;
    used.add(dir);
    const root = path.join(out, dir);
    await fs.promises.mkdir(root, { recursive: true });
    let fileCount = 0;
    for (const [p, v] of Object.entries(files)) {
      const r = rel(p);
      const c = content(v);
      if (!r || !c) continue;
      const filePath = path.join(root, r);
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
      await fs.promises.writeFile(filePath, c, "utf8");
      fileCount += 1;
    }
    if (!fileCount) continue;
    created.push({
      id: item?.id || 0,
      name: s(item?.data?.name),
      directory: dir,
      fileCount,
    });
  }
  return {
    status: "Success",
    queryCount: queries.length,
    itemCount: created.length,
    outputFile: out,
    outputDir: out,
    data: { responses, itemList: created },
  };
};

const parse = (argv) => {
  const v = { sessionId: SESSION, queries: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--session" || a === "-s") {
      v.sessionId = s(argv[i + 1]);
      i += 1;
    } else if (a === "-h" || a === "--help") {
      console.log(
        'Usage: node query.js \"<query>\" ... --session|-s \"<sessionId>\"',
      );
      process.exit(0);
    } else if (!a.startsWith("-")) v.queries.push(a);
  }
  return v;
};
module.exports = { fetchData, cli };
if (require.main === module) {
  const { queries, sessionId } = parse(process.argv.slice(2));
  cli(queries, sessionId).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
