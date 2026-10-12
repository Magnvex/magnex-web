/* Motor de sonido (basado en _assets/sonido.js) con escala frigia dominante y ambiente de patio: bordón + punteos de guitarra */
function crearSonido(opts){
  opts=Object.assign({base:220,tono:'calido',volumen:.5},opts||{});
  let ctx=null,master=null,on=false,amb=null,last=0,timer=null;const subs=[];
  function init(){if(ctx)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ctx=new AC();master=ctx.createGain();master.gain.value=opts.volumen;const comp=ctx.createDynamicsCompressor();master.connect(comp);comp.connect(ctx.destination);}
  function env(g,t,a,d,p){g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(p,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d);}
  function voz(freq,dur,peak,type){if(!on||!ctx)return;const t=ctx.currentTime;const o=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();o.type=type||'triangle';o.frequency.setValueAtTime(freq,t);f.type='lowpass';f.frequency.value=2600;env(g,t,.005,dur,peak);o.connect(f);f.connect(g);g.connect(master);o.start(t);o.stop(t+dur+.05);}
  function punteo(freq,peak){if(!on||!ctx)return;const t=ctx.currentTime;[[1,'triangle',1],[2.003,'sawtooth',.18],[3,'sine',.12]].forEach(([m,ty,k])=>{const o=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();o.type=ty;o.frequency.value=freq*m;f.type='lowpass';f.frequency.setValueAtTime(3200,t);f.frequency.exponentialRampToValueAtTime(500,t+.6);env(g,t,.003,1.4,peak*k);o.connect(f);f.connect(g);g.connect(master);o.start(t);o.stop(t+1.5);});}
  function ruido(dur,desde,hasta,peak,q){if(!on||!ctx)return;const t=ctx.currentTime;const n=Math.floor(ctx.sampleRate*dur),b=ctx.createBuffer(1,n,ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;const s=ctx.createBufferSource();s.buffer=b;const f=ctx.createBiquadFilter();f.type='bandpass';f.Q.value=q||1.2;f.frequency.setValueAtTime(desde,t);f.frequency.exponentialRampToValueAtTime(hasta,t+dur);const g=ctx.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+dur*.35);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(f);f.connect(g);g.connect(master);s.start(t);}
  const escala=[1,16/15,5/4,4/3,3/2,8/5,16/9,2];
  const nota=()=>opts.base*escala[Math.floor(Math.random()*escala.length)];
  const api={
    get on(){return on},
    toggle(){init();if(!ctx)return;on=!on;if(on){ctx.resume();api.click();}api.ambiente(on);subs.forEach(f=>f(on));},
    onChange(fn){subs.push(fn)},
    hover(){const now=performance.now();if(now-last<70)return;last=now;punteo(nota()*2,.035);},
    click(){punteo(opts.base*2,.09);setTimeout(()=>punteo(opts.base*2*16/15,.06),90);},
    whoosh(){ruido(.8,260,2400,.1,.8);},
    ambiente(activar){
      if(!ctx)return;
      if(!activar){clearTimeout(timer);if(amb){const a=amb;a.g.gain.setTargetAtTime(.0001,ctx.currentTime,.4);setTimeout(()=>a.nodes.forEach(n=>{try{n.stop()}catch(e){}}),1500);amb=null;}return;}
      if(amb)return;
      const g=ctx.createGain();g.gain.value=.0001;g.connect(master);const nodes=[];const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=700;f.connect(g);
      [1,3/2,2].forEach((m,i)=>{const o=ctx.createOscillator();o.type='sine';o.frequency.value=opts.base/2*m;const lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.frequency.value=.06+i*.03;lg.gain.value=3;lfo.connect(lg);lg.connect(o.detune);o.connect(f);o.start();lfo.start();nodes.push(o,lfo);});
      g.gain.setTargetAtTime(.045,ctx.currentTime,1.4);amb={g,nodes};
      const loop=()=>{if(!on)return;punteo(nota(),.028);if(Math.random()<.4)setTimeout(()=>punteo(nota()*(Math.random()<.5?1:2),.02),180);timer=setTimeout(loop,1600+Math.random()*2600);};timer=setTimeout(loop,1200);
    }
  };
  return api;
}

