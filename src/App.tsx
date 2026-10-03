import { useMemo, useState } from "react";
type Section = "home" | "services" | "more";
type IconName =
  | "home"
  | "spark"
  | "menu"
  | "energy"
  | "candle"
  | "conversation"
  | "crown"
  | "class"
  | "event"
  | "faq"
  | "clock"
  | "contact"
  | "arrow"
  | "calendar"
  | "phone"
  | "card"
  | "ticket"
  | "user"
  | "check";
type ServiceCategory = "energy" | "candle" | "psychotherapy";
type Service = {
  id: string;
  title: string;
  category: ServiceCategory;
  price: string;
  duration: string;
  description: string;
};
type ClassItem = {
  id: string;
  title: string;
  description: string;
  duration: string;
  status: string;
};
type EventItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  status: string;
};
type FAQItem = {
  id: string;
  question: string;
  answer: string;
};
const energyServices: Service[] = [
  {
    id: "coffee",
    title: "قهوه",
    category: "energy",
    price: "۷۰۰,۰۰۰ تومان",
    duration: "۳۰ دقیقه",
    description:
      "انرژی‌خوانی با نقش‌های فنجان قهوه برای بررسی مسیر و نشانه‌های پیش رو.",
  },
  {
    id: "playing-cards",
    title: "پاسور",
    category: "energy",
    price: "۶۵۰,۰۰۰ تومان",
    duration: "۳۰ دقیقه",
    description:
      "انرژی‌خوانی با کارت‌های پاسور برای بررسی موضوع مورد نظر شما.",
  },
  {
    id: "rider-waite",
    title: "تاروت رایدر وایت",
    category: "energy",
    price: "۷۵۰,۰۰۰ تومان",
    duration: "۳۰ دقیقه",
    description:
      "خوانش تاروت رایدر وایت برای بررسی انرژی‌ها، شرایط و مسیر پیش روی شما.",
  },
  {
    id: "rider-emotional",
    title: "رایدر احساسی",
    category: "energy",
    price: "۷۵۰,۰۰۰ تومان",
    duration: "۳۰ دقیقه",
    description:
      "خوانش احساسی برای بررسی وضعیت عاطفی، احساسات و انرژی میان افراد.",
  },
  {
    id: "rider-career-financial",
    title: "رایدر شغلی - مالی",
    category: "energy",
    price: "۷۵۰,۰۰۰ تومان",
    duration: "۳۰ دقیقه",
    description:
      "خوانش با تمرکز بر مسیر شغلی، مالی و انرژی‌های مرتبط با این حوزه.",
  },
  {
    id: "french-lenormand",
    title: "لنورماند فرانسوی",
    category: "energy",
    price: "۷۵۰,۰۰۰ تومان",
    duration: "۳۰ دقیقه",
    description:
      "انرژی‌خوانی با کارت‌های لنورماند فرانسوی برای بررسی موضوع انتخابی شما.",
  },
  {
    id: "emotional-lenormand",
    title: "لنورماند احساسی",
    category: "energy",
    price: "۷۵۰,۰۰۰ تومان",
    duration: "۳۰ دقیقه",
    description:
      "خوانش احساسی با لنورماند برای بررسی روابط و انرژی‌های عاطفی.",
  },
  {
    id: "greek-tarot-emotional",
    title: "تاروت یونانی احساسی",
    category: "energy",
    price: "۸۵۰,۰۰۰ تومان",
    duration: "۳۰ دقیقه",
    description:
      "خوانش احساسی با تاروت یونانی با تمرکز بر روابط و احساسات.",
  },
  {
    id: "marseille-tarot-emotional",
    title: "تاروت مارسی احساسی",
    category: "energy",
    price: "۸۵۰,۰۰۰ تومان",
    duration: "۳۰ دقیقه",
    description:
      "خوانش احساسی با تاروت مارسی برای بررسی انرژی و شرایط رابطه.",
  },
  {
    id: "gem-oracle",
    title: "جم اوراکل",
    category: "energy",
    price: "۷۰۰,۰۰۰ تومان",
    duration: "۳۰ دقیقه",
    description:
      "خوانش اوراکل با تمرکز بر پیام‌ها و انرژی‌های مرتبط با موضوع شما.",
  },
];
const mainServices: Service[] = [
  {
    id: "energy-reading",
    title: "انرژی‌خوانی",
    category: "energy",
    price: "",
    duration: "",
    description:
      "مجموعه‌ای از خوانش‌های انرژی با روش‌های مختلف برای موضوع مورد نظر شما.",
  },
  {
    id: "candle-therapy",
    title: "شمع‌تراپی",
    category: "candle",
    price: "۵۵۰,۰۰۰ تومان",
    duration: "۲۰ دقیقه",
    description:
      "جلسه شمع‌تراپی به‌صورت غیرحضوری و با تمرکز بر نیت و موضوع انتخابی شما.",
  },
  {
    id: "psychotherapy",
    title: "سایکوتراپی",
    category: "psychotherapy",
    price: "۶۰۰,۰۰۰ تومان",
    duration: "۴۵ دقیقه",
    description:
      "جلسه گفت‌وگومحور تلفنی برای صحبت درباره موضوع مورد نظر شما. این خدمت به‌عنوان روان‌درمانی یا خدمات درمانی بالینی ارائه نمی‌شود.",
  },
];
/*
 * فعلاً محتوای واقعی کلاس‌ها، ایونت‌ها و FAQ را از خودمان نمی‌سازیم.
 * این آرایه‌ها بعداً مستقیماً از CMS تغذیه می‌شوند.
 */
