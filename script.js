// script.js
// Improved interactive behaviors for the portfolio:
// - Sidebar / mobile nav handling (restored + accessible)
// - Smooth section navigation, deep-linking support
// - Theme toggle with persistence (light / dark)
// - Lazy iframe loaders (YouTube thumbnail click, Drive preview, Google Maps)
// - Skill-bar animation when Skills section becomes visible (once)
// - Testimonial slider (prev/next + read-more toggles)
// - Copy email to clipboard with non-blocking toast
// - Scroll-reveal via IntersectionObserver
// Author: improved version to restore original features + accessibility/performance

(function () {
  'use strict';

  // ---------- Utilities ----------
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from((ctx || document).querySelectorAll(sel));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ---------- Toast ----------
  function showToast(message, opts = {}) {
    const toastRoot = document.getElementById('toast');
    if (!toastRoot) {
      alert(message);
      return;
    }
    const id = 'toast-' + Date.now();
    const el = document.createElement('div');
    el.id = id;
    el.className = 'toast-item';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.style = `
      background: rgba(31,41,55,0.95);
      color: #fff;
      padding: 10px 14px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      margin: 8px;
      max-width: 320px;
    `;
    el.textContent = message;
    toastRoot.appendChild(el);
    // auto remove
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(-6px)';
      setTimeout(() => el.remove(), 450);
    }, opts.duration || 2200);
  }

  // ---------- Theme toggle ----------
  const themeToggleBtn = document.getElementById('themeToggle');
  function setTheme(isLight) {
    try {
      if (isLight) {
        document.documentElement.classList.add('light-mode');
        localStorage.setItem('site-theme', 'light');
        if (themeToggleBtn) {
          themeToggleBtn.textContent = '🌙 Dark Mode';
          themeToggleBtn.setAttribute('aria-pressed', 'true');
        }
      } else {
        document.documentElement.classList.remove('light-mode');
        localStorage.setItem('site-theme', 'dark');
        if (themeToggleBtn) {
          themeToggleBtn.textContent = '☀️ Light Mode';
          themeToggleBtn.setAttribute('aria-pressed', 'false');
        }
      }
    } catch (e) {
      // fallback
      if (themeToggleBtn) themeToggleBtn.textContent = isLight ? '🌙 Dark Mode' : '☀️ Light Mode';
    }
  }
  function toggleTheme() {
    const isLight = document.documentElement.classList.toggle('light-mode');
    setTheme(isLight);
    showToast(isLight ? 'Light mode enabled' : 'Dark mode enabled');
  }

  // ---------- Navigation (desktop + mobile) ----------
  const navLinks = $$('.nav-link');
  const sections = $$('.section-content');
  const mobileNavToggle = document.getElementById('mobile-nav-toggle');
  const mobileNav = document.getElementById('mobile-nav');

  function setActiveNav(sectionId) {
    navLinks.forEach((a) => {
      const id = a.getAttribute('data-section') || (a.getAttribute('href') || '').replace('#', '');
      if (id === sectionId) {
        a.classList.add('bg-yellow-400', 'text-black');
        a.setAttribute('aria-current', 'true');
      } else {
        a.classList.remove('bg-yellow-400', 'text-black');
        a.removeAttribute('aria-current');
      }
    });
  }

  function showSection(sectionId, updateHash = true) {
    if (!sectionId) return;
    // Hide all
    sections.forEach(s => s.classList.add('hidden'));
    const sec = document.getElementById(sectionId);
    if (sec) {
      sec.classList.remove('hidden');
      // Move focus for accessibility
      sec.setAttribute('tabindex', '-1');
      sec.focus({preventScroll: true});
      // Smooth scroll into view (works even when fixed sidebar present)
      setTimeout(() => {
        sec.scrollIntoView({behavior: 'smooth', block: 'start'});
      }, 70);
      setActiveNav(sectionId);
      // animate skill bars when opening skills
      if (sectionId === 'skills') {
        setTimeout(animateSkillBars, 300);
      }
      if (updateHash) {
        // update deep link without adding history entry repeatedly
        history.replaceState(null, '', `#${sectionId}`);
      }
      // close mobile nav if open
      if (mobileNav && !mobileNav.classList.contains('hidden')) {
        toggleMobileNav(false);
      }
    }
  }

  function toggleMobileNav(forceOpen = null) {
    if (!mobileNav) return;
    const isHidden = mobileNav.classList.contains('hidden');
    const open = (forceOpen === null) ? isHidden : forceOpen;
    if (open) {
      mobileNav.classList.remove('hidden');
      mobileNavToggle.setAttribute('aria-expanded', 'true');
      mobileNavToggle.classList.add('open');
    } else {
      mobileNav.classList.add('hidden');
      mobileNavToggle.setAttribute('aria-expanded', 'false');
      mobileNavToggle.classList.remove('open');
    }
  }

  // ---------- Lazy iframe loaders ----------
  // For containers with class 'lazy-iframe' and attribute data-src
  function loadLazyIframes() {
    const iframes = $$('.lazy-iframe');
    iframes.forEach(container => {
      const btn = container.querySelector('.iframe-load-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          const src = container.getAttribute('data-src');
          if (!src) return;
          const iframe = document.createElement('iframe');
          iframe.src = src;
          iframe.width = '100%';
          iframe.height = container.style.height || '320';
          iframe.loading = 'lazy';
          iframe.referrerPolicy = 'no-referrer-when-downgrade';
          iframe.className = 'w-full rounded shadow';
          container.innerHTML = '';
          container.appendChild(iframe);
          showToast('Preview loaded');
        });
      } else {
        // Optionally, auto-load if container is in viewport (not implemented by default)
      }
    });
  }

  // YouTube lazy embed from custom .youtube-embed elements
  function initYouTubePlaceholders() {
    const ytEmbeds = $$('.youtube-embed');
    ytEmbeds.forEach(wrapper => {
      // If we've already replaced it, skip
      if (wrapper.dataset.loaded === '1') return;
      const id = wrapper.getAttribute('data-id');
      if (!id) return;
      const btn = wrapper.querySelector('.youtube-play') || wrapper;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        // build iframe
        const iframe = document.createElement('iframe');
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
        iframe.setAttribute('allowfullscreen', '');
        iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1`;
        iframe.width = '100%';
        iframe.height = wrapper.getAttribute('data-height') || '360';
        iframe.loading = 'lazy';
        iframe.className = 'w-full h-full';
        wrapper.innerHTML = '';
        wrapper.appendChild(iframe);
        wrapper.dataset.loaded = '1';
      });
      // keyboard accessibility - allow Enter key on the wrapper button
      btn.setAttribute('tabindex', '0');
      btn.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          btn.click();
        }
      });
    });
  }

  // ---------- Skills animation ----------
  let skillAnimated = false;
  function animateSkillBars() {
    if (skillAnimated) return;
    const fills = $$('.skill-bar-fill');
    fills.forEach((fill, i) => {
      const p = Number(fill.getAttribute('data-percent') || 0);
      const final = clamp(p, 0, 100);
      // Stagger
      setTimeout(() => {
        fill.style.width = final + '%';
      }, 150 + i * 80);
    });
    skillAnimated = true;
  }

  // ---------- Testimonial slider ----------
  function initTestimonialSlider() {
    const content = document.getElementById('testimonial-content');
    if (!content) return;
    const items = $$('#testimonial-content .testimonial-item');
    const prevBtn = document.getElementById('testimonial-prev');
    const nextBtn = document.getElementById('testimonial-next');
    let current = 0;

    function show(index) {
      index = ((index % items.length) + items.length) % items.length;
      items.forEach((it, i) => {
        if (i === index) {
          it.classList.remove('hidden');
        } else {
          it.classList.add('hidden');
          // ensure "more" text collapsed
          const more = it.querySelector('.testimonial-more');
          const btn = it.querySelector('.testimonial-readmore');
          if (more) more.classList.add('hidden');
          if (btn) btn.textContent = 'Read More';
        }
      });
      current = index;
    }

    if (prevBtn) prevBtn.addEventListener('click', () => show(current - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => show(current + 1));

    // Keyboard support
    if (prevBtn) prevBtn.addEventListener('keydown', e => { if (e.key === 'Enter') prevBtn.click(); });
    if (nextBtn) nextBtn.addEventListener('keydown', e => { if (e.key === 'Enter') nextBtn.click(); });

    // Read more toggles
    content.addEventListener('click', (e) => {
      if (e.target && e.target.classList && e.target.classList.contains('testimonial-readmore')) {
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

    // init
    if (items.length) show(0);
  }

  // ---------- Copy Email ----------
  function initCopyEmail() {
    const copyBtn = document.getElementById('copyEmailBtn') || document.getElementById('copyEmail');
    const emailEl = document.getElementById('emailText');
    if (!copyBtn || !emailEl) return;
    copyBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = emailEl.textContent.trim();
      try {
        await navigator.clipboard.writeText(email);
        showToast('✅ Email copied to clipboard');
      } catch (err) {
        // fallback: create temporary input
        const tmp = document.createElement('input');
        tmp.value = email;
        document.body.appendChild(tmp);
        tmp.select();
        try {
          document.execCommand('copy');
          showToast('✅ Email copied to clipboard');
        } catch (err2) {
          showToast('Could not copy. Please copy manually.');
        }
        tmp.remove();
      }
    });
  }

  // ---------- Scroll reveal using IntersectionObserver ----------
  function initScrollReveal() {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    const revealTargets = $$('.section-content');
    revealTargets.forEach(t => {
      // ensure initial state
      t.classList.add('opacity-0', 'translate-y-4', 'transition', 'duration-700');
      observer.observe(t);
    });
  }

  // ---------- Initial section visibility & deep link support ----------
  function restoreInitialSection() {
    // Hide everything first (so CSS state is consistent)
    sections.forEach(s => s.classList.add('hidden'));

    // If there's a hash, open the referenced section (and avoid scrolling too early)
    const hash = (location.hash || '').replace('#', '');
    if (hash) {
      const target = document.getElementById(hash);
      if (target) {
        setTimeout(() => showSection(hash, false), 80);
        return;
      }
    }
    // default: show about
    showSection('about', false);
  }

  // ---------- Attach nav handlers ----------
  function initNavHandlers() {
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        // If href anchor exists, prevent default because we handle smooth scroll and visibility
        e.preventDefault();
        const sectionId = link.getAttribute('data-section') || (link.getAttribute('href') || '').replace('#', '');
        if (!sectionId) return;
        showSection(sectionId, true);
      });
      // Keyboard activation
      link.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          link.click();
        }
      });
    });

    // mobile toggle
    if (mobileNavToggle) {
      mobileNavToggle.addEventListener('click', (e) => {
        e.preventDefault();
        toggleMobileNav();
      });
      mobileNavToggle.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          mobileNavToggle.click();
        }
      });
    }
  }

  // ---------- Mobile nav auto-close when clicking a link inside mobile menu ----------
  function initMobileAutoClose() {
    if (!mobileNav) return;
    const mobileLinks = mobileNav.querySelectorAll('.nav-link');
    mobileLinks.forEach(a => {
      a.addEventListener('click', () => {
        toggleMobileNav(false);
      });
    });
  }

  // ---------- Accessibility: focus management for skip link ----------
  function initSkipLink() {
    const skip = document.querySelector('.skip-link');
    const main = document.getElementById('main-content');
    if (skip && main) {
      skip.addEventListener('click', (e) => {
        e.preventDefault();
        main.focus();
      });
    }
  }

  // ---------- Initialize everything on DOMContentLoaded ----------
  document.addEventListener('DOMContentLoaded', () => {
    // Theme button
    if (themeToggleBtn) {
      // restore label state to reflect current theme
      const isLight = document.documentElement.classList.contains('light-mode');
      setTheme(isLight);
      themeToggleBtn.addEventListener('click', toggleTheme);
      // keyboard accessible
      themeToggleBtn.addEventListener('keydown', (e) => { if (e.key === 'Enter') themeToggleBtn.click(); });
    }

    initNavHandlers();
    initMobileAutoClose();
    initYouTubePlaceholders();
    loadLazyIframes();
    initTestimonialSlider();
    initCopyEmail();
    initScrollReveal();
    initSkipLink();

    // ensure initial section visibility / deep link is honored
    restoreInitialSection();

    // If skills section already visible on load (large screens), animate skill bars after small delay
    // (intersection observer will animate as they enter)
    // But we also run a check
    const skillsSection = document.getElementById('skills');
    if (skillsSection) {
      const rect = skillsSection.getBoundingClientRect();
      if (rect.top >= 0 && rect.top < window.innerHeight) {
        setTimeout(animateSkillBars, 350);
      }
    }

    // Ensure lazy iframe containers inside the viewport are not left unclickable
    // Add an automatic "load on intersection" for lazy-iframe (optional)
    const lazyIframes = $$('.lazy-iframe');
    if (lazyIframes.length) {
      const liObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(en => {
          if (en.isIntersecting) {
            // show a subtle 'Load' hint - do not auto-load to avoid network use
            const btn = en.target.querySelector('.iframe-load-btn');
            if (btn) btn.classList.add('visible');
            // Unobserve after first hint
            obs.unobserve(en.target);
          }
        });
      }, { threshold: 0.2 });
      lazyIframes.forEach(n => liObserver.observe(n));
    }

    // optional: handle window.hashchange to respond to external navigation
    window.addEventListener('hashchange', () => {
      const h = (location.hash || '').replace('#', '');
      if (h) showSection(h, false);
    });
  });

  // Expose some functions for debugging if needed
  window.portfolioHelpers = {
    showSection,
    toggleMobileNav,
    animateSkillBars,
    showToast
  };

})();
