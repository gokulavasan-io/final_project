// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-analytics.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDROuHKj-0FhMQbQtPVeEGVb4h89oME5T0",
  authDomain: "fir-demo-4a5b4.firebaseapp.com",
  projectId: "fir-demo-4a5b4",
  storageBucket: "fir-demo-4a5b4.appspot.com",
  messagingSenderId: "716679557063",
  appId: "1:716679557063:web:603a78f59045ceeaf133e2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth();

document.getElementById("login").addEventListener("submit", function () {
  event.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const selectedClass = document.querySelector(
    'input[name="sectionName"]:checked'
  ).id;
  const role = document.querySelector('input[name="role"]:checked').id;
  const userName = document.getElementById("userName").value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      console.log(user);

      showSuccessMessage();
      setTimeout(() => {
        window.location.href = `pages/html/home.html?section=${selectedClass}&name=${userName}&role=${role}`;
      }, 100);
    })
    .catch((error) => {
      const errorMessage = error.message;
      console.log(errorMessage);
      showErrorMessage();
    });
});

function showSuccessMessage() {
  const message = document.getElementById("successMessage");
  message.classList.add("show");
  setTimeout(() => {
    message.classList.remove("show");
  }, 500);
}

function showErrorMessage() {
  const errorPopup = document.getElementById("error-message");
  errorPopup.style.display = "block";
  setTimeout(() => {
    errorPopup.style.display = "none";
  }, 500);
}
