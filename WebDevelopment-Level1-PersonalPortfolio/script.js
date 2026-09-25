/* ==========================================================================
   RAJADURAI — PORTFOLIO SCRIPTS
   Vanilla JavaScript for smooth enhancements
   ========================================================================== */

(function () {
  'use strict';

  /* ==================== DOM ELEMENTS ==================== */
  const header    = document.getElementById('header');
  const navToggle = document.getElementById('nav-toggle');
  const navMenu   = document.getElementById('nav-menu');
  const navLinks  = document.querySelectorAll('.nav__link');
  const sections  = document.querySelectorAll('section[id]');
  const reveals   = document.querySelectorAll('.reveal');
  const typedRole = document.getElementById('typed-role');


  /* ==================== MOBILE NAVIGATION ==================== */
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      const isOpen = navMenu.classList.toggle('open');
      navToggle.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen);
      // Prevent background scrolling when menu is open
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close menu when a link is clicked
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        navMenu.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    // Close menu on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navMenu.classList.contains('open')) {
        navMenu.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }


  /* ==================== STICKY NAVBAR — BACKGROUND ON SCROLL ==================== */
  function handleHeaderScroll() {
    if (window.scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleHeaderScroll, { passive: true });
  handleHeaderScroll(); // Run on load


  /* ==================== ACTIVE NAV LINK — SCROLL SPY ==================== */
  function highlightNavLink() {
    var scrollY = window.scrollY + 120;

    sections.forEach(function (section) {
      var sectionTop    = section.offsetTop;
      var sectionHeight = section.offsetHeight;
      var sectionId     = section.getAttribute('id');

      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        navLinks.forEach(function (link) {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + sectionId) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', highlightNavLink, { passive: true });
  highlightNavLink(); // Run on load


  /* ==================== SCROLL REVEAL — INTERSECTION OBSERVER ==================== */
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            revealObserver.unobserve(entry.target); // Animate once
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    reveals.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    // Fallback: show everything immediately
    reveals.forEach(function (el) {
      el.classList.add('revealed');
    });
  }


  /* ==================== TYPING EFFECT ==================== */
  if (typedRole) {
    var roles = [
      'Full Stack MERN Developer',
      'AI & Machine Learning Developer',
      'Python Developer',
    ];
    var roleIndex  = 0;
    var charIndex  = 0;
    var isDeleting = false;
    var typingSpeed = 80;

    function typeRole() {
      var currentRole = roles[roleIndex];

      if (isDeleting) {
        typedRole.textContent = currentRole.substring(0, charIndex - 1);
        charIndex--;
        typingSpeed = 40;
      } else {
        typedRole.textContent = currentRole.substring(0, charIndex + 1);
        charIndex++;
        typingSpeed = 80;
      }

      if (!isDeleting && charIndex === currentRole.length) {
        // Pause at end of word
        typingSpeed = 2000;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        typingSpeed = 400;
      }

      setTimeout(typeRole, typingSpeed);
    }

    // Start typing after a short delay
    setTimeout(typeRole, 1200);
  }

})();
