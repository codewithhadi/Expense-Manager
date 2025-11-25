// Auth functionality for login and signup pages with complete error handling
document.addEventListener('DOMContentLoaded', function() {
    console.log("🔐 Auth page loaded");
    
    // Debug: Check all elements on page
    console.log("🔍 DEBUG: Checking all elements on page...");
    const allElements = [
        'signupForm', 'loginForm', 'fullName', 'email', 'password', 
        'confirmPassword', 'signupText', 'signupSpinner', 'authMessage', 'loading'
    ];
    
    allElements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`📝 ${id}:`, element ? '✅ FOUND' : '❌ NOT FOUND');
    });
    
    // Wait for Firebase to initialize
    setTimeout(() => {
        const currentPage = window.location.pathname;
        const isLoginPage = currentPage.includes('index.html') || 
                           currentPage === '/' || 
                           currentPage.endsWith('/');
        
        const isSignupPage = currentPage.includes('signup.html');
        
        console.log("📄 Page detection:", {
            path: currentPage,
            isLoginPage: isLoginPage,
            isSignupPage: isSignupPage
        });
        
        if (isLoginPage) {
            console.log("🔐 Setting up login page");
            setupLoginPage();
        } else if (isSignupPage) {
            console.log("🔐 Setting up signup page");
            setupSignupPage();
        }
    }, 500);
});

function setupLoginPage() {
    console.log("🔐 Initializing login page...");
    
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) {
        console.error("❌ Login form not found");
        showMessage('Login form not available. Please refresh the page.', 'error');
        return;
    }
    
    console.log("✅ Login form found");
    
    // Get all elements with safety checks
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.querySelector('#loginForm .auth-btn');
    const loginText = document.getElementById('loginText');
    const loginSpinner = document.getElementById('loginSpinner');
    
    console.log("📝 Login form elements:", {
        emailInput: !!emailInput,
        passwordInput: !!passwordInput,
        loginBtn: !!loginBtn,
        loginText: !!loginText,
        loginSpinner: !!loginSpinner
    });
    
    if (!emailInput || !passwordInput) {
        console.error("❌ Required login inputs not found");
        showMessage('Email or password field missing. Please refresh.', 'error');
        return;
    }
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("🔐 Login form submitted");
        
        // Get values with null checks
        const email = emailInput.value ? emailInput.value.trim() : '';
        const password = passwordInput.value ? passwordInput.value : '';
        
        console.log("📧 Login attempt:", { email, passwordLength: password.length });
        
        // Validation
        if (!email || !password) {
            showMessage('Please enter both email and password', 'error');
            return;
        }
        
        if (password.length < 6) {
            showMessage('Password must be at least 6 characters', 'error');
            return;
        }
        
        // Check if Firebase auth is available
        if (!window.auth) {
            showMessage('Authentication service not available. Please refresh.', 'error');
            return;
        }
        
        try {
            // Show loading state with safety checks
            if (loginText) loginText.textContent = 'Logging in...';
            if (loginSpinner) loginSpinner.classList.remove('hidden');
            if (loginBtn) loginBtn.disabled = true;
            
            console.log("🔐 Attempting Firebase login...");
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            console.log("✅ Login successful:", userCredential.user.email);
            
            showMessage('Login successful! Redirecting...', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
            
        } catch (error) {
            console.error('❌ Login error:', error);
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
            // Reset button state with safety checks
            if (loginText) loginText.textContent = 'Login';
            if (loginSpinner) loginSpinner.classList.add('hidden');
            if (loginBtn) loginBtn.disabled = false;
        }
    });
    
    // Demo credentials auto-fill
    const demoCredentials = document.querySelector('.demo-credentials');
    if (demoCredentials) {
        demoCredentials.addEventListener('click', (e) => {
            e.preventDefault();
            console.log("👤 Filling demo credentials");
            if (emailInput) emailInput.value = 'demo@expensemanager.com';
            if (passwordInput) passwordInput.value = 'demo123';
            showMessage('Demo credentials filled! Click Login to continue.', 'success');
        });
    }
    
    console.log("✅ Login page setup completed");
}

