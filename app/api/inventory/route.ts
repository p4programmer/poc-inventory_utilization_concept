import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import InventoryItem from '@/models/InventoryItem';
import { inventoryItemSchema } from '@/lib/validations';
import { ZodError } from 'zod';

// GET /api/inventory - List all inventory items
export async function GET() {
  try {
    await connectDB();
    
    const items = await InventoryItem.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch inventory items',
      },
      { status: 500 }
    );
  }
}

// POST /api/inventory - Create a new inventory item
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    // Validate request body
    const validatedData = inventoryItemSchema.parse(body);
    
    // Check if SKU already exists
    const existingItem = await InventoryItem.findOne({ sku: validatedData.sku });
    if (existingItem) {
      return NextResponse.json(
        {
          success: false,
          error: 'An inventory item with this SKU already exists',
        },
        { status: 400 }
      );
    }
    
    // Create new inventory item
    const item = await InventoryItem.create(validatedData);
    
    return NextResponse.json(
      {
        success: true,
        data: item,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating inventory item:', error);
    
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
        error: 'Failed to create inventory item',
      },
      { status: 500 }
    );
  }
}
