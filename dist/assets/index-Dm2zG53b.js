import{Y as N,U as g,ba as V,W as $,d as C,Z as m,bw as j,T as O,a5 as W,a6 as D,bx as H,a as w,aR as M,a9 as P,aa as E,by as A,r as b,bj as L,b5 as B,az as I,e as k,o as S,g as v,u as U,aL as Y,at as K,f as t,w as f,h as q,i as y,aw as F,_ as X,B as Z,I as T,M as z,t as d,bz as G,ax as J}from"./index-D6gcWT8Y.js";import{c as Q,d as tt}from"./site-KKozAc1W.js";import{N as st}from"./DataTable-Rl0rY4wO.js";import"./get-slot-Bk_rJcZu.js";import"./Forward-CJ4GanjF.js";const et=N([N("@keyframes spin-rotate",`
 from {
 transform: rotate(0);
 }
 to {
 transform: rotate(360deg);
 }
 `),g("spin-container",`
 position: relative;
 `,[g("spin-body",`
 position: absolute;
 top: 50%;
 left: 50%;
 transform: translateX(-50%) translateY(-50%);
 `,[V()])]),g("spin-body",`
 display: inline-flex;
 align-items: center;
 justify-content: center;
 flex-direction: column;
 `),g("spin",`
 display: inline-flex;
 height: var(--n-size);
 width: var(--n-size);
 font-size: var(--n-size);
 color: var(--n-color);
 `,[$("rotate",`
 animation: spin-rotate 2s linear infinite;
 `)]),g("spin-description",`
 display: inline-block;
 font-size: var(--n-font-size);
 color: var(--n-text-color);
 transition: color .3s var(--n-bezier);
 margin-top: 8px;
 `),g("spin-content",`
 opacity: 1;
 transition: opacity .3s var(--n-bezier);
 pointer-events: all;
 `,[$("spinning",`
 user-select: none;
 -webkit-user-select: none;
 pointer-events: none;
 opacity: var(--n-opacity-spinning);
 `)])]),at={small:20,medium:18,large:16},nt=Object.assign(Object.assign({},D.props),{contentClass:String,contentStyle:[Object,String],description:String,stroke:String,size:{type:[String,Number],default:"medium"},show:{type:Boolean,default:!0},strokeWidth:Number,rotate:{type:Boolean,default:!0},spinning:{type:Boolean,validator:()=>!0,default:void 0},delay:Number}),it=C({name:"Spin",props:nt,slots:Object,setup(r){const{mergedClsPrefixRef:u,inlineThemeDisabled:i}=W(r),l=D("Spin","-spin",et,H,r,u),c=w(()=>{const{size:n}=r,{common:{cubicBezierEaseInOut:p},self:_}=l.value,{opacitySpinning:h,color:s,textColor:x}=_,R=typeof n=="number"?M(n):_[P("size",n)];return{"--n-bezier":p,"--n-opacity-spinning":h,"--n-size":R,"--n-color":s,"--n-text-color":x}}),a=i?E("spin",w(()=>{const{size:n}=r;return typeof n=="number"?String(n):n[0]}),c,r):void 0,o=A(r,["spinning","show"]),e=b(!1);return L(n=>{let p;if(o.value){const{delay:_}=r;if(_){p=window.setTimeout(()=>{e.value=!0},_),n(()=>{clearTimeout(p)});return}}e.value=o.value}),{mergedClsPrefix:u,active:e,mergedStrokeWidth:w(()=>{const{strokeWidth:n}=r;if(n!==void 0)return n;const{size:p}=r;return at[typeof p=="number"?"medium":p]}),cssVars:i?void 0:c,themeClass:a?.themeClass,onRender:a?.onRender}},render(){var r,u;const{$slots:i,mergedClsPrefix:l,description:c}=this,a=i.icon&&this.rotate,o=(c||i.description)&&m("div",{class:`${l}-spin-description`},c||((r=i.description)===null||r===void 0?void 0:r.call(i))),e=i.icon?m("div",{class:[`${l}-spin-body`,this.themeClass]},m("div",{class:[`${l}-spin`,a&&`${l}-spin--rotate`],style:i.default?"":this.cssVars},i.icon()),o):m("div",{class:[`${l}-spin-body`,this.themeClass]},m(j,{clsPrefix:l,style:i.default?"":this.cssVars,stroke:this.stroke,"stroke-width":this.mergedStrokeWidth,class:`${l}-spin`}),o);return(u=this.onRender)===null||u===void 0||u.call(this),i.default?m("div",{class:[`${l}-spin-container`,this.themeClass],style:this.cssVars},m("div",{class:[`${l}-spin-content`,this.active&&`${l}-spin-content--spinning`,this.contentClass],style:this.contentStyle},i),m(O,{name:"fade-in-transition"},{default:()=>this.active?e:null})):e}}),ot={style:{display:"flex",gap:"8px","align-items":"center"}},lt=C({__name:"History",setup(r){const u=B(),i=b([]),l=[{title:"日期",key:"date",width:180,render:a=>{const o=a.date??"";if(typeof o=="string")return o.split("T")[0];const e=new Date(o);if(!isNaN(e.getTime())){const n=e.getFullYear(),p=String(e.getMonth()+1).padStart(2,"0"),_=String(e.getDate()).padStart(2,"0");return`${n}-${p}-${_}`}return""}},{title:"24H故障数",key:"fault_count",width:120},{title:"物流中",key:"in_logistics_count",width:120},{title:"在修数",key:"repairing",width:120},{title:"待修数",key:"wait_repair_count",width:120},{title:"待上架",key:"wait_on_shelf_count",width:120},{title:"净故障数",key:"wait_on_shelf_count",width:120,render:a=>a.in_logistics_count+a.repairing+a.wait_repair_count+a.wait_on_shelf_count},{title:"报废数",key:"scrapped_count",width:120}],c=b({page:1,pageSize:10,itemCount:0});return I(async()=>{try{const{data:a,error:o}=await Q(Number(u.params.id));console.log("historyData",a),i.value=[],!o&&Array.isArray(a)&&a.length>0&&(i.value=a,c.value.itemCount=a.length)}catch(a){console.error("加载场地历史数据失败",a)}}),(a,o)=>{const e=st;return S(),k("div",ot,[v(e,{data:i.value,columns:l,pagination:c.value,"onUpdate:page":o[0]||(o[0]=n=>c.value.page=n),"onUpdate:pageSize":o[1]||(o[1]=n=>c.value.pageSize=n),"row-key":n=>n.id},null,8,["data","pagination","row-key"])])}}}),rt={class:"site-detail-container"},ct={class:"header-section"},dt={key:0,class:"content"},ut={class:"info-grid"},pt={class:"info-item"},_t={class:"value"},vt={class:"info-item"},mt={class:"value"},ft={class:"info-item"},ht={key:0,class:"info-item"},gt={class:"value"},yt={class:"stats-grid"},bt={class:"stat-item"},wt={class:"stat-value"},kt={class:"stat-item"},St={class:"stat-value"},xt={class:"stat-item"},zt={class:"stat-value"},Ct={class:"stat-item"},Nt={class:"stat-value"},$t={class:"stat-item"},Tt={class:"stat-value"},Dt={class:"stat-item"},Bt={class:"stat-value"},It={class:"stat-item"},Rt={class:"stat-value"},Vt={class:"stat-item"},jt={class:"stat-value"},Ot=C({name:"sitedetail",__name:"index",setup(r){const u=U(),i=!u.userInfo.roles.includes("3");u.userInfo.roles.includes("1");const l=B(),c=Y(),a=K(),o=w(()=>Number(l.params.id)),e=b(null),n=b(!1),p=()=>{c.back()},_=async()=>{if(!o.value){a.error("场地ID无效");return}n.value=!0;try{const{data:h,error:s}=await tt(o.value);s==null?e.value=h:a.error(`加载失败: ${s}`)}catch(h){a.error(`加载失败: ${h}`)}finally{n.value=!1}};return I(()=>{_()}),(h,s)=>{const x=X;return S(),k("div",rt,[t("div",ct,[v(y(Z),{quaternary:"",onClick:p,class:"back-button"},{icon:f(()=>[v(y(F),null,{default:f(()=>[v(x,{icon:"material-symbols:arrow-back"})]),_:1})]),default:f(()=>[s[0]||(s[0]=q(" 返回 "))]),_:1,__:[0]})]),v(y(it),{show:n.value,class:"loading-container"},{default:f(()=>[e.value?(S(),k("div",dt,[v(y(z),{title:"基础信息",class:"info-card"},{default:f(()=>[t("div",ut,[t("div",pt,[s[1]||(s[1]=t("span",{class:"label"},"场地名称:",-1)),t("span",_t,d(e.value.name||""),1)]),t("div",vt,[s[2]||(s[2]=t("span",{class:"label"},"场地地址:",-1)),t("span",mt,d(e.value.address||""),1)]),t("div",ft,[s[3]||(s[3]=t("span",{class:"label"},"场地状态:",-1)),t("span",{class:G(["value",e.value.site_status===1?"status-yes":"status-no"])},d(e.value.site_status===1?"驻场":e.value.site_status===2?"寄修":"驻场+寄修"),3)]),i?(S(),k("div",ht,[s[4]||(s[4]=t("span",{class:"label"},"售后负责人:",-1)),t("span",gt,d(e.value.saler_name||""),1)])):T("",!0),s[5]||(s[5]=t("div",{class:"info-item",style:{height:"5px"}},null,-1))])]),_:1}),v(y(z),{title:"资产统计",class:"stats-card"},{default:f(()=>[t("div",yt,[t("div",bt,[s[6]||(s[6]=t("span",{class:"stat-label"},"总资产数:",-1)),t("span",wt,d(e.value.asset_count||0)+" 台",1)]),t("div",kt,[s[7]||(s[7]=t("span",{class:"stat-label"},"故障数:",-1)),t("span",St,d(e.value.fault_count||0)+" 台",1)]),t("div",xt,[s[8]||(s[8]=t("span",{class:"stat-label"},"物流中:",-1)),t("span",zt,d(e.value.in_logistics_count||0)+" 台",1)]),t("div",Ct,[s[9]||(s[9]=t("span",{class:"stat-label"},"在修数:",-1)),t("span",Nt,d(e.value.repairing||0)+" 台",1)]),t("div",$t,[s[10]||(s[10]=t("span",{class:"stat-label"},"在架待修数:",-1)),t("span",Tt,d(e.value.on_shelf_wait_repair_count||0)+" 台",1)]),t("div",Dt,[s[11]||(s[11]=t("span",{class:"stat-label"},"总待修数:",-1)),t("span",Bt,d(e.value.wait_repair_count+e.value.on_shelf_wait_repair_count||0)+" 台",1)]),t("div",It,[s[12]||(s[12]=t("span",{class:"stat-label"},"待上架:",-1)),t("span",Rt,d(e.value.wait_on_shelf_count||0)+" 台",1)]),t("div",Vt,[s[13]||(s[13]=t("span",{class:"stat-label"},"报废数:",-1)),t("span",jt,d(e.value.scrapped_count||0)+" 台",1)])])]),_:1}),v(y(z),{title:"历史数据",class:"info-card"},{default:f(()=>[v(lt)]),_:1})])):T("",!0)]),_:1},8,["show"])])}}}),At=J(Ot,[["__scopeId","data-v-eb28682d"]]);export{At as default};
