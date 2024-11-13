// section month

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
const db = getDatabase(app);
const firestore = getFirestore(app);

let hotForAllMarks;
let pieChart;
let colors = ["red", "yellow", "green", "absent"];
let month = localStorage.getItem("month");
let subject = localStorage.getItem("subject");
const section = localStorage.getItem("section");
let marksAdded = [];





// Fetch dataset names and marks, then display in Handsontable
async function fetchDataAndDisplay() {

  document.getElementById("subjectOfTheTable").innerText = `${subject}-`;
  document.getElementById("monOfTheSubject").innerText = month;
  const datasetPath = `/studentMarks/${section}/months/${month}/${subject}`;
  const tableContainer = document.getElementById("table");
  const studentData = {};
  let columnHeaders = ["Name", "Average"]; // Add "Average" to the column headers
  let avgData = { green: 0, yellow: 0, red: 0 }; // To store count for pie chart ranges

  // Step 1: Fetch dataset names
  const datasetSnapshot = await get(child(ref(db), datasetPath));
  if (datasetSnapshot.exists()) {
    const datasets = Object.keys(datasetSnapshot.val());
    document.getElementById("forEmptyMonth").style.display="none";
    // Step 2: Fetch marks for each dataset
    for (const dataset of datasets) {
      const marksPath = `/studentMarks/${section}/${subject}/${dataset}`;
      const marksSnapshot = await get(child(ref(db), marksPath));
      if (marksSnapshot.exists()) {
        const data = marksSnapshot.val().students;
        
        // Add dataset name to column headers
        columnHeaders.push(dataset);
        marksAdded.push(dataset);
        // Populate studentData with names and marks for each dataset
        data.forEach((student) => {
          const name = student[0];
          let marks = student[2];

          // Initialize student entry if not present
          if (!studentData[name]) {
            studentData[name] = { Name: name, marks: [] }; // Store an array of marks
          }

          // If marks are empty or undefined, set to 0
          const validMarks =
            marks === undefined || marks === "" || marks === null ? 0 : marks;
          studentData[name][dataset] = validMarks;

          // Push valid marks to the student's marks array for average calculation
          studentData[name].marks.push(validMarks);
        });
      }
    }

    // Step 3: Calculate the average for each student and update pie chart data
    Object.values(studentData).forEach((student) => {
      const totalMarks = student.marks.reduce((sum, mark) => {
        return sum + (isNaN(mark) ? 0 : parseFloat(mark));
      }, 0);
      const averageMarks = totalMarks / student.marks.length;
      student["Average"] = averageMarks.toFixed(2); // Store the average, rounded to 2 decimal places

      // Classify the average marks into the pie chart categories
      if (averageMarks >= 81) {
        avgData.green += 1;
      } else if (averageMarks >= 51) {
        avgData.yellow += 1;
      } else {
        avgData.red += 1;
      }
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
          fetchAndDisplayData(columnHeaders[coords.col]);
        }
      },
      afterChange: function (changes, source) {
        if (changes) {
          changes.forEach(([row, col, oldValue, newValue]) => {
            if (col > 0) {
              // Skip the "Name" column (col 0)
              const average = parseFloat(
                hotForAllMarks.getDataAtCell(row, columnHeaders.indexOf("Average"))
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

    if(hotForAllMarks){
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
            borderColor: ["#4CAF50", "#FFEB3B", "#F44336"],
            borderWidth: 1,
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

    let colorsApplied = false; // Flag to track if colors are applied

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
                  hotForAllMarks.setCellMeta(rowIndex, colIndex, "className", ""); // Clear color
                  document.getElementById("showColors").innerText =
                    "Show Colors";
                } else {
                  hotForAllMarks.setCellMeta(rowIndex, colIndex, "className", colorClass); // Apply color
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
  }
  else{
    document.getElementById("loading").style.display = "none";
    document.getElementById("forEmptyMonth").style.display="flex";

    
  }
}

fetchDataAndDisplay();

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

document.getElementById("saveAverageData").addEventListener("click",saveFirstTwoColumnsData);

function getFirstTwoColumnsData() {
  const tableData = hotForAllMarks.getData();
  const firstTwoColumnsData = {};

  tableData.forEach(row => {
    const name = row[0];
    let average = row[1];

    // If average is a string but can be converted to a number, convert it
    if (typeof average === 'string' && !isNaN(parseFloat(average))) {
      average = parseFloat(average); // Convert string to number
    }

    // Ensure average is a number, default to 0 if invalid
    average = (typeof average === "number" && !isNaN(average)) ? average : 0;

    if (name) {
      firstTwoColumnsData[name] = { Average: average };
    }
  });

  return firstTwoColumnsData;
}


async function saveFirstTwoColumnsData() {
  const datasetPath = `/studentMarks/${section}/months/${month}/averageOf${subject}`;
  const dataToSave = getFirstTwoColumnsData();

  try {
    // Check if the dataset already exists
    const datasetRef = ref(db, datasetPath);
    const snapshot = await get(datasetRef);

    if (snapshot.exists()) {
      // Dataset exists, update it
      await update(datasetRef, dataToSave);
      console.log("Dataset updated successfully.");
      showSuccessMessage("Data Saved successfully");
    } else {
      // Dataset does not exist, create it
      await set(datasetRef, dataToSave);
      showSuccessMessage("Data Saved successfully");
      console.log("Dataset created successfully.");
    }
  } catch (error) {
    console.error("Error saving data:", error);
  }
}



// for generation table///////////////////////////////////
let hot;


["addNewTestByClick", "newTest"].forEach(id => {
  document.getElementById(id).addEventListener("click", showNewMarkContainer);
});

function showNewMarkContainer(){
  document.getElementById("subjectNew").innerText =subject;
  document.getElementById("monthNew").innerText = month;
  document.getElementById("forAddingNewMarkFull").style.display = "block";
  if (hot) {
    hot.render();
  }
}

document.getElementById("closeBtnForNewMark").addEventListener("click", () => {
  document.getElementById("forAddingNewMarkFull").style.display = "none";
  fetchDataAndDisplay();
});


document.addEventListener("DOMContentLoaded", async function () {
  const container = document.getElementById("handsontableForNew");
  let data = [];
  let Students = [];
  let isDataSaved = true; // Track if data is saved

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
        isDataSaved = false; // Set to false when the user makes changes
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
      alert("Please enter a valid total marks value.");
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

  async function saveDataToFirebase(customName) {
    const dbRef = ref(db);
    const dataPath = `studentMarks/${section}/${subject}`;

    // Check for existing datasets
    try {
      const snapshot = await get(ref(db, dataPath));
      const tableData = hot.getData();
      const saveData = {
        totalMarks: totalMarksInput.value,
        students: tableData,
      };

      if (snapshot.exists()) {
        const existingDatasets = Object.keys(snapshot.val());

        // Check if the dataset name already exists
        if (existingDatasets.includes(customName)) {
          alert(
            "A dataset with this name already exists. Please choose a different name."
          );
          return; // Exit if the dataset name already exists
        } else {
          // Save new dataset
          await set(ref(db, `${dataPath}/${customName}`), saveData);
          await addToMonth(section, subject, month, customName);

          showSuccessMessage("Data saved successfully.");
        }
      } else {
        // Save new dataset
        await set(ref(db, `${dataPath}/${customName}`), saveData);
        showSuccessMessage("Data saved successfully.");
        document.getElementById("forEmptyMonth").style.display="none";

      }

      isDataSaved = true;
      document.getElementById("saveToFirebase").innerText = "Update";
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Error saving file.");
    }
  }

  // Add an event listener for beforeunload to save data before reloading or closing the page
  window.addEventListener("beforeunload", (event) => {
    const customName = capitalizeFirstLetter(
      document.getElementById("datasetName").value.trim().replaceAll("/", "-")
    );
    if (!isDataSaved) {
      // Show alert only if data is not saved
      event.returnValue =
        "You have unsaved changes. Are you sure you want to leave?";
    }
  });

  // Manual save button
  document
    .getElementById("saveToFirebase")
    .addEventListener("click", function () {
      const customName = capitalizeFirstLetter(
        document.getElementById("datasetName").value.trim().split("/").join("-")
      );

      if (customName === "") {
        alert("Please enter a valid dataset name.");
        return; // Exit if the dataset name is empty
      }

      saveDataToFirebase(customName); // Save data manually
    });
});

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

async function addToMonth(section, subject, month, dataSetName) {
  const dataSet = {};
  dataSet[dataSetName] = true;
  try {
    await update(
      ref(db, `/studentMarks/${section}/months/${month}/${subject}`),
      dataSet
    );
    console.log("Data successfully appended to Firebase.");
  } catch (error) {
    console.error("Error appending data to Firebase:", error);
  }
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
document.getElementById("monthExist").innerText=month;
let datasetName;

function fetchAndDisplayData(datasetNameFromTable) {
  datasetName = datasetNameFromTable;

  existContainer.style.display = "block";
  const dataPath = `studentMarks/${section}/${subject}/${datasetName}`;
  const dbRef = ref(db);
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

        hotForExists = new Handsontable(container, {
          data: firebaseData.students,
          colHeaders: ["Student Name", "Marks", "Percentage", "Remarks"],
          columns: [
            { data: 0, type: "text", readOnly: true },
            { data: 1, type: "text" }, // Allow both numbers and the string "A"
            { data: 2, type: "numeric", readOnly: true },
            { data: 3, type: "text" },
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
              createChart();
              const totalMarks = parseFloat(totalMarksInput.value);

              changes.forEach(([row, prop, oldValue, newValue]) => {
                if (prop === 1) {
                  // Check if the "Marks" column is edited
                  if (!isNaN(totalMarks) && totalMarks > 0) {
                    if (newValue === "A" || newValue === "a") {
                      // Accept "A" as valid input for "absent"
                      hotForExists.setDataAtCell(row, 2, "Absent");
                      hotForExists.setCellMeta(row, 2, "className", "absent");
                    } else if (!isNaN(newValue)) {
                      // Handle numeric input
                      if (newValue > totalMarks) {
                        hotForExists.setCellMeta(row, 1, "className", "error"); // Apply error class for invalid marks
                      } else {
                        hotForExists.setCellMeta(row, 1, "className", null); // Clear error class
                        const average = (newValue / totalMarks) * 100;
                        hotForExists.setDataAtCell(row, 2, average.toFixed(2)); // Update percentage column
                        updateCellColor(row, average); // Update cell color based on percentage
                      }
                    } else {
                      // Reject other non-numeric strings
                      alert(
                        'Only numeric values or "A" are allowed in the Marks column.'
                      );
                      hotForExists.setDataAtCell(row, 1, oldValue); // Revert to the old value
                    }
                  } else {
                    alert("Please enter a valid total marks value.");
                  }
                }
              });
              hotForExists.render(); // Ensure the table re-renders
              createChartForExist();
            }
          },
        });

        const totalMarks = firebaseData.totalMarks || 100;
        firebaseData.students.forEach((student, row) => {
          const marks = student[1];
          if (!isNaN(marks) && totalMarks > 0) {
            const average = (marks / totalMarks) * 100;
            hotForExists.setDataAtCell(row, 2, average.toFixed(2));
            updateCellColor(row, average);
          }
        });
        hotForExists.render();
        totalMarksInput.value = totalMarks;
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
  const dataPath = `studentMarks/${section}/${subject}/${dataSet}`;

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

  const saveData = {
    totalMarks: totalMarksInput,
    students: updatedData,
  };

  console.log("Data to be saved:", saveData); // Log data to check the structure

  const datasetRef = ref(db, dataPath);
  set(datasetRef, saveData)
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
      alert("Please enter a valid number for total marks.");
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
  const oldDataPath = `studentMarks/${section}/${subject}/${datasetName}`;

  if (newDatasetName && newDatasetName !== datasetName) {
    const newDataPath = `studentMarks/${section}/${subject}/${newDatasetName}`;
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
        await addToMonth(section, subject, month, newDatasetName);

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
    alert("Please enter a new name different from the current one.");
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
    `/studentMarks/${section}/months/${month}/${subject}/${dataSetName}`
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

document.getElementById("closeBtnForExist").addEventListener("click", () => {
  if (isEdited) {
    renameDataset();
  }
  updateDataInFirebase(datasetName);
  existContainer.style.display = "none";
  fetchDataAndDisplay();
});

document
  .getElementById("removeFromMonth")
  .addEventListener("click", function () {
    document.getElementById("delete-warning").style.display = "block";
  });

document
  .getElementById("yesForRemoveMark")
  .addEventListener("click", function () {
    removeFromMonth(section, subject, month, datasetName);
    showSuccessMessage("successfully removed from the month");
    fetchDataAndDisplay();
    document.getElementById("delete-warning").style.display = "none";
  });

document
  .getElementById("noForRemoveMark")
  .addEventListener("click", function () {
    document.getElementById("delete-warning").style.display = "none";
  });

const addMarksContainer = document.querySelector(".addMarksContainer");
const addButton = document.getElementById("add-btn");

const fetchAndDisplayDatasetNames = async () => {
  try {
    // Show the addMarksContainer
    addMarksContainer.style.display = "flex";
    addMarksContainer.innerHTML = `<div class="ConfirmButton">
          <button class="btn btn-warning" id="cancelAdd">cancel</button>
          <button class="btn btn-success" id="confirmAdd">confirm</button>
      </div>`; // Clear previous data but keep ConfirmButton

    // Reference to the Firebase path
    const dbRef = ref(db, `/studentMarks/${section}/${subject}`);
    const snapshot = await get(dbRef);

    // Fetch current datasets in marks-container

    const currentDatasets = marksAdded;
    let hasNewDatasets = false; // Flag to check if there are new datasets

    // Check if data exists
    if (snapshot.exists()) {
      const marksData = snapshot.val();

      // Loop through the keys and create divs for each dataset name
      Object.keys(marksData).forEach((datasetName) => {
        // Only show datasets that are not already in the marks-container
        if (!currentDatasets.includes(datasetName)) {
          hasNewDatasets = true; // Found at least one new dataset

          // Create a new div for each dataset name
          const datasetDiv = document.createElement("div");
          datasetDiv.className = "marks-detail";
          datasetDiv.textContent = datasetName;

          // Toggle selection on click for adding datasets
          datasetDiv.addEventListener("click", () => {
            datasetDiv.classList.toggle("selected");
          });

          // Append each div to the addMarksContainer (before ConfirmButton)
          addMarksContainer.insertBefore(
            datasetDiv,
            addMarksContainer.querySelector(".ConfirmButton")
          );
        }
      });
    }

    // If no new datasets were found, show a message
    if (!hasNewDatasets) {
      const noNewDataMessage = document.createElement("div");
      noNewDataMessage.className = "marks-detail";
      noNewDataMessage.textContent = "All Mark files are already added.";
      addMarksContainer.insertBefore(
        noNewDataMessage,
        addMarksContainer.querySelector(".ConfirmButton")
      );
    }

    // Re-add event listeners for confirm and cancel buttons each time data is loaded
    document.getElementById("confirmAdd").addEventListener("click", confirmAdd);
    document.getElementById("cancelAdd").addEventListener("click", cancelAdd);
  } catch (error) {
    console.error("Error fetching data:", error);
    const errorMessage = document.createElement("p");
    errorMessage.textContent = "Error fetching data";
    addMarksContainer.insertBefore(
      errorMessage,
      addMarksContainer.querySelector(".ConfirmButton")
    );
  }
};

addButton.addEventListener("click", fetchAndDisplayDatasetNames);

// Function to confirm selection and append dataset names to Firebase
const confirmAdd = async () => {
  const selectedDivs = addMarksContainer.querySelectorAll(".selected");
  const selectedData = {};

  for (const selectedDiv of selectedDivs) {
    const datasetName = selectedDiv.textContent;

    // Store the selected dataset name in the object
    selectedData[datasetName] = true; // Just to store it as a key with a dummy value
  }

  // Append the selected dataset names to Firebase at the specified path
  try {
    // Use update to append the dataset names
    await update(
      ref(db, `/studentMarks/${section}/months/${month}/${subject}`),
      selectedData
    );
    console.log("Data successfully appended to Firebase.");
    
    // Hide addMarksContainer after confirming
    addMarksContainer.style.display = "none";
    addMarksContainer.innerHTML = ""; 
    fetchDataAndDisplay();
    // Fetch and display the updated marks in marks-container
  } catch (error) {
    console.error("Error appending data to Firebase:", error);
  }
};

// Function for canceling selection
const cancelAdd = () => {
  addMarksContainer.style.display = "none";
  addMarksContainer.innerHTML = ""; 
};
