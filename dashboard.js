class ExpenseManager {
    constructor() {
        this.currentUser = null;
        this.expenses = [];
        this.init();
    }

    init() {
        console.log('🚀 Starting Expense Manager...');
        
        this.waitForFirebase().then(() => {
            this.initializeAuth();
        }).catch(error => {
            console.error('❌ Firebase failed to load:', error);
            this.showMessage('Firebase not available. Using demo mode.', 'error');
            this.initializeWithDemoData();
        });
    }

    waitForFirebase() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; 
            
            const checkFirebase = () => {
                attempts++;
                
                if (typeof auth !== 'undefined' && auth) {
                    console.log('✅ Firebase auth loaded successfully');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Firebase auth timeout - not loaded after ' + maxAttempts + ' attempts'));
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            
            checkFirebase();
        });
    }

    initializeAuth() {
        console.log('🔐 Initializing authentication...');
        

        auth.onAuthStateChanged((user) => {
            console.log('Auth state changed:', user ? user.email : 'No user');
            if (user) {
                this.currentUser = user;
                this.initializeApp(user);
            } else {
                console.log('No user found, redirecting to login');

                this.initializeWithDemoData();
            }
        });


        this.setupEventListeners();
    }

    initializeWithDemoData() {
        console.log('👤 Using demo mode - no Firebase');
        this.currentUser = { uid: 'demo-user', email: 'demo@example.com' };
        

        this.updateUserInfo(this.currentUser);
        this.setDefaultDates();
        this.updateGreeting();
        

        this.loadDemoExpenses();
        this.setupEventListeners();
    }

    loadDemoExpenses() {
        console.log('📥 Loading demo expenses...');
        

        this.expenses = [
            {
                id: '1',
                title: 'Groceries',
                amount: 2500,
                category: 'food',
                date: new Date().toISOString().split('T')[0],
                description: 'Weekly groceries'
            },
            {
                id: '2', 
                title: 'Petrol',
                amount: 1500,
                category: 'transport',
                date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
                description: 'Car fuel'
            },
            {
                id: '3',
                title: 'Internet Bill',
                amount: 2000,
                category: 'bills',
                date: new Date(Date.now() - 172800000).toISOString().split('T')[0]
            }
        ];
        
        this.displayExpenses(this.expenses);
        this.updateDashboard();
        this.showMessage('Demo mode activated - Add real Firebase config to save data', 'info');
    }

    initializeApp(user) {
        console.log('👤 User logged in:', user.email);
        
        this.updateUserInfo(user);
        this.setDefaultDates();
        this.loadExpenses();
        this.updateGreeting();
    }

    updateUserInfo(user) {
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        
        if (userName) {
            userName.textContent = user.displayName || user.email.split('@')[0] || 'User';
        }
        if (userEmail) {
            userEmail.textContent = user.email;
        }
    }

    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        const expenseForm = document.getElementById('expenseForm');
        if (expenseForm) {
            expenseForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('📝 Form submitted, calling addExpense...');
                this.addExpense(e);
            });
        }
        

        const searchInput = document.getElementById('searchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        const monthFilter = document.getElementById('monthFilter');
        const clearFilters = document.getElementById('clearFilters');
        
        if (searchInput) searchInput.addEventListener('input', () => this.filterExpenses());
        if (categoryFilter) categoryFilter.addEventListener('change', () => this.filterExpenses());
        if (monthFilter) monthFilter.addEventListener('change', () => this.filterExpenses());
        if (clearFilters) clearFilters.addEventListener('click', () => this.clearFilters());
        
        console.log('✅ Event listeners setup completed');
    }

    setDefaultDates() {
        const today = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().toISOString().substring(0, 7);
        
        const expenseDate = document.getElementById('expenseDate');
        const monthFilter = document.getElementById('monthFilter');
        
        if (expenseDate) expenseDate.value = today;
        if (monthFilter) monthFilter.value = currentMonth;
    }

    updateGreeting() {
        const hour = new Date().getHours();
        const greeting = document.getElementById('greetingText');
        let message = 'Good Evening!';
        
        if (hour < 12) message = 'Good Morning!';
        else if (hour < 18) message = 'Good Afternoon!';
        
        if (greeting) {
            greeting.textContent = message;
        }
    }

    async addExpense(e) {
        console.log('💰 addExpense function called');
        

        const formData = this.getFormData();
        console.log('📋 Form values:', formData);
        

        if (!this.validateForm(formData)) return;
        
        try {
            this.showLoading(true);
            
            const expenseData = {
                ...formData,
                userId: this.currentUser.uid,
                createdAt: new Date(),
                timestamp: new Date().getTime()
            };
            
            console.log('💾 Saving expense:', expenseData);
            
            if (window.db && typeof db.collection === 'function') {

                await db.collection('expenses').add(expenseData);
                this.showMessage('Expense added successfully! 💰', 'success');
            } else {

                expenseData.id = 'demo-' + Date.now();
                this.expenses.unshift(expenseData);
                this.showMessage('Expense added (Demo Mode) 💰', 'success');
            }
            
            this.resetExpenseForm();
            

            if (window.db && typeof db.collection === 'function') {
                await this.loadExpenses();
            } else {
                this.displayExpenses(this.expenses);
                this.updateDashboard();
            }
            
        } catch (error) {
            console.error('❌ Error adding expense:', error);
            this.showMessage('Error adding expense: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    getFormData() {
        return {
            title: document.getElementById('expenseTitle')?.value.trim() || '',
            amount: parseFloat(document.getElementById('expenseAmount')?.value) || 0,
            category: document.getElementById('expenseCategory')?.value || '',
            date: document.getElementById('expenseDate')?.value || '',
            description: document.getElementById('expenseDescription')?.value.trim() || ''
        };
    }

    validateForm(data) {
        const { title, amount, category, date } = data;
        
        if (!title) {
            this.showMessage('Please enter a title', 'error');
            this.highlightInvalidField('expenseTitle');
            return false;
        }
        
        if (!amount || amount <= 0 || isNaN(amount)) {
            this.showMessage('Please enter a valid amount greater than 0', 'error');
            this.highlightInvalidField('expenseAmount');
            return false;
        }
        
        if (!category) {
            this.showMessage('Please select a category', 'error');
            this.highlightInvalidField('expenseCategory');
            return false;
        }
        
        if (!date) {
            this.showMessage('Please select a date', 'error');
            this.highlightInvalidField('expenseDate');
            return false;
        }
        
        return true;
    }

    highlightInvalidField(fieldId) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.style.borderColor = 'var(--error)';
            setTimeout(() => {
                field.style.borderColor = '';
            }, 3000);
        }
    }

    resetExpenseForm() {
        const form = document.getElementById('expenseForm');
        if (form) {
            form.reset();
            this.setDefaultDates();
        }
    }

    async loadExpenses() {
        if (!this.currentUser) {
            console.log('No current user');
            return;
        }
        
        try {
            this.showLoading(true);
            console.log('📥 Loading expenses...');
            
            if (window.db && typeof db.collection === 'function') {
                const snapshot = await db.collection('expenses')
                    .where('userId', '==', this.currentUser.uid)
                    .get();
                
                this.expenses = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    this.expenses.push({
                        id: doc.id,
                        ...data
                    });
                });

                this.expenses.sort((a, b) => {
                    const dateA = new Date(a.createdAt?.toDate?.() || a.createdAt || a.date || 0);
                    const dateB = new Date(b.createdAt?.toDate?.() || b.createdAt || b.date || 0);
                    return dateB - dateA;
                });
            }

            
            console.log('✅ Loaded expenses:', this.expenses.length);
            this.displayExpenses(this.expenses);
            this.updateDashboard();
            
        } catch (error) {
            console.error('❌ Error loading expenses:', error);
            this.showMessage('Error loading expenses: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    displayExpenses(expenses) {
        const container = document.getElementById('expensesList');
        if (!container) {
            console.error('Expenses list container not found!');
            return;
        }
        
        if (expenses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-receipt"></i>
                    </div>
                    <h3>No expenses found</h3>
                    <p>Add your first expense using the form!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = expenses.map(expense => `
            <div class="expense-item">
                <div class="expense-icon">
                    <i class="fas ${this.getCategoryIcon(expense.category)}"></i>
                </div>
                <div class="expense-details">
                    <div class="expense-title">${this.escapeHtml(expense.title)}</div>
                    <div class="expense-meta">
                        <span class="expense-category">${this.formatCategory(expense.category)}</span>
                        <span>${this.formatDate(expense.date)}</span>
                        ${expense.description ? `<span>• ${this.escapeHtml(expense.description)}</span>` : ''}
                    </div>
                </div>
                <div class="expense-amount">Rs ${expense.amount.toFixed(2)}</div>
                <div class="expense-actions">
                    <button class="btn-icon btn-danger" onclick="expenseManager.deleteExpense('${expense.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        this.updateExpensesCount(expenses.length);
    }

    updateExpensesCount(count) {
        const expensesCount = document.getElementById('expensesCount');
        const totalExpensesCount = document.getElementById('totalExpensesCount');
        
        if (expensesCount) expensesCount.textContent = `${count} expenses`;
        if (totalExpensesCount) totalExpensesCount.textContent = `${this.expenses.length} total`;
    }

    filterExpenses() {
        const searchInput = document.getElementById('searchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        const monthFilter = document.getElementById('monthFilter');
        
        if (!searchInput || !categoryFilter || !monthFilter) return;
        
        const searchTerm = searchInput.value.toLowerCase();
        const categoryValue = categoryFilter.value;
        const monthValue = monthFilter.value;
        
        let filtered = this.expenses.filter(expense => {
            const matchesSearch = !searchTerm || 
                expense.title.toLowerCase().includes(searchTerm) ||
                (expense.description && expense.description.toLowerCase().includes(searchTerm));
            
            const matchesCategory = !categoryValue || expense.category === categoryValue;
            const matchesMonth = !monthValue || expense.date.startsWith(monthValue);
            
            return matchesSearch && matchesCategory && matchesMonth;
        });
        
        this.displayExpenses(filtered);
    }

    clearFilters() {
        const searchInput = document.getElementById('searchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        const monthFilter = document.getElementById('monthFilter');
        
        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = '';
        if (monthFilter) monthFilter.value = new Date().toISOString().substring(0, 7);
        
        this.filterExpenses();
        this.showMessage('Filters cleared', 'info');
    }

    async deleteExpense(expenseId) {
        if (!confirm('Are you sure you want to delete this expense?')) return;
        
        try {
            this.showLoading(true);
            
            if (window.db && typeof db.collection === 'function') {
                await db.collection('expenses').doc(expenseId).delete();
                this.showMessage('Expense deleted successfully 🗑️', 'success');
                await this.loadExpenses();
            } else {
                this.expenses = this.expenses.filter(exp => exp.id !== expenseId);
                this.showMessage('Expense deleted (Demo Mode) 🗑️', 'success');
                this.displayExpenses(this.expenses);
                this.updateDashboard();
            }
            
        } catch (error) {
            console.error('❌ Error deleting expense:', error);
            this.showMessage('Error deleting expense', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    updateDashboard() {
        if (this.expenses.length === 0) {
            this.resetDashboard();
            return;
        }
        
        try {

            const total = this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
            
            const currentMonth = new Date().toISOString().substring(0, 7);
            const monthlyTotal = this.expenses
                .filter(expense => expense.date && expense.date.startsWith(currentMonth))
                .reduce((sum, expense) => sum + expense.amount, 0);
            
            const categories = new Set(this.expenses.map(expense => expense.category).filter(Boolean));
            

            const monthlyTotals = {};
            this.expenses.forEach(expense => {
                if (expense.date) {
                    const month = expense.date.substring(0, 7);
                    monthlyTotals[month] = (monthlyTotals[month] || 0) + expense.amount;
                }
            });
            
            const monthlyValues = Object.values(monthlyTotals);
            const avgMonthly = monthlyValues.length > 0 ? 
                monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length : 0;
            

            this.updateElement('totalExpenses', `Rs ${total.toFixed(2)}`);
            this.updateElement('monthlyExpenses', `Rs ${monthlyTotal.toFixed(2)}`);
            this.updateElement('categoryCount', categories.size);
            this.updateElement('avgMonthly', `Rs ${avgMonthly.toFixed(2)}`);
            
            this.updateQuickStats();
            
        } catch (error) {
            console.error('Error updating dashboard:', error);
        }
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    updateQuickStats() {
        const quickStats = document.getElementById('quickStats');
        if (!quickStats) return;
        
        const today = new Date().toISOString().split('T')[0];
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const todayTotal = this.expenses
            .filter(expense => expense.date === today)
            .reduce((sum, expense) => sum + expense.amount, 0);
        
        const weekTotal = this.expenses
            .filter(expense => expense.date >= oneWeekAgo)
            .reduce((sum, expense) => sum + expense.amount, 0);
        

        const categoryCounts = {};
        this.expenses.forEach(expense => {
            if (expense.category) {
                categoryCounts[expense.category] = (categoryCounts[expense.category] || 0) + 1;
            }
        });
        
        const topCategory = Object.keys(categoryCounts).length > 0 ? 
            Object.keys(categoryCounts).reduce((a, b) => categoryCounts[a] > categoryCounts[b] ? a : b) : 'None';
        

        quickStats.innerHTML = `
            <div class="quick-stat">
                <span class="stat-text">Today's Spending</span>
                <span class="stat-number">Rs ${todayTotal.toFixed(2)}</span>
            </div>
            <div class="quick-stat">
                <span class="stat-text">This Week</span>
                <span class="stat-number">Rs ${weekTotal.toFixed(2)}</span>
            </div>
            <div class="quick-stat">
                <span class="stat-text">Most Used Category</span>
                <span class="stat-number">${this.formatCategory(topCategory)}</span>
            </div>
        `;
    }

    resetDashboard() {
        this.updateElement('totalExpenses', 'Rs 0');
        this.updateElement('monthlyExpenses', 'Rs 0');
        this.updateElement('categoryCount', '0');
        this.updateElement('avgMonthly', 'Rs 0');
        
        const quickStats = document.getElementById('quickStats');
        if (quickStats) {
            quickStats.innerHTML = `
                <div class="quick-stat">
                    <span class="stat-text">Today's Spending</span>
                    <span class="stat-number">Rs 0</span>
                </div>
                <div class="quick-stat">
                    <span class="stat-text">This Week</span>
                    <span class="stat-number">Rs 0</span>
                </div>
                <div class="quick-stat">
                    <span class="stat-text">Most Used Category</span>
                    <span class="stat-number">-</span>
                </div>
            `;
        }
    }

    async handleLogout() {
        try {
            this.showLoading(true);
            
            if (window.auth && typeof auth.signOut === 'function') {
                await auth.signOut();
                window.location.href = 'index.html';
            } else {

                this.showMessage('Logged out of demo mode', 'info');
                this.initializeWithDemoData();
            }
        } catch (error) {
            console.error('❌ Error logging out:', error);
            this.showMessage('Error logging out', 'error');
        } finally {
            this.showLoading(false);
        }
    }


    getCategoryIcon(category) {
        const icons = {
            food: 'fa-utensils',
            transport: 'fa-car',
            shopping: 'fa-shopping-bag',
            bills: 'fa-file-invoice',
            entertainment: 'fa-film',
            health: 'fa-heartbeat',
            education: 'fa-graduation-cap',
            other: 'fa-circle'
        };
        return icons[category] || 'fa-circle';
    }

    formatCategory(category) {
        if (!category || category === 'None') return 'Other';
        const words = category.split(' ');
        return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    formatDate(dateString) {
        try {
            if (!dateString) return 'Invalid Date';
            const date = new Date(dateString);
            return date.toLocaleDateString('en-PK', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.toggle('hidden', !show);
        }
    }

    showMessage(message, type) {
        const container = document.getElementById('messageContainer');
        if (!container) {
            console.log('Message:', message);
            return;
        }
        
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i>
            ${message}
        `;
        
        container.appendChild(messageEl);
        

        setTimeout(() => {
            messageEl.style.opacity = '0';
            messageEl.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 5000);
    }
}


document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM loaded, initializing Expense Manager...');
    window.expenseManager = new ExpenseManager();
});