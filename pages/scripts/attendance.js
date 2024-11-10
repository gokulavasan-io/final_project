import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  child,
  update,remove,
  set,
} from "https://www.gstatic.com/firebasejs/9.14.0/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDROuHKj-0FhMQbQtPVeEGVb4h89oME5T0",
  authDomain: "fir-demo-4a5b4.firebaseapp.com",
  projectId: "fir-demo-4a5b4",
  storageBucket: "fir-demo-4a5b4.appspot.com",
  messagingSenderId: "716679557063",
  appId: "1:716679557063:web:603a78f59045ceeaf133e2",
};



const container = document.getElementById('attendanceTable');

// Attendance dropdown values
const attendanceOptions = [
    'P', // Present
    'A', // Absent
    'LA', // Late Arrival
    'AP', // Approved Permission
    'SL', // Sick Leave
    'CL', // Casual Leave
    'HL'  // Half Day Leave
];

// Month string to month index mapping
function getMonthIndex(monthName) {
  const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
  ];
  return monthNames.indexOf(monthName);
}

// Define month and year
const monthName = localStorage.getItem("dataSet"); // Replace this with the desired month name
const currentYear = new Date().getFullYear();
const currentMonth = getMonthIndex(monthName);

// Define columns array outside the if block
let columns = [{ data: 'name', type: 'text', readOnly: true, title: 'Name' }];
const nonWorkingDays = [];

// Validate month name
if (currentMonth === -1) {
  console.error("Invalid month name");
} else {
  // Get the number of days in the specified month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Generate day headers and identify weekends (non-working days)
  for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6; // Sunday or Saturday

      columns.push({
          data: `day${day}`,
          type: 'dropdown',
          title: `Day ${day}`,
          source: attendanceOptions,
          readOnly: false,
          className: isWeekend ? 'non-working' : '' // Apply 'non-working' class if weekend
      });

      if (isWeekend) {
          nonWorkingDays.push(`day${day}`);
      }
  }

  // Use columns and nonWorkingDays as needed
  console.log(columns);
  console.log(nonWorkingDays);
}

// Add columns for each attendance type (Present, Absent, etc.)
const attendanceTypes = [
    'Present', 'Absent', 'Late Arrival', 'Approved Permission',
    'Sick Leave', 'Casual Leave', 'Half Day Leave', 'TotalScore',
    'Percentage', 'Student Percentage'
];

attendanceTypes.forEach(type => {
    columns.push({
        data: type,
        type: 'numeric',
        readOnly: true,
        title: type
    });
});

// Now `columns` is available for further use, e.g., populating a table or creating a UI


// Initial sample data for attendance (add your own)
const data = [
    { name: 'John Doe' },
    { name: 'Jane Smith' },
    { name: 'Alice Johnson' }
];

