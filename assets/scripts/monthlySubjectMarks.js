import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  update,
  get,
  remove,
  child,
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

let hotForAllMarks;
let pieChart;
let colors = ["red", "yellow", "green", "absent"];
let month = localStorage.getItem("month");
let subject = localStorage.getItem("subject");
const section = localStorage.getItem("section");
const validateFilename = (filename) => {
  if (filename.trim() === "") {
    return false; // Reject empty or whitespace-only strings
  }
  const regex = /^(?=.*[a-zA-Z])[\w\s\-.]{1,254}$/;
  return regex.test(filename);
};


function splitByUpperCase(str) {
  return str.replace(/([A-Z])/g, ' $1').trim();
}


// Fetch dataset names and marks, then display in Handsontable
async function fetchDataAndDisplay() {
  document.getElementById("subjectOfTheTable").innerText = `${splitByUpperCase(subject)}-`;
  document.getElementById("monOfTheSubject").innerText = month;
  const datasetPath = `/FSSA/${section}/${month}/${subject}`;
  const tableContainer = document.getElementById("table");
  const studentData = {};
  let columnHeaders = ["Name", "Average"];
  let avgData = { green: 0, yellow: 0, red: 0 };

  const datasetSnapshot = await get(child(ref(db), datasetPath));

  if (datasetSnapshot.exists()) {
    const datasets = datasetSnapshot.val();
    document.getElementById("loading").style.display = "none";

    if (!datasets || typeof datasets !== "object") {
      console.error("Datasets are empty or not in the expected format");
      document.getElementById("loading").style.display = "none";
      document.getElementById("forEmptyMonth").style.display = "flex";
      return;
    }

    document.getElementById("forEmptyMonth").style.display = "none";
    document.getElementById("saveAverageData").style.display = "inline-block";
    document.getElementById("showColors").style.display = "block";
    document.querySelector(".forChart").style.display = "flex";
    document.querySelector(".averageTableContainer").style.display = "flex";

    const sortedDatasets = Object.entries(datasets)
      .map(([datasetName, datasetDetails]) => ({
        name: datasetName,
        ...datasetDetails,
      }))
      .sort((a, b) => {
        const timestampA = new Date(a.timestamp || 0).getTime();
        const timestampB = new Date(b.timestamp || 0).getTime();
        return timestampA - timestampB; // Sort in ascending order
      })
      .filter((file) => !file.isArchive);

    if(sortedDatasets.length==0){
        document.getElementById("table").style.visibility="hidden"
        document.getElementById("forEmptyMonth").style.display = "flex";
        document.getElementById("saveAverageData").style.display = "none";
        document.getElementById("showColors").style.display = "none";
        document.querySelector(".forChart").style.display = "none";
        document.querySelector(".averageTableContainer").style.display = "none";
        return;
    }
    document.getElementById("table").style.visibility="visible"
    document.getElementById("forEmptyMonth").style.display = "none";
    document.getElementById("saveAverageData").style.display = "inline-block";
    document.getElementById("showColors").style.display = "block";
    document.querySelector(".forChart").style.display = "flex";
    document.querySelector(".averageTableContainer").style.display = "flex";



    for (const dataset of sortedDatasets) {
      const datasetName = dataset.name;
      const students = dataset.students || {};
      columnHeaders.push(datasetName);

      for (const [studentName, studentDetails] of Object.entries(students)) {
        if (!studentData[studentName]) {
          studentData[studentName] = { Name: studentName, marks: [] };
        }

        const averageMark = studentDetails?.averageMark || 0;
        studentData[studentName][datasetName] = averageMark;
        studentData[studentName].marks.push(averageMark);
      }
    }

    // Calculate averages and prepare for table rendering
    Object.values(studentData).forEach((student) => {
      const totalMarks = student.marks.reduce((sum, mark) => {
        const validMark = typeof mark === "number" && !isNaN(mark) ? mark : 0; // Replace NaN or non-numeric marks with 0
        return sum + validMark;
      }, 0);

      const averageMarks = totalMarks / (student.marks.length || 1); // Avoid division by 0 if the array is empty
      student["Average"] = averageMarks.toFixed(2);

      if (averageMarks >= 81) avgData.green += 1;
      else if (averageMarks >= 51) avgData.yellow += 1;
      else avgData.red += 1;
    });

    // Step 4: Convert studentData to array format for Handsontable
    const tableData = Object.values(studentData).map((student) => {
      return columnHeaders.map((header) => student[header] || 0); // Use 0 if value is undefined
    });

    const hotSettings = {
      data: tableData,
      colHeaders: columnHeaders,
      rowHeaders: true,
      width: "100%",
      height: "auto", // Set table height to fit content
      licenseKey: "non-commercial-and-evaluation",
      readOnly: true, // Make everything readonly
      fixedColumnsLeft: 2,
      afterOnCellMouseDown: function (event, coords) {
        // Check if the clicked cell is in the header row (row index -1)
        if (coords.row === -1 && coords.col > 1) {
          fetchAndDisplayData(columnHeaders[coords.col], false);
        }
      },
      afterChange: function (changes, source) {
        if (changes) {
          changes.forEach(([row, col, oldValue, newValue]) => {
            if (col > 0) {
              // Skip the "Name" column (col 0)
              const average = parseFloat(
                hotForAllMarks.getDataAtCell(
                  row,
                  columnHeaders.indexOf("Average")
                )
              );
              let colorClass = "";

              // Determine the color based on the average score
              if (average >= 81) {
                colorClass = "green";
              } else if (average >= 51) {
                colorClass = "yellow";
              } else {
                colorClass = "red";
              }

              // Apply the color class to the cell
              hotForAllMarks.setCellMeta(row, col, "className", colorClass);
              hotForAllMarks.render(); // Re-render the table to apply changes
            }
          });
        }
      },
    };

    if (hotForAllMarks) {
      hotForAllMarks.destroy();
    }

    hotForAllMarks = new Handsontable(tableContainer, hotSettings);
    const ctx = document.getElementById("myChart").getContext("2d");

    // Check if there's an existing chart, and destroy it if so
    if (pieChart) {
      pieChart.destroy();
    }
    // Create a new chart
    pieChart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["81-100", "51-80", "0-50"],
        datasets: [
          {
            data: [avgData.green, avgData.yellow, avgData.red],
            backgroundColor: ["#4CAF50", "#FFEB3B", "#F44336"],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "top",
          },
          tooltip: {
            callbacks: {
              label: function (tooltipItem) {
                return tooltipItem.label + ": " + tooltipItem.raw + " students";
              },
            },
          },
        },
      },
    });

    updateCountTable(Object.values(avgData));

    let colorsApplied = false;

    document
      .getElementById("showColors")
      .addEventListener("click", function () {
        hotForAllMarks.getData().forEach((row, rowIndex) => {
          if (rowIndex >= 0) {
            // Skip the header row
            row.forEach((cell, colIndex) => {
              if (colIndex > 0 && colIndex < columnHeaders.length) {
                // Skip "Name" and "Average" columns
                const cellValue = parseFloat(cell);
                let colorClass = "";

                // Determine color based on cell value
                if (cellValue >= 81) {
                  colorClass = "green";
                } else if (cellValue >= 51) {
                  colorClass = "yellow";
                } else if (!isNaN(cellValue)) {
                  // If cell has a valid number less than 51
                  colorClass = "red";
                }

                // Toggle cell color based on the `colorsApplied` state
                if (colorsApplied) {
                  hotForAllMarks.setCellMeta(
                    rowIndex,
                    colIndex,
                    "className",
                    ""
                  ); // Clear color
                  document.getElementById("showColors").innerText =
                    "Show Colors";
                } else {
                  hotForAllMarks.setCellMeta(
                    rowIndex,
                    colIndex,
                    "className",
                    colorClass
                  ); // Apply color
                  document.getElementById("showColors").innerText =
                    "Remove Colors";
                }
              }
            });
          }
        });

        hotForAllMarks.render(); // Re-render the table to apply changes

        // Toggle the colorsApplied state
        colorsApplied = !colorsApplied;
      });
  } else {
    document.getElementById("loading").style.display = "none";
    document.getElementById("forEmptyMonth").style.display = "flex";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fetchDataAndDisplay();
});

