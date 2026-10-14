import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './animations/animations.css';
import './styles/mobile-card.css';
import './styles/cocktails.css';

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
