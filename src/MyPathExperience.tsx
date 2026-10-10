import { useEffect, useMemo, useState } from "react";

type AxisId = "A" | "B" | "C" | "D" | "E" | "F";
type AnswerMap = Record<string, string>;
type PathData = {
  version: 1;
  userKey: string;
  createdAt: string;
  updatedAt: string;
  initialAnswers: Record<number, number>;
  followupAnswers: AnswerMap;
  stage: 1 | 2 | 3 | 4;
  completedStages: number[];
  primaryAxis: AxisId | null;
  secondaryAxis: AxisId | null;
  exercise: string;
  stage3: { action: string; outcome: string; barrier: string; revised: string };
  stage4: { clear: string; learning: string; next: string };
};
type Option = { label: string; axes: AxisId[] };
type Question = { id: string; title: string; options: Option[] };
type Axis = { id: AxisId; title: string; short: string; questions: string[]; exercise: string };

const AXES: Axis[] = [
  { id: "A", title: "خودشناسی", short: "شناخت خواسته‌ها، ارزش‌ها و اولویت‌های خودت", questions: [
    "در چه موقعیت‌هایی بیشتر احساس می‌کنی خود واقعی‌ات هستی؟",
    "کدام ارزش برایت مهم‌تر است: آزادی، امنیت، رشد، ارتباط یا آرامش؟",
    "چه چیزی در زندگی فعلی‌ات با خواستهٔ واقعی تو فاصله دارد؟",
    "اگر ترس از قضاوت دیگران کمتر بود، چه انتخابی را جدی‌تر بررسی می‌کردی؟",
    "دوست داری در پایان این مسیر چه شناخت تازه‌ای دربارهٔ خودت به دست بیاوری؟"
  ], exercise: "سه ارزش مهم خودت را انتخاب کن و برای هرکدام یک اقدام کوچک و هماهنگ با آن بنویس." },
  { id: "B", title: "روابط و مرزهای شخصی", short: "شناخت نیازها و بیان محترمانهٔ آن‌ها در ارتباط‌ها", questions: [
    "بیان نیازهایت برای تو معمولاً چقدر آسان است؟",
    "وقتی با خواستهٔ کسی موافق نیستی، معمولاً چه می‌کنی؟",
    "در یک رابطهٔ سالم، کدام ویژگی برایت ضروری‌تر است؟",
    "وقتی از کسی ناراحت می‌شوی، ترجیح می‌دهی گفت‌وگو کنی، فاصله بگیری یا زمان بخواهی؟",
    "دوست داری در ارتباط‌هایت کدام رفتار را بیشتر تمرین کنی؟"
  ], exercise: "یک نیاز یا مرز شخصی را بنویس و یک جملهٔ محترمانه برای بیان آن تمرین کن." },
  { id: "C", title: "آرامش ذهن و شناخت احساسات", short: "شناخت احساسات و فشارهای روزمره با مهربانی نسبت به خود", questions: [
    "چه موقعیت‌هایی بیشتر باعث شلوغی ذهن تو می‌شوند؟",
    "وقتی تحت فشار هستی، چه چیزی معمولاً به تو کمک می‌کند؟",
    "تشخیص احساساتت برایت آسان است یا به زمان نیاز داری؟",
    "در طول روز چه زمانی بیشتر احساس آرامش می‌کنی؟",
    "دوست داری کدام عادت کوچک را برای مراقبت از خودت ایجاد کنی؟"
  ], exercise: "برای چند روز، احساس، موقعیت ایجادکنندهٔ آن و یک اقدام آرام‌کننده را کوتاه ثبت کن." },
  { id: "D", title: "تصمیم‌گیری و اقدام", short: "کمک به انتخاب قدم‌های کوچک و عملی، بدون نیاز به تصمیم کامل", questions: [
    "در تصمیم‌های مهم بیشتر از چه چیزی نگران می‌شوی؟",
    "معمولاً اطلاعات بیشتری جمع می‌کنی یا منتظر می‌مانی احساس اطمینان پیدا کنی؟",
    "اگر نتوانی تصمیم کاملی بگیری، چه چیزی می‌تواند به انتخاب یک قدم کوچک کمک کند؟",
    "چه تصمیمی را مدتی است عقب انداخته‌ای؟",
    "کوچک‌ترین اقدام امن و عملی که می‌توانی این هفته انجام دهی چیست؟"
  ], exercise: "یک تصمیم کوچک را تعریف کن، برای قدم اول زمان مشخص بگذار و بعد نتیجه را مرور کن." },
  { id: "E", title: "هدف و مسیر آینده", short: "روشن‌کردن جهت شخصی و حرکت در اندازه‌ای شدنی", questions: [
    "دوست داری شش ماه آینده چه تفاوتی در زندگی‌ات ایجاد شده باشد؟",
    "کدام فعالیت به تو احساس معنا یا رضایت می‌دهد؟",
    "کدام مانع بیشتر بین تو و هدفت قرار دارد؟",
    "هدف فعلی‌ات چقدر با ارزش‌های شخصی تو هماهنگ است؟",
    "چه قدمی را می‌توانی بدون نیاز به تغییر بزرگ آغاز کنی؟"
  ], exercise: "یک هدف کوتاه‌مدت انتخاب کن و آن را به سه قدم کوچک و قابل‌اجرا تقسیم کن." },
  { id: "F", title: "عادت و استمرار", short: "ساختن عادت‌های کوچک و قابل‌ادامه، بدون سرزنش خود", questions: [
    "شروع‌کردن برایت سخت‌تر است یا ادامه‌دادن؟",
    "چه چیزی معمولاً باعث می‌شود برنامه‌ات نیمه‌کاره بماند؟",
    "برای یک عادت جدید، چه زمانی از روز برایت عملی‌تر است؟",
    "کوچک‌ترین نسخهٔ قابل‌انجام آن عادت چیست؟",
    "چه نشانه‌ای به تو نشان می‌دهد که در حال پیشرفت هستی؟"
  ], exercise: "یک عادت بسیار کوچک انتخاب کن و هفت روز انجامش را ثبت کن؛ وقفه هم بخشی از یادگیری است." }
];

