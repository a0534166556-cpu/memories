import { useState } from 'react';
import { tehilimData } from '../data/tehilim';
import './TehilimReader.css';

function TehilimReader({ chapters }) {
  const [currentChapter, setCurrentChapter] = useState(0);
  
  const chapterNumbers = chapters
    .split(',')
    .map(ch => parseInt(ch.trim()))
    .filter(ch => ch >= 1 && ch <= 150);

  if (chapterNumbers.length === 0) {
    return <p>לא נבחרו פרקי תהילים</p>;
  }

  const currentChapterNum = chapterNumbers[currentChapter];
  const chapterData = tehilimData[currentChapterNum];

  const nextChapter = () => {
    if (currentChapter < chapterNumbers.length - 1) {
      setCurrentChapter(currentChapter + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevChapter = () => {
    if (currentChapter > 0) {
      setCurrentChapter(currentChapter - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="tehilim-reader">
      <div className="chapter-selector">
        <div className="chapter-nav">
          <button
            className="nav-btn"
            onClick={prevChapter}
            disabled={currentChapter === 0}
          >
            ← פרק קודם
          </button>
          <div className="chapter-number">
            פרק {currentChapterNum}
            <span className="chapter-count">
              ({currentChapter + 1} מתוך {chapterNumbers.length})
            </span>
          </div>
          <button
            className="nav-btn"
            onClick={nextChapter}
            disabled={currentChapter === chapterNumbers.length - 1}
          >
            פרק הבא →
          </button>
        </div>
      </div>

      <div className="chapter-content">
        {chapterData ? (
          <>
            {chapterData.verses.map((verse, index) => (
              <p key={index} className="verse">
                <span className="verse-number">{index + 1}</span>
                {verse}
              </p>
            ))}
          </>
        ) : (
          <div className="no-content">
            <p>פרק {currentChapterNum} לא זמין כרגע בקובץ המקומי</p>
            <p style={{ marginTop: '15px', fontSize: '0.95rem' }}>
              ניתן לקרוא את הפרק ב-{' '}
              <a 
                href={`https://www.sefaria.org/Psalms.${currentChapterNum}?lang=he`} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#667eea', textDecoration: 'underline' }}
              >
                ספריא
              </a>
              {', '}
              <a 
                href={`https://www.yo-yoo.co.il/tol/psalms/psalms${currentChapterNum}.html`} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#667eea', textDecoration: 'underline' }}
              >
                יויו
              </a>
              {' '}או במאגרי תהילים אונליין נוספים
            </p>
          </div>
        )}
      </div>

      <div className="chapter-nav-bottom">
        <button
          className="nav-btn"
          onClick={prevChapter}
          disabled={currentChapter === 0}
        >
          ← פרק קודם
        </button>
        <button
          className="nav-btn"
          onClick={nextChapter}
          disabled={currentChapter === chapterNumbers.length - 1}
        >
          פרק הבא →
        </button>
      </div>
    </div>
  );
}

export default TehilimReader;

