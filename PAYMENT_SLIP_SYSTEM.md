# Payment Slip Management System

## Overview
The system now includes comprehensive payment slip management that can save detailed information from Thai bank transfer slips to Firebase.

## Features

### 1. Enhanced Payment Slip Storage
- **Detailed Information**: Stores amount, transfer date/time, bank details, reference numbers
- **Image Storage**: Saves base64 encoded slip images
- **Status Tracking**: Tracks verification status (pending, verified, rejected)
- **Audit Trail**: Records who verified/rejected slips and when

### 2. Payment Slip Data Structure
```typescript
interface PaymentSlip {
  id: string;
  orderId: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  slipImageUrl: string;
  amount: number;
  transferDate: string;
  transferTime?: string;
  fromAccount?: string;
  toAccount?: string;
  bankName?: string;
  referenceNumber?: string;
  transactionId?: string;
  notes?: string;
  status: 'pending_verification' | 'verified' | 'rejected';
  createdAt: Timestamp;
  verifiedAt?: Timestamp;
  verifiedBy?: string;
  rejectionReason?: string;
}
```

### 3. New Firebase Collections
- **payment_slips**: Stores detailed payment slip records
- **orders.paymentDetails**: Enhanced with more detailed payment information

## Functions Available

### Core Payment Slip Functions
- `savePaymentSlipInfo()` - Save detailed payment slip information
- `getAllPaymentSlips()` - Get all payment slips (admin)
- `getPaymentSlipsByOrder()` - Get slips for specific order
- `verifyPaymentSlip()` - Admin verification
- `rejectPaymentSlip()` - Admin rejection

### Utility Functions
- `saveThaiPaymentSlip()` - Quick save for Thai bank slips
- `createPaymentSlipFromImageData()` - Process image data with Thai date conversion

## Your Payment Slip Data
Based on the slip image you provided, here's the extracted information:

```javascript
const slipData = {
  amount: 1000.00,
  transferDate: '8/9/2025', // Converted from Buddhist year 2568
  bankName: 'กสิกรไทย',
  referenceNumber: 'slip_175734716760',
  notes: 'รายละเอียดการชำระเงิน - โอนผ่าน K PLUS'
};
```

## How to Save Your Payment Slip

### Method 1: Using the Browser Console
1. Open your ecommerce website
2. Open browser dev tools (F12)
3. Go to Console tab
4. Run this code:

```javascript
// Replace with actual values
const orderId = 'your-order-id';
const customerId = 'your-customer-id';
const customerEmail = 'customer@example.com';
const customerName = 'Customer Name';
const imageBase64 = 'data:image/jpeg;base64,your-image-data';

// Import and call the function
import('../lib/paymentSlipService').then(({ savePaymentSlipInfo }) => {
  savePaymentSlipInfo({
    orderId,
    customerId,
    customerEmail,
    customerName,
    slipImageUrl: imageBase64,
    amount: 1000.00,
    transferDate: '8/9/2025',
    bankName: 'กสิกรไทย',
    referenceNumber: 'slip_175734716760',
    transactionId: 'slip_175734716760',
    notes: 'Payment slip - K PLUS transfer'
  }).then(slipId => {
    console.log('✅ Payment slip saved with ID:', slipId);
  }).catch(error => {
    console.error('❌ Error:', error);
  });
});
```

### Method 2: Using the Upload Form
1. Go to the orders page
2. Find your order
3. Click "อัปโหลดหลักฐานการโอน"
4. Select your slip image
5. The system will automatically extract and save details

### Method 3: Using the PaymentSlipForm Component
Import and use the `PaymentSlipForm` component in your React app:

```tsx
import { PaymentSlipForm } from '../components/PaymentSlipForm';

<PaymentSlipForm
  orderId="your-order-id"
  customerId="your-customer-id"
  customerEmail="customer@example.com"
  customerName="Customer Name"
  onSave={(slipId) => console.log('Saved with ID:', slipId)}
/>
```

## Admin Features

### Payment Slip Verification
Admins can verify or reject payment slips:

```javascript
// Verify a slip
await verifyPaymentSlip(slipId, adminUserId);

// Reject a slip
await rejectPaymentSlip(slipId, 'Invalid amount', adminUserId);
```

### View All Payment Slips
```javascript
const allSlips = await getAllPaymentSlips();
console.log('All payment slips:', allSlips);
```

## Data Flow

1. **Customer uploads slip** → Image and details saved to Firebase
2. **Admin reviews slip** → Can verify or reject with reasons
3. **Order updated** → Payment status reflects slip verification
4. **Audit trail** → All actions tracked with timestamps and user IDs

## Benefits

- **Complete Records**: Full payment history with images and details
- **Thai Bank Support**: Handles Thai date formats and bank names
- **Admin Control**: Verification workflow for payment confirmations
- **Audit Trail**: Track who verified what and when
- **Data Integrity**: Separate collection ensures payment data is preserved

## Usage in Development

The system is ready to use. Your specific payment slip data can be saved using any of the methods above. Just replace the placeholder values with your actual order and customer information.
