import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import InventoryItem from '@/models/InventoryItem';
import ManufacturingLog from '@/models/ManufacturingLog';
import { manufacturingSchema } from '@/lib/validations';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

// POST /api/manufacturing - Process manufacturing and deduct inventory
export async function POST(request: NextRequest) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    await connectDB();
    
    const body = await request.json();
    
    // Validate request body
    const validatedData = manufacturingSchema.parse(body);
    
    // Get the product with its inventory requirements
    const product = await Product.findById(validatedData.productId)
      .populate('inventoryItems.inventoryItemId')
      .session(session);
    
    if (!product) {
      await session.abortTransaction();
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found',
        },
        { status: 404 }
      );
    }
    
    // Check stock availability for all required items
    const insufficientItems: Array<{ name: string; required: number; available: number }> = [];
    const inventoryDeductions: Array<{
      inventoryItemId: mongoose.Types.ObjectId;
      quantityDeducted: number;
      stockBefore: number;
      stockAfter: number;
    }> = [];
    
    for (const item of product.inventoryItems) {
      const inventoryItem = item.inventoryItemId as any;
      const requiredQuantity = item.quantityRequired * validatedData.quantityProduced;
      
      if (inventoryItem.currentStock < requiredQuantity) {
        insufficientItems.push({
          name: inventoryItem.name,
          required: requiredQuantity,
          available: inventoryItem.currentStock,
        });
      } else {
        inventoryDeductions.push({
          inventoryItemId: inventoryItem._id,
          quantityDeducted: requiredQuantity,
          stockBefore: inventoryItem.currentStock,
          stockAfter: inventoryItem.currentStock - requiredQuantity,
        });
      }
    }
    
    // If any items have insufficient stock, abort
    if (insufficientItems.length > 0) {
      await session.abortTransaction();
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient stock for manufacturing',
          insufficientItems,
        },
        { status: 400 }
      );
    }
    
    // Deduct inventory items
    for (const deduction of inventoryDeductions) {
      await InventoryItem.findByIdAndUpdate(
        deduction.inventoryItemId,
        {
          $inc: { currentStock: -deduction.quantityDeducted },
        },
        { session }
      );
    }
    
    // Update product's total manufactured count
    await Product.findByIdAndUpdate(
      validatedData.productId,
      {
        $inc: { totalManufactured: validatedData.quantityProduced },
      },
      { session }
    );
    
    // Create manufacturing log
    const log = await ManufacturingLog.create(
      [
        {
          productId: validatedData.productId,
          quantityProduced: validatedData.quantityProduced,
          inventoryDeductions,
          manufacturedBy: validatedData.manufacturedBy,
          notes: validatedData.notes,
          timestamp: new Date(),
        },
      ],
      { session }
    );
    
    // Commit the transaction
    await session.commitTransaction();
    
    // Populate the log for response
    const populatedLog = await ManufacturingLog.findById(log[0]._id)
      .populate('productId', 'name sku')
      .populate('inventoryDeductions.inventoryItemId', 'name sku unit');
    
    return NextResponse.json(
      {
        success: true,
        data: populatedLog,
        message: 'Manufacturing completed successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    await session.abortTransaction();
    console.error('Error processing manufacturing:', error);
    
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
        error: 'Failed to process manufacturing',
      },
      { status: 500 }
    );
  } finally {
    session.endSession();
  }
}
