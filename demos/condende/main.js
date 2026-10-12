/* Motor de sonido (basado en _assets/sonido.js) · timbre de marimba + ambiente de selva */
function crearSonido(opts){
  opts=Object.assign({base:262,volumen:.45},opts||{});
  let ctx=null,master=null,on=false,amb=null,last=0,birds=null;const subs=[];
  function init(){if(ctx)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ctx=new AC();master=ctx.createGain();master.gain.value=opts.volumen;const comp=ctx.createDynamicsCompressor();master.connect(comp);comp.connect(ctx.destination)}
  function env(g,t,a,d,p){g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(p,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d)}
  function marimba(freq,dur,peak){if(!on||!ctx)return;const t=ctx.currentTime;
    [[1,'sine',1],[4,'sine',.18],[10,'sine',.05]].forEach(([m,ty,k])=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=ty;o.frequency.value=freq*m;env(g,t,.004,dur/(m>1?3:1),peak*k);o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+.05)})}
  function ruido(dur,desde,hasta,peak,q){if(!on||!ctx)return;const t=ctx.currentTime;const n=Math.floor(ctx.sampleRate*dur),b=ctx.createBuffer(1,n,ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;const s=ctx.createBufferSource();s.buffer=b;const f=ctx.createBiquadFilter();f.type='bandpass';f.Q.value=q||1.2;f.frequency.setValueAtTime(desde,t);f.frequency.exponentialRampToValueAtTime(hasta,t+dur);const g=ctx.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+dur*.35);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(f);f.connect(g);g.connect(master);s.start(t)}
  function pajaro(){if(!on||!ctx)return;const t0=ctx.currentTime,n=2+Math.floor(Math.random()*3),f0=2200+Math.random()*1400;for(let i=0;i<n;i++){const t=t0+i*.13,o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f0*1.45,t+.05);o.frequency.exponentialRampToValueAtTime(f0*.9,t+.1);env(g,t,.01,.09,.018);o.connect(g);g.connect(master);o.start(t);o.stop(t+.14)}}
  const escala=[1,9/8,5/4,3/2,5/3,2];
  const api={
    get on(){return on},
    toggle(){init();if(!ctx)return;on=!on;if(on){ctx.resume();api.click()}api.ambiente(on);subs.forEach(f=>f(on))},
    onChange(fn){subs.push(fn)},
    hover(){const now=performance.now();if(now-last<70)return;last=now;marimba(opts.base*2*escala[Math.floor(Math.random()*escala.length)],.35,.07)},
    click(){marimba(opts.base*2,.4,.14);setTimeout(()=>marimba(opts.base*3,.45,.1),80)},
    whoosh(){ruido(.8,500,3200,.09,.7);setTimeout(()=>ruido(.5,2400,900,.05,.9),120)},
    ambiente(activar){if(!ctx)return;
      if(!activar){clearInterval(birds);birds=null;if(amb){const a=amb;a.g.gain.setTargetAtTime(.0001,ctx.currentTime,.4);setTimeout(()=>a.nodes.forEach(n=>{try{n.stop()}catch(e){}}),1500);amb=null}return}
      if(amb)return;const g=ctx.createGain();g.gain.value=.0001;g.connect(master);const nodes=[];const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=800;f.connect(g);
      [1,5/4,3/2,2].forEach((m,i)=>{const o=ctx.createOscillator();o.type='sine';o.frequency.value=opts.base/2*m;o.detune.value=(i-1.5)*5;const lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.frequency.value=.06+i*.03;lg.gain.value=4;lfo.connect(lg);lg.connect(o.detune);o.connect(f);o.start();lfo.start();nodes.push(o,lfo)});
      g.gain.setTargetAtTime(.035,ctx.currentTime,1.2);amb={g,nodes};birds=setInterval(()=>{if(Math.random()<.55)pajaro()},2600)}
  };return api}

