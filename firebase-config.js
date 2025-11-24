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
let auth = null;
let db = null;

function initializeFirebase() {
    try {
        console.log("🚀 Initializing Firebase...");
        
        // Check if Firebase is available
        if (typeof firebase === 'undefined') {
            throw new Error("Firebase SDK not loaded. Check script tags.");
        }
        
        console.log("📦 Firebase version:", firebase.SDK_VERSION);
        console.log("🔧 Available services:", Object.keys(firebase));
        
        // Check if Firebase app is already initialized
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log("✅ Firebase App initialized successfully");
        } else {
            console.log("✅ Firebase App already initialized");
        }

        // Initialize Auth
        if (typeof firebase.auth === 'function') {
            auth = firebase.auth();
            console.log("✅ Firebase Auth initialized");
        } else {
            console.error("❌ Firebase Auth not available");
        }

        // Initialize Firestore
        if (typeof firebase.firestore === 'function') {
            db = firebase.firestore();
            console.log("✅ Firestore initialized");
            
            // Optional: Enable offline persistence
            try {
                db.enablePersistence()
                    .then(() => console.log("✅ Offline persistence enabled"))
                    .catch(err => console.log("⚠️ Offline persistence not supported:", err));
            } catch (persistenceError) {
                console.log("⚠️ Offline persistence error:", persistenceError);
            }
            
        } else {
            console.error("❌ Firestore not available - check if firebase-firestore.js is loaded");
            // Try alternative initialization
            if (typeof firebase.firestore === 'object') {
                db = firebase.firestore();
                console.log("✅ Firestore initialized (alternative method)");
            }
        }

        // Setup auth state listener only if auth is available
        if (auth) {
            setupAuthListener();
        }

    } catch (error) {
        console.error("❌ Firebase initialization error:", error);
        showMessage('Firebase initialization failed. Please refresh the page.', 'error');
    }
}

function setupAuthListener() {
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
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            }
        } else {
            // User is signed out
            if (currentPage.includes('dashboard.html')) {
                console.log("🔄 Redirecting to login...");
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            }
        }
    });
}

// Initialize Firebase when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 DOM loaded, initializing Firebase...");
    initializeFirebase();
});

// Also initialize if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFirebase);
} else {
    initializeFirebase();
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
window.firebaseConfig = firebaseConfig;