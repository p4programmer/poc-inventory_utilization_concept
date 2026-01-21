'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import AlertBanner from '@/components/AlertBanner';

interface Product {
  _id: string;
  name: string;
  sku: string;
}

interface StockCheckItem {
  name: string;
  sku: string;
  unit: string;
  requiredPerUnit: number;
  totalRequired: number;
  available: number;
  sufficient: boolean;
  shortage: number;
}

export default function ManufacturingPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [checking, setChecking] = useState(false);
  const [stockCheck, setStockCheck] = useState<StockCheckItem[] | null>(null);

  const [formData, setFormData] = useState({
    productId: '',
    quantityProduced: 1,
    manufacturedBy: '',
    notes: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
      } else {
        setError(data.error || 'Failed to fetch products');
      }
    } catch (err) {
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const checkStock = async () => {
    if (!formData.productId || formData.quantityProduced < 1) {
      setError('Please select a product and enter a valid quantity');
      return;
    }

    setChecking(true);
    setStockCheck(null);
    setError('');

    try {
      const response = await fetch(
        `/api/manufacturing/check?productId=${formData.productId}&quantity=${formData.quantityProduced}`
      );
      const data = await response.json();

      if (data.success) {
        setStockCheck(data.data.stockCheck);
      } else {
        setError(data.error || 'Failed to check stock availability');
      }
    } catch (err) {
      setError('Failed to check stock availability');
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/manufacturing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Successfully manufactured ${formData.quantityProduced} unit(s)`);
        setFormData({
          productId: '',
          quantityProduced: 1,
          manufacturedBy: '',
          notes: '',
        });
        setStockCheck(null);
        setTimeout(() => {
          router.push('/manufacturing/logs');
        }, 2000);
      } else {
        setError(data.error || 'Failed to process manufacturing');
        if (data.insufficientItems) {
          setError(
            `Insufficient stock for: ${data.insufficientItems.map((item: any) => `${item.name} (need ${item.required}, have ${item.available})`).join(', ')}`
          );
        }
      }
    } catch (err) {
      setError('Failed to process manufacturing');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (formData.productId && formData.quantityProduced > 0) {
      checkStock();
    } else {
      setStockCheck(null);
    }
  }, [formData.productId, formData.quantityProduced]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  const canManufacture = stockCheck && stockCheck.every((item) => item.sufficient);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Manufacturing</h1>

        {success && (
          <AlertBanner type="success">
            <p>{success}</p>
          </AlertBanner>
        )}

        {error && (
          <AlertBanner type="error">
            <p>{error}</p>
          </AlertBanner>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="productId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Product *
              </label>
              <select
                id="productId"
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a product</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="quantityProduced" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantity to Produce *
              </label>
              <input
                type="number"
                id="quantityProduced"
                min="1"
                value={formData.quantityProduced}
                onChange={(e) => setFormData({ ...formData, quantityProduced: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {checking && (
              <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                <LoadingSpinner size="sm" />
                <span>Checking stock availability...</span>
              </div>
            )}

            {stockCheck && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Stock Availability Check
                </h3>
                <div className="space-y-2">
                  {stockCheck.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex justify-between items-center p-2 rounded ${
                        item.sufficient
                          ? 'bg-green-50 dark:bg-green-900/20'
                          : 'bg-red-50 dark:bg-red-900/20'
                      }`}
                    >
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                          ({item.sku})
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className={item.sufficient ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                          Required: {item.totalRequired} {item.unit}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400 mx-2">|</span>
                        <span className={item.sufficient ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                          Available: {item.available} {item.unit}
                        </span>
                        {!item.sufficient && (
                          <>
                            <span className="text-gray-600 dark:text-gray-400 mx-2">|</span>
                            <span className="text-red-700 dark:text-red-300 font-semibold">
                              Short: {item.shortage} {item.unit}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {!canManufacture && (
                  <AlertBanner type="error">
                    <p className="font-semibold">Cannot manufacture: Insufficient stock</p>
                  </AlertBanner>
                )}
              </div>
            )}

            <div>
              <label htmlFor="manufacturedBy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Manufactured By
              </label>
              <input
                type="text"
                id="manufacturedBy"
                value={formData.manufacturedBy}
                onChange={(e) => setFormData({ ...formData, manufacturedBy: e.target.value })}
                placeholder="Operator name (optional)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Additional notes (optional)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting || !canManufacture || checking}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Processing...' : 'Manufacture'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/manufacturing/logs')}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-md font-medium transition-colors"
              >
                View Logs
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
