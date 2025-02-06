import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import { getDatabase, ref, get, set, update } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-database.js";
import firebaseConfig from "../../config.js"
import {
  getFirestore,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/9.14.0/firebase-firestore.js";

import * as constValues from "../scripts/constValues.js"

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const firestore = getFirestore(app);

let hot;
const subjects = ["English", "LifeSkills", "Tech", "ProblemSolving","PSlevel", "PET", "Project", "Attendance", "Behavior"];
const section=localStorage.getItem("section");
const month=localStorage.getItem("month");
document.getElementById("month").innerText=month;




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

async function fetchData() {
  const data = {};

  const studentNames =await fetchStudentNames();
  console.log(studentNames);
  
  if (studentNames.length === 0) {
    console.warn("No student names found in attendance. Defaulting to empty list.");
  }

  await Promise.all(
    subjects.map(async (subject) => {
      const path = `/FSSA/${section}/${month}/Result/${subject}`;
      try {
        const snapshot = await get(ref(database, path));
        if (snapshot.exists()) {
          data[subject] = snapshot.val();
        } else {
          console.warn(`No data found for ${subject}, filling with zeros.`);
          data[subject] = studentNames.reduce((acc, name) => {
            acc[name] = 0;
            return acc;
          }, {});
        }
      } catch (error) {
        console.error(`Error fetching data for ${subject}:`, error);
        data[subject] = studentNames.reduce((acc, name) => {
          acc[name] = 0;
          return acc;
        }, {});
      }
    })
  );

  return data;
}



// Calculate academic and overall averages
function calculateMetrics(studentData, includePET, includeProject) {
  return studentData.map((student) => {
    const { Name, ...marks } = student;

    // Filter academic and selected subjects
    const academicSubjects = ["English", "LifeSkills", "Tech", "ProblemSolving"];
    if (includePET) academicSubjects.push("PET");
    if (includeProject) academicSubjects.push("Project");

    const selectedSubjects = [...academicSubjects, "Attendance", "Behavior"].filter((subject) => {
      if (!includePET && subject === "PET") return false;
      if (!includeProject && subject === "Project") return false;
      return true;
    });

    // Calculate averages
    const academicTotal = academicSubjects.reduce((sum, subject) => sum + (marks[subject] || 0), 0);
    const academicOverall = academicTotal / academicSubjects.length;

    const overallTotal = selectedSubjects.reduce((sum, subject) => sum + (marks[subject] || 0), 0);
    const overallAverage = overallTotal / selectedSubjects.length;

    return { Name, ...marks, "Academic Overall": academicOverall, "Overall Average": overallAverage };
  });
}

function formatDataWithAverage(rawData, includePET, includeProject) {
  const studentNames = Object.keys(rawData.Attendance || {}); // Use Attendance as the base for student names

  // Map each student's data
  const studentData = studentNames.map((name) => {
    const row = { Name: name };
    subjects.forEach((subject) => {
      // Fill 0 for the specific subject if missing for the student
      row[subject] = rawData[subject]?.[name] || 0;
    });
    return row;
  });

  // Calculate metrics for each student
  const calculatedData = calculateMetrics(studentData, includePET, includeProject);

  // Calculate class averages
  const classAverage = { Name: "Class Average" };
  subjects.forEach((subject) => {
    const total = calculatedData.reduce((sum, student) => sum + (student[subject] || 0), 0);
    classAverage[subject] = total / studentNames.length;
  });

  classAverage["Academic Overall"] =
    calculatedData.reduce((sum, student) => sum + student["Academic Overall"], 0) / studentNames.length;
  classAverage["Overall Average"] =
    calculatedData.reduce((sum, student) => sum + student["Overall Average"], 0) / studentNames.length;

  // Append class average as the last row
  calculatedData.push(classAverage);

  return calculatedData;
}


function renderTable(data) {
  const container = document.getElementById("handsontableTable");

  if (!hot) {
    hot = new Handsontable(container, {
      data,
      colHeaders: ["Name", ...subjects, "Academic Overall", "Overall Average"],
      columns: [
        { data: "Name", type: "text", readOnly: true, className: "htCenter" },
        ...subjects.map((subject) => ({
          data: subject,
          type: "numeric",
          readOnly: true,
          numericFormat: { pattern: "0.00" },
          className: "htCenter",
          renderer: Handsontable.renderers.NumericRenderer,
        })),
        {
          data: "Academic Overall",
          type: "numeric",
          readOnly: true,
          numericFormat: { pattern: "0.00" },
          className: "htCenter",
          renderer: Handsontable.renderers.NumericRenderer,
        },
        {
          data: "Overall Average",
          type: "numeric",
          readOnly: true,
          numericFormat: { pattern: "0.00" },
          className: "htCenter",
          renderer: Handsontable.renderers.NumericRenderer,
        },
      ],
      stretchH: "all",
      rowHeaders: true,
      columnSorting: true,
      width: "100%",
      height:"100%",
      licenseKey: "non-commercial-and-evaluation",cells: function (row, col) {
        const cellProperties = {};
        if (row >= 0) cellProperties.className = "fonts";
        return cellProperties;
      },
      beforeColumnSort: (column, order) => {
        const data = hot.getData();
        const lastRow = data[data.length - 1];
        if (lastRow && lastRow.Name === "Class Average") {
          return false; // Prevent sorting
        }
      },
    });
    document.getElementById("loading").style.display="none"
  } else {
    hot.loadData(data);
  }
}

// Refresh table when checkboxes change
function setupCheckboxListeners(rawData) {
  const updateTable = () => {
    const includePET = document.getElementById("includePET").checked;
    const includeProject = document.getElementById("includeProject").checked;
    const formattedData = formatDataWithAverage(rawData, includePET, includeProject);
    renderTable(formattedData);
  };

  document.getElementById("includePET").addEventListener("change", updateTable);
  document.getElementById("includeProject").addEventListener("change", updateTable);
}

// Initialize the table
async function initTable() {
  const rawData = await fetchData();
  const includePET = document.getElementById("includePET").checked;
  const includeProject = document.getElementById("includeProject").checked;
  const formattedData = formatDataWithAverage(rawData, includePET, includeProject);
  renderTable(formattedData);
  setupCheckboxListeners(rawData);

}

initTable();
document.getElementById('saveResult').addEventListener('click', async () => {
  if (!hot) return;

  const includePET = document.getElementById('includePET').checked;
  const includeProject = document.getElementById('includeProject').checked;
  const includePSlevel=document.getElementById("includePSlevel").checked;


  const tableData = hot.getData(); // Get all table rows
  const colHeaders = hot.getColHeader(); // Get column headers

  const savedData = {};

  tableData.forEach((row) => {
    const studentName = row[0]; // The first column contains the student name
    const studentData = {};

    colHeaders.forEach((header, index) => {
      if (header === "PET" && !includePET) return; 
      if (header === "Project" && !includeProject) return; 
      if (header === "PSlevel" && !includePSlevel) return; 
      if (header !== "Name") {
        studentData[header] = Math.round(row[index] || 0);
      }
    });

    savedData[studentName] = studentData;
  });

  // Firebase: Check if data exists at the specified path
  const finalResultPath = `/FSSA/${section}/${month}/Result/finalResult`;
  const finalResultRef = ref(database, finalResultPath);

  try {
    const snapshot = await get(finalResultRef);

    if (snapshot.exists()) {
      // Data exists: Update existing data
      await update(finalResultRef, savedData);
      console.log("Data successfully updated in Firebase:", savedData);
      showSuccessMessage("Data updated successfully!");
    } else {
      // Data does not exist: Set new data
      await set(finalResultRef, savedData);
      console.log("Data successfully set in Firebase:", savedData);
      showSuccessMessage("Data saved successfully!");
    }
  } catch (error) {
    console.error("Error saving data to Firebase:", error);
    alert("Failed to save or update data. Check console for details.");
  }
});


document.addEventListener("DOMContentLoaded",async()=>{

  const finalResultPath = `/FSSA/${section}/${month}/Result/finalResult`;
  const finalResultRef = ref(database, finalResultPath);

  try {
    const snapshot = await get(finalResultRef);

    if (snapshot.exists()) {
      console.log(snapshot.val());
      const data=snapshot.val()
      const fields=Object.keys(data)
      const userFirst=data[fields[0]];
      if(userFirst["Project"]){
        document.getElementById("includeProject").checked=true;
      }
      if(userFirst["PET"]){
        document.getElementById("includePET").checked=true;
      }
      
    } 
  } catch (error) {
    console.error("Error saving data to Firebase:", error);
    alert("Failed to save or update data. Check console for details.");
  }


})


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


document.getElementById("seeMarks").addEventListener("click",()=>{
    window.location.href=constValues.reportCardDownloadPath

})