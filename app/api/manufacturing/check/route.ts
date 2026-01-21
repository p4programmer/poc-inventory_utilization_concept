import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import mongoose from 'mongoose';

// GET /api/manufacturing/check?productId=xxx&quantity=10
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId');
    const quantity = parseInt(searchParams.get('quantity') || '1');
    
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
      .populate('inventoryItems.inventoryItemId');
    
    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found',
        },
        { status: 404 }
      );
    }
    
    // Check stock availability for all required items
    const stockCheck = product.inventoryItems.map((item: any) => {
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
