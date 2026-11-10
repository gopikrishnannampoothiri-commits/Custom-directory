import React from 'react';
import { ToastMessage } from '../types.ts';
import { CheckIcon } from './icons.tsx';

interface ToastContainerProps {
  toasts: ToastMessage[];
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  return (
    <div id="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className="toast show">
          <span className="toast-icon">
            <CheckIcon size={16} />
          </span>
          <span className="toast-text">{t.text}</span>
        </div>
      ))}
    </div>
  );
};

