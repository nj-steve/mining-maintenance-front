import{Y as z,U as _,b9 as R,W as C,d as x,Z as m,bv as V,T as O,a5 as P,a6 as N,bw as W,a as y,aP as j,a9 as H,aa as M,bx as E,r as g,bi as U,b3 as $,az as T,e as k,o as S,g as v,aI as Y,at as A,f as s,w as f,h as K,i as h,aw as L,_ as q,B as F,I as X,M as w,t as u,by as Z,ax as G}from"./index-ZOkSGbDR.js";import{c as J,d as Q}from"./site-SgTRSgxa.js";import{N as tt}from"./DataTable-D_uPPJFg.js";import"./get-slot-Bk_rJcZu.js";import"./Forward-Bb5W9ZIr.js";const st=z([z("@keyframes spin-rotate",`
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
 `,[R()])]),_("spin-body",`
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
 `,[C("rotate",`
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
 `,[C("spinning",`
 user-select: none;
 -webkit-user-select: none;
 pointer-events: none;
 opacity: var(--n-opacity-spinning);
 `)])]),et={small:20,medium:18,large:16},at=Object.assign(Object.assign({},N.props),{contentClass:String,contentStyle:[Object,String],description:String,stroke:String,size:{type:[String,Number],default:"medium"},show:{type:Boolean,default:!0},strokeWidth:Number,rotate:{type:Boolean,default:!0},spinning:{type:Boolean,validator:()=>!0,default:void 0},delay:Number}),nt=x({name:"Spin",props:at,slots:Object,setup(l){const{mergedClsPrefixRef:p,inlineThemeDisabled:i}=P(l),o=N("Spin","-spin",st,W,l,p),d=y(()=>{const{size:a}=l,{common:{cubicBezierEaseInOut:c},self:t}=o.value,{opacitySpinning:b,color:D,textColor:B}=t,I=typeof a=="number"?j(a):t[H("size",a)];return{"--n-bezier":c,"--n-opacity-spinning":b,"--n-size":I,"--n-color":D,"--n-text-color":B}}),e=i?M("spin",y(()=>{const{size:a}=l;return typeof a=="number"?String(a):a[0]}),d,l):void 0,n=E(l,["spinning","show"]),r=g(!1);return U(a=>{let c;if(n.value){const{delay:t}=l;if(t){c=window.setTimeout(()=>{r.value=!0},t),a(()=>{clearTimeout(c)});return}}r.value=n.value}),{mergedClsPrefix:p,active:r,mergedStrokeWidth:y(()=>{const{strokeWidth:a}=l;if(a!==void 0)return a;const{size:c}=l;return et[typeof c=="number"?"medium":c]}),cssVars:i?void 0:d,themeClass:e?.themeClass,onRender:e?.onRender}},render(){var l,p;const{$slots:i,mergedClsPrefix:o,description:d}=this,e=i.icon&&this.rotate,n=(d||i.description)&&m("div",{class:`${o}-spin-description`},d||((l=i.description)===null||l===void 0?void 0:l.call(i))),r=i.icon?m("div",{class:[`${o}-spin-body`,this.themeClass]},m("div",{class:[`${o}-spin`,e&&`${o}-spin--rotate`],style:i.default?"":this.cssVars},i.icon()),n):m("div",{class:[`${o}-spin-body`,this.themeClass]},m(V,{clsPrefix:o,style:i.default?"":this.cssVars,stroke:this.stroke,"stroke-width":this.mergedStrokeWidth,class:`${o}-spin`}),n);return(p=this.onRender)===null||p===void 0||p.call(this),i.default?m("div",{class:[`${o}-spin-container`,this.themeClass],style:this.cssVars},m("div",{class:[`${o}-spin-content`,this.active&&`${o}-spin-content--spinning`,this.contentClass],style:this.contentStyle},i),m(O,{name:"fade-in-transition"},{default:()=>this.active?r:null})):r}}),it={style:{display:"flex",gap:"8px","align-items":"center"}},ot=x({__name:"History",setup(l){const p=$(),i=g([]),o=[{title:"日期",key:"date",width:180,render:e=>{const n=e.date??"";if(typeof n=="string")return n.split("T")[0];const r=new Date(n);if(!isNaN(r.getTime())){const a=r.getFullYear(),c=String(r.getMonth()+1).padStart(2,"0"),t=String(r.getDate()).padStart(2,"0");return`${a}-${c}-${t}`}return""}},{title:"故障数",key:"fault_count",width:120},{title:"物流中",key:"in_logistics_count",width:120},{title:"在修数",key:"repairing",width:120},{title:"待修数",key:"wait_repair_count",width:120},{title:"待上架",key:"wait_on_shelf_count",width:120},{title:"报废数",key:"scrapped_count",width:120}],d=g({page:1,pageSize:10,itemCount:0});return T(async()=>{try{const{data:e,error:n}=await J(Number(p.params.id));console.log("historyData",e),i.value=[],!n&&Array.isArray(e)&&e.length>0&&(i.value=e,d.value.itemCount=e.length)}catch(e){console.error("加载场地历史数据失败",e)}}),(e,n)=>{const r=tt;return S(),k("div",it,[v(r,{data:i.value,columns:o,pagination:d.value,"onUpdate:page":n[0]||(n[0]=a=>d.value.page=a),"onUpdate:pageSize":n[1]||(n[1]=a=>d.value.pageSize=a),"row-key":a=>a.id},null,8,["data","pagination","row-key"])])}}}),lt={class:"site-detail-container"},rt={class:"header-section"},ct={key:0,class:"content"},dt={class:"info-grid"},ut={class:"info-item"},pt={class:"value"},vt={class:"info-item"},mt={class:"value"},ft={class:"info-item"},_t={class:"info-item"},ht={class:"value"},gt={class:"stats-grid"},yt={class:"stat-item"},bt={class:"stat-value"},wt={class:"stat-item"},kt={class:"stat-value"},St={class:"stat-item"},xt={class:"stat-value"},zt={class:"stat-item"},Ct={class:"stat-value"},Nt={class:"stat-item"},$t={class:"stat-value"},Tt={class:"stat-item"},Dt={class:"stat-value"},Bt={class:"stat-item"},It={class:"stat-value"},Rt=x({name:"sitedetail",__name:"index",setup(l){const p=$(),i=Y(),o=A(),d=y(()=>Number(p.params.id)),e=g(null),n=g(!1),r=()=>{i.back()},a=async()=>{if(!d.value){o.error("场地ID无效");return}n.value=!0;try{const{data:c,error:t}=await Q(d.value);t==null?e.value=c:o.error(`加载失败: ${t}`)}catch(c){o.error(`加载失败: ${c}`)}finally{n.value=!1}};return T(()=>{a()}),(c,t)=>{const b=q;return S(),k("div",lt,[s("div",rt,[v(h(F),{quaternary:"",onClick:r,class:"back-button"},{icon:f(()=>[v(h(L),null,{default:f(()=>[v(b,{icon:"material-symbols:arrow-back"})]),_:1})]),default:f(()=>[t[0]||(t[0]=K(" 返回 "))]),_:1,__:[0]})]),v(h(nt),{show:n.value,class:"loading-container"},{default:f(()=>[e.value?(S(),k("div",ct,[v(h(w),{title:"基础信息",class:"info-card"},{default:f(()=>[s("div",dt,[s("div",ut,[t[1]||(t[1]=s("span",{class:"label"},"场地名称:",-1)),s("span",pt,u(e.value.name||""),1)]),s("div",vt,[t[2]||(t[2]=s("span",{class:"label"},"场地地址:",-1)),s("span",mt,u(e.value.address||""),1)]),s("div",ft,[t[3]||(t[3]=s("span",{class:"label"},"场地状态:",-1)),s("span",{class:Z(["value",e.value.site_status===1?"status-yes":"status-no"])},u(e.value.site_status===1?"驻场":e.value.site_status===2?"寄修":"驻场+寄修"),3)]),s("div",_t,[t[4]||(t[4]=s("span",{class:"label"},"售后负责人:",-1)),s("span",ht,u(e.value.saler_name||""),1)]),t[5]||(t[5]=s("div",{class:"info-item",style:{height:"5px"}},null,-1))])]),_:1}),v(h(w),{title:"资产统计",class:"stats-card"},{default:f(()=>[s("div",gt,[s("div",yt,[t[6]||(t[6]=s("span",{class:"stat-label"},"总资产数:",-1)),s("span",bt,u(e.value.asset_count||0)+" 台",1)]),s("div",wt,[t[7]||(t[7]=s("span",{class:"stat-label"},"24H故障数:",-1)),s("span",kt,u(e.value.fault_count||0)+" 台",1)]),s("div",St,[t[8]||(t[8]=s("span",{class:"stat-label"},"物流中:",-1)),s("span",xt,u(e.value.in_logistics_count||0)+" 台",1)]),s("div",zt,[t[9]||(t[9]=s("span",{class:"stat-label"},"在修数:",-1)),s("span",Ct,u(e.value.repairing||0)+" 台",1)]),s("div",Nt,[t[10]||(t[10]=s("span",{class:"stat-label"},"待修数:",-1)),s("span",$t,u(e.value.wait_repair_count||0)+" 台",1)]),s("div",Tt,[t[11]||(t[11]=s("span",{class:"stat-label"},"待上架:",-1)),s("span",Dt,u(e.value.wait_on_shelf_count||0)+" 台",1)]),s("div",Bt,[t[12]||(t[12]=s("span",{class:"stat-label"},"报废数:",-1)),s("span",It,u(e.value.scrapped_count||0)+" 台",1)])])]),_:1}),v(h(w),{title:"历史数据",class:"info-card"},{default:f(()=>[v(ot)]),_:1})])):X("",!0)]),_:1},8,["show"])])}}}),Ht=G(Rt,[["__scopeId","data-v-2a8da85c"]]);export{Ht as default};
