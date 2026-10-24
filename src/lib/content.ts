// Public puzzle material only. Solutions and hints remain server-side in keys.ts.
export type Variant = "A" | "B" | "C";
export interface Card { id: string; badge?: string; title?: string; text: string; meta?: string }
export type Block =
  | { type: "cards"; title?: string; cards: Card[]; shuffle?: boolean }
  | { type: "list"; title?: string; items: string[]; shuffle?: boolean }
  | { type: "note"; title?: string; lines: string[]; footer?: string; numbered?: boolean }
  | { type: "table"; title?: string; headers: string[]; rows: string[][]; shuffle?: boolean; spatial?: boolean }
  | { type: "callout"; text: string };
export interface Field { key: string; label: string; hint?: string; placeholder?: string; options?: { value: string; label: string }[] }
export interface PuzzleDef {
  id: 1 | 2 | 3 | 4 | 5; title: string; envelope: string; story: string;
  blocks: Block[]; fields: Field[]; explain: { prompt: string; required: boolean };
}
export const STORY_INTRO = "!!!في دار سليمان، الجماعة يحضّروا لسهرية فوق السطح. أما مفتاح السطح ما عادش موجود فوق الطاولة! سليمان والسبوعي وعزة وفضيلة كانوا في الدار. قدّامكم خمسة ظروف: رتبو الأوقات، احسبوا , تبّعوا التشنشينات وشوفولنا حلّ";
const PLACES = [{ value: "", label: "اختار البلاصة" }, ...["باب الدار", "الصالة", "السطح", "الكوجينة"].map(value => ({value, label:value}))];
const PUZZLES: PuzzleDef[] = [
  {
    id:1, title:"وقتاش ضاع المفتاح", envelope:"الظرف الأوّل وقتاش ضاع المفتاح",
    story:"الأوقات تخلّطت على الجماعة. استخرجوا وقتاش ضاع المفتاح وآخر مرة شفنا فاها المفتاح . ورقة التثبّت العامّة موش كيف شهادة واحد شاف المفتاح بعينو.",
    blocks:[{type:"cards",title:"شنوة صار في الدار",shuffle:true,cards:[
      {id:"p1-slimane",badge:"1",title:"سليمان",text:"خرجت من الدار على 18:00، ورجعت بعد اثناش دقيقة بالضبط."},
      {id:"p1-azza",badge:"2",title:"عزة",text:"كي رجع سليمان، شفت مفتاح السطح بعيني فوق طاولة الصالة. هاذي آخر شهادة مباشرة موجودة في الملف."},
      {id:"p1-check",badge:"3",title:"ورقة التثبّت",text:"بعد رجوع سليمان بثمانية دقايق، تسجّل التثبّت للضو والباب والكراسي. المفتاح ما تذكرش   ."},
      {id:"p1-fadhila",badge:"4",title:"فضيلة",text:"بعد التثبّت بخمسة دقايق، جيت باش ناخذ مفتاح السطح من الطاولة وما لقيتوش."},
    ]}],
    fields:[{key:"check",label:"وقتاش تسجّل التثبّت",placeholder:"مثال 18:00"},{key:"sighting",label:"وقتاش آخر مرّة تشاف المفتاح مباشرة",placeholder:"ساعة ودقيقة"}],
    explain:{prompt:"فسّر كيفاش حسبت الوقتين وعلاش التثبّت موش دليل على وجود المفتاح.",required:false},
  },
  {
    id:2,title:"قفة فضيلة",envelope:"الظرف الثاني قفة فضيلة",
    story:"السبوعي خلّى وصل ممضي باسمو: «هزيت القفة و مشيت للسوق، خلّصت بخمسة آلاف مليم، ولون العلبة اللي شريتها موجود في جدول الباقي». احسبوا سوم القفة والباقي باش تعرفوا لون العلبة.    .",
    blocks:[
      {type:"table",title:"الجواب الي في القفة",headers:["الحاجة","قدّاش من وحدة","سوم الوحدة بالمليم"],shuffle:true,rows:[["خبز","2","500"],["حليب","1","1350"],["سكّر","1","1650"]]},
      {type:"table",title:"جدول الباقي والألوان",headers:["الباقي بالمليم","لون العلبة"],rows:[["500","أحمر"],["1000","أزرق"],["1500","أخضر"],["2000","أصفر"]]},
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
      ["401","رقم واحد صحيح وفي بلاصتو، والزوز الآخرين موش في الرمز."],
      ["427","رقم واحد صحيح أما موش في بلاصتو، والزوز الآخرين موش في الرمز."],
      ["134","زوز أرقام صحيحين أما الزوز موش في بلايصهم، والثالث موش في الرمز."],
      ["650","حتى رقم موش موجود في الرمز."],
      ["603","رقم واحد صحيح أما موش في بلاصتو، والزوز الآخرين موش في الرمز."],
    ]}],
    fields:[{key:"code",label:"شنوة رمز القفل",placeholder:"ثلاثة أرقام"}],
    explain:{prompt:"فسّر الأرقام اللي نحّيتها وكيفاش عرفت بلاصة كل رقم في الرمز.",required:false},
  },
];
export const REPORT_FIELDS: Field[] = [
  {key:"who",hint:"ارجع الجواب الي في القفة: شكون ممضيه؟ اربط الاسم بالبلاصة اللي استنتجتوها في لغز شكون كان وين. هاذي قرائن ترجّح شخص، موش اعتراف.",label:"شكون ترجّح خبّى مفتاح السطح"},{key:"folder",hint:"تذكّر قفة فضيلة: 2 خبز بسوم 500 للوحدة، حليب 1350 وسكّر 1650. انقص المجموع من 5000، وبعد شوف لون الباقي في الجدول متاع الظرف الثاني.",label:"شنوة لون العلبة"},{key:"place",hint:"ارجع لخريطة الظرف الرابع: من المدخل، لتحت، لليسار، لتحت، لليسار، ولفوق. كل حركة خانة وحدة. المطلوب اسم البلاصة اللي وقفت فيها، موش الغرفة برك.",label:"وين العلبة مخبيّة"},
  {key:"check",hint:"سليمان خرج على 18:00 ورجع بعد 12 دقيقة. التثبّت تسجّل بعد رجوعو بثمانية دقايق. اجمع المدّتين واكتب الوقت.",label:"وقتاش تسجّل التثبّت",placeholder:"ساعة ودقيقة"},{key:"sighting",hint:"عزة شافت المفتاح كي رجع سليمان. خرج على 18:00 ورجع بعد 12 دقيقة. ما تخلطش وقت الرؤية بوقت التثبّت.",label:"وقتاش آخر رؤية مباشرة للمفتاح",placeholder:"ساعة ودقيقة"},{key:"key",hint:"هذا نفس رمز القفل اللي حلّيتوه في الظرف الخامس: 3 أرقام مختلفين، يتقراو من اليسار لليمين. راجع محاولات القفل في الظرف المحلول إذا نسيت الترتيب.",label:"شنوة رمز القفل",placeholder:"ثلاثة أرقام"},
];
export const REPORT_TEXT_FIELDS: Field[] = [
  {key:"evidence",hint:"اربط نتيجة كل ظرف: الأوقات، لون العلبة من الباقي، توزيع الأشخاص، نهاية المسار ورمز القفل. فسّر كيفاش القرائن مع بعضهم ترجّح نفس الحكاية.",label:"شنوة أقوى قرائن عندكم وكيفاش ربطتوهم؟ فسّر في جملتين ولا ثلاثة."},
  {key:"noprove",hint:"راجع شنوة تذكر في ورقة التثبّت: الضو والباب والكراسي. هل المفتاح مذكور فيها؟ فرّق بين التثبّت العام وشهادة عزة اللي شافت المفتاح بعينها.",label:"شنوة ورقة التثبّت ما تنجمش تثبت؟"},
  {key:"verify",hint:"فرّق بين معلومة مكتوبة في ورقة ومعلومة شافها شاهد مباشرة. قارن محتوى ورقة التثبّت بشهادة عزة، وبعد جاوب على وجود المفتاح في الوقت هذاك مع التعليل.",label:"تثبّت أخير: ورقة التثبّت في الدار على 18:20 تكفي باش نقولو المفتاح كان حاضر وقتها؟ علاش؟"},
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