(function(){
  const $=(s,c=document)=>c.querySelector(s),$$=(s,c=document)=>[...c.querySelectorAll(s)];
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
  const SFX=crearSonido({base:262});
  const sbtn=$('.sound');
  sbtn.addEventListener('click',()=>SFX.toggle());
  SFX.onChange(on=>{sbtn.classList.toggle('on',on);sbtn.setAttribute('aria-pressed',on);sbtn.setAttribute('aria-label',on?'Silenciar':'Activar sonido')});
  $$('[data-sfx], .list li, .tabs button, .mnav a').forEach(el=>{el.addEventListener('mouseenter',()=>SFX.hover());el.addEventListener('click',()=>SFX.click())});

  const burger=$('.burger');
  burger.addEventListener('click',()=>{const o=document.body.classList.toggle('menu-open');burger.setAttribute('aria-label',o?'Cerrar menú':'Abrir menú');SFX.click()});
  $$('.mnav a').forEach(a=>a.addEventListener('click',()=>document.body.classList.remove('menu-open')));

  const d=(new Date().getDay()+6)%7;const rows=$$('.hours div');if(rows[d])rows[d].classList.add('today');

  $$('.tabs button').forEach(b=>b.addEventListener('click',()=>{
    $$('.tabs button').forEach(x=>x.classList.toggle('on',x===b));
    const c=b.dataset.cat;$$('.list li').forEach(li=>li.hidden=c!=='all'&&!li.dataset.cat.split(' ').includes(c));
    if(window.ScrollTrigger)ScrollTrigger.refresh();
  }));

  if(!window.gsap||!window.ScrollTrigger){const l=$('.loader');if(l)l.remove();return}
  gsap.registerPlugin(ScrollTrigger);

  // dividir títulos en palabras
  $$('.split').forEach(h=>{const walk=n=>{[...n.childNodes].forEach(c=>{if(c.nodeType===3){const f=document.createDocumentFragment();c.textContent.split(/(\s+)/).forEach(p=>{if(!p)return;if(/^\s+$/.test(p)){f.appendChild(document.createTextNode(p));return}const s=document.createElement('span');s.className='w';const i=document.createElement('i');i.textContent=p;s.appendChild(i);f.appendChild(s)});c.replaceWith(f)}else if(c.nodeType===1&&c.tagName!=='BR')walk(c)})};walk(h)});
  // letras del hero
  $$('.hero-title').forEach(t=>{t.innerHTML=[...t.textContent].map(ch=>'<span class="ch">'+ch+'</span>').join('')});

  let lenis=null;
  if(window.Lenis&&!reduce){lenis=new Lenis({lerp:.09,smoothWheel:true});lenis.on('scroll',ScrollTrigger.update);gsap.ticker.add(t=>lenis.raf(t*1000));gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]:not([href="#"])').forEach(a=>a.addEventListener('click',e=>{const t=$(a.getAttribute('href'));if(t){e.preventDefault();lenis.scrollTo(t,{duration:1.6})}}))}

  // cabecera
  const hd=$('header');let lastY=0;
  ScrollTrigger.create({start:0,end:'max',onUpdate:s=>{const y=s.scroll();hd.classList.toggle('scrolled',y>40);hd.classList.toggle('hide',y>lastY&&y>700&&!document.body.classList.contains('menu-open'));lastY=y;$('.mbar').classList.toggle('show',y>window.innerHeight*.5)}});

  // INTRO: cortina de hojas que se abre (≤1,6 s)
  const cnt={v:0},cEl=$('.loader .count');
  const intro=gsap.timeline({onComplete:()=>{const l=$('.loader');if(l)l.style.display='none'}});
  intro.from('.loader .badge',{scale:0,rotate:-90,duration:.5,ease:'back.out(2)'},0)
    .to(cnt,{v:100,duration:.95,ease:'power2.inOut',onUpdate:()=>cEl.textContent=Math.round(cnt.v)},0)
    .to('.loader .badge',{scale:0,duration:.35,ease:'back.in(2)'},.95)
    .to('.loader .side.l',{xPercent:-115,rotate:-12,duration:.65,ease:'power3.in'},1.0)
    .to('.loader .side.r',{xPercent:115,rotate:12,duration:.65,ease:'power3.in'},1.0)
    .to('.loader',{backgroundColor:'rgba(15,61,46,0)',duration:.4},1.15)
    .from('.hero-photo',{scale:.5,yPercent:30,rotate:-6,duration:1.3,ease:'expo.out'},1.1)
    .from('.hero-title .ch',{yPercent:120,rotate:8,opacity:0,stagger:.04,duration:1,ease:'expo.out'},1.15)
    .from('.hero .leaf',{x:i=>i%2?260:-260,opacity:0,duration:1.2,ease:'expo.out',stagger:.04},1.05)
    .from('.hero-meta>*',{y:30,opacity:0,stagger:.1,duration:.8,ease:'power3.out'},1.5)
    .from('.bar',{yPercent:-100,opacity:0,duration:.8,ease:'power3.out'},1.4);

  const mm=gsap.matchMedia();
  mm.add({desk:'(min-width:901px)',mob:'(max-width:900px)',reduce:'(prefers-reduced-motion: reduce)'},c=>{
    const {desk,reduce}=c.conditions;
    if(reduce)return;
    // HERO: las hojas se apartan como cortina y la foto se abre a pantalla completa
    const h=gsap.timeline({scrollTrigger:{trigger:'.hero',start:'top top',end:'+=130%',scrub:1,pin:true,anticipatePin:1,onEnter:()=>SFX.whoosh(),onLeaveBack:()=>SFX.whoosh()}});
    const out={lf1:[-70,-40,-40],lf2:[-75,40,30],lf3:[-80,0,-25],lf4:[70,-40,40],lf5:[75,40,-30],lf6:[80,0,25],lf7:[0,60,15]};
    Object.entries(out).forEach(([k,[x,y,r]])=>h.to('.hero .'+k,{xPercent:x*(desk?2.2:1.6),yPercent:y*1.2,rotation:r,ease:'power1.in'},0));
    h.to('.hero-photo',{width:'100vw',height:'100%',top:'50%',borderRadius:0,ease:'power2.inOut'},0)
     .to('.hero-photo img',{scale:1,ease:'none'},0)
     .to('.hero-photo .shade',{opacity:1,ease:'none'},.3)
     .to('.hero-title.back',{yPercent:-40,scale:1.25,opacity:0,ease:'none'},0)
     .to('.hero-title.front',{yPercent:-90,scale:.7,opacity:0,ease:'power1.in',duration:.6},0)
     .to('.hero-meta',{opacity:0,y:30,duration:.3},0)
     .fromTo('.hero-over',{opacity:0,y:60},{opacity:1,y:0,duration:.35},.62);

    // horizontal
    if(desk){
      const sec=$('.hz'),track=$('.hz-track');sec.classList.add('pinned');
      const dist=()=>track.scrollWidth-window.innerWidth;
      const tw=gsap.to(track,{x:()=>-dist(),ease:'none',scrollTrigger:{trigger:'.hz',start:'top top',end:()=>'+='+dist(),pin:true,scrub:1,invalidateOnRefresh:true,onEnter:()=>SFX.whoosh(),onUpdate:s=>gsap.set('.hz-progress i',{scaleX:s.progress})}});
      $$('.dish .img img').forEach(img=>gsap.to(img,{scale:1,xPercent:-6,ease:'none',scrollTrigger:{trigger:img.closest('.dish'),containerAnimation:tw,start:'left right',end:'right left',scrub:true}}));
      $$('.dish').forEach((d,i)=>gsap.from(d,{rotate:i%2?6:-6,y:60,ease:'none',scrollTrigger:{trigger:d,containerAnimation:tw,start:'left 110%',end:'left 60%',scrub:true}}));
      gsap.to('.hz .leafdeco',{rotate:40,x:-200,ease:'none',scrollTrigger:{trigger:'.hz',start:'top top',end:()=>'+='+dist(),scrub:true}});
      // parallax galería
      $$('.cols .col').forEach(c=>gsap.to(c,{yPercent:parseFloat(c.dataset.speed)*100,ease:'none',scrollTrigger:{trigger:'.gal',start:'top bottom',end:'bottom top',scrub:true}}));
      // imagen flotante, cursor, magnéticos
      if(fine){
        const fi=$('.float-img'),fimg=$('.float-img img'),cur=$('.cursor');
        const xTo=gsap.quickTo(fi,'x',{duration:.6,ease:'power3'}),yTo=gsap.quickTo(fi,'y',{duration:.6,ease:'power3'});
        const cx=gsap.quickTo(cur,'x',{duration:.15}),cy=gsap.quickTo(cur,'y',{duration:.15});
        const mv=e=>{cur.style.opacity=1;xTo(e.clientX);yTo(e.clientY);cx(e.clientX);cy(e.clientY)};window.addEventListener('mousemove',mv);
        $$('.list li').forEach(li=>{li.addEventListener('mouseenter',()=>{fimg.src=li.dataset.img;gsap.to(fi,{opacity:1,scale:1,rotate:gsap.utils.random(-6,6),duration:.5})});li.addEventListener('mouseleave',()=>gsap.to(fi,{opacity:0,scale:.6,duration:.4}))});
        $$('a,button,.dish').forEach(el=>{el.addEventListener('mouseenter',()=>cur.classList.add('big'));el.addEventListener('mouseleave',()=>cur.classList.remove('big'))});
        $$('.magnet').forEach(m=>{const b=m.firstElementChild;m.addEventListener('mousemove',e=>{const r=m.getBoundingClientRect();gsap.to(b,{x:(e.clientX-r.left-r.width/2)*.35,y:(e.clientY-r.top-r.height/2)*.45,duration:.4})});m.addEventListener('mouseleave',()=>gsap.to(b,{x:0,y:0,duration:.7,ease:'elastic.out(1,.4)'}))});
        return()=>window.removeEventListener('mousemove',mv);
      }
    }
  });

  if(!reduce){
    // SOL: la foto se abre desde un círculo (zoom)
    const s=gsap.timeline({scrollTrigger:{trigger:'.sol',start:'top top',end:'+=140%',scrub:1,pin:true,onEnter:()=>SFX.whoosh()}});
    s.to('.sol-img',{clipPath:'circle(150% at 50% 50%)',ease:'power2.in'},0)
     .to('.sol-img img',{scale:1,ease:'none'},0)
     .to('.sol .ring',{scale:2.6,ease:'power2.in'},0)
     .to('.sol .ring2',{scale:2.2,rotate:90,opacity:0,ease:'none'},0)
     .to('.sol .sol-label',{opacity:0,duration:.2},0)
     .fromTo('.sol-txt',{opacity:0,y:60},{opacity:1,y:0,duration:.3},.6);
    // parallax hojas y texto gigante
    gsap.fromTo('.gal .word',{xPercent:5},{xPercent:-55,ease:'none',scrollTrigger:{trigger:'.gal',start:'top bottom',end:'bottom top',scrub:true}});
    gsap.fromTo('.gal .lfa',{yPercent:40,rotate:-10},{yPercent:-80,rotate:25,ease:'none',scrollTrigger:{trigger:'.gal',start:'top bottom',end:'bottom top',scrub:true}});
    gsap.fromTo('.gal .lfb',{yPercent:60,rotate:10},{yPercent:-60,rotate:-20,ease:'none',scrollTrigger:{trigger:'.gal',start:'top bottom',end:'bottom top',scrub:true}});
    gsap.fromTo('.casa .leafbg',{yPercent:-20,rotate:-10},{yPercent:40,rotate:20,ease:'none',scrollTrigger:{trigger:'.casa',start:'top bottom',end:'bottom top',scrub:true}});
    gsap.fromTo('.casa .leafbg2',{yPercent:30},{yPercent:-40,ease:'none',scrollTrigger:{trigger:'.casa',start:'top bottom',end:'bottom top',scrub:true}});
    gsap.fromTo('.casa-pics .p1 img',{yPercent:-8,scale:1.2},{yPercent:8,scale:1.2,ease:'none',scrollTrigger:{trigger:'.casa-pics',start:'top bottom',end:'bottom top',scrub:true}});
    gsap.fromTo('.casa-pics .p2',{yPercent:30},{yPercent:-20,ease:'none',scrollTrigger:{trigger:'.casa-pics',start:'top bottom',end:'bottom top',scrub:true}});
    gsap.to('.reserva .sun',{rotate:360,ease:'none',scrollTrigger:{trigger:'.reserva',start:'top bottom',end:'bottom top',scrub:true}});
    gsap.fromTo('.reserva .lr1',{yPercent:50,rotate:-20},{yPercent:0,rotate:0,ease:'none',scrollTrigger:{trigger:'.reserva',start:'top bottom',end:'center center',scrub:true}});
    gsap.fromTo('.reserva .lr2',{yPercent:50,rotate:20},{yPercent:0,rotate:0,ease:'none',scrollTrigger:{trigger:'.reserva',start:'top bottom',end:'center center',scrub:true}});
    gsap.from('.foot-name',{yPercent:50,ease:'none',scrollTrigger:{trigger:'footer',start:'top bottom',end:'bottom bottom',scrub:true}});
  }

  // revelado de títulos por palabras
  $$('.split').forEach(h=>gsap.from(h.querySelectorAll('.w>i'),{yPercent:115,rotate:6,duration:1.1,stagger:.06,ease:'expo.out',scrollTrigger:{trigger:h,start:'top 88%',once:true,onEnter:()=>SFX.whoosh()}}));
  // revelado de imágenes (cortina)
  $$('.rimg').forEach(el=>gsap.fromTo(el,{clipPath:'inset(100% 0% 0% 0%)'},{clipPath:'inset(0% 0% 0% 0%)',duration:1.3,ease:'expo.inOut',scrollTrigger:{trigger:el,start:'top 90%',once:true}}));
  // textos
  $$('.casa .lead, .casa p.body, .stat, .hz-head p, .info .addr, .hours, .reserva p, .reserva .ctas').forEach(el=>gsap.from(el,{y:36,opacity:0,duration:1,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 92%',once:true}}));
  gsap.from('.list li',{opacity:0,y:30,stagger:.06,duration:.8,ease:'power3.out',scrollTrigger:{trigger:'.list',start:'top 85%',once:true}});
  // contadores
  $$('[data-count]').forEach(el=>{const v=parseFloat(el.dataset.count),dec=+el.dataset.dec||0,o={v:0};gsap.to(o,{v,duration:2,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 90%',once:true},onUpdate:()=>el.textContent=dec?o.v.toFixed(dec).replace('.',','):Math.round(o.v)})});

  window.addEventListener('load',()=>ScrollTrigger.refresh());
})();
