import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { productSchema } from '@/lib/validations';
import { ZodError } from 'zod';

// GET /api/products - List all products
export async function GET() {
  try {
    await connectDB();
    
    const products = await Product.find({})
      .populate('inventoryItems.inventoryItemId', 'name sku unit currentStock')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch products',
      },
      { status: 500 }
    );
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    // Validate request body
    const validatedData = productSchema.parse(body);
    
    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku: validatedData.sku });
    if (existingProduct) {
      return NextResponse.json(
        {
          success: false,
          error: 'A product with this SKU already exists',
        },
        { status: 400 }
      );
    }
    
    // Create new product
    const product = await Product.create(validatedData);
    
    // Populate inventory items
    await product.populate('inventoryItems.inventoryItemId', 'name sku unit currentStock');
    
    return NextResponse.json(
      {
        success: true,
        data: product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating product:', error);
    
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
        error: 'Failed to create product',
      },
      { status: 500 }
    );
  }
}
