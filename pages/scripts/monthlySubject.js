// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import {
    getDatabase,
    ref,
    get,
    update,
    remove
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Reference to buttons and containers
const addButton = document.getElementById("add-btn");
const deleteButton = document.getElementById("delete-btn");
const addMarksContainer = document.querySelector(".addMarksContainer");
const marksContainer = document.querySelector(".marks-container");
const section=localStorage.getItem("section");
const subject=localStorage.getItem("subject");
const month=localStorage.getItem("month");

document.getElementById("pageName").textContent=subject;

let deleteMode = false; // Flag to track delete mode

// Function to fetch dataset names from Firebase and display them
const fetchAndDisplayDatasetNames = async () => {
    try {
        // Show the addMarksContainer
        addMarksContainer.style.display = "flex";
        addMarksContainer.innerHTML = `<div class="ConfirmButton">
            <button class="btn btn-warning" id="cancelAdd">cancel</button>
            <button class="btn btn-success" id="confirmAdd">confirm</button>
        </div>`; // Clear previous data but keep ConfirmButton

        // Reference to the Firebase path
        const dbRef = ref(database, `/studentMarks/${section}/${subject}`);
        const snapshot = await get(dbRef);

        // Fetch current datasets in marks-container
        const currentDatasets = Array.from(marksContainer.children).map(div => div.textContent.trim());
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
                        if (!deleteMode) {
                            datasetDiv.classList.toggle("selected");
                        }
                    });

                    // Append each div to the addMarksContainer (before ConfirmButton)
                    addMarksContainer.insertBefore(datasetDiv, addMarksContainer.querySelector(".ConfirmButton"));
                }
            });
        }

        // If no new datasets were found, show a message
        if (!hasNewDatasets) {
            const noNewDataMessage = document.createElement("div");
            noNewDataMessage.className = "marks-detail";
            noNewDataMessage.textContent = "All datasets are already added.";
            addMarksContainer.insertBefore(noNewDataMessage, addMarksContainer.querySelector(".ConfirmButton"));
        }

        // Re-add event listeners for confirm and cancel buttons each time data is loaded
        document.getElementById("confirmAdd").addEventListener("click", confirmAdd);
        document.getElementById("cancelAdd").addEventListener("click", cancelAdd);

    } catch (error) {
        console.error("Error fetching data:", error);
        const errorMessage = document.createElement("p");
        errorMessage.textContent = "Error fetching data";
        addMarksContainer.insertBefore(errorMessage, addMarksContainer.querySelector(".ConfirmButton"));
    }
};

// Event listener for the Add button
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
        await update(ref(database, `/studentMarks/${section}/months/${month}/${subject}`), selectedData);
        console.log("Data successfully appended to Firebase.");

        // Hide addMarksContainer after confirming
        addMarksContainer.style.display = "none";
        addMarksContainer.innerHTML = ""; // Clear data and ConfirmButton

        // Fetch and display the updated marks in marks-container
        fetchMarksForDisplay();

    } catch (error) {
        console.error("Error appending data to Firebase:", error);
    }
};

// Function for canceling selection
const cancelAdd = () => {
    // Hide addMarksContainer without saving anything to Firebase
    addMarksContainer.style.display = "none";
    addMarksContainer.innerHTML = ""; // Clear data and ConfirmButton
};

const fetchMarksForDisplay = async () => {
    try {
        const marksRef = ref(database,`/studentMarks/${section}/months/${month}/${subject}`);
        const snapshot = await get(marksRef);

        // Clear existing marks
        marksContainer.innerHTML = "";

        // Check if data exists
        if (snapshot.exists()) {
            const marksData = snapshot.val();

            // Loop through each dataset and create divs for the dataset names
            Object.keys(marksData).forEach((datasetName) => {
                const datasetDiv = document.createElement("div");
                datasetDiv.className = "marks-detail";
                datasetDiv.textContent = datasetName; // Display only the dataset name

                // Click event to toggle selection for deleting datasets
                datasetDiv.addEventListener("click", () => {
                    if (deleteMode) {
                        datasetDiv.classList.toggle("selected");
                    } else {
                        // Open the link only if not in delete mode
                        datasetDiv.classList.toggle("selectedForSee");
                    }
                });

                marksContainer.appendChild(datasetDiv);
            });
        } else {
            const noDataMessage = document.createElement("p");
            noDataMessage.textContent = "No marks found";
            marksContainer.appendChild(noDataMessage);
        }
    } catch (error) {
        console.error("Error fetching marks:", error);
    }
};


// Event listener for the Delete button
deleteButton.addEventListener("click", function () {
    const selectedDivs = marksContainer.querySelectorAll(".selected");

    if (!deleteMode) {
        // Enter delete mode
        deleteMode = true;
        this.innerText = "Delete Selected";
    } else {
        // If in delete mode, confirm deletion
        if (selectedDivs.length > 0) {
            const confirmation = confirm("Are you sure you want to delete the selected datasets?");
            if (confirmation) {
                selectedDivs.forEach(async (selectedDiv) => {
                    const datasetName = selectedDiv.textContent;
                    const datasetRef = ref(database, `/studentMarks/${section}/months/${month}/${subject}/${datasetName}`);
                    try {
                        await remove(datasetRef);
                        selectedDiv.remove(); // Remove from marks-container
                        console.log(`Successfully deleted: ${datasetName}`);
                    } catch (error) {
                        console.error("Failed to delete dataset:", datasetName, error);
                    }
                });
            }
        } else {
            alert("No datasets selected for deletion.");
        }
        deleteMode = false; // Reset delete mode
        this.innerText = "Delete"; // Reset button text
    }
});

// Automatically fetch and display marks when the page loads
document.addEventListener("DOMContentLoaded", fetchMarksForDisplay);

const selectedForSee= document.getElementsByClassName("selectedForSee");
document.getElementById("seeMarks").addEventListener("click",()=>{
    if(selectedForSee.length<1){
        alert("Please select atleast one mark !!!")
    }
    else if(selectedForSee.length>1){
        alert("cannot open more than 1 file for result!!! try analysis ")
    }
    else{
        const dataForMark=selectedForSee[0].textContent;
        localStorage.setItem("dataSet",dataForMark)
        localStorage.setItem("pageTitle",subject)
        window.location.href = "../../pages/html/marks.html";
    }
});

document.getElementById("backButton").addEventListener("click",()=>{
    localStorage.setItem("monthly",true);
    window.history.back();
});