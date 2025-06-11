// Initialize variables
let items = JSON.parse(localStorage.getItem('items')) || [];
let openingStock = JSON.parse(localStorage.getItem('openingStock')) || [];
let receivingStock = JSON.parse(localStorage.getItem('receivingStock')) || [];
let sales = JSON.parse(localStorage.getItem('sales')) || [];
let stockAdjustments = JSON.parse(localStorage.getItem('stockAdjustments')) || [];

// DOM Elements
const reportForm = document.getElementById('reportForm');
const reportTypeSelect = document.getElementById('reportType');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const reportItemSelect = document.getElementById('reportItem');
const reportFormatSelect = document.getElementById('reportFormat');
const reportContent = document.getElementById('reportContent');
const reportDetailsModal = new bootstrap.Modal(document.getElementById('reportDetailsModal'));
const reportDetailsContent = document.getElementById('reportDetailsContent');

// Set default dates
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    startDateInput.value = firstDayOfMonth.toISOString().split('T')[0];
    endDateInput.value = today.toISOString().split('T')[0];
    
    loadItems();
    setupReportTypeListener();
});

// Load items into select dropdown
function loadItems() {
    reportItemSelect.innerHTML = '<option value="">All Items</option>';
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.name;
        reportItemSelect.appendChild(option);
    });
}

// Setup report type change listener
function setupReportTypeListener() {
    reportTypeSelect.addEventListener('change', () => {
        const reportType = reportTypeSelect.value;
        const reportForm = document.getElementById('reportForm');
        
        if (reportType === 'gr') {
            // Add GR report class to form
            reportForm.classList.add('gr-report');
            // Reset and disable end date
            endDateInput.value = startDateInput.value;
            endDateInput.disabled = true;
            // Update start date label
            startDateInput.previousElementSibling.textContent = 'Select Date';
            // Remove required attributes from unnecessary fields
            endDateInput.removeAttribute('required');
            reportItemSelect.removeAttribute('required');
            reportFormatSelect.removeAttribute('required');
        } else {
            // Remove GR report class
            reportForm.classList.remove('gr-report');
            // Enable end date
            endDateInput.disabled = false;
            // Reset start date label
            startDateInput.previousElementSibling.textContent = 'Start Date';
            // Add required attributes back
            endDateInput.setAttribute('required', '');
            reportItemSelect.setAttribute('required', '');
            reportFormatSelect.setAttribute('required', '');
        }
    });
}

// Generate report based on type and filters
function generateReport(type, startDate, endDate, itemId = '') {
    const startDateTime = new Date(startDate).getTime();
    const endDateTime = new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1); // End of day

    switch (type) {
        case 'sales':
            return generateSalesReport(startDateTime, endDateTime, itemId);
        case 'cash_sales':
            return generatePaymentTypeSalesReport(startDateTime, endDateTime, itemId, 'cash');
        case 'upi_sales':
            return generatePaymentTypeSalesReport(startDateTime, endDateTime, itemId, 'upi');
        case 'inventory':
            return generateInventoryReport(startDateTime, endDateTime, itemId);
        case 'gr':
            return generateGRReport(startDateTime, endDateTime);
        case 'profit':
            return generateProfitReport(startDateTime, endDateTime, itemId);
        case 'adjustment':
            return generateAdjustmentReport(startDateTime, endDateTime, itemId);
        default:
            return null;
    }
}

