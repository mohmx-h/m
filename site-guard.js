/* site-guard.js — يعمل في الموقع العام فقط (index.html و projects.html)
   1) صفحة الصيانة عند تفعيلها من لوحة التحكم (settings/maintenance).
   2) نبضة حضور خفيفة لعدّاد «الموجودون الآن» (presence/<معرّف عشوائي>).
   لا يستخدم أي مكتبة، ولا يكسر الموقع عند أي فشل (كل شيء داخل try/catch). */
(function () {
  "use strict";
  var PROJECT_ID = "mohomx-portfolio";
  var API_KEY = "AIzaSyC2QW1Du74WNqoMjXc82DKYIwK2HAut0zo";
  var DOCS = "projects/" + PROJECT_ID + "/databases/(default)/documents";
  var BASE = "https://firestore.googleapis.com/v1/" + DOCS;
  var FLAG = "maint_state_v1";
  var isLocal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);

  /* ---------------------------------------------------------------
     الصيانة
  --------------------------------------------------------------- */
  var bypass = false;
  try {
    if (/[?&]preview=1\b/.test(location.search)) sessionStorage.setItem("maint_bypass", "1");
    bypass = sessionStorage.getItem("maint_bypass") === "1";
  } catch (e) {}

  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmt(ms) {
    try {
      var d = new Date(ms);
      return d.toLocaleDateString("ar-EG-u-nu-latn-ca-gregory", { day: "numeric", month: "long", year: "numeric" }) + " • " +
             d.toLocaleTimeString("ar-EG-u-nu-latn-ca-gregory", { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch (e) { return ""; }
  }
  function removeOverlay() {
    var o = document.getElementById("maintenance-overlay"); if (o) o.remove();
    document.documentElement.style.overflow = "";
  }
  function showOverlay(m) {
    removeOverlay();
    var accent = (getComputedStyle(document.documentElement).getPropertyValue("--accent") || "").trim() || "#FF6B2B";
    var rows = "";
    if (m.startAt && Date.parse(m.startAt)) rows += "<div>بدأت الصيانة: " + esc(fmt(Date.parse(m.startAt))) + "</div>";
    if (m.endAt && Date.parse(m.endAt)) rows += "<div>الانتهاء المتوقع: " + esc(fmt(Date.parse(m.endAt))) + "</div>";
    var o = document.createElement("div");
    o.id = "maintenance-overlay"; o.setAttribute("dir", "rtl"); o.setAttribute("role", "alert");
    o.style.cssText = "position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;color:#fff;font-family:'Baloo Bhaijaan 2','DM Sans',system-ui,sans-serif;background:radial-gradient(circle at 20% 10%," + accent + "33,transparent 45%),linear-gradient(135deg,#09090b,#18181b 60%,#1f1410);overflow:auto";
    o.innerHTML =
      '<div style="max-width:520px;width:100%">' +
      '<div style="width:84px;height:84px;margin:0 auto 26px;border-radius:26px;background:' + accent + ';display:grid;place-items:center;font-size:36px;box-shadow:0 18px 50px ' + accent + '55">🛠️</div>' +
      '<h1 style="margin:0 0 14px;font-size:clamp(26px,6vw,38px);font-weight:800;line-height:1.3">' + esc(m.title || "الموقع تحت الصيانة") + "</h1>" +
      (m.message ? '<p style="margin:0 0 10px;font-size:17px;line-height:1.9;color:#d4d4d8">' + esc(m.message) + "</p>" : "") +
      (m.description ? '<p style="margin:0 0 6px;font-size:14px;line-height:1.8;color:#a1a1aa">' + esc(m.description) + "</p>" : "") +
      (rows ? '<div style="display:inline-grid;gap:6px;margin-top:22px;padding:14px 22px;border-radius:18px;background:rgba(255,255,255,.08);font-size:13px;color:#d4d4d8">' + rows + "</div>" : "") +
      '<div style="margin-top:30px;display:flex;justify-content:center;gap:6px" aria-hidden="true"><i style="width:8px;height:8px;border-radius:50%;background:' + accent + ';animation:mt 1.2s infinite"></i><i style="width:8px;height:8px;border-radius:50%;background:' + accent + ';animation:mt 1.2s .2s infinite"></i><i style="width:8px;height:8px;border-radius:50%;background:' + accent + ';animation:mt 1.2s .4s infinite"></i></div>' +
      "</div><style>@keyframes mt{0%,100%{opacity:.25;transform:scale(.8)}50%{opacity:1;transform:scale(1.15)}}</style>";
    (document.body || document.documentElement).appendChild(o);
    document.documentElement.style.overflow = "hidden";
  }
  function decodeStr(f, k) { return f && f[k] && f[k].stringValue !== undefined ? f[k].stringValue : ""; }

  function checkMaintenance() {
    if (bypass) return;
    var cachedOn = false; try { cachedOn = localStorage.getItem(FLAG) === "1"; } catch (e) {}
    var cachedDoc = null; try { cachedDoc = JSON.parse(localStorage.getItem(FLAG + "_doc") || "null"); } catch (e) {}
    /* إظهار فوري من آخر حالة معروفة لتفادي وميض الموقع، ثم نتحقق من الخادم */
    if (cachedOn && cachedDoc) { var arm = function () { showOverlay(cachedDoc); }; if (document.body) arm(); else document.addEventListener("DOMContentLoaded", arm); }

    var ctl = new AbortController(); var t = setTimeout(function () { ctl.abort(); }, 5000);
    fetch(BASE + "/settings/maintenance?key=" + API_KEY, { signal: ctl.signal, cache: "no-store" })
      .then(function (r) { if (r.status === 404) return null; if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (d) {
        var f = (d && d.fields) || {};
        var enabled = !!(f.enabled && f.enabled.booleanValue === true);
        var m = { title: decodeStr(f, "title"), message: decodeStr(f, "message"), description: decodeStr(f, "description"), startAt: decodeStr(f, "startAt"), endAt: decodeStr(f, "endAt") };
        var started = !m.startAt || !Date.parse(m.startAt) || Date.parse(m.startAt) <= Date.now();
        var on = enabled && started;
        try { localStorage.setItem(FLAG, on ? "1" : "0"); localStorage.setItem(FLAG + "_doc", JSON.stringify(m)); } catch (e) {}
        var apply = function () { on ? showOverlay(m) : removeOverlay(); };
        if (document.body) apply(); else document.addEventListener("DOMContentLoaded", apply);
      })
      .catch(function (e) { console.warn("maintenance check failed:", e && e.message); })
      .then(function () { clearTimeout(t); });
  }

  /* ---------------------------------------------------------------
     الموجودون الآن: نبضة كل 60 ثانية لكل متصفح (معرّف ثابت = لا يُحتسب الزائر مرتين)
  --------------------------------------------------------------- */
  function visitorId() {
    try {
      var id = localStorage.getItem("visitorId_v1");
      if (id && /^[a-f0-9]{16,40}$/.test(id)) return id;
      var a = new Uint8Array(12); (window.crypto || window.msCrypto).getRandomValues(a);
      id = Array.prototype.map.call(a, function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
      localStorage.setItem("visitorId_v1", id); return id;
    } catch (e) { return null; }
  }
  function beat(id) {
    if (document.hidden) return;
    var name = DOCS + "/presence/" + id;
    fetch(BASE + ":commit?key=" + API_KEY, {
      method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true,
      body: JSON.stringify({ writes: [{ update: { name: name, fields: {} }, updateTransforms: [{ fieldPath: "t", setToServerValue: "REQUEST_TIME" }] }] })
    }).catch(function () {});
  }
  function startPresence() {
    if (isLocal) return;
    var id = visitorId(); if (!id) return;
    setTimeout(function () { beat(id); }, 1500);
    setInterval(function () { beat(id); }, 60000);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) beat(id); });
  }

  try { checkMaintenance(); } catch (e) { console.warn(e); }
  try { startPresence(); } catch (e) { console.warn(e); }
})();
