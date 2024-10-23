// Import the necessary functions from Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import { getDatabase, ref, get, child, remove } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-database.js";

// Your Firebase configuration
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

// Function to get all dataset names from Firebase and render them
function getAllData() {
const subject_name=document.getElementById("page-name").innerText;
const section=getQueryParameter('section');
    
    const dbRef = ref(database);
    const dataPath = `studentMarks/${section}/${subject_name}`;
    
    // Get the delete button
    const deleteBtn = document.getElementById('delete-btn');
    let deleteMode = false; // Flag to track delete mode

    // Fetch dataset names from Firebase
    get(child(dbRef, dataPath)).then((snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const datasetNames = Object.keys(data); // Get dataset keys (names)
            const container = document.querySelector('.marks-container');

            // For each dataset, create a div and populate it with the name and a checkbox
            datasetNames.forEach(name => {
                const div = document.createElement('div');
                div.classList.add('marks-detail');

                const pElement = document.createElement('p');
                pElement.innerText = name;

                const checkbox = document.createElement('input');
                checkbox.type = "checkbox";
                checkbox.classList.add('dataset-checkbox');
                checkbox.value = name;
                checkbox.style.display = 'none'; // Initially hide the checkboxes

                // Append the checkbox and dataset name to the div
                div.appendChild(checkbox);
                div.appendChild(pElement);

                // Add click event listener to the div for navigation when not in delete mode
                div.addEventListener('click', function (e) {
                    if (!deleteMode && e.target !== checkbox) {
                        // Navigate to the dataset details page
                        window.location.href = `marks.html?dataset=${encodeURIComponent(name)}&pageTitle=${subject_name}&section=${section}`;
                    }
                });

                // Listen for changes on the checkbox to toggle background color
                checkbox.addEventListener('change', function () {
                    if (checkbox.checked) {
                        div.style.backgroundColor = '#e73232'; 
                    } else {
                        div.style.backgroundColor = ''; 
                    }
                });

                container.appendChild(div);
            });

            // Add click event listener for delete button
            deleteBtn.addEventListener('click', function () {
                if (!deleteMode) {
                    // Enter delete mode: show checkboxes and change button text
                    deleteMode = true;
                    deleteBtn.innerText = "Delete Selected";

                    // Show the checkboxes
                    document.querySelectorAll('.dataset-checkbox').forEach(checkbox => {
                        checkbox.style.display = 'inline-block';
                    });
                } else {
                    // If in delete mode, confirm before deleting
                    confirmDeletion();
                }
            });
        } else {
            console.log("No data available in that data");
            const container = document.querySelector('.marks-container');
            const div = document.createElement('div');
            div.classList.add('marks-detail');
            const pElement = document.createElement('p');
            pElement.innerText = "No data";
            container.appendChild(pElement);
            div.appendChild(pElement);
            container.appendChild(div);
        }
    }).catch((error) => {
        console.error("Error fetching data from Firebase:", error);
    });
}

// Function to confirm deletion
function confirmDeletion() {
    const selectedCheckboxes = document.querySelectorAll('.dataset-checkbox:checked');

    if (selectedCheckboxes.length > 0) {
        // Show confirmation dialog
        const confirmation = confirm("Are you sure you want to delete the selected datasets?");

        if (confirmation) {
            // If user confirms, proceed to delete
            deleteSelectedDatasets();
        } else {
            // If user cancels, log a message (optional)
            console.log("Deletion canceled.");
        }
    } else {
        console.log("No datasets selected for deletion.");
    }
}

// Function to delete selected datasets
function deleteSelectedDatasets() {
const subject_name=document.getElementById("page-name").innerText;
const section=getQueryParameter('section');


    const selectedCheckboxes = document.querySelectorAll('.dataset-checkbox:checked');
    const dbRef = ref(database);

    selectedCheckboxes.forEach(checkbox => {
        const datasetName = checkbox.value;
        const datasetRef = ref(database, `studentMarks/${section}/${subject_name}/${datasetName}`);

        // Remove the dataset from Firebase
        remove(datasetRef).then(() => {
            console.log(`Deleted dataset: ${datasetName}`);
            checkbox.parentElement.remove(); // Remove the dataset div from the UI
        }).catch((error) => {
            console.error(`Failed to delete dataset: ${datasetName}`, error);
        });
    });
}

// Call the function when the page is loaded to fetch and display the dataset names
// change the pagetitle and pagename
document.addEventListener("DOMContentLoaded", function () {
    const pageTitle = getQueryParameter('pageTitle'); 
    const section=getQueryParameter('section');
    document.getElementById("page-title").innerText=pageTitle;
    document.getElementById("page-name").innerText=pageTitle;
    document.getElementById("new").href=`./mark-generate.html?pageTitle=${pageTitle}&section=${section}`;
    getAllData();
});


function getQueryParameter(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}