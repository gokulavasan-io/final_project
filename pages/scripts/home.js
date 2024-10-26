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

const allSubjects = document.querySelectorAll(".subjects-container a");

// to find the parameter is found in url or not
function hasQueryParameter(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has(param);
}

const month = getQueryParameter("month");
const section = getQueryParameter("section");
const userName = getQueryParameter("name");
const role = getQueryParameter("role");

document.addEventListener("DOMContentLoaded", function () {
  if (hasQueryParameter("forMonthly")) {
    changePageToMonthly();
  } else {
    changePageToHome();
  }
});

function changePageToMonthly() {
  for (let i = 0; i < allSubjects.length; i++) {
    allSubjects[
      i
    ].href = `../../pages/html/monthlySubject.html?section=${section}&name=${userName}&role=${role}&subject=${allSubjects[i].querySelector("p").innerText}&month=${month}`;
  }
  document.getElementById("pageTitleForMonthlySubject").style.display = "block";
  document.getElementById("seeButtons").style.display = "flex";
  document.querySelector(".main-container").style.top = "20%";
  document.getElementById("whichMonth").innerText = month;
  document.getElementById(
    "attendanceMarks"
  ).href = `../../pages/html/marks.html?pageTitle=Attendance&section=${section}&name=${userName}&role=${role}&dataset=${month}`;
}

function changePageToHome() {
  for (let i = 0; i < allSubjects.length; i++) {
    allSubjects[i].href += `&section=${section}&name=${userName}&role=${role}`;
  }
  document.getElementById(
    "attendanceMarks"
  ).href = `../../pages/html/subjects.html?pageTitle=Attendance&section=${section}&name=${userName}&role=${role}`;
  document.getElementById("changeClass").style.display="flex";

}

function getQueryParameter(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

document.getElementById("changeClass").addEventListener("click", function () {
  document.getElementById("showClassesForLead").style.display = "flex";
});

document.querySelectorAll("#showClassesForLead button").forEach((button) => {
  button.addEventListener("click", (event) => {
    if (event.target.id == "forA") {
      window.location.href = `../../pages/html/home.html?section=ClassA&name=${userName}&role=${role}`;
    } else if (event.target.id == "forB") {
      window.location.href = `../../pages/html/home.html?section=ClassB&name=${userName}&role=${role}`;
    } else {
      window.location.href = `../../pages/html/home.html?section=ClassC&name=${userName}&role=${role}`;
    }
  });
});