const classes: ClassItem[] = [];
const events: EventItem[] = [];
const faqs: FAQItem[] = [];
const moreItems = [
  {
    id: "vip",
    title: "VIP کائنات‌چی",
    icon: "crown" as IconName,
    description: "باشگاه ویژه کائنات‌چی",
  },
  {
    id: "classes",
    title: "کلاس‌ها",
    icon: "class" as IconName,
    description: "آموزش‌ها و دوره‌های کائنات‌چی",
  },
  {
    id: "events",
    title: "ایونت‌ها",
    icon: "event" as IconName,
    description: "رویدادها و برنامه‌های پیش رو",
  },
  {
    id: "faq",
    title: "سوالات متداول",
    icon: "faq" as IconName,
    description: "پاسخ به سوالات رایج",
  },
  {
    id: "hours",
    title: "ساعات کاری",
    icon: "clock" as IconName,
    description: "زمان پاسخ‌گویی کائنات‌چی",
  },
  {
    id: "contact",
    title: "ارتباط با ما",
    icon: "contact" as IconName,
    description: "راه‌های ارتباطی کائنات‌چی",
  },
];
function Icon({ name }: { name: IconName }) {
  const common = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="M3.5 10.8 12 3.8l8.5 7" />
          <path d="M5.5 9.8v10.4h13V9.8" />
          <path d="M9.5 20.2v-6h5v6" />
        </svg>
      );
    case "spark":
      return (
        <svg {...common}>
          <path d="M12 2.8 13.6 9l5.6 3-5.6 3L12 21.2 10.4 15 4.8 12l5.6-3Z" />
          <path d="m19 4 .5 2 1.7.8-1.7.8-.5 2-.5-2-1.7-.8 1.7-.8Z" />
        </svg>
      );
    case "menu":
      return (
        <svg {...common}>
          <path d="M5 7h14" />
          <path d="M5 12h14" />
          <path d="M5 17h14" />
        </svg>
      );
    case "energy":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7.8" />
          <path d="M12 7.2c1.8 2.1 2.6 3.7 2.6 5.2 0 1.9-1.2 3.2-2.6 3.2s-2.6-1.3-2.6-3.2c0-1.5.8-3.1 2.6-5.2Z" />
        </svg>
      );
    case "candle":
      return (
        <svg {...common}>
          <path d="M8 10h8v9H8z" />
          <path d="M10 10c0-1.6 1.2-2.2 2-3.5.8 1.3 2 1.9 2 3.5" />
          <path d="M6.5 19h11" />
        </svg>
      );
    case "conversation":
      return (
        <svg {...common}>
          <path d="M4.5 5.5h15v10h-9l-4.5 3v-3h-1.5Z" />
          <path d="M8 9.5h8" />
          <path d="M8 12.5h5" />
        </svg>
      );
    case "crown":
      return (
        <svg {...common}>
          <path d="m4 8 4 3 4-6 4 6 4-3-2 9H6Z" />
          <path d="M6 20h12" />
        </svg>
      );
    case "class":
      return (
        <svg {...common}>
          <path d="M4 5.5h16v12H4z" />
          <path d="M8 9h8" />
          <path d="M8 12h5" />
          <path d="M8 15h3" />
        </svg>
      );
    case "event":
      return (
        <svg {...common}>
          <rect x="4" y="5.5" width="16" height="14" rx="2" />
          <path d="M8 3.5v4" />
          <path d="M16 3.5v4" />
          <path d="M4 9h16" />
          <path d="M8 13h.01" />
          <path d="M12 13h.01" />
          <path d="M16 13h.01" />
        </svg>
      );
    case "faq":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M9.5 9.3a2.7 2.7 0 1 1 4.3 2.2c-1.2.8-1.8 1.2-1.8 2.5" />
          <path d="M12 17h.01" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 7.5v4.8l3.2 2" />
        </svg>
      );
    case "contact":
    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3" />
          <path d="M5.5 20c.7-3.2 2.9-5 6.5-5s5.8 1.8 6.5 5" />
        </svg>
      );
    case "arrow":
      return (
        <svg {...common}>
          <path d="M5 12h13" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="4" y="5.5" width="16" height="14" rx="2" />
          <path d="M8 3.5v4" />
          <path d="M16 3.5v4" />
          <path d="M4 9h16" />
        </svg>
      );
    case "phone":
      return (
        <svg {...common}>
          <path d="M7 4.5 9.5 4l1.5 4-2 1.5a13 13 0 0 0 5.5 5.5l1.5-2 4 1.5-.5 2.5c-.3 1.5-1.7 2.5-3.2 2.2C10.8 18.3 5.7 13.2 4.3 7.7 4 6.2 5.5 4.8 7 4.5Z" />
        </svg>
      );
    case "card":
      return (
        <svg {...common}>
          <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
          <path d="M3.5 9.5h17" />
          <path d="M7 14h4" />
        </svg>
      );
    case "ticket":
      return (
        <svg {...common}>
          <path d="M4 7.5A2.5 2.5 0 0 0 6.5 5h11A2.5 2.5 0 0 0 20 7.5v1A2.5 2.5 0 0 0 20 13v1a2.5 2.5 0 0 0-2.5 2.5h-11A2.5 2.5 0 0 0 4 14v-1a2.5 2.5 0 0 0 0-4Z" />
          <path d="M12 7.5v1" />
          <path d="M12 11.5v1" />
          <path d="M12 15.5v1" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="m5.5 12.5 4 4 9-9" />
        </svg>
      );
    default:
      return null;
  }
}
function getTodayJalali() {
  try {
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date());
  } catch {
    return "امروز";
  }
}
/* =========================================================
   Shared green section header
   ========================================================= */
function SectionHeaderCard({
  kicker,
  title,
  description,
  icon,
  status,
}: {
  kicker: string;
  title: string;
  description: string;
  icon?: IconName;
  status?: string;
}) {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "24px 20px",
        borderRadius: "26px",
        marginBottom: "18px",
        background:
          "linear-gradient(145deg, rgba(53,59,50,0.98), rgba(38,73,55,0.95))",
        color: "#fff",
        boxShadow: "0 18px 40px rgba(23,75,56,0.18)",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: "170px",
          height: "170px",
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.13)",
          top: "-78px",
          left: "-52px",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "90px",
          height: "90px",
          borderRadius: "50%",
          border: "1px solid rgba(216,197,155,0.12)",
          bottom: "-48px",
          right: "-30px",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: "13px",
        }}
      >
        {icon && (
          <div
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "17px",
              display: "grid",
              placeItems: "center",
              background: "rgba(255,255,255,0.1)",
              color: "#d8c59b",
              flex: "0 0 auto",
            }}
          >
            <Icon name={icon} />
          </div>
        )}
        <div>
          <div
            style={{
              fontSize: "10px",
              letterSpacing: "2px",
              opacity: 0.68,
              marginBottom: "5px",
            }}
          >
            {kicker}
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: "23px",
              lineHeight: 1.45,
              fontWeight: 600,
            }}
          >
            {title}
          </h1>
        </div>
      </div>
      <p
        style={{
          position: "relative",
          margin: "17px 0 0",
          fontSize: "13px",
          lineHeight: 1.9,
          color: "rgba(255,255,255,0.78)",
        }}
      >
        {description}
      </p>
      {status && (
        <div
          style={{
            position: "relative",
            marginTop: "17px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            color: "rgba(255,255,255,0.9)",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#d8c59b",
              boxShadow: "0 0 0 4px rgba(216,197,155,0.08)",
            }}
          />
          {status}
        </div>
      )}
    </div>
  );
}
/* =========================================================
   Global Search
   ========================================================= */
