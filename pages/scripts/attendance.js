import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import {
  getDatabase,
  get,
  update,
  ref,
  set,
} from "https://www.gstatic.com/firebasejs/9.14.0/firebase-database.js";
import {
  getFirestore,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/9.14.0/firebase-firestore.js";
import Handsontable from "https://cdn.jsdelivr.net/npm/handsontable@11.0.0/+esm"; // Import Handsontable

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
const firebase = getDatabase();
let hot;
const container = document.getElementById("attendanceTable");
const attendanceOptions = ["P", "A", "LA", "AP", "SL", "CL", "HL"];
let columns = [{ data: "name", type: "text", readOnly: true, title: "Name" }];

const monthName = localStorage.getItem("dataSet"); // Month name from localStorage
document.getElementById("monthName").innerText = monthName;
const section = localStorage.getItem("section");
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
        return studentNames.map((name) => {
          // For each student, create an object with a 'name' and placeholders for each day
          const student = { name };
          const totalDays = new Date(
            new Date().getFullYear(),
            new Date().getMonth() + 1,
            0
          ).getDate();

          // Add placeholder for each day
          for (let day = 1; day <= totalDays; day++) {
            student[`day${day}`] = ""; // Empty or default value for each day
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

// Function to initialize the Handsontable once with empty student data
function initializeTable(students) {
  // Only include the 'name' column and one column for each day
  columns = [{ data: "name", type: "text", readOnly: true, title: "Name" }];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6; // Sunday or Saturday

    columns.push({
      data: `day${day}`,
      type: "dropdown",
      title: ` ${day}/${currentMonth + 1}`,
      source: attendanceOptions,
      readOnly: false,
      className: isWeekend ? "non-working" : "", // Apply 'non-working' class if weekend
    });
  }

  // Initialize Handsontable with updated configuration
  hot = new Handsontable(container, {
    data: students,  // Initially empty student data will be replaced later
    columns: columns,
    rowHeaders: true,
    colHeaders: columns.map((col) => col.title),
    licenseKey: "non-commercial-and-evaluation",
    fixedColumnsLeft: 1,
    width: "100%",
    height: "100%",
    stretchH: "all",
    overflow: "hidden",
    autoColumnSize: true,
    autoRowSize: true,
    contextMenu: {
      items: {
        markAsHoliday: {
          name: "Mark this day as holiday",
          callback: function (_, selection) {
            if (
              selection &&
              selection[0] &&
              typeof selection[0].start.col !== "undefined"
            ) {
              const col = selection[0].start.col;
              if (col > 0 && col <= daysInMonth) {
                for (let row = 0; row < students.length; row++) {
                  hot.setCellMeta(row, col, "className", "holiday");
                }
                hot.render();
              }
            }
          },
        },
        removeHoliday: {
          name: "Remove holiday",
          callback: function (_, selection) {
            if (
              selection &&
              selection[0] &&
              typeof selection[0].start.col !== "undefined"
            ) {
              const col = selection[0].start.col;
              if (col > 0 && col <= daysInMonth) {
                for (let row = 0; row < students.length; row++) {
                  if (hot.getCellMeta(row, col).className === "holiday") {
                    hot.setCellMeta(row, col, "className", "");
                  }
                }
                hot.render();
              }
            }
          },
        },
        addRemark: {
          name: "Add a remark...",
          callback: function (_, selection) {
            if (selection && selection[0]) {
              const row = selection[0].start.row;
              const col = selection[0].start.col;
              const studentName = students[row].name;
              const day = columns[col].title;
        
              // Display the remark input area
              const forRemarks = document.getElementById("forRemarks");
              forRemarks.style.display = "flex";

              // Set up Cancel button
              document.getElementById("cancel").onclick = () => {
                forRemarks.style.display = "none";
              };
        
              // Set up Confirm button
              document.getElementById("confirm").onclick = () => {
                const remark = document.getElementById("newRemark").value;
                  // Add cell highlight
                  hot.setCellMeta(row, col, "className", "remarked");
                  hot.render();
                  
                  console.log(remark);
                  document.getElementById("newRemark").value = "";
                  forRemarks.style.display = "none";
              };
            }
          },
        }
      },
    },
    afterChange: function (changes, source) {
      if (source === "edit" && changes) {
        hot.render();
      }
    },
  });

  // Set a height and width for the container to trigger scrolling
  container.style.height = "600px";
  container.style.width = "100%";
}

// Function to fetch attendance data from Firebase, including class names
async function fetchAttendanceData(studentName) {
  const studentRef = ref(
    firebase,
    `/studentMarks/${section}/Attendance/${monthName}/attendanceData/${studentName}`
  );
  try {
    const snapshot = await get(studentRef);
    if (snapshot.exists()) {
      return snapshot.val(); // Return the attendance data for this student
    } else {
      console.log(`No attendance data found for ${studentName}`);
      return null; // Return null if no data exists
    }
  } catch (error) {
    console.error(`Error fetching data for ${studentName}:`, error);
    return null;
  }
}

// Fetch student names, initialize an empty table, and then populate data
fetchStudentNames()
  .then((students) => {
    if (students.length > 0) {
      initializeTable(students); // Initialize the table with the empty student data structure
      populateInitialData(students); // Then populate the data and update the table
    } else {
      console.log("No students found.");
    }
  })
  .catch((error) => {
    console.error("Error fetching students:", error);
  });


  
  async function populateInitialData(students) {
    for (const student of students) {
      const studentAttendance = await fetchAttendanceData(student.name);
  
      if (studentAttendance) {
        for (let day = 1; day <= daysInMonth; day++) {
          const dayIndex = day;
          const dayData = studentAttendance[dayIndex];
  
          if (dayData) {
            const dayKey = `day${day}`;
            student[dayKey] = dayData.value || "";
  
            // Log the className to verify it exists
            if (dayData.className) {
              console.log(`Setting class for ${student.name} on day ${day}: ${dayData.className}`);
            }
          }
        }
      }
    }
  
    // Load data into Handsontable
    hot.loadData(students);
  
    // After data is loaded, apply metadata
    hot.updateSettings({
      afterLoadData: function () {
        applyCellMetadata(students);
      },
    });
  
    // Hide loading message
    document.getElementById("loading").style.display = "none";
  }
  
  function applyCellMetadata(students) {
    students.forEach((student, rowIndex) => {
      for (let day = 1; day <= daysInMonth; day++) {
        const dayKey = `day${day}`;
        const dayData = student[dayKey];
  
        if (dayData && dayData.className && hot) {
          // Set the metadata
          hot.setCellMeta(rowIndex, day, "className", dayData.className);
          console.log(`Applying class '${dayData.className}' to row ${rowIndex}, col ${day}`);
        }
      }
    });
  
    // Render the table to apply metadata
    hot.render();
  }
  
  





// Show loading animation
function showLoading() {
  document.getElementById("loadingOverlay").style.display = "flex";
  document.getElementById("countBtn").disabled = true; // Disable the button
}

// Hide loading animation
function hideLoading() {
  document.getElementById("loadingOverlay").style.display = "none";
  document.getElementById("countBtn").disabled = false; // Re-enable the button
}

// Update progress message
function updateProgress(current, total) {
  const percentage = Math.round((current / total) * 100);
  const message = `Calculating scores... ${percentage}% complete`;
  document.getElementById("progressMessage").textContent = message;
}

// Function to calculate total score based on the attendance counts
function calculateTotalScore(count) {
  let totalScore = 0;

  totalScore += count["Present"];
  totalScore += count["Late Arrival"] >= 3 ? 0.5 : count["Late Arrival"];
  totalScore +=
    count["Approved Permission"] > 2 ? 0.5 : count["Approved Permission"];
  totalScore += count["Half Day Leave"] * 0.5;
  totalScore += count["Sick Leave"] <= 2 ? count["Sick Leave"] : 0;
  totalScore += count["Casual Leave"];

  return totalScore;
}

// Trigger daily count updates on the "Count Attendance" button
document
  .getElementById("countBtn")
  .addEventListener("click", updateAttendanceCounts);

function showAttendancePopup(statistics) {
  // Make sure the popup is visible
  const popup = document.getElementById("attendancePopup");
  popup.style.display = "block";

  const container = document.getElementById("attendancePopupTable");

  const columns = [
    { title: "Student Name", data: "name" },
    { title: "Present", data: "present" },
    { title: "Absent", data: "absent" },
    { title: "Late Arrival", data: "lateArrival" },
    { title: "Approved Permission", data: "approvedPermission" },
    { title: "Sick Leave", data: "sickLeave" },
    { title: "Casual Leave", data: "casualLeave" },
    { title: "Half Day Leave", data: "halfDayLeave" },
    { title: "Total Score", data: "totalScore" },
    { title: "Percentage", data: "percentage" },
    { title: "Student Percentage", data: "studentPercentage" },
  ];

  // Initialize the popup Handsontable
  window.monthlyAttendanceData = new Handsontable(container, {
    data: statistics,
    colHeaders: columns.map((col) => col.title),
    columns: columns,
    rowHeaders: true,
    width: "100%",
    height: "300px",
    stretchH: "all",
    licenseKey: "non-commercial-and-evaluation",
    readOnly: true,
  });
}

// Close the popup when the close button is clicked
document.getElementById("closePopupBtn").addEventListener("click", function () {
  saveMonthlyData();
  document.getElementById("attendancePopup").style.display = "none";
});

document
  .getElementById("dailyCount")
  .addEventListener("click", showDailyStatistics);

// Function to show the popup and initialize the Handsontable
function showDailyStatisticsPopup(dailyCounts) {
  // Show the popup
  const popup = document.getElementById("dailyAttendancePopup");
  popup.style.display = "block";

  const container = document.getElementById("dailyAttendancePopupTable");

  const columns = [
    { title: "Day", data: "day" },
    { title: "Present", data: "present" },
    { title: "Absent", data: "absent" },
    { title: "Late Arrival", data: "lateArrival" },
    { title: "Approved Permission", data: "approvedPermission" },
    { title: "Sick Leave", data: "sickLeave" },
    { title: "Casual Leave", data: "casualLeave" },
    { title: "Half Day Leave", data: "halfDayLeave" },
  ];

  // Initialize Handsontable for daily statistics
  const hot = new Handsontable(container, {
    data: dailyCounts,
    colHeaders: columns.map((col) => col.title),
    columns: columns,
    rowHeaders: true,
    width: "100%",
    height: "300px",
    stretchH: "all",
    licenseKey: "non-commercial-and-evaluation",
    readOnly: true,
  });

  // Close button for the popup
  const closeButton = document.getElementById("closePopupBtnForDaily");
  closeButton.addEventListener("click", function () {
    // Save data when the popup is closed
    saveDailyAttendanceData(dailyCounts);

    // Close the popup
    document.getElementById("dailyAttendancePopup").style.display = "none";
  });
}

// Update attendance counts excluding weekends and holidays
function updateAttendanceCounts() {
  showLoading();
  const students = hot.getData();
  const totalStudents = students.length;
  let currentStudentIndex = 0;

  function processStudent() {
    if (currentStudentIndex < students.length) {
      const student = students[currentStudentIndex];
      let count = {
        Present: 0,
        Absent: 0,
        "Late Arrival": 0,
        "Approved Permission": 0,
        "Sick Leave": 0,
        "Casual Leave": 0,
        "Half Day Leave": 0,
      };
      let workingDays = 0;

      for (let col = 1; col <= daysInMonth; col++) {
        const date = new Date(currentYear, currentMonth, col);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6; // Check for weekend
        const isHoliday = hot.getCellMeta(0, col).className.includes("holiday"); // Check for holiday

        // Skip weekends and holidays
        if (isWeekend || isHoliday) {
          continue;
        }

        const value = hot.getDataAtCell(currentStudentIndex, col);
        switch (value) {
          case "P":
            count["Present"]++;
            break;
          case "A":
            count["Absent"]++;
            break;
          case "LA":
            count["Late Arrival"]++;
            break;
          case "AP":
            count["Approved Permission"]++;
            break;
          case "SL":
            count["Sick Leave"]++;
            break;
          case "CL":
            count["Casual Leave"]++;
            break;
          case "HL":
            count["Half Day Leave"]++;
            break;
        }
        workingDays++;
      }

      // Calculate total score and percentage
      const totalScore = calculateTotalScore(count);
      const percentage = (totalScore / workingDays) * 100;
      const studentPercentage = (count["Present"] / workingDays) * 100;

      // Push calculated stats to the array for the popup table
      statistics.push({
        name: student[0],
        present: count["Present"],
        absent: count["Absent"],
        lateArrival: count["Late Arrival"],
        approvedPermission: count["Approved Permission"],
        sickLeave: count["Sick Leave"],
        casualLeave: count["Casual Leave"],
        halfDayLeave: count["Half Day Leave"],
        totalScore: totalScore,
        percentage: percentage.toFixed(2),
        studentPercentage: studentPercentage.toFixed(2),
      });

      updateProgress(currentStudentIndex + 1, totalStudents);

      currentStudentIndex++;
      setTimeout(processStudent, 0); // Schedule next iteration
    } else {
      hideLoading();
      showAttendancePopup(statistics); // Show popup when finished
    }
  }

  let statistics = [];
  processStudent(); // Start the process
}

function showDailyStatistics() {
  showLoading();

  let dailyCounts = [];

  // Initialize the counts array to hold stats for each working day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6; // Sunday or Saturday
    const isHoliday = hot.getCellMeta(0, day).className.includes("holiday"); // Check if the cell has the holiday class

    // Only count weekdays (non-weekend days)
    if (!(isWeekend || isHoliday)) {
      dailyCounts.push({
        day: `${day}/ ${currentMonth + 1}`,
        dayIndex: day, // Store the original day index for easier lookup
        present: 0,
        absent: 0,
        lateArrival: 0,
        approvedPermission: 0,
        sickLeave: 0,
        casualLeave: 0,
        halfDayLeave: 0,
      });
    }
  }

  // Check if Handsontable (hot) is initialized
  if (!hot) {
    console.error("Handsontable is not initialized yet.");
    alert(
      "Please wait until the table is loaded before viewing daily statistics."
    );
    return;
  }

  const students = hot.getData();

  // Iterate through each student and update daily counts based on attendance type
  students.forEach((student) => {
    for (let col = 1; col <= daysInMonth; col++) {
      const date = new Date(currentYear, currentMonth, col);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6; // Sunday or Saturday

      // Skip if it's a weekend or holiday-marked day
      const isHoliday = hot.getCellMeta(0, col).className.includes("holiday"); // Check if the cell has the holiday class
      if (isWeekend || isHoliday) {
        continue; // Skip this day if it's a weekend or holiday
      }

      const value = student[col];
      const dailyStat = dailyCounts.find((d) => d.dayIndex === col); // Find the correct entry by day index
      if (!dailyStat) continue; // Skip if no corresponding dailyStat found (for safety)

      // Update the attendance counts based on attendance type
      switch (value) {
        case "P":
          dailyStat.present++;
          break;
        case "A":
          dailyStat.absent++;
          break;
        case "LA":
          dailyStat.lateArrival++;
          break;
        case "AP":
          dailyStat.approvedPermission++;
          break;
        case "SL":
          dailyStat.sickLeave++;
          break;
        case "CL":
          dailyStat.casualLeave++;
          break;
        case "HL":
          dailyStat.halfDayLeave++;
          break;
      }
    }
  });

  // Display daily counts in a popup using Handsontable
  showDailyStatisticsPopup(dailyCounts);
  hideLoading();
}


async function saveAttendanceData() {
  const data = hot.getData(); // Get the data from Handsontable
  const attendanceData = {}; // Object to store attendance data with class names

  // Loop through each row (student)
  data.forEach((row, rowIndex) => {
    const studentName = row[0]; // Assuming the first column is the student's name
    const studentData = {}; // Object to store attendance data for each student

    // Loop through each cell in the row, skipping the name column (index 0)
    row.slice(1).forEach((value, colIndex) => {
      const dayIndex = colIndex + 1; // Adjust for zero-based index to match days
      const cellMeta = hot.getCellMeta(rowIndex, dayIndex);
      const className = cellMeta.className || ""; // Get class name or empty string if none

      // Store cell value and class name in the studentData object
      studentData[`${dayIndex}`] = {
        value: value,
        className: className
      };
    });

    // Add each student's data to the attendanceData object, using the student's name as the key
    attendanceData[studentName] = studentData;
  });

  // Define Firebase path for saving data
  const path = `/studentMarks/${section}/Attendance/${monthName}/attendanceData`;
  const attendanceDataRef = ref(firebase, path);

  // Save or update data in Firebase
  get(attendanceDataRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        // Update if data already exists
        update(attendanceDataRef, attendanceData)
          .then(() => {
            console.log("Attendance data updated successfully!");
          })
          .catch((error) => {
            console.error("Error updating data: ", error);
          });
      } else {
        // Set if data does not exist
        set(attendanceDataRef, attendanceData)
          .then(() => {
            console.log("Attendance data saved successfully!");
          })
          .catch((error) => {
            console.error("Error saving data: ", error);
          });
      }
    })
    .catch((error) => {
      console.error("Error checking data existence: ", error);
    });

  showSuccessMessage("Attendance data saved successfully!");
}


