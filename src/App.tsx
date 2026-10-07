import { useEffect, useLayoutEffect, useRef, useState, type TouchEvent } from "react";

type Section = "home" | "services" | "booking" | "selected" | "more";

type IconName =
  | "home"
  | "spark"
  | "menu"
  | "dots"
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
  | "check"
  | "search";

type ServiceCategory =
  | "energy"
  | "candle"
  | "psychotherapy"
  | "class"
  | "event";

type Service = {
  id: string;
  title: string;
  category: ServiceCategory;
  price: string;
  duration: string;
  description: string;
};

type SearchItem = {
  id: string;
  title: string;
  description: string;
  type: "service" | "class" | "event" | "faq";
  icon: IconName;
  service?: Service;
};

type VipCustomer = {
  id?: string;
  telegramId?: string | number;
  firstName?: string | null;
  lastName?: string | null;
  mobile?: string | null;
  vipStatus?: string | null;
  joinedAt?: string | null;
  bookingsCount?: number;
};

type VipToken = {
  code?: string;
  customerId?: string;
  discount?: number | string;
  discountPercent?: number | string;
  issuedAt?: string | null;
  expiresAt?: string | null;
  status?: string | null;
  usedAt?: string | null;
  trackingCode?: string | null;
};

type VipApiResponse = {
  success: boolean;
  message?: string;
  accessDenied?: boolean;
  debug?: string;
  detail?: string;
  error?: string;
  customer?: VipCustomer;
  history?: unknown[];
  payments?: unknown[];
  tokens?: VipToken[];
  classes?: unknown[];
  events?: unknown[];
  needsConnectionCode?: boolean;
};

/*
 * VIP اصلی کائنات‌چی اکنون از Google Apps Script قدیمی
 * و همان Google Sheet مدیریت می‌شود.
 */
const VIP_API_URL =
  "https://script.google.com/macros/s/AKfycbySl6RH5K7oTLBus2cjvBJuOv-ZTjIhX9OnIq93gifQng1IfMl7f2A3Bl-7pSx1nC1u/exec";

const TELEGRAM_WEBAPP_SCRIPT =
  "https://telegram.org/js/telegram-web-app.js";

const MAIN_APP_URL =
  "https://kaenatchi.github.io/kaenatchi-mini-app/";

const BOOKING_APP_URL =
  "https://kaenatchi.github.io/booking/";

const CMS_API_URL =
  "https://script.google.com/macros/s/AKfycbzgocb54x4FDoQl3C8-o2WnipZuQYkM1j1juV-ZZKHoieN7DbrybTj3WyXbJe5I2nMhXw/exec";

type CmsRow = Record<string, unknown>;

type MoreItem = {
  id: string;
  title: string;
  icon: IconName;
  description: string;
};

const cmsRows: {
  services: CmsRow[];
  courses: CmsRow[];
  events: CmsRow[];
  faq: CmsRow[];
  pages: CmsRow[];
  settings: CmsRow[];
} = {
  services: [],
  courses: [],
  events: [],
  faq: [],
  pages: [],
  settings: [],
};

let energyServices: Service[] = [];
let mainServices: Service[] = [];
let moreItems: MoreItem[] = [];
let publishedClasses: SearchItem[] = [];
let publishedEvents: SearchItem[] = [];
let publishedFaq: SearchItem[] = [];

function cmsText(row: CmsRow, aliases: string[]): string {
  const normalized = new Map<string, unknown>();
  Object.entries(row).forEach(([key, value]) => {
    normalized.set(
      key.trim().toLowerCase().replace(/[\s_-]+/g, ""),
      value
    );
  });

  for (const alias of aliases) {
    const value = normalized.get(
      alias.trim().toLowerCase().replace(/[\s_-]+/g, "")
    );
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }

  return "";
}

function cmsActive(row: CmsRow): boolean {
  const value = cmsText(row, ["فعال", "active", "status"]).toLowerCase();
  return !value || ["بله", "فعال", "true", "1", "yes"].includes(value);
}

function cmsSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[آأإ]/g, "ا")
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";
}

function cmsCategory(value: string, title: string): ServiceCategory {
  const text = (value + " " + title)
    .toLocaleLowerCase("fa")
    .replace(/[\u200c\u200f\u200e\s_-]+/g, "");

  if (/شمعتراپی|شمع/.test(text)) return "candle";
  if (/سایکو?تراپی|سایکوتراپی|مشاوره|گفتوگو/.test(text)) return "psychotherapy";
  return "energy";
}

function mapCmsServices(rows: CmsRow[]): Service[] {
  return rows
    .filter(cmsActive)
    .map((row, index) => {
      const title =
        cmsText(row, ["نام خدمت", "عنوان", "نام", "title"]) ||
        "خدمت";
      const categoryRaw = cmsText(row, ["دسته", "دسته‌بندی", "category"]);
      const id =
        cmsText(row, ["شناسه", "id", "slug"]) ||
        `${cmsSlug(title)}-${index + 1}`;
      const description =
        cmsText(row, [
          "توضیحات کامل",
          "توضیح کوتاه",
          "توضیحات",
          "توضیح",
          "description",
          "text",
        ]);

      return {
        id,
        title,
        category: cmsCategory(categoryRaw, title),
        price: cmsText(row, ["قیمت", "هزینه", "price"]),
        duration: cmsText(row, ["مدت", "مدت زمان", "duration"]),
        description,
      };
    });
}

function mapCmsBookableItems(
  rows: CmsRow[],
  type: "class" | "event"
): Service[] {
  return rows
    .filter(cmsActive)
    .map((row, index) => {
      const title =
        cmsText(row, [
          type === "class" ? "نام دوره" : "نام ایونت",
          "عنوان",
          "نام",
          "title",
        ]) || (type === "class" ? "کلاس" : "ایونت");
      const rawId = cmsText(row, ["شناسه", "id", "slug"]);
      const id =
        "cms-" +
        type +
        "-" +
        (rawId ? cmsSlug(rawId) : cmsSlug(title) + "-" + (index + 1));
      return {
        id,
        title,
        category: type,
        price: cmsText(row, ["قیمت", "هزینه", "price", "base price"]),
        duration: cmsText(row, ["مدت", "مدت زمان", "duration"]),
        description: cmsText(row, [
          "توضیحات کامل", "توضیحات", "توضیح کوتاه", "توضیح",
          "متن", "description", "text",
        ]),
      };
    });
}

function mapCmsSearchItems(
  rows: CmsRow[],
  type: "class" | "event" | "faq"
): SearchItem[] {
  return rows
    .filter(cmsActive)
    .map((row, index) => {
      const title =
        cmsText(row, [
          type === "class" ? "نام دوره" : type === "event" ? "نام ایونت" : "سؤال",
          "عنوان",
          "نام",
          "title",
        ]) || (type === "faq" ? "سؤال" : type === "class" ? "کلاس" : "ایونت");

      const description =
        cmsText(row, [
          type === "faq" ? "پاسخ" : "توضیحات کامل",
          "توضیحات",
          "توضیح کوتاه",
          "توضیح",
          "متن",
          "description",
          "text",
        ]);

      return {
        id:
          cmsText(row, ["شناسه", "id", "slug"]) ||
          `${type}-${cmsSlug(title)}-${index + 1}`,
        title,
        description,
        type,
        icon: type === "class" ? "class" : type === "event" ? "event" : "faq",
      };
    });
}

function cmsSetting(keys: string[]): string {
  for (const row of cmsRows.settings) {
    const key = cmsText(row, ["کلید", "key", "نام", "name"]).toLowerCase();
    if (keys.some((candidate) => key.includes(candidate.toLowerCase()))) {
      return cmsText(row, ["مقدار", "value", "متن", "text", "لینک", "url"]);
    }
  }
  return "";
}

function cmsPageText(keys: string[]): string {
  for (const row of cmsRows.pages) {
    const title = cmsText(row, ["نام صفحه", "عنوان", "نام", "title"]).toLowerCase();
    const key = cmsText(row, ["کلید", "key", "slug"]).toLowerCase();
    const haystack = title + " " + key;
    if (keys.some((candidate) => haystack.includes(candidate.toLowerCase()))) {
      return cmsText(row, ["متن", "توضیحات کامل", "توضیحات", "پاسخ", "text", "description"]);
    }
  }
  return "";
}

function rebuildCmsContent(data: Partial<typeof cmsRows>) {
  cmsRows.services = Array.isArray(data.services) ? data.services : [];
  cmsRows.courses = Array.isArray(data.courses) ? data.courses : [];
  cmsRows.events = Array.isArray(data.events) ? data.events : [];
  cmsRows.faq = Array.isArray(data.faq) ? data.faq : [];
  cmsRows.pages = Array.isArray(data.pages) ? data.pages : [];
  cmsRows.settings = Array.isArray(data.settings) ? data.settings : [];

  const allServices = mapCmsServices(cmsRows.services);
  mainServices = allServices;
  energyServices = allServices.filter((service) => service.category === "energy");

  publishedClasses = mapCmsSearchItems(cmsRows.courses, "class");
  publishedEvents = mapCmsSearchItems(cmsRows.events, "event");
  publishedFaq = mapCmsSearchItems(cmsRows.faq, "faq");

  moreItems = [
    {
      id: "faq",
      title: cmsPageText(["سوالات", "faq"]) || "سوالات متداول",
      icon: "faq",
      description: "پاسخ به سوالات رایج",
    },
    {
      id: "hours",
      title: cmsPageText(["ساعات", "hours"]) || "ساعات کاری",
      icon: "clock",
      description: "زمان پاسخ‌گویی کائنات‌چی",
    },
    {
      id: "contact",
      title: cmsPageText(["ارتباط", "contact"]) || "ارتباط با ما",
      icon: "contact",
      description: "راه‌های ارتباطی کائنات‌چی",
    },
  ];
}

async function loadCmsData(): Promise<boolean> {
  try {
    const response = await fetch(
      `${CMS_API_URL}?action=getMiniAppData&_=${Date.now()}`,
      { method: "GET", cache: "no-store" }
    );

    if (!response.ok) return false;

    const data = (await response.json()) as Partial<typeof cmsRows> & {
      success?: boolean;
    };

    if (data.success === false) return false;

    rebuildCmsContent(data);
    return true;
  } catch {
    return false;
  }
}

function getCmsFaqRows() {
  return cmsRows.faq.filter(cmsActive).map((row) => ({
    question:
      cmsText(row, ["سؤال", "سوال", "question", "title"]) || "سؤال",
    answer:
      cmsText(row, ["پاسخ", "answer", "text", "توضیحات"]) || "",
  }));
}


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
          <path d="m19 4 .5 2 1.7.8-1.7.8-.5-2-1.7-.8 1.7-.8Z" />
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

    case "dots":
      return (
        <svg {...common}>
          <circle cx="6" cy="12" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="18" cy="12" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      );

    case "search":
      return (
        <svg {...common}>
          <circle cx="10.8" cy="10.8" r="6.2" />
          <path d="m15.5 15.5 4.2 4.2" />
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

function getCurrentJalaliYear() {
  try {
    const parts = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      year: "numeric",
    }).formatToParts(new Date());

    return parts.find((part) => part.type === "year")?.value ?? "۱۴۰۵";
  } catch {
    return "۱۴۰۵";
  }
}

function getTodayJalali() {
  try {
    const parts = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).formatToParts(new Date());

    const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";
    const day = parts.find((part) => part.type === "day")?.value ?? "";
    const month = parts.find((part) => part.type === "month")?.value ?? "";
    const year = parts.find((part) => part.type === "year")?.value ?? "";

    return `امروز ${weekday} ${day} ${month} ${year}`.replace(/\s+/g, " ").trim();
  } catch {
    return "امروز";
  }
}


function getTodayJalaliKey() {
  try {
    const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());

    const year = parts.find((part) => part.type === "year")?.value ?? "";
    const month = parts.find((part) => part.type === "month")?.value ?? "";
    const day = parts.find((part) => part.type === "day")?.value ?? "";

    return year && month && day
      ? year + "/" + month.padStart(2, "0") + "/" + day.padStart(2, "0")
      : "";
  } catch {
    return "";
  }
}

function normalizeJalaliKey(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/-/g, "/")
    .split("/")
    .map((part) => part.padStart(2, "0"))
    .join("/");
}

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
              boxShadow:
                "0 0 0 4px rgba(216,197,155,0.08)",
            }}
          />
          {status}
        </div>
      )}
    </div>
  );
}

function AppFooter() {
  const year = getCurrentJalaliYear();

  return (
    <footer className="app-footer" aria-label="پاورقی کائنات‌چی">
      <span>کائنات‌چی · © {year}</span>
      <span>تمامی حقوق محفوظ است.</span>
    </footer>
  );
}

