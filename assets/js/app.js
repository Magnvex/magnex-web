/* ============================================================
   MAGNVEX — experiencia
   ============================================================ */
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
const hasGsap = !!(gsap && ScrollTrigger);

/* ---------- Sonido (Web Audio, sintetizado en vivo) ---------- */
const Sound = (() => {
  let ctx = null, master = null, amb = null, on = false, lastHover = 0, noiseBuf = null;
  function init() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp).connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // ambiente: dron grave con filtro que respira
    amb = ctx.createGain(); amb.gain.value = 0.0;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320; lp.Q.value = 6;
    [[55, 'sawtooth', 0], [82.4, 'sine', 4], [110, 'triangle', -6], [164.8, 'sine', 3]].forEach(([f, t, det]) => {
      const o = ctx.createOscillator(); o.type = t; o.frequency.value = f; o.detune.value = det;
      const g = ctx.createGain(); g.gain.value = t === 'sawtooth' ? 0.18 : 0.3;
      o.connect(g).connect(lp); o.start();
    });
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lfoG = ctx.createGain(); lfoG.gain.value = 220; lfo.connect(lfoG).connect(lp.frequency); lfo.start();
    lp.connect(amb).connect(master);
  }
  function env(node, t, a, peak, d) {
    node.gain.setValueAtTime(0.0001, t); node.gain.exponentialRampToValueAtTime(peak, t + a); node.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  function tone(freq, to, dur, peak, type = 'sine') {
    if (!on) return; const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain(); env(g, t, 0.004, peak, dur);
    o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.05);
  }
  return {
    get on() { return on; },
    toggle() {
      if (!ctx) init();
      on = !on;
      if (ctx.state === 'suspended') ctx.resume();
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t); master.gain.setTargetAtTime(on ? 0.9 : 0, t, 0.15);
      amb.gain.cancelScheduledValues(t); amb.gain.setTargetAtTime(on ? 0.05 : 0, t, 1.2);
      if (on) { tone(220, 880, 0.35, 0.08, 'triangle'); setTimeout(() => tone(660, 1320, 0.4, 0.05), 90); }
      return on;
    },
    hover() { const n = performance.now(); if (n - lastHover < 60) return; lastHover = n; tone(1900, 2600, 0.05, 0.025); },
    click() { tone(140, 48, 0.22, 0.22); tone(2400, 1200, 0.06, 0.04, 'square'); },
    whoosh(strength = 1) {
      if (!on) return; const t = ctx.currentTime;
      const s = ctx.createBufferSource(); s.buffer = noiseBuf;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.4;
      bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(2600, t + 0.45); bp.frequency.exponentialRampToValueAtTime(500, t + 0.9);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09 * strength, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);
      s.connect(bp).connect(g).connect(master); s.start(t); s.stop(t + 1);
    },
    tick() { tone(3200, null, 0.015, 0.012, 'square'); },
    chord() { if (!on) return; [261.6, 329.6, 392, 523.3].forEach((f, i) => setTimeout(() => tone(f, f * 1.003, 1.4, 0.04, 'sine'), i * 70)); }
  };
})();

const soundBtn = $('#sound-btn');
soundBtn.addEventListener('click', () => {
  const on = Sound.toggle();
  soundBtn.classList.toggle('on', on);
  soundBtn.setAttribute('aria-pressed', on);
  soundBtn.setAttribute('aria-label', on ? 'Desactivar sonido' : 'Activar sonido');
});
const interactive = 'a, button, .svc, .pack, .channel';
document.addEventListener('pointerover', e => { const el = e.target.closest(interactive); if (el && !el.contains(e.relatedTarget)) Sound.hover(); });
document.addEventListener('click', e => { if (e.target.closest(interactive) && !e.target.closest('#sound-btn')) Sound.click(); });

