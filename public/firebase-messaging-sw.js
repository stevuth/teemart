// public/firebase-messaging-sw.js

// Scripts for firebase and firebase messaging
importScripts("https://www.gstatic.com/firebasejs/9.2.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.2.0/firebase-messaging-compat.js");

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
// Note: This config must be present and valid.
const firebaseConfig = {
  apiKey: "AIzaSyCcD2gznrLLhDtvW1aQ06mg_4d_pVsh7WI",
  authDomain: "teemart-notifications.firebaseapp.com",
  projectId: "teemart-notifications",
  storageBucket: "teemart-notifications.firebasestorage.app",
  messagingSenderId: "936326547408",
  appId: "1:936326547408:web:db845288c18b7fe3569bd5",
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo-192.png' // A default icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
