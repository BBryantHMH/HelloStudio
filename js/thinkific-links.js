/* Hello Studio — Thinkific link manager
 * --------------------------------------
 * Single source of truth for every Thinkific URL across the site.
 *
 * HOW TO USE:
 *
 * 1. To launch a new offering, replace the placeholder URL below with
 *    the real one from Thinkific (e.g. https://hellostudio.thinkific.com/courses/group-practice-studio).
 *
 * 2. To wire any button or link to a key in this config, just add a
 *    data-thinkific-key attribute to the element. The href can stay as "#"
 *    or be omitted entirely — this script will fill it in at page load,
 *    AND will add target="_blank" + rel="noopener noreferrer" so the
 *    Thinkific page opens in a new tab safely.
 *
 *    Example:
 *      <a data-thinkific-key="course-gps" class="btn btn-primary">Enroll now →</a>
 *
 * 3. To add a NEW offering not listed below, add a new line to the LINKS
 *    object using a kebab-case key, then reference it with data-thinkific-key.
 *
 * 4. If a key isn't found, the script logs a warning to the browser console
 *    and leaves the element's href untouched.
 */
(function () {
  'use strict';

  var LINKS = {
    // === Vault — free resources (currently 4) ===
    'vault-kpi-dashboard':         'https://hellostudio.thinkific.com/courses/PLACEHOLDER-KPI-DASHBOARD',
    'vault-fee-setting':           'https://hellostudio.thinkific.com/courses/PLACEHOLDER-FEE-SETTING',
    'vault-quarterly-reset':       'https://hellostudio.thinkific.com/courses/PLACEHOLDER-QUARTERLY-RESET',
    'vault-bottleneck-diagnostic': 'https://hellostudio.thinkific.com/courses/PLACEHOLDER-BOTTLENECK',

    // === Vault — paid templates (currently 4) ===
    'vault-onboarding-checklist':  'https://hellostudio.thinkific.com/courses/PLACEHOLDER-ONBOARDING',  // $29
    'vault-supervision-pack':      'https://hellostudio.thinkific.com/courses/PLACEHOLDER-SUPERVISION', // $49
    'vault-ehr-cheatsheet':        'https://hellostudio.thinkific.com/courses/PLACEHOLDER-EHR',         // $15
    'vault-team-handbook':         'https://hellostudio.thinkific.com/courses/PLACEHOLDER-HANDBOOK',    // $39

    // === Courses (waitlist today; flip to real URLs at launch) ===
    'course-gps': 'https://hellostudio.thinkific.com/courses/PLACEHOLDER-GPS',
    'course-sps': 'https://hellostudio.thinkific.com/courses/PLACEHOLDER-SPS',

    // === Workshops ===
    'workshop-live':      'https://hellostudio.thinkific.com/courses/PLACEHOLDER-WORKSHOP-LIVE',
    'workshop-on-demand': 'https://hellostudio.thinkific.com/courses/PLACEHOLDER-WORKSHOP-ON-DEMAND',

    // === Inner Circle ===
    'inner-circle': 'https://hellostudio.thinkific.com/courses/PLACEHOLDER-INNER-CIRCLE',

    // === Catch-all storefront link ===
    'thinkific-home': 'https://hellostudio.thinkific.com/'
  };

  function applyLinks() {
    var elements = document.querySelectorAll('[data-thinkific-key]');
    elements.forEach(function (el) {
      var key = el.getAttribute('data-thinkific-key');
      var url = LINKS[key];
      if (!url) {
        console.warn('[thinkific-links] No URL configured for key:', key);
        return;
      }
      el.setAttribute('href', url);
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyLinks);
  } else {
    applyLinks();
  }
})();
