/* مسجّل النشاط — يُستخدم في admin.html و activity-log.html
   كل سجل = مستند مستقل في المجموعة activityLogs. لا تُكتب بيانات غير متوفرة (تُترك الحقول غائبة). */

const SKIP_COLLECTIONS = ["activityLogs", "meta", "visitsDaily"];
const COLLECTION_LABELS = {
  videos: "فيديو", videoCategories: "قسم فيديو", reviews: "رأي متابع", services: "خدمة",
  socialIcons: "أيقونة تواصل", social: "حسابات التواصل", navigation: "القائمة"
};
const SETTINGS_LABELS = { site: "إعدادات الموقع", socialIcons: "أيقونات التواصل", social: "حسابات التواصل", navigation: "القائمة" };
const SECTION_LABELS = { hero: "الرئيسية Hero", profile: "الملف الشخصي", contact: "التواصل", footer: "الفوتر", seo: "SEO", design: "التصميم", settings: "الإعدادات" };
const STATE_LISTS = { videos: "videos", reviews: "reviews", videoCategories: "categories", services: "services" };

/* ---------- معلومات الجهاز من User-Agent (+ UA Client Hints إن توفرت) ---------- */
export function parseUA(ua) {
  ua = ua || "";
  const out = {};
  out.deviceType = /iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua)) ? "tablet"
    : /Mobi|iPhone|iPod|Android/i.test(ua) ? "mobile" : "desktop";
  let m;
  if ((m = ua.match(/Windows NT ([\d.]+)/))) { out.os = "Windows"; out.osVersion = { "10.0": "10/11", "6.3": "8.1", "6.2": "8", "6.1": "7" }[m[1]] || m[1]; }
  else if ((m = ua.match(/Android ([\d.]+)/))) { out.os = "Android"; out.osVersion = m[1]; }
  else if ((m = ua.match(/(?:iPhone|CPU) OS ([\d_]+)/))) { out.os = "iOS"; out.osVersion = m[1].replace(/_/g, "."); }
  else if ((m = ua.match(/Mac OS X ([\d_.]+)/))) { out.os = "macOS"; out.osVersion = m[1].replace(/_/g, "."); }
  else if (/CrOS/.test(ua)) out.os = "ChromeOS";
  else if (/Linux/.test(ua)) out.os = "Linux";
  const b = [[/Edg(?:e|A|iOS)?\/([\d.]+)/, "Edge"], [/OPR\/([\d.]+)/, "Opera"], [/SamsungBrowser\/([\d.]+)/, "Samsung Internet"],
    [/(?:Firefox|FxiOS)\/([\d.]+)/, "Firefox"], [/(?:Chrome|CriOS)\/([\d.]+)/, "Chrome"], [/Version\/([\d.]+).*Safari/, "Safari"]];
  for (const [re, name] of b) { if ((m = ua.match(re))) { out.browser = name; out.browserVersion = m[1]; break; } }
  if ((m = ua.match(/Android[^;]*;\s*([^;)]+?)(?:\s+Build|\))/)) && !/^(wv|Mobile)$/i.test(m[1].trim())) out.deviceModel = m[1].trim();
  else if (/iPhone/.test(ua)) out.deviceModel = "iPhone";
  else if (/iPad/.test(ua)) out.deviceModel = "iPad";
  return out;
}

function clean(o) {
  const r = {};
  for (const k in o) { const v = o[k]; if (v !== undefined && v !== null && v !== "") r[k] = v; }
  return r;
}
const cut = (v, n) => (v == null ? v : String(v).slice(0, n));

async function deviceInfo() {
  const ua = navigator.userAgent;
  const info = parseUA(ua);
  try {
    const uad = navigator.userAgentData;
    if (uad && uad.getHighEntropyValues) {
      const h = await uad.getHighEntropyValues(["model", "platformVersion", "fullVersionList"]);
      if (h.model) info.deviceModel = h.model;
      if (h.platformVersion && info.os === "Windows") info.osVersion = parseInt(h.platformVersion, 10) >= 13 ? "11" : "10";
      else if (h.platformVersion && info.os === "Android") info.osVersion = h.platformVersion;
      const brand = (h.fullVersionList || []).find(x => !/not.?a.?brand/i.test(x.brand) && x.brand !== "Chromium") || null;
      if (brand && !info.browserVersion) { info.browser = brand.brand; info.browserVersion = brand.version; }
    }
  } catch (e) {}
  return {
    ...info,
    userAgent: cut(ua, 500),
    language: navigator.language,
    languages: (navigator.languages || []).slice(0, 5).join(","),
    timezone: (Intl.DateTimeFormat().resolvedOptions() || {}).timeZone,
    screen: screen && screen.width ? `${screen.width}x${screen.height}@${window.devicePixelRatio || 1}x` : undefined,
    referrer: cut(document.referrer, 300)
  };
}

