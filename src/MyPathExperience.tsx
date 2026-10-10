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
    item?.axes.forEach(axis => { scores[axis] += Number(q) === 0 ? 3 : 1; });
  });
  Object.entries(followup).forEach(([id, answer]) => {
    const [axisId] = id.split(":");
    if (axisId in scores && answer.trim()) scores[axisId as AxisId] += 1;
  });
  const order = AXES.map(a => a.id);
  return order.sort((a,b) => scores[b]-scores[a] || a.localeCompare(b)).map(id => ({ id, score: scores[id] }));
}
function StageArtwork({ stage }: { stage: number }) {
  const label = ["آغاز","شناخت","اقدام","رشد"][stage - 1] || "مسیر";
  const symbol = stage === 1
    ? <><path d="M125 27v20M115 37h20" stroke="var(--mp-gold)" strokeWidth="2.5" strokeLinecap="round"/><circle cx="125" cy="37" r="13" fill="none" stroke="var(--mp-gold)" strokeWidth="1.5"/></>
    : stage === 2
    ? <><circle cx="126" cy="36" r="14" fill="none" stroke="var(--mp-gold)" strokeWidth="2"/><path d="M126 26v20M116 36h20" stroke="var(--mp-gold)" strokeWidth="1.5"/></>
    : stage === 3
    ? <><path d="M116 47l10-20 10 20z" fill="none" stroke="var(--mp-gold)" strokeWidth="2" strokeLinejoin="round"/><circle cx="126" cy="40" r="3" fill="var(--mp-gold)"/></>
    : <><path d="M126 20l4.5 11.5L142 36l-11.5 4.5L126 52l-4.5-11.5L110 36l11.5-4.5z" fill="var(--mp-gold)"/><circle cx="145" cy="56" r="3" fill="var(--mp-sage)"/></>;
  return <svg viewBox="0 0 180 150" role="img" aria-label={label+"؛ پیکرهٔ انسانی و نماد مسیر"} style={{ width:"100%", height:"auto", maxHeight:150, display:"block", overflow:"visible" }}>
    <circle cx="90" cy="76" r="59" fill="var(--mp-art-halo)" />
    <path d="M25 126 Q90 112 155 126" fill="none" stroke="var(--mp-border)" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="79" cy="42" r="14" fill="var(--mp-sage)" />
    <path d="M56 112 C57 87 62 68 79 66 C96 68 102 87 103 112Z" fill="var(--mp-figure)" />
    <path d="M67 72 Q79 82 92 72" fill="none" stroke="var(--mp-figure-detail)" strokeWidth="2" strokeLinecap="round" opacity=".8"/>
    <path d="M65 88l-14 17M94 88l13 17" stroke="var(--mp-figure)" strokeWidth="8" strokeLinecap="round"/>
    <path d="M70 112l-4 14M88 112l5 14" stroke="var(--mp-figure)" strokeWidth="8" strokeLinecap="round"/>
    <circle cx="79" cy="42" r="14" fill="none" stroke="var(--mp-figure-detail)" strokeWidth="1" opacity=".65"/>
    {symbol}
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
  const [expandedInitialIndex, setExpandedInitialIndex] = useState<number | null>(0);
  // Keep the stage selector close action available in the PR merge preview.
  const [, setShowStagePicker] = useState(false);
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
        const key = initUser ? "telegram-local:" + String(initUser) : (trustedId ? "vip:" + trustedId : null);
        if (!key) {
          setIdentityError("برای ذخیرهٔ مسیر شخصی، اپ را از داخل تلگرام باز کن. در حال حاضر هیچ پاسخی ذخیره نشده است.");
          setIdentityLoaded(true);
          return;
        }
        setUserKey(key);
        setIdentityLabel("ذخیرهٔ محلی روی همین دستگاه");
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
    const nextUnanswered = INITIAL.findIndex((_, i) => !Number.isInteger(answers[i]) && i > index);
    const firstUnanswered = INITIAL.findIndex((_, i) => !Number.isInteger(answers[i]));
    setExpandedInitialIndex(nextUnanswered >= 0 ? nextUnanswered : firstUnanswered >= 0 ? firstUnanswered : null);
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
  const cardStyle: React.CSSProperties = { border:"1px solid var(--mp-border)", borderRadius:22, background:"var(--mp-surface)", color:"var(--mp-text)", padding:16, boxShadow:"var(--mp-shadow)" };
  const buttonStyle: React.CSSProperties = { border:0, borderRadius:15, padding:"13px 16px", background:"linear-gradient(145deg,#315c48,#17382b)", color:"#fff", fontFamily:"inherit", fontSize:14, fontWeight:700, cursor:"pointer", width:"100%", boxShadow:"0 10px 24px rgba(23,75,56,.22)" };
  const softButton: React.CSSProperties = { border:"1px solid var(--mp-border)", borderRadius:14, padding:"11px 14px", background:"var(--mp-surface-raised)", color:"var(--mp-text)", fontFamily:"inherit", fontSize:13, fontWeight:700, cursor:"pointer", width:"100%" };

  return <div className="inner-page selected-growth-page my-path-experience" dir="rtl" style={{ display:"grid", gap:14 }}>
    <button type="button" onClick={onBack} style={{ border:0, background:"transparent", textAlign:"right", color:"inherit", fontFamily:"inherit", padding:"4px 0", cursor:"pointer" }}>← بازگشت {entry === "vip" ? "به VIP" : "به مسیر من"}</button>
    <section className="my-path-hero" style={{ ...cardStyle, overflow:"hidden", position:"relative", background:"var(--mp-hero)" }}>
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
        {INITIAL.map((q,i)=>{const chosenIndex=data.initialAnswers[i];const answered=Number.isInteger(chosenIndex);const expanded=expandedInitialIndex===i;return <div key={q.id} className={"my-path-question"+(expanded?" is-expanded":"")} style={{ marginTop:10 }}>
          <button type="button" aria-expanded={expanded} onClick={()=>setExpandedInitialIndex(expanded?null:i)} className="my-path-question-trigger">
            <span className="my-path-question-number">{(i+1).toLocaleString("fa-IR")}</span>
            <span className="my-path-question-title">{q.title}<small>{answered&&!expanded ? "پاسخ انتخاب‌شده: "+q.options[chosenIndex as number]?.label : expanded ? "یک گزینه را انتخاب کن" : "برای پاسخ یا ویرایش لمس کن"}</small></span>
            <span className="my-path-chevron" aria-hidden="true">{expanded?"−":"+"}</span>
          </button>
          {expanded&&<div className="my-path-options">{q.options.map((opt,j)=>{const chosen=chosenIndex===j;return <button key={opt.label} type="button" aria-pressed={chosen} onClick={()=>answerInitial(i,j)} className="my-path-option"><span className="my-path-option-mark">{chosen?"✓":(j+1).toLocaleString("fa-IR")}</span>{opt.label}</button>})}</div>}
        </div>})}
        {completedInitial && <div className="my-path-insight" style={{ marginTop:20, borderRadius:16, padding:14 }}><strong>نقطهٔ شروع تو، بر اساس ترکیب پاسخ‌ها</strong><p style={{ lineHeight:1.9, fontSize:13 }}>به نظر می‌رسد فعلاً محور «{AXES.find(a=>a.id===scoreAxes(data.initialAnswers,{} )[0]?.id)?.title}» می‌تواند شروع مناسبی باشد. این فقط پیشنهاد اولیه بر اساس پاسخ‌های توست و با اطلاعات تازه تغییر می‌کند.</p><button type="button" style={buttonStyle} onClick={()=>{ const ranked=scoreAxes(data.initialAnswers,data.followupAnswers); const next={...data, primaryAxis:ranked[0]?.id||"A",secondaryAxis:ranked[1]?.id||"C",completedStages:Array.from(new Set([...data.completedStages,1])),stage:2 as const}; persist(next,"مرحلهٔ اول ثبت شد؛ مسیر تکمیلی آماده است."); }}>تأیید نقطهٔ شروع و رفتن به مرحلهٔ بعد ←</button></div>}
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
      <section className="my-path-reminder" style={{ ...cardStyle }}>
        <strong>یادآوری کوتاه</strong>
        <p style={{ margin:"7px 0 0", fontSize:12, lineHeight:1.9 }}>این مسیر برای خودشناسی و تأمل طراحی شده و جایگزین تشخیص یا مشاورهٔ تخصصی روان‌شناختی نیست. پاسخ‌های تو روی همین دستگاه ذخیره می‌شوند.</p>
        {currentStage!==1&&<button type="button" style={{...softButton,marginTop:10}} onClick={()=>setShowEditInitial(v=>!v)}>{showEditInitial?"بستن بازبینی":"بازبینی پاسخ‌های اولیه"}</button>}
        {showEditInitial&&currentStage!==1&&<div className="my-path-review-editor" style={{marginTop:12}}>{INITIAL.map((q,i)=>{const chosenIndex=data.initialAnswers[i];const expanded=expandedInitialIndex===i;return <div key={q.id} className="my-path-question">
          <button type="button" aria-expanded={expanded} onClick={()=>setExpandedInitialIndex(expanded?null:i)} className="my-path-question-trigger"><span className="my-path-question-number">{(i+1).toLocaleString("fa-IR")}</span><span className="my-path-question-title">{q.title}<small>{Number.isInteger(chosenIndex)?"پاسخ انتخاب‌شده: "+q.options[chosenIndex as number]?.label:"هنوز پاسخ نداده‌ای"}</small></span><span className="my-path-chevron">{expanded?"−":"+"}</span></button>
          {expanded&&<div className="my-path-options">{q.options.map((o,j)=>{const chosen=chosenIndex===j;return <button type="button" key={o.label} aria-pressed={chosen} className="my-path-option" onClick={()=>answerInitial(i,j)}><span className="my-path-option-mark">{chosen?"✓":(j+1).toLocaleString("fa-IR")}</span>{o.label}</button>})}</div>}
        </div>})}</div>}
      </section>
    </>}
  </div>;
}
