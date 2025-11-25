
const firebaseConfig = {
    apiKey: "AIzaSyAr92CYaR0ymSXvoizlffGbA0fGZUkLl7k",
    authDomain: "expense-mananger-2a6c4.firebaseapp.com",
    projectId: "expense-mananger-2a6c4",
    storageBucket: "expense-mananger-2a6c4.firebasestorage.app",
    messagingSenderId: "48553291222",
    appId: "1:48553291222:web:8c1585bb1a17fd133d8877",
    measurementId: "G-XB5MLJ95MW"
};


let auth = null;
let db = null;
let firebaseInitialized = false;



try {

    if (typeof firebase === 'undefined') {
        throw new Error('Firebase SDK not loaded!');
    }


    const firebaseApp = firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized successfully');


    const auth = firebase.auth();
    const db = firebase.firestore();
    
    console.log('✅ Firebase services initialized');

    window.auth = auth;
    window.db = db;
    
} catch (error) {
    console.error('❌ Firebase initialization failed:', error);

    window.auth = {
        onAuthStateChanged: (callback) => {
            console.warn('Firebase not available - using dummy auth');
            callback(null);
        },
        signOut: () => Promise.resolve()
    };
    window.db = {
        collection: () => ({
            add: () => Promise.resolve({ id: 'dummy-id' }),
            doc: () => ({
                delete: () => Promise.resolve()
            }),
            where: () => ({
                orderBy: () => ({
                    get: () => Promise.resolve({ forEach: () => {} })
                }),
                get: () => Promise.resolve({ forEach: () => {} })
            })
        })
    };
}

window.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 Starting Firebase initialization...");
    initializeFirebaseWithRetry();
});

function initializeFirebaseWithRetry() {
    let retryCount = 0;
    const maxRetries = 3;
    
    const tryInitialize = () => {
        retryCount++;
        console.log(`🔄 Attempt ${retryCount} to initialize Firebase...`);
        
        if (initializeFirebase()) {
            console.log("✅ Firebase initialized successfully!");
            return true;
        }
        
        if (retryCount < maxRetries) {
            console.log(`⏳ Retrying in 1 second... (${retryCount}/${maxRetries})`);
            setTimeout(tryInitialize, 1000);
        } else {
            console.error("❌ Failed to initialize Firebase after multiple attempts");
            showMessage('Firebase initialization failed. Please refresh the page.', 'error');
        }
        return false;
    };
    
    tryInitialize();
}

function initializeFirebase() {
    try {
        console.log("🔍 Checking Firebase availability...");
        

        if (typeof firebase === 'undefined') {
            console.log("📥 Firebase not loaded, loading scripts...");
            loadFirebaseScripts();
            return false;
        }
        
        console.log("✅ Firebase SDK found");
        

        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log("✅ Firebase App initialized");
        }
        

        auth = firebase.auth();
        console.log("✅ Firebase Auth initialized");
        

        if (typeof firebase.firestore === 'function') {
            db = firebase.firestore();
            console.log("✅ Firestore initialized (function approach)");
        } else if (firebase.firestore) {
            db = firebase.firestore();
            console.log("✅ Firestore initialized (direct approach)");
        } else {
            console.log("❌ Firestore not available in firebase object");
            console.log("Available methods:", Object.keys(firebase));
            loadFirestoreScript();
            return false;
        }
        

        if (db) {
            console.log("🔧 Firestore instance created:", typeof db);
            

            window.auth = auth;
            window.db = db;
            window.firebaseApp = firebase.app();
            
            firebaseInitialized = true;
            setupAuthListener();
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error("❌ Firebase initialization error:", error);
        return false;
    }
}

function loadFirebaseScripts() {
    console.log("📥 Loading Firebase scripts dynamically...");
    

    const scripts = [
        'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
        'https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js', 
        'https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js'
    ];
    
    loadScriptsSequentially(scripts, function() {
        console.log("✅ All Firebase scripts loaded");
        setTimeout(initializeFirebaseWithRetry, 500);
    });
}

function loadScriptsSequentially(scripts, callback) {
    if (scripts.length === 0) {
        callback();
        return;
    }
    
    const script = document.createElement('script');
    script.src = scripts[0];
    script.onload = function() {
        console.log(`✅ Loaded: ${scripts[0]}`);
        loadScriptsSequentially(scripts.slice(1), callback);
    };
    script.onerror = function() {
        console.error(`❌ Failed to load: ${scripts[0]}`);

        loadScriptsSequentially(scripts.slice(1), callback);
    };
    
    document.head.appendChild(script);
}

function loadFirestoreScript() {
    console.log("📥 Loading Firestore script separately...");
    
    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js';
    
    script.onload = function() {
        console.log("✅ Firestore script loaded successfully");
        setTimeout(() => {
            if (typeof firebase.firestore === 'function') {
                db = firebase.firestore();
                console.log("✅ Firestore initialized after separate load");
                window.db = db;
                firebaseInitialized = true;
            }
        }, 100);
    };
    
    script.onerror = function() {
        console.error("❌ Failed to load Firestore script");

        loadFirestoreAlternative();
    };
    
    document.head.appendChild(script);
}

function loadFirestoreAlternative() {
    console.log("🔄 Trying alternative Firestore CDN...");
    
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/firebase/8.10.1/firebase-firestore.min.js';
    
    script.onload = function() {
        console.log("✅ Firestore loaded from alternative CDN");
        setTimeout(() => {
            if (typeof firebase.firestore === 'function') {
                db = firebase.firestore();
                console.log("✅ Firestore initialized from alternative CDN");
                window.db = db;
                firebaseInitialized = true;
            }
        }, 100);
    };
    
    script.onerror = function() {
        console.error("❌ All Firestore CDNs failed");
        showMessage('Cannot connect to database. Some features may not work.', 'error');
    };
    
    document.head.appendChild(script);
}

function setupAuthListener() {
    if (!auth) {
        console.error("❌ Auth not available for listener");
        return;
    }
    
    auth.onAuthStateChanged((user) => {
        console.log("🔐 Auth state changed:", user ? `User: ${user.email}` : "No user");
        
        const currentPage = window.location.pathname;
        
        if (user) {

            if (currentPage.includes('index.html') || currentPage.includes('signup.html')) {
                console.log("🔄 Redirecting to dashboard...");
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            }
        } else {

            if (currentPage.includes('dashboard.html')) {
                console.log("🔄 Redirecting to login...");
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            }
        }
    });
}

function showLoading(show) {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.classList.toggle('hidden', !show);
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


window.firebaseConfig = {
    auth: auth,
    db: db,
    initialized: firebaseInitialized
};