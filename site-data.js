/* قراءة بيانات الموقع العام من Firestore عبر REST (HTTPS مباشر، بدون تحميل Firebase SDK).
   أسرع وأكثر ثباتًا للصفحات العامة: كل الطلبات تُرسل بالتوازي، ولا يوجد WebChannel قد يتعلّق.
   الـ Fallback: كاش المتصفح ثم البيانات الأصلية في seed-data.js. */
import { SEED_CATEGORIES, SEED_VIDEOS, SEED_REVIEWS } from "./seed-data.js";

const PROJECT_ID = "mohomx-portfolio";
const API_KEY = "AIzaSyC2QW1Du74WNqoMjXc82DKYIwK2HAut0zo";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const CACHE_KEY = "siteData_cache_v2";
const SET_KEY = "siteSettings_cache_v2";
const byOrder = (a, b) => (a.order || 0) - (b.order || 0);
/* الفيديو يظهر للزوار فقط إذا كان منشورًا، أو مجدولًا وحان موعده (لا يعتمد على فتح لوحة التحكم) */
export function isLive(v) {
  const st = (v && v.status) || "published";
  if (st === "draft") return false;
  if (st === "scheduled") { const t = Date.parse(v.publishAt); return !!t && t <= Date.now(); }
  return true;
}

/* ---------- REST helpers ---------- */
function dec(v) {
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("timestampValue" in v) return v.timestampValue;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(dec);
  if ("mapValue" in v) return decFields(v.mapValue.fields || {});
  return null;
}
function decFields(f) { const o = {}; for (const k in f) o[k] = dec(f[k]); return o; }

async function api(path, init, timeoutMs = 10000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const sep = path.includes("?") ? "&" : "?";
    const res = await fetch(`${BASE}${path}${sep}key=${API_KEY}`, { ...(init || {}), signal: ctl.signal });
    if (res.status === 404) return null;
    if (!res.ok) { const e = new Error("Firestore HTTP " + res.status + " @ " + path.split("?")[0]); e.status = res.status; throw e; }
    return await res.json();
  } finally { clearTimeout(t); }
}
async function withRetry(fn) { try { return await fn(); } catch (e) { if (e.status && e.status < 500) throw e; return await fn(); } }

async function getDocData(path) {
  const r = await withRetry(() => api("/" + path));
  return r ? decFields(r.fields || {}) : null;
}
async function listCol(name) {
  const out = []; let token = "";
  do {
    const r = await withRetry(() => api(`/${name}?pageSize=300${token ? "&pageToken=" + encodeURIComponent(token) : ""}`));
    ((r && r.documents) || []).forEach(d => out.push({ id: d.name.split("/").pop(), ...decFields(d.fields || {}) }));
    token = (r && r.nextPageToken) || "";
  } while (token);
  return out;
}
const readJSON = k => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } };
const writeJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

/* ---------- الفيديوهات / الأقسام / الآراء ---------- */
export async function loadSiteData() {
  const prev = readJSON(CACHE_KEY);
  const names = ["videos", "videoCategories", "reviews"];
  const res = await Promise.allSettled(names.map(listCol));
  res.forEach((r, i) => { if (r.status === "rejected") console.error("Firestore read failed [" + names[i] + "]:", r.reason); });
  const [v, c, r] = res.map(x => x.status === "fulfilled" ? x.value : null);
  if (v && v.length) {
    const data = {
      videos: v.filter(isLive).sort(byOrder),
      categories: (c || (prev && prev.categories) || SEED_CATEGORIES).sort(byOrder),
      reviews: (r || (prev && prev.reviews) || SEED_REVIEWS).sort(byOrder),
      source: "firestore"
    };
    writeJSON(CACHE_KEY, data);
    return data;
  }
  if (prev && prev.videos && prev.videos.length) return { ...prev, videos: prev.videos.filter(isLive), source: "cache" };
  return { videos: SEED_VIDEOS, categories: SEED_CATEGORIES, reviews: SEED_REVIEWS, source: "fallback" };
}

