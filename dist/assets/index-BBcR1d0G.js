import{Y as N,U as y,b9 as V,W as $,d as C,Z as _,bv as O,T as P,a5 as W,a6 as D,bw as j,a as w,aP as M,a9 as E,aa as H,bx as A,r as b,bi as U,b3 as I,az as B,e as S,o as k,g as m,u as Y,aI as K,at as L,f as t,w as f,h as q,i as g,aw as F,_ as X,B as Z,I as T,M as z,t as d,by as G,ax as J}from"./index-CI8pc9I1.js";import{c as Q,d as tt}from"./site-BF45Lt5h.js";import{N as st}from"./DataTable-BK3R-LED.js";import"./get-slot-Bk_rJcZu.js";import"./Forward-D-xCmpF1.js";const et=N([N("@keyframes spin-rotate",`
 from {
 transform: rotate(0);
 }
 to {
 transform: rotate(360deg);
 }
 `),y("spin-container",`
 position: relative;
 `,[y("spin-body",`
 position: absolute;
 top: 50%;
 left: 50%;
 transform: translateX(-50%) translateY(-50%);
 `,[V()])]),y("spin-body",`
 display: inline-flex;
 align-items: center;
 justify-content: center;
 flex-direction: column;
 `),y("spin",`
 display: inline-flex;
 height: var(--n-size);
 width: var(--n-size);
 font-size: var(--n-size);
 color: var(--n-color);
 `,[$("rotate",`
 animation: spin-rotate 2s linear infinite;
 `)]),y("spin-description",`
 display: inline-block;
 font-size: var(--n-font-size);
 color: var(--n-text-color);
 transition: color .3s var(--n-bezier);
 margin-top: 8px;
 `),y("spin-content",`
 opacity: 1;
 transition: opacity .3s var(--n-bezier);
 pointer-events: all;
 `,[$("spinning",`
 user-select: none;
 -webkit-user-select: none;
 pointer-events: none;
 opacity: var(--n-opacity-spinning);
 `)])]),at={small:20,medium:18,large:16},nt=Object.assign(Object.assign({},D.props),{contentClass:String,contentStyle:[Object,String],description:String,stroke:String,size:{type:[String,Number],default:"medium"},show:{type:Boolean,default:!0},strokeWidth:Number,rotate:{type:Boolean,default:!0},spinning:{type:Boolean,validator:()=>!0,default:void 0},delay:Number}),it=C({name:"Spin",props:nt,slots:Object,setup(r){const{mergedClsPrefixRef:u,inlineThemeDisabled:i}=W(r),l=D("Spin","-spin",et,j,r,u),c=w(()=>{const{size:a}=r,{common:{cubicBezierEaseInOut:p},self:v}=l.value,{opacitySpinning:h,color:s,textColor:x}=v,R=typeof a=="number"?M(a):v[E("size",a)];return{"--n-bezier":p,"--n-opacity-spinning":h,"--n-size":R,"--n-color":s,"--n-text-color":x}}),n=i?H("spin",w(()=>{const{size:a}=r;return typeof a=="number"?String(a):a[0]}),c,r):void 0,o=A(r,["spinning","show"]),e=b(!1);return U(a=>{let p;if(o.value){const{delay:v}=r;if(v){p=window.setTimeout(()=>{e.value=!0},v),a(()=>{clearTimeout(p)});return}}e.value=o.value}),{mergedClsPrefix:u,active:e,mergedStrokeWidth:w(()=>{const{strokeWidth:a}=r;if(a!==void 0)return a;const{size:p}=r;return at[typeof p=="number"?"medium":p]}),cssVars:i?void 0:c,themeClass:n?.themeClass,onRender:n?.onRender}},render(){var r,u;const{$slots:i,mergedClsPrefix:l,description:c}=this,n=i.icon&&this.rotate,o=(c||i.description)&&_("div",{class:`${l}-spin-description`},c||((r=i.description)===null||r===void 0?void 0:r.call(i))),e=i.icon?_("div",{class:[`${l}-spin-body`,this.themeClass]},_("div",{class:[`${l}-spin`,n&&`${l}-spin--rotate`],style:i.default?"":this.cssVars},i.icon()),o):_("div",{class:[`${l}-spin-body`,this.themeClass]},_(O,{clsPrefix:l,style:i.default?"":this.cssVars,stroke:this.stroke,"stroke-width":this.mergedStrokeWidth,class:`${l}-spin`}),o);return(u=this.onRender)===null||u===void 0||u.call(this),i.default?_("div",{class:[`${l}-spin-container`,this.themeClass],style:this.cssVars},_("div",{class:[`${l}-spin-content`,this.active&&`${l}-spin-content--spinning`,this.contentClass],style:this.contentStyle},i),_(P,{name:"fade-in-transition"},{default:()=>this.active?e:null})):e}}),ot={style:{display:"flex",gap:"8px","align-items":"center"}},lt=C({__name:"History",setup(r){const u=I(),i=b([]),l=[{title:"日期",key:"date",width:180,render:n=>{const o=n.date??"";if(typeof o=="string")return o.split("T")[0];const e=new Date(o);if(!isNaN(e.getTime())){const a=e.getFullYear(),p=String(e.getMonth()+1).padStart(2,"0"),v=String(e.getDate()).padStart(2,"0");return`${a}-${p}-${v}`}return""}},{title:"故障数",key:"fault_count",width:120},{title:"物流中",key:"in_logistics_count",width:120},{title:"在修数",key:"repairing",width:120},{title:"待修数",key:"wait_repair_count",width:120},{title:"待上架",key:"wait_on_shelf_count",width:120},{title:"报废数",key:"scrapped_count",width:120}],c=b({page:1,pageSize:10,itemCount:0});return B(async()=>{try{const{data:n,error:o}=await Q(Number(u.params.id));console.log("historyData",n),i.value=[],!o&&Array.isArray(n)&&n.length>0&&(i.value=n,c.value.itemCount=n.length)}catch(n){console.error("加载场地历史数据失败",n)}}),(n,o)=>{const e=st;return k(),S("div",ot,[m(e,{data:i.value,columns:l,pagination:c.value,"onUpdate:page":o[0]||(o[0]=a=>c.value.page=a),"onUpdate:pageSize":o[1]||(o[1]=a=>c.value.pageSize=a),"row-key":a=>a.id},null,8,["data","pagination","row-key"])])}}}),rt={class:"site-detail-container"},ct={class:"header-section"},dt={key:0,class:"content"},ut={class:"info-grid"},pt={class:"info-item"},vt={class:"value"},mt={class:"info-item"},_t={class:"value"},ft={class:"info-item"},ht={key:0,class:"info-item"},yt={class:"value"},gt={class:"stats-grid"},bt={class:"stat-item"},wt={class:"stat-value"},St={class:"stat-item"},kt={class:"stat-value"},xt={class:"stat-item"},zt={class:"stat-value"},Ct={class:"stat-item"},Nt={class:"stat-value"},$t={class:"stat-item"},Tt={class:"stat-value"},Dt={class:"stat-item"},It={class:"stat-value"},Bt={class:"stat-item"},Rt={class:"stat-value"},Vt={class:"stat-item"},Ot={class:"stat-value"},Pt=C({name:"sitedetail",__name:"index",setup(r){const u=Y(),i=!u.userInfo.roles.includes("3");u.userInfo.roles.includes("1");const l=I(),c=K(),n=L(),o=w(()=>Number(l.params.id)),e=b(null),a=b(!1),p=()=>{c.back()},v=async()=>{if(!o.value){n.error("场地ID无效");return}a.value=!0;try{const{data:h,error:s}=await tt(o.value);s==null?e.value=h:n.error(`加载失败: ${s}`)}catch(h){n.error(`加载失败: ${h}`)}finally{a.value=!1}};return B(()=>{v()}),(h,s)=>{const x=X;return k(),S("div",rt,[t("div",ct,[m(g(Z),{quaternary:"",onClick:p,class:"back-button"},{icon:f(()=>[m(g(F),null,{default:f(()=>[m(x,{icon:"material-symbols:arrow-back"})]),_:1})]),default:f(()=>[s[0]||(s[0]=q(" 返回 "))]),_:1,__:[0]})]),m(g(it),{show:a.value,class:"loading-container"},{default:f(()=>[e.value?(k(),S("div",dt,[m(g(z),{title:"基础信息",class:"info-card"},{default:f(()=>[t("div",ut,[t("div",pt,[s[1]||(s[1]=t("span",{class:"label"},"场地名称:",-1)),t("span",vt,d(e.value.name||""),1)]),t("div",mt,[s[2]||(s[2]=t("span",{class:"label"},"场地地址:",-1)),t("span",_t,d(e.value.address||""),1)]),t("div",ft,[s[3]||(s[3]=t("span",{class:"label"},"场地状态:",-1)),t("span",{class:G(["value",e.value.site_status===1?"status-yes":"status-no"])},d(e.value.site_status===1?"驻场":e.value.site_status===2?"寄修":"驻场+寄修"),3)]),i?(k(),S("div",ht,[s[4]||(s[4]=t("span",{class:"label"},"售后负责人:",-1)),t("span",yt,d(e.value.saler_name||""),1)])):T("",!0),s[5]||(s[5]=t("div",{class:"info-item",style:{height:"5px"}},null,-1))])]),_:1}),m(g(z),{title:"资产统计",class:"stats-card"},{default:f(()=>[t("div",gt,[t("div",bt,[s[6]||(s[6]=t("span",{class:"stat-label"},"总资产数:",-1)),t("span",wt,d(e.value.asset_count||0)+" 台",1)]),t("div",St,[s[7]||(s[7]=t("span",{class:"stat-label"},"故障数:",-1)),t("span",kt,d(e.value.fault_count||0)+" 台",1)]),t("div",xt,[s[8]||(s[8]=t("span",{class:"stat-label"},"物流中:",-1)),t("span",zt,d(e.value.in_logistics_count||0)+" 台",1)]),t("div",Ct,[s[9]||(s[9]=t("span",{class:"stat-label"},"在修数:",-1)),t("span",Nt,d(e.value.repairing||0)+" 台",1)]),t("div",$t,[s[10]||(s[10]=t("span",{class:"stat-label"},"在架待修数:",-1)),t("span",Tt,d(e.value.on_shelf_wait_repair_count||0)+" 台",1)]),t("div",Dt,[s[11]||(s[11]=t("span",{class:"stat-label"},"总待修数:",-1)),t("span",It,d(e.value.wait_repair_count+e.value.on_shelf_wait_repair_count||0)+" 台",1)]),t("div",Bt,[s[12]||(s[12]=t("span",{class:"stat-label"},"待上架:",-1)),t("span",Rt,d(e.value.wait_on_shelf_count||0)+" 台",1)]),t("div",Vt,[s[13]||(s[13]=t("span",{class:"stat-label"},"报废数:",-1)),t("span",Ot,d(e.value.scrapped_count||0)+" 台",1)])])]),_:1}),m(g(z),{title:"历史数据",class:"info-card"},{default:f(()=>[m(lt)]),_:1})])):T("",!0)]),_:1},8,["show"])])}}}),At=J(Pt,[["__scopeId","data-v-eb28682d"]]);export{At as default};