async function updateCountTable(scoreRanges) {
  let totalStudents = scoreRanges.reduce((a, b) => a + b);
  let colors = ["green", "yellow", "red"];
  let percentage = (n) => {
    return Math.round((n / totalStudents) * 100);
  };
  colors.forEach((x, i) => {
    document.getElementById(`${x}Count`).innerText = scoreRanges[i];
    document.getElementById(`${x}Percent`).innerText = `${percentage(
      scoreRanges[i]
    )}%`;
  });
}

function getFirstTwoColumnsData() {
  const tableData = hotForAllMarks.getData();
  const firstTwoColumnsData = {};

  tableData.forEach((row) => {
    const name = row[0];
    let average = row[1];

    // If average is a string but can be converted to a number, convert it
    if (typeof average === "string" && !isNaN(parseFloat(average))) {
      average = parseFloat(average); // Convert string to number
    }

    // Ensure average is a number, default to 0 if invalid
    average = typeof average === "number" && !isNaN(average) ? average : 0;

    if (name) {
      firstTwoColumnsData[name] = average; // Save the average directly as a number
    }
  });

  return firstTwoColumnsData;
}

async function saveFirstTwoColumnsData() {
  if (subject == "AttendanceMarks") {
    subject = "Attendance";
  }
  const datasetPath = `/FSSA/${section}/${month}/Result/${subject}`;
  const rawData = getFirstTwoColumnsData(); // Get the formatted data directly

  try {
    // Check if the dataset already exists
    const datasetRef = ref(db, datasetPath);
    const snapshot = await get(datasetRef);

    if (snapshot.exists()) {
      // Dataset exists, update it
      await update(datasetRef, rawData); // Save the data directly
      console.log("Dataset updated successfully.");
      showSuccessMessage("Data Saved successfully");
    } else {
      // Dataset does not exist, create it
      await set(datasetRef, rawData); // Save the data directly
      showSuccessMessage("Data Saved successfully");
      console.log("Dataset created successfully.");
    }
  } catch (error) {
    console.error("Error saving data:", error);
  }
}

