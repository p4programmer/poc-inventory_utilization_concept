'use client';

import { useEffect, useState, use } from 'react';
import Navigation from '@/components/Navigation';
import InventoryForm from '@/components/InventoryForm';
import LoadingSpinner from '@/components/LoadingSpinner';
import AlertBanner from '@/components/AlertBanner';

export default function EditInventoryItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchItem();
  }, []);

  const fetchItem = async () => {
    try {
      const response = await fetch(`/api/inventory/${id}`);
      const data = await response.json();

      if (data.success) {
        setItem(data.data);
      } else {
        setError(data.error || 'Failed to fetch inventory item');
      }
    } catch (err) {
      setError('Failed to fetch inventory item');
    } finally {
      setLoading(false);
    }
  };

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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AlertBanner type="error">
            <p>{error}</p>
          </AlertBanner>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Edit Inventory Item</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <InventoryForm itemId={id} initialData={item} />
        </div>
      </div>
    </div>
  );
}
