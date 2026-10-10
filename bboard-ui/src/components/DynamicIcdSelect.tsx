import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ICD10_REGISTRY, getDiseaseCondition, type DynamicIcdOption, type IcdCondition } from '../config/icdRegistry';

export interface DynamicIcdSelectProps {
  value: string;
  onChange: (code: string, condition?: IcdCondition) => void;
  allowAll?: boolean;
  allLabel?: string;
  allCount?: number;
  dynamicCodes?: DynamicIcdOption[];
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  allowCustomInput?: boolean;
  id?: string;
}

export const DynamicIcdSelect: React.FC<DynamicIcdSelectProps> = ({
  value,
  onChange,
  allowAll = false,
  allLabel = 'All Diagnoses',
  dynamicCodes = [],
  disabled = false,
  label,
  placeholder = 'Select diagnosis...',
  allowCustomInput = true,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      setTimeout(() => searchInputRef.current?.focus(), 40);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const cleanQuery = search.trim().toUpperCase();

  // Combine dynamic hospital codes with registry (deduplicated)
  const allOptions = useMemo(() => {
    const map = new Map<string, { code: string; name: string }>();

    // 1. Dynamic hospital codes first
    dynamicCodes.forEach((d) => {
      map.set(d.code.toUpperCase(), { code: d.code, name: d.name });
    });

    // 2. Fallback WHO registry codes
    Object.values(ICD10_REGISTRY).forEach((item) => {
      const codeUpper = item.code.toUpperCase();
      if (!map.has(codeUpper)) {
        map.set(codeUpper, { code: item.code, name: item.name });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
  }, [dynamicCodes]);

  // Filtered options based on user search
  const filteredOptions = useMemo(() => {
    if (!cleanQuery) return allOptions;
    return allOptions.filter(
      (opt) => opt.code.toUpperCase().includes(cleanQuery) || opt.name.toUpperCase().includes(cleanQuery),
    );
  }, [allOptions, cleanQuery]);

  const hasExactMatch = cleanQuery ? allOptions.some((opt) => opt.code.toUpperCase() === cleanQuery) : false;

  const isAllSelected = value === '' || value.toUpperCase() === 'ALL';
  const selectedCondition = value && !isAllSelected ? getDiseaseCondition(value) : null;

  const handleSelect = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (clean === 'ALL' || clean === '') {
      onChange('');
    } else {
      onChange(clean, getDiseaseCondition(clean));
    }
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="clean-select" ref={containerRef} id={id}>
      {label && <label className="clean-select-label">{label}</label>}

      {/* Trigger Button */}
      <button
        type="button"
        className={`clean-select-trigger ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="clean-select-display">
          {isAllSelected && allowAll ? (
            <span className="clean-select-text all">{allLabel}</span>
          ) : selectedCondition ? (
            <span className="clean-select-text">
              <strong className="clean-code-pill">{selectedCondition.code}</strong>
              <span className="clean-name-text">{selectedCondition.name}</span>
            </span>
          ) : (
            <span className="clean-placeholder">{placeholder}</span>
          )}
        </span>
        <svg className={`clean-arrow ${isOpen ? 'up' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="clean-select-menu" role="listbox">
          {/* Quick Search */}
          <div className="clean-select-search-wrap">
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (filteredOptions.length > 0) {
                    handleSelect(filteredOptions[0].code);
                  } else if (allowCustomInput && cleanQuery) {
                    handleSelect(cleanQuery);
                  }
                }
              }}
              placeholder="Search code or diagnosis..."
              className="clean-select-search-input"
            />
            {search && (
              <button type="button" className="clean-search-clear" onClick={() => setSearch('')} title="Clear search">
                ✕
              </button>
            )}
          </div>

          {/* Options */}
          <div className="clean-select-list">
            {allowAll && !cleanQuery && (
              <button
                type="button"
                className={`clean-select-item ${isAllSelected ? 'selected' : ''}`}
                onClick={() => handleSelect('ALL')}
                role="option"
                aria-selected={isAllSelected}
              >
                <span className="clean-code-pill all">ALL</span>
                <span className="clean-name-text">{allLabel}</span>
              </button>
            )}

            {filteredOptions.map((opt) => {
              const isSelected = value.toUpperCase() === opt.code.toUpperCase();
              return (
                <button
                  key={opt.code}
                  type="button"
                  className={`clean-select-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelect(opt.code)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span className="clean-code-pill">{opt.code}</span>
                  <span className="clean-name-text">{opt.name}</span>
                </button>
              );
            })}

            {filteredOptions.length === 0 && !hasExactMatch && (
              <div className="clean-select-empty">No matching codes</div>
            )}

            {/* Custom code quick option */}
            {allowCustomInput && cleanQuery && !hasExactMatch && (
              <button type="button" className="clean-select-custom-item" onClick={() => handleSelect(cleanQuery)}>
                <span>Use custom code</span>
                <strong>{cleanQuery}</strong>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
