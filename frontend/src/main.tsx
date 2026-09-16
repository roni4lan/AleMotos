import React from 'react';
import ReactDOM from 'react-dom/client';
import './tailwind.css';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { syncEngine } from './shared/sync/syncEngine';
import { DialogProvider } from './shared/components/DialogProvider';

// Inicializar el motor de sincronización offline
syncEngine.startListening();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <DialogProvider>
        <App />
      </DialogProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
