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
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/9.14.0/firebase-firestore.js";

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
const section = localStorage.getItem("section");
const pageTitle = localStorage.getItem("pageTitle");

document.addEventListener("DOMContentLoaded", async function () {
  const container = document.getElementById("handsontable");
  let data = [];
  let Students = [];
  const renameButton = document.getElementById("renameDataset");
  const saveButton = document.getElementById("saveToFirebase");
  const datasetNameInput = document.getElementById("datasetName");
  let unsavedChanges = false; // Flag for unsaved changes
  let datasetName = localStorage.getItem("dataSet");

  // Function to get query parameters
  function getQueryParameter(paramName) {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    return params.get(paramName);
  }

  const newAttendance = getQueryParameter("new");

  async function fetchStudentNames(classSection) {
    try {
      const docRef = collection(firestore, `FSSA/studentsBaseData/${section}`); // Document reference to the classes document
      const docSnap = await getDocs(docRef);

      if (!docSnap.empty)  {
        const studentNames = docSnap.docs.map((doc) => doc.id);
        if (Array.isArray(studentNames) && studentNames.length > 0) {
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

  // Fetch student names before creating the table
  await fetchStudentNames(section);

  if (newAttendance === "yes") {
    document.getElementById("renameDataset").style.display = "none";
    if (Students.length > 0) {
      // Generate sample data for students with empty cells
      for (let i = 0; i < Students.length; i++) {
        let row = [`${Students[i]}`]; // First column is the student name
        for (let j = 0; j < 31; j++) {
          row.push(""); // Create empty cells
        }
        data.push(row);
      }
    } else {
      console.error("No students to create attendance for.");
      alert("No students found to create the attendance table.");
      return;
    }
  } else {
    // Logic for fetching existing attendance data
    const dataPath = `studentMarks/${section}/Attendance/${datasetName}`;
    const dbRef = ref(database, dataPath);
    try {
      const snapshot = await get(dbRef); // Fetch data
      if (snapshot.exists()) {
        data = snapshot.val(); // Load existing data
        console.log("Existing data fetched successfully:", data);
      } else {
        console.error("No data found at the specified path.");
        alert("No data found for the specified dataset.");
        return;
      }
    } catch (error) {
      console.error("Error fetching data from Firebase:", error);
      alert("Error fetching data from Firebase.");
      return;
    }
  }

  // Set dataset name in input field if not newAttendance
  if (newAttendance !== "yes") {
    datasetNameInput.placeholder = datasetName; // Populate input with dataset name
    saveButton.style.display = "none"; // Change button text to Update
  }

  // Initialize Handsontable
  const hot = new Handsontable(container, {
    data: data,
    colHeaders: [
      "Student Name",
      ...Array.from({ length: 31 }, (_, i) => `Day ${i + 1}`),
    ],
    columns: [
      { data: 0, type: "text" },
      ...Array.from({ length: 31 }, (_, i) => ({ data: i + 1, type: "text" })),
    ],
    rowHeaders: true,
    colWidths: [200, ...Array(31).fill(50)],
    fixedColumnsLeft: 1,
    licenseKey: "non-commercial-and-evaluation",
    width: "85%",
    height: "100%",
    stretchH: "all",
    overflow: "hidden",
    autoColumnSize: false,
    autoRowSize: true,
    afterChange: (changes, source) => {
      if (source !== "loadData") {
        unsavedChanges = true; // Set the flag when any actual changes are made to the table
      }
    },
  });

  // Set unsavedChanges to false initially, after loading data
  unsavedChanges = false;

  // Monitor input changes
  datasetNameInput.addEventListener("input", () => {
    unsavedChanges = true; // Set the flag when the input changes
  });

  // Function to rename the dataset and save data
  async function renameAndSaveDataset(newName) {
    const oldPath = `studentMarks/${section}/Attendance/${datasetName}`;
    const newPath = `studentMarks/${section}/Attendance/${newName}`;

    try {
      const snapshot = await get(ref(database, oldPath));
      if (snapshot.exists()) {
        await set(ref(database, newPath), snapshot.val()); // Copy existing data to new path
        await set(ref(database, oldPath), null); // Remove old dataset

        // Update localStorage and button text
        localStorage.setItem("dataSet", newName);
        datasetName = newName; // Update the variable
        saveButton.innerText = "Update"; // Change button text to Update
      } else {
        alert("No dataset found to rename.");
      }
    } catch (error) {
      console.error("Error renaming dataset:", error);
      alert("Error renaming dataset.");
    }
  }

  // Function to save data to Firebase
  async function saveDataToFirebase(customName) {
    const tableData = hot.getData(); // Get data from Handsontable
    const dataPath = `studentMarks/${section}/${pageTitle}/${customName}`; // Use dynamic pageTitle for the path

    try {
      await set(ref(database, dataPath), tableData);
      unsavedChanges = false; // Reset the flag on successful save
      showSuccessMessage("Data saved successfully.");
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Error saving data.");
    }
  }

  // Manual save button event listener
  saveButton.addEventListener("click", async function () {
    const newName = datasetNameInput.value.trim().split("/").join("-");
    if (newAttendance === "yes") {
      // When creating new attendance dataset
      if (newName === "") {
        alert("Please enter a valid dataset name.");
        return;
      }

      // Save the new dataset to Firebase
      const dataPath = `studentMarks/${section}/Attendance/${newName}`;
      try {
        await set(ref(database, dataPath), data); // Save new attendance data
        datasetName = newName; // Update dataset name
        localStorage.setItem("dataSet", datasetName); // Update localStorage
        showSuccessMessage("New attendance created successfully!");
        unsavedChanges = false; // Reset unsaved changes after save
      } catch (error) {
        console.error("Error saving new attendance data:", error);
        alert("Error saving new attendance data.");
      }
    }
     else {
      // For existing datasets
      if (unsavedChanges) {
        if (newName != datasetName) {
          await renameAndSaveDataset(newName); // Rename the dataset if there are unsaved changes
        }
        await saveDataToFirebase(newName); // Then save the data
      } else {
        await saveDataToFirebase(datasetName); // Save with current dataset name if no changes
        showSuccessMessage("File Updated successfully!");
      }
    }
  });

  // Rename button event listener
  renameButton.addEventListener("click", async function () {
    const newName = datasetNameInput.value.trim().split("/").join("-");
    if (newName === "") {
      alert("Please enter a valid dataset name.");
      return;
    }

    // Check if the new name is different from the current dataset name
    if (newName === datasetName) {
      alert("No changes made to the dataset name."); // Notify the user
      return; // Exit the function early if the names are the same
    }

    await renameAndSaveDataset(newName); // Rename the dataset
    showSuccessMessage("Renamed successfully!");
  });

  // Add beforeunload event listener to warn about unsaved changes
  window.addEventListener("beforeunload", (event) => {
    if (unsavedChanges) {
      // Show alert only if there are unsaved changes and not saving
      const dataName=localStorage.getItem("dataSet");
      saveDataToFirebase(dataName);
    }
  });
});

// Function to show success message
function showSuccessMessage(str) {
  const message = document.getElementById("successMessage");
  message.innerText = str;
  message.classList.add("show");
  setTimeout(() => {
    message.classList.remove("show");
  }, 3000); // Display message for 3 seconds
}
