import React, { useState, useMemo, useEffect, useRef } from 'react'
import { 
  Funnel, 
  ArrowsDownUp, 
  DotsThreeVertical, 
  CaretLeft, 
  CaretRight, 
  MagnifyingGlass,
  Export,
  Plus,
  Eye,
  PencilSimple,
  Trash,
  CheckCircle,
  FilePdf
} from 'phosphor-react'
import { motion, AnimatePresence } from 'framer-motion'
import Dropdown from './Dropdown'
import CustomSelect from './CustomSelect'
import useStore from '../store/useStore'

const DataTable = ({ 
  columns, 
  data, 
  title, 
  onAdd,
  addLabel = "Add New",
  onEdit,
  onDelete,
  onBulkDelete,
  bulkActions = [], // Array of { label, icon, onClick, variant }
  filterOptions = [],
  searchPlaceholder = "Search..." 
}) => {
  const { openConfirm } = useStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [selectedRows, setSelectedRows] = useState([])

  // Prefix based on table title to avoid parameter collisions when multiple tables exist
  const prefix = useMemo(() => {
    if (!title) return 'list'
    return title.toLowerCase().replace(/[^a-z0-9]/g, '_')
  }, [title])

  const urlParamsHandled = useRef(false)

  // Load initial filters/searches/sorting from URL on mount
  useEffect(() => {
    if (!urlParamsHandled.current) {
      const params = new URLSearchParams(window.location.search)
      const q = params.get(`${prefix}_q`)
      const f = params.get(`${prefix}_filter`)
      const p = params.get(`${prefix}_page`)
      const s = params.get(`${prefix}_sort`)
      const o = params.get(`${prefix}_order`)

      if (q !== null) setSearchTerm(q)
      if (f !== null) setActiveFilter(f)
      if (p !== null) setCurrentPage(Number(p) || 1)
      if (s !== null) setSortConfig({ key: s, direction: o || 'asc' })

      urlParamsHandled.current = true
    }
  }, [prefix])

  // Sync state changes with URL query parameters
  useEffect(() => {
    if (!urlParamsHandled.current) return

    const params = new URLSearchParams(window.location.search)

    if (searchTerm) {
      params.set(`${prefix}_q`, searchTerm)
    } else {
      params.delete(`${prefix}_q`)
    }

    if (activeFilter && activeFilter !== 'all') {
      params.set(`${prefix}_filter`, activeFilter)
    } else {
      params.delete(`${prefix}_filter`)
    }

    if (currentPage && currentPage !== 1) {
      params.set(`${prefix}_page`, String(currentPage))
    } else {
      params.delete(`${prefix}_page`)
    }

    if (sortConfig.key) {
      params.set(`${prefix}_sort`, sortConfig.key)
      params.set(`${prefix}_order`, sortConfig.direction)
    } else {
      params.delete(`${prefix}_sort`)
      params.delete(`${prefix}_order`)
    }

    const newSearch = params.toString()
    const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '')
    window.history.replaceState(null, '', newUrl)
  }, [searchTerm, activeFilter, currentPage, sortConfig, prefix])

  // Filtering
  const filteredData = useMemo(() => {
    const safeData = Array.isArray(data) ? data : [];
    return safeData.filter(item => {
      const matchesSearch = Object.values(item).some(val => {
        if (typeof val === 'object' && val !== null) {
          return Object.values(val).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()))
        }
        return String(val).toLowerCase().includes(searchTerm.toLowerCase())
      });
      const matchesFilter = activeFilter === 'all' || Object.values(item).includes(activeFilter);
      return matchesSearch && matchesFilter;
    });
  }, [data, searchTerm, activeFilter])

  // Sorting
  const sortedData = useMemo(() => {
    if (sortConfig.key) {
      return [...filteredData].sort((a, b) => {
        const valA = typeof a[sortConfig.key] === 'object' ? a[sortConfig.key].type : a[sortConfig.key]
        const valB = typeof b[sortConfig.key] === 'object' ? b[sortConfig.key].type : b[sortConfig.key]
        
        if (valA < valB) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (valA > valB) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }
    return filteredData
  }, [filteredData, sortConfig])

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage
    return sortedData.slice(startIndex, startIndex + rowsPerPage)
  }, [sortedData, currentPage, rowsPerPage])

  const totalPages = Math.ceil(sortedData.length / rowsPerPage)

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const toggleSelectAll = () => {
    if (selectedRows.length === paginatedData.length) {
      setSelectedRows([])
    } else {
      setSelectedRows(paginatedData.map(item => item.id))
    }
  }

  const toggleSelectRow = (id) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id))
    } else {
      setSelectedRows([...selectedRows, id])
    }
  }

  const handleExportCSV = () => {
    const headers = columns.map(col => col.label).join(',');
    const rows = sortedData.map(row => 
      columns.map(col => {
        const val = row[col.key];
        return `"${val ? String(val).replace(/"/g, '""') : ''}"`;
      }).join(',')
    ).join('\n');
    const csvContent = "data:text/csv;charset=utf-8," + headers + '\n' + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const handlePrint = () => {
    window.print();
  }

  return (
    <div className="ecare-card ecare-data-table-card" style={{ padding: 0, overflow: 'visible', border: '1px solid #e2e8f0' }}>
      {/* Table Header Controls */}
      <div className="ecare-table-toolbar" style={{ 
        padding: '1.25rem', 
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'white',
        flexWrap: 'wrap',
        gap: '1rem',
        overflowX: 'visible',
        overflowY: 'visible'
      }}>
        <div className="ecare-table-toolbar-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0, minWidth: 0 }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--ecare-text-main)', margin: 0 }}>
            {title}
          </h2>
          <div className="ecare-table-total-badge" style={{ 
            fontSize: '0.75rem', 
            background: 'var(--ecare-primary-bg)', 
            color: 'var(--ecare-primary)', 
            padding: '2px 8px', 
            borderRadius: '20px',
            fontWeight: 600
          }}>
            {filteredData.length} Total
          </div>
        </div>

        <div className="ecare-table-toolbar-controls" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.625rem', flex: '1 1 420px', minWidth: 0, flexWrap: 'wrap' }}>
          <div className="ecare-table-search" style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1 1 220px', minWidth: '180px', maxWidth: '320px' }}>
            <MagnifyingGlass 
              size={16} 
              style={{ position: 'absolute', left: '0.75rem', color: '#94a3b8' }} 
            />
            <input 
              type="text" 
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                height: '38px',
                padding: '0 0.75rem 0 2.25rem',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                fontSize: '0.875rem',
                width: '100%',
                outline: 'none',
                background: '#f8fafc',
                boxSizing: 'border-box',
                flexShrink: 1
              }}
            />
          </div>
          
          {filterOptions.length > 0 && (
            <Dropdown 
              className="ecare-table-filter-dropdown"
              align="right"
              trigger={
                <button 
                  className={`ecare-btn-secondary ${activeFilter !== 'all' ? 'active' : ''}`} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '0.5rem', 
                    height: '38px',
                    padding: '0 1rem', 
                    borderRadius: '10px', 
                    background: activeFilter !== 'all' ? 'var(--ecare-primary-bg)' : 'white', 
                    borderColor: activeFilter !== 'all' ? 'var(--ecare-primary)' : '#e2e8f0', 
                    color: activeFilter !== 'all' ? 'var(--ecare-primary)' : 'var(--ecare-text-muted)',
                    boxSizing: 'border-box',
                    flexShrink: 0,
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Funnel size={16} />
                  <span style={{ whiteSpace: 'nowrap' }}>{activeFilter === 'all' ? 'Filters' : activeFilter}</span>
                </button>
              }
              items={[
                { label: 'Show All', onClick: () => setActiveFilter('all'), isActive: activeFilter === 'all' },
                ...filterOptions.map(opt => ({
                  label: opt.label,
                  onClick: () => setActiveFilter(opt.value),
                  isActive: activeFilter === opt.value
                }))
              ]}
            />
          )}

          <Dropdown 
            className="ecare-table-export-dropdown"
            align="right"
            trigger={
              <button 
                className="ecare-btn-secondary" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '0.5rem', 
                  height: '38px',
                  padding: '0 1rem',
                  borderRadius: '10px',
                  boxSizing: 'border-box',
                  flexShrink: 0,
                  whiteSpace: 'nowrap'
                }}
              >
                <Export size={16} />
                <span style={{ whiteSpace: 'nowrap' }}>Export</span>
              </button>
            }
            items={[
              { label: 'Export to CSV', icon: <FilePdf size={16} />, onClick: handleExportCSV },
              { label: 'Print List', icon: <Eye size={16} />, onClick: handlePrint }
            ]}
          />

          {selectedRows.length > 0 && bulkActions.map((action, idx) => (
            <motion.button
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => action.onClick(selectedRows)}
              style={{
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '0.5rem',
                height: '38px',
                padding: '0 1.25rem', 
                background: action.variant === 'primary' ? 'var(--ecare-primary-bg)' : '#f1f5f9',
                color: action.variant === 'primary' ? 'var(--ecare-primary)' : '#475569',
                border: `1px solid ${action.variant === 'primary' ? 'var(--ecare-primary)' : '#e2e8f0'}`,
                borderRadius: '10px', 
                cursor: 'pointer', 
                fontWeight: 600, 
                fontSize: '0.875rem',
                boxSizing: 'border-box',
                flexShrink: 0,
                whiteSpace: 'nowrap'
              }}
            >
              {action.icon}
              <span style={{ whiteSpace: 'nowrap' }}>{action.label} ({selectedRows.length})</span>
            </motion.button>
          ))}

          {selectedRows.length > 0 && onBulkDelete && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => {
                e.stopPropagation();
                openConfirm({
                  title: 'Bulk Delete',
                  message: `Are you sure you want to delete ${selectedRows.length} selected record(s)? This action cannot be undone.`,
                  onConfirm: () => {
                    onBulkDelete(selectedRows);
                    setSelectedRows([]);
                  }
                });
              }}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '0.5rem', 
                height: '38px',
                padding: '0 1.25rem', 
                background: '#fee2e2', 
                color: '#ef4444', 
                border: '1px solid #fca5a5', 
                borderRadius: '10px', 
                cursor: 'pointer', 
                fontWeight: 600, 
                fontSize: '0.875rem',
                boxSizing: 'border-box',
                flexShrink: 0,
                whiteSpace: 'nowrap'
              }}
            >
              <Trash size={16} weight="bold" />
              <span style={{ whiteSpace: 'nowrap' }}>Delete ({selectedRows.length})</span>
            </motion.button>
          )}

          {onAdd && (
            <button 
              onClick={onAdd}
              className="ecare-button" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '0.5rem', 
                height: '38px',
                padding: '0 1.25rem',
                borderRadius: '10px',
                boxSizing: 'border-box',
                fontSize: '0.875rem',
                fontWeight: 600,
                flexShrink: 0,
                whiteSpace: 'nowrap',
                width: 'auto',
                marginLeft: 'auto'
              }}
            >
              <Plus size={16} weight="bold" />
              <span style={{ whiteSpace: 'nowrap' }}>{addLabel}</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Main */}
      <div className="ecare-table-container" style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
        <table className="ecare-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '850px' }}>
          <thead>
            <tr>
              <th style={{ width: '48px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                <input 
                  type="checkbox" 
                  checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                  onChange={toggleSelectAll}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              {columns.map(col => (
                <th 
                  key={col.key} 
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  style={{ 
                    cursor: col.sortable !== false ? 'pointer' : 'default',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
                    {col.label}
                    {col.sortable !== false && (
                      <ArrowsDownUp 
                        size={12} 
                        color={sortConfig.key === col.key ? 'var(--ecare-primary)' : '#cbd5e1'} 
                      />
                    )}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete) && <th style={{ textAlign: 'right', paddingRight: '2rem', whiteSpace: 'nowrap' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {paginatedData.map((row, index) => (
                <motion.tr 
                  key={row.id || index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  layout
                  className={selectedRows.includes(row.id) ? 'selected' : ''}
                >
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedRows.includes(row.id)}
                      onChange={() => toggleSelectRow(row.id)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  {columns.map(col => (
                    <td key={col.key} data-label={col.label} style={{ whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td data-label="Actions" style={{ textAlign: 'right', paddingRight: '2rem', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        {onEdit && (
                          <button 
                            onClick={() => typeof onEdit === 'function' && onEdit(row)}
                            style={{ 
                              background: '#f1f5f9', 
                              border: 'none', 
                              color: '#475569', 
                              cursor: 'pointer',
                              width: '32px',
                              height: '32px',
                              borderRadius: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--ecare-primary-bg)';
                              e.currentTarget.style.color = 'var(--ecare-primary)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#f1f5f9';
                              e.currentTarget.style.color = '#475569';
                            }}
                            title="Edit"
                          >
                            <PencilSimple size={16} weight="bold" />
                          </button>
                        )}
                        {onDelete && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (typeof onDelete === 'function') onDelete(row.id);
                            }}
                            style={{ 
                              background: '#fee2e2', 
                              border: 'none', 
                              color: '#ef4444', 
                              cursor: 'pointer',
                              width: '32px',
                              height: '32px',
                              borderRadius: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#fecaca'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#fee2e2'}
                            title="Delete"
                          >
                            <Trash size={16} weight="bold" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))}
            </AnimatePresence>
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={columns.length + (onEdit || onDelete ? 2 : 1)} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="ecare-pagination-footer">
        {/* Results count */}
        <div className="ecare-pagination-info">
          Showing <b>{Math.min(filteredData.length, (currentPage - 1) * rowsPerPage + 1)}</b> to <b>{Math.min(filteredData.length, currentPage * rowsPerPage)}</b> of <b>{filteredData.length}</b> results
        </div>

        {/* Controls row */}
        <div className="ecare-pagination-controls">
          {/* Rows per page */}
          <div className="ecare-pagination-rpp">
            <span className="ecare-pagination-rpp-label">Rows:</span>
            <CustomSelect 
              value={rowsPerPage} 
              expandDirection="up"
              onChange={(val) => setRowsPerPage(Number(val))}
              options={[
                { value: 5, label: '5' },
                { value: 10, label: '10' },
                { value: 25, label: '25' },
                { value: 50, label: '50' }
              ]}
              customTriggerStyle={{
                minWidth: 'unset',
                width: '64px',
                height: '32px',
                padding: '0 0.5rem',
                borderRadius: '10px',
                fontSize: '0.8125rem',
                fontWeight: 600
              }}
            />
          </div>

          {/* Divider */}
          <div className="ecare-pagination-divider" />

          {/* Page buttons */}
          <div className="ecare-pagination-pages">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="ecare-pagination-btn"
              aria-label="Previous page"
            >
              <CaretLeft size={15} weight="bold" />
            </button>
            
            {(() => {
              const pages = []
              if (totalPages <= 5) {
                for (let i = 1; i <= totalPages; i++) pages.push(i)
              } else if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, 'ellipsis-right', totalPages)
              } else if (currentPage >= totalPages - 2) {
                pages.push(1, 'ellipsis-left', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
              } else {
                pages.push(1, 'ellipsis-left', currentPage - 1, currentPage, currentPage + 1, 'ellipsis-right', totalPages)
              }

              return pages.map((item, idx) => {
                if (typeof item === 'string') {
                  return (
                    <span key={`sep-${idx}`} className="ecare-pagination-ellipsis">…</span>
                  )
                }
                return (
                  <button 
                    key={item}
                    onClick={() => setCurrentPage(item)}
                    className={`ecare-pagination-btn ${currentPage === item ? 'active' : ''}`}
                    aria-label={`Page ${item}`}
                    aria-current={currentPage === item ? 'page' : undefined}
                  >
                    {item}
                  </button>
                )
              })
            })()}

            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="ecare-pagination-btn"
              aria-label="Next page"
            >
              <CaretRight size={15} weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataTable
