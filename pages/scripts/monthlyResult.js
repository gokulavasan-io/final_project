import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-database.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDROuHKj-0FhMQbQtPVeEGVb4h89oME5T0",
  authDomain: "fir-demo-4a5b4.firebaseapp.com",
  projectId: "fir-demo-4a5b4",
  storageBucket: "fir-demo-4a5b4",
  messagingSenderId: "716679557063",
  appId: "1:716679557063:web:603a78f59045ceeaf133e2",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const firestore = getFirestore(app);

let isDataChanged = false;


async function fetchStudentNames(classSection) {
  try {
    const docRef = doc(firestore, "FSSA/studentNames");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const studentNames = docSnap.data()[classSection] || [];
      return Array.isArray(studentNames) && studentNames.length > 0 ? studentNames : [];
    } else {
      alert("No document found for the selected class.");
      return [];
    }
  } catch (error) {
    console.error("Error fetching student names:", error);
    alert("Error fetching student names.");
    return [];
  }
}

async function fetchResultData(path) {
  const resultRef = ref(database, path);
  const resultSnapshot = await get(resultRef);
  return resultSnapshot.exists() ? resultSnapshot.val() : null;
}

document.addEventListener("DOMContentLoaded", async () => {
  const subjects = ["English", "LifeSkills", "Tech", "ProblemSolving"];
  const month = localStorage.getItem("month");
  const section=localStorage.getItem("section");

  const resultPath = `/studentMarks/${section}/months/${month}/result`;
  let tableData = [];
  const saveButton = document.getElementById("saveResult");

  const resultData = await fetchResultData(resultPath);

  if (resultData) {
    tableData = resultData;
    saveButton.textContent = "Update Result";
    saveButton.style.display = "block";
    document.querySelector(".seebuttons").style.display = "flex";
  } else {
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
        Overall:0
      };
    });

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
            const marksRef = ref(database, `/studentMarks/${section}/${subject}/${fileName}/students`);
            const marksSnapshot = await get(marksRef);
    
            if (marksSnapshot.exists()) {
              const marks = marksSnapshot.val();
              if (Array.isArray(marks)) {
                marks.forEach(([studentName, , mark]) => {
                  const numericMark = typeof mark === "number" && !isNaN(mark) ? mark : 0;
    
                  if (studentName) {
                    markSums[studentName] = (markSums[studentName] || 0) + numericMark;
                    markCounts[studentName] = (markCounts[studentName] || 0) + 1;
                  }
                });
              }
            }
          })
        );
      }
    
      studentNames.forEach((studentName) => {
        const average = markCounts[studentName] ? markSums[studentName] / markCounts[studentName] : 0;
        studentData[studentName][subject] = average;
      });
    }
    
    await Promise.all(subjects.map(fetchAndAverageMarks));

    tableData = Object.values(studentData).map(student => {
      student.AcademicOverall = (student.English + student.LifeSkills + student.Tech + student.ProblemSolving) / subjects.length;
      return student;
    });

    saveButton.textContent = "Save Result";
    saveButton.style.display = "block";
  }

  const container = document.getElementById("handsontable-container");
  const hot = new Handsontable(container, {
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
      "Overall"
    ],
    columns: [
      { data: "student", readOnly: true },
      { data: "English", type: "numeric" , readOnly: true},
      { data: "LifeSkills", type: "numeric", readOnly: true },
      { data: "Tech", type: "numeric", readOnly: true },
      { data: "ProblemSolving", type: "numeric", readOnly: true },
      { data: "Attendance",type: "numeric" },
      { data: "Behavior",type: "numeric" },
      { data: "AcademicOverall", type: "numeric", readOnly: true },
      { data: "Overall", type: "numeric", readOnly: true },
    ],
    rowHeaders: true,
    width: "100%",
    height: "auto",
    licenseKey: "non-commercial-and-evaluation",

    afterChange: (changes) => {
      if (changes) {
        isDataChanged = true; // Mark data as changed
        changes.forEach(([row, prop, oldValue, newValue]) => {
          const student = tableData[row];
    
          // Update AcademicOverall if one of the main subjects changed
          if (["English", "LifeSkills", "Tech", "ProblemSolving"].includes(prop)) {
            student.AcademicOverall = 
              (student.English + student.LifeSkills + student.Tech + student.ProblemSolving) / subjects.length;
            hot.setDataAtRowProp(row, "AcademicOverall", student.AcademicOverall);
          }
    
          // Update Overall average if any relevant field changes
          if (["English", "LifeSkills", "Tech", "ProblemSolving", "Attendance", "Behavior"].includes(prop)) {
            const totalSubjects = 6; // Total number of fields contributing to Overall
            const fields = [student.English, student.LifeSkills, student.Tech, student.ProblemSolving, student.Attendance, student.Behavior];
            const validMarks = fields.filter(mark => typeof mark === 'number' && !isNaN(mark)); // Only include valid numbers
    
            student.Overall = validMarks.reduce((sum, mark) => sum + mark, 0) / validMarks.length;
            hot.setDataAtRowProp(row, "Overall", student.Overall);
          }
        });
      }
    }
    
  });

  // Warn the user if they try to leave the page without saving
  window.addEventListener("beforeunload", (event) => {
    if (isDataChanged) {
      event.preventDefault(); // Prevent the default action
      event.returnValue = ''; // Display the confirmation dialog
    }
  });

  const saveOrUpdateResult = async () => {
    try {
      await set(ref(database, resultPath), tableData);
      showSuccessMessage(saveButton.textContent === "Save Result" ? "Result saved successfully!" : "Result updated successfully!");
      saveButton.textContent = "Update Result";
      isDataChanged = false; // Reset change flag after saving
    } catch (error) {
      console.error("Error saving/updating result:", error);
      alert("Error saving/updating result.");
    }
  };

  saveButton.removeEventListener("click", saveOrUpdateResult);
  saveButton.addEventListener("click", saveOrUpdateResult);

  document.getElementById("month").textContent=month;

  document.getElementById("seeAnalysis").addEventListener("click",()=>{
    localStorage.setItem("month",month);
    window.location.href ="../../pages/html/analysis.html";
  })

});


document.getElementById("backButton").addEventListener("click",()=>{
  localStorage.setItem("monthly",true);
  window.history.back();
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
