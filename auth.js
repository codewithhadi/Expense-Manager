// Auth functionality for login and signup pages
document.addEventListener('DOMContentLoaded', function() {
    const isLoginPage = window.location.pathname.includes('index.html') || 
                       window.location.pathname === '/' || 
                       window.location.pathname.endsWith('/');
    
    const isSignupPage = window.location.pathname.includes('signup.html');
    
    if (isLoginPage) {
        setupLoginPage();
    } else if (isSignupPage) {
        setupSignupPage();
    }
});

function setupLoginPage() {
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const loginBtn = document.querySelector('#loginForm .auth-btn');
        const loginText = document.getElementById('loginText');
        const loginSpinner = document.getElementById('loginSpinner');
        
        if (!email || !password) {
            showMessage('Please enter both email and password', 'error');
            return;
        }
        
        try {
            // Show loading state
            loginText.textContent = 'Logging in...';
            loginSpinner.classList.remove('hidden');
            loginBtn.disabled = true;
            
            await auth.signInWithEmailAndPassword(email, password);
            showMessage('Login successful! Redirecting...', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
            
        } catch (error) {
            console.error('Login error:', error);
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
                default:
                    message += error.message;
            }
            showMessage(message, 'error');
        } finally {
            // Reset button state
            if (loginText) loginText.textContent = 'Login';
            if (loginSpinner) loginSpinner.classList.add('hidden');
            if (loginBtn) loginBtn.disabled = false;
        }
    });
    
    // Demo credentials auto-fill
    const demoCredentials = document.querySelector('.demo-credentials');
    if (demoCredentials) {
        demoCredentials.addEventListener('click', () => {
            document.getElementById('email').value = 'demo@expensemanager.com';
            document.getElementById('password').value = 'demo123';
        });
    }
}

function setupSignupPage() {
    const signupForm = document.getElementById('signupForm');
    
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const signupBtn = document.querySelector('#signupForm .auth-btn');
        const signupText = document.getElementById('signupText');
        const signupSpinner = document.getElementById('signupSpinner');
        
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
        
        try {
            // Show loading state
            signupText.textContent = 'Creating Account...';
            signupSpinner.classList.remove('hidden');
            signupBtn.disabled = true;
            
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            
            // Save additional user data to Firestore
            await db.collection('users').doc(userCredential.user.uid).set({
                fullName: fullName,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            showMessage('Account created successfully! Redirecting...', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
            
        } catch (error) {
            console.error('Signup error:', error);
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
                default:
                    message += error.message;
            }
            showMessage(message, 'error');
        } finally {
            // Reset button state
            if (signupText) signupText.textContent = 'Create Account';
            if (signupSpinner) signupSpinner.classList.add('hidden');
            if (signupBtn) signupBtn.disabled = false;
        }
    });
}