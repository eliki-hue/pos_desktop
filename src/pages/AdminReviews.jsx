// src/pages/admin/Reviews.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  StarOff, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  MapPin,
  MessageSquare,
  Settings,
  Trash2,
  RefreshCw,
  Clock,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { reviewAPI } from '../services/api';
import AppLayout from '../components/AppLayout';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import StatusBadge from '../components/Common/StatusBadge';
import { formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    rating: '',
    is_featured: '',
    is_approved: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedReviews, setSelectedReviews] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [filters, currentPage]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = { 
        ...filters, 
        page: currentPage,
        page_size: 20
      };
      const response = await reviewAPI.getList(params);
      
      // Handle different response structures safely
      let reviewsData = [];
      let count = 0;
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          reviewsData = response.data;
          count = response.data.length;
        } else if (response.data.results) {
          reviewsData = response.data.results;
          count = response.data.count || response.data.results.length;
        } else if (response.data.data) {
          reviewsData = response.data.data;
          count = response.data.data.length;
        } else {
          // If it's a single object, try to find arrays
          const values = Object.values(response.data);
          const arrays = values.filter(v => Array.isArray(v));
          if (arrays.length > 0) {
            reviewsData = arrays[0];
            count = reviewsData.length;
          }
        }
      }
      
      // Ensure we always have an array
      if (!Array.isArray(reviewsData)) {
        reviewsData = [];
      }
      
      setReviews(reviewsData);
      setTotalItems(count);
      setTotalPages(Math.ceil(count / 20) || 1);
      
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setReviews([]);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await reviewAPI.getStats();
      if (response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setStats({
        total: 0,
        approved: 0,
        pending: 0,
        average_rating: 0
      });
    }
  };

  const handleToggleApprove = async (id) => {
    try {
      await reviewAPI.toggleApprove(id);
      await fetchReviews();
      await fetchStats();
      toast.success('Review approval status updated');
    } catch (error) {
      console.error('Failed to toggle approve:', error);
      toast.error('Failed to update approval status');
    }
  };

  const handleToggleFeature = async (id) => {
    try {
      await reviewAPI.toggleFeature(id);
      await fetchReviews();
      await fetchStats();
      toast.success('Review featured status updated');
    } catch (error) {
      console.error('Failed to toggle feature:', error);
      toast.error('Failed to update featured status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    
    try {
      await reviewAPI.delete(id);
      await fetchReviews();
      await fetchStats();
      toast.success('Review deleted successfully');
    } catch (error) {
      console.error('Failed to delete review:', error);
      toast.error('Failed to delete review');
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedReviews.length === 0) {
      toast.error('Please select reviews first');
      return;
    }

    const confirmMessage = action === 'approve' 
      ? `Approve ${selectedReviews.length} reviews?` 
      : `Delete ${selectedReviews.length} reviews?`;
    
    if (!window.confirm(confirmMessage)) return;

    try {
      const promises = selectedReviews.map(id => {
        if (action === 'approve') {
          return reviewAPI.toggleApprove(id);
        } else if (action === 'delete') {
          return reviewAPI.delete(id);
        }
        return Promise.resolve();
      });

      await Promise.all(promises);
      await fetchReviews();
      await fetchStats();
      setSelectedReviews([]);
      toast.success(`${selectedReviews.length} reviews processed successfully`);
    } catch (error) {
      console.error('Bulk action failed:', error);
      toast.error('Failed to process bulk action');
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-2xl bg-gradient-to-br ${color} shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star 
          key={i} 
          className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
        />
      );
    }
    return stars;
  };

  return (
    <AppLayout title="Review Management" subtitle="Manage customer reviews and testimonials">
      <div className="space-y-6">
        {/* Header with Actions */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-2">Customer Reviews</h1>
                <p className="text-purple-100">Manage and moderate customer feedback</p>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    fetchReviews();
                    fetchStats();
                  }}
                  className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-white/30 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white text-purple-600 px-4 py-2 rounded-xl flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <Download className="w-4 h-4" />
                  Export
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Total Reviews" 
              value={stats.total || 0}
              icon={MessageSquare}
              color="from-blue-500 to-blue-600"
              subtitle={`${stats.pending || 0} pending approval`}
            />
            <StatCard 
              title="Approved" 
              value={stats.approved || 0}
              icon={CheckCircle}
              color="from-green-500 to-green-600"
            />
            <StatCard 
              title="Pending" 
              value={stats.pending || 0}
              icon={Clock}
              color="from-yellow-500 to-yellow-600"
            />
            <StatCard 
              title="Average Rating" 
              value={stats.average_rating ? stats.average_rating.toFixed(1) : 'N/A'}
              icon={Star}
              color="from-purple-500 to-purple-600"
              subtitle={`Based on ${stats.total || 0} reviews`}
            />
          </div>
        )}

        {/* Filters & Search Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5"
        >
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by customer name or review..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all ${
                showFilters ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </motion.button>

            {selectedReviews.length > 0 && (
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleBulkAction('approve')}
                  className="px-4 py-2 bg-green-600 text-white rounded-xl flex items-center gap-2 text-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve Selected ({selectedReviews.length})
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleBulkAction('delete')}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl flex items-center gap-2 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected
                </motion.button>
              </div>
            )}
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-100"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                    <select
                      value={filters.rating}
                      onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">All Ratings</option>
                      <option value="5">5 Stars</option>
                      <option value="4">4 Stars</option>
                      <option value="3">3 Stars</option>
                      <option value="2">2 Stars</option>
                      <option value="1">1 Star</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Featured Status</label>
                    <select
                      value={filters.is_featured}
                      onChange={(e) => setFilters({ ...filters, is_featured: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">All</option>
                      <option value="true">Featured</option>
                      <option value="false">Not Featured</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Approval Status</label>
                    <select
                      value={filters.is_approved}
                      onChange={(e) => setFilters({ ...filters, is_approved: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">All</option>
                      <option value="true">Approved</option>
                      <option value="false">Pending</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Reviews Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 gap-6"
        >
          {loading ? (
            <div className="col-span-full p-12">
              <LoadingSpinner />
            </div>
          ) : reviews && reviews.length > 0 ? (
            <AnimatePresence>
              {reviews.map((review, index) => (
                <motion.div
                  key={review.id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                          {review.customer_name ? review.customer_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{review.customer_name || 'Anonymous'}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            {review.customer_location && (
                              <>
                                <MapPin className="w-3 h-3" />
                                <span>{review.customer_location}</span>
                              </>
                            )}
                            <span className="text-gray-300">|</span>
                            <Calendar className="w-3 h-3" />
                            <span>{review.created_at ? formatDate(review.created_at) : 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        {renderStars(review.rating || 0)}
                        <span className="text-sm font-semibold text-gray-700 ml-2">
                          {review.rating || 0}.0
                        </span>
                      </div>
                      
                      <p className="text-gray-700 leading-relaxed">{review.review || 'No review content'}</p>
                      
                      <div className="flex items-center gap-3 mt-3">
                        <StatusBadge 
                          status={review.is_approved ? 'approved' : 'pending'} 
                          size="sm"
                        />
                        {review.is_featured && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-xs font-medium rounded-full">
                            <Star className="w-3 h-3 fill-white" />
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <input
                        type="checkbox"
                        checked={selectedReviews.includes(review.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedReviews([...selectedReviews, review.id]);
                          } else {
                            setSelectedReviews(selectedReviews.filter(id => id !== review.id));
                          }
                        }}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleToggleApprove(review.id)}
                      className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm font-medium transition-all ${
                        review.is_approved 
                          ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {review.is_approved ? (
                        <>
                          <XCircle className="w-4 h-4" />
                          Disapprove
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </>
                      )}
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleToggleFeature(review.id)}
                      className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm font-medium transition-all ${
                        review.is_featured 
                          ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' 
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}
                    >
                      {review.is_featured ? (
                        <>
                          <StarOff className="w-4 h-4" />
                          Unfeature
                        </>
                      ) : (
                        <>
                          <Star className="w-4 h-4" />
                          Feature
                        </>
                      )}
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(review.id)}
                      className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg flex items-center gap-1.5 text-sm font-medium hover:bg-red-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <MessageSquare className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
              <p className="text-gray-500">No customer reviews match your current filters</p>
            </div>
          )}
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && !loading && reviews.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 px-6 py-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold">{reviews.length}</span> of <span className="font-semibold">{totalItems}</span> reviews
            </p>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>
              <span className="px-4 py-2 text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Reviews;