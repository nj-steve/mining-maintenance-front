import{R as S,M as _,bp as T,P as k,d as w,S as v,bK as I,T as V,Z as D,a0 as B,bL as O,a as h,aH as P,a3 as j,a4 as M,b3 as W,r as C,by as E,bg as H,aB as K,an as L,au as q,b as x,o as z,e as s,f as m,w as f,g as G,h as b,ar as X,_ as Y,B as Z,C as A,G as y,t as r,bM as F,as as J}from"./index-C_wnvcFl.js";import{b as Q}from"./site-CxIySsqa.js";const U=S([S("@keyframes spin-rotate",`
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
 `,[T()])]),_("spin-body",`
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
 `,[k("rotate",`
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
 `,[k("spinning",`
 user-select: none;
 -webkit-user-select: none;
 pointer-events: none;
 opacity: var(--n-opacity-spinning);
 `)])]),ss={small:20,medium:18,large:16},ts=Object.assign(Object.assign({},B.props),{contentClass:String,contentStyle:[Object,String],description:String,stroke:String,size:{type:[String,Number],default:"medium"},show:{type:Boolean,default:!0},strokeWidth:Number,rotate:{type:Boolean,default:!0},spinning:{type:Boolean,validator:()=>!0,default:void 0},delay:Number}),es=w({name:"Spin",props:ts,slots:Object,setup(i){const{mergedClsPrefixRef:d,inlineThemeDisabled:n}=D(i),a=B("Spin","-spin",U,O,i,d),u=h(()=>{const{size:o}=i,{common:{cubicBezierEaseInOut:l},self:t}=a.value,{opacitySpinning:g,color:N,textColor:$}=t,R=typeof o=="number"?P(o):t[j("size",o)];return{"--n-bezier":l,"--n-opacity-spinning":g,"--n-size":R,"--n-color":N,"--n-text-color":$}}),e=n?M("spin",h(()=>{const{size:o}=i;return typeof o=="number"?String(o):o[0]}),u,i):void 0,c=W(i,["spinning","show"]),p=C(!1);return E(o=>{let l;if(c.value){const{delay:t}=i;if(t){l=window.setTimeout(()=>{p.value=!0},t),o(()=>{clearTimeout(l)});return}}p.value=c.value}),{mergedClsPrefix:d,active:p,mergedStrokeWidth:h(()=>{const{strokeWidth:o}=i;if(o!==void 0)return o;const{size:l}=i;return ss[typeof l=="number"?"medium":l]}),cssVars:n?void 0:u,themeClass:e?.themeClass,onRender:e?.onRender}},render(){var i,d;const{$slots:n,mergedClsPrefix:a,description:u}=this,e=n.icon&&this.rotate,c=(u||n.description)&&v("div",{class:`${a}-spin-description`},u||((i=n.description)===null||i===void 0?void 0:i.call(n))),p=n.icon?v("div",{class:[`${a}-spin-body`,this.themeClass]},v("div",{class:[`${a}-spin`,e&&`${a}-spin--rotate`],style:n.default?"":this.cssVars},n.icon()),c):v("div",{class:[`${a}-spin-body`,this.themeClass]},v(I,{clsPrefix:a,style:n.default?"":this.cssVars,stroke:this.stroke,"stroke-width":this.mergedStrokeWidth,class:`${a}-spin`}),c);return(d=this.onRender)===null||d===void 0||d.call(this),n.default?v("div",{class:[`${a}-spin-container`,this.themeClass],style:this.cssVars},v("div",{class:[`${a}-spin-content`,this.active&&`${a}-spin-content--spinning`,this.contentClass],style:this.contentStyle},n),v(V,{name:"fade-in-transition"},{default:()=>this.active?p:null})):p}}),as={class:"site-detail-container"},ns={class:"header-section"},is={key:0,class:"content"},os={class:"info-grid"},ls={class:"info-item"},rs={class:"value"},cs={class:"info-item"},ds={class:"value"},us={class:"info-item"},ps={class:"stats-grid"},vs={class:"stat-item"},ms={class:"stat-value"},fs={class:"stat-item"},_s={class:"stat-value"},bs={class:"stat-item"},hs={class:"stat-value"},gs={class:"stat-item"},ys={class:"stat-value"},Cs={class:"stat-item"},Ss={class:"stat-value"},ks={class:"stat-item"},xs={class:"stat-value"},zs={class:"contact-grid"},ws={class:"contact-item"},Bs={class:"value"},Ns={class:"contact-item"},$s={class:"value"},Rs={class:"contact-item"},Ts={class:"value"},Is=w({name:"sitedetail",__name:"index",setup(i){const d=H(),n=K(),a=L(),u=h(()=>Number(d.params.id)),e=C(null),c=C(!1),p=()=>{n.back()},o=async()=>{if(!u.value){a.error("场地ID无效");return}c.value=!0;try{const{data:l,error:t}=await Q(u.value);t==null?e.value=l:a.error(`加载失败: ${t}`)}catch(l){a.error(`加载失败: ${l}`)}finally{c.value=!1}};return q(()=>{o()}),(l,t)=>{const g=Y;return z(),x("div",as,[s("div",ns,[m(b(Z),{quaternary:"",onClick:p,class:"back-button"},{icon:f(()=>[m(b(X),null,{default:f(()=>[m(g,{icon:"material-symbols:arrow-back"})]),_:1})]),default:f(()=>[t[0]||(t[0]=G(" 返回 "))]),_:1,__:[0]})]),m(b(es),{show:c.value,class:"loading-container"},{default:f(()=>[e.value?(z(),x("div",is,[m(b(y),{title:"基础信息",class:"info-card"},{default:f(()=>[s("div",os,[s("div",ls,[t[1]||(t[1]=s("span",{class:"label"},"场地名称:",-1)),s("span",rs,r(e.value.name||""),1)]),s("div",cs,[t[2]||(t[2]=s("span",{class:"label"},"场地地址:",-1)),s("span",ds,r(e.value.address||""),1)]),s("div",us,[t[3]||(t[3]=s("span",{class:"label"},"场地状态:",-1)),s("span",{class:F(["value",e.value.site_status===1?"status-yes":"status-no"])},r(e.value.site_status===1?"驻场":e.value.site_status===2?"寄修":"驻场+寄修"),3)])])]),_:1}),m(b(y),{title:"资产统计",class:"stats-card"},{default:f(()=>[s("div",ps,[s("div",vs,[t[4]||(t[4]=s("span",{class:"stat-label"},"总资产数:",-1)),s("span",ms,r(e.value.asset_count||0)+" 台",1)]),s("div",fs,[t[5]||(t[5]=s("span",{class:"stat-label"},"下架检查:",-1)),s("span",_s,r(e.value.off_shelf_count||0)+" 台",1)]),s("div",bs,[t[6]||(t[6]=s("span",{class:"stat-label"},"物流中:",-1)),s("span",hs,r(e.value.in_logistics_count||0)+" 台",1)]),s("div",gs,[t[7]||(t[7]=s("span",{class:"stat-label"},"维修中:",-1)),s("span",ys,r(e.value.under_repair_count||0)+" 台",1)]),s("div",Cs,[t[8]||(t[8]=s("span",{class:"stat-label"},"待上线:",-1)),s("span",Ss,r(e.value.to_be_put_on_shelf_count||0)+" 台",1)]),s("div",ks,[t[9]||(t[9]=s("span",{class:"stat-label"},"历史总维修数:",-1)),s("span",xs,r(e.value.repairing_rate||0)+" %",1)])])]),_:1}),m(b(y),{title:"售后专员",class:"contact-card"},{default:f(()=>[s("div",zs,[s("div",ws,[t[10]||(t[10]=s("span",{class:"label"},"负责人:",-1)),s("span",Bs,r(e.value.saler_name||""),1)]),s("div",Ns,[t[11]||(t[11]=s("span",{class:"label"},"联系电话:",-1)),s("span",$s,r(e.value.phone||""),1)]),s("div",Rs,[t[12]||(t[12]=s("span",{class:"label"},"邮箱:",-1)),s("span",Ts,r(e.value.email||""),1)])])]),_:1})])):A("",!0)]),_:1},8,["show"])])}}}),Os=J(Is,[["__scopeId","data-v-fdab48db"]]);export{Os as default};
