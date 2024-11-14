import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  child,
  set,
  remove,
} from "https://www.gstatic.com/firebasejs/9.14.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDROuHKj-0FhMQbQtPVeEGVb4h89oME5T0",
  authDomain: "fir-demo-4a5b4.firebaseapp.com",
  projectId: "fir-demo-4a5b4",
  storageBucket: "fir-demo-4a5b4.appspot.com",
  messagingSenderId: "716679557063",
  appId: "1:716679557063:web:603a78f59045ceeaf133e2",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const pageTitle = localStorage.getItem("pageTitle");
const section = localStorage.getItem("section");
let deleteMode = false;
let month;
const deleteBtn = document.getElementById("delete-btn");
const newMarkBtn = document.getElementById("new-mark");


function getAllData() {
  const subject_name = document.getElementById("page-name").innerText;
  const dataPath = `studentMarks/${section}/${subject_name}`;
  const container = document.querySelector(".marks-container");

  // Clear existing data to avoid duplicates
  container.innerHTML = "";

  // Add the "New Marks" div at the beginning
  const newDiv = document.createElement("div");
  newDiv.classList.add("new-marks-detail");

  const newPElement = document.createElement("p");
  if (pageTitle === "Attendance") {
    newPElement.innerText = "New";
  } else {
    newPElement.innerText = "New Marks";
  }
  
  const addSymbol = document.createElement("i");
  addSymbol.classList.add("fa", "fa-plus");
  // Append the "New Marks" div to the container
  newDiv.appendChild(addSymbol);
  newDiv.appendChild(newPElement);
  container.appendChild(newDiv);


  newDiv.addEventListener("click", function () {
    if (pageTitle === "Attendance") {
      const datasetName = prompt("Enter Dataset Name:");
      if (datasetName) {
        // Append dataset name to the page
        const datasetDiv = document.createElement("div");
        datasetDiv.classList.add("marks-detail");
        datasetDiv.innerHTML = `<p>${datasetName}</p>`;
        container.appendChild(datasetDiv);
  
        // Save dataset name to Firebase
        const dataPath = `studentMarks/${section}/Attendance/${datasetName}`;
        set(ref(database, dataPath), { created: true });
        getAllData();
      }
    } else {
      window.location.href = "./mark-generate.html";
    }
  });

  // Fetch dataset names from Firebase and add them after the "New Marks" div
  get(child(ref(database), dataPath))
    .then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Sort dataset names based on the months order
        const sortedMonths = Object.keys(data);

        sortedMonths.forEach((name) => {
          const div = document.createElement("div");
          div.classList.add("marks-detail");

          const pElement = document.createElement("p");
          pElement.innerText = name;

          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.classList.add("dataset-checkbox");
          checkbox.value = name;
          checkbox.style.display = "none";

          div.appendChild(checkbox);
          div.appendChild(pElement);

          div.addEventListener("click", function (e) {
            if (!deleteMode && e.target !== checkbox) {
              if (pageTitle === "Attendance") {
                localStorage.setItem("dataSet", div.innerText);
                window.location.href = "./attendance.html";
              } else {
                localStorage.setItem("dataSet", div.innerText);
                window.location.href = "marks.html";
              }
            } else if (deleteMode) {
              checkbox.checked = !checkbox.checked;
              div.style.backgroundColor = checkbox.checked ? "#e73232" : "";
            }
          });

          container.appendChild(div);
          document.getElementById("loading").style.display = "none";
        });

        deleteBtn.addEventListener("click", function () {
          if (!deleteMode) {
            enterDeleteMode();
          } else {
            confirmDeletion();
          }
        });
      } else {
        const noDataDiv = document.createElement("div");
        noDataDiv.classList.add("marks-detail");
        noDataDiv.innerHTML = "<p>No data</p>";
        container.appendChild(noDataDiv);
      }
    })
    .catch((error) => {
      console.error("Error fetching data from Firebase:", error);
    });
}

function enterDeleteMode() {
  deleteMode = true;
  deleteBtn.innerText = "Delete Selected";
  newMarkBtn.style.display = "none"; // Hide "New Marks" in delete mode
}

function confirmDeletion() {
  const selectedCheckboxes = document.querySelectorAll(
    ".dataset-checkbox:checked"
  );

  if (selectedCheckboxes.length > 0) {
    const confirmation = confirm(
      "Are you sure you want to delete the selected Marks?"
    );

    if (confirmation) {
      deleteSelectedDatasets(selectedCheckboxes);
    } else {
      resetDeleteMode();
    }
  } else {
    alert("No Marks selected for deletion.");
    resetDeleteMode();
  }
}

async function deleteSelectedDatasets(selectedCheckboxes) {
  const subject_name = document.getElementById("page-name").innerText;

  for (const checkbox of selectedCheckboxes) {
    const datasetName = checkbox.value;
    const datasetRef = ref(
      database,
      `studentMarks/${section}/${subject_name}/${datasetName}`
    );

    try {
      await remove(datasetRef);
      console.log(`Deleted dataset: ${datasetName}`);
      checkbox.parentElement.remove();
    } catch (error) {
      console.error(`Failed to delete dataset: ${datasetName}`, error);
    }
  }
  resetDeleteMode();
}

function resetDeleteMode() {
  deleteMode = false;
  deleteBtn.innerText = "Delete";
  newMarkBtn.style.display = "block"; // Show "New Marks" when not in delete mode
  document.querySelectorAll(".dataset-checkbox").forEach((checkbox) => {
    checkbox.checked = false;
    checkbox.parentElement.style.backgroundColor = ""; // Reset background color
  });
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("page-title").innerText = pageTitle;
  document.getElementById("page-name").innerText = pageTitle;

  if (pageTitle === "Attendance") {
    document.getElementById("new").href = "./attendance.html";
    localStorage.setItem("pageTitle", pageTitle);
    checkOrCreateMonth();
  } else {
    document.getElementById("new").href = "mark-generate.html";
    localStorage.setItem("pageTitle", pageTitle);
  }

  getAllData();
});


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


function getCurrentMonth() {
  return orderedMonths[new Date().getMonth()];
}


async function checkOrCreateMonth() {
  const subject_name = document.getElementById("page-name").innerText;
  const month = getCurrentMonth();
  const monthPath = `studentMarks/${section}/months/${month}/${subject_name}`;

  const monthRef = ref(database, monthPath);
  const snapshot = await get(monthRef);
  if (!snapshot.exists()) {
    await set(monthRef, { created: true });
    console.log(`${month} has been created in Firebase.`);
  } else {
    console.log(`${month} already exists in Firebase.`);
  }
}