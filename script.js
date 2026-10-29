// ===== Helpers =====
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
$('#year').textContent = new Date().getFullYear();

// ===== LinkedIn: replace this with your real profile URL =====
const LINKEDIN_URL = 'https://www.linkedin.com/in/aadikg';
if (LINKEDIN_URL) { const l = $('#linkedin'); l.href = LINKEDIN_URL; l.title = 'LinkedIn'; }

// ===== Email contact modal =====
const emailTrigger = $('#email-trigger');
const emailModal = $('#email-modal');
const emailClose = $('#email-modal-close');
const copyEmail = $('#copy-email');
const emailAddress = $('#email-address');
const emailStatus = $('#email-status');
const emailValue = emailAddress.textContent.trim();
const closeEmailModal = () => {
  emailModal.hidden = true;
  emailTrigger.focus();
};
emailTrigger.addEventListener('click', e => {
  e.preventDefault();
  emailModal.hidden = false;
  emailStatus.textContent = '';
  emailClose.focus();
});
emailClose.addEventListener('click', closeEmailModal);
emailModal.addEventListener('click', e => {
  if (e.target === emailModal) closeEmailModal();
});
copyEmail.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(emailValue);
    emailStatus.textContent = 'Email copied to clipboard.';
  } catch (error) {
    emailStatus.textContent = 'Copy failed. Please select and copy the email manually.';
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !emailModal.hidden) closeEmailModal();
});

// ===== Phone contact modal =====
const phoneTrigger = $('#phone-trigger');
const phoneModal = $('#phone-modal');
const phoneClose = $('#phone-modal-close');
const copyPhone = $('#copy-phone');
const phoneNumber = $('#phone-number');
const phoneStatus = $('#phone-status');
const phoneValue = phoneNumber.textContent.trim();
const closePhoneModal = () => {
  phoneModal.hidden = true;
  phoneTrigger.focus();
};
phoneTrigger.addEventListener('click', e => {
  e.preventDefault();
  phoneModal.hidden = false;
  phoneStatus.textContent = '';
  phoneClose.focus();
});
phoneClose.addEventListener('click', closePhoneModal);
phoneModal.addEventListener('click', e => {
  if (e.target === phoneModal) closePhoneModal();
});
copyPhone.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(phoneValue);
    phoneStatus.textContent = 'Phone number copied to clipboard.';
  } catch (error) {
    phoneStatus.textContent = 'Copy failed. Please select and copy the number manually.';
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !phoneModal.hidden) closePhoneModal();
});

// ===== Mobile menu =====
const burger = $('#burger'), menu = $('#menu');
const closeMenu = () => { menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); };
burger.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
});
$$('#menu a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

// ===== Scroll: nav background, progress bar, back-to-top =====
const nav = $('#nav'), bar = $('#progress'), topBtn = $('#top');
addEventListener('scroll', () => {
  const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
  nav.classList.toggle('solid', y > 40);
  bar.style.width = (y / h * 100) + '%';
  topBtn.classList.toggle('show', y > 600);
}, { passive: true });
topBtn.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

// ===== Active nav link =====
const links = $$('#menu a:not(.nav-cta)');
const spy = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
$$('main section[id]').forEach(s => spy.observe(s));

// ===== Scroll reveal (staggered inside grids) + stat counters =====
$$('.grid, .skill-groups, .stats').forEach(g => $$('.reveal', g).forEach((el, i) => el.style.setProperty('--d', i * 0.09 + 's')));
const countUp = el => {
  const to = +el.dataset.count; let n = 0;
  const t = setInterval(() => { el.textContent = ++n; if (n >= to) clearInterval(t); }, 1000 / (to + 2) + 60);
};
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in');
  const c = $('[data-count]', e.target); if (c) countUp(c);
  io.unobserve(e.target);
}), { threshold: 0.15 });
$$('.reveal, .vline').forEach(el => io.observe(el));

