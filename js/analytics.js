// Google Analytics 4 — Hello Studio
// Single source of truth for GA tracking. To change the property, update GA_ID below.
(function () {
  var GA_ID = 'G-B6G0WF3QSE';

  // Inject the gtag.js loader
  var loader = document.createElement('script');
  loader.async = true;
  loader.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(loader);

  // Initialize dataLayer + gtag
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', GA_ID);
})();
