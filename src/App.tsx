import { useEffect, useState } from "react";

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
  history?: unknown[][];
  payments?: unknown[][];
  tokens?: VipToken[];
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

function HomePage({
  onSearch,
}: {
  onSearch: () => void;
}) {
  const today = getTodayJalali();

  return (
    <>
      <header className="topbar">
        <div className="brand-area">
          <div
            className="logo-placeholder"
            aria-hidden="true"
          >
            <Icon name="spark" />
          </div>

          <div className="brand-copy">
            <div className="brand-name">
              کائنات‌چی
            </div>

            <div className="brand-tagline">
              رزرو نوبت و مشاهده خدمات
            </div>
          </div>
        </div>

        <div
          className="date-pill"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span className="date-dot" />
          {today}
        </div>
      </header>

      <main className="main-content">
        <button
          type="button"
          onClick={onSearch}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            border:
              "1px solid rgba(53,59,50,0.1)",
            borderRadius: "18px",
            padding: "13px 15px",
            marginBottom: "16px",
            background:
              "rgba(255,255,255,0.62)",
            color: "#73786f",
            fontFamily: "inherit",
            fontSize: "13px",
            cursor: "pointer",
            boxShadow:
              "0 7px 20px rgba(53,59,50,0.07)",
            textAlign: "right",
          }}
        >
          <Icon name="search" />
          <span>جست‌وجو در کائنات‌چی...</span>
        </button>

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

        <section className="welcome-section">
          <h2>به کائنات‌چی خوش آمدی 🌿</h2>

          <p>
            از خدمات و انرژی‌خوانی تا کلاس‌ها، ایونت‌ها و باشگاه
            VIP؛ مسیرت را از منوی پایین پیدا کن.
          </p>
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

