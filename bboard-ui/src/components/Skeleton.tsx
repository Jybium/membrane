import React from 'react';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  borderRadius,
  className = '',
  style,
}) => {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
      aria-hidden="true"
    />
  );
};

export interface RowSkeletonProps {
  count?: number;
  selectable?: boolean;
}

export const RowSkeleton: React.FC<RowSkeletonProps> = ({ count = 3, selectable = false }) => {
  return (
    <div className="rows skeleton-rows" aria-busy="true" aria-label="Loading content...">
      {Array.from({ length: count }).map((_, i) => (
        <div className={`row skeleton-row ${selectable ? 'selectable' : ''}`} key={i}>
          <div className="skeleton skeleton-avatar" />
          <div className="skeleton-body">
            <div className="skeleton skeleton-title" style={{ width: `${55 + (i % 3) * 15}%` }} />
            <div className="skeleton skeleton-subtitle" style={{ width: `${35 + (i % 2) * 15}%` }} />
          </div>
          <div className="skeleton skeleton-badge" />
        </div>
      ))}
    </div>
  );
};

export interface TableSkeletonProps {
  rows?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5 }) => {
  return (
    <tbody className="skeleton-tbody" aria-busy="true" aria-label="Loading records...">
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="skeleton-tr">
          <td>
            <div className="skeleton" style={{ width: 68, height: 14 }} />
          </td>
          <td>
            <div className="skeleton" style={{ width: 110 + (i % 3) * 20, height: 14 }} />
          </td>
          <td>
            <div className="skeleton" style={{ width: 36, height: 14 }} />
          </td>
          <td>
            <div className="skeleton skeleton-pill" style={{ width: 58, height: 18 }} />
          </td>
          <td>
            <div className="skeleton" style={{ width: 130 + (i % 2) * 30, height: 14 }} />
          </td>
          <td>
            <div className="skeleton" style={{ width: 75, height: 14 }} />
          </td>
          <td>
            <div className="skeleton skeleton-pill" style={{ width: 64, height: 18 }} />
          </td>
        </tr>
      ))}
    </tbody>
  );
};
