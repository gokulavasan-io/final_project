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

const role = localStorage.getItem("role");

document.addEventListener("DOMContentLoaded", function () {
  if (role == "others") {
    document.getElementById("changeClass").style.display = "flex";
  }
});

document.getElementById("changeClass").addEventListener("click", function () {
  document.getElementById("showClassesForLead").style.display = "flex";
});

document.querySelectorAll("#showClassesForLead button").forEach((button) => {
  button.addEventListener("click", (event) => {
    if (event.target.id == "forA") {
      localStorage.setItem("section", "ClassA");
    } else if (event.target.id == "forB") {
      localStorage.setItem("section", "ClassB");
    } else {
      localStorage.setItem("section", "ClassC");
    }
    window.location.href = "../../pages/html/home.html";
  });
});
