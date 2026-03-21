import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { FaBookOpen, FaArrowRight, FaPrint, FaShareAlt, FaDownload, FaCopy } from 'react-icons/fa';
import { getApiEndpoint } from '../config';
import { buildAzkaraCeremonyTemplate } from '../data/ceremonyTemplates';
import './CeremonyPage.css';

function CeremonyPage() {
  const { id } = useParams();
  const [memorial, setMemorial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetchMemorial = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(getApiEndpoint(`/api/memorials/${id}`));
        if (!cancelled && response.data?.success) {
          setMemorial(response.data.memorial);
        }
      } catch (err) {
        if (!cancelled) {
          setError('לא ניתן לטעון את הטקס כרגע.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchMemorial();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const ceremonyText = useMemo(() => {
    const raw = String(memorial?.ceremony_program || '').trim();
    const hasFullYehiRatzon = raw.includes('וּבִזְכוּת לִמּוּד זֶה');
    if (raw && hasFullYehiRatzon) return raw;

    const deceasedName = String(
      memorial?.hebrewName || memorial?.name || memorial?.fullName || ''
    ).trim();
    const generated = buildAzkaraCeremonyTemplate(deceasedName).ceremony_program;
    return String(generated || raw).trim();
  }, [memorial]);

  const ceremonyTitle = (memorial?.ceremony_title || `טקס עבור ${memorial?.name || ''}`).trim();

  const printCeremony = () => {
    window.print();
  };

  const copyCeremonyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('קישור הטקס הועתק ללוח.');
    } catch {
      alert('לא ניתן להעתיק את הקישור כרגע.');
    }
  };

  const shareCeremony = async () => {
    const sharePayload = {
      title: ceremonyTitle || 'טקס אזכרה אישי',
      text: `טקס אזכרה אישי - ${memorial?.name || ''}`.trim(),
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(sharePayload);
        return;
      }
      await copyCeremonyLink();
    } catch (e) {
      if (e?.name !== 'AbortError') {
        await copyCeremonyLink();
      }
    }
  };

  const downloadCeremonyText = () => {
    const safeName = (memorial?.name || 'memorial').replace(/[<>:"/\\|?*]+/g, '_');
    const fileName = `ceremony-${safeName}.txt`;
    const content = `${ceremonyTitle}\n\n${ceremonyText || 'לא הוגדר עדיין תוכן לטקס האזכרה.'}\n`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="ceremony-page">
        <div className="ceremony-card">טוען טקס...</div>
      </div>
    );
  }

  if (error || !memorial) {
    return (
      <div className="ceremony-page">
        <div className="ceremony-card">
          <p>{error || 'הטקס לא נמצא.'}</p>
          <Link to={`/memorial/${id}`} className="ceremony-back-btn">
            <FaArrowRight /> חזרה לדף ההנצחה
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ceremony-page">
      <div className="ceremony-card">
        <div className="ceremony-header">
          <h1>
            <FaBookOpen /> טקס אזכרה אישי
          </h1>
          <p>{memorial.ceremony_title || `טקס עבור ${memorial.name}`}</p>
        </div>

        <div className="ceremony-actions">
          <Link to={`/memorial/${id}`} className="ceremony-back-btn">
            <FaArrowRight /> חזרה לדף ההנצחה
          </Link>
          <button type="button" className="ceremony-action-btn" onClick={printCeremony}>
            <FaPrint /> הדפסה
          </button>
          <button type="button" className="ceremony-action-btn" onClick={downloadCeremonyText}>
            <FaDownload /> הורדה
          </button>
          <button type="button" className="ceremony-action-btn" onClick={shareCeremony}>
            <FaShareAlt /> שיתוף
          </button>
          <button type="button" className="ceremony-action-btn ceremony-action-btn--secondary" onClick={copyCeremonyLink}>
            <FaCopy /> העתקת קישור
          </button>
        </div>

        <pre className="ceremony-full-text">
          {ceremonyText || 'לא הוגדר עדיין תוכן לטקס האזכרה.'}
        </pre>
      </div>
    </div>
  );
}

export default CeremonyPage;