function ServicesPage() {
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
            fontSize: "14px",
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
            style={{
              width: "58px",
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
  // پاسخ VIP ممکن است به‌صورت آرایه‌ای از آبجکت‌ها، ردیف‌های Sheet
  // یا آبجکت تو در تو برگردد. اینجا همه فرمت‌های رایج را یکدست می‌کنیم.
  const source =
    Array.isArray(value)
      ? value
      : value && typeof value === "object"
        ? (() => {
            const obj = value as Record<string, unknown>;
            for (const key of ["tokens", "data", "items", "rows", "result"]) {
              if (Array.isArray(obj[key])) return obj[key];
            }
            return [];
          })()
        : [];

  const read = (obj: Record<string, unknown>, aliases: string[]) => {
    const normalized = new Map<string, unknown>();
    Object.entries(obj).forEach(([key, val]) => {
      normalized.set(
        key
          .trim()
          .toLowerCase()
          .replace(/[\s_-]+/g, ""),
        val
      );
    });

    for (const alias of aliases) {
      const value = normalized.get(
        alias.toLowerCase().replace(/[\s_-]+/g, "")
      );
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        return value;
      }
    }
    return "";
  };

  return source
    .map((raw): VipToken | null => {
      if (Array.isArray(raw)) {
        // فرمت قدیمی Sheet: code, customerId, discount, issuedAt, expiresAt, status, usedAt, trackingCode
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
      const code = read(obj, [
        "code", "token", "tokenCode", "token_code", "coupon", "couponCode",
        "کد", "توکن", "توکن اختصاصی"
      ]);
      const customerId = read(obj, [
        "customerId", "customer_id", "customer", "vipId", "vip_id", "شناسه مشتری"
      ]);
      const discount = read(obj, [
        "discount", "discountPercent", "discount_percentage", "percent",
        "discountValue", "درصد تخفیف", "تخفیف"
      ]);
      const issuedAt = read(obj, [
        "issuedAt", "issued_at", "issueDate", "issue_date", "createdAt",
        "created_at", "dateIssued", "تاریخ صدور"
      ]);
      const expiresAt = read(obj, [
        "expiresAt", "expires_at", "expiryDate", "expiry_date", "expireAt",
        "expire_at", "تاریخ انقضا"
      ]);
      const status = read(obj, [
        "status", "tokenStatus", "token_status", "وضعیت"
      ]);
      const usedAt = read(obj, [
        "usedAt", "used_at", "تاریخ استفاده"
      ]);
      const trackingCode = read(obj, [
        "trackingCode", "tracking_code", "کد پیگیری"
      ]);

      return {
        code: String(code ?? "").trim(),
        customerId: String(customerId ?? "").trim(),
        discount: String(discount ?? ""),
        discountPercent: String(discount ?? ""),
        issuedAt: issuedAt == null ? "" : String(issuedAt),
        expiresAt: expiresAt == null ? "" : String(expiresAt),
        status: status == null ? "" : String(status),
        usedAt: usedAt == null ? "" : String(usedAt),
        trackingCode: trackingCode == null ? "" : String(trackingCode),
      };
    })
    .filter((token): token is VipToken => token !== null);
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
          : {}),
      }),
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
        setVipTokens(
          Array.isArray(result.tokens)
            ? result.tokens.filter(
                (token): token is VipToken =>
                  !!token &&
                  typeof token === "object" &&
                  !Array.isArray(token)
              )
            : []
        );
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

  if (
    activePanel ===
    "bookings"
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

            <strong>
              {vipCustomer.bookingsCount
                ? `${vipCustomer.bookingsCount} نوبت ثبت شده`
                : "هنوز نوبتی ثبت نشده"}
            </strong>


            <span>
              سوابق نوبت‌ها در مرحله بعد از اتصال کامل
              سیستم رزرو نمایش داده خواهد شد.
            </span>

          </div>

        </div>

      </div>
    );
  }


  /* =====================================================
     PAYMENTS
  ===================================================== */

  if (
    activePanel ===
    "payments"
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

            <strong>
              پرداخت‌ها
            </strong>


            <span>
              سوابق پرداخت VIP در مرحله بعد از تکمیل اتصال
              اطلاعات پرداخت نمایش داده خواهد شد.
            </span>

          </div>

        </div>

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


        <div style={{ display: "grid", gap: "12px" }}>
          {vipTokens.length > 0 ? (
            vipTokens.map((token, index) => {
              const code = String(token.code ?? "").trim();
              const rawDiscount =
                token.discount ??
                token.discountPercent ??
                "";
              const discountNumber = Number(
                String(rawDiscount)
                  .replace(/٪/g, "%")
                  .replace("%", "")
                  .trim()
              );
              const discount =
                Number.isFinite(discountNumber) && discountNumber > 0
                  ? String(discountNumber)
                  : String(rawDiscount).trim();
              const status = String(token.status ?? "").trim();
              const expiresAt = String(token.expiresAt ?? "").trim();
              const issuedAt = String(token.issuedAt ?? "").trim();

              return (
                <div
                  key={index}
                  className="glass-list-card"
                  style={{
                    border: "1px solid rgba(165, 139, 91, 0.25)",
                    display: "block",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "12px",
                    }}
                  >
                    <div className="list-icon">
                      <Icon name="ticket" />
                    </div>

                    <div className="list-copy">
                      <strong>{code || "توکن VIP"}</strong>
                      <span>
                        {discount !== ""
                          ? `تخفیف ${String(discount).replace(/%/g, "").trim()}٪`
                          : "توکن اختصاصی VIP"}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gap: "6px",
                      fontSize: "12px",
                      color: "#73786f",
                      lineHeight: 1.8,
                    }}
                  >
                    {status !== "" && (
                      <span>وضعیت: {String(status)}</span>
                    )}
                    {issuedAt !== "" && (
                      <span>
                        تاریخ صدور: {formatVipJalaliDate(issuedAt)}
                      </span>
                    )}
                    {expiresAt !== "" && (
                      <span>
                        تاریخ انقضا: {formatVipJalaliDate(expiresAt)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div
              className="glass-list-card"
              style={{ display: "block", textAlign: "center" }}
            >
              <div
                className="list-icon"
                style={{ margin: "0 auto 12px" }}
              >
                <Icon name="ticket" />
              </div>

              <div className="list-copy">
                <strong>هنوز توکنی برای شما ثبت نشده</strong>
                <span>
                  هر توکن تخفیف اختصاصی پس از صدور در این قسمت نمایش داده می‌شود.
                </span>
              </div>
            </div>
          )}
        </div>



        <div
          style={{
            marginTop: "14px",
            padding: "16px",
            borderRadius: "18px",
            background:
              "rgba(165, 139, 91, 0.08)",
            border:
              "1px solid rgba(165, 139, 91, 0.15)",
          }}
        >

          <div
            style={{
              display: "flex",
              alignItems:
                "center",
              gap: "9px",
              color:
                "#8a7348",
              marginBottom:
                "7px",
            }}
          >

            <Icon name="spark" />

            <strong>
              تخفیف VIP
            </strong>

          </div>


          <span
            style={{
              fontSize: "13px",
              lineHeight: 1.8,
            }}
          >
            تخفیف‌های VIP برای انرژی‌خوانی، کلاس‌ها و
            ایونت‌ها در ادامه به‌صورت امن از سمت سرور مدیریت
            خواهند شد.
          </span>

        </div>


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


      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
          gap: "10px",
        }}
      >

        <button
          type="button"
          className="glass-list-card"
          onClick={() =>
            setActivePanel(
              "bookings"
            )
          }
          style={vipTileStyle}
        >

          <div className="list-icon">
            <Icon name="calendar" />
          </div>


          <div className="list-copy">

            <strong>
              نوبت‌های من
            </strong>


            <span>
              مشاهده و پیگیری نوبت‌های ثبت‌شده شما
            </span>

          </div>

        </button>


        <button
          type="button"
          className="glass-list-card"
          onClick={() =>
            setActivePanel(
              "payments"
            )
          }
          style={vipTileStyle}
        >

          <div className="list-icon">
            <Icon name="card" />
          </div>


          <div className="list-copy">

            <strong>
              پرداخت‌ها
            </strong>


            <span>
              مشاهده سوابق پرداخت‌های شما
            </span>

          </div>

        </button>


        <button
          type="button"
          className="glass-list-card"
          onClick={() =>
            setActivePanel(
              "tokens"
            )
          }
          style={vipTileStyle}
        >

          <div className="list-icon">
            <Icon name="ticket" />
          </div>


          <div className="list-copy">

            <strong>
              توکن‌ها
            </strong>


            <span>
              مشاهده و استفاده از تخفیف‌های اختصاصی VIP
            </span>

          </div>

        </button>


        <button
          type="button"
          className="glass-list-card"
          onClick={openBookingApp}
          style={vipTileStyle}
        >
          <div className="list-icon">
            <Icon name="calendar" />
          </div>
          <div className="list-copy">
            <strong>دریافت نوبت</strong>
            <span>انتخاب خدمت، تاریخ و ساعت نوبت</span>
          </div>
        </button>


        <button
          type="button"
          className="glass-list-card"
          onClick={() =>
            setActivePanel(
              "profile"
            )
          }
          style={vipTileStyle}
        >

          <div className="list-icon">
            <Icon name="user" />
          </div>


          <div className="list-copy">

            <strong>
              پروفایل
            </strong>


            <span>
              مشاهده اطلاعات و وضعیت عضویت شما
            </span>

          </div>

        </button>

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
        icon="menu"
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
}: {
  active: Section;
  onChange: (
    section: Section
  ) => void;
}) {

  return (
    <nav className="bottom-nav">

      <button
        type="button"
        className={`nav-item ${
          active === "home"
            ? "active"
            : ""
        }`}
        onClick={() =>
          onChange("home")
        }
      >

        <span className="nav-icon">
          <Icon name="home" />
        </span>

        <span>خانه</span>

      </button>


      <button
        type="button"
        className={`nav-item ${
          active === "services"
            ? "active"
            : ""
        }`}
        onClick={() =>
          onChange(
            "services"
          )
        }
      >

        <span className="nav-icon">
          <Icon name="spark" />
        </span>

        <span>خدمات</span>

      </button>


      <button
        type="button"
        className={`nav-item ${
          active === "more"
            ? "active"
            : ""
        }`}
        onClick={() =>
          onChange("more")
        }
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
   APP
========================================================= */

function App() {

  const [section, setSection] =
    useState<Section>("home");


  const [searchOpen, setSearchOpen] =
    useState(false);


  const [searchService, setSearchService] =
    useState<Service | null>(
      null
    );


  const openSearch = () => {

    setSearchService(null);

    setSearchOpen(true);
  };


  const closeSearch = () => {

    setSearchOpen(false);

    setSearchService(null);
  };


  if (searchOpen) {

    if (searchService) {

      return (
        <div className="app-shell">

          <div className="ambient ambient-one" />
          <div className="ambient ambient-two" />


          <ServiceDetail
            service={searchService}
            onBack={() =>
              setSearchService(
                null
              )
            }
          />

        </div>
      );
    }


    return (
      <div className="app-shell">

        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />


        <SearchPage
          onBack={closeSearch}
          onOpenService={(
            service
          ) =>
            setSearchService(
              service
            )
          }
        />

      </div>
    );
  }


  return (
    <div className="app-shell">

      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />


      {section === "home" && (
        <HomePage
          onSearch={openSearch}
        />
      )}


      {section === "services" && (
        <ServicesPage />
      )}


      {section === "more" && (
        <MorePage
          onSearch={openSearch}
        />
      )}


      <BottomNav
        active={section}
        onChange={setSection}
      />

    </div>
  );
}


export default App;
