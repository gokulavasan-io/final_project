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
    const pageTitle = getQueryParameter('pageTitle') ; 
    const section = getQueryParameter('section'); 
    


    const container = document.getElementById('handsontable');
    let data = [];
    let studentNames;

    if(section=="ClassA"){
        studentNames=[
            "Abinaya M",
            "Hari Krishnan B",
            "Harish Karthick",
            "Joshitha",
            "Jumana H",
            "K Balamurugan",
            "Karthikeyan Sakthivel",
            "Kavinisha Kannan",
            "Keerthika",
            "KISHORE M",
            "Madasamy",
            "Mohamed Vaseem Ismail",
            "Muthamizhan",
            "Muthujothi",
            "Parkavi M",
            "Pugazhenthi S",
            "Rama Subbu N A",
            "Saravanan",
            "Sankar K",
            "Senthilnathan",
            "Shalini R",
            "Sridhar",
            "Sutharsan",
            "Vajesh Babu",
            "Yuva Ganesh",
            "Gowtham"
        ]
    }
    else if(section=="ClassB"){
        studentNames=[
            "Arumuga Kani",
            "DB Shriram",
            "Gokulavasan G",
            "Gopika V",
            "Guna P",
            "Jeevanantham R",
            "Kamalika A",
            "Karthikeyan M",
            "Kottai Samy K",
            "Krishna Moorthy",
            "Logesh Muthu",
            "Malarvizhi k",
            "Maruthamuthu G",
            "Mohamed Mohideen Thayub",
            "Naveen S",
            "Pestica M",
            "Pranesh",
            "Ramalakshmi T",
            "Mohammed sheriff",
            "Sandhiya P",
            "Santhosh Raja Ramesh",
            "Sham L",
            "Sivaraman R",
            "Suprasanna A",
            "Udhaya S",
            "Venkatesh S",
            "Zahid Hussain"
        ]
        
    }
    else if(section=="ClassC"){
        studentNames=[
            "Abdul Kalam S",
            "Brinda",
            "Chandhru G. S",
            "Deepak V",
            "Devika S",
            "Dhanasri V",
            "Dharani Sri A",
            "Harini Ragavi",
            "Harishmugi",
            "Jeshin Daniel",
            "Kaleeshwari K",
            "Mohamed Ibrahim",
            "Mohamed J",
            "Musharaf S",
            "Naveen Kumar",
            "Rajesh R",
            "Rakesh Raj",
            "Rithishmuthu",
            "Sathish Kumar",
            "Shanmugavel",
            "Sivaperumal B",
            "Sudharsan S",
            "Swathi",
            "Teena Morin",
            "Thirupathi",
            "Vanitha N"
        ];        
    }
    
    

// Generate sample data for 10 students (you can adjust the number)
for (let i = 0; i <studentNames.length; i++) {
    let row = [`${studentNames[i]}`];  // First column is the student name

    for (let j = 0; j < 31; j++) {
        row.push(' ');  
    }
    data.push(row);
}

// Initialize Handsontable
const hot = new Handsontable(container, {
    data: data,
    colHeaders: ['Student Name', ...Array.from({ length: 31 }, (_, i) => `Day ${i + 1}`)],
    columns: [
        { data: 0, type: 'text' },  // Student Name
        ...Array.from({ length: 31 }, (_, i) => ({ data: i + 1, type: 'text' }))  // Attendance columns
    ],
    rowHeaders: true,
    colWidths: [200, ...Array(31).fill(50)],  // Set widths for each column
    fixedColumnsLeft: 1,
    licenseKey: 'non-commercial-and-evaluation',
    width: '85%', 
    height: '100%', 
    stretchH: 'all', 
    overflow: 'hidden', 
    autoColumnSize: false, 
    autoRowSize: true, 
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
        const dataPath = `studentMarks/${section}/${pageTitle}/${customName}`; // Use dynamic pageTitle for the path
//
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
        const customName = document.getElementById('datasetName').value.trim().split("/").join("-");

        if (customName !== "") {
            saveDataToFirebase(customName); // Save data automatically with the dataset name
            event.returnValue = "Are you sure you want to leave? Your data will be saved."; // Standard message may not show in all browsers
        }
    });

    // Manual save button
    document.getElementById('saveToFirebase').addEventListener('click', function() {
        const customName = document.getElementById('datasetName').value.trim().split("/").join("-");

        if (customName === "") {
            alert("Please enter a valid dataset name.");
            return; // Exit if the dataset name is empty
        }

        saveDataToFirebase(customName); // Save data manually
    });
});




