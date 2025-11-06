import{R as S,M as f,b7 as T,P as x,d as w,S as v,bv as I,T as V,Z as D,a0 as N,bw as O,a as b,aN as P,a3 as j,a4 as W,bx as E,r as C,bg as M,b1 as H,aG as G,an as K,au as L,e as k,o as z,f as s,g as m,w as _,h as q,i as h,ar as X,_ as Y,B as Z,C as A,G as y,t as l,by as F,as as J}from"./index-kGMLv_Fh.js";import{c as Q}from"./site-D7u_PJmd.js";const U=S([S("@keyframes spin-rotate",`
 from {
 transform: rotate(0);
 }
 to {
 transform: rotate(360deg);
 }
 `),f("spin-container",`
 position: relative;
 `,[f("spin-body",`
 position: absolute;
 top: 50%;
 left: 50%;
 transform: translateX(-50%) translateY(-50%);
 `,[T()])]),f("spin-body",`
 display: inline-flex;
 align-items: center;
 justify-content: center;
 flex-direction: column;
 `),f("spin",`
 display: inline-flex;
 height: var(--n-size);
 width: var(--n-size);
 font-size: var(--n-size);
 color: var(--n-color);
 `,[x("rotate",`
 animation: spin-rotate 2s linear infinite;
 `)]),f("spin-description",`
 display: inline-block;
 font-size: var(--n-font-size);
 color: var(--n-text-color);
 transition: color .3s var(--n-bezier);
 margin-top: 8px;
 `),f("spin-content",`
 opacity: 1;
 transition: opacity .3s var(--n-bezier);
 pointer-events: all;
 `,[x("spinning",`
 user-select: none;
 -webkit-user-select: none;
 pointer-events: none;
 opacity: var(--n-opacity-spinning);
 `)])]),ss={small:20,medium:18,large:16},ts=Object.assign(Object.assign({},N.props),{contentClass:String,contentStyle:[Object,String],description:String,stroke:String,size:{type:[String,Number],default:"medium"},show:{type:Boolean,default:!0},strokeWidth:Number,rotate:{type:Boolean,default:!0},spinning:{type:Boolean,validator:()=>!0,default:void 0},delay:Number}),es=w({name:"Spin",props:ts,slots:Object,setup(i){const{mergedClsPrefixRef:d,inlineThemeDisabled:n}=D(i),a=N("Spin","-spin",U,O,i,d),u=b(()=>{const{size:o}=i,{common:{cubicBezierEaseInOut:r},self:t}=a.value,{opacitySpinning:g,color:$,textColor:B}=t,R=typeof o=="number"?P(o):t[j("size",o)];return{"--n-bezier":r,"--n-opacity-spinning":g,"--n-size":R,"--n-color":$,"--n-text-color":B}}),e=n?W("spin",b(()=>{const{size:o}=i;return typeof o=="number"?String(o):o[0]}),u,i):void 0,c=E(i,["spinning","show"]),p=C(!1);return M(o=>{let r;if(c.value){const{delay:t}=i;if(t){r=window.setTimeout(()=>{p.value=!0},t),o(()=>{clearTimeout(r)});return}}p.value=c.value}),{mergedClsPrefix:d,active:p,mergedStrokeWidth:b(()=>{const{strokeWidth:o}=i;if(o!==void 0)return o;const{size:r}=i;return ss[typeof r=="number"?"medium":r]}),cssVars:n?void 0:u,themeClass:e?.themeClass,onRender:e?.onRender}},render(){var i,d;const{$slots:n,mergedClsPrefix:a,description:u}=this,e=n.icon&&this.rotate,c=(u||n.description)&&v("div",{class:`${a}-spin-description`},u||((i=n.description)===null||i===void 0?void 0:i.call(n))),p=n.icon?v("div",{class:[`${a}-spin-body`,this.themeClass]},v("div",{class:[`${a}-spin`,e&&`${a}-spin--rotate`],style:n.default?"":this.cssVars},n.icon()),c):v("div",{class:[`${a}-spin-body`,this.themeClass]},v(I,{clsPrefix:a,style:n.default?"":this.cssVars,stroke:this.stroke,"stroke-width":this.mergedStrokeWidth,class:`${a}-spin`}),c);return(d=this.onRender)===null||d===void 0||d.call(this),n.default?v("div",{class:[`${a}-spin-container`,this.themeClass],style:this.cssVars},v("div",{class:[`${a}-spin-content`,this.active&&`${a}-spin-content--spinning`,this.contentClass],style:this.contentStyle},n),v(V,{name:"fade-in-transition"},{default:()=>this.active?p:null})):p}}),as={class:"site-detail-container"},ns={class:"header-section"},is={key:0,class:"content"},os={class:"info-grid"},ls={class:"info-item"},rs={class:"value"},cs={class:"info-item"},ds={class:"value"},us={class:"info-item"},ps={class:"stats-grid"},vs={class:"stat-item"},ms={class:"stat-value"},_s={class:"stat-item"},fs={class:"stat-value"},hs={class:"stat-item"},bs={class:"stat-value"},gs={class:"stat-item"},ys={class:"stat-value"},Cs={class:"stat-item"},Ss={class:"stat-value"},xs={class:"stat-item"},ks={class:"stat-value"},zs={class:"stat-item"},ws={class:"stat-value"},Ns={class:"contact-grid"},$s={class:"contact-item"},Bs={class:"value"},Rs={class:"contact-item"},Ts={class:"value"},Is={class:"contact-item"},Vs={class:"value"},Ds=w({name:"sitedetail",__name:"index",setup(i){const d=H(),n=G(),a=K(),u=b(()=>Number(d.params.id)),e=C(null),c=C(!1),p=()=>{n.back()},o=async()=>{if(!u.value){a.error("场地ID无效");return}c.value=!0;try{const{data:r,error:t}=await Q(u.value);t==null?e.value=r:a.error(`加载失败: ${t}`)}catch(r){a.error(`加载失败: ${r}`)}finally{c.value=!1}};return L(()=>{o()}),(r,t)=>{const g=Y;return z(),k("div",as,[s("div",ns,[m(h(Z),{quaternary:"",onClick:p,class:"back-button"},{icon:_(()=>[m(h(X),null,{default:_(()=>[m(g,{icon:"material-symbols:arrow-back"})]),_:1})]),default:_(()=>[t[0]||(t[0]=q(" 返回 "))]),_:1,__:[0]})]),m(h(es),{show:c.value,class:"loading-container"},{default:_(()=>[e.value?(z(),k("div",is,[m(h(y),{title:"基础信息",class:"info-card"},{default:_(()=>[s("div",os,[s("div",ls,[t[1]||(t[1]=s("span",{class:"label"},"场地名称:",-1)),s("span",rs,l(e.value.name||""),1)]),s("div",cs,[t[2]||(t[2]=s("span",{class:"label"},"场地地址:",-1)),s("span",ds,l(e.value.address||""),1)]),s("div",us,[t[3]||(t[3]=s("span",{class:"label"},"场地状态:",-1)),s("span",{class:F(["value",e.value.site_status===1?"status-yes":"status-no"])},l(e.value.site_status===1?"驻场":e.value.site_status===2?"寄修":"驻场+寄修"),3)])])]),_:1}),m(h(y),{title:"资产统计",class:"stats-card"},{default:_(()=>[s("div",ps,[s("div",vs,[t[4]||(t[4]=s("span",{class:"stat-label"},"总资产数:",-1)),s("span",ms,l(e.value.asset_count||0)+" 台",1)]),s("div",_s,[t[5]||(t[5]=s("span",{class:"stat-label"},"24H故障数:",-1)),s("span",fs,l(e.value.fault_count||0)+" 台",1)]),s("div",hs,[t[6]||(t[6]=s("span",{class:"stat-label"},"物流中:",-1)),s("span",bs,l(e.value.in_logistics_count||0)+" 台",1)]),s("div",gs,[t[7]||(t[7]=s("span",{class:"stat-label"},"在修数:",-1)),s("span",ys,l(e.value.repairing||0)+" 台",1)]),s("div",Cs,[t[8]||(t[8]=s("span",{class:"stat-label"},"待修数:",-1)),s("span",Ss,l(e.value.wait_repair_count||0)+" 台",1)]),s("div",xs,[t[9]||(t[9]=s("span",{class:"stat-label"},"待上架:",-1)),s("span",ks,l(e.value.wait_on_shelf_count||0)+" 台",1)]),s("div",zs,[t[10]||(t[10]=s("span",{class:"stat-label"},"报废数:",-1)),s("span",ws,l(e.value.scrapped_count||0)+" 台",1)])])]),_:1}),m(h(y),{title:"售后专员",class:"contact-card"},{default:_(()=>[s("div",Ns,[s("div",$s,[t[11]||(t[11]=s("span",{class:"label"},"负责人:",-1)),s("span",Bs,l(e.value.saler_name||""),1)]),s("div",Rs,[t[12]||(t[12]=s("span",{class:"label"},"联系电话:",-1)),s("span",Ts,l(e.value.phone||""),1)]),s("div",Is,[t[13]||(t[13]=s("span",{class:"label"},"邮箱:",-1)),s("span",Vs,l(e.value.email||""),1)])])]),_:1})])):A("",!0)]),_:1},8,["show"])])}}}),js=J(Ds,[["__scopeId","data-v-8dcf1872"]]);export{js as default};
