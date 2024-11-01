// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  get,
} from "https://www.gstatic.com/firebasejs/9.14.0/firebase-database.js";
import {
  getFirestore,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/9.14.0/firebase-firestore.js";

// Your web app's Firebase configuration (replace with your project details)
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
const firestore = getFirestore(app);

document.addEventListener("DOMContentLoaded", async function () {
  const pageTitle = localStorage.getItem("pageTitle");
  const section = localStorage.getItem("section");

  document.querySelector(".page-name").textContent = `New ${pageTitle} Mark`;

  const container = document.getElementById("handsontable");
  let data = [];
  let Students = [];
  let isDataSaved = true; // Track if data is saved

  // Fetch student names from Firestore based on section
  async function fetchStudentNames(classSection) {
    try {
      const docRef = doc(firestore, "FSSA/studentNames"); // Document reference to the classes document
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const studentNames = docSnap.data()[classSection] || []; // Default to an empty array if undefined

        if (Array.isArray(studentNames) && studentNames.length > 0) {
          console.log("Student names fetched successfully:", studentNames);
          Students = studentNames;
        } else {
          console.error("No student names found for the selected class.");
          alert("No student names found for the selected class.");
          return [];
        }
      } else {
        console.log("No such document!");
        alert("No such document for the selected class.");
        return [];
      }
    } catch (error) {
      console.error("Error fetching document:", error);
      alert("Error fetching student names.");
      return [];
    }
  }

  await fetchStudentNames(section);
  
  // Generate data for students and marks (empty initially)
  for (let i = 0; i < Students.length; i++) {
    let row = [`${Students[i]}`, ""]; // First column is the student name, second is empty marks
    data.push(row);
  }

  // Get the totalMarks input and parse its value
  const totalMarksInput = document.getElementById("totalMarks");
  let totalMarks = parseInt(totalMarksInput.value);
  
  // Initialize Handsontable
  const hot = new Handsontable(container, {
    data: data,
    colHeaders: ['Student Name', 'Marks', "Percentage", "Remarks"],
    columns: [
      { data: 0, type: 'text', readOnly: true },
      { data: 1, type: 'numeric' },
      { data: 2, type: 'numeric', readOnly: true },
      { data: 3, type: 'text' },
    ],
    rowHeaders: true,
    colWidths: [200, 100, 100, 100],
    licenseKey: "non-commercial-and-evaluation",
    afterChange: (changes, source) => {
      if (source === 'edit') {
        isDataSaved = false; // Set to false when the user makes changes
        changes.forEach(([row, prop]) => {
          if (prop === 1) { // Only trigger when "Marks" column is edited
            const marks = hot.getDataAtCell(row, 1);
            if (marks > totalMarks) {
              hot.setCellMeta(row, 1, 'className', 'error'); // Set class for red color
            } else {
              hot.setCellMeta(row, 1, 'className', null); // Remove class if marks are valid
            }
            hot.render(); // Re-render the table to apply styles

            // Update average immediately after marks are edited
            updateTableAverages();
          }
        });
      }
    }
  });

  // Button to calculate total marks
  document.getElementById("calculate").addEventListener("click", () => {
    const customTotalMarks = parseInt(totalMarksInput.value);
    if (!isNaN(customTotalMarks) && customTotalMarks > 0) {
      totalMarks = customTotalMarks;
      updateTableAverages(); // Update averages based on the new totalMarks
    } else {
      alert("Please enter a valid total marks value.");
    }
  });

  // Function to update the averages in the table when totalMarks changes or marks are updated
  function updateTableAverages() {
    for (let row = 0; row < hot.countRows(); row++) {
      const marks = hot.getDataAtCell(row, 1);
      if (!isNaN(marks) && marks <= totalMarks) {
        const average = (marks / totalMarks) * 100;
        hot.setDataAtCell(row, 2, average.toFixed(2));
        
        // Set the cell color based on the average value
        if (average <= 50) {
          hot.setCellMeta(row, 2, 'className', 'red'); // Class for average < 50
        } else if (average > 50 && average < 81) {
          hot.setCellMeta(row, 2, 'className', 'yellow'); // Class for 50 <= average < 81
        } else {
          hot.setCellMeta(row, 2, 'className', 'green'); // Class for average >= 81
        }
      }
    }
    hot.render(); // Re-render the table to apply styles
  }

  // Function to save data to Firebase
  async function saveDataToFirebase(customName) {
    const dbRef = ref(database);
    const dataPath = `studentMarks/${section}/${pageTitle}`;
    
    // Check for existing datasets
    try {
      const snapshot = await get(ref(database, dataPath));
      const tableData = hot.getData();
      const saveData = {
        totalMarks: totalMarksInput.value,
        students: tableData,
      };

      if (snapshot.exists()) {
        const existingDatasets = Object.keys(snapshot.val());
        if (existingDatasets.includes(customName)) {
          // Update existing dataset
          await set(ref(database, `${dataPath}/${customName}`), saveData);
          showSuccessMessage("file updated Successfully !!!")
        } else {
          // Save new dataset
          await set(ref(database, `${dataPath}/${customName}`), saveData);
          showSuccessMessage("Data saved successfully.");
        }
      } else {
        // Save new dataset
        await set(ref(database, `${dataPath}/${customName}`), saveData);
        showSuccessMessage("Data saved successfully.");
      }

      isDataSaved = true; // Set to true when data is successfully saved
      document.getElementById("saveToFirebase").innerText = "Update"; // Change button text to "Update"
      showSuccessMessage();
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Error saving file.");
    }
  }

  // Add an event listener for beforeunload to save data before reloading or closing the page
  window.addEventListener("beforeunload", (event) => {
    const customName = capitalizeFirstLetter(document.getElementById("datasetName").value.trim().replaceAll("/", "-"));
    if (!isDataSaved) { // Show alert only if data is not saved
      event.returnValue = "You have unsaved changes. Are you sure you want to leave?";
    }
  });

  // Manual save button
  document
    .getElementById("saveToFirebase")
    .addEventListener("click", function () {
      const customName = capitalizeFirstLetter(document
        .getElementById("datasetName")
        .value.trim()
        .split("/")
        .join("-"));

      if (customName === "") {
        alert("Please enter a valid dataset name.");
        return; // Exit if the dataset name is empty
      }

      saveDataToFirebase(customName); // Save data manually
    });
});

// Function to show success message
function showSuccessMessage() {
  const message = document.getElementById("successMessage");
  message.classList.add("show");
  setTimeout(() => {
    message.classList.remove("show");
  }, 1000);
}


function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
