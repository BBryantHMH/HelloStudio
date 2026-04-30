/* Hello Studio — shared client scripts
 * Handles form submission to hello@hellostudio.online via formsubmit.co
 * (free service; first submission sends a verification email to activate).
 *
 * To use: add data-email-to="hello@hellostudio.online" to any <form>.
 * Optional: data-success-message="..." (supports HTML), data-subject="..."
 */
(function () {
  'use strict';

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

    // Strip any legacy inline onsubmit handler
    form.removeAttribute('onsubmit');

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      const successHTML = form.getAttribute('data-success-message') || DEFAULT_SUCCESS_HTML;
      const subject = form.getAttribute('data-subject') || 'New message from hellostudio.online';

      const formData = new FormData(form);
      formData.append('_subject', subject);
      formData.append('_captcha', 'false');
      formData.append('_template', 'table');

      // Disable submit button while posting
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
    const forms = document.querySelectorAll('form[data-email-to]');
    forms.forEach(attachForm);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
