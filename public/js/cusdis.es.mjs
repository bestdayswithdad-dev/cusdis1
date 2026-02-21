var Te = Object.defineProperty;
var qe = (t, e, r) => e in t ? Te(t, e, { enumerable: !0, configurable: !0, writable: !0, value: r }) : t[e] = r;
var ie = (t, e, r) => (qe(t, typeof e != "symbol" ? e + "" : e, r), r);
function T() {
}
function Re(t) {
  return t();
}
function me() {
  return /* @__PURE__ */ Object.create(null);
}
function U(t) {
  t.forEach(Re);
}
function Ae(t) {
  return typeof t == "function";
}
function ce(t, e) {
  return t != t ? e == e : t !== e || t && typeof t == "object" || typeof t == "function";
}
function Ue(t) {
  return Object.keys(t).length === 0;
}
function d(t, e) {
  t.appendChild(e);
}
function j(t, e, r) {
  t.insertBefore(e, r || null);
}
function M(t) {
  t.parentNode && t.parentNode.removeChild(t);
}
function ze(t, e) {
  for (let r = 0; r < t.length; r += 1)
    t[r] && t[r].d(e);
}
function v(t) {
  return document.createElement(t);
}
function Y(t) {
  return document.createTextNode(t);
}
function R() {
  return Y(" ");
}
function X() {
  return Y("");
}
function H(t, e, r, n) {
  return t.addEventListener(e, r, n), () => t.removeEventListener(e, r, n);
}
function p(t, e, r) {
  r == null ? t.removeAttribute(e) : t.getAttribute(e) !== r && t.setAttribute(e, r);
}
function Fe(t) {
  return Array.from(t.childNodes);
}
function re(t, e) {
  e = "" + e, t.data !== e && (t.data = /** @type {string} */
  e);
}
function z(t, e) {
  t.value = e ?? "";
}
function P(t, e, r) {
  t.classList.toggle(e, !!r);
}
let Q;
function G(t) {
  Q = t;
}
function fe() {
  if (!Q)
    throw new Error("Function called outside component initialization");
  return Q;
}
function pe(t) {
  fe().$$.on_mount.push(t);
}
function te(t, e) {
  return fe().$$.context.set(t, e), e;
}
function W(t) {
  return fe().$$.context.get(t);
}
const D = [], _e = [];
let J = [];
const he = [], De = /* @__PURE__ */ Promise.resolve();
let se = !1;
function He() {
  se || (se = !0, De.then(Oe));
}
function ae(t) {
  J.push(t);
}
const oe = /* @__PURE__ */ new Set();
let F = 0;
function Oe() {
  if (F !== 0)
    return;
  const t = Q;
  do {
    try {
      for (; F < D.length; ) {
        const e = D[F];
        F++, G(e), Je(e.$$);
      }
    } catch (e) {
      throw D.length = 0, F = 0, e;
    }
    for (G(null), D.length = 0, F = 0; _e.length; )
      _e.pop()();
    for (let e = 0; e < J.length; e += 1) {
      const r = J[e];
      oe.has(r) || (oe.add(r), r());
    }
    J.length = 0;
  } while (D.length);
  for (; he.length; )
    he.pop()();
  se = !1, oe.clear(), G(t);
}
function Je(t) {
  if (t.fragment !== null) {
    t.update(), U(t.before_update);
    const e = t.dirty;
    t.dirty = [-1], t.fragment && t.fragment.p(t.ctx, e), t.after_update.forEach(ae);
  }
}
function Ye(t) {
  const e = [], r = [];
  J.forEach((n) => t.indexOf(n) === -1 ? e.push(n) : r.push(n)), r.forEach((n) => n()), J = e;
}
const ne = /* @__PURE__ */ new Set();
let q;
function B() {
  q = {
    r: 0,
    c: [],
    p: q
    // parent group
  };
}
function K() {
  q.r || U(q.c), q = q.p;
}
function I(t, e) {
  t && t.i && (ne.delete(t), t.i(e));
}
function x(t, e, r, n) {
  if (t && t.o) {
    if (ne.has(t))
      return;
    ne.add(t), q.c.push(() => {
      ne.delete(t), n && (r && t.d(1), n());
    }), t.o(e);
  } else
    n && n();
}
function V(t) {
  return (t == null ? void 0 : t.length) !== void 0 ? t : Array.from(t);
}
function Me(t, e) {
  x(t, 1, 1, () => {
    e.delete(t.key);
  });
}
function xe(t, e, r, n, l, o, s, c, a, i, f, u) {
  let w = t.length, k = o.length, g = w;
  const y = {};
  for (; g--; )
    y[t[g].key] = g;
  const m = [], S = /* @__PURE__ */ new Map(), N = /* @__PURE__ */ new Map(), $ = [];
  for (g = k; g--; ) {
    const b = u(l, o, g), _ = r(b);
    let h = s.get(_);
    h ? n && $.push(() => h.p(b, e)) : (h = i(_, b), h.c()), S.set(_, m[g] = h), _ in y && N.set(_, Math.abs(g - y[_]));
  }
  const C = /* @__PURE__ */ new Set(), L = /* @__PURE__ */ new Set();
  function E(b) {
    I(b, 1), b.m(c, f), s.set(b.key, b), f = b.first, k--;
  }
  for (; w && k; ) {
    const b = m[k - 1], _ = t[w - 1], h = b.key, A = _.key;
    b === _ ? (f = b.first, w--, k--) : S.has(A) ? !s.has(h) || C.has(h) ? E(b) : L.has(A) ? w-- : N.get(h) > N.get(A) ? (L.add(h), E(b)) : (C.add(A), w--) : (a(_, s), w--);
  }
  for (; w--; ) {
    const b = t[w];
    S.has(b.key) || a(b, s);
  }
  for (; k; )
    E(m[k - 1]);
  return U($), m;
}
function le(t) {
  t && t.c();
}
function Z(t, e, r) {
  const { fragment: n, after_update: l } = t.$$;
  n && n.m(e, r), ae(() => {
    const o = t.$$.on_mount.map(Re).filter(Ae);
    t.$$.on_destroy ? t.$$.on_destroy.push(...o) : U(o), t.$$.on_mount = [];
  }), l.forEach(ae);
}
function ee(t, e) {
  const r = t.$$;
  r.fragment !== null && (Ye(r.after_update), U(r.on_destroy), r.fragment && r.fragment.d(e), r.on_destroy = r.fragment = null, r.ctx = []);
}
function Be(t, e) {
  t.$$.dirty[0] === -1 && (D.push(t), He(), t.$$.dirty.fill(0)), t.$$.dirty[e / 31 | 0] |= 1 << e % 31;
}
function ue(t, e, r, n, l, o, s = null, c = [-1]) {
  const a = Q;
  G(t);
  const i = t.$$ = {
    fragment: null,
    ctx: [],
    // state
    props: o,
    update: T,
    not_equal: l,
    bound: me(),
    // lifecycle
    on_mount: [],
    on_destroy: [],
    on_disconnect: [],
    before_update: [],
    after_update: [],
    context: new Map(e.context || (a ? a.$$.context : [])),
    // everything else
    callbacks: me(),
    dirty: c,
    skip_bound: !1,
    root: e.target || a.$$.root
  };
  s && s(i.root);
  let f = !1;
  if (i.ctx = r ? r(t, e.props || {}, (u, w, ...k) => {
    const g = k.length ? k[0] : w;
    return i.ctx && l(i.ctx[u], i.ctx[u] = g) && (!i.skip_bound && i.bound[u] && i.bound[u](g), f && Be(t, u)), w;
  }) : [], i.update(), f = !0, U(i.before_update), i.fragment = n ? n(i.ctx) : !1, e.target) {
    if (e.hydrate) {
      const u = Fe(e.target);
      i.fragment && i.fragment.l(u), u.forEach(M);
    } else
      i.fragment && i.fragment.c();
    e.intro && I(t.$$.fragment), Z(t, e.target, e.anchor), Oe();
  }
  G(a);
}
class de {
  constructor() {
    /**
     * ### PRIVATE API
     *
     * Do not use, may change at any time
     *
     * @type {any}
     */
    ie(this, "$$");
    /**
     * ### PRIVATE API
     *
     * Do not use, may change at any time
     *
     * @type {any}
     */
    ie(this, "$$set");
  }
  /** @returns {void} */
  $destroy() {
    ee(this, 1), this.$destroy = T;
  }
  /**
   * @template {Extract<keyof Events, string>} K
   * @param {K} type
   * @param {((e: Events[K]) => void) | null | undefined} callback
   * @returns {() => void}
   */
  $on(e, r) {
    if (!Ae(r))
      return T;
    const n = this.$$.callbacks[e] || (this.$$.callbacks[e] = []);
    return n.push(r), () => {
      const l = n.indexOf(r);
      l !== -1 && n.splice(l, 1);
    };
  }
  /**
   * @param {Partial<Props>} props
   * @returns {void}
   */
  $set(e) {
    this.$$set && !Ue(e) && (this.$$.skip_bound = !0, this.$$set(e), this.$$.skip_bound = !1);
  }
}
const Ke = "4";
typeof window < "u" && (window.__svelte || (window.__svelte = { v: /* @__PURE__ */ new Set() })).v.add(Ke);
const Ve = function t(e) {
  function r(l, o, s) {
    var c, a = {};
    if (Array.isArray(l))
      return l.concat(o);
    for (c in l)
      a[s ? c.toLowerCase() : c] = l[c];
    for (c in o) {
      var i = s ? c.toLowerCase() : c, f = o[c];
      a[i] = i in a && typeof f == "object" ? r(a[i], f, i === "headers") : f;
    }
    return a;
  }
  function n(l, o, s, c) {
    typeof l != "string" && (l = (o = l).url);
    var a = { config: o }, i = r(e, o), f = {}, u = c || i.data;
    (i.transformRequest || []).map(function(g) {
      u = g(u, i.headers) || u;
    }), u && typeof u == "object" && typeof u.append != "function" && (u = JSON.stringify(u), f["content-type"] = "application/json");
    var w = typeof document < "u" && document.cookie.match(RegExp("(^|; )" + i.xsrfCookieName + "=([^;]*)"));
    if (w && (f[i.xsrfHeaderName] = w[2]), i.auth && (f.authorization = i.auth), i.baseURL && (l = l.replace(/^(?!.*\/\/)\/?(.*)$/, i.baseURL + "/$1")), i.params) {
      var k = ~l.indexOf("?") ? "&" : "?";
      l += k + (i.paramsSerializer ? i.paramsSerializer(i.params) : new URLSearchParams(i.params));
    }
    return (i.fetch || fetch)(l, { method: s || i.method, body: u, headers: r(i.headers, f, !0), credentials: i.withCredentials ? "include" : "same-origin" }).then(function(g) {
      for (var y in g)
        typeof g[y] != "function" && (a[y] = g[y]);
      var m = i.validateStatus ? i.validateStatus(g.status) : g.ok;
      return i.responseType == "stream" ? (a.data = g.body, a) : g[i.responseType || "text"]().then(function(S) {
        a.data = S, a.data = JSON.parse(S);
      }).catch(Object).then(function() {
        return m ? a : Promise.reject(a);
      });
    });
  }
  return e = e || {}, n.request = n, n.get = function(l, o) {
    return n(l, o, "get");
  }, n.delete = function(l, o) {
    return n(l, o, "delete");
  }, n.head = function(l, o) {
    return n(l, o, "head");
  }, n.options = function(l, o) {
    return n(l, o, "options");
  }, n.post = function(l, o, s) {
    return n(l, s, "post", o);
  }, n.put = function(l, o, s) {
    return n(l, s, "put", o);
  }, n.patch = function(l, o, s) {
    return n(l, s, "patch", o);
  }, n.all = Promise.all.bind(Promise), n.spread = function(l) {
    return function(o) {
      return l.apply(this, o);
    };
  }, n.CancelToken = typeof AbortController == "function" ? AbortController : Object, n.defaults = e, n.create = t, n;
}(), ge = {
  powered_by: "Comments powered by Cusdis",
  post_comment: "Comment",
  loading: "Loading",
  // comment
  email: "Email (optional)",
  nickname: "Nickname",
  reply_placeholder: "Reply...",
  reply_btn: "Reply",
  sending: "sending...",
  // reply
  mod_badge: "MOD",
  content_is_required: "Content is required",
  nickname_is_required: "Nickname is required",
  comment_has_been_sent: "Your comment has been sent. Please wait for approval."
};
function O(t) {
  const r = window["CUSDIS_LOCALE"] || ge, n = r[t] || ge[t];
  return r[t] || console.warn(
    "[cusdis]",
    "translation of language key",
    `'${t}'`,
    "is missing."
  ), n;
}
function We(t) {
  let e, r, n, l, o, s, c, a, i, f, u, w, k, g, y, m, S, N, $, C = (
    /*loading*/
    (t[3] ? O("sending") : O("post_comment")) + ""
  ), L, E, b;
  return {
    c() {
      e = v("div"), r = v("div"), n = v("div"), l = v("label"), l.textContent = `${O("nickname")}`, o = R(), s = v("input"), c = R(), a = v("div"), i = v("label"), i.textContent = `${O("email")}`, f = R(), u = v("input"), w = R(), k = v("div"), g = v("label"), g.textContent = `${O("reply_placeholder")}`, y = R(), m = v("textarea"), S = R(), N = v("div"), $ = v("button"), L = Y(C), p(l, "class", "mb-2 block dark:text-gray-200"), p(l, "for", "nickname"), p(s, "name", "nickname"), p(s, "class", "w-full p-2 border border-gray-200 bg-transparent dark:text-gray-100 dark:outline-none"), p(s, "type", "text"), p(s, "title", O("nickname")), p(n, "class", "px-1"), p(i, "class", "mb-2 block dark:text-gray-200"), p(i, "for", "email"), p(u, "name", "email"), p(u, "class", "w-full p-2 border border-gray-200 bg-transparent dark:text-gray-100 dark:outline-none"), p(u, "type", "email"), p(u, "title", O("email")), p(a, "class", "px-1"), p(r, "class", "grid grid-cols-2 gap-4"), p(g, "class", "mb-2 block dark:text-gray-200"), p(g, "for", "reply_content"), p(m, "name", "reply_content"), p(m, "class", "w-full p-2 border border-gray-200 h-24 bg-transparent dark:text-gray-100 dark:outline-none"), p(m, "title", O("reply_placeholder")), p(k, "class", "px-1"), p($, "class", "text-sm bg-gray-200 p-2 px-4 font-bold dark:bg-transparent dark:border dark:border-gray-100"), P(
        $,
        "cusdis-disabled",
        /*loading*/
        t[3]
      ), p(N, "class", "px-1"), p(e, "class", "grid grid-cols-1 gap-4");
    },
    m(_, h) {
      j(_, e, h), d(e, r), d(r, n), d(n, l), d(n, o), d(n, s), z(
        s,
        /*nickname*/
        t[1]
      ), d(r, c), d(r, a), d(a, i), d(a, f), d(a, u), z(
        u,
        /*email*/
        t[2]
      ), d(e, w), d(e, k), d(k, g), d(k, y), d(k, m), z(
        m,
        /*content*/
        t[0]
      ), d(e, S), d(e, N), d(N, $), d($, L), E || (b = [
        H(
          s,
          "input",
          /*input0_input_handler*/
          t[7]
        ),
        H(
          u,
          "input",
          /*input1_input_handler*/
          t[8]
        ),
        H(
          m,
          "input",
          /*textarea_input_handler*/
          t[9]
        ),
        H(
          $,
          "click",
          /*addComment*/
          t[4]
        )
      ], E = !0);
    },
    p(_, [h]) {
      h & /*nickname*/
      2 && s.value !== /*nickname*/
      _[1] && z(
        s,
        /*nickname*/
        _[1]
      ), h & /*email*/
      4 && u.value !== /*email*/
      _[2] && z(
        u,
        /*email*/
        _[2]
      ), h & /*content*/
      1 && z(
        m,
        /*content*/
        _[0]
      ), h & /*loading*/
      8 && C !== (C = /*loading*/
      (_[3] ? O("sending") : O("post_comment")) + "") && re(L, C), h & /*loading*/
      8 && P(
        $,
        "cusdis-disabled",
        /*loading*/
        _[3]
      );
    },
    i: T,
    o: T,
    d(_) {
      _ && M(e), E = !1, U(b);
    }
  };
}
function Ge(t, e, r) {
  let { parentId: n } = e, l = "", o = "", s = "", c = !1, { onSuccess: a } = e;
  const i = W("api"), f = W("setMessage"), { appId: u, pageId: w, pageUrl: k, pageTitle: g } = W("attrs"), y = W("refresh");
  async function m() {
    if (!l) {
      alert(O("content_is_required"));
      return;
    }
    if (!o) {
      alert(O("nickname_is_required"));
      return;
    }
    try {
      r(3, c = !0);
      const L = await i.post("/api/open/comments", {
        appId: u,
        pageId: w,
        content: l,
        nickname: o,
        email: s,
        parentId: n,
        pageUrl: k,
        pageTitle: g
      });
      await y(), S(), f(O("comment_has_been_sent"));
    } finally {
      r(3, c = !1);
    }
  }
  function S() {
    r(0, l = ""), r(1, o = ""), r(2, s = ""), a && a();
  }
  function N() {
    o = this.value, r(1, o);
  }
  function $() {
    s = this.value, r(2, s);
  }
  function C() {
    l = this.value, r(0, l);
  }
  return t.$$set = (L) => {
    "parentId" in L && r(5, n = L.parentId), "onSuccess" in L && r(6, a = L.onSuccess);
  }, [
    l,
    o,
    s,
    c,
    m,
    n,
    a,
    N,
    $,
    C
  ];
}
class je extends de {
  constructor(e) {
    super(), ue(this, e, Ge, We, ce, { parentId: 5, onSuccess: 6 });
  }
}
function be(t, e, r) {
  const n = t.slice();
  return n[6] = e[r], n;
}
function ye(t) {
  let e, r;
  return {
    c() {
      e = v("div"), r = v("span"), r.textContent = `${O("mod_badge")}`, p(e, "class", "mr-2 dark:bg-gray-500 bg-gray-200 text-xs py-0.5 px-1 rounded dark:text-gray-100");
    },
    m(n, l) {
      j(n, e, l), d(e, r);
    },
    d(n) {
      n && M(e);
    }
  };
}
function ke(t) {
  let e = [], r = /* @__PURE__ */ new Map(), n, l, o = V(
    /*comment*/
    t[1].replies.data
  );
  const s = (c) => (
    /*child*/
    c[6].id
  );
  for (let c = 0; c < o.length; c += 1) {
    let a = be(t, o, c), i = s(a);
    r.set(i, e[c] = we(i, a));
  }
  return {
    c() {
      for (let c = 0; c < e.length; c += 1)
        e[c].c();
      n = X();
    },
    m(c, a) {
      for (let i = 0; i < e.length; i += 1)
        e[i] && e[i].m(c, a);
      j(c, n, a), l = !0;
    },
    p(c, a) {
      a & /*comment*/
      2 && (o = V(
        /*comment*/
        c[1].replies.data
      ), B(), e = xe(e, a, s, 1, c, o, r, n.parentNode, Me, we, n, be), K());
    },
    i(c) {
      if (!l) {
        for (let a = 0; a < o.length; a += 1)
          I(e[a]);
        l = !0;
      }
    },
    o(c) {
      for (let a = 0; a < e.length; a += 1)
        x(e[a]);
      l = !1;
    },
    d(c) {
      c && M(n);
      for (let a = 0; a < e.length; a += 1)
        e[a].d(c);
    }
  };
}
function we(t, e) {
  let r, n, l;
  return n = new Pe({
    props: { isChild: !0, comment: (
      /*child*/
      e[6]
    ) }
  }), {
    key: t,
    first: null,
    c() {
      r = X(), le(n.$$.fragment), this.first = r;
    },
    m(o, s) {
      j(o, r, s), Z(n, o, s), l = !0;
    },
    p(o, s) {
      e = o;
      const c = {};
      s & /*comment*/
      2 && (c.comment = /*child*/
      e[6]), n.$set(c);
    },
    i(o) {
      l || (I(n.$$.fragment, o), l = !0);
    },
    o(o) {
      x(n.$$.fragment, o), l = !1;
    },
    d(o) {
      o && M(r), ee(n, o);
    }
  };
}
function ve(t) {
  let e, r, n;
  return r = new je({
    props: {
      parentId: (
        /*comment*/
        t[1].id
      ),
      onSuccess: (
        /*func*/
        t[5]
      )
    }
  }), {
    c() {
      e = v("div"), le(r.$$.fragment), p(e, "class", "mt-4 pl-4 border-l-2 border-gray-200");
    },
    m(l, o) {
      j(l, e, o), Z(r, e, null), n = !0;
    },
    p(l, o) {
      const s = {};
      o & /*comment*/
      2 && (s.parentId = /*comment*/
      l[1].id), o & /*showReplyForm*/
      1 && (s.onSuccess = /*func*/
      l[5]), r.$set(s);
    },
    i(l) {
      n || (I(r.$$.fragment, l), n = !0);
    },
    o(l) {
      x(r.$$.fragment, l), n = !1;
    },
    d(l) {
      l && M(e), ee(r);
    }
  };
}
function Qe(t) {
  let e, r, n, l = (
    /*comment*/
    (t[1].moderator && /*comment*/
    t[1].moderator.displayName ? (
      /*comment*/
      t[1].moderator.displayName
    ) : (
      /*comment*/
      t[1].by_nickname
    )) + ""
  ), o, s, c, a, i = (
    /*comment*/
    t[1].parsedCreatedAt + ""
  ), f, u, w, k = (
    /*comment*/
    t[1].parsedContent + ""
  ), g, y, m, S, N, $, C, L, E = (
    /*comment*/
    t[1].moderatorId && ye()
  ), b = (
    /*comment*/
    t[1].replies.data.length > 0 && ke(t)
  ), _ = (
    /*showReplyForm*/
    t[0] && ve(t)
  );
  return {
    c() {
      e = v("div"), r = v("div"), n = v("div"), o = Y(l), s = R(), E && E.c(), c = R(), a = v("div"), f = Y(i), u = R(), w = v("div"), g = R(), b && b.c(), y = R(), m = v("div"), S = v("button"), S.textContent = `${O("reply_btn")}`, N = R(), _ && _.c(), p(n, "class", "mr-2 font-medium dark:text-gray-100"), p(r, "class", "flex items-center"), p(a, "class", "text-gray-500 text-sm dark:text-gray-400"), p(w, "class", "text-gray-500 my-2 dark:text-gray-200"), p(S, "class", "font-medium text-sm text-gray-500 dark:bg-transparent dark:text-gray-100"), p(S, "type", "button"), p(e, "class", "my-4"), P(
        e,
        "pl-4",
        /*isChild*/
        t[2]
      ), P(
        e,
        "border-l-2",
        /*isChild*/
        t[2]
      ), P(
        e,
        "border-color-gray-200",
        /*isChild*/
        t[2]
      ), P(
        e,
        "cusdis-indicator",
        /*showIndicator*/
        t[3]
      );
    },
    m(h, A) {
      j(h, e, A), d(e, r), d(r, n), d(n, o), d(r, s), E && E.m(r, null), d(e, c), d(e, a), d(a, f), d(e, u), d(e, w), w.innerHTML = k, d(e, g), b && b.m(e, null), d(e, y), d(e, m), d(m, S), d(e, N), _ && _.m(e, null), $ = !0, C || (L = H(
        S,
        "click",
        /*click_handler*/
        t[4]
      ), C = !0);
    },
    p(h, [A]) {
      (!$ || A & /*comment*/
      2) && l !== (l = /*comment*/
      (h[1].moderator && /*comment*/
      h[1].moderator.displayName ? (
        /*comment*/
        h[1].moderator.displayName
      ) : (
        /*comment*/
        h[1].by_nickname
      )) + "") && re(o, l), /*comment*/
      h[1].moderatorId ? E || (E = ye(), E.c(), E.m(r, null)) : E && (E.d(1), E = null), (!$ || A & /*comment*/
      2) && i !== (i = /*comment*/
      h[1].parsedCreatedAt + "") && re(f, i), (!$ || A & /*comment*/
      2) && k !== (k = /*comment*/
      h[1].parsedContent + "") && (w.innerHTML = k), /*comment*/
      h[1].replies.data.length > 0 ? b ? (b.p(h, A), A & /*comment*/
      2 && I(b, 1)) : (b = ke(h), b.c(), I(b, 1), b.m(e, y)) : b && (B(), x(b, 1, 1, () => {
        b = null;
      }), K()), /*showReplyForm*/
      h[0] ? _ ? (_.p(h, A), A & /*showReplyForm*/
      1 && I(_, 1)) : (_ = ve(h), _.c(), I(_, 1), _.m(e, null)) : _ && (B(), x(_, 1, 1, () => {
        _ = null;
      }), K()), (!$ || A & /*isChild*/
      4) && P(
        e,
        "pl-4",
        /*isChild*/
        h[2]
      ), (!$ || A & /*isChild*/
      4) && P(
        e,
        "border-l-2",
        /*isChild*/
        h[2]
      ), (!$ || A & /*isChild*/
      4) && P(
        e,
        "border-color-gray-200",
        /*isChild*/
        h[2]
      );
    },
    i(h) {
      $ || (I(b), I(_), $ = !0);
    },
    o(h) {
      x(b), x(_), $ = !1;
    },
    d(h) {
      h && M(e), E && E.d(), b && b.d(), _ && _.d(), C = !1, L();
    }
  };
}
function Xe(t, e, r) {
  let { comment: n } = e, { showReplyForm: l = !1 } = e, { isChild: o = !1 } = e;
  const { showIndicator: s } = W("attrs"), c = (i) => {
    r(0, l = !l);
  }, a = () => {
    r(0, l = !1);
  };
  return t.$$set = (i) => {
    "comment" in i && r(1, n = i.comment), "showReplyForm" in i && r(0, l = i.showReplyForm), "isChild" in i && r(2, o = i.isChild);
  }, [l, n, o, s, c, a];
}
class Pe extends de {
  constructor(e) {
    super(), ue(this, e, Xe, Qe, ce, { comment: 1, showReplyForm: 0, isChild: 2 });
  }
}
function Ce(t, e, r) {
  const n = t.slice();
  return n[12] = e[r], n[14] = r, n;
}
function Se(t, e, r) {
  const n = t.slice();
  return n[15] = e[r], n;
}
function $e(t) {
  let e, r, n, l, o, s, c, a, i, f, u, w, k, g, y, m = (
    /*message*/
    t[4] && Ee(t)
  );
  n = new je({});
  const S = [et, Ze], N = [];
  function $(C, L) {
    return (
      /*loadingComments*/
      C[3] ? 0 : 1
    );
  }
  return a = $(t), i = N[a] = S[a](t), {
    c() {
      e = v("div"), m && m.c(), r = R(), le(n.$$.fragment), l = R(), o = v("div"), s = R(), c = v("div"), i.c(), f = R(), u = v("div"), w = R(), k = v("div"), g = v("a"), g.textContent = `${O("powered_by")}`, p(o, "class", "my-8"), p(c, "class", "mt-4 px-1"), p(u, "class", "my-8"), p(g, "class", "underline "), p(g, "href", "https://cusdis.com"), p(k, "class", "text-center text-gray-500 dark:text-gray-100 text-xs"), P(
        e,
        "dark",
        /*theme*/
        t[1] === "dark"
      );
    },
    m(C, L) {
      j(C, e, L), m && m.m(e, null), d(e, r), Z(n, e, null), d(e, l), d(e, o), d(e, s), d(e, c), N[a].m(c, null), d(e, f), d(e, u), d(e, w), d(e, k), d(k, g), y = !0;
    },
    p(C, L) {
      /*message*/
      C[4] ? m ? m.p(C, L) : (m = Ee(C), m.c(), m.m(e, r)) : m && (m.d(1), m = null);
      let E = a;
      a = $(C), a === E ? N[a].p(C, L) : (B(), x(N[E], 1, 1, () => {
        N[E] = null;
      }), K(), i = N[a], i ? i.p(C, L) : (i = N[a] = S[a](C), i.c()), I(i, 1), i.m(c, null)), (!y || L & /*theme*/
      2) && P(
        e,
        "dark",
        /*theme*/
        C[1] === "dark"
      );
    },
    i(C) {
      y || (I(n.$$.fragment, C), I(i), y = !0);
    },
    o(C) {
      x(n.$$.fragment, C), x(i), y = !1;
    },
    d(C) {
      C && M(e), m && m.d(), ee(n), N[a].d();
    }
  };
}
function Ee(t) {
  let e, r;
  return {
    c() {
      e = v("div"), r = Y(
        /*message*/
        t[4]
      ), p(e, "class", "p-2 mb-4 bg-blue-500 text-white");
    },
    m(n, l) {
      j(n, e, l), d(e, r);
    },
    p(n, l) {
      l & /*message*/
      16 && re(
        r,
        /*message*/
        n[4]
      );
    },
    d(n) {
      n && M(e);
    }
  };
}
function Ze(t) {
  let e = [], r = /* @__PURE__ */ new Map(), n, l, o, s = V(
    /*commentsResult*/
    t[0].data
  );
  const c = (i) => (
    /*comment*/
    i[15].id
  );
  for (let i = 0; i < s.length; i += 1) {
    let f = Se(t, s, i), u = c(f);
    r.set(u, e[i] = Le(u, f));
  }
  let a = (
    /*commentsResult*/
    t[0].pageCount > 1 && Ne(t)
  );
  return {
    c() {
      for (let i = 0; i < e.length; i += 1)
        e[i].c();
      n = R(), a && a.c(), l = X();
    },
    m(i, f) {
      for (let u = 0; u < e.length; u += 1)
        e[u] && e[u].m(i, f);
      j(i, n, f), a && a.m(i, f), j(i, l, f), o = !0;
    },
    p(i, f) {
      f & /*commentsResult*/
      1 && (s = V(
        /*commentsResult*/
        i[0].data
      ), B(), e = xe(e, f, c, 1, i, s, r, n.parentNode, Me, Le, n, Se), K()), /*commentsResult*/
      i[0].pageCount > 1 ? a ? a.p(i, f) : (a = Ne(i), a.c(), a.m(l.parentNode, l)) : a && (a.d(1), a = null);
    },
    i(i) {
      if (!o) {
        for (let f = 0; f < s.length; f += 1)
          I(e[f]);
        o = !0;
      }
    },
    o(i) {
      for (let f = 0; f < e.length; f += 1)
        x(e[f]);
      o = !1;
    },
    d(i) {
      i && (M(n), M(l));
      for (let f = 0; f < e.length; f += 1)
        e[f].d(i);
      a && a.d(i);
    }
  };
}
function et(t) {
  let e;
  return {
    c() {
      e = v("div"), e.textContent = `${O("loading")}...`, p(e, "class", "text-gray-900 dark:text-gray-100");
    },
    m(r, n) {
      j(r, e, n);
    },
    p: T,
    i: T,
    o: T,
    d(r) {
      r && M(e);
    }
  };
}
function Le(t, e) {
  let r, n, l;
  return n = new Pe({
    props: {
      comment: (
        /*comment*/
        e[15]
      ),
      firstFloor: !0
    }
  }), {
    key: t,
    first: null,
    c() {
      r = X(), le(n.$$.fragment), this.first = r;
    },
    m(o, s) {
      j(o, r, s), Z(n, o, s), l = !0;
    },
    p(o, s) {
      e = o;
      const c = {};
      s & /*commentsResult*/
      1 && (c.comment = /*comment*/
      e[15]), n.$set(c);
    },
    i(o) {
      l || (I(n.$$.fragment, o), l = !0);
    },
    o(o) {
      x(n.$$.fragment, o), l = !1;
    },
    d(o) {
      o && M(r), ee(n, o);
    }
  };
}
function Ne(t) {
  let e, r = V(Array(
    /*commentsResult*/
    t[0].pageCount
  )), n = [];
  for (let l = 0; l < r.length; l += 1)
    n[l] = Ie(Ce(t, r, l));
  return {
    c() {
      e = v("div");
      for (let l = 0; l < n.length; l += 1)
        n[l].c();
    },
    m(l, o) {
      j(l, e, o);
      for (let s = 0; s < n.length; s += 1)
        n[s] && n[s].m(e, null);
    },
    p(l, o) {
      if (o & /*page, onClickPage, commentsResult*/
      69) {
        r = V(Array(
          /*commentsResult*/
          l[0].pageCount
        ));
        let s;
        for (s = 0; s < r.length; s += 1) {
          const c = Ce(l, r, s);
          n[s] ? n[s].p(c, o) : (n[s] = Ie(c), n[s].c(), n[s].m(e, null));
        }
        for (; s < n.length; s += 1)
          n[s].d(1);
        n.length = r.length;
      }
    },
    d(l) {
      l && M(e), ze(n, l);
    }
  };
}
function Ie(t) {
  let e, r, n;
  function l(...o) {
    return (
      /*click_handler*/
      t[8](
        /*index*/
        t[14],
        ...o
      )
    );
  }
  return {
    c() {
      e = v("button"), e.textContent = `${/*index*/
      t[14] + 1}`, p(e, "class", "px-2 py-1 text-sm mr-2 dark:text-gray-200"), P(
        e,
        "underline",
        /*page*/
        t[2] === /*index*/
        t[14] + 1
      );
    },
    m(o, s) {
      j(o, e, s), r || (n = H(e, "click", l), r = !0);
    },
    p(o, s) {
      t = o, s & /*page*/
      4 && P(
        e,
        "underline",
        /*page*/
        t[2] === /*index*/
        t[14] + 1
      );
    },
    d(o) {
      o && M(e), r = !1, n();
    }
  };
}
function tt(t) {
  let e, r, n = !/*error*/
  t[5] && $e(t);
  return {
    c() {
      n && n.c(), e = X();
    },
    m(l, o) {
      n && n.m(l, o), j(l, e, o), r = !0;
    },
    p(l, [o]) {
      /*error*/
      l[5] ? n && (B(), x(n, 1, 1, () => {
        n = null;
      }), K()) : n ? (n.p(l, o), o & /*error*/
      32 && I(n, 1)) : (n = $e(l), n.c(), I(n, 1), n.m(e.parentNode, e));
    },
    i(l) {
      r || (I(n), r = !0);
    },
    o(l) {
      x(n), r = !1;
    },
    d(l) {
      l && M(e), n && n.d(l);
    }
  };
}
function nt(t, e, r) {
  let { attrs: n } = e, { commentsResult: l } = e, o = 1, s = !0, c = "", a, i = n.theme || "light";
  const f = Ve.create({ baseURL: n.host });
  function u(y) {
    r(4, c = y);
  }
  pe(() => {
    function y(m) {
      try {
        const S = JSON.parse(m.data);
        if (S.from === "cusdis")
          switch (S.event) {
            case "setTheme":
              r(1, i = S.data);
              break;
          }
      } catch {
      }
    }
    return window.addEventListener("message", y), () => {
      window.removeEventListener("message", y);
    };
  }), te("api", f), te("attrs", n), te("refresh", w), te("setMessage", u);
  async function w(y = 1) {
    r(3, s = !0);
    try {
      const m = await f.get("/api/open/comments", {
        headers: {
          "x-timezone-offset": -(/* @__PURE__ */ new Date()).getTimezoneOffset()
        },
        params: {
          page: y,
          appId: n.appId,
          pageId: n.pageId
        }
      });
      r(0, l = m.data.data);
    } catch (m) {
      r(5, a = m);
    } finally {
      r(3, s = !1);
    }
  }
  function k(y) {
    r(2, o = y), w(y);
  }
  pe(() => {
    w();
  });
  const g = (y, m) => k(y + 1);
  return t.$$set = (y) => {
    "attrs" in y && r(7, n = y.attrs), "commentsResult" in y && r(0, l = y.commentsResult);
  }, t.$$.update = () => {
    t.$$.dirty & /*theme*/
    2 && document.documentElement.style.setProperty("color-scheme", i);
  }, [
    l,
    i,
    o,
    s,
    c,
    a,
    k,
    n,
    g
  ];
}
class rt extends de {
  constructor(e) {
    super(), ue(this, e, nt, tt, ce, { attrs: 7, commentsResult: 0 });
  }
}
const it = rt;
export {
  it as cusdis,
  rt as default
};
/* ============================================
   BDWD EXECUTIVE BRANDING INJECTION (v5.3)
   ============================================ */
