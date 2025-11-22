// Dashboard functionality with proper error handling
let currentUser = null;
let expenses = [];

// Safe element getter with logging
function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.error(`Element with id '${id}' not found`);
    }
    return element;
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Starting initialization');
    
    // Check authentication
    auth.onAuthStateChanged((user) => {
        console.log('Auth state changed:', user ? user.email : 'No user');
        if (user) {
            currentUser = user;
            initializeDashboard(user);
        } else {
            console.log('No user found, redirecting to login');
            window.location.href = 'index.html';
        }
    });
});

function initializeDashboard(user) {
    console.log('Initializing dashboard for:', user.email);
    
    try {
        // Set user email in navbar
        const userEmailEl = getElement('userEmail');
        if (userEmailEl) {
            userEmailEl.textContent = user.email;
        }

        // Set up event listeners
        setupEventListeners();
        console.log('Event listeners setup completed');

        // Set default date to today
        const expenseDateEl = getElement('expenseDate');
        const monthFilterEl = getElement('monthFilter');
        
        if (expenseDateEl) {
            expenseDateEl.value = new Date().toISOString().split('T')[0];
        }
        
        if (monthFilterEl) {
            monthFilterEl.value = new Date().toISOString().substring(0, 7);
        }

        // Load initial data
        loadExpenses();
        console.log('Dashboard initialization completed');
        
    } catch (error) {
        console.error('ERROR in initializeDashboard:', error);
    }
}

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    try {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
            console.log('Logout button listener added');
        }

        // Expense form
        const expenseForm = document.getElementById('expenseForm');
        if (expenseForm) {
            expenseForm.addEventListener('submit', function(e) {
                e.preventDefault();
                console.log('Expense form submitted');
                addExpense(e);
            });
            console.log('Expense form submit listener added');
        }

        // Manual add expense button (backup)
        const addExpenseBtn = document.getElementById('addExpenseBtn');
        if (addExpenseBtn) {
            addExpenseBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Manual add expense button clicked');
                addExpense(e);
            });
            console.log('Manual add expense button listener added');
        }

        // Filters
        const searchInput = document.getElementById('searchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        const monthFilter = document.getElementById('monthFilter');
        const clearFilters = document.getElementById('clearFilters');
        
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                filterAndDisplayExpenses();
            });
            console.log('Search input listener added');
        }
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', function() {
                filterAndDisplayExpenses();
            });
            console.log('Category filter listener added');
        }
        
        if (monthFilter) {
            monthFilter.addEventListener('change', function() {
                filterAndDisplayExpenses();
            });
            console.log('Month filter listener added');
        }
        
        if (clearFilters) {
            clearFilters.addEventListener('click', clearAllFilters);
            console.log('Clear filters listener added');
        }
        
        // Sorting
        const sortBy = document.getElementById('sortBy');
        if (sortBy) {
            sortBy.addEventListener('change', function() {
                filterAndDisplayExpenses();
            });
            console.log('Sort selector listener added');
        }
        
        console.log('All event listeners setup completed');
        
    } catch (error) {
        console.error('ERROR in setupEventListeners:', error);
    }
}

