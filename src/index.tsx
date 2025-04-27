import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './app';
import MenusPage from './MenusPage';
// import eruda from 'eruda';

// eruda.init();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/menus" element={<App />} />
        <Route path="/" element={<MenusPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