(function() {
  const style = document.createElement('style');
  style.textContent = `
    /* 1. LABEL HEADERS: Montserrat Grey 4px Spacing */
    #cusdis_thread label {
        display: block !important;
        font-family: 'Montserrat', sans-serif !important;
        font-size: 16px !important;
        text-transform: uppercase !important;
        letter-spacing: 4px !important;
        color: #94a3b8 !important;
        font-weight: 800 !important;
        margin-bottom: 12px !important;
        margin-top: 20px !important;
        text-align: left !important;
    }

    /* 2. COMMENTER NAMES: BDWD Blue */
    #cusdis_thread [class*="nickname"], 
    #cusdis_thread b,
    #cusdis_thread div[class*="font-medium"] {
        display: block !important;
        font-family: 'Montserrat', sans-serif !important;
        font-weight: 900 !important;
        font-size: 17px !important;
        color: #007bff !important;
        text-transform: uppercase !important;
        margin-bottom: 2px !important;
    }

    /* 3. TIMESTAMPS: Light Black / Slate */
    #cusdis_thread time, 
    #cusdis_thread [class*="text-gray-500 text-sm"] {
        display: block !important;
        font-family: 'Montserrat', sans-serif !important;
        font-size: 11px !important;
        font-weight: 600 !important;
        color: #1a202c !important;
        opacity: 0.6 !important;
        text-transform: uppercase !important;
        letter-spacing: 1px !important;
        margin-bottom: 10px !important;
    }

    /* 4. THE BUTTON: Blue Brutalist with Black Shadow */
    #cusdis_thread button[type="submit"],
    #cusdis_thread button:not([class*="reply"]) {
        background: #007bff !important;
        color: #ffffff !important;
        font-family: 'Montserrat', sans-serif !important;
        font-weight: 800 !important;
        text-transform: uppercase !important;
        letter-spacing: 2px !important;
        padding: 14px 35px !important;
        border: 2px solid #000000 !important;
        border-radius: 4px !important;
        box-shadow: 4px 4px 0px #000000 !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        margin-top: 15px !important;
    }

    /* 5. INPUT FIELDS: Clean Executive Sharp Borders */
    #cusdis_thread input, 
    #cusdis_thread textarea {
        border: 1.5px solid #000000 !important;
        border-radius: 4px !important;
        padding: 12px !important;
        font-family: 'Montserrat', sans-serif !important;
        background: #ffffff !important;
    }
  `;
  document.head.appendChild(style);
})();
