/* ══════════════════════════════════════════════
   Nikola Tesla Tribute — Scroll-Reveal Script
   ══════════════════════════════════════════════ */

(() => {
  'use strict';

  // ── Tag elements that should animate on scroll ──
  const selectors = [
    '.portrait',
    '.intro',
    '.bio-card',
    '.quote-block',
    '.timeline__item',
    '.gallery-figure',
    '.quote-block--alt',
  ];

  function initReveals() {
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach((el, i) => {
        el.classList.add('reveal');
        el.style.setProperty('--i', i);
      });
    });
  }

  // ── Intersection Observer for scroll reveals ──
  function createObserver() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target); // animate only once
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }

  // ── Smooth parallax on hero (subtle) ──
  function initParallax() {
    const hero = document.querySelector('.hero__content');
    if (!hero) return;

    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const heroHeight = window.innerHeight;
      if (scrollY > heroHeight) return; // no work past hero
      const progress = scrollY / heroHeight;
      hero.style.transform = `translateY(${progress * 50}px)`;
      hero.style.opacity = 1 - progress * 1.2;
    }, { passive: true });
  }

  // ── Init ──
  document.addEventListener('DOMContentLoaded', () => {
    initReveals();
    createObserver();
    initParallax();
  });
})();
