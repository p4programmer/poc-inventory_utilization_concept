'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import AlertBanner from '@/components/AlertBanner';
import StockIndicator from '@/components/StockIndicator';
import { formatDate } from '@/lib/utils';

interface DashboardData {
  summary: {
    totalProducts: number;
    totalInventoryItems: number;
    lowStockItemsCount: number;
    recentManufacturing: number;
  };
  lowStockItems: Array<{
    _id: string;
    name: string;
    sku: string;
    currentStock: number;
    unit: string;
    reorderLevel: number;
  }>;
  mostManufacturedProducts: Array<{
    _id: string;
    name: string;
    sku: string;
    totalManufactured: number;
  }>;
  consumptionData: Array<{
    _id: string;
    totalProduced: number;
    count: number;
  }>;
  recentLogs: Array<{
    _id: string;
    productId: {
      name: string;
      sku: string;
    };
    quantityProduced: number;
    timestamp: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AlertBanner type="error">
            <p>{error || 'Failed to load dashboard'}</p>
          </AlertBanner>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Dashboard</h1>

        {/* Low Stock Alert Banner */}
        {data.summary.lowStockItemsCount > 0 && (
          <AlertBanner type="warning">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">Low Stock Alert</p>
                <p className="text-sm mt-1">
                  {data.summary.lowStockItemsCount} item(s) are at or below reorder level
                </p>
              </div>
              <Link
                href="/inventory"
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                View Items
              </Link>
            </div>
          </AlertBanner>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Products
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {data.summary.totalProducts}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg
                  className="w-8 h-8 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
            </div>
            <Link
              href="/products"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-4 inline-block"
            >
              View all products →
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Inventory Items
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {data.summary.totalInventoryItems}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <svg
                  className="w-8 h-8 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7h16M4 7l1-4h14l1 4M10 11v6m4-6v6"
                  />
                </svg>
              </div>
            </div>
            <Link
              href="/inventory"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-4 inline-block"
            >
              View inventory →
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Low Stock Items
                </p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                  {data.summary.lowStockItemsCount}
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <svg
                  className="w-8 h-8 text-orange-600 dark:text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
            <Link
              href="/inventory"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-4 inline-block"
            >
              View low stock →
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Recent Manufacturing
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {data.summary.recentManufacturing}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Last 7 days</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <svg
                  className="w-8 h-8 text-purple-600 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <Link
              href="/manufacturing/logs"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-4 inline-block"
            >
              View logs →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Low Stock Items */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Low Stock Items
              </h2>
            </div>
            <div className="p-6">
              {data.lowStockItems.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-4">
                  All items are adequately stocked
                </p>
              ) : (
                <div className="space-y-3">
                  {data.lowStockItems.slice(0, 5).map((item) => (
                    <div
                      key={item._id}
                      className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.sku}</p>
                      </div>
                      <StockIndicator
                        currentStock={item.currentStock}
                        reorderLevel={item.reorderLevel}
                        unit={item.unit}
                      />
                    </div>
                  ))}
                  {data.lowStockItems.length > 5 && (
                    <Link
                      href="/inventory"
                      className="block text-center text-sm text-blue-600 dark:text-blue-400 hover:underline mt-4"
                    >
                      View all {data.lowStockItems.length} low stock items →
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Most Manufactured Products */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Most Manufactured Products
              </h2>
            </div>
            <div className="p-6">
              {data.mostManufacturedProducts.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-4">
                  No manufacturing activity yet
                </p>
              ) : (
                <div className="space-y-3">
                  {data.mostManufacturedProducts.map((product) => (
                    <div
                      key={product._id}
                      className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {product.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{product.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {product.totalManufactured}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">units</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Manufacturing Logs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Manufacturing Activity
            </h2>
          </div>
          <div className="p-6">
            {data.recentLogs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No manufacturing activity yet
                </p>
                <Link
                  href="/manufacturing"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Start manufacturing →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentLogs.map((log) => (
                  <div
                    key={log._id}
                    className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {log.productId.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {log.productId.sku}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {log.quantityProduced} units
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {formatDate(log.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                <Link
                  href="/manufacturing/logs"
                  className="block text-center text-sm text-blue-600 dark:text-blue-400 hover:underline mt-4"
                >
                  View all logs →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
