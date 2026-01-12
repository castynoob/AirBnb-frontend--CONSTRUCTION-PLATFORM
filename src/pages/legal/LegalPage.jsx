import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Shield, FileText, Cookie } from "lucide-react";
import logo from "../../assets/logo.png";
import "../../styles/legal.css";
import { useLanguage } from "../../contexts/LanguageContext";

export default function LegalPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("privacy");
  const { t } = useLanguage();

  const tabs = [
    { id: "privacy", label: t('legalPage.tabs.privacy'), icon: Shield },
    { id: "terms", label: t('legalPage.tabs.terms'), icon: FileText },
    { id: "cookies", label: t('legalPage.tabs.cookies'), icon: Cookie },
  ];

  // Set active tab from URL params
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["privacy", "terms", "cookies"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  return (
    <div className="legal-page">
      {/* Navigation */}
      <nav className="legal-nav">
        <div className="legal-nav-container">
          <div className="legal-nav-logo" onClick={() => navigate("/")}>
            <span className="legal-logo-icon">
              <img src={logo} alt="INTERVOS" />
            </span>
            <span className="legal-logo-text">INTERVOS</span>
          </div>
          <button className="legal-back-btn" onClick={() => navigate("/")}>
            <ArrowLeft size={18} />
            <span>{t('legalPage.backToHome')}</span>
          </button>
        </div>
      </nav>

      {/* Header */}
      <header className="legal-header">
        <div className="legal-container">
          <h1>{t('legalPage.title')}</h1>
          <p>{t('legalPage.subtitle')}</p>
        </div>
      </header>

      {/* Tabs */}
      <section className="legal-tabs-section">
        <div className="legal-container">
          <div className="legal-tabs">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`legal-tab ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => handleTabChange(tab.id)}
                >
                  <IconComponent size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="legal-content-section">
        <div className="legal-container">
          <div className="legal-content">
            {activeTab === "privacy" && <PrivacyPolicy t={t} />}
            {activeTab === "terms" && <TermsOfService t={t} />}
            {activeTab === "cookies" && <CookiePolicy t={t} />}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="legal-footer">
        <div className="legal-container">
          <div className="legal-footer-content">
            <div className="legal-footer-logo">
              <span className="legal-logo-icon">
                <img src={logo} alt="INTERVOS" />
              </span>
              <span className="legal-logo-text">INTERVOS</span>
            </div>
            <p>{t('legalPage.footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ==================== PRIVACY POLICY ==================== */
function PrivacyPolicy({ t }) {
  return (
    <article className="legal-article">
      <div className="legal-article-header">
        <h2>{t('legalPage.privacy.title')}</h2>
        <p className="legal-updated">{t('legalPage.privacy.lastUpdated')}</p>
      </div>

      <div className="legal-article-body">
        <section>
          <h3>{t('legalPage.privacy.section1.title')}</h3>
          <p>{t('legalPage.privacy.section1.content')}</p>
        </section>

        <section>
          <h3>{t('legalPage.privacy.section2.title')}</h3>
          <p>{t('legalPage.privacy.section2.intro')}</p>
          <ul>
            <li><strong>{t('legalPage.privacy.section2.item1').split(':')[0]}:</strong>{t('legalPage.privacy.section2.item1').split(':').slice(1).join(':')}</li>
            <li><strong>{t('legalPage.privacy.section2.item2').split(':')[0]}:</strong>{t('legalPage.privacy.section2.item2').split(':').slice(1).join(':')}</li>
            <li><strong>{t('legalPage.privacy.section2.item3').split(':')[0]}:</strong>{t('legalPage.privacy.section2.item3').split(':').slice(1).join(':')}</li>
            <li><strong>{t('legalPage.privacy.section2.item4').split(':')[0]}:</strong>{t('legalPage.privacy.section2.item4').split(':').slice(1).join(':')}</li>
            <li><strong>{t('legalPage.privacy.section2.item5').split(':')[0]}:</strong>{t('legalPage.privacy.section2.item5').split(':').slice(1).join(':')}</li>
          </ul>
        </section>

        <section>
          <h3>{t('legalPage.privacy.section3.title')}</h3>
          <p>{t('legalPage.privacy.section3.intro')}</p>
          <ul>
            <li>{t('legalPage.privacy.section3.item1')}</li>
            <li>{t('legalPage.privacy.section3.item2')}</li>
            <li>{t('legalPage.privacy.section3.item3')}</li>
            <li>{t('legalPage.privacy.section3.item4')}</li>
            <li>{t('legalPage.privacy.section3.item5')}</li>
            <li>{t('legalPage.privacy.section3.item6')}</li>
            <li>{t('legalPage.privacy.section3.item7')}</li>
          </ul>
        </section>

        <section>
          <h3>{t('legalPage.privacy.section4.title')}</h3>
          <p>{t('legalPage.privacy.section4.intro')}</p>
          <ul>
            <li><strong>{t('legalPage.privacy.section4.item1').split(':')[0]}:</strong>{t('legalPage.privacy.section4.item1').split(':').slice(1).join(':')}</li>
            <li><strong>{t('legalPage.privacy.section4.item2').split(':')[0]}:</strong>{t('legalPage.privacy.section4.item2').split(':').slice(1).join(':')}</li>
            <li><strong>{t('legalPage.privacy.section4.item3').split(':')[0]}:</strong>{t('legalPage.privacy.section4.item3').split(':').slice(1).join(':')}</li>
            <li><strong>{t('legalPage.privacy.section4.item4').split(':')[0]}:</strong>{t('legalPage.privacy.section4.item4').split(':').slice(1).join(':')}</li>
          </ul>
        </section>

        <section>
          <h3>{t('legalPage.privacy.section5.title')}</h3>
          <p>{t('legalPage.privacy.section5.content')}</p>
        </section>

        <section>
          <h3>{t('legalPage.privacy.section6.title')}</h3>
          <p>{t('legalPage.privacy.section6.intro')}</p>
          <ul>
            <li>{t('legalPage.privacy.section6.item1')}</li>
            <li>{t('legalPage.privacy.section6.item2')}</li>
            <li>{t('legalPage.privacy.section6.item3')}</li>
            <li>{t('legalPage.privacy.section6.item4')}</li>
            <li>{t('legalPage.privacy.section6.item5')}</li>
          </ul>
        </section>

        <section>
          <h3>{t('legalPage.privacy.section7.title')}</h3>
          <p>{t('legalPage.privacy.section7.intro')}</p>
          <p className="legal-contact">
            <strong>{t('legalPage.privacy.section7.email')}</strong> privacy@intervos.com<br />
            <strong>{t('legalPage.privacy.section7.phone')}</strong> +1 (555) 123-4567
          </p>
        </section>
      </div>
    </article>
  );
}

/* ==================== TERMS OF SERVICE ==================== */
function TermsOfService({ t }) {
  return (
    <article className="legal-article">
      <div className="legal-article-header">
        <h2>{t('legalPage.terms.title')}</h2>
        <p className="legal-updated">{t('legalPage.terms.lastUpdated')}</p>
      </div>

      <div className="legal-article-body">
        <section>
          <h3>{t('legalPage.terms.section1.title')}</h3>
          <p>{t('legalPage.terms.section1.content')}</p>
        </section>

        <section>
          <h3>{t('legalPage.terms.section2.title')}</h3>
          <p>{t('legalPage.terms.section2.content')}</p>
        </section>

        <section>
          <h3>{t('legalPage.terms.section3.title')}</h3>
          <p>{t('legalPage.terms.section3.intro')}</p>
          <ul>
            <li>{t('legalPage.terms.section3.item1')}</li>
            <li>{t('legalPage.terms.section3.item2')}</li>
            <li>{t('legalPage.terms.section3.item3')}</li>
            <li>{t('legalPage.terms.section3.item4')}</li>
            <li>{t('legalPage.terms.section3.item5')}</li>
          </ul>
        </section>

        <section>
          <h3>{t('legalPage.terms.section4.title')}</h3>
          <p>{t('legalPage.terms.section4.intro')}</p>
          <ul>
            <li>{t('legalPage.terms.section4.item1')}</li>
            <li>{t('legalPage.terms.section4.item2')}</li>
            <li>{t('legalPage.terms.section4.item3')}</li>
            <li>{t('legalPage.terms.section4.item4')}</li>
            <li>{t('legalPage.terms.section4.item5')}</li>
          </ul>
        </section>

        <section>
          <h3>{t('legalPage.terms.section5.title')}</h3>
          <p>{t('legalPage.terms.section5.intro')}</p>
          <ul>
            <li>{t('legalPage.terms.section5.item1')}</li>
            <li>{t('legalPage.terms.section5.item2')}</li>
            <li>{t('legalPage.terms.section5.item3')}</li>
            <li>{t('legalPage.terms.section5.item4')}</li>
            <li>{t('legalPage.terms.section5.item5')}</li>
            <li>{t('legalPage.terms.section5.item6')}</li>
          </ul>
        </section>

        <section>
          <h3>{t('legalPage.terms.section6.title')}</h3>
          <p>{t('legalPage.terms.section6.content')}</p>
        </section>

        <section>
          <h3>{t('legalPage.terms.section7.title')}</h3>
          <p>{t('legalPage.terms.section7.content')}</p>
        </section>

        <section>
          <h3>{t('legalPage.terms.section8.title')}</h3>
          <p>{t('legalPage.terms.section8.content')}</p>
        </section>

        <section>
          <h3>{t('legalPage.terms.section9.title')}</h3>
          <p>{t('legalPage.terms.section9.content')}</p>
        </section>

        <section>
          <h3>{t('legalPage.terms.section10.title')}</h3>
          <p>{t('legalPage.terms.section10.content')}</p>
        </section>

        <section>
          <h3>{t('legalPage.terms.section11.title')}</h3>
          <p>{t('legalPage.terms.section11.content')}</p>
        </section>

        <section>
          <h3>{t('legalPage.terms.section12.title')}</h3>
          <p>{t('legalPage.terms.section12.intro')}</p>
          <p className="legal-contact">
            <strong>{t('legalPage.terms.section12.email')}</strong> legal@intervos.com<br />
            <strong>{t('legalPage.terms.section12.phone')}</strong> +1 (555) 123-4567
          </p>
        </section>
      </div>
    </article>
  );
}

/* ==================== COOKIE POLICY ==================== */
function CookiePolicy({ t }) {
  return (
    <article className="legal-article">
      <div className="legal-article-header">
        <h2>{t('legalPage.cookies.title')}</h2>
        <p className="legal-updated">{t('legalPage.cookies.lastUpdated')}</p>
      </div>

      <div className="legal-article-body">
        <section>
          <h3>{t('legalPage.cookies.section1.title')}</h3>
          <p>{t('legalPage.cookies.section1.content')}</p>
        </section>

        <section>
          <h3>{t('legalPage.cookies.section2.title')}</h3>
          <p>{t('legalPage.cookies.section2.intro')}</p>
          <ul>
            <li><strong>{t('legalPage.cookies.section2.item1').split(':')[0]}:</strong>{t('legalPage.cookies.section2.item1').split(':').slice(1).join(':')}</li>
            <li><strong>{t('legalPage.cookies.section2.item2').split(':')[0]}:</strong>{t('legalPage.cookies.section2.item2').split(':').slice(1).join(':')}</li>
            <li><strong>{t('legalPage.cookies.section2.item3').split(':')[0]}:</strong>{t('legalPage.cookies.section2.item3').split(':').slice(1).join(':')}</li>
            <li><strong>{t('legalPage.cookies.section2.item4').split(':')[0]}:</strong>{t('legalPage.cookies.section2.item4').split(':').slice(1).join(':')}</li>
          </ul>
        </section>

        <section>
          <h3>{t('legalPage.cookies.section3.title')}</h3>
          <div className="legal-table-wrapper">
            <table className="legal-table">
              <thead>
                <tr>
                  <th>{t('legalPage.cookies.section3.tableHeaders.type')}</th>
                  <th>{t('legalPage.cookies.section3.tableHeaders.purpose')}</th>
                  <th>{t('legalPage.cookies.section3.tableHeaders.duration')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{t('legalPage.cookies.section3.sessionCookies.type')}</td>
                  <td>{t('legalPage.cookies.section3.sessionCookies.purpose')}</td>
                  <td>{t('legalPage.cookies.section3.sessionCookies.duration')}</td>
                </tr>
                <tr>
                  <td>{t('legalPage.cookies.section3.authentication.type')}</td>
                  <td>{t('legalPage.cookies.section3.authentication.purpose')}</td>
                  <td>{t('legalPage.cookies.section3.authentication.duration')}</td>
                </tr>
                <tr>
                  <td>{t('legalPage.cookies.section3.preferences.type')}</td>
                  <td>{t('legalPage.cookies.section3.preferences.purpose')}</td>
                  <td>{t('legalPage.cookies.section3.preferences.duration')}</td>
                </tr>
                <tr>
                  <td>{t('legalPage.cookies.section3.analytics.type')}</td>
                  <td>{t('legalPage.cookies.section3.analytics.purpose')}</td>
                  <td>{t('legalPage.cookies.section3.analytics.duration')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3>{t('legalPage.cookies.section4.title')}</h3>
          <p>{t('legalPage.cookies.section4.intro')}</p>
          <ul>
            <li><strong>{t('legalPage.cookies.section4.item1').split(':')[0]}:</strong>{t('legalPage.cookies.section4.item1').split(':').slice(1).join(':')}</li>
            <li><strong>{t('legalPage.cookies.section4.item2').split(':')[0]}:</strong>{t('legalPage.cookies.section4.item2').split(':').slice(1).join(':')}</li>
            <li><strong>{t('legalPage.cookies.section4.item3').split(':')[0]}:</strong>{t('legalPage.cookies.section4.item3').split(':').slice(1).join(':')}</li>
          </ul>
        </section>

        <section>
          <h3>{t('legalPage.cookies.section5.title')}</h3>
          <p>{t('legalPage.cookies.section5.intro')}</p>
          <ul>
            <li>{t('legalPage.cookies.section5.item1')}</li>
            <li>{t('legalPage.cookies.section5.item2')}</li>
            <li>{t('legalPage.cookies.section5.item3')}</li>
            <li>{t('legalPage.cookies.section5.item4')}</li>
          </ul>
          <p>{t('legalPage.cookies.section5.note')}</p>
        </section>

        <section>
          <h3>{t('legalPage.cookies.section6.title')}</h3>
          <p>{t('legalPage.cookies.section6.content')}</p>
        </section>

        <section>
          <h3>{t('legalPage.cookies.section7.title')}</h3>
          <p>{t('legalPage.cookies.section7.intro')}</p>
          <p className="legal-contact">
            <strong>{t('legalPage.cookies.section7.email')}</strong> privacy@intervos.com<br />
            <strong>{t('legalPage.cookies.section7.phone')}</strong> +1 (555) 123-4567
          </p>
        </section>
      </div>
    </article>
  );
}
