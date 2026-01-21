# Conditional Utilization Feature

## Overview

The Conditional Utilization feature allows products to use different inventory quantities based on product dimensions (width and/or height). This is useful when manufacturing processes vary depending on the size of the product being manufactured.

## Use Cases

- **Variable Material Usage**: Larger products require more materials
- **Different Manufacturing Processes**: Products above certain dimensions use different materials or techniques
- **Size-Based Formulas**: Custom material calculations based on dimensions

## How It Works

### 1. Enable Conditional Utilization

When creating or editing a product:

1. Check the **"Enable Conditional Utilization (based on dimensions)"** checkbox
2. This activates the conditional rules section

### 2. Add Conditional Rules

Each conditional rule consists of:

#### Condition Type
- **Width**: Check only the width dimension
- **Height**: Check only the height dimension
- **Both (Width AND Height)**: Both dimensions must meet the criteria

#### Operator
- **Greater Than (>)**: Dimension must be greater than threshold
- **Less Than (<)**: Dimension must be less than threshold
- **Equal To (=)**: Dimension must equal threshold

#### Threshold Values
- **Width Threshold**: The width value to compare against
- **Height Threshold**: The height value to compare against (for "Both" condition type)

#### Inventory Items
- List of inventory items and quantities to use when this condition matches

### 3. Manufacturing with Dimensions

When manufacturing a product with conditional utilization:

1. Navigate to **Manufacturing** page
2. Select the product
3. Enter quantity to produce
4. **Enter dimensions** in the Width and Height fields
5. The system automatically:
   - Checks all conditional rules
   - Uses the **first matching rule**'s inventory items
   - Falls back to default BOM if no conditions match
   - Shows which condition matched (if any)

## Example Scenarios

### Example 1: Size-Based Material Usage

**Product**: Custom Door

**Default BOM**:
- Wood: 5 kg
- Screws: 10 pieces

**Conditional Rule**: If Width > 100 cm
- Wood: 8 kg (more material for wider doors)
- Screws: 15 pieces
- Steel Reinforcement: 2 kg (added for structural support)

**Manufacturing**:
- Width = 90 cm → Uses default BOM (5 kg wood, 10 screws)
- Width = 120 cm → Uses conditional BOM (8 kg wood, 15 screws, 2 kg steel)

### Example 2: Height-Based Processing

**Product**: Glass Panel

**Default BOM**:
- Glass: 2 m²
- Frame: 4 m

**Conditional Rule**: If Height > 200 cm
- Glass: 3 m² (extra material for cutting waste)
- Frame: 6 m (taller frames)
- Support Brackets: 4 pieces (structural support)

### Example 3: Combined Dimensions

**Product**: Metal Sheet

**Default BOM**:
- Steel: 10 kg

**Conditional Rule**: If Width > 150 cm AND Height > 100 cm
- Steel: 20 kg (large sheet requires more material)
- Rivets: 50 pieces (more fasteners for large sheets)
- Edge Trim: 8 m (perimeter material)

## Manufacturing Process Flow

```
1. User enters product dimensions (width, height)
   ↓
2. System retrieves product's conditional rules
   ↓
3. System evaluates each rule in order:
   - Check if dimensions match condition type
   - Apply operator (>, <, =)
   - Compare against threshold(s)
   ↓
4. First matching rule's inventory items are selected
   ↓
5. If no rules match, use default BOM
   ↓
6. Stock availability check with selected items
   ↓
7. Manufacturing proceeds if stock sufficient
```

## API Updates

### Manufacturing Check API
```
GET /api/manufacturing/check?productId=xxx&quantity=10&width=120&height=80
```

**Response includes**:
```json
{
  "success": true,
  "data": {
    "dimensions": { "width": 120, "height": 80 },
    "conditionMatched": true,
    "matchedCondition": {
      "conditionType": "width",
      "operator": "greater_than",
      "widthThreshold": 100
    },
    "stockCheck": [...]
  }
}
```

### Manufacturing API
```
POST /api/manufacturing
{
  "productId": "xxx",
  "quantityProduced": 10,
  "width": 120,
  "height": 80,
  "manufacturedBy": "John Doe",
  "notes": "Large custom order"
}
```

## Data Model

### Product Schema
```typescript
{
  name: string,
  sku: string,
  inventoryItems: [...], // Default BOM
  hasConditionalUtilization: boolean,
  conditionalUtilizations: [
    {
      conditionType: 'width' | 'height' | 'both',
      operator: 'greater_than' | 'less_than' | 'equal_to',
      widthThreshold?: number,
      heightThreshold?: number,
      inventoryItems: [
        {
          inventoryItemId: ObjectId,
          quantityRequired: number
        }
      ]
    }
  ]
}
```

## Important Notes

1. **Rule Priority**: The **first matching rule** is used. Order matters!
2. **Fallback**: If no rules match, the default BOM is used
3. **Optional Dimensions**: If dimensions are not provided (0 or empty), default BOM is used
4. **Multiple Rules**: You can have multiple conditional rules per product
5. **Validation**: Each conditional rule must have at least one inventory item

## UI Features

### Product Form
- Checkbox to enable/disable conditional utilization
- Add/remove conditional rules
- Configure condition type, operator, and thresholds
- Add inventory items for each rule
- Visual distinction with purple borders

### Manufacturing Form
- Dimension input fields (Width and Height)
- Real-time stock check including dimension evaluation
- Display of matched condition (if any)
- Stock availability check with appropriate inventory items

### Manufacturing Logs
- Dimensions are stored in manufacturing logs
- Can see which dimensions were used for historical records

## Best Practices

1. **Start Simple**: Begin with one or two conditional rules
2. **Test Thoroughly**: Verify each condition works as expected
3. **Document Rules**: Use clear thresholds that match real-world measurements
4. **Monitor Usage**: Check manufacturing logs to ensure correct rules are matching
5. **Maintain Defaults**: Always ensure the default BOM works for typical cases

## Troubleshooting

### Condition Not Matching
- Check threshold values are correct
- Verify operator is appropriate (>, <, =)
- Ensure dimensions are entered during manufacturing
- Check that condition type matches dimensions provided

### Wrong Inventory Used
- Review rule order (first match wins)
- Verify threshold values
- Check that conditional utilization is enabled
- Confirm dimensions are being passed correctly

### Stock Insufficient
- Conditional rules use different inventory items
- Check stock levels for the conditional inventory items
- May need to add stock or adjust conditional quantities

## Future Enhancements

Potential additions to conditional utilization:

- **Formula-Based Calculations**: Use formulas instead of fixed quantities (e.g., width × height × factor)
- **Range Conditions**: Between thresholds (e.g., 100 < width < 200)
- **Multiple Condition Matching**: Apply multiple rules instead of just first match
- **Conditional Rule Templates**: Save and reuse common condition patterns
- **Visual Rule Builder**: Drag-and-drop interface for creating rules
- **Rule Testing**: Test conditions with sample dimensions before saving

---

**Need Help?** Check the main [README.md](README.md) or [QUICKSTART.md](QUICKSTART.md) for general system usage.
