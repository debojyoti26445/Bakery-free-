// Sales Management JavaScript

// Initialize variables
let items = JSON.parse(localStorage.getItem('items')) || [];
let openingStock = JSON.parse(localStorage.getItem('openingStock')) || [];
let receivingStock = JSON.parse(localStorage.getItem('receivingStock')) || [];
let sales = JSON.parse(localStorage.getItem('sales')) || [];

// DOM Elements
const saleForm = document.getElementById('saleForm');
const salesTableBody = document.getElementById('salesTableBody');
const saleItemSelect = document.getElementById('saleItem');
const dateFilter = document.getElementById('dateFilter');
const saleTimeInput = document.getElementById('saleTime');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadItems();
    loadSales();
    setupEventListeners();
    setDefaultTime();
});

function setupEventListeners() {
    // Sale form submission
    saleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        recordSale();
    });

    // Set default date filter to today
    dateFilter.valueAsDate = new Date();
}

// Set default time to current time
function setDefaultTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    saleTimeInput.value = `${hours}:${minutes}`;
}

// Load items into select dropdown
function loadItems() {
    const itemOptions = items.map(item => {
        const totalStock = calculateTotalStock(item.id);
        return `<option value="${item.id}" ${totalStock <= 0 ? 'disabled' : ''}>
            ${item.name} (${item.category}) - Available: ${totalStock}
        </option>`;
    }).join('');

    saleItemSelect.innerHTML = '<option value="">Choose an item...</option>' + itemOptions;
}

// Load sales records
function loadSales() {
    displaySales(sales);
}

// Save sales to localStorage
function saveSales() {
    localStorage.setItem('sales', JSON.stringify(sales));
}

// Display sales records
function displaySales(salesToDisplay) {
    salesTableBody.innerHTML = '';
    
    salesToDisplay.forEach(sale => {
        const item = items.find(i => i.id === sale.itemId);
        if (!item) return;

        const saleDateTime = new Date(sale.date);
        const formattedDateTime = `${saleDateTime.toLocaleDateString()} ${saleDateTime.toLocaleTimeString()}`;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formattedDateTime}</td>
            <td>${item.name}</td>
            <td>${sale.quantity}</td>
            <td>₹${(sale.quantity * sale.price).toFixed(2)}</td>
            <td>${sale.paymentMode.toUpperCase()}</td>
            <td>
                <button class="btn btn-sm btn-info me-2" onclick="viewSaleDetails('${sale.id}')">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteSale('${sale.id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        salesTableBody.appendChild(row);
    });
}

// Record new sale
function recordSale() {
    const itemId = saleItemSelect.value;
    const quantity = parseInt(document.getElementById('saleQuantity').value);
    const paymentMode = document.getElementById('paymentMode').value;
    const saleTime = document.getElementById('saleTime').value;

    if (!itemId || isNaN(quantity) || !paymentMode || !saleTime) {
        alert('Please fill in all fields correctly');
        return;
    }

    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // Check if enough stock is available
    const totalStock = calculateTotalStock(itemId);
    if (quantity > totalStock) {
        alert('Not enough stock available');
        return;
    }

    // Create date with time
    const [hours, minutes] = saleTime.split(':');
    const saleDate = new Date();
    saleDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Deduct stock using FIFO method
    if (!deductStock(itemId, quantity)) {
        alert('Error processing stock deduction');
        return;
    }

    // Record the sale
    const newSale = {
        id: Date.now().toString(),
        itemId,
        quantity,
        paymentMode,
        date: saleDate.toISOString(),
        price: item.price
    };

    sales.push(newSale);
    saveSales();
    displaySales(sales);
    loadItems(); // Refresh item list to update available quantities

    // Reset form
    saleForm.reset();
    setDefaultTime();
}

