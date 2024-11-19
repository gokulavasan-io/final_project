import { initializeApp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js";

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

// Check if the user is already logged in on page load
window.onload = function () {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      window.location.replace("pages/html/home.html");
    } else {
      console.log("User is not logged in.");
      window.history.pushState(null, null, window.location.href);
      window.addEventListener("popstate", function () {
      window.history.pushState(null, null, window.location.href);
      });
    }
  });
};

// Handle login form submission
document.getElementById("login").addEventListener("submit", function (event) {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const selectedClass = document.querySelector(
    'input[name="sectionName"]:checked'
  ).id;
  const role = document.querySelector('input[name="role"]:checked').id;
  const userName = document.getElementById("userName").value;

  const usernameRegex = /^[a-zA-Z0-9_.]+$/;
  if(!usernameRegex.test(userName)){
    showErrorMessage("Enter a valid username",2000);
    return ;
  }

  // Set persistence to 'local' to keep the user logged in
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      return signInWithEmailAndPassword(auth, email, password);
    })
    .then((userCredential) => {
      const user = userCredential.user;
      console.log(user);

      // Save user info in localStorage if needed for other parts of the app
      localStorage.setItem("section", selectedClass);
      localStorage.setItem("name", userName);
      localStorage.setItem("role", role);
      localStorage.setItem("email", email);

      // Show success message and redirect after a delay
      showSuccessMessage();
      setTimeout(() => {
        window.location.href = "pages/html/home.html";
      }, 500);
    })
    .catch((error) => {
      console.log(error.message);
      showErrorMessage("Invalid email or password. Please try again.",2000);
    });
});

// Function to display success message
function showSuccessMessage() {
  const message = document.getElementById("successMessage");
  message.classList.add("show");
  setTimeout(() => {
    message.classList.remove("show");
  }, 500);
}

// Function to display error message
function showErrorMessage(str,time) {
  const errorPopup = document.getElementById("error-message");
  errorPopup.innerText=str;
  errorPopup.style.display = "block";
  setTimeout(() => {
    errorPopup.style.display = "none";
  }, time);
}


document.getElementById("forget").addEventListener("click", () => {
  document.getElementById("forgetPassword").style.display = "flex";
});

function forgotPassword(email) {
  sendPasswordResetEmail(auth, email)
    .then(() => {
      console.log("Password reset email sent successfully!");
      showSuccessMessage("Password reset email sent. Please check your inbox");
    })
    .catch((error) => {
      console.error("Error sending password reset email:", error.message);
      alert("Error: " + error.message);
    });
  document.getElementById("forgetPassword").style.display = "flex";
}

document.getElementById("getEmail").addEventListener("click", () =>{
  const email = document.getElementById("forgetEmail").value;
  if (email === "") {
    showErrorMessage("Please enter a valid email",2000)
  } else {
    forgotPassword(email);
  }
});

document.getElementById("close").addEventListener("click",()=>{
  document.getElementById("forgetPassword").style.display = "none";
})

const userName = document.getElementById("userName");
userName.addEventListener("input", function() {
  const usernameRegex = /^[a-zA-Z0-9_.]+$/; 
  const userNameInput = document.getElementById("userName").value;
  if (userNameInput&&!usernameRegex.test(userNameInput)) {
    showErrorMessage("Name should only contain alphabets, '.', and '_'", 2000);
    return;
  }
});
