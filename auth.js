document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const currentPage = window.location.pathname;
        const isLoginPage = currentPage.includes('index.html') || 
                           currentPage === '/' || 
                           currentPage.endsWith('/');
        
        const isSignupPage = currentPage.includes('signup.html');
        
        if (isLoginPage) {
            setupLoginPage();
        } else if (isSignupPage) {
            setupSignupPage();
        }
    }, 500);
});

function setupLoginPage() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) {
        showMessage('Login form not available. Please refresh the page.', 'error');
        return;
    }
    
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.querySelector('#loginForm .auth-btn');
    const loginText = document.getElementById('loginText');
    const loginSpinner = document.getElementById('loginSpinner');
    
    if (!emailInput || !passwordInput) {
        showMessage('Email or password field missing. Please refresh.', 'error');
        return;
    }
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value ? emailInput.value.trim() : '';
        const password = passwordInput.value ? passwordInput.value : '';
        
        if (!email || !password) {
            showMessage('Please enter both email and password', 'error');
            return;
        }
        
        if (password.length < 6) {
            showMessage('Password must be at least 6 characters', 'error');
            return;
        }
        
        if (!window.auth) {
            showMessage('Authentication service not available. Please refresh.', 'error');
            return;
        }
        
        try {
            if (loginText) loginText.textContent = 'Logging in...';
            if (loginSpinner) loginSpinner.classList.remove('hidden');
            if (loginBtn) loginBtn.disabled = true;
            
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            
            showMessage('Login successful! Redirecting...', 'success');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
            
        } catch (error) {
            let message = 'Login failed. ';
            switch (error.code) {
                case 'auth/user-not-found':
                    message += 'No account found with this email.';
                    break;
                case 'auth/wrong-password':
                    message += 'Incorrect password.';
                    break;
                case 'auth/invalid-email':
                    message += 'Invalid email address.';
                    break;
                case 'auth/too-many-requests':
                    message += 'Too many attempts. Try again later.';
                    break;
                case 'auth/network-request-failed':
                    message += 'Network error. Check your connection.';
                    break;
                default:
                    message += error.message;
            }
            showMessage(message, 'error');
        } finally {
            if (loginText) loginText.textContent = 'Login';
            if (loginSpinner) loginSpinner.classList.add('hidden');
            if (loginBtn) loginBtn.disabled = false;
        }
    });
    
    const demoCredentials = document.querySelector('.demo-credentials');
    if (demoCredentials) {
        demoCredentials.addEventListener('click', (e) => {
            e.preventDefault();
            if (emailInput) emailInput.value = 'demo@expensemanager.com';
            if (passwordInput) passwordInput.value = 'demo123';
            showMessage('Demo credentials filled! Click Login to continue.', 'success');
        });
    }
}

function setupSignupPage() {
    const signupForm = document.getElementById('signupForm');
    if (!signupForm) {
        showMessage('Signup form not available. Please refresh the page.', 'error');
        return;
    }
    
    let fullNameInput = document.getElementById('fullName');
    
    if (!fullNameInput) {
        fullNameInput = document.querySelector('input[name="fullName"]');
        if (!fullNameInput) {
            fullNameInput = document.querySelector('input[type="text"]');
        }
        if (!fullNameInput) {
            fullNameInput = document.querySelector('.form-group input');
        }
    }
    
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const signupBtn = document.querySelector('#signupForm .auth-btn');
    const signupText = document.getElementById('signupText');
    const signupSpinner = document.getElementById('signupSpinner');
    
    if (!fullNameInput || !emailInput || !passwordInput || !confirmPasswordInput) {
        showMessage('Some form fields are missing. Please refresh.', 'error');
        return;
    }
    
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fullName = fullNameInput.value ? fullNameInput.value.trim() : '';
        const email = emailInput.value ? emailInput.value.trim() : '';
        const password = passwordInput.value ? passwordInput.value : '';
        const confirmPassword = confirmPasswordInput.value ? confirmPasswordInput.value : '';
        
        if (!fullName || !email || !password || !confirmPassword) {
            showMessage('Please fill all fields', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showMessage('Passwords do not match', 'error');
            return;
        }
        
        if (password.length < 6) {
            showMessage('Password must be at least 6 characters', 'error');
            return;
        }
        
        if (!isValidEmail(email)) {
            showMessage('Please enter a valid email address', 'error');
            return;
        }
        
        if (!window.auth) {
            showMessage('Authentication service not available. Please refresh.', 'error');
            return;
        }
        
        try {
            if (signupText) signupText.textContent = 'Creating Account...';
            if (signupSpinner) signupSpinner.classList.remove('hidden');
            if (signupBtn) signupBtn.disabled = true;
            
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            
            if (window.db) {
                try {
                    await db.collection('users').doc(userCredential.user.uid).set({
                        fullName: fullName,
                        email: email,
                        createdAt: new Date()
                    });
                } catch (firestoreError) {
                }
            }
            
            showMessage('Account created successfully! Redirecting...', 'success');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
            
        } catch (error) {
            let message = 'Signup failed. ';
            switch (error.code) {
                case 'auth/email-already-in-use':
                    message += 'Email already exists. Please login.';
                    break;
                case 'auth/weak-password':
                    message += 'Password is too weak.';
                    break;
                case 'auth/invalid-email':
                    message += 'Invalid email address.';
                    break;
                case 'auth/operation-not-allowed':
                    message += 'Email/password accounts are not enabled.';
                    break;
                case 'auth/network-request-failed':
                    message += 'Network error. Check your connection.';
                    break;
                default:
                    message += error.message;
            }
            showMessage(message, 'error');
        } finally {
            if (signupText) signupText.textContent = 'Create Account';
            if (signupSpinner) signupSpinner.classList.add('hidden');
            if (signupBtn) signupBtn.disabled = false;
        }
    });
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showLoading(show) {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        if (show) {
            loadingEl.classList.remove('hidden');
        } else {
            loadingEl.classList.add('hidden');
        }
    }
}

function showMessage(message, type = 'success') {
    const messageEl = document.getElementById('authMessage');
    if (messageEl) {
        messageEl.textContent = message;
        messageEl.className = `message ${type}`;
        messageEl.style.display = 'block';

        if (type === 'success') {
            setTimeout(() => {
                messageEl.style.display = 'none';
            }, 5000);
        }
    }
}