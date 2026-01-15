import { Link } from 'react-router-dom';
import { FaTimesCircle } from 'react-icons/fa';
import './PaymentSuccess.css';

function PaymentCancel() {
  return (
    <main className="payment-page">
      <div className="payment-container error">
        <FaTimesCircle className="success-icon" style={{ color: '#dc3545' }} />
        <h1>התשלום בוטל</h1>
        <p>התשלום בוטל. ניתן לנסות שוב בכל עת.</p>
        <div className="payment-actions">
          <Link to="/pricing" className="btn btn-primary">
            חזור לתמחור
          </Link>
          <Link to="/" className="btn btn-secondary">
            חזרה לדף הבית
          </Link>
        </div>
      </div>
    </main>
  );
}

export default PaymentCancel;
