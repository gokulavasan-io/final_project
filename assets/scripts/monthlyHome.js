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

import firebaseConfig from "../../config.js";


import * as constValues from "../scripts/constValues.js"

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

        // For each month, create a div and populate it with the month name and a checkbox
        monthNames.forEach((month) => {
          appendMonthToUI(month, container, false);
        });
 
        document.getElementById("loading").style.display = "none";
      } else {
      
        document.getElementById("loading").style.display = "none";
      }
    })
    .catch((error) => {
      console.error("Error fetching data from Firebase:", error);
    });
}

// Append a new month to the marks container
function appendMonthToUI(monthName, container, showCheckbox) {
  const div = document.createElement("div");
  div.classList.add("marks-detail");

  const pElement = document.createElement("p");
  pElement.innerText = monthName;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.classList.add("delete-checkbox");
  checkbox.value = monthName;
  checkbox.style.display = showCheckbox ? "inline-block" : "none";

  // Append the checkbox and month name to the div
  div.appendChild(checkbox);
  div.appendChild(pElement);

  // Add click event for delete mode or navigation based on deleteMode status
  div.addEventListener("click", function (event) {
    event.stopPropagation();

    if (deleteMode) {
      // Toggle checkbox and background color in delete mode
      checkbox.checked = !checkbox.checked;
      div.style.backgroundColor = checkbox.checked ? "#e73232" : "";
    } else {
      localStorage.setItem("month", checkbox.value);
      window.location.href =constValues.monthlyResultPath;
    }
  });
  container.appendChild(div);

}

// Variable to track delete mode
let deleteMode = false;

// Add event listener for the delete button
document.getElementById("delete-btn").addEventListener("click", function () {
  const selectedCheckboxes = document.querySelectorAll(
    ".delete-checkbox:checked"
  );

  if (!deleteMode) {
    // Enter delete mode
    deleteMode = true;
    this.innerText = "Delete Selected";
  } else {
    // If in delete mode, confirm deletion
    if (selectedCheckboxes.length > 0) {
      if (selectedCheckboxes.length > 1) {
        document.querySelector(".warningText").innerText =
          "Are you sure want to delete these months ?";
      }
      document.getElementById("deleteWarning").style.display = "flex";
      document.getElementById("deleteYes").addEventListener("click", () => {
        document.getElementById("deleteWarning").style.display = "none";
        selectedCheckboxes.forEach((checkbox) => {
          const monthName = checkbox.value;
          const monthRef = ref(database, `/FSSA/${section}/${monthName}`);
          remove(monthRef)
            .then(() => {
              checkbox.parentElement.remove();
              showSuccessMessage("deleted successfully !!!");
            })
            .catch((error) => {
              console.error("Failed to delete month:", monthName, error);
            });
        });
      });
      document.getElementById("deleteNo").addEventListener("click", () => {
        document.getElementById("deleteWarning").style.display = "none";
      });
    } else {
      alert("No months selected for deletion.");
    }
    // Exit delete mode after deletion
    deleteMode = false;
    this.innerText = "Delete";
    document.querySelectorAll(".delete-checkbox").forEach((checkbox) => {
      checkbox.checked = false;
      checkbox.parentElement.style.backgroundColor = ""; // Reset background color
    });
  }
});

// Add functionality to create new month with a popup
document.getElementById("new").addEventListener("click", function (e) {
  e.preventDefault();
  document.getElementById("forNewMonth").style.display = "flex";
});

document.getElementById("confirm").addEventListener("click", function () {
  const monthInput = capitalizeFirstLetter(
    document.getElementById("newMonth").value.trim()
  );
  if(monthInput==""||!orderedMonths.includes(monthInput)){
    showErrorMessage("Please enter a valid month",3000);
    return;
  }

  if (monthInput) {
    const monthRef = ref(database, `/FSSA/${section}/${monthInput}`);

    // Check if the month already exists
    get(monthRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          showErrorMessage("Month already exists!",3000);
        } else {
          // Add the new month since it doesn't exist
          set(monthRef, true)
            .then(() => {
              showSuccessMessage("Added new month !!!");
              const container = document.querySelector(".marks-container");
              appendMonthToUI(monthInput, container, false);
              document.getElementById("newMonth").value = "";
              document.getElementById("forNewMonth").style.display = "none";
            })
            .catch((error) => {
              console.error("Error adding month:", error);
            });
        }
      })
      .catch((error) => {
        console.error("Error checking month existence:", error);
      });
  } else {
    alert("Please enter a valid month name.");
  }
});


// Cancel button functionality
document.getElementById("cancel").addEventListener("click", function () {
  document.getElementById("forNewMonth").style.display = "none";
  document.getElementById("newMonth").value = "";
});


document.addEventListener("DOMContentLoaded",()=>{
  checkOrCreateMonth();
  getAllData();
})

async function checkOrCreateMonth() {
  const month = getCurrentMonth();
  const attendancePath = `/FSSA/${section}/${month}`;
  const attendanceRef = ref(database, attendancePath);
  const attendanceSnap = await get(attendanceRef);

  if(!attendanceSnap.exists()){
    await set(attendanceRef, { Attendance: true });
    console.log(`${month} has been created in Firebase.`);
    location.reload();
  }
else{
  console.log(`${month} already in attendance`);
  
}}
function getCurrentMonth() {
  return orderedMonths[new Date().getMonth()];
}


function showSuccessMessage(str) {
  const message = document.getElementById("successMessage");
  message.innerText = str;
  message.classList.add("show");
  setTimeout(() => {
    message.classList.remove("show");
  }, 1000);
}

function capitalizeFirstLetter(val) {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1);
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