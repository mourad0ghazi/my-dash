import{r as y,j as e}from"./react-vendor-Bf3wb2ya.js";import{c as o,u as n,a4 as k,E as v}from"./index-BajiIRSN.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const M=o("ArrowDown",[["path",{d:"M12 5v14",key:"s699le"}],["path",{d:"m19 12-7 7-7-7",key:"1idqje"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=o("ArrowUp",[["path",{d:"m5 12 7-7 7 7",key:"hav0vg"}],["path",{d:"M12 19V5",key:"x0mq9r"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const N=o("Ellipsis",[["circle",{cx:"12",cy:"12",r:"1",key:"41hilf"}],["circle",{cx:"19",cy:"12",r:"1",key:"1wjl8i"}],["circle",{cx:"5",cy:"12",r:"1",key:"1pcz8c"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z=o("EyeOff",[["path",{d:"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",key:"ct8e1f"}],["path",{d:"M14.084 14.158a3 3 0 0 1-4.242-4.242",key:"151rxh"}],["path",{d:"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",key:"13bj9a"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]]);function D({id:t,title:c,icon:h,eyebrow:a,action:p,children:g,className:x=""}){const d=n(s=>s.editMode),m=n(s=>s.toggleWidget),r=n(s=>s.moveWidget),j=n(s=>s.settings.language),i=(s,w)=>j==="en"?w:s,[u,l]=y.useState(!1);return e.jsxs("article",{id:`widget-${t}`,className:`widget widget-in ${d?"widget-editing":""} ${x}`,children:[e.jsxs("header",{className:"widget-header drag-handle",children:[e.jsxs("div",{className:"widget-title",children:[e.jsx(k,{className:"widget-grip",size:16}),e.jsx("span",{className:"widget-icon",children:e.jsx(h,{size:17})}),e.jsxs("div",{children:[a&&e.jsx("small",{children:a}),e.jsx("h3",{children:c})]})]}),e.jsxs("div",{className:"widget-actions",onMouseDown:s=>s.stopPropagation(),children:[p,e.jsx(v,{label:`${i("Options de","Options for")} ${c}`,onClick:()=>l(s=>!s),children:e.jsx(N,{size:17})}),u&&e.jsx("div",{className:"widget-menu",children:e.jsxs("button",{onClick:()=>{m(t),l(!1)},children:[e.jsx(z,{size:15})," ",i("Masquer ce module","Hide this module")]})})]})]}),e.jsx("div",{className:"widget-content",children:g}),d&&e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"edit-chip",children:i("Déplacer · Redimensionner","Move · Resize")}),e.jsxs("div",{className:"widget-mobile-order",onPointerDown:s=>s.stopPropagation(),children:[e.jsxs("button",{type:"button",onClick:()=>r(t,"up"),children:[e.jsx(f,{size:15})," ",i("Monter","Move up")]}),e.jsxs("button",{type:"button",onClick:()=>r(t,"down"),children:[e.jsx(M,{size:15})," ",i("Descendre","Move down")]})]})]})]})}export{D as W};
