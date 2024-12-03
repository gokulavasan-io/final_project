// Import the necessary functions from Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  child,
  set,
  remove,
} from "https://www.gstatic.com/firebasejs/9.14.0/firebase-database.js";

import firebaseConfig from "../../config.js"



// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const section = localStorage.getItem("section");
const orderedMonths = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
let subject = localStorage.getItem("subject");
document.getElementById("subject").textContent = subject;

// Function to get all existing months from Firebase and render them
function getAllData() {
  const dbRef = ref(database, `/FSSA/${section}`);
  // Fetch existing months from Firebase
  get(dbRef)
    .then((snapshot) => {
      const container = document.querySelector(".marks-container");

      // Clear existing months from UI before fetching new ones
      const existingMonths = container.querySelectorAll(".marks-detail");
      existingMonths.forEach((monthDiv) => monthDiv.remove());

      if (snapshot.exists()) {
        const months = snapshot.val();
        const monthNames = Object.keys(months); // Get the month names

        // Sort the month names based on the orderedMonths array
        monthNames.sort(
          (a, b) => orderedMonths.indexOf(a) - orderedMonths.indexOf(b)
        );

        monthNames.forEach((month) => {
          appendMonthToUI(month, container);
        });
        document.getElementById("loading").style.display = "none";
      } else {
        alert("No months available in the database");
        document.getElementById("loading").style.display = "none";

      }
    })
    .catch((error) => {
      console.error("Error fetching data from Firebase:", error);
    });
}

// Append a new month to the marks container
function appendMonthToUI(monthName, container) {
  const div = document.createElement("div");
  div.classList.add("marks-detail");

  const pElement = document.createElement("p");
  pElement.innerText = monthName;

  div.appendChild(pElement);

  div.addEventListener("click", function (event) {
    event.stopPropagation();
    localStorage.setItem("month", div.textContent.trim());
    if (subject == "Attendance") {
      window.location.href = "../../pages/html/attendance.html";
    } else {
      window.location.href = "../../pages/html/monthlySubjectMarks.html";
    }
  });
  container.appendChild(div);
}

document.addEventListener("DOMContentLoaded",()=>{
getAllData()

})