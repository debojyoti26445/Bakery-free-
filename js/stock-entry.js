// Stock Entry JavaScript

// Initialize variables
let items = JSON.parse(localStorage.getItem('items')) || [];
let openingStock = JSON.parse(localStorage.getItem('openingStock')) || [];
let receivingStock = JSON.parse(localStorage.getItem('receivingStock')) || [];

// DOM Elements
const openingStockForm = document.getElementById('openingStockForm');
const receivingStockForm = document.getElementById('receivingStockForm');
const openingStockTableBody = document.getElementById('openingStockTableBody');
const receivingStockTableBody = document.getElementById('receivingStockTableBody');
const openingItemSelect = document.getElementById('openingItem');
const receivingItemSelect = document.getElementById('receivingItem');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadItems();
    loadStockRecords();
    setupEventListeners();
});

function setupEventListeners() {
    // Opening stock form submission
    openingStockForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addOpeningStock();
    });

    // Receiving stock form submission
    receivingStockForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addReceivingStock();
    });

    // Set default dates to today
    document.getElementById('openingDate').valueAsDate = new Date();
    document.getElementById('receivingDate').valueAsDate = new Date();
}

// Load items into select dropdowns
function loadItems() {
    const itemOptions = items.map(item => 
        `<option value="${item.id}">${item.name} (${item.category})</option>`
    ).join('');

    openingItemSelect.innerHTML = '<option value="">Choose an item...</option>' + itemOptions;
    receivingItemSelect.innerHTML = '<option value="">Choose an item...</option>' + itemOptions;
}

// Load stock records
function loadStockRecords() {
    displayOpeningStock();
    displayReceivingStock();
}

// Save stock records to localStorage
function saveStockRecords() {
    localStorage.setItem('openingStock', JSON.stringify(openingStock));
    localStorage.setItem('receivingStock', JSON.stringify(receivingStock));
}

// Display opening stock records
function displayOpeningStock() {
    openingStockTableBody.innerHTML = '';
    
    // Sort opening stock by date (newest first)
    const sortedOpeningStock = [...openingStock].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedOpeningStock.forEach(record => {
        const item = items.find(i => i.id === record.itemId);
        if (!item) return;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${record.quantity}</td>
            <td>${new Date(record.date).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteOpeningStock('${record.id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        openingStockTableBody.appendChild(row);
    });
}

// Display receiving stock records
function displayReceivingStock() {
    receivingStockTableBody.innerHTML = '';
    
    // Sort receiving stock by date (newest first)
    const sortedReceivingStock = [...receivingStock].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedReceivingStock.forEach(record => {
        const item = items.find(i => i.id === record.itemId);
        if (!item) return;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${record.quantity}</td>
            <td>${new Date(record.date).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteReceivingStock('${record.id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        receivingStockTableBody.appendChild(row);
    });
}

// Add opening stock
function addOpeningStock() {
    const itemId = openingItemSelect.value;
    const quantity = parseInt(document.getElementById('openingQuantity').value);
    const date = document.getElementById('openingDate').value;

    if (!itemId || isNaN(quantity) || !date) {
        alert('Please fill in all fields correctly');
        return;
    }

    // Check if opening stock already exists for this item on the same date
    const existingRecord = openingStock.find(record => 
        record.itemId === itemId && 
        new Date(record.date).toDateString() === new Date(date).toDateString()
    );

    if (existingRecord) {
        if (!confirm('Opening stock already exists for this item on this date. Do you want to update it?')) {
            return;
        }
        existingRecord.quantity = quantity;
    } else {
        // Check if there's a more recent entry
        const moreRecentEntry = openingStock.find(record => 
            record.itemId === itemId && 
            new Date(record.date) > new Date(date)
        );

        if (moreRecentEntry) {
            if (!confirm('There is a more recent opening stock entry for this item. Adding this entry will not affect the current stock. Do you want to continue?')) {
                return;
            }
        }

        const newRecord = {
            id: Date.now().toString(),
            itemId,
            quantity,
            date
        };
        openingStock.push(newRecord);
    }

    saveStockRecords();
    displayOpeningStock();
    openingStockForm.reset();
    document.getElementById('openingDate').valueAsDate = new Date();
}

// Add receiving stock
function addReceivingStock() {
    const itemId = receivingItemSelect.value;
    const quantity = parseInt(document.getElementById('receivingQuantity').value);
    const date = document.getElementById('receivingDate').value;

    if (!itemId || isNaN(quantity) || !date) {
        alert('Please fill in all fields correctly');
        return;
    }

    const newRecord = {
        id: Date.now().toString(),
        itemId,
        quantity,
        date
    };

    receivingStock.push(newRecord);
    saveStockRecords();
    displayReceivingStock();
    receivingStockForm.reset();
    document.getElementById('receivingDate').valueAsDate = new Date();
}

// Delete opening stock record
function deleteOpeningStock(id) {
    if (confirm('Are you sure you want to delete this opening stock record?')) {
        openingStock = openingStock.filter(record => record.id !== id);
        saveStockRecords();
        displayOpeningStock();
    }
}

// Delete receiving stock record
function deleteReceivingStock(id) {
    if (confirm('Are you sure you want to delete this receiving stock record?')) {
        receivingStock = receivingStock.filter(record => record.id !== id);
        saveStockRecords();
        displayReceivingStock();
    }
}

// Calculate total stock for an item
function calculateTotalStock(itemId) {
    // Get the most recent opening stock entry
    const openingRecord = openingStock
        .filter(record => record.itemId === itemId)
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    
    const openingQuantity = openingRecord ? openingRecord.quantity : 0;

    const receivingQuantity = receivingStock
        .filter(record => record.itemId === itemId)
        .reduce((sum, record) => sum + record.quantity, 0);

    return openingQuantity + receivingQuantity;
}

// Export stock records
function exportStockRecords() {
    const data = {
        openingStock,
        receivingStock
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'bakery-stock-records.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Import stock records
function importStockRecords(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.openingStock && data.receivingStock) {
                openingStock = data.openingStock;
                receivingStock = data.receivingStock;
                saveStockRecords();
                displayOpeningStock();
                displayReceivingStock();
                alert('Stock records imported successfully');
            } else {
                throw new Error('Invalid data format');
            }
        } catch (error) {
            alert('Error importing stock records: ' + error.message);
        }
    };
    reader.readAsText(file);
} 