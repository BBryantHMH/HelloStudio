/* Hello Studio — shared client scripts
 * - Tracks anonymous page views to /api/track for the in-house analytics dashboard
 * - Handles contact form submission to hello@hellostudio.online via formsubmit.co
 *
 * To use the form: add data-email-to="hello@hellostudio.online" to any <form>.
 * Optional: data-success-message="..." (supports HTML), data-subject="..."
 */
(function () {
  'use strict';

  // ---------- Lightweight analytics ----------

  const VISITOR_KEY = 'hs_visitor_id';
  const SESSION_KEY = 'hs_session_id';
  const SESSION_TS_KEY = 'hs_session_ts';
  const SESSION_MAX_MS = 30 * 60 * 1000; // 30 minutes idle = new session

  function uuid() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function getVisitorId() {
    try {
      var id = localStorage.getItem(VISITOR_KEY);
      if (!id) {
        id = uuid();
        localStorage.setItem(VISITOR_KEY, id);
      }
      return id;
    } catch (e) {
      return uuid();
    }
  }

  function getSessionId() {
    try {
      var now = Date.now();
      var id = sessionStorage.getItem(SESSION_KEY);
      var lastTs = parseInt(sessionStorage.getItem(SESSION_TS_KEY) || '0', 10);
      if (!id || !lastTs || now - lastTs > SESSION_MAX_MS) {
        id = uuid();
        sessionStorage.setItem(SESSION_KEY, id);
      }
      sessionStorage.setItem(SESSION_TS_KEY, String(now));
      return id;
    } catch (e) {
      return uuid();
    }
  }

  function trackPageView() {
    // Skip the dashboard itself so admin views don't pollute the data
    if (location.pathname.indexOf('dashboard') !== -1) return;

    var payload = {
      visitorId: getVisitorId(),
      sessionId: getSessionId(),
      path: location.pathname + location.search,
      referrer: document.referrer || ''
    };

    var body = JSON.stringify(payload);

    try {
      if (navigator.sendBeacon) {
        var blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon('/api/track', blob);
        return;
      }
    } catch (e) { /* fall through to fetch */ }

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body,
      keepalive: true
    }).catch(function () { /* swallow — analytics must never break the page */ });
  }

  // ---------- Contact form (existing behavior) ----------

  const DEFAULT_SUCCESS_HTML =
    '<h3 style="text-align:center;color:var(--pine-deep);">Got it! Your message is in good hands. 💌</h3>' +
    '<p style="text-align:center;color:var(--ink-soft);">I\'ll be in touch within 1–2 business days.</p>';

  const FALLBACK_HTML = (email) =>
    '<h3 style="text-align:center;color:var(--pine-deep);">Something glitched on our end.</h3>' +
    '<p style="text-align:center;color:var(--ink-soft);">' +
    'Please email me directly at <a href="mailto:' + email + '">' + email + '</a> ' +
    'and I\'ll get back to you within 1–2 business days.</p>';

  function attachForm(form) {
    const email = form.getAttribute('data-email-to');
    if (!email) return;

    form.removeAttribute('onsubmit');

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      const successHTML = form.getAttribute('data-success-message') || DEFAULT_SUCCESS_HTML;
      const subject = form.getAttribute('data-subject') || 'New message from hellostudio.online';

      const formData = new FormData(form);
      formData.append('_subject', subject);
      formData.append('_captcha', 'false');
      formData.append('_template', 'table');

      const submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.6';
      }

      fetch('https://formsubmit.co/ajax/' + encodeURIComponent(email), {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Non-OK response');
          return res.json();
        })
        .then(function () {
          form.innerHTML = successHTML;
        })
        .catch(function () {
          form.innerHTML = FALLBACK_HTML(email);
        });
    });
  }

  function init() {
    trackPageView();
    const forms = document.querySelectorAll('form[data-email-to]');
    forms.forEach(attachForm);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
