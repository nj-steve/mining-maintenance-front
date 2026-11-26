import{ai as P,bh as R,aB as f,am as N,d as _,S as b,ac as E,by as H,F as O,ae as V,ap as y,a as j,be as A,ab as p}from"./index-D55EPgb4.js";let v=!1;function F(){if(P&&window.CSS&&!v&&(v=!0,"registerProperty"in window?.CSS))try{CSS.registerProperty({name:"--n-color-start",syntax:"<color>",inherits:!1,initialValue:"#0000"}),CSS.registerProperty({name:"--n-color-end",syntax:"<color>",inherits:!1,initialValue:"#0000"})}catch{}}function L(e){const{heightSmall:o,heightMedium:i,heightLarge:t,borderRadius:r}=e;return{color:"#eee",colorEnd:"#ddd",borderRadius:r,heightSmall:o,heightMedium:i,heightLarge:t}}const T={common:R,self:L},$=f([N("skeleton",`
 height: 1em;
 width: 100%;
 transition:
 --n-color-start .3s var(--n-bezier),
 --n-color-end .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 animation: 2s skeleton-loading infinite cubic-bezier(0.36, 0, 0.64, 1);
 background-color: var(--n-color-start);
 `),f("@keyframes skeleton-loading",`
 0% {
 background: var(--n-color-start);
 }
 40% {
 background: var(--n-color-end);
 }
 80% {
 background: var(--n-color-start);
 }
 100% {
 background: var(--n-color-start);
 }
 `)]),I=Object.assign(Object.assign({},y.props),{text:Boolean,round:Boolean,circle:Boolean,height:[String,Number],width:[String,Number],size:String,repeat:{type:Number,default:1},animated:{type:Boolean,default:!0},sharp:{type:Boolean,default:!0}}),M=_({name:"Skeleton",inheritAttrs:!1,props:I,setup(e){F();const{mergedClsPrefixRef:o}=V(e),i=y("Skeleton","-skeleton",$,T,e,o);return{mergedClsPrefix:o,style:j(()=>{var t,r;const a=i.value,{common:{cubicBezierEaseInOut:k}}=a,h=a.self,{color:S,colorEnd:w,borderRadius:x}=h;let s;const{circle:l,sharp:z,round:B,width:n,height:c,size:g,text:m,animated:C}=e;g!==void 0&&(s=h[A("height",g)]);const d=l?(t=n??c)!==null&&t!==void 0?t:s:n,u=(r=l?n??c:c)!==null&&r!==void 0?r:s;return{display:m?"inline-block":"",verticalAlign:m?"-0.125em":"",borderRadius:l?"50%":B?"4096px":z?"":x,width:typeof d=="number"?p(d):d,height:typeof u=="number"?p(u):u,animation:C?"":"none","--n-bezier":k,"--n-color-start":S,"--n-color-end":w}})}},render(){const{repeat:e,style:o,mergedClsPrefix:i,$attrs:t}=this,r=b("div",E({class:`${i}-skeleton`,style:o},t));return e>1?b(O,null,H(e,null).map(a=>[r,`
`])):r}});export{M as N};
