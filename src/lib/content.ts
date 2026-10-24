// Public puzzle material only. Solutions and hints remain server-side in keys.ts.
export type Variant = "A" | "B" | "C";
export interface Card { id: string; badge?: string; title?: string; text: string; meta?: string }
export type Block =
  | { type: "cards"; title?: string; cards: Card[]; shuffle?: boolean }
  | { type: "list"; title?: string; items: string[]; shuffle?: boolean }
  | { type: "note"; title?: string; lines: string[]; footer?: string; numbered?: boolean }
  | { type: "table"; title?: string; headers: string[]; rows: string[][]; shuffle?: boolean; spatial?: boolean }
  | { type: "callout"; text: string };
export interface Field { key: string; label: string; placeholder?: string; options?: { value: string; label: string }[] }
export interface PuzzleDef {
  id: 1 | 2 | 3 | 4 | 5; title: string; envelope: string; story: string;
  blocks: Block[]; fields: Field[]; explain: { prompt: string; required: boolean };
}
export const STORY_INTRO = "!!!في دار سليمان، الجماعة يحضّروا لسهرية فوق السطح. أما مفتاح السطح ما عادش موجود فوق الطاولة! سليمان والسبوعي وعزة وفضيلة كانوا في الدار. قدّامكم خمسة ظروف: رتبو الأوقات، احسبوا , تبّعوا التشنشينات وشوفولنا حلّ";
const PLACES = [{ value: "", label: "اختار البلاصة" }, ...["باب الدار", "الصالة", "السطح", "الكوجينة"].map(value => ({value, label:value}))];
const PUZZLES: PuzzleDef[] = [
  {
    id:1, title:"وقتاش ضاع المفتاح", envelope:"الظرف الأوّل وقتاش ضاع المفتاح",
    story:"الأوقات تخلّطت على الجماعة. استخرجوا وقتاش ضاع المفتاح وآخر مرة شفنا فاها المفتاح . ورقة تفقيدة عامّة موش كيف شهادة واحد شاف المفتاح بعينو.",
    blocks:[{type:"cards",title:"شنوة صار في الدار",shuffle:true,cards:[
      {id:"p1-slimane",badge:"١",title:"سليمان",text:"خرجت من الدار على 18:00، ورجعت بعد اثناش دقيقة بالضبط."},
      {id:"p1-azza",badge:"٢",title:"عزة",text:"كي رجع سليمان، شفت مفتاح السطح بعيني فوق طاولة الصالة. هاذي آخر شهادة مباشرة موجودة في الملف."},
      {id:"p1-check",badge:"٣",title:"ورقة التفقيدة",text:"بعد رجوع سليمان بثمانية دقايق، تكتبت تفقيدة للضو والباب والكراسي. المفتاح ما تذكرش وما تعدّش وحدو."},
      {id:"p1-fadhila",badge:"٤",title:"فضيلة",text:"بعد التفقيدة بخمسة دقايق، جيت باش ناخذ مفتاح السطح من الطاولة وما لقيتوش."},
      {id:"p1-note",badge:"٥",title:"ملاحظة",text:"الأوقات اللي ما هيش مكتوبة بالأرقام تتحسب انطلاقا من خروج سليمان. أوقات الحكاية موش هي ساعة النشاط."},
    ]}],
    fields:[{key:"check",label:"وقتاش تكتبت التفقيدة",placeholder:"مثال 18:00"},{key:"sighting",label:"وقتاش آخر مرّة تشاف المفتاح مباشرة",placeholder:"ساعة ودقيقة"}],
    explain:{prompt:"فسّر كيفاش حسبت الوقتين وعلاش التفقيدة موش دليل على وجود المفتاح.",required:false},
  },
  {
    id:2,title:"قفة فضيلة",envelope:"الظرف الثاني قفة فضيلة",
    story:"السبوعي خلّى وصل ممضي باسمو: «شدّيت القفة، خلّصت بخمسة آلاف مليم، ولون العلبة اللي شريتها موجود في جدول الباقي». احسبوا القفة والباقي باش تعرفوا لون العلبة. الأثمان معطيات متاع اللعبة.",
    blocks:[
      {type:"table",title:"وصل القفة",headers:["الحاجة","قدّاش من وحدة","سوم الوحدة بالمليم"],shuffle:true,rows:[["خبز","٢","٥٠٠"],["حليب","١","١٣٥٠"],["سكّر","١","١٦٥٠"]]},
      {type:"table",title:"جدول الباقي والألوان",headers:["الباقي بالمليم","لون العلبة"],rows:[["٥٠٠","أحمر"],["١٠٠٠","أزرق"],["١٥٠٠","أخضر"],["٢٠٠٠","أصفر"]]},
      {type:"callout",text:"الوصل يربط السبوعي بشراء العلبة، أما يلزمكم تفرّقوا بين شراء علبة وتخبية مفتاح."},
    ],
    fields:[{key:"word",label:"شنوة لون العلبة",placeholder:"اكتب اللون"}],
    explain:{prompt:"التفسير لازم: احسب ثمن القفة والباقي واربطو باللون. شنوة الوصل يثبت وشنوة ما يثبتش؟",required:true},
  },
  {
    id:3,title:"شكون كان وين",envelope:"الظرف الثالث شكون كان وين",
    story:"على 18:20، كل واحد من عزة وسليمان وفضيلة والسبوعي في بلاصة وحدة: باب الدار، الصالة، السطح ولا الكوجينة. كل بلاصة فيها شخص واحد. ركّبوا التشنشينات باش تحدّدوا البلايص الكلّ.",
    blocks:[{type:"list",title:"التشنشينات",shuffle:true,items:[
      "عزة ما كانتش في الصالة ولا في الكوجينة.","عزة ما طلعتش للسطح.","السبوعي ما كانش في الصالة ولا فوق السطح.","فضيلة ما كانتش في الصالة.","سليمان ما كانش عند باب الدار.","ما ينجمش زوز يكونوا في نفس البلاصة في التوزيع هذا.",
    ]}],
    fields:[{key:"azza",label:"عزة",options:PLACES},{key:"slimane",label:"سليمان",options:PLACES},{key:"fadhila",label:"فضيلة",options:PLACES},{key:"sboui",label:"السبوعي",options:PLACES}],
    explain:{prompt:"فسّر كيفاش استنتجت البلايص باستعمال الاستبعاد وقاعدة شخص واحد لكل بلاصة.",required:false},
  },
  {
    id:4,title:"تبّع الثنيّة",envelope:"الظرف الرابع تبّع الثنيّة",
    story:"السبوعي خلّى خريطة وورقة فيها ثنيّة. كل حركة خانة وحدة. اليمين واليسار كيفما تشوفهم قدّامك؛ ما تقلبش الخريطة وما تدورهاش. وين توصل تلقى البلاصة اللي نلوجوا عليها.",
    blocks:[
      {type:"table",spatial:true,title:"خريطة الدار",headers:["جهة اليمين","الوسط","جهة اليسار"],rows:[["المدخل","الصالة","بيت النوم"],["بيت السطح","الكوجينة","خزانة الكوجينة"],["البلكون","الممر","بيت الماء"]]},
      {type:"note",title:"ورقة السبوعي",lines:["ابدا من المدخل.","امشي خانة لتحت.","بعد خانة لليسار.","بعد خانة لتحت.","بعد خانة لليسار.","وفي الآخر خانة لفوق."],footer:"ما تقفزش حتى خانة. سمّي البلاصة بالضبط، موش الجهة برك."},
    ],
    fields:[{key:"place",label:"وين وصّلك المسار",placeholder:"اسم البلاصة بالضبط"}],
    explain:{prompt:"فسّر منين بديت وكيفاش تبعت الحركات لين وصلت للبلاصة.",required:false},
  },
  {
    id:5,title:"قفل السبوعي",envelope:"الظرف الخامس قفل السبوعي",
    story:"العلبة مسكّرة بقفل فيه ثلاثة أرقام مختلفين. كل سطر يحدّد بالضبط قدّاش من رقم موجود وقدّاش في بلاصتو. استعملوا المحاولات الكلّ، والرمز يتقرا من اليسار لليمين.",
    blocks:[{type:"table",title:"محاولات القفل",headers:["المحاولة","شنوة نعرفوا عليها"],shuffle:true,rows:[
      ["٤٠١","رقم واحد صحيح وفي بلاصتو، والزوز الآخرين موش في الرمز."],
      ["٤٢٧","رقم واحد صحيح أما موش في بلاصتو، والزوز الآخرين موش في الرمز."],
      ["١٣٤","زوز أرقام صحيحين أما الزوز موش في بلايصهم، والثالث موش في الرمز."],
      ["٦٥٠","حتى رقم موش موجود في الرمز."],
      ["٦٠٣","رقم واحد صحيح أما موش في بلاصتو، والزوز الآخرين موش في الرمز."],
    ]}],
    fields:[{key:"code",label:"شنوة رمز القفل",placeholder:"ثلاثة أرقام"}],
    explain:{prompt:"فسّر الأرقام اللي نحّيتها وكيفاش عرفت بلاصة كل رقم في الرمز.",required:false},
  },
];
export const REPORT_FIELDS: Field[] = [
  {key:"who",label:"شكون ترجّح خبّى مفتاح السطح"},{key:"folder",label:"شنوة لون العلبة"},{key:"place",label:"وين العلبة مخبيّة"},
  {key:"check",label:"وقتاش تكتبت التفقيدة",placeholder:"ساعة ودقيقة"},{key:"sighting",label:"وقتاش آخر رؤية مباشرة للمفتاح",placeholder:"ساعة ودقيقة"},{key:"key",label:"شنوة رمز القفل",placeholder:"ثلاثة أرقام"},
];
export const REPORT_TEXT_FIELDS: Field[] = [
  {key:"evidence",label:"شنوة أقوى قرائن عندكم وكيفاش ربطتوهم؟ فسّر في جملتين ولا ثلاثة."},
  {key:"noprove",label:"شنوة ورقة التفقيدة ما تنجمش تثبت؟"},
  {key:"verify",label:"تثبّت أخير: ورقة تفقيدة الدار على 18:20 تكفي باش نقولو المفتاح كان حاضر وقتها؟ علاش؟"},
];
function arrange<T>(variant:Variant,items:T[]):T[]{if(variant==="B")return [...items].reverse();if(variant==="C")return [...items.slice(2),...items.slice(0,2)];return [...items];}
export function getPuzzle(id:number,variant:Variant):PuzzleDef|null {
  const base=PUZZLES.find(p=>p.id===id);if(!base)return null;
  return {...base,blocks:base.blocks.map((b):Block=>{
    if(b.type==="cards")return {...b,cards:b.shuffle?arrange(variant,b.cards):b.cards};
    if(b.type==="list")return {...b,items:b.shuffle?arrange(variant,b.items):b.items};
    if(b.type==="table")return {...b,rows:b.shuffle?arrange(variant,b.rows):b.rows};
    return b;
  })};
}
export const PUZZLE_COUNT=PUZZLES.length;