const INITIAL: Question[] = [
  { id: "q1", title: "حال این روزهای من", options: [
    { label: "احساس می‌کنم در آستانهٔ یک تغییرم.", axes: ["D","E"] },
    { label: "ذهنم شلوغ است و به وضوح بیشتری نیاز دارم.", axes: ["C","A","D"] },
    { label: "از نظر احساسی خسته‌ام.", axes: ["C"] },
    { label: "می‌خواهم خودم را بهتر بشناسم.", axes: ["A"] },
    { label: "در مسیرم هستم، اما دنبال قدم بعدی‌ام.", axes: ["D","E","F"] },
    { label: "هنوز دقیق نمی‌دانم چه احساسی دارم.", axes: ["A","C"] }
  ]},
  { id: "q2", title: "چیزی که می‌خواهم تغییر دهم", options: [
    { label: "شناخت خودم و خواسته‌هایم", axes: ["A"] },
    { label: "روابط عاطفی و ارتباط با دیگران", axes: ["B"] },
    { label: "آرامش ذهن و احساساتم", axes: ["C"] },
    { label: "اعتمادبه‌نفس و تصمیم‌گیری", axes: ["D"] },
    { label: "کار، هدف و مسیر آینده", axes: ["E"] },
    { label: "تعادل و کیفیت زندگی روزمره", axes: ["F","C"] }
  ]},
  { id: "q3", title: "شیوهٔ مواجههٔ من با مسائل", options: [
    { label: "زیاد فکر می‌کنم و جوانب مختلف را می‌سنجم.", axes: ["A","D"] },
    { label: "بیشتر به احساس درونی‌ام توجه می‌کنم.", axes: ["C","A"] },
    { label: "با دیگران مشورت می‌کنم.", axes: ["B"] },
    { label: "گاهی تصمیم‌گیری را عقب می‌اندازم.", axes: ["D"] },
    { label: "سعی می‌کنم سریع وارد عمل شوم.", axes: ["D","E"] },
    { label: "بسته به موقعیت، واکنش متفاوتی دارم.", axes: ["A"] }
  ]},
  { id: "q4", title: "الگویی که در خودم می‌بینم", options: [
    { label: "گاهی نیازهای دیگران را جلوتر از خودم می‌گذارم.", axes: ["B","A"] },
    { label: "برای شروع کارها انگیزه دارم، اما ادامه‌دادن سخت می‌شود.", axes: ["F"] },
    { label: "در انتخاب بین چند مسیر مردد می‌شوم.", axes: ["D","E"] },
    { label: "از اشتباه‌کردن یا قضاوت‌شدن نگران می‌شوم.", axes: ["D","B"] },
    { label: "معمولاً کارها را خوب مدیریت می‌کنم، اما به استراحت نیاز دارم.", axes: ["C","F"] },
    { label: "هنوز الگوی مشخصی در خودم پیدا نکرده‌ام.", axes: ["A"] }
  ]},
  { id: "q5", title: "هدیهٔ این مسیر برای من", options: [
    { label: "شناخت روشن‌تری از خودم", axes: ["A"] },
    { label: "آرامش و ارتباط بهتر با احساساتم", axes: ["C"] },
    { label: "توانایی ساختن روابط سالم‌تر", axes: ["B"] },
    { label: "جرئت انتخاب و اقدام", axes: ["D"] },
    { label: "پیداکردن جهت و هدف شخصی", axes: ["E"] },
    { label: "عادت‌های بهتر و استمرار بیشتر", axes: ["F"] }
  ]}
];

