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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

// Firebase Auth state observer
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

// Utility functions
function showLoading(show) {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.classList.toggle('hidden', !show);
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
try {
    // Check if Firebase app is already initialized
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log("✅ Firebase initialized successfully");
    } else {
        firebase.app(); // if already initialized, use that app
        console.log("✅ Firebase already initialized");
    }

    // Initialize services with safety checks
    if (typeof firebase.auth !== 'undefined') {
        const auth = firebase.auth();
        console.log("✅ Firebase Auth initialized");
    } else {
        console.error("❌ Firebase Auth not available");
    }

    if (typeof firebase.firestore !== 'undefined') {
        const db = firebase.firestore();
        console.log("✅ Firestore initialized");
    } else {
        console.error("❌ Firestore not available");
    }

} catch (error) {
    console.error("❌ Firebase initialization error:", error);
}

