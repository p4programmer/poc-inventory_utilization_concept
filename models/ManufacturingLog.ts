import mongoose, { Schema, Document, Model } from 'mongoose';

interface IInventoryDeduction {
  inventoryItemId: mongoose.Types.ObjectId;
  quantityDeducted: number;
  stockBefore: number;
  stockAfter: number;
}

export interface IManufacturingLog extends Document {
  productId: mongoose.Types.ObjectId;
  quantityProduced: number;
  inventoryDeductions: IInventoryDeduction[];
  manufacturedBy?: string;
  notes?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryDeductionSchema = new Schema<IInventoryDeduction>(
  {
    inventoryItemId: {
      type: Schema.Types.ObjectId,
      ref: 'InventoryItem',
      required: true,
    },
    quantityDeducted: {
      type: Number,
      required: true,
      min: 0,
    },
    stockBefore: {
      type: Number,
      required: true,
    },
    stockAfter: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const ManufacturingLogSchema = new Schema<IManufacturingLog>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    quantityProduced: {
      type: Number,
      required: [true, 'Quantity produced is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    inventoryDeductions: {
      type: [InventoryDeductionSchema],
      required: true,
    },
    manufacturedBy: {
      type: String,
      trim: true,
      maxlength: [100, 'Manufactured by cannot be more than 100 characters'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot be more than 1000 characters'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
ManufacturingLogSchema.index({ productId: 1, timestamp: -1 });
ManufacturingLogSchema.index({ timestamp: -1 });
ManufacturingLogSchema.index({ 'inventoryDeductions.inventoryItemId': 1 });

const ManufacturingLog: Model<IManufacturingLog> =
  mongoose.models.ManufacturingLog ||
  mongoose.model<IManufacturingLog>('ManufacturingLog', ManufacturingLogSchema);

export default ManufacturingLog;
