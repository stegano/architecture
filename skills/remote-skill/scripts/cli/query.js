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
const ok = (j, c) =>
  c >= 200 && c < 300 && s(j?.status).toLowerCase() === "success";

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
    .map((x) => ({
      id: Number(x?.id) || 0,
      data: { ...x?.data, skill: s(x?.data?.skill), detailToken: token },
    }))
    .filter((x) => x.data?.skill);
  return { status: "Success", data: { query: q, itemList: list } };
};

const cli = async (qs, sessionId) => {
  const queries = (qs || []).map(s).filter(Boolean);
  const sid = s(sessionId) || SESSION;
  const out = path.resolve(
    process.cwd(),
    ".tmp",
    `${sid.replace(/[^a-zA-Z0-9._-]/g, "_")}.tmp`,
  );
  await fs.promises.mkdir(path.dirname(out), { recursive: true });
  if (!queries.length) {
    await fs.promises.writeFile(out, "", "utf8");
    return { status: "Success", queryCount: 0, itemCount: 0, outputFile: out };
  }
  const responses = await Promise.all(queries.map(fetchData));
  const skills = responses
    .flatMap((r) =>
      (r.data?.itemList || []).map((x) => x?.data?.skill).filter(Boolean),
    )
    .map((x) => x.replace(/\r?\n/g, "\\n"));
  await fs.promises.writeFile(out, skills.join("\n"), "utf8");
  return {
    status: "Success",
    queryCount: queries.length,
    itemCount: skills.length,
    outputFile: out,
    data: { responses },
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
