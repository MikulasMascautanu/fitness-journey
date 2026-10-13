import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import './styles.css';

function App() {
  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="/">Fit Log<span className="brand-dot" /></a>
      <span className="nav-caption">YOUR DAILY PRACTICE</span>
      <nav aria-label="Main navigation">
        <NavLink to="/" end>Body</NavLink>
        <NavLink to="/nutrition">Nutrition</NavLink>
      </nav>
      <div className="sidebar-bottom"><p className="muted">Small steps. Lasting progress.</p></div>
    </aside>
    <main className="main-content"><Routes>
      <Route path="/" element={<><p className="eyebrow">YOUR PROGRESS</p><h1>Body</h1><div className="card"><h2>A little more perspective.</h2><p className="muted">Your weight, measurements, and body composition in one place.</p></div></>} />
      <Route path="/nutrition" element={<><p className="eyebrow">YOUR DAILY FUEL</p><h1>Nutrition</h1><div className="card"><h2>Make each day count.</h2><p className="muted">Set your targets and keep a record of your daily nutrition.</p></div></>} />
      <Route path="*" element={<div className="card"><h1>Page not found</h1><a href="/">Back to Body</a></div>} />
    </Routes></main>
  </div>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter><App /></BrowserRouter></React.StrictMode>);
