// script.js
// All behavior improved: hash navigation, lazy-iframes, youtube-click-to-load, accessible mobile nav, skill bars animation, testimonial slider, copy-to-clipboard with toast.

// Helper: simple toast
function showToast(message, timeout = 3000) {
  let toast = document.getElementById('toast');
  if (!toast) return alert(message);
  const item = document.createElement('div');
  item.className = 'toast-item';
  item.textContent = message;
  toast.appendChild(item);
  setTimeout(() => {
    item.classList.add('visible');
  }, 50);
  setTimeout(() => {
    item.classList.remove('visible');
    setTimeout(() => item.remove(), 400);
  }, timeout);
}

document.addEventListener('DOMContentLoaded', () => {

  // ---------- NAVIGATION & DEEP LINKS ----------
  const navLinks = document.querySelectorAll('.nav-link');
  function setActiveNavByHash(hash) {
    navLinks.forEach(l => {
      if (l.getAttribute('href') === '#' + hash || l.dataset.section === hash) {
        l.classList.add('bg-yellow-400', 'text-black');
        l.setAttribute('aria-current','true');
      } else {
        l.classList.remove('bg-yellow-400', 'text-black');
        l.removeAttribute('aria-current');
      }
    });
  }

  // On click, update hash and smooth-scroll to section
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      // allow normal anchor scrolling by setting location.hash
      const sectionId = link.dataset.section || link.getAttribute('href').replace('#','');
      if (!sectionId) return;
      e.preventDefault();
      history.pushState(null, '', '#' + sectionId);
      const target = document.getElementById(sectionId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setActiveNavByHash(sectionId);
      // close mobile nav if open
      const mobileNav = document.getElementById('mobile-nav');
      const mobileToggle = document.getElementById('mobile-nav-toggle');
      if (mobileNav && mobileToggle && !mobileNav.classList.contains('hidden')) {
        mobileNav.classList.add('hidden');
        mobileToggle.setAttribute('aria-expanded', 'false');
      }
      // if Skills shown, animate skill bars
      if (sectionId === 'skills') animateSkillBars();
    });
  });

  // On load: if there is a hash, scroll to it
  if (window.location.hash) {
    const hash = window.location.hash.slice(1);
    const el = document.getElementById(hash);
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
      setActiveNavByHash(hash);
    }
  } else {
    // default highlight About
    setActiveNavByHash('about');
  }

  // Update active nav on popstate (back/forward)
  window.addEventListener('popstate', () => {
    const hash = window.location.hash ? window.location.hash.slice(1) : 'about';
    setActiveNavByHash(hash);
  });

  // ---------- MOBILE NAV ACCESSIBILITY ----------
  const mobileNavToggle = document.getElementById('mobile-nav-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  if (mobileNavToggle && mobileNav) {
    mobileNavToggle.addEventListener('click', () => {
      const isHidden = mobileNav.classList.toggle('hidden');
      const expanded = !isHidden;
      mobileNavToggle.setAttribute('aria-expanded', String(expanded));
      // move focus into the mobile nav first link when opened for accessibility
      if (expanded) {
        const first = mobileNav.querySelector('.nav-link');
        if (first) first.focus();
      }
    });
  }

  // ---------- THEME TOGGLE (LIGHT/DARK) ----------
  const themeToggle = document.getElementById('themeToggle');
  function setTheme(light) {
    if (!themeToggle) return;
    document.documentElement.classList.toggle('light-mode', light);
    themeToggle.textContent = light ? '🌙 Dark Mode' : '☀️ Light Mode';
    themeToggle.setAttribute('aria-pressed', String(light));
    try { localStorage.setItem('site-theme', light ? 'light' : 'dark'); } catch(e){}
  }
  if (themeToggle) {
    // initial label based on presence of class
    const isLight = document.documentElement.classList.contains('light-mode');
    themeToggle.textContent = isLight ? '🌙 Dark Mode' : '☀️ Light Mode';
    themeToggle.addEventListener('click', () => setTheme(!document.documentElement.classList.contains('light-mode')));
  }

  // ---------- LAZY IFRAME LOADING (Google Drive & Google Maps) ----------
  const lazyIframes = document.querySelectorAll('.lazy-iframe');
  lazyIframes.forEach(container => {
    const btn = container.querySelector('.iframe-load-btn');
    const src = container.dataset.src;
    if (!src) return;
    function loadFrame() {
      if (container.dataset.loaded) return;
      const iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.width = '100%';
      iframe.height = container.style.minHeight || '240';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.setAttribute('allowfullscreen', '');
      iframe.title = 'Embedded content';
      container.innerHTML = ''; // clear placeholder
      container.appendChild(iframe);
      container.dataset.loaded = 'true';
    }
    // load on button click
    if (btn) btn.addEventListener('click', loadFrame);
    // also load when scrolled into view (intersection)
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadFrame();
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });
    observer.observe(container);
  });

  // ---------- LAZY YOUTUBE: click-to-load pattern ----------
  document.querySelectorAll('.youtube-embed').forEach(embed => {
    const id = embed.dataset.id;
    if (!id) return;
    embed.addEventListener('click', function handler() {
      // create real iframe
      const iframe = document.createElement('iframe');
      iframe.width = '100%';
      iframe.height = '100%';
      iframe.src = 'https://www.youtube.com/embed/' + id + '?autoplay=1&rel=0';
      iframe.title = 'YouTube video player';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.loading = 'lazy';
      iframe.setAttribute('allowfullscreen', '');
      embed.innerHTML = ''; // remove poster/button
      embed.appendChild(iframe);
      embed.removeEventListener('click', handler);
    }, { once: true });
  });

  // ---------- SKILL BARS ----------
  function animateSkillBars() {
    const fills = document.querySelectorAll('.skill-bar-fill');
    fills.forEach((fill, i) => {
      const p = parseInt(fill.dataset.percent || fill.getAttribute('data-percent') || '70', 10);
      setTimeout(() => {
        fill.style.width = p + '%';
      }, 200 + i * 80);
    });
  }
  // Animate visible skill bars if skills section is in view
  const skillsSection = document.getElementById('skills');
  if (skillsSection) {
    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          animateSkillBars();
          o.unobserve(e.target);
        }
      });
    }, { threshold: 0.35 });
    obs.observe(skillsSection);
  }

  // ---------- PROJECT CARD RIPPLE (non-blocking) ----------
  document.querySelectorAll('.bg-gray-700, .bg-gray-600').forEach(card => {
    card.addEventListener('mouseenter', function(e) {
      // ripple effect purely decorative; not inserted for keyboard users
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = '120px';
      ripple.style.left = (e.offsetX - 60) + 'px';
      ripple.style.top = (e.offsetY - 60) + 'px';
      ripple.style.background = 'rgba(250,204,21,0.15)';
      ripple.style.zIndex = 10;
      ripple.style.transition = 'opacity 0.6s';
      ripple.style.position = 'absolute';
      card.style.position = 'relative';
      card.appendChild(ripple);
      setTimeout(() => ripple.style.opacity = 0, 300);
      setTimeout(() => ripple.remove(), 600);
    });
  });

  // ---------- TESTIMONIAL SLIDER ----------
  (function() {
    const items = Array.from(document.querySelectorAll('#testimonial-content .testimonial-item'));
    if (!items.length) return;
    const prevBtn = document.getElementById('testimonial-prev');
    const nextBtn = document.getElementById('testimonial-next');
    let current = 0;
    function show(index) {
      items.forEach((item, i) => {
        if (i === index) item.classList.remove('hidden');
        else item.classList.add('hidden');
        // hide "more" content when switching
        const more = item.querySelector('.testimonial-more');
        const btn = item.querySelector('.testimonial-readmore');
        if (more) more.classList.add('hidden');
        if (btn) btn.textContent = 'Read More';
      });
      current = index;
    }
    if (prevBtn && nextBtn) {
      prevBtn.addEventListener('click', () => show((current - 1 + items.length) % items.length));
      nextBtn.addEventListener('click', () => show((current + 1) % items.length));
    }
    // delegate read-more toggles
    const content = document.getElementById('testimonial-content');
    if (content) {
      content.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('testimonial-readmore')) {
          const item = items[current];
          const more = item.querySelector('.testimonial-more');
          const btn = item.querySelector('.testimonial-readmore');
          if (more && btn) {
            if (more.classList.contains('hidden')) {
              more.classList.remove('hidden');
              btn.textContent = 'Read Less';
            } else {
              more.classList.add('hidden');
              btn.textContent = 'Read More';
            }
          }
        }
      });
    }
    show(0);
  })();

  // ---------- COPY EMAIL (non-blocking, with fallback) ----------
  const copyBtn = document.getElementById('copyEmailBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const el = document.getElementById('emailText');
      if (!el) return;
      const email = el.textContent.trim();
      try {
        await navigator.clipboard.writeText(email);
        showToast('✅ Email copied to clipboard!');
      } catch (err) {
        // fallback to selecting
        try {
          const range = document.createRange();
          range.selectNodeContents(el);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          document.execCommand('copy'); // fallback
          sel.removeAllRanges();
          showToast('Copied (fallback).');
        } catch (e) {
          showToast('Unable to copy. Please select and copy manually.');
        }
      }
    });
  }

  // ---------- SIMPLE CONTACT FORM CLIENT-SIDE VALIDATION (graceful) ----------
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      // let browser handle required fields; could add custom validation here
      showToast('Sending message...');
      // No need to preventDefault — the form will be submitted to Formspree
    });
  }

  // ---------- SMALL A11Y: focus outlines for keyboard users ----------
  function handleFirstTab(e) {
    if (e.key === 'Tab') {
      document.documentElement.classList.add('user-is-tabbing');
      window.removeEventListener('keydown', handleFirstTab);
    }
  }
  window.addEventListener('keydown', handleFirstTab);

});
