import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import '@fortawesome/fontawesome-free/css/all.min.css';
import axios from 'axios';

// Global request interceptor to dynamically replace localhost:8000 with the active hostname
axios.interceptors.request.use((config) => {
    if (config.url && config.url.includes('localhost:8000')) {
        config.url = config.url.replace('localhost:8000', `${window.location.hostname}:8000`);
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Intercept click on file download links to rewrite localhost:8000 to the current host
document.addEventListener('click', (e) => {
    const origin = e.target.closest('a');
    if (origin && origin.href && origin.href.includes('localhost:8000')) {
        origin.href = origin.href.replace('localhost:8000', `${window.location.hostname}:8000`);
    }
}, { capture: true });

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
