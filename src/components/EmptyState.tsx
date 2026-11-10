import React from 'react';
import { SearchIcon } from './icons.tsx';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Found',
  description = 'There are no records matching your current filter criteria.',
  actionText,
  onAction
}) => {
  return (
    <div className="empty-state-card">
      <div className="empty-state-icon-wrap">
        <SearchIcon size={32} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {actionText && onAction && (
        <button className="btn btn-outline btn-sm" onClick={onAction} style={{ marginTop: '14px' }}>
          {actionText}
        </button>
      )}
    </div>
  );
};
