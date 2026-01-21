import { z } from 'zod';

// Inventory Item Validation
export const inventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  sku: z.string().min(1, 'SKU is required').max(50),
  currentStock: z.number().min(0, 'Stock cannot be negative'),
  unit: z.string().min(1, 'Unit is required').max(20),
  reorderLevel: z.number().min(0, 'Reorder level cannot be negative'),
});

export type InventoryItemInput = z.infer<typeof inventoryItemSchema>;

// Product Validation
export const productInventoryItemSchema = z.object({
  inventoryItemId: z.string().min(1, 'Inventory item is required'),
  quantityRequired: z.number().min(0.01, 'Quantity must be greater than 0'),
});

export const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  sku: z.string().min(1, 'SKU is required').max(50),
  inventoryItems: z.array(productInventoryItemSchema).min(1, 'At least one inventory item is required'),
});

export type ProductInput = z.infer<typeof productSchema>;

// Manufacturing Validation
export const manufacturingSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantityProduced: z.number().min(1, 'Quantity must be at least 1').int('Quantity must be a whole number'),
  manufacturedBy: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

export type ManufacturingInput = z.infer<typeof manufacturingSchema>;

// Stock Adjustment Validation
export const stockAdjustmentSchema = z.object({
  adjustment: z.number().refine((val) => val !== 0, 'Adjustment cannot be zero'),
  reason: z.string().max(500).optional(),
});

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
