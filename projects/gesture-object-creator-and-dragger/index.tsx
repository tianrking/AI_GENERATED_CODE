
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { VIDEO_WIDTH, VIDEO_HEIGHT } from './constants';


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Set CSS variables for video dimensions
document.documentElement.style.setProperty('--video-width', `${VIDEO_WIDTH}px`);
document.documentElement.style.setProperty('--video-height', `${VIDEO_HEIGHT}px`);

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
    