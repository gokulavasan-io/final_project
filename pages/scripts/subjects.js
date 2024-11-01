// Import the necessary functions from Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  child,
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

const pageTitle=localStorage.getItem("pageTitle");
const section=localStorage.getItem("section");
let deleteMode = false;
const deleteBtn = document.getElementById("delete-btn");

// Function to get all dataset names from Firebase and render them
function getAllData() {
  const subject_name = document.getElementById("page-name").innerText;
  
  const dbRef = ref(database);
  const dataPath = `studentMarks/${section}/${subject_name}`;

  // Fetch dataset names from Firebase
  get(child(dbRef, dataPath))
    .then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const datasetNames = Object.keys(data); // Get dataset keys (names)
        const container = document.querySelector(".marks-container");

        // For each dataset, create a div and populate it with the name and a checkbox
        datasetNames.forEach((name) => {
          const div = document.createElement("div");
          div.classList.add("marks-detail");

          const pElement = document.createElement("p");
          pElement.innerText = name;

          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.classList.add("dataset-checkbox");
          checkbox.value = name;
          checkbox.style.display = "none"; // Initially hide the checkboxes

          // Append the checkbox and dataset name to the div
          div.appendChild(checkbox);
          div.appendChild(pElement);

          // Add click event listener to the div
          div.addEventListener("click", function (e) {
            if (!deleteMode && e.target !== checkbox) {
              if(pageTitle=="Attendance"){
                localStorage.setItem("dataSet",div.innerText);
                window.location.href="./attendance.html?new=no"
              }else{
                localStorage.setItem("dataSet",div.innerText);
                window.location.href = "marks.html";
              }
            } else if (deleteMode) {
              // Toggle the checkbox state and background color in delete mode
              checkbox.checked = !checkbox.checked;
              div.style.backgroundColor = checkbox.checked ? "#e73232" : "";
            }
          });

          // Append the div to the container
          container.appendChild(div);
        });

        // Add click event listener for delete button
        deleteBtn.addEventListener("click", function () {
          if (!deleteMode) {
            // Enter delete mode: show checkboxes and change button text
            deleteMode = true;
            deleteBtn.innerText = "Delete Selected";
          } else {
            // If in delete mode, confirm before deleting
            confirmDeletion();
          }
        });
      } else {
        console.log("No data available in that data");
        const container = document.querySelector(".marks-container");
        const div = document.createElement("div");
        div.classList.add("marks-detail");
        const pElement = document.createElement("p");
        pElement.innerText = "No data";
        container.appendChild(pElement);
        div.appendChild(pElement);
        container.appendChild(div);
      }
    })
    .catch((error) => {
      console.error("Error fetching data from Firebase:", error);
    });
}

// Function to confirm deletion
function confirmDeletion() {
  const selectedCheckboxes = document.querySelectorAll(
    ".dataset-checkbox:checked"
  );

  if (selectedCheckboxes.length > 0) {
    // Show confirmation dialog
    const confirmation = confirm(
      "Are you sure you want to delete the selected Marks?"
    );

    if (confirmation) {
      // If user confirms, proceed to delete
      deleteSelectedDatasets();
    } else {
      console.log("Deletion canceled.");
    }
    deleteMode=false;
    deleteBtn.innerText = "Delete";

  } else {
    alert("No Marks selected for deletion.");
    deleteMode=false;
    deleteBtn.innerText = "Delete";
  }
}

// Function to delete selected datasets
function deleteSelectedDatasets() {
  const subject_name = document.getElementById("page-name").innerText;
  const section = localStorage.getItem("section");

  const selectedCheckboxes = document.querySelectorAll(
    ".dataset-checkbox:checked"
  );
  const dbRef = ref(database);

  selectedCheckboxes.forEach((checkbox) => {
    const datasetName = checkbox.value;
    const datasetRef = ref(
      database,
      `studentMarks/${section}/${subject_name}/${datasetName}`
    );

    // Remove the dataset from Firebase
    remove(datasetRef)
      .then(() => {
        console.log(`Deleted dataset: ${datasetName}`);
        checkbox.parentElement.remove(); // Remove the dataset div from the UI
      })
      .catch((error) => {
        console.error(`Failed to delete dataset: ${datasetName}`, error);
      });
  });
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("page-title").innerText = pageTitle;
  document.getElementById("page-name").innerText = pageTitle;
  if (pageTitle == "Attendance") {
    document.getElementById("new-mark").innerText = `New`;
    document.getElementById(
      "new"
    ).href = `./attendance.html?new=yes`;
    localStorage.setItem("pageTitle",pageTitle);
  } else {
    document.getElementById(
      "new"
    ).href = `./mark-generate.html`;
    localStorage.setItem("pageTitle",pageTitle);
  }
  getAllData();
});

