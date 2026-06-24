/* ============================================================
   KTMY — Scroll Animations & Visual Effects
   ============================================================ */

(function () {
  'use strict';

  /* --- Intersection Observer for Scroll Reveals --- */
  function initScrollReveals() {
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');

    if (!revealElements.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          /* Also trigger stagger children */
          if (entry.target.classList.contains('stagger')) {
            entry.target.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(child => {
              child.classList.add('revealed');
            });
          }
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => observer.observe(el));
  }

  /* --- Section Lazy Loading --- */
  const sectionCallbacks = new Map();
  let sectionObserver = null;

  function initSectionObserver() {
    sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          if (sectionCallbacks.has(id)) {
            const callback = sectionCallbacks.get(id);
            callback();
            sectionCallbacks.delete(id);
          }
          sectionObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.05,
      rootMargin: '200px 0px 200px 0px'
    });
  }

  function onSectionVisible(sectionId, callback) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    sectionCallbacks.set(sectionId, callback);
    if (sectionObserver) {
      sectionObserver.observe(section);
    }
  }

  /* --- Animated Counter --- */
  function animateCounter(element, endValue, duration = 2000, prefix = '', suffix = '') {
    const startValue = 0;
    const startTime = performance.now();
    const isFloat = endValue % 1 !== 0;
    const decimals = isFloat ? (String(endValue).split('.')[1] || '').length : 0;

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      /* Ease-out cubic */
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * eased;

      if (isFloat) {
        element.textContent = prefix + current.toFixed(decimals) + suffix;
      } else {
        element.textContent = prefix + Math.floor(current).toLocaleString() + suffix;
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        if (isFloat) {
          element.textContent = prefix + endValue.toFixed(decimals) + suffix;
        } else {
          element.textContent = prefix + endValue.toLocaleString() + suffix;
        }
      }
    }

    requestAnimationFrame(update);
  }

  /* --- Particle Background --- */
  function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;
    let width, height;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    function createParticle() {
      return {
        x: Math.random() * width,
        y: height + 10,
        size: Math.random() * 3 + 1,
        speedY: -(Math.random() * 0.5 + 0.2),
        speedX: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.5 + 0.1,
        color: ['#00C9A7', '#4D7CFE', '#FFD700', '#A855F7'][Math.floor(Math.random() * 4)],
        life: 0,
        maxLife: Math.random() * 500 + 300
      };
    }

    function update() {
      ctx.clearRect(0, 0, width, height);

      /* Add new particles occasionally */
      if (particles.length < 40 && Math.random() < 0.05) {
        particles.push(createParticle());
      }

      particles = particles.filter(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.life++;

        const lifeRatio = p.life / p.maxLife;
        let opacity = p.opacity;
        if (lifeRatio < 0.1) {
          opacity *= lifeRatio / 0.1;
        } else if (lifeRatio > 0.8) {
          opacity *= (1 - lifeRatio) / 0.2;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = opacity;
        ctx.fill();

        return p.life < p.maxLife && p.y > -10;
      });

      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(update);
    }

    resize();
    window.addEventListener('resize', resize);
    update();

    /* Pause when page is not visible */
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(animationId);
      } else {
        update();
      }
    });
  }

  /* --- Smooth Parallax on Mouse Move (hero only) --- */
  function initParallax() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const layers = hero.querySelectorAll('[data-parallax]');
    if (!layers.length) return;

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      layers.forEach(layer => {
        const speed = parseFloat(layer.dataset.parallax) || 1;
        const moveX = x * speed * 20;
        const moveY = y * speed * 20;
        layer.style.transform = `translate(${moveX}px, ${moveY}px)`;
      });
    });
  }

  /* --- Back to Top Button --- */
  function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 500) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* --- Navbar Scroll Effect --- */
  function initNavScroll() {
    const nav = document.querySelector('.nav');
    if (!nav) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  /* --- Active Nav Link Tracking --- */
  function initActiveNavTracking() {
    const sections = document.querySelectorAll('.content-section');
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, {
      threshold: 0.2,
      rootMargin: '-80px 0px -60% 0px'
    });

    sections.forEach(section => observer.observe(section));
  }

  /* --- Init All Animations --- */
  function init() {
    initNavScroll();
    initActiveNavTracking();
    initScrollReveals();
    initSectionObserver();
    initParticles();
    initParallax();
    initBackToTop();
  }

  /* --- Expose --- */
  window.KtmyAnimations = {
    init,
    animateCounter,
    onSectionVisible,
    initScrollReveals
  };
})();
