(function(){'use strict';
const root=document.querySelector('[data-discovery]');
if(root){
 const duration=root.querySelector('[data-duration]'),buttons=[...root.querySelectorAll('[data-filter]')],cards=[...root.querySelectorAll('[data-assessment]')],count=root.querySelector('[data-count]'),empty=root.querySelector('[data-empty]');
 let category='all';
 function restore(){const q=new URLSearchParams(location.search);category=buttons.some(b=>b.dataset.filter===q.get('category'))?q.get('category'):'all';duration.value=['3','5','15'].includes(q.get('minutes'))?q.get('minutes'):'';filter(false);}
 function filter(write=true){let total=0;cards.forEach(card=>{const visible=(category==='all'||card.dataset.category===category)&&(!duration.value||Number(card.dataset.minutes)<=Number(duration.value));card.hidden=!visible;if(visible)total++;});buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===category)));count.textContent=total+' of '+cards.length+' assessments and tools';empty.hidden=total!==0;if(write){const url=new URL(location.href);['q','category','minutes'].forEach(k=>url.searchParams.delete(k));if(category!=='all')url.searchParams.set('category',category);if(duration.value)url.searchParams.set('minutes',duration.value);history.replaceState(null,'',url);}}
 duration.addEventListener('change',()=>filter());buttons.forEach(b=>b.addEventListener('click',()=>{category=b.dataset.filter;filter();}));root.querySelector('[data-reset]').addEventListener('click',()=>{duration.value='';category='all';filter();buttons[0].focus();});window.addEventListener('popstate',restore);restore();
}
// Announce questionnaire progress and move focus when an assessment changes screens.
document.querySelectorAll('.ca-progress').forEach(el=>{el.setAttribute('role','status');el.setAttribute('aria-live','polite');});
const screens=[...document.querySelectorAll('[data-screen],[data-ws-screen],[data-ca-screen],[data-wv-screen],[data-sh-screen],[data-ir-screen],[data-ha-screen]')];
if(screens.length){new MutationObserver(records=>{const visible=records.map(r=>r.target).find(el=>screens.includes(el)&&!el.hidden);if(!visible)return;const target=visible.querySelector('h1,h2,legend,button,input');if(target){if(!target.matches('button,input'))target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}}).observe(document.querySelector('main'),{attributes:true,attributeFilter:['hidden'],subtree:true});}
})();