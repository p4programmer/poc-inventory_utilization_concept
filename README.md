# Inventory Automation System - POC

A full-stack inventory automation system for manufacturing companies built with Next.js 14, TypeScript, MongoDB, and Tailwind CSS.

## Features

### 1. Product Management
- Create, edit, and delete products
- Define Bill of Materials (BOM) for each product
- Link multiple inventory items to products with required quantities
- Track total manufactured units per product

### 2. Inventory Management
- Create, edit, and delete inventory items
- Real-time stock level tracking
- Color-coded stock indicators (green, yellow, orange, red)
- Manual stock adjustments
- Reorder level alerts
- Prevent deletion of items linked to products

### 3. Manufacturing Process
- Select product and quantity to manufacture
- Real-time stock availability check before manufacturing
- Automatic inventory deduction using MongoDB transactions
- Manufacturing logs with complete audit trail
- Track who manufactured and when
- Add notes to manufacturing records

### 4. Analytics Dashboard
- Summary cards for key metrics
- Low stock alerts banner
- List of items at or below reorder level
- Most manufactured products
- Recent manufacturing activity
- Manufacturing consumption trends

### 5. Manufacturing Logs
- Complete audit trail of all manufacturing activities
- Filter logs by product, inventory item, or date range
- Detailed view of inventory deductions per log
- Track stock levels before and after manufacturing

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose ODM
- **Validation**: Zod
- **Forms**: React Hook Form

## Prerequisites

- Node.js 18+ installed
- MongoDB installed locally or MongoDB Atlas account

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fsk
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
MONGODB_URI=mongodb://localhost:27017/inventory-automation
```

For MongoDB Atlas, use your connection string:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/inventory-automation?retryWrites=true&w=majority
```

4. Start MongoDB locally (if using local MongoDB):
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

## Running the Application

### Development Mode

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The app will automatically redirect to the dashboard.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
fsk/
├── app/
│   ├── api/                    # API routes
│   │   ├── products/          # Product CRUD operations
│   │   ├── inventory/         # Inventory CRUD operations
│   │   ├── manufacturing/     # Manufacturing and logs
│   │   └── dashboard/         # Dashboard analytics
│   ├── dashboard/             # Dashboard page
│   ├── products/              # Product management pages
│   ├── inventory/             # Inventory management pages
│   ├── manufacturing/         # Manufacturing pages
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Home page (redirects to dashboard)
├── components/                # Reusable components
│   ├── Navigation.tsx
│   ├── ProductForm.tsx
│   ├── InventoryForm.tsx
│   ├── StockIndicator.tsx
│   ├── AlertBanner.tsx
│   └── LoadingSpinner.tsx
├── lib/                       # Utilities
│   ├── mongodb.ts            # MongoDB connection
│   ├── utils.ts              # Helper functions
│   └── validations.ts        # Zod schemas
└── models/                    # Mongoose models
    ├── Product.ts
    ├── InventoryItem.ts
    └── ManufacturingLog.ts
```

## Usage Guide

### 1. Add Inventory Items
1. Navigate to **Inventory** from the top menu
2. Click **Add Inventory Item**
3. Fill in the details:
   - Name (e.g., "Steel Sheet")
   - SKU (unique identifier)
   - Current Stock (e.g., 1000)
   - Unit (e.g., "kg", "liters", "pieces")
   - Reorder Level (alert threshold)
4. Click **Create Item**

### 2. Create Products
1. Navigate to **Products**
2. Click **Add Product**
3. Fill in product details:
   - Name (e.g., "Car Door")
   - SKU (unique identifier)
   - Description (optional)
4. Add inventory items to the Bill of Materials:
   - Click **Add Item**
   - Select an inventory item
   - Enter quantity required per unit
   - Repeat for all required items
5. Click **Create Product**

### 3. Manufacturing Process
1. Navigate to **Manufacturing**
2. Select a product from the dropdown
3. Enter quantity to produce
4. The system will automatically check stock availability
5. If sufficient stock is available, click **Manufacture**
6. Inventory will be automatically deducted
7. A manufacturing log will be created

### 4. View Analytics
1. Navigate to **Dashboard**
2. View summary cards for:
   - Total products
   - Total inventory items
   - Low stock items
   - Recent manufacturing activity
3. Check low stock alerts
4. View most manufactured products
5. See recent manufacturing logs

### 5. Stock Management
- **Manual Adjustment**: On the Inventory page, click **Adjust Stock** next to any item
- **Automatic Deduction**: Happens automatically during manufacturing
- **Reorder Alerts**: Items at or below reorder level are highlighted in red/orange

## Key Business Logic

### Manufacturing Transaction Flow
1. User submits manufacturing request
2. System validates product and quantity
3. Retrieves product's BOM (Bill of Materials)
4. Checks current stock for all required items
5. If sufficient:
   - Starts MongoDB transaction
   - Deducts inventory atomically
   - Creates manufacturing log
   - Updates product's total manufactured count
   - Commits transaction
6. If insufficient: Returns error with shortage details

### Stock Status Indicators
- **Green**: Stock > 2x reorder level (good)
- **Yellow**: Stock between reorder level and 2x reorder level (medium)
- **Orange**: Stock ≤ reorder level (low)
- **Red**: Stock = 0 (out of stock)

## API Endpoints

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create product
- `GET /api/products/[id]` - Get product by ID
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

### Inventory
- `GET /api/inventory` - List all inventory items
- `POST /api/inventory` - Create inventory item
- `GET /api/inventory/[id]` - Get inventory item by ID
- `PUT /api/inventory/[id]` - Update inventory item
- `PATCH /api/inventory/[id]` - Adjust stock manually
- `DELETE /api/inventory/[id]` - Delete inventory item

### Manufacturing
- `POST /api/manufacturing` - Process manufacturing
- `GET /api/manufacturing/check` - Check stock availability
- `GET /api/manufacturing/logs` - Get manufacturing logs

### Dashboard
- `GET /api/dashboard` - Get dashboard analytics

## Data Models

### Product
- name, sku, description
- inventoryItems: [{ inventoryItemId, quantityRequired }]
- totalManufactured

### Inventory Item
- name, sku, description
- currentStock, unit, reorderLevel

### Manufacturing Log
- productId, quantityProduced
- inventoryDeductions: [{ inventoryItemId, quantityDeducted, stockBefore, stockAfter }]
- manufacturedBy, notes, timestamp

## Error Handling

- **Insufficient Stock**: Manufacturing is blocked if any required inventory item has insufficient stock
- **Duplicate SKU**: Prevents creation of products/items with duplicate SKUs
- **Linked Items**: Prevents deletion of inventory items that are linked to products
- **Manufacturing History**: Prevents deletion of products with manufacturing history
- **Transaction Rollback**: If any part of manufacturing fails, all changes are rolled back

## Future Enhancements

- User authentication and authorization
- Multi-location/warehouse support
- Supplier management
- Purchase order generation
- Email notifications for low stock
- Barcode scanning
- Production scheduling
- Cost tracking per product
- Batch/lot tracking
- Quality control workflows
- Advanced reporting and analytics
- Export data to Excel/CSV
- API documentation (Swagger)

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check the `MONGODB_URI` in `.env.local`
- For MongoDB Atlas, ensure your IP is whitelisted

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run build`

### Port Already in Use
- Change the port: `PORT=3001 npm run dev`
- Or kill the process using port 3000

## License

This is a proof of concept (POC) for demonstration purposes.

## Support

For issues or questions, please create an issue in the repository.
