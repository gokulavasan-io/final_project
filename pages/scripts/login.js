import { initializeApp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDROuHKj-0FhMQbQtPVeEGVb4h89oME5T0",
  authDomain: "fir-demo-4a5b4.firebaseapp.com",
  projectId: "fir-demo-4a5b4",
  storageBucket: "fir-demo-4a5b4",
  messagingSenderId: "716679557063",
  appId: "1:716679557063:web:603a78f59045ceeaf133e2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();

// On page load, check if the user is already logged in and retrieve URL parameters from cookies
window.onload = function () {
  const userToken = getCookie("userLoggedIn");
  const section = getCookie("section");
  const name = getCookie("name");
  const role = getCookie("role");
  const email = getCookie("email");

  if (userToken && section && name && role && email) {
    window.location.href = `pages/html/home.html?section=${section}&name=${name}&role=${role}&email=${email}`;
  }
};

document.getElementById("login").addEventListener("submit", function (event) {
  event.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const selectedClass = document.querySelector('input[name="sectionName"]:checked').id;
  const role = document.querySelector('input[name="role"]:checked').id;
  const userName = document.getElementById("userName").value;

  // Sign in the user using Firebase Auth
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      console.log(user);

      setCookie("userLoggedIn", true, 30); 
      setCookie("section", selectedClass, 30);
      setCookie("name", userName, 30);
      setCookie("role", role, 30);
      setCookie("email", email, 30);

      showSuccessMessage();
      setTimeout(() => {
        window.location.href = `pages/html/home.html?section=${selectedClass}&name=${userName}&role=${role}&email=${email}`;
      }, 500);
    })
    .catch((error) => {
      console.log(error.message);
      showErrorMessage();
    });
});

// Helper functions to handle cookies
function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = name + "=" + encodeURIComponent(value) + "; expires=" + expires + "; path=/";
}

function getCookie(name) {
  return document.cookie.split("; ").reduce((r, v) => {
    const parts = v.split("=");
    return parts[0] === name ? decodeURIComponent(parts[1]) : r;
  }, "");
}

// Function to display success message
function showSuccessMessage() {
  const message = document.getElementById("successMessage");
  message.classList.add("show");
  setTimeout(() => {
    message.classList.remove("show");
  }, 500);
}

// Function to display error message
function showErrorMessage() {
  const errorPopup = document.getElementById("error-message");
  errorPopup.style.display = "block";
  setTimeout(() => {
    errorPopup.style.display = "none";
  }, 500);
}