/* ---------- IP والموقع التقريبي: من الـ IP فقط (بدون GPS وبدون طلب صلاحيات) ---------- */
async function fetchJSON(url, ms = 4000) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), ms);
  try { const r = await fetch(url, { signal: c.signal }); if (!r.ok) throw new Error("HTTP " + r.status); return await r.json(); }
  finally { clearTimeout(t); }
}
async function ipInfo() {
  try {
    const c = JSON.parse(sessionStorage.getItem("act_ip_v1") || "null");
    if (c && Date.now() - c.t < 30 * 60 * 1000) return c.v;
  } catch (e) {}
  let v = {};
  try {
    const j = await fetchJSON("https://ipwho.is/");
    if (j && j.success !== false && j.ip) v = { ip: j.ip, country: j.country, region: j.region, city: j.city, ipSource: "ipwho.is" };
  } catch (e) {}
  if (!v.ip) {
    try { const j = await fetchJSON("https://api.ipify.org?format=json"); if (j && j.ip) v = { ip: j.ip, ipSource: "ipify.org" }; } catch (e) {}
  }
  v = clean(v);
  try { if (v.ip) sessionStorage.setItem("act_ip_v1", JSON.stringify({ t: Date.now(), v })); } catch (e) {}
  return v;
}

/* ---------- المسجّل ---------- */
export function createActivityLogger({ auth, db, addDoc, collection, serverTimestamp, page, getAdminState }) {
  const rawAdd = addDoc;
  const log = async (entry) => {
    try {
      const [dev, ip] = await Promise.all([deviceInfo(), ipInfo()]);
      const u = auth && auth.currentUser;
      const doc = clean({
        createdAt: serverTimestamp(),
        type: cut(entry.type || "other", 39),
        action: cut(entry.action || "عملية", 119),
        details: cut(entry.details, 1400),
        collection: cut(entry.collection, 60),
        docId: cut(entry.docId, 80),
        status: entry.status === "failed" ? "failed" : "success",
        error: cut(entry.error, 120),
        uid: entry.uid !== undefined ? entry.uid : (u && u.uid),
        email: cut(entry.email !== undefined ? entry.email : (u && u.email), 120),
        ...ip, ...dev,
        page: cut(page, 80)
      });
      await rawAdd(collection(db, "activityLogs"), doc);
    } catch (e) { console.error("Activity log failed:", e); }
  };

  const labelOf = (path) => {
    const [coll, id] = path.split("/");
    if (coll === "settings") return SETTINGS_LABELS[id] || "إعدادات";
    return COLLECTION_LABELS[coll] || coll;
  };
  const shortVal = (v) => (typeof v === "string" ? (v.length > 60 || /^data:/.test(v) ? "(نص طويل/صورة)" : "«" + v + "»") : typeof v === "number" || typeof v === "boolean" ? String(v) : Array.isArray(v) ? "(قائمة " + v.length + ")" : v && typeof v === "object" ? "(بيانات)" : "");

  function describe(op, args) {
    const ref = args[0]; const path = ref && ref.path; if (!path) return null;
    const [coll, id] = path.split("/");
    if (SKIP_COLLECTIONS.includes(coll) || window.__activityMute) return null;
    const label = labelOf(path);
    const data = op === "delete" ? null : args[1] || {};
    const keys = data ? Object.keys(data).filter(k => !["updatedAt", "createdAt"].includes(k)) : [];
    let type, action, detail = [];
    if (coll === "settings") {
      type = "settings"; action = "تغيير " + label;
      if (id === "site") detail.push("القسم: " + keys.map(k => SECTION_LABELS[k] || k).join("، "));
      else if (keys.length) detail.push("الحقول: " + keys.join("، "));
    } else if (op === "add") { type = "create"; action = "إضافة " + label; }
    else if (op === "delete") { type = "delete"; action = "حذف " + label; }
    else {
      type = "update"; action = "تعديل " + label;
      if (keys.length === 1 && keys[0] === "visible") action = (data.visible === false ? "إخفاء " : "إظهار ") + label;
      else if (keys.length === 1 && keys[0] === "order") action = "تغيير ترتيب " + label;
    }
    let name = data && (data.title || data.name);
    if (!name && op === "delete") {
      try { const st = getAdminState && getAdminState(); const list = st && st[STATE_LISTS[coll]]; const it = list && list.find(x => x.id === id); name = it && (it.title || it.name); } catch (e) {}
    }
    if (name) detail.unshift("«" + cut(name, 80) + "»");
    if (coll !== "settings" && keys.length && op !== "delete") detail.push("الحقول: " + keys.slice(0, 10).map(k => k + (["title", "name", "visible", "order", "url", "categoryId", "showOnHome", "showOnProjects"].includes(k) ? " = " + shortVal(data[k]) : "")).join("، "));
    return { type, action, collection: coll, docId: id, details: detail.join(" — ") };
  }

  function wrapWrite(op, fn) {
    return async function (...args) {
      let meta = null; try { meta = describe(op, args); } catch (e) {}
      try {
        const res = await fn.apply(this, args);
        if (meta) { if (op === "add" && res && res.id) meta.docId = res.id; log({ ...meta, status: "success" }); }
        return res;
      } catch (error) {
        if (meta) log({ ...meta, status: "failed", error: (error && error.code) || (error && error.message) });
        throw error;
      }
    };
  }
  return { log, wrapWrite };
}
