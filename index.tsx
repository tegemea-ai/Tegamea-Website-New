
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

/**
 * Dynamic basename detection for subpath environments.
 */
const getBasename = () => {
  const path = window.location.pathname;
  const segments = path.split('/').filter(Boolean);
  
  // Detect if we are in a preview environment with a subpath ID
  if (segments.length > 0 && (segments[0].length > 20 || segments[0].includes('-'))) {
    return `/${segments[0]}`;
  }
  return "/";
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter basename={getBasename()}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
