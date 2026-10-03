import { useState } from "react";

type Section = "home" | "services" | "more";

const services = [
  {
    title: "انرژی‌خوانی",
    description: "آشنایی با خدمات انرژی‌خوانی کائنات‌چی",
    icon: "✦",
  },
  {
    title: "شمع‌تراپی",
    description: "جلسات ریموت برای آرامش و تمرکز",
    icon: "🕯️",
  },
  {
    title: "سایکوتراپی",
    description: "گفت‌وگوی تلفنی برای همراهی و بررسی مسائل شخصی",
    icon: "☁️",
  },
];

function App() {
  const [section, setSection] = useState<Section>("home");

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">ک</div>
          <div>
            <div className="brand-name">کائنات‌چی</div>
            <div className="brand-subtitle">رزرو نوبت و مشاهده خدمات</div>
          </div>
        </div>
      </header>

      <main className="content">
        {section === "home" && (
          <>
            <section className="hero-card">
              <div className="hero-decoration">✦</div>

              <p className="eyebrow">KAENATCHI</p>

              <h1>
                جایی برای
                <br />
                مکث، آگاهی و آرامش
              </h1>

              <p className="hero-text">
                در کائنات‌چی فضایی آرام برای شناخت بهتر خود، دریافت خدمات و
                انتخاب آگاهانه نوبت شما فراهم شده است.
              </p>
            </section>

            <section className="daily-card">
              <span className="daily-icon">☼</span>
              <div>
                <span className="section-label">امروز</span>
                <h2>با خودت کمی مهربان‌تر باش.</h2>
                <p>گاهی یک مکث کوتاه، شروع یک نگاه تازه است.</p>
              </div>
            </section>

            <section className="intro-section">
              <span className="section-label">کائنات‌چی</span>
              <h2>آرام‌تر ببین، آگاهانه‌تر انتخاب کن.</h2>
              <p>
                خدمات، کلاس‌ها و برنامه‌های کائنات‌چی را در یک فضای ساده و
                یکپارچه ببینید.
              </p>
            </section>
          </>
        )}

        {section === "services" && (
          <>
            <section className="page-heading">
              <span className="section-label">خدمات</span>
              <h1>خدمات کائنات‌چی</h1>
              <p>خدمت موردنظر خود را انتخاب کنید.</p>
            </section>

            <div className="service-list">
              {services.map((service) => (
                <button className="service-card" key={service.title}>
                  <span className="service-icon">{service.icon}</span>

                  <span className="service-info">
                    <strong>{service.title}</strong>
                    <span>{service.description}</span>
                  </span>

                  <span className="arrow">‹</span>
                </button>
              ))}
            </div>
          </>
        )}

        {section === "more" && (
          <>
            <section className="page-heading">
              <span className="section-label">بیشتر</span>
              <h1>کائنات‌چی</h1>
              <p>دسترسی به بخش‌های دیگر برنامه</p>
            </section>

            <div className="more-grid">
              <button>⭐ VIP</button>
              <button>🎓 کلاس‌ها</button>
              <button>✨ رویدادها</button>
              <button>❓ سوالات متداول</button>
              <button>🕰️ ساعات کاری</button>
              <button>💬 ارتباط با ما</button>
            </div>
          </>
        )}
      </main>

      <nav className="bottom-nav">
        <button
          className={section === "home" ? "active" : ""}
          onClick={() => setSection("home")}
        >
          <span>⌂</span>
          <small>خانه</small>
        </button>

        <button
          className={section === "services" ? "active" : ""}
          onClick={() => setSection("services")}
        >
          <span>✦</span>
          <small>خدمات</small>
        </button>

        <button
          className={section === "more" ? "active" : ""}
          onClick={() => setSection("more")}
        >
          <span>☰</span>
          <small>بیشتر</small>
        </button>
      </nav>
    </div>
  );
}

export default App;