// Initialize Handsontable
const hot = new Handsontable(container, {
    data,
    columns,
    rowHeaders: true,
    colHeaders: columns.map(col => col.title),
    licenseKey: 'non-commercial-and-evaluation',
    persistentState: false,
    scrollHorizontally: true,
    scrollVertically: true,
    fixedColumnsStart: 1,
    contextMenu: {
        items: {
            "markAsHoliday": {
                name: "Mark this day as holiday",
                callback: function (_, selection) {
                    if (selection && selection[0] && typeof selection[0].start.col !== 'undefined') {
                        const col = selection[0].start.col;

                        // Only apply holiday marking to day columns (not the name column or the attendance columns)
                        if (col > 0 && col <= daysInMonth) {
                            for (let row = 0; row < data.length; row++) {
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

                        // Only remove holiday marking for columns with 'holiday' class (i.e., already marked as holiday)
                        if (col > 0 && col <= daysInMonth) {
                            for (let row = 0; row < data.length; row++) {
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

                        // Get the student's name and day (column title)
                        const studentName = data[row].name;
                        const day = columns[col].title;

                        // Prompt for a remark
                        const remark = prompt("Enter your remark:");
                        if (remark) {
                            // Display the remark below the table
                            const remarksBody = document.getElementById("remarksBody");
                            const rowElement = document.createElement("tr");
                            rowElement.innerHTML = `<td>${studentName}</td><td>${day}</td><td>${remark}</td>`;
                            remarksBody.appendChild(rowElement);

                            // Optionally, add a visual indicator on the cell (e.g., change background color)
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
            hot.render(); // Force a single render after batch updates
        }
    },
    cells: function (row, col) {
        const cellProperties = {};
        const prop = this.instance.colToProp(col);

        // Apply non-working days style (red for weekends)
        if (nonWorkingDays.includes(prop)) {
            cellProperties.className = 'non-working';
        }

        return cellProperties;
    }
});

function updateAttendanceCounts() {
    let dailyCounts = [];

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

    for (let row = 0; row < data.length; row++) {
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
            const value = hot.getDataAtCell(row, col);
            const cellClass = hot.getCellMeta(row, col).className;

            if (nonWorkingDays.includes(`day${col}`) || cellClass === 'holiday') continue;

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

        columns.slice(-10, -3).forEach((col, idx) => {
            const type = col.title;
            hot.setDataAtCell(row, columns.length - 10 + idx, count[type]);
        });

        const totalScore = calculateTotalScore(count);
        hot.setDataAtCell(row, columns.length - 3, totalScore);

        const percentage = (totalScore / workingDays) * 100;
        const studentPercentage = (count['Present'] / workingDays) * 100;

        hot.setDataAtCell(row, columns.length - 2, percentage.toFixed(2));
        hot.setDataAtCell(row, columns.length - 1, studentPercentage.toFixed(2));
    }

    displayDailyCounts(dailyCounts);
}

const dailyCountsContainer = document.getElementById('dailyCountsTable');
let dailyCountsHot = new Handsontable(dailyCountsContainer, {
data: [],  // Start with an empty data array
colHeaders: ['Day', 'Present', 'Absent', 'Late Arrival', 'Approved Permission', 'Sick Leave', 'Casual Leave', 'Half Day Leave'],
columns: [
{ data: 'Day', type: 'text', readOnly: true },
{ data: 'Present', type: 'numeric', readOnly: true },
{ data: 'Absent', type: 'numeric', readOnly: true },
{ data: 'Late Arrival', type: 'numeric', readOnly: true },
{ data: 'Approved Permission', type: 'numeric', readOnly: true },
{ data: 'Sick Leave', type: 'numeric', readOnly: true },
{ data: 'Casual Leave', type: 'numeric', readOnly: true },
{ data: 'Half Day Leave', type: 'numeric', readOnly: true }
],
licenseKey: 'non-commercial-and-evaluation',
rowHeaders: true,
columnSorting: true ,// Enable sorting only
renderAllRows: true, // Render all rows at once
width: dailyCountsContainer.offsetWidth, // Set container width to prevent horizontal scrolling
stretchH: 'all', // Stretch columns to container width
height: 'auto' // Adjust height as needed to ensure all rows are displayed
});

// Update data for the daily counts Handsontable
function displayDailyCounts(dailyCounts) {
const dailyCountsData = [];

for (let day = 1; day <= daysInMonth; day++) {
const prop = `day${day}`;
const anyHoliday = data.some((_, row) => hot.getCellMeta(row, day).className === 'holiday');

if (!nonWorkingDays.includes(prop) && !anyHoliday) {
dailyCountsData.push({
Day: `Day ${day}`,
Present: dailyCounts[day]['Present'],
Absent: dailyCounts[day]['Absent'],
'Late Arrival': dailyCounts[day]['Late Arrival'],
'Approved Permission': dailyCounts[day]['Approved Permission'],
'Sick Leave': dailyCounts[day]['Sick Leave'],
'Casual Leave': dailyCounts[day]['Casual Leave'],
'Half Day Leave': dailyCounts[day]['Half Day Leave']
});
}
}

// Update Handsontable data
dailyCountsHot.loadData(dailyCountsData);
}
// Trigger daily count updates on the "Count Attendance" button click
document.getElementById('dailyCount').addEventListener('click', function () {
    updateAttendanceCounts(); // Trigger the count update
});

// Function to calculate total score based on the attendance counts
function calculateTotalScore(count) {
    let totalScore = 0;

    // Calculate the score based on the provided formula
    totalScore += count['Present'];
    totalScore += (count['Late Arrival'] >= 3 ? 0.5 : count['Late Arrival']);
    totalScore += (count['Approved Permission'] > 2 ? 0.5 : count['Approved Permission']);
    totalScore += count['Half Day Leave'] * 0.5;
    totalScore += count['Sick Leave'] <= 2 ? count['Sick Leave'] : 0;
    totalScore += count['Casual Leave'];

    return totalScore;
}

// Add event listener for "Count Attendance" button
document.getElementById('countBtn').addEventListener('click', function () {
    updateAttendanceCounts(); // Trigger the count update when button is clicked
});

document.addEventListener("DOMContentLoaded", () => {
    // Listen for holiday marking and trigger re-calculation
    hot.addHook('afterSetCellMeta', function (row, col, key, value) {
        if (key === 'className' && (value === 'holiday' || value === '')) {
            updateAttendanceCounts(); // Recalculate attendance counts whenever holiday status changes
        }
    });
});