// Button event listener to save data
document.getElementById("save").addEventListener("click", saveAttendanceData);

// Function to save data to the specified path
async function saveDailyAttendanceData(dailyCounts) {
  const path = `/studentMarks/${section}/Attendance/${monthName}/dailyData`; // Path where you want to save the data

  // Reference to the path where the data is stored
  const dailyDataRef = ref(firebase, path);

  // Check if data already exists at the specified path
  get(dailyDataRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        // If data exists, update it with new values
        // Ensure dailyCounts is an object when using update
        update(dailyDataRef, { dailyCounts })
          .then(() => {
            console.log("Attendance data updated successfully!");
          })
          .catch((error) => {
            console.error("Error updating data: ", error);
          });
      } else {
        // If data doesn't exist, use set to save it
        set(dailyDataRef, dailyCounts)
          .then(() => {
            console.log("Attendance data saved successfully!");
          })
          .catch((error) => {
            console.error("Error saving data: ", error);
          });
      }
    })
    .catch((error) => {
      console.error("Error checking data existence: ", error);
    });
}

// Function to save attendance data before closing the popup
async function saveMonthlyData() {
  // Get data from the Handsontable instance
  const attendanceData = monthlyAttendanceData.getData(); // Get the data from Handsontable

  // Format the data as an object using student names as keys
  const formattedData = {};
  attendanceData.forEach((row) => {
    const studentName = row[0]; // Assuming the first column is the student's name
    formattedData[studentName] = {
      present: row[1],
      absent: row[2],
      lateArrival: row[3],
      approvedPermission: row[4],
      sickLeave: row[5],
      casualLeave: row[6],
      halfDayLeave: row[7],
      totalScore: row[8],
      percentage: row[9],
      studentPercentage: row[10],
    };
  });

  const path = `/studentMarks/${section}/months/${monthName}/attendanceData`; // Path to save data

  // Save or update data in Firebase
  const attendanceDataRef = ref(firebase, path);
  get(attendanceDataRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        // Update if data already exists
        update(attendanceDataRef, formattedData)
          .then(() => {
            console.log("Attendance data updated successfully!");
          })
          .catch((error) => {
            console.error("Error updating data: ", error);
          });
      } else {
        // Set if data does not exist
        set(attendanceDataRef, formattedData)
          .then(() => {
            console.log("Attendance data saved successfully!");
          })
          .catch((error) => {
            console.error("Error saving data: ", error);
          });
      }
    })
    .catch((error) => {
      console.error("Error checking data existence: ", error);
    });
}




document.getElementById("cancel").addEventListener("click", function () {
  document.getElementById("forRemarks").style.display = "none";
});


document.getElementById("confirm").addEventListener("click", function () {

  

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