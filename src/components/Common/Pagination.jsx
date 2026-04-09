// src/components/Common/Pagination.jsx
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange, itemsPerPage = 20, totalItems = 0 }) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '12px 20px', 
      borderTop: '1px solid #e5e7eb',
      backgroundColor: '#f9fafb',
      flexWrap: 'wrap',
      gap: 12
    }}>
      {/* Mobile view */}
      <div style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'center' }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="btn outline"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6,
            opacity: currentPage === 1 ? 0.5 : 1,
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
          }}
        >
          <ChevronLeft style={{ width: 14, height: 14 }} />
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="btn outline"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6,
            opacity: currentPage === totalPages ? 0.5 : 1,
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
          }}
        >
          Next
          <ChevronRight style={{ width: 14, height: 14 }} />
        </button>
      </div>
      
      {/* Desktop view */}
      <div style={{ display: 'none', alignItems: 'center', gap: 16, flexWrap: 'wrap', width: '100%' }}>
        <div style={{ fontSize: 13, color: '#6b7280' }}>
          Showing <strong>{startItem}</strong> to{' '}
          <strong>{endItem}</strong> of{' '}
          <strong>{totalItems}</strong> results
        </div>
        
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="btn outline"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6,
              opacity: currentPage === 1 ? 0.5 : 1,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            <ChevronLeft style={{ width: 14, height: 14 }} />
            Previous
          </button>
          
          <div style={{ display: 'flex', gap: 4 }}>
            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === 'number' && onPageChange(page)}
                className="btn"
                style={{
                  minWidth: 36,
                  padding: '6px 12px',
                  backgroundColor: currentPage === page ? '#3b82f6' : 'white',
                  color: currentPage === page ? 'white' : '#374151',
                  border: currentPage === page ? 'none' : '1px solid #e5e7eb',
                  cursor: typeof page === 'number' ? 'pointer' : 'default',
                  opacity: typeof page === 'number' ? 1 : 0.7
                }}
                disabled={typeof page !== 'number'}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="btn outline"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6,
              opacity: currentPage === totalPages ? 0.5 : 1,
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Next
            <ChevronRight style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;