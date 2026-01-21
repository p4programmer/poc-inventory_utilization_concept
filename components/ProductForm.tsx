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

interface ConditionalUtilization {
  conditionType: 'width' | 'height' | 'both';
  operator: 'greater_than' | 'less_than' | 'equal_to';
  widthThreshold?: number;
  heightThreshold?: number;
  inventoryItems: ProductInventoryItem[];
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
    hasConditionalUtilization?: boolean;
    conditionalUtilizations?: any[];
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

  const [hasConditionalUtilization, setHasConditionalUtilization] = useState(
    initialData?.hasConditionalUtilization || false
  );

  const [conditionalRules, setConditionalRules] = useState<ConditionalUtilization[]>(
    initialData?.conditionalUtilizations || []
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

  const handleAddConditionalRule = () => {
    setConditionalRules([
      ...conditionalRules,
      {
        conditionType: 'width',
        operator: 'greater_than',
        widthThreshold: 0,
        inventoryItems: [],
      },
    ]);
  };

  const handleRemoveConditionalRule = (index: number) => {
    setConditionalRules(conditionalRules.filter((_, i) => i !== index));
  };

  const handleConditionalRuleChange = (
    ruleIndex: number,
    field: string,
    value: any
  ) => {
    const updated = [...conditionalRules];
    updated[ruleIndex] = { ...updated[ruleIndex], [field]: value };
    setConditionalRules(updated);
  };

  const handleAddConditionalItem = (ruleIndex: number) => {
    const updated = [...conditionalRules];
    updated[ruleIndex].inventoryItems.push({ inventoryItemId: '', quantityRequired: 1 });
    setConditionalRules(updated);
  };

  const handleRemoveConditionalItem = (ruleIndex: number, itemIndex: number) => {
    const updated = [...conditionalRules];
    updated[ruleIndex].inventoryItems = updated[ruleIndex].inventoryItems.filter(
      (_, i) => i !== itemIndex
    );
    setConditionalRules(updated);
  };

  const handleConditionalItemChange = (
    ruleIndex: number,
    itemIndex: number,
    field: keyof ProductInventoryItem,
    value: string | number
  ) => {
    const updated = [...conditionalRules];
    updated[ruleIndex].inventoryItems[itemIndex] = {
      ...updated[ruleIndex].inventoryItems[itemIndex],
      [field]: value,
    };
    setConditionalRules(updated);
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

    if (hasConditionalUtilization && conditionalRules.length === 0) {
      setError('Add at least one conditional rule or disable conditional utilization');
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
          hasConditionalUtilization,
          conditionalUtilizations: hasConditionalUtilization ? conditionalRules : [],
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

      {/* Conditional Utilization Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="hasConditionalUtilization"
            checked={hasConditionalUtilization}
            onChange={(e) => setHasConditionalUtilization(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <label
            htmlFor="hasConditionalUtilization"
            className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Enable Conditional Utilization (based on dimensions)
          </label>
        </div>

        {hasConditionalUtilization && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Add rules to use different inventory quantities based on product dimensions
              </p>
              <button
                type="button"
                onClick={handleAddConditionalRule}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-md transition-colors"
              >
                Add Conditional Rule
              </button>
            </div>

            {conditionalRules.map((rule, ruleIndex) => (
              <div
                key={ruleIndex}
                className="p-4 border-2 border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50 dark:bg-purple-900/20"
              >
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Conditional Rule #{ruleIndex + 1}
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleRemoveConditionalRule(ruleIndex)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove Rule
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Condition Type
                    </label>
                    <select
                      value={rule.conditionType}
                      onChange={(e) =>
                        handleConditionalRuleChange(ruleIndex, 'conditionType', e.target.value)
                      }
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="width">Width</option>
                      <option value="height">Height</option>
                      <option value="both">Both (Width AND Height)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Operator
                    </label>
                    <select
                      value={rule.operator}
                      onChange={(e) =>
                        handleConditionalRuleChange(ruleIndex, 'operator', e.target.value)
                      }
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="greater_than">Greater Than (&gt;)</option>
                      <option value="less_than">Less Than (&lt;)</option>
                      <option value="equal_to">Equal To (=)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {rule.conditionType === 'width' ? 'Width Threshold' : 
                       rule.conditionType === 'height' ? 'Height Threshold' : 'Width Threshold'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={rule.widthThreshold || 0}
                      onChange={(e) =>
                        handleConditionalRuleChange(
                          ruleIndex,
                          'widthThreshold',
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {rule.conditionType === 'both' && (
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Height Threshold
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={rule.heightThreshold || 0}
                      onChange={(e) =>
                        handleConditionalRuleChange(
                          ruleIndex,
                          'heightThreshold',
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                )}

                <div className="mt-3">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Inventory Items for this condition
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAddConditionalItem(ruleIndex)}
                      className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-md"
                    >
                      Add Item
                    </button>
                  </div>

                  <div className="space-y-2">
                    {rule.inventoryItems.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="flex gap-2 items-start p-2 bg-white dark:bg-gray-800 rounded"
                      >
                        <select
                          value={item.inventoryItemId}
                          onChange={(e) =>
                            handleConditionalItemChange(
                              ruleIndex,
                              itemIndex,
                              'inventoryItemId',
                              e.target.value
                            )
                          }
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          required={hasConditionalUtilization}
                        >
                          <option value="">Select item</option>
                          {availableItems.map((invItem) => (
                            <option key={invItem._id} value={invItem._id}>
                              {invItem.name} ({invItem.sku})
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={item.quantityRequired}
                          onChange={(e) =>
                            handleConditionalItemChange(
                              ruleIndex,
                              itemIndex,
                              'quantityRequired',
                              parseFloat(e.target.value)
                            )
                          }
                          placeholder="Qty"
                          className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          required={hasConditionalUtilization}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveConditionalItem(ruleIndex, itemIndex)}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-md"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {conditionalRules.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                Add conditional rules to use different inventory based on product dimensions
              </p>
            )}
          </div>
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
