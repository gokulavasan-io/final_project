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
let hot; // Declare a variable to hold Handsontable instance

// Function to get the dataset name from the URL
function getDatasetNameFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('dataset'); // Get the 'dataset' query parameter
}

// Function to get the pageTitle and dataset from the URL
function getQueryParameter(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Fetch and display data in Handsontable
function fetchAndDisplayData(datasetName) {
    const pageTitle = getQueryParameter('pageTitle'); 
    const dataPath = `studentMarks/${pageTitle}/${datasetName}`; // Use dynamic pageTitle for the path

    const dbRef = ref(database);
    document.getElementById("renameDatasetInput").placeholder = datasetName;

    // Fetch the dataset by name
    get(child(dbRef, dataPath)).then((snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();

            // Initialize Handsontable with fetched data
            const container = document.getElementById('handsontable');
            hot = new Handsontable(container, {
                data: data,  // Set fetched data to Handsontable
                colHeaders: ['Student Name', 'Marks'],
                columns: [
                    { data: 0, type: 'text' },
                    { data: 1, type: 'numeric' }
                ],
                rowHeaders: true,
                colWidths: [200, 100],
                licenseKey: 'non-commercial-and-evaluation'
            });
        } else {
            alert("No data found for the selected dataset.");
        }
    }).catch((error) => {
        console.error("Error fetching data from Firebase:", error);
        alert("Failed to fetch data from Firebase.");
    });
}

// Update Firebase data
function updateDataInFirebase(datasetName) {
    const pageTitle = getQueryParameter('pageTitle') ; // Get the page title or use default
    const dataPath = `studentMarks/${pageTitle}/${datasetName}`; // Use dynamic pageTitle for path
    const updatedData = hot.getData(); // Get updated data from Handsontable

    const datasetRef = ref(database, dataPath);

    // Save updated data back to Firebase
    set(datasetRef, updatedData)
        .then(() => {
            alert("Data updated successfully!");
        })
        .catch((error) => {
            console.error("Error updating data in Firebase:", error);
            alert("Failed to update data.");
        });
}


// Event listener for Update button
document.getElementById('updateData').addEventListener('click', function() {
    const datasetName = getDatasetNameFromURL();
    if (datasetName) {
        updateDataInFirebase(datasetName); // Update data in Firebase
    } else {
        alert("No dataset name provided in the URL.");
    }
});

// Function to add a new row in Handsontable
function addNewRow() {
    if (hot) {
        hot.alter('insert_row', hot.countRows()); // Inserts a new empty row at the end
    } else {
        alert("Handsontable is not initialized.");
    }
}

// Event listener for Add Row button
document.getElementById('addRow').addEventListener('click', addNewRow);

// Function to delete the last row in Handsontable
function deleteLastRow() {
    if (hot) {
        const rowCount = hot.countRows(); // Get the total number of rows
        if (rowCount > 0) { // Check if there is at least one row
            hot.alter('remove_row', rowCount - 1); // Remove the last row
        } else {
            alert("No rows to delete."); // Alert if there are no rows
        }
    } else {
        alert("Handsontable is not initialized.");
    }
}

// Event listener for Delete Last Row button
document.getElementById('deleteLastRow').addEventListener('click', deleteLastRow);

// Auto-save data to Firebase when the page is closed or reloaded
window.addEventListener('beforeunload', function() {
    const datasetName = getDatasetNameFromURL();
    if (datasetName && hot) {
        updateDataInFirebase(datasetName); // Save current data to Firebase
    }
});

// Get the dataset name from the URL and fetch the corresponding data
document.addEventListener("DOMContentLoaded", function () {
    const datasetName = getDatasetNameFromURL(); // Get dataset name from URL
    if (datasetName) {
        fetchAndDisplayData(datasetName); // Fetch and display data
    } else {
        alert("No dataset name provided in the URL.");
    }
});


// Function to rename the dataset
function renameDataset() {
    const oldDatasetName = getDatasetNameFromURL(); // Get the current dataset name from the URL
    const newDatasetName = document.getElementById('renameDatasetInput').value.trim(); // Get the new name from the input field
    const pageTitle = getQueryParameter('pageTitle') ; // Get the page title or use default

    if (!newDatasetName) {
        alert("Please enter a new dataset name.");
        return;
    }

    const oldDataPath = `studentMarks/${pageTitle}/${oldDatasetName}`;
    const newDataPath = `studentMarks/${pageTitle}/${newDatasetName}`;

    const dbRef = ref(database);
    
    // Get the current dataset
    get(child(dbRef, oldDataPath)).then((snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            
            // Set the new dataset with the new name
            set(ref(database, newDataPath), data)
                .then(() => {
                    // Remove the old dataset
                    set(ref(database, oldDataPath), null)
                        .then(() => {
                            alert("Dataset renamed successfully!");
                            // Update the URL to reflect the new dataset name
                            const newUrl = window.location.href.replace(oldDatasetName, newDatasetName);
                            window.history.replaceState(null, null, newUrl);
                            document.getElementById("newDatasetName").placeholder = newDatasetName; // Update the placeholder
                        })
                        .catch((error) => {
                            console.error("Error deleting old dataset:", error);
                        });
                })
                .catch((error) => {
                    console.error("Error renaming dataset:", error);
                    alert("Failed to rename the dataset.");
                });
        } else {
            alert("Dataset does not exist.");
        }
    }).catch((error) => {
        console.error("Error fetching data from Firebase:", error);
        alert("Failed to fetch data.");
    });
}

// Event listener for Rename button
document.getElementById('renameDataset').addEventListener('click', renameDataset);
