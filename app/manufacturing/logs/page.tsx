'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import AlertBanner from '@/components/AlertBanner';
import { formatDate } from '@/lib/utils';

interface ManufacturingLog {
  _id: string;
  productId: {
    _id: string;
    name: string;
    sku: string;
  };
  quantityProduced: number;
  inventoryDeductions: Array<{
    inventoryItemId: {
      _id: string;
      name: string;
      sku: string;
      unit: string;
    };
    quantityDeducted: number;
    stockBefore: number;
    stockAfter: number;
  }>;
  manufacturedBy?: string;
  notes?: string;
  timestamp: string;
}

export default function ManufacturingLogsPage() {
  const [logs, setLogs] = useState<ManufacturingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/manufacturing/logs');
      const data = await response.json();

      if (data.success) {
        setLogs(data.data);
      } else {
        setError(data.error || 'Failed to fetch manufacturing logs');
      }
    } catch (err) {
      setError('Failed to fetch manufacturing logs');
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manufacturing Logs</h1>
          <Link
            href="/manufacturing"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
          >
            New Manufacturing
          </Link>
        </div>

        {error && (
          <AlertBanner type="error">
            <p>{error}</p>
          </AlertBanner>
        )}

        {logs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No manufacturing logs found</p>
            <Link href="/manufacturing" className="text-blue-600 dark:text-blue-400 hover:underline">
              Start manufacturing
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
              >
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => setExpandedLog(expandedLog === log._id ? null : log._id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {log.productId.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        SKU: {log.productId.sku}
                      </p>
                      <div className="mt-2 flex items-center space-x-4 text-sm">
                        <span className="text-gray-900 dark:text-white">
                          <span className="font-medium">Quantity:</span> {log.quantityProduced} units
                        </span>
                        {log.manufacturedBy && (
                          <span className="text-gray-900 dark:text-white">
                            <span className="font-medium">By:</span> {log.manufacturedBy}
                          </span>
                        )}
                        <span className="text-gray-600 dark:text-gray-400">
                          {formatDate(log.timestamp)}
                        </span>
                      </div>
                    </div>
                    <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                      {expandedLog === log._id ? 'Hide Details' : 'Show Details'}
                    </button>
                  </div>
                </div>

                {expandedLog === log._id && (
                  <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Inventory Deductions
                    </h4>
                    <div className="space-y-2">
                      {log.inventoryDeductions.map((deduction, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded"
                        >
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {deduction.inventoryItemId.name}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                              ({deduction.inventoryItemId.sku})
                            </span>
                          </div>
                          <div className="text-sm text-gray-900 dark:text-white">
                            <span className="text-red-600 dark:text-red-400 font-medium">
                              -{deduction.quantityDeducted} {deduction.inventoryItemId.unit}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400 mx-2">|</span>
                            <span>
                              {deduction.stockBefore} → {deduction.stockAfter}{' '}
                              {deduction.inventoryItemId.unit}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {log.notes && (
                      <div className="mt-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Notes</h4>
                        <p className="text-gray-600 dark:text-gray-400">{log.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
