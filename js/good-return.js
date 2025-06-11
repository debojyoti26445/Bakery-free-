// Initialize variables
let items = JSON.parse(localStorage.getItem('items')) || [];
let openingStock = JSON.parse(localStorage.getItem('openingStock')) || [];
let receivingStock = JSON.parse(localStorage.getItem('receivingStock')) || [];
let sales = JSON.parse(localStorage.getItem('sales')) || [];

// DOM Elements
const grCalculatorForm = document.getElementById('grCalculatorForm');
const grDateInput = document.getElementById('grDate');
const grResults = document.getElementById('grResults');
const grDetailsModal = new bootstrap.Modal(document.getElementById('grDetailsModal'));
const grDetailsContent = document.getElementById('grDetailsContent');

// Set default date to today
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    grDateInput.value = today;
});

// Calculate GR for an item
function calculateGR(itemId, asOfDate) {
    const item = items.find(i => i.id === itemId);
    if (!item) return null;

    const asOfDateTime = new Date(asOfDate);
    asOfDateTime.setHours(23, 59, 59, 999);
    const shelfLifeDays = item.shelfLife;

    // Get all stock entries up to asOfDate, sorted by date
    const stockEntries = [
        ...openingStock.filter(s => s.itemId === itemId && new Date(s.date) <= asOfDateTime),
        ...receivingStock.filter(s => s.itemId === itemId && new Date(s.date) <= asOfDateTime)
    ].sort((a, b) => new Date(a.date) - new Date(b.date))
     .map(s => ({
         ...s,
         remaining: s.quantity, // Track remaining quantity for FIFO
         expiryDate: (() => {
             const d = new Date(s.date);
             d.setDate(d.getDate() + shelfLifeDays);
             return d;
         })()
     }));

    // Get all sales up to asOfDate, sorted by date
    const salesEntries = sales
        .filter(s => s.itemId === itemId && new Date(s.date) <= asOfDateTime)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Apply sales globally FIFO to all stock
    salesEntries.forEach(sale => {
        let qty = sale.quantity;
        for (let stock of stockEntries) {
            // Only apply sales to stock that hasn't expired at the time of sale
            if (qty > 0 && new Date(sale.date) > new Date(stock.date) && new Date(sale.date) <= stock.expiryDate && stock.remaining > 0) {
                const deduct = Math.min(qty, stock.remaining);
                stock.remaining -= deduct;
                qty -= deduct;
                if (qty === 0) break;
            }
        }
    });

    // Now, for each stock entry that has expired by asOfDate, the remaining is GR
    let totalGR = 0;
    let grDetails = [];
    for (let stock of stockEntries) {
        if (stock.expiryDate <= asOfDateTime && stock.remaining > 0) {
            totalGR += stock.remaining;
            grDetails.push({
                stockDate: stock.date,
                expiryDate: stock.expiryDate.toISOString().split('T')[0],
                originalQuantity: stock.quantity,
                soldQuantity: stock.quantity - stock.remaining,
                remainingQuantity: stock.remaining,
                type: stock.type || 'opening'
            });
        }
    }

    grDetails.sort((a, b) => new Date(b.expiryDate) - new Date(a.expiryDate));

    return {
        itemId,
        itemName: item.name,
        asOfDate,
        totalGR,
        details: grDetails
    };
}

// Display GR results for all items
function displayAllGRResults(grResultsData, asOfDate) {
    if (!grResultsData || grResultsData.length === 0) {
        grResults.innerHTML = `
            <div class="alert alert-info">
                No Good Return found for any item as of ${new Date(asOfDate).toLocaleDateString()}.
            </div>
        `;
        return;
    }
    let totalGR = grResultsData.reduce((sum, gr) => sum + gr.totalGR, 0);
    let html = `
        <div class="alert alert-success mb-3">
            <h6 class="mb-0">Good Return as of ${new Date(asOfDate).toLocaleDateString()}</h6>
            <h6 class="mb-0">Total Good Return: ${totalGR} units</h6>
        </div>
        <table class="table table-striped">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Stock Date</th>
                    <th>Expiry Date</th>
                    <th>Original Quantity</th>
                    <th>Sold Quantity</th>
                    <th>GR Quantity</th>
                    <th>Type</th>
                </tr>
            </thead>
            <tbody>
    `;
    grResultsData.forEach(grData => {
        grData.details.forEach(detail => {
            const stockDate = new Date(detail.stockDate);
            const expiryDate = new Date(detail.expiryDate);
            html += `
                <tr>
                    <td>${grData.itemName}</td>
                    <td>${stockDate.toLocaleDateString()}</td>
                    <td>${expiryDate.toLocaleDateString()}</td>
                    <td>${detail.originalQuantity}</td>
                    <td>${detail.soldQuantity}</td>
                    <td>${detail.remainingQuantity}</td>
                    <td>${detail.type === 'opening' ? 'Opening Stock' : 'Received Stock'}</td>
                </tr>
            `;
        });
    });
    html += `
            </tbody>
        </table>
    `;
    grResults.innerHTML = html;
}

// View GR details
function viewGRDetails(itemId, asOfDate) {
    const grData = calculateGR(itemId, asOfDate);
    if (!grData) return;

    const item = items.find(i => i.id === itemId);
    let html = `
        <h6 class="mb-3">${item.name} - GR Analysis as of ${new Date(asOfDate).toLocaleDateString()}</h6>
        <div class="table-responsive">
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>Stock Date</th>
                        <th>Expiry Date</th>
                        <th>Original Quantity</th>
                        <th>Sold Quantity</th>
                        <th>GR Quantity</th>
                        <th>Type</th>
                    </tr>
                </thead>
                <tbody>
    `;

    grData.details.forEach(detail => {
        const stockDate = new Date(detail.stockDate);
        const expiryDate = new Date(detail.expiryDate);
        
        html += `
            <tr>
                <td>${stockDate.toLocaleDateString()}</td>
                <td>${expiryDate.toLocaleDateString()}</td>
                <td>${detail.originalQuantity}</td>
                <td>${detail.soldQuantity}</td>
                <td>${detail.remainingQuantity}</td>
                <td>${detail.type === 'opening' ? 'Opening Stock' : 'Received Stock'}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    grDetailsContent.innerHTML = html;
    grDetailsModal.show();
}

// Print GR report
function printGRReport() {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Good Return Report</title>
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
                        <button onclick="window.print()" class="btn btn-primary">Print Report</button>
                    </div>
                    ${grResults.innerHTML}
                </div>
            </body>
        </html>
    `);
    printWindow.document.close();
}

// Print GR details
function printGRDetails() {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Good Return Details</title>
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
                        <button onclick="window.print()" class="btn btn-primary">Print Details</button>
                    </div>
                    ${grDetailsContent.innerHTML}
                </div>
            </body>
        </html>
    `);
    printWindow.document.close();
}

// Download GR as PDF
function downloadGRPDF() {
    const element = document.createElement('div');
    element.innerHTML = grResults.innerHTML;
    html2pdf().from(element).save('good-return-report.pdf');
}

// Add event listeners
grCalculatorForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const asOfDate = grDateInput.value;
    if (!asOfDate) {
        alert('Please select a date');
        return;
    }
    // Calculate GR for all items
    const grResultsData = items.map(item => calculateGR(item.id, asOfDate)).filter(gr => gr && gr.totalGR > 0);
    displayAllGRResults(grResultsData, asOfDate);
}); 