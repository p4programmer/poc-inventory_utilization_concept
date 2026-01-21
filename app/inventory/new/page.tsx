'use client';

import Navigation from '@/components/Navigation';
import InventoryForm from '@/components/InventoryForm';

export default function NewInventoryItemPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Create New Inventory Item
        </h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <InventoryForm />
        </div>
      </div>
    </div>
  );
}
