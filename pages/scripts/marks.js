import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import { getDatabase, ref, get, child, set } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-database.js";

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
const database = getDatabase(app);
let hot;
let isEdited = false;
const datasetName = localStorage.getItem("dataSet");
const section = localStorage.getItem("section");
const pageTitle = localStorage.getItem("pageTitle");

function fetchAndDisplayData(datasetName) {
    const dataPath = `studentMarks/${section}/${pageTitle}/${datasetName}`;
    const dbRef = ref(database);
    const renameDatasetInput = document.getElementById("renameDatasetInput");
    const totalMarksInput = document.getElementById("totalMarks");

    if (renameDatasetInput) renameDatasetInput.placeholder = datasetName;

    // Fetch the dataset by name
    get(child(dbRef, dataPath)).then((snapshot) => {
        if (snapshot.exists()) {
            const firebaseData = snapshot.val();
            const container = document.getElementById('handsontable');
            hot = new Handsontable(container, {
                data: firebaseData.students,
                colHeaders: ['Student Name', 'Marks', "Percentage", "Remarks"],
                columns: [
                    { data: 0, type: 'text', readOnly: true },
                    { data: 1, type: 'numeric' },
                    { data: 2, type: 'numeric', readOnly: true },
                    { data: 3, type: 'text' },
                ],
                rowHeaders: true,
                colWidths: [200, 100, 100, 100],
                licenseKey: 'non-commercial-and-evaluation',
                afterChange: (changes, source) => {
                    if (source === 'edit') {
                        isEdited = true; // Set edited flag to true
                        const totalMarks = parseFloat(totalMarksInput.value);

                        if (!isNaN(totalMarks) && totalMarks > 0) {
                            changes.forEach(([row, prop]) => {
                                if (prop === 1) { // Only trigger when "Marks" column is edited
                                    const marks = hot.getDataAtCell(row, 1);
                                    if (marks > totalMarks) {
                                        hot.setCellMeta(row, 1, 'className', 'error'); // Apply error class
                                    } else {
                                        hot.setCellMeta(row, 1, 'className', null); // Clear error class if marks are valid
                                        const average = (marks / totalMarks) * 100;
                                        hot.setDataAtCell(row, 2, average.toFixed(2)); // Update average column
                                        updateCellColor(row, average); // Update cell color based on average
                                    }
                                }
                            });
                            hot.render();
                        } else {
                            alert("Please enter a valid total marks value.");
                        }
                    }
                },
            });

            const totalMarks = firebaseData.totalMarks || 100;
            firebaseData.students.forEach((student, row) => {
                const marks = student[1];
                if (!isNaN(marks) && totalMarks > 0) {
                    const average = (marks / totalMarks) * 100;
                    hot.setDataAtCell(row, 2, average.toFixed(2));
                    updateCellColor(row, average);
                }
            });
            hot.render();
            totalMarksInput.value = totalMarks;
        } else {
            alert("No data found for the selected dataset.");
        }
    }).catch((error) => {
        console.error("Error fetching data from Firebase:", error);
        alert("Failed to fetch data from Firebase.");
    });
}

// Function to update cell color based on average
function updateCellColor(row, average) {
    if (average < 51) {
        hot.setCellMeta(row, 2, 'className', 'red');
    } else if (average < 81) {
        hot.setCellMeta(row, 2, 'className', 'yellow');
    } else {
        hot.setCellMeta(row, 2, 'className', 'green');
    }
}

// Update Firebase data
function updateDataInFirebase(datasetName) {
    const dataPath = `studentMarks/${section}/${pageTitle}/${datasetName}`;
    if (!hot) return;
    const updatedData = hot.getData();
    const totalMarksInput = document.getElementById("totalMarks").value;

    const datasetRef = ref(database, dataPath);
    const saveData = {
        totalMarks: totalMarksInput,
        students: updatedData
    };

    set(datasetRef, saveData)
        .then(() => {
            isEdited = false; // Reset edited flag after successful update
            showSuccessMessage("Dataset Updated successfully!");
        })
        .catch((error) => {
            console.error("Error updating data in Firebase:", error);
            alert("Failed to update data.");
        });
}

// Function to recalculate averages based on updated total marks
function recalculateAverages(totalMarks) {
    if (!hot || isNaN(totalMarks) || totalMarks <= 0) return;

    hot.getData().forEach((row, rowIndex) => {
        const marks = row[1];
        if (!isNaN(marks)) {
            const average = (marks / totalMarks) * 100;
            hot.setDataAtCell(rowIndex, 2, average.toFixed(2));
            updateCellColor(rowIndex, average);
        }
    });
    hot.render();
}

// Event listener for the "Update Total Marks" button
const updateTotalMarksButton = document.getElementById("updateTotalMarks");
if (updateTotalMarksButton) {
    updateTotalMarksButton.addEventListener("click", () => {
        const totalMarks = parseFloat(document.getElementById("totalMarks").value);
        if (!isNaN(totalMarks) && totalMarks > 0) {
            recalculateAverages(totalMarks);
        } else {
            alert("Please enter a valid number for total marks.");
        }
    });
}

// Event listener for the "Update Data" button
const updateDataButton = document.getElementById('updateData');
if (updateDataButton) {
    updateDataButton.addEventListener('click', function () {
        if (datasetName) {
            updateDataInFirebase(datasetName);
            createChart();
        } else {
            alert("No dataset name provided in the URL.");
        }
    });
}

// Auto-save data to Firebase when the page is closed or reloaded
window.addEventListener('beforeunload', function (event) {
    if (isEdited && datasetName && hot) {
        const totalMarksInput = document.getElementById("totalMarks").value;
        if (totalMarksInput) {
            event.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        } else {
            event.returnValue = "Total marks value is missing. Please enter a value before leaving.";
        }
    }
});

// Fetch data when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
    if (datasetName) {
        fetchAndDisplayData(datasetName);
    } else {
        alert("No dataset name provided in the URL.");
    }
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




let analysisChart; // Variable to hold the chart instance
document.addEventListener("DOMContentLoaded", () => {
    createChart();
});




async function createChart() {
    const section = localStorage.getItem("section");
    const scoreRanges = { "0-50": 0, "51-80": 0, "81-100": 0 };

    // Fetch data directly from Firebase path
    const studentsPath = `/studentMarks/${section}/${pageTitle}/${datasetName}/students`;
    const studentsRef = ref(database, studentsPath);
    const studentsSnapshot = await get(studentsRef);

    if (studentsSnapshot.exists()) {
        const studentsData = studentsSnapshot.val();

        // Iterate over students' marks and categorize scores
        studentsData.forEach(([, , mark]) => {
            const numericMark = typeof mark === "number" && !isNaN(mark) ? mark : 0;

            if (numericMark >= 81) scoreRanges["81-100"]++;
            else if (numericMark >= 51) scoreRanges["51-80"]++;
            else scoreRanges["0-50"]++;
        });
    }

    // Destroy previous chart if it exists
    if (analysisChart) {
        analysisChart.destroy();
    }
    // Display the chart
    const ctx = document.getElementById("myChart").getContext("2d");
    analysisChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: ["0-50", "51-80", "81-100"],
            datasets: [
                {
                    data: [scoreRanges["0-50"], scoreRanges["51-80"], scoreRanges["81-100"]],
                    backgroundColor: ["red", "yellow", "green"]
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: "top"
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.label}: ${context.raw} students`;
                        }
                    }
                }
            }
        }
    });
}