(function(){
  const $=(s,c=document)=>c.querySelector(s),$$=(s,c=document)=>[...c.querySelectorAll(s)];
  const root=document.documentElement;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
  const SFX=crearSonido({base:146.83,volumen:.5});
  const sbtn=$('.sound');
  sbtn.addEventListener('click',()=>SFX.toggle());
  SFX.onChange(on=>{sbtn.classList.toggle('on',on);sbtn.setAttribute('aria-pressed',on);sbtn.setAttribute('aria-label',on?'Silenciar':'Activar sonido')});
  $$('[data-sfx], .list li, .tabs button, .mnav a, .gi').forEach(el=>{el.addEventListener('mouseenter',()=>SFX.hover());el.addEventListener('click',()=>SFX.click())});

  const burger=$('.burger');
  const setMenu=v=>{document.body.classList.toggle('menu-open',v);burger.setAttribute('aria-expanded',v);burger.setAttribute('aria-label',v?'Cerrar menú':'Abrir menú')};
  burger.addEventListener('click',()=>{setMenu(!document.body.classList.contains('menu-open'));SFX.click()});
  $$('.mnav a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));

  const d=(new Date().getDay()+6)%7;const rows=$$('.hours div');if(rows[d])rows[d].classList.add('today');

  $$('.tabs button').forEach(b=>b.addEventListener('click',()=>{
    $$('.tabs button').forEach(x=>x.classList.toggle('on',x===b));
    const c=b.dataset.cat;$$('.list li').forEach(li=>li.hidden=c!=='all'&&li.dataset.cat!==c);
    if(window.ScrollTrigger)ScrollTrigger.refresh();
  }));

  if(!window.gsap||!window.ScrollTrigger){root.classList.add('loaded');return;}
  gsap.registerPlugin(ScrollTrigger);

  /* troceado de textos */
  function splitWords(el){
    const walk=n=>{[...n.childNodes].forEach(c=>{
      if(c.nodeType===3){const frag=document.createDocumentFragment();c.textContent.split(/(\s+)/).forEach(p=>{if(!p)return;if(/^\s+$/.test(p)){frag.appendChild(document.createTextNode(' '));return;}const w=document.createElement('span');w.className='w';const i=document.createElement('span');i.textContent=p;w.appendChild(i);frag.appendChild(w);});c.replaceWith(frag);}
      else if(c.nodeType===1&&!c.classList.contains('w'))walk(c);
    })};walk(el);
  }
  $$('[data-split],[data-words]').forEach(splitWords);
  $$('.ttl h1,.ttl .h1').forEach(h=>{h.innerHTML=[...h.textContent].map(ch=>'<span class="ch">'+ch+'</span>').join('')});

  let lenis=null;
  if(window.Lenis&&!reduce){lenis=new Lenis({lerp:.085,smoothWheel:true});lenis.on('scroll',ScrollTrigger.update);gsap.ticker.add(t=>lenis.raf(t*1000));gsap.ticker.lagSmoothing(0);}
  $$('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const id=a.getAttribute('href');if(id==='#'||a.hasAttribute('data-demo'))return;const t=id==='#top'?document.body:$(id);if(!t)return;e.preventDefault();if(lenis)lenis.scrollTo(t,{duration:1.8});else t.scrollIntoView({behavior:reduce?'auto':'smooth'});}));

  /* cabecera, barra móvil y navegación por arcos */
  const hd=$('header'),mbar=$('.mbar'),arcnav=$('.arcnav');let lastY=0;
  ScrollTrigger.create({start:0,end:'max',onUpdate:s=>{const y=s.scroll();hd.classList.toggle('scrolled',y>40);hd.classList.toggle('hide',y>lastY&&y>window.innerHeight*1.5&&!document.body.classList.contains('menu-open'));lastY=y;mbar.classList.toggle('show',y>window.innerHeight*.8);arcnav.classList.toggle('show',y>window.innerHeight*.5)}});
  const navLinks=$$('.arcnav a'),mainLinks=$$('nav.main a');
  $$('[data-nav]').forEach(sec=>{const i=+sec.dataset.nav;ScrollTrigger.create({trigger:sec,start:'top 50%',end:'bottom 50%',onToggle:s=>{if(!s.isActive)return;navLinks.forEach((a,k)=>a.classList.toggle('on',k===i));arcnav.classList.toggle('dark',sec.hasAttribute('data-dark')||sec.classList.contains('puerta'));const id='#'+sec.id;mainLinks.forEach(a=>a.classList.toggle('on',a.getAttribute('href')===id));}})});

  /* preloader: el arco se dibuja, la estrella gira, la cortina sube y la puerta se abre */
  const tl=gsap.timeline({onComplete:()=>root.classList.add('loaded')});
  const arcs=$$('.loader .arc');arcs.forEach(p=>{const L=p.getTotalLength();gsap.set(p,{strokeDasharray:L,strokeDashoffset:L})});
  const cnt={v:0},cel=$('.loader .count');
  tl.to(arcs,{strokeDashoffset:0,duration:.85,ease:'power2.inOut',stagger:.1},0)
    .fromTo('.loader .star',{rotate:-90,scale:0,opacity:0},{rotate:0,scale:1,opacity:1,duration:.7,ease:'back.out(2)'},.25)
    .to(cnt,{v:100,duration:.95,ease:'power2.inOut',onUpdate:()=>cel.textContent=Math.round(cnt.v)},0)
    .to('.loader',{clipPath:'inset(0 0 100% 0)',duration:.6,ease:'expo.inOut'},.95)
    .fromTo('.hero .portal',{'--i':.18},{'--i':1,duration:1.1,ease:'expo.out'},1.0)
    .fromTo('.hero .outline',{scale:.18,transformOrigin:'50% 100%'},{scale:1,duration:1.1,ease:'expo.out'},1.0)
    .from('.ttl .ch',{yPercent:105,duration:.9,stagger:.035,ease:'expo.out'},1.05)
    .from('.ttl .tag, .hero-top, .hero-meta, .celo, .scroll-hint',{opacity:0,y:14,duration:.6,stagger:.04},1.25);

  const mm=gsap.matchMedia();
  mm.add({desk:'(min-width:901px)',mob:'(max-width:900px)',reduce:'(prefers-reduced-motion: reduce)'},c=>{
    const {desk,reduce:rm}=c.conditions;
    if(rm)return;

    /* HERO: la puerta polilobulada se agranda hasta abrirse a pantalla completa */
    const htl=gsap.timeline({scrollTrigger:{trigger:'.hero',start:'top top',end:'+=140%',scrub:1,pin:true,onEnter:()=>SFX.whoosh()}});
    htl.fromTo('.hero .portal',{'--s':1},{'--s':5,ease:'power1.in',immediateRender:false},0)
       .fromTo('.hero .outline',{scale:1},{scale:5,ease:'power1.in',immediateRender:false},0)
       .to('.hero .portal img',{scale:1,ease:'none'},0)
       .to('.celo.l',{xPercent:-160,ease:'none'},0).to('.celo.r',{xPercent:160,ease:'none'},0)
       .to('.hero-top, .hero-meta, .scroll-hint',{opacity:0,ease:'none',duration:.3},0)
       .to('.ttl',{yPercent:-70,ease:'none'},0)
       .to('.ttl .tag',{letterSpacing:'.9em',ease:'none'},0);

    /* puertas intermedias: cada sección se abre por un arco */
    $$('.puerta').forEach(p=>{
      const ptl=gsap.timeline({scrollTrigger:{trigger:p,start:'top top',end:'+=120%',scrub:1,pin:true,onEnter:()=>SFX.whoosh()}});
      ptl.fromTo(p.querySelector('.p-portal'),{'--s':.6},{'--s':7,ease:'power2.in'},0)
         .fromTo(p.querySelector('.p-portal img'),{scale:1.35},{scale:1,ease:'none'},0)
         .to(p.querySelector('.p-wall h2'),{yPercent:-60,opacity:0,ease:'none',duration:.5},.15)
         .fromTo(p.querySelectorAll('.p-in > *'),{opacity:0,y:50},{opacity:1,y:0,stagger:.08,duration:.3},.62);
    });

    /* fondos de sección que entran por un arco (galería, reserva) */
    $$('.arch-bg').forEach(bg=>gsap.fromTo(bg,{'--s':.3},{'--s':14,ease:'power1.in',scrollTrigger:{trigger:bg.parentElement,start:'top 98%',end:'top 10%',scrub:true}}));

    /* casa: arco que crece con la foto + parallax */
    gsap.fromTo('.casa-fig .frame',{'--s':.35},{'--s':1,ease:'power2.out',scrollTrigger:{trigger:'.casa-fig',start:'top 95%',end:'top 35%',scrub:true}});
    gsap.fromTo('.casa-fig img',{yPercent:-8},{yPercent:8,ease:'none',scrollTrigger:{trigger:'.casa-fig',start:'top bottom',end:'bottom top',scrub:true}});
    gsap.fromTo('.casa-fig .star',{rotate:-120},{rotate:120,ease:'none',scrollTrigger:{trigger:'.casa-fig',start:'top bottom',end:'bottom top',scrub:true}});
    gsap.fromTo('.casa-fig svg.ol',{opacity:0,scale:.9,transformOrigin:'50% 100%'},{opacity:1,scale:1,ease:'none',scrollTrigger:{trigger:'.casa-fig',start:'top 70%',end:'top 30%',scrub:true}});
    gsap.fromTo('.casa .big .w>span',{opacity:.12},{opacity:1,stagger:.04,ease:'none',scrollTrigger:{trigger:'.casa .big',start:'top 82%',end:'bottom 50%',scrub:true}});

    /* arquería horizontal */
    if(desk){
      const track=$('.arq-track');const dist=()=>track.scrollWidth-window.innerWidth;const prog=$$('.arq-prog i');
      const tw=gsap.to(track,{x:()=>-dist(),ease:'none',scrollTrigger:{trigger:'.arq',start:'top top',end:()=>'+='+dist(),pin:true,scrub:1,invalidateOnRefresh:true,onEnter:()=>SFX.whoosh(),onUpdate:s=>{const k=Math.min(prog.length-1,Math.floor(s.progress*prog.length));prog.forEach((p,j)=>p.classList.toggle('on',j<=k))}}});
      $$('.arq-card').forEach(card=>{
        gsap.fromTo(card.querySelector('.fm img'),{xPercent:8},{xPercent:-8,ease:'none',scrollTrigger:{trigger:card,containerAnimation:tw,start:'left right',end:'right left',scrub:true}});
        gsap.fromTo(card.querySelector('figure'),{y:60,rotate:2},{y:0,rotate:0,ease:'none',scrollTrigger:{trigger:card,containerAnimation:tw,start:'left right',end:'center 60%',scrub:true}});
      });
      /* galería parallax */
      $$('.gcol').forEach(cl=>gsap.to(cl,{yPercent:parseFloat(cl.dataset.speed)*100,ease:'none',scrollTrigger:{trigger:'.gcols',start:'top bottom',end:'bottom top',scrub:true}}));
    }
    gsap.fromTo('.gword',{xPercent:5},{xPercent:-45,ease:'none',scrollTrigger:{trigger:'.gal',start:'top bottom',end:'bottom top',scrub:true}});
    $$('.gi img').forEach(img=>gsap.to(img,{scale:1,ease:'none',scrollTrigger:{trigger:img,start:'top bottom',end:'bottom top',scrub:true}}));

    /* mapa en arco */
    gsap.fromTo('.map',{'--s':.4},{'--s':1,ease:'power2.out',scrollTrigger:{trigger:'.map-wrap',start:'top 95%',end:'top 35%',scrub:true}});
    /* arcos concéntricos de la reserva */
    $$('.rings path').forEach((p,i)=>{const L=p.getTotalLength();gsap.fromTo(p,{strokeDasharray:L,strokeDashoffset:L},{strokeDashoffset:0,ease:'none',scrollTrigger:{trigger:'.reserva',start:'top 80%',end:'center 50%',scrub:true}})});
    gsap.fromTo('.foot-name',{yPercent:40,letterSpacing:'.2em'},{yPercent:0,letterSpacing:'.01em',ease:'none',scrollTrigger:{trigger:'footer',start:'top bottom',end:'bottom bottom',scrub:true}});
  });

  /* revelados de títulos por palabras */
  $$('.sec-head h2[data-split], .reserva h2').forEach(h=>gsap.from(h.querySelectorAll('.w>span'),{yPercent:110,duration:1.1,stagger:.06,ease:'expo.out',scrollTrigger:{trigger:h,start:'top 88%',onEnter:()=>SFX.whoosh()}}));
  $$('.puerta .p-wall h2').forEach(h=>gsap.from(h.querySelectorAll('.w>span'),{yPercent:110,duration:1,stagger:.07,ease:'expo.out',scrollTrigger:{trigger:h.closest('.puerta'),start:'top 70%'}}));
  gsap.from('.list li',{opacity:0,y:30,stagger:.06,duration:.8,ease:'power3.out',scrollTrigger:{trigger:'.list',start:'top 85%'}});
  gsap.from('.visita dl > *, .visita .ctas',{opacity:0,y:18,stagger:.04,duration:.7,scrollTrigger:{trigger:'.visita dl',start:'top 88%'}});
  gsap.from('.gi',{clipPath:'inset(100% 0 0 0)',duration:1.3,ease:'expo.inOut',stagger:.1,scrollTrigger:{trigger:'.gcols',start:'top 80%'}});
  $$('[data-count]').forEach(el=>{const v=parseFloat(el.dataset.count),dec=+el.dataset.dec||0,o={v:0};gsap.to(o,{v,duration:2,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 90%'},onUpdate:()=>el.textContent=dec?o.v.toFixed(dec).replace('.',','):Math.round(o.v).toLocaleString('es-ES')})});

  /* microinteracciones con ratón */
  if(fine){
    const fi=$('.float-img'),fimg=$('.float-img img'),cur=$('.cursor');
    const xTo=gsap.quickTo(fi,'x',{duration:.6,ease:'power3'}),yTo=gsap.quickTo(fi,'y',{duration:.6,ease:'power3'});
    const cx=gsap.quickTo(cur,'x',{duration:.18}),cy=gsap.quickTo(cur,'y',{duration:.18});
    window.addEventListener('mousemove',e=>{xTo(e.clientX);yTo(e.clientY);cx(e.clientX);cy(e.clientY)});
    $$('.list li').forEach(li=>{li.addEventListener('mouseenter',()=>{fimg.src=li.dataset.img;gsap.to(fi,{opacity:1,scale:1,rotate:gsap.utils.random(-5,5),duration:.5,ease:'back.out(1.6)'})});li.addEventListener('mouseleave',()=>gsap.to(fi,{opacity:0,scale:.6,duration:.4}))});
    $$('a, button, .arq-card, .gi').forEach(el=>{el.addEventListener('mouseenter',()=>cur.classList.add('big'));el.addEventListener('mouseleave',()=>cur.classList.remove('big'))});
    $$('.magnet, .hd-right .btn').forEach(m=>{const t=m.classList.contains('magnet')?m.firstElementChild:m;m.addEventListener('mousemove',e=>{const r=m.getBoundingClientRect();gsap.to(t,{x:(e.clientX-r.left-r.width/2)*.35,y:(e.clientY-r.top-r.height/2)*.4,duration:.4})});m.addEventListener('mouseleave',()=>gsap.to(t,{x:0,y:0,duration:.8,ease:'elastic.out(1,.4)'}))});
  }
  ScrollTrigger.sort();ScrollTrigger.refresh();
  window.addEventListener('load',()=>{ScrollTrigger.sort();ScrollTrigger.refresh()});
})();
