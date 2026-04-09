// src/components/purchases/PurchaseSummary.jsx
import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Clock, AlertCircle, ShoppingBag } from 'lucide-react';
import { purchaseAPI } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

const PurchaseSummary = ({ refreshTrigger }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, [refreshTrigger]);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await purchaseAPI.getSummary();
      setSummary(response.data);
    } catch (err) {
      console.error('Failed to load summary:', err);
      setError('Failed to load summary data');
    } finally {
      setLoading(false);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card" style={{ padding: 20, animation: 'pulse 1.5s ease-in-out infinite' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, backgroundColor: '#e5e7eb', borderRadius: 12 }}></div>
              <div style={{ width: 40, height: 20, backgroundColor: '#e5e7eb', borderRadius: 4 }}></div>
            </div>
            <div>
              <div style={{ width: 100, height: 14, backgroundColor: '#e5e7eb', borderRadius: 4, marginBottom: 8 }}></div>
              <div style={{ width: 120, height: 24, backgroundColor: '#e5e7eb', borderRadius: 4 }}></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="card" style={{ padding: 20, marginBottom: 24, backgroundColor: '#fee2e2', color: '#dc2626', textAlign: 'center' }}>
        <AlertCircle style={{ width: 24, height: 24, margin: '0 auto 8px' }} />
        <p>{error || 'No summary data available'}</p>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ 
          padding: 12, 
          backgroundColor: `${color}20`, 
          borderRadius: 12,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon style={{ width: 24, height: 24, color: color }} />
        </div>
      </div>
      <div>
        <div className="muted" style={{ marginBottom: 4, fontSize: 13 }}>{title}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>{value}</div>
      </div>
    </div>
  );

  const cards = [
    {
      title: 'Total Purchases',
      value: formatCurrency(summary.total_amount),
      icon: ShoppingBag,
      color: '#3b82f6'
    },
    {
      title: 'Total Paid',
      value: formatCurrency(summary.total_paid),
      icon: TrendingUp,
      color: '#10b981'
    },
    {
      title: 'Outstanding Balance',
      value: formatCurrency(summary.total_outstanding),
      icon: Clock,
      color: '#ef4444'
    },
    {
      title: 'Total Orders',
      value: summary.total_purchases?.toLocaleString() || 0,
      icon: AlertCircle,
      color: '#8b5cf6'
    }
  ];

  return (
    <div className="grid-4" style={{ marginBottom: 24 }}>
      {cards.map((card, index) => (
        <StatCard 
          key={index}
          title={card.title}
          value={card.value}
          icon={card.icon}
          color={card.color}
        />
      ))}
    </div>
  );
};

export default PurchaseSummary;