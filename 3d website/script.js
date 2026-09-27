/* ==========================================================================
   CHRONOVA — script.js
   Plain JS, no build step, no fetch() of local files, no ES modules.
   Safe to run by double-clicking index.html (file:// protocol).
   ========================================================================== */

(function () {
  'use strict';

  var REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------------
     1. PRODUCT DATA  (all data lives here — no external JSON, no fetch())
     ------------------------------------------------------------------------ */
  var PRODUCTS = [
    {
      id: 'noir',
      name: 'CHRONOVA NOIR',
      category: 'Automatic Chronograph',
      price: 2480,
      caseType: 'black',
      dialType: 'obsidian',
      strapType: 'rubber',
      accent: 'gold',
      image: null, /* set to 'assets/images/watch-noir.png' once that file exists — see README */
      desc: 'A study in shadow. The Noir pairs a black ceramic-coated case with a deep obsidian dial for a silhouette that reads as pure intent — technical, disciplined, and quietly dramatic.',
      specs: { Case: 'Black-coated 316L Steel', Movement: 'Automatic Chronograph', 'Case Size': '42mm', 'Water Resistance': '100m', Strap: 'Vulcanized Rubber' }
    },
    {
      id: 'aurelis',
      name: 'AURELIS 01',
      category: 'Mechanical Classic',
      price: 3200,
      caseType: 'gold',
      dialType: 'ivory',
      strapType: 'leather',
      accent: 'gold',
      image: null, /* set to 'assets/images/watch-aurelis.png' once that file exists — see README */
      desc: 'The Aurelis returns to first principles. A brushed champagne-gold case, warm ivory dial, and hand-finished leather strap combine into a piece built for permanence rather than trend.',
      specs: { Case: 'Brushed Champagne-Gold Steel', Movement: 'Mechanical (Hand-wound)', 'Case Size': '40mm', 'Water Resistance': '50m', Strap: 'Full-Grain Leather' }
    },
    {
      id: 'meridian',
      name: 'MERIDIAN STEEL',
      category: 'Integrated Bracelet',
      price: 1890,
      caseType: 'steel',
      dialType: 'midnight',
      strapType: 'bracelet',
      accent: 'silver',
      image: null, /* set to 'assets/images/watch-meridian.png' once that file exists — see README */
      desc: 'Meridian Steel takes the integrated-bracelet form and refines it further — a midnight-blue dial set beneath a brushed steel case, finished with a fully articulated matching bracelet.',
      specs: { Case: 'Brushed 316L Steel', Movement: 'Automatic', 'Case Size': '41mm', 'Water Resistance': '100m', Strap: 'Integrated Steel Bracelet' }
    },
    {
      id: 'eclipse',
      name: 'ECLIPSE GMT',
      category: 'Travel Automatic',
      price: 2750,
      caseType: 'steel',
      dialType: 'obsidian',
      strapType: 'bracelet',
      accent: 'gold',
      image: null, /* set to 'assets/images/watch-eclipse.png' once that file exists — see README */
      desc: 'Built for the itinerant. The Eclipse GMT adds a second time zone hand to our signature steel case, framed by a polished-and-brushed bezel and an obsidian dial for effortless reading in transit.',
      specs: { Case: 'Polished & Brushed Steel', Movement: 'Automatic GMT', 'Case Size': '42mm', 'Water Resistance': '100m', Strap: 'Steel Bracelet' }
    }
  ];

  var CONFIG_BASE_PRICE = 2950;
  var CONFIG_MODIFIERS = {
    case: { steel: 0, black: 150, gold: 450 },
    strap: { leather: 0, bracelet: 180, rubber: -80 },
    dial: { obsidian: 0, ivory: 60, midnight: 90 }
  };

  var currentConfig = { case: 'steel', strap: 'leather', dial: 'obsidian' };

  /* ------------------------------------------------------------------------
     2. UTILITIES
     ------------------------------------------------------------------------ */
  function formatPrice(n) {
    return '$' + Math.round(n).toLocaleString('en-US');
  }

  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function readStorage(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function writeStorage(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  }

  var COLOR_HEX = {
    case: {
      steel: { light: '#e7eaed', mid: '#aab0b6', dark: '#5c6166' },
      black: { light: '#4a4a4d', mid: '#26262a', dark: '#0c0c0e' },
      gold: { light: '#f3ddac', mid: '#c9a563', dark: '#8a6c3a' }
    },
    dial: { obsidian: '#0c0c0e', ivory: '#efe7d8', midnight: '#122038' },
    strap: {
      leather: '#5b3a29',
      rubber: '#1c1c1e',
      bracelet: null /* uses case color */
    }
  };

  function markerColorFor(dialType) {
    return dialType === 'ivory' ? '#3a352c' : '#c9a563';
  }

  /* ------------------------------------------------------------------------
     3. PROCEDURAL SVG WATCH (used for cards / modal / cart — no raster images
        required, so there is never a broken image link).
     ------------------------------------------------------------------------ */
  function buildWatchSVG(opts) {
    var caseType = opts.caseType || 'steel';
    var dialType = opts.dialType || 'obsidian';
    var strapType = opts.strapType || 'leather';
    var uid = 'g' + Math.random().toString(36).slice(2, 9);

    var c = COLOR_HEX.case[caseType] || COLOR_HEX.case.steel;
    var dialColor = COLOR_HEX.dial[dialType] || COLOR_HEX.dial.obsidian;
    var strapColor = strapType === 'bracelet' ? c.mid : (COLOR_HEX.strap[strapType] || COLOR_HEX.strap.leather);
    var markerColor = markerColorFor(dialType);

    var ticks = '';
    for (var i = 0; i < 12; i++) {
      var angle = (i / 12) * Math.PI * 2;
      var x1 = 100 + Math.sin(angle) * 72, y1 = 100 - Math.cos(angle) * 72;
      var x2 = 100 + Math.sin(angle) * 80, y2 = 100 - Math.cos(angle) * 80;
      var w = (i % 3 === 0) ? 2.6 : 1.3;
      ticks += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="' + markerColor + '" stroke-width="' + w + '" stroke-linecap="round"/>';
    }

    var strapTop = strapType === 'bracelet'
      ? '<rect x="78" y="0" width="44" height="20" rx="4" fill="' + strapColor + '" stroke="rgba(0,0,0,.25)"/><line x1="78" y1="8" x2="122" y2="8" stroke="rgba(0,0,0,.2)"/><line x1="78" y1="14" x2="122" y2="14" stroke="rgba(0,0,0,.2)"/>'
      : '<rect x="80" y="0" width="40" height="22" rx="6" fill="' + strapColor + '"/>';
    var strapBottom = strapType === 'bracelet'
      ? '<rect x="78" y="180" width="44" height="20" rx="4" fill="' + strapColor + '" stroke="rgba(0,0,0,.25)"/><line x1="78" y1="188" x2="122" y2="188" stroke="rgba(0,0,0,.2)"/><line x1="78" y1="194" x2="122" y2="194" stroke="rgba(0,0,0,.2)"/>'
      : '<rect x="80" y="178" width="40" height="22" rx="6" fill="' + strapColor + '"/>';

    return (
      '<svg class="watch-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">' +
      '<defs>' +
      '<radialGradient id="case-' + uid + '" cx="35%" cy="30%" r="75%">' +
        '<stop offset="0%" stop-color="' + c.light + '"/><stop offset="55%" stop-color="' + c.mid + '"/><stop offset="100%" stop-color="' + c.dark + '"/>' +
      '</radialGradient>' +
      '<radialGradient id="crystal-' + uid + '" cx="40%" cy="30%" r="70%">' +
        '<stop offset="0%" stop-color="rgba(255,255,255,0.22)"/><stop offset="40%" stop-color="rgba(255,255,255,0.02)"/><stop offset="100%" stop-color="rgba(0,0,0,0.25)"/>' +
      '</radialGradient>' +
      '</defs>' +
      strapTop + strapBottom +
      '<circle cx="100" cy="100" r="92" fill="url(#case-' + uid + ')" stroke="rgba(0,0,0,0.35)" stroke-width="1"/>' +
      '<circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>' +
      '<circle cx="100" cy="100" r="76" fill="' + dialColor + '"/>' +
      ticks +
      '<line x1="100" y1="100" x2="100" y2="62" stroke="' + markerColor + '" stroke-width="3.4" stroke-linecap="round" transform="rotate(305 100 100)"/>' +
      '<line x1="100" y1="100" x2="100" y2="48" stroke="' + markerColor + '" stroke-width="2.4" stroke-linecap="round" transform="rotate(60 100 100)"/>' +
      '<line x1="100" y1="100" x2="100" y2="40" stroke="#c0453a" stroke-width="1.2" stroke-linecap="round" transform="rotate(180 100 100)"/>' +
      '<circle cx="100" cy="100" r="4" fill="' + markerColor + '"/>' +
      '<rect x="188" y="92" width="10" height="16" rx="2" fill="' + c.mid + '" stroke="rgba(0,0,0,.3)"/>' +
      '<circle cx="100" cy="100" r="76" fill="url(#crystal-' + uid + ')"/>' +
      '</svg>'
    );
  }

  /* ------------------------------------------------------------------------
     4. PRELOADER
     ------------------------------------------------------------------------ */
  function initPreloader() {
    var pre = qs('#preloader');
    var fill = qs('#preloader-fill');
    var pct = qs('#preloader-pct-num');
    if (!pre) return;

    var progress = 0;
    var target = 0;
    var done = false;

    function bump(to) { target = Math.max(target, to); }

    // Simulated + real signals
    var timer = setInterval(function () {
      progress += (target - progress) * 0.18 + 0.6;
      if (progress > 99 && !done) progress = 99;
      if (progress > 100) progress = 100;
      if (fill) fill.style.width = progress + '%';
      if (pct) pct.textContent = Math.floor(progress);
    }, 60);

    function finish() {
      if (done) return;
      done = true;
      target = 100;
      progress = 100;
      if (fill) fill.style.width = '100%';
      if (pct) pct.textContent = '100';
      clearInterval(timer);
      setTimeout(function () {
        pre.classList.add('loaded');
        document.body.classList.add('loaded');
        revealHero();
      }, 260);
    }

    bump(35);
    window.addEventListener('load', function () { bump(90); });
    // Hard safety net — never let the preloader trap the user.
    setTimeout(finish, 2200);
    setTimeout(function () { bump(70); }, 400);
  }

  // Splits each character of an element into its own <span> for a per-letter
  // reveal. Runs synchronously before first paint so there is no visible flash.
  var heroCharSpans = [];
  function initHeroCharReveal() {
    var lines = qsa('.hero-title > span');
    lines.forEach(function (line, lineIndex) {
      var text = line.textContent;
      line.textContent = '';
      line.style.opacity = 1;
      line.style.transform = 'none';
      text.split('').forEach(function (ch) {
        var span = document.createElement('span');
        span.style.display = 'inline-block';
        span.style.opacity = '0';
        span.style.transform = 'translateY(110%) rotate(4deg)';
        span.textContent = ch === ' ' ? ' ' : ch;
        line.appendChild(span);
        heroCharSpans.push(span);
      });
    });
  }

  function revealHero() {
    var lines = qsa('.hero .reveal-line');
    if (REDUCED_MOTION || typeof gsap === 'undefined') {
      lines.forEach(function (el) { el.style.opacity = 1; el.style.transform = 'none'; });
      heroCharSpans.forEach(function (s) { s.style.opacity = 1; s.style.transform = 'none'; });
      return;
    }
    gsap.to(lines, {
      opacity: 1,
      y: 0,
      duration: 1.1,
      ease: 'power3.out',
      stagger: 0.12
    });
    if (heroCharSpans.length) {
      gsap.to(heroCharSpans, {
        opacity: 1,
        y: '0%',
        rotate: 0,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.025
      });
    }

    // Cinematic 3D entrance: watch scales up from nothing, camera dollies in.
    if (heroSceneRefs) {
      gsap.fromTo(heroSceneRefs.model.group.scale,
        { x: 0.001, y: 0.001, z: 0.001 },
        { x: 1.55, y: 1.55, z: 1.55, duration: 1.7, ease: 'back.out(1.5)', delay: 0.1 }
      );
      gsap.fromTo(heroSceneRefs.camera.position,
        { z: heroSceneRefs.baseCamPos.z + 2.6 },
        { z: heroSceneRefs.baseCamPos.z, duration: 2, ease: 'power3.out', delay: 0.1 }
      );
    }
  }

  /* ------------------------------------------------------------------------
     5. NAVIGATION
     ------------------------------------------------------------------------ */
  function initNav() {
    var nav = qs('#site-nav');
    function onScroll() {
      if (window.scrollY > 40) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    var menuBtn = qs('#menu-toggle');
    var mobileMenu = qs('#mobile-menu');
    menuBtn.addEventListener('click', function () {
      var isOpen = mobileMenu.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    qsa('#mobile-menu a').forEach(function (a) {
      a.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ------------------------------------------------------------------------
     6. SEARCH
     ------------------------------------------------------------------------ */
  function initSearch() {
    var toggle = qs('#search-toggle');
    var overlay = qs('#search-overlay');
    var input = qs('#search-input');
    var closeBtn = qs('#search-close');
    var results = qs('#search-results');

    function open() {
      overlay.classList.add('open');
      setTimeout(function () { input.focus(); }, 300);
      render('');
    }
    function close() { overlay.classList.remove('open'); input.value = ''; }

    function render(term) {
      var t = term.trim().toLowerCase();
      var matches = PRODUCTS.filter(function (p) {
        return !t || p.name.toLowerCase().indexOf(t) > -1 || p.category.toLowerCase().indexOf(t) > -1;
      });
      results.innerHTML = matches.map(function (p) {
        return '<div class="search-result-item" data-id="' + p.id + '"><span>' + p.name + '</span><span>' + formatPrice(p.price) + '</span></div>';
      }).join('') || '<div class="search-result-item"><span>No matches found</span></div>';
    }

    toggle.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    input.addEventListener('input', function () { render(input.value); });
    results.addEventListener('click', function (e) {
      var item = e.target.closest('.search-result-item');
      if (item && item.dataset.id) { close(); openModal(item.dataset.id); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) close();
    });
  }

  /* ------------------------------------------------------------------------
     7. WISHLIST
     ------------------------------------------------------------------------ */
  var wishlist = readStorage('chronova_wishlist', []);
  function saveWishlist() { writeStorage('chronova_wishlist', wishlist); updateWishlistBadge(); }
  function isWishlisted(id) { return wishlist.indexOf(id) > -1; }
  function toggleWishlist(id) {
    var idx = wishlist.indexOf(id);
    if (idx > -1) wishlist.splice(idx, 1); else wishlist.push(id);
    saveWishlist();
    qsa('.wishlist-mini[data-id="' + id + '"]').forEach(function (btn) {
      btn.classList.toggle('active', isWishlisted(id));
    });
  }
  function updateWishlistBadge() {
    var badge = qs('#wishlist-count');
    if (wishlist.length > 0) { badge.hidden = false; badge.textContent = wishlist.length; bumpBadge(badge); }
    else badge.hidden = true;
  }

  /* ------------------------------------------------------------------------
     8. PRODUCT GRID
     ------------------------------------------------------------------------ */
  function renderProducts() {
    var grid = qs('#product-grid');
    grid.innerHTML = PRODUCTS.map(function (p) {
      return (
        '<article class="product-card">' +
          '<div class="product-visual">' +
            (p.image ? '<img src="' + p.image + '" alt="' + p.name + '" loading="lazy" onload="this.classList.add(\'loaded\')" onerror="this.remove()" />' : '') +
            buildWatchSVG(p) +
            '<button class="wishlist-mini' + (isWishlisted(p.id) ? ' active' : '') + '" data-id="' + p.id + '" aria-label="Toggle wishlist for ' + p.name + '">' +
              '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 20.5s-7.5-4.6-10-9.3C.4 7.8 2 4 5.7 3.4c2-.3 3.9.7 5 2.4 1.1-1.7 3-2.7 5-2.4C19.4 4 21 7.8 19.4 11.2 17 15.9 12 20.5 12 20.5z" fill="currentColor" stroke="currentColor" stroke-width="1"/></svg>' +
            '</button>' +
          '</div>' +
          '<div class="product-body">' +
            '<p class="product-cat">' + p.category + '</p>' +
            '<h3 class="product-name">' + p.name + '</h3>' +
            '<p class="product-price">' + formatPrice(p.price) + '</p>' +
            '<div class="product-actions">' +
              '<button class="btn btn-ghost view-details" data-id="' + p.id + '">View Details</button>' +
              '<button class="btn btn-primary add-cart-quick" data-id="' + p.id + '">Add to Cart</button>' +
            '</div>' +
          '</div>' +
        '</article>'
      );
    }).join('');

    grid.addEventListener('click', function (e) {
      var wl = e.target.closest('.wishlist-mini');
      if (wl) { toggleWishlist(wl.dataset.id); return; }
      var view = e.target.closest('.view-details');
      if (view) { openModal(view.dataset.id); return; }
      var add = e.target.closest('.add-cart-quick');
      if (add) { addToCart(add.dataset.id, 1); showToast('Added to your bag'); return; }
    });
  }

  /* ------------------------------------------------------------------------
     9. CART
     ------------------------------------------------------------------------ */
  var cart = readStorage('chronova_cart', []); // [{id, qty, custom?, customPrice?, customLabel?}]

  function saveCart() { writeStorage('chronova_cart', cart); renderCart(); updateCartBadge(); }

  function findProduct(id) {
    for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].id === id) return PRODUCTS[i];
    return null;
  }

  function addToCart(id, qty, customEntry) {
    if (customEntry) {
      cart.push(customEntry);
      saveCart();
      return;
    }
    var existing = cart.find(function (c) { return c.id === id && !c.custom; });
    if (existing) existing.qty += qty;
    else cart.push({ id: id, qty: qty });
    saveCart();
  }

  function removeFromCart(index) { cart.splice(index, 1); saveCart(); }
  function changeQty(index, delta) {
    cart[index].qty += delta;
    if (cart[index].qty < 1) cart[index].qty = 1;
    saveCart();
  }

  function cartLineInfo(line) {
    if (line.custom) {
      return { name: line.customLabel, category: 'Custom Configuration', price: line.customPrice, caseType: line.caseType, dialType: line.dialType, strapType: line.strapType };
    }
    var p = findProduct(line.id);
    return { name: p.name, category: p.category, price: p.price, caseType: p.caseType, dialType: p.dialType, strapType: p.strapType };
  }

  function renderCart() {
    var itemsEl = qs('#cart-items');
    var emptyEl = qs('#cart-empty');
    var footerEl = qs('#cart-footer');

    if (cart.length === 0) {
      itemsEl.innerHTML = '';
      emptyEl.style.display = 'block';
      footerEl.style.display = 'none';
      return;
    }
    emptyEl.style.display = 'none';
    footerEl.style.display = 'block';

    var subtotal = 0;
    itemsEl.innerHTML = cart.map(function (line, i) {
      var info = cartLineInfo(line);
      subtotal += info.price * line.qty;
      return (
        '<div class="cart-item">' +
          '<div class="cart-item-visual">' + buildWatchSVG(info) + '</div>' +
          '<div class="cart-item-info">' +
            '<span class="cart-item-name">' + info.name + '</span>' +
            '<span class="cart-item-meta">' + info.category + '</span>' +
            '<span class="cart-item-price">' + formatPrice(info.price) + '</span>' +
            '<div class="cart-item-row">' +
              '<div class="cart-item-qty">' +
                '<button data-action="dec" data-i="' + i + '" aria-label="Decrease quantity">&minus;</button>' +
                '<span>' + line.qty + '</span>' +
                '<button data-action="inc" data-i="' + i + '" aria-label="Increase quantity">+</button>' +
              '</div>' +
              '<button class="cart-item-remove" data-action="remove" data-i="' + i + '">Remove</button>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    qs('#cart-subtotal').textContent = formatPrice(subtotal);
  }

  function updateCartBadge() {
    var badge = qs('#cart-count');
    var count = cart.reduce(function (sum, l) { return sum + l.qty; }, 0);
    if (count > 0) { badge.hidden = false; badge.textContent = count; bumpBadge(badge); }
    else badge.hidden = true;
  }

  function openCart() {
    qs('#cart-drawer').classList.add('open');
    qs('#cart-drawer').setAttribute('aria-hidden', 'false');
    qs('#cart-overlay').hidden = false;
  }
  function closeCart() {
    qs('#cart-drawer').classList.remove('open');
    qs('#cart-drawer').setAttribute('aria-hidden', 'true');
    qs('#cart-overlay').hidden = true;
  }

  function initCart() {
    renderCart();
    updateCartBadge();
    qs('#cart-toggle').addEventListener('click', openCart);
    qs('#cart-close').addEventListener('click', closeCart);
    qs('#cart-overlay').addEventListener('click', closeCart);

    qs('#cart-items').addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-action]');
      if (!btn) return;
      var i = parseInt(btn.dataset.i, 10);
      if (btn.dataset.action === 'inc') changeQty(i, 1);
      if (btn.dataset.action === 'dec') changeQty(i, -1);
      if (btn.dataset.action === 'remove') removeFromCart(i);
    });

    qs('#checkout-btn').addEventListener('click', function () {
      var note = qs('#checkout-note');
      note.hidden = false;
      showToast('Checkout integration can be connected in the next phase.');
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && qs('#cart-drawer').classList.contains('open')) closeCart();
    });
  }

  /* ------------------------------------------------------------------------
     10. PRODUCT MODAL
     ------------------------------------------------------------------------ */
  var modalState = { id: null, qty: 1 };

  function openModal(id) {
    var p = findProduct(id);
    if (!p) return;
    modalState.id = id;
    modalState.qty = 1;

    qs('#modal-category').textContent = p.category;
    qs('#modal-title').textContent = p.name;
    qs('#modal-price').textContent = formatPrice(p.price);
    qs('#modal-desc').textContent = p.desc;
    qs('#modal-visual').innerHTML =
      (p.image ? '<img src="' + p.image + '" alt="' + p.name + '" style="display:none" onload="this.style.display=\'block\';this.nextElementSibling.style.display=\'none\'" onerror="this.remove()" />' : '') +
      buildWatchSVG(p);
    qs('#qty-value').textContent = '1';

    var specsHtml = '';
    Object.keys(p.specs).forEach(function (key) {
      specsHtml += '<li>' + key + '<strong>' + p.specs[key] + '</strong></li>';
    });
    qs('#modal-specs').innerHTML = specsHtml;

    var modal = qs('#product-modal');
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    qs('#product-modal').hidden = true;
    document.body.style.overflow = '';
  }

  function initModal() {
    qs('#modal-close').addEventListener('click', closeModal);
    qs('#product-modal').addEventListener('click', function (e) {
      if (e.target.id === 'product-modal') closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !qs('#product-modal').hidden) closeModal();
    });
    qs('#qty-minus').addEventListener('click', function () {
      modalState.qty = Math.max(1, modalState.qty - 1);
      qs('#qty-value').textContent = modalState.qty;
    });
    qs('#qty-plus').addEventListener('click', function () {
      modalState.qty += 1;
      qs('#qty-value').textContent = modalState.qty;
    });
    qs('#modal-add-cart').addEventListener('click', function () {
      if (!modalState.id) return;
      addToCart(modalState.id, modalState.qty);
      showToast('Added to your bag');
      closeModal();
      openCart();
    });
  }

  /* ------------------------------------------------------------------------
     11. TOAST
     ------------------------------------------------------------------------ */
  var toastTimer;
  function showToast(msg) {
    var toast = qs('#toast');
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2600);
  }

  /* ------------------------------------------------------------------------
     12. NEWSLETTER
     ------------------------------------------------------------------------ */
  function initNewsletter() {
    var form = qs('#newsletter-form');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      qs('#newsletter-success').hidden = false;
      form.reset();
    });
  }

  /* ------------------------------------------------------------------------
     13. CONFIGURATOR (2D state + price; 3D handled in section 15)
     ------------------------------------------------------------------------ */
  var onConfigChange = null; // set by Three.js module if available
  var heroSceneRefs = null; // set by initThreeHero if WebGL is available

  function initConfigurator() {
    qsa('.swatch').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var group = btn.closest('.swatch-row').dataset.option;
        var value = btn.dataset.value;
        currentConfig[group] = value;

        qsa('.swatch-row[data-option="' + group + '"] .swatch').forEach(function (b) {
          b.classList.toggle('active', b === btn);
        });

        if (typeof gsap !== 'undefined' && !REDUCED_MOTION) {
          gsap.fromTo(btn.querySelector('span'), { scale: 0.65 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
        }

        updateConfigSummary();
        if (typeof onConfigChange === 'function') onConfigChange(currentConfig);
      });
    });

    // Set initial active states to match currentConfig
    Object.keys(currentConfig).forEach(function (group) {
      qsa('.swatch-row[data-option="' + group + '"] .swatch').forEach(function (b) {
        b.classList.toggle('active', b.dataset.value === currentConfig[group]);
      });
    });

    updateConfigSummary();

    qs('#cfg-add-cart').addEventListener('click', function () {
      var price = configPrice();
      var label = 'Custom ' + capitalize(currentConfig.case) + ' / ' + capitalize(currentConfig.dial);
      addToCart(null, 1, {
        custom: true,
        qty: 1,
        customLabel: label,
        customPrice: price,
        caseType: currentConfig.case,
        dialType: currentConfig.dial,
        strapType: currentConfig.strap
      });
      showToast('Your configuration was added to the bag');
      openCart();
    });
  }

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function configPrice() {
    return CONFIG_BASE_PRICE +
      CONFIG_MODIFIERS.case[currentConfig.case] +
      CONFIG_MODIFIERS.strap[currentConfig.strap] +
      CONFIG_MODIFIERS.dial[currentConfig.dial];
  }

  var configPriceState = { val: CONFIG_BASE_PRICE };
  function updateConfigSummary() {
    qs('#cfg-case').textContent = capitalize(currentConfig.case);
    qs('#cfg-strap').textContent = capitalize(currentConfig.strap);
    qs('#cfg-dial').textContent = capitalize(currentConfig.dial);

    var target = configPrice();
    var priceEl = qs('#cfg-price');
    if (typeof gsap !== 'undefined' && !REDUCED_MOTION) {
      gsap.to(configPriceState, {
        val: target, duration: 0.6, ease: 'power2.out',
        onUpdate: function () { priceEl.textContent = formatPrice(configPriceState.val); }
      });
    } else {
      configPriceState.val = target;
      priceEl.textContent = formatPrice(target);
    }
  }

  /* ------------------------------------------------------------------------
     14. SCROLL REVEALS (GSAP + ScrollTrigger, with safe fallback)
     ------------------------------------------------------------------------ */
  function initScrollReveals() {
    if (REDUCED_MOTION || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    qsa('.reveal-up').forEach(function (el) {
      gsap.fromTo(el, { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 1, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 85%' }
      });
    });

    gsap.utils.toArray('.product-card').forEach(function (card, i) {
      gsap.fromTo(card, { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: i * 0.06,
        scrollTrigger: { trigger: '#product-grid', start: 'top 82%' }
      });
    });

    gsap.to('#hero-canvas', {
      opacity: 0.25,
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });

    // Whole gear cluster drifts as you scroll past it — the individual gears
    // keep spinning on their own CSS animation, this just adds parallax depth.
    if (qs('.craft-art')) {
      gsap.to('.craft-art', {
        rotation: 22,
        ease: 'none',
        scrollTrigger: { trigger: '.craft-section', start: 'top bottom', end: 'bottom top', scrub: 1 }
      });
    }
    if (qs('.editorial-texture')) {
      gsap.fromTo('.editorial-texture', { yPercent: -8 }, {
        yPercent: 8, ease: 'none',
        scrollTrigger: { trigger: '.editorial-banner', start: 'top bottom', end: 'bottom top', scrub: true }
      });
    }
  }

  /* ------------------------------------------------------------------------
     14b. INTERACTION ENHANCEMENTS — cursor, spotlight, magnetism, tilt, pop
     ------------------------------------------------------------------------ */
  var FINE_POINTER = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function bumpBadge(el) {
    if (typeof gsap === 'undefined' || REDUCED_MOTION || !el) return;
    gsap.fromTo(el, { scale: 1.5 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' });
  }

  function initCustomCursor() {
    if (!FINE_POINTER || REDUCED_MOTION) return;
    var dot = document.createElement('div'); dot.className = 'cursor-dot';
    var ring = document.createElement('div'); ring.className = 'cursor-ring';
    dot.style.opacity = '0';
    ring.style.opacity = '0';
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    document.body.classList.add('custom-cursor-active');

    var mx = 0, my = 0, rx = 0, ry = 0;
    var started = false;
    window.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      if (!started) {
        // Snap straight to the real cursor position on the first move rather
        // than lerping in from an arbitrary default — avoids a stray circle
        // sitting at screen-center before the user has moved the mouse.
        started = true;
        rx = mx; ry = my;
        ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
        dot.style.opacity = '1';
        ring.style.opacity = '1';
      }
    });
    (function loop() {
      if (started) {
        rx += (mx - rx) * 0.18;
        ry += (my - ry) * 0.18;
        ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
      }
      requestAnimationFrame(loop);
    })();

    var hoverSelector = 'a, button, .swatch, .product-card, .icon-btn';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest(hoverSelector)) ring.classList.add('hover');
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest(hoverSelector)) ring.classList.remove('hover');
    });
  }

  function initHeroSpotlight() {
    var hero = qs('.hero');
    var glow = qs('#hero-spotlight');
    if (!hero || !glow || !FINE_POINTER) return;
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      glow.style.setProperty('--sx', ((e.clientX - r.left) / r.width * 100) + '%');
      glow.style.setProperty('--sy', ((e.clientY - r.top) / r.height * 100) + '%');
      glow.classList.add('active');
    });
    hero.addEventListener('mouseleave', function () { glow.classList.remove('active'); });
  }

  function initMagnetic(selector, strength) {
    if (!FINE_POINTER || REDUCED_MOTION) return;
    qsa(selector).forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var mx = e.clientX - (r.left + r.width / 2);
        var my = e.clientY - (r.top + r.height / 2);
        btn.style.transform = 'translate(' + (mx * strength).toFixed(1) + 'px,' + (my * strength).toFixed(1) + 'px)';
      });
      btn.addEventListener('mouseleave', function () { btn.style.transform = ''; });
    });
  }

  function initCardTilt() {
    if (!FINE_POINTER || REDUCED_MOTION) return;
    qsa('.product-card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        var rx = (py * -8).toFixed(2), ry = (px * 10).toFixed(2);
        card.style.transform = 'perspective(900px) translateY(-6px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) scale(1.02)';
      });
      card.addEventListener('mouseleave', function () { card.style.transform = ''; });
    });
  }

  /* ------------------------------------------------------------------------
     15. THREE.JS — procedural watch model (hero + configurator)
     ------------------------------------------------------------------------ */
  function hasWebGL() {
    try {
      var canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }

  function makeFloorTexture() {
    var size = 512;
    var c = document.createElement('canvas');
    c.width = c.height = size;
    var ctx = c.getContext('2d');
    var grad = ctx.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(180,160,120,0.35)');
    grad.addColorStop(0.4, 'rgba(40,40,45,0.4)');
    grad.addColorStop(1, 'rgba(8,8,10,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    var tex = new THREE.CanvasTexture(c);
    return tex;
  }

  // A small procedural equirectangular "studio" gradient used as scene.environment
  // so metal surfaces pick up believable soft reflections/highlights via IBL,
  // without needing an external HDRI file (which file:// couldn't fetch anyway).
  function buildEnvTexture() {
    var w = 256, h = 128;
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var ctx = c.getContext('2d');
    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#46464c');
    grad.addColorStop(0.32, '#232326');
    grad.addColorStop(0.5, '#c9a563');
    grad.addColorStop(0.53, '#141416');
    grad.addColorStop(1, '#040405');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    var glow = ctx.createRadialGradient(w * 0.5, h * 0.2, 2, w * 0.5, h * 0.2, w * 0.3);
    glow.addColorStop(0, 'rgba(255,246,224,0.95)');
    glow.addColorStop(1, 'rgba(255,246,224,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    var glow2 = ctx.createRadialGradient(w * 0.82, h * 0.45, 1, w * 0.82, h * 0.45, w * 0.16);
    glow2.addColorStop(0, 'rgba(180,210,255,0.5)');
    glow2.addColorStop(1, 'rgba(180,210,255,0)');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, w, h);
    var tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    if (tex.encoding !== undefined) tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  // Builds one procedural watch. Returns { group, parts } where parts exposes
  // material/mesh references so the configurator can update them live.
  function buildWatchModel(opts) {
    opts = opts || {};
    var caseType = opts.caseType || 'steel';
    var dialType = opts.dialType || 'obsidian';
    var strapType = opts.strapType || 'leather';

    var group = new THREE.Group();
    var caseColors = COLOR_HEX.case[caseType] || COLOR_HEX.case.steel;
    var dialColorHex = COLOR_HEX.dial[dialType] || COLOR_HEX.dial.obsidian;
    var markerHex = markerColorFor(dialType);

    var caseMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(caseColors.mid), metalness: 0.92, roughness: 0.24, clearcoat: 0.5, clearcoatRoughness: 0.18, envMapIntensity: 1.2 });
    var bezelMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(caseColors.light), metalness: 0.95, roughness: 0.14, clearcoat: 0.65, clearcoatRoughness: 0.1, envMapIntensity: 1.35 });
    var dialMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(dialColorHex), metalness: 0.35, roughness: 0.5, envMapIntensity: 0.6 });
    // Note: MeshPhysicalMaterial's `transmission` triggers an extra full-scene
    // render pass per frame (very costly, especially with two live scenes) —
    // a plain low-opacity reflective material reads as sapphire glass for a
    // fraction of the GPU cost and keeps things smooth on modest hardware.
    var crystalMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.05, transparent: true, opacity: 0.22, envMapIntensity: 1.4 });
    var markerMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(markerHex), metalness: 0.75, roughness: 0.25, envMapIntensity: 1 });
    var strapMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(strapType === 'bracelet' ? caseColors.mid : (strapType === 'rubber' ? '#1c1c1e' : '#5b3a29')),
      metalness: strapType === 'bracelet' ? 0.85 : 0.05,
      roughness: strapType === 'bracelet' ? 0.28 : 0.75,
      envMapIntensity: strapType === 'bracelet' ? 1.1 : 0.3
    });

    // Case
    var caseGeo = new THREE.CylinderGeometry(1, 1, 0.32, 64);
    var caseMesh = new THREE.Mesh(caseGeo, caseMat);
    caseMesh.rotation.x = Math.PI / 2;
    group.add(caseMesh);

    // Bezel
    var bezelGeo = new THREE.TorusGeometry(0.96, 0.07, 20, 64);
    var bezelMesh = new THREE.Mesh(bezelGeo, bezelMat);
    bezelMesh.position.z = 0.17;
    group.add(bezelMesh);

    // Fluted bezel — small raised ridges around the rim for a machined, premium
    // detail. A single InstancedMesh keeps this to one draw call instead of 60.
    var fluteCount = 60;
    var fluteGeo = new THREE.BoxGeometry(0.028, 0.1, 0.03);
    var fluteMesh = new THREE.InstancedMesh(fluteGeo, bezelMat, fluteCount);
    var fluteDummy = new THREE.Object3D();
    for (var f = 0; f < fluteCount; f++) {
      var fa = (f / fluteCount) * Math.PI * 2;
      fluteDummy.position.set(Math.sin(fa) * 1.0, Math.cos(fa) * 1.0, 0.17);
      fluteDummy.rotation.z = -fa;
      fluteDummy.updateMatrix();
      fluteMesh.setMatrixAt(f, fluteDummy.matrix);
    }
    fluteMesh.instanceMatrix.needsUpdate = true;
    group.add(fluteMesh);

    // Dial
    var dialGeo = new THREE.CircleGeometry(0.86, 64);
    var dialMesh = new THREE.Mesh(dialGeo, dialMat);
    dialMesh.position.z = 0.175;
    group.add(dialMesh);

    // Crystal
    var crystalGeo = new THREE.CircleGeometry(0.9, 64);
    var crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    crystalMesh.position.z = 0.2;
    group.add(crystalMesh);

    // Markers
    var markerGroup = new THREE.Group();
    for (var i = 0; i < 12; i++) {
      var angle = (i / 12) * Math.PI * 2;
      var mGeo = (i % 3 === 0) ? new THREE.BoxGeometry(0.05, 0.13, 0.02) : new THREE.BoxGeometry(0.025, 0.08, 0.02);
      var mMesh = new THREE.Mesh(mGeo, markerMat);
      mMesh.position.set(Math.sin(angle) * 0.72, Math.cos(angle) * 0.72, 0.19);
      markerGroup.add(mMesh);
    }
    group.add(markerGroup);

    // Hands (10:10 aesthetic)
    function makeHand(length, width, colorMat, angleDeg) {
      var handGroup = new THREE.Group();
      var geo = new THREE.BoxGeometry(width, length, 0.02);
      geo.translate(0, length / 2, 0);
      var mesh = new THREE.Mesh(geo, colorMat);
      handGroup.add(mesh);
      handGroup.position.z = 0.195;
      handGroup.rotation.z = -THREE.MathUtils.degToRad(angleDeg);
      return handGroup;
    }
    var hourHand = makeHand(0.42, 0.045, markerMat, 305);
    var minuteHand = makeHand(0.62, 0.03, markerMat, 60);
    var secondMat = new THREE.MeshStandardMaterial({ color: 0xb5453a, metalness: 0.4, roughness: 0.4 });
    var secondHand = makeHand(0.66, 0.012, secondMat, 178);
    group.add(hourHand, minuteHand, secondHand);

    var hubGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.03, 16);
    var hub = new THREE.Mesh(hubGeo, markerMat);
    hub.rotation.x = Math.PI / 2;
    hub.position.z = 0.2;
    group.add(hub);

    // Crown
    var crownGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.14, 20);
    var crown = new THREE.Mesh(crownGeo, bezelMat);
    crown.rotation.z = Math.PI / 2;
    crown.position.set(1.08, 0, 0);
    group.add(crown);

    // Strap — plain band (leather / rubber)
    var plainStrapGroup = new THREE.Group();
    [1, -1].forEach(function (dir) {
      var segGeo = new THREE.BoxGeometry(0.55, 1.1, 0.12);
      var seg = new THREE.Mesh(segGeo, strapMat);
      seg.position.set(0, dir * 1.35, -0.02);
      plainStrapGroup.add(seg);
    });
    group.add(plainStrapGroup);

    // Strap — bracelet (segmented links)
    var braceletGroup = new THREE.Group();
    [1, -1].forEach(function (dir) {
      for (var l = 0; l < 5; l++) {
        var linkGeo = new THREE.BoxGeometry(0.6, 0.19, 0.1);
        var link = new THREE.Mesh(linkGeo, strapMat);
        link.position.set(0, dir * (1.05 + l * 0.22), -0.02);
        braceletGroup.add(link);
      }
    });
    group.add(braceletGroup);

    function applyStrapVisibility(type) {
      var isBracelet = type === 'bracelet';
      plainStrapGroup.visible = !isBracelet;
      braceletGroup.visible = isBracelet;
    }
    applyStrapVisibility(strapType);

    group.traverse(function (obj) {
      if (obj.isMesh) obj.castShadow = true;
    });

    return {
      group: group,
      parts: {
        caseMat: caseMat, bezelMat: bezelMat, dialMat: dialMat, markerMat: markerMat, strapMat: strapMat,
        secondHand: secondHand,
        applyStrapVisibility: applyStrapVisibility
      }
    };
  }

  function updateWatchModel(model, config) {
    var caseColors = COLOR_HEX.case[config.case] || COLOR_HEX.case.steel;
    var dialColorHex = COLOR_HEX.dial[config.dial] || COLOR_HEX.dial.obsidian;
    var markerHex = markerColorFor(config.dial);

    model.parts.caseMat.color.set(caseColors.mid);
    model.parts.bezelMat.color.set(caseColors.light);
    model.parts.dialMat.color.set(dialColorHex);
    model.parts.markerMat.color.set(markerHex);

    var strapColor = config.strap === 'bracelet' ? caseColors.mid : (config.strap === 'rubber' ? '#1c1c1e' : '#5b3a29');
    model.parts.strapMat.color.set(strapColor);
    model.parts.strapMat.metalness = config.strap === 'bracelet' ? 0.85 : 0.05;
    model.parts.strapMat.roughness = config.strap === 'bracelet' ? 0.3 : 0.75;
    model.parts.applyStrapVisibility(config.strap);
  }

  function setupLighting(scene, opts) {
    opts = opts || {};
    var ambient = new THREE.AmbientLight(0xffffff, 0.35);
    var key = new THREE.DirectionalLight(0xffe3b0, 1.15);
    key.position.set(2.5, 3.4, 3);
    if (opts.shadows) {
      key.castShadow = true;
      key.shadow.mapSize.width = 512;
      key.shadow.mapSize.height = 512;
      key.shadow.camera.near = 0.5;
      key.shadow.camera.far = 10;
      key.shadow.camera.left = -2.2;
      key.shadow.camera.right = 2.2;
      key.shadow.camera.top = 2.2;
      key.shadow.camera.bottom = -2.2;
      key.shadow.bias = -0.0015;
      key.shadow.radius = 4;
    }
    var rim = new THREE.DirectionalLight(0xbfd4ff, 0.6);
    rim.position.set(-3, 1.5, -2);
    var fill = new THREE.HemisphereLight(0x2a2a30, 0x08080a, 0.5);
    scene.add(ambient, key, rim, fill);
    return key;
  }

  function fallbackWatchVisual(container, opts) {
    container.classList.add('fallback-3d');
    var wrap = document.createElement('div');
    wrap.className = 'fallback-watch-wrap';
    wrap.innerHTML = buildWatchSVG(opts || {});
    container.appendChild(wrap);
    return wrap;
  }

  /* ---- HERO SCENE ---- */
  function initThreeHero() {
    var canvas = qs('#hero-canvas');
    var heroSection = qs('.hero');
    if (!canvas || !heroSection) return;

    if (typeof THREE === 'undefined' || !hasWebGL()) {
      canvas.style.display = 'none';
      fallbackWatchVisual(heroSection, { caseType: 'steel', dialType: 'obsidian', strapType: 'leather' });
      return;
    }

    try {
      var scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x08080a, 4.5, 10);
      scene.environment = buildEnvTexture();

      var camera = new THREE.PerspectiveCamera(38, heroSection.clientWidth / heroSection.clientHeight, 0.1, 100);
      var baseCamPos = { x: 0, y: 0.4, z: 5.6 };
      // Camera starts pulled back for a slow cinematic dolly-in once the preloader clears.
      camera.position.set(baseCamPos.x, baseCamPos.y, baseCamPos.z + 2.6);
      camera.lookAt(0, 0, 0);

      var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(heroSection.clientWidth, heroSection.clientHeight);
      if (renderer.outputEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      setupLighting(scene, { shadows: true });

      var floorY = -1.4;
      var floorGeo = new THREE.PlaneGeometry(8, 8);
      var floorMat = new THREE.MeshBasicMaterial({ map: makeFloorTexture(), transparent: true });
      var floor = new THREE.Mesh(floorGeo, floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = floorY;
      scene.add(floor);

      var shadowCatcher = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShadowMaterial({ opacity: 0.38 }));
      shadowCatcher.rotation.x = -Math.PI / 2;
      shadowCatcher.position.y = floorY + 0.002;
      shadowCatcher.receiveShadow = true;
      scene.add(shadowCatcher);

      var model = buildWatchModel({ caseType: 'steel', dialType: 'obsidian', strapType: 'leather' });
      model.group.scale.setScalar(1.55);
      model.group.position.y = 0.15;
      scene.add(model.group);

      // Cheap "poor man's" mirror reflection: a dimmed, vertically-flipped clone.
      var reflection = model.group.clone(true);
      reflection.traverse(function (obj) {
        if (obj.isMesh) {
          obj.material = obj.material.clone();
          obj.material.transparent = true;
          obj.material.opacity = 0.14;
          obj.castShadow = false;
          obj.receiveShadow = false;
        }
      });
      reflection.scale.set(model.group.scale.x, -model.group.scale.y, model.group.scale.z);
      scene.add(reflection);

      heroSceneRefs = { model: model, camera: camera, baseCamPos: baseCamPos };

      var pointer = { x: 0, y: 0 };
      var dragging = false;
      var lastX = 0, lastY = 0;
      var manualRotY = 0, manualRotX = 0;
      var rotVelocity = 0;

      window.addEventListener('mousemove', function (e) {
        pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
      });

      canvas.style.pointerEvents = 'auto';
      canvas.style.cursor = 'grab';
      canvas.addEventListener('pointerdown', function (e) {
        dragging = true; lastX = e.clientX; lastY = e.clientY; rotVelocity = 0; canvas.style.cursor = 'grabbing';
      });
      window.addEventListener('pointerup', function () { dragging = false; canvas.style.cursor = 'grab'; });
      window.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        var dx = e.clientX - lastX, dy = e.clientY - lastY;
        lastX = e.clientX; lastY = e.clientY;
        var delta = dx * 0.006;
        manualRotY += delta;
        rotVelocity = delta;
        manualRotX = Math.max(-0.4, Math.min(0.4, manualRotX + dy * 0.004));
      });

      function onResize() {
        var w = heroSection.clientWidth, h = heroSection.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
      window.addEventListener('resize', onResize);

      // Skip the (relatively costly) render entirely once the hero has scrolled
      // out of view — keeps the page light while browsing the rest of the site.
      var heroVisible = true;
      if (typeof IntersectionObserver !== 'undefined') {
        new IntersectionObserver(function (entries) {
          heroVisible = entries[0].isIntersecting;
        }, { threshold: 0.01 }).observe(heroSection);
      }

      var autoRot = 0;
      var clock = new THREE.Clock();

      function animate() {
        requestAnimationFrame(animate);
        if (!heroVisible) return;
        var t = clock.getElapsedTime();

        if (!REDUCED_MOTION) {
          if (!dragging) {
            autoRot += 0.0022;
            if (Math.abs(rotVelocity) > 0.0001) {
              manualRotY += rotVelocity;
              rotVelocity *= 0.94;
            } else {
              rotVelocity = 0;
            }
          }
          model.group.rotation.y = autoRot + manualRotY;
          model.group.rotation.x = manualRotX + Math.sin(t * 0.4) * 0.02;
          model.group.position.y = 0.15 + Math.sin(t * 0.6) * 0.05;
          model.parts.secondHand.rotation.z = -(t * (Math.PI * 2 / 20));

          reflection.rotation.copy(model.group.rotation);
          reflection.position.y = 2 * floorY - model.group.position.y;

          var targetX = baseCamPos.x + pointer.x * 0.35;
          var targetY = baseCamPos.y - pointer.y * 0.18;
          camera.position.x += (targetX - camera.position.x) * 0.04;
          camera.position.y += (targetY - camera.position.y) * 0.04;
          camera.lookAt(0, 0.1, 0);
        } else {
          model.group.rotation.y = manualRotY;
          reflection.rotation.y = manualRotY;
          reflection.position.y = 2 * floorY - model.group.position.y;
        }

        renderer.render(scene, camera);
      }
      animate();
    } catch (err) {
      console.warn('CHRONOVA: hero 3D unavailable, using fallback visual.', err);
      canvas.style.display = 'none';
      fallbackWatchVisual(heroSection, { caseType: 'steel', dialType: 'obsidian', strapType: 'leather' });
    }
  }

  /* ---- CONFIGURATOR SCENE ---- */
  function initThreeConfigurator() {
    var canvas = qs('#config-canvas');
    var stage = qs('.configurator-stage');
    if (!canvas || !stage) return;

    if (typeof THREE === 'undefined' || !hasWebGL()) {
      canvas.style.display = 'none';
      var fb = fallbackWatchVisual(stage, currentConfig);
      onConfigChange = function (cfg) {
        fb.innerHTML = buildWatchSVG({ caseType: cfg.case, dialType: cfg.dial, strapType: cfg.strap });
      };
      return;
    }

    try {
      var scene = new THREE.Scene();
      scene.environment = buildEnvTexture();

      var camera = new THREE.PerspectiveCamera(34, stage.clientWidth / stage.clientHeight, 0.1, 100);
      camera.position.set(0, 0.25, 5);
      camera.lookAt(0, 0, 0);

      var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(stage.clientWidth, stage.clientHeight);
      if (renderer.outputEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      setupLighting(scene, { shadows: true });

      var shadowCatcher = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.ShadowMaterial({ opacity: 0.3 }));
      shadowCatcher.rotation.x = -Math.PI / 2;
      shadowCatcher.position.y = -1.15;
      shadowCatcher.receiveShadow = true;
      scene.add(shadowCatcher);

      var model = buildWatchModel({ caseType: currentConfig.case, dialType: currentConfig.dial, strapType: currentConfig.strap });
      model.group.scale.setScalar(1.65);
      scene.add(model.group);

      onConfigChange = function (cfg) { updateWatchModel(model, cfg); };

      var dragging = false, lastX = 0, rotY = 0.4, rotVelocity = 0;
      canvas.style.cursor = 'grab';
      canvas.addEventListener('pointerdown', function (e) { dragging = true; lastX = e.clientX; rotVelocity = 0; canvas.style.cursor = 'grabbing'; });
      window.addEventListener('pointerup', function () { dragging = false; canvas.style.cursor = 'grab'; });
      window.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        var dx = e.clientX - lastX; lastX = e.clientX;
        var delta = dx * 0.008;
        rotY += delta;
        rotVelocity = delta;
      });

      function onResize() {
        var w = stage.clientWidth, h = stage.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
      window.addEventListener('resize', onResize);

      var configVisible = true;
      if (typeof IntersectionObserver !== 'undefined') {
        new IntersectionObserver(function (entries) {
          configVisible = entries[0].isIntersecting;
        }, { threshold: 0.01 }).observe(stage);
      }

      var clock = new THREE.Clock();
      function animate() {
        requestAnimationFrame(animate);
        if (!configVisible) return;
        var t = clock.getElapsedTime();
        if (!dragging && !REDUCED_MOTION) {
          rotY += 0.0015;
          if (Math.abs(rotVelocity) > 0.0001) { rotY += rotVelocity; rotVelocity *= 0.94; } else { rotVelocity = 0; }
        }
        model.group.rotation.y = rotY;
        model.group.position.y = REDUCED_MOTION ? 0 : Math.sin(t * 0.7) * 0.04;
        model.parts.secondHand.rotation.z = -(t * (Math.PI * 2 / 20));
        renderer.render(scene, camera);
      }
      animate();
    } catch (err) {
      console.warn('CHRONOVA: configurator 3D unavailable, using fallback visual.', err);
      canvas.style.display = 'none';
      var fb2 = fallbackWatchVisual(stage, currentConfig);
      onConfigChange = function (cfg) {
        fb2.innerHTML = buildWatchSVG({ caseType: cfg.case, dialType: cfg.dial, strapType: cfg.strap });
      };
    }
  }

  /* ------------------------------------------------------------------------
     16. FOOTER YEAR
     ------------------------------------------------------------------------ */
  function initFooterYear() {
    var el = qs('#footer-year');
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ------------------------------------------------------------------------
     BOOT
     ------------------------------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', function () {
    initHeroCharReveal(); // must run before the preloader finishes and calls revealHero()
    initPreloader();
    initNav();
    initSearch();
    renderProducts();
    updateWishlistBadge();
    initCart();
    initModal();
    initNewsletter();
    initConfigurator();
    initFooterYear();

    // Three.js scenes (each is self-contained and fails gracefully)
    initThreeHero();
    initThreeConfigurator();

    // Cursor, magnetism, tilt, spotlight — desktop fine-pointer only
    initCustomCursor();
    initHeroSpotlight();
    initCardTilt();
    initMagnetic('.hero-actions .btn, .editorial-text .btn, #cfg-add-cart', 0.2);
    initMagnetic('.icon-btn', 0.35);

    // Scroll-based reveals last, once layout is settled
    setTimeout(initScrollReveals, 50);
  });

})();