// Generate Sales Report
function generateSalesReport(startDateTime, endDateTime, itemId) {
    const filteredSales = sales.filter(sale => {
        const saleDate = new Date(sale.date).getTime();
        return saleDate >= startDateTime && 
               saleDate <= endDateTime && 
               (!itemId || sale.itemId === itemId);
    });

    const salesByItem = {};
    let totalRevenue = 0;
    let totalQuantity = 0;
    let totalCashSales = 0;
    let totalUpiSales = 0;

    filteredSales.forEach(sale => {
        const item = items.find(i => i.id === sale.itemId);
        if (!item) return;

        if (!salesByItem[sale.itemId]) {
            salesByItem[sale.itemId] = {
                name: item.name,
                quantity: 0,
                revenue: 0,
                cashSales: 0,
                upiSales: 0
            };
        }

        const saleAmount = sale.quantity * sale.price;
        salesByItem[sale.itemId].quantity += sale.quantity;
        salesByItem[sale.itemId].revenue += saleAmount;
        
        if (sale.paymentMode === 'cash') {
            salesByItem[sale.itemId].cashSales += saleAmount;
            totalCashSales += saleAmount;
        } else if (sale.paymentMode === 'upi') {
            salesByItem[sale.itemId].upiSales += saleAmount;
            totalUpiSales += saleAmount;
        }

        totalQuantity += sale.quantity;
        totalRevenue += saleAmount;
    });

    return {
        title: 'All Sales Report',
        headers: ['Item', 'Quantity Sold', 'Total Revenue', 'Cash Sales', 'UPI Sales'],
        data: Object.values(salesByItem).map(item => [
            item.name,
            item.quantity,
            `₹${item.revenue.toFixed(2)}`,
            `₹${item.cashSales.toFixed(2)}`,
            `₹${item.upiSales.toFixed(2)}`
        ]),
        summary: {
            'Total Quantity Sold': totalQuantity,
            'Total Revenue': `₹${totalRevenue.toFixed(2)}`,
            'Total Cash Sales': `₹${totalCashSales.toFixed(2)}`,
            'Total UPI Sales': `₹${totalUpiSales.toFixed(2)}`
        }
    };
}

// Generate Payment Type Sales Report (Cash or UPI)
function generatePaymentTypeSalesReport(startDateTime, endDateTime, itemId, paymentType) {
    const filteredSales = sales.filter(sale => {
        const saleDate = new Date(sale.date).getTime();
        return saleDate >= startDateTime && 
               saleDate <= endDateTime && 
               (!itemId || sale.itemId === itemId) &&
               sale.paymentMode === paymentType;
    });

    const salesByItem = {};
    let totalRevenue = 0;
    let totalQuantity = 0;

    filteredSales.forEach(sale => {
        const item = items.find(i => i.id === sale.itemId);
        if (!item) return;

        if (!salesByItem[sale.itemId]) {
            salesByItem[sale.itemId] = {
                name: item.name,
                quantity: 0,
                revenue: 0
            };
        }

        const saleAmount = sale.quantity * sale.price;
        salesByItem[sale.itemId].quantity += sale.quantity;
        salesByItem[sale.itemId].revenue += saleAmount;
        totalQuantity += sale.quantity;
        totalRevenue += saleAmount;
    });

    const reportTitle = paymentType === 'cash' ? 'Cash Sales Report' : 'UPI Sales Report';

    return {
        title: reportTitle,
        headers: ['Item', 'Quantity Sold', 'Revenue'],
        data: Object.values(salesByItem).map(item => [
            item.name,
            item.quantity,
            `₹${item.revenue.toFixed(2)}`
        ]),
        summary: {
            'Total Quantity Sold': totalQuantity,
            'Total Revenue': `₹${totalRevenue.toFixed(2)}`
        }
    };
}

