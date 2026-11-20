(()=>{
 'use strict';
 const video=document.getElementById('hero-tvc'),play=document.getElementById('hero-tvc-play');
 if(!video||!play)return;
 const hero=video.closest('.tvc-hero'),reduced=matchMedia('(prefers-reduced-motion: reduce)'),connection=navigator.connection;
 let userPaused=false,visible=true,loaded=false,wasPlaying=false;
 video.muted=true;video.defaultMuted=true;
 function source(){if(loaded)return;loaded=true;video.src=matchMedia('(max-width:800px)').matches?'assets/sun-saphia-tvc-960.mp4':'assets/sun-saphia-tvc-1600.mp4';video.load();}
 function label(){play.textContent=video.paused?'Phát video nền':'Tạm dừng video nền';}
 function start(){source();return video.play().catch(()=>label());}
 play.addEventListener('click',()=>{if(video.paused){userPaused=false;start();}else{userPaused=true;video.pause();}});
 for(const event of ['play','pause'])video.addEventListener(event,label);
 video.addEventListener('loadeddata',()=>hero.classList.add('tvc-ready'));
 video.addEventListener('error',()=>{hero.classList.remove('tvc-ready');label();loaded=false;});
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible){wasPlaying=!video.paused;video.pause();}else if(wasPlaying&&!userPaused&&!document.hidden)start();},{threshold:.1});observer.observe(hero);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){wasPlaying=!video.paused;video.pause();}else if(visible&&wasPlaying&&!userPaused)start();});
 reduced.addEventListener('change',()=>{if(reduced.matches){userPaused=true;video.pause();}});
 if(!reduced.matches&&!connection?.saveData&&!['slow-2g','2g'].includes(connection?.effectiveType))start();
 label();
})();
