import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Clock, Eye, Star, MapPin } from 'lucide-react';

const Orders = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      try {
        const response = await api.get('/orders/my-orders');
        return response.data;
      } catch (err) {
        // Graceful fallback: return empty orders so UI doesn't fail hard
        return { success: true, orders: [], pagination: { current: 1, total: 0 } };
      }
    },
    staleTime: 60 * 1000,
    retry: 0,
    refetchOnWindowFocus: false,
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending_payment':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-orange-100 text-orange-800';
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'payment_failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending_payment':
        return 'Pending Payment';
      case 'confirmed':
        return 'Confirmed';
      case 'preparing':
        return 'Preparing';
      case 'out_for_delivery':
        return 'Out for Delivery';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      case 'payment_failed':
        return 'Payment Failed';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-8">My Orders</h1>
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
                <div className="h-6 bg-gray-300 rounded mb-4"></div>
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-8">
        <div className="max-w-4xl mx-auto px-4 text-center py-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Failed to load orders</h2>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">My Orders</h1>

        {data?.orders?.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">📦</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              No orders yet
            </h2>
            <p className="text-gray-600 mb-8">
              When you place your first order, it will appear here.
            </p>
            <Link
              to="/restaurants"
              className="bg-orange-500 text-white px-8 py-3 rounded-lg hover:bg-orange-600 transition-colors inline-flex items-center gap-2"
            >
              Browse Restaurants
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {data?.orders?.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">
                        Order #{order.orderNumber}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={order.restaurant?.image || 'https://placehold.co/50x50?text=Food'}
                      alt={order.restaurant?.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <h4 className="font-medium text-gray-800">{order.restaurant?.name}</h4>
                      <p className="text-sm text-gray-600">
                        {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-lg font-semibold text-gray-800">
                      {order.formattedTotal}
                    </div>
                    <div className="flex gap-2">
                      {order.status === 'delivered' && !order.rating && (
                        <Link
                          to={`/order/${order._id}?rate=true`}
                          className="text-orange-500 hover:text-orange-600 text-sm font-medium flex items-center gap-1"
                        >
                          <Star className="w-4 h-4" />
                          Rate Order
                        </Link>
                      )}
                      <Link
                        to={`/order/${order._id}`}
                        className="text-orange-500 hover:text-orange-600 text-sm font-medium flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data?.pagination && data.pagination.total > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2">
              {Array.from({ length: data.pagination.total }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`px-3 py-2 rounded ${page === data.pagination.current
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