/* ---------- الإعدادات (settings/*) + الخدمات + أيقونات التواصل ---------- */
export async function loadSiteSettings() {
  const prev = readJSON(SET_KEY) || {};
  const jobs = {
    site: () => getDocData("settings/site"),
    social: () => getDocData("settings/social"),
    navDoc: () => getDocData("settings/navigation"),
    iconsDoc: () => getDocData("settings/socialIcons"),
    services: () => listCol("services")
  };
  const keys = Object.keys(jobs);
  const res = await Promise.allSettled(keys.map(k => jobs[k]()));
  const got = {};
  res.forEach((r, i) => {
    if (r.status === "fulfilled") got[keys[i]] = r.value;
    else console.error("Firestore read failed [" + keys[i] + "]:", r.reason);
  });
  /* كل جزء مستقل: فشل جزء لا يُسقط البقية، ويعود الجزء الفاشل لآخر نسخة ناجحة */
  const pick = (k, mapFn, prevKey, empty) => (k in got ? mapFn(got[k]) : (prev[prevKey] !== undefined ? prev[prevKey] : empty));
  const data = {
    site: pick("site", d => d, "site", null),
    social: pick("social", d => d, "social", null),
    navigation: pick("navDoc", d => (d && d.items) || null, "navigation", null),
    socialIcons: pick("iconsDoc", d => (d && Array.isArray(d.items) ? d.items.slice().sort(byOrder) : null), "socialIcons", null),
    services: pick("services", d => d.filter(s => s.visible !== false).sort(byOrder), "services", [])
  };
  writeJSON(SET_KEY, data);
  return data;
}

export function readCache() {
  const data = readJSON(CACHE_KEY);
  if (data && Array.isArray(data.videos)) data.videos = data.videos.filter(isLive);
  return { data, settings: readJSON(SET_KEY) };
}

/* ---------- اللون الأساسي ---------- */
export function applyAccent(hex) {
  if (!/^#[0-9a-f]{6}$/i.test(hex || "")) return;
  const n = parseInt(hex.slice(1), 16);
  const r = document.documentElement.style;
  r.setProperty("--accent", hex);
  r.setProperty("--accent-rgb", `${n >> 16} ${(n >> 8) & 255} ${n & 255}`);
}

/* ---------- SEO ---------- */
export function applySEO(seo) {
  if (!seo) return;
  const meta = (sel, attr, val) => { const el = document.querySelector(sel); if (el && val) el.setAttribute(attr, val); };
  if (seo.title) { document.title = seo.title; meta('meta[property="og:title"]', "content", seo.title); }
  if (seo.description) { meta('meta[name="description"]', "content", seo.description); meta('meta[property="og:description"]', "content", seo.description); }
  if (seo.keywords) meta('meta[name="keywords"]', "content", seo.keywords);
  if (seo.url && !/example\.com/.test(seo.url)) meta('meta[property="og:url"]', "content", seo.url);
}

/* ---------- الزيارات: زيارة واحدة لكل متصفح كل 30 دقيقة، بدون بيانات شخصية ---------- */
export async function trackVisit() {
  try {
    if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;
    const last = Number(localStorage.getItem("lastVisitAt") || 0);
    if (Date.now() - last < 30 * 60 * 1000) return;
    localStorage.setItem("lastVisitAt", String(Date.now()));
    const day = new Date().toLocaleDateString("en-CA");
    const name = `projects/${PROJECT_ID}/databases/(default)/documents/visitsDaily/${day}`;
    await api(":commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ writes: [{
        update: { name, fields: { date: { stringValue: day } } },
        updateMask: { fieldPaths: ["date"] },
        updateTransforms: [{ fieldPath: "count", increment: { integerValue: "1" } }]
      }] })
    });
  } catch (error) {
    console.error("Visit tracking failed:", error);
  }
}
