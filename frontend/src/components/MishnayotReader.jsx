import { useState } from 'react';
import { mishnayotData } from '../data/mishnayot';
import './MishnayotReader.css';

function MishnayotReader({ mishnayot }) {
  const [currentMishnaIndex, setCurrentMishnaIndex] = useState(0);
  
  // Parse mishnayot string (comma-separated)
  const mishnaKeys = mishnayot
    .split(',')
    .map(m => m.trim())
    .filter(m => m.length > 0);

  if (mishnaKeys.length === 0) {
    return <p>לא נבחרו משניות</p>;
  }

  const currentMishnaKey = mishnaKeys[currentMishnaIndex];
  const mishnaData = mishnayotData[currentMishnaKey];

  const nextMishna = () => {
    if (currentMishnaIndex < mishnaKeys.length - 1) {
      setCurrentMishnaIndex(currentMishnaIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevMishna = () => {
    if (currentMishnaIndex > 0) {
      setCurrentMishnaIndex(currentMishnaIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="mishnayot-reader">
      <div className="mishna-selector">
        <div className="mishna-nav">
          <button
            className="nav-btn"
            onClick={prevMishna}
            disabled={currentMishnaIndex === 0}
          >
            ← משנה קודמת
          </button>
          <div className="mishna-number">
            {currentMishnaKey}
            <span className="mishna-count">
              ({currentMishnaIndex + 1} מתוך {mishnaKeys.length})
            </span>
          </div>
          <button
            className="nav-btn"
            onClick={nextMishna}
            disabled={currentMishnaIndex === mishnaKeys.length - 1}
          >
            משנה הבאה →
          </button>
        </div>
      </div>

      <div className="mishna-content">
        {mishnaData ? (
          <>
            <h3 className="mishna-name">{mishnaData.name}</h3>
            {mishnaData.mishnayot.map((mishna, index) => (
              <div key={index} className="mishna-item-full">
                <div className="mishna-header">
                  <span className="mishna-number-badge">משנה {mishna.number}</span>
                </div>
                <p className="mishna-text">{mishna.text}</p>
              </div>
            ))}
            {!mishnaData.mishnayot || mishnaData.mishnayot.length === 0 && (
              <div className="no-content">
                <p>המשנה "{currentMishnaKey}" תפורסם בקרוב</p>
                <p style={{ marginTop: '15px', fontSize: '0.95rem' }}>
                  ניתן לחפש את הטקסט המלא ב-{' '}
                  <a 
                    href={`https://www.sefaria.org/${currentMishnaKey.replace(' ', '.')}?lang=he`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#667eea', textDecoration: 'underline' }}
                  >
                    ספריא
                  </a>
                  {' '}או במאגרי משניות אונליין נוספים
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="no-content">
            <p>המשנה "{currentMishnaKey}" לא זמינה כרגע בקובץ המקומי</p>
            <p style={{ marginTop: '15px', fontSize: '0.95rem' }}>
              ניתן לחפש את הטקסט המלא ב-{' '}
              <a 
                href={`https://www.sefaria.org/${currentMishnaKey.replace(' ', '.')}?lang=he`} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#667eea', textDecoration: 'underline' }}
              >
                ספריא
              </a>
              {' '}או במאגרי משניות אונליין נוספים
            </p>
          </div>
        )}
      </div>

      <div className="mishna-nav-bottom">
        <button
          className="nav-btn"
          onClick={prevMishna}
          disabled={currentMishnaIndex === 0}
        >
          ← משנה קודמת
        </button>
        <button
          className="nav-btn"
          onClick={nextMishna}
          disabled={currentMishnaIndex === mishnaKeys.length - 1}
        >
          משנה הבאה →
        </button>
      </div>
    </div>
  );
}

export default MishnayotReader;
