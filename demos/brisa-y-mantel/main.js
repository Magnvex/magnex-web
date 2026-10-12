document.documentElement.classList.add('js');setTimeout(function(){document.body.classList.add('loaded')},3200);

/* Motor de sonido (base _assets/sonido.js) personalizado: copas que tintinean + acordeón lejano */
function crearSonido(opts){
  opts=Object.assign({base:330,volumen:0.5},opts||{});
  let ctx=null,master=null,on=false,amb=null,last=0;const subs=[];
  function init(){if(ctx)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ctx=new AC();master=ctx.createGain();master.gain.value=opts.volumen;const comp=ctx.createDynamicsCompressor();master.connect(comp);comp.connect(ctx.destination);}
  function env(g,t,a,d,peak){g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+a+d);}
  function voz(freq,dur,peak,type,delay){if(!on||!ctx)return;const t=ctx.currentTime+(delay||0);const o=ctx.createOscillator(),g=ctx.createGain();o.type=type||'sine';o.frequency.setValueAtTime(freq,t);env(g,t,0.003,dur,peak);o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+0.05);}
  function copa(f,dur,peak,delay){voz(f,dur,peak,'sine',delay);voz(f*2.76,dur*.6,peak*.35,'sine',delay);voz(f*5.4,dur*.3,peak*.15,'sine',delay);}
  function ruido(dur,desde,hasta,peak,q){if(!on||!ctx)return;const t=ctx.currentTime;const n=Math.floor(ctx.sampleRate*dur),b=ctx.createBuffer(1,n,ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;const s=ctx.createBufferSource();s.buffer=b;const f=ctx.createBiquadFilter();f.type='bandpass';f.Q.value=q||1.2;f.frequency.setValueAtTime(desde,t);f.frequency.exponentialRampToValueAtTime(hasta,t+dur);const g=ctx.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+dur*0.35);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);s.connect(f);f.connect(g);g.connect(master);s.start(t);}
  const esc=[1,9/8,5/4,4/3,3/2,5/3,2];
  const api={
    get on(){return on},
    toggle(){init();if(!ctx)return;on=!on;if(on){ctx.resume();api.click();}api.ambiente(on);subs.forEach(f=>f(on));},
    onChange(fn){subs.push(fn)},
    hover(){const now=performance.now();if(now-last<70)return;last=now;copa(opts.base*3*esc[Math.floor(Math.random()*esc.length)],.35,.03);},
    click(){copa(opts.base*4,.6,.08);copa(opts.base*5,.6,.06,.09);},
    whoosh(){ruido(.7,350,2600,.09,.9);},
    ambiente(activar){ // acordeón: dos sierras desafinadas con vaivén, muy bajo
      if(!ctx)return;
      if(!activar){if(amb){const a=amb;a.g.gain.setTargetAtTime(0.0001,ctx.currentTime,.4);setTimeout(()=>a.nodes.forEach(n=>{try{n.stop()}catch(e){}}),1500);amb=null;}return;}
      if(amb)return;const g=ctx.createGain();g.gain.value=0.0001;g.connect(master);const nodes=[];
      const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=1100;f.connect(g);
      [[1,0],[1,9],[1.25,-6],[1.5,5]].forEach(([m,dt])=>{const o=ctx.createOscillator();o.type='sawtooth';o.frequency.value=opts.base/2*m;o.detune.value=dt;const og=ctx.createGain();og.gain.value=.18;o.connect(og);og.connect(f);o.start();nodes.push(o);});
      const lfo=ctx.createOscillator(),lg=ctx.createGain();lfo.frequency.value=.35;lg.gain.value=.012;lfo.connect(lg);lg.connect(g.gain);lfo.start();nodes.push(lfo);
      g.gain.setTargetAtTime(.03,ctx.currentTime,1.4);amb={g,nodes};
    }
  };return api;
}