document
  .getElementById("saveAverageData")
  .addEventListener("click", saveFirstTwoColumnsData);

window.addEventListener("beforeunload", () => {
  saveFirstTwoColumnsData();
});

// for generation table///////////////////////////////////

["addNewTestByClick", "newTest"].forEach((id) => {
  document.getElementById(id).addEventListener("click", showNewMarkContainer);
});

let hot; // Global variable for Handsontable instance
let newMarkFile;
function showNewMarkContainer() {
  document.getElementById("subjectNew").innerText = subject;
  document.getElementById("monthNew").innerText = month;
  document.getElementById("forAddingNewMarkFull").style.display = "block";

  const container = document.getElementById("handsontableForNew");

  if (!container) {
    console.error("Handsontable container not found!");
    return;
  }

  // Check if hot is initialized or destroyed
  if (!hot || hot.isDestroyed) {
    showNewMarkTable();
    newMarkFile = true;
  } else {
    hot.render(); // Re-render the table if already initialized
  }
}

document.getElementById("closeBtnForNewMark").addEventListener("click", () => {
  document.getElementById("forAddingNewMarkFull").style.display = "none";

  if (hot) {
    hot.destroy(); // Destroy the instance when closing the container
    hot = null; // Clear the reference to avoid accessing destroyed instance
  }
  newMarkFile = false;
  document.getElementById("totalMarks").value = null;
  document.getElementById("datasetName").value = null;
  document.getElementById("saveToFirebase").innerText = "Save";
  document.getElementById("datasetName").readOnly = false;
  fetchDataAndDisplay();
});

