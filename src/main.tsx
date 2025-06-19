
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('main.tsx: Starting application initialization...');
console.log('main.tsx: React version check');

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('main.tsx: Root element not found!');
} else {
  console.log('main.tsx: Root element found, creating React root...');
}

try {
  createRoot(rootElement!).render(<App />);
  console.log('main.tsx: App rendered successfully');
} catch (error) {
  console.error('main.tsx: Error rendering app:', error);
}
