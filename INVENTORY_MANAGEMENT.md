# Automatic Inventory Management System

## Overview
The system now automatically reduces product and inventory quantities when orders are placed, and restores them when orders are cancelled or deleted.

## Features Implemented

### 1. Automatic Stock Reduction on Order Placement
When a customer places an order:
- **Product stock** is reduced by the ordered quantity
- **Inventory quantity** is reduced by the ordered quantity
- Both reductions happen automatically after the order is successfully created
- Uses `Math.max(0, currentStock - orderedQuantity)` to prevent negative stock

### 2. Automatic Stock Restoration on Order Cancellation
When an admin cancels an order:
- **Product stock** is restored by adding back the ordered quantity
- **Inventory quantity** is restored by adding back the ordered quantity
- Only restores if the order wasn't already cancelled (prevents double restoration)

### 3. Smart Stock Restoration on Order Deletion
When an admin deletes an order:
- **Paid orders**: Stock is NOT restored (products were actually sold)
- **Unpaid orders**: Stock is restored (products weren't sold)
- **Cancelled orders**: Stock is NOT restored (already restored when cancelled)
- Clear confirmation messages explain what will happen to inventory

## New Functions Added

### In `inventoryService.ts`:
- `reduceInventoryForOrder()` - Reduces inventory quantities for order items
- `restoreInventoryForOrder()` - Restores inventory quantities when orders are cancelled/deleted

### In `productService.ts`:
- `reduceProductStockForOrder()` - Reduces product stock for order items
- `restoreProductStockForOrder()` - Restores product stock when orders are cancelled/deleted

### Modified in `orderService.ts`:
- `createOrder()` - Now reduces stock after creating order
- `updateOrderStatus()` - Restores stock when status is changed to 'cancelled'
- `deleteOrder()` - Restores stock before deleting order

## Error Handling
- If stock reduction fails after order creation, the order remains valid but a warning is logged
- If stock restoration fails during cancellation/deletion, the operation continues but a warning is logged
- All operations include detailed console logging for debugging

## Data Flow

### Order Creation:
1. Customer places order
2. Order is created in database
3. System reduces inventory quantities
4. System reduces product stock
5. Both operations happen in parallel for efficiency

### Order Cancellation:
1. Admin changes order status to 'cancelled'
2. System checks if order was already cancelled
3. If not cancelled, restores inventory quantities
4. Restores product stock
5. Updates order status

### Order Deletion Logic:
1. Admin attempts to delete order
2. System shows different confirmation messages based on order status:
   - **Paid orders**: Warning that inventory will NOT be restored
   - **Unpaid orders**: Notice that inventory WILL be restored
   - **Cancelled orders**: Notice that no inventory changes will occur
3. If confirmed, system checks payment status
4. **Only unpaid, non-cancelled orders** restore inventory and product stock
5. Deletes the order from database

## Benefits
- **Real-time inventory tracking**: Stock levels are always up-to-date
- **Prevents overselling**: Stock is reduced immediately when orders are placed
- **Automatic recovery**: Stock is restored when orders are cancelled or deleted
- **Data consistency**: Both product and inventory collections are kept in sync
- **Error resilience**: Operations continue even if some steps fail, with appropriate logging

## Quick Reference: When Inventory is Restored

| Order Action | Payment Status | Order Status | Inventory Restored? | Reason |
|-------------|----------------|--------------|-------------------|--------|
| **Delete Order** | Unpaid | Pending/Confirmed/Processing/Shipped | ✅ YES | Order wasn't completed |
| **Delete Order** | Paid | Any status | ❌ NO | Products were sold |
| **Delete Order** | Any | Cancelled | ❌ NO | Already restored when cancelled |
| **Cancel Order** | Any | Not cancelled | ✅ YES | Return products to stock |
| **Cancel Order** | Any | Already cancelled | ❌ NO | Prevent double restoration |

## Usage
The system works automatically - no changes needed in the frontend components. When customers place orders through the existing checkout process, inventory will be reduced automatically. When admins manage orders through the orders page, stock restoration happens automatically.