async function handleLogout() {
    try {
        showLoading(true);
        await auth.signOut();
    } catch (error) {
        showMessage('Logout failed: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function addExpense(e) {
    console.log('addExpense function called');
    
    // Get form values
    const title = getElement('expenseTitle')?.value.trim();
    const amount = parseFloat(getElement('expenseAmount')?.value);
    const category = getElement('expenseCategory')?.value;
    const date = getElement('expenseDate')?.value;
    const description = getElement('expenseDescription')?.value.trim();
    
    console.log('Form values:', { title, amount, category, date, description });
    
    // Validation
    if (!title || !amount || !category || !date) {
        showMessage('Please fill all required fields', 'error');
        return;
    }
    
    if (amount <= 0 || isNaN(amount)) {
        showMessage('Amount must be greater than 0', 'error');
        return;
    }
    
    try {
        // Show loading state - SAFE WAY
        const addExpenseText = getElement('addExpenseText');
        const addExpenseSpinner = getElement('addExpenseSpinner');
        const addExpenseBtn = getElement('addExpenseBtn');
        
        if (addExpenseText) addExpenseText.textContent = 'Adding...';
        if (addExpenseSpinner) addExpenseSpinner.classList.remove('hidden');
        if (addExpenseBtn) addExpenseBtn.disabled = true;
        
        const expense = {
            title: title,
            amount: amount,
            category: category,
            date: date,
            description: description,
            userId: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        console.log("Adding expense to Firestore:", expense);
        
        // Add to Firestore
        const docRef = await db.collection('expenses').add(expense);
        console.log("Expense added with ID: ", docRef.id);
        
        // Clear form
        if (getElement('expenseForm')) {
            getElement('expenseForm').reset();
        }
        if (getElement('expenseDate')) {
            getElement('expenseDate').value = new Date().toISOString().split('T')[0];
        }
        
        showMessage('Expense added successfully!', 'success');
        
        // Reload expenses and update dashboard
        await loadExpenses();
        await updateDashboard();
        
    } catch (error) {
        console.error('Error adding expense:', error);
        showMessage('Error adding expense: ' + error.message, 'error');
    } finally {
        // Reset button state - SAFE WAY
        const addExpenseText = getElement('addExpenseText');
        const addExpenseSpinner = getElement('addExpenseSpinner');
        const addExpenseBtn = getElement('addExpenseBtn');
        
        if (addExpenseText) addExpenseText.textContent = 'Add Expense';
        if (addExpenseSpinner) addExpenseSpinner.classList.add('hidden');
        if (addExpenseBtn) addExpenseBtn.disabled = false;
        
        console.log('addExpense function completed');
    }
}

async function loadExpenses() {
    if (!currentUser) {
        console.log('No current user, skipping loadExpenses');
        return;
    }
    
    try {
        showLoading(true);
        console.log('Loading expenses for user:', currentUser.uid);
        
        // SIMPLE QUERY - No sorting to avoid index issues
        let query = db.collection('expenses')
            .where('userId', '==', currentUser.uid);
        
        const snapshot = await query.get();
        expenses = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const expense = {
                id: doc.id,
                ...data,
                // Ensure date is properly formatted
                date: data.date || data.createdAt?.toDate()?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
            };
            expenses.push(expense);
        });
        
        // CLIENT-SIDE SORTING - This will always work
        expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        console.log('Loaded expenses:', expenses.length);
        
        // Display expenses
        displayExpenses(expenses);
        updateExpensesCount(expenses.length);
        updateDashboard();
        
    } catch (error) {
        console.error('Error loading expenses:', error);
        
        // Special handling for index errors
        if (error.message.includes('index')) {
            console.error('Firestore index error. Please create the index or use client-side sorting.');
            showMessage('Loading expenses with basic query...', 'info');
            
            // Fallback: Try without any filters
            try {
                const snapshot = await db.collection('expenses')
                    .where('userId', '==', currentUser.uid)
                    .get();
                
                expenses = [];
                snapshot.forEach(doc => {
                    expenses.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                
                // Client-side sorting
                expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                displayExpenses(expenses);
                updateExpensesCount(expenses.length);
                updateDashboard();
                
            } catch (fallbackError) {
                showMessage('Error loading expenses. Please refresh the page.', 'error');
            }
        } else {
            showMessage('Error loading expenses: ' + error.message, 'error');
        }
    } finally {
        showLoading(false);
    }
}

function displayExpenses(expensesArray) {
    const expensesList = getElement('expensesList');
    if (!expensesList) return;
    
    if (expensesArray.length === 0) {
        expensesList.innerHTML = `
            <div class="no-expenses text-center">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📝</div>
                <h3 style="color: var(--text-muted); margin-bottom: 0.5rem;">No expenses found</h3>
                <p style="color: var(--text-light);">Add your first expense using the form above!</p>
            </div>
        `;
        return;
    }
    
    expensesList.innerHTML = expensesArray.map(expense => `
        <div class="expense-item category-${expense.category}">
            <div class="expense-main">
                <div class="expense-icon">
                    ${getCategoryIcon(expense.category)}
                </div>
                <div class="expense-details">
                    <div class="expense-title">${escapeHtml(expense.title)}</div>
                    <div class="expense-meta">
                        <span class="expense-category">${expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}</span>
                        <span class="expense-date">${formatDate(expense.date)}</span>
                        ${expense.description ? `<span class="expense-desc">• ${escapeHtml(expense.description)}</span>` : ''}
                    </div>
                </div>
            </div>
            <div class="expense-amount">₹${expense.amount.toFixed(2)}</div>
            <div class="expense-actions">
                <button class="btn-danger" onclick="deleteExpense('${expense.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function filterAndDisplayExpenses() {
    const searchTerm = getElement('searchInput')?.value.toLowerCase() || '';
    const categoryFilter = getElement('categoryFilter')?.value || '';
    const monthFilter = getElement('monthFilter')?.value || '';
    const sortBy = getElement('sortBy')?.value || 'date-desc';
    
    let filteredExpenses = [...expenses];
    
    // Apply search filter
    if (searchTerm) {
        filteredExpenses = filteredExpenses.filter(expense => 
            expense.title.toLowerCase().includes(searchTerm) ||
            (expense.description && expense.description.toLowerCase().includes(searchTerm))
        );
    }
    
    // Apply category filter
    if (categoryFilter) {
        filteredExpenses = filteredExpenses.filter(expense => 
            expense.category === categoryFilter
        );
    }
    
    // Apply month filter
    if (monthFilter) {
        filteredExpenses = filteredExpenses.filter(expense => 
            expense.date.startsWith(monthFilter)
        );
    }
    
    // Apply sorting
    switch (sortBy) {
        case 'date-asc':
            filteredExpenses.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'date-desc':
            filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'amount-asc':
            filteredExpenses.sort((a, b) => a.amount - b.amount);
            break;
        case 'amount-desc':
            filteredExpenses.sort((a, b) => b.amount - a.amount);
            break;
        case 'title-asc':
            filteredExpenses.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'title-desc':
            filteredExpenses.sort((a, b) => b.title.localeCompare(a.title));
            break;
    }
    
    displayExpenses(filteredExpenses);
    updateExpensesCount(filteredExpenses.length);
}

function updateExpensesCount(count) {
    const countBadge = getElement('expensesCount');
    if (countBadge) {
        countBadge.textContent = `${count} expense${count !== 1 ? 's' : ''}`;
    }
}

async function deleteExpense(expenseId) {
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }
    
    try {
        showLoading(true);
        await db.collection('expenses').doc(expenseId).delete();
        showMessage('Expense deleted successfully!', 'success');
        await loadExpenses();
        await updateDashboard();
    } catch (error) {
        console.error('Error deleting expense:', error);
        showMessage('Error deleting expense: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function updateDashboard() {
    if (!currentUser || expenses.length === 0) {
        resetDashboard();
        return;
    }
    
    try {
        let total = 0;
        let monthlyTotal = 0;
        const categories = new Set();
        const currentMonth = new Date().toISOString().substring(0, 7);
        const monthlyData = {};
        
        expenses.forEach(expense => {
            total += expense.amount;
            categories.add(expense.category);
            
            // Monthly total
            if (expense.date.startsWith(currentMonth)) {
                monthlyTotal += expense.amount;
            }
            
            // Monthly data for average
            const month = expense.date.substring(0, 7);
            monthlyData[month] = (monthlyData[month] || 0) + expense.amount;
        });
        
        // Calculate average monthly
        const monthlyValues = Object.values(monthlyData);
        const avgMonthly = monthlyValues.length > 0 ? 
            monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length : 0;
        
        // Update DOM
        const totalExpensesEl = getElement('totalExpenses');
        const monthlyExpensesEl = getElement('monthlyExpenses');
        const categoryCountEl = getElement('categoryCount');
        const avgMonthlyEl = getElement('avgMonthly');
        
        if (totalExpensesEl) totalExpensesEl.textContent = `₹${total.toFixed(2)}`;
        if (monthlyExpensesEl) monthlyExpensesEl.textContent = `₹${monthlyTotal.toFixed(2)}`;
        if (categoryCountEl) categoryCountEl.textContent = categories.size;
        if (avgMonthlyEl) avgMonthlyEl.textContent = `₹${avgMonthly.toFixed(2)}`;
        
        updateQuickStats();
        updateCharts();
        
    } catch (error) {
        console.error('Error updating dashboard:', error);
    }
}

function updateQuickStats() {
    const quickStats = getElement('quickStats');
    if (!quickStats) return;
    
    // Calculate quick stats
    const today = new Date().toISOString().split('T')[0];
    const todayExpenses = expenses.filter(e => e.date === today)
                                 .reduce((sum, e) => sum + e.amount, 0);
    
    const categoryTotals = {};
    expenses.forEach(expense => {
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });
    
    const highestCategory = Object.keys(categoryTotals).reduce((a, b) => 
        categoryTotals[a] > categoryTotals[b] ? a : b, 'None');
    
    quickStats.innerHTML = `
        <div class="quick-stat-item">
            <span class="stat-label">Today's Spending</span>
            <span class="stat-value">₹${todayExpenses.toFixed(2)}</span>
        </div>
        <div class="quick-stat-item">
            <span class="stat-label">Total Categories</span>
            <span class="stat-value">${new Set(expenses.map(e => e.category)).size}</span>
        </div>
        <div class="quick-stat-item">
            <span class="stat-label">Highest Category</span>
            <span class="stat-value">${highestCategory.charAt(0).toUpperCase() + highestCategory.slice(1)}</span>
        </div>
    `;
}

function updateCharts() {
    updateCategoryChart();
    updateMonthlyChart();
}

function updateCategoryChart() {
    const categoryChart = getElement('categoryChart');
    if (!categoryChart) return;
    
    const categoryTotals = {};
    expenses.forEach(expense => {
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });
    
    const maxAmount = Math.max(...Object.values(categoryTotals));
    
    categoryChart.innerHTML = `
        <div class="chart-bar">
            ${Object.entries(categoryTotals).map(([category, amount]) => `
                <div class="bar-container">
                    <div class="bar" style="height: ${maxAmount ? (amount / maxAmount) * 100 : 0}%"></div>
                    <div class="bar-label">${category.charAt(0).toUpperCase()}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function updateMonthlyChart() {
    const monthlyChart = getElement('monthlyChart');
    if (!monthlyChart) return;
    
    const monthlyTotals = {};
    expenses.forEach(expense => {
        const month = expense.date.substring(0, 7);
        monthlyTotals[month] = (monthlyTotals[month] || 0) + expense.amount;
    });
    
    // Get last 6 months
    const months = [];
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        months.push(date.toISOString().substring(0, 7));
    }
    
    const maxAmount = Math.max(...Object.values(monthlyTotals));
    
    monthlyChart.innerHTML = `
        <div class="chart-bar">
            ${months.map(month => {
                const amount = monthlyTotals[month] || 0;
                return `
                    <div class="bar-container">
                        <div class="bar" style="height: ${maxAmount ? (amount / maxAmount) * 100 : 0}%"></div>
                        <div class="bar-label">${month.substring(5, 7)}/${month.substring(2, 4)}</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function resetDashboard() {
    const totalExpensesEl = getElement('totalExpenses');
    const monthlyExpensesEl = getElement('monthlyExpenses');
    const categoryCountEl = getElement('categoryCount');
    const avgMonthlyEl = getElement('avgMonthly');
    
    if (totalExpensesEl) totalExpensesEl.textContent = '₹0';
    if (monthlyExpensesEl) monthlyExpensesEl.textContent = '₹0';
    if (categoryCountEl) categoryCountEl.textContent = '0';
    if (avgMonthlyEl) avgMonthlyEl.textContent = '₹0';
    
    const quickStats = getElement('quickStats');
    if (quickStats) {
        quickStats.innerHTML = `
            <div class="quick-stat-item">
                <span class="stat-label">Today's Spending</span>
                <span class="stat-value">₹0</span>
            </div>
            <div class="quick-stat-item">
                <span class="stat-label">Total Categories</span>
                <span class="stat-value">0</span>
            </div>
            <div class="quick-stat-item">
                <span class="stat-label">Highest Category</span>
                <span class="stat-value">None</span>
            </div>
        `;
    }
}

function clearAllFilters() {
    const searchInput = getElement('searchInput');
    const categoryFilter = getElement('categoryFilter');
    const monthFilter = getElement('monthFilter');
    const sortBy = getElement('sortBy');
    
    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = '';
    if (monthFilter) monthFilter.value = new Date().toISOString().substring(0, 7);
    if (sortBy) sortBy.value = 'date-desc';
    
    filterAndDisplayExpenses();
}

// Utility functions
function getCategoryIcon(category) {
    const icons = {
        food: '🍕',
        transport: '🚗',
        shopping: '🛍️',
        entertainment: '🎬',
        bills: '📄',
        health: '🏥',
        education: '📚',
        travel: '✈️',
        other: '🔷'
    };
    return icons[category] || '🔷';
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        return 'Invalid Date';
    }
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Navbar functionality
function setupNavbarInteractions() {
    console.log("🔧 Setting up navbar interactions...");
    
    try {
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenu = document.getElementById('mobileMenu');
        const logoutBtn = document.getElementById('logoutBtn');
        const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');

        // Create overlay for mobile menu
        const overlay = document.createElement('div');
        overlay.className = 'mobile-overlay';
        document.body.appendChild(overlay);

        // Mobile menu toggle functionality
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleMobileMenu();
            });

            // Close mobile menu when clicking on overlay
            overlay.addEventListener('click', function() {
                closeMobileMenu();
            });

            // Close mobile menu when clicking on logout button
            if (mobileLogoutBtn) {
                mobileLogoutBtn.addEventListener('click', function() {
                    closeMobileMenu();
                });
            }

            // Close mobile menu when pressing Escape key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
                    closeMobileMenu();
                }
            });

            // Close mobile menu when window is resized to desktop
            window.addEventListener('resize', function() {
                if (window.innerWidth > 768 && mobileMenu.classList.contains('active')) {
                    closeMobileMenu();
                }
            });
        }

        // Logout functionality
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
            console.log("Desktop logout button setup");
        }
        
        if (mobileLogoutBtn) {
            mobileLogoutBtn.addEventListener('click', handleLogout);
            console.log("Mobile logout button setup");
        }

        function toggleMobileMenu() {
            const isActive = mobileMenu.classList.contains('active');
            
            if (isActive) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        }

        function openMobileMenu() {
            mobileMenuBtn.classList.add('active');
            mobileMenu.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            console.log("Mobile menu opened");
        }

        function closeMobileMenu() {
            mobileMenuBtn.classList.remove('active');
            mobileMenu.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            console.log("Mobile menu closed");
        }
        
    } catch (error) {
        console.error('❌ ERROR in setupNavbarInteractions:', error);
    }
}

// Navbar scroll effect
function setupNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.style.background = 'rgba(255, 255, 255, 0.98)';
                navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
            } else {
                navbar.style.background = 'rgba(255, 255, 255, 0.95)';
                navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
            }
        });
    }
}

// Navbar functionality
function initializeNavbar(user) {
    console.log('🔧 Initializing navbar for:', user.email);
    
    try {
        // Set user email in both desktop and mobile
        const userEmailEl = getElement('userEmail');
        const mobileUserEmailEl = getElement('mobileUserEmail');
        
        if (userEmailEl) userEmailEl.textContent = user.email;
        if (mobileUserEmailEl) mobileUserEmailEl.textContent = user.email;
        
        // Setup navbar interactions
        setupNavbarInteractions();
        
        console.log('✅ Navbar initialization completed');
        
    } catch (error) {
        console.error('❌ ERROR in initializeNavbar:', error);
    }
}

function setupNavbarInteractions() {
    console.log("🔧 Setting up navbar interactions...");
    
    try {
        const mobileMenuBtn = getElement('mobileMenuBtn');
        const mobileMenu = getElement('mobileMenu');
        const logoutBtn = getElement('logoutBtn');
        const mobileLogoutBtn = getElement('mobileLogoutBtn');

        // Create overlay for mobile menu if it doesn't exist
        let overlay = document.querySelector('.mobile-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'mobile-overlay';
            document.body.appendChild(overlay);
        }

        // Mobile menu toggle functionality
        if (mobileMenuBtn && mobileMenu) {
            console.log("📱 Mobile menu elements found");
            
            mobileMenuBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                console.log("📱 Mobile menu button clicked");
                toggleMobileMenu();
            });

            // Close mobile menu when clicking on overlay
            overlay.addEventListener('click', function() {
                console.log("📱 Overlay clicked - closing menu");
                closeMobileMenu();
            });

            // Close mobile menu when clicking on logout button
            if (mobileLogoutBtn) {
                mobileLogoutBtn.addEventListener('click', function() {
                    console.log("📱 Mobile logout clicked - closing menu");
                    closeMobileMenu();
                });
            }

            // Close mobile menu when pressing Escape key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
                    console.log("📱 Escape pressed - closing menu");
                    closeMobileMenu();
                }
            });

            // Close mobile menu when window is resized to desktop
            window.addEventListener('resize', function() {
                if (window.innerWidth > 768 && mobileMenu.classList.contains('active')) {
                    console.log("📱 Window resized - closing menu");
                    closeMobileMenu();
                }
            });
        } else {
            console.warn("⚠️ Mobile menu elements not found");
        }

        // Logout functionality
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
            console.log("✅ Desktop logout button setup");
        } else {
            console.warn("⚠️ Desktop logout button not found");
        }
        
        if (mobileLogoutBtn) {
            mobileLogoutBtn.addEventListener('click', handleLogout);
            console.log("✅ Mobile logout button setup");
        } else {
            console.warn("⚠️ Mobile logout button not found");
        }

        function toggleMobileMenu() {
            const isActive = mobileMenu.classList.contains('active');
            
            if (isActive) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        }

        function openMobileMenu() {
            mobileMenuBtn.classList.add('active');
            mobileMenu.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            console.log("📱 Mobile menu opened");
        }

        function closeMobileMenu() {
            mobileMenuBtn.classList.remove('active');
            mobileMenu.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            console.log("📱 Mobile menu closed");
        }
        
    } catch (error) {
        console.error('❌ ERROR in setupNavbarInteractions:', error);
    }
}

// Navbar scroll effect
function setupNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 10) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }
}

// Update initializeDashboard function to include navbar
function initializeDashboard(user) {
    console.log("🎯 Initializing dashboard for:", user.email);
    
    try {
        // Initialize navbar FIRST
        initializeNavbar(user);
        
        // Setup navbar scroll effects
        setupNavbarScroll();
        
        // Set user email in navbar
        const userEmailEl = getElement('userEmail');
        const mobileUserEmailEl = getElement('mobileUserEmail');
        
        if (userEmailEl) userEmailEl.textContent = user.email;
        if (mobileUserEmailEl) mobileUserEmailEl.textContent = user.email;

        // Set up event listeners
        setupEventListeners();
        console.log('Event listeners setup completed');

        // Set default date to today
        const expenseDateEl = getElement('expenseDate');
        const monthFilterEl = getElement('monthFilter');
        
        if (expenseDateEl) {
            expenseDateEl.value = new Date().toISOString().split('T')[0];
        }
        
        if (monthFilterEl) {
            monthFilterEl.value = new Date().toISOString().substring(0, 7);
        }

        // Load initial data
        loadExpenses();
        console.log('✅ Dashboard initialization completed');
        
    } catch (error) {
        console.error('❌ ERROR in initializeDashboard:', error);
    }
}