function blankPath(userKey: string): PathData {
  const now = new Date().toISOString();
  return { version: 1, userKey, createdAt: now, updatedAt: now, initialAnswers: {}, followupAnswers: {}, stage: 1, completedStages: [], primaryAxis: null, secondaryAxis: null, exercise: "", stage3: { action: "", outcome: "", barrier: "", revised: "" }, stage4: { clear: "", learning: "", next: "" } };
}
function scoreAxes(initial: Record<number, number>, followup: AnswerMap) {
  const scores: Record<AxisId, number> = { A:0, B:0, C:0, D:0, E:0, F:0 };
  Object.entries(initial).forEach(([q, option]) => {
    const item = INITIAL[Number(q)]?.options[option];
    item?.axes.forEach(axis => { scores[axis] += Number(q) === 1 ? 3 : 1; });
  });
  Object.entries(followup).forEach(([id, answer]) => {
    const [axisId] = id.split(":");
    if (axisId in scores && answer.trim()) scores[axisId as AxisId] += 1;
  });
  const order = AXES.map(a => a.id);
  return order.sort((a,b) => scores[b]-scores[a] || a.localeCompare(b)).map(id => ({ id, score: scores[id] }));
}
function StageArtwork({ stage }: { stage: number }) {
  const common = <><circle cx="90" cy="80" r="54" fill="#f3e8d1"/><circle cx="90" cy="80" r="40" fill="#fffaf0" opacity=".8"/></>;
  return <svg viewBox="0 0 180 150" role="img" aria-label={["نقطهٔ شروع","کشف مسیر","قدم‌های واقعی","رشد و تثبیت"][stage-1]} style={{ width:"100%", height:"auto", maxHeight:150, display:"block" }}>
    {common}
    {stage===1 && <><path d="M90 118 C88 95 91 76 91 54" stroke="#315d42" strokeWidth="4" fill="none" strokeLinecap="round"/><path d="M90 91 C61 90 56 72 59 61 C77 62 91 73 90 91" fill="#76a879"/><path d="M91 75 C113 73 124 57 121 45 C103 46 91 57 91 75" fill="#a9c99b"/><path d="M70 120 Q90 108 110 120" stroke="#c8a66b" strokeWidth="3" fill="none" strokeLinecap="round"/><circle cx="125" cy="30" r="5" fill="#d5ad66"/><path d="M125 18v-5 M125 42v-5 M113 30h-5 M142 30h-5" stroke="#d5ad66" strokeWidth="2" strokeLinecap="round"/></>}
    {stage===2 && <><path d="M33 119 C55 99 70 116 87 94 S120 89 145 43" stroke="#7eaa83" strokeWidth="4" strokeDasharray="4 7" fill="none" strokeLinecap="round"/><circle cx="44" cy="109" r="7" fill="#315d42"/><circle cx="86" cy="95" r="7" fill="#7eaa83"/><circle cx="118" cy="76" r="7" fill="#c6a263"/><path d="M132 39l13 4-3 13" fill="none" stroke="#315d42" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><path d="M54 48l7-9 7 9-7 9z" fill="#c6a263"/><circle cx="37" cy="53" r="3" fill="#7eaa83"/><circle cx="139" cy="104" r="4" fill="#7eaa83"/></>}
    {stage===3 && <><path d="M33 119 Q90 93 147 119" stroke="#c8a66b" strokeWidth="3" fill="none" strokeLinecap="round"/><ellipse cx="57" cy="105" rx="13" ry="7" fill="#b9d0a9" transform="rotate(-18 57 105)"/><ellipse cx="91" cy="97" rx="13" ry="7" fill="#7eaa83" transform="rotate(12 91 97)"/><ellipse cx="124" cy="105" rx="13" ry="7" fill="#d9bd85" transform="rotate(-8 124 105)"/><path d="M91 92 C86 78 88 65 90 52" stroke="#315d42" strokeWidth="4" fill="none" strokeLinecap="round"/><path d="M89 69 C68 70 62 55 66 46 C80 47 90 56 89 69" fill="#7eaa83"/><path d="M90 60 C108 59 117 46 113 37 C99 38 90 47 90 60" fill="#a9c99b"/></>}
    {stage===4 && <><path d="M37 118 C53 101 62 112 77 91 S103 84 115 63 S133 49 146 35" stroke="#315d42" strokeWidth="3" fill="none" strokeLinecap="round"/><path d="M133 34l14 1-1 14" fill="none" stroke="#315d42" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="77" cy="91" r="6" fill="#c8a66b"/><circle cx="115" cy="63" r="6" fill="#7eaa83"/><path d="M57 50l3-7 3 7 7 3-7 3-3 7-3-7-7-3z" fill="#c8a66b"/><path d="M121 106l2-5 2 5 5 2-5 2-2 5-2-5-5-2z" fill="#7eaa83"/><circle cx="43" cy="79" r="3" fill="#c8a66b"/></>}
  </svg>;
}

