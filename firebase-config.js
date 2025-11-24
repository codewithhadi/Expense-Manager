// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAr92CYaR0ymSXvoizlffGbA0fGZUkLl7k",
    authDomain: "expense-mananger-2a6c4.firebaseapp.com",
    projectId: "expense-mananger-2a6c4",
    storageBucket: "expense-mananger-2a6c4.firebasestorage.app",
    messagingSenderId: "48553291222",
    appId: "1:48553291222:web:8c1585bb1a17fd133d8877",
    measurementId: "G-XB5MLJ95MW"
};

// Global variables
let auth, db;

try {
    console.log("🚀 Initializing Firebase...");
    
    // Check if Firebase is available
    if (typeof firebase === 'undefined') {
        throw new Error("Firebase SDK not loaded. Check script tags.");
    }
    
    // Check if Firebase app is already initialized
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log("✅ Firebase initialized successfully");
    } else {
        firebase.app(); // Use existing app
        console.log("✅ Firebase already initialized");
    }

    // Initialize services with safety checks
    if (typeof firebase.auth === 'function') {
        auth = firebase.auth();
        console.log("✅ Firebase Auth initialized");
    } else {
        throw new Error("Firebase Auth not available");
    }

    if (typeof firebase.firestore === 'function') {
        db = firebase.firestore();
        console.log("✅ Firestore initialized");
        
        // Enable offline persistence (optional)
        db.enablePersistence()
            .then(() => console.log("✅ Offline persistence enabled"))
            .catch(err => console.log("❌ Offline persistence error:", err));
            
    } else {
        throw new Error("Firestore not available");
    }

} catch (error) {
    console.error("❌ Firebase initialization error:", error);
    showMessage('Firebase initialization failed. Please refresh the page.', 'error');
}

// Firebase Auth state observer
if (auth) {
    auth.onAuthStateChanged((user) => {
        console.log("🔐 Auth state changed:", user ? user.email : "No user");
        
        const currentPage = window.location.pathname;
        
        if (user) {
            // User is signed in
            if (currentPage.includes('index.html') || 
                currentPage.includes('signup.html') ||
                currentPage === '/' || 
                currentPage.endsWith('/')) {
                console.log("🔄 Redirecting to dashboard...");
                window.location.href = 'dashboard.html';
            }
        } else {
            // User is signed out
            if (currentPage.includes('dashboard.html')) {
                console.log("🔄 Redirecting to login...");
                window.location.href = 'index.html';
            }
        }
    });
} else {
    console.error("❌ Auth service not available for state observer");
}

// Utility functions
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

function showMessage(message, type = 'success', elementId = 'authMessage') {
    const messageEl = document.getElementById(elementId);
    if (messageEl) {
        messageEl.textContent = message;
        messageEl.className = `message ${type}`;
        messageEl.style.display = 'block';
        
        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => {
                messageEl.textContent = '';
                messageEl.className = 'message';
                messageEl.style.display = 'none';
            }, 5000);
        }
    } else {
        console.warn(`Message element #${elementId} not found`);
    }
}

// Make services globally available
window.auth = auth;
window.db = db;