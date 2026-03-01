import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCheck, FaTimes, FaCrown, FaHeart, FaSync } from 'react-icons/fa';
import axios from 'axios';
import { getApiEndpoint } from '../config';
import { memorialPageFeatures } from '../data/memorialFeatures';
import './Pricing.css';

function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = [
    {
      id: 'monthly',
      name: 'מנוי חודשי',
      price: 12,
      period: 'חודש',
      description: 'שמירה חודשית עם אפשרות עריכה',
      features: [
        'הדף נשמר',
        'אפשר לערוך ולהוסיף תכנים',
        'QR נשאר פעיל',
        'גמישות – ניתן להפסיק או להמשיך'
      ],
      limitations: [],
      popular: false,
      icon: FaHeart
    },
    {
      id: 'annual',
      name: 'שמירה וניהול שנתי',
      price: 100,
      period: 'לשנה',
      description: 'שמירה שנתית עם אפשרות עריכה',
      features: [
        'הדף נשמר',
        'אפשר לערוך ולהוסיף תכנים',
        'QR נשאר פעיל',
        'תמיכה בסיסית',
        'גישה מלאה לכל התכונות'
      ],
      limitations: [],
      popular: false,
      icon: FaHeart
    },
    {
      id: 'lifetime',
      name: 'תשלום חד פעמי (עם עריכה)',
      price: 399,
      period: 'חד-פעמי',
      description: 'תשלום חד פעמי עם כל התכונות כולל עריכה ותחזוקת אתר',
      features: [
        'שמירה קבועה',
        'עריכה חופשית',
        'תחזוקת אתר 15₪ לשנה (חינם בשנתיים הראשונות, מתחייב מהשנה השלישית)',
        'גיבוי',
        'העברת ניהול למשפחה',
        'תמיכה מלאה'
      ],
      limitations: [],
      popular: true,
      icon: FaCrown
    }
  ];

  const handleSelectPlan = (planId) => {
    setSelectedPlan(planId);
    // כאן תהיה הפניה לדף התשלום או הרשמה
    // navigate(`/checkout?plan=${planId}`);
  };

  return (
    <main className="pricing-page" role="main">
      <header className="pricing-hero">
        <div className="container">
          <h1 className="pricing-title">תמחור</h1>
          <p className="pricing-subtitle">
            בחרו את התוכנית המתאימה לכם להנצחת יקיריכם
          </p>
        </div>
      </header>

      <section className="pricing-content">
        <div className="container">
          <div className="pricing-intro">
            <p>
              אנו מציעים מספר אפשרויות תשלום גמישות, כך שכל משפחה תוכל למצוא את הפתרון המתאים לה.
              כל התוכניות כוללות דף זיכרון מלא עם QR Code ייחודי.
            </p>
          </div>

          <div className="pricing-grid">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.id}
                  className={`pricing-card ${plan.popular ? 'popular' : ''}`}
                >
                  {plan.popular && (
                    <div className="popular-badge">הכי פופולרי</div>
                  )}
                  <div className="pricing-card-header">
                    <Icon className="plan-icon" />
                    <h2>{plan.name}</h2>
                    <p className="plan-description">{plan.description}</p>
                  </div>

                  <div className="pricing-card-price">
                    {plan.originalPrice && (
                      <div className="price-breakdown">
                        <span className="original-price">₪{plan.originalPrice}</span>
                        <span className="addon-text">+ ₪{plan.addonPrice} שינויים</span>
                      </div>
                    )}
                    <div className="price-main">
                      <span className="price-amount">₪{plan.price}</span>
                      <span className="price-period">/{plan.period}</span>
                    </div>
                  </div>

                  <div className="plan-features-block">
                    <div className="memorial-features-in-plan">
                      <h4 className="memorial-features-title">
                        <span className="memorial-features-title-icon">✨</span>
                        מה כלול בדף הזיכרון (בכל תוכנית)
                      </h4>
                      <ul className="features-list memorial-features-list">
                        {memorialPageFeatures.map((feature, index) => {
                          const FeatureIcon = feature.Icon;
                          return (
                            <li key={index} className="feature-item feature-item-with-icon">
                              <span className="feature-icon-wrap">
                                <FeatureIcon className="feature-icon" />
                              </span>
                              <span className="feature-text">{feature.label}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                    <h4 className="plan-specific-title">
                      <span className="plan-specific-title-icon">✓</span>
                      יתרונות התוכנית
                    </h4>
                    <ul className="features-list">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="feature-item">
                          <FaCheck className="check-icon" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {plan.limitations.map((limitation, index) => (
                        <li key={`lim-${index}`} className="feature-item limitation">
                          <FaTimes className="times-icon" />
                          <span>{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    className={`btn btn-${plan.popular ? 'primary' : 'secondary'} btn-full`}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    בחר תוכנית
                  </button>
                </div>
              );
            })}
          </div>

          <div className="pricing-faq">
            <h2>שאלות נפוצות</h2>
            <div className="faq-grid">
              <div className="faq-item">
                <h3>מה ההבדל בין התוכניות?</h3>
                <p>
                  מנוי חודשי (12₪), שנתי (100₪), תשלום חד פעמי (399₪).
                  תחזוקת אתר 15₪ לשנה – חינם בשנתיים הראשונות במסלול תשלום חד פעמי, מתחייב מהשנה השלישית.
                </p>
              </div>
              <div className="faq-item">
                <h3>איך עובד התשלום?</h3>
                <p>
                  התשלום מתבצע באמצעות כרטיס אשראי או העברה (דרך ספקי תשלום מאומתים). 
                  אחרי התשלום, תקבלו גישה מיידית ליצירת דף הזיכרון.
                </p>
              </div>
              <div className="faq-item">
                <h3>מה קורה אם אני רוצה לשנות תוכנית?</h3>
                <p>
                  אפשר להמיר למנוי שנתי בכל עת.
                </p>
              </div>
              <div className="faq-item">
                <h3>האם יש החזר כספי?</h3>
                <p>
                  אנו מציעים החזר כספי בתוך 14 יום מרגע הרכישה, אם לא התחלתם ליצור את דף הזיכרון.
                </p>
              </div>
            </div>
          </div>

          <div className="pricing-cta">
            <p>יש שאלות נוספות?</p>
            <Link to="/about" className="btn btn-secondary">
              צור קשר
            </Link>
          </div>
        </div>
      </section>

      <footer className="pricing-footer">
        <div className="container">
          <p>© 2025 דפי זיכרון דיגיטליים - שומרים זיכרונות לנצח</p>
          <div className="footer-links" style={{ marginTop: '12px', display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/">דף הבית</Link>
            <Link to="/about">אודות</Link>
            <Link to="/privacy">מדיניות פרטיות</Link>
            <Link to="/support">משאבים למשפחות</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default Pricing;
