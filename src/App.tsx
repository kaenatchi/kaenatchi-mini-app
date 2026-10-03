import { useMemo, useState } from "react";

type Section = "home" | "services" | "more";

const services = [
  {
    title: "انرژی‌خوانی",
    description: "شناخت و بررسی انرژی در فضایی آرام و شخصی",
    icon: "✦",
  },
  {
    title: "شمع‌تراپی",
    description: "جلسات ریموت برای آرامش، تمرکز و همراهی",
    icon: "🕯",
  },
  {
    title: "سایکوتراپی",
    description: "گفت‌وگوی تلفنی برای بررسی مسائل و تجربه‌های شخصی",
    icon: "◌",
  },
];

const moreItems = [
  {
    title: "VIP کائنات‌چی",
    description: "دسترسی به فضای ویژه و امکانات VIP",
    icon: "✧",
  },
  {
    title: "کلاس‌ها",
    description: "کلاس‌ها و آموزش‌های کائنات‌چی",
    icon: "◎",
  },
  {
    title: "رویدادها",
    description: "برنامه‌ها و رویدادهای پیش‌رو",
    icon: "◈",
  },
  {
    title: "سؤالات متداول",
    description: "پاسخ پرسش‌های متداول شما",
    icon: "?",
  },
  {
    title: "ساعات کاری",
    description: "زمان پاسخ‌گویی و ارائه خدمات",
    icon: "◷",
  },
  {
    title: "ارتباط با ما",
    description: "راه‌های ارتباطی کائنات‌چی",
    icon: "⌁",
  },
];

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
            <span className="brand-tagline">رزرو نوبت و مشاهده خدمات</span>
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

                <div className="hero-symbol">✦</div>

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

                <span className="heading-symbol">☼</span>
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

                <span className="heading-symbol">✧</span>
              </div>

              <article className="featured-card">
                <div className="featured-art">
                  <div className="featured-circle">
                    <span>✦</span>
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
                  <span className="list-icon">{service.icon}</span>

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
                  <span className="list-icon">{item.icon}</span>

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
          <span className="nav-icon">⌂</span>
          <span>خانه</span>
        </button>

        <button
          className={
            section === "services" ? "nav-item active" : "nav-item"
          }
          onClick={() => setSection("services")}
          type="button"
        >
          <span className="nav-icon">✦</span>
          <span>خدمات</span>
        </button>

        <button
          className={section === "more" ? "nav-item active" : "nav-item"}
          onClick={() => setSection("more")}
          type="button"
        >
          <span className="nav-icon">☰</span>
          <span>بیشتر</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
