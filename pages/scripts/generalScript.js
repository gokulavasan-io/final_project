import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import {
  getFirestore,
  getDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

import firebaseConfig from "../../config.js"



const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore();

document.addEventListener("DOMContentLoaded", () => {
  fetch('../html/asideBar.html')
    .then(response => response.text())
    .then(data => {
      document.getElementById('sidebar').innerHTML = data;

      // Ensure these elements exist after loading the sidebar content
      const hamBurger = document.querySelector(".toggle-btn");
      if (hamBurger) {
        hamBurger.addEventListener("click", function () {
          document.querySelector("#sidebar").classList.toggle("expand");
        });
      }

      const subjectsAside = document.querySelectorAll(".subjectsAside a");
      subjectsAside.forEach((x) => {
        x.addEventListener("click", () => {
          localStorage.setItem("subject", x.textContent.split(" ").join(""));
          window.location.href = "../../pages/html/subjects.html";
        });
      });

      const attendance = document.getElementById("attendance");
      if (attendance) {
        attendance.addEventListener("click", () => {
          localStorage.setItem("subject", "Attendance");
          window.location.href = "../../pages/html/subjects.html";
        });
      }

      const backButton = document.getElementById("backButton");
      if (backButton) {
        backButton.addEventListener("click", () => {
          window.history.back();
        });
      }

      const analysisNav = document.getElementById("analysisNav");
      if (analysisNav) {
        analysisNav.addEventListener("click", () => {
          window.location.href = "analysisHome.html";
        });
      }
    });
});



// check for user is logged in
window.onload = function () {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const docRef = doc(db, "FSSA/users/teachers", user.email);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await signOut(auth);
        console.log("Unauthorized user. Signing out...");
        window.location.href = "../../index.html";
      } else {
        console.log("User is logged in and authorized!");
      }
    } else {
      console.log("No user is logged in.");
      window.location.href = "../../index.html";
    }
  });
};



// favIcon
const favIcon = document.createElement("link");
favIcon.rel = "icon";
favIcon.type = "image/x-icon";
favIcon.href = "../../assets/images/reportCard_img/ic_fw.png";
document.head.appendChild(favIcon);



const userName = localStorage.getItem("userName");
const section = localStorage.getItem("section");
const role = localStorage.getItem("userRole");

if (userName) {
  document.getElementById("user").innerText = userName
    .slice(0, 1)
    .toUpperCase();
}

if (section != "FSSA") {
  document.getElementById("classNow").textContent = section.slice(-1);
} else {
  document.getElementById("classNow").textContent = "All";
}
