
const loginSection = document.getElementById('loginSection');
const appSection = document.getElementById('appSection');
const userEmail = document.getElementById('userEmail');


const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const logoutBtn = document.getElementById('logoutBtn');


const expenseTitle = document.getElementById('expenseTitle');
const expenseAmount = document.getElementById('expenseAmount');
const expenseCategory = document.getElementById('expenseCategory');
const expenseDate = document.getElementById('expenseDate');
const expenseDescription = document.getElementById('expenseDescription');
const addExpenseBtn = document.getElementById('addExpenseBtn');


const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const monthFilter = document.getElementById('monthFilter');
const clearFilters = document.getElementById('clearFilters');


const totalExpenses = document.getElementById('totalExpenses');
const monthlyExpenses = document.getElementById('monthlyExpenses');
const categoryCount = document.getElementById('categoryCount');


const expensesList = document.getElementById('expensesList');

let currentUser = null;


expenseDate.value = new Date().toISOString().split('T')[0];
monthFilter.value = new Date().toISOString().substring(0, 7);


loginBtn.addEventListener('click', handleLogin);
signupBtn.addEventListener('click', handleSignup);
logoutBtn.addEventListener('click', handleLogout);
addExpenseBtn.addEventListener('click', addExpense);
searchInput.addEventListener('input', loadExpenses);
categoryFilter.addEventListener('change', loadExpenses);
monthFilter.addEventListener('change', loadExpenses);
clearFilters.addEventListener('click', clearAllFilters);

