import{ar as S,ao as _,b1 as I,aq as z,d as w,X as v,bs as R,T as D,a7 as O,az as B,bt as V,a as b,a4 as P,aB as j,aC as W,aD as E,r as C,ba as H,aV as L,U as M,J as q,P as A,b as k,o as x,e as s,f as m,w as f,g as K,h,bu as U,_ as X,B as G,C as J,G as g,t as r,bv as Y,aj as F}from"./index-dK8qgdO8.js";import{b as Q}from"./site-BOhz4PVl.js";const Z=S([S("@keyframes spin-rotate",`
 from {
 transform: rotate(0);
 }
 to {
 transform: rotate(360deg);
 }
 `),_("spin-container",`
 position: relative;
 `,[_("spin-body",`
 position: absolute;
 top: 50%;
 left: 50%;
 transform: translateX(-50%) translateY(-50%);
 `,[I()])]),_("spin-body",`
 display: inline-flex;
 align-items: center;
 justify-content: center;
 flex-direction: column;
 `),_("spin",`
 display: inline-flex;
 height: var(--n-size);
 width: var(--n-size);
 font-size: var(--n-size);
 color: var(--n-color);
 `,[z("rotate",`
 animation: spin-rotate 2s linear infinite;
 `)]),_("spin-description",`
 display: inline-block;
 font-size: var(--n-font-size);
 color: var(--n-text-color);
 transition: color .3s var(--n-bezier);
 margin-top: 8px;
 `),_("spin-content",`
 opacity: 1;
 transition: opacity .3s var(--n-bezier);
 pointer-events: all;
 `,[z("spinning",`
 user-select: none;
 -webkit-user-select: none;
 pointer-events: none;
 opacity: var(--n-opacity-spinning);
 `)])]),ss={small:20,medium:18,large:16},ts=Object.assign(Object.assign({},B.props),{contentClass:String,contentStyle:[Object,String],description:String,stroke:String,size:{type:[String,Number],default:"medium"},show:{type:Boolean,default:!0},strokeWidth:Number,rotate:{type:Boolean,default:!0},spinning:{type:Boolean,validator:()=>!0,default:void 0},delay:Number}),es=w({name:"Spin",props:ts,slots:Object,setup(i){const{mergedClsPrefixRef:d,inlineThemeDisabled:n}=O(i),a=B("Spin","-spin",Z,V,i,d),u=b(()=>{const{size:o}=i,{common:{cubicBezierEaseInOut:l},self:t}=a.value,{opacitySpinning:y,color:N,textColor:T}=t,$=typeof o=="number"?P(o):t[j("size",o)];return{"--n-bezier":l,"--n-opacity-spinning":y,"--n-size":$,"--n-color":N,"--n-text-color":T}}),e=n?W("spin",b(()=>{const{size:o}=i;return typeof o=="number"?String(o):o[0]}),u,i):void 0,c=E(i,["spinning","show"]),p=C(!1);return H(o=>{let l;if(c.value){const{delay:t}=i;if(t){l=window.setTimeout(()=>{p.value=!0},t),o(()=>{clearTimeout(l)});return}}p.value=c.value}),{mergedClsPrefix:d,active:p,mergedStrokeWidth:b(()=>{const{strokeWidth:o}=i;if(o!==void 0)return o;const{size:l}=i;return ss[typeof l=="number"?"medium":l]}),cssVars:n?void 0:u,themeClass:e?.themeClass,onRender:e?.onRender}},render(){var i,d;const{$slots:n,mergedClsPrefix:a,description:u}=this,e=n.icon&&this.rotate,c=(u||n.description)&&v("div",{class:`${a}-spin-description`},u||((i=n.description)===null||i===void 0?void 0:i.call(n))),p=n.icon?v("div",{class:[`${a}-spin-body`,this.themeClass]},v("div",{class:[`${a}-spin`,e&&`${a}-spin--rotate`],style:n.default?"":this.cssVars},n.icon()),c):v("div",{class:[`${a}-spin-body`,this.themeClass]},v(R,{clsPrefix:a,style:n.default?"":this.cssVars,stroke:this.stroke,"stroke-width":this.mergedStrokeWidth,class:`${a}-spin`}),c);return(d=this.onRender)===null||d===void 0||d.call(this),n.default?v("div",{class:[`${a}-spin-container`,this.themeClass],style:this.cssVars},v("div",{class:[`${a}-spin-content`,this.active&&`${a}-spin-content--spinning`,this.contentClass],style:this.contentStyle},n),v(D,{name:"fade-in-transition"},{default:()=>this.active?p:null})):p}}),as={class:"site-detail-container"},ns={class:"header-section"},is={key:0,class:"content"},os={class:"info-grid"},ls={class:"info-item"},rs={class:"value"},cs={class:"info-item"},ds={class:"value"},us={class:"info-item"},ps={class:"stats-grid"},vs={class:"stat-item"},ms={class:"stat-value"},fs={class:"stat-item"},_s={class:"stat-value"},hs={class:"stat-item"},bs={class:"stat-value"},ys={class:"stat-item"},gs={class:"stat-value"},Cs={class:"stat-item"},Ss={class:"stat-value"},zs={class:"stat-item"},ks={class:"stat-value"},xs={class:"contact-grid"},ws={class:"contact-item"},Bs={class:"value"},Ns={class:"contact-item"},Ts={class:"value"},$s={class:"contact-item"},Is={class:"value"},Rs=w({name:"sitedetail",__name:"index",setup(i){const d=L(),n=M(),a=q(),u=b(()=>Number(d.params.id)),e=C(null),c=C(!1),p=()=>{n.back()},o=async()=>{if(!u.value){a.error("场地ID无效");return}c.value=!0;try{const{data:l,error:t}=await Q(u.value);t==null?e.value=l:a.error(`加载失败: ${t}`)}catch(l){a.error(`加载失败: ${l}`)}finally{c.value=!1}};return A(()=>{o()}),(l,t)=>{const y=X;return x(),k("div",as,[s("div",ns,[m(h(G),{quaternary:"",onClick:p,class:"back-button"},{icon:f(()=>[m(h(U),null,{default:f(()=>[m(y,{icon:"material-symbols:arrow-back"})]),_:1})]),default:f(()=>[t[0]||(t[0]=K(" 返回 "))]),_:1,__:[0]})]),m(h(es),{show:c.value,class:"loading-container"},{default:f(()=>[e.value?(x(),k("div",is,[m(h(g),{title:"基础信息",class:"info-card"},{default:f(()=>[s("div",os,[s("div",ls,[t[1]||(t[1]=s("span",{class:"label"},"场地名称:",-1)),s("span",rs,r(e.value.Name||""),1)]),s("div",cs,[t[2]||(t[2]=s("span",{class:"label"},"场地地址:",-1)),s("span",ds,r(e.value.Address||""),1)]),s("div",us,[t[3]||(t[3]=s("span",{class:"label"},"是否存在驻场:",-1)),s("span",{class:Y(["value",e.value.IsOnsiteDefault===1?"status-yes":"status-no"])},r(e.value.IsOnsiteDefault===1?"是":"否"),3)])])]),_:1}),m(h(g),{title:"资产统计",class:"stats-card"},{default:f(()=>[s("div",ps,[s("div",vs,[t[4]||(t[4]=s("span",{class:"stat-label"},"总资产数:",-1)),s("span",ms,r(e.value.AssetCount||0)+" 台",1)]),s("div",fs,[t[5]||(t[5]=s("span",{class:"stat-label"},"下架检查:",-1)),s("span",_s,r(e.value.OffShelfCount||0)+" 台",1)]),s("div",hs,[t[6]||(t[6]=s("span",{class:"stat-label"},"物流中:",-1)),s("span",bs,r(e.value.InLogisticsCount||0)+" 台",1)]),s("div",ys,[t[7]||(t[7]=s("span",{class:"stat-label"},"维修中:",-1)),s("span",gs,r(e.value.UnderRepairCount||0)+" 台",1)]),s("div",Cs,[t[8]||(t[8]=s("span",{class:"stat-label"},"待上线:",-1)),s("span",Ss,r(e.value.ToBePutOnShelfCount||0)+" 台",1)]),s("div",zs,[t[9]||(t[9]=s("span",{class:"stat-label"},"历史总维修数:",-1)),s("span",ks,r(e.value.TotalHistoricalRepairs||0)+" 次",1)])])]),_:1}),m(h(g),{title:"联系信息",class:"contact-card"},{default:f(()=>[s("div",xs,[s("div",ws,[t[10]||(t[10]=s("span",{class:"label"},"负责人:",-1)),s("span",Bs,r(e.value.contact_person||""),1)]),s("div",Ns,[t[11]||(t[11]=s("span",{class:"label"},"联系电话:",-1)),s("span",Ts,r(e.value.contact_phone||""),1)]),s("div",$s,[t[12]||(t[12]=s("span",{class:"label"},"邮箱:",-1)),s("span",Is,r(e.value.contact_email||""),1)])])]),_:1})])):J("",!0)]),_:1},8,["show"])])}}}),Vs=F(Rs,[["__scopeId","data-v-8171e634"]]);export{Vs as default};
