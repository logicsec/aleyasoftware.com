/* =============================================================================
   Aleya — site behaviour. No dependencies.
   ========================================================================== */

(function () {
  'use strict';

  /* --- Mobile navigation ------------------------------------------------- */

  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');

  if (toggle && nav) {
    const close = function () {
      toggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
      document.body.style.overflow = '';
    };

    toggle.addEventListener('click', function () {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      if (open) {
        close();
      } else {
        toggle.setAttribute('aria-expanded', 'true');
        nav.classList.add('is-open');
        document.body.style.overflow = 'hidden';
      }
    });

    // Tapping a link closes the drawer.
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) close();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        close();
        toggle.focus();
      }
    });

    // Reset when resizing back to desktop.
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) close();
    });
  }

  /* --- Header border once scrolled --------------------------------------- */

  const header = document.querySelector('.site-header');

  if (header) {
    const onScroll = function () {
      // Hold the transparent header a little way into the hero before
      // swapping to the solid state.
      header.classList.toggle('is-stuck', window.scrollY > 80);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* --- Stat count-up ------------------------------------------------------ */
  /* Only elements carrying data-count animate; fixed values like the founding
     year are left alone. Markup already holds the final number, so this is
     purely decorative and degrades to the static value. */

  const counters = document.querySelectorAll('[data-count]');
  const stillness = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (counters.length && 'IntersectionObserver' in window && !stillness.matches) {
    const run = function (el) {
      const target = parseFloat(el.dataset.count);
      const duration = 1300;
      const start = performance.now();

      const tick = function (now) {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);           // easeOutCubic
        el.textContent = Math.round(target * eased);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          run(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );

    counters.forEach(function (el) { observer.observe(el); });
  }

  /* --- Contact page: message / quote tabs -------------------------------- */

  const tabs = [...document.querySelectorAll('.tab')];

  if (tabs.length) {
    const quoteOnly = [...document.querySelectorAll('[data-quote-only]')];
    const noteQuote = document.querySelector('[data-note-quote]');
    const noteMsg = document.querySelector('[data-note-msg]');

    const select = function (id) {
      const quoting = id === 'tab-quote';
      tabs.forEach(function (t) {
        t.setAttribute('aria-selected', String(t.id === id));
      });
      quoteOnly.forEach(function (el) { el.hidden = !quoting; });
      if (noteQuote) noteQuote.hidden = !quoting;
      if (noteMsg) noteMsg.hidden = quoting;

      // So the inbox shows which kind of enquiry arrived.
      const subject = document.querySelector('[data-subject]');
      if (subject) {
        subject.value = (quoting ? 'New quote request' : 'New message') +
          ' — aleyasoftware.com';
      }
    };

    tabs.forEach(function (t) {
      t.addEventListener('click', function () { select(t.id); });
    });

    select('tab-msg');   // message is the lighter-weight default
  }

  /* --- Contact form ------------------------------------------------------- */

  const form = document.querySelector('#quote-form');

  if (form) {
    const status = form.querySelector('.form-status');

    const setStatus = function (kind, message) {
      if (!status) return;
      status.className = 'form-status is-visible form-status--' + kind;
      status.textContent = message;
    };

    const flag = function (field, message) {
      const wrap = field.closest('.field');
      if (!wrap) return;
      wrap.classList.add('field--error');
      const slot = wrap.querySelector('.field__err');
      if (slot) slot.textContent = message;
    };

    const clear = function (field) {
      const wrap = field.closest('.field');
      if (wrap) wrap.classList.remove('field--error');
    };

    form.querySelectorAll('input, select, textarea').forEach(function (field) {
      field.addEventListener('input', function () { clear(field); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      let ok = true;
      let firstBad = null;

      // Hidden fieldsets are not part of the current mode, so skip them.
      form.querySelectorAll('[required]').forEach(function (field) {
        if (field.closest('[hidden]')) return;
        const value = field.value.trim();
        clear(field);

        if (!value) {
          flag(field, 'This field is required.');
          ok = false;
        } else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
          flag(field, 'Enter a valid email address.');
          ok = false;
        } else if (field.type === 'tel' && value.replace(/\D/g, '').length < 7) {
          flag(field, 'Enter a valid phone number.');
          ok = false;
        }

        if (!ok && !firstBad) firstBad = field;
      });

      if (!ok) {
        setStatus('err', 'Please fix the highlighted fields and try again.');
        if (firstBad) firstBad.focus();
        return;
      }

      const endpoint = form.getAttribute('action');

      if (endpoint && endpoint !== '#') {
        const submit = form.querySelector('[type="submit"]');
        const label = submit ? submit.innerHTML : '';
        if (submit) { submit.disabled = true; submit.textContent = 'Sending…'; }

        fetch(endpoint, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        })
          .then(function (res) {
            if (!res.ok) throw new Error('Request failed');
            form.reset();
            setStatus('ok', 'Thanks — that is with us. We reply within one business day.');
          })
          .catch(function () {
            setStatus('err', 'Something went wrong sending that. Please call us on (859) 618-2613 instead.');
          })
          .finally(function () {
            if (submit) { submit.disabled = false; submit.innerHTML = label; }
          });
      } else {
        setStatus('ok', 'Thanks — that is with us. We reply within one business day. (Demo mode: connect a form endpoint to receive this for real.)');
        form.reset();
      }
    });
  }

  /* --- FAQ accordion ------------------------------------------------------ */

  document.querySelectorAll('.faq__q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const item = btn.closest('.faq__item');
      const open = btn.getAttribute('aria-expanded') === 'true';
      const list = btn.closest('.faq');

      if (list && !open) {
        list.querySelectorAll('.faq__q[aria-expanded="true"]').forEach(function (other) {
          other.setAttribute('aria-expanded', 'false');
          other.closest('.faq__item').classList.remove('is-open');
        });
      }

      btn.setAttribute('aria-expanded', String(!open));
      item.classList.toggle('is-open', !open);
    });
  });

  /* --- Current year in the footer ---------------------------------------- */

  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* --- Scroll-driven build ------------------------------------------------ */
  /* The stage pins while the page scrolls through a tall track. Progress
     through that track (0..1) drives two things: which chapter is open, and
     which parts of the building have appeared. */

  const track = document.querySelector('.how__wrap');
  const stage = document.querySelector('.how__stage');

  if (track && stage) {
    const steps = [...document.querySelectorAll('.step')];
    const parts = [...document.querySelectorAll('.build [data-at]')].map(function (el) {
      return { el: el, at: parseFloat(el.dataset.at) };
    });

    // Below the pin breakpoint the section is a plain stacked layout, so
    // everything is simply shown.
    const pinned = function () { return window.matchMedia('(min-width: 901px)').matches; };

    const showAll = function () {
      parts.forEach(function (p) { p.el.classList.add('is-on'); });
      steps.forEach(function (s) { s.classList.add('is-active'); });
    };

    let ticking = false;
    let lastChapter = -1;

    const update = function () {
      ticking = false;

      if (!pinned() || stillness.matches) { showAll(); return; }

      const rect = track.getBoundingClientRect();
      const distance = rect.height - window.innerHeight;
      if (distance <= 0) { showAll(); return; }

      const p = Math.min(Math.max(-rect.top / distance, 0), 1);

      parts.forEach(function (part) {
        part.el.classList.toggle('is-on', p >= part.at);
      });

      const chapter = Math.min(steps.length - 1, Math.floor(p * steps.length));
      if (chapter !== lastChapter) {
        lastChapter = chapter;
        steps.forEach(function (s, i) { s.classList.toggle('is-active', i === chapter); });
      }
    };

    const onScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { lastChapter = -1; onScroll(); });
  }
})();