// Generate Inventory Report
function generateInventoryReport(startDateTime, endDateTime, itemId) {
    const filteredItems = itemId ? items.filter(i => i.id === itemId) : items;
    const reportData = [];

    // Create a map of dates between start and end date
    const dateMap = new Map();
    let currentDate = new Date(startDateTime);
    while (currentDate <= new Date(endDateTime)) {
        dateMap.set(currentDate.toISOString().split('T')[0], {
            opening: 0,
            receiving: 0,
            sold: 0,
            adjusted: 0
        });
        currentDate.setDate(currentDate.getDate() + 1);
    }

    filteredItems.forEach(item => {
        // Get all dates for this item
        const itemDates = new Set();
        
        // Add opening stock dates
        openingStock
            .filter(s => s.itemId === item.id)
            .forEach(s => itemDates.add(s.date.split('T')[0]));
        
        // Add receiving stock dates
        receivingStock
            .filter(s => s.itemId === item.id)
            .forEach(s => itemDates.add(s.date.split('T')[0]));
        
        // Add sales dates
        sales
            .filter(s => s.itemId === item.id)
            .forEach(s => itemDates.add(s.date.split('T')[0]));

        // Sort dates
        const sortedDates = Array.from(itemDates).sort();

        // Process each date
        sortedDates.forEach(date => {
            const dateObj = new Date(date);
            if (dateObj >= new Date(startDateTime) && dateObj <= new Date(endDateTime)) {
                const dateStr = date.split('T')[0];
                const dayData = dateMap.get(dateStr);

                // Calculate opening stock for this date
                const openingQty = openingStock
                    .filter(s => s.itemId === item.id && s.date.split('T')[0] === dateStr)
                    .reduce((sum, s) => sum + s.quantity, 0);

                // Calculate receiving stock for this date
                const receivedQty = receivingStock
                    .filter(s => s.itemId === item.id && s.date.split('T')[0] === dateStr)
                    .reduce((sum, s) => sum + s.quantity, 0);

                // Calculate sales for this date
                const soldQty = sales
                    .filter(s => s.itemId === item.id && s.date.split('T')[0] === dateStr)
                    .reduce((sum, s) => sum + s.quantity, 0);

                // Calculate adjustments for this date
                const adjustedQty = stockAdjustments
                    .filter(a => a.itemId === item.id && a.date.split('T')[0] === dateStr)
                    .reduce((sum, a) => sum + (a.type === 'increase' ? a.quantity : -a.quantity), 0);

                dayData.opening += openingQty;
                dayData.receiving += receivedQty;
                dayData.sold += soldQty;
                dayData.adjusted += adjustedQty;
            }
        });
    });

    // Convert date map to report data
    for (const [date, data] of dateMap) {
        if (data.opening > 0 || data.receiving > 0 || data.sold > 0 || data.adjusted !== 0) {
            reportData.push([
                date,
                data.opening,
                data.receiving,
                data.sold,
                data.adjusted,
                data.opening + data.receiving - data.sold + data.adjusted
            ]);
        }
    }

    // Sort by date
    reportData.sort((a, b) => new Date(a[0]) - new Date(b[0]));

    return {
        title: 'Daily Inventory Report',
        headers: ['Date', 'Opening Stock', 'Received', 'Sold', 'Adjusted', 'Closing Stock'],
        data: reportData,
        summary: {
            'Total Days': reportData.length
        }
    };
}

// Generate Good Return Report
function generateGRReport(startDateTime, endDateTime) {
    const reportData = [];
    let totalItemsWithGR = 0;
    const dateWiseGR = new Map();

    // Process all items without any filtering
    items.forEach(item => {
        const stockEntries = [
            ...openingStock.filter(s => s.itemId === item.id),
            ...receivingStock.filter(s => s.itemId === item.id)
        ].sort((a, b) => new Date(a.date) - new Date(b.date));

        stockEntries.forEach(stock => {
            const stockDate = new Date(stock.date);
            const expiryDate = new Date(stockDate.getTime() + (item.shelfLife * 24 * 60 * 60 * 1000));
            
            // Only consider items expiring on the selected date
            if (expiryDate.toISOString().split('T')[0] === new Date(startDateTime).toISOString().split('T')[0]) {
                const soldQuantity = sales
                    .filter(s => s.itemId === item.id && 
                           new Date(s.date) > stockDate && 
                           new Date(s.date) <= expiryDate)
                    .reduce((sum, s) => sum + s.quantity, 0);

                const remainingQuantity = stock.quantity - soldQuantity;
                if (remainingQuantity > 0) {
                    totalItemsWithGR++;
                    const expiryDateStr = expiryDate.toISOString().split('T')[0];
                    
                    if (!dateWiseGR.has(expiryDateStr)) {
                        dateWiseGR.set(expiryDateStr, {
                            items: [],
                            totalGR: 0,
                            totalEntries: 0
                        });
                    }
                    
                    const dateData = dateWiseGR.get(expiryDateStr);
                    dateData.items.push({
                        name: item.name,
                        quantity: remainingQuantity,
                        shelfLife: item.shelfLife,
                        type: stock.type || 'opening',
                        stockDate: stock.date
                    });
                    dateData.totalGR += remainingQuantity;
                    dateData.totalEntries++;
                }
            }
        });
    });

    // Convert date-wise data to report format
    for (const [date, data] of dateWiseGR) {
        // Sort items by name within each date
        data.items.sort((a, b) => a.name.localeCompare(b.name));
        
        // Add each item for this date
        data.items.forEach(item => {
            reportData.push([
                date,
                item.name,
                item.quantity,
                `${item.shelfLife} days`,
                item.type,
                new Date(item.stockDate).toLocaleDateString()
            ]);
        });
    }

    return {
        title: `Good Return Report for ${new Date(startDateTime).toLocaleDateString()}`,
        headers: ['Expiry Date', 'Item', 'GR Quantity', 'Shelf Life', 'Stock Type', 'Stock Date'],
        data: reportData,
        summary: {
            'Total Items with GR': totalItemsWithGR,
            'Total GR Entries': reportData.length,
            'Total GR Quantity': reportData.reduce((sum, row) => sum + row[2], 0)
        }
    };
}

