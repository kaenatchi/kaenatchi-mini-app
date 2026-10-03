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
  | "contact";

const services = [
  {
    title: "انرژی‌خوانی",
    description: "شناخت و بررسی انرژی در فضایی آرام و شخصی",
    icon: "energy" as IconName,
  },
  {
    title: "شمع‌تراپی",
    description: "جلسات ریموت برای آرامش، تمرکز و همراهی",
    icon: "candle" as IconName,
  },
  {
    title: "سایکوتراپی",
    description: "گفت‌وگوی تلفنی برای بررسی مسائل و تجربه‌های شخصی",
    icon: "conversation" as IconName,
  },
];

const moreItems = [
  {
    title: "VIP کائنات‌چی",
    description: "دسترسی به فضای ویژه و امکانات VIP",
    icon: "crown" as IconName,
  },
  {
    title: "کلاس‌ها",
    description: "کلاس‌ها و آموزش‌های کائنات‌چی",
    icon: "class" as IconName,
  },
  {
    title: "رویدادها",
    description: "برنامه‌ها و رویدادهای پیش‌رو",
    icon: "event" as IconName,
  },
  {
    title: "سؤالات متداول",
    description: "پاسخ پرسش‌های متداول شما",
    icon: "faq" as IconName,
  },
  {
    title: "ساعات کاری",
    description: "زمان پاسخ‌گویی و ارائه خدمات",
    icon: "clock" as IconName,
  },
  {
    title: "ارتباط با ما",
    description: "راه‌های ارتباطی کائنات‌چی",
    icon: "contact" as IconName,
  },
];

function Icon({
  name,
  size = 22,
}: {
  name: IconName;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.55,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="M3.5 10.7 12 3.8l8.5 6.9" />
          <path d="M5.5 9.7v9.5h13V9.7" />
          <path d="M9.5 19.2v-5.4h5v5.4" />
        </svg>
      );

    case "spark":
      return (
        <svg {...common}>
          <path d="M12 3.2v4.1" />
          <path d="M12 16.7v4.1" />
          <path d="M3.2 12h4.1" />
          <path d="M16.7 12h4.1" />
          <path d="m5.8 5.8 2.9 2.9" />
          <path d="m15.3 15.3 2.9 2.9" />
          <path d="m18.2 5.8-2.9 2.9" />
          <path d="m8.7 15.3-2.9 2.9" />
          <circle cx="12" cy="12" r="2.4" />
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
          <path d="M12 3.5c1.8 3.1 5.5 4.5 5.5 8.5a5.5 5.5 0 1 1-11 0c0-4 3.7-5.4 5.5-8.5Z" />
          <path d="M12 9c.9 1.3 2.1 2.1 2.1 3.7a2.1 2.1 0 1 1-4.2 0C9.9 11.1 11.1 10.3 12 9Z" />
        </svg>
      );

    case "candle":
      return (
        <svg {...common}>
          <path d="M9 10h6v9H9z" />
          <path d="M10 10c0-1.5.8-2.3 2-3.5 1.2 1.2 2 2 2 3.5" />
          <path d="M8 19h8" />
          <path d="M12 3.5c.7 1 .9 1.8.3 2.5" />
        </svg>
      );

    case "conversation":
      return (
        <svg {...common}>
          <path d="M4.5 5.5h15v10h-8l-4.5 3v-3h-2.5z" />
          <path d="M8 9.5h8" />
          <path d="M8 12.5h5.5" />
        </svg>
      );

    case "crown":
      return (
        <svg {...common}>
          <path d="m4 7 4 3 4-5 4 5 4-3-2 10H6L4 7Z" />
          <path d="M6.5 20h11" />
        </svg>
      );

    case "class":
      return (
        <svg {...common}>
          <path d="m3.5 9 8.5-4 8.5 4-8.5 4-8.5-4Z" />
          <path d="M6 11v4.2c2.8 2.3 9.2 2.3 12 0V11" />
          <path d="M20.5 9v6" />
        </svg>
      );

    case "event":
      return (
        <svg {...common}>
          <rect x="4" y="5.5" width="16" height="15" rx="2" />
          <path d="M8 3.5v4" />
          <path d="M16 3.5v4" />
          <path d="M4 9.5h16" />
          <path d="M8 13h.01" />
          <path d="M12 13h.01" />
          <path d="M16 13h.01" />
          <path d="M8 17h.01" />
          <path d="M12 17h.01" />
        </svg>
      );

    case "faq":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M9.7 9.3a2.4 2.4 0 0 1 4.6 1c0 1.7-2.3 2-2.3 3.4" />
          <path d="M12 16.8h.01" />
        </svg>
      );

    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5v5l3.2 2" />
        </svg>
      );

    case "contact":
      return (
        <svg {...common}>
          <path d="M5 6.5h14v10H9l-4 3v-3H5z" />
          <path d="M8 10h8" />
          <path d="M8 13h5" />
        </svg>
      );

    default:
      return null;
  }
}

function getSolarDate() {
  try {
    const formatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return formatter.format(new Date());
  } catch {
    return "امروز";
  }
}

