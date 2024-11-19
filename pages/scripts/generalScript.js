// hamburger menu
const hamBurger = document.querySelector(".toggle-btn");
hamBurger.addEventListener("click", function () {
  document.querySelector("#sidebar").classList.toggle("expand");
});
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


const favIcon = document.createElement("link");
favIcon.rel = "icon";
favIcon.type = "image/x-icon";
favIcon.href = "../../assets/images/reportCard_img/ic_fw.png";
document.head.appendChild(favIcon);



document.getElementById("reportCard").style.display="none";
const subjectsAside=document.querySelectorAll(".subjectsAside a");
subjectsAside.forEach(x=>{
  x.addEventListener("click",()=>{
    localStorage.setItem("pageTitle",x.textContent.split(" ").join(""));
    window.location.href="../../pages/html/subjects.html"
  })
});
document.getElementById("attendance").addEventListener("click",()=>{
   localStorage.setItem("pageTitle","Attendance");
  window.location.href="../../pages/html/subjects.html"
})


document.getElementById("logout").addEventListener("click", function () {
  document.getElementById("logout-warning").style.display = "block";
});

document.getElementById("yes").addEventListener("click", function () {
  signOut(auth)
    .then(() => {
      deleteCookie("userLoggedIn"); // Assuming you have a deleteCookie function
      showLogoutMessage();

      // Redirect to index.html and disable back navigation
      setTimeout(() => {
        window.location.replace("../../index.html");
        history.pushState(null, null, "../../index.html");
        window.addEventListener("popstate", function (event) {
          history.pushState(null, null, "../../index.html");
        });
      }, 500);
    })
    .catch((error) => {
      console.log("An error happened.");
    });

  document.getElementById("logout-warning").style.display = "none";
});
function deleteCookie(name) {
  document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

document.getElementById("no").addEventListener("click", function () {
  document.getElementById("logout-warning").style.display = "none";
});

const user = document.getElementById("user");
const userInfo = document.querySelector(".user-info");

user.addEventListener("click", (e) => {
  e.preventDefault();
  if (userInfo.style.display === "none" || userInfo.style.display === "") {
    userInfo.style.display = "flex";
  } else {
    userInfo.style.display = "none";
  }
});

function showLogoutMessage() {
  const message = document.getElementById("logoutMessage");
  message.classList.add("show");
  setTimeout(() => {
    message.classList.remove("show");
  }, 500);
}


const section = localStorage.getItem("section");
const userName = localStorage.getItem("name");
const role = localStorage.getItem("role");

document.getElementById("name").textContent = `${
  userName.charAt(0).toUpperCase() + userName.slice(1)
}`;

if (role == "others") {
  document.getElementById("teacher").textContent = "FSSA";
} else {
  document.getElementById("teacher").textContent = `${role} Coach`;
}

document.getElementById("backButton").addEventListener("click",()=>{
  window.history.back();
});
document.getElementById("analysisNav").addEventListener("click",()=>{
  window.location.href="analysisHome.html"
})

document.getElementById("user").innerText=userName.slice(0,1).toUpperCase();
document.getElementById("classNow").textContent = `${section.split("s")[2]}`;