function HomePage({
  onSearch,
  onOpenVip,
}: {
  onSearch: () => void;
  onOpenVip: () => void;
}) {
  const today = getTodayJalali();

  return (
    <>
      <header className="topbar home-topbar">
        <div className="home-top-actions">
          <button
            type="button"
            className="home-search-button"
            onClick={onSearch}
            aria-label="جست‌وجو"
          >
            <Icon name="search" />
          </button>

          <button
            type="button"
            className="vip-top-button"
            onClick={onOpenVip}
            aria-label="ورود به VIP"
          >
            <span className="vip-top-symbol">✦</span>
            <span>VIP</span>
          </button>
        </div>

        <div className="home-brand-inline" aria-label="کائنات‌چی">
          کائنات‌چی
        </div>

        <div className="home-date-wrap">
          <div className="date-pill">
            <span className="date-dot" />
            {today}
          </div>
        </div>
      </header>

      <main className="main-content home-page">
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
              <div className="section-kicker">
                TODAY
              </div>

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
              <div className="section-kicker">
                FEATURED
              </div>

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
              <div className="featured-label">
                KAENATCHI MOMENT
              </div>

              <h3>برای خودت یک مکث بساز.</h3>

              <p>
                فضای کائنات‌چی برای تجربه‌ای آرام، شخصی و متفاوت
                طراحی شده است.
              </p>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}

function ServiceTabs({
  active,
  onChange,
}: {
  active: "all" | ServiceCategory;
  onChange: (
    value: "all" | ServiceCategory
  ) => void;
}) {
  const tabs: {
    id: "all" | ServiceCategory;
    title: string;
  }[] = [
    {
      id: "all",
      title: "همه",
    },
    {
      id: "energy",
      title: "انرژی‌خوانی",
    },
    {
      id: "candle",
      title: "شمع‌تراپی",
    },
    {
      id: "psychotherapy",
      title: "سایکوتراپی",
    },
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
        const selected =
          active === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() =>
              onChange(tab.id)
            }
            style={{
              flex: "0 0 auto",
              border: selected
                ? "1px solid rgba(36, 99, 71, 0.35)"
                : "1px solid rgba(53, 59, 50, 0.1)",
              background: selected
                ? "rgba(36, 99, 71, 0.1)"
                : "rgba(255,255,255,0.55)",
              color: selected
                ? "#246347"
                : "#353B32",
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
        : service.category === "psychotherapy"
          ? "conversation"
          : service.category === "class"
            ? "class"
            : "event";

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

        {(service.price ||
          service.duration) && (
          <small
            style={{
              display: "block",
              marginTop: "7px",
              color: "#246347",
              fontSize: "12px",
            }}
          >
            {service.duration}

            {service.duration &&
              service.price
              ? "  •  "
              : ""}

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
  onOpenBooking,
}: {
  service: Service;
  onBack: () => void;
  onOpenBooking: (service?: Service) => void;
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
            <div
              style={{
                marginBottom: "10px",
              }}
            >
              <strong>مدت زمان</strong>

              <span>
                {service.duration}
              </span>
            </div>
          )}

          {service.price && (
            <div>
              <strong>هزینه</strong>

              <span>
                {service.price}
              </span>
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
          background:
            "linear-gradient(135deg, #174b38, #2c7658)",
          color: "#fff",
          fontFamily: "inherit",
          fontSize: "15px",
          cursor: "pointer",
          boxShadow:
            "0 10px 24px rgba(23, 75, 56, 0.2)",
        }}
        onClick={() => onOpenBooking(service)}
      >
        📅 دریافت نوبت
      </button>
    </div>
  );
}

function ServicesPage({
  focus,
  onOpenBooking,
}: {
  focus?: "all" | "classes" | "events";
  onOpenBooking: (service?: Service) => void;
}) {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | null>(null);
  const [energyFilter, setEnergyFilter] = useState<"all" | "emotional" | "career" | "general">("all");

  useEffect(() => {
    if (!focus || focus === "all") return;

    const targetId = focus === "classes" ? "services-classes" : "services-events";
    const timer = window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [focus]);

  if (selectedService) {
    return (
      <ServiceDetail
        service={selectedService}
        onBack={() => setSelectedService(null)}
        onOpenBooking={onOpenBooking}
      />
    );
  }

  const categoryCards: Array<{
    id: ServiceCategory;
    title: string;
    description: string;
    icon: IconName;
  }> = [
    {
      id: "energy",
      title: "انرژی‌خوانی",
      description: "خوانش‌های مختلف برای احساسات، مسیر و موضوع مورد نظر تو.",
      icon: "energy",
    },
    {
      id: "candle",
      title: "شمع‌تراپی",
      description: "جلسه‌ای غیرحضوری با تمرکز بر نیت و موضوع انتخابی تو.",
      icon: "candle",
    },
    {
      id: "psychotherapy",
      title: "گفت‌وگو",
      description: "جلسه‌ای گفت‌وگومحور برای صحبت درباره موضوع مورد نظر تو.",
      icon: "conversation",
    },
  ];

  const categoryServices =
    activeCategory === "energy"
      ? energyServices
      : activeCategory
        ? mainServices.filter((service) => service.category === activeCategory)
        : [];

  const filteredEnergyServices =
    energyFilter === "all"
      ? categoryServices
      : categoryServices.filter((service) => {
          if (energyFilter === "emotional") {
            return /احساس|عاطف/i.test(service.title);
          }
          if (energyFilter === "career") {
            return /شغلی|مالی/i.test(service.title);
          }
          return !/احساس|عاطف|شغلی|مالی/i.test(service.title);
        });

  const visibleServices =
    activeCategory === "energy"
      ? filteredEnergyServices
      : categoryServices;

  const openCategory = (category: ServiceCategory) => {
    setEnergyFilter("all");
    setActiveCategory(category);
    window.setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
  };

  return (
    <div className="inner-page services-page">
      <SectionHeaderCard
        kicker="SERVICES"
        title="خدمات کائنات‌چی"
        description={
          activeCategory
            ? "خدمت مورد نظرت را انتخاب کن تا جزئیات و مسیر دریافت نوبت را ببینی."
            : "از میان خدمات کائنات‌چی، مسیر مناسب خودت را انتخاب کن."
        }
        icon="spark"
      />

      {!activeCategory ? (
        <>
          <div className="services-section-intro">
            <span>دنیای خدمات</span>
            <strong>هر چیزی که اینجا می‌بینی، یک مسیر مشخص دارد.</strong>
          </div>

          <div className="services-category-grid" aria-label="دسته‌بندی خدمات">
            {categoryCards.map((category) => (
              <button
                key={category.id}
                type="button"
                className="services-category-card"
                onClick={() => openCategory(category.id)}
              >
                <span className="services-category-icon">
                  <Icon name={category.icon} />
                </span>
                <span className="services-category-copy">
                  <strong>{category.title}</strong>
                  <span>{category.description}</span>
                </span>
                <span className="services-category-arrow">
                  <Icon name="arrow" />
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <button
            type="button"
            className="services-back-button"
            onClick={() => {
              setActiveCategory(null);
              setEnergyFilter("all");
            }}
          >
            <span>→</span>
            <span>همه خدمات</span>
          </button>

          <div className="services-category-title">
            <div className="services-category-title-icon">
              <Icon
                name={
                  activeCategory === "energy"
                    ? "energy"
                    : activeCategory === "candle"
                      ? "candle"
                      : "conversation"
                }
              />
            </div>
            <div>
              <span>
                {activeCategory === "energy"
                  ? "ENERGY READING"
                  : activeCategory === "candle"
                    ? "CANDLE"
                    : "CONVERSATION"}
              </span>
              <strong>
                {activeCategory === "energy"
                  ? "انرژی‌خوانی"
                  : activeCategory === "candle"
                    ? "شمع‌تراپی"
                    : "گفت‌وگو"}
              </strong>
            </div>
          </div>

          {activeCategory === "energy" && (
            <div className="services-filter-row" aria-label="فیلتر انرژی‌خوانی">
              {[
                ["all", "همه"],
                ["emotional", "احساسی"],
                ["career", "شغلی و مالی"],
                ["general", "عمومی"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={"services-filter-chip " + (energyFilter === id ? "active" : "")}
                  onClick={() =>
                    setEnergyFilter(id as "all" | "emotional" | "career" | "general")
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className="service-list services-detail-list">
            {visibleServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onClick={() => setSelectedService(service)}
              />
            ))}
          </div>
        </>
      )}

      {!activeCategory && (
        <>
          <div className="services-world-heading">
            <span>دنیای کائنات‌چی</span>
            <strong>آموزش و رویداد</strong>
          </div>

          <div className="services-content-lobby">
            <button
              id="services-classes"
              type="button"
              className={"services-content-card services-content-button " + (focus === "classes" ? "is-focused" : "")}
              onClick={() => {
                document.getElementById("services-classes")?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }}
            >
              <div className="services-content-icon"><Icon name="class" /></div>
              <div className="list-copy">
                <strong>کلاس‌ها</strong>
                {publishedClasses.length > 0
                  ? publishedClasses.map((item) => (
                      <span key={item.id}>{item.title} — {item.description}</span>
                    ))
                  : <span>آموزش‌ها و دوره‌های کائنات‌چی به‌صورت خودکار اینجا نمایش داده می‌شوند.</span>}
              </div>
              <div className="list-arrow"><Icon name="arrow" /></div>
            </button>

            <button
              id="services-events"
              type="button"
              className={"services-content-card services-content-button " + (focus === "events" ? "is-focused" : "")}
              onClick={() => {
                document.getElementById("services-events")?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }}
            >
              <div className="services-content-icon"><Icon name="event" /></div>
              <div className="list-copy">
                <strong>ایونت‌ها</strong>
                {publishedEvents.length > 0
                  ? publishedEvents.map((item) => (
                      <span key={item.id}>{item.title} — {item.description}</span>
                    ))
                  : <span>رویدادها و برنامه‌های پیش روی کائنات‌چی اینجا قرار می‌گیرند.</span>}
              </div>
              <div className="list-arrow"><Icon name="arrow" /></div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}


function SelectedPage({
  onNavigate,
  onOpenService,
}: {
  onNavigate: (section: Section) => void;
  onOpenService: (service: Service) => void;
}) {
  const [revealOpen, setRevealOpen] = useState(false);
  const [path, setPath] = useState<"all" | "calm" | "clarity" | "learning">("all");

  const allSelected: Array<SearchItem & { badge: string }> = [
    ...mainServices.map((service) => ({
      id: service.id,
      title: service.title,
      description: service.description,
      type: "service" as const,
      icon: (service.category === "energy"
        ? "energy"
        : service.category === "candle"
          ? "candle"
          : "conversation") as IconName,
      service,
      badge: "خدمت",
    })),
    ...energyServices.map((service) => ({
      id: service.id,
      title: service.title,
      description: service.description,
      type: "service" as const,
      icon: "energy" as IconName,
      service,
      badge: "انرژی‌خوانی",
    })),
    ...publishedClasses.map((item) => ({ ...item, badge: "کلاس" })),
    ...publishedEvents.map((item) => ({ ...item, badge: "ایونت" })),
  ];

  const daySeed = new Date().getDate() + new Date().getMonth() * 31;
  const offset = allSelected.length ? daySeed % allSelected.length : 0;
  const rotated = allSelected.length
    ? [...allSelected.slice(offset), ...allSelected.slice(0, offset)]
    : [];

  const pathItems = rotated.filter((item) => {
    if (path === "all") return true;
    const text = (item.title + " " + item.description).toLocaleLowerCase("fa");
    if (path === "calm") return /آرام|شمع|گفت.?وگو|احساس|عاطف/.test(text);
    if (path === "clarity") return /مسیر|عمومی|انرژی|قهوه|پاسور|اوراکل|خوانش/.test(text);
    return item.type === "class" || item.type === "event" || /آموزش|کلاس|دوره/.test(text);
  });

  const featured = pathItems[0] ?? rotated[0];
  const secondary = pathItems.slice(1, 4);
  const revealItem = rotated.length
    ? rotated[(daySeed * 7 + 3) % rotated.length]
    : null;

  const openItem = (item: (SearchItem & { badge: string }) | undefined) => {
    if (!item) return;
    if (item.service) {
      onOpenService(item.service);
      return;
    }
    if (item.type === "class") {
      onNavigate("services");
      window.setTimeout(() => {
        document.getElementById("services-classes")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 120);
      return;
    }
    if (item.type === "event") {
      onNavigate("services");
      window.setTimeout(() => {
        document.getElementById("services-events")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 120);
    }
  };

  return (
    <div className="inner-page selected-page">
      <section className="selected-intro">
        <div className="selected-intro-mark">
          <Icon name="spark" />
        </div>
        <div className="selected-intro-copy">
          <span>KAENATCHI CURATED</span>
          <h1>منتخب کائنات‌چی</h1>
          <p>چیزهایی که این روزها ارزش دیدن دارند.</p>
        </div>
        <div className="selected-intro-line" />
      </section>

      {featured ? (
        <button
          type="button"
          className="selected-feature"
          onClick={() => openItem(featured)}
          aria-label={`مشاهده ${featured.title}`}
        >
          <div className="selected-feature-orbit orbit-a" />
          <div className="selected-feature-orbit orbit-b" />
          <div className="selected-feature-copy">
            <span className="selected-eyebrow">انتخاب امروز</span>
            <strong>{featured.title}</strong>
            <p>{featured.description}</p>
            <span className="selected-feature-link">مشاهده <span>←</span></span>
          </div>
          <div className="selected-feature-badge">
            <Icon name={featured.icon} />
            <small>{featured.badge}</small>
          </div>
        </button>
      ) : (
        <div className="selected-feature selected-empty-feature">
          <span className="selected-eyebrow">منتخب کائنات‌چی</span>
          <strong>هنوز چیزی برای انتخاب نداریم</strong>
          <p>با فعال شدن محتوا در خدمات، کلاس‌ها یا ایونت‌ها، این فضا خودکار پر می‌شود.</p>
        </div>
      )}

      <section className="selected-paths">
        <div className="selected-section-heading">
          <span>یک حال‌وهوا انتخاب کن</span>
          <strong>برای تو</strong>
        </div>

        <div className="selected-path-grid">
          {[
            { id: "calm" as const, title: "آرامش", icon: "candle" as IconName, copy: "چیزهای نرم‌تر و آرام‌تر" },
            { id: "clarity" as const, title: "وضوح", icon: "spark" as IconName, copy: "برای وقتی که دنبال جهت هستی" },
            { id: "learning" as const, title: "یادگیری", icon: "class" as IconName, copy: "چیزهایی برای یاد گرفتن" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              className={`selected-path-card ${path === item.id ? "active" : ""}`}
              onClick={() => setPath(path === item.id ? "all" : item.id)}
            >
              <span className="selected-path-icon"><Icon name={item.icon} /></span>
              <strong>{item.title}</strong>
              <span>{item.copy}</span>
            </button>
          ))}
        </div>
      </section>

      {secondary.length > 0 && (
        <section className="selected-now">
          <div className="selected-section-heading">
            <span>چند انتخاب کوتاه</span>
            <strong>این روزها در کائنات‌چی</strong>
          </div>

          <div className="selected-mini-grid">
            {secondary.map((item) => (
              <button
                type="button"
                className="selected-mini-card"
                key={item.id}
                onClick={() => openItem(item)}
              >
                <span className="selected-mini-top">
                  <small>{item.badge}</small>
                  <span><Icon name="arrow" /></span>
                </span>
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className={`selected-reveal ${revealOpen ? "is-open" : ""}`}>
        <div className="selected-reveal-stars">✦ &nbsp; ✦ &nbsp; ✦</div>
        <span className="selected-eyebrow">یک انتخاب برای امروز</span>
        <h2>{revealOpen && revealItem ? revealItem.title : "امروز چی ببینم؟"}</h2>
        <p>
          {revealOpen && revealItem
            ? revealItem.description
            : "یک انتخاب از چیزهایی که همین حالا در کائنات‌چی وجود دارند؛ نه فال، فقط یک پیشنهاد خوب."}
        </p>
        <button
          type="button"
          className="selected-reveal-button"
          onClick={() => {
            setRevealOpen(true);
            if (revealItem) {
              window.setTimeout(() => openItem(revealItem), 620);
            }
          }}
        >
          {revealOpen ? "مشاهده انتخاب ←" : "✦ امروز چی ببینم؟"}
        </button>
      </section>

      <section className="selected-discover">
        <div>
          <span>اگر می‌خواهی بیشتر ببینی</span>
          <strong>کائنات‌چی را کشف کن</strong>
        </div>
        <div className="selected-discover-links">
          <button type="button" onClick={() => onNavigate("services")}>خدمات <span>←</span></button>
          <button type="button" onClick={() => {
            onNavigate("services");
            window.setTimeout(() => document.getElementById("services-classes")?.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
          }}>کلاس‌ها <span>←</span></button>
          <button type="button" onClick={() => {
            onNavigate("services");
            window.setTimeout(() => document.getElementById("services-events")?.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
          }}>ایونت‌ها <span>←</span></button>
        </div>
      </section>
    </div>
  );
}

function SearchPage({
  onBack,
  onOpenService,
}: {
  onBack: () => void;
  onOpenService: (
    service: Service
  ) => void;
}) {
  const [query, setQuery] =
    useState("");

  const serviceItems: SearchItem[] = [
    ...mainServices.map(
      (service) => ({
        id: service.id,
        title: service.title,
        description:
          service.description,
        type: "service" as const,
        icon:
          service.category ===
          "energy"
            ? ("energy" as IconName)
            : service.category ===
                "candle"
              ? ("candle" as IconName)
              : ("conversation" as IconName),
        service,
      })
    ),

    ...energyServices.map(
      (service) => ({
        id: service.id,
        title: service.title,
        description:
          service.description,
        type: "service" as const,
        icon: "energy" as IconName,
        service,
      })
    ),
  ];

  const allItems: SearchItem[] = [
    ...serviceItems,
    ...publishedClasses,
    ...publishedEvents,
    ...publishedFaq,
  ];

  const normalizedQuery =
    query
      .trim()
      .toLocaleLowerCase("fa");

  const results =
    normalizedQuery.length === 0
      ? []
      : allItems.filter((item) => {
          const searchableText =
            `${item.title} ${item.description}`.toLocaleLowerCase(
              "fa"
            );

          return searchableText.includes(
            normalizedQuery
          );
        });

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
        kicker="SEARCH"
        title="جست‌وجو"
        description="خدمات، کلاس‌ها، ایونت‌ها و سوالات متداول را پیدا کن."
        icon="search"
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "13px 15px",
          borderRadius: "18px",
          background:
            "rgba(255,255,255,0.72)",
          border:
            "1px solid rgba(53,59,50,0.12)",
          boxShadow:
            "0 8px 22px rgba(53,59,50,0.07)",
          marginBottom: "16px",
        }}
      >
        <Icon name="search" />

        <input
          value={query}
          onChange={(event) =>
            setQuery(
              event.target.value
            )
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.blur();
              window.requestAnimationFrame(() => {
                const activeElement = document.activeElement;
                if (
                  activeElement instanceof HTMLInputElement ||
                  activeElement instanceof HTMLTextAreaElement ||
                  activeElement instanceof HTMLSelectElement
                ) {
                  activeElement.blur();
                }
              });
            }
          }}
          autoFocus
          type="search"
          placeholder="چی می‌خوای پیدا کنی؟"
          aria-label="جست‌وجو"
          style={{
            flex: 1,
            minWidth: 0,
            border: "none",
            outline: "none",
            background:
              "transparent",
            fontFamily: "inherit",
            fontSize: "16px",
            color: "#353B32",
            direction: "rtl",
          }}
        />

        {query && (
          <button
            type="button"
            onClick={() =>
              setQuery("")
            }
            aria-label="پاک کردن جست‌وجو"
            style={{
              border: "none",
              background:
                "transparent",
              color: "#7b8178",
              fontFamily:
                "inherit",
              fontSize: "18px",
              cursor: "pointer",
              padding: "3px 5px",
            }}
          >
            ×
          </button>
        )}
      </div>

      {query.trim().length === 0 ? (
        <div
          className="glass-list-card"
          style={{
            textAlign: "center",
            display: "block",
          }}
        >
          <div
            style={{
              width: "58px",
              height: "58px",
              margin:
                "0 auto 13px",
              borderRadius: "20px",
              display: "grid",
              placeItems:
                "center",
              background:
                "rgba(36,99,71,0.08)",
              color: "#246347",
            }}
          >
            <Icon name="search" />
          </div>

          <div className="list-copy">
            <strong>
              دنبال چه چیزی می‌گردی؟
            </strong>

            <span>
              نام خدمت، انرژی‌خوانی، کلاس، ایونت یا سوال مورد
              نظرت را جست‌وجو کن.
            </span>
          </div>
        </div>
      ) : results.length > 0 ? (
        <div className="service-list">
          {results.map((item) => (
            <button
              key={`${item.type}-${item.id}`}
              type="button"
              className="glass-list-card"
              onClick={() => {
                if (
                  item.type ===
                    "service" &&
                  item.service
                ) {
                  onOpenService(
                    item.service
                  );
                }
              }}
              style={{
                width: "100%",
                border: "none",
                textAlign:
                  "right",
                cursor:
                  item.type ===
                  "service"
                    ? "pointer"
                    : "default",
                fontFamily:
                  "inherit",
              }}
            >
              <div className="list-icon">
                <Icon
                  name={item.icon}
                />
              </div>

              <div className="list-copy">
                <small
                  style={{
                    display:
                      "block",
                    color:
                      "#8a7348",
                    fontSize:
                      "10px",
                    marginBottom:
                      "4px",
                  }}
                >
                  {item.type ===
                  "service"
                    ? "خدمت"
                    : item.type ===
                        "class"
                      ? "کلاس"
                      : item.type ===
                          "event"
                        ? "ایونت"
                        : "سوال متداول"}
                </small>

                <strong>
                  {item.title}
                </strong>

                <span>
                  {item.description}
                </span>
              </div>

              {item.type ===
                "service" && (
                <div className="list-arrow">
                  <Icon name="arrow" />
                </div>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div
          className="glass-list-card"
          style={{
            display: "block",
            textAlign:
              "center",
          }}
        >
          <div
            style={{              width: "58px",
              height: "58px",
              margin:
                "0 auto 13px",
              borderRadius:
                "20px",
              display: "grid",
              placeItems:
                "center",
              background:
                "rgba(53,59,50,0.07)",
              color:
                "#353B32",
            }}
          >
            <Icon name="search" />
          </div>

          <div className="list-copy">
            <strong>
              چیزی پیدا نشد
            </strong>

            <span>
              عبارت دیگری را امتحان کن یا نام بخش مورد نظرت را
              کوتاه‌تر بنویس.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   TELEGRAM VIP
   ========================================================= */

type TelegramWebApp = {
  initData: string;
  ready?: () => void;
  expand?: () => void;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}


/* =========================================================
   TELEGRAM SDK
========================================================= */

function loadTelegramWebAppScript(): Promise<void> {
  if (
    window.Telegram?.WebApp
  ) {
    return Promise.resolve();
  }

  const existingScript =
    document.querySelector(
      `script[src="${TELEGRAM_WEBAPP_SCRIPT}"]`
    ) as HTMLScriptElement | null;

  if (existingScript) {
    return new Promise(
      (resolve, reject) => {

        if (
          window.Telegram?.WebApp
        ) {
          resolve();
          return;
        }

        const timeout =
          window.setTimeout(() => {
            reject(
              new Error(
                "Telegram WebApp SDK timeout"
              )
            );
          }, 8000);

        existingScript.addEventListener(
          "load",
          () => {

            window.clearTimeout(
              timeout
            );

            if (
              window.Telegram?.WebApp
            ) {
              resolve();
            } else {
              reject(
                new Error(
                  "Telegram WebApp API unavailable"
                )
              );
            }
          },
          { once: true }
        );

        existingScript.addEventListener(
          "error",
          () => {

            window.clearTimeout(
              timeout
            );

            reject(
              new Error(
                "Telegram WebApp SDK load error"
              )
            );
          },
          { once: true }
        );
      }
    );
  }

  return new Promise(
    (resolve, reject) => {

      const script =
        document.createElement(
          "script"
        );

      script.src =
        TELEGRAM_WEBAPP_SCRIPT;

      script.async = true;

      script.onload = () => {

        if (
          window.Telegram?.WebApp
        ) {
          resolve();
        } else {
          reject(
            new Error(
              "Telegram WebApp API unavailable"
            )
          );
        }
      };

      script.onerror = () => {

        reject(
          new Error(
            "Telegram WebApp SDK load error"
          )
        );
      };

      document.head.appendChild(
        script
      );
    }
  );
}



type VipRecord = {
  id: string;
  service: string;
  date: string;
  time: string;
  status: string;
  amount: string;
  tracking: string;
  raw: unknown;
};

type VipPayment = VipRecord;

type VipClassEvent = {
  id: string;
  title: string;
  status: string;
  start: string;
  end: string;
  progress: string;
  details: string;
  raw: unknown;
};

function vipText(value: unknown): string {
  return value == null ? "" : String(value).trim();
}

function normalizeVipKey(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function unwrapVipRows(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  const obj = value as Record<string, unknown>;
  for (const key of ["data", "items", "rows", "history", "payments", "classes", "events", "result"]) {
    if (Array.isArray(obj[key])) return obj[key] as unknown[];
  }
  return [];
}

function readVipField(obj: Record<string, unknown>, aliases: string[]): string {
  const map = new Map<string, unknown>();
  Object.entries(obj).forEach(([key, value]) => map.set(normalizeVipKey(key), value));
  for (const alias of aliases) {
    const value = map.get(normalizeVipKey(alias));
    if (value != null && String(value).trim() !== "") return String(value).trim();
  }
  return "";
}

function looksLikeVipHeader(row: unknown[]): boolean {
  const text = row.map(v => vipText(v)).join(" ").toLocaleLowerCase("fa");
  return /خدمت|تاریخ|ساعت|وضعیت|مبلغ|service|date|status|amount|payment|پرداخت/.test(text) &&
    !/\d{3,4}[\/-]\d{1,2}[\/-]\d{1,2}/.test(text);
}

function normalizeVipRecordRows(value: unknown, prefix: string): VipRecord[] {
  return unwrapVipRows(value).map((raw, index): VipRecord | null => {
    if (Array.isArray(raw)) {
      if (looksLikeVipHeader(raw)) return null;
      const cells = raw.map(vipText);
      const dateIndex = cells.findIndex(v => /^(?:1[34]\d{2}|\d{3})[\/-]\d{1,2}[\/-]\d{1,2}/.test(v));
      const service = cells[0] || cells[1] || "خدمت کائنات‌چی";
      const date = dateIndex >= 0 ? cells[dateIndex] : cells[1] || "";
      const time = cells.find(v => /^\d{1,2}:\d{2}/.test(v)) || "";
      const status = cells.find(v => /تایید|تکمیل|انجام|رزرو|لغو|در انتظار|موفق|پرداخت|فعال|confirmed|completed|pending|cancel/i.test(v)) || "";
      const amount = cells.find(v => /(?:تومان|ریال|\d{3}[,،]\d{3})/.test(v) && v !== date) || "";
      const tracking = cells.find(v => /پیگیری|tracking|receipt/i.test(v)) || "";
      return { id: prefix + "-" + index, service, date, time, status, amount, tracking, raw };
    }
    if (!raw || typeof raw !== "object") return null;
    const obj = raw as Record<string, unknown>;
    const service = readVipField(obj, ["service","serviceName","title","name","نام خدمت","خدمت","نوع خدمت"]);
    const date = readVipField(obj, ["date","bookingDate","appointmentDate","jalaliDate","تاریخ","تاریخ نوبت"]);
    const time = readVipField(obj, ["time","bookingTime","appointmentTime","ساعت"]);
    const status = readVipField(obj, ["status","bookingStatus","paymentStatus","وضعیت","وضعیت نوبت"]);
    const amount = readVipField(obj, ["amount","price","total","paymentAmount","مبلغ","هزینه"]);
    const tracking = readVipField(obj, ["tracking","trackingCode","receipt","receiptCode","کد پیگیری"]);
    if (!service && !date && !status) return null;
    return { id: prefix + "-" + index, service: service || "خدمت کائنات‌چی", date, time, status, amount, tracking, raw };
  }).filter((row): row is VipRecord => row !== null);
}

function normalizeVipRowsForClassEvent(value: unknown, prefix: "class" | "event"): VipClassEvent[] {
  return unwrapVipRows(value).map((raw, index): VipClassEvent | null => {
    if (Array.isArray(raw)) {
      const cells = raw.map(vipText);
      if (looksLikeVipHeader(raw)) return null;
      return {
        id: prefix + "-" + index,
        title: cells[0] || cells[1] || (prefix === "class" ? "کلاس کائنات‌چی" : "ایونت کائنات‌چی"),
        status: cells.find(v => /درحالبرگزاری|گذرانده|شرکتکرد|ثبت|پیشرو|تکمیل|active|completed|attended|upcoming|current/i.test(v)) || "ثبت‌شده",
        start: cells.find(v => /^(?:1[34]\d{2}|\d{3})[\/-]\d{1,2}[\/-]\d{1,2}/.test(v)) || "",
        end: "",
        progress: cells.find(v => /جلسه|درصد|پیشرفت|session|progress/i.test(v)) || "",
        details: cells.slice(2).filter(Boolean).join(" • "),
        raw,
      };
    }
    if (!raw || typeof raw !== "object") return null;
    const obj = raw as Record<string, unknown>;
    const title = readVipField(obj, ["title","name","className","eventName","نام کلاس","نام ایونت","عنوان"]);
    if (!title) return null;
    return {
      id: prefix + "-" + index,
      title,
      status: readVipField(obj, ["status","state","وضعیت"]) || "ثبت‌شده",
      start: readVipField(obj, ["start","startDate","date","jalaliDate","تاریخ شروع","تاریخ"]),
      end: readVipField(obj, ["end","endDate","تاریخ پایان"]),
      progress: readVipField(obj, ["progress","session","sessions","پیشرفت","جلسه"]),
      details: readVipField(obj, ["details","description","توضیحات"]),
      raw,
    };
  }).filter((item): item is VipClassEvent => item !== null);
}

function normalizeVipStatus(value: string): "completed" | "upcoming" | "pending" | "successful" | "returned" | "other" {
  const s = value.replace(/\s+/g, "").toLocaleLowerCase("fa");
  if (/لغو|برگشت|ناموفق|cancel|refund|failed|returned/.test(s)) return "returned";
  if (/درانتظار|انتظار|pending/.test(s)) return "pending";
  if (/موفق|پرداختشد|success|paid/.test(s)) return "successful";
  if (/انجامشد|تکمیل|completed|done|گذرانده|شرکتکرد|attended/.test(s)) return "completed";
  return /تایید|رزرو|فعال|confirmed|booked|upcoming/.test(s) ? "upcoming" : "other";
}

function formatVipAmount(value: string): string {
  const text = value.trim();
  if (!text) return "";
  if (/تومان|ریال/.test(text)) return text;
  const digits = text.replace(/[^\d]/g, "");
  if (!digits) return text;
  return Number(digits).toLocaleString("fa-IR") + " تومان";
}

function vipExperienceCategory(service: string): string {
  const s = service
    .trim()
    .toLocaleLowerCase("fa")
    .replace(/[\u200c\s]+/g, " ");

  if (s.includes("قهوه")) return "قهوه";
  if (s.includes("پاسور")) return "پاسور";
  if (s.includes("رایدر وایت") || s.includes("رایدر-وایت")) return "تاروت رایدر وایت";
  if (s.includes("رایدر احساسی")) return "تاروت رایدر احساسی";
  if (s.includes("رایدر شغلی") || s.includes("رایدر مالی")) return "تاروت رایدر شغلی - مالی";
  if (s.includes("لنورماند فرانسوی")) return "لنورماند فرانسوی";
  if (s.includes("لنورماند احساسی")) return "لنورماند احساسی";
  if (s.includes("تاروت یونانی") && s.includes("احساس")) return "تاروت یونانی احساسی";
  if (s.includes("تاروت مارسی") && s.includes("احساس")) return "تاروت مارسی احساسی";
  if (s.includes("جم") || s.includes("اوراکل")) return "جم اوراکل";
  if (s.includes("شمع")) return "شمع‌تراپی";
  if (s.includes("سایکو")) return "سایکوتراپی";

  // New services are kept as their own category instead of being
  // collapsed into «سایر», so a newly added service can appear
  // automatically as soon as it exists in the VIP history/API.
  return service.trim() || "سایر";
}

function VipFilterTabs({ options, value, onChange }: {
  options: Array<{ id: string; title: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: "8px", overflowX: "auto", padding: "2px 1px 13px", scrollbarWidth: "none" }}>
      {options.map(option => {
        const active = option.id === value;
        return (
          <button key={option.id} type="button" onClick={() => onChange(option.id)} style={{
            flex: "0 0 auto", minHeight: "40px", borderRadius: "999px",
            border: active ? "1px solid rgba(36,99,71,0.28)" : "1px solid rgba(53,59,50,0.1)",
            background: active ? "rgba(36,99,71,0.1)" : "rgba(255,255,255,0.58)",
            color: active ? "#246347" : "#555b53", padding: "9px 14px",
            fontFamily: "inherit", fontSize: "12px", fontWeight: active ? 700 : 500,
            cursor: "pointer", boxShadow: active ? "0 6px 15px rgba(36,99,71,0.09)" : "0 3px 10px rgba(53,59,50,0.05)",
          }}>{option.title}</button>
        );
      })}
    </div>
  );
}

function VipRecordCard({ record, kind = "booking" }: { record: VipRecord; kind?: "booking" | "payment" }) {
  const status = normalizeVipStatus(record.status);
  const statusLabel = status === "completed" ? "انجام‌شده" : status === "pending" ? "در انتظار" : status === "successful" ? "موفق" : status === "returned" ? "برگشت‌خورده" : status === "upcoming" ? "پیش‌رو" : (record.status || "ثبت‌شده");
  const statusColor = status === "returned" ? "#9a5c52" : status === "pending" ? "#8a7146" : status === "completed" || status === "successful" ? "#246347" : "#5e665e";
  return (
    <div className="glass-list-card" style={{ display: "block", border: "1px solid " + statusColor + "22" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <strong style={{ display: "block", color: "#353B32", fontSize: "15px", marginBottom: "6px" }}>{record.service}</strong>
          {(record.date || record.time) && <span style={{ display: "block", color: "#73786f", fontSize: "12px", lineHeight: 1.8 }}>{record.date ? formatVipJalaliDate(record.date) : ""}{record.date && record.time ? "  •  " : ""}{record.time}</span>}
        </div>
        <span style={{ flex: "0 0 auto", padding: "6px 9px", borderRadius: "10px", background: statusColor + "12", border: "1px solid " + statusColor + "28", color: statusColor, fontSize: "10px", fontWeight: 700 }}>{statusLabel}</span>
      </div>
      {kind === "payment" && record.amount && <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid rgba(53,59,50,0.08)", display: "flex", justifyContent: "space-between", gap: "10px", fontSize: "12px" }}><span style={{ color: "#73786f" }}>مبلغ</span><strong style={{ color: "#353B32" }}>{formatVipAmount(record.amount)}</strong></div>}
      {kind === "payment" && record.tracking && <div style={{ marginTop: "7px", display: "flex", justifyContent: "space-between", gap: "10px", fontSize: "11px" }}><span style={{ color: "#73786f" }}>کد پیگیری</span><strong style={{ color: "#353B32", direction: "ltr" }}>{record.tracking}</strong></div>}
    </div>
  );
}

function VipClassEventCard({ item, type }: { item: VipClassEvent; type: "class" | "event" }) {
  return (
    <div className="glass-list-card" style={{ display: "block" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <div className="list-icon"><Icon name={type === "class" ? "class" : "event"} /></div>
        <div className="list-copy" style={{ flex: 1 }}>
          <strong>{item.title}</strong>
          <span>{item.status || "ثبت‌شده"}</span>
          {(item.start || item.end) && <span>{item.start ? formatVipJalaliDate(item.start) : ""}{item.end ? "  تا  " + formatVipJalaliDate(item.end) : ""}</span>}
          {item.progress && <span>{item.progress}</span>}
          {item.details && <span>{item.details}</span>}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   VIP CUSTOMER NORMALIZER
========================================================= */

function normalizeVipCustomer(
  customer: any
): VipCustomer {

  return {

    id:
      customer?.id ??
      customer?.customerId ??
      undefined,

    telegramId:
      customer?.telegramId ??
      customer?.telegram_id ??
      undefined,

    firstName:
      customer?.firstName ??
      customer?.first_name ??
      null,

    lastName:
      customer?.lastName ??
      customer?.last_name ??
      null,

    mobile:
      customer?.mobile ??
      null,

    vipStatus:
      customer?.vipStatus ??
      customer?.vip_status ??
      null,

    joinedAt:
      formatVipJalaliDate(
        customer?.joinedAt ??
          customer?.joined_at ??
          null
      ),

    bookingsCount:
      Number(
        customer?.bookingsCount ??
          customer?.bookings_count ??
          0
      ) || 0,
  };
}




function normalizeVipTokens(value: unknown): VipToken[] {
  const unwrap = (input: unknown): unknown[] => {
    if (Array.isArray(input)) return input;
    if (!input || typeof input !== "object") return [];
    const obj = input as Record<string, unknown>;
    for (const key of ["tokens", "data", "items", "rows", "result"]) {
      if (Array.isArray(obj[key])) return obj[key] as unknown[];
    }
    return [];
  };

  const source = unwrap(value);

  const normalizeKey = (key: string) =>
    key.trim().toLowerCase().replace(/[\s_-]+/g, "");

  const read = (obj: Record<string, unknown>, aliases: string[]) => {
    const normalized = new Map<string, unknown>();
    Object.entries(obj).forEach(([key, val]) => {
      normalized.set(normalizeKey(key), val);
    });

    for (const alias of aliases) {
      const found = normalized.get(normalizeKey(alias));
      if (found !== undefined && found !== null && String(found).trim() !== "") {
        return found;
      }
    }

    // Backend versions may use an unexpected field name. Since VIP codes
    // have a stable format, safely detect the code from object values.
    for (const found of Object.values(obj)) {
      if (typeof found === "string" && /^VIP-[A-Z0-9]+$/i.test(found.trim())) {
        return found.trim();
      }
    }

    return "";
  };

  const normalized = source
    .map((raw): VipToken | null => {
      if (Array.isArray(raw)) {
        return {
          code: String(raw[0] ?? "").trim(),
          customerId: String(raw[1] ?? "").trim(),
          discount: raw[2] ?? "",
          discountPercent: raw[2] ?? "",
          issuedAt: raw[3] == null ? "" : String(raw[3]),
          expiresAt: raw[4] == null ? "" : String(raw[4]),
          status: raw[5] == null ? "" : String(raw[5]),
          usedAt: raw[6] == null ? "" : String(raw[6]),
          trackingCode: raw[7] == null ? "" : String(raw[7]),
        };
      }

      if (!raw || typeof raw !== "object") return null;

      const obj = raw as Record<string, unknown>;

      return {
        code: String(read(obj, [
          "code", "token", "tokenCode", "token_code", "coupon", "couponCode",
          "discountCode", "discount_code", "promoCode", "promo_code",
          "کد", "توکن", "توکن اختصاصی", "کد تخفیف", "کدتخفیف"
        ]) ?? "").trim(),
        customerId: String(read(obj, [
          "customerId", "customer_id", "customer", "vipId", "vip_id", "شناسه مشتری"
        ]) ?? "").trim(),
        discount: String(read(obj, [
          "discount", "discountPercent", "discount_percentage", "percent",
          "discountValue", "درصد تخفیف", "تخفیف"
        ]) ?? ""),
        discountPercent: String(read(obj, [
          "discountPercent", "discount_percentage", "percent", "discount",
          "discountValue", "درصد تخفیف", "تخفیف"
        ]) ?? ""),
        issuedAt: String(read(obj, [
          "issuedAt", "issued_at", "issueDate", "issue_date", "createdAt",
          "created_at", "dateIssued", "تاریخ صدور"
        ]) ?? ""),
        expiresAt: String(read(obj, [
          "expiresAt", "expires_at", "expiryDate", "expiry_date", "expireAt",
          "expire_at", "تاریخ انقضا"
        ]) ?? ""),
        status: String(read(obj, [
          "status", "tokenStatus", "token_status", "وضعیت"
        ]) ?? ""),
        usedAt: String(read(obj, [
          "usedAt", "used_at", "تاریخ استفاده"
        ]) ?? ""),
        trackingCode: String(read(obj, [
          "trackingCode", "tracking_code", "کد پیگیری"
        ]) ?? ""),
      };
    })
    .filter((token): token is VipToken => token !== null);

  // Prevent repeated backend rows from producing repeated cards.
  // Some backend responses duplicate the same token while changing an
  // internal field. The customer-facing identity of a token is its
  // customer + discount + issue/expiry window + usage state.
  const seen = new Set<string>();
  return normalized.filter((token) => {
    const normalizePart = (part: unknown) =>
      String(part ?? "")
        .trim()
        .toLowerCase()
        .replace(/[\s\u200c]+/g, "");

    const signature = [
      normalizePart(token.customerId),
      normalizePart(token.discount || token.discountPercent),
      normalizePart(token.issuedAt),
      normalizePart(token.expiresAt),
      normalizePart(token.usedAt),
    ].join("|");

    const fallbackSignature = [
      normalizePart(token.code),
      normalizePart(token.discount || token.discountPercent),
      normalizePart(token.issuedAt),
      normalizePart(token.expiresAt),
    ].join("|");

    // Prefer the customer-facing signature. If the API omits enough fields,
    // fall back to the actual VIP code.
    const key = signature.replace(/\|/g, "") ? signature : fallbackSignature;

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function formatVipJalaliDate(value: unknown): string {
  if (!value) return "";

  const text = String(value).trim();

  // The VIP sheet can return a date as "00:00 784/04/16".
  // Strip the time and normalize the legacy 3-digit Jalali year.
  const match = text.match(/(?:^|\\s)(\\d{3,4})[\\/-](\\d{1,2})[\\/-](\\d{1,2})/);

  if (!match) return text;

  let year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return text;
  }

  // Legacy backend formatting can drop the leading "1" from a Jalali
  // year in the 1400s (e.g. 784 => 1404).
  if (year >= 700 && year < 900) {
    year += 620;
  }

  if (year < 1200 || year > 1600 || month < 1 || month > 12 || day < 1 || day > 31) {
    return text;
  }

  try {
    const dateText = `${year}/${month}/${day}`;
    const parts = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).formatToParts(
      new Date(
        new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Tehran",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date()) + "T00:00:00"
      )
    );

    // Use the Jalali fields directly so we never reinterpret the stored
    // membership date as a Gregorian date.
    const monthNames = [
      "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
      "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
    ];

    void parts;
    return `${day.toLocaleString("fa-IR") } ${monthNames[month - 1]} ${year.toLocaleString("fa-IR")}`;
  } catch {
    return `${day.toLocaleString("fa-IR")}/${month.toLocaleString("fa-IR")}/${year.toLocaleString("fa-IR")}`;
  }
}

function getVipTokenDisplayStatus(token: VipToken): {
  label: string;
  color: string;
  background: string;
  border: string;
} {
  const rawStatus = String(token.status ?? "").trim();
  const normalizedStatus = rawStatus.replace(/\s+/g, "").toLowerCase();

  if (normalizedStatus === "استفادهشده" || normalizedStatus === "used") {
    return { label: "استفاده شده", color: "#6f746d", background: "rgba(111,116,109,0.08)", border: "rgba(111,116,109,0.18)" };
  }

  if (isVipTokenExpired(String(token.expiresAt ?? "").trim())) {
    return { label: "منقضی شده", color: "#9a5c52", background: "rgba(154,92,82,0.08)", border: "rgba(154,92,82,0.18)" };
  }

  // A token that has not expired yet is usable, even if the backend
  // still stores its administrative status as «صادر شده».
  return { label: "فعال", color: "#246347", background: "rgba(36,99,71,0.08)", border: "rgba(36,99,71,0.08)" };
}

function isVipTokenExpired(value: string): boolean {
  if (!value) return false;
  const match = value.match(/^(\d{3,4})[\/-](\d{1,2})[\/-](\d{1,2})(?:\s*-\s*(\d{1,2}):(\d{2}))?$/);
  if (!match) return false;

  const target = [
    Number(match[1]), Number(match[2]), Number(match[3]),
    match[4] == null ? 23 : Number(match[4]),
    match[5] == null ? 59 : Number(match[5]),
  ];

  try {
    const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
      calendar: "persian", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date());

    const now = [
      Number(parts.find((p) => p.type === "year")?.value ?? 0),
      Number(parts.find((p) => p.type === "month")?.value ?? 0),
      Number(parts.find((p) => p.type === "day")?.value ?? 0),
      Number(parts.find((p) => p.type === "hour")?.value ?? 0),
      Number(parts.find((p) => p.type === "minute")?.value ?? 0),
    ];

    for (let i = 0; i < target.length; i++) {
      if (now[i] > target[i]) return true;
      if (now[i] < target[i]) return false;
    }
    return true;
  } catch {
    return false;
  }
}


/* =========================================================
   LOAD TELEGRAM IDENTITY
========================================================= */

async function getTelegramInitData(): Promise<string | null> {
  try {
    await loadTelegramWebAppScript();
  } catch {
    return null;
  }

  const telegramWebApp = window.Telegram?.WebApp;
  if (!telegramWebApp) return null;

  try {
    telegramWebApp.ready?.();
    telegramWebApp.expand?.();
  } catch {}

  // Telegram can populate initData a moment after the WebApp object exists.
  // Retry briefly instead of treating a valid VIP member as a guest.
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const initData = telegramWebApp.initData || "";
    if (initData) return initData;
    await new Promise((resolve) => window.setTimeout(resolve, 250));
  }

  return null;
}

async function callVipApi(
  action: "load" | "connect",
  connectionCode?: string
): Promise<VipApiResponse> {
  const initData = await getTelegramInitData();

  if (!initData) {
    return {
      success: false,
      debug: "TELEGRAM_AUTH_UNAVAILABLE",
      message:
        "لطفاً این بخش را مستقیماً از داخل تلگرام باز کن تا ورود امن انجام شود.",
    };
  }

  try {
    const response = await fetch(VIP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=UTF-8",
      },
      body: JSON.stringify({
        initData,
        action,
        ...(action === "connect"
          ? { connectionCode: connectionCode?.trim().toUpperCase() }
          : {}),      }),
    });

    let data: VipApiResponse;

    try {
      data = (await response.json()) as VipApiResponse;
    } catch {
      return {
        success: false,
        debug: "INVALID_SERVER_RESPONSE",
        message: "پاسخ قابل خواندن از سامانه VIP دریافت نشد.",
      };
    }

    if (data.customer) {
      data.customer = normalizeVipCustomer(data.customer);
    }

    if (!response.ok) {
      return {
        ...data,
        success: false,
        message:
          data.message ||
          data.error ||
          "امکان دریافت اطلاعات VIP وجود ندارد.",
      };
    }

    return data;
  } catch {
    return {
      success: false,
      debug: "FETCH_ERROR",
      message:
        "ارتباط با سامانه VIP برقرار نشد. لطفاً دوباره تلاش کن.",
    };
  }
}

async function loadTelegramIdentity(): Promise<VipApiResponse> {
  return callVipApi("load");
}

async function connectTelegramVip(
  connectionCode: string
): Promise<VipApiResponse> {
  return callVipApi("connect", connectionCode);
}

/* =========================================================
   VIP PAGE
========================================================= */

type VipPanel =
  | "dashboard"
  | "bookings"
  | "payments"
  | "tokens"
  | "experiences"
  | "classes"
  | "events"
  | "profile";

function VipPage({
  onBack,
  initialPanel = "dashboard",
}: {
  onBack: () => void;
  initialPanel?: VipPanel;
}) {

  const [activePanel, setActivePanel] = useState<VipPanel>(initialPanel);


  const [loading, setLoading] =
    useState(true);


  const [vipCustomer, setVipCustomer] =
    useState<VipCustomer | null>(
      null
    );

  const [vipTokens, setVipTokens] =
    useState<VipToken[]>([]);

  const [vipHistory, setVipHistory] = useState<VipRecord[]>([]);
  const [vipPayments, setVipPayments] = useState<VipPayment[]>([]);
  const [vipClasses, setVipClasses] = useState<VipClassEvent[]>([]);
  const [vipEvents, setVipEvents] = useState<VipClassEvent[]>([]);

  const [copiedToken, setCopiedToken] =
    useState<string | null>(null);

  const [vipError, setVipError] =
    useState("");

  const [needsConnectionCode, setNeedsConnectionCode] =
    useState(false);

  const [connectionCode, setConnectionCode] =
    useState("");

  const [connecting, setConnecting] =
    useState(false);

  const [connectionError, setConnectionError] =
    useState("");

  const [bookingFilter, setBookingFilter] =
    useState<"all" | "upcoming" | "completed">("all");
  const [paymentFilter, setPaymentFilter] =
    useState<"all" | "successful" | "pending">("all");
  const [tokenFilter, setTokenFilter] =
    useState<"all" | "active" | "used" | "expired">("all");
  const [experienceFilter, setExperienceFilter] =
    useState("همه");
  const [classFilter, setClassFilter] =
    useState<"all" | "current" | "completed">("all");
  const [eventFilter, setEventFilter] =
    useState<"all" | "upcoming" | "attended">("all");

  useEffect(() => {
    document.body.classList.add("vip-mode");
    return () => {
      document.body.classList.remove("vip-mode");
    };
  }, []);

  useEffect(() => {

    let mounted = true;


    const initializeVip =
      async () => {

        const result =
          await loadTelegramIdentity();


        if (!mounted) {
          return;
        }


        setLoading(false);

        if (result.success && result.customer) {
          setVipCustomer(result.customer);
          setVipTokens(normalizeVipTokens(result.tokens));
          setVipHistory(normalizeVipRecordRows(result.history, "booking"));
          setVipPayments(normalizeVipRecordRows(result.payments, "payment"));
          setVipClasses(normalizeVipRowsForClassEvent(result.classes, "class"));
          setVipEvents(normalizeVipRowsForClassEvent(result.events, "event"));
          setNeedsConnectionCode(false);
          setVipError("");
          return;
        }

        if (result.needsConnectionCode) {
          setVipCustomer(null);
          setNeedsConnectionCode(true);
          setVipError("");
          return;
        }

        setVipCustomer(null);
        setNeedsConnectionCode(false);
        setVipError(
          result.message ||
            "عضویت VIP شما فعال نیست."
        );
      };


    initializeVip();


    return () => {
      mounted = false;
    };

  }, []);


  const openBookingApp = () => {
    window.location.href = BOOKING_APP_URL;
  };

  const displayName =
    `${vipCustomer?.firstName || ""} ${vipCustomer?.lastName || ""}`.trim() ||
    "عضو VIP";


  const vipActive =
    vipCustomer?.vipStatus ===
      "فعال" ||
    vipCustomer?.vipStatus ===
      "active";


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {

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
          description="در حال بررسی عضویت VIP شما..."
          icon="crown"
        />


        <div
          className="glass-list-card"
          style={{
            display: "block",
            textAlign:
              "center",
            padding:
              "28px 20px",
          }}
        >

          <div
            style={{
              width: "52px",
              height: "52px",
              margin:
                "0 auto 14px",
              borderRadius:
                "18px",
              display: "grid",
              placeItems:
                "center",
              background:
                "rgba(36,99,71,0.08)",
              color:
                "#246347",
            }}
          >
            <Icon name="crown" />
          </div>


          <div className="list-copy">

            <strong>
              در حال بررسی عضویت...
            </strong>

            <span>
              لطفاً چند لحظه صبر کن.
            </span>

          </div>

        </div>

      </div>
    );
  }


  /* =====================================================
     CONNECTION CODE / ACCESS DENIED
  ===================================================== */

  if (needsConnectionCode) {
    const submitConnectionCode = async () => {
      const normalizedCode = connectionCode.trim().toUpperCase();

      if (!normalizedCode) {
        setConnectionError("لطفاً کد اتصال VIP را وارد کن.");
        return;
      }

      setConnecting(true);
      setConnectionError("");

      const result = await connectTelegramVip(normalizedCode);

      if (result.success && result.customer) {
        setVipCustomer(result.customer);
        setVipTokens(normalizeVipTokens(result.tokens));
        setVipHistory(normalizeVipRecordRows(result.history, "booking"));
        setVipPayments(normalizeVipRecordRows(result.payments, "payment"));
        setVipClasses(normalizeVipRowsForClassEvent(result.classes, "class"));
        setVipEvents(normalizeVipRowsForClassEvent(result.events, "event"));
        setNeedsConnectionCode(false);
        setConnectionCode("");
        setConnectionError("");
        setConnecting(false);
        return;
      }

      setConnectionError(
        result.message ||
          "این کد اتصال معتبر نیست یا قبلاً استفاده شده است."
      );
      setConnecting(false);
    };

    return (
      <div className="inner-page">
        <button type="button" onClick={onBack} style={backButtonStyle}>
          ← بازگشت
        </button>

        <SectionHeaderCard
          kicker="KAENATCHI VIP"
          title="ورود به باشگاه VIP"
          description="برای اتصال حساب تلگرام شما به عضویت VIP، کد اتصال یک‌بارمصرف خود را وارد کنید."
          icon="crown"
          status="یک بار اتصال؛ ورودهای بعدی خودکار است"
        />

        <div
          className="glass-list-card"
          style={{ display: "block", padding: "20px" }}
        >
          <div
            style={{
              width: "58px",
              height: "58px",
              margin: "0 auto 16px",
              borderRadius: "20px",
              display: "grid",
              placeItems: "center",
              background: "rgba(165,139,91,0.10)",
              color: "#8a7348",
            }}
          >
            <Icon name="ticket" />
          </div>

          <div style={{ textAlign: "center", marginBottom: "18px" }}>
            <strong
              style={{
                display: "block",
                fontSize: "16px",
                color: "#353B32",
                marginBottom: "8px",
              }}
            >
              کد اتصال VIP
            </strong>

            <span
              style={{
                display: "block",
                fontSize: "12px",
                lineHeight: 1.9,
                color: "#73786f",
              }}
            >
              این کد را از مدیریت کائنات‌چی دریافت کن.
              <br />
              نیازی به وارد کردن Telegram ID یا username نیست.
            </span>
          </div>

          <input
            value={connectionCode}
            onChange={(event) => {
              setConnectionCode(
                event.target.value.replace(/\s/g, "").toUpperCase()
              );
              setConnectionError("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void submitConnectionCode();
              }
            }}
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="one-time-code"
            placeholder="مثلاً VIP-CON-7K4P2M"
            aria-label="کد اتصال VIP"
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: "1px solid rgba(53,59,50,0.13)",
              borderRadius: "16px",
              padding: "15px",
              background: "rgba(255,255,255,0.78)",
              color: "#353B32",
              fontFamily: "inherit",
              fontSize: "15px",
              textAlign: "center",
              direction: "ltr",
              outline: "none",
              boxShadow: "0 7px 20px rgba(53,59,50,0.06)",
            }}
          />

          {connectionError && (
            <div
              style={{
                marginTop: "10px",
                padding: "10px 12px",
                borderRadius: "13px",
                background: "rgba(150,70,60,0.07)",
                color: "#8d5149",
                fontSize: "12px",
                lineHeight: 1.8,
                textAlign: "center",
              }}
            >
              {connectionError}
            </div>
          )}

          <button
            type="button"
            onClick={() => void submitConnectionCode()}
            disabled={connecting}
            style={{
              width: "100%",
              marginTop: "13px",
              border: "none",
              borderRadius: "16px",
              padding: "14px 16px",
              background:
                connecting
                  ? "rgba(36,99,71,0.55)"
                  : "linear-gradient(135deg,#174b38,#2c7658)",
              color: "#fff",
              fontFamily: "inherit",
              fontSize: "14px",
              fontWeight: 600,
              cursor: connecting ? "default" : "pointer",
              boxShadow: "0 10px 24px rgba(23,75,56,0.16)",
            }}
          >
            {connecting ? "در حال اتصال..." : "🔗 اتصال و ورود"}
          </button>

          <div
            style={{
              marginTop: "14px",
              padding: "12px 13px",
              borderRadius: "14px",
              background: "rgba(53,59,50,0.045)",
              color: "#73786f",
              fontSize: "11px",
              lineHeight: 1.9,
              textAlign: "center",
            }}
          >
            کد اتصال فقط برای اولین اتصال این حساب لازم است و پس از استفاده دیگر قابل استفاده نخواهد بود.
          </div>
        </div>
      </div>
    );
  }

  if (!vipCustomer || !vipActive) {
    return (
      <div className="inner-page">
        <button type="button" onClick={onBack} style={backButtonStyle}>
          ← بازگشت
        </button>

        <SectionHeaderCard
          kicker="KAENATCHI VIP"
          title="دسترسی VIP"
          description="دسترسی این بخش فقط برای اعضای فعال VIP کائنات‌چی امکان‌پذیر است."
          icon="crown"
          status="عضویت VIP فعال نیست"
        />

        <div
          className="glass-list-card"
          style={{ display: "block", textAlign: "center" }}
        >
          <div
            style={{
              width: "58px",
              height: "58px",
              margin: "0 auto 14px",
              borderRadius: "20px",
              display: "grid",
              placeItems: "center",
              background: "rgba(53,59,50,0.07)",
              color: "#353B32",
            }}
          >
            <Icon name="crown" />
          </div>

          <div className="list-copy">
            <strong>دسترسی VIP فعال نیست</strong>
            <span>
              {vipError ||
                "در حال حاضر این حساب عضو فعال باشگاه VIP نیست."}
            </span>
          </div>
        </div>
      </div>
    );
  }

  /* =====================================================
     BOOKINGS
  ===================================================== */

  if (activePanel === "bookings") {
    const filtered = vipHistory.filter(record => {
      const status = normalizeVipStatus(record.status);
      if (bookingFilter === "upcoming") return status === "upcoming" || status === "other";
      if (bookingFilter === "completed") return status === "completed";
      return true;
    });
    return (
      <div className="inner-page">
        <button type="button" onClick={() => setActivePanel("dashboard")} style={backButtonStyle}>← بازگشت به VIP</button>
        <SectionHeaderCard kicker="VIP" title="نوبت‌های من" description="نوبت‌های ثبت‌شده شما در کائنات‌چی." icon="calendar" />
        <VipFilterTabs value={bookingFilter} onChange={value => setBookingFilter(value as "all" | "upcoming" | "completed")} options={[{ id: "all", title: "همه" }, { id: "upcoming", title: "پیش‌رو" }, { id: "completed", title: "انجام‌شده" }]} />
        {filtered.length > 0 ? filtered.map(record => <VipRecordCard key={record.id} record={record} />) : (
          <div className="glass-list-card" style={{ display: "block", textAlign: "center" }}>
            <div className="list-icon" style={{ margin: "0 auto 12px" }}><Icon name="calendar" /></div>
            <div className="list-copy"><strong>هنوز نوبتی در این فیلتر نیست</strong><span>{vipHistory.length ? "فیلتر دیگری را امتحان کن." : "سوابق نوبت‌های شما پس از ثبت در سامانه رزرو اینجا نمایش داده می‌شود."}</span></div>
          </div>
        )}
      </div>
    );
  }


  /* =====================================================
     PAYMENTS
  ===================================================== */

  if (activePanel === "payments") {
    const filtered = vipPayments.filter(record => {
      const status = normalizeVipStatus(record.status);
      if (paymentFilter === "successful") return status === "successful";
      if (paymentFilter === "pending") return status === "pending";
      return true;
    });
    return (
      <div className="inner-page">
        <button type="button" onClick={() => setActivePanel("dashboard")} style={backButtonStyle}>← بازگشت به VIP</button>
        <SectionHeaderCard kicker="VIP" title="پرداخت‌های من" description="سوابق پرداخت شما در کائنات‌چی." icon="card" />
        <VipFilterTabs value={paymentFilter} onChange={value => setPaymentFilter(value as "all" | "successful" | "pending")} options={[{ id: "all", title: "همه" }, { id: "successful", title: "موفق" }, { id: "pending", title: "در انتظار" }]} />
        {filtered.length > 0 ? filtered.map(record => <VipRecordCard key={record.id} record={record} kind="payment" />) : (
          <div className="glass-list-card" style={{ display: "block", textAlign: "center" }}>
            <div className="list-icon" style={{ margin: "0 auto 12px" }}><Icon name="card" /></div>
            <div className="list-copy"><strong>هنوز پرداختی در این فیلتر نیست</strong><span>{vipPayments.length ? "فیلتر دیگری را امتحان کن." : "سوابق پرداخت شما پس از اتصال داده‌های پرداخت اینجا نمایش داده می‌شود."}</span></div>
          </div>
        )}
      </div>
    );
  }


  /* =====================================================
     TOKENS
  ===================================================== */

  if (
    activePanel ===
    "tokens"
  ) {

    return (
      <div className="inner-page">

        <button
          type="button"
          onClick={() =>
            setActivePanel(
              "dashboard"
            )
          }
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
          style={{
            marginBottom: "14px",
            padding: "14px 16px",
            borderRadius: "18px",
            background: "rgba(165,139,91,0.08)",
            border: "1px solid rgba(165,139,91,0.15)",
            boxShadow: "0 10px 24px rgba(53,59,50,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "6px",
              color: "#353B32",
              fontWeight: 700,
              fontSize: "14px",
            }}
          >
            <Icon name="ticket" />
            <strong>تخفیف VIP</strong>
          </div>
          <span style={{ fontSize: "13px", lineHeight: 1.8, color: "#73786f" }}>
            توکن‌های VIP برای استفاده از تخفیف‌های اختصاصی انرژی‌خوانی، کلاس‌ها و ایونت‌ها هستند.
          </span>
        </div>
        <VipFilterTabs value={tokenFilter} onChange={value => setTokenFilter(value as "all" | "active" | "used" | "expired")} options={[{ id: "all", title: "همه" }, { id: "active", title: "فعال" }, { id: "used", title: "استفاده‌شده" }, { id: "expired", title: "منقضی‌شده" }]} />
        <div style={{ display: "grid", gap: "12px" }}>
          {vipTokens.length > 0 ? (
            vipTokens.map((token, index) => {
              const tokenDisplay = getVipTokenDisplayStatus(token);
              const tokenStatus = tokenDisplay.label === "فعال" ? "active" : tokenDisplay.label === "استفاده شده" ? "used" : "expired";
              if (tokenFilter !== "all" && tokenFilter !== tokenStatus) return null;
              const code = String(token.code ?? "").trim();
              const rawDiscount = token.discount ?? token.discountPercent ?? "";
              const discountNumber = Number(String(rawDiscount).replace(/٪/g, "%").replace("%", "").trim());
              const discount = Number.isFinite(discountNumber) && discountNumber > 0
                ? String(discountNumber)
                : String(rawDiscount).trim();
              const displayStatus = getVipTokenDisplayStatus(token);
              const issuedAt = String(token.issuedAt ?? "").trim();
              const expiresAt = String(token.expiresAt ?? "").trim();

              const copyToken = async () => {
                if (!code) return;
                try {
                  if (navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(code);
                  } else {
                    const textarea = document.createElement("textarea");
                    textarea.value = code;
                    textarea.style.position = "fixed";
                    textarea.style.opacity = "0";
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand("copy");
                    textarea.remove();
                  }
                  setCopiedToken(code);
                  window.setTimeout(() => {
                    setCopiedToken((current) => current === code ? null : current);
                  }, 1600);
                } catch {
                  setCopiedToken(null);
                }
              };

              return (
                <div key={index} className="glass-list-card" style={{
                  border: `1px solid ${displayStatus.border}`,
                  display: "block",
                }}>
                  <div style={{
                    display: "flex", alignItems: "flex-start",
                    justifyContent: "space-between", gap: "12px", marginBottom: "14px",
                  }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{
                        fontSize: "10px", letterSpacing: "1.5px",
                        color: "#8a8f87", marginBottom: "6px",
                      }}>DISCOUNT CODE</div>
                      <div style={{
                        fontSize: "20px", lineHeight: 1.3, fontWeight: 800,
                        letterSpacing: "1px", color: "#353B32",
                        overflowWrap: "anywhere", direction: "ltr", textAlign: "left",
                      }}>{code || "کد تخفیف"}</div>
                    </div>

                    {code && (
                      <button type="button" onClick={copyToken} style={{
                        flex: "0 0 auto",
                        border: `1px solid ${copiedToken === code ? "rgba(36,99,71,0.22)" : "rgba(53,59,50,0.12)"}`,
                        borderRadius: "12px",
                        background: copiedToken === code ? "rgba(36,99,71,0.08)" : "rgba(255,255,255,0.72)",
                        color: copiedToken === code ? "#246347" : "#353B32",
                        padding: "9px 11px", fontFamily: "inherit",
                        fontSize: "11px", fontWeight: 700, cursor: "pointer",                        boxShadow: "0 6px 14px rgba(53,59,50,0.06)",
                      }}>{copiedToken === code ? "کپی شد ✓" : "کپی کد"}</button>
                    )}
                  </div>

                  <div style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between", gap: "10px",
                    flexWrap: "wrap", marginBottom: "13px",
                  }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center",
                      padding: "6px 10px", borderRadius: "10px",
                      background: displayStatus.background,
                      border: `1px solid ${displayStatus.border}`,
                      color: displayStatus.color, fontSize: "11px", fontWeight: 700,
                    }}>{displayStatus.label}</span>
                    <span style={{ color: "#8a7146", fontSize: "13px", fontWeight: 700 }}>
                      {discount !== "" ? `تخفیف ${String(discount).replace(/%/g, "").trim()}٪` : "تخفیف VIP"}
                    </span>
                  </div>

                  <div style={{
                    display: "grid", gap: "7px", paddingTop: "11px",
                    borderTop: "1px solid rgba(53,59,50,0.08)",
                    fontSize: "12px", color: "#73786f", lineHeight: 1.8,
                  }}>
                    {issuedAt !== "" && (
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                        <span>تاریخ صدور</span>
                        <strong style={{ color: "#353B32", fontWeight: 600, direction: "ltr" }}>
                          {formatVipJalaliDate(issuedAt)}
                        </strong>
                      </div>
                    )}
                    {expiresAt !== "" && (
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                        <span>تاریخ انقضا</span>
                        <strong style={{
                          color: displayStatus.label === "منقضی شده" ? "#9a5c52" : "#353B32",
                          fontWeight: 600, direction: "ltr",
                        }}>{formatVipJalaliDate(expiresAt)}</strong>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="glass-list-card" style={{ display: "block", textAlign: "center" }}>
              <div className="list-icon" style={{ margin: "0 auto 12px" }}>
                <Icon name="ticket" />
              </div>
              <div className="list-copy">
                <strong>هنوز توکنی برای شما ثبت نشده</strong>
                <span>هر توکن تخفیف اختصاصی پس از صدور در این قسمت نمایش داده می‌شود.</span>
              </div>
            </div>
          )}
        </div>

      </div>
    );
  }


  /* =====================================================
     EXPERIENCES
  ===================================================== */

  if (activePanel === "experiences") {
    const fixedCategories = [
      "قهوه",
      "پاسور",
      "تاروت رایدر وایت",
      "تاروت رایدر احساسی",
      "تاروت رایدر شغلی - مالی",
      "لنورماند فرانسوی",
      "لنورماند احساسی",
      "تاروت یونانی احساسی",
      "تاروت مارسی احساسی",
      "جم اوراکل",
      "شمع‌تراپی",
      "سایکوتراپی",
    ];

    // Keep the agreed list first, then append any new service that
    // already exists in the customer's VIP history/API.
    const historyCategories = Array.from(
      new Set(
        vipHistory
          .map((record) => vipExperienceCategory(record.service))
          .filter(
            (category) =>
              category &&
              category !== "سایر" &&
              !fixedCategories.includes(category)
          )
      )
    );

    const categories = ["همه", ...fixedCategories, ...historyCategories];

    const filtered = vipHistory.filter(
      (record) =>
        experienceFilter === "همه" ||
        vipExperienceCategory(record.service) === experienceFilter
    );

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
          title="تجربه‌های من"
          description="اینجا می‌توانی مسیر تجربه‌ها و انرژی‌خوانی‌های ثبت‌شده خودت را به تفکیک نوع خدمت ببینی."
          icon="spark"
        />

        <VipFilterTabs
          value={experienceFilter}
          onChange={setExperienceFilter}
          options={categories.map((item) => ({
            id: item,
            title: item,
          }))}
        />

        {filtered.length > 0 ? (
          filtered.map((item, index) => (
            <div
              key={item.id}
              className="glass-list-card"
              style={{
                display: "block",
                marginBottom: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "13px",
                    display: "grid",
                    placeItems: "center",
                    background: "rgba(165,139,91,0.09)",
                    color: "#8a7348",
                    fontWeight: 800,
                    fontSize: "13px",
                    flex: "0 0 auto",
                  }}
                >
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div
                  className="list-copy"
                  style={{ flex: 1 }}
                >
                  <strong>{item.service}</strong>
                  {item.date && (
                    <span>
                      {formatVipJalaliDate(item.date)}
                      {item.time ? "  •  " + item.time : ""}
                    </span>
                  )}
                  {!item.date && item.time && (
                    <span>{item.time}</span>
                  )}
                  {item.status && (
                    <span>{item.status}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div
            className="glass-list-card"
            style={{
              display: "block",
              textAlign: "center",
            }}
          >
            <div
              className="list-icon"
              style={{ margin: "0 auto 12px" }}
            >
              <Icon name="spark" />
            </div>
            <div className="list-copy">
              <strong>
                هنوز تجربه‌ای در این بخش ثبت نشده
              </strong>
              <span>
                {vipHistory.length
                  ? "دسته دیگری را امتحان کن."
                  : "سوابق تجربه‌های شما پس از ثبت نوبت در اینجا نمایش داده می‌شود."}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* =====================================================
     CLASSES
  ===================================================== */

  if (activePanel === "classes") {
    const filtered = vipClasses.filter(item => classFilter === "all" || (classFilter === "current" ? /درحال|جاری|فعال|upcoming|current/i.test(item.status.replace(/\s/g, "")) : /گذرانده|تکمیل|completed/i.test(item.status.replace(/\s/g, ""))));
    return (
      <div className="inner-page">
        <button type="button" onClick={() => setActivePanel("dashboard")} style={backButtonStyle}>← بازگشت به VIP</button>
        <SectionHeaderCard kicker="VIP" title="کلاس‌های من" description="کلاس‌ها و دوره‌هایی که در آن‌ها ثبت‌نام کرده‌ای." icon="class" />
        <VipFilterTabs value={classFilter} onChange={value => setClassFilter(value as "all" | "current" | "completed")} options={[{ id: "all", title: "همه" }, { id: "current", title: "در حال برگزاری" }, { id: "completed", title: "گذرانده‌شده" }]} />
        {filtered.length > 0 ? filtered.map(item => <VipClassEventCard key={item.id} item={item} type="class" />) : (
          <div className="glass-list-card" style={{ display: "block", textAlign: "center" }}><div className="list-icon" style={{ margin: "0 auto 12px" }}><Icon name="class" /></div><div className="list-copy"><strong>هنوز کلاسی برای شما ثبت نشده</strong><span>وقتی اطلاعات ثبت‌نام کلاس‌ها به حساب VIP متصل شود، اینجا نمایش داده می‌شود.</span></div></div>
        )}
      </div>
    );
  }

  /* =====================================================
     EVENTS
  ===================================================== */

  if (activePanel === "events") {
    const filtered = vipEvents.filter(item => eventFilter === "all" || (eventFilter === "upcoming" ? /پیشرو|ثبت|فعال|upcoming/i.test(item.status.replace(/\s/g, "")) : /شرکتکرد|حاضر|attended|completed/i.test(item.status.replace(/\s/g, ""))));
    return (
      <div className="inner-page">
        <button type="button" onClick={() => setActivePanel("dashboard")} style={backButtonStyle}>← بازگشت به VIP</button>
        <SectionHeaderCard kicker="VIP" title="ایونت‌های من" description="رویدادهایی که برای آن‌ها ثبت‌نام کرده‌ای یا در آن‌ها شرکت کرده‌ای." icon="event" />
        <VipFilterTabs value={eventFilter} onChange={value => setEventFilter(value as "all" | "upcoming" | "attended")} options={[{ id: "all", title: "همه" }, { id: "upcoming", title: "پیش‌رو" }, { id: "attended", title: "شرکت‌کرده" }]} />
        {filtered.length > 0 ? filtered.map(item => <VipClassEventCard key={item.id} item={item} type="event" />) : (
          <div className="glass-list-card" style={{ display: "block", textAlign: "center" }}><div className="list-icon" style={{ margin: "0 auto 12px" }}><Icon name="event" /></div><div className="list-copy"><strong>هنوز ایونتی برای شما ثبت نشده</strong><span>وقتی اطلاعات ثبت‌نام ایونت‌ها به حساب VIP متصل شود، اینجا نمایش داده می‌شود.</span></div></div>
        )}
      </div>
    );
  }


  /* =====================================================
     PROFILE
  ===================================================== */

  if (
    activePanel ===
    "profile"
  ) {

    return (
      <div className="inner-page">

        <button
          type="button"
          onClick={() =>
            setActivePanel(
              "dashboard"
            )
          }
          style={backButtonStyle}
        >
          ← بازگشت به VIP
        </button>


        <SectionHeaderCard
          kicker="PROFILE"
          title="پروفایل من"
          description="اطلاعات حساب VIP شما."
          icon="user"
          status="عضویت VIP فعال است"
        />


        <div
          style={{
            marginBottom: "14px",
            padding: "14px 16px",
            borderRadius: "18px",
            background: "rgba(165,139,91,0.08)",
            border: "1px solid rgba(165,139,91,0.15)",
            boxShadow: "0 10px 24px rgba(53,59,50,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "6px",
              color: "#353B32",
              fontWeight: 700,
              fontSize: "14px",
            }}
          >
            <Icon name="user" />
            <strong>پروفایل VIP</strong>
          </div>
          <span style={{ fontSize: "13px", lineHeight: 1.8, color: "#73786f" }}>
            اینجا اطلاعات حساب و وضعیت عضویت VIP شما نمایش داده می‌شود.
          </span>
        </div>

        <div className="glass-list-card">

          <div className="list-icon">
            <Icon name="user" />
          </div>


          <div className="list-copy">

            <strong>
              {displayName}
            </strong>


            <span>
              وضعیت عضویت: فعال
            </span>


            {vipCustomer.mobile && (
              <span>
                شماره موبایل:{" "}
                {vipCustomer.mobile}
              </span>
            )}


            {typeof vipCustomer.bookingsCount ===
              "number" && (
              <span>
                تعداد نوبت‌ها:{" "}
                {
                  vipCustomer.bookingsCount
                }
              </span>
            )}


            {vipCustomer.joinedAt && (
              <span>
                تاریخ عضویت:{" "}
                {vipCustomer.joinedAt}
              </span>
            )}

          </div>

        </div>

      </div>
    );
  }


  /* =====================================================
     VIP DASHBOARD
  ===================================================== */

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
        title={`سلام ${displayName} 🌿`}
        description="فضای اختصاصی اعضای VIP کائنات‌چی."
        icon="crown"
        status="عضویت VIP فعال است"
      />

      <section className="vip-journey-summary" aria-label="خلاصه مسیر VIP">
        <div className="vip-journey-heading">
          <strong>مشاهده مسیر من ←</strong>
          <span>آمار واقعی فعالیت‌های شما در کائنات‌چی</span>
        </div>

        <div className="vip-journey-stats">
          {[
            ["calendar", "نوبت", String(vipHistory.length)],
            ["spark", "تجربه", String(vipHistory.length)],
            ["class", "کلاس", String(vipClasses.length)],
            ["event", "ایونت", String(vipEvents.length)],
            ["card", "پرداخت", String(vipPayments.length)],
            ["ticket", "توکن", String(vipTokens.length)],
          ].map(([icon, label, value]) => (
            <div className="vip-journey-stat" key={label}>
              <div className="vip-journey-stat-icon">
                <Icon name={icon as IconName} />
              </div>
              <div className="vip-journey-stat-copy">
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px" }}>
        {[
          ["bookings", "calendar", "نوبت‌های من", "سوابق و وضعیت نوبت‌ها"],
          ["payments", "card", "پرداخت‌های من", "سوابق پرداخت‌ها"],
          ["tokens", "ticket", "توکن‌های من", "تخفیف‌های اختصاصی VIP"],
          ["experiences", "spark", "تجربه‌های من", "تاریخچه تجربه‌های شما"],
          ["classes", "class", "کلاس‌های من", "دوره‌ها و آموزش‌های شما"],
          ["events", "event", "ایونت‌های من", "رویدادهای ثبت‌شده شما"],
          ["profile", "user", "پروفایل من", "اطلاعات و وضعیت عضویت"],
        ].map(([panel, icon, title, description]) => (
          <button key={panel} type="button" className="glass-list-card" onClick={() => setActivePanel(panel as typeof activePanel)} style={vipTileStyle}>
            <div className="list-icon"><Icon name={icon as IconName} /></div>
            <div className="list-copy"><strong>{title}</strong><span>{description}</span></div>
          </button>
        ))}
      </div>

      <div style={{ marginTop: "12px" }}>
        <button type="button" onClick={openBookingApp} style={{ width: "100%", border: "none", borderRadius: "18px", padding: "15px 18px", background: "linear-gradient(135deg, #174b38, #2c7658)", color: "#fff", fontFamily: "inherit", fontSize: "14px", fontWeight: 700, cursor: "pointer", boxShadow: "0 10px 24px rgba(23,75,56,0.18)" }}>📅 دریافت نوبت</button>
      </div>

    </div>
  );
}


/* =========================================================
   STYLES
========================================================= */

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
  textAlign:
    "right" as const,
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  flexDirection:
    "column" as const,
  alignItems:
    "flex-start",
};


/* =========================================================
   MORE DETAIL
========================================================= */

function MoreDetail({
  title,
  icon,
  description,
  onBack,
}: {
  title: string;
  icon: IconName;
  description: string;
  onBack: () => void;
}) {
  const isFaq = title === "سوالات متداول";
  const isHours = title === "ساعات کاری";
  const isContact = title === "ارتباط با ما";
  const faqRows = getCmsFaqRows();
  const hoursText = cmsPageText(["ساعات", "hours"]) || cmsSetting(["hours", "ساعات"]);
  const telegram = cmsSetting(["telegram", "تلگرام"]) || "https://t.me/AD_Kaenatchi";
  const whatsapp = cmsSetting(["whatsapp", "واتساپ"]);
  const instagram = cmsSetting(["instagram", "اینستاگرام"]) || "https://instagram.com/Kaenatchi";

  return (
    <div className="inner-page">
      <button type="button" onClick={onBack} style={backButtonStyle}>← بازگشت</button>
      <SectionHeaderCard
        kicker={isFaq ? "FAQ" : isHours ? "HOURS" : "CONTACT"}
        title={title}
        description={description}
        icon={icon}
      />

      {isFaq && (
        <div className="more-info-stack">
          {faqRows.length ? faqRows.map((item, index) => (
            <div className="more-info-card" key={item.question + index}>
              <strong>{item.question}</strong>
              <span>{item.answer}</span>
            </div>
          )) : (
            <div className="more-info-card">
              <strong>هنوز محتوایی ثبت نشده</strong>
              <span>این بخش را از پنل CMS تکمیل کن.</span>
            </div>
          )}
        </div>
      )}

      {isHours && (
        <div className="more-info-stack">
          <div className="more-info-card">
            <strong>{title}</strong>
            <span>{hoursText || "هنوز ساعت کاری در CMS ثبت نشده است."}</span>
          </div>
        </div>
      )}

      {isContact && (
        <div className="more-contact-grid">
          <a className="more-contact-card" href={telegram} target="_blank" rel="noreferrer">
            <span>✦</span><strong>تلگرام</strong><small>ارتباط با کائنات‌چی</small>
          </a>
          {whatsapp && (
            <a className="more-contact-card" href={whatsapp} target="_blank" rel="noreferrer">
              <span>◌</span><strong>واتساپ</strong><small>پیام در واتساپ</small>
            </a>
          )}
          <a className="more-contact-card" href={instagram} target="_blank" rel="noreferrer">
            <span>◎</span><strong>اینستاگرام</strong><small>صفحه کائنات‌چی</small>
          </a>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   MORE PAGE
========================================================= */

function MorePage({
  onSearch,
}: {
  onSearch: () => void;
}) {
  const [selected, setSelected] =
    useState<(typeof moreItems)[number] | null>(null);
  const [vipPanel, setVipPanel] = useState<VipPanel | null>(null);
  const [vipData, setVipData] = useState<VipApiResponse | null>(null);
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    let active = true;

    loadTelegramIdentity()
      .then((data) => {
        if (active) setVipData(data);
      })
      .catch(() => {
        if (active) setVipData(null);
      });

    const timer = window.setInterval(() => {
      if (active) setClock(new Date());
    }, 30000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  if (vipPanel) {
    return (
      <VipPage
        initialPanel={vipPanel}
        onBack={() => setVipPanel(null)}
      />
    );
  }

  if (selected) {
    return (
      <MoreDetail
        title={selected.title}
        icon={selected.icon}
        description={selected.description}
        onBack={() => setSelected(null)}
      />
    );
  }

  const customer = vipData?.customer;
  const isVip =
    customer?.vipStatus?.trim().toLowerCase() === "active" ||
    customer?.vipStatus?.trim() === "فعال";

  const displayName = isVip
    ? [customer?.firstName, customer?.lastName].filter(Boolean).join(" ") || "عضو VIP"
    : "کاربر مهمان";

  const time = new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(clock);

  const jalaliDate = (() => {
    try {
      const parts = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).formatToParts(clock);

      const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";
      const day = parts.find((part) => part.type === "day")?.value ?? "";
      const month = parts.find((part) => part.type === "month")?.value ?? "";
      const year = parts.find((part) => part.type === "year")?.value ?? "";

      return `امروز ${weekday} ${day} ${month} ${year}`.replace(/\\s+/g, " ").trim();
    } catch {
      return "امروز";
    }
  })();

  const requestVip = () => {
    const message = encodeURIComponent(
      "سلام، برای عضویت در باشگاه VIP کائنات‌چی درخواست عضویت دارم."
    );
    window.location.href = "https://t.me/AD_Kaenatchi?text=" + message;
  };

  const openVipDashboard = () => {
    setVipPanel("dashboard");
  };

  return (
    <div className="inner-page more-dashboard">
      <div className="more-dashboard-heading">
        <strong>همه‌چیز در یک نگاه</strong>
        <button type="button" className="more-heading-search" onClick={onSearch} aria-label="جست‌وجو در کائنات‌چی">
          <Icon name="search" />
        </button>
      </div>

      <section className={"more-welcome-card " + (isVip ? "is-vip" : "is-guest")}>
        <div className="more-welcome-orbit orbit-one" />
        <div className="more-welcome-orbit orbit-two" />

        <div className="more-welcome-top">
          <div className="more-welcome-copy">
            <span className="more-welcome-kicker">
              {isVip ? "VIP MEMBER" : "KAENATCHI"}
            </span>
            <strong>
              {"خوش اومدی" + (isVip ? "، " + displayName : " 🌿")}
            </strong>
            <div className="more-status-line">
              <span className={"more-status-dot " + (isVip ? "vip" : "guest")} />
              <span>{isVip ? "عضو باشگاه VIP" : "عضویت VIP هنوز فعال نیست"}</span>
            </div>
          </div>

          <button
            type="button"
            className={"more-status-button " + (isVip ? "vip" : "guest")}
            onClick={openVipDashboard}
            aria-label={isVip ? "وضعیت عضویت VIP" : "ورود به VIP"}
          >
            <span />
          </button>
        </div>

        <div className="more-welcome-info">
          <div>
            <span>ساعت</span>
            <strong>{time}</strong>
          </div>
          <div>
            <span>امروز</span>
            <strong>{jalaliDate}</strong>
          </div>
          {isVip && customer?.joinedAt && (
            <div>
              <span>عضو از</span>
              <strong>{customer.joinedAt}</strong>
            </div>
          )}
        </div>
      </section>

      {!isVip && (
        <section className="more-vip-invite">
          <div className="more-vip-invite-icon">✦</div>
          <div className="more-vip-invite-copy">
            <span>باشگاه اختصاصی کائنات‌چی</span>
            <strong>یک قدم تا دنیای VIP</strong>
            <p>
              برای آشنایی و درخواست عضویت، درخواستت را از طریق تلگرام برای کائنات‌چی ارسال کن.
            </p>
          </div>
          <button type="button" onClick={requestVip}>
            <span>⭐ درخواست عضویت VIP</span>
            <Icon name="arrow" />
          </button>
        </section>
      )}

      {isVip && (
        <section className="more-member-section">
          <div className="more-member-heading">
            <span>MEMBERSHIP</span>
            <strong>عضویت فعال</strong>
          </div>

          <div className="more-member-grid">
            <button
              type="button"
              className="more-category-card"
              onClick={() => setVipPanel("profile")}
            >
              <span className="more-category-icon gold"><Icon name="user" /></span>
              <span className="more-category-copy">
                <strong>پروفایل من</strong>
                <small>اطلاعات حساب و عضویت</small>
              </span>
              <Icon name="arrow" />
            </button>

            <button
              type="button"
              className="more-category-card"
              onClick={() => setVipPanel("bookings")}
            >
              <span className="more-category-icon"><Icon name="calendar" /></span>
              <span className="more-category-copy">
                <strong>سابقه نوبت‌ها</strong>
                <small>نوبت‌های ثبت‌شده شما</small>
              </span>
              <Icon name="arrow" />
            </button>
          </div>
        </section>
      )}

      <section className="more-category-section">
        <div className="more-category-title">
          <span>کائنات‌چی</span>
          <strong>راهنما و ارتباط</strong>
        </div>

        <div className="more-category-grid">
          {moreItems
            .filter((item) => ["faq", "contact", "hours"].includes(item.id))
            .map((item) => (
              <button
                key={item.id}
                type="button"
                className="more-category-card"
                onClick={() => setSelected(item)}
              >
                <span className="more-category-icon">
                  <Icon name={item.icon} />
                </span>
                <span className="more-category-copy">
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                </span>
                <Icon name="arrow" />
              </button>
            ))}

          {cmsSetting(["channel", "کانال", "telegramchannel"]) && (
            <a
              className="more-category-card"
              href={cmsSetting(["channel", "کانال", "telegramchannel"])}
              target="_blank"
              rel="noreferrer"
            >
            <span className="more-category-icon">
              <Icon name="spark" />
            </span>
            <span className="more-category-copy">
              <strong>کانال کائنات‌چی</strong>
              <small>مطالب و اطلاع‌رسانی‌ها</small>
            </span>
              <Icon name="arrow" />
            </a>
          )}
        </div>
      </section>
    </div>
  );
}

function BookingPage({
  onBack,
  initialService,
}: {
  onBack: () => void;
  initialService?: Service | null;
}) {
  type BookingConfig = {
    services: Array<Record<string, unknown>>;
    availableDates: Array<Record<string, unknown>>;
    settings: Record<string, unknown>;
  };

  type BookingState = "idle" | "loading" | "submitting" | "success" | "error";

  const ENDPOINT = "https://kaenatchi-booking-transport.mayanaz-oriflame.workers.dev/";

  const [config, setConfig] = useState<BookingConfig | null>(null);
  const [serviceId, setServiceId] = useState(initialService?.id || "");
  const [date, setDate] = useState("");
  const [bookingCategory, setBookingCategory] = useState<ServiceCategory | null>(
    initialService?.category || null
  );
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<Array<Record<string, unknown>>>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [discount, setDiscount] = useState<{valid:boolean; percent:number; amount:number}>({valid:false,percent:0,amount:0});
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [transactionNumber, setTransactionNumber] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<BookingState>("loading");
  const [trackingCode, setTrackingCode] = useState("");
  const [checkingDiscount, setCheckingDiscount] = useState(false);

  const backendServices: Service[] = (config?.services || [])
    .map((item) => {
      const title = String(item.name ?? item.title ?? item.serviceName ?? "خدمت").trim();
      const category = cmsCategory(
        String(item.category ?? item.Category ?? ""),
        title
      );
      return {
        id: String(item.id ?? item.ID ?? ""),
        title,
        category,
        price: String(item.price ?? item.Price ?? ""),
        duration: String(item.duration ?? item.Duration ?? ""),
        description: String(item.description ?? item.Description ?? ""),
      };
    })
    .filter((service) => {
      const normalizedTitle = service.title
        .replace(/[\u200c\u200f\u200e\s_-]+/g, "")
        .toLocaleLowerCase("fa");
      return !(
        (normalizedTitle === "انرژیخوانی" ||
          normalizedTitle === "شمعتراپی" ||
          normalizedTitle === "سایکوتراپی") &&
        !service.price &&
        !service.duration
      );
    });

  // Booking is intentionally limited to the three customer-facing categories.
  // The individual services remain CMS/backend driven and can be added or removed
  // without changing this UI code.
  const bookingServices = backendServices.filter((service) =>
    ["energy", "candle", "psychotherapy"].includes(service.category)
  );

  const selectedService =
    bookingServices.find((item) => item.id === serviceId) ||
    initialService ||
    null;
  const basePrice =
    Number(String(selectedService?.price || "").replace(/[,٬،\s]/g, "")) || 0;
  const finalPrice = Math.max(0, basePrice - discount.amount);

  const getTelegramId = () => {
    try {
      return String((window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id || "");
    } catch {
      return "";
    }
  };

  const apiGetJsonp = (
    action: string,
    params: Record<string, string> = {}
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const callbackName =
        "__kaenatchiBooking_" +
        Date.now() +
        "_" +
        Math.random().toString(36).slice(2);

      const script = document.createElement("script");
      const url = new URL(ENDPOINT);

      url.searchParams.set("action", action);
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
      url.searchParams.set("callback", callbackName);
      url.searchParams.set("_", String(Date.now()));

      let settled = false;
      let timeoutId = 0;

      const cleanup = () => {
        window.clearTimeout(timeoutId);
        script.remove();
        try {
          delete (window as any)[callbackName];
        } catch {}
      };

      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        cleanup();
        fn();
      };

      (window as any)[callbackName] = (data: any) => {
        finish(() => {
          if (data?.ok === false) {
            reject(
              new Error(
                data?.message ||
                  "سامانه رزرو در مرحله «" +
                    action +
                    "» خطا برگرداند."
              )
            );
            return;
          }
          resolve(data);
        });
      };

      script.async = true;
      script.src = url.toString();

      script.onerror = () => {
        finish(() => reject(new Error("JSONP_TRANSPORT_FAILED")));
      };

      timeoutId = window.setTimeout(() => {
        finish(() => reject(new Error("JSONP_TRANSPORT_TIMEOUT")));
      }, 12000);

      document.head.appendChild(script);
    });
  };

  const apiGet = async (
    action: string,
    params: Record<string, string> = {}
  ): Promise<any> => {
    const url = new URL(ENDPOINT);

    url.searchParams.set("action", action);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    url.searchParams.set("_", String(Date.now()));

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        mode: "cors",
        credentials: "omit",
        cache: "no-store",
        redirect: "follow",
        headers: {
          Accept: "application/json, text/plain, */*",
        },
        signal: controller.signal,
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(
          "سامانه رزرو پاسخ HTTP " +
            response.status +
            " برگرداند."
        );
      }

      let data: any;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error("BOOKING_JSON_INVALID");
      }

      if (data?.ok === false) {
        throw new Error(
          data?.message ||
            "سامانه رزرو در مرحله «" +
              action +
              "» خطا برگرداند."
        );
      }

      return data;
    } catch (error) {
      /*
       * Telegram WebView, Safari/WKWebView, Android WebView and desktop
       * clients can reject or hide a cross-origin fetch even when the
       * Worker is healthy. JSONP is the browser-native cross-origin
       * script transport and therefore is the deterministic fallback.
       *
       * IMPORTANT: any fetch failure reaches this fallback. We do not
       * depend on browser-specific error-message text.
       */
      try {
        return await apiGetJsonp(action, params);
      } catch (jsonpError) {
        const firstError =
          error instanceof Error ? error.message : "FETCH_FAILED";
        const secondError =
          jsonpError instanceof Error
            ? jsonpError.message
            : "JSONP_FAILED";

        throw new Error(
          "BOOKING_TRANSPORT_FAILED:" +
            firstError +
            "|" +
            secondError
        );
      }
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const waitForBookingStatus = async (
    requestId: string,
    mode: "created" | "paid"
  ) => {
    const started = Date.now();

    while (Date.now() - started < 30000) {
      const data = await apiGet("bookingStatus", { requestId });

      if (data.found) {
        if (mode === "created" && data.bookingId) return data;
        if (
          mode === "paid" &&
          (
            data.paymentStatus === "فیش دریافت شد" ||
            data.paymentStatus === "تأیید شد"
          )
        ) {
          return data;
        }
      }

      await new Promise((resolve) =>
        window.setTimeout(resolve, 1200)
      );
    }

    throw new Error(
      mode === "created"
        ? "ثبت نوبت زمان‌بر شد. لطفاً وضعیت درخواست را دوباره بررسی کن."
        : "ارسال اطلاعات پرداخت زمان‌بر شد. لطفاً چند لحظه بعد دوباره وضعیت نوبت را بررسی کن."
    );
  };

  const apiPost = async (
    action: string,
    payload: Record<string, unknown>
  ) => {
    const requestId = String(
      payload.requestId ||
        payload.clientRequestId ||
        payload.clientTrackingCode ||
        ""
    ).trim();

    const url = new URL(ENDPOINT);
    url.searchParams.set("_", String(Date.now()));

    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      30000
    );

    try {
      const response = await fetch(url.toString(), {
        method: "POST",
        mode: "cors",
        credentials: "omit",
        cache: "no-store",
        redirect: "follow",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
          Accept: "application/json, text/plain, */*",
        },
        body: JSON.stringify({
          action,
          ...payload,
        }),
        signal: controller.signal,
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(
          "سامانه رزرو پاسخ HTTP " +
            response.status +
            " برگرداند."
        );
      }

      let data: any = { ok: true };

      if (responseText.trim()) {
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error(
            "پاسخ ثبت نوبت JSON معتبر نیست."
          );
        }
      }

      if (data?.ok === false) {
        throw new Error(
          data?.message ||
            "سامانه رزرو در مرحله «" +
              action +
              "» خطا برگرداند."
        );
      }

      if (!requestId) {
        return data;
      }

      return waitForBookingStatus(
        requestId,
        action === "createBooking"
          ? "created"
          : "paid"
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("BOOKING_TRANSPORT_TIMEOUT");
      }

      if (
        error instanceof TypeError &&
        /fetch|network|failed/i.test(error.message)
      ) {
        throw new Error(
          "ارتباط با سامانه رزرو برقرار نشد. لطفاً دوباره تلاش کن."
        );
      }

      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const loadConfig = async () => {
    try {
      setState("loading");
      setMessage("");

      // مستقیماً getConfig را می‌خوانیم. transportTest یک درخواست
      // اضافه بود و در Telegram iOS می‌توانست کل صفحه رزرو را بی‌دلیل
      // در حالت BOOKING_TRANSPORT_TIMEOUT نگه دارد. خود getConfig از
      // همان Worker و همان fallback JSONP عبور می‌کند.
      const data = await apiGet("getConfig");

      if (!data || data.ok === false) {
        throw new Error(data?.message || "سامانه رزرو در پاسخ getConfig خطا داد.");
      }

      const services = Array.isArray(data.services) ? data.services : [];

      if (services.length === 0) {
        throw new Error("اتصال به سامانه برقرار است، اما لیست خدمات خالی برگشت.");
      }

      const next: BookingConfig = {
        services,
        availableDates: Array.isArray(data.availableDates) ? data.availableDates : [],
        settings: data.settings || {},
      };

      setConfig(next);
      if (initialService) {
        setServiceId(initialService.id);
        setBookingCategory(initialService.category);
      }
      setState("idle");
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "اطلاعات رزرو دریافت نشد."
      );
    }
  };

  useEffect(() => {
    void loadConfig();
    try {
      (window as any).Telegram?.WebApp?.ready?.();
      (window as any).Telegram?.WebApp?.expand?.();
    } catch {}
  }, []);

  useEffect(() => {
    if (!date) {
      setSlots([]);
      setTime("");
      return;
    }

    let active = true;
    setTime("");
    setMessage("در حال دریافت ساعت‌های قابل رزرو...");

    // The backend resolves the daily schedule from the Jalali date.
    // serviceId is not required by getAvailableSlots_ and is deliberately
    // omitted so the slot request stays compatible with the locked backend.
    apiGet("getAvailableSlots", { date })
      .then((data) => {
        if (!active) return;
        setSlots(Array.isArray(data.slots) ? data.slots : []);
        setMessage(
          Array.isArray(data.slots) && data.slots.length
            ? ""
            : "برای این تاریخ ساعت آزادی وجود ندارد."
        );
      })
      .catch((error) => {
        if (!active) return;
        setSlots([]);
        setMessage(
          error instanceof Error ? error.message : "ساعت‌ها دریافت نشدند."
        );
      });

    return () => {
      active = false;
    };
  }, [date]);

  const checkDiscount = async () => {
    const code = discountCode.trim();
    if (!code || !basePrice) {
      setDiscount({valid:false,percent:0,amount:0});
      return;
    }
    setCheckingDiscount(true);
    setMessage("");
    try {
      const data = await apiGet("validateDiscount", {
        code,
        price: String(basePrice),
        telegramId: getTelegramId(),
      });
      if (data.valid) {
        setDiscount({
          valid:true,
          percent:Number(data.discountPercent)||0,
          amount:Number(data.discountAmount)||0,
        });
        setMessage("کد تخفیف با موفقیت اعمال شد.");
      } else {
        setDiscount({valid:false,percent:0,amount:0});
        setMessage(data.message || "کد تخفیف معتبر نیست.");
      }
    } catch (error) {
      setDiscount({valid:false,percent:0,amount:0});
      setMessage(error instanceof Error ? error.message : "بررسی کد تخفیف ناموفق بود.");
    } finally {
      setCheckingDiscount(false);
    }
  };

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve,reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("خواندن تصویر فیش ناموفق بود."));
      reader.readAsDataURL(file);
    });

  const submit = async () => {
    setMessage("");
    if (!selectedService || !serviceId) return setMessage("لطفاً خدمت موردنظر را انتخاب کن.");
    if (!date || !time) return setMessage("لطفاً تاریخ و ساعت نوبت را انتخاب کن.");
    if (!firstName.trim() || !lastName.trim() || !mobile.trim()) return setMessage("لطفاً نام، نام خانوادگی و شماره موبایل را کامل وارد کن.");
    if (!receiptFile && !transactionNumber.trim()) return setMessage("تصویر فیش یا کد پیگیری پرداخت الزامی است.");
    if (receiptFile && receiptFile.size > 8 * 1024 * 1024) return setMessage("حجم تصویر فیش باید کمتر از ۸ مگابایت باشد.");

    setState("submitting");
    try {
      const requestId = "REQ-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,8).toUpperCase();
      const serviceName = String(selectedService.title || "");
      const telegramId = getTelegramId();

      const create = await apiPost("createBooking", {
        requestId,
        telegramId,
        firstName:firstName.trim(),
        lastName:lastName.trim(),
        mobile:mobile.trim(),
        serviceId,
        serviceName,
        date,
        time,
        discountCode:discountCode.trim(),
      });

      const bookingId = String(create?.booking?.bookingId || create?.bookingId || "");
      if (!bookingId) throw new Error("کد نوبت از سامانه دریافت نشد.");

      let receiptData = "";
      if (receiptFile) receiptData = await fileToDataUrl(receiptFile);

      const payment = await apiPost("submitPayment", {
        requestId,
        bookingId,
        telegramId,
        transactionNumber:transactionNumber.trim(),
        receiptData,
        receiptFileName:receiptFile?.name || "",
        receiptMimeType:receiptFile?.type || "",
      });

      if (!payment?.ok) throw new Error(payment?.message || "ارسال پرداخت ناموفق بود.");

      setTrackingCode(String(create?.booking?.trackingCode || payment?.trackingCode || ""));
      setState("success");
      setMessage("درخواست نوبت و اطلاعات پرداخت با موفقیت ثبت شد و در انتظار بررسی ادمین است.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "هنگام ثبت نوبت مشکلی پیش آمد.");
    }
  };

  if (state === "loading" && !config) {
    return (
      <div className="inner-page">
        <button type="button" onClick={onBack} style={backButtonStyle}>← بازگشت</button>
        <SectionHeaderCard kicker="KAENATCHI" title="رزرو نوبت" description="در حال دریافت خدمات و زمان‌های قابل رزرو..." icon="calendar" />
        <div className="glass-list-card" style={{display:"block",textAlign:"center"}}>
          <div className="list-copy"><strong>در حال آماده‌سازی رزرو...</strong><span>لطفاً چند لحظه صبر کن.</span></div>
        </div>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="inner-page">
        <SectionHeaderCard kicker="BOOKING RECEIVED" title="درخواست ثبت شد" description="اطلاعات نوبت و پرداخت دریافت شد و درخواست برای بررسی ادمین ارسال شده است." icon="check" status="در انتظار تأیید" />
        <div className="glass-list-card" style={{display:"block",textAlign:"center"}}>
          <div className="list-icon" style={{margin:"0 auto 12px"}}><Icon name="ticket" /></div>
          <div className="list-copy">
            <strong>کد پیگیری</strong>
            <span style={{direction:"ltr",fontWeight:700,fontSize:"18px"}}>{trackingCode || "ثبت شد"}</span>
            <span>لطفاً این کد را نگه دار.</span>
          </div>
        </div>
        <button type="button" onClick={onBack} style={{...backButtonStyle, width:"100%", marginTop:"16px"}}>بازگشت</button>
      </div>
    );
  }

  const availableDates = (config?.availableDates || [])
    .filter((item) => {
      const value = normalizeJalaliKey(item.date);
      const today = normalizeJalaliKey(getTodayJalaliKey());
      return value && (!today || value > today);
    })
    .slice(0, 3);

  const availableSlots = slots.filter(
    (slot) => slot.available === true || String(slot.available).toLowerCase() === "true"
  );

  const categoryGroups: Array<{
    id: ServiceCategory;
    title: string;
    icon: IconName;
    items: Service[];
  }> = [
    {
      id: "energy",
      title: "انرژی‌خوانی",
      icon: "energy",
      items: bookingServices.filter((service) => service.category === "energy"),
    },
    {
      id: "candle",
      title: "شمع‌تراپی",
      icon: "candle",
      items: bookingServices.filter((service) => service.category === "candle"),
    },
    {
      id: "psychotherapy",
      title: "سایکو تراپی",
      icon: "conversation",
      items: bookingServices.filter((service) => service.category === "psychotherapy"),
    },
  ];

  const activeGroup = bookingCategory
    ? categoryGroups.find((group) => group.id === bookingCategory) || null
    : null;

  const paymentCardNumber =
    cmsSetting(["booking_card_number", "شماره کارت", "کارت بانکی"]) || "";
  const paymentBank =
    cmsSetting(["booking_bank_name", "نام بانک", "بانک"]) || "";
  const paymentHolder =
    cmsSetting(["booking_card_holder", "صاحب کارت", "نام صاحب کارت", "بنـام"]) || "";
  const paymentNote =
    cmsSetting(["booking_payment_text", "توضیح پرداخت", "متن پرداخت"]) ||
    "پس از پرداخت، تصویر فیش یا کد پیگیری پرداخت را ارسال کن.";

  const inputBaseStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    marginTop: "10px",
    padding: "14px 15px",
    borderRadius: "18px",
    border: "1px solid rgba(53,59,50,.14)",
    background: "rgba(255,255,255,.78)",
    color: "#253128",
    fontFamily: "inherit",
    fontSize: "14px",
    outline: "none",
    transition: "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
  };

  const tapHandlers = {
    onFocus: (event: React.FocusEvent<HTMLInputElement>) => {
      event.currentTarget.style.transform = "translateY(-1px)";
      event.currentTarget.style.boxShadow = "0 8px 20px rgba(53,59,50,.10)";
    },
    onBlur: (event: React.FocusEvent<HTMLInputElement>) => {
      event.currentTarget.style.transform = "translateY(0)";
      event.currentTarget.style.boxShadow = "none";
    },
  };

  const hideKeyboard = (event: React.FocusEvent<HTMLInputElement>) => {
    // Telegram/WebKit does not expose a universal keyboard API. Blurring the
    // active input is the cross-platform native way to dismiss it.
    window.setTimeout(() => {
      try {
        (event.currentTarget as HTMLInputElement).blur();
      } catch {}
    }, 0);
  };

  return (
    <div className="inner-page">
      <button type="button" onClick={onBack} style={backButtonStyle}>← بازگشت</button>
      <SectionHeaderCard
        kicker="KAENATCHI"
        title="رزرو نوبت"
        description="خدمت، تاریخ و ساعت موردنظر را انتخاب کن؛ مبلغ نهایی از سامانه محاسبه می‌شود."
        icon="calendar"
      />

      <div className="glass-list-card booking-glass-card" style={{display:"block"}}>
        <div className="list-copy">
          <strong>۱. انتخاب خدمت</strong>
          <span>یکی از سه دسته را باز کن و خدمت موردنظرت را انتخاب کن.</span>
        </div>

        {initialService && selectedService ? (
          <div style={{marginTop:"12px",padding:"15px",borderRadius:"20px",background:"rgba(36,99,71,.07)",border:"1px solid rgba(36,99,71,.12)"}}>
            <div className="list-copy">
              <strong>{selectedService.title}</strong>
              <span>{selectedService.description || "خدمت انتخاب‌شده"}</span>
              {selectedService.price && (
                <span style={{marginTop:"5px",fontWeight:700}}>
                  {selectedService.price} تومان
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setServiceId("");
                setBookingCategory(null);
                setDiscount({valid:false,percent:0,amount:0});
              }}
              style={{marginTop:"12px",width:"100%"}}
            >
              تغییر خدمت
            </button>
          </div>
        ) : (
          <div style={{display:"grid",gap:"10px",marginTop:"12px"}}>
            {categoryGroups.map((group, index) => (
              <div key={group.id} className="booking-category-shell">
                <button
                  type="button"
                  className="booking-category-trigger"
                  onClick={() =>
                    setBookingCategory((current) =>
                      current === group.id ? null : group.id
                    )
                  }
                  style={{
                    width:"100%",
                    minHeight:"64px",
                    border:"1px solid rgba(53,59,50,.12)",
                    borderRadius:"20px",
                    background: bookingCategory === group.id
                      ? "rgba(36,99,71,.12)"
                      : "rgba(255,255,255,.66)",
                    color:"#26342b",
                    fontFamily:"inherit",
                    boxShadow:"0 8px 22px rgba(53,59,50,.07)",
                    cursor:"pointer",
                    textAlign:"right",
                    padding:"13px 15px",
                    transition:"transform .18s ease, box-shadow .18s ease, background .18s ease",
                  }}
                >
                  <span style={{display:"inline-flex",verticalAlign:"middle",marginLeft:"8px",color:"#246347"}}>
                    <Icon name={group.icon} />
                  </span>
                  <strong>{group.title}</strong>
                  <span style={{display:"block",marginTop:"4px",fontSize:"11px",opacity:.68}}>
                    {group.items.length} خدمت
                  </span>
                </button>

                {bookingCategory === group.id && (
                  <div
                    className="booking-service-menu"
                    style={{
                      display:"grid",
                      gap:"8px",
                      marginTop:"8px",
                      padding:"8px",
                      borderRadius:"20px",
                      background:"rgba(255,255,255,.42)",
                      border:"1px solid rgba(255,255,255,.58)",
                      backdropFilter:"blur(18px)",
                      WebkitBackdropFilter:"blur(18px)",
                      boxShadow:"inset 0 1px 0 rgba(255,255,255,.62), 0 10px 25px rgba(53,59,50,.06)",
                    }}
                  >
                    {group.items.length ? group.items.map((service) => (
                      <button
                        key={service.id}
                        type="button"
                        className="booking-service-option"
                        onClick={() => {
                          setServiceId(service.id);
                          setBookingCategory(group.id);
                          setDiscount({valid:false,percent:0,amount:0});
                          setMessage("");
                        }}
                        style={{
                          width:"100%",
                          textAlign:"right",
                          padding:"13px 14px",
                          border:"1px solid rgba(53,59,50,.09)",
                          borderRadius:"17px",
                          background: serviceId === service.id
                            ? "rgba(36,99,71,.12)"
                            : "rgba(255,255,255,.70)",
                          color:"#26342b",
                          fontFamily:"inherit",
                          boxShadow:"0 6px 17px rgba(53,59,50,.05)",
                          cursor:"pointer",
                          transition:"transform .18s ease, box-shadow .18s ease, background .18s ease",
                        }}
                      >
                        <strong style={{display:"block"}}>{service.title}</strong>
                        {service.price && (
                          <span style={{display:"block",marginTop:"4px",fontSize:"12px",opacity:.76}}>
                            {service.price} تومان
                          </span>
                        )}
                      </button>
                    )) : (
                      <div style={{padding:"13px",borderRadius:"16px",background:"rgba(53,59,50,.06)",fontSize:"12px",color:"#4b564e"}}>
                        هنوز خدمتی در این دسته فعال نیست.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedService && (
          <div style={{marginTop:"12px",fontSize:"12px",lineHeight:1.9,color:"#59655d"}}>
            {selectedService.description}
          </div>
        )}
      </div>

      <div className="glass-list-card booking-glass-card" style={{display:"block"}}>
        <div className="list-copy">
          <strong>۲. انتخاب زمان</strong>
          <span>فقط سه تاریخ آینده نمایش داده می‌شود و هر روز خودکار به‌روزرسانی خواهد شد.</span>
        </div>

        <select
          value={date}
          onChange={(e)=>{
            setDate(e.target.value);
            setTime("");
          }}
          style={{
            ...inputBaseStyle,
            appearance:"none",
            WebkitAppearance:"none",
            marginTop:"12px",
          }}
        >
          <option value="">انتخاب تاریخ</option>
          {availableDates.map((item) => {
            const value=String(item.date||"");
            const label=String(item.dayOfWeek||"") + (item.dayOfWeek ? " — " : "") + value;
            return <option key={value} value={value}>{label}</option>;
          })}
        </select>

        <select
          value={time}
          onChange={(e)=>setTime(e.target.value)}
          disabled={!date}
          style={{
            ...inputBaseStyle,
            appearance:"none",
            WebkitAppearance:"none",
            marginTop:"10px",
            opacity: date ? 1 : .6,
          }}
        >
          <option value="">{date ? (slots.length ? "انتخاب ساعت" : "در حال دریافت ساعت‌ها...") : "ابتدا تاریخ را انتخاب کن"}</option>
          {availableSlots.map((item) => (
            <option key={String(item.time)} value={String(item.time)}>
              {String(item.time)}
            </option>
          ))}
        </select>
      </div>

      <div className="glass-list-card booking-glass-card" style={{display:"block"}}>
        <div className="list-copy">
          <strong>۳. اطلاعات شما</strong>
          <span>اطلاعات واقعی وارد کن؛ این بخش برای جلوگیری از رزروهای تکراری و پرداخت‌های جعلی کنترل می‌شود.</span>
        </div>

        <input
          value={firstName}
          onChange={e=>setFirstName(e.target.value)}
          placeholder="نام"
          autoComplete="given-name"
          enterKeyHint="next"
          style={inputBaseStyle}
          {...tapHandlers}
          onBlur={(e)=>{tapHandlers.onBlur(e);hideKeyboard(e);}}
        />
        <input
          value={lastName}
          onChange={e=>setLastName(e.target.value)}
          placeholder="نام خانوادگی"
          autoComplete="family-name"
          enterKeyHint="next"
          style={inputBaseStyle}
          {...tapHandlers}
          onBlur={(e)=>{tapHandlers.onBlur(e);hideKeyboard(e);}}
        />
        <input
          value={mobile}
          onChange={e=>setMobile(e.target.value)}
          placeholder="09xxxxxxxxx"
          inputMode="tel"
          autoComplete="tel"
          enterKeyHint="done"
          style={inputBaseStyle}
          {...tapHandlers}
          onBlur={(e)=>{tapHandlers.onBlur(e);hideKeyboard(e);}}
        />
      </div>

      <div className="glass-list-card booking-glass-card" style={{display:"block"}}>
        <div className="list-copy">
          <strong>۴. کد تخفیف VIP</strong>
          <span>اگر توکن VIP داری، قبل از پرداخت بررسی‌اش کن.</span>
        </div>

        <div style={{display:"flex",gap:"8px",marginTop:"12px",alignItems:"stretch"}}>
          <input
            value={discountCode}
            onChange={e=>{setDiscountCode(e.target.value.toUpperCase());setDiscount({valid:false,percent:0,amount:0});}}
            placeholder="کد تخفیف"
            enterKeyHint="done"
            style={{...inputBaseStyle,marginTop:0,flex:1}}
            {...tapHandlers}
            onBlur={(e)=>{tapHandlers.onBlur(e);hideKeyboard(e);}}
          />
          <button
            type="button"
            onClick={()=>void checkDiscount()}
            disabled={checkingDiscount || !discountCode.trim() || !basePrice}
            style={{
              width:"112px",
              marginTop:0,
              border:"1px solid rgba(36,99,71,.18)",
              borderRadius:"18px",
              background:"linear-gradient(135deg,#174b38,#2c7658)",
              color:"#fff",
              fontFamily:"inherit",
              fontSize:"13px",
              boxShadow:"0 8px 18px rgba(23,75,56,.16)",
              cursor:"pointer",
            }}
          >
            {checkingDiscount ? "..." : "بررسی"}
          </button>
        </div>

        {discount.valid && (
          <div style={{marginTop:"10px",fontSize:"12px",color:"#246347",fontWeight:600}}>
            تخفیف {discount.percent}% اعمال شد.
          </div>
        )}

        {basePrice > 0 && (
          <div style={{marginTop:"14px",padding:"14px",borderRadius:"18px",background:"rgba(36,99,71,.06)",color:"#26342b"}}>
            <div style={{display:"flex",justifyContent:"space-between",gap:"12px",fontSize:"12px",marginBottom:"7px"}}>
              <span>مبلغ خدمت</span><strong>{basePrice.toLocaleString("fa-IR")} تومان</strong>
            </div>
            {discount.valid && (
              <div style={{display:"flex",justifyContent:"space-between",gap:"12px",fontSize:"12px",marginBottom:"7px"}}>
                <span>تخفیف</span><strong>{discount.amount.toLocaleString("fa-IR")} تومان</strong>
              </div>
            )}
            <div style={{display:"flex",justifyContent:"space-between",gap:"12px",fontSize:"15px",color:"#174b38"}}>
              <strong>مبلغ نهایی</strong><strong>{finalPrice.toLocaleString("fa-IR")} تومان</strong>
            </div>
          </div>
        )}
      </div>

      <div className="glass-list-card booking-glass-card" style={{display:"block"}}>
        <div className="list-copy">
          <strong>۵. پرداخت و رسید</strong>
          <span>{paymentNote}</span>
        </div>

        <div style={{
          marginTop:"14px",
          padding:"16px",
          borderRadius:"20px",
          background:"rgba(165,139,91,.09)",
          border:"1px solid rgba(165,139,91,.18)",
          color:"#26342b",
          boxShadow:"0 8px 20px rgba(53,59,50,.06)",
        }}>
          {paymentCardNumber ? (
            <>
              <div style={{fontSize:"11px",opacity:.68,marginBottom:"5px"}}>شماره کارت</div>
              <b dir="ltr" style={{fontSize:"16px",letterSpacing:"1px"}}>{paymentCardNumber}</b>
              {(paymentBank || paymentHolder) && (
                <div style={{marginTop:"8px",fontSize:"12px"}}>
                  {[paymentBank,paymentHolder].filter(Boolean).join(" · ")}
                </div>
              )}
            </>
          ) : (
            <div style={{fontSize:"12px",lineHeight:1.9}}>
              اطلاعات کارت هنوز در CMS ثبت نشده است.
            </div>
          )}
        </div>

        <input
          value={transactionNumber}
          onChange={e=>setTransactionNumber(e.target.value)}
          placeholder="کد پیگیری پرداخت (اختیاری)"
          inputMode="numeric"
          enterKeyHint="done"
          style={inputBaseStyle}
          {...tapHandlers}
          onBlur={(e)=>{tapHandlers.onBlur(e);hideKeyboard(e);}}
        />

        <label
          style={{
            display:"block",
            marginTop:"14px",
            padding:"16px",
            borderRadius:"20px",
            border:"1px dashed rgba(36,99,71,.35)",
            background:"rgba(36,99,71,.05)",
            color:"#26342b",
            textAlign:"center",
            cursor:"pointer",
            transition:"transform .18s ease, box-shadow .18s ease, background .18s ease",
          }}
          onTouchStart={(e)=>{e.currentTarget.style.transform="scale(.985)";}}
          onTouchEnd={(e)=>{e.currentTarget.style.transform="scale(1)";}}
        >
          📎 {receiptFile ? receiptFile.name : "انتخاب تصویر فیش"}
          <input
            type="file"
            accept="image/*"
            onChange={e=>setReceiptFile(e.target.files?.[0] || null)}
            style={{display:"none"}}
          />
        </label>
      </div>
      {message && (
        <div style={{padding:"13px",borderRadius:"15px",marginTop:"12px",background:state==="error"?"rgba(165,45,45,.08)":"rgba(36,99,71,.08)",color:state==="error"?"#a52d2d":"#246347",fontSize:"13px",lineHeight:1.9,whiteSpace:"pre-line"}}>
          {message}
        </div>
      )}

      <button type="button" onClick={()=>void submit()} disabled={state==="submitting"} style={{width:"100%",marginTop:"16px",border:"none",borderRadius:"18px",padding:"16px",background:"linear-gradient(135deg,#174b38,#2c7658)",color:"#fff",fontFamily:"inherit",fontSize:"15px",cursor:state==="submitting"?"default":"pointer",boxShadow:"0 10px 24px rgba(23,75,56,.2)"}}>
        {state==="submitting" ? "در حال ثبت نوبت و پرداخت..." : "ثبت نهایی نوبت"}
      </button>
    </div>
  );
}

function BottomNav({
  active,
  onChange,
  onQuickDestination,
  onOpenBooking,
}: {
  active: Section;
  onChange: (section: Section) => void;
  onQuickDestination: (destination: "classes" | "events") => void;
  onOpenBooking: () => void;
}) {
  const [quickOpen, setQuickOpen] = useState(false);

  const openBooking = () => {
    setQuickOpen(false);
    onOpenBooking();
  };

  const openQuickSection = (section: Section) => {
    setQuickOpen(false);
    onChange(section);
  };

  return (
    <nav
      className={`bottom-nav ${quickOpen ? "fab-open" : ""}`}
      aria-label="ناوبری اصلی"
    >
      <button
        type="button"
        className={`nav-item ${active === "home" ? "active" : ""}`}
        onClick={() => {
          setQuickOpen(false);
          onChange("home");
        }}
      >
        <span className="nav-icon"><Icon name="home" /></span>
        <span>خانه</span>
      </button>

      <button
        type="button"
        className={`nav-item ${active === "services" ? "active" : ""}`}
        onClick={() => {
          setQuickOpen(false);
          onChange("services");
        }}
      >
        <span className="nav-icon"><Icon name="energy" /></span>
        <span>خدمات</span>
      </button>

      <div className="nav-fab-slot">
        <button
          type="button"
          className={`nav-fab ${quickOpen ? "open" : ""}`}
          onClick={() => setQuickOpen((value) => !value)}
          aria-expanded={quickOpen}
          aria-label={quickOpen ? "بستن میانبرها" : "باز کردن میانبرها"}
        >
          <span className="nav-fab-plus">{quickOpen ? "×" : "+"}</span>
        </button>

        <div className="nav-fab-actions" aria-hidden={!quickOpen}>
          <button
            type="button"
            className={`nav-fab-action action-booking ${quickOpen ? "visible" : ""}`}
            onClick={openBooking}
            tabIndex={quickOpen ? 0 : -1}
          >
            <span className="nav-fab-action-icon"><Icon name="calendar" /></span>
            <span>رزرو نوبت</span>
          </button>

          <button
            type="button"
            className={`nav-fab-action action-class ${quickOpen ? "visible" : ""}`}
            onClick={() => { setQuickOpen(false); onQuickDestination("classes"); }}
            tabIndex={quickOpen ? 0 : -1}
          >
            <span className="nav-fab-action-icon"><Icon name="class" /></span>
            <span>کلاس‌ها</span>
          </button>

          <button
            type="button"
            className={`nav-fab-action action-event ${quickOpen ? "visible" : ""}`}
            onClick={() => { setQuickOpen(false); onQuickDestination("events"); }}
            tabIndex={quickOpen ? 0 : -1}
          >
            <span className="nav-fab-action-icon"><Icon name="event" /></span>
            <span>ایونت‌ها</span>
          </button>
        </div>
      </div>

      <button
        type="button"
        className={`nav-item ${active === "selected" ? "active" : ""}`}
        onClick={() => {
          setQuickOpen(false);
          onChange("selected");
        }}
      >
        <span className="nav-icon"><Icon name="spark" /></span>
        <span>منتخب</span>
      </button>

      <button
        type="button"
        className={`nav-item ${active === "more" ? "active" : ""}`}
        onClick={() => {
          setQuickOpen(false);
          onChange("more");
        }}
      >
        <span className="nav-icon"><Icon name="dots" /></span>
        <span>بیشتر</span>
      </button>
    </nav>
  );
}


/* =========================================================
   APP
========================================================= */

function App() {

  const sectionOrder: Section[] = ["home", "services", "booking", "selected", "more"];

  const [section, setSection] = useState<Section>("home");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchService, setSearchService] = useState<Service | null>(null);
  const [bookingService, setBookingService] = useState<Service | null>(null);
  const [vipOpen, setVipOpen] = useState(false);
  const [serviceFocus, setServiceFocus] = useState<"all" | "classes" | "events">("all");
  const [navDirection, setNavDirection] = useState<"forward" | "backward">("forward");

  const touchStart = useRef<{ x: number; y: number; identifier: number } | null>(null);
  const [cmsReady, setCmsReady] = useState(false);
  const [cmsLoading, setCmsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    loadCmsData().then((ready) => {
      if (!mounted) return;
      setCmsReady(ready);
      setCmsLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let telegramWebApp: any = null;
    let cleanupViewportListener: (() => void) | null = null;

    const applyTelegramViewport = (webApp: any) => {
      telegramWebApp = webApp;

      try {
        webApp.ready?.();
        webApp.expand?.();

        const updateViewportHeight = () => {
          const viewportHeight = Number(webApp.viewportHeight);
          if (Number.isFinite(viewportHeight) && viewportHeight > 0) {
            document.documentElement.style.setProperty(
              "--tg-viewport-height",
              `${viewportHeight}px`
            );
          }
        };

        updateViewportHeight();

        if (typeof webApp.onEvent === "function") {
          webApp.onEvent("viewportChanged", updateViewportHeight);
          cleanupViewportListener = () => {
            if (typeof webApp.offEvent === "function") {
              webApp.offEvent("viewportChanged", updateViewportHeight);
            }
          };
        }
      } catch {
        // The app also works normally when opened outside Telegram.
      }
    };

    const existingWebApp = (window as any).Telegram?.WebApp;

    if (existingWebApp) {
      applyTelegramViewport(existingWebApp);
    } else if (
      typeof document !== "undefined" &&
      !document.querySelector(
        'script[data-kaenatchi-telegram-webapp="true"]'
      )
    ) {
      const script = document.createElement("script");
      script.src = TELEGRAM_WEBAPP_SCRIPT;
      script.async = true;
      script.dataset.kaenatchiTelegramWebapp = "true";
      script.onload = () => {
        const webApp = (window as any).Telegram?.WebApp;
        if (webApp) {
          applyTelegramViewport(webApp);
        }
      };
      document.head.appendChild(script);
    }

    return () => {
      cleanupViewportListener?.();
      telegramWebApp = null;
    };
  }, []);

  const changeSection = (nextSection: Section) => {
    if (nextSection === section) return;

    const currentIndex = sectionOrder.indexOf(section);
    const nextIndex = sectionOrder.indexOf(nextSection);

    setNavDirection(nextIndex > currentIndex ? "forward" : "backward");
    setSection(nextSection);
  };

  // Reset scroll after React commits the new section. This prevents the browser
  // from carrying the previous section's document position into the new page.
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const resetScroll = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    resetScroll();

    const frame = window.requestAnimationFrame(() => {
      resetScroll();
      window.setTimeout(resetScroll, 0);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [section]);

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1) {
      touchStart.current = null;
      return;
    }

    const touch = event.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      identifier: touch.identifier,
    };
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStart.current;
    if (!start) return;

    const touch = Array.from(event.changedTouches).find(
      (item) => item.identifier === start.identifier
    );

    touchStart.current = null;
    if (!touch) return;

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX < 45 || absX <= absY * 1.35) return;

    const currentIndex = sectionOrder.indexOf(section);

    if (deltaX < 0 && currentIndex < sectionOrder.length - 1) {
      changeSection(sectionOrder[currentIndex + 1]);
    } else if (deltaX > 0 && currentIndex > 0) {
      changeSection(sectionOrder[currentIndex - 1]);
    }
  };

  const handleTouchCancel = () => {
    touchStart.current = null;
  };

  if (cmsLoading) {
    return (
      <div className="app-shell app-shell-loading">
        <div className="cms-loading-card">
          <div className="cms-loading-mark">✦</div>
          <strong>در حال آماده‌سازی کائنات‌چی</strong>
          <span>در حال دریافت تازه‌ترین محتوا...</span>
        </div>
      </div>
    );
  }

  if (!cmsReady) {
    return (
      <div className="app-shell app-shell-loading">
        <div className="cms-loading-card">
          <div className="cms-loading-mark">!</div>
          <strong>محتوا در دسترس نیست</strong>
          <span>اتصال به سامانه محتوا برقرار نشد. لطفاً چند لحظه بعد دوباره تلاش کن.</span>
        </div>
      </div>
    );
  }

  const openSearch = () => {
    setVipOpen(false);
    setSearchService(null);
    setSearchOpen(true);
  };

  const openQuickDestination = (destination: "classes" | "events") => {
    setSearchOpen(false);
    setSearchService(null);
    setVipOpen(false);
    setServiceFocus(destination);
    changeSection("services");
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchService(null);
  };

  const openVip = () => {
    setSearchOpen(false);
    setSearchService(null);
    setVipOpen(true);
  };

  if (vipOpen) {
    return (
      <div className="app-shell app-shell-special">
        {bookingThemeStyle}
      <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <VipPage onBack={() => setVipOpen(false)} />
        <AppFooter />
      </div>
    );
  }

  if (searchOpen) {
    if (searchService) {
      return (
        <div className="app-shell app-shell-special">
          <div className="ambient ambient-one" />
          <div className="ambient ambient-two" />
          <ServiceDetail
            service={searchService}
            onBack={() => setSearchService(null)}
            onOpenBooking={() => {
              setBookingService(searchService);
              setSearchOpen(false);
              setSearchService(null);
              changeSection("booking");
            }}
          />
          <AppFooter />
        </div>
      );
    }

    return (
      <div className="app-shell app-shell-special">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <SearchPage
          onBack={closeSearch}
          onOpenService={(service) => setSearchService(service)}
        />
        <AppFooter />
      </div>
    );
  }

type Section = "home" | "services" | "booking" | "selected" | "more";

type IconName =
  | "home"
  | "spark"
  | "menu"
  | "dots"
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
  | "check"
  | "search";

type ServiceCategory =
  | "energy"
  | "candle"
  | "psychotherapy"
  | "class"
  | "event";

type Service = {
  id: string;
  title: string;
  category: ServiceCategory;
  price: string;
  duration: string;
  description: string;
};

type SearchItem = {
  id: string;
  title: string;
  description: string;
  type: "service" | "class" | "event" | "faq";
  icon: IconName;
  service?: Service;
};

type VipCustomer = {
  id?: string;
  telegramId?: string | number;
  firstName?: string | null;
  lastName?: string | null;
  mobile?: string | null;
  vipStatus?: string | null;
  joinedAt?: string | null;
  bookingsCount?: number;
};

type VipToken = {
  code?: string;
  customerId?: string;
  discount?: number | string;
  discountPercent?: number | string;
  issuedAt?: string | null;
  expiresAt?: string | null;
  status?: string | null;
  usedAt?: string | null;
  trackingCode?: string | null;
};

type VipApiResponse = {
  success: boolean;
  message?: string;
  accessDenied?: boolean;
  debug?: string;
  detail?: string;
  error?: string;
  customer?: VipCustomer;
  history?: unknown[];
  payments?: unknown[];
  tokens?: VipToken[];
  classes?: unknown[];
  events?: unknown[];
  needsConnectionCode?: boolean;
};

/*
 * VIP اصلی کائنات‌چی اکنون از Google Apps Script قدیمی
 * و همان Google Sheet مدیریت می‌شود.
 */
const VIP_API_URL =
  "https://script.google.com/macros/s/AKfycbySl6RH5K7oTLBus2cjvBJuOv-ZTjIhX9OnIq93gifQng1IfMl7f2A3Bl-7pSx1nC1u/exec";

const TELEGRAM_WEBAPP_SCRIPT =
  "https://telegram.org/js/telegram-web-app.js";

const MAIN_APP_URL =
  "https://kaenatchi.github.io/kaenatchi-mini-app/";

const BOOKING_APP_URL =
  "https://kaenatchi.github.io/booking/";

const CMS_API_URL =
  "https://script.google.com/macros/s/AKfycbzgocb54x4FDoQl3C8-o2WnipZuQYkM1j1juV-ZZKHoieN7DbrybTj3WyXbJe5I2nMhXw/exec";

type CmsRow = Record<string, unknown>;

type MoreItem = {
  id: string;
  title: string;
  icon: IconName;
  description: string;
};

const cmsRows: {
  services: CmsRow[];
  courses: CmsRow[];
  events: CmsRow[];
  faq: CmsRow[];
  pages: CmsRow[];
  settings: CmsRow[];
} = {
  services: [],
  courses: [],
  events: [],
  faq: [],
  pages: [],
  settings: [],
};

let energyServices: Service[] = [];
let mainServices: Service[] = [];
let moreItems: MoreItem[] = [];
let publishedClasses: SearchItem[] = [];
let publishedEvents: SearchItem[] = [];
let publishedFaq: SearchItem[] = [];

function cmsText(row: CmsRow, aliases: string[]): string {
  const normalized = new Map<string, unknown>();
  Object.entries(row).forEach(([key, value]) => {
    normalized.set(
      key.trim().toLowerCase().replace(/[\s_-]+/g, ""),
      value
    );
  });

  for (const alias of aliases) {
    const value = normalized.get(
      alias.trim().toLowerCase().replace(/[\s_-]+/g, "")
    );
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }

  return "";
}

function cmsActive(row: CmsRow): boolean {
  const value = cmsText(row, ["فعال", "active", "status"]).toLowerCase();
  return !value || ["بله", "فعال", "true", "1", "yes"].includes(value);
}

function cmsSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[آأإ]/g, "ا")
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";
}

function cmsCategory(value: string, title: string): ServiceCategory {
  const text = (value + " " + title)
    .toLocaleLowerCase("fa")
    .replace(/[\u200c\u200f\u200e\s_-]+/g, "");

  if (/شمعتراپی|شمع/.test(text)) return "candle";
  if (/سایکو?تراپی|سایکوتراپی|مشاوره|گفتوگو/.test(text)) return "psychotherapy";
  return "energy";
}

function mapCmsServices(rows: CmsRow[]): Service[] {
  return rows
    .filter(cmsActive)
    .map((row, index) => {
      const title =
        cmsText(row, ["نام خدمت", "عنوان", "نام", "title"]) ||
        "خدمت";
      const categoryRaw = cmsText(row, ["دسته", "دسته‌بندی", "category"]);
      const id =
        cmsText(row, ["شناسه", "id", "slug"]) ||
        `${cmsSlug(title)}-${index + 1}`;
      const description =
        cmsText(row, [
          "توضیحات کامل",
          "توضیح کوتاه",
          "توضیحات",
          "توضیح",
          "description",
          "text",
        ]);

      return {
        id,
        title,
        category: cmsCategory(categoryRaw, title),
        price: cmsText(row, ["قیمت", "هزینه", "price"]),
        duration: cmsText(row, ["مدت", "مدت زمان", "duration"]),
        description,
      };
    });
}

function mapCmsBookableItems(
  rows: CmsRow[],
  type: "class" | "event"
): Service[] {
  return rows
    .filter(cmsActive)
    .map((row, index) => {
      const title =
        cmsText(row, [
          type === "class" ? "نام دوره" : "نام ایونت",
          "عنوان",
          "نام",
          "title",
        ]) || (type === "class" ? "کلاس" : "ایونت");
      const rawId = cmsText(row, ["شناسه", "id", "slug"]);
      const id =
        "cms-" +
        type +
        "-" +
        (rawId ? cmsSlug(rawId) : cmsSlug(title) + "-" + (index + 1));
      return {
        id,
        title,
        category: type,
        price: cmsText(row, ["قیمت", "هزینه", "price", "base price"]),
        duration: cmsText(row, ["مدت", "مدت زمان", "duration"]),
        description: cmsText(row, [
          "توضیحات کامل", "توضیحات", "توضیح کوتاه", "توضیح",
          "متن", "description", "text",
        ]),
      };
    });
}

function mapCmsSearchItems(
  rows: CmsRow[],
  type: "class" | "event" | "faq"
): SearchItem[] {
  return rows
    .filter(cmsActive)
    .map((row, index) => {
      const title =
        cmsText(row, [
          type === "class" ? "نام دوره" : type === "event" ? "نام ایونت" : "سؤال",
          "عنوان",
          "نام",
          "title",
        ]) || (type === "faq" ? "سؤال" : type === "class" ? "کلاس" : "ایونت");

      const description =
        cmsText(row, [
          type === "faq" ? "پاسخ" : "توضیحات کامل",
          "توضیحات",
          "توضیح کوتاه",
          "توضیح",
          "متن",
          "description",
          "text",
        ]);

      return {
        id:
          cmsText(row, ["شناسه", "id", "slug"]) ||
          `${type}-${cmsSlug(title)}-${index + 1}`,
        title,
        description,
        type,
        icon: type === "class" ? "class" : type === "event" ? "event" : "faq",
      };
    });
}

function cmsSetting(keys: string[]): string {
  for (const row of cmsRows.settings) {
    const key = cmsText(row, ["کلید", "key", "نام", "name"]).toLowerCase();
    if (keys.some((candidate) => key.includes(candidate.toLowerCase()))) {
      return cmsText(row, ["مقدار", "value", "متن", "text", "لینک", "url"]);
    }
  }
  return "";
}

function cmsPageText(keys: string[]): string {
  for (const row of cmsRows.pages) {
    const title = cmsText(row, ["نام صفحه", "عنوان", "نام", "title"]).toLowerCase();
    const key = cmsText(row, ["کلید", "key", "slug"]).toLowerCase();
    const haystack = title + " " + key;
    if (keys.some((candidate) => haystack.includes(candidate.toLowerCase()))) {
      return cmsText(row, ["متن", "توضیحات کامل", "توضیحات", "پاسخ", "text", "description"]);
    }
  }
  return "";
}

function rebuildCmsContent(data: Partial<typeof cmsRows>) {
  cmsRows.services = Array.isArray(data.services) ? data.services : [];
  cmsRows.courses = Array.isArray(data.courses) ? data.courses : [];
  cmsRows.events = Array.isArray(data.events) ? data.events : [];
  cmsRows.faq = Array.isArray(data.faq) ? data.faq : [];
  cmsRows.pages = Array.isArray(data.pages) ? data.pages : [];
  cmsRows.settings = Array.isArray(data.settings) ? data.settings : [];

  const allServices = mapCmsServices(cmsRows.services);
  mainServices = allServices;
  energyServices = allServices.filter((service) => service.category === "energy");

  publishedClasses = mapCmsSearchItems(cmsRows.courses, "class");
  publishedEvents = mapCmsSearchItems(cmsRows.events, "event");
  publishedFaq = mapCmsSearchItems(cmsRows.faq, "faq");

  moreItems = [
    {
      id: "faq",
      title: cmsPageText(["سوالات", "faq"]) || "سوالات متداول",
      icon: "faq",
      description: "پاسخ به سوالات رایج",
    },
    {
      id: "hours",
      title: cmsPageText(["ساعات", "hours"]) || "ساعات کاری",
      icon: "clock",
      description: "زمان پاسخ‌گویی کائنات‌چی",
    },
    {
      id: "contact",
      title: cmsPageText(["ارتباط", "contact"]) || "ارتباط با ما",
      icon: "contact",
      description: "راه‌های ارتباطی کائنات‌چی",
    },
  ];
}

async function loadCmsData(): Promise<boolean> {
  try {
    const response = await fetch(
      `${CMS_API_URL}?action=getMiniAppData&_=${Date.now()}`,
      { method: "GET", cache: "no-store" }
    );

    if (!response.ok) return false;

    const data = (await response.json()) as Partial<typeof cmsRows> & {
      success?: boolean;
    };

    if (data.success === false) return false;

    rebuildCmsContent(data);
    return true;
  } catch {
    return false;
  }
}

function getCmsFaqRows() {
  return cmsRows.faq.filter(cmsActive).map((row) => ({
    question:
      cmsText(row, ["سؤال", "سوال", "question", "title"]) || "سؤال",
    answer:
      cmsText(row, ["پاسخ", "answer", "text", "توضیحات"]) || "",
  }));
}


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
          <path d="m19 4 .5 2 1.7.8-1.7.8-.5-2-1.7-.8 1.7-.8Z" />
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

    case "dots":
      return (
        <svg {...common}>
          <circle cx="6" cy="12" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="18" cy="12" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      );

    case "search":
      return (
        <svg {...common}>
          <circle cx="10.8" cy="10.8" r="6.2" />
          <path d="m15.5 15.5 4.2 4.2" />
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

function getCurrentJalaliYear() {
  try {
    const parts = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      year: "numeric",
    }).formatToParts(new Date());

    return parts.find((part) => part.type === "year")?.value ?? "۱۴۰۵";
  } catch {
    return "۱۴۰۵";
  }
}

function getTodayJalali() {
  try {
    const parts = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).formatToParts(new Date());

    const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";
    const day = parts.find((part) => part.type === "day")?.value ?? "";
    const month = parts.find((part) => part.type === "month")?.value ?? "";
    const year = parts.find((part) => part.type === "year")?.value ?? "";

    return `امروز ${weekday} ${day} ${month} ${year}`.replace(/\s+/g, " ").trim();
  } catch {
    return "امروز";
  }
}


function getTodayJalaliKey() {
  try {
    const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());

    const year = parts.find((part) => part.type === "year")?.value ?? "";
    const month = parts.find((part) => part.type === "month")?.value ?? "";
    const day = parts.find((part) => part.type === "day")?.value ?? "";

    return year && month && day
      ? year + "/" + month.padStart(2, "0") + "/" + day.padStart(2, "0")
      : "";
  } catch {
    return "";
  }
}

function normalizeJalaliKey(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/-/g, "/")
    .split("/")
    .map((part) => part.padStart(2, "0"))
    .join("/");
}

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
              boxShadow:
                "0 0 0 4px rgba(216,197,155,0.08)",
            }}
          />
          {status}
        </div>
      )}
    </div>
  );
}

function AppFooter() {
  const year = getCurrentJalaliYear();

  return (
    <footer className="app-footer" aria-label="پاورقی کائنات‌چی">
      <span>کائنات‌چی · © {year}</span>
      <span>تمامی حقوق محفوظ است.</span>
    </footer>
  );
}

function HomePage({
  onSearch,
  onOpenVip,
}: {
  onSearch: () => void;
  onOpenVip: () => void;
}) {
  const today = getTodayJalali();

  return (
    <>
      <header className="topbar home-topbar">
        <div className="home-top-actions">
          <button
            type="button"
            className="home-search-button"
            onClick={onSearch}
            aria-label="جست‌وجو"
          >
            <Icon name="search" />
          </button>

          <button
            type="button"
            className="vip-top-button"
            onClick={onOpenVip}
            aria-label="ورود به VIP"
          >
            <span className="vip-top-symbol">✦</span>
            <span>VIP</span>
          </button>
        </div>

        <div className="home-brand-inline" aria-label="کائنات‌چی">
          کائنات‌چی
        </div>

        <div className="home-date-wrap">
          <div className="date-pill">
            <span className="date-dot" />
            {today}
          </div>
        </div>
      </header>

      <main className="main-content home-page">
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
              <div className="section-kicker">
                TODAY
              </div>

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
              <div className="section-kicker">
                FEATURED
              </div>

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
              <div className="featured-label">
                KAENATCHI MOMENT
              </div>

              <h3>برای خودت یک مکث بساز.</h3>

              <p>
                فضای کائنات‌چی برای تجربه‌ای آرام، شخصی و متفاوت
                طراحی شده است.
              </p>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}

function ServiceTabs({
  active,
  onChange,
}: {
  active: "all" | ServiceCategory;
  onChange: (
    value: "all" | ServiceCategory
  ) => void;
}) {
  const tabs: {
    id: "all" | ServiceCategory;
    title: string;
  }[] = [
    {
      id: "all",
      title: "همه",
    },
    {
      id: "energy",
      title: "انرژی‌خوانی",
    },
    {
      id: "candle",
      title: "شمع‌تراپی",
    },
    {
      id: "psychotherapy",
      title: "سایکوتراپی",
    },
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
        const selected =
          active === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() =>
              onChange(tab.id)
            }
            style={{
              flex: "0 0 auto",
              border: selected
                ? "1px solid rgba(36, 99, 71, 0.35)"
                : "1px solid rgba(53, 59, 50, 0.1)",
              background: selected
                ? "rgba(36, 99, 71, 0.1)"
                : "rgba(255,255,255,0.55)",
              color: selected
                ? "#246347"
                : "#353B32",
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
        : service.category === "psychotherapy"
          ? "conversation"
          : service.category === "class"
            ? "class"
            : "event";

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

        {(service.price ||
          service.duration) && (
          <small
            style={{
              display: "block",
              marginTop: "7px",
              color: "#246347",
              fontSize: "12px",
            }}
          >
            {service.duration}

            {service.duration &&
              service.price
              ? "  •  "
              : ""}

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
  onOpenBooking,
}: {
  service: Service;
  onBack: () => void;
  onOpenBooking: (service?: Service) => void;
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
            <div
              style={{
                marginBottom: "10px",
              }}
            >
              <strong>مدت زمان</strong>

              <span>
                {service.duration}
              </span>
            </div>
          )}

          {service.price && (
            <div>
              <strong>هزینه</strong>

              <span>
                {service.price}
              </span>
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
          background:
            "linear-gradient(135deg, #174b38, #2c7658)",
          color: "#fff",
          fontFamily: "inherit",
          fontSize: "15px",
          cursor: "pointer",
          boxShadow:
            "0 10px 24px rgba(23, 75, 56, 0.2)",
        }}
        onClick={() => onOpenBooking(service)}
      >
        📅 دریافت نوبت
      </button>
    </div>
  );
}

function ServicesPage({
  focus,
  onOpenBooking,
}: {
  focus?: "all" | "classes" | "events";
  onOpenBooking: (service?: Service) => void;
}) {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | null>(null);
  const [energyFilter, setEnergyFilter] = useState<"all" | "emotional" | "career" | "general">("all");

  useEffect(() => {
    if (!focus || focus === "all") return;

    const targetId = focus === "classes" ? "services-classes" : "services-events";
    const timer = window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [focus]);

  if (selectedService) {
    return (
      <ServiceDetail
        service={selectedService}
        onBack={() => setSelectedService(null)}
        onOpenBooking={onOpenBooking}
      />
    );
  }

  const categoryCards: Array<{
    id: ServiceCategory;
    title: string;
    description: string;
    icon: IconName;
  }> = [
    {
      id: "energy",
      title: "انرژی‌خوانی",
      description: "خوانش‌های مختلف برای احساسات، مسیر و موضوع مورد نظر تو.",
      icon: "energy",
    },
    {
      id: "candle",
      title: "شمع‌تراپی",
      description: "جلسه‌ای غیرحضوری با تمرکز بر نیت و موضوع انتخابی تو.",
      icon: "candle",
    },
    {
      id: "psychotherapy",
      title: "گفت‌وگو",
      description: "جلسه‌ای گفت‌وگومحور برای صحبت درباره موضوع مورد نظر تو.",
      icon: "conversation",
    },
  ];

  const categoryServices =
    activeCategory === "energy"
      ? energyServices
      : activeCategory
        ? mainServices.filter((service) => service.category === activeCategory)
        : [];

  const filteredEnergyServices =
    energyFilter === "all"
      ? categoryServices
      : categoryServices.filter((service) => {
          if (energyFilter === "emotional") {
            return /احساس|عاطف/i.test(service.title);
          }
          if (energyFilter === "career") {
            return /شغلی|مالی/i.test(service.title);
          }
          return !/احساس|عاطف|شغلی|مالی/i.test(service.title);
        });

  const visibleServices =
    activeCategory === "energy"
      ? filteredEnergyServices
      : categoryServices;

  const openCategory = (category: ServiceCategory) => {
    setEnergyFilter("all");
    setActiveCategory(category);
    window.setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
  };

  return (
    <div className="inner-page services-page">
      <SectionHeaderCard
        kicker="SERVICES"
        title="خدمات کائنات‌چی"
        description={
          activeCategory
            ? "خدمت مورد نظرت را انتخاب کن تا جزئیات و مسیر دریافت نوبت را ببینی."
            : "از میان خدمات کائنات‌چی، مسیر مناسب خودت را انتخاب کن."
        }
        icon="spark"
      />

      {!activeCategory ? (
        <>
          <div className="services-section-intro">
            <span>دنیای خدمات</span>
            <strong>هر چیزی که اینجا می‌بینی، یک مسیر مشخص دارد.</strong>
          </div>

          <div className="services-category-grid" aria-label="دسته‌بندی خدمات">
            {categoryCards.map((category) => (
              <button
                key={category.id}
                type="button"
                className="services-category-card"
                onClick={() => openCategory(category.id)}
              >
                <span className="services-category-icon">
                  <Icon name={category.icon} />
                </span>
                <span className="services-category-copy">
                  <strong>{category.title}</strong>
                  <span>{category.description}</span>
                </span>
                <span className="services-category-arrow">
                  <Icon name="arrow" />
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <button
            type="button"
            className="services-back-button"
            onClick={() => {
              setActiveCategory(null);
              setEnergyFilter("all");
            }}
          >
            <span>→</span>
            <span>همه خدمات</span>
          </button>

          <div className="services-category-title">
            <div className="services-category-title-icon">
              <Icon
                name={
                  activeCategory === "energy"
                    ? "energy"
                    : activeCategory === "candle"
                      ? "candle"
                      : "conversation"
                }
              />
            </div>
            <div>
              <span>
                {activeCategory === "energy"
                  ? "ENERGY READING"
                  : activeCategory === "candle"
                    ? "CANDLE"
                    : "CONVERSATION"}
              </span>
              <strong>
                {activeCategory === "energy"
                  ? "انرژی‌خوانی"
                  : activeCategory === "candle"
                    ? "شمع‌تراپی"
                    : "گفت‌وگو"}
              </strong>
            </div>
          </div>

          {activeCategory === "energy" && (
            <div className="services-filter-row" aria-label="فیلتر انرژی‌خوانی">
              {[
                ["all", "همه"],
                ["emotional", "احساسی"],
                ["career", "شغلی و مالی"],
                ["general", "عمومی"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={"services-filter-chip " + (energyFilter === id ? "active" : "")}
                  onClick={() =>
                    setEnergyFilter(id as "all" | "emotional" | "career" | "general")
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className="service-list services-detail-list">
            {visibleServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onClick={() => setSelectedService(service)}
              />
            ))}
          </div>
        </>
      )}

      {!activeCategory && (
        <>
          <div className="services-world-heading">
            <span>دنیای کائنات‌چی</span>
            <strong>آموزش و رویداد</strong>
          </div>

          <div className="services-content-lobby">
            <button
              id="services-classes"
              type="button"
              className={"services-content-card services-content-button " + (focus === "classes" ? "is-focused" : "")}
              onClick={() => {
                document.getElementById("services-classes")?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }}
            >
              <div className="services-content-icon"><Icon name="class" /></div>
              <div className="list-copy">
                <strong>کلاس‌ها</strong>
                {publishedClasses.length > 0
                  ? publishedClasses.map((item) => (
                      <span key={item.id}>{item.title} — {item.description}</span>
                    ))
                  : <span>آموزش‌ها و دوره‌های کائنات‌چی به‌صورت خودکار اینجا نمایش داده می‌شوند.</span>}
              </div>
              <div className="list-arrow"><Icon name="arrow" /></div>
            </button>

            <button
              id="services-events"
              type="button"
              className={"services-content-card services-content-button " + (focus === "events" ? "is-focused" : "")}
              onClick={() => {
                document.getElementById("services-events")?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }}
            >
              <div className="services-content-icon"><Icon name="event" /></div>
              <div className="list-copy">
                <strong>ایونت‌ها</strong>
                {publishedEvents.length > 0
                  ? publishedEvents.map((item) => (
                      <span key={item.id}>{item.title} — {item.description}</span>
                    ))
                  : <span>رویدادها و برنامه‌های پیش روی کائنات‌چی اینجا قرار می‌گیرند.</span>}
              </div>
              <div className="list-arrow"><Icon name="arrow" /></div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}


function SelectedPage({
  onNavigate,
  onOpenService,
}: {
  onNavigate: (section: Section) => void;
  onOpenService: (service: Service) => void;
}) {
  const [revealOpen, setRevealOpen] = useState(false);
  const [path, setPath] = useState<"all" | "calm" | "clarity" | "learning">("all");

  const allSelected: Array<SearchItem & { badge: string }> = [
    ...mainServices.map((service) => ({
      id: service.id,
      title: service.title,
      description: service.description,
      type: "service" as const,
      icon: (service.category === "energy"
        ? "energy"
        : service.category === "candle"
          ? "candle"
          : "conversation") as IconName,
      service,
      badge: "خدمت",
    })),
    ...energyServices.map((service) => ({
      id: service.id,
      title: service.title,
      description: service.description,
      type: "service" as const,
      icon: "energy" as IconName,
      service,
      badge: "انرژی‌خوانی",
    })),
    ...publishedClasses.map((item) => ({ ...item, badge: "کلاس" })),
    ...publishedEvents.map((item) => ({ ...item, badge: "ایونت" })),
  ];

  const daySeed = new Date().getDate() + new Date().getMonth() * 31;
  const offset = allSelected.length ? daySeed % allSelected.length : 0;
  const rotated = allSelected.length
    ? [...allSelected.slice(offset), ...allSelected.slice(0, offset)]
    : [];

  const pathItems = rotated.filter((item) => {
    if (path === "all") return true;
    const text = (item.title + " " + item.description).toLocaleLowerCase("fa");
    if (path === "calm") return /آرام|شمع|گفت.?وگو|احساس|عاطف/.test(text);
    if (path === "clarity") return /مسیر|عمومی|انرژی|قهوه|پاسور|اوراکل|خوانش/.test(text);
    return item.type === "class" || item.type === "event" || /آموزش|کلاس|دوره/.test(text);
  });

  const featured = pathItems[0] ?? rotated[0];
  const secondary = pathItems.slice(1, 4);
  const revealItem = rotated.length
    ? rotated[(daySeed * 7 + 3) % rotated.length]
    : null;

  const openItem = (item: (SearchItem & { badge: string }) | undefined) => {
    if (!item) return;
    if (item.service) {
      onOpenService(item.service);
      return;
    }
    if (item.type === "class") {
      onNavigate("services");
      window.setTimeout(() => {
        document.getElementById("services-classes")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 120);
      return;
    }
    if (item.type === "event") {
      onNavigate("services");
      window.setTimeout(() => {
        document.getElementById("services-events")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 120);
    }
  };

  return (
    <div className="inner-page selected-page">
      <section className="selected-intro">
        <div className="selected-intro-mark">
          <Icon name="spark" />
        </div>
        <div className="selected-intro-copy">
          <span>KAENATCHI CURATED</span>
          <h1>منتخب کائنات‌چی</h1>
          <p>چیزهایی که این روزها ارزش دیدن دارند.</p>
        </div>
        <div className="selected-intro-line" />
      </section>

      {featured ? (
        <button
          type="button"
          className="selected-feature"
          onClick={() => openItem(featured)}
          aria-label={`مشاهده ${featured.title}`}
        >
          <div className="selected-feature-orbit orbit-a" />
          <div className="selected-feature-orbit orbit-b" />
          <div className="selected-feature-copy">
            <span className="selected-eyebrow">انتخاب امروز</span>
            <strong>{featured.title}</strong>
            <p>{featured.description}</p>
            <span className="selected-feature-link">مشاهده <span>←</span></span>
          </div>
          <div className="selected-feature-badge">
            <Icon name={featured.icon} />
            <small>{featured.badge}</small>
          </div>
        </button>
      ) : (
        <div className="selected-feature selected-empty-feature">
          <span className="selected-eyebrow">منتخب کائنات‌چی</span>
          <strong>هنوز چیزی برای انتخاب نداریم</strong>
          <p>با فعال شدن محتوا در خدمات، کلاس‌ها یا ایونت‌ها، این فضا خودکار پر می‌شود.</p>
        </div>
      )}

      <section className="selected-paths">
        <div className="selected-section-heading">
          <span>یک حال‌وهوا انتخاب کن</span>
          <strong>برای تو</strong>
        </div>

        <div className="selected-path-grid">
          {[
            { id: "calm" as const, title: "آرامش", icon: "candle" as IconName, copy: "چیزهای نرم‌تر و آرام‌تر" },
            { id: "clarity" as const, title: "وضوح", icon: "spark" as IconName, copy: "برای وقتی که دنبال جهت هستی" },
            { id: "learning" as const, title: "یادگیری", icon: "class" as IconName, copy: "چیزهایی برای یاد گرفتن" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              className={`selected-path-card ${path === item.id ? "active" : ""}`}
              onClick={() => setPath(path === item.id ? "all" : item.id)}
            >
              <span className="selected-path-icon"><Icon name={item.icon} /></span>
              <strong>{item.title}</strong>
              <span>{item.copy}</span>
            </button>
          ))}
        </div>
      </section>

      {secondary.length > 0 && (
        <section className="selected-now">
          <div className="selected-section-heading">
            <span>چند انتخاب کوتاه</span>
            <strong>این روزها در کائنات‌چی</strong>
          </div>

          <div className="selected-mini-grid">
            {secondary.map((item) => (
              <button
                type="button"
                className="selected-mini-card"
                key={item.id}
                onClick={() => openItem(item)}
              >
                <span className="selected-mini-top">
                  <small>{item.badge}</small>
                  <span><Icon name="arrow" /></span>
                </span>
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className={`selected-reveal ${revealOpen ? "is-open" : ""}`}>
        <div className="selected-reveal-stars">✦ &nbsp; ✦ &nbsp; ✦</div>
        <span className="selected-eyebrow">یک انتخاب برای امروز</span>
        <h2>{revealOpen && revealItem ? revealItem.title : "امروز چی ببینم؟"}</h2>
        <p>
          {revealOpen && revealItem
            ? revealItem.description
            : "یک انتخاب از چیزهایی که همین حالا در کائنات‌چی وجود دارند؛ نه فال، فقط یک پیشنهاد خوب."}
        </p>
        <button
          type="button"
          className="selected-reveal-button"
          onClick={() => {
            setRevealOpen(true);
            if (revealItem) {
              window.setTimeout(() => openItem(revealItem), 620);
            }
          }}
        >
          {revealOpen ? "مشاهده انتخاب ←" : "✦ امروز چی ببینم؟"}
        </button>
      </section>

      <section className="selected-discover">
        <div>
          <span>اگر می‌خواهی بیشتر ببینی</span>
          <strong>کائنات‌چی را کشف کن</strong>
        </div>
        <div className="selected-discover-links">
          <button type="button" onClick={() => onNavigate("services")}>خدمات <span>←</span></button>
          <button type="button" onClick={() => {
            onNavigate("services");
            window.setTimeout(() => document.getElementById("services-classes")?.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
          }}>کلاس‌ها <span>←</span></button>
          <button type="button" onClick={() => {
            onNavigate("services");
            window.setTimeout(() => document.getElementById("services-events")?.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
          }}>ایونت‌ها <span>←</span></button>
        </div>
      </section>
    </div>
  );
}

function SearchPage({
  onBack,
  onOpenService,
}: {
  onBack: () => void;
  onOpenService: (
    service: Service
  ) => void;
}) {
  const [query, setQuery] =
    useState("");

  const serviceItems: SearchItem[] = [
    ...mainServices.map(
      (service) => ({
        id: service.id,
        title: service.title,
        description:
          service.description,
        type: "service" as const,
        icon:
          service.category ===
          "energy"
            ? ("energy" as IconName)
            : service.category ===
                "candle"
              ? ("candle" as IconName)
              : ("conversation" as IconName),
        service,
      })
    ),

    ...energyServices.map(
      (service) => ({
        id: service.id,
        title: service.title,
        description:
          service.description,
        type: "service" as const,
        icon: "energy" as IconName,
        service,
      })
    ),
  ];

  const allItems: SearchItem[] = [
    ...serviceItems,
    ...publishedClasses,
    ...publishedEvents,
    ...publishedFaq,
  ];

  const normalizedQuery =
    query
      .trim()
      .toLocaleLowerCase("fa");

  const results =
    normalizedQuery.length === 0
      ? []
      : allItems.filter((item) => {
          const searchableText =
            `${item.title} ${item.description}`.toLocaleLowerCase(
              "fa"
            );

          return searchableText.includes(
            normalizedQuery
          );
        });

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
        kicker="SEARCH"
        title="جست‌وجو"
        description="خدمات، کلاس‌ها، ایونت‌ها و سوالات متداول را پیدا کن."
        icon="search"
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "13px 15px",
          borderRadius: "18px",
          background:
            "rgba(255,255,255,0.72)",
          border:
            "1px solid rgba(53,59,50,0.12)",
          boxShadow:
            "0 8px 22px rgba(53,59,50,0.07)",
          marginBottom: "16px",
        }}
      >
        <Icon name="search" />

        <input
          value={query}
          onChange={(event) =>
            setQuery(
              event.target.value
            )
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.blur();
              window.requestAnimationFrame(() => {
                const activeElement = document.activeElement;
                if (
                  activeElement instanceof HTMLInputElement ||
                  activeElement instanceof HTMLTextAreaElement ||
                  activeElement instanceof HTMLSelectElement
                ) {
                  activeElement.blur();
                }
              });
            }
          }}
          autoFocus
          type="search"
          placeholder="چی می‌خوای پیدا کنی؟"
          aria-label="جست‌وجو"
          style={{
            flex: 1,
            minWidth: 0,
            border: "none",
            outline: "none",
            background:
              "transparent",
            fontFamily: "inherit",
            fontSize: "16px",
            color: "#353B32",
            direction: "rtl",
          }}
        />

        {query && (
          <button
            type="button"
            onClick={() =>
              setQuery("")
            }
            aria-label="پاک کردن جست‌وجو"
            style={{
              border: "none",
              background:
                "transparent",
              color: "#7b8178",
              fontFamily:
                "inherit",
              fontSize: "18px",
              cursor: "pointer",
              padding: "3px 5px",
            }}
          >
            ×
          </button>
        )}
      </div>

      {query.trim().length === 0 ? (
        <div
          className="glass-list-card"
          style={{
            textAlign: "center",
            display: "block",
          }}
        >
          <div
            style={{
              width: "58px",
              height: "58px",
              margin:
                "0 auto 13px",
              borderRadius: "20px",
              display: "grid",
              placeItems:
                "center",
              background:
                "rgba(36,99,71,0.08)",
              color: "#246347",
            }}
          >
            <Icon name="search" />
          </div>

          <div className="list-copy">
            <strong>
              دنبال چه چیزی می‌گردی؟
            </strong>

            <span>
              نام خدمت، انرژی‌خوانی، کلاس، ایونت یا سوال مورد
              نظرت را جست‌وجو کن.
            </span>
          </div>
        </div>
      ) : results.length > 0 ? (
        <div className="service-list">
          {results.map((item) => (
            <button
              key={`${item.type}-${item.id}`}
              type="button"
              className="glass-list-card"
              onClick={() => {
                if (
                  item.type ===
                    "service" &&
                  item.service
                ) {
                  onOpenService(
                    item.service
                  );
                }
              }}
              style={{
                width: "100%",
                border: "none",
                textAlign:
                  "right",
                cursor:
                  item.type ===
                  "service"
                    ? "pointer"
                    : "default",
                fontFamily:
                  "inherit",
              }}
            >
              <div className="list-icon">
                <Icon
                  name={item.icon}
                />
              </div>

              <div className="list-copy">
                <small
                  style={{
                    display:
                      "block",
                    color:
                      "#8a7348",
                    fontSize:
                      "10px",
                    marginBottom:
                      "4px",
                  }}
                >
                  {item.type ===
                  "service"
                    ? "خدمت"
                    : item.type ===
                        "class"
                      ? "کلاس"
                      : item.type ===
                          "event"
                        ? "ایونت"
                        : "سوال متداول"}
                </small>

                <strong>
                  {item.title}
                </strong>

                <span>
                  {item.description}
                </span>
              </div>

              {item.type ===
                "service" && (
                <div className="list-arrow">
                  <Icon name="arrow" />
                </div>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div
          className="glass-list-card"
          style={{
            display: "block",
            textAlign:
              "center",
          }}
        >
          <div
            style={{              width: "58px",
              height: "58px",
              margin:
                "0 auto 13px",
              borderRadius:
                "20px",
              display: "grid",
              placeItems:
                "center",
              background:
                "rgba(53,59,50,0.07)",
              color:
                "#353B32",
            }}
          >
            <Icon name="search" />
          </div>

          <div className="list-copy">
            <strong>
              چیزی پیدا نشد
            </strong>

            <span>
              عبارت دیگری را امتحان کن یا نام بخش مورد نظرت را
              کوتاه‌تر بنویس.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   TELEGRAM VIP
   ========================================================= */

type TelegramWebApp = {
  initData: string;
  ready?: () => void;
  expand?: () => void;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}


/* =========================================================
   TELEGRAM SDK
========================================================= */

function loadTelegramWebAppScript(): Promise<void> {
  if (
    window.Telegram?.WebApp
  ) {
    return Promise.resolve();
  }

  const existingScript =
    document.querySelector(
      `script[src="${TELEGRAM_WEBAPP_SCRIPT}"]`
    ) as HTMLScriptElement | null;

  if (existingScript) {
    return new Promise(
      (resolve, reject) => {

        if (
          window.Telegram?.WebApp
        ) {
          resolve();
          return;
        }

        const timeout =
          window.setTimeout(() => {
            reject(
              new Error(
                "Telegram WebApp SDK timeout"
              )
            );
          }, 8000);

        existingScript.addEventListener(
          "load",
          () => {

            window.clearTimeout(
              timeout
            );

            if (
              window.Telegram?.WebApp
            ) {
              resolve();
            } else {
              reject(
                new Error(
                  "Telegram WebApp API unavailable"
                )
              );
            }
          },
          { once: true }
        );

        existingScript.addEventListener(
          "error",
          () => {

            window.clearTimeout(
              timeout
            );

            reject(
              new Error(
                "Telegram WebApp SDK load error"
              )
            );
          },
          { once: true }
        );
      }
    );
  }

  return new Promise(
    (resolve, reject) => {

      const script =
        document.createElement(
          "script"
        );

      script.src =
        TELEGRAM_WEBAPP_SCRIPT;

      script.async = true;

      script.onload = () => {

        if (
          window.Telegram?.WebApp
        ) {
          resolve();
        } else {
          reject(
            new Error(
              "Telegram WebApp API unavailable"
            )
          );
        }
      };

      script.onerror = () => {

        reject(
          new Error(
            "Telegram WebApp SDK load error"
          )
        );
      };

      document.head.appendChild(
        script
      );
    }
  );
}



type VipRecord = {
  id: string;
  service: string;
  date: string;
  time: string;
  status: string;
  amount: string;
  tracking: string;
  raw: unknown;
};

type VipPayment = VipRecord;

type VipClassEvent = {
  id: string;
  title: string;
  status: string;
  start: string;
  end: string;
  progress: string;
  details: string;
  raw: unknown;
};

function vipText(value: unknown): string {
  return value == null ? "" : String(value).trim();
}

function normalizeVipKey(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function unwrapVipRows(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  const obj = value as Record<string, unknown>;
  for (const key of ["data", "items", "rows", "history", "payments", "classes", "events", "result"]) {
    if (Array.isArray(obj[key])) return obj[key] as unknown[];
  }
  return [];
}

function readVipField(obj: Record<string, unknown>, aliases: string[]): string {
  const map = new Map<string, unknown>();
  Object.entries(obj).forEach(([key, value]) => map.set(normalizeVipKey(key), value));
  for (const alias of aliases) {
    const value = map.get(normalizeVipKey(alias));
    if (value != null && String(value).trim() !== "") return String(value).trim();
  }
  return "";
}

function looksLikeVipHeader(row: unknown[]): boolean {
  const text = row.map(v => vipText(v)).join(" ").toLocaleLowerCase("fa");
  return /خدمت|تاریخ|ساعت|وضعیت|مبلغ|service|date|status|amount|payment|پرداخت/.test(text) &&
    !/\d{3,4}[\/-]\d{1,2}[\/-]\d{1,2}/.test(text);
}

function normalizeVipRecordRows(value: unknown, prefix: string): VipRecord[] {
  return unwrapVipRows(value).map((raw, index): VipRecord | null => {
    if (Array.isArray(raw)) {
      if (looksLikeVipHeader(raw)) return null;
      const cells = raw.map(vipText);
      const dateIndex = cells.findIndex(v => /^(?:1[34]\d{2}|\d{3})[\/-]\d{1,2}[\/-]\d{1,2}/.test(v));
      const service = cells[0] || cells[1] || "خدمت کائنات‌چی";
      const date = dateIndex >= 0 ? cells[dateIndex] : cells[1] || "";
      const time = cells.find(v => /^\d{1,2}:\d{2}/.test(v)) || "";
      const status = cells.find(v => /تایید|تکمیل|انجام|رزرو|لغو|در انتظار|موفق|پرداخت|فعال|confirmed|completed|pending|cancel/i.test(v)) || "";
      const amount = cells.find(v => /(?:تومان|ریال|\d{3}[,،]\d{3})/.test(v) && v !== date) || "";
      const tracking = cells.find(v => /پیگیری|tracking|receipt/i.test(v)) || "";
      return { id: prefix + "-" + index, service, date, time, status, amount, tracking, raw };
    }
    if (!raw || typeof raw !== "object") return null;
    const obj = raw as Record<string, unknown>;
    const service = readVipField(obj, ["service","serviceName","title","name","نام خدمت","خدمت","نوع خدمت"]);
    const date = readVipField(obj, ["date","bookingDate","appointmentDate","jalaliDate","تاریخ","تاریخ نوبت"]);
    const time = readVipField(obj, ["time","bookingTime","appointmentTime","ساعت"]);
    const status = readVipField(obj, ["status","bookingStatus","paymentStatus","وضعیت","وضعیت نوبت"]);
    const amount = readVipField(obj, ["amount","price","total","paymentAmount","مبلغ","هزینه"]);
    const tracking = readVipField(obj, ["tracking","trackingCode","receipt","receiptCode","کد پیگیری"]);
    if (!service && !date && !status) return null;
    return { id: prefix + "-" + index, service: service || "خدمت کائنات‌چی", date, time, status, amount, tracking, raw };
  }).filter((row): row is VipRecord => row !== null);
}

function normalizeVipRowsForClassEvent(value: unknown, prefix: "class" | "event"): VipClassEvent[] {
  return unwrapVipRows(value).map((raw, index): VipClassEvent | null => {
    if (Array.isArray(raw)) {
      const cells = raw.map(vipText);
      if (looksLikeVipHeader(raw)) return null;
      return {
        id: prefix + "-" + index,
        title: cells[0] || cells[1] || (prefix === "class" ? "کلاس کائنات‌چی" : "ایونت کائنات‌چی"),
        status: cells.find(v => /درحالبرگزاری|گذرانده|شرکتکرد|ثبت|پیشرو|تکمیل|active|completed|attended|upcoming|current/i.test(v)) || "ثبت‌شده",
        start: cells.find(v => /^(?:1[34]\d{2}|\d{3})[\/-]\d{1,2}[\/-]\d{1,2}/.test(v)) || "",
        end: "",
        progress: cells.find(v => /جلسه|درصد|پیشرفت|session|progress/i.test(v)) || "",
        details: cells.slice(2).filter(Boolean).join(" • "),
        raw,
      };
    }
    if (!raw || typeof raw !== "object") return null;
    const obj = raw as Record<string, unknown>;
    const title = readVipField(obj, ["title","name","className","eventName","نام کلاس","نام ایونت","عنوان"]);
    if (!title) return null;
    return {
      id: prefix + "-" + index,
      title,
      status: readVipField(obj, ["status","state","وضعیت"]) || "ثبت‌شده",
      start: readVipField(obj, ["start","startDate","date","jalaliDate","تاریخ شروع","تاریخ"]),
      end: readVipField(obj, ["end","endDate","تاریخ پایان"]),
      progress: readVipField(obj, ["progress","session","sessions","پیشرفت","جلسه"]),
      details: readVipField(obj, ["details","description","توضیحات"]),
      raw,
    };
  }).filter((item): item is VipClassEvent => item !== null);
}

function normalizeVipStatus(value: string): "completed" | "upcoming" | "pending" | "successful" | "returned" | "other" {
  const s = value.replace(/\s+/g, "").toLocaleLowerCase("fa");
  if (/لغو|برگشت|ناموفق|cancel|refund|failed|returned/.test(s)) return "returned";
  if (/درانتظار|انتظار|pending/.test(s)) return "pending";
  if (/موفق|پرداختشد|success|paid/.test(s)) return "successful";
  if (/انجامشد|تکمیل|completed|done|گذرانده|شرکتکرد|attended/.test(s)) return "completed";
  return /تایید|رزرو|فعال|confirmed|booked|upcoming/.test(s) ? "upcoming" : "other";
}

function formatVipAmount(value: string): string {
  const text = value.trim();
  if (!text) return "";
  if (/تومان|ریال/.test(text)) return text;
  const digits = text.replace(/[^\d]/g, "");
  if (!digits) return text;
  return Number(digits).toLocaleString("fa-IR") + " تومان";
}

function vipExperienceCategory(service: string): string {
  const s = service
    .trim()
    .toLocaleLowerCase("fa")
    .replace(/[\u200c\s]+/g, " ");

  if (s.includes("قهوه")) return "قهوه";
  if (s.includes("پاسور")) return "پاسور";
  if (s.includes("رایدر وایت") || s.includes("رایدر-وایت")) return "تاروت رایدر وایت";
  if (s.includes("رایدر احساسی")) return "تاروت رایدر احساسی";
  if (s.includes("رایدر شغلی") || s.includes("رایدر مالی")) return "تاروت رایدر شغلی - مالی";
  if (s.includes("لنورماند فرانسوی")) return "لنورماند فرانسوی";
  if (s.includes("لنورماند احساسی")) return "لنورماند احساسی";
  if (s.includes("تاروت یونانی") && s.includes("احساس")) return "تاروت یونانی احساسی";
  if (s.includes("تاروت مارسی") && s.includes("احساس")) return "تاروت مارسی احساسی";
  if (s.includes("جم") || s.includes("اوراکل")) return "جم اوراکل";
  if (s.includes("شمع")) return "شمع‌تراپی";
  if (s.includes("سایکو")) return "سایکوتراپی";

  // New services are kept as their own category instead of being
  // collapsed into «سایر», so a newly added service can appear
  // automatically as soon as it exists in the VIP history/API.
  return service.trim() || "سایر";
}

function VipFilterTabs({ options, value, onChange }: {
  options: Array<{ id: string; title: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: "8px", overflowX: "auto", padding: "2px 1px 13px", scrollbarWidth: "none" }}>
      {options.map(option => {
        const active = option.id === value;
        return (
          <button key={option.id} type="button" onClick={() => onChange(option.id)} style={{
            flex: "0 0 auto", minHeight: "40px", borderRadius: "999px",
            border: active ? "1px solid rgba(36,99,71,0.28)" : "1px solid rgba(53,59,50,0.1)",
            background: active ? "rgba(36,99,71,0.1)" : "rgba(255,255,255,0.58)",
            color: active ? "#246347" : "#555b53", padding: "9px 14px",
            fontFamily: "inherit", fontSize: "12px", fontWeight: active ? 700 : 500,
            cursor: "pointer", boxShadow: active ? "0 6px 15px rgba(36,99,71,0.09)" : "0 3px 10px rgba(53,59,50,0.05)",
          }}>{option.title}</button>
        );
      })}
    </div>
  );
}

function VipRecordCard({ record, kind = "booking" }: { record: VipRecord; kind?: "booking" | "payment" }) {
  const status = normalizeVipStatus(record.status);
  const statusLabel = status === "completed" ? "انجام‌شده" : status === "pending" ? "در انتظار" : status === "successful" ? "موفق" : status === "returned" ? "برگشت‌خورده" : status === "upcoming" ? "پیش‌رو" : (record.status || "ثبت‌شده");
  const statusColor = status === "returned" ? "#9a5c52" : status === "pending" ? "#8a7146" : status === "completed" || status === "successful" ? "#246347" : "#5e665e";
  return (
    <div className="glass-list-card" style={{ display: "block", border: "1px solid " + statusColor + "22" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <strong style={{ display: "block", color: "#353B32", fontSize: "15px", marginBottom: "6px" }}>{record.service}</strong>
          {(record.date || record.time) && <span style={{ display: "block", color: "#73786f", fontSize: "12px", lineHeight: 1.8 }}>{record.date ? formatVipJalaliDate(record.date) : ""}{record.date && record.time ? "  •  " : ""}{record.time}</span>}
        </div>
        <span style={{ flex: "0 0 auto", padding: "6px 9px", borderRadius: "10px", background: statusColor + "12", border: "1px solid " + statusColor + "28", color: statusColor, fontSize: "10px", fontWeight: 700 }}>{statusLabel}</span>
      </div>
      {kind === "payment" && record.amount && <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid rgba(53,59,50,0.08)", display: "flex", justifyContent: "space-between", gap: "10px", fontSize: "12px" }}><span style={{ color: "#73786f" }}>مبلغ</span><strong style={{ color: "#353B32" }}>{formatVipAmount(record.amount)}</strong></div>}
      {kind === "payment" && record.tracking && <div style={{ marginTop: "7px", display: "flex", justifyContent: "space-between", gap: "10px", fontSize: "11px" }}><span style={{ color: "#73786f" }}>کد پیگیری</span><strong style={{ color: "#353B32", direction: "ltr" }}>{record.tracking}</strong></div>}
    </div>
  );
}

function VipClassEventCard({ item, type }: { item: VipClassEvent; type: "class" | "event" }) {
  return (
    <div className="glass-list-card" style={{ display: "block" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <div className="list-icon"><Icon name={type === "class" ? "class" : "event"} /></div>
        <div className="list-copy" style={{ flex: 1 }}>
          <strong>{item.title}</strong>
          <span>{item.status || "ثبت‌شده"}</span>
          {(item.start || item.end) && <span>{item.start ? formatVipJalaliDate(item.start) : ""}{item.end ? "  تا  " + formatVipJalaliDate(item.end) : ""}</span>}
          {item.progress && <span>{item.progress}</span>}
          {item.details && <span>{item.details}</span>}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   VIP CUSTOMER NORMALIZER
========================================================= */

function normalizeVipCustomer(
  customer: any
): VipCustomer {

  return {

    id:
      customer?.id ??
      customer?.customerId ??
      undefined,

    telegramId:
      customer?.telegramId ??
      customer?.telegram_id ??
      undefined,

    firstName:
      customer?.firstName ??
      customer?.first_name ??
      null,

    lastName:
      customer?.lastName ??
      customer?.last_name ??
      null,

    mobile:
      customer?.mobile ??
      null,

    vipStatus:
      customer?.vipStatus ??
      customer?.vip_status ??
      null,

    joinedAt:
      formatVipJalaliDate(
        customer?.joinedAt ??
          customer?.joined_at ??
          null
      ),

    bookingsCount:
      Number(
        customer?.bookingsCount ??
          customer?.bookings_count ??
          0
      ) || 0,
  };
}




function normalizeVipTokens(value: unknown): VipToken[] {
  const unwrap = (input: unknown): unknown[] => {
    if (Array.isArray(input)) return input;
    if (!input || typeof input !== "object") return [];
    const obj = input as Record<string, unknown>;
    for (const key of ["tokens", "data", "items", "rows", "result"]) {
      if (Array.isArray(obj[key])) return obj[key] as unknown[];
    }
    return [];
  };

  const source = unwrap(value);

  const normalizeKey = (key: string) =>
    key.trim().toLowerCase().replace(/[\s_-]+/g, "");

  const read = (obj: Record<string, unknown>, aliases: string[]) => {
    const normalized = new Map<string, unknown>();
    Object.entries(obj).forEach(([key, val]) => {
      normalized.set(normalizeKey(key), val);
    });

    for (const alias of aliases) {
      const found = normalized.get(normalizeKey(alias));
      if (found !== undefined && found !== null && String(found).trim() !== "") {
        return found;
      }
    }

    // Backend versions may use an unexpected field name. Since VIP codes
    // have a stable format, safely detect the code from object values.
    for (const found of Object.values(obj)) {
      if (typeof found === "string" && /^VIP-[A-Z0-9]+$/i.test(found.trim())) {
        return found.trim();
      }
    }

    return "";
  };

  const normalized = source
    .map((raw): VipToken | null => {
      if (Array.isArray(raw)) {
        return {
          code: String(raw[0] ?? "").trim(),
          customerId: String(raw[1] ?? "").trim(),
          discount: raw[2] ?? "",
          discountPercent: raw[2] ?? "",
          issuedAt: raw[3] == null ? "" : String(raw[3]),
          expiresAt: raw[4] == null ? "" : String(raw[4]),
          status: raw[5] == null ? "" : String(raw[5]),
          usedAt: raw[6] == null ? "" : String(raw[6]),
          trackingCode: raw[7] == null ? "" : String(raw[7]),
        };
      }

      if (!raw || typeof raw !== "object") return null;

      const obj = raw as Record<string, unknown>;

      return {
        code: String(read(obj, [
          "code", "token", "tokenCode", "token_code", "coupon", "couponCode",
          "discountCode", "discount_code", "promoCode", "promo_code",
          "کد", "توکن", "توکن اختصاصی", "کد تخفیف", "کدتخفیف"
        ]) ?? "").trim(),
        customerId: String(read(obj, [
          "customerId", "customer_id", "customer", "vipId", "vip_id", "شناسه مشتری"
        ]) ?? "").trim(),
        discount: String(read(obj, [
          "discount", "discountPercent", "discount_percentage", "percent",
          "discountValue", "درصد تخفیف", "تخفیف"
        ]) ?? ""),
        discountPercent: String(read(obj, [
          "discountPercent", "discount_percentage", "percent", "discount",
          "discountValue", "درصد تخفیف", "تخفیف"
        ]) ?? ""),
        issuedAt: String(read(obj, [
          "issuedAt", "issued_at", "issueDate", "issue_date", "createdAt",
          "created_at", "dateIssued", "تاریخ صدور"
        ]) ?? ""),
        expiresAt: String(read(obj, [
          "expiresAt", "expires_at", "expiryDate", "expiry_date", "expireAt",
          "expire_at", "تاریخ انقضا"
        ]) ?? ""),
        status: String(read(obj, [
          "status", "tokenStatus", "token_status", "وضعیت"
        ]) ?? ""),
        usedAt: String(read(obj, [
          "usedAt", "used_at", "تاریخ استفاده"
        ]) ?? ""),
        trackingCode: String(read(obj, [
          "trackingCode", "tracking_code", "کد پیگیری"
        ]) ?? ""),
      };
    })
    .filter((token): token is VipToken => token !== null);

  // Prevent repeated backend rows from producing repeated cards.
  // Some backend responses duplicate the same token while changing an
  // internal field. The customer-facing identity of a token is its
  // customer + discount + issue/expiry window + usage state.
  const seen = new Set<string>();
  return normalized.filter((token) => {
    const normalizePart = (part: unknown) =>
      String(part ?? "")
        .trim()
        .toLowerCase()
        .replace(/[\s\u200c]+/g, "");

    const signature = [
      normalizePart(token.customerId),
      normalizePart(token.discount || token.discountPercent),
      normalizePart(token.issuedAt),
      normalizePart(token.expiresAt),
      normalizePart(token.usedAt),
    ].join("|");

    const fallbackSignature = [
      normalizePart(token.code),
      normalizePart(token.discount || token.discountPercent),
      normalizePart(token.issuedAt),
      normalizePart(token.expiresAt),
    ].join("|");

    // Prefer the customer-facing signature. If the API omits enough fields,
    // fall back to the actual VIP code.
    const key = signature.replace(/\|/g, "") ? signature : fallbackSignature;

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function formatVipJalaliDate(value: unknown): string {
  if (!value) return "";

  const text = String(value).trim();

  // The VIP sheet can return a date as "00:00 784/04/16".
  // Strip the time and normalize the legacy 3-digit Jalali year.
  const match = text.match(/(?:^|\\s)(\\d{3,4})[\\/-](\\d{1,2})[\\/-](\\d{1,2})/);

  if (!match) return text;

  let year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return text;
  }

  // Legacy backend formatting can drop the leading "1" from a Jalali
  // year in the 1400s (e.g. 784 => 1404).
  if (year >= 700 && year < 900) {
    year += 620;
  }

  if (year < 1200 || year > 1600 || month < 1 || month > 12 || day < 1 || day > 31) {
    return text;
  }

  try {
    const dateText = `${year}/${month}/${day}`;
    const parts = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).formatToParts(
      new Date(
        new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Tehran",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date()) + "T00:00:00"
      )
    );

    // Use the Jalali fields directly so we never reinterpret the stored
    // membership date as a Gregorian date.
    const monthNames = [
      "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
      "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
    ];

    void parts;
    return `${day.toLocaleString("fa-IR") } ${monthNames[month - 1]} ${year.toLocaleString("fa-IR")}`;
  } catch {
    return `${day.toLocaleString("fa-IR")}/${month.toLocaleString("fa-IR")}/${year.toLocaleString("fa-IR")}`;
  }
}

function getVipTokenDisplayStatus(token: VipToken): {
  label: string;
  color: string;
  background: string;
  border: string;
} {
  const rawStatus = String(token.status ?? "").trim();
  const normalizedStatus = rawStatus.replace(/\s+/g, "").toLowerCase();

  if (normalizedStatus === "استفادهشده" || normalizedStatus === "used") {
    return { label: "استفاده شده", color: "#6f746d", background: "rgba(111,116,109,0.08)", border: "rgba(111,116,109,0.18)" };
  }

  if (isVipTokenExpired(String(token.expiresAt ?? "").trim())) {
    return { label: "منقضی شده", color: "#9a5c52", background: "rgba(154,92,82,0.08)", border: "rgba(154,92,82,0.18)" };
  }

  // A token that has not expired yet is usable, even if the backend
  // still stores its administrative status as «صادر شده».
  return { label: "فعال", color: "#246347", background: "rgba(36,99,71,0.08)", border: "rgba(36,99,71,0.08)" };
}

function isVipTokenExpired(value: string): boolean {
  if (!value) return false;
  const match = value.match(/^(\d{3,4})[\/-](\d{1,2})[\/-](\d{1,2})(?:\s*-\s*(\d{1,2}):(\d{2}))?$/);
  if (!match) return false;

  const target = [
    Number(match[1]), Number(match[2]), Number(match[3]),
    match[4] == null ? 23 : Number(match[4]),
    match[5] == null ? 59 : Number(match[5]),
  ];

  try {
    const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
      calendar: "persian", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date());

    const now = [
      Number(parts.find((p) => p.type === "year")?.value ?? 0),
      Number(parts.find((p) => p.type === "month")?.value ?? 0),
      Number(parts.find((p) => p.type === "day")?.value ?? 0),
      Number(parts.find((p) => p.type === "hour")?.value ?? 0),
      Number(parts.find((p) => p.type === "minute")?.value ?? 0),
    ];

    for (let i = 0; i < target.length; i++) {
      if (now[i] > target[i]) return true;
      if (now[i] < target[i]) return false;
    }
    return true;
  } catch {
    return false;
  }
}


/* =========================================================
   LOAD TELEGRAM IDENTITY
========================================================= */

async function getTelegramInitData(): Promise<string | null> {
  try {
    await loadTelegramWebAppScript();
  } catch {
    return null;
  }

  const telegramWebApp = window.Telegram?.WebApp;
  if (!telegramWebApp) return null;

  try {
    telegramWebApp.ready?.();
    telegramWebApp.expand?.();
  } catch {}

  // Telegram can populate initData a moment after the WebApp object exists.
  // Retry briefly instead of treating a valid VIP member as a guest.
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const initData = telegramWebApp.initData || "";
    if (initData) return initData;
    await new Promise((resolve) => window.setTimeout(resolve, 250));
  }

  return null;
}

async function callVipApi(
  action: "load" | "connect",
  connectionCode?: string
): Promise<VipApiResponse> {
  const initData = await getTelegramInitData();

  if (!initData) {
    return {
      success: false,
      debug: "TELEGRAM_AUTH_UNAVAILABLE",
      message:
        "لطفاً این بخش را مستقیماً از داخل تلگرام باز کن تا ورود امن انجام شود.",
    };
  }

  try {
    const response = await fetch(VIP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=UTF-8",
      },
      body: JSON.stringify({
        initData,
        action,
        ...(action === "connect"
          ? { connectionCode: connectionCode?.trim().toUpperCase() }
          : {}),      }),
    });

    let data: VipApiResponse;

    try {
      data = (await response.json()) as VipApiResponse;
    } catch {
      return {
        success: false,
        debug: "INVALID_SERVER_RESPONSE",
        message: "پاسخ قابل خواندن از سامانه VIP دریافت نشد.",
      };
    }

    if (data.customer) {
      data.customer = normalizeVipCustomer(data.customer);
    }

    if (!response.ok) {
      return {
        ...data,
        success: false,
        message:
          data.message ||
          data.error ||
          "امکان دریافت اطلاعات VIP وجود ندارد.",
      };
    }

    return data;
  } catch {
    return {
      success: false,
      debug: "FETCH_ERROR",
      message:
        "ارتباط با سامانه VIP برقرار نشد. لطفاً دوباره تلاش کن.",
    };
  }
}

async function loadTelegramIdentity(): Promise<VipApiResponse> {
  return callVipApi("load");
}

async function connectTelegramVip(
  connectionCode: string
): Promise<VipApiResponse> {
  return callVipApi("connect", connectionCode);
}

/* =========================================================
   VIP PAGE
========================================================= */

type VipPanel =
  | "dashboard"
  | "bookings"
  | "payments"
  | "tokens"
  | "experiences"
  | "classes"
  | "events"
  | "profile";

function VipPage({
  onBack,
  initialPanel = "dashboard",
}: {
  onBack: () => void;
  initialPanel?: VipPanel;
}) {

  const [activePanel, setActivePanel] = useState<VipPanel>(initialPanel);


  const [loading, setLoading] =
    useState(true);


  const [vipCustomer, setVipCustomer] =
    useState<VipCustomer | null>(
      null
    );

  const [vipTokens, setVipTokens] =
    useState<VipToken[]>([]);

  const [vipHistory, setVipHistory] = useState<VipRecord[]>([]);
  const [vipPayments, setVipPayments] = useState<VipPayment[]>([]);
  const [vipClasses, setVipClasses] = useState<VipClassEvent[]>([]);
  const [vipEvents, setVipEvents] = useState<VipClassEvent[]>([]);

  const [copiedToken, setCopiedToken] =
    useState<string | null>(null);

  const [vipError, setVipError] =
    useState("");

  const [needsConnectionCode, setNeedsConnectionCode] =
    useState(false);

  const [connectionCode, setConnectionCode] =
    useState("");

  const [connecting, setConnecting] =
    useState(false);

  const [connectionError, setConnectionError] =
    useState("");

  const [bookingFilter, setBookingFilter] =
    useState<"all" | "upcoming" | "completed">("all");
  const [paymentFilter, setPaymentFilter] =
    useState<"all" | "successful" | "pending">("all");
  const [tokenFilter, setTokenFilter] =
    useState<"all" | "active" | "used" | "expired">("all");
  const [experienceFilter, setExperienceFilter] =
    useState("همه");
  const [classFilter, setClassFilter] =
    useState<"all" | "current" | "completed">("all");
  const [eventFilter, setEventFilter] =
    useState<"all" | "upcoming" | "attended">("all");

  useEffect(() => {
    document.body.classList.add("vip-mode");
    return () => {
      document.body.classList.remove("vip-mode");
    };
  }, []);

  useEffect(() => {

    let mounted = true;


    const initializeVip =
      async () => {

        const result =
          await loadTelegramIdentity();


        if (!mounted) {
          return;
        }


        setLoading(false);

        if (result.success && result.customer) {
          setVipCustomer(result.customer);
          setVipTokens(normalizeVipTokens(result.tokens));
          setVipHistory(normalizeVipRecordRows(result.history, "booking"));
          setVipPayments(normalizeVipRecordRows(result.payments, "payment"));
          setVipClasses(normalizeVipRowsForClassEvent(result.classes, "class"));
          setVipEvents(normalizeVipRowsForClassEvent(result.events, "event"));
          setNeedsConnectionCode(false);
          setVipError("");
          return;
        }

        if (result.needsConnectionCode) {
          setVipCustomer(null);
          setNeedsConnectionCode(true);
          setVipError("");
          return;
        }

        setVipCustomer(null);
        setNeedsConnectionCode(false);
        setVipError(
          result.message ||
            "عضویت VIP شما فعال نیست."
        );
      };


    initializeVip();


    return () => {
      mounted = false;
    };

  }, []);


  const openBookingApp = () => {
    window.location.href = BOOKING_APP_URL;
  };

  const displayName =
    `${vipCustomer?.firstName || ""} ${vipCustomer?.lastName || ""}`.trim() ||
    "عضو VIP";


  const vipActive =
    vipCustomer?.vipStatus ===
      "فعال" ||
    vipCustomer?.vipStatus ===
      "active";


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {

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
          description="در حال بررسی عضویت VIP شما..."
          icon="crown"
        />


        <div
          className="glass-list-card"
          style={{
            display: "block",
            textAlign:
              "center",
            padding:
              "28px 20px",
          }}
        >

          <div
            style={{
              width: "52px",
              height: "52px",
              margin:
                "0 auto 14px",
              borderRadius:
                "18px",
              display: "grid",
              placeItems:
                "center",
              background:
                "rgba(36,99,71,0.08)",
              color:
                "#246347",
            }}
          >
            <Icon name="crown" />
          </div>


          <div className="list-copy">

            <strong>
              در حال بررسی عضویت...
            </strong>

            <span>
              لطفاً چند لحظه صبر کن.
            </span>

          </div>

        </div>

      </div>
    );
  }


  /* =====================================================
     CONNECTION CODE / ACCESS DENIED
  ===================================================== */

  if (needsConnectionCode) {
    const submitConnectionCode = async () => {
      const normalizedCode = connectionCode.trim().toUpperCase();

      if (!normalizedCode) {
        setConnectionError("لطفاً کد اتصال VIP را وارد کن.");
        return;
      }

      setConnecting(true);
      setConnectionError("");

      const result = await connectTelegramVip(normalizedCode);

      if (result.success && result.customer) {
        setVipCustomer(result.customer);
        setVipTokens(normalizeVipTokens(result.tokens));
        setVipHistory(normalizeVipRecordRows(result.history, "booking"));
        setVipPayments(normalizeVipRecordRows(result.payments, "payment"));
        setVipClasses(normalizeVipRowsForClassEvent(result.classes, "class"));
        setVipEvents(normalizeVipRowsForClassEvent(result.events, "event"));
        setNeedsConnectionCode(false);
        setConnectionCode("");
        setConnectionError("");
        setConnecting(false);
        return;
      }

      setConnectionError(
        result.message ||
          "این کد اتصال معتبر نیست یا قبلاً استفاده شده است."
      );
      setConnecting(false);
    };

    return (
      <div className="inner-page">
        <button type="button" onClick={onBack} style={backButtonStyle}>
          ← بازگشت
        </button>

        <SectionHeaderCard
          kicker="KAENATCHI VIP"
          title="ورود به باشگاه VIP"
          description="برای اتصال حساب تلگرام شما به عضویت VIP، کد اتصال یک‌بارمصرف خود را وارد کنید."
          icon="crown"
          status="یک بار اتصال؛ ورودهای بعدی خودکار است"
        />

        <div
          className="glass-list-card"
          style={{ display: "block", padding: "20px" }}
        >
          <div
            style={{
              width: "58px",
              height: "58px",
              margin: "0 auto 16px",
              borderRadius: "20px",
              display: "grid",
              placeItems: "center",
              background: "rgba(165,139,91,0.10)",
              color: "#8a7348",
            }}
          >
            <Icon name="ticket" />
          </div>

          <div style={{ textAlign: "center", marginBottom: "18px" }}>
            <strong
              style={{
                display: "block",
                fontSize: "16px",
                color: "#353B32",
                marginBottom: "8px",
              }}
            >
              کد اتصال VIP
            </strong>

            <span
              style={{
                display: "block",
                fontSize: "12px",
                lineHeight: 1.9,
                color: "#73786f",
              }}
            >
              این کد را از مدیریت کائنات‌چی دریافت کن.
              <br />
              نیازی به وارد کردن Telegram ID یا username نیست.
            </span>
          </div>

          <input
            value={connectionCode}
            onChange={(event) => {
              setConnectionCode(
                event.target.value.replace(/\s/g, "").toUpperCase()
              );
              setConnectionError("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void submitConnectionCode();
              }
            }}
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="one-time-code"
            placeholder="مثلاً VIP-CON-7K4P2M"
            aria-label="کد اتصال VIP"
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: "1px solid rgba(53,59,50,0.13)",
              borderRadius: "16px",
              padding: "15px",
              background: "rgba(255,255,255,0.78)",
              color: "#353B32",
              fontFamily: "inherit",
              fontSize: "15px",
              textAlign: "center",
              direction: "ltr",
              outline: "none",
              boxShadow: "0 7px 20px rgba(53,59,50,0.06)",
            }}
          />

          {connectionError && (
            <div
              style={{
                marginTop: "10px",
                padding: "10px 12px",
                borderRadius: "13px",
                background: "rgba(150,70,60,0.07)",
                color: "#8d5149",
                fontSize: "12px",
                lineHeight: 1.8,
                textAlign: "center",
              }}
            >
              {connectionError}
            </div>
          )}

          <button
            type="button"
            onClick={() => void submitConnectionCode()}
            disabled={connecting}
            style={{
              width: "100%",
              marginTop: "13px",
              border: "none",
              borderRadius: "16px",
              padding: "14px 16px",
              background:
                connecting
                  ? "rgba(36,99,71,0.55)"
                  : "linear-gradient(135deg,#174b38,#2c7658)",
              color: "#fff",
              fontFamily: "inherit",
              fontSize: "14px",
              fontWeight: 600,
              cursor: connecting ? "default" : "pointer",
              boxShadow: "0 10px 24px rgba(23,75,56,0.16)",
            }}
          >
            {connecting ? "در حال اتصال..." : "🔗 اتصال و ورود"}
          </button>

          <div
            style={{
              marginTop: "14px",
              padding: "12px 13px",
              borderRadius: "14px",
              background: "rgba(53,59,50,0.045)",
              color: "#73786f",
              fontSize: "11px",
              lineHeight: 1.9,
              textAlign: "center",
            }}
          >
            کد اتصال فقط برای اولین اتصال این حساب لازم است و پس از استفاده دیگر قابل استفاده نخواهد بود.
          </div>
        </div>
      </div>
    );
  }

  if (!vipCustomer || !vipActive) {
    return (
      <div className="inner-page">
        <button type="button" onClick={onBack} style={backButtonStyle}>
          ← بازگشت
        </button>

        <SectionHeaderCard
          kicker="KAENATCHI VIP"
          title="دسترسی VIP"
          description="دسترسی این بخش فقط برای اعضای فعال VIP کائنات‌چی امکان‌پذیر است."
          icon="crown"
          status="عضویت VIP فعال نیست"
        />

        <div
          className="glass-list-card"
          style={{ display: "block", textAlign: "center" }}
        >
          <div
            style={{
              width: "58px",
              height: "58px",
              margin: "0 auto 14px",
              borderRadius: "20px",
              display: "grid",
              placeItems: "center",
              background: "rgba(53,59,50,0.07)",
              color: "#353B32",
            }}
          >
            <Icon name="crown" />
          </div>

          <div className="list-copy">
            <strong>دسترسی VIP فعال نیست</strong>
            <span>
              {vipError ||
                "در حال حاضر این حساب عضو فعال باشگاه VIP نیست."}
            </span>
          </div>
        </div>
      </div>
    );
  }

  /* =====================================================
     BOOKINGS
  ===================================================== */

  if (activePanel === "bookings") {
    const filtered = vipHistory.filter(record => {
      const status = normalizeVipStatus(record.status);
      if (bookingFilter === "upcoming") return status === "upcoming" || status === "other";
      if (bookingFilter === "completed") return status === "completed";
      return true;
    });
    return (
      <div className="inner-page">
        <button type="button" onClick={() => setActivePanel("dashboard")} style={backButtonStyle}>← بازگشت به VIP</button>
        <SectionHeaderCard kicker="VIP" title="نوبت‌های من" description="نوبت‌های ثبت‌شده شما در کائنات‌چی." icon="calendar" />
        <VipFilterTabs value={bookingFilter} onChange={value => setBookingFilter(value as "all" | "upcoming" | "completed")} options={[{ id: "all", title: "همه" }, { id: "upcoming", title: "پیش‌رو" }, { id: "completed", title: "انجام‌شده" }]} />
        {filtered.length > 0 ? filtered.map(record => <VipRecordCard key={record.id} record={record} />) : (
          <div className="glass-list-card" style={{ display: "block", textAlign: "center" }}>
            <div className="list-icon" style={{ margin: "0 auto 12px" }}><Icon name="calendar" /></div>
            <div className="list-copy"><strong>هنوز نوبتی در این فیلتر نیست</strong><span>{vipHistory.length ? "فیلتر دیگری را امتحان کن." : "سوابق نوبت‌های شما پس از ثبت در سامانه رزرو اینجا نمایش داده می‌شود."}</span></div>
          </div>
        )}
      </div>
    );
  }


  /* =====================================================
     PAYMENTS
  ===================================================== */

  if (activePanel === "payments") {
    const filtered = vipPayments.filter(record => {
      const status = normalizeVipStatus(record.status);
      if (paymentFilter === "successful") return status === "successful";
      if (paymentFilter === "pending") return status === "pending";
      return true;
    });
    return (
      <div className="inner-page">
        <button type="button" onClick={() => setActivePanel("dashboard")} style={backButtonStyle}>← بازگشت به VIP</button>
        <SectionHeaderCard kicker="VIP" title="پرداخت‌های من" description="سوابق پرداخت شما در کائنات‌چی." icon="card" />
        <VipFilterTabs value={paymentFilter} onChange={value => setPaymentFilter(value as "all" | "successful" | "pending")} options={[{ id: "all", title: "همه" }, { id: "successful", title: "موفق" }, { id: "pending", title: "در انتظار" }]} />
        {filtered.length > 0 ? filtered.map(record => <VipRecordCard key={record.id} record={record} kind="payment" />) : (
          <div className="glass-list-card" style={{ display: "block", textAlign: "center" }}>
            <div className="list-icon" style={{ margin: "0 auto 12px" }}><Icon name="card" /></div>
            <div className="list-copy"><strong>هنوز پرداختی در این فیلتر نیست</strong><span>{vipPayments.length ? "فیلتر دیگری را امتحان کن." : "سوابق پرداخت شما پس از اتصال داده‌های پرداخت اینجا نمایش داده می‌شود."}</span></div>
          </div>
        )}
      </div>
    );
  }


  /* =====================================================
     TOKENS
  ===================================================== */

  if (
    activePanel ===
    "tokens"
  ) {

    return (
      <div className="inner-page">

        <button
          type="button"
          onClick={() =>
            setActivePanel(
              "dashboard"
            )
          }
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
          style={{
            marginBottom: "14px",
            padding: "14px 16px",
            borderRadius: "18px",
            background: "rgba(165,139,91,0.08)",
            border: "1px solid rgba(165,139,91,0.15)",
            boxShadow: "0 10px 24px rgba(53,59,50,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "6px",
              color: "#353B32",
              fontWeight: 700,
              fontSize: "14px",
            }}
          >
            <Icon name="ticket" />
            <strong>تخفیف VIP</strong>
          </div>
          <span style={{ fontSize: "13px", lineHeight: 1.8, color: "#73786f" }}>
            توکن‌های VIP برای استفاده از تخفیف‌های اختصاصی انرژی‌خوانی، کلاس‌ها و ایونت‌ها هستند.
          </span>
        </div>
        <VipFilterTabs value={tokenFilter} onChange={value => setTokenFilter(value as "all" | "active" | "used" | "expired")} options={[{ id: "all", title: "همه" }, { id: "active", title: "فعال" }, { id: "used", title: "استفاده‌شده" }, { id: "expired", title: "منقضی‌شده" }]} />
        <div style={{ display: "grid", gap: "12px" }}>
          {vipTokens.length > 0 ? (
            vipTokens.map((token, index) => {
              const tokenDisplay = getVipTokenDisplayStatus(token);
              const tokenStatus = tokenDisplay.label === "فعال" ? "active" : tokenDisplay.label === "استفاده شده" ? "used" : "expired";
              if (tokenFilter !== "all" && tokenFilter !== tokenStatus) return null;
              const code = String(token.code ?? "").trim();
              const rawDiscount = token.discount ?? token.discountPercent ?? "";
              const discountNumber = Number(String(rawDiscount).replace(/٪/g, "%").replace("%", "").trim());
              const discount = Number.isFinite(discountNumber) && discountNumber > 0
                ? String(discountNumber)
                : String(rawDiscount).trim();
              const displayStatus = getVipTokenDisplayStatus(token);
              const issuedAt = String(token.issuedAt ?? "").trim();
              const expiresAt = String(token.expiresAt ?? "").trim();

              const copyToken = async () => {
                if (!code) return;
                try {
                  if (navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(code);
                  } else {
                    const textarea = document.createElement("textarea");
                    textarea.value = code;
                    textarea.style.position = "fixed";
                    textarea.style.opacity = "0";
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand("copy");
                    textarea.remove();
                  }
                  setCopiedToken(code);
                  window.setTimeout(() => {
                    setCopiedToken((current) => current === code ? null : current);
                  }, 1600);
                } catch {
                  setCopiedToken(null);
                }
              };

              return (
                <div key={index} className="glass-list-card" style={{
                  border: `1px solid ${displayStatus.border}`,
                  display: "block",
                }}>
                  <div style={{
                    display: "flex", alignItems: "flex-start",
                    justifyContent: "space-between", gap: "12px", marginBottom: "14px",
                  }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{
                        fontSize: "10px", letterSpacing: "1.5px",
                        color: "#8a8f87", marginBottom: "6px",
                      }}>DISCOUNT CODE</div>
                      <div style={{
                        fontSize: "20px", lineHeight: 1.3, fontWeight: 800,
                        letterSpacing: "1px", color: "#353B32",
                        overflowWrap: "anywhere", direction: "ltr", textAlign: "left",
                      }}>{code || "کد تخفیف"}</div>
                    </div>

                    {code && (
                      <button type="button" onClick={copyToken} style={{
                        flex: "0 0 auto",
                        border: `1px solid ${copiedToken === code ? "rgba(36,99,71,0.22)" : "rgba(53,59,50,0.12)"}`,
                        borderRadius: "12px",
                        background: copiedToken === code ? "rgba(36,99,71,0.08)" : "rgba(255,255,255,0.72)",
                        color: copiedToken === code ? "#246347" : "#353B32",
                        padding: "9px 11px", fontFamily: "inherit",
                        fontSize: "11px", fontWeight: 700, cursor: "pointer",                        boxShadow: "0 6px 14px rgba(53,59,50,0.06)",
                      }}>{copiedToken === code ? "کپی شد ✓" : "کپی کد"}</button>
                    )}
                  </div>

                  <div style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between", gap: "10px",
                    flexWrap: "wrap", marginBottom: "13px",
                  }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center",
                      padding: "6px 10px", borderRadius: "10px",
                      background: displayStatus.background,
                      border: `1px solid ${displayStatus.border}`,
                      color: displayStatus.color, fontSize: "11px", fontWeight: 700,
                    }}>{displayStatus.label}</span>
                    <span style={{ color: "#8a7146", fontSize: "13px", fontWeight: 700 }}>
                      {discount !== "" ? `تخفیف ${String(discount).replace(/%/g, "").trim()}٪` : "تخفیف VIP"}
                    </span>
                  </div>

                  <div style={{
                    display: "grid", gap: "7px", paddingTop: "11px",
                    borderTop: "1px solid rgba(53,59,50,0.08)",
                    fontSize: "12px", color: "#73786f", lineHeight: 1.8,
                  }}>
                    {issuedAt !== "" && (
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                        <span>تاریخ صدور</span>
                        <strong style={{ color: "#353B32", fontWeight: 600, direction: "ltr" }}>
                          {formatVipJalaliDate(issuedAt)}
                        </strong>
                      </div>
                    )}
                    {expiresAt !== "" && (
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                        <span>تاریخ انقضا</span>
                        <strong style={{
                          color: displayStatus.label === "منقضی شده" ? "#9a5c52" : "#353B32",
                          fontWeight: 600, direction: "ltr",
                        }}>{formatVipJalaliDate(expiresAt)}</strong>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="glass-list-card" style={{ display: "block", textAlign: "center" }}>
              <div className="list-icon" style={{ margin: "0 auto 12px" }}>
                <Icon name="ticket" />
              </div>
              <div className="list-copy">
                <strong>هنوز توکنی برای شما ثبت نشده</strong>
                <span>هر توکن تخفیف اختصاصی پس از صدور در این قسمت نمایش داده می‌شود.</span>
              </div>
            </div>
          )}
        </div>

      </div>
    );
  }


  /* =====================================================
     EXPERIENCES
  ===================================================== */

  if (activePanel === "experiences") {
    const fixedCategories = [
      "قهوه",
      "پاسور",
      "تاروت رایدر وایت",
      "تاروت رایدر احساسی",
      "تاروت رایدر شغلی - مالی",
      "لنورماند فرانسوی",
      "لنورماند احساسی",
      "تاروت یونانی احساسی",
      "تاروت مارسی احساسی",
      "جم اوراکل",
      "شمع‌تراپی",
      "سایکوتراپی",
    ];

    // Keep the agreed list first, then append any new service that
    // already exists in the customer's VIP history/API.
    const historyCategories = Array.from(
      new Set(
        vipHistory
          .map((record) => vipExperienceCategory(record.service))
          .filter(
            (category) =>
              category &&
              category !== "سایر" &&
              !fixedCategories.includes(category)
          )
      )
    );

    const categories = ["همه", ...fixedCategories, ...historyCategories];

    const filtered = vipHistory.filter(
      (record) =>
        experienceFilter === "همه" ||
        vipExperienceCategory(record.service) === experienceFilter
    );

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
          title="تجربه‌های من"
          description="اینجا می‌توانی مسیر تجربه‌ها و انرژی‌خوانی‌های ثبت‌شده خودت را به تفکیک نوع خدمت ببینی."
          icon="spark"
        />

        <VipFilterTabs
          value={experienceFilter}
          onChange={setExperienceFilter}
          options={categories.map((item) => ({
            id: item,
            title: item,
          }))}
        />

        {filtered.length > 0 ? (
          filtered.map((item, index) => (
            <div
              key={item.id}
              className="glass-list-card"
              style={{
                display: "block",
                marginBottom: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "13px",
                    display: "grid",
                    placeItems: "center",
                    background: "rgba(165,139,91,0.09)",
                    color: "#8a7348",
                    fontWeight: 800,
                    fontSize: "13px",
                    flex: "0 0 auto",
                  }}
                >
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div
                  className="list-copy"
                  style={{ flex: 1 }}
                >
                  <strong>{item.service}</strong>
                  {item.date && (
                    <span>
                      {formatVipJalaliDate(item.date)}
                      {item.time ? "  •  " + item.time : ""}
                    </span>
                  )}
                  {!item.date && item.time && (
                    <span>{item.time}</span>
                  )}
                  {item.status && (
                    <span>{item.status}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div
            className="glass-list-card"
            style={{
              display: "block",
              textAlign: "center",
            }}
          >
            <div
              className="list-icon"
              style={{ margin: "0 auto 12px" }}
            >
              <Icon name="spark" />
            </div>
            <div className="list-copy">
              <strong>
                هنوز تجربه‌ای در این بخش ثبت نشده
              </strong>
              <span>
                {vipHistory.length
                  ? "دسته دیگری را امتحان کن."
                  : "سوابق تجربه‌های شما پس از ثبت نوبت در اینجا نمایش داده می‌شود."}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* =====================================================
     CLASSES
  ===================================================== */

  if (activePanel === "classes") {
    const filtered = vipClasses.filter(item => classFilter === "all" || (classFilter === "current" ? /درحال|جاری|فعال|upcoming|current/i.test(item.status.replace(/\s/g, "")) : /گذرانده|تکمیل|completed/i.test(item.status.replace(/\s/g, ""))));
    return (
      <div className="inner-page">
        <button type="button" onClick={() => setActivePanel("dashboard")} style={backButtonStyle}>← بازگشت به VIP</button>
        <SectionHeaderCard kicker="VIP" title="کلاس‌های من" description="کلاس‌ها و دوره‌هایی که در آن‌ها ثبت‌نام کرده‌ای." icon="class" />
        <VipFilterTabs value={classFilter} onChange={value => setClassFilter(value as "all" | "current" | "completed")} options={[{ id: "all", title: "همه" }, { id: "current", title: "در حال برگزاری" }, { id: "completed", title: "گذرانده‌شده" }]} />
        {filtered.length > 0 ? filtered.map(item => <VipClassEventCard key={item.id} item={item} type="class" />) : (
          <div className="glass-list-card" style={{ display: "block", textAlign: "center" }}><div className="list-icon" style={{ margin: "0 auto 12px" }}><Icon name="class" /></div><div className="list-copy"><strong>هنوز کلاسی برای شما ثبت نشده</strong><span>وقتی اطلاعات ثبت‌نام کلاس‌ها به حساب VIP متصل شود، اینجا نمایش داده می‌شود.</span></div></div>
        )}
      </div>
    );
  }

  /* =====================================================
     EVENTS
  ===================================================== */

  if (activePanel === "events") {
    const filtered = vipEvents.filter(item => eventFilter === "all" || (eventFilter === "upcoming" ? /پیشرو|ثبت|فعال|upcoming/i.test(item.status.replace(/\s/g, "")) : /شرکتکرد|حاضر|attended|completed/i.test(item.status.replace(/\s/g, ""))));
    return (
      <div className="inner-page">
        <button type="button" onClick={() => setActivePanel("dashboard")} style={backButtonStyle}>← بازگشت به VIP</button>
        <SectionHeaderCard kicker="VIP" title="ایونت‌های من" description="رویدادهایی که برای آن‌ها ثبت‌نام کرده‌ای یا در آن‌ها شرکت کرده‌ای." icon="event" />
        <VipFilterTabs value={eventFilter} onChange={value => setEventFilter(value as "all" | "upcoming" | "attended")} options={[{ id: "all", title: "همه" }, { id: "upcoming", title: "پیش‌رو" }, { id: "attended", title: "شرکت‌کرده" }]} />
        {filtered.length > 0 ? filtered.map(item => <VipClassEventCard key={item.id} item={item} type="event" />) : (
          <div className="glass-list-card" style={{ display: "block", textAlign: "center" }}><div className="list-icon" style={{ margin: "0 auto 12px" }}><Icon name="event" /></div><div className="list-copy"><strong>هنوز ایونتی برای شما ثبت نشده</strong><span>وقتی اطلاعات ثبت‌نام ایونت‌ها به حساب VIP متصل شود، اینجا نمایش داده می‌شود.</span></div></div>
        )}
      </div>
    );
  }


  /* =====================================================
     PROFILE
  ===================================================== */

  if (
    activePanel ===
    "profile"
  ) {

    return (
      <div className="inner-page">

        <button
          type="button"
          onClick={() =>
            setActivePanel(
              "dashboard"
            )
          }
          style={backButtonStyle}
        >
          ← بازگشت به VIP
        </button>


        <SectionHeaderCard
          kicker="PROFILE"
          title="پروفایل من"
          description="اطلاعات حساب VIP شما."
          icon="user"
          status="عضویت VIP فعال است"
        />


        <div
          style={{
            marginBottom: "14px",
            padding: "14px 16px",
            borderRadius: "18px",
            background: "rgba(165,139,91,0.08)",
            border: "1px solid rgba(165,139,91,0.15)",
            boxShadow: "0 10px 24px rgba(53,59,50,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "6px",
              color: "#353B32",
              fontWeight: 700,
              fontSize: "14px",
            }}
          >
            <Icon name="user" />
            <strong>پروفایل VIP</strong>
          </div>
          <span style={{ fontSize: "13px", lineHeight: 1.8, color: "#73786f" }}>
            اینجا اطلاعات حساب و وضعیت عضویت VIP شما نمایش داده می‌شود.
          </span>
        </div>

        <div className="glass-list-card">

          <div className="list-icon">
            <Icon name="user" />
          </div>


          <div className="list-copy">

            <strong>
              {displayName}
            </strong>


            <span>
              وضعیت عضویت: فعال
            </span>


            {vipCustomer.mobile && (
              <span>
                شماره موبایل:{" "}
                {vipCustomer.mobile}
              </span>
            )}


            {typeof vipCustomer.bookingsCount ===
              "number" && (
              <span>
                تعداد نوبت‌ها:{" "}
                {
                  vipCustomer.bookingsCount
                }
              </span>
            )}


            {vipCustomer.joinedAt && (
              <span>
                تاریخ عضویت:{" "}
                {vipCustomer.joinedAt}
              </span>
            )}

          </div>

        </div>

      </div>
    );
  }


  /* =====================================================
     VIP DASHBOARD
  ===================================================== */

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
        title={`سلام ${displayName} 🌿`}
        description="فضای اختصاصی اعضای VIP کائنات‌چی."
        icon="crown"
        status="عضویت VIP فعال است"
      />

      <section className="vip-journey-summary" aria-label="خلاصه مسیر VIP">
        <div className="vip-journey-heading">
          <strong>مشاهده مسیر من ←</strong>
          <span>آمار واقعی فعالیت‌های شما در کائنات‌چی</span>
        </div>

        <div className="vip-journey-stats">
          {[
            ["calendar", "نوبت", String(vipHistory.length)],
            ["spark", "تجربه", String(vipHistory.length)],
            ["class", "کلاس", String(vipClasses.length)],
            ["event", "ایونت", String(vipEvents.length)],
            ["card", "پرداخت", String(vipPayments.length)],
            ["ticket", "توکن", String(vipTokens.length)],
          ].map(([icon, label, value]) => (
            <div className="vip-journey-stat" key={label}>
              <div className="vip-journey-stat-icon">
                <Icon name={icon as IconName} />
              </div>
              <div className="vip-journey-stat-copy">
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px" }}>
        {[
          ["bookings", "calendar", "نوبت‌های من", "سوابق و وضعیت نوبت‌ها"],
          ["payments", "card", "پرداخت‌های من", "سوابق پرداخت‌ها"],
          ["tokens", "ticket", "توکن‌های من", "تخفیف‌های اختصاصی VIP"],
          ["experiences", "spark", "تجربه‌های من", "تاریخچه تجربه‌های شما"],
          ["classes", "class", "کلاس‌های من", "دوره‌ها و آموزش‌های شما"],
          ["events", "event", "ایونت‌های من", "رویدادهای ثبت‌شده شما"],
          ["profile", "user", "پروفایل من", "اطلاعات و وضعیت عضویت"],
        ].map(([panel, icon, title, description]) => (
          <button key={panel} type="button" className="glass-list-card" onClick={() => setActivePanel(panel as typeof activePanel)} style={vipTileStyle}>
            <div className="list-icon"><Icon name={icon as IconName} /></div>
            <div className="list-copy"><strong>{title}</strong><span>{description}</span></div>
          </button>
        ))}
      </div>

      <div style={{ marginTop: "12px" }}>
        <button type="button" onClick={openBookingApp} style={{ width: "100%", border: "none", borderRadius: "18px", padding: "15px 18px", background: "linear-gradient(135deg, #174b38, #2c7658)", color: "#fff", fontFamily: "inherit", fontSize: "14px", fontWeight: 700, cursor: "pointer", boxShadow: "0 10px 24px rgba(23,75,56,0.18)" }}>📅 دریافت نوبت</button>
      </div>

    </div>
  );
}


/* =========================================================
   STYLES
========================================================= */

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
  textAlign:
    "right" as const,
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  flexDirection:
    "column" as const,
  alignItems:
    "flex-start",
};


/* =========================================================
   MORE DETAIL
========================================================= */

function MoreDetail({
  title,
  icon,
  description,
  onBack,
}: {
  title: string;
  icon: IconName;
  description: string;
  onBack: () => void;
}) {
  const isFaq = title === "سوالات متداول";
  const isHours = title === "ساعات کاری";
  const isContact = title === "ارتباط با ما";
  const faqRows = getCmsFaqRows();
  const hoursText = cmsPageText(["ساعات", "hours"]) || cmsSetting(["hours", "ساعات"]);
  const telegram = cmsSetting(["telegram", "تلگرام"]) || "https://t.me/AD_Kaenatchi";
  const whatsapp = cmsSetting(["whatsapp", "واتساپ"]);
  const instagram = cmsSetting(["instagram", "اینستاگرام"]) || "https://instagram.com/Kaenatchi";

  return (
    <div className="inner-page">
      <button type="button" onClick={onBack} style={backButtonStyle}>← بازگشت</button>
      <SectionHeaderCard
        kicker={isFaq ? "FAQ" : isHours ? "HOURS" : "CONTACT"}
        title={title}
        description={description}
        icon={icon}
      />

      {isFaq && (
        <div className="more-info-stack">
          {faqRows.length ? faqRows.map((item, index) => (
            <div className="more-info-card" key={item.question + index}>
              <strong>{item.question}</strong>
              <span>{item.answer}</span>
            </div>
          )) : (
            <div className="more-info-card">
              <strong>هنوز محتوایی ثبت نشده</strong>
              <span>این بخش را از پنل CMS تکمیل کن.</span>
            </div>
          )}
        </div>
      )}

      {isHours && (
        <div className="more-info-stack">
          <div className="more-info-card">
            <strong>{title}</strong>
            <span>{hoursText || "هنوز ساعت کاری در CMS ثبت نشده است."}</span>
          </div>
        </div>
      )}

      {isContact && (
        <div className="more-contact-grid">
          <a className="more-contact-card" href={telegram} target="_blank" rel="noreferrer">
            <span>✦</span><strong>تلگرام</strong><small>ارتباط با کائنات‌چی</small>
          </a>
          {whatsapp && (
            <a className="more-contact-card" href={whatsapp} target="_blank" rel="noreferrer">
              <span>◌</span><strong>واتساپ</strong><small>پیام در واتساپ</small>
            </a>
          )}
          <a className="more-contact-card" href={instagram} target="_blank" rel="noreferrer">
            <span>◎</span><strong>اینستاگرام</strong><small>صفحه کائنات‌چی</small>
          </a>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   MORE PAGE
========================================================= */

function MorePage({
  onSearch,
}: {
  onSearch: () => void;
}) {
  const [selected, setSelected] =
    useState<(typeof moreItems)[number] | null>(null);
  const [vipPanel, setVipPanel] = useState<VipPanel | null>(null);
  const [vipData, setVipData] = useState<VipApiResponse | null>(null);
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    let active = true;

    loadTelegramIdentity()
      .then((data) => {
        if (active) setVipData(data);
      })
      .catch(() => {
        if (active) setVipData(null);
      });

    const timer = window.setInterval(() => {
      if (active) setClock(new Date());
    }, 30000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  if (vipPanel) {
    return (
      <VipPage
        initialPanel={vipPanel}
        onBack={() => setVipPanel(null)}
      />
    );
  }

  if (selected) {
    return (
      <MoreDetail
        title={selected.title}
        icon={selected.icon}
        description={selected.description}
        onBack={() => setSelected(null)}
      />
    );
  }

  const customer = vipData?.customer;
  const isVip =
    customer?.vipStatus?.trim().toLowerCase() === "active" ||
    customer?.vipStatus?.trim() === "فعال";

  const displayName = isVip
    ? [customer?.firstName, customer?.lastName].filter(Boolean).join(" ") || "عضو VIP"
    : "کاربر مهمان";

  const time = new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(clock);

  const jalaliDate = (() => {
    try {
      const parts = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).formatToParts(clock);

      const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";
      const day = parts.find((part) => part.type === "day")?.value ?? "";
      const month = parts.find((part) => part.type === "month")?.value ?? "";
      const year = parts.find((part) => part.type === "year")?.value ?? "";

      return `امروز ${weekday} ${day} ${month} ${year}`.replace(/\\s+/g, " ").trim();
    } catch {
      return "امروز";
    }
  })();

  const requestVip = () => {
    const message = encodeURIComponent(
      "سلام، برای عضویت در باشگاه VIP کائنات‌چی درخواست عضویت دارم."
    );
    window.location.href = "https://t.me/AD_Kaenatchi?text=" + message;
  };

  const openVipDashboard = () => {
    setVipPanel("dashboard");
  };

  return (
    <div className="inner-page more-dashboard">
      <div className="more-dashboard-heading">
        <strong>همه‌چیز در یک نگاه</strong>
        <button type="button" className="more-heading-search" onClick={onSearch} aria-label="جست‌وجو در کائنات‌چی">
          <Icon name="search" />
        </button>
      </div>

      <section className={"more-welcome-card " + (isVip ? "is-vip" : "is-guest")}>
        <div className="more-welcome-orbit orbit-one" />
        <div className="more-welcome-orbit orbit-two" />

        <div className="more-welcome-top">
          <div className="more-welcome-copy">
            <span className="more-welcome-kicker">
              {isVip ? "VIP MEMBER" : "KAENATCHI"}
            </span>
            <strong>
              {"خوش اومدی" + (isVip ? "، " + displayName : " 🌿")}
            </strong>
            <div className="more-status-line">
              <span className={"more-status-dot " + (isVip ? "vip" : "guest")} />
              <span>{isVip ? "عضو باشگاه VIP" : "عضویت VIP هنوز فعال نیست"}</span>
            </div>
          </div>

          <button
            type="button"
            className={"more-status-button " + (isVip ? "vip" : "guest")}
            onClick={openVipDashboard}
            aria-label={isVip ? "وضعیت عضویت VIP" : "ورود به VIP"}
          >
            <span />
          </button>
        </div>

        <div className="more-welcome-info">
          <div>
            <span>ساعت</span>
            <strong>{time}</strong>
          </div>
          <div>
            <span>امروز</span>
            <strong>{jalaliDate}</strong>
          </div>
          {isVip && customer?.joinedAt && (
            <div>
              <span>عضو از</span>
              <strong>{customer.joinedAt}</strong>
            </div>
          )}
        </div>
      </section>

      {!isVip && (
        <section className="more-vip-invite">
          <div className="more-vip-invite-icon">✦</div>
          <div className="more-vip-invite-copy">
            <span>باشگاه اختصاصی کائنات‌چی</span>
            <strong>یک قدم تا دنیای VIP</strong>
            <p>
              برای آشنایی و درخواست عضویت، درخواستت را از طریق تلگرام برای کائنات‌چی ارسال کن.
            </p>
          </div>
          <button type="button" onClick={requestVip}>
            <span>⭐ درخواست عضویت VIP</span>
            <Icon name="arrow" />
          </button>
        </section>
      )}

      {isVip && (
        <section className="more-member-section">
          <div className="more-member-heading">
            <span>MEMBERSHIP</span>
            <strong>عضویت فعال</strong>
          </div>

          <div className="more-member-grid">
            <button
              type="button"
              className="more-category-card"
              onClick={() => setVipPanel("profile")}
            >
              <span className="more-category-icon gold"><Icon name="user" /></span>
              <span className="more-category-copy">
                <strong>پروفایل من</strong>
                <small>اطلاعات حساب و عضویت</small>
              </span>
              <Icon name="arrow" />
            </button>

            <button
              type="button"
              className="more-category-card"
              onClick={() => setVipPanel("bookings")}
            >
              <span className="more-category-icon"><Icon name="calendar" /></span>
              <span className="more-category-copy">
                <strong>سابقه نوبت‌ها</strong>
                <small>نوبت‌های ثبت‌شده شما</small>
              </span>
              <Icon name="arrow" />
            </button>
          </div>
        </section>
      )}

      <section className="more-category-section">
        <div className="more-category-title">
          <span>کائنات‌چی</span>
          <strong>راهنما و ارتباط</strong>
        </div>

        <div className="more-category-grid">
          {moreItems
            .filter((item) => ["faq", "contact", "hours"].includes(item.id))
            .map((item) => (
              <button
                key={item.id}
                type="button"
                className="more-category-card"
                onClick={() => setSelected(item)}
              >
                <span className="more-category-icon">
                  <Icon name={item.icon} />
                </span>
                <span className="more-category-copy">
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                </span>
                <Icon name="arrow" />
              </button>
            ))}

          {cmsSetting(["channel", "کانال", "telegramchannel"]) && (
            <a
              className="more-category-card"
              href={cmsSetting(["channel", "کانال", "telegramchannel"])}
              target="_blank"
              rel="noreferrer"
            >
            <span className="more-category-icon">
              <Icon name="spark" />
            </span>
            <span className="more-category-copy">
              <strong>کانال کائنات‌چی</strong>
              <small>مطالب و اطلاع‌رسانی‌ها</small>
            </span>
              <Icon name="arrow" />
            </a>
          )}
        </div>
      </section>
    </div>
  );
}

function BookingPage({
  onBack,
  initialService,
}: {
  onBack: () => void;
  initialService?: Service | null;
}) {
  type BookingConfig = {
    services: Array<Record<string, unknown>>;
    availableDates: Array<Record<string, unknown>>;
    settings: Record<string, unknown>;
  };

  type BookingState = "idle" | "loading" | "submitting" | "success" | "error";

  const ENDPOINT = "https://kaenatchi-booking-transport.mayanaz-oriflame.workers.dev/";

  const [config, setConfig] = useState<BookingConfig | null>(null);
  const [serviceId, setServiceId] = useState(initialService?.id || "");
  const [date, setDate] = useState("");
  const [bookingCategory, setBookingCategory] = useState<ServiceCategory | null>(
    initialService?.category || null
  );
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<Array<Record<string, unknown>>>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [discount, setDiscount] = useState<{valid:boolean; percent:number; amount:number}>({valid:false,percent:0,amount:0});
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [transactionNumber, setTransactionNumber] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<BookingState>("loading");
  const [trackingCode, setTrackingCode] = useState("");
  const [checkingDiscount, setCheckingDiscount] = useState(false);

  const backendServices: Service[] = (config?.services || [])
    .map((item) => {
      const title = String(item.name ?? item.title ?? item.serviceName ?? "خدمت").trim();
      const category = cmsCategory(
        String(item.category ?? item.Category ?? ""),
        title
      );
      return {
        id: String(item.id ?? item.ID ?? ""),
        title,
        category,
        price: String(item.price ?? item.Price ?? ""),
        duration: String(item.duration ?? item.Duration ?? ""),
        description: String(item.description ?? item.Description ?? ""),
      };
    })
    .filter((service) => {
      const normalizedTitle = service.title
        .replace(/[\u200c\u200f\u200e\s_-]+/g, "")
        .toLocaleLowerCase("fa");
      return !(
        (normalizedTitle === "انرژیخوانی" ||
          normalizedTitle === "شمعتراپی" ||
          normalizedTitle === "سایکوتراپی") &&
        !service.price &&
        !service.duration
      );
    });

  // Booking is intentionally limited to the three customer-facing categories.
  // The individual services remain CMS/backend driven and can be added or removed
  // without changing this UI code.
  const bookingServices = backendServices.filter((service) =>
    ["energy", "candle", "psychotherapy"].includes(service.category)
  );

  const selectedService =
    bookingServices.find((item) => item.id === serviceId) ||
    initialService ||
    null;
  const basePrice =
    Number(String(selectedService?.price || "").replace(/[,٬،\s]/g, "")) || 0;
  const finalPrice = Math.max(0, basePrice - discount.amount);

  const getTelegramId = () => {
    try {
      return String((window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id || "");
    } catch {
      return "";
    }
  };

  const apiGetJsonp = (
    action: string,
    params: Record<string, string> = {}
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const callbackName =
        "__kaenatchiBooking_" +
        Date.now() +
        "_" +
        Math.random().toString(36).slice(2);

      const script = document.createElement("script");
      const url = new URL(ENDPOINT);

      url.searchParams.set("action", action);
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
      url.searchParams.set("callback", callbackName);
      url.searchParams.set("_", String(Date.now()));

      let settled = false;
      let timeoutId = 0;

      const cleanup = () => {
        window.clearTimeout(timeoutId);
        script.remove();
        try {
          delete (window as any)[callbackName];
        } catch {}
      };

      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        cleanup();
        fn();
      };

      (window as any)[callbackName] = (data: any) => {
        finish(() => {
          if (data?.ok === false) {
            reject(
              new Error(
                data?.message ||
                  "سامانه رزرو در مرحله «" +
                    action +
                    "» خطا برگرداند."
              )
            );
            return;
          }
          resolve(data);
        });
      };

      script.async = true;
      script.src = url.toString();

      script.onerror = () => {
        finish(() => reject(new Error("JSONP_TRANSPORT_FAILED")));
      };

      timeoutId = window.setTimeout(() => {
        finish(() => reject(new Error("JSONP_TRANSPORT_TIMEOUT")));
      }, 12000);

      document.head.appendChild(script);
    });
  };

  const apiGet = async (
    action: string,
    params: Record<string, string> = {}
  ): Promise<any> => {
    const url = new URL(ENDPOINT);

    url.searchParams.set("action", action);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    url.searchParams.set("_", String(Date.now()));

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        mode: "cors",
        credentials: "omit",
        cache: "no-store",
        redirect: "follow",
        headers: {
          Accept: "application/json, text/plain, */*",
        },
        signal: controller.signal,
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(
          "سامانه رزرو پاسخ HTTP " +
            response.status +
            " برگرداند."
        );
      }

      let data: any;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error("BOOKING_JSON_INVALID");
      }

      if (data?.ok === false) {
        throw new Error(
          data?.message ||
            "سامانه رزرو در مرحله «" +
              action +
              "» خطا برگرداند."
        );
      }

      return data;
    } catch (error) {
      /*
       * Telegram WebView, Safari/WKWebView, Android WebView and desktop
       * clients can reject or hide a cross-origin fetch even when the
       * Worker is healthy. JSONP is the browser-native cross-origin
       * script transport and therefore is the deterministic fallback.
       *
       * IMPORTANT: any fetch failure reaches this fallback. We do not
       * depend on browser-specific error-message text.
       */
      try {
        return await apiGetJsonp(action, params);
      } catch (jsonpError) {
        const firstError =
          error instanceof Error ? error.message : "FETCH_FAILED";
        const secondError =
          jsonpError instanceof Error
            ? jsonpError.message
            : "JSONP_FAILED";

        throw new Error(
          "BOOKING_TRANSPORT_FAILED:" +
            firstError +
            "|" +
            secondError
        );
      }
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const waitForBookingStatus = async (
    requestId: string,
    mode: "created" | "paid"
  ) => {
    const started = Date.now();

    while (Date.now() - started < 30000) {
      const data = await apiGet("bookingStatus", { requestId });

      if (data.found) {
        if (mode === "created" && data.bookingId) return data;
        if (
          mode === "paid" &&
          (
            data.paymentStatus === "فیش دریافت شد" ||
            data.paymentStatus === "تأیید شد"
          )
        ) {
          return data;
        }
      }

      await new Promise((resolve) =>
        window.setTimeout(resolve, 1200)
      );
    }

    throw new Error(
      mode === "created"
        ? "ثبت نوبت زمان‌بر شد. لطفاً وضعیت درخواست را دوباره بررسی کن."
        : "ارسال اطلاعات پرداخت زمان‌بر شد. لطفاً چند لحظه بعد دوباره وضعیت نوبت را بررسی کن."
    );
  };

  const apiPost = async (
    action: string,
    payload: Record<string, unknown>
  ) => {
    const requestId = String(
      payload.requestId ||
        payload.clientRequestId ||
        payload.clientTrackingCode ||
        ""
    ).trim();

    const url = new URL(ENDPOINT);
    url.searchParams.set("_", String(Date.now()));

    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      30000
    );

    try {
      const response = await fetch(url.toString(), {
        method: "POST",
        mode: "cors",
        credentials: "omit",
        cache: "no-store",
        redirect: "follow",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
          Accept: "application/json, text/plain, */*",
        },
        body: JSON.stringify({
          action,
          ...payload,
        }),
        signal: controller.signal,
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(
          "سامانه رزرو پاسخ HTTP " +
            response.status +
            " برگرداند."
        );
      }

      let data: any = { ok: true };

      if (responseText.trim()) {
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error(
            "پاسخ ثبت نوبت JSON معتبر نیست."
          );
        }
      }

      if (data?.ok === false) {
        throw new Error(
          data?.message ||
            "سامانه رزرو در مرحله «" +
              action +
              "» خطا برگرداند."
        );
      }

      if (!requestId) {
        return data;
      }

      return waitForBookingStatus(
        requestId,
        action === "createBooking"
          ? "created"
          : "paid"
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("BOOKING_TRANSPORT_TIMEOUT");
      }

      if (
        error instanceof TypeError &&
        /fetch|network|failed/i.test(error.message)
      ) {
        throw new Error(
          "ارتباط با سامانه رزرو برقرار نشد. لطفاً دوباره تلاش کن."
        );
      }

      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const loadConfig = async () => {
    try {
      setState("loading");
      setMessage("");

      // مستقیماً getConfig را می‌خوانیم. transportTest یک درخواست
      // اضافه بود و در Telegram iOS می‌توانست کل صفحه رزرو را بی‌دلیل
      // در حالت BOOKING_TRANSPORT_TIMEOUT نگه دارد. خود getConfig از
      // همان Worker و همان fallback JSONP عبور می‌کند.
      const data = await apiGet("getConfig");

      if (!data || data.ok === false) {
        throw new Error(data?.message || "سامانه رزرو در پاسخ getConfig خطا داد.");
      }

      const services = Array.isArray(data.services) ? data.services : [];

      if (services.length === 0) {
        throw new Error("اتصال به سامانه برقرار است، اما لیست خدمات خالی برگشت.");
      }

      const next: BookingConfig = {
        services,
        availableDates: Array.isArray(data.availableDates) ? data.availableDates : [],
        settings: data.settings || {},
      };

      setConfig(next);
      if (initialService) {
        setServiceId(initialService.id);
        setBookingCategory(initialService.category);
      }
      setState("idle");
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "اطلاعات رزرو دریافت نشد."
      );
    }
  };

  useEffect(() => {
    void loadConfig();
    try {
      (window as any).Telegram?.WebApp?.ready?.();
      (window as any).Telegram?.WebApp?.expand?.();
    } catch {}
  }, []);

  useEffect(() => {
    if (!date) {
      setSlots([]);
      setTime("");
      return;
    }

    let active = true;
    setTime("");
    setMessage("در حال دریافت ساعت‌های قابل رزرو...");

    // The backend resolves the daily schedule from the Jalali date.
    // serviceId is not required by getAvailableSlots_ and is deliberately
    // omitted so the slot request stays compatible with the locked backend.
    apiGet("getAvailableSlots", { date })
      .then((data) => {
        if (!active) return;
        setSlots(Array.isArray(data.slots) ? data.slots : []);
        setMessage(
          Array.isArray(data.slots) && data.slots.length
            ? ""
            : "برای این تاریخ ساعت آزادی وجود ندارد."
        );
      })
      .catch((error) => {
        if (!active) return;
        setSlots([]);
        setMessage(
          error instanceof Error ? error.message : "ساعت‌ها دریافت نشدند."
        );
      });

    return () => {
      active = false;
    };
  }, [date]);

  const checkDiscount = async () => {
    const code = discountCode.trim();
    if (!code || !basePrice) {
      setDiscount({valid:false,percent:0,amount:0});
      return;
    }
    setCheckingDiscount(true);
    setMessage("");
    try {
      const data = await apiGet("validateDiscount", {
        code,
        price: String(basePrice),
        telegramId: getTelegramId(),
      });
      if (data.valid) {
        setDiscount({
          valid:true,
          percent:Number(data.discountPercent)||0,
          amount:Number(data.discountAmount)||0,
        });
        setMessage("کد تخفیف با موفقیت اعمال شد.");
      } else {
        setDiscount({valid:false,percent:0,amount:0});
        setMessage(data.message || "کد تخفیف معتبر نیست.");
      }
    } catch (error) {
      setDiscount({valid:false,percent:0,amount:0});
      setMessage(error instanceof Error ? error.message : "بررسی کد تخفیف ناموفق بود.");
    } finally {
      setCheckingDiscount(false);
    }
  };

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve,reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("خواندن تصویر فیش ناموفق بود."));
      reader.readAsDataURL(file);
    });

  const submit = async () => {
    setMessage("");
    if (!selectedService || !serviceId) return setMessage("لطفاً خدمت موردنظر را انتخاب کن.");
    if (!date || !time) return setMessage("لطفاً تاریخ و ساعت نوبت را انتخاب کن.");
    if (!firstName.trim() || !lastName.trim() || !mobile.trim()) return setMessage("لطفاً نام، نام خانوادگی و شماره موبایل را کامل وارد کن.");
    if (!receiptFile && !transactionNumber.trim()) return setMessage("تصویر فیش یا کد پیگیری پرداخت الزامی است.");
    if (receiptFile && receiptFile.size > 8 * 1024 * 1024) return setMessage("حجم تصویر فیش باید کمتر از ۸ مگابایت باشد.");

    setState("submitting");
    try {
      const requestId = "REQ-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,8).toUpperCase();
      const serviceName = String(selectedService.title || "");
      const telegramId = getTelegramId();

      const create = await apiPost("createBooking", {
        requestId,
        telegramId,
        firstName:firstName.trim(),
        lastName:lastName.trim(),
        mobile:mobile.trim(),
        serviceId,
        serviceName,
        date,
        time,
        discountCode:discountCode.trim(),
      });

      const bookingId = String(create?.booking?.bookingId || create?.bookingId || "");
      if (!bookingId) throw new Error("کد نوبت از سامانه دریافت نشد.");

      let receiptData = "";
      if (receiptFile) receiptData = await fileToDataUrl(receiptFile);

      const payment = await apiPost("submitPayment", {
        requestId,
        bookingId,
        telegramId,
        transactionNumber:transactionNumber.trim(),
        receiptData,
        receiptFileName:receiptFile?.name || "",
        receiptMimeType:receiptFile?.type || "",
      });

      if (!payment?.ok) throw new Error(payment?.message || "ارسال پرداخت ناموفق بود.");

      setTrackingCode(String(create?.booking?.trackingCode || payment?.trackingCode || ""));
      setState("success");
      setMessage("درخواست نوبت و اطلاعات پرداخت با موفقیت ثبت شد و در انتظار بررسی ادمین است.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "هنگام ثبت نوبت مشکلی پیش آمد.");
    }
  };

  if (state === "loading" && !config) {
    return (
      <div className="inner-page">
        <button type="button" onClick={onBack} style={backButtonStyle}>← بازگشت</button>
        <SectionHeaderCard kicker="KAENATCHI" title="رزرو نوبت" description="در حال دریافت خدمات و زمان‌های قابل رزرو..." icon="calendar" />
        <div className="glass-list-card" style={{display:"block",textAlign:"center"}}>
          <div className="list-copy"><strong>در حال آماده‌سازی رزرو...</strong><span>لطفاً چند لحظه صبر کن.</span></div>
        </div>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="inner-page">
        <SectionHeaderCard kicker="BOOKING RECEIVED" title="درخواست ثبت شد" description="اطلاعات نوبت و پرداخت دریافت شد و درخواست برای بررسی ادمین ارسال شده است." icon="check" status="در انتظار تأیید" />
        <div className="glass-list-card" style={{display:"block",textAlign:"center"}}>
          <div className="list-icon" style={{margin:"0 auto 12px"}}><Icon name="ticket" /></div>
          <div className="list-copy">
            <strong>کد پیگیری</strong>
            <span style={{direction:"ltr",fontWeight:700,fontSize:"18px"}}>{trackingCode || "ثبت شد"}</span>
            <span>لطفاً این کد را نگه دار.</span>
          </div>
        </div>
        <button type="button" onClick={onBack} style={{...backButtonStyle, width:"100%", marginTop:"16px"}}>بازگشت</button>
      </div>
    );
  }

  const availableDates = (config?.availableDates || [])
    .filter((item) => {
      const value = normalizeJalaliKey(item.date);
      const today = normalizeJalaliKey(getTodayJalaliKey());
      return value && (!today || value > today);
    })
    .slice(0, 3);

  const availableSlots = slots.filter(
    (slot) => slot.available === true || String(slot.available).toLowerCase() === "true"
  );

  const categoryGroups: Array<{
    id: ServiceCategory;
    title: string;
    icon: IconName;
    items: Service[];
  }> = [
    {
      id: "energy",
      title: "انرژی‌خوانی",
      icon: "energy",
      items: bookingServices.filter((service) => service.category === "energy"),
    },
    {
      id: "candle",
      title: "شمع‌تراپی",
      icon: "candle",
      items: bookingServices.filter((service) => service.category === "candle"),
    },
    {
      id: "psychotherapy",
      title: "سایکو تراپی",
      icon: "conversation",
      items: bookingServices.filter((service) => service.category === "psychotherapy"),
    },
  ];

  const activeGroup = bookingCategory
    ? categoryGroups.find((group) => group.id === bookingCategory) || null
    : null;

  const paymentCardNumber =
    cmsSetting(["booking_card_number", "شماره کارت", "کارت بانکی"]) || "";
  const paymentBank =
    cmsSetting(["booking_bank_name", "نام بانک", "بانک"]) || "";
  const paymentHolder =
    cmsSetting(["booking_card_holder", "صاحب کارت", "نام صاحب کارت", "بنـام"]) || "";
  const paymentNote =
    cmsSetting(["booking_payment_text", "توضیح پرداخت", "متن پرداخت"]) ||
    "پس از پرداخت، تصویر فیش یا کد پیگیری پرداخت را ارسال کن.";

  const inputBaseStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    marginTop: "10px",
    padding: "14px 15px",
    borderRadius: "18px",
    border: "1px solid rgba(53,59,50,.14)",
    background: "rgba(255,255,255,.78)",
    color: "#253128",
    fontFamily: "inherit",
    fontSize: "14px",
    outline: "none",
    transition: "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
  };

  const tapHandlers = {
    onFocus: (event: React.FocusEvent<HTMLInputElement>) => {
      event.currentTarget.style.transform = "translateY(-1px)";
      event.currentTarget.style.boxShadow = "0 8px 20px rgba(53,59,50,.10)";
    },
    onBlur: (event: React.FocusEvent<HTMLInputElement>) => {
      event.currentTarget.style.transform = "translateY(0)";
      event.currentTarget.style.boxShadow = "none";
    },
  };

  const hideKeyboard = (event: React.FocusEvent<HTMLInputElement>) => {
    // Telegram/WebKit does not expose a universal keyboard API. Blurring the
    // active input is the cross-platform native way to dismiss it.
    window.setTimeout(() => {
      try {
        (event.currentTarget as HTMLInputElement).blur();
      } catch {}
    }, 0);
  };

  return (
    <div className="inner-page">
      <button type="button" onClick={onBack} style={backButtonStyle}>← بازگشت</button>
      <SectionHeaderCard
        kicker="KAENATCHI"
        title="رزرو نوبت"
        description="خدمت، تاریخ و ساعت موردنظر را انتخاب کن؛ مبلغ نهایی از سامانه محاسبه می‌شود."
        icon="calendar"
      />

      <div className="glass-list-card booking-glass-card" style={{display:"block"}}>
        <div className="list-copy">
          <strong>۱. انتخاب خدمت</strong>
          <span>یکی از سه دسته را باز کن و خدمت موردنظرت را انتخاب کن.</span>
        </div>

        {initialService && selectedService ? (
          <div style={{marginTop:"12px",padding:"15px",borderRadius:"20px",background:"rgba(36,99,71,.07)",border:"1px solid rgba(36,99,71,.12)"}}>
            <div className="list-copy">
              <strong>{selectedService.title}</strong>
              <span>{selectedService.description || "خدمت انتخاب‌شده"}</span>
              {selectedService.price && (
                <span style={{marginTop:"5px",fontWeight:700}}>
                  {selectedService.price} تومان
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setServiceId("");
                setBookingCategory(null);
                setDiscount({valid:false,percent:0,amount:0});
              }}
              style={{marginTop:"12px",width:"100%"}}
            >
              تغییر خدمت
            </button>
          </div>
        ) : (
          <div style={{display:"grid",gap:"10px",marginTop:"12px"}}>
            {categoryGroups.map((group, index) => (
              <div key={group.id} className="booking-category-shell">
                <button
                  type="button"
                  className="booking-category-trigger"
                  onClick={() =>
                    setBookingCategory((current) =>
                      current === group.id ? null : group.id
                    )
                  }
                  style={{
                    width:"100%",
                    minHeight:"64px",
                    border:"1px solid rgba(53,59,50,.12)",
                    borderRadius:"20px",
                    background: bookingCategory === group.id
                      ? "rgba(36,99,71,.12)"
                      : "rgba(255,255,255,.66)",
                    color:"#26342b",
                    fontFamily:"inherit",
                    boxShadow:"0 8px 22px rgba(53,59,50,.07)",
                    cursor:"pointer",
                    textAlign:"right",
                    padding:"13px 15px",
                    transition:"transform .18s ease, box-shadow .18s ease, background .18s ease",
                  }}
                >
                  <span style={{display:"inline-flex",verticalAlign:"middle",marginLeft:"8px",color:"#246347"}}>
                    <Icon name={group.icon} />
                  </span>
                  <strong>{group.title}</strong>
                  <span style={{display:"block",marginTop:"4px",fontSize:"11px",opacity:.68}}>
                    {group.items.length} خدمت
                  </span>
                </button>

                {bookingCategory === group.id && (
                  <div
                    className="booking-service-menu"
                    style={{
                      display:"grid",
                      gap:"8px",
                      marginTop:"8px",
                      padding:"8px",
                      borderRadius:"20px",
                      background:"rgba(255,255,255,.42)",
                      border:"1px solid rgba(255,255,255,.58)",
                      backdropFilter:"blur(18px)",
                      WebkitBackdropFilter:"blur(18px)",
                      boxShadow:"inset 0 1px 0 rgba(255,255,255,.62), 0 10px 25px rgba(53,59,50,.06)",
                    }}
                  >
                    {group.items.length ? group.items.map((service) => (
                      <button
                        key={service.id}
                        type="button"
                        className="booking-service-option"
                        onClick={() => {
                          setServiceId(service.id);
                          setBookingCategory(group.id);
                          setDiscount({valid:false,percent:0,amount:0});
                          setMessage("");
                        }}
                        style={{
                          width:"100%",
                          textAlign:"right",
                          padding:"13px 14px",
                          border:"1px solid rgba(53,59,50,.09)",
                          borderRadius:"17px",
                          background: serviceId === service.id
                            ? "rgba(36,99,71,.12)"
                            : "rgba(255,255,255,.70)",
                          color:"#26342b",
                          fontFamily:"inherit",
                          boxShadow:"0 6px 17px rgba(53,59,50,.05)",
                          cursor:"pointer",
                          transition:"transform .18s ease, box-shadow .18s ease, background .18s ease",
                        }}
                      >
                        <strong style={{display:"block"}}>{service.title}</strong>
                        {service.price && (
                          <span style={{display:"block",marginTop:"4px",fontSize:"12px",opacity:.76}}>
                            {service.price} تومان
                          </span>
                        )}
                      </button>
                    )) : (
                      <div style={{padding:"13px",borderRadius:"16px",background:"rgba(53,59,50,.06)",fontSize:"12px",color:"#4b564e"}}>
                        هنوز خدمتی در این دسته فعال نیست.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedService && (
          <div style={{marginTop:"12px",fontSize:"12px",lineHeight:1.9,color:"#59655d"}}>
            {selectedService.description}
          </div>
        )}
      </div>

      <div className="glass-list-card booking-glass-card" style={{display:"block"}}>
        <div className="list-copy">
          <strong>۲. انتخاب زمان</strong>
          <span>فقط سه تاریخ آینده نمایش داده می‌شود و هر روز خودکار به‌روزرسانی خواهد شد.</span>
        </div>

        <select
          value={date}
          onChange={(e)=>{
            setDate(e.target.value);
            setTime("");
          }}
          style={{
            ...inputBaseStyle,
            appearance:"none",
            WebkitAppearance:"none",
            marginTop:"12px",
          }}
        >
          <option value="">انتخاب تاریخ</option>
          {availableDates.map((item) => {
            const value=String(item.date||"");
            const label=String(item.dayOfWeek||"") + (item.dayOfWeek ? " — " : "") + value;
            return <option key={value} value={value}>{label}</option>;
          })}
        </select>

        <select
          value={time}
          onChange={(e)=>setTime(e.target.value)}
          disabled={!date}
          style={{
            ...inputBaseStyle,
            appearance:"none",
            WebkitAppearance:"none",
            marginTop:"10px",
            opacity: date ? 1 : .6,
          }}
        >
          <option value="">{date ? (slots.length ? "انتخاب ساعت" : "در حال دریافت ساعت‌ها...") : "ابتدا تاریخ را انتخاب کن"}</option>
          {availableSlots.map((item) => (
            <option key={String(item.time)} value={String(item.time)}>
              {String(item.time)}
            </option>
          ))}
        </select>
      </div>

      <div className="glass-list-card booking-glass-card" style={{display:"block"}}>
        <div className="list-copy">
          <strong>۳. اطلاعات شما</strong>
          <span>اطلاعات واقعی وارد کن؛ این بخش برای جلوگیری از رزروهای تکراری و پرداخت‌های جعلی کنترل می‌شود.</span>
        </div>

        <input
          value={firstName}
          onChange={e=>setFirstName(e.target.value)}
          placeholder="نام"
          autoComplete="given-name"
          enterKeyHint="next"
          style={inputBaseStyle}
          {...tapHandlers}
          onBlur={(e)=>{tapHandlers.onBlur(e);hideKeyboard(e);}}
        />
        <input
          value={lastName}
          onChange={e=>setLastName(e.target.value)}
          placeholder="نام خانوادگی"
          autoComplete="family-name"
          enterKeyHint="next"
          style={inputBaseStyle}
          {...tapHandlers}
          onBlur={(e)=>{tapHandlers.onBlur(e);hideKeyboard(e);}}
        />
        <input
          value={mobile}
          onChange={e=>setMobile(e.target.value)}
          placeholder="09xxxxxxxxx"
          inputMode="tel"
          autoComplete="tel"
          enterKeyHint="done"
          style={inputBaseStyle}
          {...tapHandlers}
          onBlur={(e)=>{tapHandlers.onBlur(e);hideKeyboard(e);}}
        />
      </div>

      <div className="glass-list-card booking-glass-card" style={{display:"block"}}>
        <div className="list-copy">
          <strong>۴. کد تخفیف VIP</strong>
          <span>اگر توکن VIP داری، قبل از پرداخت بررسی‌اش کن.</span>
        </div>

        <div style={{display:"flex",gap:"8px",marginTop:"12px",alignItems:"stretch"}}>
          <input
            value={discountCode}
            onChange={e=>{setDiscountCode(e.target.value.toUpperCase());setDiscount({valid:false,percent:0,amount:0});}}
            placeholder="کد تخفیف"
            enterKeyHint="done"
            style={{...inputBaseStyle,marginTop:0,flex:1}}
            {...tapHandlers}
            onBlur={(e)=>{tapHandlers.onBlur(e);hideKeyboard(e);}}
          />
          <button
            type="button"
            onClick={()=>void checkDiscount()}
            disabled={checkingDiscount || !discountCode.trim() || !basePrice}
            style={{
              width:"112px",
              marginTop:0,
              border:"1px solid rgba(36,99,71,.18)",
              borderRadius:"18px",
              background:"linear-gradient(135deg,#174b38,#2c7658)",
              color:"#fff",
              fontFamily:"inherit",
              fontSize:"13px",
              boxShadow:"0 8px 18px rgba(23,75,56,.16)",
              cursor:"pointer",
            }}
          >
            {checkingDiscount ? "..." : "بررسی"}
          </button>
        </div>

        {discount.valid && (
          <div style={{marginTop:"10px",fontSize:"12px",color:"#246347",fontWeight:600}}>
            تخفیف {discount.percent}% اعمال شد.
          </div>
        )}

        {basePrice > 0 && (
          <div style={{marginTop:"14px",padding:"14px",borderRadius:"18px",background:"rgba(36,99,71,.06)",color:"#26342b"}}>
            <div style={{display:"flex",justifyContent:"space-between",gap:"12px",fontSize:"12px",marginBottom:"7px"}}>
              <span>مبلغ خدمت</span><strong>{basePrice.toLocaleString("fa-IR")} تومان</strong>
            </div>
            {discount.valid && (
              <div style={{display:"flex",justifyContent:"space-between",gap:"12px",fontSize:"12px",marginBottom:"7px"}}>
                <span>تخفیف</span><strong>{discount.amount.toLocaleString("fa-IR")} تومان</strong>
              </div>
            )}
            <div style={{display:"flex",justifyContent:"space-between",gap:"12px",fontSize:"15px",color:"#174b38"}}>
              <strong>مبلغ نهایی</strong><strong>{finalPrice.toLocaleString("fa-IR")} تومان</strong>
            </div>
          </div>
        )}
      </div>

      <div className="glass-list-card booking-glass-card" style={{display:"block"}}>
        <div className="list-copy">
          <strong>۵. پرداخت و رسید</strong>
          <span>{paymentNote}</span>
        </div>

        <div style={{
          marginTop:"14px",
          padding:"16px",
          borderRadius:"20px",
          background:"rgba(165,139,91,.09)",
          border:"1px solid rgba(165,139,91,.18)",
          color:"#26342b",
          boxShadow:"0 8px 20px rgba(53,59,50,.06)",
        }}>
          {paymentCardNumber ? (
            <>
              <div style={{fontSize:"11px",opacity:.68,marginBottom:"5px"}}>شماره کارت</div>
              <b dir="ltr" style={{fontSize:"16px",letterSpacing:"1px"}}>{paymentCardNumber}</b>
              {(paymentBank || paymentHolder) && (
                <div style={{marginTop:"8px",fontSize:"12px"}}>
                  {[paymentBank,paymentHolder].filter(Boolean).join(" · ")}
                </div>
              )}
            </>
          ) : (
            <div style={{fontSize:"12px",lineHeight:1.9}}>
              اطلاعات کارت هنوز در CMS ثبت نشده است.
            </div>
          )}
        </div>

        <input
          value={transactionNumber}
          onChange={e=>setTransactionNumber(e.target.value)}
          placeholder="کد پیگیری پرداخت (اختیاری)"
          inputMode="numeric"
          enterKeyHint="done"
          style={inputBaseStyle}
          {...tapHandlers}
          onBlur={(e)=>{tapHandlers.onBlur(e);hideKeyboard(e);}}
        />

        <label
          style={{
            display:"block",
            marginTop:"14px",
            padding:"16px",
            borderRadius:"20px",
            border:"1px dashed rgba(36,99,71,.35)",
            background:"rgba(36,99,71,.05)",
            color:"#26342b",
            textAlign:"center",
            cursor:"pointer",
            transition:"transform .18s ease, box-shadow .18s ease, background .18s ease",
          }}
          onTouchStart={(e)=>{e.currentTarget.style.transform="scale(.985)";}}
          onTouchEnd={(e)=>{e.currentTarget.style.transform="scale(1)";}}
        >
          📎 {receiptFile ? receiptFile.name : "انتخاب تصویر فیش"}
          <input
            type="file"
            accept="image/*"
            onChange={e=>setReceiptFile(e.target.files?.[0] || null)}
            style={{display:"none"}}
          />
        </label>
      </div>
      {message && (
        <div style={{padding:"13px",borderRadius:"15px",marginTop:"12px",background:state==="error"?"rgba(165,45,45,.08)":"rgba(36,99,71,.08)",color:state==="error"?"#a52d2d":"#246347",fontSize:"13px",lineHeight:1.9,whiteSpace:"pre-line"}}>
          {message}
        </div>
      )}

      <button type="button" onClick={()=>void submit()} disabled={state==="submitting"} style={{width:"100%",marginTop:"16px",border:"none",borderRadius:"18px",padding:"16px",background:"linear-gradient(135deg,#174b38,#2c7658)",color:"#fff",fontFamily:"inherit",fontSize:"15px",cursor:state==="submitting"?"default":"pointer",boxShadow:"0 10px 24px rgba(23,75,56,.2)"}}>
        {state==="submitting" ? "در حال ثبت نوبت و پرداخت..." : "ثبت نهایی نوبت"}
      </button>
    </div>
  );
}

function BottomNav({
  active,
  onChange,
  onQuickDestination,
  onOpenBooking,
}: {
  active: Section;
  onChange: (section: Section) => void;
  onQuickDestination: (destination: "classes" | "events") => void;
  onOpenBooking: () => void;
}) {
  const [quickOpen, setQuickOpen] = useState(false);

  const openBooking = () => {
    setQuickOpen(false);
    onOpenBooking();
  };

  const openQuickSection = (section: Section) => {
    setQuickOpen(false);
    onChange(section);
  };

  return (
    <nav
      className={`bottom-nav ${quickOpen ? "fab-open" : ""}`}
      aria-label="ناوبری اصلی"
    >
      <button
        type="button"
        className={`nav-item ${active === "home" ? "active" : ""}`}
        onClick={() => {
          setQuickOpen(false);
          onChange("home");
        }}
      >
        <span className="nav-icon"><Icon name="home" /></span>
        <span>خانه</span>
      </button>

      <button
        type="button"
        className={`nav-item ${active === "services" ? "active" : ""}`}
        onClick={() => {
          setQuickOpen(false);
          onChange("services");
        }}
      >
        <span className="nav-icon"><Icon name="energy" /></span>
        <span>خدمات</span>
      </button>

      <div className="nav-fab-slot">
        <button
          type="button"
          className={`nav-fab ${quickOpen ? "open" : ""}`}
          onClick={() => setQuickOpen((value) => !value)}
          aria-expanded={quickOpen}
          aria-label={quickOpen ? "بستن میانبرها" : "باز کردن میانبرها"}
        >
          <span className="nav-fab-plus">{quickOpen ? "×" : "+"}</span>
        </button>

        <div className="nav-fab-actions" aria-hidden={!quickOpen}>
          <button
            type="button"
            className={`nav-fab-action action-booking ${quickOpen ? "visible" : ""}`}
            onClick={openBooking}
            tabIndex={quickOpen ? 0 : -1}
          >
            <span className="nav-fab-action-icon"><Icon name="calendar" /></span>
            <span>رزرو نوبت</span>
          </button>

          <button
            type="button"
            className={`nav-fab-action action-class ${quickOpen ? "visible" : ""}`}
            onClick={() => { setQuickOpen(false); onQuickDestination("classes"); }}
            tabIndex={quickOpen ? 0 : -1}
          >
            <span className="nav-fab-action-icon"><Icon name="class" /></span>
            <span>کلاس‌ها</span>
          </button>

          <button
            type="button"
            className={`nav-fab-action action-event ${quickOpen ? "visible" : ""}`}
            onClick={() => { setQuickOpen(false); onQuickDestination("events"); }}
            tabIndex={quickOpen ? 0 : -1}
          >
            <span className="nav-fab-action-icon"><Icon name="event" /></span>
            <span>ایونت‌ها</span>
          </button>
        </div>
      </div>

      <button
        type="button"
        className={`nav-item ${active === "selected" ? "active" : ""}`}
        onClick={() => {
          setQuickOpen(false);
          onChange("selected");
        }}
      >
        <span className="nav-icon"><Icon name="spark" /></span>
        <span>منتخب</span>
      </button>

      <button
        type="button"
        className={`nav-item ${active === "more" ? "active" : ""}`}
        onClick={() => {
          setQuickOpen(false);
          onChange("more");
        }}
      >
        <span className="nav-icon"><Icon name="dots" /></span>
        <span>بیشتر</span>
      </button>
    </nav>
  );
}


/* =========================================================
   APP
========================================================= */

function App() {
  const sectionOrder: Section[] = ["home", "services", "booking", "selected", "more"];

  const [section, setSection] = useState<Section>("home");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchService, setSearchService] = useState<Service | null>(null);
  const [bookingService, setBookingService] = useState<Service | null>(null);
  const [vipOpen, setVipOpen] = useState(false);
  const [serviceFocus, setServiceFocus] = useState<"all" | "classes" | "events">("all");
  const [navDirection, setNavDirection] = useState<"forward" | "backward">("forward");

  const touchStart = useRef<{ x: number; y: number; identifier: number } | null>(null);
  const [cmsReady, setCmsReady] = useState(false);
  const [cmsLoading, setCmsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    loadCmsData().then((ready) => {
      if (!mounted) return;
      setCmsReady(ready);
      setCmsLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let telegramWebApp: any = null;
    let cleanupViewportListener: (() => void) | null = null;

    const applyTelegramViewport = (webApp: any) => {
      telegramWebApp = webApp;

      try {
        webApp.ready?.();
        webApp.expand?.();

        const updateViewportHeight = () => {
          const viewportHeight = Number(webApp.viewportHeight);
          if (Number.isFinite(viewportHeight) && viewportHeight > 0) {
            document.documentElement.style.setProperty(
              "--tg-viewport-height",
              `${viewportHeight}px`
            );
          }
        };

        updateViewportHeight();

        if (typeof webApp.onEvent === "function") {
          webApp.onEvent("viewportChanged", updateViewportHeight);
          cleanupViewportListener = () => {
            if (typeof webApp.offEvent === "function") {
              webApp.offEvent("viewportChanged", updateViewportHeight);
            }
          };
        }
      } catch {
        // The app also works normally when opened outside Telegram.
      }
    };

    const existingWebApp = (window as any).Telegram?.WebApp;

    if (existingWebApp) {
      applyTelegramViewport(existingWebApp);
    } else if (
      typeof document !== "undefined" &&
      !document.querySelector(
        'script[data-kaenatchi-telegram-webapp="true"]'
      )
    ) {
      const script = document.createElement("script");
      script.src = TELEGRAM_WEBAPP_SCRIPT;
      script.async = true;
      script.dataset.kaenatchiTelegramWebapp = "true";
      script.onload = () => {
        const webApp = (window as any).Telegram?.WebApp;
        if (webApp) {
          applyTelegramViewport(webApp);
        }
      };
      document.head.appendChild(script);
    }

    return () => {
      cleanupViewportListener?.();
      telegramWebApp = null;
    };
  }, []);

  const changeSection = (nextSection: Section) => {
    if (nextSection === section) return;

    const currentIndex = sectionOrder.indexOf(section);
    const nextIndex = sectionOrder.indexOf(nextSection);

    setNavDirection(nextIndex > currentIndex ? "forward" : "backward");
    setSection(nextSection);
  };

  // Reset scroll after React commits the new section. This prevents the browser
  // from carrying the previous section's document position into the new page.
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const resetScroll = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    resetScroll();

    const frame = window.requestAnimationFrame(() => {
      resetScroll();
      window.setTimeout(resetScroll, 0);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [section]);

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1) {
      touchStart.current = null;
      return;
    }

    const touch = event.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      identifier: touch.identifier,
    };
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStart.current;
    if (!start) return;

    const touch = Array.from(event.changedTouches).find(
      (item) => item.identifier === start.identifier
    );

    touchStart.current = null;
    if (!touch) return;

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX < 45 || absX <= absY * 1.35) return;

    const currentIndex = sectionOrder.indexOf(section);

    if (deltaX < 0 && currentIndex < sectionOrder.length - 1) {
      changeSection(sectionOrder[currentIndex + 1]);
    } else if (deltaX > 0 && currentIndex > 0) {
      changeSection(sectionOrder[currentIndex - 1]);
    }
  };

  const handleTouchCancel = () => {
    touchStart.current = null;
  };

  if (cmsLoading) {
    return (
      <div className="app-shell app-shell-loading">
        <div className="cms-loading-card">
          <div className="cms-loading-mark">✦</div>
          <strong>در حال آماده‌سازی کائنات‌چی</strong>
          <span>در حال دریافت تازه‌ترین محتوا...</span>
        </div>
      </div>
    );
  }

  if (!cmsReady) {
    return (
      <div className="app-shell app-shell-loading">
        <div className="cms-loading-card">
          <div className="cms-loading-mark">!</div>
          <strong>محتوا در دسترس نیست</strong>
          <span>اتصال به سامانه محتوا برقرار نشد. لطفاً چند لحظه بعد دوباره تلاش کن.</span>
        </div>
      </div>
    );
  }

  const openSearch = () => {
    setVipOpen(false);
    setSearchService(null);
    setSearchOpen(true);
  };

  const openQuickDestination = (destination: "classes" | "events") => {
    setSearchOpen(false);
    setSearchService(null);
    setVipOpen(false);
    setServiceFocus(destination);
    changeSection("services");
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchService(null);
  };

  const openVip = () => {
    setSearchOpen(false);
    setSearchService(null);
    setVipOpen(true);
  };

  if (vipOpen) {
    return (
      <div className="app-shell app-shell-special">
        {bookingThemeStyle}
      <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <VipPage onBack={() => setVipOpen(false)} />
        <AppFooter />
      </div>
    );
  }

  if (searchOpen) {
    if (searchService) {
      return (
        <div className="app-shell app-shell-special">
          <div className="ambient ambient-one" />
          <div className="ambient ambient-two" />
          <ServiceDetail
            service={searchService}
            onBack={() => setSearchService(null)}
            onOpenBooking={() => {
              setBookingService(searchService);
              setSearchOpen(false);
              setSearchService(null);
              changeSection("booking");
            }}
          />
          <AppFooter />
        </div>
      );
    }

    return (
      <div className="app-shell app-shell-special">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <SearchPage
          onBack={closeSearch}
          onOpenService={(service) => setSearchService(service)}
        />
        <AppFooter />
      </div>
    );
  }

  const bookingThemeStyle = (
    <style>{`
      .booking-glass-card input::placeholder { color: #69746d; opacity: 1; }
      .booking-glass-card select { color: #253128; }
      .booking-glass-card option { color: #253128; background: #ffffff; }
      @media (prefers-color-scheme: dark) {
        .booking-glass-card input,
        .booking-glass-card select {
          color: #f2f5f1 !important;
          background: rgba(42,48,43,.88) !important;
          border-color: rgba(255,255,255,.14) !important;
        }
        .booking-glass-card input::placeholder { color: #b9c2bb !important; }
        .booking-glass-card select { color-scheme: dark; }
        .booking-glass-card option { color: #f2f5f1; background: #2a302b; }
        .booking-glass-card .list-copy strong,
        .booking-glass-card .list-copy span,
        .booking-glass-card label,
        .booking-glass-card button { text-shadow: none; }
      }
    `}</style>
  );

  return (
    <div
      className="app-shell"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <div
        key={section}
        className={`section-page section-page-${navDirection}`}
      >
        {section === "home" && (
          <HomePage
            onSearch={openSearch}
            onOpenVip={openVip}
          />
        )}

        {section === "services" && (
          <ServicesPage
            focus={serviceFocus}
            onOpenBooking={(service?: Service) => {
              setBookingService(service || null);
              changeSection("booking");
            }}
          />
        )}

        {section === "booking" && (
          <BookingPage
            initialService={bookingService}
            onBack={() => {
              setBookingService(null);
              changeSection("home");
            }}
          />
        )}

        {section === "selected" && (
          <SelectedPage
            onNavigate={changeSection}
            onOpenService={(service) => {
              setSearchOpen(true);
              setSearchService(service);
            }}
          />
        )}

        {section === "more" && <MorePage onSearch={openSearch} />}
      </div>

      <AppFooter />

      <BottomNav
        active={section}
        onChange={changeSection}
        onQuickDestination={openQuickDestination}
        onOpenBooking={() => {
          setBookingService(null);
          changeSection("booking");
        }}
      />
    </div>
  );
}


export default App;