// Generate Profit Report
function generateProfitReport(startDateTime, endDateTime, itemId) {
    const filteredSales = sales.filter(sale => {
        const saleDate = new Date(sale.date).getTime();
        return saleDate >= startDateTime && 
               saleDate <= endDateTime && 
               (!itemId || sale.itemId === itemId);
    });

    const profitByItem = {};
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;

    filteredSales.forEach(sale => {
        const item = items.find(i => i.id === sale.itemId);
        if (!item) return;

        if (!profitByItem[sale.itemId]) {
            profitByItem[sale.itemId] = {
                name: item.name,
                quantity: 0,
                revenue: 0,
                cost: 0,
                profit: 0
            };
        }

        const revenue = sale.quantity * item.sellingPrice;
        const cost = sale.quantity * item.costPrice;
        const profit = revenue - cost;

        profitByItem[sale.itemId].quantity += sale.quantity;
        profitByItem[sale.itemId].revenue += revenue;
        profitByItem[sale.itemId].cost += cost;
        profitByItem[sale.itemId].profit += profit;

        totalRevenue += revenue;
        totalCost += cost;
        totalProfit += profit;
    });

    return {
        title: 'Profit Report',
        headers: ['Item', 'Quantity', 'Revenue', 'Cost', 'Profit', 'Margin'],
        data: Object.values(profitByItem).map(item => [
            item.name,
            item.quantity,
            `₹${item.revenue.toFixed(2)}`,
            `₹${item.cost.toFixed(2)}`,
            `₹${item.profit.toFixed(2)}`,
            `${((item.profit / item.revenue) * 100).toFixed(2)}%`
        ]),
        summary: {
            'Total Revenue': `₹${totalRevenue.toFixed(2)}`,
            'Total Cost': `₹${totalCost.toFixed(2)}`,
            'Total Profit': `₹${totalProfit.toFixed(2)}`,
            'Overall Margin': `${((totalProfit / totalRevenue) * 100).toFixed(2)}%`
        }
    };
}

// Generate Stock Adjustment Report
function generateAdjustmentReport(startDateTime, endDateTime, itemId) {
    const filteredAdjustments = stockAdjustments.filter(adjustment => {
        const adjustmentDate = new Date(adjustment.date).getTime();
        return adjustmentDate >= startDateTime && 
               adjustmentDate <= endDateTime && 
               (!itemId || adjustment.itemId === itemId);
    });

    const reportData = filteredAdjustments.map(adjustment => {
        const item = items.find(i => i.id === adjustment.itemId);
        return [
            new Date(adjustment.date).toLocaleDateString(),
            item ? item.name : 'Unknown Item',
            adjustment.type === 'increase' ? 'Increase' : 'Decrease',
            adjustment.quantity,
            adjustment.reason,
            adjustment.notes || '-'
        ];
    });

    const summary = {
        'Total Adjustments': filteredAdjustments.length,
        'Increases': filteredAdjustments.filter(a => a.type === 'increase').length,
        'Decreases': filteredAdjustments.filter(a => a.type === 'decrease').length
    };

    return {
        title: 'Stock Adjustment Report',
        headers: ['Date', 'Item', 'Type', 'Quantity', 'Reason', 'Notes'],
        data: reportData,
        summary: summary
    };
}

