import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import InventoryItem from '@/models/InventoryItem';
import ManufacturingLog from '@/models/ManufacturingLog';

// GET /api/dashboard - Get dashboard statistics
export async function GET() {
  try {
    await connectDB();
    
    // Get counts
    const totalProducts = await Product.countDocuments();
    const totalInventoryItems = await InventoryItem.countDocuments();
    
    // Get low stock items (where currentStock <= reorderLevel)
    const lowStockItems = await InventoryItem.find({
      $expr: { $lte: ['$currentStock', '$reorderLevel'] },
    }).sort({ currentStock: 1 });
    
    // Get recent manufacturing activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentManufacturing = await ManufacturingLog.countDocuments({
      timestamp: { $gte: sevenDaysAgo },
    });
    
    // Get most manufactured products (top 5)
    const mostManufacturedProducts = await Product.find({})
      .sort({ totalManufactured: -1 })
      .limit(5)
      .select('name sku totalManufactured');
    
    // Get inventory consumption over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const consumptionData = await ManufacturingLog.aggregate([
      {
        $match: {
          timestamp: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
          },
          totalProduced: { $sum: '$quantityProduced' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);
    
    // Get recent logs
    const recentLogs = await ManufacturingLog.find({})
      .populate('productId', 'name sku')
      .sort({ timestamp: -1 })
      .limit(10);
    
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalProducts,
          totalInventoryItems,
          lowStockItemsCount: lowStockItems.length,
          recentManufacturing,
        },
        lowStockItems,
        mostManufacturedProducts,
        consumptionData,
        recentLogs,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard data',
      },
      { status: 500 }
    );
  }
}
