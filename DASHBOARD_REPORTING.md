# Dashboard and Reporting System

## Overview
A comprehensive dashboard with analytics, charts, and multi-format reporting capabilities that fulfills URS requirements 16-19.

## Features Implemented

### 📊 Dashboard Analytics
- **Summary Cards**: Key metrics overview (total products, orders, revenue, stock alerts)
- **Interactive Charts**: Visual representation of data using Recharts library
- **Real-time Data**: Live updates from Firebase collections
- **Admin-only Access**: Restricted to admin users only

### 📈 Chart Types
1. **Pie Chart**: Stock status distribution (in stock, low stock, out of stock)
2. **Bar Chart**: Top 5 selling products with quantities
3. **Area Chart**: Monthly revenue trends with order counts

### 📋 Report Types (URS-17)
1. **📦 Inventory Report** (URS-16): Complete stock status with current/min/max levels
2. **💰 Sales Report** (URS-19): Revenue analysis with customer details
3. **⚠️ Low Stock Report**: Products requiring reorder with priority levels
4. **🏆 Top Selling Products** (URS-19): Best-performing products by sales volume

### 📄 Export Capabilities (URS-18)
- **PDF Export**: Professional reports with tables and formatting
- **Excel Export**: Spreadsheet format for further analysis
- **Multiple Formats**: Each report type supports both PDF and Excel export

## Technical Implementation

### Dashboard Service (`dashboardService.ts`)
```typescript
// Comprehensive data aggregation
- getDashboardStats(): Main function collecting all analytics
- generateTopSellingProductsReport(): Sales performance analysis
- generateInventoryReport(): Stock status evaluation
- generateLowStockReport(): Reorder priority calculation
- generateMonthlyRevenueReport(): Revenue trend analysis
```

### Export Service (`exportService.ts`)
```typescript
// Multi-format export functionality
- exportInventoryReportToPDF/ToExcel()
- exportSalesReportToPDF/ToExcel()
- exportLowStockReportToPDF/ToExcel()
- exportTopSellingProductsToPDF/ToExcel()
```

### Libraries Used
- **Recharts**: Interactive charts and graphs
- **jsPDF + jspdf-autotable**: PDF generation with tables
- **XLSX**: Excel file generation
- **file-saver**: Client-side file download

## Dashboard Sections

### 1. Summary Cards
- Total Products Count
- Total Orders Count
- Total Revenue (paid orders only)
- Low Stock Items Count
- Out of Stock Items Count
- Recent Orders Count (last 30 days)

### 2. Visual Charts
- **Stock Status Pie Chart**: Distribution of inventory status
- **Top Products Bar Chart**: Best sellers by quantity
- **Revenue Area Chart**: Monthly performance trends

### 3. Report Tables
- **Tabbed Interface**: Easy switching between report types
- **Responsive Tables**: Mobile-friendly data display
- **Status Indicators**: Color-coded badges for quick identification
- **Pagination**: Shows top 10 items with full count

### 4. Export Controls
- **PDF Export**: Professional formatted reports
- **Excel Export**: Data analysis ready spreadsheets
- **One-click Download**: Immediate file generation

## Report Details

### Inventory Report (URS-16)
- Product name and category
- Current stock levels
- Minimum/maximum stock thresholds
- Status indicators (in stock, low stock, out of stock)
- Last restocked date

### Sales Report (URS-19)
- Order ID and customer information
- Sale amounts and payment status
- Order status and dates
- Customer contact details

### Low Stock Report
- Products requiring reorder
- Current vs minimum stock comparison
- Priority levels (critical, warning, reorder)
- Shortage quantities

### Top Selling Products (URS-19)
- Ranking by sales volume
- Revenue generated per product
- Category breakdown
- Performance metrics

## Data Sources
- **Products Collection**: Product inventory and details
- **Orders Collection**: Sales transactions and customer data
- **Inventory Collection**: Stock levels and management data

## Access Control
- **Admin Only**: Dashboard restricted to admin users
- **Authentication Required**: Must be logged in to access
- **Role-based Access**: Checks user role before displaying content

## Usage Instructions

### Viewing Dashboard
1. Log in as admin user
2. Navigate to Dashboard page
3. View summary cards and charts
4. Switch between report tabs

### Exporting Reports
1. Select desired report tab
2. Click "ส่งออก PDF" for PDF format
3. Click "ส่งออก Excel" for spreadsheet format
4. File will automatically download

### Understanding Charts
- **Pie Chart**: Click segments for detailed view
- **Bar Chart**: Hover for exact values
- **Area Chart**: Shows revenue trends over time

## Performance Considerations
- **Lazy Loading**: Charts render only when needed
- **Data Aggregation**: Calculations performed on client-side
- **Responsive Design**: Works on desktop and mobile devices
- **Error Handling**: Graceful handling of data loading failures

## Future Enhancements
- **Real-time Updates**: WebSocket integration for live data
- **Custom Date Ranges**: Filter reports by specific periods
- **Advanced Analytics**: Trend analysis and forecasting
- **Email Reports**: Scheduled report delivery
- **Print Functionality**: Direct browser printing support

## Benefits
- **Comprehensive Overview**: All business metrics in one place
- **Decision Support**: Data-driven insights for inventory management
- **Export Flexibility**: Multiple formats for different use cases
- **Visual Analytics**: Easy-to-understand charts and graphs
- **Mobile Access**: Responsive design for on-the-go management
