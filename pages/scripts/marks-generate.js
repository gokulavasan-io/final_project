// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-database.js";

// Your web app's Firebase configuration (replace with your project details)
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

// Function to get query parameter (to extract page title)
function getQueryParameter(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

document.addEventListener("DOMContentLoaded", function () {
    // Extract page title from URL
    const pageTitle = getQueryParameter('pageTitle') || 'EnglishMarks'; // Default to 'EnglishMarks' if no title is provided

    const container = document.getElementById('handsontable');
    const data = [['', '']]; // Initial data

    // Initialize Handsontable
    const hot = new Handsontable(container, {
        data: data,
        colHeaders: ['Student Name', 'Marks'],
        columns: [
            { data: 0, type: 'text' },
            { data: 1, type: 'numeric' }
        ],
        rowHeaders: true,
        colWidths: [200, 100],
        licenseKey: 'non-commercial-and-evaluation'
    });

    // Function to add a new row
    document.getElementById('addRow').addEventListener('click', function() {
        hot.alter('insert_row');  // Inserts a new empty row at the end
    });

    // Function to delete the last row
    document.getElementById('deleteLastRow').addEventListener('click', function() {
        const rowCount = hot.countRows(); // Get the total number of rows
        if (rowCount > 0) { // Check if there is at least one row
            hot.alter('remove_row', rowCount - 1); // Remove the last row
        } else {
            alert("No rows to delete."); // Alert if there are no rows
        }
    });

    // Function to save data to Firebase
    function saveDataToFirebase(customName) {
        const tableData = hot.getData(); // Get data from Handsontable

        const dbRef = ref(database);
        const dataPath = `studentMarks/${pageTitle}/${customName}`; // Use dynamic pageTitle for the path

        // Save the data to Firebase
        set(ref(database, dataPath), tableData)
            .then(() => {
                alert("File saved successfully!"); // Show alert on successful save
            })
            .catch((error) => {
                console.error("Error saving data:", error);
                alert("Error saving file."); // Show alert on error
            });
    }

    // Add an event listener for beforeunload to save data before reloading or closing the page
    window.addEventListener('beforeunload', (event) => {
        const customName = document.getElementById('datasetName').value.trim(); // Get dataset name from input field

        if (customName !== "") {
            saveDataToFirebase(customName); // Save data automatically with the dataset name
            event.returnValue = "Are you sure you want to leave? Your data will be saved."; // Standard message may not show in all browsers
        }
    });

    // Manual save button
    document.getElementById('saveToFirebase').addEventListener('click', function() {
        const customName = document.getElementById('datasetName').value.trim(); // Get dataset name from input field

        if (customName === "") {
            alert("Please enter a valid dataset name.");
            return; // Exit if the dataset name is empty
        }

        saveDataToFirebase(customName); // Save data manually
    });
});
