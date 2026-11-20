(()=>{
 'use strict';
 const video=document.getElementById('hero-tvc'),play=document.getElementById('hero-tvc-play'),sound=document.getElementById('hero-tvc-sound');
 if(video&&play&&sound){
  const hero=video.closest('.tvc-hero'),reduced=matchMedia('(prefers-reduced-motion: reduce)'),connection=navigator.connection;
  let userPaused=false,visible=true,loaded=false,wasPlaying=false;
  video.muted=true;video.defaultMuted=true;
  function source(){if(loaded)return;loaded=true;video.src=matchMedia('(max-width:800px)').matches?'assets/sun-saphia-tvc-960.mp4':'assets/sun-saphia-tvc-1600.mp4';video.load();}
  function label(){play.textContent=video.paused?'Phát TVC':'Tạm dừng';sound.textContent=video.muted?'Bật âm thanh':'Tắt âm thanh';sound.setAttribute('aria-pressed',String(!video.muted));}
  function start(){source();return video.play().catch(()=>label());}
  play.addEventListener('click',()=>{if(video.paused){userPaused=false;start();}else{userPaused=true;video.pause();}});
  sound.addEventListener('click',()=>{video.muted=!video.muted;if(video.paused&&!video.muted){userPaused=false;start();}label();});
  for(const event of ['play','pause','volumechange'])video.addEventListener(event,label);
  video.addEventListener('loadeddata',()=>hero.classList.add('tvc-ready'));
  video.addEventListener('error',()=>{hero.classList.remove('tvc-ready');play.textContent='Thử phát lại';loaded=false;});
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible){wasPlaying=!video.paused;video.pause();}else if(wasPlaying&&!userPaused&&!document.hidden)start();},{threshold:.1});observer.observe(hero);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){wasPlaying=!video.paused;video.pause();}else if(visible&&wasPlaying&&!userPaused)start();});
  reduced.addEventListener('change',()=>{if(reduced.matches){userPaused=true;video.pause();}});
  if(!reduced.matches&&!connection?.saveData&&!['slow-2g','2g'].includes(connection?.effectiveType))start();
  label();
 }
 const main=document.getElementById('advisor-main-photo');
 document.querySelectorAll('.advisor-thumbnails button').forEach(button=>button.addEventListener('click',()=>{
  const img=button.querySelector('img');if(!main||!img)return;main.src=img.src;main.alt=img.alt;
  document.querySelectorAll('.advisor-thumbnails button').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
 }));
})();
