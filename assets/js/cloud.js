/* DemoTu.com 云服务访问层：邮箱验证码登录、号主绑定、发布内容读写。
 * 所有数据访问都通过 WorkBuddy Cloud SDK；公开页面只读 status=published 的行。 */
(function () {
  'use strict';

  var CFG = window.DemoTuCloudConfig || {};
  var api = { available: false, client: null };

  function noopResult(msg) { return Promise.resolve({ data: null, error: { message: msg || '云服务暂不可用' } }); }

  if (!CFG.endpoint || !CFG.publishableKey || !window.WorkBuddyCloud) {
    api.session = function () { return Promise.resolve({ data: null, error: null }); };
    api.signIn = function () { return noopResult('云服务未加载，请稍后刷新重试'); };
    api.verify = function () { return noopResult('云服务未加载，请稍后刷新重试'); };
    api.signOut = function () { return Promise.resolve({ error: null }); };
    api.isOwner = function () { return Promise.resolve(false); };
    api.bindOwner = function () { return noopResult('云服务未加载'); };
    api.list = function () { return Promise.resolve([]); };
    api.save = function () { return noopResult('云服务未加载'); };
    api.remove = function () { return noopResult('云服务未加载'); };
    api.onAuth = function () {};
    window.DemoTuCloud = api;
    return;
  }

  var cloud = window.WorkBuddyCloud.createWorkBuddyCloud({
    endpoint: CFG.endpoint,
    oauthRelayBaseUrl: CFG.oauthRelayBaseUrl,
    publishableKey: CFG.publishableKey
  });
  api.available = true;
  api.client = cloud;

  function unwrap(res) {
    if (res && res.error) throw res.error;
    return res ? res.data : null;
  }

  api.session = async function () {
    var res = await cloud.auth.getSession();
    return res && !res.error ? res : { data: null, error: res && res.error };
  };

  api.signIn = function (email) {
    return cloud.auth.sendOtp({ email: String(email || '').trim() });
  };

  api.verify = function (email, verificationId, isExistingUser, token) {
    return cloud.auth.verifyOtp({
      email: String(email || '').trim(),
      verificationId: verificationId,
      isExistingUser: !!isExistingUser,
      token: String(token || '').trim()
    });
  };

  api.signOut = function () { return cloud.auth.signOut(); };

  api.onAuth = function (cb) {
    if (typeof cb === 'function' && cloud.auth.onAuthStateChange) cloud.auth.onAuthStateChange(cb);
  };

  api.isOwner = async function () {
    var sess = await api.session();
    if (!sess.data || !sess.data.user) return false;
    var res = await cloud.database.from('demotu_owner').select('id').eq('owner_id', sess.data.user.id);
    return !res.error && Array.isArray(res.data) && res.data.length > 0;
  };

  api.bindOwner = async function (email) {
    var sess = await api.session();
    if (!sess.data || !sess.data.user) return { data: null, error: { message: '请先登录' } };
    var check = await cloud.database.from('demotu_owner').select('id').eq('owner_id', sess.data.user.id);
    if (check.error) return { data: null, error: check.error };
    if (check.data && check.data.length) return { data: check.data[0], error: null };
    // 只传 email，owner_id 交给数据库 DEFAULT auth.uid() 填充；显式 null 会被 RLS 拒绝。
    var payload = { email: email || null };
    var res = await cloud.database.from('demotu_owner').insert(payload).select();
    if (res && res.error) return { data: null, error: res.error };
    // 写入成功但 .select() 因 RLS 读不到自己行时，视为绑定成功（后续 isOwner 会再确认）。
    var created = res && Array.isArray(res.data) ? res.data[0] : null;
    return { data: created || { owner_id: sess.data.user.id }, error: null };
  };

  api.list = async function (kind) {
    var q = cloud.database.from('demotu_content').select('*')
      .eq('status', 'published')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (kind) q = q.eq('kind', kind);
    var res = await q;
    if (res.error) return [];
    return Array.isArray(res.data) ? res.data : [];
  };

  api.all = function () { return api.list(null); };

  api.getProfile = async function () {
    var rows = await api.list('profile');
    return rows.length ? rows[0] : null;
  };

  api.save = async function (row) {
    var payload = {
      kind: row.kind,
      status: row.status === 'draft' ? 'draft' : 'published',
      title: row.title || null,
      body: row.body || null,
      image_data: row.image_data || null,
      media_url: row.media_url || null,
      meta: row.meta || {},
      sort_order: Number(row.sort_order || 0)
    };
    if (row.id) {
      var upd = await cloud.database.from('demotu_content').update(payload).eq('id', row.id).select();
      if (upd.error) return { data: null, error: upd.error };
      if (!upd.data || !upd.data.length) return { data: null, error: { message: '没有权限修改这条内容' } };
      return { data: upd.data[0], error: null };
    }
    var ins = await cloud.database.from('demotu_content').insert(payload).select();
    if (ins.error) return { data: null, error: ins.error };
    return { data: ins.data && ins.data[0], error: null };
  };

  api.remove = async function (id) {
    var res = await cloud.database.from('demotu_content').delete().eq('id', id).select();
    if (res.error) return { data: null, error: res.error };
    if (!res.data || !res.data.length) return { data: null, error: { message: '没有权限删除这条内容' } };
    return { data: res.data[0], error: null };
  };

  window.DemoTuCloud = api;
})();
