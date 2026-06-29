/* ============================================================
   KTMY — Animations & Visual Effects v3.0
   Premium interactions, floating orbs, cursor orb, 3D tilt
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     UTILITY
     ============================================================ */
  const isTouchDevice = () => window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     1. CURSOR ORB
     ============================================================ */
  function initCursorOrb() {
    if (isTouchDevice() || prefersReducedMotion()) return;

    const orb = document.createElement('div');
    orb.id = 'ktmy-cursor-orb';
    document.body.appendChild(orb);

    let targetX = -1000, targetY = -1000;
    let currentX = -1000, currentY = -1000;
    let isVisible = false;
    let rafId;

    document.addEventListener('mousemove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!isVisible) {
        isVisible = true;
        orb.style.opacity = '1';
      }
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      isVisible = false;
      orb.style.opacity = '0';
    }, { passive: true });

    function animate() {
      currentX += (targetX - currentX) * 0.07;
      currentY += (targetY - currentY) * 0.07;
      orb.style.left = currentX + 'px';
      orb.style.top = currentY + 'px';
      rafId = requestAnimationFrame(animate);
    }
    animate();

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
      } else {
        animate();
      }
    });
  }

  /* ============================================================
     2. FLOATING BACKGROUND ORBS
     ============================================================ */
  function initFloatingOrbs() {
    if (prefersReducedMotion() || isTouchDevice()) return;

    const orbData = [
      { color: 'rgba(0, 201, 167, 0.10)', size: 700, x: 8, y: 15, dur: 28, dx: 70, dy: -35 },
      { color: 'rgba(77, 124, 254, 0.08)', size: 600, x: 82, y: 40, dur: 36, dx: -65, dy: 45 },
      { color: 'rgba(168, 85, 247, 0.07)', size: 500, x: 45, y: 85, dur: 44, dx: 50, dy: -60 },
    ];

    orbData.forEach((data, i) => {
      const el = document.createElement('div');
      el.className = 'ktmy-bg-orb';
      const keyframeName = 'ktmyOrbFloat' + i;
      el.style.cssText = [
        'position:fixed',
        `width:${data.size}px`,
        `height:${data.size}px`,
        'border-radius:50%',
        `left:${data.x}%`,
        `top:${data.y}%`,
        'transform:translate(-50%,-50%)',
        `background:radial-gradient(circle at center,${data.color} 0%,transparent 70%)`,
        'pointer-events:none',
        'z-index:0',
        `animation:${keyframeName} ${data.dur}s ease-in-out infinite alternate`,
        'will-change:transform',
      ].join(';');
      document.body.appendChild(el);

      const style = document.createElement('style');
      style.textContent = `@keyframes ${keyframeName}{from{transform:translate(-50%,-50%) scale(1)}to{transform:translate(calc(-50% + ${data.dx}px),calc(-50% + ${data.dy}px)) scale(1.2)}}`;
      document.head.appendChild(style);
    });
  }

  /* ============================================================
     3. SCROLL REVEALS (existing feature, enhanced)
     ============================================================ */
  function initScrollReveals() {
    const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
    if (!revealEls.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          if (entry.target.classList.contains('stagger')) {
            entry.target.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(child => {
              child.classList.add('revealed');
            });
          }
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    revealEls.forEach(el => observer.observe(el));
  }

  /* ============================================================
     4. CARD ENTRANCE ANIMATIONS (tab switch reveals)
     ============================================================ */
  function revealTabContent(tabEl) {
    if (!tabEl) return;
    if (prefersReducedMotion()) return;

    const cards = tabEl.querySelectorAll(
      '.glass-card, .chart-container, .weather-card, .price-tag, ' +
      '.currency-card, .quick-link-card, .stat-highlight, .info-card, ' +
      '.forecast-day-card, .city-weather-tile, .weather-gauge-item'
    );

    cards.forEach((card, i) => {
      // Reset then re-trigger animation
      card.classList.remove('ktmy-card-animating');
      void card.offsetWidth; // force reflow
      card.style.animationDelay = (i * 52) + 'ms';
      card.classList.add('ktmy-card-animating');

      // Clean up after animation completes to allow hover transitions
      const totalMs = 550 + i * 52;
      setTimeout(() => {
        card.classList.remove('ktmy-card-animating');
        card.style.animationDelay = '';
      }, totalMs);
    });
  }

  /* ============================================================
     5. TAB SWITCH HOOK
     ============================================================ */
  function initTabSwitchHook() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const el = mutation.target;
          if (el.classList.contains('tab-content') && el.classList.contains('active')) {
            setTimeout(() => revealTabContent(el), 40);
          }
        }
      });
    });

    document.querySelectorAll('.tab-content').forEach(el => {
      observer.observe(el, { attributes: true });
    });
  }

  /* ============================================================
     6. 3D CARD TILT & GLARE EFFECT
     ============================================================ */
  function initCardTilt() {
    if (prefersReducedMotion()) return;

    function attachTilt(card) {
      const isChartCard = card.querySelector('canvas') || card.querySelector('.chart-container') || card.classList.contains('chart-container');

      // Dynamically add glare overlay
      let glare = card.querySelector('.card-glare');
      if (!glare) {
        glare = document.createElement('div');
        glare.className = 'card-glare';
        card.appendChild(glare);
      }

      // Touch events support for mobile (subtle scale press)
      if (isTouchDevice()) {
        card.addEventListener('touchstart', () => {
          card.style.transform = 'scale(0.97)';
          card.style.transition = 'transform 0.15s ease';
        }, { passive: true });
        card.addEventListener('touchend', () => {
          card.style.transform = '';
        }, { passive: true });
        return; // skip desktop tilt
      }

      let rafId;

      card.addEventListener('mousemove', (e) => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          if (rect.width === 0) return;
          const xVal = e.clientX - rect.left;
          const yVal = e.clientY - rect.top;
          
          card.style.setProperty('--glare-x', xVal + 'px');
          card.style.setProperty('--glare-y', yVal + 'px');

          if (!isChartCard) {
            const x = xVal / rect.width;
            const y = yVal / rect.height;
            const rotX = (y - 0.5) * -8;
            const rotY = (x - 0.5) * 8;
            card.style.transform = `translateY(-4px) perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
          }
        });
      }, { passive: true });

      card.addEventListener('mouseleave', () => {
        if (rafId) cancelAnimationFrame(rafId);
        card.style.transform = '';
      }, { passive: true });
    }

    // Attach to all current cards
    document.querySelectorAll('.glass-card').forEach(attachTilt);

    // Watch for dynamically added cards
    const domObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (!node || node.nodeType !== 1) return;
          if (node.classList && node.classList.contains('glass-card')) {
            attachTilt(node);
          }
          if (node.querySelectorAll) {
            node.querySelectorAll('.glass-card').forEach(attachTilt);
          }
        });
      });
    });

    domObserver.observe(document.body, { childList: true, subtree: true });
  }

  /* ============================================================
     7. ANIMATED COUNTER (exposed for external use)
     ============================================================ */
  function animateCounter(element, endValue, duration, prefix, suffix) {
    duration = duration || 1800;
    prefix   = prefix   || '';
    suffix   = suffix   || '';

    const startTime = performance.now();
    const isFloat   = endValue % 1 !== 0;
    const decimals  = isFloat ? (String(endValue).split('.')[1] || '').length : 0;

    function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = endValue * easeOutQuart(progress);

      element.textContent = prefix +
        (isFloat ? current.toFixed(decimals) : Math.floor(current).toLocaleString()) +
        suffix;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        element.textContent = prefix +
          (isFloat ? endValue.toFixed(decimals) : endValue.toLocaleString()) +
          suffix;
      }
    }
    requestAnimationFrame(tick);
  }

  /* ============================================================
     8. PARTICLE CANVAS
     ============================================================ */
  function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    if (prefersReducedMotion() || isTouchDevice()) {
      canvas.style.display = 'none';
      return;
    }

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;
    let width, height;
    const colors = ['#00C9A7', '#4D7CFE', '#A855F7', '#FFD700'];

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    function makeParticle() {
      return {
        x: Math.random() * width,
        y: height + 10,
        size: Math.random() * 2 + 0.5,
        speedY: -(Math.random() * 0.4 + 0.15),
        speedX: (Math.random() - 0.5) * 0.2,
        opacity: Math.random() * 0.38 + 0.08,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0,
        maxLife: Math.random() * 600 + 400,
      };
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      // Spawn
      if (particles.length < 35 && Math.random() < 0.04) {
        particles.push(makeParticle());
      }

      // Connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            const alpha = (1 - dist / 110) * 0.07;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = 'rgba(0,201,167,' + alpha + ')';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Dots
      particles = particles.filter(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.life++;
        const ratio = p.life / p.maxLife;
        let alpha = p.opacity;
        if (ratio < 0.1) alpha *= ratio / 0.1;
        else if (ratio > 0.8) alpha *= (1 - ratio) / 0.2;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fill();

        return p.life < p.maxLife && p.y > -10;
      });

      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });
    draw();

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(animationId);
      else draw();
    });
  }

  /* ============================================================
     9. SECTION LAZY LOADING (existing feature preserved)
     ============================================================ */
  const sectionCallbacks = new Map();
  let sectionObserver = null;

  function initSectionObserver() {
    sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          if (sectionCallbacks.has(id)) {
            sectionCallbacks.get(id)();
            sectionCallbacks.delete(id);
          }
          sectionObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '200px 0px 200px 0px' });
  }

  function onSectionVisible(sectionId, callback) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    sectionCallbacks.set(sectionId, callback);
    if (sectionObserver) sectionObserver.observe(section);
  }

  /* ============================================================
     10. BACK TO TOP
     ============================================================ */
  function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 500);
    }, { passive: true });
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ============================================================
     11. NAV SCROLL (legacy)
     ============================================================ */
  function initNavScroll() {
    const nav = document.querySelector('.nav');
    if (!nav) return;
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });
  }

  /* ============================================================
     12. HERO PARALLAX (legacy)
     ============================================================ */
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
        layer.style.transform = `translate(${x * speed * 20}px, ${y * speed * 20}px)`;
      });
    }, { passive: true });
  }

  /* ============================================================
     13. ACTIVE NAV TRACKING (legacy)
     ============================================================ */
  function initActiveNavTracking() {
    const sections = document.querySelectorAll('.content-section');
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { threshold: 0.2, rootMargin: '-80px 0px -60% 0px' });

    sections.forEach(s => observer.observe(s));
  }

  /* ============================================================
     14. SPLASH SCREEN LOADER
     ============================================================ */
  function initSplashLoader() {
    const loader = document.getElementById('ktmy-splash-loader');
    if (!loader) return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        loader.classList.add('hidden');
        // Trigger tab content reveal of active tab after load
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab) revealTabContent(activeTab);
      }, 700);
    });

    // Fallback: hide if loading takes too long
    setTimeout(() => {
      if (!loader.classList.contains('hidden')) {
        loader.classList.add('hidden');
      }
    }, 3000);
  }

  /* ============================================================
     15. ACTIVE TAB SLIDING NAV PILL (Sidebar & Mobile Nav)
     ============================================================ */
  function initSlidingNavPill() {
    if (prefersReducedMotion()) return;

    // 1. Sidebar Sliding Pill
    const sidebarScroll = document.querySelector('.sidebar-scroll');
    if (sidebarScroll) {
      let pill = sidebarScroll.querySelector('.ktmy-sliding-pill');
      if (!pill) {
        pill = document.createElement('div');
        pill.className = 'ktmy-sliding-pill';
        sidebarScroll.appendChild(pill);
      }

      function updatePillPosition() {
        const activeLink = sidebarScroll.querySelector('.tab-link.active');
        if (activeLink) {
          pill.style.top = activeLink.offsetTop + 'px';
          pill.style.height = activeLink.offsetHeight + 'px';
          pill.classList.add('visible');
        } else {
          pill.classList.remove('visible');
        }
      }

      setTimeout(updatePillPosition, 100);
      window.addEventListener('resize', updatePillPosition, { passive: true });

      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          if (mutation.attributeName === 'class') {
            updatePillPosition();
          }
        });
      });

      sidebarScroll.querySelectorAll('.tab-link').forEach(link => {
        observer.observe(link, { attributes: true, attributeFilter: ['class'] });
        link.addEventListener('mouseenter', () => {
          pill.style.top = link.offsetTop + 'px';
          pill.style.height = link.offsetHeight + 'px';
          pill.classList.add('visible');
        });
      });

      sidebarScroll.addEventListener('mouseleave', () => {
        updatePillPosition();
      });
    }

    // 2. Mobile Bottom Nav Sliding Pill
    const mobNav = document.getElementById('mobile-bottom-nav');
    if (mobNav) {
      let mobPill = mobNav.querySelector('.ktmy-mob-sliding-pill');
      if (!mobPill) {
        mobPill = document.createElement('div');
        mobPill.className = 'ktmy-mob-sliding-pill';
        mobNav.appendChild(mobPill);
      }

      function updateMobPillPosition() {
        const activeItem = mobNav.querySelector('.mobile-bottom-item.active');
        if (activeItem) {
          mobPill.style.left = activeItem.offsetLeft + 'px';
          mobPill.style.width = activeItem.offsetWidth + 'px';
          mobPill.classList.add('visible');
        } else {
          mobPill.classList.remove('visible');
        }
      }

      setTimeout(updateMobPillPosition, 100);
      window.addEventListener('resize', updateMobPillPosition, { passive: true });

      const mobObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          if (mutation.attributeName === 'class') {
            updateMobPillPosition();
          }
        });
      });

      mobNav.querySelectorAll('.mobile-bottom-item').forEach(item => {
        mobObserver.observe(item, { attributes: true, attributeFilter: ['class'] });
      });
    }
  }

  /* ============================================================
     16. MAGNETIC HOVER EFFECT (Desktop only)
     ============================================================ */
  function initMagneticHover() {
    if (isTouchDevice() || prefersReducedMotion()) return;

    function attachMagnetic(el) {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        el.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
        el.style.transition = 'transform 0.08s ease-out';
      }, { passive: true });

      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
        el.style.transition = 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
      }, { passive: true });
    }

    document.querySelectorAll('.btn, .quick-link-card, .topbar-refresh-btn, .lang-btn').forEach(attachMagnetic);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (!node || node.nodeType !== 1) return;
          if (node.matches && (node.matches('.btn') || node.matches('.quick-link-card'))) {
            attachMagnetic(node);
          }
          if (node.querySelectorAll) {
            node.querySelectorAll('.btn, .quick-link-card').forEach(attachMagnetic);
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  /* ============================================================
     17. AUTO DYNAMIC NUMERIC COUNTER ANIMATIONS
     ============================================================ */
  function initTabCountersHook() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (!node || node.nodeType !== 1) return;
          if (node.classList && (node.classList.contains('stat-number') || node.classList.contains('gauge-val') || node.classList.contains('city-temp'))) {
            animateNumberEl(node);
          }
          if (node.querySelectorAll) {
            node.querySelectorAll('.stat-number, .gauge-val, .city-temp').forEach(animateNumberEl);
          }
        });
        
        if (mutation.type === 'characterData' || mutation.type === 'childList') {
          const target = mutation.target.parentElement;
          if (target && (target.classList.contains('stat-number') || target.classList.contains('gauge-val') || target.classList.contains('city-temp'))) {
            animateNumberEl(target);
          }
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  function animateNumberEl(el) {
    if (prefersReducedMotion()) return;
    if (el.id === 'hero-live-time') return;
    if (el.id === 'hero-pop-counter') {
      if (el.dataset.animatedOnce === 'true') return;
      el.dataset.animatedOnce = 'true';
    }
    if (el.dataset.animating === 'true') return;
    
    const rawText = el.textContent.trim();
    if (!rawText || rawText.includes('Loading') || rawText.includes('Loading...')) return;

    const numMatch = rawText.match(/([+-]?[\d,]+\.?\d*)/);
    if (!numMatch) return;

    const numStr = numMatch[1];
    const prefix = rawText.substring(0, numMatch.index);
    const suffix = rawText.substring(numMatch.index + numStr.length);

    const targetValue = parseFloat(numStr.replace(/,/g, ''));
    if (isNaN(targetValue)) return;

    el.dataset.animating = 'true';
    animateCounter(el, targetValue, 1000, prefix, suffix);
    
    setTimeout(() => {
      el.dataset.animating = 'false';
    }, 1100);
  }

  /* ============================================================
     18. REFRESH BUTTON MICRO-INTERACTIONS
     ============================================================ */
  function initRefreshBtn() {
    const btn = document.querySelector('.topbar-refresh-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      if (btn.classList.contains('refreshing')) return;
      btn.classList.add('refreshing');

      setTimeout(() => {
        btn.classList.remove('refreshing');

        // Flash metrics in the active panel
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab) {
          const metrics = activeTab.querySelectorAll('.stat-number, .gauge-val, .city-temp');
          metrics.forEach(el => {
            el.classList.remove('ktmy-glow-pulse');
            void el.offsetWidth; // force reflow
            el.classList.add('ktmy-glow-pulse');
            setTimeout(() => {
              el.classList.remove('ktmy-glow-pulse');
            }, 850);
          });
        }
      }, 850);
    });
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    initCursorOrb();
    initFloatingOrbs();
    initScrollReveals();
    initSectionObserver();
    initParticles();
    initParallax();
    initBackToTop();
    initNavScroll();
    initActiveNavTracking();
    initCardTilt();
    initTabSwitchHook();
    initSplashLoader();
    initSlidingNavPill();
    initMagneticHover();
    initTabCountersHook();
    initRefreshBtn();

    // Reveal the initially active tab content
    setTimeout(() => {
      const activeTab = document.querySelector('.tab-content.active');
      if (activeTab) revealTabContent(activeTab);
    }, 300);
  }

  /* ============================================================
     EXPOSE (preserve existing public API)
     ============================================================ */
  window.KtmyAnimations = {
    init,
    animateCounter,
    onSectionVisible,
    initScrollReveals,
    revealTabContent,
  };

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 0);
  }

})();
