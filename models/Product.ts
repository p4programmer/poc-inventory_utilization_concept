import mongoose, { Schema, Document, Model } from 'mongoose';

interface IProductInventoryItem {
  inventoryItemId: mongoose.Types.ObjectId;
  quantityRequired: number;
}

export interface IProduct extends Document {
  name: string;
  description?: string;
  sku: string;
  inventoryItems: IProductInventoryItem[];
  totalManufactured: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductInventoryItemSchema = new Schema<IProductInventoryItem>(
  {
    inventoryItemId: {
      type: Schema.Types.ObjectId,
      ref: 'InventoryItem',
      required: [true, 'Inventory item is required'],
    },
    quantityRequired: {
      type: Number,
      required: [true, 'Quantity required is required'],
      min: [0.01, 'Quantity must be greater than 0'],
    },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
      maxlength: [50, 'SKU cannot be more than 50 characters'],
    },
    inventoryItems: {
      type: [ProductInventoryItemSchema],
      validate: {
        validator: function (v: IProductInventoryItem[]) {
          return v && v.length > 0;
        },
        message: 'At least one inventory item is required',
      },
    },
    totalManufactured: {
      type: Number,
      default: 0,
      min: [0, 'Total manufactured cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
// Note: sku already has an index due to unique: true
ProductSchema.index({ 'inventoryItems.inventoryItemId': 1 });

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
