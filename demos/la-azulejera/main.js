/* Motor de sonido · timbres de cristal, palmas y guitarra rasgueada */
function crearSonido(opts){
  opts=Object.assign({base:262,volumen:.5},opts||{});
  let ctx=null,master=null,on=false,amb=null,last=0;const subs=[];
  function init(){if(ctx)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ctx=new AC();master=ctx.createGain();master.gain.value=opts.volumen;const comp=ctx.createDynamicsCompressor();master.connect(comp);comp.connect(ctx.destination);}
  function env(g,t,a,d,p){g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(p,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d);}
  function voz(freq,dur,peak,type,when){if(!on||!ctx)return;const t=ctx.currentTime+(when||0);const o=ctx.createOscillator(),g=ctx.createGain();o.type=type||'sine';o.frequency.setValueAtTime(freq,t);env(g,t,.005,dur,peak);o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+.05);const o2=ctx.createOscillator(),g2=ctx.createGain();o2.type='sine';o2.frequency.value=freq*2.76;env(g2,t,.003,dur*.5,peak*.3);o2.connect(g2);g2.connect(master);o2.start(t);o2.stop(t+dur);}
  function cuerda(freq,when,peak){if(!on||!ctx)return;const t=ctx.currentTime+(when||0);const o=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();o.type='sawtooth';o.frequency.value=freq;f.type='lowpass';f.frequency.setValueAtTime(2600,t);f.frequency.exponentialRampToValueAtTime(400,t+.6);env(g,t,.004,.9,peak||.04);o.connect(f);f.connect(g);g.connect(master);o.start(t);o.stop(t+1);}
  function ruido(dur,desde,hasta,peak,q,type,when){if(!on||!ctx)return;const t=ctx.currentTime+(when||0);const n=Math.floor(ctx.sampleRate*dur),b=ctx.createBuffer(1,n,ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;const s=ctx.createBufferSource();s.buffer=b;const f=ctx.createBiquadFilter();f.type=type||'bandpass';f.Q.value=q||1.2;f.frequency.setValueAtTime(desde,t);f.frequency.exponentialRampToValueAtTime(hasta,t+dur);const g=ctx.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+Math.min(.004,dur*.3));g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(f);f.connect(g);g.connect(master);s.start(t);}
  const escala=[1,9/8,5/4,4/3,3/2,5/3,2];
  const api={
    get on(){return on},
    toggle(){init();if(!ctx)return;on=!on;if(on){ctx.resume();api.rasgueo();}api.ambiente(on);subs.forEach(f=>f(on));},
    onChange(fn){subs.push(fn)},
    hover(){const now=performance.now();if(now-last<70)return;last=now;voz(opts.base*2*escala[Math.floor(Math.random()*escala.length)],.12,.04);},
    palma(when){ruido(.09,1800,1200,.22,.9,'bandpass',when);ruido(.05,2600,2000,.12,1.4,'bandpass',(when||0)+.012);},
    click(){api.palma(0);api.palma(.17);},
    farol(i){voz(opts.base*2*escala[i%escala.length],.25,.05);},
    rasgueo(){[1,4/3,5/3,2,8/3].forEach((m,i)=>cuerda(opts.base/2*m*(i>2?1:1),i*.025,.035));},
    whoosh(){ruido(.6,400,2600,.08,.8);},
    ambiente(act){if(!ctx)return;
      if(!act){if(amb){clearInterval(amb.iv);amb.g.gain.setTargetAtTime(.0001,ctx.currentTime,.3);amb=null;}return;}
      if(amb)return;const g=ctx.createGain();g.gain.value=.5;g.connect(master);
      let k=0;const prog=[[1,5/4,3/2],[16/15,4/3,8/5],[1,5/4,3/2],[9/10,6/5,3/2]];
      const iv=setInterval(()=>{if(!on)return;const ch=prog[Math.floor(k/6)%4];const acc=[0,3,6,8,10].includes(k%12);if(acc)ch.forEach((m,i)=>cuerda(opts.base/2*m,i*.02,.012));k++;},230);
      amb={g,iv};}
  };return api;
}
(function(){
  const $=(s,c=document)=>c.querySelector(s),$$=(s,c=document)=>[...c.querySelectorAll(s)];
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
  const mob=innerWidth<=900;
  const SFX=crearSonido({base:262});
  const sbtn=$('.sound');
  sbtn.addEventListener('click',()=>SFX.toggle());
  SFX.onChange(on=>{sbtn.classList.toggle('on',on);sbtn.setAttribute('aria-pressed',on);sbtn.setAttribute('aria-label',on?'Silenciar':'Activar sonido')});
  $$('[data-sfx], .cols li, .mnav a').forEach(el=>{el.addEventListener('mouseenter',()=>SFX.hover());el.addEventListener('click',()=>SFX.click())});
  const burger=$('.burger');
  burger.addEventListener('click',()=>{document.body.classList.toggle('menu-open');burger.setAttribute('aria-label',document.body.classList.contains('menu-open')?'Cerrar menú':'Abrir menú');SFX.click()});
  $$('.mnav a').forEach(a=>a.addEventListener('click',()=>document.body.classList.remove('menu-open')));

  // ---- farolillos (SVG generado)
  const COLS=[['#d7263d','#ffd0d6'],['#1d7a4f','#c9f2dc'],['#e9b949','#fff4cf'],['#ffffff','#d7263d'],['#f3a6b5','#ffffff'],['#d98a12','#fff2d6']];
  const GLOW=['#ff6b7f','#7fffc0','#ffd56b','#fff6e0','#ffc2cf','#ffbf5e'];
  function farolSVG(i){const [c,d]=COLS[i%COLS.length];let dots='';[[13,22],[27,22],[20,32],[11,40],[29,40],[20,48]].forEach(([x,y])=>dots+=`<circle cx="${x}" cy="${y}" r="2.6" fill="${d}"/>`);
    return `<svg viewBox="0 0 40 70"><line x1="20" y1="0" x2="20" y2="6" stroke="#2b1d1a" stroke-width="1.4"/><rect x="13" y="5" width="14" height="5" rx="1.5" fill="#2b1d1a"/><ellipse cx="20" cy="35" rx="17" ry="24" fill="${c}"/><ellipse cx="20" cy="35" rx="10" ry="24" fill="none" stroke="rgba(0,0,0,.14)" stroke-width="1"/><ellipse cx="20" cy="35" rx="3.5" ry="24" fill="none" stroke="rgba(0,0,0,.12)" stroke-width="1"/>${dots}<rect x="13" y="58" width="14" height="5" rx="1.5" fill="#2b1d1a"/><line x1="20" y1="63" x2="20" y2="70" stroke="${c==='#ffffff'?'#d7263d':c}" stroke-width="2"/></svg>`;}
  function buildGarland(g,n,sag){const W=100;g.insertAdjacentHTML('beforeend',`<svg class="wire" viewBox="0 0 100 80" preserveAspectRatio="none"><path d="M0 2 Q50 ${sag*2} 100 2"/></svg>`);
    for(let i=0;i<n;i++){const x=(i+.5)/n,y=2+(sag*2-2)*0.5*(1-Math.pow(2*x-1,2))*2*0.5;const el=document.createElement('div');el.className='farol off';el.style.left=(x*100)+'%';el.style.top=((2+(sag-1)*(1-Math.pow(2*x-1,2)))*80/80)+'px';el.style.setProperty('--glow',GLOW[i%GLOW.length]);el.innerHTML=`<div class="sw" style="animation-delay:${(-i*.37).toFixed(2)}s">${farolSVG(i)}</div>`;g.appendChild(el);}}
  $$('.garland').forEach(g=>{const n=mob?Math.min(6,+g.dataset.n):+g.dataset.n;buildGarland(g,n,mob?26:40)});
  $$('.tapa .farol').forEach((f,i)=>{f.style.setProperty('--glow',GLOW[i%GLOW.length]);f.innerHTML=`<div class="sw" style="animation-delay:${(-i*.5).toFixed(2)}s">${farolSVG(i)}</div>`});
  // farolillos del preloader
  const lg=$('.loader .lg');const LN=mob?5:7;for(let i=0;i<LN;i++){const x=(i+.5)/LN;const el=document.createElement('div');el.className='f';el.style.left=(x*100)+'%';el.style.top=(4+46*(1-Math.pow(2*x-1,2)))+'px';el.style.setProperty('--glow',GLOW[i%GLOW.length]);el.innerHTML=farolSVG(i);lg.appendChild(el);}

  // ---- lunares
  const rnd=(a,b)=>a+Math.random()*(b-a);
  $$('.hero .dots').forEach((d,k)=>{const n=mob?7:12;for(let i=0;i<n;i++){const s=[rnd(10,26),rnd(14,40),rnd(6,16)][k];d.insertAdjacentHTML('beforeend',`<i style="left:${rnd(0,98)}%;top:${rnd(0,100)}%;width:${s}px;height:${s}px;opacity:${[.9,.7,.95][k]}"></i>`)}});
  $$('.rain .ly').forEach((l,k)=>{const n=mob?6:12;for(let i=0;i<n;i++){const s=[8,14,22][k]*rnd(.7,1.3);l.insertAdjacentHTML('beforeend',`<i style="left:${rnd(0,98)}%;top:${rnd(0,100)}%;width:${s}px;height:${s}px;opacity:${[.12,.16,.2][k]}"></i>`)}});

  // sin GSAP: todo visible desde el principio
  if(!window.gsap||!window.ScrollTrigger){document.body.classList.add('loaded');$$('.farol').forEach(f=>f.classList.replace('off','on'));$('.mbar').classList.add('show');return;}
  gsap.registerPlugin(ScrollTrigger);

  // titulares en letras / líneas
  $$('.hero h1 .l').forEach(l=>{l.innerHTML=[...l.textContent].map(c=>`<span class="ch">${c}</span>`).join('')});
  $$('.story h2, .paseo .intro h2, .carta h2, .alumbrao h2, .info h2, .cta h2').forEach(h=>{h.innerHTML=h.innerHTML.split(/<br\s*\/?>/i).map(line=>`<span style="display:block;overflow:hidden;padding:0 .08em .12em"><span class="ln" style="display:block">${line}</span></span>`).join('')});

  let lenis=null;
  if(window.Lenis&&!reduce){lenis=new Lenis({lerp:.09,smoothWheel:true});lenis.on('scroll',ScrollTrigger.update);gsap.ticker.add(t=>lenis.raf(t*1000));gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]:not([href="#"])').forEach(a=>a.addEventListener('click',e=>{const t=$(a.getAttribute('href'));if(t){e.preventDefault();lenis.scrollTo(t,{duration:1.6,offset:-60})}}));}

  // cabecera, barra móvil y lluvia de lunares (parallax de 3 capas)
  const hd=$('header');let lastY=0;
  const rainLy=$$('.rain .ly');
  function rain(y){rainLy.forEach(l=>{const s=+l.dataset.s;const vh=innerHeight;gsap.set(l,{y:((y*s)%vh)-vh})})}
  rain(0);
  ScrollTrigger.create({start:0,end:'max',onUpdate:s=>{const y=s.scroll();hd.classList.toggle('scrolled',y>40);hd.classList.toggle('hide',y>lastY&&y>700&&!document.body.classList.contains('menu-open'));lastY=y;$('.mbar').classList.toggle('show',y>innerHeight*.5);if(!reduce)rain(y);
    const v=s.getVelocity();gsap.to('.garland .farol',{rotation:gsap.utils.clamp(-14,14,-v/180),duration:.6,overwrite:'auto'});}});

  // ---- INTRO: los farolillos se encienden en cascada y un lunar abre la página
  const lf=$$('.loader .f');
  const tl=gsap.timeline({onComplete:()=>document.body.classList.add('loaded')});
  tl.from('.loader .f',{y:-120,rotation:()=>rnd(-30,30),duration:.6,ease:'back.out(1.6)',stagger:.04},0)
    .to({},{duration:.01},.0);
  lf.forEach((f,i)=>tl.call(()=>{f.classList.add('on');SFX.farol(i)},null,.45+i*.08));
  tl.to('.loader .t',{opacity:1,duration:.3},.45+LN*.08)
    .to('.loader .dotwipe',{scale:()=>Math.hypot(innerWidth,innerHeight)/14,duration:.45,ease:'power3.in'},.95)
    .to('.loader',{opacity:0,duration:.3},1.3)
    .set('.loader',{display:'none'},1.6)
    .from('.hero h1 .ch',{yPercent:110,rotation:()=>rnd(-25,25),opacity:0,duration:.9,ease:'back.out(1.8)',stagger:.03},1.5)
    .from('.hero .since, .hero p.sub, .hero .ctas',{y:24,opacity:0,duration:.7,stagger:.08,ease:'power3.out'},1.75)
    .from('.caseta',{y:120,rotation:6,opacity:0,duration:1,ease:'back.out(1.4)'},1.6)
    .from('.caseta .badge',{scale:0,rotation:-90,duration:.8,ease:'back.out(2)'},2.0)
    .from('.hero .dots i',{scale:0,duration:.6,stagger:{each:.01,from:'random'},ease:'back.out(2)'},1.55)
    .from('header',{opacity:0,duration:.6},1.6);
  // cascada de farolillos del hero
  $$('.hero .garland .farol').forEach((f,i)=>tl.call(()=>{f.classList.replace('off','on')},null,1.7+i*.09));
  // azulejos sueltos que flotan en el hero
  tl.from('.hero .azu',{scale:0,rotation:-120,opacity:0,duration:.8,stagger:.15,ease:'back.out(1.8)'},1.9);
  function flota(sel,delay,dy,rot){const el=$(sel);if(!el)return;gsap.to(el,{y:dy,rotation:rot,duration:3.4,ease:'sine.inOut',yoyo:true,repeat:-1,delay})}
  if(!reduce){flota('.azu.s1',3,-18,14);flota('.azu.s2',3.3,14,-12);}

  const mm=gsap.matchMedia();
  mm.add({desk:'(min-width:901px)',mob:'(max-width:900px)',rm:'(prefers-reduced-motion: reduce)'},c=>{
    const {desk,rm}=c.conditions;
    if(rm){$$('.farol').forEach(f=>f.classList.replace('off','on'));return;}
    // parallax del hero: lunares a tres velocidades, foto y titular
    $$('.hero .dots').forEach(d=>gsap.to(d,{yPercent:parseFloat(d.dataset.speed)*60,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}}));
    gsap.to('.caseta .pic img',{yPercent:-14,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
    gsap.to('.hero .copy',{yPercent:desk?18:8,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
    // 1968 que se mueve
    gsap.fromTo('.story .yr',{xPercent:-8,rotation:-6},{xPercent:6,rotation:3,ease:'none',scrollTrigger:{trigger:'.story',start:'top bottom',end:'bottom top',scrub:true}});

    if(desk){
      const track=$('.paseo .track');
      const dist=()=>track.scrollWidth-innerWidth;
      const tw=gsap.to(track,{x:()=>-dist(),ease:'none',scrollTrigger:{trigger:'.paseo',start:'top top',end:()=>'+='+dist(),pin:true,scrub:1,invalidateOnRefresh:true,onEnter:()=>SFX.whoosh()}});
      $$('.tapa').forEach((t,i)=>{
        const f=t.querySelector('.farol');
        ScrollTrigger.create({trigger:t,containerAnimation:tw,start:'left 75%',onEnter:()=>{f.classList.replace('off','on');SFX.farol(i)},onLeaveBack:()=>f.classList.replace('on','off')});
        gsap.to(t.querySelector('img'),{scale:1,rotation:i%2?8:-8,ease:'none',scrollTrigger:{trigger:t,containerAnimation:tw,start:'left right',end:'right left',scrub:true}});
        gsap.from(t,{y:i%2?-60:60,rotation:i%2?4:-4,ease:'none',scrollTrigger:{trigger:t,containerAnimation:tw,start:'left right',end:'center 55%',scrub:true}});
      });
      $$('.gal .col').forEach(col=>gsap.to(col,{yPercent:parseFloat(col.dataset.speed)*100,ease:'none',scrollTrigger:{trigger:'.gal',start:'top bottom',end:'bottom top',scrub:true}}));
    }else{
      $$('.tapa .farol').forEach(f=>f.classList.replace('off','on'));
    }
    gsap.fromTo('.gal .word',{xPercent:0},{xPercent:-50,ease:'none',scrollTrigger:{trigger:'.gal',start:'top bottom',end:'bottom top',scrub:true}});

    // ZOOM: un lunar rojo se abre hasta el alumbrao
    const R=()=>Math.hypot(innerWidth,innerHeight)/2+20;
    const al=gsap.timeline({scrollTrigger:{trigger:'.alumbrao',start:'top top',end:'+=130%',scrub:1,pin:true,onEnter:()=>SFX.whoosh()}});
    al.fromTo('.alumbrao .photo',{clipPath:'circle(70px at 50% 50%)'},{clipPath:()=>`circle(${R()}px at 50% 50%)`,ease:'power2.in'},0)
      .to('.alumbrao .photo img',{scale:1,ease:'none'},0)
      .to('.alumbrao .ring',{scale:()=>R()/70,opacity:0,rotation:90,ease:'power2.in'},0)
      .fromTo('.alumbrao .txt',{scale:.85},{scale:1,ease:'none'},0);
    $$('.alumbrao .garland .farol').forEach((f,i,arr)=>al.call(()=>{const on=al.scrollTrigger&&al.scrollTrigger.direction>0;f.classList.toggle('on',on);f.classList.toggle('off',!on);if(on)SFX.farol(i)},null,.35+i*(.5/arr.length)));
  });

  // revelados
  $$('.ln').forEach(l=>gsap.from(l,{yPercent:110,rotation:3,duration:1,ease:'expo.out',scrollTrigger:{trigger:l.parentElement,start:'top 88%',onEnter:()=>SFX.whoosh()}}));
  $$('.cta .garland .farol').forEach((f,i)=>ScrollTrigger.create({trigger:'.cta',start:'top 70%',onEnter:()=>setTimeout(()=>f.classList.replace('off','on'),i*110),onLeaveBack:()=>f.classList.replace('on','off')}));
  $$('[data-count]').forEach(el=>{const v=parseFloat(el.dataset.count),dec=+el.dataset.dec||0,o={v:0};gsap.to(o,{v,duration:2,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 92%'},onUpdate:()=>el.textContent=dec?o.v.toFixed(dec).replace('.',','):Math.round(o.v).toLocaleString('es-ES')})});
  const yr={v:1900};gsap.to(yr,{v:1968,duration:1.6,ease:'power3.out',scrollTrigger:{trigger:'.story .year',start:'top 85%'},onUpdate:()=>$('.story .yr').textContent=Math.round(yr.v)});
  gsap.from('.chip',{scale:0,rotation:()=>rnd(-12,12),duration:.7,stagger:.12,ease:'back.out(2)',scrollTrigger:{trigger:'.story .tips',start:'top 92%'}});
  gsap.from('.cols li',{x:-24,opacity:0,stagger:.05,duration:.6,ease:'power3.out',scrollTrigger:{trigger:'.cols',start:'top 82%'}});
  $$('.gal .ph img').forEach(img=>gsap.fromTo(img,{clipPath:'circle(0% at 50% 50%)'},{clipPath:'circle(75% at 50% 50%)',duration:1.2,ease:'expo.out',scrollTrigger:{trigger:img,start:'top 92%'}}));
  gsap.from('.local',{y:80,rotation:i=>i?3:-3,opacity:0,duration:1,stagger:.15,ease:'back.out(1.3)',scrollTrigger:{trigger:'.locales',start:'top 85%'}});
  gsap.from('.hours',{rotation:-8,scale:.8,opacity:0,duration:.9,ease:'back.out(2)',scrollTrigger:{trigger:'.hours',start:'top 90%'}});
  gsap.from('footer .fn',{yPercent:60,ease:'none',scrollTrigger:{trigger:'footer',start:'top bottom',end:'bottom bottom',scrub:true}});

  if(fine){
    const fi=$('.float-img'),fimg=$('.float-img img'),cur=$('.cursor');
    const xTo=gsap.quickTo(fi,'x',{duration:.6,ease:'power3'}),yTo=gsap.quickTo(fi,'y',{duration:.6,ease:'power3'});
    const cx=gsap.quickTo(cur,'x',{duration:.15}),cy=gsap.quickTo(cur,'y',{duration:.15});
    addEventListener('mousemove',e=>{cur.style.opacity=1;xTo(e.clientX);yTo(e.clientY);cx(e.clientX);cy(e.clientY)});
    $$('.cols li').forEach(li=>{li.addEventListener('mouseenter',()=>{fimg.src=li.dataset.img;gsap.to(fi,{opacity:1,scale:1,rotation:rnd(-10,10),duration:.5,ease:'back.out(2)'})});li.addEventListener('mouseleave',()=>gsap.to(fi,{opacity:0,scale:.4,duration:.35}))});
    $$('a, button, .tapa').forEach(el=>{el.addEventListener('mouseenter',()=>cur.classList.add('big'));el.addEventListener('mouseleave',()=>cur.classList.remove('big'))});
    $$('.magnet').forEach(m=>{const t=m.firstElementChild;m.addEventListener('mousemove',e=>{const r=m.getBoundingClientRect();gsap.to(t,{x:(e.clientX-r.left-r.width/2)*.4,y:(e.clientY-r.top-r.height/2)*.4,duration:.4})});m.addEventListener('mouseleave',()=>gsap.to(t,{x:0,y:0,duration:.8,ease:'elastic.out(1,.4)'}))});
  }
  addEventListener('load',()=>ScrollTrigger.refresh());
})();
