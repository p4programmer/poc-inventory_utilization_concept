import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
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

// GET /api/manufacturing/check?productId=xxx&quantity=10&width=10&height=20
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId');
    const quantity = parseInt(searchParams.get('quantity') || '1');
    const width = parseFloat(searchParams.get('width') || '0');
    const height = parseFloat(searchParams.get('height') || '0');
    
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid product ID',
        },
        { status: 400 }
      );
    }
    
    if (quantity < 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Quantity must be at least 1',
        },
        { status: 400 }
      );
    }
    
    // Get the product with its inventory requirements
    const product = await Product.findById(productId)
      .populate('inventoryItems.inventoryItemId')
      .populate('conditionalUtilizations.inventoryItems.inventoryItemId');
    
    if (!product) {
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
    let conditionMatched = false;
    let matchedConditionInfo = null;
    
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
          inventoryItemsToUse = condition.inventoryItems;
          conditionMatched = true;
          matchedConditionInfo = {
            conditionType: condition.conditionType,
            operator: condition.operator,
            widthThreshold: condition.widthThreshold,
            heightThreshold: condition.heightThreshold,
          };
          break; // Use first matching condition
        }
      }
    }
    
    // Check stock availability for all required items
    const stockCheck = inventoryItemsToUse.map((item: any) => {
      const inventoryItem = item.inventoryItemId;
      const requiredQuantity = item.quantityRequired * quantity;
      const available = inventoryItem.currentStock;
      const sufficient = available >= requiredQuantity;
      
      return {
        inventoryItemId: inventoryItem._id,
        name: inventoryItem.name,
        sku: inventoryItem.sku,
        unit: inventoryItem.unit,
        requiredPerUnit: item.quantityRequired,
        totalRequired: requiredQuantity,
        available,
        sufficient,
        shortage: sufficient ? 0 : requiredQuantity - available,
      };
    });
    
    const allSufficient = stockCheck.every((item) => item.sufficient);
    const insufficientItems = stockCheck.filter((item) => !item.sufficient);
    
    return NextResponse.json({
      success: true,
      data: {
        productId: product._id,
        productName: product.name,
        productSku: product.sku,
        quantityToManufacture: quantity,
        dimensions: { width, height },
        conditionMatched,
        matchedCondition: matchedConditionInfo,
        canManufacture: allSufficient,
        stockCheck,
        insufficientItems: insufficientItems.length > 0 ? insufficientItems : undefined,
      },
    });
  } catch (error) {
    console.error('Error checking stock availability:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check stock availability',
      },
      { status: 500 }
    );
  }
}
