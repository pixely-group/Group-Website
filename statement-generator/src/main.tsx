import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './document/document.css';
import App from './App';
import { PrintApp } from './print/PrintApp';

const isPrintRoute = window.location.pathname.replace(/\/+$/, '') === '/print';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

createRoot(container).render(<StrictMode>{isPrintRoute ? <PrintApp /> : <App />}</StrictMode>);
