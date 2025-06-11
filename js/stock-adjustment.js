// Initialize variables
let items = JSON.parse(localStorage.getItem('items')) || [];
let openingStock = JSON.parse(localStorage.getItem('openingStock')) || [];
let receivingStock = JSON.parse(localStorage.getItem('receivingStock')) || [];
let stockAdjustments = JSON.parse(localStorage.getItem('stockAdjustments')) || [];

// DOM Elements
const stockAdjustmentForm = document.getElementById('stockAdjustmentForm');
const adjustmentItemSelect = document.getElementById('adjustmentItem');
const adjustmentTypeSelect = document.getElementById('adjustmentType');
const adjustmentQuantityInput = document.getElementById('adjustmentQuantity');
const adjustmentReasonSelect = document.getElementById('adjustmentReason');
const adjustmentNotesInput = document.getElementById('adjustmentNotes');
const adjustmentHistory = document.getElementById('adjustmentHistory');
const adjustmentDetailsModal = new bootstrap.Modal(document.getElementById('adjustmentDetailsModal'));
const adjustmentDetailsContent = document.getElementById('adjustmentDetailsContent');

// Load items into select dropdown
function loadItems() {
    adjustmentItemSelect.innerHTML = '<option value="">Choose an item...</option>';
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.name;
        adjustmentItemSelect.appendChild(option);
    });
}

// Calculate current stock for an item
function calculateCurrentStock(itemId) {
    const openingStockQty = openingStock
        .filter(s => s.itemId === itemId)
        .reduce((sum, s) => sum + s.quantity, 0);

    const receivedStockQty = receivingStock
        .filter(s => s.itemId === itemId)
        .reduce((sum, s) => sum + s.quantity, 0);

    const adjustmentsQty = stockAdjustments
        .filter(a => a.itemId === itemId)
        .reduce((sum, a) => sum + (a.type === 'increase' ? a.quantity : -a.quantity), 0);

    return openingStockQty + receivedStockQty + adjustmentsQty;
}

// Record stock adjustment
function recordAdjustment(adjustment) {
    // Validate stock availability for decrease
    if (adjustment.type === 'decrease') {
        const currentStock = calculateCurrentStock(adjustment.itemId);
        if (currentStock < adjustment.quantity) {
            alert('Insufficient stock for adjustment');
            return false;
        }
    }

    // Add adjustment to history
    stockAdjustments.push(adjustment);
    localStorage.setItem('stockAdjustments', JSON.stringify(stockAdjustments));
    return true;
}

// Display adjustment history
function displayAdjustmentHistory() {
    adjustmentHistory.innerHTML = '';
    
    if (stockAdjustments.length === 0) {
        adjustmentHistory.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">No adjustments recorded</td>
            </tr>
        `;
        return;
    }

    stockAdjustments.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(adjustment => {
        const item = items.find(i => i.id === adjustment.itemId);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(adjustment.date).toLocaleDateString()}</td>
            <td>${item ? item.name : 'Unknown Item'}</td>
            <td>
                <span class="badge ${adjustment.type === 'increase' ? 'bg-success' : 'bg-danger'}">
                    ${adjustment.type === 'increase' ? 'Increase' : 'Decrease'}
                </span>
            </td>
            <td>${adjustment.quantity}</td>
            <td>${adjustment.reason}</td>
            <td>${adjustment.notes || '-'}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="viewAdjustmentDetails('${adjustment.id}')">
                    <i class="bi bi-eye"></i>
                </button>
            </td>
        `;
        adjustmentHistory.appendChild(row);
    });
}

// View adjustment details
function viewAdjustmentDetails(adjustmentId) {
    const adjustment = stockAdjustments.find(a => a.id === adjustmentId);
    if (!adjustment) return;

    const item = items.find(i => i.id === adjustment.itemId);
    const currentStock = calculateCurrentStock(adjustment.itemId);

    let html = `
        <div class="mb-3">
            <h6>Adjustment Details</h6>
            <p><strong>Date:</strong> ${new Date(adjustment.date).toLocaleDateString()}</p>
            <p><strong>Item:</strong> ${item ? item.name : 'Unknown Item'}</p>
            <p><strong>Type:</strong> ${adjustment.type === 'increase' ? 'Stock Increase' : 'Stock Decrease'}</p>
            <p><strong>Quantity:</strong> ${adjustment.quantity}</p>
            <p><strong>Reason:</strong> ${adjustment.reason}</p>
            <p><strong>Notes:</strong> ${adjustment.notes || 'No additional notes'}</p>
        </div>
        <div class="mb-3">
            <h6>Stock Information</h6>
            <p><strong>Current Stock:</strong> ${currentStock}</p>
        </div>
    `;

    adjustmentDetailsContent.innerHTML = html;
    adjustmentDetailsModal.show();
}

// Print adjustment report
function printAdjustmentReport() {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Stock Adjustment Report</title>
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
                    <h4 class="mb-4">Stock Adjustment Report</h4>
                    <div class="table-responsive">
                        ${document.querySelector('.table-responsive').innerHTML}
                    </div>
                </div>
            </body>
        </html>
    `);
    printWindow.document.close();
}

// Print adjustment details
function printAdjustmentDetails() {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Adjustment Details</title>
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
                    ${adjustmentDetailsContent.innerHTML}
                </div>
            </body>
        </html>
    `);
    printWindow.document.close();
}

// Download adjustment report as PDF
function downloadAdjustmentPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text('Stock Adjustment Report', 20, 20);
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);

    // Add table
    const tableData = stockAdjustments
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(adjustment => {
            const item = items.find(i => i.id === adjustment.itemId);
            return [
                new Date(adjustment.date).toLocaleDateString(),
                item ? item.name : 'Unknown Item',
                adjustment.type === 'increase' ? 'Increase' : 'Decrease',
                adjustment.quantity.toString(),
                adjustment.reason,
                adjustment.notes || '-'
            ];
        });

    doc.autoTable({
        head: [['Date', 'Item', 'Type', 'Quantity', 'Reason', 'Notes']],
        body: tableData,
        startY: 40
    });

    // Save the PDF
    doc.save('Stock_Adjustment_Report.pdf');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadItems();
    displayAdjustmentHistory();
});

stockAdjustmentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const itemId = adjustmentItemSelect.value;
    const type = adjustmentTypeSelect.value;
    const quantity = parseInt(adjustmentQuantityInput.value);
    const reason = adjustmentReasonSelect.value;
    const notes = adjustmentNotesInput.value;

    if (!itemId || !type || !quantity || !reason) {
        alert('Please fill in all required fields');
        return;
    }

    const adjustment = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        itemId,
        type,
        quantity,
        reason,
        notes
    };

    if (recordAdjustment(adjustment)) {
        displayAdjustmentHistory();
        stockAdjustmentForm.reset();
        alert('Stock adjustment recorded successfully');
    }
}); 