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

import firebaseConfig from "../../config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const firestore = getFirestore(app);

let hotTable;
let data = [];
let month = localStorage.getItem("month");
const section = localStorage.getItem("section");
let container = document.getElementById("tableForLevel");
const dataPath = `FSSA/${section}/${month}/PSlevel/`;
const saveBtn = document.getElementById("saveData");


// Attach event listener to save button
saveBtn.addEventListener("click", saveDataToFirebase);

// Fetch student names from Firestore based on section
async function fetchStudentNames() {
  try {
    const docRef = collection(firestore, `FSSA/studentsBaseData/${section}`);
    const docSnap = await getDocs(docRef);

    if (docSnap.empty) {
      console.error("No student names found for the selected class.");
      showErrorMessage("No student names found for the selected class.", 3000);
      return [];
    }

    const studentNames = docSnap.docs.map((doc) => doc.id);
    return studentNames;
  } catch (error) {
    console.error("Error fetching student names:", error);
    alert("Error fetching student names.");
    return [];
  }
}

// Handle table rendering
function renderTable() {
  hotTable = new Handsontable(container, {
    data: data,
    colHeaders: ["Student Name", "Level", "Remark"],
    columns: [
      { type: "text", readOnly: true, width: 250 },
      { type: "numeric", readOnly: false, width: 150 },
      { type: "text", readOnly: false, width: 250 },
    ],
    rowHeaders: true,
    licenseKey: "non-commercial-and-evaluation",
  });
}

// Fetch data on DOMContentLoaded
document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("monOfTheSubject").innerText = month;

  try {
    const snapshot = await get(ref(db, dataPath));
    if (snapshot.exists()) {
      saveBtn.innerText = "Update";
      const existingData = snapshot.val().students;
      data = Object.keys(existingData).map(student => [
        student,
        existingData[student].level,
        existingData[student].remark
      ]);
    } else {
      const studentNames = await fetchStudentNames();
      data = studentNames.map(studentName => [studentName, "", ""]);
    }

    renderTable();
    document.getElementById("loading").style.display="none"

  } catch (error) {
    console.error("Error fetching or processing data:", error);
    showErrorMessage("Error loading data. Please try again later.", 3000);
  }
});

// Save data to Firebase
async function saveDataToFirebase() {
  try {
    const tableData = hotTable.getData();
    const transformedStudents = {};

    tableData.forEach(([name, level, remark]) => {
      if (name) {
        transformedStudents[name] = {
          level: level || "",
          remark: remark || "",
        };
      }
    });

    const saveData = {
      students: transformedStudents,
      timestamp: new Date().toISOString(),
    };

    await set(ref(db, dataPath), saveData);
    let resultData = tableData.reduce((acc, [name, level]) => {
      acc[name] = level;
      return acc;
    }, {});
    
    
    await set(ref(db, `/FSSA/${section}/${month}/Result/PSlevel`), resultData);
    showSuccessMessage("Data saved successfully!");
  } catch (error) {
    console.error("Error saving data:", error);
    showErrorMessage("Error saving or updating data. Please try again.", 3000);
  }
}

// Show error message
function showErrorMessage(message, time = 3000) {
  const errorPopup = document.getElementById("error-message");
  errorPopup.innerText = message;
  errorPopup.style.display = "block";
  setTimeout(() => {
    errorPopup.style.display = "none";
  }, time);
}

// Show success message
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