// ===== Slideshows: photos at <data-dir>/1.jpg ... n.jpg, 3s per slide, play only while on screen =====
$$('.show').forEach(s => {
  const d = s.dataset.dir, ext = s.dataset.ext || 'jpg', n = +s.dataset.n || 3;
  $('.ph', s).textContent = '';
  let i = 0, t;
  const setSlideSize = im => {
    if (!im || !im.naturalWidth || !im.naturalHeight) return;
    if (s.closest('.edu-row')) {
      const scale = Math.min(240 / im.naturalWidth, 180 / im.naturalHeight);
      const width = Math.round(im.naturalWidth * scale);
      const height = Math.round(im.naturalHeight * scale);
      s.style.setProperty('--edu-slide-width', `${width}px`);
      s.style.setProperty('--edu-slide-ratio', `${width} / ${height}`);
      s.classList.add('ready');
    } else {
      s.style.setProperty('--slide-ratio', `${im.naturalWidth} / ${im.naturalHeight}`);
    }
  };
  const imgs = Array.from({ length: n }, (_, k) => {
    const im = new Image(); im.alt = '';
    im.addEventListener('load', () => {
      if (im === imgs[i % imgs.length]) setSlideSize(im);
    });
    im.onerror = () => { im.remove(); imgs.splice(imgs.indexOf(im), 1); paint(); };
    im.src = `${d}/${k + 1}.${ext}`;
    s.append(im); return im;
  });
  const paint = () => {
    const active = imgs[i % imgs.length];
    setSlideSize(active);
    imgs.forEach((im, k) => im.classList.toggle('on', k === i % imgs.length));
  };
  const play = () => { if (t || reduce) return; t = setInterval(() => { if (imgs.length > 1) { i++; paint(); } }, 3000); };
  const stop = () => { clearInterval(t); t = 0; };
  paint();
  const educationRow = s.closest('.edu-row');
  if (educationRow) {
    educationRow.addEventListener('mouseenter', play);
    educationRow.addEventListener('mouseleave', stop);
  } else {
    new IntersectionObserver(([e]) => e.isIntersecting ? play() : stop()).observe(s);
  }
  if (s.getAttribute('href') === '#') s.addEventListener('click', e => e.preventDefault());
});

// ===== Project tabs =====
$$('.tab').forEach(b => b.addEventListener('click', () => {
  $$('.tab').forEach(t => t.classList.toggle('on', t === b));
  $$('.proj-grid').forEach(g => g.hidden = g.id !== 'tab-' + b.dataset.tab);
}));

// ===== Hand-drawn arrows: left column cards point in from the left, right column from the right =====
const ARROW = '<span class="arrow-mark"><svg class="arr" viewBox="0 0 80 110" aria-hidden="true"><path pathLength="1" d="M10 104C-4 56 26 22 62 24"/><path pathLength="1" d="M44 6L64 24L42 40"/></svg><span class="arrow-demo">Live Demo <span class="demo-emoji" aria-hidden="true"></span></span></span>';
$$('.proj-grid').forEach(g => $$('.proj', g).forEach((c, i) => c.classList.add(i % 2 ? 'ar-r' : 'ar-l')));
$$('.proj, .hack.ar-l').forEach(c => {
  c.insertAdjacentHTML('afterbegin', ARROW);
  const title = ($('h3', c)?.textContent || '').toLowerCase();
  const emojis = title.includes('fitness') ? ['🔥', '🏋️', '🤖'] :
    title.includes('video') || title.includes('chat') ? ['🔥', '🎥', '⚡'] :
    title.includes('railway') || title.includes('navigation') ? ['🔥', '🚆', '📍'] :
    title.includes('coding') || title.includes('gdsc') ? ['🔥', '💻', '🤖'] :
    title.includes('study') || title.includes('teacher') ? ['🔥', '📚', '🧠'] :
    title.includes('farmer') ? ['🔥', '🌱', '📱'] :
    title.includes('etl') || title.includes('workflow') ? ['🔥', '⚙️', '📊'] :
    ['🔥', '💻', '⚡'];
  const emoji = $('.demo-emoji', c);
  let index = 0;
  emoji.textContent = emojis[index];
  if (!reduce) setInterval(() => {
    index = (index + 1) % emojis.length;
    emoji.textContent = emojis[index];
  }, 1200);
});

