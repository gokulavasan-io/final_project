import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-firestore.js";
import Handsontable from 'https://cdn.jsdelivr.net/npm/handsontable@11.0.0/+esm'; // Import Handsontable

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
const db = getFirestore(app);
let hot;
const container = document.getElementById('attendanceTable');
const attendanceOptions = ['P', 'A', 'LA', 'AP', 'SL', 'CL', 'HL'];
let columns = [
  { data: 'name', type: 'text', readOnly: true, title: 'Name' }
];
const attendanceTypes = [
  'Present', 'Absent', 'Late Arrival', 'Approved Permission',
  'Sick Leave', 'Casual Leave', 'Half Day Leave', 'TotalScore',
  'Percentage', 'Student Percentage'
];
const monthName = localStorage.getItem("dataSet"); // Month name from localStorage
const section=localStorage.getItem("section");
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date(Date.parse(monthName + " 1, 2024")).getMonth(); // Get month index
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate(); // Days in the current month

async function fetchStudentNames() {
  try {
    const docRef = collection(db, `FSSA/studentsBaseData/${section}`); // Use 'db' instead of 'firestore'
    const docSnap = await getDocs(docRef);

    if (!docSnap.empty) {
      const studentNames = docSnap.docs.map((doc) => doc.id); // Get student names
      if (Array.isArray(studentNames) && studentNames.length > 0) {
        return studentNames.map(name => {
          // For each student, create an object with a 'name' and placeholders for each day
          const student = { name };
          const totalDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

          // Add placeholder for each day
          for (let day = 1; day <= totalDays; day++) {
            student[`day${day}`] = ''; // Empty or default value for each day
          }

          return student;
        });
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

function initializeTable(students) {

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6; // Sunday or Saturday

    columns.push({
      data: `day${day}`,
      type: 'dropdown',
      title: ` ${day}/${currentMonth}`,
      source: attendanceOptions,
      readOnly: false,
      className: isWeekend ? 'non-working' : '' // Apply 'non-working' class if weekend
    });
  }


  attendanceTypes.forEach(type => {
    columns.push({
      data: type,
      type: 'numeric',
      readOnly: true,
      title: type
    });
  });

  // Initialize Handsontable with configuration
   hot = new Handsontable(container, {
    data: students,
    columns: columns,
    rowHeaders: true,
    colHeaders: columns.map(col => col.title),
    licenseKey: 'non-commercial-and-evaluation',
    fixedColumnsLeft: 1,
    licenseKey: "non-commercial-and-evaluation",
    width: "100%",
    height: "100%",
    stretchH: "all",
    overflow: "hidden",
    autoColumnSize: true,
    autoRowSize: true,
    contextMenu: {
      items: {
        "markAsHoliday": {
          name: "Mark this day as holiday",
          callback: function (_, selection) {
            if (selection && selection[0] && typeof selection[0].start.col !== 'undefined') {
              const col = selection[0].start.col;
              if (col > 0 && col <= daysInMonth) {
                for (let row = 0; row < students.length; row++) {
                  hot.setCellMeta(row, col, 'className', 'holiday');
                }
                hot.render();
              }
            }
          }
        },
        "removeHoliday": {
          name: "Remove holiday",
          callback: function (_, selection) {
            if (selection && selection[0] && typeof selection[0].start.col !== 'undefined') {
              const col = selection[0].start.col;
              if (col > 0 && col <= daysInMonth) {
                for (let row = 0; row < students.length; row++) {
                  if (hot.getCellMeta(row, col).className === 'holiday') {
                    hot.setCellMeta(row, col, 'className', '');
                  }
                }
                hot.render();
              }
            }
          }
        },
        "addRemark": {
          name: "Add a remark...",
          callback: function (_, selection) {
            if (selection && selection[0]) {
              const row = selection[0].start.row;
              const col = selection[0].start.col;
              const studentName = students[row].name;
              const day = columns[col].title;
              const remark = prompt("Enter your remark:");
              if (remark) {
                const remarksBody = document.getElementById("remarksBody");
                const rowElement = document.createElement("tr");
                rowElement.innerHTML = `<td>${studentName}</td><td>${day}</td><td>${remark}</td>`;
                remarksBody.appendChild(rowElement);
                hot.setCellMeta(row, col, 'className', 'remarked');
                hot.render();
              }
            }
          }
        }
      }
    },
    afterChange: function (changes, source) {
      if (source === 'edit' && changes) {
        hot.render();
      }
    }
  });

  // Set a height and width for the container to trigger scrolling
  container.style.height = '600px';
  container.style.width = '100%';
}

// Fetch student names and initialize the table
fetchStudentNames().then((students) => {
  if (students.length > 0) {
    initializeTable(students);  // Initialize the table after fetching student names
  } else {
    console.log("No students found.");
  }
}).catch(error => {
  console.error("Error fetching students:", error);
});


// Show loading animation
function showLoading() {
  document.getElementById('loadingOverlay').style.display = 'flex';
  document.getElementById('countBtn').disabled = true;  // Disable the button
}

// Hide loading animation
function hideLoading() {
  document.getElementById('loadingOverlay').style.display = 'none';
  document.getElementById('countBtn').disabled = false;  // Re-enable the button
}

// Update progress message
function updateProgress(current, total) {
  const percentage = Math.round((current / total) * 100);
  const message = `Calculating scores... ${percentage}% complete`;
  document.getElementById('progressMessage').textContent = message;
}


function updateAttendanceCounts() {
  showLoading();
  let dailyCounts = [];
  const students = hot.getData();
  const totalStudents = students.length;
  let currentStudentIndex = 0;

  // Initialize daily counts
  for (let day = 1; day <= daysInMonth; day++) {
    dailyCounts[day] = {
      'Present': 0,
      'Absent': 0,
      'Late Arrival': 0,
      'Approved Permission': 0,
      'Sick Leave': 0,
      'Casual Leave': 0,
      'Half Day Leave': 0
    };
  }

  function processStudent() {
    if (currentStudentIndex < students.length) {
      const student = students[currentStudentIndex];
      let count = {
        'Present': 0,
        'Absent': 0,
        'Late Arrival': 0,
        'Approved Permission': 0,
        'Sick Leave': 0,
        'Casual Leave': 0,
        'Half Day Leave': 0
      };
      let workingDays = 0;

      for (let col = 1; col <= daysInMonth; col++) {
        const value = hot.getDataAtCell(currentStudentIndex, col);
        switch (value) {
          case 'P':
            count['Present']++;
            dailyCounts[col]['Present']++;
            break;
          case 'A':
            count['Absent']++;
            dailyCounts[col]['Absent']++;
            break;
          case 'LA':
            count['Late Arrival']++;
            dailyCounts[col]['Late Arrival']++;
            break;
          case 'AP':
            count['Approved Permission']++;
            dailyCounts[col]['Approved Permission']++;
            break;
          case 'SL':
            count['Sick Leave']++;
            dailyCounts[col]['Sick Leave']++;
            break;
          case 'CL':
            count['Casual Leave']++;
            dailyCounts[col]['Casual Leave']++;
            break;
          case 'HL':
            count['Half Day Leave']++;
            dailyCounts[col]['Half Day Leave']++;
            break;
        }
        workingDays++;
      }

      // Update attendance columns
      attendanceTypes.forEach((type, idx) => {
        const score = type === 'TotalScore' ? calculateTotalScore(count) : count[type];
        hot.setDataAtCell(currentStudentIndex, columns.length - 10 + idx, score);
      });

      const totalScore = calculateTotalScore(count);
      const percentage = (totalScore / workingDays) * 100;
      const studentPercentage = (count['Present'] / workingDays) * 100;

      hot.setDataAtCell(currentStudentIndex, columns.length - 3, totalScore);
      hot.setDataAtCell(currentStudentIndex, columns.length - 2, percentage.toFixed(2));
      hot.setDataAtCell(currentStudentIndex, columns.length - 1, studentPercentage.toFixed(2));
      updateProgress(currentStudentIndex + 1, totalStudents);

      currentStudentIndex++;
      setTimeout(processStudent, 0);  // Schedule next iteration
    }
    else{
      hideLoading(); 
    }
  }

  processStudent(); // Start the process
}


// Function to calculate total score based on the attendance counts
function calculateTotalScore(count) {
  let totalScore = 0;

  totalScore += count['Present'];
  totalScore += (count['Late Arrival'] >= 3 ? 0.5 : count['Late Arrival']);
  totalScore += (count['Approved Permission'] > 2 ? 0.5 : count['Approved Permission']);
  totalScore += count['Half Day Leave'] * 0.5;
  totalScore += count['Sick Leave'] <= 2 ? count['Sick Leave'] : 0;
  totalScore += count['Casual Leave'];

  return totalScore;
}

// Trigger daily count updates on the "Count Attendance" button
document.getElementById('countBtn').addEventListener('click', updateAttendanceCounts);
