import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Shield, FileText, Cookie } from "lucide-react";
import logo from "../../assets/logo.png";
import "../../styles/legal.css";

export default function LegalPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("privacy");

  const tabs = [
    { id: "privacy", label: "Privacy Policy", icon: Shield },
    { id: "terms", label: "Terms of Service", icon: FileText },
    { id: "cookies", label: "Cookie Policy", icon: Cookie },
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
            <span>Back to Home</span>
          </button>
        </div>
      </nav>

      {/* Header */}
      <header className="legal-header">
        <div className="legal-container">
          <h1>Legal Information</h1>
          <p>Everything you need to know about using INTERVOS</p>
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
            {activeTab === "privacy" && <PrivacyPolicy />}
            {activeTab === "terms" && <TermsOfService />}
            {activeTab === "cookies" && <CookiePolicy />}
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
            <p>&copy; 2025 INTERVOS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ==================== PRIVACY POLICY ==================== */
function PrivacyPolicy() {
  return (
    <article className="legal-article">
      <div className="legal-article-header">
        <h2>Privacy Policy</h2>
        <p className="legal-updated">Last updated: January 2025</p>
      </div>

      <div className="legal-article-body">
        <section>
          <h3>1. Introduction</h3>
          <p>
            Welcome to INTERVOS. We are committed to protecting your personal information
            and your right to privacy. This Privacy Policy explains how we collect, use,
            disclose, and safeguard your information when you use our platform.
          </p>
        </section>

        <section>
          <h3>2. Information We Collect</h3>
          <p>We collect information that you provide directly to us, including:</p>
          <ul>
            <li><strong>Account Information:</strong> Name, email address, phone number, and password when you register</li>
            <li><strong>Profile Information:</strong> Company name, license numbers, business address, and professional details</li>
            <li><strong>Property Information:</strong> Property addresses, unit details, and related documentation</li>
            <li><strong>Transaction Data:</strong> Bids, job postings, payments, and contract information</li>
            <li><strong>Communications:</strong> Messages exchanged through our platform</li>
          </ul>
        </section>

        <section>
          <h3>3. How We Use Your Information</h3>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related information</li>
            <li>Connect property managers with qualified contractors</li>
            <li>Send notifications about jobs, bids, and platform updates</li>
            <li>Respond to your comments, questions, and customer service requests</li>
            <li>Monitor and analyze usage patterns and trends</li>
            <li>Detect, investigate, and prevent fraudulent activities</li>
          </ul>
        </section>

        <section>
          <h3>4. Information Sharing</h3>
          <p>We may share your information in the following situations:</p>
          <ul>
            <li><strong>With Other Users:</strong> Profile information is visible to facilitate business connections</li>
            <li><strong>Service Providers:</strong> Third-party vendors who assist in operating our platform</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            <li><strong>Business Transfers:</strong> In connection with any merger or acquisition</li>
          </ul>
        </section>

        <section>
          <h3>5. Data Security</h3>
          <p>
            We implement appropriate technical and organizational security measures to protect
            your personal information. However, no method of transmission over the Internet is
            100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h3>6. Your Rights</h3>
          <p>Depending on your location, you may have the right to:</p>
          <ul>
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your personal information</li>
            <li>Object to or restrict certain processing activities</li>
            <li>Data portability</li>
          </ul>
        </section>

        <section>
          <h3>7. Contact Us</h3>
          <p>
            If you have questions about this Privacy Policy, please contact us at:
          </p>
          <p className="legal-contact">
            <strong>Email:</strong> privacy@intervos.com<br />
            <strong>Phone:</strong> +1 (555) 123-4567
          </p>
        </section>
      </div>
    </article>
  );
}

/* ==================== TERMS OF SERVICE ==================== */
function TermsOfService() {
  return (
    <article className="legal-article">
      <div className="legal-article-header">
        <h2>Terms of Service</h2>
        <p className="legal-updated">Last updated: January 2025</p>
      </div>

      <div className="legal-article-body">
        <section>
          <h3>1. Acceptance of Terms</h3>
          <p>
            By accessing or using INTERVOS, you agree to be bound by these Terms of Service.
            If you do not agree to these terms, please do not use our platform.
          </p>
        </section>

        <section>
          <h3>2. Description of Service</h3>
          <p>
            INTERVOS is a construction management platform that connects property managers
            with contractors and entrepreneurs. Our services include job posting, bid management,
            messaging, and payment processing.
          </p>
        </section>

        <section>
          <h3>3. User Accounts</h3>
          <p>To use our services, you must:</p>
          <ul>
            <li>Be at least 18 years old</li>
            <li>Provide accurate and complete registration information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Notify us immediately of any unauthorized access</li>
            <li>Be responsible for all activities under your account</li>
          </ul>
        </section>

        <section>
          <h3>4. User Responsibilities</h3>
          <p>As a user of INTERVOS, you agree to:</p>
          <ul>
            <li>Provide truthful information about your business and qualifications</li>
            <li>Maintain valid licenses and insurance as required by law</li>
            <li>Communicate professionally with other users</li>
            <li>Honor commitments made through the platform</li>
            <li>Comply with all applicable laws and regulations</li>
          </ul>
        </section>

        <section>
          <h3>5. Prohibited Activities</h3>
          <p>You may not use INTERVOS to:</p>
          <ul>
            <li>Violate any laws or regulations</li>
            <li>Post false, misleading, or fraudulent content</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Circumvent our fee structure or payment system</li>
            <li>Scrape, copy, or misuse platform data</li>
            <li>Interfere with the proper functioning of the platform</li>
          </ul>
        </section>

        <section>
          <h3>6. Payments and Fees</h3>
          <p>
            INTERVOS may charge fees for certain services. All fees are non-refundable unless
            otherwise stated. You agree to pay all applicable fees and authorize us to charge
            your payment method on file.
          </p>
        </section>

        <section>
          <h3>7. Intellectual Property</h3>
          <p>
            All content, features, and functionality of INTERVOS are owned by us and protected
            by copyright, trademark, and other intellectual property laws. You may not reproduce,
            distribute, or create derivative works without our permission.
          </p>
        </section>

        <section>
          <h3>8. Disclaimer of Warranties</h3>
          <p>
            INTERVOS is provided "as is" without warranties of any kind. We do not guarantee
            the quality of work performed by contractors or the accuracy of information provided
            by users.
          </p>
        </section>

        <section>
          <h3>9. Limitation of Liability</h3>
          <p>
            To the maximum extent permitted by law, INTERVOS shall not be liable for any indirect,
            incidental, special, or consequential damages arising from your use of the platform.
          </p>
        </section>

        <section>
          <h3>10. Termination</h3>
          <p>
            We reserve the right to suspend or terminate your account at any time for violations
            of these terms or for any other reason at our discretion.
          </p>
        </section>

        <section>
          <h3>11. Changes to Terms</h3>
          <p>
            We may update these Terms of Service from time to time. We will notify you of any
            material changes by posting the new terms on this page and updating the "Last updated" date.
          </p>
        </section>

        <section>
          <h3>12. Contact Us</h3>
          <p>
            For questions about these Terms of Service, please contact us at:
          </p>
          <p className="legal-contact">
            <strong>Email:</strong> legal@intervos.com<br />
            <strong>Phone:</strong> +1 (555) 123-4567
          </p>
        </section>
      </div>
    </article>
  );
}

/* ==================== COOKIE POLICY ==================== */
function CookiePolicy() {
  return (
    <article className="legal-article">
      <div className="legal-article-header">
        <h2>Cookie Policy</h2>
        <p className="legal-updated">Last updated: January 2025</p>
      </div>

      <div className="legal-article-body">
        <section>
          <h3>1. What Are Cookies</h3>
          <p>
            Cookies are small text files that are stored on your device when you visit a website.
            They help websites remember your preferences and improve your browsing experience.
          </p>
        </section>

        <section>
          <h3>2. How We Use Cookies</h3>
          <p>INTERVOS uses cookies for the following purposes:</p>
          <ul>
            <li><strong>Essential Cookies:</strong> Required for the platform to function properly, including authentication and security</li>
            <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
            <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our platform</li>
            <li><strong>Performance Cookies:</strong> Monitor and improve platform performance</li>
          </ul>
        </section>

        <section>
          <h3>3. Types of Cookies We Use</h3>
          <div className="legal-table-wrapper">
            <table className="legal-table">
              <thead>
                <tr>
                  <th>Cookie Type</th>
                  <th>Purpose</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Session Cookies</td>
                  <td>Maintain your login session</td>
                  <td>Until browser closes</td>
                </tr>
                <tr>
                  <td>Authentication</td>
                  <td>Keep you logged in securely</td>
                  <td>30 days</td>
                </tr>
                <tr>
                  <td>Preferences</td>
                  <td>Remember your settings</td>
                  <td>1 year</td>
                </tr>
                <tr>
                  <td>Analytics</td>
                  <td>Track usage patterns</td>
                  <td>2 years</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3>4. Third-Party Cookies</h3>
          <p>
            We may use third-party services that set their own cookies, including:
          </p>
          <ul>
            <li><strong>Google Analytics:</strong> For website analytics and performance monitoring</li>
            <li><strong>Stripe:</strong> For secure payment processing</li>
            <li><strong>Intercom/Support Tools:</strong> For customer support functionality</li>
          </ul>
        </section>

        <section>
          <h3>5. Managing Cookies</h3>
          <p>
            You can control and manage cookies through your browser settings. Most browsers allow you to:
          </p>
          <ul>
            <li>View what cookies are stored on your device</li>
            <li>Delete all or specific cookies</li>
            <li>Block cookies from specific or all websites</li>
            <li>Set preferences for certain types of cookies</li>
          </ul>
          <p>
            Please note that disabling certain cookies may affect the functionality of INTERVOS
            and your ability to use some features.
          </p>
        </section>

        <section>
          <h3>6. Updates to This Policy</h3>
          <p>
            We may update this Cookie Policy from time to time to reflect changes in our practices
            or for legal reasons. We encourage you to review this page periodically.
          </p>
        </section>

        <section>
          <h3>7. Contact Us</h3>
          <p>
            If you have questions about our use of cookies, please contact us at:
          </p>
          <p className="legal-contact">
            <strong>Email:</strong> privacy@intervos.com<br />
            <strong>Phone:</strong> +1 (555) 123-4567
          </p>
        </section>
      </div>
    </article>
  );
}