function setupSignupPage() {
    console.log("🔐 Initializing signup page...");
    
    const signupForm = document.getElementById('signupForm');
    if (!signupForm) {
        console.error("❌ Signup form not found");
        showMessage('Signup form not available. Please refresh the page.', 'error');
        return;
    }
    
    console.log("✅ Signup form found");
    
    // Get all elements with safety checks - MULTIPLE SELECTOR METHODS
    let fullNameInput = document.getElementById('fullName');
    
    // If fullName not found, try alternative selectors
    if (!fullNameInput) {
        console.log("🔄 fullName not found by ID, trying alternatives...");
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
    
    console.log("📝 Signup form elements:", {
        fullNameInput: !!fullNameInput,
        emailInput: !!emailInput,
        passwordInput: !!passwordInput,
        confirmPasswordInput: !!confirmPasswordInput,
        signupBtn: !!signupBtn,
        signupText: !!signupText,
        signupSpinner: !!signupSpinner
    });
    
    // Check if all required inputs exist
    if (!fullNameInput || !emailInput || !passwordInput || !confirmPasswordInput) {
        console.error("❌ Missing signup form inputs");
        console.log("Missing:", {
            fullName: !fullNameInput,
            email: !emailInput,
            password: !passwordInput,
            confirmPassword: !confirmPasswordInput
        });
        
        // Try to find missing elements with different methods
        if (!fullNameInput) {
            console.log("🔍 Searching for fullName input with different methods...");
            const allInputs = document.querySelectorAll('input');
            console.log("All inputs on page:", allInputs);
            
            allInputs.forEach((input, index) => {
                console.log(`Input ${index}:`, {
                    type: input.type,
                    id: input.id,
                    name: input.name,
                    placeholder: input.placeholder
                });
            });
        }
        
        showMessage('Some form fields are missing. Please refresh.', 'error');
        return;
    }
    
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("🔐 Signup form submitted");
        
        // Get values with null checks
        const fullName = fullNameInput.value ? fullNameInput.value.trim() : '';
        const email = emailInput.value ? emailInput.value.trim() : '';
        const password = passwordInput.value ? passwordInput.value : '';
        const confirmPassword = confirmPasswordInput.value ? confirmPasswordInput.value : '';
        
        console.log("📧 Signup attempt:", { 
            fullName, 
            email, 
            passwordLength: password.length,
            confirmPasswordLength: confirmPassword.length 
        });
        
        // Validation
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
        
        // Check if Firebase auth is available
        if (!window.auth) {
            showMessage('Authentication service not available. Please refresh.', 'error');
            return;
        }
        
        try {
            // Show loading state with safety checks
            if (signupText) signupText.textContent = 'Creating Account...';
            if (signupSpinner) signupSpinner.classList.remove('hidden');
            if (signupBtn) signupBtn.disabled = true;
            
            console.log("🔐 Attempting Firebase signup...");
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            console.log("✅ User account created:", userCredential.user.uid);
            
            // Save additional user data to Firestore if available
            if (window.db) {
                try {
                    await db.collection('users').doc(userCredential.user.uid).set({
                        fullName: fullName,
                        email: email,
                        createdAt: new Date() // Use regular Date if Firestore timestamp not available
                    });
                    console.log("✅ User data saved to Firestore");
                } catch (firestoreError) {
                    console.warn("⚠️ Could not save to Firestore:", firestoreError);
                    // Continue even if Firestore fails - user can still use the app
                }
            } else {
                console.warn("⚠️ Firestore not available, skipping user data save");
                // Continue without Firestore - user account is still created
            }
            
            showMessage('Account created successfully! Redirecting...', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
            
        } catch (error) {
            console.error('❌ Signup error:', error);
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
            // Reset button state with safety checks
            if (signupText) signupText.textContent = 'Create Account';
            if (signupSpinner) signupSpinner.classList.add('hidden');
            if (signupBtn) signupBtn.disabled = false;
        }
    });
    
    console.log("✅ Signup page setup completed");
}

// Helper function to validate email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Global utility functions (if not already in firebaseconfig.js)
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
        
        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => {
                messageEl.style.display = 'none';
            }, 5000);
        }
    } else {
        console.warn('Message element (#authMessage) not found');
    }
}