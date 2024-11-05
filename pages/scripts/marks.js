import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  child,
  update,remove,
  set,
} from "https://www.gstatic.com/firebasejs/9.14.0/firebase-database.js";

// Firebase configuration
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
let hot;
const datasetName = localStorage.getItem("dataSet");
const section = localStorage.getItem("section");
const pageTitle = localStorage.getItem("pageTitle");

function fetchAndDisplayData(datasetName) {
  const dataPath = `studentMarks/${section}/${pageTitle}/${datasetName}`;
  const dbRef = ref(database);
  const renameDatasetInput = document.getElementById("renameDatasetInput");
  const totalMarksInput = document.getElementById("totalMarks");

  if (renameDatasetInput) renameDatasetInput.placeholder = datasetName;

  // Fetch the dataset by name
  get(child(dbRef, dataPath))
    .then((snapshot) => {
      if (snapshot.exists()) {
        const firebaseData = snapshot.val();
        const container = document.getElementById("handsontable");
        hot = new Handsontable(container, {
          data: firebaseData.students,
          colHeaders: ["Student Name", "Marks", "Percentage", "Remarks"],
          columns: [
            { data: 0, type: "text", readOnly: true },
            { data: 1, type: "text" }, // Allow both numbers and the string "A"
            { data: 2, type: "numeric", readOnly: true },
            { data: 3, type: "text" },
          ],
          rowHeaders: true,
          colWidths: [200, 100, 100, 100],
          licenseKey: "non-commercial-and-evaluation",
          cells: function (row, col) {
            const cellProperties = {};
            if (row >= 0 && (col === 0 || col === 3))
              cellProperties.className = "fonts";
            return cellProperties;
          },
          afterChange: (changes, source) => {
            if (source === "edit") {
              const totalMarks = parseFloat(totalMarksInput.value);

              changes.forEach(([row, prop, oldValue, newValue]) => {
                if (prop === 1) {
                  // Check if the "Marks" column is edited
                  if (!isNaN(totalMarks) && totalMarks > 0) {
                    if (newValue === "A" || newValue == "a") {
                      // Accept "A" as valid input for "absent"
                      hot.setDataAtCell(row, 2, "N/A");
                    } else if (!isNaN(newValue)) {
                      // Handle numeric input
                      if (newValue > totalMarks) {
                        hot.setCellMeta(row, 1, "className", "error"); // Apply error class for invalid marks
                      } else {
                        hot.setCellMeta(row, 1, "className", null); // Clear error class
                        const average = (newValue / totalMarks) * 100;
                        hot.setDataAtCell(row, 2, average.toFixed(2)); // Update percentage column
                        updateCellColor(row, average); // Update cell color based on percentage
                      }
                    } else {
                      // Reject other non-numeric strings
                      alert(
                        'Only numeric values or "A" are allowed in the Marks column.'
                      );
                      hot.setDataAtCell(row, 1, oldValue); // Revert to the old value
                    }
                  } else {
                    alert("Please enter a valid total marks value.");
                  }
                }
              });
              hot.render();
            }
          },
        });

        const totalMarks = firebaseData.totalMarks || 100;
        firebaseData.students.forEach((student, row) => {
          const marks = student[1];
          if (!isNaN(marks) && totalMarks > 0) {
            const average = (marks / totalMarks) * 100;
            hot.setDataAtCell(row, 2, average.toFixed(2));
            updateCellColor(row, average);
          }
        });
        hot.render();
        totalMarksInput.value = totalMarks;
      } else {
        alert("No data found for the selected dataset.");
      }
    })
    .catch((error) => {
      console.error("Error fetching data from Firebase:", error);
      alert("Failed to fetch data from Firebase.");
    });
}

function updateCellColor(row, average) {
  if (average === "N/A") {
    hot.setCellMeta(row, 2, "className", "blue");
  } else if (average < 51) {
    hot.setCellMeta(row, 2, "className", "red");
  } else if (average < 81) {
    hot.setCellMeta(row, 2, "className", "yellow");
  } else {
    hot.setCellMeta(row, 2, "className", "green");
  }
}

// Update Firebase data
function updateDataInFirebase(datasetName) {
  const datasetNameForUpdate = localStorage.getItem("dataSet");
  const dataPath = `studentMarks/${section}/${pageTitle}/${datasetNameForUpdate}`;
  if (!hot) return;
  const updatedData = hot.getData();
  const totalMarksInput = document.getElementById("totalMarks").value;

  const datasetRef = ref(database, dataPath);
  const saveData = {
    totalMarks: totalMarksInput,
    students: updatedData,
  };

  set(datasetRef, saveData)
    .then(() => {
      showSuccessMessage("Dataset Updated successfully!");
    })
    .catch((error) => {
      console.error("Error updating data in Firebase:", error);
      alert("Failed to update data.");
    });
}

// Function to recalculate averages based on updated total marks
function recalculateAverages(totalMarks) {
  if (!hot || isNaN(totalMarks) || totalMarks <= 0) return;

  hot.getData().forEach((row, rowIndex) => {
    const marks = row[1];
    if (marks === "A" || marks == "a") {
      hot.setDataAtCell(rowIndex, 2, "N/A"); // Keep "N/A" for percentage
    } else if (!isNaN(marks)) {
      const average = (marks / totalMarks) * 100;
      hot.setDataAtCell(rowIndex, 2, average.toFixed(2));
      updateCellColor(rowIndex, average);
    }
  });
  hot.render();
}

// Event listener for the "Update Total Marks" button
const updateTotalMarksButton = document.getElementById("updateTotalMarks");
if (updateTotalMarksButton) {
  updateTotalMarksButton.addEventListener("click", () => {
    const totalMarks = parseFloat(document.getElementById("totalMarks").value);
    if (!isNaN(totalMarks) && totalMarks > 0) {
      recalculateAverages(totalMarks);
    } else {
      alert("Please enter a valid number for total marks.");
    }
  });
}

