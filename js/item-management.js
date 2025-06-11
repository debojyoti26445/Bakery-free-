// Item Management JavaScript

// Initialize variables
let items = JSON.parse(localStorage.getItem('items')) || [];
let openingStock = JSON.parse(localStorage.getItem('openingStock')) || [];
let receivingStock = JSON.parse(localStorage.getItem('receivingStock')) || [];
const itemsTableBody = document.getElementById('itemsTableBody');
const searchItems = document.getElementById('searchItems');
const categoryFilter = document.getElementById('categoryFilter');
const sortBy = document.getElementById('sortBy');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadItems();
    setupEventListeners();
});

function setupEventListeners() {
    // Add item
    document.getElementById('saveItem').addEventListener('click', addItem);
    
    // Update item
    document.getElementById('updateItem').addEventListener('click', updateItem);
    
    // Search and filter
    searchItems.addEventListener('input', filterItems);
    categoryFilter.addEventListener('change', filterItems);
    sortBy.addEventListener('change', filterItems);
}

// Load items from localStorage
function loadItems() {
    items = JSON.parse(localStorage.getItem('items')) || [];
    displayItems(items);
}

// Save items to localStorage
function saveItems() {
    localStorage.setItem('items', JSON.stringify(items));
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

// Display items in the table
function displayItems(itemsToDisplay) {
    itemsTableBody.innerHTML = '';
    
    itemsToDisplay.forEach(item => {
        const totalStock = calculateTotalStock(item.id);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td>${item.shelfLife}</td>
            <td>${totalStock}</td>
            <td>
                <button class="btn btn-sm btn-primary me-2" onclick="editItem('${item.id}')">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteItem('${item.id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        itemsTableBody.appendChild(row);
    });
}

// Add new item
function addItem() {
    const name = document.getElementById('itemName').value;
    const category = document.getElementById('itemCategory').value;
    const price = parseFloat(document.getElementById('itemPrice').value);
    const shelfLife = parseInt(document.getElementById('shelfLife').value);
    
    if (!name || !category || isNaN(price) || isNaN(shelfLife)) {
        alert('Please fill in all fields correctly');
        return;
    }
    
    const newItem = {
        id: Date.now().toString(),
        name,
        category,
        price,
        shelfLife
    };
    
    items.push(newItem);
    saveItems();
    displayItems(items);
    
    // Close modal and reset form
    const modal = bootstrap.Modal.getInstance(document.getElementById('addItemModal'));
    modal.hide();
    document.getElementById('addItemForm').reset();
}

// Edit item
function editItem(id) {
    const item = items.find(item => item.id === id);
    if (!item) return;
    
    document.getElementById('editItemId').value = item.id;
    document.getElementById('editItemName').value = item.name;
    document.getElementById('editItemCategory').value = item.category;
    document.getElementById('editItemPrice').value = item.price;
    document.getElementById('editShelfLife').value = item.shelfLife;
    
    const modal = new bootstrap.Modal(document.getElementById('editItemModal'));
    modal.show();
}

// Update item
function updateItem() {
    const id = document.getElementById('editItemId').value;
    const name = document.getElementById('editItemName').value;
    const category = document.getElementById('editItemCategory').value;
    const price = parseFloat(document.getElementById('editItemPrice').value);
    const shelfLife = parseInt(document.getElementById('editShelfLife').value);
    
    if (!name || !category || isNaN(price) || isNaN(shelfLife)) {
        alert('Please fill in all fields correctly');
        return;
    }
    
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return;
    
    items[index] = {
        ...items[index],
        name,
        category,
        price,
        shelfLife
    };
    
    saveItems();
    displayItems(items);
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('editItemModal'));
    modal.hide();
}

// Delete item
function deleteItem(id) {
    if (confirm('Are you sure you want to delete this item?')) {
        items = items.filter(item => item.id !== id);
        saveItems();
        displayItems(items);
    }
}

// Filter and sort items
function filterItems() {
    let filteredItems = [...items];
    const searchTerm = searchItems.value.toLowerCase();
    const categoryValue = categoryFilter.value;
    const sortValue = sortBy.value;
    
    // Apply search filter
    if (searchTerm) {
        filteredItems = filteredItems.filter(item =>
            item.name.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply category filter
    if (categoryValue) {
        filteredItems = filteredItems.filter(item => item.category === categoryValue);
    }
    
    // Apply sorting
    filteredItems.sort((a, b) => {
        switch (sortValue) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'category':
                return a.category.localeCompare(b.category);
            case 'price':
                return a.price - b.price;
            default:
                return 0;
        }
    });
    
    displayItems(filteredItems);
}

// Export items to JSON
function exportItems() {
    const dataStr = JSON.stringify(items, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'bakery-items.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Import items from JSON
function importItems(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedItems = JSON.parse(e.target.result);
            if (Array.isArray(importedItems)) {
                items = importedItems;
                saveItems();
                displayItems(items);
                alert('Items imported successfully');
            } else {
                throw new Error('Invalid data format');
            }
        } catch (error) {
            alert('Error importing items: ' + error.message);
        }
    };
    reader.readAsText(file);
} 