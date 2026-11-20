(()=>{
 'use strict';
 const section=document.getElementById('residence'),video=document.getElementById('intro-waves'),toggle=document.getElementById('intro-waves-toggle');
 if(!section||!video||!toggle)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),connection=navigator.connection;
 const saveData=connection?.saveData||['slow-2g','2g'].includes(connection?.effectiveType);
 let visible=false,userPaused=false,loaded=false,manuallyStarted=false;
 video.muted=true;video.defaultMuted=true;
 const label=()=>{toggle.textContent=video.paused?'Phát video sóng nền':'Tạm dừng video sóng nền';};
 function load(){if(loaded)return;loaded=true;video.src=matchMedia('(max-width:800px)').matches?'assets/sun-saphia-waves-rotated-768.mp4':'assets/sun-saphia-waves-rotated-1280.mp4';video.load();}
 function sync(){if(!visible||document.hidden||userPaused||((reduced.matches||saveData)&&!manuallyStarted)){video.pause();return;}load();video.play().catch(label);}
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:0});observer.observe(section);
 toggle.addEventListener('click',()=>{userPaused=!video.paused;if(!userPaused)manuallyStarted=true;sync();});
 document.addEventListener('visibilitychange',sync);
 reduced.addEventListener('change',()=>{manuallyStarted=false;sync();});
 video.addEventListener('loadeddata',()=>section.classList.add('waves-ready'));
 video.addEventListener('error',()=>{section.classList.remove('waves-ready');label();});
 for(const name of ['play','pause'])video.addEventListener(name,label);
 label();
})();
