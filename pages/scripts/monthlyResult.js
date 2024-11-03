// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  set,
} from "https://www.gstatic.com/firebasejs/9.14.0/firebase-database.js";
import {
  getFirestore,
  getDocs,
  collection,
} from "https://www.gstatic.com/firebasejs/9.14.0/firebase-firestore.js";

// Firebase configuration and initialization
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
const firestore = getFirestore(app);

// Global variables
let hot; // Handsontable instance
const month = localStorage.getItem("month");
const section = localStorage.getItem("section");
let tableData = [];

async function fetchStudentNames(section) {
  try {
    const docRef = collection(firestore, `FSSA/studentsBaseData/${section}`); // Document reference to the classes document
    const docSnap = await getDocs(docRef);

    if (!docSnap.empty) {
      const studentNames = docSnap.docs.map((doc) => doc.id);
      if (Array.isArray(studentNames) && studentNames.length > 0) {
        return studentNames;
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

async function fetchResultData(path) {
  const resultRef = ref(database, path);
  const resultSnapshot = await get(resultRef);
  if (resultSnapshot.exists()) {
    const resultData = resultSnapshot.val();
    return Object.keys(resultData).map((key) => ({
      student: key, // Using the key as the student name
      Attendance: resultData[key].Attendance || 0,
      Behavior: resultData[key].Behavior || 0,
      Project: resultData[key].Project || 0,
    }));
  }
  return [];
}

// Event listener for DOM content load
document.addEventListener("DOMContentLoaded", async () => {
  const subjects = ["English", "LifeSkills", "Tech", "ProblemSolving"];
  const month = localStorage.getItem("month");
  document.getElementById("month").innerText = month;
  const section = localStorage.getItem("section");
  const resultPath = `/studentMarks/${section}/months/${month}/result`;
  const saveButton = document.getElementById("saveResult");

  // Fetch student names and initialize student data
  const studentNames = await fetchStudentNames(section);
  const studentData = {};
  studentNames.forEach((studentName) => {
    studentData[studentName] = {
      student: studentName,
      English: 0,
      LifeSkills: 0,
      Tech: 0,
      ProblemSolving: 0,
      AcademicOverall: 0,
      Attendance: 0,
      Behavior: 0,
      Overall: 0,
    };
  });

  // Function to fetch and average subject marks
  async function fetchAndAverageMarks(subject) {
    const monthPath = `/studentMarks/${section}/months/${month}/${subject}`;
    const fileRef = ref(database, monthPath);
    const markSums = {};
    const markCounts = {};

    const fileSnapshot = await get(fileRef);
    if (fileSnapshot.exists()) {
      const fileNames = Object.keys(fileSnapshot.val());
      await Promise.all(
        fileNames.map(async (fileName) => {
          const marksRef = ref(
            database,
            `/studentMarks/${section}/${subject}/${fileName}/students`
          );
          const marksSnapshot = await get(marksRef);
          if (marksSnapshot.exists()) {
            const marks = marksSnapshot.val();
            if (Array.isArray(marks)) {
              marks.forEach(([studentName, , mark]) => {
                const numericMark =
                  typeof mark === "number" && !isNaN(mark) ? mark : 0;
                if (studentName) {
                  markSums[studentName] =
                    (markSums[studentName] || 0) + numericMark;
                  markCounts[studentName] = (markCounts[studentName] || 0) + 1;
                }
              });
            }
          }
        })
      );
    }

    // Calculate averages for each student
    studentNames.forEach((studentName) => {
      const average = markCounts[studentName]
        ? markSums[studentName] / markCounts[studentName]
        : 0;
      studentData[studentName][subject] = average;
    });
  }

  // Calculate marks for all subjects
  await Promise.all(subjects.map(fetchAndAverageMarks));

  // Fetch result data if exists, and populate Attendance and Behavior
  const resultData = await fetchResultData(resultPath);
  if (resultData) {
    resultData.forEach((result) => {
      const studentName = result.student;
      if (studentData[studentName]) {
        studentData[studentName] = {
          ...studentData[studentName],
          Attendance: result.Attendance || 0,
          Behavior: result.Behavior || 0,
          Project: result.Project || 0,
        };
      }
    });
    document.querySelector(".seebuttons").style.display = "flex";
  }

    // Check if "Project" data exists and set the checkbox accordingly
    const hasProjectData = resultData.some((student) => student.Project != 0);

  // Prepare table data with computed AcademicOverall and Overall
  tableData = Object.values(studentData).map((student) => {
    student.AcademicOverall = parseFloat(
      (
        (student.English +
          student.LifeSkills +
          student.Tech +
          student.ProblemSolving) /
        subjects.length
      ).toFixed(1)
    );

    // Calculate Overall including Attendance and Behavior
    const overallMarks = [
      student.English,
      student.LifeSkills,
      student.Tech,
      student.ProblemSolving,
      student.Attendance,
      student.Behavior,
    ].filter((mark) => typeof mark === "number" && !isNaN(mark));

    student.Overall = Math.round(
      overallMarks.reduce((sum, mark) => sum + mark, 0) / overallMarks.length
    );

    return student;
  });

  // Calculate class averages
  const classAverage = {
    student: "classAverage", // Label for the average row
    English: 0,
    LifeSkills: 0,
    Tech: 0,
    ProblemSolving: 0,
    Project: 0,
    Attendance: 0,
    Behavior: 0,
    AcademicOverall: 0,
    Overall: 0,
  };

  // Sum up the marks for each subject
  const totalStudents = Object.keys(studentData).length;

  if (totalStudents > 0) {
    const subjects = [
      "English",
      "LifeSkills",
      "Tech",
      "ProblemSolving",
      "Attendance",
      "Behavior",
      "Project",
    ];

    subjects.forEach((subject) => {
      classAverage[subject] = parseFloat(
        (
          Object.values(studentData).reduce(
            (sum, student) => sum + student[subject],
            0
          ) / totalStudents
        ).toFixed(1)
      );
    });


    let forAO=4;
    let forO=6;
    if(hasProjectData){
      forAO=5;
      forO=7;
    }

    classAverage.AcademicOverall = parseFloat(
      (
        (classAverage.English +
          classAverage.LifeSkills +
          classAverage.Tech +
          classAverage.ProblemSolving+classAverage.Project) /
        forAO
      ).toFixed(1)
    );

    const overallMarks = [
      classAverage.English,
      classAverage.LifeSkills,
      classAverage.Tech,
      classAverage.ProblemSolving,
      classAverage.Attendance,
      classAverage.Behavior,
      classAverage.Project,
    ].filter((mark) => typeof mark === "number" && !isNaN(mark));

    classAverage.Overall = Number(parseFloat(overallMarks.reduce((sum, mark) => sum + mark, 0) / forO).toFixed(1));
  }

  // Append the classAverage object to the tableData array
  tableData.push(classAverage);

  // Initialize Handsontable instance
  const container = document.getElementById("handsontable-container");
  hot = new Handsontable(container, {
    data: tableData,
    colHeaders: [
      "Student Name",
      "English",
      "LifeSkills",
      "Tech",
      "Problem Solving",
      "Attendance",
      "Behavior",
      "Academic Overall",
      "Overall",
    ],
    columns: [
      { data: "student", readOnly: true },
      { data: "English", type: "numeric", readOnly: true },
      { data: "LifeSkills", type: "numeric", readOnly: true },
      { data: "Tech", type: "numeric", readOnly: true },
      { data: "ProblemSolving", type: "numeric", readOnly: true },
      { data: "Attendance", type: "numeric" },
      { data: "Behavior", type: "numeric" },
      { data: "AcademicOverall", type: "numeric", readOnly: true },
      { data: "Overall", type: "numeric", readOnly: true },
    ],
    cells: function (row, col) {
      const cellProperties = {};
      if (tableData[row] && tableData[row].student === 'classAverage') {
        cellProperties.readOnly = true;
      }
      return cellProperties;
    },
    rowHeaders: true,
    width: "100%",
    height: "auto",
    licenseKey: "non-commercial-and-evaluation",
    afterChange: handleAfterChange,
  });


  document.getElementById("addProject").checked = hasProjectData;

  // Trigger the toggleProjectColumn function if "Project" data exists
  if (hasProjectData) {
    toggleProjectColumn({ target: { checked: true } });
  }

  // Handle Project column addition/removal
  document
    .getElementById("addProject")
    .addEventListener("change", toggleProjectColumn);

  // Warn user before page unload if there are unsaved changes
  window.addEventListener("beforeunload", (event) => {
      saveOrUpdateResult();
  });

  // Save or Update result data on button click
  saveButton.addEventListener("click", saveOrUpdateResult);
});

function handleAfterChange(changes) {
  if (changes) {
    changes.forEach(([row, prop, oldValue, newValue]) => {
      // Retrieve updated data directly from Handsontable
      const student = hot.getSourceDataAtRow(row);

      // Calculate AcademicOverall based on specific subjects
      if (
        ["English", "LifeSkills", "Tech", "ProblemSolving", "Project"].includes(
          prop
        )
      ) {
        const subjectsToInclude = [
          "English",
          "LifeSkills",
          "Tech",
          "ProblemSolving",
        ];

        // Include Project if present in the Handsontable headers
        if (hot.getColHeader().includes("Project")) {
          subjectsToInclude.push("Project");
        }

        // Calculate AcademicOverall
        const academicTotal = subjectsToInclude.reduce((sum, subject) => {
          return sum + (student[subject] || 0);
        }, 0);

        student.AcademicOverall = parseFloat(
          (academicTotal / subjectsToInclude.length).toFixed(1)
        );
        hot.setDataAtRowProp(row, "AcademicOverall", student.AcademicOverall);
      }

      // Calculate Overall including additional fields (Attendance and Behavior)
      if (
        [
          "English",
          "LifeSkills",
          "Tech",
          "ProblemSolving",
          "Attendance",
          "Behavior",
          "Project",
        ].includes(prop)
      ) {
        const fieldsToInclude = [
          student.English,
          student.LifeSkills,
          student.Tech,
          student.ProblemSolving,
          student.Attendance,
          student.Behavior,
        ];

        // Add Project if it's included in the Handsontable headers
        if (hot.getColHeader().includes("Project")) {
          fieldsToInclude.push(student.Project);
        }

        // Calculate Overall
        const validMarks = fieldsToInclude.filter(
          (mark) => typeof mark === "number" && !isNaN(mark)
        );
        student.Overall = Math.round(
          validMarks.reduce((sum, mark) => sum + mark, 0) / validMarks.length
        );
        hot.setDataAtRowProp(row, "Overall", student.Overall);
      }
    });
  }
}

// Toggle the Project column visibility in Handsontable
function toggleProjectColumn(event) {
  const isChecked = event.target.checked;
  if (isChecked) {
    const currentCols = hot.getSettings().columns;
    const currentHeaders = hot.getColHeader();
    const newCols = [
      ...currentCols.slice(0, 5),
      projectColumn,
      ...currentCols.slice(5),
    ];
    const newHeaders = [
      ...currentHeaders.slice(0, 5),
      "Project",
      ...currentHeaders.slice(5),
    ];
    hot.updateSettings({ columns: newCols, colHeaders: newHeaders });
  } else {
    const projectColIndex = hot.getColHeader().indexOf("Project");
    if (projectColIndex > -1) {
      hot.updateSettings({
        columns: hot
          .getSettings()
          .columns.filter((_, index) => index !== projectColIndex),
        colHeaders: hot
          .getColHeader()
          .filter((_, index) => index !== projectColIndex),
      });
    }
  }
}

// Save or update result data in Firebase
async function saveOrUpdateResult() {
  const resultPath = `/studentMarks/${section}/months/${month}/result`;
  const resultData = tableData.reduce((acc, student) => {
    const studentNames = student.student;
    const isChecked = document.getElementById("addProject").checked;
    if (isChecked) {
      acc[studentNames] = {
        Attendance: student.Attendance || 0,
        Behavior: student.Behavior || 0,
        English: student.English || 0,
        LifeSkills: student.LifeSkills || 0,
        Tech: student.Tech || 0,
        ProblemSolving: student.ProblemSolving || 0,
        Project: student.Project || 0,
        AcademicOverall: student.AcademicOverall || 0,
        Overall: student.Overall || 0,
      };
    } else {
      acc[studentNames] = {
        Attendance: student.Attendance || 0,
        Behavior: student.Behavior || 0,
        English: student.English || 0,
        LifeSkills: student.LifeSkills || 0,
        Tech: student.Tech || 0,
        ProblemSolving: student.ProblemSolving || 0,
        AcademicOverall: student.AcademicOverall || 0,
        Overall: student.Overall || 0,
      };
    }
    return acc;
  }, {});

  try {
    await set(ref(database, resultPath), resultData);
    showSuccessMessage("Result saved successfully!");
  } catch (error) {
    console.error("Error saving result data:", error);
    alert("Error saving result data. Please check the console for details.");
  }
}

// Define the column configuration for the Project column
const projectColumn = {
  data: "Project",
  type: "numeric",
  readOnly: false,
};

// Function to show success message
function showSuccessMessage(str) {
  const message = document.getElementById("successMessage");
  message.innerText = str;
  message.classList.add("show");
  setTimeout(() => {
    message.classList.remove("show");
  }, 3000); // Display message for 3 seconds
}

document.getElementById("backButton").addEventListener("click", () => {
  localStorage.setItem("monthly", true);
  window.location.href = "home.html";
});
