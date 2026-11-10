import React, { useState } from 'react';
import { UserRecord } from '../types.ts';
import { CloseIcon, SearchIcon, InfoCircleIcon, CheckIcon } from './icons.tsx';

interface SplitSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserRecord[];
  onConfirmSelection: (selectedUserIds: string[]) => void;
}

export const SplitSelectorModal: React.FC<SplitSelectorModalProps> = ({
  isOpen,
  onClose,
  users,
  onConfirmSelection
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>(['usr_101', 'usr_102']);
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'All Users', count: users.length },
    { id: 'Engineering', label: 'Engineering', count: users.filter((u) => u.department === 'Engineering').length },
    { id: 'Product & Design', label: 'Product & Design', count: users.filter((u) => u.department === 'Product & Design').length },
    { id: 'Finance & Legal', label: 'Finance & Legal', count: users.filter((u) => u.department === 'Finance & Legal').length },
    { id: 'Sales & Operations', label: 'Sales & Operations', count: users.filter((u) => u.department === 'Sales & Operations').length }
  ];

  const filteredUsers = users.filter((u) => {
    const matchesCategory = activeCategory === 'all' || u.department === activeCategory;
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleSelectUser = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allCurrent = filteredUsers.map((u) => u.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...allCurrent])));
    } else {
      const currentIds = new Set(filteredUsers.map((u) => u.id));
      setSelectedIds((prev) => prev.filter((id) => !currentIds.has(id)));
    }
  };

  const isAllSelected =
    filteredUsers.length > 0 && filteredUsers.every((u) => selectedIds.includes(u.id));

  return (
    <div className="modal-overlay open">
      <div className="modal-box modal-box-split" style={{ width: '840px', maxWidth: '94vw' }}>
        {/* Header */}
        <div className="modal-header">
          <h2>Assign Users to Security Group</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Info banner */}
        <div className="alert-banner alert-banner-info" style={{ marginBottom: '16px' }}>
          <span className="alert-banner-icon">
            <InfoCircleIcon size={18} />
          </span>
          <div className="alert-banner-content">
            <strong>Scoped Policy Assignment</strong>
            <p>
              Users added will automatically inherit single sign-on access rules, session timers, and required authentication factors bound to this group.{' '}
              <a href="#learn-more" onClick={(e) => e.preventDefault()}>Learn more</a>
            </p>
          </div>
        </div>

        {/* Split Modal Layout: Left menu/tabs with counts + Right dynamic datatable view */}
        <div className="split-modal-container">
          {/* Left Category List */}
          <aside className="split-modal-left">
            <div className="split-menu-header">Filter by Category</div>
            <div className="split-menu-list">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`split-menu-item ${activeCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <span className="split-item-name">{cat.label}</span>
                  <span className="split-item-count">{cat.count}</span>
                </button>
              ))}
            </div>

            <div className="split-selected-summary">
              <strong>{selectedIds.length}</strong> users selected for assignment
            </div>
          </aside>

          {/* Right Dynamic Datatable */}
          <section className="split-modal-right">
            <div className="split-toolbar">
              <div className="search-box">
                <SearchIcon size={15} />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="split-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '38px' }}>
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </th>
                    <th>User</th>
                    <th>Department</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                        No users found in this category.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isSelected = selectedIds.includes(user.id);
                      return (
                        <tr
                          key={user.id}
                          className={isSelected ? 'row-selected' : ''}
                          onClick={() => toggleSelectUser(user.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectUser(user.id)}
                            />
                          </td>
                          <td>
                            <div className="user-cell">
                              <div
                                className="user-avatar-sm"
                                style={{ background: user.avatarBg }}
                              >
                                {user.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="user-info">
                                <div className="user-name">{user.name}</div>
                                <div className="user-email">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="pill pill-muted">{user.department}</span>
                          </td>
                          <td>
                            {user.status === 'active' ? (
                              <span className="pill pill-success">Active</span>
                            ) : (
                              <span className="pill pill-muted">{user.status}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ marginTop: '20px' }}>
          <button className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              onConfirmSelection(selectedIds);
              onClose();
            }}
          >
            Assign Selected ({selectedIds.length})
          </button>
        </div>
      </div>
    </div>
  );
};
