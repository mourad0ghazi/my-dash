import{c as l}from"./index-DqIz1S-M.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const r=l("Download",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"7 10 12 15 17 10",key:"2ggqvy"}],["line",{x1:"12",x2:"12",y1:"15",y2:"3",key:"1vk2je"}]]);function s(e,o,t="text/plain"){const n=new Blob([o],{type:t}),c=URL.createObjectURL(n),a=document.createElement("a");a.href=c,a.download=e,a.click(),URL.revokeObjectURL(c)}function p(e){if(!e.length)return"";const o=Object.keys(e[0]),t=n=>`"${String(n??"").replaceAll('"','""')}"`;return[o.map(t).join(","),...e.map(n=>o.map(c=>t(n[c])).join(","))].join(`
`)}export{r as D,s as d,p as t};
