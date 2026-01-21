import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import InventoryItem from '@/models/InventoryItem';
import Product from '@/models/Product';
import { inventoryItemSchema, stockAdjustmentSchema } from '@/lib/validations';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

// GET /api/inventory/[id] - Get a single inventory item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid inventory item ID',
        },
        { status: 400 }
      );
    }
    
    const item = await InventoryItem.findById(id);
    
    if (!item) {
      return NextResponse.json(
        {
          success: false,
          error: 'Inventory item not found',
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch inventory item',
      },
      { status: 500 }
    );
  }
}

// PUT /api/inventory/[id] - Update an inventory item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid inventory item ID',
        },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Validate request body
    const validatedData = inventoryItemSchema.parse(body);
    
    // Check if SKU is being changed and if it already exists
    const existingItem = await InventoryItem.findOne({
      sku: validatedData.sku,
      _id: { $ne: id },
    });
    
    if (existingItem) {
      return NextResponse.json(
        {
          success: false,
          error: 'An inventory item with this SKU already exists',
        },
        { status: 400 }
      );
    }
    
    // Update inventory item
    const item = await InventoryItem.findByIdAndUpdate(
      id,
      validatedData,
      { new: true, runValidators: true }
    );
    
    if (!item) {
      return NextResponse.json(
        {
          success: false,
          error: 'Inventory item not found',
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.issues,
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update inventory item',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory/[id] - Delete an inventory item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid inventory item ID',
        },
        { status: 400 }
      );
    }
    
    // Check if item is linked to any products
    const linkedProducts = await Product.exists({
      'inventoryItems.inventoryItemId': id,
    });
    
    if (linkedProducts) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete inventory item that is linked to products',
        },
        { status: 400 }
      );
    }
    
    const item = await InventoryItem.findByIdAndDelete(id);
    
    if (!item) {
      return NextResponse.json(
        {
          success: false,
          error: 'Inventory item not found',
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Inventory item deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete inventory item',
      },
      { status: 500 }
    );
  }
}

// PATCH /api/inventory/[id] - Adjust stock manually
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid inventory item ID',
        },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Validate request body
    const validatedData = stockAdjustmentSchema.parse(body);
    
    const item = await InventoryItem.findById(id);
    
    if (!item) {
      return NextResponse.json(
        {
          success: false,
          error: 'Inventory item not found',
        },
        { status: 404 }
      );
    }
    
    // Calculate new stock
    const newStock = item.currentStock + validatedData.adjustment;
    
    if (newStock < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Stock adjustment would result in negative stock',
        },
        { status: 400 }
      );
    }
    
    // Update stock
    item.currentStock = newStock;
    await item.save();
    
    return NextResponse.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.issues,
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to adjust stock',
      },
      { status: 500 }
    );
  }
}
