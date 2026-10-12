function crearSonido(opts){
  opts=Object.assign({base:220,tono:'calido',volumen:.5,ambiente:'pad'},opts||{});
  let ctx=null,master=null,on=false,amb=null,last=0;const subs=[];
  function init(){if(ctx)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ctx=new AC();master=ctx.createGain();master.gain.value=opts.volumen;const comp=ctx.createDynamicsCompressor();master.connect(comp);comp.connect(ctx.destination)}
  function env(g,t,a,d,p){g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(p,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d)}
  function voz(freq,dur,peak,type){if(!on||!ctx)return;const t=ctx.currentTime;const o=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();o.type=type||({calido:'triangle',cristal:'sine',madera:'triangle',metal:'square'})[opts.tono];o.frequency.setValueAtTime(freq,t);f.type='lowpass';f.frequency.value=3200;env(g,t,.005,dur,peak);o.connect(f);f.connect(g);g.connect(master);o.start(t);o.stop(t+dur+.05)}
  function ruido(dur,desde,hasta,peak,q){if(!on||!ctx)return;const t=ctx.currentTime;const n=Math.floor(ctx.sampleRate*dur),b=ctx.createBuffer(1,n,ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;const s=ctx.createBufferSource();s.buffer=b;const f=ctx.createBiquadFilter();f.type='bandpass';f.Q.value=q||1.2;f.frequency.setValueAtTime(desde,t);f.frequency.exponentialRampToValueAtTime(hasta,t+dur);const g=ctx.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+dur*.35);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(f);f.connect(g);g.connect(master);s.start(t)}
  const escala=[1,9/8,5/4,3/2,5/3,2];
  const api={
    get on(){return on},
    toggle(){init();if(!ctx)return;on=!on;if(on){ctx.resume();api.click()}api.ambiente(on);subs.forEach(f=>f(on))},
    onChange(fn){subs.push(fn)},
    // marimba: seno con armónico corto
    hover(){const now=performance.now();if(now-last<60)return;last=now;const f=opts.base*2*escala[Math.floor(Math.random()*escala.length)];voz(f,.14,.06,'sine');voz(f*4,.04,.02,'sine')},
    click(){voz(opts.base*2,.16,.12,'sine');setTimeout(()=>voz(opts.base*3,.2,.09,'sine'),80)},
    whoosh(){ruido(.7,300,2800,.12,.9)},
    maraca(){ruido(.09,5200,6400,.05,4)},
    golpe(){voz(opts.base/2,.3,.16,'sine')},
    ambiente(activar){
      if(!ctx)return;
      if(!activar){if(amb){const a=amb;clearInterval(a.iv);a.g.gain.setTargetAtTime(.0001,ctx.currentTime,.4);setTimeout(()=>a.nodes.forEach(n=>{try{n.stop()}catch(e){}}),1500);amb=null}return}
      if(amb)return;
      const g=ctx.createGain();g.gain.value=.0001;g.connect(master);const nodes=[];
      const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=700;f.connect(g);
      [1,5/4,3/2].forEach((m,i)=>{const o=ctx.createOscillator();o.type='sine';o.frequency.value=opts.base/2*m;o.detune.value=(i-1)*5;o.connect(f);o.start();nodes.push(o)});
      g.gain.setTargetAtTime(.03,ctx.currentTime,1.2);
      // ritmo suave de maraca (muy bajo)
      let k=0;const iv=setInterval(()=>{if(!on)return;if([0,2,3,5,6].includes(k%8))ruido(.06,6000,7000,.018,5);k++},210);
      amb={g,nodes,iv};
    }
  };
  return api;
}
(function(){
  const $=(s,c=document)=>c.querySelector(s),$$=(s,c=document)=>[...c.querySelectorAll(s)];
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
  const body=document.body;
  const SFX=crearSonido({base:247,tono:'calido',volumen:.45});
  const sbtn=$('.sound');
  sbtn.addEventListener('click',()=>SFX.toggle());
  SFX.onChange(on=>{sbtn.classList.toggle('on',on);sbtn.setAttribute('aria-pressed',on);sbtn.setAttribute('aria-label',on?'Silenciar':'Activar sonido')});
  $$('[data-sfx], .card, .mnav a, .shapes figure').forEach(el=>{el.addEventListener('mouseenter',()=>SFX.hover());el.addEventListener('click',()=>SFX.click())});
  const burger=$('.burger');
  burger.addEventListener('click',()=>{body.classList.toggle('menu-open');burger.setAttribute('aria-label',body.classList.contains('menu-open')?'Cerrar menú':'Abrir menú');SFX.maraca();SFX.click()});
  $$('.mnav a').forEach(a=>a.addEventListener('click',()=>body.classList.remove('menu-open')));
  const d=(new Date().getDay()+6)%7;const rows=$$('.hours div');if(rows[d])rows[d].classList.add('today');

  // bandas y anillos (generados)
  const COL=['#5b2a17','#b8401b','#d9531e','#e9a42b','#e7967a','#f0c56a'];
  const bands=$('.bands');
  function sizeBands(){const mob=innerWidth<=900;const A=mob?innerWidth*.72:Math.min(innerWidth*.30,420);const H=mob?Math.min(innerHeight*.5,430):Math.min(innerHeight*.64,560);const step=mob?Math.max(26,innerWidth*.075):Math.max(56,innerWidth*.05);const BC=['#f0c56a','#e7967a','#e9a42b','#d9531e','#b8401b','#5b2a17'];$$('i',bands).forEach((b,i)=>{const t=(6-i)*step;b.style.width=(A+2*t)+'px';b.style.height=(H+t)+'px';b.style.background=BC[i]})}
  sizeBands();addEventListener('resize',sizeBands);
  const lsun=$('.loader .suns');$$('i',lsun).forEach((b,i)=>{const w=Math.max(innerWidth,innerHeight)*(1.5-i*.27);b.style.width=w+'px';b.style.height=w/2+'px';b.style.background=COL[i]});
  const rings=$('.sol .rings');for(let i=0;i<9;i++){const r=document.createElement('i');rings.appendChild(r)}
  function sizeRings(){const M=Math.hypot(innerWidth,innerHeight)*1.05;$$('i',rings).forEach((r,i)=>{const s=M*(1-i/9);r.style.width=r.style.height=s+'px';r.style.background=COL[i%5]})}
  sizeRings();addEventListener('resize',sizeRings);

  const finish=()=>body.classList.add('loaded');
  setTimeout(finish,3500);
  if(!window.gsap||!window.ScrollTrigger){finish();body.classList.remove('js-bar');return}
  gsap.registerPlugin(ScrollTrigger);

  function split(el){const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);const ns=[];while(w.nextNode())ns.push(w.currentNode);ns.forEach(n=>{if(!n.textContent.trim())return;const f=document.createDocumentFragment();n.textContent.split(/(\s+)/).forEach(p=>{if(!p)return;if(/^\s+$/.test(p)){f.appendChild(document.createTextNode(p));return}const o=document.createElement('span');o.className='wd';const i=document.createElement('span');i.textContent=p;o.appendChild(i);f.appendChild(o)});n.parentNode.replaceChild(f,n)});return $$('.wd>span',el)}

  let lenis=null;
  if(window.Lenis&&!reduce){lenis=new Lenis({lerp:.09,smoothWheel:true});lenis.on('scroll',ScrollTrigger.update);gsap.ticker.add(t=>lenis.raf(t*1000));gsap.ticker.lagSmoothing(0)}
  $$('a[href^="#"]:not([href="#"])').forEach(a=>a.addEventListener('click',e=>{const id=a.getAttribute('href');const t=id==='#top'||id==='#inicio'?0:$(id);if(t===null)return;e.preventDefault();body.classList.remove('menu-open');if(lenis)lenis.scrollTo(t,{duration:1.6});else window.scrollTo({top:t===0?0:t.getBoundingClientRect().top+scrollY,behavior:'smooth'})}));

  const hd=$('header'),mbar=$('.mbar');let lastY=0;
  ScrollTrigger.create({start:0,end:'max',onUpdate:s=>{const y=s.scroll();hd.classList.toggle('scrolled',y>40);hd.classList.toggle('hide',y>lastY&&y>700&&!body.classList.contains('menu-open'));lastY=y;mbar.classList.toggle('show',y>innerHeight*.5)}});

  // giro continuo de las insignias (velocidad según scroll)
  let vel=0;
  const spins=[[$('.badge .spin'),75,75],[$('.sol .ospin'),200,200]];
  let ang=0;gsap.ticker.add(()=>{ang+=.25+Math.min(6,Math.abs(vel)*.004);vel*=.9;spins.forEach(([g,cx,cy])=>g&&g.setAttribute('transform',`rotate(${ang} ${cx} ${cy})`))});
  ScrollTrigger.create({start:0,end:'max',onUpdate:s=>{vel=s.getVelocity()}});

  // ---------- preloader: sale el sol ----------
  const pn=$('.pn'),o={v:0};
  const tl=gsap.timeline({onComplete:finish});
  tl.from('.loader .suns i',{scaleY:0,transformOrigin:'50% 100%',duration:.55,stagger:.07,ease:'back.out(1.4)'},0)
    .from('.loader .word span',{yPercent:120,rotate:()=>gsap.utils.random(-30,30),opacity:0,duration:.45,stagger:.05,ease:'back.out(2)',onStart:()=>SFX.maraca()},.15)
    .to(o,{v:100,duration:1,ease:'power2.inOut',onUpdate:()=>pn.textContent=Math.round(o.v)},0)
    .to('.loader',{clipPath:'circle(0% at 50% 100%)',duration:.6,ease:'power3.in'},1.0);
  if(!reduce){
    tl.from('.bands i',{scale:0,transformOrigin:'50% 100%',duration:1,stagger:.06,ease:'expo.out'},1.25)
      .from('.hero-arch',{yPercent:100,duration:1,ease:'expo.out'},1.3)
      .from('.hero h1 .w',{yPercent:60,opacity:0,scale:.8,duration:.8,stagger:.1,ease:'back.out(1.6)'},1.4)
      .from('.hero .badge',{scale:0,rotate:-180,duration:.8,ease:'back.out(1.6)'},1.6)
      .from('.hero .sub, .hero .loc',{y:20,opacity:0,duration:.6,stagger:.08},1.6)
      .from('header',{opacity:0,duration:.5,clearProps:'opacity'},1.3);
  }

  const mm=gsap.matchMedia();
  mm.add({desk:'(min-width:901px)',mob:'(max-width:900px)',red:'(prefers-reduced-motion: reduce)'},c=>{
    const {desk,red}=c.conditions;
    if(red)return;
    // HERO: el arco se abre a pantalla completa y el sol se expande
    const ht=gsap.timeline({scrollTrigger:{trigger:'.hero',start:'top top',end:'+=110%',pin:true,scrub:1,onEnter:()=>SFX.whoosh()}});
    ht.to('.hero-arch',{width:'100vw',height:'100%',borderRadius:0,ease:'power1.inOut'},0)
      .to('.bands i',{scale:i=>1.6+i*.1,transformOrigin:'50% 100%',ease:'none'},0)
      .to('.hero h1 .w:first-child',{xPercent:desk?-60:-30,yPercent:desk?0:-30,opacity:0,ease:'none'},0)
      .to('.hero h1 .w:last-child',{xPercent:desk?60:30,yPercent:desk?0:-30,opacity:0,ease:'none'},0)
      .to('.hero .badge, .hero .sub, .hero .loc',{opacity:0,y:-40,ease:'none',duration:.4},0);
    // texto en curva que se desliza
    gsap.fromTo('.curve .tp',{attr:{startOffset:'0%'}},{attr:{startOffset:'-45%'},ease:'none',scrollTrigger:{trigger:'.historia',start:'top bottom',end:'bottom top',scrub:true}});
    // parallax capas
    gsap.to('.stack70 .ring',{rotate:90,ease:'none',scrollTrigger:{trigger:'.stack70',start:'top bottom',end:'bottom top',scrub:true}});
    gsap.fromTo('.stack70 .pill',{yPercent:12},{yPercent:-12,ease:'none',scrollTrigger:{trigger:'.stack70',start:'top bottom',end:'bottom top',scrub:true}});
    gsap.fromTo('.stack70 .pill img',{yPercent:-12},{yPercent:0,ease:'none',scrollTrigger:{trigger:'.stack70',start:'top bottom',end:'bottom top',scrub:true}});
    gsap.fromTo('.stack70 .circ',{yPercent:40},{yPercent:-30,ease:'none',scrollTrigger:{trigger:'.stack70',start:'top bottom',end:'bottom top',scrub:true}});
    // carta horizontal
    if(desk){
      const track=$('.track');const dist=()=>track.scrollWidth-innerWidth;
      const tw=gsap.to(track,{x:()=>-dist(),ease:'none',scrollTrigger:{trigger:'.carta',start:'top top',end:()=>'+='+dist(),pin:true,scrub:1,invalidateOnRefresh:true,onEnter:()=>SFX.whoosh(),onUpdate:s=>gsap.set('.carta .prog i',{scaleX:s.progress})}});
      gsap.to('.carta .bgrings',{rotate:120,ease:'none',scrollTrigger:{trigger:'.carta',start:'top top',end:()=>'+='+dist(),scrub:true}});
      $$('.card').forEach(cd=>{
        gsap.fromTo($('.ph img',cd),{scale:1.35,rotate:-8},{scale:1,rotate:0,ease:'none',scrollTrigger:{trigger:cd,containerAnimation:tw,start:'left right',end:'center center',scrub:true}});
        gsap.from(cd,{yPercent:30,rotate:6,ease:'none',scrollTrigger:{trigger:cd,containerAnimation:tw,start:'left 105%',end:'left 78%',scrub:true}});
      });
    }
    // SOL: anillos concéntricos que crecen como un sol de los 70
    const st=gsap.timeline({scrollTrigger:{trigger:'.sol',start:'top top',end:'+=150%',pin:true,scrub:1,onEnter:()=>SFX.whoosh()}});
    st.from('.sol .rings i',{scale:.14,duration:1,stagger:.12,ease:'power2.out'},0)
      .from('.sol .center',{scale:.35,rotate:-90,duration:1,ease:'back.out(1.4)'},.5)
      .from('.sol .center img',{scale:1.6,duration:1.2,ease:'none'},.5)
      .from('.sol .orbit',{scale:.4,opacity:0,duration:.8},.9)
      .from('.sol .cap',{y:60,opacity:0,duration:.5},1.3);
    // galería: parallax por forma
    $$('.shapes figure').forEach(f=>{const sp=parseFloat(f.dataset.speed)*(desk?1:.5);gsap.fromTo(f,{yPercent:sp*-100},{yPercent:sp*100,ease:'none',scrollTrigger:{trigger:'.shapes',start:'top bottom',end:'bottom top',scrub:true}});gsap.fromTo($('img',f),{yPercent:-6},{yPercent:6,ease:'none',scrollTrigger:{trigger:f,start:'top bottom',end:'bottom top',scrub:true}})});
    gsap.fromTo('.gal .marq',{xPercent:0},{xPercent:-40,ease:'none',scrollTrigger:{trigger:'.gal',start:'top bottom',end:'bottom top',scrub:true}});
    gsap.to('.reserva .rays',{rotate:60,ease:'none',scrollTrigger:{trigger:'.reserva',start:'top bottom',end:'bottom top',scrub:true}});
  });

  // revelados
  $$('.reveal').forEach(el=>{const ws=split(el);gsap.from(ws,{yPercent:115,rotate:4,duration:.9,stagger:.04,ease:'back.out(1.6)',scrollTrigger:{trigger:el,start:'top 86%',onEnter:()=>SFX.maraca()}})});
  $$('.carta h2, .gal h2, .info h2, .reserva h2').forEach(h=>gsap.from(h,{scale:.7,opacity:0,rotate:-4,duration:1,ease:'back.out(1.8)',scrollTrigger:{trigger:h,start:'top 88%',onEnter:()=>SFX.whoosh()}}));
  gsap.from('.historia .lead, .historia .small',{y:30,opacity:0,stagger:.1,duration:.8,scrollTrigger:{trigger:'.historia .lead',start:'top 88%'}});
  gsap.from('.stat',{scaleY:0,transformOrigin:'50% 100%',stagger:.1,duration:.8,ease:'back.out(1.6)',scrollTrigger:{trigger:'.stats',start:'top 90%'}});
  $$('[data-count]').forEach(el=>{const v=parseFloat(el.dataset.count),dec=+el.dataset.dec||0,c={v:0};gsap.to(c,{v,duration:1.8,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 92%'},onUpdate:()=>el.textContent=dec?c.v.toFixed(dec).replace('.',','):Math.round(c.v)})});
  // imágenes de la galería: revelado con máscara circular
  $$('.shapes figure').forEach(f=>gsap.from(f,{clipPath:'circle(0% at 50% 100%)',duration:1.2,ease:'power3.out',scrollTrigger:{trigger:f,start:'top 92%'}}));
  gsap.from('.maparch',{clipPath:'inset(100% 0 0 0 round 999px 999px 24px 24px)',duration:1.3,ease:'expo.out',scrollTrigger:{trigger:'.maparch',start:'top 85%'}});
  gsap.from('.info dl > *',{opacity:0,y:14,stagger:.04,duration:.6,scrollTrigger:{trigger:'.info dl',start:'top 88%'}});
  gsap.from('.foot-name',{yPercent:60,ease:'none',scrollTrigger:{trigger:'footer',start:'top bottom',end:'bottom bottom',scrub:true}});

  if(fine){
    const cur=$('.cursor');const cx=gsap.quickTo(cur,'x',{duration:.15}),cy=gsap.quickTo(cur,'y',{duration:.15});
    addEventListener('mousemove',e=>{cx(e.clientX);cy(e.clientY)});
    $$('a, button, .card, .shapes figure').forEach(el=>{el.addEventListener('mouseenter',()=>cur.classList.add('big'));el.addEventListener('mouseleave',()=>cur.classList.remove('big'))});
    $$('.magnet, .hd-right .btn, .sound').forEach(m=>{const t=m.classList.contains('magnet')?m.firstElementChild:m;m.addEventListener('mousemove',e=>{const r=m.getBoundingClientRect();gsap.to(t,{x:(e.clientX-r.left-r.width/2)*.4,y:(e.clientY-r.top-r.height/2)*.4,duration:.4})});m.addEventListener('mouseleave',()=>gsap.to(t,{x:0,y:0,duration:.8,ease:'elastic.out(1,.35)'}))});
    // tarjetas con inclinación 3D al ratón
    $$('.card').forEach(cd=>{cd.addEventListener('mousemove',e=>{const r=cd.getBoundingClientRect();gsap.to(cd,{rotateY:((e.clientX-r.left)/r.width-.5)*14,rotateX:-((e.clientY-r.top)/r.height-.5)*10,transformPerspective:800,duration:.4})});cd.addEventListener('mouseleave',()=>gsap.to(cd,{rotateY:0,rotateX:0,duration:.6}))});
  }
  addEventListener('load',()=>ScrollTrigger.refresh());
})();