export default function MyPathExperience({ onBack, entry = "main" }: { onBack: () => void; entry?: "main" | "vip" }) {
  const [userKey, setUserKey] = useState<string | null>(null);
  const [identityLabel, setIdentityLabel] = useState("در حال بررسی هویت");
  const [identityError, setIdentityError] = useState("");
  const [data, setData] = useState<PathData | null>(null);
  const [identityLoaded, setIdentityLoaded] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [followupDraft, setFollowupDraft] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [showEditInitial, setShowEditInitial] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const w = window as any;
        const initUser = w.Telegram?.WebApp?.initDataUnsafe?.user?.id;
        const response = await (async () => {
          const initData = w.Telegram?.WebApp?.initData || "";
          if (!initData) return null;
          const res = await fetch("https://script.google.com/macros/s/AKfycbySl6RH5K7oTLBus2cjvBJuOv-ZTjIhX9OnIq93gifQng1IfMl7f2A3Bl-7pSx1nC1u/exec", { method:"POST", headers:{ "Content-Type":"text/plain;charset=UTF-8" }, body:JSON.stringify({ initData, action:"load" }) });
          return await res.json();
        })();
        if (!alive) return;
        const trustedId = response?.success && response?.customer ? String(response.customer.telegramId || response.customer.id || "") : "";
        const key = trustedId ? "vip:" + trustedId : (initUser ? "telegram-local:" + String(initUser) : null);
        if (!key) {
          setIdentityError("برای ذخیرهٔ مسیر شخصی، اپ را از داخل تلگرام باز کن. در حال حاضر هیچ پاسخی ذخیره نشده است.");
          setIdentityLoaded(true);
          return;
        }
        setUserKey(key);
        setIdentityLabel(trustedId ? "حساب متصل‌شده" : "ذخیرهٔ محلی روی همین دستگاه");
        const storageKey = "kaenatchi-my-path-user-v1:" + key;
        let loaded: PathData | null = null;
        try {
          const raw = localStorage.getItem(storageKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.version === 1 && parsed.userKey === key && parsed.initialAnswers && parsed.followupAnswers && Array.isArray(parsed.completedStages)) loaded = parsed as PathData;
          }
        } catch {}
        if (!alive) return;
        setData(loaded || blankPath(key));
        setIdentityLoaded(true);
      } catch {
        if (alive) {
          setIdentityError("ارتباط برقرار نشد؛ پاسخ‌ها هنوز ذخیره نشده‌اند. دوباره تلاش کن.");
          setIdentityLoaded(true);
        }
      }
    })();
    return () => { alive = false; };
  }, [refreshKey]);

  const scores = useMemo(() => data ? scoreAxes(data.initialAnswers, data.followupAnswers) : [], [data]);
  const primaryId = data?.primaryAxis || scores[0]?.id || null;
  const secondaryId = data?.secondaryAxis || scores.find(x => x.id !== primaryId)?.id || null;
  const primary = AXES.find(a => a.id === primaryId);
  const secondary = AXES.find(a => a.id === secondaryId);
  const completedInitial = data ? INITIAL.every((_, i) => Number.isInteger(data.initialAnswers[i])) : false;
  const followups = data ? Object.keys(data.followupAnswers).filter(k => data.followupAnswers[k]?.trim()) : [];
  const completedFollowups = followups.length >= 5;
  const nextFollowup = useMemo(() => {
    if (!data) return null;
    const ranking = scoreAxes(data.initialAnswers, data.followupAnswers);
    const answeredCount = Object.values(data.followupAnswers).filter(value => value.trim()).length;
    const primary = ranking[0]?.id || "A";
    const secondary = ranking[1]?.id;
    const preferred = answeredCount % 3 === 2 && secondary ? [secondary, primary] : [primary, secondary];
    const candidates = [...preferred, ...ranking.map(item => item.id)].filter((id, index, all): id is AxisId => Boolean(id) && all.indexOf(id) === index);
    for (const id of candidates) {
      const axis = AXES.find(item => item.id === id);
      if (!axis) continue;
      for (let index = 0; index < axis.questions.length; index += 1) {
        const key = id + ":" + index;
        if (!data.followupAnswers[key]?.trim()) return { axis, index, key, answeredCount };
      }
    }
    return null;
  }, [data]);
  useEffect(() => {
    setFollowupDraft(nextFollowup && data ? data.followupAnswers[nextFollowup.key] || "" : "");
  }, [data?.userKey, nextFollowup?.key, data?.updatedAt]);
  const currentStage = data?.stage || 1;
  const stageNames = ["نقطهٔ شروع شخصی", "کشف مسیر اختصاصی", "تمرین در زندگی واقعی", "تثبیت رشد"];
  const persist = (next: PathData, successText: string) => {
    if (!userKey) { setMessage("هویت معتبر در دسترس نیست؛ چیزی ذخیره نشد."); return; }
    setSaving(true);
    try {
      localStorage.setItem("kaenatchi-my-path-user-v1:" + userKey, JSON.stringify({ ...next, updatedAt: new Date().toISOString() }));
      setData({ ...next, updatedAt: new Date().toISOString() });
      setMessage(successText);
    } catch {
      setMessage("ذخیره انجام نشد؛ فضای ذخیره‌سازی در دسترس نیست. پاسخ‌ها به‌عنوان ثبت‌شده نمایش داده نمی‌شوند.");
    } finally { setSaving(false); }
  };
  const answerInitial = (index: number, option: number) => {
    if (!data) return;
    const answers = { ...data.initialAnswers, [index]: option };
    const ranked = scoreAxes(answers, data.followupAnswers);
    const next: PathData = { ...data, initialAnswers: answers, primaryAxis: ranked[0]?.id || null, secondaryAxis: ranked[1]?.id || null, stage: data.stage, completedStages: data.completedStages.filter(n => n !== 1) };
    persist(next, "پاسخت روی همین دستگاه ذخیره شد.");
  };
  const startFollowups = () => {
    if (!data || !completedInitial) return;
    const ranked = scoreAxes(data.initialAnswers, data.followupAnswers);
    const next = { ...data, primaryAxis: ranked[0]?.id || "A", secondaryAxis: ranked[1]?.id || "C", stage: 2 as const, completedStages: data.completedStages.filter(n => n !== 2) };
    persist(next, "محورهای فعلی مسیرت مشخص شدند؛ می‌توانی سؤال‌های تکمیلی را شروع کنی.");
    setQuestionIndex(0);
    setShowEditInitial(false);
  };
  const answerFollowup = (axisId: AxisId, qIndex: number, answer: string) => {
    if (!data) return;
    const key = axisId + ":" + qIndex;
    const answers = { ...data.followupAnswers, [key]: answer };
    const ranked = scoreAxes(data.initialAnswers, answers);
    const next = { ...data, followupAnswers: answers, primaryAxis: ranked[0]?.id || axisId, secondaryAxis: ranked.find(x => x.id !== ranked[0]?.id)?.id || null, stage: 2 as const };
    persist(next, "پاسخ تکمیلی ذخیره شد.");
    setMessage("");
    const count = Object.keys(answers).filter(k => answers[k]?.trim()).length;
    setQuestionIndex(count % 5);
  };
  const markStage = (stage: number) => {
    if (!data) return;
    const completed = Array.from(new Set([...data.completedStages, stage])).sort();
    const nextStage = Math.min(4, stage + 1) as 1|2|3|4;
    const next = { ...data, completedStages: completed, stage: nextStage };
    persist(next, "پیشرفت این مرحله روی همین دستگاه ذخیره شد.");
  };
  const update = (patch: Partial<PathData>) => { if (data) persist({ ...data, ...patch }, "تغییرات ذخیره شد."); };
  const stageReady = (n: number) => n === 1 || (data?.completedStages.includes(n-1) ?? false);
  const cardStyle: React.CSSProperties = { border:"1px solid rgba(49,93,66,.15)", borderRadius:22, background:"rgba(255,253,247,.88)", padding:16, boxShadow:"0 10px 28px rgba(49,75,52,.07)" };
  const buttonStyle: React.CSSProperties = { border:0, borderRadius:15, padding:"13px 16px", background:"linear-gradient(135deg,#174b38,#3b7957)", color:"#fff", fontFamily:"inherit", fontSize:14, fontWeight:700, cursor:"pointer", width:"100%" };
  const softButton: React.CSSProperties = { border:"1px solid rgba(49,93,66,.2)", borderRadius:14, padding:"11px 14px", background:"rgba(49,93,66,.06)", color:"#315d42", fontFamily:"inherit", fontSize:13, fontWeight:700, cursor:"pointer", width:"100%" };

  return <div className="inner-page selected-growth-page" dir="rtl" style={{ display:"grid", gap:14 }}>
    <button type="button" onClick={onBack} style={{ border:0, background:"transparent", textAlign:"right", color:"inherit", fontFamily:"inherit", padding:"4px 0", cursor:"pointer" }}>← بازگشت {entry === "vip" ? "به VIP" : "به مسیر من"}</button>
    <section style={{ ...cardStyle, overflow:"hidden", position:"relative", background:"linear-gradient(140deg,#f8f0df,#fffdf6 55%,#e5efdf)" }}>
      <div style={{ position:"absolute", top:-35, left:-30, width:120, height:120, borderRadius:"50%", background:"rgba(126,170,131,.12)" }} />
      <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr) minmax(100px,150px)", alignItems:"center", gap:8, position:"relative" }}>
        <div><span style={{ fontSize:11, letterSpacing:1.4, color:"#63836a", fontWeight:800 }}>YOUR PERSONAL PATH</span><h1 style={{ margin:"7px 0", fontSize:25, color:"#244b35" }}>مسیر من</h1><p style={{ margin:0, lineHeight:1.9, fontSize:13, color:"#4e6450" }}>مسیر تو با پاسخ‌ها و انتخاب‌های خودت شکل می‌گیرد؛ نه با یک برچسب ثابت.</p></div>
        <StageArtwork stage={currentStage}/>
      </div>
      <div style={{ marginTop:14, borderTop:"1px solid rgba(49,93,66,.13)", paddingTop:12, display:"flex", justifyContent:"space-between", gap:8, flexWrap:"wrap", fontSize:12, color:"#315d42" }}><span>مرحلهٔ {currentStage} از ۴</span><span>{data?.completedStages.length || 0} مرحله تکمیل‌شده</span><span>{identityLabel}</span></div>
      <div style={{ height:5, borderRadius:9, background:"rgba(49,93,66,.12)", overflow:"hidden", marginTop:9 }}><div style={{ width:((data?.completedStages.length || 0)/4*100)+"%", height:"100%", background:"#477b53", transition:"width .25s" }}/></div>
    </section>
    {!identityLoaded && <div style={cardStyle} role="status">در حال آماده‌سازی مسیر شخصی…</div>}
    {identityError && <div style={{ ...cardStyle, color:"#8b5548", lineHeight:1.9 }} role="alert">{identityError}<button style={{ ...softButton, marginTop:10 }} onClick={() => { setIdentityError(""); setIdentityLoaded(false); setRefreshKey(k=>k+1); }}>تلاش دوباره</button></div>}
    {identityLoaded && !identityError && data && <>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:7 }}>
        {stageNames.map((name,i) => { const n=i+1; const done=data.completedStages.includes(n); const locked=!stageReady(n); return <button key={name} type="button" disabled={locked} onClick={()=>{update({stage:n as 1|2|3|4}); setShowStagePicker(false);}} style={{ border: currentStage===n ? "1.5px solid #477b53" : "1px solid rgba(49,93,66,.15)", borderRadius:15, background:done?"#e4efdf":"#fffaf0", padding:"9px 4px", cursor:locked?"not-allowed":"pointer", opacity:locked ? .52 : 1, color:"#315d42", fontFamily:"inherit", minWidth:0 }}>
          <div style={{ height:57, display:"grid", placeItems:"center" }}><StageArtwork stage={n}/></div><strong style={{ fontSize:11, display:"block", lineHeight:1.5 }}>{n.toLocaleString("fa-IR")}. {name}</strong><span style={{ fontSize:10, display:"block", marginTop:4 }}>{done?"تکمیل‌شده":currentStage===n?"در حال انجام":locked?"هنوز باز نشده":"آماده"}</span>
        </button>; })}
      </div>
      {message && <div role="status" style={{ ...cardStyle, fontSize:12, lineHeight:1.8, color:"#315d42" }}>{message}</div>}
      {currentStage===1 && <section style={cardStyle}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}><div style={{ width:74, flexShrink:0 }}><StageArtwork stage={1}/></div><div><span style={{ color:"#63836a", fontSize:11, fontWeight:800 }}>LEVEL 01 · BEGIN</span><h2 style={{ margin:"4px 0", color:"#244b35" }}>نقطهٔ شروع شخصی</h2><p style={{ margin:0, fontSize:12, lineHeight:1.8, color:"#667364" }}>پنج پاسخ اختیاری؛ هر پاسخ را هر زمان خواستی می‌توانی تغییر بدهی.</p></div></div>
        {INITIAL.map((q,i)=><div key={q.id} style={{ marginTop:20 }}><h3 style={{ fontSize:15, lineHeight:1.8, margin:"0 0 10px" }}>{(i+1).toLocaleString("fa-IR")}. {q.title}</h3><div style={{ display:"grid", gap:8 }}>{q.options.map((opt,j)=>{const chosen=data.initialAnswers[i]===j;return <button key={opt.label} type="button" onClick={()=>answerInitial(i,j)} style={{ textAlign:"right", border:chosen?"1.5px solid #477b53":"1px solid rgba(49,93,66,.15)", borderRadius:13, padding:"12px 13px", background:chosen?"#e8f0e3":"#fffdf7", color:"#344a38", fontFamily:"inherit", fontSize:13, lineHeight:1.8, cursor:"pointer" }}><span style={{ display:"inline-grid", placeItems:"center", width:21, height:21, borderRadius:"50%", marginLeft:8, background:chosen?"#477b53":"#eee8d9", color:chosen?"white":"#657665", fontSize:11 }}>{chosen?"✓":(j+1).toLocaleString("fa-IR")}</span>{opt.label}</button>})}</div></div>)}
        {completedInitial && <div style={{ marginTop:20, borderRadius:16, padding:14, background:"#edf3e8" }}><strong style={{ color:"#315d42" }}>نقطهٔ شروع تو، بر اساس ترکیب پاسخ‌ها</strong><p style={{ lineHeight:1.9, fontSize:13 }}>به نظر می‌رسد فعلاً محور «{AXES.find(a=>a.id===scoreAxes(data.initialAnswers,{} )[0]?.id)?.title}» می‌تواند شروع مناسبی باشد. این فقط پیشنهاد اولیه بر اساس پاسخ‌های توست و با اطلاعات تازه تغییر می‌کند.</p><button type="button" style={buttonStyle} onClick={()=>{ const ranked=scoreAxes(data.initialAnswers,data.followupAnswers); const next={...data, primaryAxis:ranked[0]?.id||"A",secondaryAxis:ranked[1]?.id||"C",completedStages:Array.from(new Set([...data.completedStages,1])),stage:2 as const}; persist(next,"مرحلهٔ اول ثبت شد؛ مسیر تکمیلی آماده است."); }}>تأیید نقطهٔ شروع و رفتن به مرحلهٔ بعد ←</button></div>}
      </section>}
      {currentStage===2 && <section style={cardStyle}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}><div style={{ width:74, flexShrink:0 }}><StageArtwork stage={2}/></div><div><span style={{ color:"#63836a", fontSize:11, fontWeight:800 }}>LEVEL 02 · DISCOVER</span><h2 style={{ margin:"4px 0", color:"#244b35" }}>کشف مسیر اختصاصی</h2><p style={{ margin:0, fontSize:12, lineHeight:1.8, color:"#667364" }}>سؤال‌ها از محورهای مرتبط با پاسخ‌های تو انتخاب می‌شوند؛ اگر نیازت تغییر کند، مسیر هم قابل بازبینی است.</p></div></div>
        <div style={{ marginTop:14, padding:13, borderRadius:14, background:"#f0f4e9", lineHeight:1.9 }}><strong>محور اصلی: {primary?.title || "در حال مشخص‌شدن"}</strong><div style={{ fontSize:12, color:"#60705f" }}>محور همراه: {secondary?.title || "هنوز مشخص نیست"}</div></div>
        {(!completedInitial || scores.length===0) && <p style={{ fontSize:13, lineHeight:1.8 }}>برای پیشنهاد دقیق‌تر، ابتدا پنج سؤال نقطهٔ شروع را تکمیل کن.</p>}
        {nextFollowup && !completedFollowups && <>
          <div style={{ marginTop:18, borderRadius:16, padding:14, background:"#fbf7eb" }}>
            <div style={{ display:"flex", justifyContent:"space-between", gap:8, fontSize:11, color:"#63836a", fontWeight:800 }}><span>پرسش تکمیلی · {nextFollowup.axis.title}</span><span>{(nextFollowup.answeredCount+1).toLocaleString("fa-IR")} از ۵</span></div>
            <h3 style={{ fontSize:15, lineHeight:1.9, margin:"10px 0" }}>{nextFollowup.axis.questions[nextFollowup.index]}</h3>
            <textarea value={followupDraft} onChange={e=>setFollowupDraft(e.target.value)} maxLength={800} rows={4} placeholder="پاسخت را با زبان خودت بنویس…" style={{ width:"100%", boxSizing:"border-box", resize:"vertical", border:"1px solid rgba(49,93,66,.2)", borderRadius:13, padding:12, fontFamily:"inherit", fontSize:13, lineHeight:1.9, background:"#fffdf7", color:"#344a38" }}/>
            <button type="button" disabled={!followupDraft.trim()||saving} style={{...buttonStyle,marginTop:10,opacity:(!followupDraft.trim() || saving) ? .55 : 1}} onClick={()=>{if(!data||!nextFollowup||!followupDraft.trim())return;const answers={...data.followupAnswers,[nextFollowup.key]:followupDraft.trim()};const ranked=scoreAxes(data.initialAnswers,answers);persist({...data,followupAnswers:answers,primaryAxis:ranked[0]?.id||nextFollowup.axis.id,secondaryAxis:ranked.find(item=>item.id!==ranked[0]?.id)?.id||null},"پاسخ ثبت شد؛ سؤال بعدی با توجه به پاسخ‌ها انتخاب می‌شود.");setFollowupDraft("");}}>ثبت پاسخ و رفتن به سؤال بعدی ←</button>
            <button type="button" style={{...softButton,marginTop:8}} onClick={()=>setShowEditInitial(v=>!v)}>بازبینی پاسخ‌های اولیه</button>
          </div>
        </>}
        {completedFollowups && <div style={{ marginTop:18, padding:14, background:"#edf3e8", borderRadius:14 }}><strong>تمرین پیشنهادی برای تو</strong><p style={{ lineHeight:1.9, fontSize:13 }}>{primary?.exercise}</p><label style={{display:"block",fontSize:13,fontWeight:700,marginBottom:7}}>تمرینی که انتخاب می‌کنی</label><textarea rows={3} value={data.exercise} onChange={e=>update({exercise:e.target.value})} placeholder="می‌توانی تمرین را مطابق شرایط خودت تغییر بدهی…" style={{width:"100%",boxSizing:"border-box",border:"1px solid rgba(49,93,66,.2)",borderRadius:12,padding:12,fontFamily:"inherit",lineHeight:1.8,background:"#fffdf7"}}/><button type="button" style={{...buttonStyle,marginTop:10}} onClick={()=>markStage(2)}>ثبت تمرین و رفتن به مرحلهٔ سوم ←</button></div>}
      </section>}
      {currentStage===3 && <section style={cardStyle}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}><div style={{ width:74, flexShrink:0 }}><StageArtwork stage={3}/></div><div><span style={{ color:"#63836a", fontSize:11, fontWeight:800 }}>LEVEL 03 · PRACTICE</span><h2 style={{ margin:"4px 0", color:"#244b35" }}>تمرین در زندگی واقعی</h2><p style={{ margin:0, fontSize:12, lineHeight:1.8, color:"#667364" }}>هدف تجربه‌کردن است، نه کامل انجام‌دادن.</p></div></div>
        <p style={{ lineHeight:1.9, fontSize:13, padding:12, borderRadius:13, background:"#f0f4e9" }}>{data.exercise || primary?.exercise || "یک قدم کوچک و شدنی برای خودت انتخاب کن."}</p>
        {[["action","قدم انتخابی من"],["outcome","چه اتفاقی افتاد؟"],["barrier","چه چیزی دشوار بود؟"],["revised","اگر لازم باشد، قدم بعدی را چطور تغییر می‌دهم؟"]].map(([key,label])=><label key={key} style={{display:"block",fontSize:13,fontWeight:700,marginTop:13}}>{label}<textarea rows={2} value={data.stage3[key as keyof PathData["stage3"]]} onChange={e=>update({stage3:{...data.stage3,[key]:e.target.value}})} style={{display:"block",width:"100%",boxSizing:"border-box",marginTop:7,border:"1px solid rgba(49,93,66,.2)",borderRadius:12,padding:12,fontFamily:"inherit",fontSize:13,lineHeight:1.8,background:"#fffdf7"}}/></label>)}
        <button type="button" style={{...buttonStyle,marginTop:18}} disabled={!data.stage3.action.trim()} onClick={()=>markStage(3)}>ثبت تجربه و رفتن به مرحلهٔ چهارم ←</button>
      </section>}
      {currentStage===4 && <section style={cardStyle}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}><div style={{ width:74, flexShrink:0 }}><StageArtwork stage={4}/></div><div><span style={{ color:"#63836a", fontSize:11, fontWeight:800 }}>LEVEL 04 · INTEGRATE</span><h2 style={{ margin:"4px 0", color:"#244b35" }}>تثبیت رشد</h2><p style={{ margin:0, fontSize:12, lineHeight:1.8, color:"#667364" }}>آنچه آموخته‌ای را مرور کن و قدم بعدی را به انتخاب خودت مشخص کن.</p></div></div>
        {[["clear","چه چیزی برایم روشن‌تر شد؟"],["learning","چه چیزی کمک‌کننده یا دشوار بود؟"],["next","قدم بعدی که خودم انتخاب می‌کنم چیست؟"]].map(([key,label])=><label key={key} style={{display:"block",fontSize:13,fontWeight:700,marginTop:14}}>{label}<textarea rows={3} value={data.stage4[key as keyof PathData["stage4"]]} onChange={e=>update({stage4:{...data.stage4,[key]:e.target.value}})} style={{display:"block",width:"100%",boxSizing:"border-box",marginTop:7,border:"1px solid rgba(49,93,66,.2)",borderRadius:12,padding:12,fontFamily:"inherit",fontSize:13,lineHeight:1.8,background:"#fffdf7"}}/></label>)}
        <button type="button" style={{...buttonStyle,marginTop:18}} disabled={!data.stage4.clear.trim()||!data.stage4.next.trim()} onClick={()=>{markStage(4);setMessage("این دور از مسیرت تکمیل شد؛ هر زمان خواستی می‌توانی برگردی و آموخته‌هایت را مرور کنی.");}}>ثبت مرور مسیر و تکمیل این دور ✓</button>
      </section>}
      <section style={{ ...cardStyle, background:"#fbf7eb" }}><strong style={{ color:"#315d42" }}>یادآوری کوچک</strong><p style={{ margin:"7px 0 0", fontSize:12, lineHeight:1.9, color:"#63705f" }}>این مسیر برای خودشناسی و تأمل طراحی شده و ابزار تشخیص روان‌شناختی نیست. پاسخ‌ها در نسخهٔ فعلی روی همین دستگاه ذخیره می‌شوند؛ برای همگام‌سازی امن بین دستگاه‌ها، اتصال ذخیره‌سازی سمت سرور هنوز لازم است.</p><button type="button" style={{...softButton,marginTop:10}} onClick={()=>setShowEditInitial(v=>!v)}>{showEditInitial?"بستن":"بازبینی پاسخ‌های اولیه"}</button>{showEditInitial&&<div style={{marginTop:12}}>{INITIAL.map((q,i)=><label key={q.id} style={{display:"block",fontSize:13,marginTop:10}}>{q.title}<select value={data.initialAnswers[i]===undefined?"":String(data.initialAnswers[i])} onChange={e=>{if(e.target.value==="")return;answerInitial(i,Number(e.target.value));}} style={{display:"block",width:"100%",marginTop:6,padding:10,borderRadius:10,border:"1px solid #d5dfd0",background:"#fffdf7",fontFamily:"inherit"}}><option value="">بدون پاسخ</option>{q.options.map((o,j)=><option value={j} key={o.label}>{o.label}</option>)}</select></label>)}</div>}</section>
    </>}
  </div>;
}
