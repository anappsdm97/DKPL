/** Shared chrome: header, footer, avatars, modals and toasts. */
(function () {
  const DKPL = (window.DKPL = window.DKPL || {});
  const cfg = window.DKPL_CONFIG;

  const NAV = [
    { key: "home", label: "Home", href: "index.html" },
    { key: "live", label: "Live", href: "pages/live.html" },
    { key: "fixtures", label: "Fixtures", href: "pages/fixtures.html" },
    { key: "points", label: "Points", href: "pages/points.html" },
    { key: "teams", label: "Teams", href: "pages/teams.html" },
    { key: "players", label: "Players", href: "pages/players.html" },
    { key: "stats", label: "Stats", href: "pages/stats.html" },
    { key: "admin", label: "Admin", href: "pages/admin.html" }
  ];

  function base() {
    return location.pathname.indexOf("/pages/") >= 0 ? "../" : "";
  }

  function esc(value) {
    return String(value === undefined || value === null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /** Turns a Google Drive share link into a directly embeddable image URL. */
  function imageUrl(url) {
    if (!url) return "";
    const match = String(url).match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([\w-]+)/);
    if (match) return "https://drive.google.com/thumbnail?id=" + match[1] + "&sz=w600";
    return url;
  }

  function initials(name) {
    return String(name || "?")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(function (w) {
        return w.charAt(0).toUpperCase();
      })
      .join("");
  }

  function avatar(name, url, colour, size) {
    const cls = "avatar" + (size ? " avatar-" + size : "");
    const src = imageUrl(url);
    if (src) return '<span class="' + cls + '"><img src="' + esc(src) + '" alt="' + esc(name) + '" loading="lazy"></span>';
    const style = colour ? ' style="background:' + esc(colour) + '"' : "";
    return '<span class="' + cls + '"' + style + ">" + esc(initials(name)) + "</span>";
  }

  function header(active) {
    const b = base();
    const links = NAV.map(function (item) {
      const cls = item.key === active ? ' class="active"' : "";
      return '<a href="' + b + item.href + '"' + cls + ">" + item.label + "</a>";
    }).join("");

    return (
      '<header class="site-header"><div class="wrap header-inner">' +
      '<a class="brand" href="' + b + 'index.html">' +
      '<img src="' + b + esc(cfg.logo) + '" alt="' + esc(cfg.tournamentName) + ' logo">' +
      "<span><strong>" + esc(cfg.tournamentName) + "</strong><small>Doddakittadahalli Premier League</small></span>" +
      "</a>" +
      '<button class="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false">' +
      '<span></span><span></span><span></span></button>' +
      '<nav class="site-nav">' + links + "</nav>" +
      "</div></header>"
    );
  }

  function footer() {
    const b = base();
    return (
      '<footer class="site-footer"><div class="wrap footer-inner">' +
      "<div><strong>" + esc(cfg.fullName) + "</strong>" +
      "<p>6 teams · 15 league matches · top 4 → playoffs</p></div>" +
      "<div><p>" +
      cfg.playoffs.bracket
        .map(function (k) {
          return esc(k.stage) + ": " + esc(k.detail);
        })
        .join("<br>") +
      "</p></div>" +
      '<div><a href="' + b + 'pages/admin.html">Admin console</a> · <a href="' + b + 'pages/scorer.html">Scorer</a></div>' +
      "</div></footer>"
    );
  }

  function mount(active) {
    const head = document.getElementById("siteHeader");
    const foot = document.getElementById("siteFooter");
    if (head) head.innerHTML = header(active);
    if (foot) foot.innerHTML = footer();

    const toggle = document.querySelector(".nav-toggle");
    const nav = document.querySelector(".site-nav");
    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        const open = nav.classList.toggle("open");
        toggle.setAttribute("aria-expanded", String(open));
      });
    }
    checkAssetVersion();
  }

  function checkAssetVersion() {
    if (!cfg.assetVersion || document.getElementById("assetBanner")) return;
    fetch(base() + "js/version.txt?t=" + Date.now(), { cache: "no-store" })
      .then(function (res) {
        return res.text();
      })
      .then(function (remote) {
        if (String(remote || "").trim() !== String(cfg.assetVersion)) {
          const bar = document.createElement("div");
          bar.id = "assetBanner";
          bar.className = "asset-banner";
          bar.innerHTML =
            '<button type="button" id="assetReload">New site update is ready — tap to refresh</button>';
          document.body.insertBefore(bar, document.body.firstChild);
          document.getElementById("assetReload").addEventListener("click", function () {
            location.reload();
          });
        }
      })
      .catch(function () {});
  }

  /**
   * Modal dialog. Returns a promise resolving to the chosen value, or null.
   * options: [{ value, label, sub }]
   */
  function choose(title, options, opts) {
    const settings = opts || {};
    return new Promise(function (resolve) {
      const overlay = document.createElement("div");
      overlay.className = "modal";
      overlay.innerHTML =
        '<div class="modal-card" role="dialog" aria-modal="true">' +
        "<h3>" + esc(title) + "</h3>" +
        (settings.note ? '<p class="muted">' + esc(settings.note) + "</p>" : "") +
        '<div class="modal-options">' +
        options
          .map(function (o) {
            return (
              '<button type="button" class="option" data-value="' + esc(o.value) + '">' +
              "<strong>" + esc(o.label) + "</strong>" +
              (o.sub ? "<span>" + esc(o.sub) + "</span>" : "") +
              "</button>"
            );
          })
          .join("") +
        "</div>" +
        (settings.cancel === false ? "" : '<button type="button" class="btn btn-ghost modal-cancel">Cancel</button>') +
        "</div>";

      function close(value) {
        overlay.remove();
        resolve(value);
      }

      overlay.addEventListener("click", function (e) {
        const option = e.target.closest("button.option");
        if (option) return close(option.dataset.value);
        if (e.target.classList.contains("modal-cancel")) return close(null);
        if (e.target === overlay && settings.cancel !== false) return close(null);
      });

      document.body.appendChild(overlay);
    });
  }

  function confirmBox(title, note) {
    return choose(title, [{ value: "yes", label: "Yes, continue" }], { note: note }).then(function (v) {
      return v === "yes";
    });
  }

  function toast(message) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(function () {
      el.classList.add("out");
      setTimeout(function () {
        el.remove();
      }, 300);
    }, 2200);
  }

  function empty(message, actionHref, actionLabel) {
    return (
      '<div class="card empty-state"><p>' + esc(message) + "</p>" +
      (actionHref ? '<a class="btn btn-primary" href="' + esc(actionHref) + '">' + esc(actionLabel) + "</a>" : "") +
      "</div>"
    );
  }

  function isAdminSession() {
    return Boolean(DKPL.api && DKPL.api.getToken() && DKPL.api.getRole() === "admin");
  }

  function isScorerSession() {
    if (!DKPL.api || !DKPL.api.getToken()) return false;
    const role = DKPL.api.getRole();
    return role === "admin" || role === "scorer";
  }

  function pinGate(container, opts, onUnlock) {
    if (opts.alreadyUnlocked()) {
      onUnlock();
      return;
    }
    container.innerHTML =
      '<form class="card lock-card" id="pinForm">' +
      "<h2>" + esc(opts.title) + "</h2>" +
      '<p class="muted">' + esc(opts.hint) + "</p>" +
      '<div class="field"><label for="pin">' + esc(opts.label) + "</label>" +
      '<input id="pin" type="password" inputmode="numeric" autocomplete="off" required></div>' +
      '<button class="btn btn-primary" type="submit" id="pinSubmit">Unlock</button>' +
      '<p class="notice" id="pinError" hidden>Incorrect PIN.</p>' +
      "</form>";

    document.getElementById("pinForm").addEventListener("submit", function (e) {
      e.preventDefault();
      const value = document.getElementById("pin").value.trim();
      const errEl = document.getElementById("pinError");
      const submitBtn = document.getElementById("pinSubmit");
      errEl.hidden = true;
      errEl.textContent = "Incorrect PIN.";

      if (!DKPL.api || !DKPL.api.enabled()) {
        errEl.textContent = "PIN login needs the Google Sheets backend (apiBase in config).";
        errEl.hidden = false;
        return;
      }

      submitBtn.disabled = true;
      DKPL.api
        .auth(opts.mode, value)
        .then(function (result) {
          if (result && result.ok && result.token) {
            DKPL.api.setSession(result.token, result.role);
            onUnlock();
            return;
          }
          errEl.hidden = false;
        })
        .catch(function () {
          errEl.textContent = "Could not verify PIN. Redeploy Apps Script after adding Script properties.";
          errEl.hidden = false;
        })
        .finally(function () {
          submitBtn.disabled = false;
        });
    });
  }

  /** PINs live in Apps Script Script properties; writes require a server token. */
  function requireAdmin(container, onUnlock) {
    pinGate(
      container,
      {
        mode: "admin",
        title: "Admin access",
        hint: "Enter the admin PIN to manage teams, players, fixtures, playoffs and data.",
        label: "Admin PIN",
        alreadyUnlocked: isAdminSession
      },
      onUnlock
    );
  }

  function requireScorer(container, onUnlock) {
    pinGate(
      container,
      {
        mode: "scorer",
        title: "Scorer access",
        hint: "Enter the scorer PIN to update live scores and publish results. Admin PIN also works here.",
        label: "Scorer PIN",
        alreadyUnlocked: isScorerSession
      },
      onUnlock
    );
  }

  function signOutAdmin() {
    if (DKPL.api) DKPL.api.clearSession();
    location.reload();
  }

  function signOutScorer() {
    if (DKPL.api) DKPL.api.clearSession();
    location.reload();
  }

  function signOut() {
    signOutAdmin();
  }

  DKPL.ui = {
    isAdminSession: isAdminSession,
    isScorerSession: isScorerSession,
    requireAdmin: requireAdmin,
    requireScorer: requireScorer,
    signOut: signOut,
    signOutAdmin: signOutAdmin,
    signOutScorer: signOutScorer,
    base: base,
    esc: esc,
    imageUrl: imageUrl,
    initials: initials,
    avatar: avatar,
    mount: mount,
    choose: choose,
    confirm: confirmBox,
    toast: toast,
    empty: empty
  };
})();