// Display report in the preview area
function displayReport(report) {
    if (!report) return;

    let html = `
        <h4 class="mb-3">${report.title}</h4>
        <div class="table-responsive">
            <table class="table table-striped table-hover">
                <thead>
                    <tr>
                        ${report.headers.map(header => `<th>${header}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
    `;

    if (report.data.length === 0) {
        html += `
            <tr>
                <td colspan="${report.headers.length}" class="text-center">
                    No data available for the selected criteria
                </td>
            </tr>
        `;
    } else {
        report.data.forEach(row => {
            html += `
                <tr>
                    ${row.map(cell => `<td>${cell}</td>`).join('')}
                </tr>
            `;
        });
    }

    html += `
                </tbody>
            </table>
        </div>
        <div class="mt-3">
            <h5>Summary</h5>
            <div class="row">
    `;

    for (const [key, value] of Object.entries(report.summary)) {
        html += `
            <div class="col-md-4 mb-2">
                <strong>${key}:</strong> ${value}
            </div>
        `;
    }

    html += `
            </div>
        </div>
    `;

    reportContent.innerHTML = html;
}

// Print report
function printReport() {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>${reportTypeSelect.options[reportTypeSelect.selectedIndex].text}</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                <style>
                    body { padding: 20px; }
                    @media print {
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="text-end mb-3 no-print">
                        <button onclick="window.print()" class="btn btn-primary">Print</button>
                    </div>
                    ${reportContent.innerHTML}
                </div>
            </body>
        </html>
    `);
    printWindow.document.close();
}

// Download PDF
function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const reportType = reportTypeSelect.options[reportTypeSelect.selectedIndex].text;
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    
    // Add title
    doc.setFontSize(16);
    doc.text(reportType, 20, 20);
    
    // Add date range
    doc.setFontSize(12);
    doc.text(`Period: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`, 20, 30);

    // Add content
    const report = generateReport(
        reportTypeSelect.value,
        startDate,
        endDate,
        reportItemSelect.value
    );

    if (report) {
        // Add table
        doc.autoTable({
            head: [report.headers],
            body: report.data,
            startY: 40
        });

        // Add summary
        const summaryY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.text('Summary', 20, summaryY);
        
        let y = summaryY + 10;
        Object.entries(report.summary).forEach(([key, value]) => {
            doc.text(`${key}: ${value}`, 20, y);
            y += 7;
        });
    }

    // Save the PDF
    doc.save(`${reportType.replace(/\s+/g, '_')}_${startDate}_to_${endDate}.pdf`);
}

// Export to Excel
function exportToExcel() {
    const report = generateReport(
        reportTypeSelect.value,
        startDateInput.value,
        endDateInput.value,
        reportItemSelect.value
    );

    if (!report) {
        alert('No data available to export');
        return;
    }

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet([
        [report.title],
        [''],
        report.headers,
        ...report.data,
        [''],
        ['Summary'],
        ...Object.entries(report.summary).map(([key, value]) => [key, value])
    ]);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');

    // Generate Excel file
    XLSX.writeFile(wb, `${report.title.replace(/\s+/g, '_')}_${startDateInput.value}_to_${endDateInput.value}.xlsx`);
}

// Form submission handler
reportForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const reportType = reportTypeSelect.value;
    const startDate = startDateInput.value;
    
    // Validate form based on report type
    if (!startDate) {
        alert('Please select a date');
        return;
    }
    
    if (reportType === 'gr') {
        // For GR reports, use the same date for start and end
        const report = generateReport(reportType, startDate, startDate, '');
        if (report) {
            displayReport(report);
        }
    } else {
        // For other reports, validate end date and item
        const endDate = endDateInput.value;
        const itemId = reportItemSelect.value;
        
        if (!endDate) {
            alert('Please select an end date');
            return;
        }
        
        const report = generateReport(reportType, startDate, endDate, itemId);
        if (report) {
            displayReport(report);
        }
    }

    if (reportFormatSelect.value === 'pdf') {
        downloadPDF();
    }
}); 