/* ---------- Cursor ---------- */
if (finePointer && !reduced) {
  const dot = $('.cursor'), ring = $('.cursor-ring');
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
  addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; document.body.classList.add('has-cursor'); }, { passive: true });
  document.addEventListener('pointerleave', () => document.body.classList.remove('has-cursor'));
  (function loop() {
    rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
    dot.style.transform = `translate3d(${mx}px,${my}px,0)`;
    ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
    requestAnimationFrame(loop);
  })();
  document.addEventListener('pointerover', e => {
    const card = e.target.closest('.svc, .reel');
    const link = e.target.closest('a, button, input, textarea');
    ring.classList.toggle('label', !!card);
    ring.classList.toggle('hover', !card && !!link);
  });
  // botones magnéticos
  $$('.magnetic').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${x * 0.28}px, ${y * 0.38}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transition = 'transform .7s cubic-bezier(.22,1,.36,1), box-shadow .4s'; el.style.transform = ''; setTimeout(() => el.style.transition = '', 700); });
  });
  // tarjetas: inclinación 3D + foco de luz
  $$('.svc').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', px * 100 + '%'); card.style.setProperty('--my', py * 100 + '%');
      card.style.transform = `rotateY(${(px - 0.5) * 9}deg) rotateX(${(0.5 - py) * 9}deg) translateZ(0)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transition = 'transform .9s cubic-bezier(.22,1,.36,1), border-color .5s'; card.style.transform = ''; setTimeout(() => card.style.transition = '', 900); });
  });
}

/* ---------- Menú móvil ---------- */
const menuBtn = $('#menu-btn');
menuBtn.addEventListener('click', () => {
  const open = document.body.classList.toggle('menu-open');
  menuBtn.setAttribute('aria-expanded', open);
  menuBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
});
$$('#nav-links a').forEach(a => a.addEventListener('click', () => { document.body.classList.remove('menu-open'); menuBtn.setAttribute('aria-expanded', 'false'); }));

/* ---------- Reloj ---------- */
const clock = $('#clock');
const tickClock = () => { try { clock.textContent = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' }).format(new Date()); } catch { } };
tickClock(); setInterval(tickClock, 30000);

/* ---------- Modal de servicios ---------- */
const SVC = {
  auditoria: { icon: 'i-target', name: 'Auditoría Estratégica', sub: 'Diagnóstico completo · Entrega en 48h · Precio a medida',
    desc: 'Analizamos tu negocio de arriba a abajo en menos de 48 horas. Detectamos exactamente qué te está frenando y te entregamos un plan de acción concreto y priorizado para empezar a crecer desde el primer día. Sin rodeos, sin relleno: solo la verdad de tu negocio y cómo mejorarla.',
    feats: ['Análisis completo de tu presencia digital actual', 'Evaluación de captación y conversión de clientes', 'Detección de fallos operativos que te cuestan dinero', 'Oportunidades de IA específicas para tu tipo de negocio', 'Plan de acción priorizado y 100% accionable', 'Informe profesional en PDF listo para compartir'] },
  instagram: { icon: 'i-camera', name: 'Marca en Instagram', sub: 'Perfil profesional que atrae clientes · Entrega en 5 días · Precio a medida',
    desc: 'Transformamos tu perfil de Instagram en una máquina de atraer clientes. Construimos una identidad visual coherente, una bio que convierte y una estrategia de contenido clara para que tu negocio destaque y genere confianza desde el primer vistazo.',
    feats: ['Auditoría completa de tu perfil actual', 'Bio rediseñada y optimizada para la conversión', 'Identidad visual coherente con tu marca', 'Guía de contenido, tono de voz y frecuencia', '12 plantillas de publicación listas para usar', 'Estrategia de hashtags para aumentar el alcance'] },
  web: { icon: 'i-web', name: 'Web Profesional', sub: 'Web que convierte visitas en clientes · Entrega en 7 días · Precio a medida',
    desc: 'Diseñamos y desarrollamos tu web a medida: una página que no solo se ve bien, sino que trabaja para ti las 24 horas. Rápida, optimizada para buscadores, perfecta en móvil y lista para publicar. Una web que transmite autoridad y convierte visitantes en clientes reales.',
    feats: ['Diseño exclusivo a medida para tu negocio', 'Optimizada para móvil, tablet y escritorio', 'SEO básico para que te encuentren en Google', 'Formulario de contacto funcional', 'Velocidad de carga optimizada al máximo', 'Publicación online incluida', '1 mes de soporte después de la entrega'] },
  automatizacion: { icon: 'i-chat', name: 'Bot de Reservas Esencial', sub: 'Recepcionista de IA en WhatsApp · Puesta en marcha + cuota mensual',
    desc: 'Montamos un bot de inteligencia artificial en tu WhatsApp que atiende a tus pacientes las 24 horas: coge la cita, la confirma y envía recordatorios automáticos para que no se les olvide. El resultado: menos huecos en tu agenda y menos no-shows. Una sola cita recuperada al mes ya cubre buena parte de la mensualidad.',
    feats: ['Reservas automáticas por WhatsApp, 24/7', 'Confirmaciones y recordatorios de cita automáticos', 'Reduce drásticamente los no-shows', 'Responde solo a las preguntas frecuentes de pacientes', 'Aviso instantáneo a tu equipo de cada nueva reserva', 'Puesta en marcha en 7–10 días · sin permanencia'] },
  'automatizacion-pro': { icon: 'i-cycle', name: 'Sistema de Reservas Pro', sub: 'Agenda llena y pacientes que vuelven · Puesta en marcha + cuota mensual',
    desc: 'El sistema completo para que tu agenda no pare. Además de coger y recordar citas, gestiona reprogramaciones y cancelaciones solo, mantiene una lista de espera que rellena los huecos al instante y reactiva a pacientes que llevan tiempo sin venir. Cuesta menos que media recepcionista y trabaja sin descanso, sin bajas y sin vacaciones.',
    feats: ['Todo lo del plan Esencial incluido', 'Reprogramación y cancelaciones automáticas', 'Lista de espera inteligente que rellena huecos al momento', 'Reactivación automática de pacientes inactivos', 'Sincronización con tu calendario o Google Sheets', 'Recordatorios multicanal (WhatsApp + email)', 'Optimización continua y soporte prioritario'] },
  'automatizacion-premium': { icon: 'i-grid', name: 'Automatización a Medida', sub: 'Para grupos y multi-sede · Presupuesto personalizado',
    desc: 'La solución para grupos de clínicas y negocios donde cada hora de agenda mueve mucho dinero. Integramos tu software de gestión (Gesden, Klinikare y similares), tu CRM y tu facturación en un sistema de IA que orquesta todo el flujo de pacientes entre sedes. Lo diseñamos a medida de tus procesos, con panel de métricas y soporte dedicado.',
    feats: ['Todo lo del plan Pro incluido', 'Integración con tu software dental, CRM y facturación', 'Gestión multi-sede y multi-agenda', 'IA conversacional avanzada adaptada a tu negocio', 'Panel de métricas y reporting en tiempo real', 'SLA garantizado y soporte dedicado', 'Presupuesto personalizado según tu operativa'] }
};
const modal = $('#svc-modal');
let lenis = null, twTimer = null, lastFocus = null;
function typewriter(el, text, speed, done) {
  clearTimeout(twTimer); el.textContent = '';
  if (reduced) { el.textContent = text; done && done(); return; }
  const cur = document.createElement('span'); cur.className = 'tw-cursor'; el.appendChild(cur);
  let i = 0;
  const step = () => {
    if (i < text.length) { const n = Math.min(text.length, i + 2); el.insertBefore(document.createTextNode(text.slice(i, n)), cur); i = n; if (i % 8 === 0) Sound.tick(); twTimer = setTimeout(step, speed); }
    else { cur.remove(); done && done(); }
  };
  step();
}
function openModal(key) {
  const d = SVC[key]; if (!d) return;
  lastFocus = document.activeElement;
  $('#modal-icon').innerHTML = `<svg><use href="#${d.icon}"/></svg>`;
  $('#modal-name').textContent = d.name;
  $('#modal-sub').textContent = d.sub;
  const fe = $('#modal-feats'); fe.innerHTML = '';
  d.feats.forEach(f => { const el = document.createElement('div'); el.className = 'modal-feat'; el.textContent = f; fe.appendChild(el); });
  modal.classList.add('open'); document.body.classList.add('modal-open'); lenis && lenis.stop(); document.documentElement.style.overflow = 'hidden';
  Sound.whoosh(0.8);
  setTimeout(() => $('#modal-close').focus(), 50);
  setTimeout(() => typewriter($('#modal-desc'), d.desc, 14, () => $$('.modal-feat').forEach((f, i) => setTimeout(() => { f.classList.add('show'); Sound.tick(); }, i * 80))), 250);
}
function closeModal() {
  if (!modal.classList.contains('open')) return;
  clearTimeout(twTimer); modal.classList.remove('open'); document.body.classList.remove('modal-open'); lenis && lenis.start(); document.documentElement.style.overflow = '';
  lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
}
$('#modal-close').addEventListener('click', closeModal);
$('#modal-bd').addEventListener('click', closeModal);
$('#modal-cta').addEventListener('click', closeModal);
addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeAd(); document.body.classList.remove('menu-open'); } });
$$('[data-service]').forEach(c => {
  c.addEventListener('click', () => openModal(c.dataset.service));
  c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(c.dataset.service); } });
});

/* ---------- Preguntas frecuentes ---------- */
$$('.faq-q').forEach(q => q.addEventListener('click', () => {
  const item = q.closest('.faq-item'), open = !item.classList.contains('open');
  $$('.faq-item.open').forEach(o => { if (o !== item) { o.classList.remove('open'); $('.faq-q', o).setAttribute('aria-expanded', 'false'); } });
  item.classList.toggle('open', open); q.setAttribute('aria-expanded', open);
  if (open) Sound.whoosh(0.4);
  setTimeout(() => window.ScrollTrigger && ScrollTrigger.refresh(), 650);
}));

/* ---------- Vídeo del bot ---------- */
const video = $('#bot-video'), vSound = $('#video-sound');
if (video) {
  let userPaused = false;
  video.addEventListener('pause', () => { if (!video.dataset.auto) userPaused = true; delete video.dataset.auto; });
  video.addEventListener('play', () => { userPaused = false; });
  new IntersectionObserver(([en]) => {
    if (en.isIntersecting && !userPaused && !reduced) video.play().catch(() => { });
    else if (!en.isIntersecting && !video.paused) { video.dataset.auto = '1'; video.pause(); }
  }, { threshold: 0.35 }).observe(video);
  const syncSound = () => {
    const on = !video.muted;
    vSound.setAttribute('aria-pressed', on);
    vSound.querySelector('span').textContent = on ? 'Silenciar audio' : 'Activar audio';
  };
  vSound.addEventListener('click', () => {
    video.muted = !video.muted;
    if (!video.muted) { if (Sound.on) soundBtn.click(); video.play().catch(() => { }); }
    syncSound();
  });
  video.addEventListener('volumechange', syncSound);
}

/* ---------- Anuncios: demos en bucle y visor ---------- */
const ADS = {
  pizza: { name: 'Pizza La Serranito', src: 'assets/media/anuncios/pizza-serranito.mp4', poster: 'assets/media/anuncios/pizza-serranito-poster-h.jpg', ratio: '16 / 9' },
  cerveza: { name: 'Spot de cerveza', src: 'assets/media/anuncios/cerveza.mp4', poster: 'assets/media/anuncios/cerveza-poster-h.jpg', ratio: '3 / 2' }
};
const adBox = $('#ad-box'), adVideo = $('#ad-box-video');
let adFocus = null;
function openAd(key) {
  const d = ADS[key]; if (!d) return;
  adFocus = document.activeElement;
  $('#ad-box-name').textContent = d.name;
  if (adVideo.getAttribute('src') !== d.src) { adVideo.poster = d.poster; adVideo.src = d.src; }
  adVideo.style.aspectRatio = d.ratio;
  adVideo.currentTime = 0; adVideo.muted = false;
  if (Sound.on) soundBtn.click();
  if (video && !video.paused) video.pause();
  adBox.classList.add('open'); document.body.classList.add('modal-open');
  lenis && lenis.stop(); document.documentElement.style.overflow = 'hidden';
  adVideo.play().catch(() => { });
  setTimeout(() => $('.modal-close', adBox).focus(), 50);
}
function closeAd() {
  if (!adBox.classList.contains('open')) return;
  adVideo.pause(); adBox.classList.remove('open'); document.body.classList.remove('modal-open');
  lenis && lenis.start(); document.documentElement.style.overflow = '';
  adFocus && adFocus.focus && adFocus.focus({ preventScroll: true });
}
$$('[data-ad]').forEach(b => b.addEventListener('click', () => openAd(b.dataset.ad)));
$$('[data-close]', adBox).forEach(b => b.addEventListener('click', closeAd));
const reelVideos = $$('.reel-video');
reelVideos.forEach(v => {
  const bar = v.parentElement.querySelector('.reel-bar i');
  v.addEventListener('timeupdate', () => { if (v.duration) bar.style.transform = `scaleX(${v.currentTime / v.duration})`; });
});
if (!reduced && reelVideos.length) {
  new IntersectionObserver(([en]) => reelVideos.forEach(v => en.isIntersecting ? v.play().catch(() => { }) : v.pause()), { threshold: 0.2 }).observe($('#ads-stage'));
}

/* ---------- Trabajos: en pantallas táctiles la captura se recorre sola al verse ---------- */
if (!reduced && matchMedia('(hover: none)').matches) {
  const panIO = new IntersectionObserver(ens => ens.forEach(en => en.target.classList.toggle('panning', en.isIntersecting)), { threshold: 0.65 });
  $$('.work-card').forEach(c => panIO.observe(c));
}

/* ---------- Formulario ---------- */
const form = $('#contactForm'), fbtn = $('#formBtn'), ftxt = fbtn.querySelector('.txt');
form.addEventListener('submit', async e => {
  e.preventDefault();
  ftxt.textContent = 'Enviando...'; fbtn.disabled = true;
  const reset = () => setTimeout(() => { ftxt.textContent = 'Enviar mensaje'; fbtn.classList.remove('ok', 'err'); fbtn.disabled = false; }, 4000);
  try {
    if (form.elements._gotcha && form.elements._gotcha.value) { ftxt.textContent = '✓ Mensaje enviado'; fbtn.classList.add('ok'); form.reset(); reset(); return; }
    const res = await fetch('https://formspree.io/f/mkoebalp', { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) });
    if (!res.ok) throw new Error();
    ftxt.textContent = '✓ Mensaje enviado'; fbtn.classList.add('ok'); form.reset(); Sound.chord();
  } catch {
    ftxt.textContent = '✗ Error, inténtalo de nuevo'; fbtn.classList.add('err');
  }
  reset();
});

/* ---------- Escena 3D del hero (Three.js) ---------- */
const hero3D = { progress: 0 };
async function initHero3D() {
  const canvas = $('#hero-canvas');
  let THREE;
  try { THREE = await import('../vendor/three.module.min.js'); } catch { return; }
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); } catch { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100); camera.position.set(0, 0, 10);

  const group = new THREE.Group(); scene.add(group);
  const geo = new THREE.OctahedronGeometry(1.9, 0);
  const core = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x5b43c8, metalness: 0.6, roughness: 0.22, flatShading: true, emissive: 0x2c1466, emissiveIntensity: 0.5 }));
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0xd9bc62, transparent: true, opacity: 0.95 }));
  const crystal = new THREE.Group(); crystal.add(core, edges); group.add(crystal);

  const shellGeo = new THREE.IcosahedronGeometry(3.2, 1);
  const shell = new THREE.LineSegments(new THREE.EdgesGeometry(shellGeo), new THREE.LineBasicMaterial({ color: 0x7c6ff0, transparent: true, opacity: 0.16 }));
  group.add(shell);
  const nodes = new THREE.Points(shellGeo, new THREE.PointsMaterial({ color: 0xa79dff, size: 0.06, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  shell.add(nodes);

  const mkRing = (r, color, op) => {
    const pts = []; for (let i = 0; i <= 160; i++) { const a = i / 160 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0)); }
    return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity: op }));
  };
  const ring1 = mkRing(4.1, 0xc8a84b, 0.35); ring1.rotation.x = 1.25; group.add(ring1);
  const ring2 = mkRing(4.6, 0x7c6ff0, 0.25); ring2.rotation.x = 1.9; ring2.rotation.y = 0.5; group.add(ring2);
  const sat = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), new THREE.MeshBasicMaterial({ color: 0xebd38a }));
  ring1.add(sat);

  // campo de partículas
  const N = innerWidth < 700 ? 900 : 2200, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const r = 5 + Math.random() * 14, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th); pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.6; pos[i * 3 + 2] = r * Math.cos(ph) - 4;
  }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xb9b2ff, size: 0.035, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(stars);

  scene.add(new THREE.AmbientLight(0x6a63b8, 0.6));
  const l1 = new THREE.PointLight(0x9d93ff, 140, 30); l1.position.set(4, 3, 5); scene.add(l1);
  const l2 = new THREE.PointLight(0xf0cc66, 110, 30); l2.position.set(-4, -2, 4); scene.add(l2);
  const l3 = new THREE.DirectionalLight(0xffffff, 1.4); l3.position.set(0, 5, 6); scene.add(l3);

  let w = 0, h = 0, baseX = 0;
  function resize() {
    w = canvas.clientWidth; h = canvas.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    const mobile = w < 900; baseX = mobile ? 0 : Math.min(3.3, w / 440);
    group.scale.setScalar(mobile ? 0.72 : 0.9);
  }
  resize(); addEventListener('resize', resize);

  let tx = 0, ty = 0, cx = 0, cy = 0, visible = true, intro = 0;
  addEventListener('pointermove', e => { tx = (e.clientX / innerWidth - 0.5); ty = (e.clientY / innerHeight - 0.5); }, { passive: true });
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(canvas);
  const clock3 = new THREE.Clock();
  const t0 = performance.now();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const dt = Math.min(clock3.getDelta(), 0.05), t = clock3.elapsedTime;
    intro = Math.min(1, (performance.now() - t0) / 2200); const ie = 1 - Math.pow(1 - intro, 4);
    cx += (tx - cx) * 0.05; cy += (ty - cy) * 0.05;
    const p = hero3D.progress;
    crystal.rotation.y += dt * (0.35 + p * 2.5); crystal.rotation.x = Math.sin(t * 0.4) * 0.15 + p * 1.2;
    shell.rotation.y -= dt * 0.08; shell.rotation.z += dt * 0.03;
    ring1.rotation.z += dt * 0.25; ring2.rotation.z -= dt * 0.18;
    sat.position.set(Math.cos(t * 0.9) * 4.1, Math.sin(t * 0.9) * 4.1, 0);
    stars.rotation.y = t * 0.012 + cx * 0.15; stars.rotation.x = cy * 0.08;
    group.position.x = baseX + cx * 0.4;
    group.position.y = -cy * 0.3 + Math.sin(t * 0.6) * 0.12 + p * 2.2;
    group.rotation.y = cx * 0.5; group.rotation.x = cy * 0.3;
    const s = (0.4 + ie * 0.6) * (1 + p * 0.35);
    crystal.scale.setScalar(s); shell.scale.setScalar(0.6 + ie * 0.4 + p * 0.6);
    camera.position.z = 10 - p * 2;
    l1.position.x = Math.cos(t * 0.5) * 5; l1.position.z = Math.sin(t * 0.5) * 5 + 2;
    renderer.render(scene, camera);
  }
  frame();
  canvas.style.opacity = 0; canvas.style.transition = 'opacity 1.6s';
  requestAnimationFrame(() => canvas.style.opacity = 1);
}
if (!reduced) initHero3D();

/* ---------- Animaciones (GSAP + Lenis) ---------- */
function splitWords(el, cls = 'split-w') {
  const walk = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const o = document.createElement('span'); o.className = cls;
          const i = document.createElement('span'); i.textContent = part; o.appendChild(i); frag.appendChild(o);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
    });
  };
  walk(el);
}

function runLoaderThen(cb) {
  const loader = $('#loader');
  if (!hasGsap || reduced) { loader.style.display = 'none'; cb(); return; }
  const count = $('#loader-count'), bar = $('#loader-bar'), obj = { v: 0 };
  const brand = $('#loader-brand'); brand.innerHTML = brand.textContent.split('').map(c => `<span>${c}</span>`).join('');
  const tl = gsap.timeline();
  tl.from('#loader-brand span', { yPercent: 110, opacity: 0, stagger: 0.05, duration: 0.8, ease: 'expo.out' }, 0)
    .to(obj, { v: 100, duration: 1.5, ease: 'power2.inOut', onUpdate: () => { count.textContent = Math.round(obj.v); bar.style.transform = `scaleX(${obj.v / 100})`; } }, 0)
    .to('.loader-center, .loader-top, .loader-bottom', { opacity: 0, y: -30, duration: 0.5, ease: 'power2.in' }, '+=0.1')
    .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'expo.inOut' }, '-=0.15')
    .add(() => { loader.style.display = 'none'; }, '>')
    .add(cb, '-=0.75');
  loader.style.clipPath = 'inset(0 0 0% 0)';
  loader.addEventListener('click', () => tl.progress(1));
}

function heroIntro() {
  if (!hasGsap || reduced) return;
  gsap.from('.hero h1 .line > span', { yPercent: 115, rotate: 4, duration: 1.4, ease: 'expo.out', stagger: 0.09 });
  gsap.from('.hero-el', { opacity: 0, y: 30, duration: 1.2, ease: 'expo.out', stagger: 0.12, delay: 0.35 });
  gsap.from('.nav-inner', { y: -40, opacity: 0, duration: 1.2, ease: 'expo.out', delay: 0.2 });
}

function initScroll() {
  if (!hasGsap) return;
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('anim');

  if (window.Lenis && !reduced) {
    lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); const t = id.length > 1 && $(id); if (!t) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(t, { offset: id === '#inicio' ? 0 : -20, duration: 1.6, easing: x => 1 - Math.pow(1 - x, 4) });
    else t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }));

  // progreso + nav
  const nav = $('#nav'); let lastY = 0;
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: self => {
    $('#progress').style.transform = `scaleX(${self.progress})`;
    const y = self.scroll(); nav.classList.toggle('scrolled', y > 40);
    nav.classList.toggle('hidden', y > 600 && y > lastY && !document.body.classList.contains('menu-open')); lastY = y;
  } });

  if (reduced) { $$('.rv').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; }); return; }

  // hero al hacer scroll
  ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true, onUpdate: s => hero3D.progress = s.progress });
  gsap.to('.hero-content', { yPercent: -28, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 20%', scrub: true } });
  gsap.to('.hero-grid', { yPercent: 30, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // marquee con velocidad según scroll
  $$('.marquee-row').forEach(row => {
    row.innerHTML += row.innerHTML;
    const dir = +row.dataset.dir;
    const tw = gsap.fromTo(row, { xPercent: dir < 0 ? 0 : -50 }, { xPercent: dir < 0 ? -50 : 0, duration: 38, ease: 'none', repeat: -1 });
    ScrollTrigger.create({ trigger: '.marquee', start: 'top bottom', end: 'bottom top', onUpdate: s => {
      const v = Math.min(Math.abs(s.getVelocity()) / 300, 6);
      gsap.to(tw, { timeScale: (s.direction) * (1 + v), duration: 0.3, overwrite: true });
    } });
  });

  // manifiesto: palabras que se iluminan
  const mt = $('#manifesto-text');
  const hlWords = ['inteligencia', 'artificial,', 'estrategia', 'números.'];
  mt.innerHTML = mt.textContent.split(' ').map(w => `<span class="mw${hlWords.includes(w) ? ' hl' : ''}">${w}</span>`).join(' ');
  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', () => {
    gsap.to('.manifesto .mw', { opacity: 1, stagger: 0.12, ease: 'none', scrollTrigger: { trigger: '.manifesto', start: 'top top', end: '+=140%', pin: true, scrub: 0.6 } });
  });
  mm.add('(max-width: 899px)', () => {
    gsap.to('.manifesto .mw', { opacity: 1, stagger: 0.12, ease: 'none', scrollTrigger: { trigger: '.manifesto p', start: 'top 80%', end: 'bottom 45%', scrub: 0.6 } });
  });

  // pilares horizontales
  mm.add('(min-width: 900px)', () => {
    const track = $('#pillars-track');
    const dist = () => track.scrollWidth - innerWidth + parseFloat(getComputedStyle(track).paddingLeft);
    const tween = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.pillars-pin', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.8, invalidateOnRefresh: true, onEnter: () => Sound.whoosh() } });
    $$('.pillar').forEach(p => {
      const num = p.querySelector('.pillar-num');
      if (num) gsap.from(num, { yPercent: 40, opacity: 0, ease: 'none', scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left 95%', end: 'left 55%', scrub: true } });
      else gsap.from(p.children, { y: 40, opacity: 0, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left 100%', end: 'left 78%', scrub: true } });
      const ic = p.querySelector('.pillar-icon');
      if (ic) gsap.fromTo(ic, { rotate: -90, scale: 0.4 }, { rotate: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left 100%', end: 'left 50%', scrub: true } });
    });
  });
  mm.add('(max-width: 899px)', () => {
    $$('.pillar').forEach(p => gsap.from(p, { y: 60, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: p, start: 'top 88%' } }));
  });

  // títulos palabra a palabra
  $$('.split').forEach(el => {
    splitWords(el);
    gsap.from(el.querySelectorAll('.split-w > span'), { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.06, scrollTrigger: { trigger: el, start: 'top 85%', onEnter: () => Sound.whoosh(0.6) } });
  });

  // revelados genéricos
  ScrollTrigger.batch('.rv', { start: 'top 90%', onEnter: els => {
    // tras un salto largo (enlace o recarga), lo que ya quedó arriba aparece al momento
    const past = els.filter(e => e.getBoundingClientRect().bottom < 0), vis = els.filter(e => !past.includes(e));
    if (past.length) gsap.set(past, { opacity: 1, y: 0, overwrite: true });
    if (vis.length) gsap.to(vis, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: Math.min(0.1, 0.5 / vis.length), overwrite: true });
  } });

  // contadores
  $$('[data-count]').forEach(el => {
    const target = +el.dataset.count, o = { v: 0 }; el.textContent = '0';
    ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => gsap.to(o, { v: target, duration: 2, ease: 'expo.out', onUpdate: () => el.textContent = Math.round(o.v), onComplete: () => el.textContent = target }) });
  });

  // anuncios: escena 3D con parallax por capas
  const scene = $('#ads-scene');
  if (scene) {
    const layers = $$('[data-depth]', scene);
    layers.forEach(l => {
      const d = +l.dataset.depth;
      gsap.fromTo(l, { y: d * 90 }, { y: d * -90, ease: 'none', scrollTrigger: { trigger: '#ads-stage', start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    gsap.fromTo(scene, { rotateX: 24, rotateY: -32 }, { rotateX: 6, rotateY: -10, ease: 'none', scrollTrigger: { trigger: '#ads-stage', start: 'top bottom', end: 'center 45%', scrub: true } });
    if (finePointer) {
      const stage = $('#ads-stage'), tilt = { x: 0, y: 0 };
      const move = () => {
        stage.style.perspectiveOrigin = `${50 - tilt.x * 60}% ${40 - tilt.y * 60}%`;
        layers.forEach(l => { const d = +l.dataset.depth; gsap.set(l, { xPercent: tilt.x * d * 8, yPercent: tilt.y * d * 6 }); });
      };
      const qx = gsap.quickTo(tilt, 'x', { duration: 1, ease: 'power3.out', onUpdate: move });
      const qy = gsap.quickTo(tilt, 'y', { duration: 1, ease: 'power3.out', onUpdate: move });
      stage.addEventListener('pointermove', e => { const r = stage.getBoundingClientRect(); qx((e.clientX - r.left) / r.width - 0.5); qy((e.clientY - r.top) / r.height - 0.5); });
      stage.addEventListener('pointerleave', () => { qx(0); qy(0); });
    }
    ScrollTrigger.create({ trigger: '#ads-stage', start: 'top 70%', once: true, onEnter: () => Sound.whoosh(0.7) });
  }
  // teléfono del bot: entra girando
  gsap.fromTo('#phone .phone-frame', { rotateY: -24, rotateX: 8, transformPerspective: 1200 }, { rotateY: 0, rotateX: 0, ease: 'none', scrollTrigger: { trigger: '#phone', start: 'top bottom', end: 'center 55%', scrub: true } });

  // parallax
  $$('[data-speed]').forEach(el => gsap.to(el, { y: () => +el.dataset.speed * 300, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
  gsap.to('[data-rotate]', { rotate: 120, ease: 'none', scrollTrigger: { trigger: '.bigcta', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.bigcta-ring', { scale: 0.7 }, { scale: 1.15, ease: 'none', scrollTrigger: { trigger: '.bigcta', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.footer-word', { yPercent: 60, opacity: 0, ease: 'none', scrollTrigger: { trigger: 'footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  gsap.from('.why-icon', { rotate: -45, scale: 0.6, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: '.why-grid', start: 'top 85%' } });

  addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
}

initScroll();
runLoaderThen(heroIntro);
