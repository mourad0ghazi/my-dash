function l(e,t,o="text/plain"){const n=new Blob([t],{type:o}),c=URL.createObjectURL(n),a=document.createElement("a");a.href=c,a.download=e,a.click(),URL.revokeObjectURL(c)}function r(e){if(!e.length)return"";const t=Object.keys(e[0]),o=n=>`"${String(n??"").replaceAll('"','""')}"`;return[t.map(o).join(","),...e.map(n=>t.map(c=>o(n[c])).join(","))].join(`
`)}export{l as d,r as t};