type SearchResult = {
  id: string;
  title: string;
  description: string;
  type: "service" | "class" | "event" | "faq";
  icon: IconName;
};
function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/ي/g, "ی")
    .replace(/ى/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u200c/g, " ")
    .trim();
}
function GlobalSearch({
  onClose,
  onOpenService,
  onOpenClass,
  onOpenEvent,
  onOpenFaq,
}: {
  onClose: () => void;
  onOpenService: (service: Service) => void;
  onOpenClass: (item: ClassItem) => void;
  onOpenEvent: (item: EventItem) => void;
  onOpenFaq: (item: FAQItem) => void;
}) {
  const [query, setQuery] = useState("");
  const allResults = useMemo<SearchResult[]>(() => {
    const serviceResults: SearchResult[] = [
      ...mainServices,
      ...energyServices,
    ].map((service) => ({
      id: `service-${service.id}`,
      title: service.title,
      description: service.description,
      type: "service",
      icon:
        service.category === "energy"
          ? "energy"
          : service.category === "candle"
            ? "candle"
            : "conversation",
    }));
    const classResults: SearchResult[] = classes.map((item) => ({
      id: `class-${item.id}`,
      title: item.title,
      description: item.description,
      type: "class",
      icon: "class",
    }));
    const eventResults: SearchResult[] = events.map((item) => ({
      id: `event-${item.id}`,
      title: item.title,
      description: item.description,
      type: "event",
      icon: "event",
    }));
    const faqResults: SearchResult[] = faqs.map((item) => ({
      id: `faq-${item.id}`,
      title: item.question,
      description: item.answer,
      type: "faq",
      icon: "faq",
    }));
    return [
      ...serviceResults,
      ...classResults,
      ...eventResults,
      ...faqResults,
    ];
  }, []);
  const normalizedQuery = normalizeSearchText(query);
  const results =
    normalizedQuery.length === 0
      ? []
      : allResults.filter((item) => {
          const haystack = normalizeSearchText(
            `${item.title} ${item.description}`
          );
          return haystack.includes(normalizedQuery);
        });
  const typeLabel = {
    service: "خدمت",
    class: "کلاس",
    event: "ایونت",
    faq: "سؤال متداول",
  };
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(244,239,228,0.97)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        padding: "18px",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          maxWidth: "680px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "10px",
                letterSpacing: "2px",
                color: "#246347",
                marginBottom: "4px",
              }}
            >
              SEARCH
            </div>
            <h2
              style={{
                margin: 0,
                color: "#353B32",
                fontSize: "22px",
              }}
            >
              جستجو
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "rgba(255,255,255,0.72)",
              color: "#353B32",
              borderRadius: "14px",
              width: "44px",
              height: "44px",
              fontFamily: "inherit",
              cursor: "pointer",
              boxShadow: "0 5px 16px rgba(53,59,50,0.08)",
            }}
          >
            ×
          </button>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "rgba(255,255,255,0.78)",
            border: "1px solid rgba(53,59,50,0.1)",
            borderRadius: "20px",
            padding: "5px 14px",
            boxShadow: "0 10px 24px rgba(53,59,50,0.07)",
          }}
        >
          <span
            style={{
              color: "#246347",
              fontSize: "20px",
            }}
          >
            ⌕
          </span>
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="خدمات، کلاس‌ها، ایونت‌ها، سوالات..."
            style={{
              width: "100%",
              minHeight: "50px",
              border: "none",
              outline: "none",
              background: "transparent",
              color: "#353B32",
              fontFamily: "inherit",
              fontSize: "14px",
            }}
          />
        </div>
        {query.trim().length === 0 && (
          <div
            style={{
              marginTop: "18px",
              padding: "22px 18px",
              borderRadius: "22px",
              background: "rgba(255,255,255,0.58)",
              border: "1px solid rgba(53,59,50,0.08)",
              textAlign: "center",
              boxShadow: "0 10px 25px rgba(53,59,50,0.05)",
            }}
          >
            <div
              style={{
                color: "#246347",
                marginBottom: "8px",
              }}
            >
              <Icon name="spark" />
            </div>
            <strong
              style={{
                display: "block",
                color: "#353B32",
                marginBottom: "6px",
              }}
            >
              دنبال چه چیزی می‌گردی؟
            </strong>
            <span
              style={{
                fontSize: "13px",
                color: "rgba(53,59,50,0.68)",
                lineHeight: 1.8,
              }}
            >
              خدمات، کلاس‌ها، ایونت‌ها و سوالات متداول را جستجو کن.
            </span>
          </div>
        )}
        {query.trim().length > 0 && results.length === 0 && (
          <div
            style={{
              marginTop: "18px",
              padding: "24px 18px",
              borderRadius: "22px",
              background: "rgba(255,255,255,0.58)",
              border: "1px solid rgba(53,59,50,0.08)",
              textAlign: "center",
              boxShadow: "0 10px 25px rgba(53,59,50,0.05)",
            }}
          >
            <strong
              style={{
                display: "block",
                color: "#353B32",
                marginBottom: "6px",
              }}
            >
              نتیجه‌ای پیدا نشد
            </strong>
            <span
              style={{
                fontSize: "13px",
                color: "rgba(53,59,50,0.68)",
              }}
            >
              عبارت دیگری را امتحان کن.
            </span>
          </div>
        )}
        {results.length > 0 && (
          <div
            style={{
              marginTop: "16px",
              display: "grid",
              gap: "10px",
            }}
          >
            {results.map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => {
                  if (result.type === "service") {
                    const service = [...mainServices, ...energyServices].find(
                      (item) => item.id === result.id.replace("service-", "")
                    );
                    if (service) {
                      onOpenService(service);
                    }
                  }
                  if (result.type === "class") {
                    const item = classes.find(
                      (entry) => entry.id === result.id.replace("class-", "")
                    );
                    if (item) {
                      onOpenClass(item);
                    }
                  }
                  if (result.type === "event") {
                    const item = events.find(
                      (entry) => entry.id === result.id.replace("event-", "")
                    );
                    if (item) {
                      onOpenEvent(item);
                    }
                  }
                  if (result.type === "faq") {
                    const item = faqs.find(
                      (entry) => entry.id === result.id.replace("faq-", "")
                    );
                    if (item) {
                      onOpenFaq(item);
                    }
                  }
                }}
                style={{
                  width: "100%",
                  border: "none",
                  textAlign: "right",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "15px",
                  borderRadius: "20px",
                  background: "rgba(255,255,255,0.72)",
                  boxShadow: "0 8px 22px rgba(53,59,50,0.07)",
                }}
              >
                <div
                  style={{
                    width: "46px",
                    height: "46px",
                    borderRadius: "15px",
                    display: "grid",
                    placeItems: "center",
                    flex: "0 0 auto",
                    background: "rgba(36,99,71,0.09)",
                    color: "#246347",
                  }}
                >
                  <Icon name={result.icon} />
                </div>
                <div
                  style={{
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <small
                    style={{
                      display: "block",
                      color: "#8a7348",
                      fontSize: "10px",
                      marginBottom: "3px",
                    }}
                  >
                    {typeLabel[result.type]}
                  </small>
                  <strong
                    style={{
                      display: "block",
                      color: "#353B32",
                      fontSize: "14px",
                      marginBottom: "4px",
                    }}
                  >
                    {result.title}
                  </strong>
                  <span
                    style={{
                      display: "block",
                      color: "rgba(53,59,50,0.64)",
                      fontSize: "12px",
                      lineHeight: 1.7,
                    }}
                  >
                    {result.description}
                  </span>
                </div>
                <div
                  style={{
                    color: "#246347",
                    flex: "0 0 auto",
                  }}
                >
                  <Icon name="arrow" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
/* =========================================================
   Home
   ========================================================= */
function HomePage() {
  const today = getTodayJalali();
  return (
    <>
      <header className="topbar">
        <div className="brand-area">
          <div className="logo-placeholder" aria-hidden="true">
            <Icon name="spark" />
          </div>
          <div className="brand-copy">
            <div className="brand-name">کائنات‌چی</div>
            <div className="brand-tagline">رزرو نوبت و مشاهده خدمات</div>
          </div>
        </div>
        <div className="date-pill">
          <span className="date-dot" />
          {today}
        </div>
      </header>
      <main className="main-content">
        <section className="hero">
          <div className="hero-glow" />
          <div className="hero-art">
            <div className="orb orb-large" />
            <div className="orb orb-small" />
            <div className="botanical botanical-left" />
            <div className="botanical botanical-right" />
            <div className="hero-symbol">
              <Icon name="spark" />
            </div>
            <div className="hero-ring ring-one" />
            <div className="hero-ring ring-two" />
          </div>
          <div className="hero-content">
            <div className="eyebrow">
              <Icon name="spark" />
              <span>KAENATCHI</span>
            </div>
            <h1>
              جایی برای
              <br />
              دیدن نشانه‌ها
            </h1>
            <p>
              خدمات، تجربه‌ها و مسیرهای کائنات‌چی
              <br />
              در یک فضای آرام و متفاوت.
            </p>
          </div>
        </section>
        <section className="today-section">
          <div className="section-heading-row">
            <div>
              <div className="section-kicker">TODAY</div>
              <h2>حال‌وهوای امروز</h2>
            </div>
            <Icon name="spark" />
          </div>
          <div className="today-card">
            <div className="today-decoration">
              <Icon name="spark" />
            </div>
            <div className="today-content">
              <strong>آرام‌تر نگاه کن.</strong>
              <span>
                گاهی یک نشانه کوچک، شروع یک نگاه تازه است.
              </span>
            </div>
          </div>
        </section>
        <section className="featured-section">
          <div className="section-heading-row">
            <div>
              <div className="section-kicker">FEATURED</div>
              <h2>پیشنهاد امروز</h2>
            </div>
          </div>
          <div className="featured-card">
            <div className="featured-art">
              <div className="featured-circle">
                <div className="featured-leaf leaf-a" />
                <div className="featured-leaf leaf-b" />
                <div className="featured-leaf leaf-c" />
                <Icon name="spark" />
              </div>
            </div>
            <div className="featured-copy">
              <div className="featured-label">KAENATCHI MOMENT</div>
              <h3>برای خودت یک مکث بساز.</h3>
              <p>
                فضای کائنات‌چی برای تجربه‌ای آرام، شخصی و متفاوت طراحی شده است.
              </p>
            </div>
          </div>
        </section>
        <section className="welcome-section">
          <h2>به کائنات‌چی خوش آمدی 🌿</h2>
          <p>
            از خدمات و انرژی‌خوانی تا کلاس‌ها، ایونت‌ها و باشگاه VIP؛
            مسیرت را از منوی پایین پیدا کن.
          </p>
        </section>
      </main>
    </>
  );
}
/* =========================================================
   Services
   ========================================================= */
function ServiceTabs({
  active,
  onChange,
}: {
  active: "all" | ServiceCategory;
  onChange: (value: "all" | ServiceCategory) => void;
}) {
  const tabs: { id: "all" | ServiceCategory; title: string }[] = [
    { id: "all", title: "همه" },
    { id: "energy", title: "انرژی‌خوانی" },
    { id: "candle", title: "شمع‌تراپی" },
    { id: "psychotherapy", title: "سایکوتراپی" },
  ];
  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        overflowX: "auto",
        padding: "4px 2px 12px",
        scrollbarWidth: "none",
      }}
    >
      {tabs.map((tab) => {
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              flex: "0 0 auto",
              border: selected
                ? "1px solid rgba(36, 99, 71, 0.35)"
                : "1px solid rgba(53, 59, 50, 0.1)",
              background: selected
                ? "rgba(36, 99, 71, 0.1)"
                : "rgba(255,255,255,0.55)",
              color: selected ? "#246347" : "#353B32",
              borderRadius: "999px",
              padding: "10px 16px",
              minHeight: "42px",
              fontFamily: "inherit",
              fontSize: "13px",
              cursor: "pointer",
              boxShadow: selected
                ? "0 5px 16px rgba(36, 99, 71, 0.1)"
                : "0 3px 12px rgba(53, 59, 50, 0.06)",
            }}
          >
            {tab.title}
          </button>
        );
      })}
    </div>
  );
}
function ServiceCard({
  service,
  onClick,
}: {
  service: Service;
  onClick: () => void;
}) {
  const icon =
    service.category === "energy"
      ? "energy"
      : service.category === "candle"
        ? "candle"
        : "conversation";
  return (
    <button
      type="button"
      className="glass-list-card"
      onClick={onClick}
      style={{
        width: "100%",
        border: "none",
        textAlign: "right",
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      <div className="list-icon">
        <Icon name={icon} />
      </div>
      <div className="list-copy">
        <strong>{service.title}</strong>
        <span>{service.description}</span>
        {(service.price || service.duration) && (
          <small
            style={{
              display: "block",
              marginTop: "7px",
              color: "#246347",
              fontSize: "12px",
            }}
          >
            {service.duration}
            {service.duration && service.price ? "  •  " : ""}
            {service.price}
          </small>
        )}
      </div>
      <div className="list-arrow">
        <Icon name="arrow" />
      </div>
    </button>
  );
}
function ServiceDetail({
  service,
  onBack,
}: {
  service: Service;
  onBack: () => void;
}) {
  const icon =
    service.category === "energy"
      ? "energy"
      : service.category === "candle"
        ? "candle"
        : "conversation";
  return (
    <div className="inner-page">
      <button
        type="button"
        onClick={onBack}
        style={backButtonStyle}
      >
        ← بازگشت
      </button>
      <SectionHeaderCard
        kicker="SERVICE"
        title={service.title}
        description={service.description}
        icon={icon}
      />
      <div className="glass-list-card">
        <div className="list-copy">
          {service.duration && (
            <div style={{ marginBottom: "10px" }}>
              <strong>مدت زمان</strong>
              <span>{service.duration}</span>
            </div>
          )}
          {service.price && (
            <div>
              <strong>هزینه</strong>
              <span>{service.price}</span>
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        style={{
          width: "100%",
          marginTop: "16px",
          border: "none",
          borderRadius: "18px",
          padding: "15px 18px",
          background: "linear-gradient(135deg, #174b38, #2c7658)",
          color: "#fff",
          fontFamily: "inherit",
          fontSize: "15px",
          cursor: "pointer",
          boxShadow: "0 10px 24px rgba(23, 75, 56, 0.2)",
        }}
        onClick={() => {
          window.open(
            "https://kaenatchi.github.io/booking/",
            "_blank"
          );
        }}
      >
        📅 دریافت نوبت
      </button>
    </div>
  );
}
function ServicesPage({
  onSearch,
  externalService,
  onClearExternalService,
}: {
  onSearch: () => void;
  externalService: Service | null;
  onClearExternalService: () => void;
}) {
  const [activeTab, setActiveTab] = useState<
    "all" | ServiceCategory
  >("all");
  const [selectedService, setSelectedService] =
    useState<Service | null>(externalService);
  if (externalService && selectedService !== externalService) {
    setSelectedService(externalService);
  }
  if (selectedService) {
    return (
      <ServiceDetail
        service={selectedService}
        onBack={() => {
          setSelectedService(null);
          onClearExternalService();
        }}
      />
    );
  }
  let visibleServices: Service[];
  if (activeTab === "all") {
    visibleServices = mainServices;
  } else if (activeTab === "energy") {
    visibleServices = energyServices;
  } else {
    visibleServices = mainServices.filter(
      (service) => service.category === activeTab
    );
  }
  return (
    <div className="inner-page">
      <SearchButton onClick={onSearch} />
      <SectionHeaderCard
        kicker="SERVICES"
        title="خدمات کائنات‌چی"
        description="هر بخش را انتخاب کن تا جزئیات آن را ببینی."
        icon="spark"
      />
      <ServiceTabs
        active={activeTab}
        onChange={setActiveTab}
      />
      <div className="service-list">
        {visibleServices.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onClick={() => {
              if (service.id === "energy-reading") {
                setActiveTab("energy");
                return;
              }
              setSelectedService(service);
            }}
          />
        ))}
      </div>
    </div>
  );
}
/* =========================================================
   Classes
   ========================================================= */
function EmptyContent({
  icon,
  title,
  description,
}: {
  icon: IconName;
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        padding: "26px 20px",
        borderRadius: "22px",
        background: "rgba(255,255,255,0.58)",
        border: "1px solid rgba(53,59,50,0.08)",
        textAlign: "center",
        boxShadow: "0 10px 25px rgba(53,59,50,0.05)",
      }}
    >
      <div
        style={{
          width: "52px",
          height: "52px",
          margin: "0 auto 12px",
          borderRadius: "17px",
          display: "grid",
          placeItems: "center",
          background: "rgba(36,99,71,0.08)",
          color: "#246347",
        }}
      >
        <Icon name={icon} />
      </div>
      <strong
        style={{
          display: "block",
          color: "#353B32",
          marginBottom: "7px",
        }}
      >
        {title}
      </strong>
      <span
        style={{
          display: "block",
          color: "rgba(53,59,50,0.65)",
          fontSize: "13px",
          lineHeight: 1.9,
        }}
      >
        {description}
      </span>
    </div>
  );
}
function ClassCard({
  item,
  onClick,
}: {
  item: ClassItem;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="glass-list-card"
      onClick={onClick}
      style={{
        width: "100%",
        border: "none",
        textAlign: "right",
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      <div className="list-icon">
        <Icon name="class" />
      </div>
      <div className="list-copy">
        <strong>{item.title}</strong>
        <span>{item.description}</span>
        <small
          style={{
            display: "block",
            marginTop: "7px",
            color: "#246347",
            fontSize: "12px",
          }}
        >
          {item.duration}
          {item.status ? `  •  ${item.status}` : ""}
        </small>
      </div>
      <div className="list-arrow">
        <Icon name="arrow" />
      </div>
    </button>
  );
}
function ClassDetail({
  item,
  onBack,
}: {
  item: ClassItem;
  onBack: () => void;
}) {
  return (
    <div className="inner-page">
      <button
        type="button"
        onClick={onBack}
        style={backButtonStyle}
      >
        ← بازگشت به کلاس‌ها
      </button>
      <SectionHeaderCard
        kicker="CLASS"
        title={item.title}
        description={item.description}
        icon="class"
        status={item.status}
      />
      <div className="glass-list-card">
        <div className="list-copy">
          <div style={{ marginBottom: "10px" }}>
            <strong>مدت دوره</strong>
            <span>{item.duration}</span>
          </div>
          <div>
            <strong>وضعیت</strong>
            <span>{item.status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
function ClassesPage({
  onSearch,
  externalClass,
  onClearExternalClass,
}: {
  onSearch: () => void;
  externalClass: ClassItem | null;
  onClearExternalClass: () => void;
}) {
  const [selectedClass, setSelectedClass] =
    useState<ClassItem | null>(externalClass);
  if (externalClass && selectedClass !== externalClass) {
    setSelectedClass(externalClass);
  }
  if (selectedClass) {
    return (
      <ClassDetail
        item={selectedClass}
        onBack={() => {
          setSelectedClass(null);
          onClearExternalClass();
        }}
      />
    );
  }
  return (
    <div className="inner-page">
      <SearchButton onClick={onSearch} />
      <SectionHeaderCard
        kicker="CLASSES"
        title="کلاس‌ها"
        description="آموزش‌ها و دوره‌های کائنات‌چی را از اینجا دنبال کن."
        icon="class"
      />
      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          padding: "4px 2px 12px",
          scrollbarWidth: "none",
        }}
      >
        <button
          type="button"
          style={{
            flex: "0 0 auto",
            border: "1px solid rgba(36,99,71,0.35)",
            background: "rgba(36,99,71,0.1)",
            color: "#246347",
            borderRadius: "999px",
            padding: "10px 18px",
            minHeight: "42px",
            fontFamily: "inherit",
            fontSize: "13px",
          }}
        >
          همه
        </button>
      </div>
      {classes.length === 0 ? (
        <EmptyContent
          icon="class"
          title="هنوز کلاسی منتشر نشده"
          description="کلاس‌ها و دوره‌های جدید پس از انتشار از طریق پنل مدیریت، در این بخش نمایش داده می‌شوند."
        />
      ) : (
        <div
          style={{
            display: "grid",
            gap: "10px",
          }}
        >
          {classes.map((item) => (
            <ClassCard
              key={item.id}
              item={item}
              onClick={() => setSelectedClass(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
/* =========================================================
   Events
   ========================================================= */
function EventCard({
  item,
  onClick,
}: {
  item: EventItem;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="glass-list-card"
      onClick={onClick}
      style={{
        width: "100%",
        border: "none",
        textAlign: "right",
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      <div className="list-icon">
        <Icon name="event" />
      </div>
      <div className="list-copy">
        <strong>{item.title}</strong>
        <span>{item.description}</span>
        <small
          style={{
            display: "block",
            marginTop: "7px",
            color: "#246347",
            fontSize: "12px",
          }}
        >
          {item.date}
          {item.status ? `  •  ${item.status}` : ""}
        </small>
      </div>
      <div className="list-arrow">
        <Icon name="arrow" />
      </div>
    </button>
  );
}
function EventDetail({
  item,
  onBack,
}: {
  item: EventItem;
  onBack: () => void;
}) {
  return (
    <div className="inner-page">
      <button
        type="button"
        onClick={onBack}
        style={backButtonStyle}
      >
        ← بازگشت به ایونت‌ها
      </button>
      <SectionHeaderCard
        kicker="EVENT"
        title={item.title}
        description={item.description}
        icon="event"
        status={item.status}
      />
      <div className="glass-list-card">
        <div className="list-copy">
          <div style={{ marginBottom: "10px" }}>
            <strong>تاریخ</strong>
            <span>{item.date}</span>
          </div>
          <div style={{ marginBottom: "10px" }}>
            <strong>محل برگزاری</strong>
            <span>{item.location}</span>
          </div>
          <div>
            <strong>وضعیت</strong>
            <span>{item.status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
function EventsPage({
  onSearch,
  externalEvent,
  onClearExternalEvent,
}: {
  onSearch: () => void;
  externalEvent: EventItem | null;
  onClearExternalEvent: () => void;
}) {
  const [selectedEvent, setSelectedEvent] =
    useState<EventItem | null>(externalEvent);
  if (externalEvent && selectedEvent !== externalEvent) {
    setSelectedEvent(externalEvent);
  }
  if (selectedEvent) {
    return (
      <EventDetail
        item={selectedEvent}
        onBack={() => {
          setSelectedEvent(null);
          onClearExternalEvent();
        }}
      />
    );
  }
  return (
    <div className="inner-page">
      <SearchButton onClick={onSearch} />
      <SectionHeaderCard
        kicker="EVENTS"
        title="ایونت‌ها"
        description="رویدادها و برنامه‌های پیش روی کائنات‌چی را دنبال کن."
        icon="event"
      />
      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          padding: "4px 2px 12px",
          scrollbarWidth: "none",
        }}
      >
        <button
          type="button"
          style={{
            flex: "0 0 auto",
            border: "1px solid rgba(36,99,71,0.35)",
            background: "rgba(36,99,71,0.1)",
            color: "#246347",
            borderRadius: "999px",
            padding: "10px 18px",
            minHeight: "42px",
            fontFamily: "inherit",
            fontSize: "13px",
          }}
        >
          همه
        </button>
      </div>
      {events.length === 0 ? (
        <EmptyContent
          icon="event"
          title="هنوز ایونتی منتشر نشده"
          description="ایونت‌ها و برنامه‌های جدید پس از انتشار از طریق پنل مدیریت، در این بخش نمایش داده می‌شوند."
        />
      ) : (
        <div
          style={{
            display: "grid",
            gap: "10px",
          }}
        >
          {events.map((item) => (
            <EventCard
              key={item.id}
              item={item}
              onClick={() => setSelectedEvent(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
/* =========================================================
   FAQ
   ========================================================= */
function FAQCard({
  item,
  onClick,
}: {
  item: FAQItem;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="glass-list-card"
      onClick={onClick}
      style={{
        width: "100%",
        border: "none",
        textAlign: "right",
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      <div className="list-icon">
        <Icon name="faq" />
      </div>
      <div className="list-copy">
        <strong>{item.question}</strong>
        <span>{item.answer}</span>
      </div>
      <div className="list-arrow">
        <Icon name="arrow" />
      </div>
    </button>
  );
}
function FAQDetail({
  item,
  onBack,
}: {
  item: FAQItem;
  onBack: () => void;
}) {
  return (
    <div className="inner-page">
      <button
        type="button"
        onClick={onBack}
        style={backButtonStyle}
      >
        ← بازگشت به سوالات
      </button>
      <SectionHeaderCard
        kicker="FAQ"
        title={item.question}
        description={item.answer}
        icon="faq"
      />
      <div className="glass-list-card">
        <div className="list-copy">
          <strong>پاسخ</strong>
          <span>{item.answer}</span>
        </div>
      </div>
    </div>
  );
}
function FAQPage({
  onSearch,
  externalFaq,
  onClearExternalFaq,
}: {
  onSearch: () => void;
  externalFaq: FAQItem | null;
  onClearExternalFaq: () => void;
}) {
  const [selectedFaq, setSelectedFaq] =
    useState<FAQItem | null>(externalFaq);
  if (externalFaq && selectedFaq !== externalFaq) {
    setSelectedFaq(externalFaq);
  }
  if (selectedFaq) {
    return (
      <FAQDetail
        item={selectedFaq}
        onBack={() => {
          setSelectedFaq(null);
          onClearExternalFaq();
        }}
      />
    );
  }
  return (
    <div className="inner-page">
      <SearchButton onClick={onSearch} />
      <SectionHeaderCard
        kicker="FAQ"
        title="سوالات متداول"
        description="پاسخ سوالات رایج درباره خدمات و تجربه کائنات‌چی."
        icon="faq"
      />
      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          padding: "4px 2px 12px",
          scrollbarWidth: "none",
        }}
      >
        <button
          type="button"
          style={{
            flex: "0 0 auto",
            border: "1px solid rgba(36,99,71,0.35)",
            background: "rgba(36,99,71,0.1)",
            color: "#246347",
            borderRadius: "999px",
            padding: "10px 18px",
            minHeight: "42px",
            fontFamily: "inherit",
            fontSize: "13px",
          }}
        >
          همه
        </button>
      </div>
      {faqs.length === 0 ? (
        <EmptyContent
          icon="faq"
          title="هنوز سوالی منتشر نشده"
          description="سوالات متداول پس از انتشار از طریق پنل مدیریت، در این بخش نمایش داده می‌شوند."
        />
      ) : (
        <div
          style={{
            display: "grid",
            gap: "10px",
          }}
        >
          {faqs.map((item) => (
            <FAQCard
              key={item.id}
              item={item}
              onClick={() => setSelectedFaq(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
/* =========================================================
   Search Button
   ========================================================= */
function SearchButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        minHeight: "50px",
        border: "1px solid rgba(53,59,50,0.08)",
        borderRadius: "17px",
        background: "rgba(255,255,255,0.62)",
        color: "#353B32",
        fontFamily: "inherit",
        fontSize: "13px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 15px",
        marginBottom: "14px",
        boxShadow: "0 7px 18px rgba(53,59,50,0.06)",
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: "9px",
        }}
      >
        <span
          style={{
            color: "#246347",
            fontSize: "20px",
            lineHeight: 1,
          }}
        >
          ⌕
        </span>
        <span>جستجو در کائنات‌چی</span>
      </span>
      <Icon name="arrow" />
    </button>
  );
}
/* =========================================================
   VIP
   ========================================================= */
function VipPage({ onBack }: { onBack: () => void }) {
  const [activePanel, setActivePanel] = useState<
    "dashboard" | "bookings" | "payments" | "tokens" | "profile"
  >("dashboard");
  const vipActive = true;
  if (activePanel === "bookings") {
    return (
      <div className="inner-page">
        <button
          type="button"
          onClick={() => setActivePanel("dashboard")}
          style={backButtonStyle}
        >
          ← بازگشت به VIP
        </button>
        <SectionHeaderCard
          kicker="VIP"
          title="نوبت‌های من"
          description="نوبت‌های ثبت‌شده شما در کائنات‌چی."
          icon="calendar"
        />
        <div className="glass-list-card">
          <div className="list-icon">
            <Icon name="calendar" />
          </div>
          <div className="list-copy">
            <strong>هنوز نوبتی ثبت نشده</strong>
            <span>
              بعد از ثبت نوبت، اطلاعات آن در این بخش نمایش داده می‌شود.
            </span>
          </div>
        </div>
      </div>
    );
  }
  if (activePanel === "payments") {
    return (
      <div className="inner-page">
        <button
          type="button"
          onClick={() => setActivePanel("dashboard")}
          style={backButtonStyle}
        >
          ← بازگشت به VIP
        </button>
        <SectionHeaderCard
          kicker="VIP"
          title="پرداخت‌های من"
          description="سوابق پرداخت شما در کائنات‌چی."
          icon="card"
        />
        <div className="glass-list-card">
          <div className="list-icon">
            <Icon name="card" />
          </div>
          <div className="list-copy">
            <strong>هنوز پرداختی ثبت نشده</strong>
            <span>
              سوابق پرداخت پس از اتصال حساب شما به سیستم نمایش داده می‌شود.
            </span>
          </div>
        </div>
      </div>
    );
  }
  if (activePanel === "tokens") {
    return (
      <div className="inner-page">
        <button
          type="button"
          onClick={() => setActivePanel("dashboard")}
          style={backButtonStyle}
        >
          ← بازگشت به VIP
        </button>
        <SectionHeaderCard
          kicker="VIP TOKENS"
          title="توکن‌های تخفیف"
          description="توکن‌های اختصاصی شما در باشگاه VIP."
          icon="ticket"
        />
        <div
          className="glass-list-card"
          style={{
            border: "1px solid rgba(165, 139, 91, 0.25)",
          }}
        >
          <div className="list-icon">
            <Icon name="ticket" />
          </div>
          <div className="list-copy">
            <strong>توکن فعال ندارید</strong>
            <span>
              توکن‌های صادرشده و وضعیت استفاده از آن‌ها اینجا نمایش داده می‌شود.
            </span>
          </div>
        </div>
        <div
          style={{
            marginTop: "14px",
            padding: "16px",
            borderRadius: "18px",
            background: "rgba(165, 139, 91, 0.08)",
            border: "1px solid rgba(165, 139, 91, 0.15)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              color: "#8a7348",
              marginBottom: "7px",
            }}
          >
            <Icon name="spark" />
            <strong>تخفیف VIP</strong>
          </div>
          <span
            style={{
              fontSize: "13px",
              lineHeight: 1.8,
            }}
          >
            توکن‌های ۳٪، ۵٪ و ۷٪ پس از اتصال به سیستم VIP از این بخش مدیریت
            خواهند شد.
          </span>
        </div>
      </div>
    );
  }
  if (activePanel === "profile") {
    return (
      <div className="inner-page">
        <button
          type="button"
          onClick={() => setActivePanel("dashboard")}
          style={backButtonStyle}
        >
          ← بازگشت به VIP
        </button>
        <SectionHeaderCard
          kicker="PROFILE"
          title="پروفایل من"
          description="اطلاعات حساب VIP شما."
          icon="user"
        />
        <div className="glass-list-card">
          <div className="list-icon">
            <Icon name="user" />
          </div>
          <div className="list-copy">
            <strong>عضو VIP کائنات‌چی</strong>
            <span>
              اطلاعات شخصی شما پس از اتصال حساب نمایش داده می‌شود.
            </span>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="inner-page">
      <button
        type="button"
        onClick={onBack}
        style={backButtonStyle}
      >
        ← بازگشت
      </button>
      <SectionHeaderCard
        kicker="KAENATCHI"
        title="پنل VIP"
        description="فضای اختصاصی اعضای VIP کائنات‌چی."
        icon="crown"
        status={
          vipActive
            ? "عضویت VIP فعال است"
            : "عضویت VIP غیرفعال است"
        }
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "10px",
        }}
      >
        <button
          type="button"
          className="glass-list-card"
          onClick={() => setActivePanel("bookings")}
          style={vipTileStyle}
        >
          <div className="list-icon">
            <Icon name="calendar" />
          </div>
          <div className="list-copy">
            <strong>نوبت‌های من</strong>
            <span>مشاهده نوبت‌ها</span>
          </div>
        </button>
        <button
          type="button"
          className="glass-list-card"
          onClick={() => setActivePanel("payments")}
          style={vipTileStyle}
        >
          <div className="list-icon">
            <Icon name="card" />
          </div>
          <div className="list-copy">
            <strong>پرداخت‌ها</strong>
            <span>سوابق پرداخت</span>
          </div>
        </button>
        <button
          type="button"
          className="glass-list-card"
          onClick={() => setActivePanel("tokens")}
          style={vipTileStyle}
        >
          <div className="list-icon">
            <Icon name="ticket" />
          </div>
          <div className="list-copy">
            <strong>توکن‌ها</strong>
            <span>تخفیف‌های VIP</span>
          </div>
        </button>
        <button
          type="button"
          className="glass-list-card"
          onClick={() => setActivePanel("profile")}
          style={vipTileStyle}
        >
          <div className="list-icon">
            <Icon name="user" />
          </div>
          <div className="list-copy">
            <strong>پروفایل</strong>
            <span>اطلاعات حساب</span>
          </div>
        </button>
      </div>
      <div
        style={{
          marginTop: "14px",
          padding: "18px",
          borderRadius: "20px",
          background: "rgba(165,139,91,0.08)",
          border: "1px solid rgba(165,139,91,0.16)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "9px",
            color: "#8a7348",
            marginBottom: "8px",
          }}
        >
          <Icon name="check" />
          <strong>عضویت فعال</strong>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: "13px",
            lineHeight: 1.9,
          }}
        >
          این بخش در مرحله اتصال به حساب واقعی VIP، اطلاعات شخصی و مزایای
          اختصاصی هر عضو را نمایش خواهد داد.
        </p>
      </div>
    </div>
  );
}
const backButtonStyle = {
  border: "none",
  background: "transparent",
  color: "#246347",
  fontFamily: "inherit",
  cursor: "pointer",
  padding: "8px 0",
  marginBottom: "12px",
};
const vipTileStyle = {
  width: "100%",
  minHeight: "135px",
  border: "none",
  textAlign: "right" as const,
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "flex-start",
};
/* =========================================================
   More
   ========================================================= */
function MoreDetail({
  title,
  icon,
  description,
  onBack,
  onSearch,
}: {
  title: string;
  icon: IconName;
  description: string;
  onBack: () => void;
  onSearch: () => void;
}) {
  return (
    <div className="inner-page">
      <button
        type="button"
        onClick={onBack}
        style={backButtonStyle}
      >
        ← بازگشت
      </button>
      <SearchButton onClick={onSearch} />
      <SectionHeaderCard
        kicker={
          title === "کلاس‌ها"
            ? "CLASSES"
            : title === "ایونت‌ها"
              ? "EVENTS"
              : title === "سوالات متداول"
                ? "FAQ"
                : title === "ساعات کاری"
                  ? "HOURS"
                  : "CONTACT"
        }
        title={title}
        description={description}
        icon={icon}
      />
      <div className="glass-list-card">
        <div className="list-copy">
          <strong>{title}</strong>
          <span>
            این بخش به‌صورت اختصاصی برای محتوای {title} کائنات‌چی طراحی می‌شود.
          </span>
        </div>
      </div>
    </div>
  );
}
function MorePage({
  onSearch,
  onOpenClasses,
  onOpenEvents,
  onOpenFaq,
  onOpenVip,
}: {
  onSearch: () => void;
  onOpenClasses: () => void;
  onOpenEvents: () => void;
  onOpenFaq: () => void;
  onOpenVip: () => void;
}) {
  return (
    <div className="inner-page">
      <SearchButton onClick={onSearch} />
      <SectionHeaderCard
        kicker="MORE"
        title="بیشتر"
        description="بخش‌های دیگر کائنات‌چی را از اینجا دنبال کن."
        icon="menu"
      />
      <div className="more-list">
        {moreItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className="glass-list-card"
            onClick={() => {
              if (item.id === "vip") {
                onOpenVip();
              }
              if (item.id === "classes") {
                onOpenClasses();
              }
              if (item.id === "events") {
                onOpenEvents();
              }
              if (item.id === "faq") {
                onOpenFaq();
              }
            }}
            style={{
              width: "100%",
              border: "none",
              textAlign: "right",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <div className="list-icon">
              <Icon name={item.icon} />
            </div>
            <div className="list-copy">
              <strong>{item.title}</strong>
              <span>{item.description}</span>
            </div>
            <div className="list-arrow">
              <Icon name="arrow" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
/* =========================================================
   Bottom navigation
   ========================================================= */
function BottomNav({
  active,
  onChange,
}: {
  active: Section;
  onChange: (section: Section) => void;
}) {
  return (
    <nav className="bottom-nav">
      <button
        type="button"
        className={`nav-item ${active === "home" ? "active" : ""}`}
        onClick={() => onChange("home")}
      >
        <span className="nav-icon">
          <Icon name="home" />
        </span>
        <span>خانه</span>
      </button>
      <button
        type="button"
        className={`nav-item ${active === "services" ? "active" : ""}`}
        onClick={() => onChange("services")}
      >
        <span className="nav-icon">
          <Icon name="spark" />
        </span>
        <span>خدمات</span>
      </button>
      <button
        type="button"
        className={`nav-item ${active === "more" ? "active" : ""}`}
        onClick={() => onChange("more")}
      >
        <span className="nav-icon">
          <Icon name="menu" />
        </span>
        <span>بیشتر</span>
      </button>
    </nav>
  );
}
/* =========================================================
   App
   ========================================================= */
function App() {
  const [section, setSection] = useState<Section>("home");
  const [searchOpen, setSearchOpen] = useState(false);
  const [externalService, setExternalService] =
    useState<Service | null>(null);
  const [externalClass, setExternalClass] =
    useState<ClassItem | null>(null);
  const [externalEvent, setExternalEvent] =
    useState<EventItem | null>(null);
  const [externalFaq, setExternalFaq] =
    useState<FAQItem | null>(null);
  const [moreScreen, setMoreScreen] = useState<
    "main" | "vip" | "classes" | "events" | "faq" | "hours" | "contact"
  >("main");
  const openSearch = () => {
    setSearchOpen(true);
  };
  const closeSearch = () => {
    setSearchOpen(false);
  };
  const openServiceFromSearch = (service: Service) => {
    setSearchOpen(false);
    setExternalClass(null);
    setExternalEvent(null);
    setExternalFaq(null);
    setExternalService(service);
    setSection("services");
  };
  const openClassFromSearch = (item: ClassItem) => {
    setSearchOpen(false);
    setExternalService(null);
    setExternalEvent(null);
    setExternalFaq(null);
    setExternalClass(item);
    setSection("more");
    setMoreScreen("classes");
  };
  const openEventFromSearch = (item: EventItem) => {
    setSearchOpen(false);
    setExternalService(null);
    setExternalClass(null);
    setExternalFaq(null);
    setExternalEvent(item);
    setSection("more");
    setMoreScreen("events");
  };
  const openFaqFromSearch = (item: FAQItem) => {
    setSearchOpen(false);
    setExternalService(null);
    setExternalClass(null);
    setExternalEvent(null);
    setExternalFaq(item);
    setSection("more");
    setMoreScreen("faq");
  };
  const goHome = () => {
    setSection("home");
    setMoreScreen("main");
    setExternalService(null);
    setExternalClass(null);
    setExternalEvent(null);
    setExternalFaq(null);
  };
  const goServices = () => {
    setSection("services");
    setMoreScreen("main");
    setExternalService(null);
    setExternalClass(null);
    setExternalEvent(null);
    setExternalFaq(null);
  };
  const goMore = () => {
    setSection("more");
    setMoreScreen("main");
    setExternalService(null);
    setExternalClass(null);
    setExternalEvent(null);
    setExternalFaq(null);
  };
  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      {section === "home" && <HomePage />}
      {section === "services" && (
        <ServicesPage
          onSearch={openSearch}
          externalService={externalService}
          onClearExternalService={() => setExternalService(null)}
        />
      )}
      {section === "more" && moreScreen === "main" && (
        <MorePage
          onSearch={openSearch}
          onOpenClasses={() => {
            setExternalClass(null);
            setMoreScreen("classes");
          }}
          onOpenEvents={() => {
            setExternalEvent(null);
            setMoreScreen("events");
          }}
          onOpenFaq={() => {
            setExternalFaq(null);
            setMoreScreen("faq");
          }}
          onOpenVip={() => {
            setMoreScreen("vip");
          }}
        />
      )}
      {section === "more" && moreScreen === "vip" && (
        <VipPage
          onBack={() => {
            setMoreScreen("main");
          }}
        />
      )}
      {section === "more" && moreScreen === "classes" && (
        <ClassesPage
          onSearch={openSearch}
          externalClass={externalClass}
          onClearExternalClass={() => setExternalClass(null)}
        />
      )}
      {section === "more" && moreScreen === "events" && (
        <EventsPage
          onSearch={openSearch}
          externalEvent={externalEvent}
          onClearExternalEvent={() => setExternalEvent(null)}
        />
      )}
      {section === "more" && moreScreen === "faq" && (
        <FAQPage
          onSearch={openSearch}
          externalFaq={externalFaq}
          onClearExternalFaq={() => setExternalFaq(null)}
        />
      )}
      {section === "more" &&
        (moreScreen === "hours" || moreScreen === "contact") && (
          <MoreDetail
            title={
              moreScreen === "hours"
                ? "ساعات کاری"
                : "ارتباط با ما"
            }
            icon={
              moreScreen === "hours"
                ? "clock"
                : "contact"
            }
            description={
              moreScreen === "hours"
                ? "زمان پاسخ‌گویی کائنات‌چی"
                : "راه‌های ارتباطی کائنات‌چی"
            }
            onBack={() => setMoreScreen("main")}
            onSearch={openSearch}
          />
        )}
      {searchOpen && (
        <GlobalSearch
          onClose={closeSearch}
          onOpenService={openServiceFromSearch}
          onOpenClass={openClassFromSearch}
          onOpenEvent={openEventFromSearch}
          onOpenFaq={openFaqFromSearch}
        />
      )}
      <BottomNav
        active={section}
        onChange={(nextSection) => {
          if (nextSection === "home") {
            goHome();
          }
          if (nextSection === "services") {
            goServices();
          }
          if (nextSection === "more") {
            goMore();
          }
        }}
      />
    </div>
  );
}
export default App;
