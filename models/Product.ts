import mongoose, { Schema, Document, Model } from 'mongoose';

interface IProductInventoryItem {
  inventoryItemId: mongoose.Types.ObjectId;
  quantityRequired: number;
}

interface IConditionalUtilization {
  conditionType: 'width' | 'height' | 'both';
  operator: 'greater_than' | 'less_than' | 'equal_to';
  widthThreshold?: number;
  heightThreshold?: number;
  inventoryItems: IProductInventoryItem[];
}

export interface IProduct extends Document {
  name: string;
  description?: string;
  sku: string;
  inventoryItems: IProductInventoryItem[];
  hasConditionalUtilization: boolean;
  conditionalUtilizations?: IConditionalUtilization[];
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

const ConditionalUtilizationSchema = new Schema<IConditionalUtilization>(
  {
    conditionType: {
      type: String,
      enum: ['width', 'height', 'both'],
      required: [true, 'Condition type is required'],
    },
    operator: {
      type: String,
      enum: ['greater_than', 'less_than', 'equal_to'],
      required: [true, 'Operator is required'],
    },
    widthThreshold: {
      type: Number,
      min: [0, 'Width threshold must be positive'],
    },
    heightThreshold: {
      type: Number,
      min: [0, 'Height threshold must be positive'],
    },
    inventoryItems: {
      type: [ProductInventoryItemSchema],
      validate: {
        validator: function (v: IProductInventoryItem[]) {
          return v && v.length > 0;
        },
        message: 'At least one inventory item is required for conditional utilization',
      },
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
    hasConditionalUtilization: {
      type: Boolean,
      default: false,
    },
    conditionalUtilizations: {
      type: [ConditionalUtilizationSchema],
      default: [],
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
