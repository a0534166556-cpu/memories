/**
 * רשימת כל מה שכלול בדף זיכרון – לשימוש בדף תמחור ובבחירת תוכנית שמירה.
 * כולל אייקון לכל תכונה.
 */
import {
  FaHeart,
  FaImages,
  FaBook,
  FaHistory,
  FaBookOpen,
  FaFire,
  FaComment,
  FaMapMarkerAlt,
  FaMusic,
  FaBell,
  FaQrcode,
  FaShareAlt,
  FaPrint,
  FaCalendarAlt,
  FaHandsHelping,
  FaHandHoldingHeart
} from 'react-icons/fa';

export const memorialPageFeatures = [
  { label: 'פרופיל ותקציר — שם עברי ולועזי, תאריכים, תמונת כותרת (עריכה חוזרת במסלולי שמירה)', Icon: FaHeart },
  { label: 'גלריית זיכרונות — תמונות וסרטונים', Icon: FaImages },
  { label: 'סיפור חיים — ביוגרפיה', Icon: FaBook },
  { label: 'ציר חיים — אירועים לאורך השנים', Icon: FaHistory },
  { label: 'טקס אזכרה אישי — תבנית מלאה ועריכה חופשית', Icon: FaBookOpen },
  { label: 'פרקי תהילים ומשניות לעילוי הנשמה', Icon: FaBook },
  { label: 'הדלקת נר וירטואלי', Icon: FaFire },
  { label: 'תנחומים — הודעות ממבקרים', Icon: FaComment },
  { label: 'מיקום הקבורה והנחיות ניווט', Icon: FaMapMarkerAlt },
  { label: 'מוזיקת רקע', Icon: FaMusic },
  { label: 'תזכורת לאזכרה במייל', Icon: FaBell },
  { label: 'קוד QR להדפסה והצבה על המצבה', Icon: FaQrcode },
  { label: 'שיתוף — וואטסאפ, אימייל, העתקת קישור', Icon: FaShareAlt },
  { label: 'הדפסה ובחירת גודל טקסט (נגישות)', Icon: FaPrint },
  { label: 'אירוע שנתי לזכרו — תאריך, מקום, קישור לרישום/פרטים', Icon: FaCalendarAlt },
  { label: 'קישור לתרומה לזכר (אופציונלי)', Icon: FaHandHoldingHeart },
  { label: 'קישור למשאבים למשפחות (תמיכה וקהילה)', Icon: FaHandsHelping }
];