async function showNewMarkTable() {
  const container = document.getElementById("handsontableForNew");
  let data = [];
  let Students = [];

  // Fetch student names from Firestore based on section
  async function fetchStudentNames(classSection) {
    try {
      const docRef = collection(firestore, `FSSA/studentsBaseData/${section}`); // Document reference to the classes document
      const docSnap = await getDocs(docRef);

      if (!docSnap.empty) {
        const studentNames = docSnap.docs.map((doc) => doc.id);
        if (Array.isArray(studentNames) && studentNames.length > 0) {
          Students = studentNames;
        } else {
          console.error("No student names found for the selected class.");
          showErrorMessage(
            "No student names found for the selected class.",
            3000
          );
          return [];
        }
      } else {
        console.log("No such document!");
        showErrorMessage("No such document for the selected class.", 3000);
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

  // Get the totalMarks input and parse its value
  const totalMarksInput = document.getElementById("totalMarks");
  let totalMarks = parseInt(totalMarksInput.value);

  // Initialize Handsontable
  hot = new Handsontable(container, {
    data: data,
    colHeaders: ["Student Name", "Marks", "Percentage", "Remarks"],
    columns: [
      { data: 0, type: "text", readOnly: true },
      { data: 1, type: "text" }, // Changed to "text" to accept both numbers and "A" or "a"
      { data: 2, type: "numeric", readOnly: true }, // Display "Absent" as text
      { data: 3, type: "text" },
    ],
    rowHeaders: true,
    colWidths: [200, 100, 100, 100],
    licenseKey: "non-commercial-and-evaluation",
    cells: function (row, col) {
      const cellProperties = {};
      if ((row >= 0 && col == 0) || col == 3)
        cellProperties.className = "fonts";
      return cellProperties;
    },
    afterChange: (changes, source) => {
      createChart();
      if (source === "edit") {
        changes.forEach(([row, prop]) => {
          if (prop === 1) {
            // Only trigger when "Marks" column is edited
            const marks = hot.getDataAtCell(row, 1);
            if (marks > totalMarks) {
              hot.setCellMeta(row, 1, "className", "error");
            }

            // Check if the input is "A" or "a" for absent
            if (marks === "A" || marks === "a") {
              hot.setDataAtCell(row, 2, "Absent"); // Display "Absent" in the average column
              hot.setCellMeta(row, 2, "className", "absent"); // Optional: Apply a style for "Absent"
            } else {
              const marksNumeric = parseFloat(marks);
              if (!isNaN(marksNumeric) && marksNumeric <= totalMarks) {
                hot.setCellMeta(row, 1, "className", "");
                const average = (marksNumeric / totalMarks) * 100;
                hot.setDataAtCell(row, 2, average.toFixed(2));

                // Set the cell color based on the average value
                if (average <= 50) {
                  hot.setCellMeta(row, 2, "className", "red"); // Class for average < 50
                } else if (average > 50 && average < 81) {
                  hot.setCellMeta(row, 2, "className", "yellow"); // Class for 50 <= average < 81
                } else {
                  hot.setCellMeta(row, 2, "className", "green"); // Class for average >= 81
                }
              } else {
                hot.setDataAtCell(row, 2, ""); // Clear average if marks are invalid
              }
            }
          }
          hot.render();
        });
      }
    },
  });
  // Button to calculate total marks
  document.getElementById("calculate").addEventListener("click", () => {
    const customTotalMarks = parseInt(totalMarksInput.value);
    if (!isNaN(customTotalMarks) && customTotalMarks > 0) {
      totalMarks = customTotalMarks;
      updateTableAverages(); // Update averages based on the new totalMarks
    } else {
      showErrorMessage("Please enter a valid total marks value.", 3000);
    }
  });

  // Function to update the averages in the table when totalMarks changes or marks are updated
  function updateTableAverages() {
    for (let row = 0; row < hot.countRows(); row++) {
      const marks = hot.getDataAtCell(row, 1);
      if (!isNaN(marks) && marks <= totalMarks) {
        const average = (marks / totalMarks) * 100;
        hot.setDataAtCell(row, 2, average.toFixed(2));

        // Set the cell color based on the average value
        if (average == "Absent") {
          hot.setCellMeta(row, 2, "className", "absent");
        } else if (average <= 50 && !isNaN(average)) {
          hot.setCellMeta(row, 2, "className", "red"); // Class for average < 50
        } else if (average > 50 && average < 81 && !isNaN(average)) {
          hot.setCellMeta(row, 2, "className", "yellow"); // Class for 50 <= average < 81
        } else if (!isNaN(average)) {
          hot.setCellMeta(row, 2, "className", "green"); // Class for average >= 81
        }
      }
    }
    hot.render(); // Re-render the table to apply styles
  }

  async function saveDataToFirebase(customName, isArchive) {
    const dataPath = `FSSA/${section}/${month}/${subject}/${customName}`;

    try {
      const snapshot = await get(ref(db, dataPath));
      const tableData = hot.getData(); // Table data as an array of arrays [[name, marks, avg, remark], ...]

      // Transform the tableData into the desired structure
      const transformedStudents = {};
      tableData.forEach(([name, marks, avg, remark]) => {
        if (name) {
          // Ensure name is not empty or undefined
          transformedStudents[name] = {
            mark: !isNaN(marks) ? Number(marks) : 0,
            averageMark: !isNaN(avg) ? Number(avg) : 0,
            remark: remark || "",
          };
        }
      });

      const saveData = {
        totalMarks: parseFloat(totalMarksInput.value),
        students: transformedStudents,
        timestamp: new Date().toISOString(),
        isArchive: isArchive,
      };

      if (snapshot.exists()) {
        if (newMarkFile) {
          showErrorMessage(
            "A file already exists with the same name. Please choose a different name.",
            3000
          );
        } else {
          await update(ref(db, dataPath), saveData);
          showSuccessMessage("Data updated successfully.");
        }
      } else {
        // Save new file
        await set(ref(db, dataPath), saveData);
        newMarkFile = false;
        showSuccessMessage("Data saved successfully.");
        document.getElementById("saveToFirebase").innerText = "Update";
        document.getElementById("datasetName").readOnly = true;
        if (isArchive) {
          document.getElementById("saveToFirebase").style.display = "block";
          document.getElementById("moveToArchiveForNew").style.display = "none";
        } else {
          document.getElementById("moveToArchiveForNew").style.display = "none";
        }
      }
    } catch (error) {
      console.error("Error saving or updating data:", error);
      showErrorMessage(
        "Error saving or updating data. Please try again.",
        3000
      );
    }
  }

  // Manual save button
  document
    .getElementById("saveToFirebase")
    .addEventListener("click", function () {
      const customName = capitalizeFirstLetter(
        document.getElementById("datasetName").value.trim().split("/").join("-")
      );
      if (!validateNameAndTotalMarks(customName)) return;
      saveDataToFirebase(customName, false);
    });

  document
    .getElementById("moveToArchiveForNew")
    .addEventListener("click", function () {
      const customName = capitalizeFirstLetter(
        document.getElementById("datasetName").value.trim().split("/").join("-")
      );
      if (!validateNameAndTotalMarks(customName)) return;
      saveDataToFirebase(customName, true);
    });

  function validateNameAndTotalMarks(customName) {
    if (!validateFilename(customName)) {
      showErrorMessage("Please enter a valid dataset name.", 3000);
      return false; // Exit if the dataset name is empty
    }
   
    if (isNaN(totalMarksInput.value) || totalMarksInput.value <= 0) {
      showErrorMessage("Please enter a valid Mark to find Total", 4000);
      return false; // Exit if the dataset name is empty
    }
    const totalMarks = parseInt(totalMarksInput.value);
    if (validateMarksExceeding(totalMarks)) {
      showErrorMessage(
        "One or more marks exceed the total marks. Please correct them before saving.",
        4000
      );
      return false;
    }
    return true;
  }
}

function validateMarksExceeding(totalMarks) {
  const rowCount = hot.countRows();
  for (let row = 0; row < rowCount; row++) {
    const marks = hot.getDataAtCell(row, 1);
    if (!isNaN(marks) && marks > totalMarks) {
      return true;
    }
  }
  return false;
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

let analysisChart; // Variable to hold the chart instance

async function createChart() {
  if (!hot) {
    console.log("Handsontable instance not initialized.");
    return;
  }
  const scoreRanges = { "0-50": 0, "51-80": 0, "81-100": 0, Absent: 0 };
  for (let row = 0; row < hot.countRows(); row++) {
    const mark = hot.getDataAtCell(row, 2);
    if (mark === "Absent") scoreRanges["Absent"]++;
    if (mark >= 81 && !isNaN(mark)) scoreRanges["81-100"]++;
    else if (mark >= 51 && !isNaN(mark)) scoreRanges["51-80"]++;
    else if (!isNaN(mark)) scoreRanges["0-50"]++;
  }
  updateCountTableForNew(Object.values(scoreRanges));
  // Destroy previous chart if it exists
  if (analysisChart) analysisChart.destroy();

  // Create a new chart
  const ctx = document.getElementById("myChartForNew").getContext("2d");
  analysisChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["0-50", "51-80", "81-100", "Absent"],
      datasets: [
        {
          data: Object.values(scoreRanges),
          backgroundColor: ["red", "#FBEC5D", "green", "blue"],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" },
        title: { display: true, text: "Student Marks Distribution" },
      },
    },
  });
}

async function updateCountTableForNew(scoreRanges) {
  let totalStudents = scoreRanges.reduce((a, b) => a + b);
  let percentage = (n) => {
    return Math.round((n / totalStudents) * 100);
  };
  colors.forEach((x, i) => {
    document.getElementById(`${x}CountNew`).innerText = scoreRanges[i];
    document.getElementById(`${x}PercentNew`).innerText = `${percentage(
      scoreRanges[i]
    )}%`;
  });
}

//  for already exists  ==> key: goto exist

const existContainer = document.getElementById("forSeeMarksFull");
let hotForExists;
let analysisChartForExists;
document.getElementById("monthExist").innerText = month;
let datasetName;

function fetchAndDisplayData(datasetNameFromTable, isArchive) {
  datasetName = datasetNameFromTable;

  existContainer.style.display = "block";
  const dataPath = `FSSA/${section}/${month}/${subject}/${datasetName}`;
  const dbRef = ref(db);

  if (isArchive) {
    document.getElementById("addOrRemoveArchived").innerText =
      "Remove from archive";
  } else {
    document.getElementById("addOrRemoveArchived").innerText = "Add to archive";
  }

  document
    .getElementById("addOrRemoveArchived")
    .addEventListener("click", () => {
      document.getElementById("archiveWarning").style.display="flex";

      document.getElementById("yesForAddOrRemoveArchive").addEventListener("click",()=>{
        addOrRemoveFromArchived(datasetName, isArchive);
        document.getElementById("archiveWarning").style.display="none";


      })
      document.getElementById("noForAddOrRemoveArchive").addEventListener("click",()=>{
        document
        .getElementById("addOrRemoveArchived")
        .addEventListener("click", () => {
          document.getElementById("archiveWarning").style.display="none";
      })
    })

    });
  const renameDatasetInput = document.getElementById(
    "renameDatasetInputForSeeMarks"
  );
  const totalMarksInput = document.getElementById("totalMarksForSeeMarks");

  if (renameDatasetInput) renameDatasetInput.placeholder = datasetName;

  // Fetch the dataset by name
  get(child(dbRef, dataPath))
    .then((snapshot) => {
      if (snapshot.exists()) {
        const firebaseData = snapshot.val();
        const container = document.getElementById("handsontableForExist");
        document.getElementById("loading").style.display = "none";

        // Extract students data
        const studentsData = firebaseData.students || {};
        const totalMarks = firebaseData.totalMarks || 100;
        const tableData = Object.entries(studentsData).map(
          ([studentName, studentDetails]) => [
            studentName, // Student Name
            studentDetails.mark || 0, // Marks
            studentDetails.averageMark || 0, // Average Mark
            studentDetails.remark || "", // Remarks
          ]
        );

        hotForExists = new Handsontable(container, {
          data: tableData,
          colHeaders: ["Student Name", "Marks", "Percentage", "Remarks"],
          columns: [
            { data: 0, type: "text", readOnly: true }, // Student Name
            { data: 1, type: "text" }, // Marks column (editable)
            { data: 2, type: "numeric", readOnly: true }, // Average Mark
            { data: 3, type: "text" }, // Remarks
          ],
          rowHeaders: true,
          colWidths: [200, 100, 100, 100],
          licenseKey: "non-commercial-and-evaluation",
          cells: function (row, col) {
            const cellProperties = {};
            if (row >= 0 && (col === 0 || col === 3))
              cellProperties.className = "fonts";
            return cellProperties;
          },
          afterChange: (changes, source) => {
            if (source === "edit") {
              changes.forEach(([row, prop, oldValue, newValue]) => {
                if (prop === 1) {
                  const marks = parseFloat(newValue);
                  if (!isNaN(marks)) {
                    if (marks > totalMarks) {
                    hotForExists.setDataAtCell(row, 1, oldValue);

                      showErrorMessage(
                        "Marks cannot exceed total marks.",
                        2000
                      );
                    } 
                    else if(marks<0){
                      hotForExists.setDataAtCell(row, 1, oldValue);

                      showErrorMessage(
                        "Marks cannot be negative.",
                        2000
                      );
                    }
                    
                    else  {
                      hotForExists.setCellMeta(row, 1, "className", null);
                      const percentage = (marks / totalMarks) * 100;
                      hotForExists.setDataAtCell(row, 2, percentage.toFixed(2));
                      updateCellColor(row, percentage.toFixed(2)); // Apply color
                    }
                  } else if (newValue === "A" || newValue === "a") {
                    hotForExists.setDataAtCell(row, 2, "Absent");
                    hotForExists.setCellMeta(row, 2, "className", "absent");
                  } else {
                    showErrorMessage(
                      "Invalid input. Enter a number or 'A' for absent.",
                      3000
                    );
                    hotForExists.setDataAtCell(row, 1, oldValue);
                  }
                }
              });
              hotForExists.render(); // Re-render table to apply changes
              createChartForExist();
            }
          },
        });

        totalMarksInput.value = totalMarks;

        tableData.forEach((row, rowIndex) => {
          const marks = row[1];
          if (!isNaN(marks) && totalMarks > 0) {
            const percentage = (marks / totalMarks) * 100;
            hotForExists.setDataAtCell(rowIndex, 2, percentage.toFixed(2));
            updateCellColor(rowIndex, percentage.toFixed(2)); // Apply color
          }
        });

        hotForExists.render();
      } else {
        alert("No data found for the selected dataset.");
      }
    })
    .catch((error) => {
      console.error("Error fetching data from Firebase:", error);
      alert("Failed to fetch data from Firebase.");
    });
}

function updateCellColor(row, average) {
  if (average === "Absent") {
    hotForExists.setCellMeta(row, 2, "className", "absent");
  } else if (average >= 0 && average < 51) {
    hotForExists.setCellMeta(row, 2, "className", "red");
  } else if (average > 50 && average < 81) {
    hotForExists.setCellMeta(row, 2, "className", "yellow");
  } else if (!isNaN(average)) {
    hotForExists.setCellMeta(row, 2, "className", "green");
  }
}

function updateDataInFirebase(dataSet) {
  const dataPath = `FSSA/${section}/${month}/${subject}/${dataSet}`;

  if (!hotForExists) {
    console.log("Handsontable instance is not initialized.");
    return;
  }

  const updatedData = hotForExists.getData(); // Get the data from Handsontable instance
  const totalMarksInput = document.getElementById(
    "totalMarksForSeeMarks"
  ).value;

  if (!updatedData || updatedData.length === 0) {
    console.error("No data available in Handsontable to update.");
    alert("No data to update.");
    return;
  }

  // Transform the Handsontable data to the required Firebase structure
  const studentsData = updatedData.reduce((result, row) => {
    const [studentName, mark, averageMark, remark] = row;
    if (studentName) {
      result[`students/${studentName}`] = {
        mark: mark || 0, // Default to 0 if mark is missing
        averageMark: averageMark || 0, // Default to 0 if averageMark is missing
        remark: remark || "", // Default to empty string if remark is missing
      };
    }
    return result;
  }, {});

  // Include totalMarks if it needs to be updated
  if (totalMarksInput) {
    studentsData["totalMarks"] = parseFloat(totalMarksInput) || 100;
  }

  console.log("Data to be updated:", studentsData); // Log data to check the structure

  const datasetRef = ref(db, dataPath);
  update(datasetRef, studentsData) // Use update instead of set
    .then(() => {
      console.log("Data successfully updated in Firebase.");
      showSuccessMessage("Data Updated successfully!");
    })
    .catch((error) => {
      console.error("Error updating data in Firebase:", error);
      alert("Failed to update data.");
    });
}

function recalculateAverages(totalMarks) {
  if (!hotForExists || isNaN(totalMarks) || totalMarks <= 0) return;

  hotForExists.getData().forEach((row, rowIndex) => {
    const marks = row[1]; // Marks column

    // Handle empty or invalid marks
    if (marks === "" || marks === null || marks === undefined || isNaN(marks)) {
      // If the marks are empty or invalid, set percentage as 0
      hotForExists.setDataAtCell(rowIndex, 2, 0); // Set percentage to 0
      updateCellColor(rowIndex, 0); // Reset color (can customize based on your needs)
    } else if (marks === "A" || marks === "a") {
      // If "A" or "a" is entered, mark as "Absent"
      hotForExists.setDataAtCell(rowIndex, 2, "Absent");
      updateCellColor(rowIndex, "Absent"); // Color for "Absent"
    } else if (!isNaN(marks) && marks <= totalMarks) {
      // Only calculate average if marks are numeric and within totalMarks
      const average = (parseFloat(marks) / totalMarks) * 100;
      hotForExists.setDataAtCell(rowIndex, 2, average.toFixed(2)); // Update percentage
      updateCellColor(rowIndex, average); // Apply color coding based on average
    } else {
      // If the marks are invalid (greater than total marks), set percentage to 0
      hotForExists.setDataAtCell(rowIndex, 2, 0);
      updateCellColor(rowIndex, 0); // Reset color (can customize based on your needs)
    }
  });

  hotForExists.render(); // Render updated table
  createChartForExist();
}

const updateTotalMarksButton = document.getElementById("updateTotalMarks");

if (updateTotalMarksButton) {
  updateTotalMarksButton.addEventListener("click", () => {
    const totalMarks = parseFloat(
      document.getElementById("totalMarksForSeeMarks").value
    );
    if (!isNaN(totalMarks) && totalMarks > 0) {
      recalculateAverages(totalMarks); // Recalculate based on new total marks
    } else {
      showErrorMessage("Please enter a valid number for total marks.", 3000);
    }
  });
}

// Event listener for the "Update Data" button
const updateDataButton = document.getElementById("updateDataForExists");

if (updateDataButton) {
  updateDataButton.addEventListener("click", function () {
    if (datasetName) {
      updateDataInFirebase(datasetName);
      createChartForExist();
    } else {
      alert("No dataset name provided in the URL.");
    }
  });
}
let isEdited = false;
// Track changes to rename input
const renameDatasetInput = document.getElementById(
  "renameDatasetInputForSeeMarks"
);
if (renameDatasetInput) {
  renameDatasetInput.addEventListener("input", () => {
    isEdited = true;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  createChartForExist();
});

async function createChartForExist() {
  if (!hotForExists) {
    console.log("Handsontable instance not initialized.");
    return;
  }
  const scoreRanges = { "0-50": 0, "51-80": 0, "81-100": 0, Absent: 0 };
  for (let row = 0; row < hotForExists.countRows(); row++) {
    const mark = hotForExists.getDataAtCell(row, 2);
    if (mark === "Absent") scoreRanges["Absent"]++;
    if (mark >= 81 && !isNaN(mark)) scoreRanges["81-100"]++;
    else if (mark >= 51 && !isNaN(mark)) scoreRanges["51-80"]++;
    else if (!isNaN(mark)) scoreRanges["0-50"]++;
  }
  updateCountTableExists(Object.values(scoreRanges));
  // Destroy previous chart if it exists
  if (analysisChartForExists) analysisChartForExists.destroy();

  // Create a new chart
  const ctx = document.getElementById("chartForExist").getContext("2d");
  analysisChartForExists = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["0-50", "51-80", "81-100", "Absent"],
      datasets: [
        {
          data: Object.values(scoreRanges),
          backgroundColor: ["red", "rgb(225, 225, 4)", "green", "blue"],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" },
        title: { display: true, text: "Student Marks Distribution" },
      },
    },
  });
}

// Rename dataset function
async function renameDataset() {
  const renameDatasetInput = document.getElementById(
    "renameDatasetInputForSeeMarks"
  );
  const newDatasetName = capitalizeFirstLetter(renameDatasetInput.value.trim());
  const section = localStorage.getItem("section");
  const oldDataPath = `FSSA/${section}/${month}/${subject}/${datasetName}`;

  if (newDatasetName && newDatasetName !== datasetName) {
    const newDataPath = `FSSA/${section}/${month}/${subject}/${newDatasetName}`;
    const dbRef = ref(db);

    try {
      // Fetch data from the old dataset
      const oldDataSnapshot = await get(child(dbRef, oldDataPath));
      if (oldDataSnapshot.exists()) {
        const oldData = oldDataSnapshot.val();

        // Set data to the new path
        await set(ref(db, newDataPath), oldData);
        await removeFromMonth(section, subject, month, datasetName);

        // Delete old dataset
        await set(ref(db, oldDataPath), null);

        // Update the local dataset name and input placeholder
        localStorage.setItem("dataSet", newDatasetName);
        renameDatasetInput.placeholder = newDatasetName;

        // Display success message
        showSuccessMessage("Dataset renamed successfully!");
      } else {
        alert("Original dataset not found.");
      }
    } catch (error) {
      console.error("Error renaming dataset:", error);
      alert("Failed to rename the dataset.");
    }
  } else {
    showErrorMessage(
      "Please enter a new name different from the current one.",
      3000
    );
  }
}

// Add event listener to the rename button
document
  .getElementById("renameDataset")
  .addEventListener("click", renameDataset);

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

async function removeFromMonth(section, subject, month, dataSetName) {
  const datasetRef = ref(
    db,
    `/FSSA/${section}/${month}/${subject}/${dataSetName}`
  );
  try {
    await remove(datasetRef);
    console.log(`Successfully deleted: ${dataSetName}`);
    location.reload();
  } catch (error) {
    console.error("Failed to delete dataset:", dataSetName, error);
  }
}

async function updateCountTableExists(scoreRanges) {
  let totalStudents = scoreRanges.reduce((a, b) => a + b);
  let percentage = (n) => {
    return Math.round((n / totalStudents) * 100);
  };
  colors.forEach((x, i) => {
    document.getElementById(`${x}CountExists`).innerText = scoreRanges[i];
    document.getElementById(`${x}PercentExists`).innerText = `${percentage(
      scoreRanges[i]
    )}%`;
  });
}
const archivedFilesContainer = document.getElementById(
  "archivedContainerForFiles"
);

document.getElementById("closeBtnForExist").addEventListener("click", () => {
  if (isEdited) {
    renameDataset();
    updateDataInFirebase(datasetName);
  }
  existContainer.style.display = "none";
  fetchDataAndDisplay();
  archivedFilesContainer.innerHTML=""
  fetchArchiveFiles();
});


function showErrorMessage(str, time) {
  const errorPopup = document.getElementById("error-message");
  errorPopup.innerText = str;
  errorPopup.style.display = "block";
  setTimeout(() => {
    errorPopup.style.display = "none";
  }, time);
}



async function fetchArchiveFiles() {
  const datasetPath = `/FSSA/${section}/${month}/${subject}`;

  const datasetSnapshot = await get(child(ref(db), datasetPath));
  let archivedFiles;
  if (datasetSnapshot.exists()) {
    const datasets = datasetSnapshot.val();

    archivedFiles = Object.entries(datasets)
      .map(([datasetName, datasetDetails]) => ({
        name: datasetName,
        ...datasetDetails,
      }))
      .sort((a, b) => {
        const timestampA = new Date(a.timestamp || 0).getTime();
        const timestampB = new Date(b.timestamp || 0).getTime();
        return timestampA - timestampB;
      })
      .filter((file) => file.isArchive);

    archivedFiles.forEach((file) => {
      const timestamp = file.timestamp;
      const date = new Date(timestamp);
      const formattedDate = `${date.getDate().toString().padStart(2, "0")}/${(
        date.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}/${date.getFullYear().toString().slice(-2)}`;
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      const formattedTime = `${hours
        .toString()
        .padStart(2, "0")}:${minutes} ${ampm}`;
      const div = document.createElement("div");
      div.classList.add("archivedFile");
      div.innerHTML = `
            <p >File name : <b>${file.name}</b></p>
            <p class="file-time">Archived On: ${formattedDate}, ${formattedTime}</p>
      `;
      archivedContainerForFiles.appendChild(div);
      div.addEventListener("click", () => {
        fetchAndDisplayData(file.name, true);
      });
    });
  } else {
    console.log("No archived data found.");
    const div = document.createElement("div");
    div.classList.add("noFilesInArchive");
    div.innerHTML = `
            <p>No Files Found</p>
      `;
    archivedContainerForFiles.appendChild(div);
  }
}

document.getElementById("showArchived").addEventListener("click", () => {
  archivedFilesContainer.innerHTML = "";
  document.getElementById("forSeeArchivedFull").style.display = "flex";
  fetchArchiveFiles();
});

document.getElementById("closeBtnForArchived").addEventListener("click", () => {
  document.getElementById("forSeeArchivedFull").style.display = "none";
  archivedFilesContainer.innerHTML = "";
});



function addOrRemoveFromArchived(datasetName, isArchive) {
  const dataPath = `FSSA/${section}/${month}/${subject}/${datasetName}`;
  const datasetRef = ref(db, dataPath);

  // Determine the new archive state
  const newIsArchive = !isArchive;

  // Update the archive state in Firebase
  update(datasetRef, { isArchive: newIsArchive })
    .then(() => {
      const message = newIsArchive
        ? "Dataset successfully added to the archive."
        : "Dataset successfully removed from the archive.";
      showSuccessMessage(message);

      fetchAndDisplayData(datasetName, newIsArchive);


    })
    .catch((error) => {
      console.error("Error updating archive state:", error);
      showErrorMessage("Failed to update archive state. Please try again.");
    });
}