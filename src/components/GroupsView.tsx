import React, { useState } from 'react';
import { GroupRecord } from '../types.ts';
import {
  SearchIcon,
  PlusIcon,
  DotsIcon,
  TrashIcon,
  EditIcon,
  UserCheckIcon,
  SortChevronsIcon
} from './icons.tsx';
import { EmptyState } from './EmptyState.tsx';

interface GroupsViewProps {
  groups: GroupRecord[];
  onOpenSplitAssignModal: () => void;
  showToast: (msg: string) => void;
}

export const GroupsView: React.FC<GroupsViewProps> = ({
  groups,
  onOpenSplitAssignModal,
  showToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredGroups.map((g) => g.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectGroup = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllSelected =
    filteredGroups.length > 0 && filteredGroups.every((g) => selectedIds.includes(g.id));

  return (
    <div className="standard-data-view">
      {/* Top Bar */}
      <div className="data-view-topbar">
        <div className="topbar-left">
          <h1>Groups</h1>
        </div>
        <div className="topbar-right">
          <div className="search-box">
            <SearchIcon size={15} />
            <input
              type="text"
              placeholder="Search groups or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button className="btn btn-outline" onClick={onOpenSplitAssignModal}>
            <UserCheckIcon size={15} /> Bulk Member Assignment
          </button>

          <button
            className="btn btn-primary"
            onClick={() => showToast('New Group creation modal opened')}
          >
            <PlusIcon size={15} /> Create Group
          </button>
        </div>
      </div>

      {/* Main Panel Container */}
      <div className="card datatable-card" style={{ padding: 0, overflow: 'hidden' }}>
        {filteredGroups.length === 0 ? (
          <EmptyState
            title="No Groups Found"
            description="No groups match your current search keywords."
            actionText="Clear Search"
            onAction={() => setSearchQuery('')}
          />
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '42px', paddingLeft: '16px' }}>
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </th>
                  <th>
                    <div className="th-sortable">
                      Group Name <SortChevronsIcon size={12} />
                    </div>
                  </th>
                  <th>
                    <div className="th-sortable">
                      Type <SortChevronsIcon size={12} />
                    </div>
                  </th>
                  <th>
                    <div className="th-sortable">
                      Members <SortChevronsIcon size={12} />
                    </div>
                  </th>
                  <th>Tags &amp; Access Policies</th>
                  <th>Source</th>
                  <th style={{ width: '60px', textAlign: 'right', paddingRight: '16px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGroups.map((grp) => {
                  const isChecked = selectedIds.includes(grp.id);
                  const isMenuOpen = openDropdownId === grp.id;

                  return (
                    <tr
                      key={grp.id}
                      className={isChecked ? 'row-selected' : ''}
                      onClick={() => toggleSelectGroup(grp.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ paddingLeft: '16px' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectGroup(grp.id)}
                        />
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{grp.name}</div>
                        <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {grp.description}
                        </div>
                      </td>
                      <td>
                        <span className={`pill ${grp.type === 'Security' ? 'pill-info' : grp.type === 'Synced' ? 'pill-success' : 'pill-muted'}`}>
                          {grp.type}
                        </span>
                      </td>
                      <td>
                        <strong style={{ fontSize: '13.5px' }}>{grp.memberCount}</strong> users
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {grp.tags.map((t) => (
                            <span key={t} className="tag-pill" style={{ padding: '2px 8px', fontSize: '11.5px' }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                        {grp.source}
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '16px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="dropdown" style={{ display: 'inline-block' }}>
                          <button
                            className="dir-card-menu"
                            onClick={() => setOpenDropdownId(isMenuOpen ? null : grp.id)}
                            aria-label="Group actions"
                          >
                            <DotsIcon size={16} />
                          </button>
                          {isMenuOpen && (
                            <div className="dropdown-menu open" style={{ right: 0, minWidth: '170px' }}>
                              <button onClick={() => { setOpenDropdownId(null); onOpenSplitAssignModal(); }}>
                                <UserCheckIcon size={14} /> Manage Members
                              </button>
                              <button onClick={() => { setOpenDropdownId(null); showToast(`Edit policy for ${grp.name}`); }}>
                                <EditIcon size={14} /> Edit Group Policy
                              </button>
                              <button
                                className="danger"
                                onClick={() => {
                                  setOpenDropdownId(null);
                                  showToast(`Deleted ${grp.name}`);
                                }}
                              >
                                <TrashIcon size={14} /> Delete Group
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="pagination-bar">
          <div className="pagination-left">
            <span className="pagination-label">Page Size</span>
            <select className="select select-sm pagination-select" defaultValue={20}>
              <option value={10}>10 ∨</option>
              <option value={20}>20 ∨</option>
              <option value={50}>50 ∨</option>
            </select>
            <span className="pagination-total-text">
              Showing 1–{filteredGroups.length} of {groups.length} groups
            </span>
          </div>
          <div className="pagination-right">
            <button className="page-nav-btn" disabled>&lt;</button>
            <button className="page-num-btn active">1</button>
            <button className="page-nav-btn" disabled>&gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
};
