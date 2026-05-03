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

/* Hello Studio — Journal tag filter
 * Wires up the .tag-row chips on blog.html to filter .post-card[data-tags] items.
 * Add data-tags="Group Practice,Systems" to any post card to make it filterable.
 */
(function () {
  'use strict';

  function initBlogFilter() {
    const tagRow = document.querySelector('.tag-row');
    if (!tagRow) return;

    const tags = tagRow.querySelectorAll('.tag');
    const cards = document.querySelectorAll('.post-card[data-tags]');
    if (cards.length === 0 || tags.length === 0) return;

    // Find the parent grid that holds the cards (for the empty-state message)
    const grid = cards[0].parentElement;
    let emptyMsg = null;

    function ensureEmptyMsg() {
      if (!emptyMsg) {
        emptyMsg = document.createElement('div');
        emptyMsg.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--muted); font-style: italic; font-family: var(--font-display); font-size: 1.05rem;';
        emptyMsg.innerHTML = 'No essays in this category yet. <a href="#" class="show-all" style="color: var(--gold-warm); border-bottom: 1px solid rgba(184,130,25,0.4);">Show all essays</a>';
        grid.appendChild(emptyMsg);
        const showAll = emptyMsg.querySelector('.show-all');
        showAll.addEventListener('click', function (e) {
          e.preventDefault();
          const allTag = tagRow.querySelector('.tag');
          if (allTag) allTag.click();
        });
      }
      return emptyMsg;
    }

    function filterPosts(tagName) {
      let visible = 0;
      cards.forEach(function (card) {
        const cardTags = (card.getAttribute('data-tags') || '')
          .split(',')
          .map(function (t) { return t.trim(); });
        if (tagName === 'All' || cardTags.indexOf(tagName) !== -1) {
          card.style.display = '';
          visible++;
        } else {
          card.style.display = 'none';
        }
      });
      if (visible === 0) {
        ensureEmptyMsg().style.display = '';
      } else if (emptyMsg) {
        emptyMsg.style.display = 'none';
      }
    }

    tags.forEach(function (tag) {
      tag.addEventListener('click', function (e) {
        e.preventDefault();
        tags.forEach(function (t) { t.classList.remove('is-active'); });
        this.classList.add('is-active');
        filterPosts(this.textContent.trim());
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBlogFilter);
  } else {
    initBlogFilter();
  }
})();
