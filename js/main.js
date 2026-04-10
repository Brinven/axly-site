/* ============================================================
   AXLY'S CUSTOMS — Main JavaScript
   No dependencies. No build tools. Just vanilla JS.
   ============================================================ */

(function () {
  'use strict';

  /* --- Mobile Nav --- */
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open');
      document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }


  /* --- Sticky Nav Background --- */
  const header = document.querySelector('.site-header');

  if (header) {
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }


  /* --- Scroll Reveal (IntersectionObserver) --- */
  const revealEls = document.querySelectorAll('.reveal, .reveal-stagger');

  if (revealEls.length && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    revealEls.forEach(el => revealObserver.observe(el));
  } else {
    // Fallback: show everything immediately
    revealEls.forEach(el => el.classList.add('visible'));
  }


  /* --- Load Tool Count from stats.json --- */
  const toolCountEl = document.getElementById('tool-count');

  if (toolCountEl) {
    fetch('/stats.json')
      .then(r => r.json())
      .then(data => {
        if (data.tool_count) toolCountEl.textContent = data.tool_count;
      })
      .catch(() => { /* Fallback text already in HTML */ });
  }


  /* --- Load Blog Preview from posts.json --- */
  const blogList = document.getElementById('blog-list');

  if (blogList) {
    fetch('/blog/posts.json')
      .then(r => r.json())
      .then(posts => {
        posts.sort((a, b) => b.date.localeCompare(a.date));
        blogList.innerHTML = '';

        posts.slice(0, 3).forEach(post => {
          const date = new Date(post.date + 'T00:00:00');
          const dateStr = date.toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
          });

          const a = document.createElement('a');
          a.href = '/blog/' + post.slug + '/';
          a.className = 'blog-item';
          a.innerHTML =
            '<span class="blog-item-title">' + post.title + '</span>' +
            '<span class="blog-item-date">' + dateStr + '</span>';
          blogList.appendChild(a);
        });
      })
      .catch(() => { /* Section stays empty gracefully */ });
  }


  /* --- Load Art Gallery Strip from images.json --- */
  const artStrip = document.getElementById('art-strip');

  if (artStrip) {
    fetch('/images.json')
      .then(r => r.json())
      .then(images => {
        // Shuffle and pick 4
        const shuffled = images.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 4);

        artStrip.innerHTML = '';
        selected.forEach(imgPath => {
          // Build thumbnail path: images/X.ext -> images/thumbs/X.jpg
          const filename = imgPath.split('/').pop();
          const thumbName = filename.replace(/\.(png|jpeg|jpg)$/i, '.jpg');
          const thumbPath = '/images/thumbs/' + thumbName;

          const div = document.createElement('a');
          div.href = '/gallery/';
          div.className = 'art-strip-item';
          div.innerHTML = '<img src="' + thumbPath + '" alt="Digital art by Axly\'s Customs" width="400" height="400" loading="lazy">';
          artStrip.appendChild(div);
        });
      })
      .catch(() => { /* Art strip stays empty */ });
  }


  /* --- Copyright Year --- */
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
