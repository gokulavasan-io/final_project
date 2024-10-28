// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
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

  // Fetch student names from Firestore based on section
  async function fetchStudentNames(classSection) {
    try {
      const docRef = doc(firestore, "school/classes"); // Document reference to the classes document
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

  // Initialize Handsontable
  const hot = new Handsontable(container, {
    data: data,
    colHeaders: ["Student Name", "Marks"], // Two columns: Student Name and Marks
    columns: [
      { data: 0, type: "text" }, // Student Name
      { data: 1, type: "numeric" }, // Marks column, can be numeric
    ],
    rowHeaders: true,
    colWidths: [200, 100], // Widths for each column
    licenseKey: "non-commercial-and-evaluation",
  });


  // Function to save data to Firebase
  function saveDataToFirebase(customName) {
    const tableData = hot.getData(); // Get data from Handsontable

    const dbRef = ref(database);
    const dataPath = `studentMarks/${section}/${pageTitle}/${customName}`; // Use dynamic pageTitle for the path
    //
    // Save the data to Firebase
    set(ref(database, dataPath), tableData)
      .then(() => {
        showSuccessMessage();
      })
      .catch((error) => {
        console.error("Error saving data:", error);
        alert("Error saving file."); // Show alert on error
      });
  }

  // Add an event listener for beforeunload to save data before reloading or closing the page
  window.addEventListener("beforeunload", (event) => {
    const customName = document
      .getElementById("datasetName")
      .value.trim()
      .split("/")
      .join("-");

    if (customName !== "") {
      saveDataToFirebase(customName); // Save data automatically with the dataset name
      event.returnValue =
        "Are you sure you want to leave? Your data will be saved."; // Standard message may not show in all browsers
      showSuccessMessage("File Saved successfully !");
    }
  });

  // Manual save button
  document
    .getElementById("saveToFirebase")
    .addEventListener("click", function () {
      const customName = document
        .getElementById("datasetName")
        .value.trim()
        .split("/")
        .join("-");

      if (customName === "") {
        alert("Please enter a valid dataset name.");
        return; // Exit if the dataset name is empty
      }

      saveDataToFirebase(customName); // Save data manually
    });
});

function showSuccessMessage() {
  const message = document.getElementById("successMessage");
  message.classList.add("show");
  setTimeout(() => {
    message.classList.remove("show");
  }, 1000);
}
