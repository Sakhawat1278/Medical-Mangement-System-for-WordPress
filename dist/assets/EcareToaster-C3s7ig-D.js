import{i as e,l as t,t as n}from"./src-BLu9bDhO.js";import{n as r,t as i}from"./x-CWe_HstW.js";var a=t(e(),1),o={data:``},s=e=>{if(typeof window==`object`){let t=(e?e.querySelector(`#_goober`):window._goober)||Object.assign(document.createElement(`style`),{innerHTML:` `,id:`_goober`});return t.nonce=window.__nonce__,t.parentNode||(e||document.head).appendChild(t),t.firstChild}return e||o},c=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,l=/\/\*[^]*?\*\/|  +/g,u=/\n+/g,d=(e,t)=>{let n=``,r=``,i=``;for(let a in e){let o=e[a];a[0]==`@`?a[1]==`i`?n=a+` `+o+`;`:r+=a[1]==`f`?d(o,a):a+`{`+d(o,a[1]==`k`?``:t)+`}`:typeof o==`object`?r+=d(o,t?t.replace(/([^,])+/g,e=>a.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,t=>/&/.test(t)?t.replace(/&/g,e):e?e+` `+t:t)):a):o!=null&&(a=a[1]==`-`?a:a.replace(/[A-Z]/g,`-$&`).toLowerCase(),i+=d.p?d.p(a,o):a+`:`+o+`;`)}return n+(t&&i?t+`{`+i+`}`:i)+r},f={},p=e=>{if(typeof e==`object`){let t=``;for(let n in e)t+=n+p(e[n]);return t}return e},ee=(e,t,n,r,i)=>{let a=p(e),o=f[a]||(f[a]=(e=>{let t=0,n=11;for(;t<e.length;)n=101*n+e.charCodeAt(t++)>>>0;return`go`+n})(a));if(!f[o]){let t=a===e?(e=>{let t,n,r=[{}];for(;t=c.exec(e.replace(l,``));)t[4]?r.shift():t[3]?(n=t[3].replace(u,` `).trim(),r.unshift(r[0][n]=r[0][n]||{})):r[0][t[1]]=t[2].replace(u,` `).trim();return r[0]})(e):e;f[o]=d(i?{[`@keyframes `+o]:t}:t,n?``:`.`+o)}let s=n&&f.g;return n&&(f.g=f[o]),((e,t,n,r)=>{r?t.data=t.data.replace(r,e):t.data.indexOf(e)===-1&&(t.data=n?e+t.data:t.data+e)})(f[o],t,r,s),o},m=(e,t,n)=>e.reduce((e,r,i)=>{let a=t[i];if(a&&a.call){let e=a(n),t=e&&e.props&&e.props.className||/^go/.test(e)&&e;a=t?`.`+t:e&&typeof e==`object`?e.props?``:d(e,``):!1===e?``:e}return e+r+(a??``)},``);function h(e){let t=this||{},n=e.call?e(t.p):e;return ee(n.unshift?n.raw?m(n,[].slice.call(arguments,1),t.p):n.reduce((e,n)=>Object.assign(e,n&&n.call?n(t.p):n),{}):n,s(t.target),t.g,t.o,t.k)}var g,_,v;h.bind({g:1});var y=h.bind({k:1});function b(e,t,n,r){d.p=t,g=e,_=n,v=r}function x(e,t){let n=this||{};return function(){let r=arguments;function i(a,o){let s=Object.assign({},a),c=s.className||i.className;n.p=Object.assign({theme:_&&_()},s),n.o=/go\d/.test(c),s.className=h.apply(n,r)+(c?` `+c:``),t&&(s.ref=o);let l=e;return e[0]&&(l=s.as||e,delete s.as),v&&l[0]&&v(s),g(l,s)}return t?t(i):i}}var te=e=>typeof e==`function`,S=(e,t)=>te(e)?e(t):e,C=(()=>{let e=0;return()=>(++e).toString()})(),w=(()=>{let e;return()=>{if(e===void 0&&typeof window<`u`){let t=matchMedia(`(prefers-reduced-motion: reduce)`);e=!t||t.matches}return e}})(),ne=20,T=`default`,E=(e,t)=>{let{toastLimit:n}=e.settings;switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,n)};case 1:return{...e,toasts:e.toasts.map(e=>e.id===t.toast.id?{...e,...t.toast}:e)};case 2:let{toast:r}=t;return E(e,{type:+!!e.toasts.find(e=>e.id===r.id),toast:r});case 3:let{toastId:i}=t;return{...e,toasts:e.toasts.map(e=>e.id===i||i===void 0?{...e,dismissed:!0,visible:!1}:e)};case 4:return t.toastId===void 0?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(e=>e.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let a=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(e=>({...e,pauseDuration:e.pauseDuration+a}))}}},D=[],O={toasts:[],pausedAt:void 0,settings:{toastLimit:ne}},k={},A=(e,t=T)=>{k[t]=E(k[t]||O,e),D.forEach(([e,n])=>{e===t&&n(k[t])})},j=e=>Object.keys(k).forEach(t=>A(e,t)),re=e=>Object.keys(k).find(t=>k[t].toasts.some(t=>t.id===e)),M=(e=T)=>t=>{A(t,e)},N={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},P=(e={},t=T)=>{let[n,r]=(0,a.useState)(k[t]||O),i=(0,a.useRef)(k[t]);(0,a.useEffect)(()=>(i.current!==k[t]&&r(k[t]),D.push([t,r]),()=>{let e=D.findIndex(([e])=>e===t);e>-1&&D.splice(e,1)}),[t]);let o=n.toasts.map(t=>({...e,...e[t.type],...t,removeDelay:t.removeDelay||e[t.type]?.removeDelay||e?.removeDelay,duration:t.duration||e[t.type]?.duration||e?.duration||N[t.type],style:{...e.style,...e[t.type]?.style,...t.style}}));return{...n,toasts:o}},F=(e,t=`blank`,n)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:`status`,"aria-live":`polite`},message:e,pauseDuration:0,...n,id:n?.id||C()}),I=e=>(t,n)=>{let r=F(t,e,n);return M(r.toasterId||re(r.id))({type:2,toast:r}),r.id},L=(e,t)=>I(`blank`)(e,t);L.error=I(`error`),L.success=I(`success`),L.loading=I(`loading`),L.custom=I(`custom`),L.dismiss=(e,t)=>{let n={type:3,toastId:e};t?M(t)(n):j(n)},L.dismissAll=e=>L.dismiss(void 0,e),L.remove=(e,t)=>{let n={type:4,toastId:e};t?M(t)(n):j(n)},L.removeAll=e=>L.remove(void 0,e),L.promise=(e,t,n)=>{let r=L.loading(t.loading,{...n,...n?.loading});return typeof e==`function`&&(e=e()),e.then(e=>{let i=t.success?S(t.success,e):void 0;return i?L.success(i,{id:r,...n,...n?.success}):L.dismiss(r),e}).catch(e=>{let i=t.error?S(t.error,e):void 0;i?L.error(i,{id:r,...n,...n?.error}):L.dismiss(r)}),e};var R=1e3,z=(e,t=`default`)=>{let{toasts:n,pausedAt:r}=P(e,t),i=(0,a.useRef)(new Map).current,o=(0,a.useCallback)((e,t=R)=>{if(i.has(e))return;let n=setTimeout(()=>{i.delete(e),s({type:4,toastId:e})},t);i.set(e,n)},[]);(0,a.useEffect)(()=>{if(r)return;let e=Date.now(),i=n.map(n=>{if(n.duration===1/0)return;let r=(n.duration||0)+n.pauseDuration-(e-n.createdAt);if(r<0){n.visible&&L.dismiss(n.id);return}return setTimeout(()=>L.dismiss(n.id,t),r)});return()=>{i.forEach(e=>e&&clearTimeout(e))}},[n,r,t]);let s=(0,a.useCallback)(M(t),[t]),c=(0,a.useCallback)(()=>{s({type:5,time:Date.now()})},[s]),l=(0,a.useCallback)((e,t)=>{s({type:1,toast:{id:e,height:t}})},[s]),u=(0,a.useCallback)(()=>{r&&s({type:6,time:Date.now()})},[r,s]),d=(0,a.useCallback)((e,t)=>{let{reverseOrder:r=!1,gutter:i=8,defaultPosition:a}=t||{},o=n.filter(t=>(t.position||a)===(e.position||a)&&t.height),s=o.findIndex(t=>t.id===e.id),c=o.filter((e,t)=>t<s&&e.visible).length;return o.filter(e=>e.visible).slice(...r?[c+1]:[0,c]).reduce((e,t)=>e+(t.height||0)+i,0)},[n]);return(0,a.useEffect)(()=>{n.forEach(e=>{if(e.dismissed)o(e.id,e.removeDelay);else{let t=i.get(e.id);t&&(clearTimeout(t),i.delete(e.id))}})},[n,o]),{toasts:n,handlers:{updateHeight:l,startPause:c,endPause:u,calculateOffset:d}}},B=y`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,V=y`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,H=y`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,U=x(`div`)`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||`#ff4b4b`};
  position: relative;
  transform: rotate(45deg);

  animation: ${B} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${V} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||`#fff`};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${H} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,W=y`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,G=x(`div`)`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||`#e0e0e0`};
  border-right-color: ${e=>e.primary||`#616161`};
  animation: ${W} 1s linear infinite;