// Deduct stock using FIFO method
function deductStock(itemId, quantity) {
    let remainingQuantity = quantity;
    const stockToDeduct = [];

    // First, try to deduct from opening stock
    const openingRecord = openingStock.find(record => record.itemId === itemId);
    if (openingRecord && openingRecord.quantity > 0) {
        const deductFromOpening = Math.min(openingRecord.quantity, remainingQuantity);
        openingRecord.quantity -= deductFromOpening;
        remainingQuantity -= deductFromOpening;
        stockToDeduct.push({
            type: 'opening',
            quantity: deductFromOpening,
            date: openingRecord.date
        });
    }

    // Then, deduct from receiving stock in chronological order
    if (remainingQuantity > 0) {
        const receivingRecords = receivingStock
            .filter(record => record.itemId === itemId)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        for (const record of receivingRecords) {
            if (remainingQuantity <= 0) break;

            const deductFromReceiving = Math.min(record.quantity, remainingQuantity);
            record.quantity -= deductFromReceiving;
            remainingQuantity -= deductFromReceiving;
            stockToDeduct.push({
                type: 'receiving',
                quantity: deductFromReceiving,
                date: record.date
            });
        }
    }

    // If we couldn't deduct all the required quantity, revert changes
    if (remainingQuantity > 0) {
        // Revert changes
        for (const deduction of stockToDeduct) {
            if (deduction.type === 'opening') {
                const openingRecord = openingStock.find(record => record.itemId === itemId);
                if (openingRecord) {
                    openingRecord.quantity += deduction.quantity;
                }
            } else {
                const receivingRecord = receivingStock.find(record => 
                    record.itemId === itemId && record.date === deduction.date
                );
                if (receivingRecord) {
                    receivingRecord.quantity += deduction.quantity;
                }
            }
        }
        return false;
    }

    // Save the updated stock records
    localStorage.setItem('openingStock', JSON.stringify(openingStock));
    localStorage.setItem('receivingStock', JSON.stringify(receivingStock));
    return true;
}

// Delete sale
function deleteSale(id) {
    if (confirm('Are you sure you want to delete this sale record?')) {
        const sale = sales.find(s => s.id === id);
        if (sale) {
            // Restore the stock
            const itemId = sale.itemId;
            const quantity = sale.quantity;

            // Add back to receiving stock
            const receivingRecord = receivingStock.find(record => record.itemId === itemId);
            if (receivingRecord) {
                receivingRecord.quantity += quantity;
            } else {
                // If no receiving record exists, add to opening stock
                const openingRecord = openingStock.find(record => record.itemId === itemId);
                if (openingRecord) {
                    openingRecord.quantity += quantity;
                }
            }

            // Save updated stock records
            localStorage.setItem('openingStock', JSON.stringify(openingStock));
            localStorage.setItem('receivingStock', JSON.stringify(receivingStock));
        }

        // Remove the sale record
        sales = sales.filter(s => s.id !== id);
        saveSales();
        displaySales(sales);
        loadItems(); // Refresh item list to update available quantities
    }
}

// View sale details
function viewSaleDetails(id) {
    const sale = sales.find(s => s.id === id);
    if (!sale) return;

    const item = items.find(i => i.id === sale.itemId);
    if (!item) return;

    const saleDateTime = new Date(sale.date);
    const formattedDateTime = `${saleDateTime.toLocaleDateString()} ${saleDateTime.toLocaleTimeString()}`;

    const details = `
        <div class="mb-3">
            <h6>Sale Information</h6>
            <p><strong>Date & Time:</strong> ${formattedDateTime}</p>
            <p><strong>Item:</strong> ${item.name}</p>
            <p><strong>Quantity:</strong> ${sale.quantity}</p>
            <p><strong>Price per unit:</strong> ₹${sale.price.toFixed(2)}</p>
            <p><strong>Total Amount:</strong> ₹${(sale.quantity * sale.price).toFixed(2)}</p>
            <p><strong>Payment Mode:</strong> ${sale.paymentMode.toUpperCase()}</p>
        </div>
    `;

    document.getElementById('saleDetailsContent').innerHTML = details;
    const modal = new bootstrap.Modal(document.getElementById('saleDetailsModal'));
    modal.show();
}

// Print sale details
function printSaleDetails() {
    const content = document.getElementById('saleDetailsContent').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Sale Details</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            </head>
            <body>
                <div class="container mt-4">
                    ${content}
                </div>
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Filter sales by date
function filterSalesByDate() {
    const selectedDate = dateFilter.value;
    if (!selectedDate) {
        displaySales(sales);
        return;
    }

    const startOfDay = new Date(selectedDate);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const filteredSales = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= startOfDay && saleDate <= endOfDay;
    });

    displaySales(filteredSales);
}

// Calculate total stock for an item
function calculateTotalStock(itemId) {
    const openingRecord = openingStock.find(record => record.itemId === itemId);
    const openingQuantity = openingRecord ? openingRecord.quantity : 0;

    const receivingQuantity = receivingStock
        .filter(record => record.itemId === itemId)
        .reduce((sum, record) => sum + record.quantity, 0);

    return openingQuantity + receivingQuantity;
}

// Export sales records
function exportSales() {
    const dataStr = JSON.stringify(sales, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'bakery-sales.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Import sales records
function importSales(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedSales = JSON.parse(e.target.result);
            if (Array.isArray(importedSales)) {
                sales = importedSales;
                saveSales();
                displaySales(sales);
                alert('Sales records imported successfully');
            } else {
                throw new Error('Invalid data format');
            }
        } catch (error) {
            alert('Error importing sales records: ' + error.message);
        }
    };
    reader.readAsText(file);
} 