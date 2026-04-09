import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { purchaseAPI } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

const PurchaseSummary = ({ refreshTrigger }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, [refreshTrigger]);

  const fetchSummary = async () => {
    try {
      const response = await purchaseAPI.getSummary();
      setSummary(response.data);
    } catch (err) {
      console.error('Failed to load summary:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-32"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Purchases',
      value: formatCurrency(summary.total_amount),
      icon: DollarSign,
      color: 'text-blue-600',
      bg: 'bg-blue-100'
    },
    {
      title: 'Total Paid',
      value: formatCurrency(summary.total_paid),
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-100'
    },
    {
      title: 'Outstanding Balance',
      value: formatCurrency(summary.total_outstanding),
      icon: Clock,
      color: 'text-red-600',
      bg: 'bg-red-100'
    },
    {
      title: 'Total Purchases Count',
      value: summary.total_purchases,
      icon: AlertCircle,
      color: 'text-purple-600',
      bg: 'bg-purple-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{card.title}</p>
              <p className="text-2xl font-bold mt-1">{card.value}</p>
            </div>
            <div className={`${card.bg} p-3 rounded-full`}>
              <card.icon className={`${card.color}`} size={24} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PurchaseSummary;