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
    if (user) {
        console.log("User logged in:", user.email);
        if (window.location.pathname.includes('index.html') || 
            window.location.pathname.includes('signup.html')) {
            window.location.href = 'dashboard.html';
        }
    } else {
        console.log("User logged out");
        if (window.location.pathname.includes('dashboard.html')) {
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
        
        if (type === 'success') {
            setTimeout(() => {
                messageEl.textContent = '';
                messageEl.className = 'message';
            }, 5000);
        }
    }
}