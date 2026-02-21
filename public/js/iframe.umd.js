(function (R) {
  typeof define == "function" && define.amd ? define(R) : R();
})(function () {
  "use strict";
  var st = Object.defineProperty;
  var at = (R, T, P) =>
    T in R
      ? st(R, T, { enumerable: !0, configurable: !0, writable: !0, value: P })
      : (R[T] = P);
  var pe = (R, T, P) => (at(R, typeof T != "symbol" ? T + "" : T, P), P);
  function R() {}
  function T(t) {
    return t();
  }
  function P() {
    return Object.create(null);
  }
  function U(t) {
    t.forEach(T);
  }
  function _e(t) {
    return typeof t == "function";
  }
  function se(t, e) {
    return t != t
      ? e == e
      : t !== e || (t && typeof t == "object") || typeof t == "function";
  }
  function Ue(t) {
    return Object.keys(t).length === 0;
  }
  function d(t, e) {
    t.appendChild(e);
  }
  function q(t, e, r) {
    t.insertBefore(e, r || null);
  }
  function j(t) {
    t.parentNode && t.parentNode.removeChild(t);
  }
  function Fe(t, e) {
    for (let r = 0; r < t.length; r += 1) t[r] && t[r].d(e);
  }
  function w(t) {
    return document.createElement(t);
  }
  function D(t) {
    return document.createTextNode(t);
  }
  function I() {
    return D(" ");
  }
  function Q() {
    return D("");
  }
  function H(t, e, r, n) {
    return (t.addEventListener(e, r, n), () => t.removeEventListener(e, r, n));
  }
  function p(t, e, r) {
    r == null
      ? t.removeAttribute(e)
      : t.getAttribute(e) !== r && t.setAttribute(e, r);
  }
  function De(t) {
    return Array.from(t.childNodes);
  }
  function re(t, e) {
    ((e = "" + e), t.data !== e && (t.data = e));
  }
  function J(t, e) {
    t.value = e ?? "";
  }
  function z(t, e, r) {
    t.classList.toggle(e, !!r);
  }
  let X;
  function Z(t) {
    X = t;
  }
  function ae() {
    if (!X) throw new Error("Function called outside component initialization");
    return X;
  }
  function he(t) {
    ae().$$.on_mount.push(t);
  }
  function le(t, e) {
    return (ae().$$.context.set(t, e), e);
  }
  function ee(t) {
    return ae().$$.context.get(t);
  }
  const Y = [],
    ge = [];
  let B = [];
  const be = [],
    He = Promise.resolve();
  let ce = !1;
  function Je() {
    ce || ((ce = !0), He.then(ye));
  }
  function fe(t) {
    B.push(t);
  }
  const ue = new Set();
  let K = 0;
  function ye() {
    if (K !== 0) return;
    const t = X;
    do {
      try {
        for (; K < Y.length; ) {
          const e = Y[K];
          (K++, Z(e), Ye(e.$$));
        }
      } catch (e) {
        throw ((Y.length = 0), (K = 0), e);
      }
      for (Z(null), Y.length = 0, K = 0; ge.length; ) ge.pop()();
      for (let e = 0; e < B.length; e += 1) {
        const r = B[e];
        ue.has(r) || (ue.add(r), r());
      }
      B.length = 0;
    } while (Y.length);
    for (; be.length; ) be.pop()();
    ((ce = !1), ue.clear(), Z(t));
  }
  function Ye(t) {
    if (t.fragment !== null) {
      (t.update(), U(t.before_update));
      const e = t.dirty;
      ((t.dirty = [-1]),
        t.fragment && t.fragment.p(t.ctx, e),
        t.after_update.forEach(fe));
    }
  }
  function Be(t) {
    const e = [],
      r = [];
    (B.forEach((n) => (t.indexOf(n) === -1 ? e.push(n) : r.push(n))),
      r.forEach((n) => n()),
      (B = e));
  }
  const oe = new Set();
  let F;
  function V() {
    F = { r: 0, c: [], p: F };
  }
  function W() {
    (F.r || U(F.c), (F = F.p));
  }
  function O(t, e) {
    t && t.i && (oe.delete(t), t.i(e));
  }
  function x(t, e, r, n) {
    if (t && t.o) {
      if (oe.has(t)) return;
      (oe.add(t),
        F.c.push(() => {
          (oe.delete(t), n && (r && t.d(1), n()));
        }),
        t.o(e));
    } else n && n();
  }
  function G(t) {
    return (t == null ? void 0 : t.length) !== void 0 ? t : Array.from(t);
  }
  function ke(t, e) {
    x(t, 1, 1, () => {
      e.delete(t.key);
    });
  }
  function we(t, e, r, n, l, i, s, c, a, o, f, u) {
    let v = t.length,
      k = i.length,
      g = v;
    const y = {};
    for (; g--; ) y[t[g].key] = g;
    const m = [],
      S = new Map(),
      N = new Map(),
      $ = [];
    for (g = k; g--; ) {
      const b = u(l, i, g),
        _ = r(b);
      let h = s.get(_);
      (h ? n && $.push(() => h.p(b, e)) : ((h = o(_, b)), h.c()),
        S.set(_, (m[g] = h)),
        _ in y && N.set(_, Math.abs(g - y[_])));
    }
    const C = new Set(),
      L = new Set();
    function E(b) {
      (O(b, 1), b.m(c, f), s.set(b.key, b), (f = b.first), k--);
    }
    for (; v && k; ) {
      const b = m[k - 1],
        _ = t[v - 1],
        h = b.key,
        M = _.key;
      b === _
        ? ((f = b.first), v--, k--)
        : S.has(M)
          ? !s.has(h) || C.has(h)
            ? E(b)
            : L.has(M)
              ? v--
              : N.get(h) > N.get(M)
                ? (L.add(h), E(b))
                : (C.add(M), v--)
          : (a(_, s), v--);
    }
    for (; v--; ) {
      const b = t[v];
      S.has(b.key) || a(b, s);
    }
    for (; k; ) E(m[k - 1]);
    return (U($), m);
  }
  function ie(t) {
    t && t.c();
  }
  function te(t, e, r) {
    const { fragment: n, after_update: l } = t.$$;
    (n && n.m(e, r),
      fe(() => {
        const i = t.$$.on_mount.map(T).filter(_e);
        (t.$$.on_destroy ? t.$$.on_destroy.push(...i) : U(i),
          (t.$$.on_mount = []));
      }),
      l.forEach(fe));
  }
  function ne(t, e) {
    const r = t.$$;
    r.fragment !== null &&
      (Be(r.after_update),
      U(r.on_destroy),
      r.fragment && r.fragment.d(e),
      (r.on_destroy = r.fragment = null),
      (r.ctx = []));
  }
  function Ke(t, e) {
    (t.$$.dirty[0] === -1 && (Y.push(t), Je(), t.$$.dirty.fill(0)),
      (t.$$.dirty[(e / 31) | 0] |= 1 << (e % 31)));
  }
  function de(t, e, r, n, l, i, s = null, c = [-1]) {
    const a = X;
    Z(t);
    const o = (t.$$ = {
      fragment: null,
      ctx: [],
      props: i,
      update: R,
      not_equal: l,
      bound: P(),
      on_mount: [],
      on_destroy: [],
      on_disconnect: [],
      before_update: [],
      after_update: [],
      context: new Map(e.context || (a ? a.$$.context : [])),
      callbacks: P(),
      dirty: c,
      skip_bound: !1,
      root: e.target || a.$$.root,
    });
    s && s(o.root);
    let f = !1;
    if (
      ((o.ctx = r
        ? r(t, e.props || {}, (u, v, ...k) => {
            const g = k.length ? k[0] : v;
            return (
              o.ctx &&
                l(o.ctx[u], (o.ctx[u] = g)) &&
                (!o.skip_bound && o.bound[u] && o.bound[u](g), f && Ke(t, u)),
              v
            );
          })
        : []),
      o.update(),
      (f = !0),
      U(o.before_update),
      (o.fragment = n ? n(o.ctx) : !1),
      e.target)
    ) {
      if (e.hydrate) {
        const u = De(e.target);
        (o.fragment && o.fragment.l(u), u.forEach(j));
      } else o.fragment && o.fragment.c();
      (e.intro && O(t.$$.fragment), te(t, e.target, e.anchor), ye());
    }
    Z(a);
  }
  class me {
    constructor() {
      pe(this, "$$");
      pe(this, "$$set");
    }
    $destroy() {
      (ne(this, 1), (this.$destroy = R));
    }
    $on(e, r) {
      if (!_e(r)) return R;
      const n = this.$$.callbacks[e] || (this.$$.callbacks[e] = []);
      return (
        n.push(r),
        () => {
          const l = n.indexOf(r);
          l !== -1 && n.splice(l, 1);
        }
      );
    }
    $set(e) {
      this.$$set &&
        !Ue(e) &&
        ((this.$$.skip_bound = !0), this.$$set(e), (this.$$.skip_bound = !1));
    }
  }
  const Ve = "4";
  typeof window < "u" &&
    (window.__svelte || (window.__svelte = { v: new Set() })).v.add(Ve);
  const ct = "",
    We = (function t(e) {
      function r(l, i, s) {
        var c,
          a = {};
        if (Array.isArray(l)) return l.concat(i);
        for (c in l) a[s ? c.toLowerCase() : c] = l[c];
        for (c in i) {
          var o = s ? c.toLowerCase() : c,
            f = i[c];
          a[o] =
            o in a && typeof f == "object" ? r(a[o], f, o === "headers") : f;
        }
        return a;
      }
      function n(l, i, s, c) {
        typeof l != "string" && (l = (i = l).url);
        var a = { config: i },
          o = r(e, i),
          f = {},
          u = c || o.data;
        ((o.transformRequest || []).map(function (g) {
          u = g(u, o.headers) || u;
        }),
          u &&
            typeof u == "object" &&
            typeof u.append != "function" &&
            ((u = JSON.stringify(u)),
            (f["content-type"] = "application/json")));
        var v =
          typeof document < "u" &&
          document.cookie.match(
            RegExp("(^|; )" + o.xsrfCookieName + "=([^;]*)"),
          );
        if (
          (v && (f[o.xsrfHeaderName] = v[2]),
          o.auth && (f.authorization = o.auth),
          o.baseURL &&
            (l = l.replace(/^(?!.*\/\/)\/?(.*)$/, o.baseURL + "/$1")),
          o.params)
        ) {
          var k = ~l.indexOf("?") ? "&" : "?";
          l +=
            k +
            (o.paramsSerializer
              ? o.paramsSerializer(o.params)
              : new URLSearchParams(o.params));
        }
        return (o.fetch || fetch)(l, {
          method: s || o.method,
          body: u,
          headers: r(o.headers, f, !0),
          credentials: o.withCredentials ? "include" : "same-origin",
        }).then(function (g) {
          for (var y in g) typeof g[y] != "function" && (a[y] = g[y]);
          var m = o.validateStatus ? o.validateStatus(g.status) : g.ok;
          return o.responseType == "stream"
            ? ((a.data = g.body), a)
            : g[o.responseType || "text"]()
                .then(function (S) {
                  ((a.data = S), (a.data = JSON.parse(S)));
                })
                .catch(Object)
                .then(function () {
                  return m ? a : Promise.reject(a);
                });
        });
      }
      return (
        (e = e || {}),
        (n.request = n),
        (n.get = function (l, i) {
          return n(l, i, "get");
        }),
        (n.delete = function (l, i) {
          return n(l, i, "delete");
        }),
        (n.head = function (l, i) {
          return n(l, i, "head");
        }),
        (n.options = function (l, i) {
          return n(l, i, "options");
        }),
        (n.post = function (l, i, s) {
          return n(l, s, "post", i);
        }),
        (n.put = function (l, i, s) {
          return n(l, s, "put", i);
        }),
        (n.patch = function (l, i, s) {
          return n(l, s, "patch", i);
        }),
        (n.all = Promise.all.bind(Promise)),
        (n.spread = function (l) {
          return function (i) {
            return l.apply(this, i);
          };
        }),
        (n.CancelToken =
          typeof AbortController == "function" ? AbortController : Object),
        (n.defaults = e),
        (n.create = t),
        n
      );
    })(),
    ve = {
      powered_by: "Comments powered by Cusdis",
      post_comment: "Comment",
      loading: "Loading",
      email: "Email (optional)",
      nickname: "Nickname",
      reply_placeholder: "Reply...",
      reply_btn: "Reply",
      sending: "sending...",
      mod_badge: "MOD",
      content_is_required: "Content is required",
      nickname_is_required: "Nickname is required",
      comment_has_been_sent:
        "Your comment has been sent. Please wait for approval.",
    };
  function A(t) {
    const r = window["CUSDIS_LOCALE"] || ve,
      n = r[t] || ve[t];
    return (
      r[t] ||
        console.warn(
          "[cusdis]",
          "translation of language key",
          `'${t}'`,
          "is missing.",
        ),
      n
    );
  }
  function Ge(t) {
    let e,
      r,
      n,
      l,
      i,
      s,
      c,
      a,
      o,
      f,
      u,
      v,
      k,
      g,
      y,
      m,
      S,
      N,
      $,
      C = (t[3] ? A("sending") : A("post_comment")) + "",
      L,
      E,
      b;
    return {
      c() {
        ((e = w("div")),
          (r = w("div")),
          (n = w("div")),
          (l = w("label")),
          (l.textContent = `${A("nickname")}`),
          (i = I()),
          (s = w("input")),
          (c = I()),
          (a = w("div")),
          (o = w("label")),
          (o.textContent = `${A("email")}`),
          (f = I()),
          (u = w("input")),
          (v = I()),
          (k = w("div")),
          (g = w("label")),
          (g.textContent = `${A("reply_placeholder")}`),
          (y = I()),
          (m = w("textarea")),
          (S = I()),
          (N = w("div")),
          ($ = w("button")),
          (L = D(C)),
          p(l, "class", "mb-2 block dark:text-gray-200"),
          p(l, "for", "nickname"),
          p(s, "id", "nickname"), p(s, "name", "nickname"),
          p(
            s,
            "class",
            "w-full p-2 border border-gray-200 bg-transparent dark:text-gray-100 dark:outline-none",
          ),
          p(s, "type", "text"),
          p(s, "title", A("nickname")),
          p(n, "class", "px-1"),
          p(o, "class", "mb-2 block dark:text-gray-200"),
          p(o, "for", "email"),
          p(u, "id", "email"), p(u, "name", "email")
          p(
            u,
            "class",
            "w-full p-2 border border-gray-200 bg-transparent dark:text-gray-100 dark:outline-none",
          ),
          p(u, "type", "email"),
          p(u, "title", A("email")),
          p(a, "class", "px-1"),
          p(r, "class", "grid grid-cols-2 gap-4"),
          p(g, "class", "mb-2 block dark:text-gray-200"),
          p(g, "for", "reply_content"),
          p(m, "name", "reply_content"),
          p(
            m,
            "class",
            "w-full p-2 border border-gray-200 h-24 bg-transparent dark:text-gray-100 dark:outline-none",
          ),
          p(m, "title", A("reply_placeholder")),
          p(k, "class", "px-1"),
          p(
            $,
            "class",
            "text-sm bg-gray-200 p-2 px-4 font-bold dark:bg-transparent dark:border dark:border-gray-100",
          ),
          z($, "cusdis-disabled", t[3]),
          p(N, "class", "px-1"),
          p(e, "class", "grid grid-cols-1 gap-4"));
      },
      m(_, h) {
        (q(_, e, h),
          d(e, r),
          d(r, n),
          d(n, l),
          d(n, i),
          d(n, s),
          J(s, t[1]),
          d(r, c),
          d(r, a),
          d(a, o),
          d(a, f),
          d(a, u),
          J(u, t[2]),
          d(e, v),
          d(e, k),
          d(k, g),
          d(k, y),
          d(k, m),
          J(m, t[0]),
          d(e, S),
          d(e, N),
          d(N, $),
          d($, L),
          E ||
            ((b = [
              H(s, "input", t[7]),
              H(u, "input", t[8]),
              H(m, "input", t[9]),
              H($, "click", t[4]),
            ]),
            (E = !0)));
      },
      p(_, [h]) {
        (h & 2 && s.value !== _[1] && J(s, _[1]),
          h & 4 && u.value !== _[2] && J(u, _[2]),
          h & 1 && J(m, _[0]),
          h & 8 &&
            C !== (C = (_[3] ? A("sending") : A("post_comment")) + "") &&
            re(L, C),
          h & 8 && z($, "cusdis-disabled", _[3]));
      },
      i: R,
      o: R,
      d(_) {
        (_ && j(e), (E = !1), U(b));
      },
    };
  }
  function Qe(t, e, r) {
    let { parentId: n } = e,
      l = "",
      i = "",
      s = "",
      c = !1,
      { onSuccess: a } = e;
    const o = ee("api"),
      f = ee("setMessage"),
      { appId: u, pageId: v, pageUrl: k, pageTitle: g } = ee("attrs"),
      y = ee("refresh");
    async function m() {
      if (!l) {
        alert(A("content_is_required"));
        return;
      }
      if (!i) {
        alert(A("nickname_is_required"));
        return;
      }
      try {
        r(3, (c = !0));
        const L = await o.post("/api/open/comments", {
          appId: u,
          pageId: v,
          content: l,
          nickname: i,
          email: s,
          parentId: n,
          pageUrl: k,
          pageTitle: g,
        });
        (await y(), S(), f(A("comment_has_been_sent")));
      } finally {
        r(3, (c = !1));
      }
    }
    function S() {
      (r(0, (l = "")), r(1, (i = "")), r(2, (s = "")), a && a());
    }
    function N() {
      ((i = this.value), r(1, i));
    }
    function $() {
      ((s = this.value), r(2, s));
    }
    function C() {
      ((l = this.value), r(0, l));
    }
    return (
      (t.$$set = (L) => {
        ("parentId" in L && r(5, (n = L.parentId)),
          "onSuccess" in L && r(6, (a = L.onSuccess)));
      }),
      [l, i, s, c, m, n, a, N, $, C]
    );
  }
  class Ce extends me {
    constructor(e) {
      (super(), de(this, e, Qe, Ge, se, { parentId: 5, onSuccess: 6 }));
    }
  }
  function Se(t, e, r) {
    const n = t.slice();
    return ((n[6] = e[r]), n);
  }
  function $e(t) {
    let e, r;
    return {
      c() {
        ((e = w("div")),
          (r = w("span")),
          (r.textContent = `${A("mod_badge")}`),
          p(
            e,
            "class",
            "mr-2 dark:bg-gray-500 bg-gray-200 text-xs py-0.5 px-1 rounded dark:text-gray-100",
          ));
      },
      m(n, l) {
        (q(n, e, l), d(e, r));
      },
      d(n) {
        n && j(e);
      },
    };
  }
  function Ee(t) {
    let e = [],
      r = new Map(),
      n,
      l,
      i = G(t[1].replies.data);
    const s = (c) => c[6].id;
    for (let c = 0; c < i.length; c += 1) {
      let a = Se(t, i, c),
        o = s(a);
      r.set(o, (e[c] = Le(o, a)));
    }
    return {
      c() {
        for (let c = 0; c < e.length; c += 1) e[c].c();
        n = Q();
      },
      m(c, a) {
        for (let o = 0; o < e.length; o += 1) e[o] && e[o].m(c, a);
        (q(c, n, a), (l = !0));
      },
      p(c, a) {
        a & 2 &&
          ((i = G(c[1].replies.data)),
          V(),
          (e = we(e, a, s, 1, c, i, r, n.parentNode, ke, Le, n, Se)),
          W());
      },
      i(c) {
        if (!l) {
          for (let a = 0; a < i.length; a += 1) O(e[a]);
          l = !0;
        }
      },
      o(c) {
        for (let a = 0; a < e.length; a += 1) x(e[a]);
        l = !1;
      },
      d(c) {
        c && j(n);
        for (let a = 0; a < e.length; a += 1) e[a].d(c);
      },
    };
  }
  function Le(t, e) {
    let r, n, l;
    return (
      (n = new Oe({ props: { isChild: !0, comment: e[6] } })),
      {
        key: t,
        first: null,
        c() {
          ((r = Q()), ie(n.$$.fragment), (this.first = r));
        },
        m(i, s) {
          (q(i, r, s), te(n, i, s), (l = !0));
        },
        p(i, s) {
          e = i;
          const c = {};
          (s & 2 && (c.comment = e[6]), n.$set(c));
        },
        i(i) {
          l || (O(n.$$.fragment, i), (l = !0));
        },
        o(i) {
          (x(n.$$.fragment, i), (l = !1));
        },
        d(i) {
          (i && j(r), ne(n, i));
        },
      }
    );
  }
  function Ne(t) {
    let e, r, n;
    return (
      (r = new Ce({ props: { parentId: t[1].id, onSuccess: t[5] } })),
      {
        c() {
          ((e = w("div")),
            ie(r.$$.fragment),
            p(e, "class", "mt-4 pl-4 border-l-2 border-gray-200"));
        },
        m(l, i) {
          (q(l, e, i), te(r, e, null), (n = !0));
        },
        p(l, i) {
          const s = {};
          (i & 2 && (s.parentId = l[1].id),
            i & 1 && (s.onSuccess = l[5]),
            r.$set(s));
        },
        i(l) {
          n || (O(r.$$.fragment, l), (n = !0));
        },
        o(l) {
          (x(r.$$.fragment, l), (n = !1));
        },
        d(l) {
          (l && j(e), ne(r));
        },
      }
    );
  }
  function Xe(t) {
    let e,
      r,
      n,
      l =
        (t[1].moderator && t[1].moderator.displayName
          ? t[1].moderator.displayName
          : t[1].by_nickname) + "",
      i,
      s,
      c,
      a,
      o = t[1].parsedCreatedAt + "",
      f,
      u,
      v,
      k = t[1].parsedContent + "",
      g,
      y,
      m,
      S,
      N,
      $,
      C,
      L,
      E = t[1].moderatorId && $e(),
      b = t[1].replies.data.length > 0 && Ee(t),
      _ = t[0] && Ne(t);
    return {
      c() {
        ((e = w("div")),
          (r = w("div")),
          (n = w("div")),
          (i = D(l)),
          (s = I()),
          E && E.c(),
          (c = I()),
          (a = w("div")),
          (f = D(o)),
          (u = I()),
          (v = w("div")),
          (g = I()),
          b && b.c(),
          (y = I()),
          (m = w("div")),
          (S = w("button")),
          (S.textContent = `${A("reply_btn")}`),
          (N = I()),
          _ && _.c(),
          p(n, "class", "mr-2 font-medium dark:text-gray-100"),
          p(r, "class", "flex items-center"),
          p(a, "class", "text-gray-500 text-sm dark:text-gray-400"),
          p(v, "class", "text-gray-500 my-2 dark:text-gray-200"),
          p(
            S,
            "class",
            "font-medium text-sm text-gray-500 dark:bg-transparent dark:text-gray-100",
          ),
          p(S, "type", "button"),
          p(e, "class", "my-4"),
          z(e, "pl-4", t[2]),
          z(e, "border-l-2", t[2]),
          z(e, "border-color-gray-200", t[2]),
          z(e, "cusdis-indicator", t[3]));
      },
      m(h, M) {
        (q(h, e, M),
          d(e, r),
          d(r, n),
          d(n, i),
          d(r, s),
          E && E.m(r, null),
          d(e, c),
          d(e, a),
          d(a, f),
          d(e, u),
          d(e, v),
          (v.innerHTML = k),
          d(e, g),
          b && b.m(e, null),
          d(e, y),
          d(e, m),
          d(m, S),
          d(e, N),
          _ && _.m(e, null),
          ($ = !0),
          C || ((L = H(S, "click", t[4])), (C = !0)));
      },
      p(h, [M]) {
        ((!$ || M & 2) &&
          l !==
            (l =
              (h[1].moderator && h[1].moderator.displayName
                ? h[1].moderator.displayName
                : h[1].by_nickname) + "") &&
          re(i, l),
          h[1].moderatorId
            ? E || ((E = $e()), E.c(), E.m(r, null))
            : E && (E.d(1), (E = null)),
          (!$ || M & 2) && o !== (o = h[1].parsedCreatedAt + "") && re(f, o),
          (!$ || M & 2) &&
            k !== (k = h[1].parsedContent + "") &&
            (v.innerHTML = k),
          h[1].replies.data.length > 0
            ? b
              ? (b.p(h, M), M & 2 && O(b, 1))
              : ((b = Ee(h)), b.c(), O(b, 1), b.m(e, y))
            : b &&
              (V(),
              x(b, 1, 1, () => {
                b = null;
              }),
              W()),
          h[0]
            ? _
              ? (_.p(h, M), M & 1 && O(_, 1))
              : ((_ = Ne(h)), _.c(), O(_, 1), _.m(e, null))
            : _ &&
              (V(),
              x(_, 1, 1, () => {
                _ = null;
              }),
              W()),
          (!$ || M & 4) && z(e, "pl-4", h[2]),
          (!$ || M & 4) && z(e, "border-l-2", h[2]),
          (!$ || M & 4) && z(e, "border-color-gray-200", h[2]));
      },
      i(h) {
        $ || (O(b), O(_), ($ = !0));
      },
      o(h) {
        (x(b), x(_), ($ = !1));
      },
      d(h) {
        (h && j(e), E && E.d(), b && b.d(), _ && _.d(), (C = !1), L());
      },
    };
  }
  function Ze(t, e, r) {
    let { comment: n } = e,
      { showReplyForm: l = !1 } = e,
      { isChild: i = !1 } = e;
    const { showIndicator: s } = ee("attrs"),
      c = (o) => {
        r(0, (l = !l));
      },
      a = () => {
        r(0, (l = !1));
      };
    return (
      (t.$$set = (o) => {
        ("comment" in o && r(1, (n = o.comment)),
          "showReplyForm" in o && r(0, (l = o.showReplyForm)),
          "isChild" in o && r(2, (i = o.isChild)));
      }),
      [l, n, i, s, c, a]
    );
  }
  class Oe extends me {
    constructor(e) {
      (super(),
        de(this, e, Ze, Xe, se, { comment: 1, showReplyForm: 0, isChild: 2 }));
    }
  }
  function Ie(t, e, r) {
    const n = t.slice();
    return ((n[12] = e[r]), (n[14] = r), n);
  }
  function Re(t, e, r) {
    const n = t.slice();
    return ((n[15] = e[r]), n);
  }
  function Ae(t) {
    let e,
      r,
      n,
      l,
      i,
      s,
      c,
      a,
      o,
      f,
      u,
      v,
      k,
      g,
      y,
      m = t[4] && Me(t);
    n = new Ce({});
    const S = [tt, et],
      N = [];
    function $(C, L) {
      return C[3] ? 0 : 1;
    }
    return (
      (a = $(t)),
      (o = N[a] = S[a](t)),
      {
        c() {
          ((e = w("div")),
            m && m.c(),
            (r = I()),
            ie(n.$$.fragment),
            (l = I()),
            (i = w("div")),
            (s = I()),
            (c = w("div")),
            o.c(),
            (f = I()),
            (u = w("div")),
            (v = I()),
            (k = w("div")),
            (g = w("a")),
            (g.textContent = `${A("powered_by")}`),
            p(i, "class", "my-8"),
            p(c, "class", "mt-4 px-1"),
            p(u, "class", "my-8"),
            p(g, "class", "underline "),
            p(g, "href", "https://cusdis.com"),
            p(
              k,
              "class",
              "text-center text-gray-500 dark:text-gray-100 text-xs",
            ),
            z(e, "dark", t[1] === "dark"));
        },
        m(C, L) {
          (q(C, e, L),
            m && m.m(e, null),
            d(e, r),
            te(n, e, null),
            d(e, l),
            d(e, i),
            d(e, s),
            d(e, c),
            N[a].m(c, null),
            d(e, f),
            d(e, u),
            d(e, v),
            d(e, k),
            d(k, g),
            (y = !0));
        },
        p(C, L) {
          C[4]
            ? m
              ? m.p(C, L)
              : ((m = Me(C)), m.c(), m.m(e, r))
            : m && (m.d(1), (m = null));
          let E = a;
          ((a = $(C)),
            a === E
              ? N[a].p(C, L)
              : (V(),
                x(N[E], 1, 1, () => {
                  N[E] = null;
                }),
                W(),
                (o = N[a]),
                o ? o.p(C, L) : ((o = N[a] = S[a](C)), o.c()),
                O(o, 1),
                o.m(c, null)),
            (!y || L & 2) && z(e, "dark", C[1] === "dark"));
        },
        i(C) {
          y || (O(n.$$.fragment, C), O(o), (y = !0));
        },
        o(C) {
          (x(n.$$.fragment, C), x(o), (y = !1));
        },
        d(C) {
          (C && j(e), m && m.d(), ne(n), N[a].d());
        },
      }
    );
  }
  function Me(t) {
    let e, r;
    return {
      c() {
        ((e = w("div")),
          (r = D(t[4])),
          p(e, "class", "p-2 mb-4 bg-blue-500 text-white"));
      },
      m(n, l) {
        (q(n, e, l), d(e, r));
      },
      p(n, l) {
        l & 16 && re(r, n[4]);
      },
      d(n) {
        n && j(e);
      },
    };
  }
  function et(t) {
    let e = [],
      r = new Map(),
      n,
      l,
      i,
      s = G(t[0].data);
    const c = (o) => o[15].id;
    for (let o = 0; o < s.length; o += 1) {
      let f = Re(t, s, o),
        u = c(f);
      r.set(u, (e[o] = je(u, f)));
    }
    let a = t[0].pageCount > 1 && qe(t);
    return {
      c() {
        for (let o = 0; o < e.length; o += 1) e[o].c();
        ((n = I()), a && a.c(), (l = Q()));
      },
      m(o, f) {
        for (let u = 0; u < e.length; u += 1) e[u] && e[u].m(o, f);
        (q(o, n, f), a && a.m(o, f), q(o, l, f), (i = !0));
      },
      p(o, f) {
        (f & 1 &&
          ((s = G(o[0].data)),
          V(),
          (e = we(e, f, c, 1, o, s, r, n.parentNode, ke, je, n, Re)),
          W()),
          o[0].pageCount > 1
            ? a
              ? a.p(o, f)
              : ((a = qe(o)), a.c(), a.m(l.parentNode, l))
            : a && (a.d(1), (a = null)));
      },
      i(o) {
        if (!i) {
          for (let f = 0; f < s.length; f += 1) O(e[f]);
          i = !0;
        }
      },
      o(o) {
        for (let f = 0; f < e.length; f += 1) x(e[f]);
        i = !1;
      },
      d(o) {
        o && (j(n), j(l));
        for (let f = 0; f < e.length; f += 1) e[f].d(o);
        a && a.d(o);
      },
    };
  }
  function tt(t) {
    let e;
    return {
      c() {
        ((e = w("div")),
          (e.textContent = `${A("loading")}...`),
          p(e, "class", "text-gray-900 dark:text-gray-100"));
      },
      m(r, n) {
        q(r, e, n);
      },
      p: R,
      i: R,
      o: R,
      d(r) {
        r && j(e);
      },
    };
  }
  function je(t, e) {
    let r, n, l;
    return (
      (n = new Oe({ props: { comment: e[15], firstFloor: !0 } })),
      {
        key: t,
        first: null,
        c() {
          ((r = Q()), ie(n.$$.fragment), (this.first = r));
        },
        m(i, s) {
          (q(i, r, s), te(n, i, s), (l = !0));
        },
        p(i, s) {
          e = i;
          const c = {};
          (s & 1 && (c.comment = e[15]), n.$set(c));
        },
        i(i) {
          l || (O(n.$$.fragment, i), (l = !0));
        },
        o(i) {
          (x(n.$$.fragment, i), (l = !1));
        },
        d(i) {
          (i && j(r), ne(n, i));
        },
      }
    );
  }
  function qe(t) {
    let e,
      r = G(Array(t[0].pageCount)),
      n = [];
    for (let l = 0; l < r.length; l += 1) n[l] = xe(Ie(t, r, l));
    return {
      c() {
        e = w("div");
        for (let l = 0; l < n.length; l += 1) n[l].c();
      },
      m(l, i) {
        q(l, e, i);
        for (let s = 0; s < n.length; s += 1) n[s] && n[s].m(e, null);
      },
      p(l, i) {
        if (i & 69) {
          r = G(Array(l[0].pageCount));
          let s;
          for (s = 0; s < r.length; s += 1) {
            const c = Ie(l, r, s);
            n[s] ? n[s].p(c, i) : ((n[s] = xe(c)), n[s].c(), n[s].m(e, null));
          }
          for (; s < n.length; s += 1) n[s].d(1);
          n.length = r.length;
        }
      },
      d(l) {
        (l && j(e), Fe(n, l));
      },
    };
  }
  function xe(t) {
    let e, r, n;
    function l(...i) {
      return t[8](t[14], ...i);
    }
    return {
      c() {
        ((e = w("button")),
          (e.textContent = `${t[14] + 1}`),
          p(e, "class", "px-2 py-1 text-sm mr-2 dark:text-gray-200"),
          z(e, "underline", t[2] === t[14] + 1));
      },
      m(i, s) {
        (q(i, e, s), r || ((n = H(e, "click", l)), (r = !0)));
      },
      p(i, s) {
        ((t = i), s & 4 && z(e, "underline", t[2] === t[14] + 1));
      },
      d(i) {
        (i && j(e), (r = !1), n());
      },
    };
  }
  function nt(t) {
    let e,
      r,
      n = !t[5] && Ae(t);
    return {
      c() {
        (n && n.c(), (e = Q()));
      },
      m(l, i) {
        (n && n.m(l, i), q(l, e, i), (r = !0));
      },
      p(l, [i]) {
        l[5]
          ? n &&
            (V(),
            x(n, 1, 1, () => {
              n = null;
            }),
            W())
          : n
            ? (n.p(l, i), i & 32 && O(n, 1))
            : ((n = Ae(l)), n.c(), O(n, 1), n.m(e.parentNode, e));
      },
      i(l) {
        r || (O(n), (r = !0));
      },
      o(l) {
        (x(n), (r = !1));
      },
      d(l) {
        (l && j(e), n && n.d(l));
      },
    };
  }
  function rt(t, e, r) {
    let { attrs: n } = e,
      { commentsResult: l } = e,
      i = 1,
      s = !0,
      c = "",
      a,
      o = n.theme || "light";
    const f = We.create({ baseURL: n.host });
    function u(y) {
      r(4, (c = y));
    }
    (he(() => {
      function y(m) {
        try {
          const S = JSON.parse(m.data);
          if (S.from === "cusdis")
            switch (S.event) {
              case "setTheme":
                r(1, (o = S.data));
                break;
            }
        } catch {}
      }
      return (
        window.addEventListener("message", y),
        () => {
          window.removeEventListener("message", y);
        }
      );
    }),
      le("api", f),
      le("attrs", n),
      le("refresh", v),
      le("setMessage", u));
    async function v(y = 1) {
      r(3, (s = !0));
      try {
        const m = await f.get("/api/open/comments", {
          headers: { "x-timezone-offset": -new Date().getTimezoneOffset() },
          params: { page: y, appId: n.appId, pageId: n.pageId },
        });
        r(0, (l = m.data.data));
      } catch (m) {
        r(5, (a = m));
      } finally {
        r(3, (s = !1));
      }
    }
    function k(y) {
      (r(2, (i = y)), v(y));
    }
    he(() => {
      v();
    });
    const g = (y, m) => k(y + 1);
    return (
      (t.$$set = (y) => {
        ("attrs" in y && r(7, (n = y.attrs)),
          "commentsResult" in y && r(0, (l = y.commentsResult)));
      }),
      (t.$$.update = () => {
        t.$$.dirty & 2 &&
          document.documentElement.style.setProperty("color-scheme", o);
      }),
      [l, o, i, s, c, a, k, n, g]
    );
  }
  class lt extends me {
    constructor(e) {
      (super(), de(this, e, rt, nt, se, { attrs: 7, commentsResult: 0 }));
    }
  }
  window.CUSDIS = {};
  const ot = window.parent,
    ze = document.querySelector("#root"),
    it = window.__DATA__;
  new lt({ target: ze, props: { attrs: it } });
  function Te(t, e = {}) {
    ot.postMessage(JSON.stringify({ from: "cusdis", event: t, data: e }));
  }
  (Te("onload"), Pe());
  function Pe() {
  Te("resize", document.documentElement.offsetHeight + 50);
  }
  new MutationObserver(() => {
    Pe();
  }).observe(ze, { childList: !0, subtree: !0 });
});
