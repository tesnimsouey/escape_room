// Pure normalization and rubric scoring; no solution material.
export function asciiDigits(value: unknown): string {
  return String(value ?? "").replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-0x660)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-0x6f0));
}
export function normText(value:unknown):string {
  return asciiDigits(value).normalize("NFKC").toLowerCase().replace(/[’‘]/g,"'")
    .replace(/[\u064b-\u065f\u0670\u0640]/g,"").replace(/[أإآٱ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه")
    .replace(/\s+/g," ").trim();
}
export function normTime(value:unknown):string {
  const match=asciiDigits(value).match(/(\d{1,2})\s*[:.h：]\s*(\d{2})|\b(\d{2})(\d{2})\b/);
  if(!match)return "";const hour=Number(match[1]??match[3]);const minute=Number(match[2]??match[4]);
  return hour<24&&minute<60?`${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}`:"";
}
export function normLetters(s:unknown):string{return normText(s).replace(/[^\p{L}]/gu,"");}
export function normKey(s:unknown):string{return asciiDigits(s).toUpperCase().replace(/[^A-Z0-9]/g,"");}
function has(text:string,keyword:string):boolean {
  const k=normText(keyword);
  if(/^[a-z]{1,3}$/.test(k))return new RegExp(`\\b${k}\\b`).test(text);
  if(/^[\u0621-\u064a]{1,3}$/.test(k))return new RegExp(`(^|[^\\p{L}])${k}($|[^\\p{L}])`,"u").test(text);
  return text.includes(k);
}
export function hasAny(text:unknown,keywords:string[]):boolean{return keywords.some(k=>has(normText(text),k));}
export function gradeRubric(text:unknown,rubric:string[][],max:number):number {
  const t=normText(text);if(t.length<3)return 0;
  return Math.round(max*rubric.filter(group=>group.some(k=>has(t,k))).length/rubric.length);
}
