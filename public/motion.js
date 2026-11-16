/* Native scrolling: no wheel/touch interception and no animation-library dependency. */
(()=>{
 'use strict';
 const preference=matchMedia('(prefers-reduced-motion: reduce)');
 const header=document.querySelector('.header');
 const hero=document.querySelector('.hero:not(.apsara-hero)');
 const stack=document.querySelector('.triptych');
 const body=document.body;
 const clamp=v=>Math.min(1,Math.max(0,v));
 const ease=v=>v*v*(3-2*v);
 let stage=null,observer=null,frame=0,active=false,stackMetrics=null;
 let revealTargets=[],parallaxTargets=[];
 const readHeaderHeight=()=>header?.getBoundingClientRect().height||80;

 function splitHeading(el){
  if(el.dataset.motionSplit)return;
  const label=el.innerText.replace(/\s+/g,' ').trim();
  const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
  const textNodes=[];while(walker.nextNode())textNodes.push(walker.currentNode);
  let wordIndex=0;
  for(const node of textNodes){
   const fragment=document.createDocumentFragment();
   for(const token of node.textContent.split(/(\s+)/)){
    if(!token)continue;
    if(/^\s+$/.test(token)){fragment.append(document.createTextNode(token));continue;}
    const mask=document.createElement('span');mask.className='motion-word-wrap';mask.setAttribute('aria-hidden','true');
    const word=document.createElement('span');word.className='motion-word';word.textContent=token;
    word.style.setProperty('--word-index',Math.min(wordIndex++,12));mask.append(word);fragment.append(mask);
   }
   node.replaceWith(fragment);
  }
  el.setAttribute('aria-label',label);el.dataset.motionSplit='true';
 }

 function prepareStack(){
  if(!stack)return;
  if(!stage){
   stage=document.createElement('div');stage.className='stack-stage';
   Array.from(stack.children).forEach(el=>stage.append(el));stack.append(stage);
   stack.setAttribute('role','group');stack.setAttribute('aria-label','Ba góc nhìn kiến trúc');
   stage.querySelectorAll('.reveal,.media-reveal').forEach(el=>{el.classList.remove('reveal','media-reveal','motion-reveal','motion-image');el.classList.add('visible');});
  }
  const mobile=innerWidth<=800;
  const gap=mobile?24:48;
  const top=readHeaderHeight()+(mobile?16:24);
  const height=Math.max(180,Math.min(mobile?480:656,innerHeight-top-28));
  const travel=Math.round(innerHeight*(mobile?1.3:1.7));
  stackMetrics={top,height,gap,travel,imageHeight:height-2*gap};
  stack.style.setProperty('--stack-top',`${top}px`);
  stack.style.setProperty('--stack-height',`${height}px`);
  stack.style.setProperty('--stack-image-height',`${height-2*gap}px`);
  stack.style.setProperty('--stack-gap',`${gap}px`);
  stack.style.setProperty('--stack-travel',`${travel}px`);
  stack.classList.add('is-scroll-stack');
 }

 function prepareReveals(){
  document.querySelectorAll('.section>h2.reveal').forEach(el=>{splitHeading(el);el.classList.add('motion-heading');});
  const targets=new Set(document.querySelectorAll('.reveal,.media-reveal,.carousel-image,.image-title h2,.footer-grid>div,.contact form'));
  revealTargets=Array.from(targets).filter(el=>!el.closest('.triptych'));
  for(const el of revealTargets){
   el.classList.add('motion-reveal');
   if(el.classList.contains('media-reveal')||el.classList.contains('carousel-image'))el.classList.add('motion-image');
   if(el.parentElement?.classList.contains('four-columns')||el.parentElement?.classList.contains('ownership-cards')){
    const index=Array.from(el.parentElement.children).indexOf(el);el.style.setProperty('--reveal-delay',`${Math.min(index*65,195)}ms`);
   }
  }
  observer=new IntersectionObserver(entries=>{
   for(const entry of entries){if(entry.isIntersecting){entry.target.classList.add('motion-visible');observer.unobserve(entry.target);}}
  },{threshold:.06,rootMargin:'0px 0px -6% 0px'});
  revealTargets.forEach(el=>observer.observe(el));
 }

 function update(){
  frame=0;if(!active)return;
  const viewportHeight=innerHeight;
  // Batch geometry reads before style writes.
  const heroProgress=hero?clamp(-hero.getBoundingClientRect().top/hero.offsetHeight):0;
  const stackTop=stack&&stackMetrics?stack.getBoundingClientRect().top:0;
  const imagePositions=parallaxTargets.map(el=>({el,rect:el.getBoundingClientRect()}));
  if(hero)hero.style.setProperty('--hero-progress',heroProgress.toFixed(4));
  if(stack&&stackMetrics){
   const {top,height,gap,travel,imageHeight}=stackMetrics;
   const progress=clamp((top-stackTop)/travel);
   const front=ease(clamp((progress-.035)/.43));
   const middle=ease(clamp((progress-.505)/.43));
   stack.style.setProperty('--stack-front-y',`${((height+gap)*front).toFixed(2)}px`);
   stack.style.setProperty('--stack-middle-y',`${(-gap*front+(height+gap)*middle).toFixed(2)}px`);
   stack.style.setProperty('--stack-middle-scale',(1+(height/imageHeight-1)*front).toFixed(4));
   stack.style.setProperty('--stack-back-scale',(1+.25*middle).toFixed(4));
   stack.dataset.scrollProgress=progress.toFixed(3);
   stack.dataset.scrollPhase=progress<.465?'front':progress<.935?'middle':'back';
  }
  for(const {el,rect} of imagePositions){
   if(rect.bottom<0||rect.top>viewportHeight)continue;
   const position=clamp((viewportHeight-rect.top)/(viewportHeight+rect.height));
   const distance=Math.min(28,rect.height*.035);
   el.style.setProperty('--image-pan',`${((position-.5)*2*distance).toFixed(2)}px`);
  }
 }
 function schedule(){if(active&&!frame)frame=requestAnimationFrame(update);}
 function resize(){if(active){prepareStack();schedule();}}
 function disable(){
  active=false;body.classList.remove('motion-ready');body.dataset.motion='reduced';
  observer?.disconnect();observer=null;
  if(frame)cancelAnimationFrame(frame);frame=0;
  stack?.classList.remove('is-scroll-stack');
  hero?.style.setProperty('--hero-progress','0');
  parallaxTargets.forEach(el=>el.style.setProperty('--image-pan','0px'));
 }
 function enable(){
  if(preference.matches||!('IntersectionObserver' in window)){disable();return;}
  active=true;prepareStack();prepareReveals();
  parallaxTargets=Array.from(document.querySelectorAll('.wide-photo,.image-title-main'));
  parallaxTargets.forEach(el=>el.classList.add('motion-parallax'));
  body.classList.add('motion-ready');body.dataset.motion='ready';schedule();
 }
 document.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const link=event.target.closest('a[href^="#"]');if(!link)return;
  const href=link.getAttribute('href');
  if(href==='#'){event.preventDefault();window.scrollTo({top:0,behavior:preference.matches?'auto':'smooth'});return;}
  const target=document.getElementById(href.slice(1));
  if(!target||target.tagName==='DIALOG')return;
  event.preventDefault();target.scrollIntoView({behavior:preference.matches?'auto':'smooth',block:'start'});
  history.pushState(null,'',href);
 });
 addEventListener('scroll',schedule,{passive:true});
 addEventListener('resize',resize,{passive:true});
 addEventListener('pageshow',resize);
 preference.addEventListener('change',()=>{disable();enable();});
 enable();
 document.fonts?.ready.then(resize);
 addEventListener('load',resize,{once:true});
})();
