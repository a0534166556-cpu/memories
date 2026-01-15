import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaChevronRight, FaChevronLeft, FaSpinner } from 'react-icons/fa';
import axios from 'axios';
import { getApiEndpoint } from '../config';
import './Gallery.css';

function Gallery() {
  const [memorials, setMemorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(12); // 12 memorials per page

  useEffect(() => {
    fetchMemorials();
  }, [page]);

  const fetchMemorials = async () => {
    setLoading(true);
    try {
      const response = await axios.get(getApiEndpoint('/api/memorials'), {
        params: {
          page,
          limit
        }
      });
      
      if (response.data.success) {
        setMemorials(response.data.memorials || []);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages || 1);
        }
      }
    } catch (error) {
      console.error('Error fetching memorials:', error);
      setMemorials([]);
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="gallery-page" role="main">
      <section className="gallery-hero" aria-labelledby="gallery-heading">
        <div className="gallery-container">
          <h1 id="gallery-heading">גלריית דפי זיכרון לדוגמה</h1>
          <p>
            התרשמו מדפי זיכרון שנבנו עבור משפחות שונות, קבלו השראה לפריסת התוכן, ולמדו איך ניתן לשלב
            תמונות, סיפורים, וקטעי שמע.
          </p>
          <div className="gallery-hero__actions">
            <Link to="/gallery/example" className="btn btn-secondary">
              דף זיכרון לדוגמה
            </Link>
            <Link to="/create" className="btn btn-primary">
            <FaPlus /> יצירת דף זיכרון משלכם
          </Link>
          </div>
        </div>
      </section>

      <section className="gallery-list" aria-label="דפי זיכרון">
        <div className="gallery-container">
          {loading ? (
            <div className="loading-container">
              <FaSpinner className="spinner" />
              <p>טוען דפי זיכרון...</p>
            </div>
          ) : memorials.length === 0 ? (
            <div className="empty-state">
              <p>עדיין לא נוצרו דפי זיכרון</p>
              <Link to="/create" className="btn btn-primary">
                <FaPlus /> צור דף זיכרון ראשון
              </Link>
            </div>
          ) : (
            <>
              {memorials.map((memorial) => {
                const images = Array.isArray(memorial.images) ? memorial.images : JSON.parse(memorial.images || '[]');
                const imageUrl = images.length > 0 ? images[0] : (memorial.heroImage || 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80');
                const years = memorial.birthDate && memorial.deathDate 
                  ? `${new Date(memorial.birthDate).getFullYear()} – ${new Date(memorial.deathDate).getFullYear()}`
                  : memorial.birthDate 
                  ? `נולד ${new Date(memorial.birthDate).getFullYear()}`
                  : '';

                return (
                  <article key={memorial.id} className="gallery-card">
                    <Link to={`/memorial/${memorial.id}`} className="gallery-card__link">
                      <img 
                        src={imageUrl} 
                        alt={`דף זיכרון - ${memorial.name}`} 
                        className="gallery-card__image"
                        loading="lazy"
                      />
                      <div className="gallery-card__content">
                        <header>
                          <h2>{memorial.name}</h2>
                          {years && <p className="gallery-card__years">{years}</p>}
                        </header>
                        {memorial.heroSummary && (
                          <p className="gallery-card__description">{memorial.heroSummary}</p>
                        )}
                        <div className="gallery-card__footer">
                          <span className="view-link">צפה בדף הזיכרון →</span>
                        </div>
                      </div>
                    </Link>
                  </article>
                );
              })}

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <FaChevronRight /> הקודם
                  </button>
                  <span className="pagination-info">
                    עמוד {page} מתוך {totalPages}
                  </span>
                  <button
                    className="pagination-btn"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    הבא <FaChevronLeft />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default Gallery;


