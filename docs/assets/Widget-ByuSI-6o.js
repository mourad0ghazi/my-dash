import{c as t,u as o,a5 as w,D as k}from"./index-vmg-NQFG.js";import{r as v,j as e}from"./react-vendor-Bf3wb2ya.js";import{m as M}from"./motion-JId0psOk.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=t("ArrowDown",[["path",{d:"M12 5v14",key:"s699le"}],["path",{d:"m19 12-7 7-7-7",key:"1idqje"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const N=t("ArrowUp",[["path",{d:"m5 12 7-7 7 7",key:"hav0vg"}],["path",{d:"M12 19V5",key:"x0mq9r"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z=t("Ellipsis",[["circle",{cx:"12",cy:"12",r:"1",key:"41hilf"}],["circle",{cx:"19",cy:"12",r:"1",key:"1wjl8i"}],["circle",{cx:"5",cy:"12",r:"1",key:"1pcz8c"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=t("EyeOff",[["path",{d:"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",key:"ct8e1f"}],["path",{d:"M14.084 14.158a3 3 0 0 1-4.242-4.242",key:"151rxh"}],["path",{d:"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",key:"13bj9a"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=t("PenLine",[["path",{d:"M12 20h9",key:"t2du7b"}],["path",{d:"M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z",key:"1ykcvy"}]]);function W({id:n,title:c,icon:p,eyebrow:d,action:h,children:m,className:x=""}){const a=o(s=>s.editMode),g=o(s=>s.toggleWidget),r=o(s=>s.moveWidget),j=o(s=>s.settings.language),i=(s,u)=>j==="en"?u:s,[y,l]=v.useState(!1);return e.jsxs(M.article,{id:`widget-${n}`,className:`widget ${a?"widget-editing":""} ${x}`,initial:{opacity:0,y:15},animate:{opacity:1,y:0},transition:{duration:.4},whileHover:a?void 0:{y:-2},children:[e.jsxs("header",{className:"widget-header drag-handle",children:[e.jsxs("div",{className:"widget-title",children:[e.jsx(w,{className:"widget-grip",size:16}),e.jsx("span",{className:"widget-icon",children:e.jsx(p,{size:17})}),e.jsxs("div",{children:[d&&e.jsx("small",{children:d}),e.jsx("h3",{children:c})]})]}),e.jsxs("div",{className:"widget-actions",onMouseDown:s=>s.stopPropagation(),children:[h,e.jsx(k,{label:`${i("Options de","Options for")} ${c}`,onClick:()=>l(s=>!s),children:e.jsx(z,{size:17})}),y&&e.jsx("div",{className:"widget-menu",children:e.jsxs("button",{onClick:()=>{g(n),l(!1)},children:[e.jsx(b,{size:15})," ",i("Masquer ce module","Hide this module")]})})]})]}),e.jsx("div",{className:"widget-content",children:m}),a&&e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"edit-chip",children:i("Déplacer · Redimensionner","Move · Resize")}),e.jsxs("div",{className:"widget-mobile-order",onPointerDown:s=>s.stopPropagation(),children:[e.jsxs("button",{type:"button",onClick:()=>r(n,"up"),children:[e.jsx(N,{size:15})," ",i("Monter","Move up")]}),e.jsxs("button",{type:"button",onClick:()=>r(n,"down"),children:[e.jsx(f,{size:15})," ",i("Descendre","Move down")]})]})]})]})}export{L as P,W};
