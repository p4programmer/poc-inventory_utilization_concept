'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AlertBanner from './AlertBanner';

interface InventoryItem {
  _id: string;
  name: string;
  sku: string;
  unit: string;
  currentStock: number;
}

interface ProductInventoryItem {
  inventoryItemId: string;
  quantityRequired: number;
}

interface ProductFormProps {
  productId?: string;
  initialData?: {
    name: string;
    sku: string;
    description?: string;
    inventoryItems: Array<{
      inventoryItemId: { _id: string };
      quantityRequired: number;
    }>;
  };
}

export default function ProductForm({ productId, initialData }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableItems, setAvailableItems] = useState<InventoryItem[]>([]);
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    sku: initialData?.sku || '',
    description: initialData?.description || '',
  });

  const [selectedItems, setSelectedItems] = useState<ProductInventoryItem[]>(
    initialData?.inventoryItems.map((item) => ({
      inventoryItemId: item.inventoryItemId._id,
      quantityRequired: item.quantityRequired,
    })) || []
  );

  useEffect(() => {
    fetchInventoryItems();
  }, []);

  const fetchInventoryItems = async () => {
    try {
      const response = await fetch('/api/inventory');
      const data = await response.json();
      
      if (data.success) {
        setAvailableItems(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch inventory items:', err);
    }
  };

  const handleAddItem = () => {
    setSelectedItems([...selectedItems, { inventoryItemId: '', quantityRequired: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ProductInventoryItem, value: string | number) => {
    const updated = [...selectedItems];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate
    if (!formData.name || !formData.sku) {
      setError('Name and SKU are required');
      setLoading(false);
      return;
    }

    if (selectedItems.length === 0) {
      setError('At least one inventory item is required');
      setLoading(false);
      return;
    }

    if (selectedItems.some((item) => !item.inventoryItemId || item.quantityRequired <= 0)) {
      setError('All inventory items must have valid selections and quantities');
      setLoading(false);
      return;
    }

    try {
      const url = productId ? `/api/products/${productId}` : '/api/products';
      const method = productId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          inventoryItems: selectedItems,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/products');
      } else {
        setError(data.error || 'Failed to save product');
      }
    } catch (err) {
      setError('Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <AlertBanner type="error">
          <p>{error}</p>
        </AlertBanner>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Product Name *
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="sku" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          SKU *
        </label>
        <input
          type="text"
          id="sku"
          value={formData.sku}
          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Bill of Materials (BOM) *
          </label>
          <button
            type="button"
            onClick={handleAddItem}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors"
          >
            Add Item
          </button>
        </div>

        <div className="space-y-3">
          {selectedItems.map((item, index) => (
            <div key={index} className="flex gap-3 items-start p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
              <div className="flex-1">
                <select
                  value={item.inventoryItemId}
                  onChange={(e) => handleItemChange(index, 'inventoryItemId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select inventory item</option>
                  {availableItems.map((invItem) => (
                    <option key={invItem._id} value={invItem._id}>
                      {invItem.name} ({invItem.sku}) - Stock: {invItem.currentStock} {invItem.unit}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-32">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={item.quantityRequired}
                  onChange={(e) => handleItemChange(index, 'quantityRequired', parseFloat(e.target.value))}
                  placeholder="Qty"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveItem(index)}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {selectedItems.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Add at least one inventory item to create a product
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : productId ? 'Update Product' : 'Create Product'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-md font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