function App() {
  const [section, setSection] = useState<Section>("home");

  const solarDate = useMemo(() => getSolarDate(), []);

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <div className="brand-area">
          <div className="logo-placeholder" aria-label="لوگوی کائنات‌چی">
            <img
              src="https://i.ibb.co/YBNLYM0D/IMG-3857.jpg"
              alt="لوگوی کائنات‌چی"
            />
          </div>

          <div className="brand-copy">
            <span className="brand-name">کائنات‌چی</span>
            <span className="brand-tagline">
              رزرو نوبت و مشاهده خدمات
            </span>
          </div>
        </div>

        <div className="date-pill">
          <span className="date-dot" />
          <span>{solarDate}</span>
        </div>
      </header>

      <main className="main-content">
        {section === "home" && (
          <div className="home-page">
            <section className="hero">
              <div className="hero-glow" />

              <div className="hero-art">
                <div className="orb orb-large" />
                <div className="orb orb-small" />

                <div className="botanical botanical-left">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>

                <div className="botanical botanical-right">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>

                <div className="hero-symbol">
                  <Icon name="spark" size={30} />
                </div>

                <div className="hero-ring ring-one" />
                <div className="hero-ring ring-two" />
              </div>

              <div className="hero-content">
                <span className="eyebrow">KAENATCHI</span>

                <h1>
                  آرام‌تر ببین،
                  <br />
                  آگاهانه‌تر انتخاب کن.
                </h1>

                <p>
                  فضایی برای مکث، شناخت بهتر خود و تجربه‌ای آرام
                  در مسیر آگاهی.
                </p>
              </div>
            </section>

            <section className="today-section">
              <div className="section-heading-row">
                <div>
                  <span className="section-kicker">امروز</span>
                  <h2>حال‌وهوای امروز</h2>
                </div>

                <span className="heading-symbol">
                  <Icon name="spark" size={21} />
                </span>
              </div>

              <div className="today-card">
                <div className="today-decoration">“</div>

                <div className="today-content">
                  <p>
                    گاهی لازم نیست چیزی را حل کنی؛
                    فقط کمی مکث کن و اجازه بده خودت را دوباره ببینی.
                  </p>

                  <span>یادداشت امروز کائنات‌چی</span>
                </div>
              </div>
            </section>

            <section className="featured-section">
              <div className="section-heading-row">
                <div>
                  <span className="section-kicker">منتخب</span>
                  <h2>یک لحظه برای خودت</h2>
                </div>

                <span className="heading-symbol">
                  <Icon name="spark" size={21} />
                </span>
              </div>

              <article className="featured-card">
                <div className="featured-art">
                  <div className="featured-circle">
                    <span>
                      <Icon name="spark" size={25} />
                    </span>
                  </div>

                  <div className="featured-leaf leaf-a" />
                  <div className="featured-leaf leaf-b" />
                  <div className="featured-leaf leaf-c" />
                </div>

                <div className="featured-copy">
                  <span className="featured-label">KAENATCHI NOTE</span>

                  <h3>
                    هر انتخاب،
                    <br />
                    از یک مکث شروع می‌شود.
                  </h3>

                  <p>
                    اینجا قرار است محتوای منتخب کائنات‌چی را ببینی؛
                    محتوایی که بعداً از پنل مدیریت قابل تغییر خواهد بود.
                  </p>
                </div>
              </article>
            </section>

            <section className="welcome-section">
              <span className="section-kicker">کائنات‌چی</span>

              <h2>فضایی ساده برای انتخابی آگاهانه</h2>

              <p>
                خدمات، آموزش‌ها و برنامه‌های کائنات‌چی در یک فضای
                یکپارچه و آرام در کنار شما قرار می‌گیرند.
              </p>
            </section>
          </div>
        )}

        {section === "services" && (
          <div className="inner-page">
            <section className="page-intro">
              <span className="section-kicker">خدمات</span>

              <h1>خدمات کائنات‌چی</h1>

              <p>
                خدمات موردنظر خود را ببینید و برای دریافت نوبت
                وارد مسیر رزرو شوید.
              </p>
            </section>

            <div className="service-list">
              {services.map((service) => (
                <button className="glass-list-card" key={service.title}>
                  <span className="list-icon">
                    <Icon name={service.icon} size={22} />
                  </span>

                  <span className="list-copy">
                    <strong>{service.title}</strong>
                    <span>{service.description}</span>
                  </span>

                  <span className="list-arrow">‹</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {section === "more" && (
          <div className="inner-page">
            <section className="page-intro">
              <span className="section-kicker">بیشتر</span>

              <h1>کائنات‌چی</h1>

              <p>
                بخش‌های دیگر کائنات‌چی را از اینجا دنبال کنید.
              </p>
            </section>

            <div className="more-list">
              {moreItems.map((item) => (
                <button className="glass-list-card" key={item.title}>
                  <span className="list-icon">
                    <Icon name={item.icon} size={22} />
                  </span>

                  <span className="list-copy">
                    <strong>{item.title}</strong>
                    <span>{item.description}</span>
                  </span>

                  <span className="list-arrow">‹</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      <nav className="bottom-nav" aria-label="ناوبری اصلی">
        <button
          className={section === "home" ? "nav-item active" : "nav-item"}
          onClick={() => setSection("home")}
          type="button"
        >
          <span className="nav-icon">
            <Icon name="home" size={21} />
          </span>
          <span>خانه</span>
        </button>

        <button
          className={
            section === "services" ? "nav-item active" : "nav-item"
          }
          onClick={() => setSection("services")}
          type="button"
        >
          <span className="nav-icon">
            <Icon name="spark" size={21} />
          </span>
          <span>خدمات</span>
        </button>

        <button
          className={section === "more" ? "nav-item active" : "nav-item"}
          onClick={() => setSection("more")}
          type="button"
        >
          <span className="nav-icon">
            <Icon name="menu" size={21} />
          </span>
          <span>بیشتر</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
