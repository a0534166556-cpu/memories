import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Component } from 'react';
import Home from './pages/Home';
import Gallery from './pages/Gallery';
import MemorialExample from './pages/MemorialExample';
import CreateMemorial from './pages/CreateMemorial';
import MemorialPage from './pages/MemorialPage';
import './App.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', direction: 'rtl' }}>
          <h1>אירעה שגיאה</h1>
          <p>אנא רענן את הדף</p>
          <button onClick={() => window.location.reload()}>רענן דף</button>
          <details style={{ marginTop: '20px', textAlign: 'right' }}>
            <summary>פרטי השגיאה</summary>
            <pre>{this.state.error?.toString()}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/gallery/example" element={<MemorialExample />} />
            <Route path="/create" element={<CreateMemorial />} />
            <Route path="/memorial/:id" element={<MemorialPage />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;

