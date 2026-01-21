# Quick Start Guide

This guide will help you get the Inventory Automation System running in minutes.

## Prerequisites

- Node.js 18+ installed
- MongoDB running locally OR MongoDB Atlas account

## Quick Setup (5 minutes)

### Option 1: Local MongoDB

1. **Start MongoDB**
```bash
# macOS (using Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

2. **Clone and Install**
```bash
cd fsk
npm install
```

3. **Configure Environment**
```bash
# The .env.local file is already created with default local MongoDB settings
# Default: MONGODB_URI=mongodb://localhost:27017/inventory-automation
```

4. **Run the Application**
```bash
npm run dev
```

5. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

### Option 2: MongoDB Atlas (Cloud)

1. **Get MongoDB Atlas Connection String**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free cluster
   - Get your connection string

2. **Install**
```bash
cd fsk
npm install
```

3. **Configure Environment**
Edit `.env.local`:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/inventory-automation?retryWrites=true&w=majority
```

4. **Run**
```bash
npm run dev
```

5. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## First Steps

### 1. Add Your First Inventory Item (1 minute)
1. Click **Inventory** in the top menu
2. Click **Add Inventory Item**
3. Fill in:
   - Name: `Steel Sheet`
   - SKU: `STEEL-001`
   - Current Stock: `1000`
   - Unit: `kg`
   - Reorder Level: `200`
4. Click **Create Item**

### 2. Create Your First Product (2 minutes)
1. Click **Products** in the top menu
2. Click **Add Product**
3. Fill in:
   - Name: `Car Door`
   - SKU: `DOOR-001`
   - Description: `Standard car door`
4. In Bill of Materials:
   - Click **Add Item**
   - Select `Steel Sheet (STEEL-001)`
   - Enter quantity: `5` (kg per door)
5. Click **Create Product**

### 3. Manufacture Your First Product (1 minute)
1. Click **Manufacturing** in the top menu
2. Select `Car Door (DOOR-001)` from dropdown
3. Enter quantity: `10` (doors to produce)
4. The system will show:
   - Required: 50 kg of Steel Sheet
   - Available: 1000 kg
   - Status: ✓ Sufficient stock
5. Click **Manufacture**
6. Success! Inventory automatically deducted from 1000 kg → 950 kg

### 4. View Analytics
1. Click **Dashboard** in the top menu
2. See:
   - Total products: 1
   - Total inventory items: 1
   - Recent manufacturing: 1
   - Manufacturing logs

## Test Scenarios

### Scenario 1: Low Stock Alert
1. Go to Inventory
2. Click **Adjust Stock** on Steel Sheet
3. Enter `-850` (reduces stock from 950 to 100)
4. Go to Dashboard
5. See Low Stock Alert (current: 100 kg, reorder level: 200 kg)

### Scenario 2: Insufficient Stock Prevention
1. Go to Manufacturing
2. Select Car Door
3. Enter quantity: `30` (requires 150 kg, but only 100 kg available)
4. System shows: ❌ Insufficient stock
5. Manufacturing button is disabled
6. Error message shows shortage

### Scenario 3: View Manufacturing History
1. Click **Logs** in the top menu
2. See all manufacturing activities with:
   - Product manufactured
   - Quantity produced
   - Inventory items deducted
   - Stock levels before/after
   - Timestamp

## Production Deployment

### Build for Production
```bash
npm run build
npm start
```

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add your MONGODB_URI environment variable in Vercel dashboard
```

### Deploy to Other Platforms
The application is a standard Next.js app and can be deployed to:
- Vercel (recommended)
- Netlify
- AWS Amplify
- Docker
- Any Node.js hosting

## Troubleshooting

### MongoDB Connection Error
```
Error: Failed to connect to MongoDB
```
**Solution**: 
- Ensure MongoDB is running
- Check MONGODB_URI in .env.local
- For Atlas, check IP whitelist and credentials

### Port 3000 Already in Use
```
Error: Port 3000 is already in use
```
**Solution**: 
```bash
# Use a different port
PORT=3001 npm run dev
```

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

## Next Steps

1. **Add More Inventory Items**: Build your complete inventory catalog
2. **Create Complex Products**: Products can use multiple inventory items
3. **Monitor Dashboard**: Keep track of low stock and manufacturing trends
4. **Adjust Stock Levels**: Manually adjust when receiving new stock
5. **Review Logs**: Audit trail of all manufacturing activities

## Support

For issues or questions:
- Check the full [README.md](README.md)
- Review error messages in the browser console
- Check server logs in the terminal

## Key Features to Explore

- ✓ Real-time stock validation before manufacturing
- ✓ Automatic inventory deduction with atomic transactions
- ✓ Low stock alerts and reorder level tracking
- ✓ Complete manufacturing audit trail
- ✓ Dashboard analytics and trends
- ✓ Multi-item Bill of Materials (BOM)
- ✓ Manual stock adjustments
- ✓ Color-coded stock indicators

Enjoy using the Inventory Automation System!
