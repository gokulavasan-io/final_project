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

// Your Firebase configuration
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
const database = getDatabase(app);
const section = localStorage.getItem("section");
const orderedMonths = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
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
        console.log("No months available in the database");
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
      window.location.href = "../../pages/html/monthlyResult.html";
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
      const confirmation = confirm(
        "Are you sure you want to delete the selected months?"
      );
      if (confirmation) {
        selectedCheckboxes.forEach((checkbox) => {
          const monthName = checkbox.value;
          const monthRef = ref(
            database,
            `/FSSA/${section}/${monthName}`
          );
          remove(monthRef)
            .then(() => {
              checkbox.parentElement.remove();
              showSuccessMessage("deleted successfully !!!");
            })
            .catch((error) => {
              console.error("Failed to delete month:", monthName, error);
            });
        });
      }
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

// Confirm button functionality
document.getElementById("confirm").addEventListener("click", function () {
  const monthInput = capitalizeFirstLetter(
    document.getElementById("newMonth").value.trim()
  );
  if (monthInput) {
    const monthRef = ref(
      database,
      `/FSSA/${section}/${monthInput}`
    );
    set(monthRef, true)
      .then(() => {
        showSuccessMessage("added new month !!!");
        const container = document.querySelector(".marks-container");
        appendMonthToUI(monthInput, container, false);
        document.getElementById("newMonth").value = "";
        document.getElementById("forNewMonth").style.display = "none";
      })
      .catch((error) => {
        console.error("Error adding month:", error);
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

// Fetch existing months on page load
getAllData();

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
