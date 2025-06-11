// Load header and footer components
document.addEventListener('DOMContentLoaded', function() {
    // Load header
    fetch('/components/header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;
            initializeHeader();
        });

    // Load footer
    fetch('/components/footer.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('footer-placeholder').innerHTML = data;
        });
});

// Initialize header functionality
function initializeHeader() {
    // Global search functionality
    const globalSearch = document.getElementById('globalSearch');
    if (globalSearch) {
        globalSearch.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                performSearch(this.value);
            }
        });
    }

    // Home page search functionality
    const searchTools = document.getElementById('searchTools');
    if (searchTools) {
        searchTools.addEventListener('keyup', function() {
            const searchTerm = this.value.toLowerCase();
            const cards = document.querySelectorAll('#toolsGrid .card');
            
            cards.forEach(card => {
                const title = card.querySelector('.card-title').textContent.toLowerCase();
                const description = card.querySelector('.card-text').textContent.toLowerCase();
                
                if (title.includes(searchTerm) || description.includes(searchTerm)) {
                    card.closest('.col-md-6').style.display = '';
                } else {
                    card.closest('.col-md-6').style.display = 'none';
                }
            });
        });
    }
}

// Perform global search
function performSearch(term) {
    // Implement global search logic here
    console.log('Searching for:', term);
    // You can redirect to a search results page or show results in a modal
}

// User role management
const UserRoles = {
    ADMIN: 'admin',
    EMPLOYEE: 'employee'
};

// Check user role and permissions
function checkUserRole() {
    const userRole = localStorage.getItem('userRole') || UserRoles.EMPLOYEE;
    return userRole;
}

// Check if user has admin access
function isAdmin() {
    return checkUserRole() === UserRoles.ADMIN;
}

// Set user role (for testing purposes)
function setUserRole(role) {
    if (Object.values(UserRoles).includes(role)) {
        localStorage.setItem('userRole', role);
    }
}

// Initialize page based on user role
function initializePage() {
    const isAdminUser = isAdmin();
    
    // Hide admin-only elements if not admin
    document.querySelectorAll('.admin-only').forEach(element => {
        element.style.display = isAdminUser ? '' : 'none';
    });
}

// Call initializePage when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePage); 