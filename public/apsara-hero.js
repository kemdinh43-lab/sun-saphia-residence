/* Adaptation of the supplied React hero for this buildless HTML website. */
(()=>{
 'use strict';
 const hero=document.querySelector('.apsara-hero');
 if(!hero||!window.gsap||!window.ScrollTrigger)return;
 const gsap=window.gsap,ScrollTrigger=window.ScrollTrigger;
 gsap.registerPlugin(ScrollTrigger);
 const media=gsap.matchMedia();
 media.add('(min-width:801px) and (prefers-reduced-motion:no-preference)',()=>{
  const context=gsap.context(()=>{
   hero.classList.add('has-scroll-pin');
   const timeline=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:hero,start:'top top',end:'+=110%',pin:true,pinSpacing:true,scrub:1,invalidateOnRefresh:true,anticipatePin:1,onUpdate:self=>{hero.dataset.revealProgress=self.progress.toFixed(3);}}});
   timeline
    .to('.apsara-ribbon--tl',{xPercent:-82,yPercent:-85,rotation:-8,opacity:0,duration:1},0)
    .to('.apsara-ribbon--tr',{xPercent:80,yPercent:-80,rotation:10,opacity:0,duration:1},0)
    .to('.apsara-ribbon--bl',{xPercent:-86,yPercent:76,rotation:7,opacity:0,duration:1},0)
    .to('.apsara-ribbon--br',{xPercent:82,yPercent:72,rotation:-9,opacity:0,duration:1},0)
    .fromTo('.apsara-hero__photo',{scale:1.07},{scale:1,duration:1},0)
    .to('.apsara-hero__shade',{opacity:.35,duration:.8},.15)
    .to('.apsara-hero__copy',{opacity:0,y:-25,duration:.32},.58)
    .to('.apsara-hero__scroll-hint',{opacity:0,duration:.25},.15);
  },hero);
  return()=>{context.revert();hero.classList.remove('has-scroll-pin');delete hero.dataset.revealProgress;};
 });
 const photo=hero.querySelector('.apsara-hero__photo');
 photo?.addEventListener('load',()=>ScrollTrigger.refresh(),{once:true});
 document.fonts?.ready.then(()=>ScrollTrigger.refresh());
 window.addEventListener('pageshow',()=>ScrollTrigger.refresh());
})();
