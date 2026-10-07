/* =====================================================================
   admin-extras.js — الأنظمة الإضافية للوحة التحكم
   سلة المحذوفات • النسخ الاحتياطي • وضع الصيانة • الإشعارات • الموجودون الآن
   جدولة النشر • كشف التكرار • التحديد المتعدد

   يُدمج داخل adminApp() عبر:  ...window.adminExtras()
   لا يغيّر أي وظيفة موجودة؛ يعتمد على window.firebaseServices الموجودة أصلًا.
   ===================================================================== */
window.adminExtras = function () {
  const F = () => window.firebaseServices;

  /* ---------- ثوابت ---------- */
  const COLL = {
    videos:          { label: 'فيديو',      section: 'أبرز الفيديوهات', icon: 'fa-video',        list: 'videos',     reload: 'loadVideos' },
    reviews:         { label: 'رأي متابع',  section: 'آراء المتابعين',  icon: 'fa-comment-dots', list: 'reviews',    reload: 'loadReviews' },
    videoCategories: { label: 'قسم فيديو',  section: 'أقسام الفيديوهات', icon: 'fa-layer-group',  list: 'categories', reload: 'loadCategories' }
  };
  const BACKUP_COLLECTIONS = ['videos', 'videoCategories', 'reviews', 'services', 'settings', 'social', 'navigation', 'socialIcons'];
  const BACKUP_LABELS = {
    videos: 'الفيديوهات', videoCategories: 'التصنيفات', reviews: 'المراجعات', services: 'الخدمات',
    settings: 'الإعدادات', social: 'حسابات التواصل', navigation: 'التنقل', socialIcons: 'روابط التواصل'
  };
  const CHUNK_CHARS = 250000;               // 250k حرف ≤ ~750KB (حد المستند 1MB)
  const NOTIF_TYPES = {
    duplicate:   { icon: 'fa-clone',                  tone: 'red',     label: 'محتوى مكرر' },
    published:   { icon: 'fa-circle-check',           tone: 'emerald', label: 'نشر' },
    upcoming:    { icon: 'fa-calendar-day',           tone: 'amber',   label: 'موعد قريب' },
    backup:      { icon: 'fa-database',               tone: 'indigo',  label: 'نسخ احتياطي' },
    failed:      { icon: 'fa-triangle-exclamation',   tone: 'red',     label: 'فشل' },
    deleted:     { icon: 'fa-trash',                  tone: 'zinc',    label: 'حذف' },
    restored:    { icon: 'fa-rotate-left',            tone: 'sky',     label: 'استعادة' },
    maintenance: { icon: 'fa-screwdriver-wrench',     tone: 'orange',  label: 'صيانة' }
  };

  /* ---------- أدوات عامة ---------- */
  const strip = (o) => {                       // إزالة undefined (Firestore لا يقبلها)
    if (Array.isArray(o)) return o.map(strip);
    if (o && typeof o === 'object' && typeof o.toDate !== 'function') {
      const r = {};
      for (const k in o) if (o[k] !== undefined) r[k] = strip(o[k]);
      return r;
    }
    return o;
  };
  const isTs = (v) => v && typeof v === 'object' && typeof v.toDate === 'function' && 'seconds' in v;
  const enc = (v) => {                          // Firestore -> JSON آمن
    if (isTs(v)) return { __ts: [v.seconds, v.nanoseconds] };
    if (Array.isArray(v)) return v.map(enc);
    if (v && typeof v === 'object') { const r = {}; for (const k in v) r[k] = enc(v[k]); return r; }
    return v;
  };
  const dec = (v) => {                          // JSON -> Firestore
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if (Array.isArray(v.__ts) && v.__ts.length === 2) return new (F().Timestamp)(v.__ts[0], v.__ts[1]);
      const r = {}; for (const k in v) r[k] = dec(v[k]); return r;
    }
    if (Array.isArray(v)) return v.map(dec);
    return v;
  };
  const tsMs = (v) => (isTs(v) ? v.toMillis() : (v instanceof Date ? v.getTime() : (typeof v === 'number' ? v : Date.parse(v) || 0)));
  const pad = (n) => String(n).padStart(2, '0');
  const AR = 'ar-EG-u-nu-latn-ca-gregory';
  const fmtDate = (ms) => (ms ? new Date(ms).toLocaleDateString(AR, { day: 'numeric', month: 'long', year: 'numeric' }) : '—');
  const fmtTime = (ms) => (ms ? new Date(ms).toLocaleTimeString(AR, { hour: '2-digit', minute: '2-digit', hour12: true }) : '—');
  const toLocalInput = (iso) => { const ms = Date.parse(iso); if (!ms) return ''; const d = new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const fromLocalInput = (v) => { const ms = Date.parse(v); return ms ? new Date(ms).toISOString() : ''; };
  const fmtSize = (b) => (b >= 1048576 ? (b / 1048576).toFixed(2) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');
  const ago = (ms) => {
    const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
    if (s < 60) return 'الآن';
    if (s < 3600) return 'منذ ' + Math.floor(s / 60) + ' د';
    if (s < 86400) return 'منذ ' + Math.floor(s / 3600) + ' س';
    return 'منذ ' + Math.floor(s / 86400) + ' يوم';
  };

  /* ---------- مفاتيح كشف التكرار ---------- */
  const videoKey = (url) => {
    const u = String(url || '').trim(); if (!u) return '';
    let m;
    if ((m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:shorts\/|embed\/|live\/)|[?&]v=)([\w-]{11})/))) return 'yt:' + m[1];
    if ((m = u.match(/tiktok\.com\/.*\/video\/(\d+)/))) return 'tt:' + m[1];
    if ((m = u.match(/instagram\.com\/(?:reel|reels|p|tv)\/([\w-]+)/))) return 'ig:' + m[1];
    return 'url:' + u.toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/[?#].*$/, '').replace(/\/+$/, '');
  };
  const normTitle = (t) => String(t || '').toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  const similarity = (a, b) => {
    if (!a || !b) return 0;
    if (a === b) return 1;
    const A = new Set(a.split(' ').filter(w => w.length > 1)), B = new Set(b.split(' ').filter(w => w.length > 1));
    if (!A.size || !B.size) return 0;
    let inter = 0; A.forEach(w => { if (B.has(w)) inter++; });
    const jac = inter / (A.size + B.size - inter);
    const small = A.size <= B.size ? A : B, big = A.size <= B.size ? B : A;
    let inSmall = 0; small.forEach(w => { if (big.has(w)) inSmall++; });
    const contain = small.size >= 3 ? inSmall / small.size : 0;
    return Math.max(jac, contain >= 1 ? 0.8 : 0);
  };

  return {
    /* =================================================
       الحالة
    ================================================= */
    /* حوار التأكيد */
    dlg: { open: false, title: '', message: '', confirmText: 'تأكيد', tone: 'danger', icon: 'fa-triangle-exclamation', expect: '', typed: '', busy: false },
    _dlgResolve: null,

    /* سلة المحذوفات */
    trash: { items: [], loading: false, loaded: false, error: '', q: '', type: 'all', range: 'all', sel: [], busy: false },

    /* النسخ الاحتياطي */
    backup: { items: [], loading: false, loaded: false, error: '', busy: false, busyId: '', step: '', progress: 0 },
    restore: { open: false, source: null, fileName: '', meta: null, data: null, mode: 'merge', typed: '', busy: false, step: '', progress: 0, error: '' },

    /* وضع الصيانة */
    maint: { loaded: false, loading: false, saving: false, enabled: false, title: 'الموقع تحت الصيانة', message: 'نعمل حاليًا على تحسين الموقع لنقدّم لكم تجربة أفضل.', description: 'سنعود قريبًا — شكرًا لصبركم.', startAt: '', endAt: '', updatedAt: 0 },

    /* الإشعارات */
    notif: { open: false, items: [], loading: false, error: '', filter: 'all', _t: null },

    /* الموجودون الآن */
    presence: { count: null, loading: false, error: '', updatedAt: 0, _t: null },

    /* التحديد المتعدد: sec -> [ids] */
    selected: { videos: [], reviews: [], categories: [] },
    bulkBusy: false,

    /* عرض الفيديوهات: بطاقات/جدول + بحث + فلتر الحالة */
    vw: { view: (function () { try { return localStorage.getItem('xt_videos_view') === 'table' ? 'table' : 'cards'; } catch (_) { return 'cards'; } })(), q: '', status: 'all' },

    /* كشف التكرار */
    dup: { level: 'none', item: null, reasons: [] },
    _dupNotified: {},
    _dupT: null,

    /* =================================================
       تشغيل بعد تسجيل الدخول
    ================================================= */
    extrasOnLogin() {
      this.loadNotifications();
      this.loadTrash();
      this.loadMaintenance();
      this.refreshPresence();
      this.processSchedules();
      clearInterval(this.notif._t); clearInterval(this.presence._t);
      this.notif._t = setInterval(() => { if (!document.hidden) this.loadNotifications(true); }, 60000);
      this.presence._t = setInterval(() => {
        if (document.hidden) return;
        if (this.page === 'stats' || this.page === 'dashboard') this.refreshPresence(true);
        this.processSchedules();
      }, 30000);
    },

    /* =================================================
       حوار التأكيد الاحترافي
    ================================================= */
    ask(opts) {
      return new Promise((resolve) => {
        this.dlg = Object.assign({ open: true, title: 'تأكيد العملية', message: '', confirmText: 'تأكيد', tone: 'danger', icon: 'fa-triangle-exclamation', expect: '', typed: '', busy: false }, opts);
        this._dlgResolve = resolve;
      });
    },
    dlgOk() {
      if (this.dlg.expect && this.dlg.typed.trim() !== this.dlg.expect) return;
      this.dlg.open = false; const r = this._dlgResolve; this._dlgResolve = null; if (r) r(true);
    },
    dlgCancel() {
      this.dlg.open = false; const r = this._dlgResolve; this._dlgResolve = null; if (r) r(false);
    },

    /* =================================================
       مساعدات العرض
    ================================================= */
    fmtDate, fmtTime, fmtSize, ago, tsMs,
    fmtDateTime(ms) { return ms ? fmtDate(ms) + ' • ' + fmtTime(ms) : '—'; },
    notifMeta(type) { return NOTIF_TYPES[type] || { icon: 'fa-bell', tone: 'zinc', label: 'إشعار' }; },
    toneBox(tone) {
      return ({
        red: 'bg-red-50 text-red-500 dark:bg-red-950/30', emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30', indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30',
        sky: 'bg-sky-50 text-sky-600 dark:bg-sky-950/30', orange: 'bg-orange-50 text-orange-600 dark:bg-orange-950/30',
        zinc: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
      })[tone] || 'bg-zinc-100 text-zinc-600';
    },

    /* =================================================
       الإشعارات
    ================================================= */
    async notify(type, title, body, link) {
      try {
        const f = F();
        await f.addDoc(f.collection(f.db, 'notifications'), {
          type, title, body: body || '', link: link || null, read: false, createdAt: f.serverTimestamp()
        });
        this.loadNotifications(true);
      } catch (e) { console.warn('notify failed:', e && e.code, e); }
    },
    async loadNotifications(silent) {
      const f = F();
      if (!silent) this.notif.loading = true;
      try {
        const snap = await f.getDocs(f.query(f.collection(f.db, 'notifications'), f.orderBy('createdAt', 'desc'), f.limit(60)));
        this.notif.items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        this.notif.error = '';
      } catch (e) {
        console.error('notifications load:', e && e.code, e);
        this.notif.error = e && e.code === 'permission-denied' ? 'لا توجد صلاحية — حدّث قواعد Firestore' : 'تعذر تحميل الإشعارات';
      } finally { this.notif.loading = false; }
    },
    unreadCount() { return this.notif.items.filter(n => !n.read).length; },
    notifList() {
      const fl = this.notif.filter;
      return this.notif.items.filter(n => fl === 'all' ? true : fl === 'unread' ? !n.read : n.type === fl);
    },
    async markRead(n, val = true) {
      if (!!n.read === val) return;
      const f = F(); const old = n.read; n.read = val;
      try { await f.updateDoc(f.doc(f.db, 'notifications', n.id), { read: val }); }
      catch (e) { n.read = old; this.toast('تعذر تحديث الإشعار'); }
    },
    async markAllRead() {
      const f = F(); const unread = this.notif.items.filter(n => !n.read);
      if (!unread.length) return;
      unread.forEach(n => { n.read = true; });
      try {
        const b = f.writeBatch(f.db);
        unread.forEach(n => b.update(f.doc(f.db, 'notifications', n.id), { read: true }));
        await b.commit();
        this.toast('تم تحديد الكل كمقروء');
      } catch (e) { unread.forEach(n => { n.read = false; }); this.toast('تعذر تحديث الإشعارات'); }
    },
    async deleteNotif(n) {
      const f = F(); const keep = this.notif.items;
      this.notif.items = keep.filter(x => x.id !== n.id);
      try { await f.deleteDoc(f.doc(f.db, 'notifications', n.id)); }
      catch (e) { this.notif.items = keep; this.toast('تعذر حذف الإشعار'); }
    },
    async openNotif(n) {
      this.markRead(n);
      const l = n.link;
      if (l && l.page) {
        this.notif.open = false;
        this.go(l.page);
        if (l.page === 'videos' && l.id) {
          const v = this.videos.find(x => x.id === l.id);
          if (v) setTimeout(() => this.editVideo(v), 250);
        }
      }
    },

    /* =================================================
       سلة المحذوفات
    ================================================= */
    async loadTrash() {
      const f = F(); this.trash.loading = true;
      try {
        const snap = await f.getDocs(f.collection(f.db, 'trash'));
        this.trash.items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => tsMs(b.deletedAt) - tsMs(a.deletedAt));
        this.trash.error = ''; this.trash.loaded = true;
        this.trash.sel = this.trash.sel.filter(id => this.trash.items.some(i => i.id === id));
      } catch (e) {
        console.error('trash load:', e && e.code, e);
        this.trash.error = e && e.code === 'permission-denied' ? 'لا توجد صلاحية لقراءة سلة المحذوفات — حدّث قواعد Firestore.' : 'تعذر تحميل سلة المحذوفات.';
      } finally { this.trash.loading = false; }
    },
    trashFiltered() {
      const t = this.trash, q = normTitle(t.q), now = Date.now();
      const span = { today: 86400000, week: 7 * 86400000, month: 30 * 86400000 }[t.range];
      return t.items.filter(i =>
        (t.type === 'all' || i.origCollection === t.type) &&
        (!span || now - tsMs(i.deletedAt) <= span) &&
        (!q || normTitle(i.title).includes(q) || normTitle(i.itemType).includes(q)));
    },
    trashIcon(c) { return (COLL[c] && COLL[c].icon) || 'fa-file'; },

    /* نقل عنصر إلى سلة المحذوفات (بدل الحذف النهائي) */
    async trashItem(coll, item) {
      const f = F(); const u = f.auth.currentUser;
      const { id, ...data } = item;
      const title = item.title || item.name || item.author || (item.text ? String(item.text).slice(0, 50) : '') || 'عنصر بدون اسم';
      await f.setDoc(f.doc(f.db, 'trash', coll + '__' + id), {
        origCollection: coll, origId: id,
        itemType: (COLL[coll] || {}).label || coll, section: (COLL[coll] || {}).section || coll,
        title, data: strip(data),
        deletedAt: f.serverTimestamp(),
        deletedBy: { uid: (u && u.uid) || '', email: (u && u.email) || '' }
      });
      try { await f.deleteDoc(f.doc(f.db, coll, id)); }
      catch (e) { try { await f.deleteDoc(f.doc(f.db, 'trash', coll + '__' + id)); } catch (_) {} throw e; }
      try { window.activity && window.activity.log({ type: 'delete', action: 'نقل إلى سلة المحذوفات: ' + ((COLL[coll] || {}).label || coll), details: '«' + String(title).slice(0, 80) + '»', collection: coll, docId: id }); } catch (_) {}
    },

    /* غلاف مشترك للحذف (يستعمله حذف الفيديو/الرأي/القسم الحاليّ) */
    async moveToTrash(coll, item, listKey) {
      const meta = COLL[coll]; const name = item.title || item.name || meta.label;
      const ok = await this.ask({
        title: 'نقل إلى سلة المحذوفات', icon: 'fa-trash-can', tone: 'warn', confirmText: 'نقل إلى السلة',
        message: `سيُنقل «${name}» إلى سلة المحذوفات ويختفي من الموقع العام. يمكنك استعادته لاحقًا.`
      });
      if (!ok) return false;
      const keep = this[listKey];
      this[listKey] = keep.filter(x => x.id !== item.id);
      try {
        await this.trashItem(coll, item);
        this.toast('تم النقل إلى سلة المحذوفات');
        this.notify('deleted', 'تم حذف ' + meta.label, '«' + name + '» — نُقل إلى سلة المحذوفات', { page: 'trash' });
        this.loadTrash();
        return true;
      } catch (e) {
        console.error('trash failed:', e && e.code, e);
        this[listKey] = keep;
        this.toast('تعذر نقل العنصر إلى السلة' + (e && e.code === 'permission-denied' ? ' — حدّث قواعد Firestore' : ''));
        this.notify('failed', 'فشل حذف ' + meta.label, '«' + name + '» — ' + ((e && e.code) || 'خطأ غير معروف'), { page: 'trash' });
        return false;
      }
    },

    async restoreTrashItems(ids) {
      if (!ids.length || this.trash.busy) return;
      const f = F(); this.trash.busy = true; let ok = 0, fail = 0; const touched = new Set();
      for (const tid of ids) {
        const it = this.trash.items.find(x => x.id === tid); if (!it) continue;
        try {
          const target = f.doc(f.db, it.origCollection, it.origId);
          const exists = (await f.getDoc(target)).exists();
          const payload = dec(it.data || {});
          if (exists) await f.addDoc(f.collection(f.db, it.origCollection), payload);   // الأصل مستخدم: أنشئ نسخة جديدة
          else await f.setDoc(target, payload);
          await f.deleteDoc(f.doc(f.db, 'trash', tid));
          touched.add(it.origCollection); ok++;
        } catch (e) { console.error('restore failed:', e && e.code, e); fail++; }
      }
      this.trash.sel = [];
      await this.loadTrash();
      for (const c of touched) { try { await this[COLL[c].reload](); } catch (_) {} }
      this.trash.busy = false;
      if (ok) {
        this.toast(ok === 1 ? 'تمت استعادة العنصر' : 'تمت استعادة ' + ok + ' عناصر');
        this.notify('restored', 'تمت استعادة ' + (ok === 1 ? 'عنصر' : ok + ' عناصر'), 'من سلة المحذوفات إلى مكانها الأصلي', { page: 'trash' });
      }
      if (fail) { this.toast('تعذرت استعادة ' + fail + ' عنصر'); this.notify('failed', 'فشلت استعادة ' + fail + ' عنصر', 'راجع الصلاحيات وحاول مرة أخرى', { page: 'trash' }); }
    },
    async deleteTrashForever(ids, emptyAll) {
      if (!ids.length || this.trash.busy) return;
      const ok = await this.ask({
        title: emptyAll ? 'تفريغ سلة المحذوفات' : 'حذف نهائي', icon: 'fa-skull-crossbones', tone: 'danger',
        confirmText: emptyAll ? 'تفريغ السلة نهائيًا' : 'حذف نهائيًا',
        message: `سيتم حذف ${ids.length === 1 ? 'هذا العنصر' : ids.length + ' عنصر'} نهائيًا من قاعدة البيانات. لا يمكن التراجع عن هذه العملية ولا يمكن استرجاع البيانات بعدها.`,
        expect: (emptyAll || ids.length > 1) ? 'حذف' : ''
      });
      if (!ok) return;
      const f = F(); this.trash.busy = true;
      try {
        for (let i = 0; i < ids.length; i += 400) {
          const b = f.writeBatch(f.db);
          ids.slice(i, i + 400).forEach(id => b.delete(f.doc(f.db, 'trash', id)));
          await b.commit();
        }
        this.trash.items = this.trash.items.filter(x => !ids.includes(x.id)); this.trash.sel = [];
        this.toast('تم الحذف النهائي');
        try { window.activity && window.activity.log({ type: 'delete', action: 'حذف نهائي من سلة المحذوفات', details: ids.length + ' عنصر' }); } catch (_) {}
      } catch (e) {
        console.error('permanent delete failed:', e && e.code, e);
        this.toast('تعذر الحذف النهائي'); this.notify('failed', 'فشل الحذف النهائي', (e && e.code) || '', { page: 'trash' });
        await this.loadTrash();
      } finally { this.trash.busy = false; }
    },
    trashToggle(id) { const s = this.trash.sel; const i = s.indexOf(id); i < 0 ? s.push(id) : s.splice(i, 1); },
    trashToggleAll() {
      const ids = this.trashFiltered().map(i => i.id);
      this.trash.sel = ids.length && ids.every(id => this.trash.sel.includes(id)) ? [] : ids;
    },
    trashAllSelected() { const ids = this.trashFiltered().map(i => i.id); return ids.length > 0 && ids.every(id => this.trash.sel.includes(id)); },

    /* =================================================
       النسخ الاحتياطي
    ================================================= */
    backupCollectionLabels() { return BACKUP_LABELS; },
    async loadBackups() {
      const f = F(); this.backup.loading = true;
      try {
        const snap = await f.getDocs(f.collection(f.db, 'backups'));
        this.backup.items = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => tsMs(b.createdAt) - tsMs(a.createdAt));
        this.backup.error = ''; this.backup.loaded = true;
      } catch (e) {
        console.error('backups load:', e && e.code, e);
        this.backup.error = e && e.code === 'permission-denied' ? 'لا توجد صلاحية لقراءة النسخ — حدّث قواعد Firestore.' : 'تعذر تحميل النسخ الاحتياطية.';
      } finally { this.backup.loading = false; }
    },
    readyBackups() { return this.backup.items.filter(b => b.status === 'ready'); },
    lastBackup() { return this.readyBackups()[0] || null; },
    backupHealth() {
      const b = this.lastBackup(); if (!b) return { tone: 'red', label: 'لا توجد نسخة احتياطية', hint: 'أنشئ نسخة الآن لحماية بياناتك.' };
      const days = (Date.now() - tsMs(b.createdAt)) / 86400000;
      if (days <= 7) return { tone: 'emerald', label: 'بياناتك محمية', hint: 'آخر نسخة حديثة.' };
      if (days <= 30) return { tone: 'amber', label: 'يُنصح بنسخة جديدة', hint: 'مضى أكثر من أسبوع على آخر نسخة.' };
      return { tone: 'red', label: 'النسخ قديمة', hint: 'مضى أكثر من 30 يومًا على آخر نسخة.' };
    },
    async buildSnapshot() {
      const f = F(); const out = { meta: { app: 'mohomx-admin-backup', version: 1, project: 'mohomx-portfolio', createdAt: new Date().toISOString(), counts: {} }, data: {} };
      for (const c of BACKUP_COLLECTIONS) {
        const snap = await f.getDocs(f.collection(f.db, c));
        out.data[c] = snap.docs.map(d => ({ id: d.id, data: enc(d.data()) }));
        out.meta.counts[c] = snap.size;
      }
      return out;
    },
    downloadText(text, filename) {
      /* داخل تطبيق أندرويد (WebView) لا تعمل تنزيلات blob، فنحفظ عبر الجسر الأصلي إلى مجلد التنزيلات */
      try {
        if (window.AndroidBridge && typeof window.AndroidBridge.saveFile === 'function' && window.AndroidBridge.saveFile(filename, text)) return;
      } catch (_) {}
      const url = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }));
      const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click();
      setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 1500);
    },
    backupFileName(ms) { const d = new Date(ms); return `mohomx-backup-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}.json`; },

    async createBackup(type = 'manual', opts = {}) {
      if (this.backup.busy && !opts.force) return null;
      const f = F(); this.backup.busy = true; this.backup.progress = 8; this.backup.step = 'قراءة البيانات…';
      let ref = null;
      try {
        const snap = await this.buildSnapshot();
        const json = JSON.stringify(snap); const size = new Blob([json]).size;
        const chunks = []; for (let i = 0; i < json.length; i += CHUNK_CHARS) chunks.push(json.slice(i, i + CHUNK_CHARS));
        const u = f.auth.currentUser; const now = Date.now();
        this.backup.progress = 30; this.backup.step = 'حفظ النسخة…';
        const total = Object.values(snap.meta.counts).reduce((a, b) => a + b, 0);
        ref = await f.addDoc(f.collection(f.db, 'backups'), {
          name: 'نسخة ' + (type === 'pre-restore' ? 'قبل الاستعادة ' : '') + fmtDate(now) + ' ' + fmtTime(now),
          type, status: 'writing', size, chunks: chunks.length, counts: snap.meta.counts, total,
          createdAt: f.serverTimestamp(), createdBy: (u && u.email) || ''
        });
        for (let i = 0; i < chunks.length; i++) {
          await f.setDoc(f.doc(f.db, 'backups', ref.id, 'chunks', String(i).padStart(4, '0')), { i, text: chunks[i] });
          this.backup.progress = 30 + Math.round(((i + 1) / chunks.length) * 60);
        }
        await f.updateDoc(f.doc(f.db, 'backups', ref.id), { status: 'ready' });
        this.backup.progress = 100;
        if (!opts.silentDownload) this.downloadText(json, this.backupFileName(now));
        this.toast('تم إنشاء النسخة الاحتياطية');
        this.notify('backup', 'تم إنشاء نسخة احتياطية', total + ' عنصر • ' + fmtSize(size), { page: 'backup' });
        await this.loadBackups();
        return { id: ref.id, json };
      } catch (e) {
        console.error('backup failed:', e && e.code, e);
        if (ref) { try { await F().updateDoc(F().doc(F().db, 'backups', ref.id), { status: 'failed' }); } catch (_) {} }
        this.toast('فشل إنشاء النسخة الاحتياطية' + (e && e.code === 'permission-denied' ? ' — حدّث قواعد Firestore' : ''));
        this.notify('failed', 'فشل إنشاء نسخة احتياطية', (e && e.code) || (e && e.message) || '', { page: 'backup' });
        await this.loadBackups().catch(() => {});
        return null;
      } finally { this.backup.busy = false; setTimeout(() => { if (!this.backup.busy) { this.backup.progress = 0; this.backup.step = ''; } }, 900); }
    },
    async fetchBackupJson(b) {
      const f = F();
      const snap = await f.getDocs(f.collection(f.db, 'backups', b.id, 'chunks'));
      const parts = snap.docs.map(d => d.data()).sort((x, y) => x.i - y.i);
      if (parts.length !== b.chunks) throw new Error('النسخة غير مكتملة');
      return parts.map(p => p.text).join('');
    },
    async downloadBackup(b) {
      if (this.backup.busyId) return; this.backup.busyId = b.id;
      try { const json = await this.fetchBackupJson(b); this.downloadText(json, this.backupFileName(tsMs(b.createdAt) || Date.now())); this.toast('بدأ تنزيل النسخة'); }
      catch (e) { console.error(e); this.toast('تعذر تنزيل النسخة'); }
      finally { this.backup.busyId = ''; }
    },
    async deleteBackup(b) {
      const ok = await this.ask({ title: 'حذف النسخة الاحتياطية', icon: 'fa-trash', tone: 'danger', confirmText: 'حذف النسخة', message: `سيتم حذف «${b.name}» نهائيًا. إن لم تكن قد نزّلتها فلن تتمكن من استرجاعها.` });
      if (!ok) return;
      if (this.backup.busyId) return;
      const f = F(); this.backup.busyId = b.id;
      try {
        const snap = await f.getDocs(f.collection(f.db, 'backups', b.id, 'chunks'));
        for (let i = 0; i < snap.docs.length; i += 400) {
          const bt = f.writeBatch(f.db); snap.docs.slice(i, i + 400).forEach(d => bt.delete(d.ref)); await bt.commit();
        }
        await f.deleteDoc(f.doc(f.db, 'backups', b.id));
        this.backup.items = this.backup.items.filter(x => x.id !== b.id);
        this.toast('تم حذف النسخة');
      } catch (e) { console.error(e); this.toast('تعذر حذف النسخة'); }
      finally { this.backup.busyId = ''; }
    },
    backupTypeLabel(t) { return t === 'pre-restore' ? 'قبل الاستعادة' : 'يدوية'; },

    /* ---- الاستعادة ---- */
    openRestoreFromBackup(b) {
      this.restore = { open: true, source: b, fileName: b.name, meta: { counts: b.counts, createdAt: tsMs(b.createdAt) }, data: null, mode: 'merge', typed: '', busy: false, step: '', progress: 0, error: '' };
    },
    openRestoreFromFile() { this.restore = { open: true, source: null, fileName: '', meta: null, data: null, mode: 'merge', typed: '', busy: false, step: '', progress: 0, error: '' }; },
    async onRestoreFile(ev) {
      const file = ev.target.files && ev.target.files[0]; if (!file) return;
      try {
        const obj = JSON.parse(await file.text());
        if (!obj || !obj.meta || obj.meta.app !== 'mohomx-admin-backup' || typeof obj.data !== 'object') throw new Error('ليس ملف نسخة احتياطية صالحًا لهذه اللوحة');
        this.restore.data = obj; this.restore.fileName = file.name; this.restore.meta = { counts: obj.meta.counts || {}, createdAt: Date.parse(obj.meta.createdAt) || 0 }; this.restore.error = '';
      } catch (e) { this.restore.data = null; this.restore.error = e.message || 'تعذر قراءة الملف'; }
      ev.target.value = '';
    },
    restoreReady() { return (this.restore.source || this.restore.data) && this.restore.typed.trim() === 'استعادة' && !this.restore.busy; },
    async runRestore() {
      if (!this.restoreReady()) return;
      const r = this.restore, f = F(); r.busy = true; r.error = '';
      try {
        r.step = 'تجهيز الملف…'; r.progress = 5;
        let snap = r.data;
        if (!snap) snap = JSON.parse(await this.fetchBackupJson(r.source));
        if (!snap || !snap.meta || snap.meta.app !== 'mohomx-admin-backup') throw new Error('ملف النسخة غير صالح');
        r.step = 'إنشاء نسخة أمان قبل الاستعادة…'; r.progress = 10;
        const safety = await this.createBackup('pre-restore', { force: true, silentDownload: false });
        if (!safety) throw new Error('تعذر إنشاء نسخة الأمان — أُلغيت الاستعادة ولم يتغير شيء');
        const cols = BACKUP_COLLECTIONS.filter(c => Array.isArray(snap.data[c]));
        let done = 0; const totalOps = cols.reduce((a, c) => a + snap.data[c].length, 0) || 1;
        for (const c of cols) {
          r.step = 'استعادة ' + BACKUP_LABELS[c] + '…';
          const items = snap.data[c];
          for (let i = 0; i < items.length; i += 400) {
            const b = f.writeBatch(f.db);
            items.slice(i, i + 400).forEach(it => b.set(f.doc(f.db, c, it.id), dec(it.data)));
            await b.commit(); done += Math.min(400, items.length - i); r.progress = 15 + Math.round((done / totalOps) * 80);
          }
          if (r.mode === 'replace') {
            const keep = new Set(items.map(it => it.id));
            const cur = await f.getDocs(f.collection(f.db, c)); const extra = cur.docs.filter(d => !keep.has(d.id));
            for (let i = 0; i < extra.length; i += 400) { const b = f.writeBatch(f.db); extra.slice(i, i + 400).forEach(d => b.delete(d.ref)); await b.commit(); }
          }
        }
        r.progress = 100; r.step = 'اكتملت الاستعادة';
        try { window.activity && window.activity.log({ type: 'settings', action: 'استعادة نسخة احتياطية', details: (r.mode === 'replace' ? 'استبدال كامل' : 'دمج') + ' — ' + r.fileName }); } catch (_) {}
        this.toast('تمت استعادة النسخة الاحتياطية');
        this.notify('backup', 'تمت استعادة نسخة احتياطية', r.fileName, { page: 'backup' });
        await Promise.allSettled([this.loadVideos(), this.loadReviews(), this.loadCategories(), this.loadSiteSettings(), this.loadServices(), this.loadSocial(), this.loadNavigation(), this.loadSocialIcons(), this.loadMaintenance(), this.loadBackups()]);
        setTimeout(() => { this.restore.open = false; }, 1200);
      } catch (e) {
        console.error('restore failed:', e && e.code, e);
        r.error = (e && e.message) || 'فشلت الاستعادة';
        this.notify('failed', 'فشلت استعادة النسخة', r.error, { page: 'backup' });
      } finally { r.busy = false; }
    },

    /* =================================================
       وضع الصيانة  (settings/maintenance)
    ================================================= */
    async loadMaintenance() {
      const f = F(); this.maint.loading = true;
      try {
        const s = await f.getDoc(f.doc(f.db, 'settings', 'maintenance'));
        if (s.exists()) { const d = s.data(); Object.assign(this.maint, { enabled: d.enabled === true, title: d.title || this.maint.title, message: d.message || '', description: d.description || '', startAt: toLocalInput(d.startAt), endAt: toLocalInput(d.endAt), updatedAt: tsMs(d.updatedAt) }); }
        this.maint.loaded = true;
      } catch (e) { console.error('maintenance load:', e && e.code, e); }
      finally { this.maint.loading = false; }
    },
    async saveMaintenance(enabled) {
      if (this.maint.saving) return;
      const m = this.maint, f = F();
      if (m.startAt && m.endAt && Date.parse(m.endAt) <= Date.parse(m.startAt)) { this.toast('وقت الانتهاء يجب أن يكون بعد وقت البدء'); return; }
      if (enabled === true && !m.enabled) {
        const ok = await this.ask({ title: 'تفعيل وضع الصيانة', icon: 'fa-screwdriver-wrench', tone: 'warn', confirmText: 'تفعيل الآن', message: 'سيرى زوار الموقع صفحة الصيانة بدل المحتوى. لوحة التحكم تبقى متاحة لك بالكامل.' });
        if (!ok) return;
      }
      const next = enabled === undefined ? m.enabled : enabled;
      m.saving = true;
      try {
        await f.setDoc(f.doc(f.db, 'settings', 'maintenance'), {
          enabled: next, title: (m.title || '').trim() || 'الموقع تحت الصيانة', message: (m.message || '').trim(), description: (m.description || '').trim(),
          startAt: fromLocalInput(m.startAt), endAt: fromLocalInput(m.endAt), updatedAt: f.serverTimestamp()
        });
        const was = m.enabled; m.enabled = next; m.updatedAt = Date.now();
        this.toast(enabled === undefined ? 'تم حفظ إعدادات الصيانة' : next ? 'تم تفعيل وضع الصيانة' : 'عاد الموقع للعمل');
        if (was !== next) this.notify('maintenance', next ? 'تم تفعيل وضع الصيانة' : 'تم إيقاف وضع الصيانة', next ? 'الزوار يرون صفحة الصيانة الآن' : 'الموقع متاح للزوار', { page: 'maintenance' });
      } catch (e) {
        console.error('maintenance save:', e && e.code, e);
        this.toast('تعذر حفظ وضع الصيانة' + (e && e.code === 'permission-denied' ? ' — حدّث قواعد Firestore' : ''));
        this.notify('failed', 'فشل تغيير وضع الصيانة', (e && e.code) || '', { page: 'maintenance' });
      } finally { m.saving = false; }
    },
    maintRangeText() {
      const m = this.maint;
      if (!m.startAt && !m.endAt) return '';
      const a = m.startAt ? fmtDate(Date.parse(m.startAt)) + ' ' + fmtTime(Date.parse(m.startAt)) : '';
      const b = m.endAt ? fmtDate(Date.parse(m.endAt)) + ' ' + fmtTime(Date.parse(m.endAt)) : '';
      return (a ? 'بدأت: ' + a : '') + (a && b ? '  •  ' : '') + (b ? 'الانتهاء المتوقع: ' + b : '');
    },

    /* =================================================
       الموجودون الآن  (presence)
    ================================================= */
    async refreshPresence(silent) {
      const f = F(); if (!silent) this.presence.loading = true;
      try {
        const since = f.Timestamp.fromMillis(Date.now() - 150000);
        const snap = await f.getDocs(f.query(f.collection(f.db, 'presence'), f.where('t', '>=', f.Timestamp.fromMillis(since.toMillis()))));
        this.presence.count = snap.size; this.presence.error = ''; this.presence.updatedAt = Date.now();
        /* تنظيف السجلات الأقدم من ساعة (المدير فقط يملك صلاحية الحذف) */
        if (!this._presenceCleaned || Date.now() - this._presenceCleaned > 600000) {
          this._presenceCleaned = Date.now();
          const old = await f.getDocs(f.query(f.collection(f.db, 'presence'), f.where('t', '<', f.Timestamp.fromMillis(Date.now() - 3600000)), f.limit(200)));
          if (old.size) { const b = f.writeBatch(f.db); old.docs.forEach(d => b.delete(d.ref)); await b.commit(); }
        }
      } catch (e) {
        console.error('presence:', e && e.code, e);
        this.presence.error = e && e.code === 'permission-denied' ? 'لا توجد صلاحية — حدّث قواعد Firestore' : 'تعذر تحديث العدد';
      } finally { this.presence.loading = false; }
    },

    /* =================================================
       جدولة النشر
    ================================================= */
    effStatus(v) {
      const s = v.status || 'published';
      if (s === 'scheduled' && Date.parse(v.publishAt) <= Date.now()) return 'published';
      return s;
    },
    setVideoView(v) { this.vw.view = v; try { localStorage.setItem('xt_videos_view', v); } catch (_) {} },
    videosView() {
      const q = normTitle(this.vw.q), st = this.vw.status;
      return this.videos.filter(v =>
        (st === 'all' || (st === 'hidden' ? v.visible === false : this.effStatus(v) === st)) &&
        (!q || normTitle(v.title).includes(q) || normTitle(v.category).includes(q) || normTitle(v.platform).includes(q)));
    },
    videoStats() {
      const c = { all: this.videos.length, published: 0, scheduled: 0, draft: 0, hidden: 0 };
      this.videos.forEach(v => { c[this.effStatus(v)]++; if (v.visible === false) c.hidden++; });
      return c;
    },
    vChip(v) {
      return ({
        published: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
        scheduled: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
        draft: 'bg-zinc-400/20 text-zinc-200 border-zinc-300/20'
      })[this.effStatus(v)];
    },
    statusLabel(v) { return ({ published: 'منشور', scheduled: 'مجدول', draft: 'مسودة' })[this.effStatus(v)] || 'منشور'; },
    statusClass(v) {
      return 'rounded-full px-3 py-1.5 text-xs font-bold ' + ({
        published: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30',
        scheduled: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30',
        draft: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'
      })[this.effStatus(v)];
    },
    fmtSchedule(iso) { const ms = Date.parse(iso); return ms ? fmtDate(ms) + ' • ' + fmtTime(ms) : ''; },
    schedMs() {
      const f = this.videoForm; if (!f.schedDate) return 0;
      const [y, m, d] = f.schedDate.split('-').map(Number);
      let h = Number(f.schedHour) % 12; if (f.schedPeriod === 'PM') h += 12;
      return new Date(y, m - 1, d, h, Number(f.schedMin)).getTime();
    },
    schedPreview() { const ms = this.schedMs(); return ms ? { date: fmtDate(ms), time: fmtTime(ms), past: ms <= Date.now() } : null; },
    validateSchedule() {
      if (this.videoForm.status !== 'scheduled') return true;
      const ms = this.schedMs();
      if (!ms) { this.toast('اختر تاريخ ووقت النشر'); return false; }
      if (ms <= Date.now() + 30000) { this.toast('موعد النشر يجب أن يكون في المستقبل'); return false; }
      return true;
    },
    schedulePayload() {
      const s = this.videoForm.status || 'published';
      if (s === 'scheduled') return { status: 'scheduled', publishAt: new Date(this.schedMs()).toISOString(), notifiedUpcoming: false };
      return { status: s, publishAt: '' };
    },
    loadScheduleIntoForm(video) {
      const s = video.status || 'published'; const ms = Date.parse(video.publishAt);
      const out = { status: s, schedDate: '', schedHour: '8', schedMin: '0', schedPeriod: 'PM' };
      if (s === 'scheduled' && ms) {
        const d = new Date(ms); const h = d.getHours();
        out.schedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        out.schedHour = String(h % 12 === 0 ? 12 : h % 12); out.schedMin = String(d.getMinutes()); out.schedPeriod = h >= 12 ? 'PM' : 'AM';
      }
      return out;
    },
    cancelSchedule() { this.videoForm.status = 'draft'; this.toast('سيتحول الفيديو إلى مسودة عند الحفظ'); },
    async cancelVideoSchedule(video) {
      const ok = await this.ask({ title: 'إلغاء الجدولة', icon: 'fa-calendar-xmark', tone: 'warn', confirmText: 'إلغاء الجدولة', message: `سيتحول «${video.title}» إلى مسودة ولن يُنشر في الموعد المحدد.` });
      if (!ok) return;
      const f = F();
      try { await f.updateDoc(f.doc(f.db, 'videos', video.id), { status: 'draft', publishAt: '', updatedAt: f.serverTimestamp() }); video.status = 'draft'; video.publishAt = ''; this.toast('تم إلغاء الجدولة'); }
      catch (e) { console.error(e); this.toast('تعذر إلغاء الجدولة'); }
    },
    afterVideoSave(wasEditing, data) {
      const prev = wasEditing ? this.videos.find(v => v.id === this.videoForm.id) : null;
      const prevStatus = prev ? this.effStatus(prev) : null;
      if (data.status === 'published' && prevStatus !== 'published') {
        this.notify('published', 'تم نشر فيديو', '«' + data.title + '»', { page: 'videos', id: this.videoForm.id || '' });
      }
    },
    /* نشر المجدولات التي حان موعدها + تنبيه بما اقترب موعده. المنشور للزوار يُحسب أصلًا من الوقت في الموقع العام. */
    async processSchedules() {
      if (this._schedBusy || !this.videos || !this.videos.length) return;
      this._schedBusy = true; const f = F();
      try {
        const now = Date.now();
        for (const v of this.videos) {
          if (v.status !== 'scheduled') continue;
          const at = Date.parse(v.publishAt); if (!at) continue;
          if (at <= now) {
            await f.updateDoc(f.doc(f.db, 'videos', v.id), { status: 'published', publishedAt: f.serverTimestamp() });
            v.status = 'published';
            this.notify('published', 'تم نشر فيديو مجدول', '«' + v.title + '»', { page: 'videos', id: v.id });
          } else if (at - now <= 86400000 && v.notifiedUpcoming !== true) {
            await f.updateDoc(f.doc(f.db, 'videos', v.id), { notifiedUpcoming: true });
            v.notifiedUpcoming = true;
            this.notify('upcoming', 'اقترب موعد نشر فيديو', '«' + v.title + '» — ' + fmtDate(at) + ' ' + fmtTime(at), { page: 'videos', id: v.id });
          }
        }
      } catch (e) { console.warn('processSchedules:', e && e.code, e); }
      finally { this._schedBusy = false; }
    },

    /* =================================================
       كشف المحتوى المكرر
    ================================================= */
    checkDuplicatesSoon() { clearTimeout(this._dupT); this._dupT = setTimeout(() => this.checkDuplicates(), 350); },
    checkDuplicates() {
      const f = this.videoForm; const url = (f.url || '').trim(); const title = normTitle(f.title);
      const key = videoKey(url); let best = { level: 'none', item: null, reasons: [] };
      if (title.length >= 3 || key) {
        for (const v of this.videos) {
          if (v.id === f.id) continue;
          const reasons = []; let level = 'none';
          if (key && videoKey(v.url) === key) { level = 'exact'; reasons.push(key.startsWith('url:') ? 'نفس الرابط' : 'نفس معرّف الفيديو'); }
          const sim = title.length >= 3 ? similarity(title, normTitle(v.title)) : 0;
          if (sim === 1) { if (level === 'none') level = 'maybe'; reasons.push('نفس العنوان'); }
          else if (sim >= 0.75) { if (level === 'none') level = 'maybe'; reasons.push('عنوان مشابه جدًا'); }
          if (level === 'exact' || (level === 'maybe' && best.level !== 'exact' && (best.level === 'none' || sim > (best._sim || 0)))) best = { level, item: v, reasons, _sim: sim };
          if (best.level === 'exact') break;
        }
      }
      this.dup = best;
      if (best.level !== 'none' && best.item) {
        const k = best.level + ':' + best.item.id + ':' + (f.id || 'new');
        if (!this._dupNotified[k]) {
          this._dupNotified[k] = true;
          this.notify('duplicate', 'تم اكتشاف محتوى مكرر', 'الفيديو: «' + (f.title || best.item.title) + '» — ' + best.reasons.join('، '), { page: 'videos', id: best.item.id });
        }
      }
    },

    /* =================================================
       التحديد المتعدد والعمليات الجماعية
    ================================================= */
    selList(sec) { return sec === 'videos' ? this.videos : sec === 'reviews' ? this.reviews : this.categories; },
    selColl(sec) { return sec === 'categories' ? 'videoCategories' : sec; },
    isSel(sec, id) { return this.selected[sec].includes(id); },
    toggleSel(sec, id) { const s = this.selected[sec]; const i = s.indexOf(id); i < 0 ? s.push(id) : s.splice(i, 1); },
    allSel(sec) { const l = this.selList(sec); return l.length > 0 && l.every(x => this.selected[sec].includes(x.id)); },
    toggleAllSel(sec) { this.selected[sec] = this.allSel(sec) ? [] : this.selList(sec).map(x => x.id); },
    clearSel(sec) { this.selected[sec] = []; },
    async bulkTrash(sec) {
      const ids = [...this.selected[sec]]; if (!ids.length || this.bulkBusy) return;
      const coll = this.selColl(sec), meta = COLL[coll];
      const ok = await this.ask({ title: 'نقل ' + ids.length + ' عناصر إلى السلة', icon: 'fa-trash-can', tone: 'warn', confirmText: 'نقل المحدد إلى السلة', message: 'ستُنقل العناصر المحددة إلى سلة المحذوفات وتختفي من الموقع العام، ويمكنك استعادتها لاحقًا.' });
      if (!ok) return;
      this.bulkBusy = true; let done = 0, fail = 0;
      for (const id of ids) {
        const it = this.selList(sec).find(x => x.id === id); if (!it) continue;
        try { await this.trashItem(coll, it); done++; } catch (e) { console.error(e); fail++; }
      }
      this.selected[sec] = [];
      try { await this[meta.reload](); } catch (_) {}
      await this.loadTrash(); this.bulkBusy = false;
      if (done) { this.toast('تم نقل ' + done + ' عنصر إلى السلة'); this.notify('deleted', 'حذف جماعي: ' + done + ' ' + meta.label, 'نُقلت إلى سلة المحذوفات', { page: 'trash' }); }
      if (fail) { this.toast('تعذر نقل ' + fail + ' عنصر'); this.notify('failed', 'فشل حذف ' + fail + ' عنصر', meta.section, { page: sec }); }
    },
    async bulkUpdate(sec, patch, okMsg) {
      const ids = [...this.selected[sec]]; if (!ids.length || this.bulkBusy) return;
      const f = F(), coll = this.selColl(sec); this.bulkBusy = true;
      try {
        for (let i = 0; i < ids.length; i += 400) {
          const b = f.writeBatch(f.db);
          ids.slice(i, i + 400).forEach(id => b.update(f.doc(f.db, coll, id), Object.assign({}, patch, { updatedAt: f.serverTimestamp() })));
          await b.commit();
        }
        this.selList(sec).forEach(x => { if (ids.includes(x.id)) Object.assign(x, patch); });
        this.selected[sec] = []; this.toast(okMsg);
        try { window.activity && window.activity.log({ type: 'update', action: 'عملية جماعية: ' + okMsg, details: ids.length + ' عنصر', collection: coll }); } catch (_) {}
      } catch (e) {
        console.error('bulk update failed:', e && e.code, e); this.toast('تعذر تنفيذ العملية الجماعية');
        this.notify('failed', 'فشلت عملية جماعية', (COLL[coll] || {}).section + ' — ' + ((e && e.code) || ''), { page: sec });
      } finally { this.bulkBusy = false; }
    },
    bulkShow(sec) { return this.bulkUpdate(sec, { visible: true }, 'تم إظهار العناصر المحددة'); },
    bulkHide(sec) { return this.bulkUpdate(sec, { visible: false }, 'تم إخفاء العناصر المحددة'); },
    bulkStatus(sec, status) { return this.bulkUpdate(sec, { status, publishAt: '' }, status === 'draft' ? 'تم تحويل المحدد إلى مسودة' : 'تم نشر العناصر المحددة'); }
  };
};