(function(){
  const $=(s,c=document)=>c.querySelector(s),$$=(s,c=document)=>[...c.querySelectorAll(s)];
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;

  const SFX=crearSonido({base:330});
  const sbtn=$('.sound');
  sbtn.addEventListener('click',()=>SFX.toggle());
  SFX.onChange(on=>{sbtn.classList.toggle('on',on);sbtn.setAttribute('aria-pressed',on);sbtn.setAttribute('aria-label',on?'Silenciar':'Activar sonido')});
  $$('[data-sfx], .mnav a, .burger').forEach(e=>{e.addEventListener('mouseenter',()=>SFX.hover());e.addEventListener('click',()=>SFX.click())});

  $('.burger').addEventListener('click',()=>{const o=document.body.classList.toggle('menu-open');$('.burger').setAttribute('aria-label',o?'Cerrar menú':'Abrir menú')});
  $$('.mnav a').forEach(a=>a.addEventListener('click',()=>document.body.classList.remove('menu-open')));
  const rows=$$('.hrs div');const d=(new Date().getDay()+6)%7;if(rows[d])rows[d].classList.add('today');

  if(!window.gsap||!window.ScrollTrigger){document.body.classList.add('loaded');return;}
  gsap.registerPlugin(ScrollTrigger);

  let lenis=null;
  if(window.Lenis&&!reduce){lenis=new Lenis({lerp:.085,smoothWheel:true});lenis.on('scroll',ScrollTrigger.update);gsap.ticker.add(t=>lenis.raf(t*1000));gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]:not([href="#"])').forEach(a=>a.addEventListener('click',e=>{const t=$(a.getAttribute('href'));if(t){e.preventDefault();lenis.scrollTo(t,{duration:1.6})}}));}

  const hd=$('header');let lastY=0;
  ScrollTrigger.create({start:0,end:'max',onUpdate:s=>{const y=s.scroll();hd.classList.toggle('scrolled',y>40);hd.classList.toggle('hide',y>lastY&&y>700&&!document.body.classList.contains('menu-open'));lastY=y;$('.mbar').classList.toggle('show',y>innerHeight*.7)}});

  /* INTRO: rótulo dorado que se dibuja, la persiana sube y el toldo se despliega */
  const st=$('.shutter text');const L=1400;gsap.set(st,{strokeDasharray:L,strokeDashoffset:L});
  const intro=gsap.timeline({onComplete:()=>document.body.classList.add('loaded')});
  intro.to(st,{strokeDashoffset:0,duration:.85,ease:'power2.inOut'},0)
    .to(st,{fill:'#e2c58a',duration:.3},.6)
    .to('.shutter .sub',{opacity:1,duration:.3},.55)
    .to('.shutter',{yPercent:-100,duration:.7,ease:'power3.inOut'},.95)
    .fromTo('.awning',{rotateX:-88},{rotateX:0,duration:1.3,ease:'elastic.out(1,.55)'},1.25)
    .from('.window',{clipPath:'inset(0 50% 0 50%)',duration:1.1,ease:'expo.inOut'},1.2)
    .from('.glass-txt h1',{y:40,opacity:0,duration:1,ease:'expo.out'},1.55)
    .from('.glass-txt p, .sill span',{opacity:0,y:10,duration:.7,stagger:.08},1.7)
    .from('.aboard',{y:80,rotate:14,opacity:0,duration:1,ease:'back.out(1.6)'},1.6)
    .from('header',{opacity:0,y:-12,duration:.7},1.6);

  const mm=gsap.matchMedia();
  mm.add({desk:'(min-width:901px)',mob:'(max-width:900px)',rm:'(prefers-reduced-motion: reduce)'},c=>{
    const {desk,rm}=c.conditions;if(rm)return;
    /* HERO: el escaparate crece hasta pantalla completa, el toldo se recoge */
    const h=gsap.timeline({scrollTrigger:{trigger:'.hero',start:'top top',end:'+=120%',scrub:1,pin:true,anticipatePin:1,onEnter:()=>SFX.whoosh()}});
    h.to('.awning',{yPercent:-110,rotateX:35,ease:'power1.in',duration:.6},0)
     .to('.window',{top:0,bottom:0,width:'100vw',borderWidth:0,outlineOffset:0,outlineWidth:0,ease:'power2.inOut',duration:1},0)
     .to('.window img',{scale:1,ease:'none',duration:1},0)
     .to('.sill',{yPercent:100,ease:'power1.in',duration:.5},0)
     .to('.aboard',{x:200,opacity:0,duration:.4},0)
     .to('.glass-txt',{y:desk?-innerHeight*.28:-innerHeight*.22,scale:1.08,ease:'none',duration:1},0);

    /* espejo: brillo que cruza */
    gsap.fromTo('.sheen',{xPercent:0},{xPercent:420,ease:'none',scrollTrigger:{trigger:'.mirror',start:'top 80%',end:'bottom 20%',scrub:true}});
    gsap.fromTo('.bigword',{xPercent:5},{xPercent:-45,ease:'none',scrollTrigger:{trigger:'.mirror-sec',start:'top bottom',end:'bottom top',scrub:true}});
    gsap.from('.mirror',{y:120,scale:.92,ease:'none',scrollTrigger:{trigger:'.mirror-sec',start:'top bottom',end:'top 20%',scrub:true}});

    /* pared horizontal */
    if(desk){
      const tr=$('.wall-track');const dist=()=>tr.scrollWidth-innerWidth;
      const tw=gsap.to(tr,{x:()=>-dist(),ease:'none',scrollTrigger:{trigger:'.wall',start:'top top',end:()=>'+='+dist(),pin:true,scrub:1,invalidateOnRefresh:true,onEnter:()=>SFX.whoosh(),
        onUpdate:s=>{const v=gsap.utils.clamp(-6,6,s.getVelocity()/250);gsap.to('.pf',{rotate:-v,duration:.6,overwrite:'auto'})}}});
      $$('.pf img').forEach(im=>gsap.fromTo(im,{xPercent:-6,scale:1.2},{xPercent:6,scale:1.05,ease:'none',scrollTrigger:{trigger:im.closest('.pf'),containerAnimation:tw,start:'left right',end:'right left',scrub:true}}));
    }else{
      gsap.from('.pf',{opacity:0,y:40,stagger:.1,duration:.9,scrollTrigger:{trigger:'.wall-track',start:'top 85%'}});
    }
    /* galería en parallax */
    $$('.g img').forEach((im,i)=>gsap.fromTo(im,{yPercent:-8},{yPercent:8,ease:'none',scrollTrigger:{trigger:im.parentNode,start:'top bottom',end:'bottom top',scrub:true}}));
    gsap.fromTo('.word div',{xPercent:0},{xPercent:-45,ease:'none',scrollTrigger:{trigger:'.word',start:'top bottom',end:'bottom top',scrub:true}});
    gsap.fromTo('.resa .ring',{scale:.4,opacity:0},{scale:1,opacity:1,stagger:.1,ease:'none',scrollTrigger:{trigger:'.resa',start:'top bottom',end:'center center',scrub:true}});
  });

  /* revelados */
  gsap.from('.maison h2 .ln>span',{yPercent:110,stagger:.1,duration:1.1,ease:'expo.out',scrollTrigger:{trigger:'.maison h2',start:'top 82%',onEnter:()=>SFX.whoosh()}});
  gsap.from('.maison .side p',{opacity:0,y:30,stagger:.12,duration:1,scrollTrigger:{trigger:'.maison .side',start:'top 85%'}});
  gsap.from('.mosaic',{scaleY:0,duration:1.2,ease:'expo.out',scrollTrigger:{trigger:'.mosaic',start:'top 95%'}});
  gsap.from('.menu li',{opacity:0,filter:'blur(8px)',y:10,stagger:.1,duration:1,ease:'power2.out',scrollTrigger:{trigger:'.menu',start:'top 80%'}});
  $$('.mirror-head h2, .wall-head h2, .slate-txt h2, .visit h2, .resa h2').forEach(t=>gsap.from(t,{clipPath:'inset(0 0 100% 0)',y:50,duration:1.2,ease:'expo.out',scrollTrigger:{trigger:t,start:'top 86%'}}));
  gsap.from('.slate',{rotate:-9,y:80,opacity:0,duration:1.3,ease:'back.out(1.4)',scrollTrigger:{trigger:'.slate',start:'top 82%'}});
  $$('.slate .chalk path').forEach(p=>{const l=p.getTotalLength();gsap.fromTo(p,{strokeDasharray:l,strokeDashoffset:l},{strokeDashoffset:0,duration:1.2,ease:'power2.inOut',scrollTrigger:{trigger:'.slate',start:'top 70%'}})});
  gsap.from('.slate dl > div',{opacity:0,x:-20,stagger:.18,duration:.8,scrollTrigger:{trigger:'.slate',start:'top 70%'}});
  $$('.g').forEach((g,i)=>gsap.from(g,{clipPath:'inset(100% 0 0 0)',duration:1.3,ease:'expo.inOut',delay:(i%3)*.08,scrollTrigger:{trigger:g,start:'top 90%'}}));
  gsap.from('.hrs div',{opacity:0,y:12,stagger:.05,duration:.6,scrollTrigger:{trigger:'.hrs',start:'top 85%'}});
  gsap.from('.fname',{yPercent:60,opacity:0,duration:1.3,ease:'expo.out',scrollTrigger:{trigger:'footer',start:'top 92%'}});
  $$('[data-count]').forEach(e=>{const v=parseFloat(e.dataset.count),dec=+e.dataset.dec||0,o={v:0};gsap.to(o,{v,duration:2,ease:'power3.out',scrollTrigger:{trigger:e,start:'top 90%'},onUpdate:()=>e.textContent=dec?o.v.toFixed(dec).replace('.',','):Math.round(o.v).toLocaleString('es-ES')})});

  if(fine){
    const cur=$('.cursor');const qx=gsap.quickTo(cur,'x',{duration:.15}),qy=gsap.quickTo(cur,'y',{duration:.15});
    const fl=$('.floatimg'),fimg=$('.floatimg img');const fx=gsap.quickTo(fl,'x',{duration:.6,ease:'power3'}),fy=gsap.quickTo(fl,'y',{duration:.6,ease:'power3'});
    addEventListener('mousemove',e=>{qx(e.clientX);qy(e.clientY);fx(e.clientX+40);fy(e.clientY-115)});
    $$('a, button, .pf, .menu li').forEach(e=>{e.addEventListener('mouseenter',()=>cur.classList.add('big'));e.addEventListener('mouseleave',()=>cur.classList.remove('big'))});
    $$('.menu li').forEach(li=>{li.addEventListener('mouseenter',()=>{fimg.src=li.dataset.img;gsap.to(fl,{opacity:1,scale:1,duration:.4})});li.addEventListener('mouseleave',()=>gsap.to(fl,{opacity:0,scale:.7,duration:.3}))});
    $$('.magnet, .hd-right .btn').forEach(m=>{const t=m.firstElementChild||m;m.addEventListener('mousemove',e=>{const r=m.getBoundingClientRect();gsap.to(t,{x:(e.clientX-r.left-r.width/2)*.35,y:(e.clientY-r.top-r.height/2)*.35,duration:.4})});m.addEventListener('mouseleave',()=>gsap.to(t,{x:0,y:0,duration:.8,ease:'elastic.out(1,.4)'}))});
  }
  addEventListener('load',()=>ScrollTrigger.refresh());
})();
