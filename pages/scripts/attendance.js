import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import {
  getDatabase,
  get,
  push,
  update,
  remove,
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
    data: students,
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
          name: "Mark as Holiday",
          callback: function (key, selection) {
            const columnIndex = selection[0].start.col; // Get the column index of the selected cell
            markHoliday(columnIndex); // Mark this column as a holiday
          },
          disabled: function (key, selection) {
            return false; // Always enable for this example
          },
        },
        removeHoliday: {
          name: "Remove from Holiday",
          callback: async function (_, selection) {
            if (
              selection &&
              selection[0] &&
              typeof selection[0].start.col !== "undefined"
            ) {
              const col = selection[0].start.col; // Get the column index from the selected cell
              await removeHolidayFromTable(col); // Call the separate function to remove the holiday
            }
          },
        },

        addRemark: {
          name: "Add a remark",
          callback: function (key, selection) {
            if (selection && selection[0]) {
              const row = selection[0].start.row;
              const col = selection[0].start.col;
              addRemarkHandler(row, col, students, columns);
            }
          },
          disabled: function (key, selection) {
            return false; // Enable by default
          },
        },
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

// Function to fetch attendance data from Firebase
async function fetchAttendanceData(studentName) {
  const studentRef = ref(
    firebase,
    `/studentMarks/${section}/Attendance/${monthName}/${studentName}`
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

// Function to populate initial data with Firebase data if available
async function populateInitialData(students) {
  for (const student of students) {
    const attendanceData = await fetchAttendanceData(student.name);

    if (attendanceData) {
      // Merge attendance data into the student's row
      for (let day = 1; day <= daysInMonth; day++) {
        student[`day${day}`] = attendanceData[day - 1] || ""; // Use Firebase data or default to empty
      }
    }
  }
  initializeTable(students); // Initialize table with populated data
  document.getElementById("loading").style.display = "none";
}

// Fetch student names, populate data, and initialize the table
fetchStudentNames()
  .then((students) => {
    if (students.length > 0) {
      populateInitialData(students); // Populate data before initializing the table
    } else {
      console.log("No students found.");
    }
  })
  .catch((error) => {
    console.error("Error fetching students:", error);
  });

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

function calculateTotalScore(count) {
  let totalScore = 0;

  totalScore += count["Present"];

  if (count["Late Arrival"] < 3) {
    totalScore += count["Late Arrival"]; // Full points if less than 3
  } else {
    totalScore += 2 + Math.floor((count["Late Arrival"] - 2) / 3) * 0.5;
  }

  if (count["Approved Permission"] < 3) {
    totalScore += count["Approved Permission"]; // Full points if less than 3
  } else {
    totalScore += 2 + Math.floor((count["Approved Permission"] - 2) / 3) * 0.5;
  }

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
  saveStudentData();
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

// Update attendance counts excluding weekends (Saturdays and Sundays)
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
        const isWeekend = date.getDay() === 0 || date.getDay() === 6; // Check if it's a weekend (Sunday or Saturday)

        // Skip if it's a weekend (Sunday or Saturday)
        if (isWeekend) {
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

        if (value != "Holiday") {
          workingDays++;
        }
        // Increment working days only if it's not a weekend
      }

      document.querySelector("#attendancePopup p span").innerText = workingDays;

      // Calculate total score and percentage, ensure workingDays isn't zero
      const totalScore = calculateTotalScore(count);
      const percentage = workingDays > 0 ? (totalScore / workingDays) * 100 : 0;
      const studentPercentage =
        workingDays > 0 ? (count["Present"] / workingDays) * 100 : 0;

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

// Function to show daily statistics (including all days, no filtering for weekends or holidays)
function showDailyStatistics() {
  showLoading();

  let dailyCounts = [];

  // Initialize the counts array to hold stats for each day of the month (no weekend/holiday filtering)
  for (let day = 1; day <= daysInMonth; day++) {
    dailyCounts.push({
      day: `${day}/ ${currentMonth + 1}`,
      present: 0,
      absent: 0,
      lateArrival: 0,
      approvedPermission: 0,
      sickLeave: 0,
      casualLeave: 0,
      halfDayLeave: 0,
    });
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
      const value = student[col];

      // Check that the dailyCounts object is initialized properly before modifying
      if (dailyCounts[col - 1]) {
        switch (value) {
          case "P":
            dailyCounts[col - 1].present++;
            break;
          case "A":
            dailyCounts[col - 1].absent++;
            break;
          case "LA":
            dailyCounts[col - 1].lateArrival++;
            break;
          case "AP":
            dailyCounts[col - 1].approvedPermission++;
            break;
          case "SL":
            dailyCounts[col - 1].sickLeave++;
            break;
          case "CL":
            dailyCounts[col - 1].casualLeave++;
            break;
          case "HL":
            dailyCounts[col - 1].halfDayLeave++;
            break;
        }
      }
    }
  });

  // Display daily counts in a popup using Handsontable
  showDailyStatisticsPopup(dailyCounts);
  hideLoading();
}

///// for saving

async function saveAttendanceData() {
  const data = hot.getData(); // Get the data from Handsontable
  const updates = {}; // Object to hold all updates

  data.forEach((row) => {
    const studentName = row[0]; // Assuming the first column is the student's name
    const studentData = row.slice(1); // The rest of the row data (attendance info)

    // Prepare the path for the student and save the array directly
    const path = `/studentMarks/${section}/Attendance/${monthName}/${studentName}`;

    // Assign the array directly to the student's path
    updates[path] = studentData;
  });

  try {
    // Perform a single multi-location update
    await update(ref(firebase), updates);
    console.log("Attendance data saved successfully!");
    showSuccessMessage("Attendance data saved successfully!");
  } catch (error) {
    console.error("Error saving attendance data: ", error);
  }
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
async function saveStudentData() {
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

  const path = `/studentMarks/${section}/months/${monthName}/Attendance`; // Path to save data

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

const holidayDiv = document.getElementById("holidaysList");

async function markHoliday(columnIndex) {
  if (!holidayDiv) {
    console.error("Holidays list div not found!");
    return;
  }

  // Adjust for 1-based indexing
  const date = new Date(currentYear, currentMonth, columnIndex);
  const dateStr = `${date.getDate()}/${currentMonth + 1}`;

  // Check if the holiday for this columnIndex already exists
  const existingItem = holidayDiv.querySelector(
    `[data-column-index='${columnIndex}']`
  );
  if (existingItem) {
    console.warn("This column is already marked as a holiday.");
    return;
  }

  document.getElementById("forHoliday").style.display = "flex";

  // Set placeholder dynamically
  const inputField = document.getElementById("newHoliday");
  inputField.placeholder = `Why is ${date.toLocaleString("en-us", {
    weekday: "long",
  })}, ${dateStr} a holiday?`;

  const confirmButton = document.getElementById("confirmHoliday");
  const cancelButton = document.getElementById("cancelHoliday");

  // Remove existing event listeners
  confirmButton.replaceWith(confirmButton.cloneNode(true));
  cancelButton.replaceWith(cancelButton.cloneNode(true));

  const newConfirmButton = document.getElementById("confirmHoliday");
  const newCancelButton = document.getElementById("cancelHoliday");

  let reason = "";

  // Event listener for confirm button
  newConfirmButton.addEventListener("click", async () => {
    document.getElementById("forHoliday").style.display = "none";
    reason = inputField.value.trim();
    if (!reason) {
      alert("Please provide a reason for the holiday.");
      return;
    }
    inputField.value = "";
    // Create and append the holiday item
    const holidayItem = document.createElement("div");
    holidayItem.classList.add("holiday-item");
    holidayItem.textContent = `Day: ${date.toLocaleString("en-us", {
      weekday: "long",
    })}, Date: ${dateStr} - Reason: ${reason}`;
    holidayItem.setAttribute("data-column-index", columnIndex);
    holidayDiv.appendChild(holidayItem);

    // Set the "Holiday" value in the selected column
    try {
      for (let row = 0; row < hot.countRows(); row++) {
        hot.setDataAtCell(row, columnIndex, "Holiday"); // Adjust for 0-based index
        hot.setCellMeta(row, columnIndex, "readOnly", true);
      }
      hot.render(); // Re-render the table
    } catch (error) {
      console.error("Error marking column as a holiday: ", error);
    }

    // Save holiday details to Firebase
    document.getElementById("loading").style.display = "flex";
    try {
      const holidayPath = `/studentMarks/${section}/Attendance/${monthName}/Holidays/${dateStr
        .split("/")
        .join("-")}`;

      const holidayData = {
        date: dateStr,
        reason,
      };

      await set(ref(firebase, holidayPath), holidayData);
      console.log("Holiday saved to Firebase successfully!");
    } catch (error) {
      console.error("Error saving holiday to Firebase: ", error);
    } finally {
      document.getElementById("loading").style.display = "none";
      showSuccessMessage("Holiday added successfully !");
    }
  });

  // Event listener for cancel button
  newCancelButton.addEventListener("click", () => {
    inputField.value = "";
    document.getElementById("forHoliday").style.display = "none";
  });
}

async function removeHolidayFromTable(columnIndex) {
  document.getElementById("loading").style.display = "flex";

  if (columnIndex > 0 && columnIndex <= daysInMonth) {
    // Validate the column index

    const date = new Date(currentYear, currentMonth, columnIndex); // Create the date from column index
    const dateStr = `${date.getDate()}/${currentMonth + 1}`; // Format the date string

    // Remove the holiday from Firebase
    try {
      const holidayPath = `/studentMarks/${section}/Attendance/${monthName}/Holidays/${dateStr
        .split("/")
        .join("-")}`;
      await remove(ref(firebase, holidayPath)); // Delete holiday data from Firebase
      console.log(`Holiday on ${dateStr} removed from Firebase.`);
    } catch (error) {
      console.error("Error removing holiday from Firebase: ", error);
    }

    // Clear the cells in the Handsontable column and reset to default values
    try {
      const rowCount = hot.countRows(); // Get the number of rows directly from Handsontable

      for (let row = 0; row < rowCount; row++) {
        hot.setDataAtCell(row, columnIndex, ""); // Reset the cell content
        hot.setCellMeta(row, columnIndex, "readOnly", false); // Make the column editable again
      }
      hot.render(); // Re-render the table to apply changes
    } catch (error) {
      console.error("Error clearing holiday column in Handsontable: ", error);
    }

    // Remove the holiday item from the holidays list
    const holidayItem = holidayDiv.querySelector(
      `[data-column-index='${columnIndex}']`
    );
    if (holidayItem) {
      holidayItem.remove(); // Remove the holiday entry from the list
    }
    setTimeout(() => {
      document.getElementById("loading").style.display = "none";
      showSuccessMessage("Holiday removed successfully !");
    }, 100);
  }
}

const holidaysListPopup = document.getElementById("holidaysListPopup");

document.getElementById("holidaysShow").addEventListener("click", () => {
  holidaysListPopup.style.display = "block";
});

document
  .getElementById("closePopupBtnForHoliday")
  .addEventListener("click", () => {
    holidaysListPopup.style.display = "none";
  });

async function initializeHolidayList() {
  console.log("Initializing holiday list...");

  if (!holidayDiv) {
    console.error("Holiday list div not found!");
    return;
  }

  try {
    const holidayPath = `/studentMarks/${section}/Attendance/${monthName}/Holidays`;
    const snapshot = await get(ref(firebase, holidayPath));

    if (snapshot.exists()) {
      const holidays = snapshot.val();

      // Clear existing items in the list
      holidayDiv.innerHTML = "";

      Object.entries(holidays).forEach(([key, holidayDetails]) => {
        const holiday = holidayDetails;

        if (holiday && holiday.date) {
          const holidayItem = document.createElement("div");
          holidayItem.classList.add("holiday-item");

          const [day, month] = holiday.date.split("/");

          const dateStr = `${currentYear}-${month}-${day}`;

          const date = new Date(dateStr);
          const dayName = date.toLocaleString("en-us", {
            weekday: "long",
          });

          // Display the formatted holiday info
          holidayItem.innerHTML = `<div><strong>Date : &nbsp;</strong>${holiday.date}/${currentYear}</div><div><strong>Day :&nbsp;</strong>${dayName}</div><div><strong>Reason :&nbsp;</strong> ${holiday.reason}</div>`;

          holidayDiv.appendChild(holidayItem);
        }
      });
    } else {
      console.log("No holidays found for this month.");
    }
  } catch (error) {
    console.error("Error fetching holidays from Firebase: ", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initializeHolidayList();
});

// for remarks:
const remarksPopup = document.getElementById("remarksListPopup");

// Open the remarks popup and fetch remarks from Firebase
document.getElementById("remarks").addEventListener("click", async () => {
  console.log("Opening remarks popup...");
  remarksPopup.style.display = "block";

  // Fetch remarks from Firebase
  await fetchRemarksFromFirebase();
});

// Close the remarks popup
document
  .getElementById("closePopupBtnForRemarks")
  .addEventListener("click", () => {
    console.log("Closing remarks popup...");
    remarksPopup.style.display = "none";
  });

const remarksDiv = document.getElementById("remarksList");

// Function to fetch and display remarks from Firebase
async function fetchRemarksFromFirebase() {
  const remarksPath = `/studentMarks/${section}/Attendance/${monthName}/Remarks`;

  try {
    // Fetch all remarks from Firebase
    const remarksSnapshot = await get(ref(firebase, remarksPath));
    const remarksData = remarksSnapshot.val();

    // Clear the current remarks in the popup
    remarksDiv.innerHTML = "";

    // Display the remarks
    if (remarksData) {
      for (const dateKey in remarksData) {
        const remarksForDate = remarksData[dateKey];

        // Loop through the remarks for each date
        for (const studentName in remarksForDate) {
          const remark = remarksForDate[studentName];

          const remarkItem = document.createElement("div");
          remarkItem.classList.add("remark-item");

          // Create an editable remark field
          remarkItem.innerHTML = `
            <div>
                <strong>Student :&nbsp;</strong><div class="studentName">${remark.studentName}</div>
            </div>
            <div>
                <strong>Date :&nbsp;</strong> ${remark.date}
            </div>
            <div>
                <strong>Day :&nbsp;</strong> ${remark.day}
            </div>
            <div>
            <strong>Remark : &nbsp;</strong><span class="remark-text">${remark.remark}</span>
            </div>
            <div class="btnForED">
              <button class="edit-btn btn btn-primary">edit</button>
              <button class="delete-btn btn btn-danger" >Delete</button>
            </div>
            <div class="btnForSC">
                <button class="save-btn btn btn-success" style="display:none;">Save</button>
                <button class="cancel-btn btn btn-warning" style="display:none;">cancel</button>
            </div>
            <input class="edit-input form-control" type="text" value="${remark.remark}" style="display:none;" />
          `;
          remarksDiv.appendChild(remarkItem);

          const deleteButton = remarkItem.querySelector(".delete-btn");
          deleteButton.addEventListener("click", () => {
            handleDeleteRemark(remarkItem, remark);
          });

          const editBtn = remarkItem.querySelector(".edit-btn");
          const saveBtn = remarkItem.querySelector(".save-btn");
          const editInput = remarkItem.querySelector(".edit-input");
          const remarkText = remarkItem.querySelector(".remark-text");
          const cancelBtn = remarkItem.querySelector(".cancel-btn");

          // Edit button functionality
          editBtn.addEventListener("click", () => {
            remarkText.style.display = "none";
            editBtn.style.display = "none";
            deleteButton.style.display = "none";
            editInput.style.display = "inline-block";
            saveBtn.style.display = "inline-block";
            cancelBtn.style.display = "inline-block";
          });

          // Save button functionality
          saveBtn.addEventListener("click", async () => {
            const updatedRemark = editInput.value;
            if (updatedRemark) {
              // Save updated remark to Firebase
              const remarkPath = `/studentMarks/${section}/Attendance/${monthName}/Remarks/${dateKey}/${studentName}`;
              const updatedData = {
                studentName: remark.studentName,
                date: remark.date,
                day: remark.day,
                remark: updatedRemark,
              };

              try {
                await set(ref(firebase, remarkPath), updatedData); // Update the remark in Firebase
                console.log("Remark updated in Firebase successfully!");

                // Update the UI
                remarkText.textContent = updatedRemark;
                editInput.style.display = "none";
                deleteButton.style.display = "inline-block";
                remarkText.style.display = "inline";
                editBtn.style.display = "inline-block";
                cancelBtn.style.display = "inline-block";
                saveBtn.style.display = "none";
                cancelBtn.style.display = "none";
              } catch (error) {
                console.error(
                  "Error saving updated remark to Firebase: ",
                  error
                );
              }
            }
          });

          cancelBtn.addEventListener("click", async () => {
            editInput.style.display = "none";
            remarkText.style.display = "inline";
            editBtn.style.display = "inline-block";
            deleteButton.style.display = "inline-block";
            saveBtn.style.display = "none";
            cancelBtn.style.display = "none";
          });
        }
      }
    }
  } catch (error) {
    console.error("Error fetching remarks from Firebase: ", error);
  }
}

// Handle adding a new remark when confirm is clicked
function addRemarkHandler(row, col, students, columns) {
  const studentName = students[row]?.name;
  const columnTitle = columns[col]?.title; // This should be a date string like "1/11", "2/11", "3/11"

  if (!studentName || !columnTitle) {
    console.error("Invalid data for students or columns.");
    return;
  }

  // Parse the date correctly (DD/MM)
  let columnDate;
  if (columnTitle) {
    // Check if the columnTitle is in DD/MM format
    const dateParts = columnTitle.split("/"); // Split the date into day and month
    if (dateParts.length === 2) {
      const day = dateParts[0]; // Day part
      const month = dateParts[1] - 1; // Month part (subtract 1 because months are 0-indexed in JavaScript)
      const currentYear = new Date().getFullYear(); // Get the current year

      // Construct the Date object with current year, month, and day
      columnDate = new Date(currentYear, month, day);
    }
  }

  if (!columnDate || isNaN(columnDate.getTime())) {
    console.error("Invalid date format in column header.");
    return;
  }

  // Format the date to show in the remarks (e.g., "11/16/2024")
  let formattedDate = columnDate.toLocaleDateString();
  let [month, date, year] = formattedDate.split("/");
  formattedDate = `${date}/${month}/${year}`;

  // Get the day name (e.g., "Monday", "Tuesday")
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const day = dayNames[columnDate.getDay()]; // Get the day of the week

  const remarkInput = document.getElementById("newRemark");
  remarkInput.placeholder = `Enter a remark for ${studentName} on ${formattedDate}`;
  const forRemarks = document.getElementById("forRemarks");
  forRemarks.style.display = "flex";

  document.getElementById("cancel").onclick = () => {
    forRemarks.style.display = "none";
  };

  // On confirm, save the new remark to Firebase
  document.getElementById("confirm").onclick = async () => {
    const remark = remarkInput.value;
    if (remark) {
      const remarkData = {
        studentName: studentName,
        date: formattedDate,
        day: day,
        remark: remark,
      };

      const dateStr = formattedDate.split("/").join("-"); // Format the date to match Firebase path

      const remarkPath = `/studentMarks/${section}/Attendance/${monthName}/Remarks/${dateStr}/${studentName}`;

      try {
        // Save the remark to Firebase using student name as key
        await set(ref(firebase, remarkPath), remarkData); // Save directly under the student name
        console.log("Remark saved to Firebase successfully!");
        showSuccessMessage("Remark saved successfully !");
      } catch (error) {
        console.error("Error saving remark to Firebase: ", error);
      }

      hot.render();

      // Clear input and hide remark input area
      document.getElementById("newRemark").value = "";
      forRemarks.style.display = "none";
    }
  };
}

// Function to handle deleting a remark
function handleDeleteRemark(remarkItem, remarkData) {
  // Remove the remark item from the DOM
  remarkItem.remove();

  // Format the date for Firebase path
  const dateStr = remarkData.date.split("/").join("-"); // Format the date to match Firebase path

  // Construct the Firebase path where the remark is stored
  const remarkPath = `/studentMarks/${section}/Attendance/${monthName}/Remarks/${dateStr}/${remarkData.studentName}`;

  try {
    // Remove the remark data from Firebase
    remove(ref(firebase, remarkPath));
    console.log("Remark deleted from Firebase successfully!");
    showSuccessMessage("Remark deleted successfully !");
  } catch (error) {
    console.error("Error deleting remark from Firebase: ", error);
  }
}

window.addEventListener("beforeunload", async (event) => {
  document.getElementById("loading").style.display = "flex";
  await saveAttendanceData();
});

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

function showDaysCount() {
  document.getElementById("showDaysCount").style.display="flex";
  let workingDays = 0;
  let holidays = 0;
  let weekends = 0;

  for (let col = 1; col <= daysInMonth; col++) {
    const date = new Date(currentYear, currentMonth, col);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    if (isWeekend) {
      weekends++;
    }

    const value = hot.getDataAtCell(1, col);
    if (value == "Holiday") {
      holidays++;
    } else if(!isWeekend){
      workingDays++;
    }
  }

  document.getElementById("totalDays").innerText=daysInMonth;
  document.getElementById("workingDays").innerText=workingDays;
  document.getElementById("weekEnds").innerText=weekends;
  document.getElementById("holidays").innerText=holidays;

}

document.getElementById("infoLogo").addEventListener("click",showDaysCount);
document.getElementById("closePopupBtnForCount").addEventListener("click",()=>{
  document.getElementById("showDaysCount").style.display="none";
});

