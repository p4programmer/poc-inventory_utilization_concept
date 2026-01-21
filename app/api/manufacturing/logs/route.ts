import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ManufacturingLog from '@/models/ManufacturingLog';

// GET /api/manufacturing/logs - Get manufacturing logs with optional filters
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId');
    const inventoryItemId = searchParams.get('inventoryItemId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    // Build query
    const query: any = {};
    
    if (productId) {
      query.productId = productId;
    }
    
    if (inventoryItemId) {
      query['inventoryDeductions.inventoryItemId'] = inventoryItemId;
    }
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }
    
    const logs = await ManufacturingLog.find(query)
      .populate('productId', 'name sku')
      .populate('inventoryDeductions.inventoryItemId', 'name sku unit')
      .sort({ timestamp: -1 })
      .limit(limit);
    
    return NextResponse.json({
      success: true,
      data: logs,
      count: logs.length,
    });
  } catch (error) {
    console.error('Error fetching manufacturing logs:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch manufacturing logs',
      },
      { status: 500 }
    );
  }
}