// ===== Typed role line =====
const phrases = ['scalable backend systems', 'full-stack web apps', 'real-time experiences', 'AI-powered products', 'things worth shipping'];
let p = 0, c = 0, del = false;
(function type() {
  const el = $('#typed'), w = phrases[p];
  el.textContent = reduce ? w : w.slice(0, c);
  if (reduce) return;
  if (!del && c === w.length) { del = true; return setTimeout(type, 1500); }
  if (del && c === 0) { del = false; p = (p + 1) % phrases.length; }
  c += del ? -1 : 1;
  setTimeout(type, del ? 35 : 75);
})();

// ===== Animated git log: selected career highlights =====
const log = [
  ['$ git log --oneline --reverse', ''],
  ['a1c4e07', 'init: B.Tech in AI & Data Science begins (Aug 2022)'],
  ['92ac5b8', 'feat: Lyvio, real-time chat and video calls (Jul 2025)'],
  ['d3e71f4', 'feat: MetaFit AI, voice-driven fitness coach (Sep 2025)'],
  ['4a8f20c', 'feat: Expeditors, ETL pipeline and workflow system (Dec 2025)'],
  ['f3a9c21', 'award: Expeditors Award of Excellence (Jan 2026)', true]
];
const pre = $('#gitlog'); let li = 0;
function line() {
  if (li >= log.length) return;
  const [h, m, head] = log[li++];
  pre.innerHTML += li === 1
    ? `<span class="c">${h}</span>\n`
    : `<span class="h">${h}</span>${head ? ' <span class="c">(HEAD -> main)</span>' : ''} ${m}\n`;
  setTimeout(line, reduce ? 0 : 650);
}
setTimeout(line, reduce ? 0 : 1800); // start after the name finishes writing

// ===== Cursor glow + card tilt (desktop only) =====
if (matchMedia('(hover:hover)').matches && !reduce) {
  const g = $('#glow');
  addEventListener('mousemove', e => { g.style.left = e.clientX + 'px'; g.style.top = e.clientY + 'px'; });
  $$('.tilt').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      card.style.transform = `perspective(700px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => card.style.transform = '');
  });
}

// ===== Contact form: validation + mailto fallback =====
const form = $('#form');
const rules = {
  name: v => v.trim().length >= 2 || 'Enter your name.',
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Enter a valid email address.',
  subject: v => v.trim().length >= 3 || 'Enter a subject.',
  message: v => v.trim().length >= 10 || 'Write at least 10 characters.'
};
const check = k => {
  const f = form[k], r = rules[k](f.value);
  $('#e-' + k).textContent = r === true ? '' : r;
  f.classList.toggle('bad', r !== true);
  f.setAttribute('aria-invalid', r !== true);
  return r === true;
};
Object.keys(rules).forEach(k => form[k].addEventListener('blur', () => check(k)));
form.addEventListener('submit', e => {
  e.preventDefault();
  if (!Object.keys(rules).map(check).every(Boolean)) return;
  // No backend: open the visitor's email app. Swap for fetch() to Formspree/Netlify later.
  const body = `${form.message.value}\n\n— ${form.name.value} (${form.email.value})`;
  location.href = `mailto:aadithyakg04@gmail.com?subject=${encodeURIComponent(form.subject.value)}&body=${encodeURIComponent(body)}`;
  $('#status').textContent = 'Opening your email app. If nothing opens, email aadithyakg04@gmail.com directly.';
  form.reset();
});
