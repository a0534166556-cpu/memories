import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCheck, FaTimes, FaCrown, FaHeart, FaSync } from 'react-icons/fa';
import axios from 'axios';
import { getApiEndpoint } from '../config';
import './Pricing.css';

function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = [
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
      name: 'הנצחה חד פעמית (עם עריכה)',
      price: 445,
      period: 'חד-פעמי',
      description: 'שמירה חד פעמית עם כל התכונות כולל עריכה ותחזוקת אתר',
      features: [
        'שמירה קבועה',
        'עריכה חופשית',
        'תחזוקת אתר 35₪ לשנה (חינם בשנה הראשונה, מתחייב מהשנה השנייה)',
        'עד גיגה אחד תמונות וסרטונים (כ־1,000 תמונות או עשרות דקות וידאו)',
        'ניתן לרכוש תוספת גיגה בכל עת (100₪ לגיגה)',
        'גיבוי',
        'העברת ניהול למשפחה',
        'תמיכה מלאה'
      ],
      limitations: [],
      popular: true,
      icon: FaCrown
    },
    {
      id: 'lifetime-premium',
      name: 'הנצחה פרימיום',
      price: 620,
      period: 'חד-פעמי',
      description: 'שמירה חד פעמית עם 3 גיגה אחסון',
      features: [
        'שמירה קבועה',
        'עריכה חופשית',
        'תחזוקת אתר 35₪ לשנה (חינם בשנה הראשונה, מתחייב מהשנה השנייה)',
        'עד 3 גיגה תמונות וסרטונים (כ־3,000 תמונות או מאות דקות וידאו)',
        'ניתן לרכוש תוספת גיגה בכל עת (100₪ לגיגה)',
        'גיבוי',
        'תמיכה מלאה'
      ],
      limitations: [],
      popular: false,
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
            <div className="add-storage-cta" style={{ marginTop: '1rem', padding: '1rem 1.25rem', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', borderRadius: '12px', border: '1px solid #0ea5e9', textAlign: 'center' }}>
              <strong>צריכים יותר אחסון?</strong>
              <p style={{ margin: '0.5rem 0 0', fontSize: '1rem' }}>ניתן לרכוש תוספת גיגה (100₪ לגיגה) בכל עת – ממסך ניהול הדפים.</p>
              <Link to="/add-storage" className="btn btn-primary" style={{ marginTop: '0.75rem' }}>רכישת תוספת גיגה</Link>
            </div>
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
                  המנוי השנתי (100₪) כולל שמירה, עריכה ותמיכה לשנה. 
                  בהנצחה חד־פעמית (445₪ / 620₪) תחזוקת אתר 35₪ לשנה – חינם בשנה הראשונה, מתחייב מהשנה השנייה. 
                  המסלולים כוללים גיגה או 3 גיגה אחסון; ניתן לרכוש תוספת גיגה בכל עת.
                </p>
              </div>
              <div className="faq-item">
                <h3>איך עובד התשלום?</h3>
                <p>
                  התשלום מתבצע באמצעות כרטיס אשראי או העברה בנקאית. 
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
        </div>
      </footer>
    </main>
  );
}

export default Pricing;
