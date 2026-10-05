import { useEffect, useLayoutEffect, useRef, useState, type TouchEvent } from "react";

type Section = "home" | "services" | "selected" | "more";

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
  | "psychotherapy";

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

const publishedClasses: SearchItem[] = [];
const publishedEvents: SearchItem[] = [];
const publishedFaq: SearchItem[] = [];

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
        onClick={() => {
          window.open(
            BOOKING_APP_URL,
            "_blank"
          );
        }}
      >
        📅 دریافت نوبت
      </button>
    </div>
  );
}

function ServicesPage({ focus }: { focus?: "all" | "classes" | "events" }) {
  const [activeTab, setActiveTab] =
    useState<"all" | ServiceCategory>(
      "all"
    );

  const [
    selectedService,
    setSelectedService,
  ] = useState<Service | null>(null);

  if (selectedService) {
    return (
      <ServiceDetail
        service={selectedService}
        onBack={() =>
          setSelectedService(null)
        }
      />
    );
  }

  let visibleServices: Service[];

  if (activeTab === "all") {
    visibleServices = mainServices;
  } else if (
    activeTab === "energy"
  ) {
    visibleServices = energyServices;
  } else {
    visibleServices =
      mainServices.filter(
        (service) =>
          service.category ===
          activeTab
      );
  }

  return (
    <div className="inner-page">
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

      <div className="services-lobby-links" aria-label="بخش‌های آموزشی و رویدادها">
        <button
          type="button"
          className={`services-lobby-card ${focus === "classes" ? "is-focused" : ""}`}
          onClick={() => {
            const target = document.getElementById("services-classes");
            target?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
        >
          <span className="services-lobby-icon"><Icon name="class" /></span>
          <span className="services-lobby-copy">
            <strong>کلاس‌ها</strong>
            <span>آموزش‌ها و دوره‌های کائنات‌چی</span>
          </span>
          <span className="list-arrow"><Icon name="arrow" /></span>
        </button>

        <button
          type="button"
          className={`services-lobby-card ${focus === "events" ? "is-focused" : ""}`}
          onClick={() => {
            const target = document.getElementById("services-events");
            target?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
        >
          <span className="services-lobby-icon"><Icon name="event" /></span>
          <span className="services-lobby-copy">
            <strong>ایونت‌ها</strong>
            <span>رویدادها و برنامه‌های پیش رو</span>
          </span>
          <span className="list-arrow"><Icon name="arrow" /></span>
        </button>
      </div>

      <div className="service-list">
        {visibleServices.map(
          (service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onClick={() => {
                if (
                  service.id ===
                  "energy-reading"
                ) {
                  setActiveTab(
                    "energy"
                  );
                  return;
                }

                setSelectedService(
                  service
                );
              }}
            />
          )
        )}
      </div>

      <div className="services-content-lobby">
        <section id="services-classes" className={`services-content-card ${focus === "classes" ? "is-focused" : ""}`}>
          <div className="services-content-icon"><Icon name="class" /></div>
          <div className="list-copy">
            <strong>کلاس‌ها</strong>
            {publishedClasses.length > 0
              ? publishedClasses.map(item => <span key={item.id}>{item.title} — {item.description}</span>)
              : <span>آموزش‌ها و دوره‌های کائنات‌چی در این بخش قرار می‌گیرند.</span>}
          </div>
        </section>

        <section id="services-events" className={`services-content-card ${focus === "events" ? "is-focused" : ""}`}>
          <div className="services-content-icon"><Icon name="event" /></div>
          <div className="list-copy">
            <strong>ایونت‌ها</strong>
            {publishedEvents.length > 0
              ? publishedEvents.map(item => <span key={item.id}>{item.title} — {item.description}</span>)
              : <span>رویدادها و برنامه‌های پیش روی کائنات‌چی در این بخش قرار می‌گیرند.</span>}
          </div>
        </section>
      </div>
    </div>
  );
}


function SelectedPage() {
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
      badge: "خدمت منتخب",
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
  const selected = rotated.slice(0, Math.min(5, rotated.length));

  return (
    <div className="inner-page selected-page">
      <SectionHeaderCard
        kicker="KAENATCHI"
        title="منتخب"
        description="چند انتخاب از میان خدمات، کلاس‌ها و ایونت‌های کائنات‌چی؛ این بخش با تغییر روز، انتخاب‌های تازه‌ای نشان می‌دهد."
        icon="spark"
      />
      {selected.length > 0 ? (
        <div className="selected-list">
          {selected.map((item) => (
            <div className="selected-card" key={item.id}>
              <div className="selected-card-icon"><Icon name={item.icon} /></div>
              <div className="list-copy">
                <small>{item.badge}</small>
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </div>
              <div className="list-arrow"><Icon name="arrow" /></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-list-card selected-empty" style={{ display: "block", textAlign: "center" }}>
          <div className="list-icon" style={{ margin: "0 auto 12px" }}><Icon name="spark" /></div>
          <div className="list-copy">
            <strong>منتخب‌های کائنات‌چی</strong>
            <span>با فعال شدن کلاس‌ها و ایونت‌ها، انتخاب‌های تازه به‌صورت خودکار در این بخش قرار می‌گیرند.</span>
          </div>
        </div>
      )}
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
  const match = text.match(/^(\\d{3})[\\/-](\\d{1,2})[\\/-](\\d{1,2})(.*)$/);
  if (match) {
    const year = Number(match[1]);
    if (year >= 700 && year < 900) {
      return `1405/${String(Number(match[2])).padStart(2, "0")}/${String(Number(match[3])).padStart(2, "0")}${match[4] || ""}`;
    }
  }
  return text;
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

  return telegramWebApp.initData || null;
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

function VipPage({
  onBack,
}: {
  onBack: () => void;
}) {

  const [activePanel, setActivePanel] =
    useState<
      | "dashboard"
      | "bookings"
      | "payments"
      | "tokens"
      | "experiences"
      | "classes"
      | "events"
      | "profile"
    >("dashboard");


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
        kicker={
          title === "کلاس‌ها"
            ? "CLASSES"
            : title ===
                "ایونت‌ها"
              ? "EVENTS"
              : title ===
                  "سوالات متداول"
                ? "FAQ"
                : title ===
                    "ساعات کاری"
                  ? "HOURS"
                  : "CONTACT"
        }
        title={title}
        description={
          description
        }
        icon={icon}
      />


      <div className="glass-list-card">

        <div className="list-copy">

          <strong>
            {title}
          </strong>


          <span>
            این بخش به‌صورت اختصاصی برای محتوای {title}
            کائنات‌چی طراحی می‌شود.
          </span>

        </div>

      </div>

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
    useState<
      (typeof moreItems)[number] | null
    >(null);


  if (
    selected?.id ===
    "vip"
  ) {

    return (
      <VipPage
        onBack={() =>
          setSelected(null)
        }
      />
    );
  }


  if (selected) {

    return (
      <MoreDetail
        title={selected.title}
        icon={selected.icon}
        description={
          selected.description
        }
        onBack={() =>
          setSelected(null)
        }
      />
    );
  }


  return (
    <div className="inner-page">

      <SectionHeaderCard
        kicker="MORE"
        title="بیشتر"
        description="بخش‌های دیگر کائنات‌چی را از اینجا دنبال کن."
        icon="dots"
      />


      <button
        type="button"
        onClick={onSearch}
        style={{
          width: "100%",
          display: "flex",
          alignItems:
            "center",
          gap: "10px",
          border:
            "1px solid rgba(53,59,50,0.1)",
          borderRadius:
            "18px",
          padding:
            "13px 15px",
          marginBottom:
            "14px",
          background:
            "rgba(255,255,255,0.62)",
          color:
            "#73786f",
          fontFamily:
            "inherit",
          fontSize:
            "13px",
          cursor:
            "pointer",
          boxShadow:
            "0 7px 20px rgba(53,59,50,0.07)",
          textAlign:
            "right",
        }}
      >

        <Icon name="search" />

        <span>
          جست‌وجو در کائنات‌چی...
        </span>

      </button>


      <div className="more-list">

        {moreItems.map(
          (item) => (

            <button
              key={item.id}
              type="button"
              className="glass-list-card"
              onClick={() =>
                setSelected(
                  item
                )
              }
              style={{
                width: "100%",
                border: "none",
                textAlign:
                  "right",
                cursor:
                  "pointer",
                fontFamily:
                  "inherit",
              }}
            >

              <div className="list-icon">
                <Icon
                  name={
                    item.icon
                  }
                />
              </div>


              <div className="list-copy">

                <strong>
                  {item.title}
                </strong>


                <span>
                  {item.description}
                </span>

              </div>


              <div className="list-arrow">
                <Icon name="arrow" />
              </div>

            </button>

          )
        )}

      </div>

    </div>
  );
}


/* =========================================================
   BOTTOM NAV
========================================================= */

function BottomNav({
  active,
  onChange,
  onQuickDestination,
}: {
  active: Section;
  onChange: (section: Section) => void;
  onQuickDestination: (destination: "classes" | "events") => void;
}) {
  const [quickOpen, setQuickOpen] = useState(false);

  const openBooking = () => {
    setQuickOpen(false);
    window.location.assign(BOOKING_APP_URL);
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
        <span className="nav-icon"><Icon name="spark" /></span>
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
            onClick={() => onQuickDestination("classes")}
            tabIndex={quickOpen ? 0 : -1}
          >
            <span className="nav-fab-action-icon"><Icon name="class" /></span>
            <span>کلاس‌ها</span>
          </button>

          <button
            type="button"
            className={`nav-fab-action action-event ${quickOpen ? "visible" : ""}`}
            onClick={() => onQuickDestination("events")}
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
  const sectionOrder: Section[] = ["home", "services", "selected", "more"];

  const [section, setSection] = useState<Section>("home");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchService, setSearchService] = useState<Service | null>(null);
  const [vipOpen, setVipOpen] = useState(false);
  const [serviceFocus, setServiceFocus] = useState<"all" | "classes" | "events">("all");
  const [navDirection, setNavDirection] = useState<"forward" | "backward">("forward");

  const touchStart = useRef<{ x: number; y: number; identifier: number } | null>(null);

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

        {section === "services" && <ServicesPage focus={serviceFocus} />}

        {section === "selected" && <SelectedPage />}

        {section === "more" && <MorePage onSearch={openSearch} />}
      </div>

      <AppFooter />

      <BottomNav
        active={section}
        onChange={changeSection}
        onQuickDestination={openQuickDestination}
      />
    </div>
  );
}


export default App;