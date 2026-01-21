import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import InventoryItem from '@/models/InventoryItem';
import ManufacturingLog from '@/models/ManufacturingLog';
import { manufacturingSchema } from '@/lib/validations';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

// Helper function to check if dimensions match condition
function checkDimensionCondition(
  conditionType: string,
  operator: string,
  widthThreshold: number | undefined,
  heightThreshold: number | undefined,
  actualWidth: number,
  actualHeight: number
): boolean {
  const checkOperator = (value: number, threshold: number, op: string): boolean => {
    switch (op) {
      case 'greater_than':
        return value > threshold;
      case 'less_than':
        return value < threshold;
      case 'equal_to':
        return value === threshold;
      default:
        return false;
    }
  };

  switch (conditionType) {
    case 'width':
      return widthThreshold !== undefined && checkOperator(actualWidth, widthThreshold, operator);
    case 'height':
      return heightThreshold !== undefined && checkOperator(actualHeight, heightThreshold, operator);
    case 'both':
      return (
        widthThreshold !== undefined &&
        heightThreshold !== undefined &&
        checkOperator(actualWidth, widthThreshold, operator) &&
        checkOperator(actualHeight, heightThreshold, operator)
      );
    default:
      return false;
  }
}

// POST /api/manufacturing - Process manufacturing and deduct inventory
export async function POST(request: NextRequest) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    await connectDB();
    
    const body = await request.json();
    
    // Validate request body
    const validatedData = manufacturingSchema.parse(body);
    
    const width = validatedData.width || 0;
    const height = validatedData.height || 0;
    
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
    
    // Determine which inventory items to use
    let inventoryItemsToUse = product.inventoryItems;
    
    // Check if product has conditional utilization and dimensions are provided
    if (product.hasConditionalUtilization && product.conditionalUtilizations && (width > 0 || height > 0)) {
      for (const condition of product.conditionalUtilizations) {
        if (
          checkDimensionCondition(
            condition.conditionType,
            condition.operator,
            condition.widthThreshold,
            condition.heightThreshold,
            width,
            height
          )
        ) {
          // Manually populate the nested inventory items
          const populatedConditionItems: any = await Promise.all(
            condition.inventoryItems.map(async (item: any) => {
              const inventoryItem = await InventoryItem.findById(item.inventoryItemId).session(session);
              return {
                inventoryItemId: inventoryItem,
                quantityRequired: item.quantityRequired,
              };
            })
          );
          
          inventoryItemsToUse = populatedConditionItems as any;
          break; // Use first matching condition
        }
      }
    }
    
    // Check stock availability for all required items
    const insufficientItems: Array<{ name: string; required: number; available: number }> = [];
    const inventoryDeductions: Array<{
      inventoryItemId: mongoose.Types.ObjectId;
      quantityDeducted: number;
      stockBefore: number;
      stockAfter: number;
    }> = [];
    
    for (const item of inventoryItemsToUse) {
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