`,K=y`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,q=y`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,J=x(`div`)`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||`#61d345`};
  position: relative;
  transform: rotate(45deg);

  animation: ${K} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${q} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||`#fff`};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,Y=x(`div`)`
  position: absolute;
`,X=x(`div`)`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,ie=y`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,ae=x(`div`)`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${ie} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,oe=({toast:e})=>{let{icon:t,type:n,iconTheme:r}=e;return t===void 0?n===`blank`?null:a.createElement(X,null,a.createElement(G,{...r}),n!==`loading`&&a.createElement(Y,null,n===`error`?a.createElement(U,{...r}):a.createElement(J,{...r}))):typeof t==`string`?a.createElement(ae,null,t):t},se=e=>`
0% {transform: translate3d(0,${e*-200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,ce=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e*-150}%,-1px) scale(.6); opacity:0;}
`,le=`0%{opacity:0;} 100%{opacity:1;}`,ue=`0%{opacity:1;} 100%{opacity:0;}`,de=x(`div`)`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,fe=x(`div`)`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,pe=(e,t)=>{let n=e.includes(`top`)?1:-1,[r,i]=w()?[le,ue]:[se(n),ce(n)];return{animation:t?`${y(r)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${y(i)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}},me=a.memo(({toast:e,position:t,style:n,children:r})=>{let i=e.height?pe(e.position||t||`top-center`,e.visible):{opacity:0},o=a.createElement(oe,{toast:e}),s=a.createElement(fe,{...e.ariaProps},S(e.message,e));return a.createElement(de,{className:e.className,style:{...i,...n,...e.style}},typeof r==`function`?r({icon:o,message:s}):a.createElement(a.Fragment,null,o,s))});b(a.createElement);var he=({id:e,className:t,style:n,onHeightUpdate:r,children:i})=>{let o=a.useCallback(t=>{if(t){let n=()=>{let n=t.getBoundingClientRect().height;r(e,n)};n(),new MutationObserver(n).observe(t,{subtree:!0,childList:!0,characterData:!0})}},[e,r]);return a.createElement(`div`,{ref:o,className:t,style:n},i)},ge=(e,t)=>{let n=e.includes(`top`),r=n?{top:0}:{bottom:0},i=e.includes(`center`)?{justifyContent:`center`}:e.includes(`right`)?{justifyContent:`flex-end`}:{};return{left:0,right:0,display:`flex`,position:`absolute`,transition:w()?void 0:`all 230ms cubic-bezier(.21,1.02,.73,1)`,transform:`translateY(${t*(n?1:-1)}px)`,...r,...i}},_e=h`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,Z=16,ve=({reverseOrder:e,position:t=`top-center`,toastOptions:n,gutter:r,children:i,toasterId:o,containerStyle:s,containerClassName:c})=>{let{toasts:l,handlers:u}=z(n,o);return a.createElement(`div`,{"data-rht-toaster":o||``,style:{position:`fixed`,zIndex:9999,top:Z,left:Z,right:Z,bottom:Z,pointerEvents:`none`,...s},className:c,onMouseEnter:u.startPause,onMouseLeave:u.endPause},l.map(n=>{let o=n.position||t,s=ge(o,u.calculateOffset(n,{reverseOrder:e,gutter:r,defaultPosition:t}));return a.createElement(he,{id:n.id,key:n.id,onHeightUpdate:u.updateHeight,className:n.visible?_e:``,style:s},n.type===`custom`?S(n.message,n):i?i(n):a.createElement(me,{toast:n,position:o}))}))},ye=L,be=r(`circle-alert`,[[`circle`,{cx:`12`,cy:`12`,r:`10`,key:`1mglay`}],[`line`,{x1:`12`,x2:`12`,y1:`8`,y2:`12`,key:`1pkeuh`}],[`line`,{x1:`12`,x2:`12.01`,y1:`16`,y2:`16`,key:`4dfq90`}]]),xe=r(`circle-check`,[[`circle`,{cx:`12`,cy:`12`,r:`10`,key:`1mglay`}],[`path`,{d:`m9 12 2 2 4-4`,key:`dzmm74`}]]),Se=r(`info`,[[`circle`,{cx:`12`,cy:`12`,r:`10`,key:`1mglay`}],[`path`,{d:`M12 16v-4`,key:`1dtifu`}],[`path`,{d:`M12 8h.01`,key:`e9boi3`}]]),Q=r(`loader-circle`,[[`path`,{d:`M21 12a9 9 0 1 1-6.219-8.56`,key:`13zald`}]]),$=n(),Ce=({position:e=`top-right`,...t})=>(0,$.jsx)(ve,{position:e,containerStyle:{zIndex:99999999,top:24,right:24,bottom:24,left:24,pointerEvents:`none`},toastOptions:{duration:4e3},...t,children:e=>{let t=e.type===`success`,n=e.type===`error`,r=e.type===`loading`,a=`#3b82f6`,o=`#eff6ff`,s=`#2563eb`,c=`linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)`,l=Se;return t?(a=`var(--ecare-primary, #10b981)`,o=`#ecfdf5`,s=`#059669`,c=`linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)`,l=xe):n?(a=`#ef4444`,o=`#fee2e2`,s=`#dc2626`,c=`linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)`,l=be):r&&(a=`var(--ecare-primary, #1b3b2b)`,o=`rgba(27, 59, 43, 0.1)`,s=`var(--ecare-primary, #1b3b2b)`,c=`#ffffff`,l=Q),(0,$.jsxs)(`div`,{className:`ecare-toast-card ecare-toast-${e.type} ${e.visible?`ecare-toast-enter`:`ecare-toast-leave`}`,style:{pointerEvents:`auto`,display:`flex`,alignItems:`center`,gap:`12px`,background:c,color:`#0f172a`,padding:`12px 16px`,borderRadius:`14px`,border:`1px solid rgba(226, 232, 240, 0.95)`,borderLeft:`5px solid ${a}`,boxShadow:`0 12px 30px -4px rgba(0, 0, 0, 0.14), 0 6px 14px -3px rgba(0, 0, 0, 0.08)`,minWidth:`280px`,maxWidth:`440px`,fontSize:`0.85rem`,fontWeight:600,lineHeight:1.45,fontFamily:`inherit`,transition:`all 0.25s cubic-bezier(0.16, 1, 0.3, 1)`,opacity:+!!e.visible,transform:e.visible?`translateY(0) scale(1)`:`translateY(-10px) scale(0.95)`,...e.style},children:[(0,$.jsx)(`div`,{className:`ecare-toast-badge`,style:{width:`32px`,height:`32px`,borderRadius:`10px`,background:o,color:s,display:`flex`,alignItems:`center`,justifyContent:`center`,flexShrink:0},children:e.icon?typeof e.icon==`string`?(0,$.jsx)(`span`,{style:{fontSize:`16px`,lineHeight:1},children:e.icon}):e.icon:(0,$.jsx)(l,{size:18,strokeWidth:2.4,style:r?{animation:`ecare-spin 1s linear infinite`}:{}})}),(0,$.jsx)(`div`,{className:`ecare-toast-message`,style:{flex:1,wordBreak:`break-word`,color:`#1e293b`,fontWeight:600},children:S(e.message,e)}),e.type!==`loading`&&(0,$.jsx)(`button`,{type:`button`,onClick:()=>L.dismiss(e.id),"aria-label":`Dismiss notification`,className:`ecare-toast-close`,style:{background:`transparent`,border:`none`,color:`#94a3b8`,cursor:`pointer`,padding:`4px`,borderRadius:`6px`,display:`flex`,alignItems:`center`,justifyContent:`center`,flexShrink:0,transition:`background 0.15s, color 0.15s`},onMouseEnter:e=>{e.currentTarget.style.color=`#334155`,e.currentTarget.style.background=`rgba(0, 0, 0, 0.06)`},onMouseLeave:e=>{e.currentTarget.style.color=`#94a3b8`,e.currentTarget.style.background=`transparent`},children:(0,$.jsx)(i,{size:14,strokeWidth:2.5})})]})}});export{Q as n,ye as r,Ce as t};