# Bakery Inventory Management System

A web-based inventory management platform for bakeries, built with HTML, JavaScript, and Bootstrap.

## Features

### 1. Item Management
- Add, edit, and delete inventory items
- Categorize items (bread, pastry, cake, cookie)
- Set prices and shelf life
- Search and filter items
- Role-based access control (admin/employee)

### 2. Stock Management
- Opening stock entry
- Daily receiving stock entry
- FIFO-based stock deduction
- Good Return (GR) calculation
- Manual stock adjustment (admin only)

### 3. Sales Management
- Record sales with payment modes (Cash, Card, UPI)
- Automatic stock deduction
- Sales history tracking
- Sales details view and print

### 4. Reporting
- Sales reports
- Inventory reports
- Good Return (GR) reports
- Profit reports
- PDF export functionality

## Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd bakery-inventory
```

2. Open the project in a web server:
   - You can use any local web server
   - For example, using Python's built-in server:
     ```bash
     python -m http.server 8000
     ```
   - Or using Node.js's `http-server`:
     ```bash
     npx http-server
     ```

3. Access the application:
   - Open your web browser
   - Navigate to `http://localhost:8000` (or the port specified by your server)

## Usage Guide

### Item Management
1. Navigate to "Item Management"
2. Click "Add New Item" to create a new item
3. Fill in the item details:
   - Name
   - Category
   - Price
   - Shelf Life (in days)
4. Use the search and filter options to find items

### Stock Entry
1. Go to "Stock Entry"
2. Choose between "Opening Stock" or "Daily Receiving"
3. Select the item and enter quantity
4. Save the entry

### Sales Management
1. Access "Sales Management"
2. Select the item and quantity
3. Choose payment mode
4. Record the sale
5. View sales history and details

### Reports
1. Visit the "Reports" section
2. Select report type
3. Choose date range
4. Generate report
5. Print or download as PDF

## User Roles

### Admin
- Full access to all features
- Can delete records
- Can adjust stock manually
- Can generate all reports

### Employee
- Can view items and stock
- Can record sales
- Can make stock entries
- Limited report access

## Data Storage
- All data is stored in the browser's localStorage
- Regular backups are recommended
- Export functionality available for data backup

## Browser Support
- Chrome (recommended)
- Firefox
- Safari
- Edge

## Dependencies
- Bootstrap 5.3.0
- Bootstrap Icons 1.7.2
- jsPDF 2.5.1

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Support
For support, please open an issue in the repository or contact the development team. 