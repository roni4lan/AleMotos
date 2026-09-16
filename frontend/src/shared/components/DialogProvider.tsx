import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DialogOptions {
  title?: string;
  message: string;
  type?: 'alert' | 'confirm' | 'prompt';
  confirmText?: string;
  cancelText?: string;
  defaultValue?: string;
}

interface DialogContextType {
  showAlert: (message: string, title?: string) => Promise<void>;
  showConfirm: (message: string, title?: string) => Promise<boolean>;
  showPrompt: (message: string, title?: string, defaultValue?: string) => Promise<string | null>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) throw new Error('useDialog must be used within DialogProvider');
  return context;
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<(DialogOptions & { resolve: (val: any) => void }) | null>(null);

  const showAlert = (message: string, title = 'Atención') => {
    return new Promise<void>((resolve) => {
      setDialog({ type: 'alert', message, title, resolve, confirmText: 'Aceptar' });
    });
  };

  const showConfirm = (message: string, title = 'Confirmar') => {
    return new Promise<boolean>((resolve) => {
      setDialog({ type: 'confirm', message, title, resolve, confirmText: 'Aceptar', cancelText: 'Cancelar' });
    });
  };

  const showPrompt = (message: string, title = 'Ingresar dato', defaultValue = '') => {
    return new Promise<string | null>((resolve) => {
      setDialog({ type: 'prompt', message, title, resolve, confirmText: 'Aceptar', cancelText: 'Cancelar', defaultValue });
    });
  };

  const handleClose = (value: any) => {
    if (dialog) {
      dialog.resolve(value);
      setDialog(null);
    }
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
      {children}
      {dialog && <DialogRenderer dialog={dialog} handleClose={handleClose} />}
    </DialogContext.Provider>
  );
}

function DialogRenderer({ dialog, handleClose }: { dialog: any, handleClose: (val: any) => void }) {
  const [inputValue, setInputValue] = useState(dialog.defaultValue || '');

  const getIcon = () => {
    if (dialog.type === 'confirm') {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 sm:h-12 sm:w-12">
          <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      );
    }
    if (dialog.type === 'prompt') {
      return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 sm:h-12 sm:w-12">
          <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
          </svg>
        </div>
      );
    }
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 sm:h-12 sm:w-12">
        <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-zinc-950/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" 
      onClick={() => dialog.type === 'alert' ? handleClose(true) : handleClose(null)}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-zinc-200" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 sm:p-8">
          <div className="sm:flex sm:items-start">
            {getIcon()}
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
              <h3 className="text-lg font-semibold leading-6 text-zinc-900 tracking-tight">
                {dialog.title}
              </h3>
              <div className="mt-3">
                <p className="text-sm text-zinc-500 leading-relaxed">
                  {dialog.message}
                </p>
                {dialog.type === 'prompt' && (
                  <input
                    type="text"
                    className="w-full mt-4 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all shadow-sm"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleClose(inputValue);
                      if (e.key === 'Escape') handleClose(null);
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-50 px-6 py-4 sm:flex sm:flex-row-reverse sm:px-8 border-t border-zinc-100">
          <button 
            type="button"
            className={`inline-flex w-full justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto transition-colors ${
              dialog.type === 'confirm' 
                ? 'bg-red-600 hover:bg-red-500' 
                : 'bg-zinc-900 hover:bg-zinc-800'
            }`}
            onClick={() => dialog.type === 'prompt' ? handleClose(inputValue) : handleClose(true)}
          >
            {dialog.confirmText}
          </button>
          {(dialog.type === 'confirm' || dialog.type === 'prompt') && (
            <button 
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 sm:mt-0 sm:w-auto transition-colors"
              onClick={() => handleClose(null)}
            >
              {dialog.cancelText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