// Event listener for the "Update Data" button
const updateDataButton = document.getElementById("updateData");
if (updateDataButton) {
  updateDataButton.addEventListener("click", function () {
    if (datasetName) {
      updateDataInFirebase(datasetName);
      createChart();
    } else {
      alert("No dataset name provided in the URL.");
    }
  });
}
let isEdited = false;
// Track changes to rename input
const renameDatasetInput = document.getElementById("renameDatasetInput");
if (renameDatasetInput) {
  renameDatasetInput.addEventListener("input", () => {
    isEdited = true;
  });
}

// Auto-save data to Firebase when the page is closed or reloaded
window.addEventListener("beforeunload", function (event) {
  if (isEdited) {
    renameDataset();
  }
  updateDataInFirebase();
});

// Fetch data when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  if (datasetName) {
    fetchAndDisplayData(datasetName);
  } else {
    alert("No dataset name provided in the URL.");
  }
});

let analysisChart; // Variable to hold the chart instance
document.addEventListener("DOMContentLoaded", () => {
  createChart();
});

async function createChart() {
  const section = localStorage.getItem("section");
  const scoreRanges = { "0-50": 0, "51-80": 0, "81-100": 0, Absent: 0 };

  // Fetch data directly from Firebase path
  const studentsPath = `/studentMarks/${section}/${pageTitle}/${datasetName}/students`;
  const studentsRef = ref(database, studentsPath);
  const studentsSnapshot = await get(studentsRef);

  if (studentsSnapshot.exists()) {
    const studentsData = studentsSnapshot.val();

    // Iterate over students' marks and categorize scores
    studentsData.forEach(([, , mark]) => {
      if (mark === "N/A") scoreRanges["Absent"]++;
      if (mark >= 81) scoreRanges["81-100"]++;
      else if (mark >= 51) scoreRanges["51-80"]++;
      else scoreRanges["0-50"]++;
    });
  }

  // Destroy previous chart if it exists
  if (analysisChart) analysisChart.destroy();

  // Create a new chart
  const ctx = document.getElementById("myChart").getContext("2d");
  analysisChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["0-50", "51-80", "81-100", "Absent"],
      datasets: [
        {
          data: Object.values(scoreRanges),
          backgroundColor: ["red", "#FBEC5D", "green", "blue"],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" },
        title: { display: true, text: "Student Marks Distribution" },
      },
    },
  });
}

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

// Rename dataset function
async function renameDataset() {
  const renameDatasetInput = document.getElementById("renameDatasetInput");
  const newDatasetName = capitalizeFirstLetter(renameDatasetInput.value.trim());
  const section = localStorage.getItem("section");
  const pageTitle = localStorage.getItem("pageTitle");
  const datasetName = localStorage.getItem("dataSet");
  const oldDataPath = `studentMarks/${section}/${pageTitle}/${datasetName}`;

  if (newDatasetName && newDatasetName !== datasetName) {
    const newDataPath = `studentMarks/${section}/${pageTitle}/${newDatasetName}`;
    const dbRef = ref(database);

    try {
      // Fetch data from the old dataset
      const oldDataSnapshot = await get(child(dbRef, oldDataPath));
      if (oldDataSnapshot.exists()) {
        const oldData = oldDataSnapshot.val();

        // Set data to the new path
        await set(ref(database, newDataPath), oldData);

        let oldMonth = datasetName.split("_")[0];
        orderedMonths.forEach(async (x) => {
          if (x.includes(oldMonth)) {
            await removeFromMonth(section, pageTitle, x, datasetName);
          }
        });


        // Delete old dataset
        await set(ref(database, oldDataPath), null);

        // Update the local dataset name and input placeholder
        localStorage.setItem("dataSet", newDatasetName);
        renameDatasetInput.placeholder = newDatasetName;
        let newMonth = newDatasetName.split("_")[0];
        orderedMonths.forEach(async (x) => {
          if (x.includes(newMonth)) {
            await addToMonth(section, pageTitle, x, newDatasetName);
          }
        });

        // Display success message
        showSuccessMessage("Dataset renamed successfully!");
      } else {
        alert("Original dataset not found.");
      }
    } catch (error) {
      console.error("Error renaming dataset:", error);
      alert("Failed to rename the dataset.");
    }
  } else {
    alert("Please enter a new name different from the current one.");
  }
}

// Add event listener to the rename button
document
  .getElementById("renameDataset")
  .addEventListener("click", renameDataset);

// Function to show success message
function showSuccessMessage(message) {
  const successMessageDiv = document.getElementById("successMessage");
  if (successMessageDiv) {
    successMessageDiv.innerText = message;
    successMessageDiv.style.display = "block";
    setTimeout(() => {
      successMessageDiv.style.display = "none";
    }, 3000);
  }
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

async function addToMonth(section, subject, month, dataSetName) {
  const dataSet = {};
  dataSet[dataSetName] = true;
  try {
    await update(
      ref(database, `/studentMarks/${section}/months/${month}/${subject}`),
      dataSet
    );
    console.log("Data successfully appended to Firebase.");
  } catch (error) {
    console.error("Error appending data to Firebase:", error);
  }
}

async function removeFromMonth(section, subject, month, dataSetName) {
  const datasetRef = ref(
    database,
    `/studentMarks/${section}/months/${month}/${subject}/${dataSetName}`
  );
  try {
    await remove(datasetRef);
    console.log(`Successfully deleted: ${dataSetName}`);
  } catch (error) {
    console.error("Failed to delete dataset:", dataSetName, error);
  }
}