async function handleLogin() {
    const email = emailInput.value;
    const password = passwordInput.value;
    
    if (!email || !password) {
        showMessage('Please enter email and password', 'error');
        return;
    }
    
    try {
        showLoading(true);
        await auth.signInWithEmailAndPassword(email, password);
        showMessage('Login successful!');
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function handleSignup() {
    const email = emailInput.value;
    const password = passwordInput.value;
    
    if (!email || !password) {
        showMessage('Please enter email and password', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Password should be at least 6 characters', 'error');
        return;
    }
    
    try {
        showLoading(true);
        await auth.createUserWithEmailAndPassword(email, password);
        showMessage('Account created successfully!');
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function handleLogout() {
    try {
        await auth.signOut();
        showMessage('Logged out successfully!');
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

function showLoginSection() {
    loginSection.classList.remove('hidden');
    appSection.classList.add('hidden');
    emailInput.value = '';
    passwordInput.value = '';
}

function showAppSection(user) {
    currentUser = user;
    userEmail.textContent = user.email;
    loginSection.classList.add('hidden');
    appSection.classList.remove('hidden');
    loadExpenses();
    updateDashboard();
}


async function addExpense() {
    const title = expenseTitle.value.trim();
    const amount = parseFloat(expenseAmount.value);
    const category = expenseCategory.value;
    const date = expenseDate.value;
    const description = expenseDescription.value.trim();
    
    if (!title || !amount || !category || !date) {
        showMessage('Please fill all required fields', 'error');
        return;
    }
    
    if (amount <= 0) {
        showMessage('Amount must be greater than 0', 'error');
        return;
    }
    
    try {
        showLoading(true);
        
        const expense = {
            title,
            amount,
            category,
            date,
            description,
            userId: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('expenses').add(expense);
        

        expenseTitle.value = '';
        expenseAmount.value = '';
        expenseCategory.value = '';
        expenseDate.value = new Date().toISOString().split('T')[0];
        expenseDescription.value = '';
        
        showMessage('Expense added successfully!');
        loadExpenses();
        updateDashboard();
        
    } catch (error) {
        showMessage('Error adding expense: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function loadExpenses() {
    if (!currentUser) return;
    
    try {
        showLoading(true);
        
        let query = db.collection('expenses')
            .where('userId', '==', currentUser.uid)
            .orderBy('date', 'desc');
        

        const searchTerm = searchInput.value.trim().toLowerCase();
        const selectedCategory = categoryFilter.value;
        const selectedMonth = monthFilter.value;
        
        const snapshot = await query.get();
        let expenses = [];
        
        snapshot.forEach(doc => {
            const expense = {
                id: doc.id,
                ...doc.data()
            };
            

            let include = true;
            
            if (searchTerm && !expense.title.toLowerCase().includes(searchTerm)) {
                include = false;
            }
            
            if (selectedCategory && expense.category !== selectedCategory) {
                include = false;
            }
            
            if (selectedMonth && !expense.date.startsWith(selectedMonth)) {
                include = false;
            }
            
            if (include) {
                expenses.push(expense);
            }
        });
        
        displayExpenses(expenses);
        
    } catch (error) {
        console.error('Error loading expenses:', error);
        showMessage('Error loading expenses', 'error');
    } finally {
        showLoading(false);
    }
}

function displayExpenses(expenses) {
    if (expenses.length === 0) {
        expensesList.innerHTML = `
            <div class="no-expenses">
                <p>No expenses found. Add your first expense above!</p>
            </div>
        `;
        return;
    }
    
    expensesList.innerHTML = expenses.map(expense => `
        <div class="expense-item category-${expense.category}">
            <div class="expense-info">
                <div class="expense-title">${expense.title}</div>
                <div class="expense-meta">
                    <span class="expense-category">${getCategoryIcon(expense.category)} ${expense.category}</span>
                    <span class="expense-date">${formatDate(expense.date)}</span>
                    ${expense.description ? `<span class="expense-desc">${expense.description}</span>` : ''}
                </div>
            </div>
            <div class="expense-amount">₹${expense.amount.toFixed(2)}</div>
            <div class="expense-actions">
                <button class="btn-danger" onclick="deleteExpense('${expense.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function getCategoryIcon(category) {
    const icons = {
        food: '🍕',
        transport: '🚗',
        shopping: '🛍️',
        entertainment: '🎬',
        bills: '📄',
        health: '🏥',
        education: '📚',
        other: '🔷'
    };
    return icons[category] || '🔷';
}

async function deleteExpense(expenseId) {
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }
    
    try {
        showLoading(true);
        await db.collection('expenses').doc(expenseId).delete();
        showMessage('Expense deleted successfully!');
        loadExpenses();
        updateDashboard();
    } catch (error) {
        showMessage('Error deleting expense: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}


async function updateDashboard() {
    if (!currentUser) return;
    
    try {
        const snapshot = await db.collection('expenses')
            .where('userId', '==', currentUser.uid)
            .get();
        
        let total = 0;
        let monthlyTotal = 0;
        const categories = new Set();
        const currentMonth = new Date().toISOString().substring(0, 7);
        
        snapshot.forEach(doc => {
            const expense = doc.data();
            total += expense.amount;
            categories.add(expense.category);
            
            if (expense.date.startsWith(currentMonth)) {
                monthlyTotal += expense.amount;
            }
        });
        
        totalExpenses.textContent = `₹${total.toFixed(2)}`;
        monthlyExpenses.textContent = `₹${monthlyTotal.toFixed(2)}`;
        categoryCount.textContent = categories.size;
        
        updateCharts(snapshot);
        
    } catch (error) {
        console.error('Error updating dashboard:', error);
    }
}

function updateCharts(snapshot) {

    const categoryChart = document.getElementById('categoryChart');
    const monthlyChart = document.getElementById('monthlyChart');

    const categories = {};
    snapshot.forEach(doc => {
        const expense = doc.data();
        categories[expense.category] = (categories[expense.category] || 0) + expense.amount;
    });
    
    categoryChart.innerHTML = Object.entries(categories)
        .map(([category, amount]) => `
            <div style="margin: 5px 0; padding: 5px; background: #e2e8f0; border-radius: 5px;">
                <div style="display: flex; justify-content: space-between;">
                    <span>${getCategoryIcon(category)} ${category}</span>
                    <span>₹${amount.toFixed(2)}</span>
                </div>
                <div style="height: 8px; background: #667eea; border-radius: 4px; margin-top: 5px; 
                     width: ${(amount / Math.max(...Object.values(categories)) * 100)}%"></div>
            </div>
        `).join('') || '<p>No data available</p>';
    

    const months = {};
    snapshot.forEach(doc => {
        const expense = doc.data();
        const month = expense.date.substring(0, 7);
        months[month] = (months[month] || 0) + expense.amount;
    });
    
    monthlyChart.innerHTML = Object.entries(months)
        .slice(-6) 
        .map(([month, amount]) => `
            <div style="margin: 5px 0; text-align: center;">
                <div style="font-size: 0.8rem;">${month}</div>
                <div style="height: 100px; display: flex; align-items: end; justify-content: center;">
                    <div style="width: 20px; background: #764ba2; border-radius: 3px; 
                         height: ${(amount / Math.max(...Object.values(months)) * 80)}px;"></div>
                </div>
                <div style="font-size: 0.7rem;">₹${amount.toFixed(0)}</div>
            </div>
        `).join('') || '<p>No data available</p>';
}


function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function clearAllFilters() {
    searchInput.value = '';
    categoryFilter.value = '';
    monthFilter.value = new Date().toISOString().substring(0, 7);
    loadExpenses();
}


document.addEventListener('DOMContentLoaded', function() {

    if (auth.currentUser) {
        showAppSection(auth.currentUser);
    }
});
