// Import Firebase and the required modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
} from "https://www.gstatic.com/firebasejs/9.10.0/firebase-database.js";

// Your Firebase configuration object
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


let myChart; 
let graphType = "line"; 
let sortType = 4;

// Subjects to compare
const subjects = ["English", "LifeSkills", "Tech", "ProblemSolving", "Total"]; // Add more subjects as needed
const subjectColors = [
  "rgba(75, 192, 192, 0.2)",
  "rgba(153, 102, 255, 0.2)",
  "red",
  "Brown",
  "green",
]; // Colors for background
const subjectBorderColors = [
  "rgba(75, 192, 192, 1)",
  "rgba(153, 102, 255, 1)",
  "red",
  "Brown",
  "green",
]; // Colors for border

// Function to fetch student marks data from Firebase Realtime Database
async function getMarksData(path) {
  const marksRef = ref(database, path);
  const snapshot = await get(marksRef);
  const marksData = snapshot.val();

  // Handle null or undefined data
  if (!marksData) {
    console.error(`No data found at path: ${path}`);
    return { labels: [], datasets: [] };
  }

  let data = [];

  // Extract relevant data for the chart
  marksData.forEach((entry) => {
    let studentData = { student: entry.student }; // Create object for each student
    subjects.forEach((subject) => {
      studentData[subject] = entry[subject] ? Number(entry[subject]) : 0; // Store marks or 0 if not available
    });
    data.push(studentData); // Store student data
  });

  // Sort data in ascending order based on the Total marks
  data.sort((a, b) => a[subjects[sortType]] - b[subjects[sortType]]); // Sort by Total marks

  // Prepare datasets
  const datasets = subjects.map((subject, index) => {
    return {
      label: subject,
      data: data.map((entry) => entry[subject]), // Marks for the subject
      backgroundColor: subjectColors[index], // Set background color for the subject
      borderColor: subjectBorderColors[index], // Set border color for the subject
      borderWidth: 2, // Set a border width for visibility
    };
  });

  // Return sorted labels and datasets
  return {
    labels: data.map((entry) => entry.student), // Labels from the data
    datasets: datasets, // Datasets for the chart
  };
}

// Function to create and display the chart using Chart.js
async function createChart() {
    const section=localStorage.getItem("section");
    const month=localStorage.getItem("month");

  const marksData = await getMarksData(
    `/studentMarks/${section}/months/${month}/result`
  );

  // Destroy existing chart if it exists
  if (myChart) {
    myChart.destroy(); // Destroy previous chart instance
  }

  const ctx = document.getElementById("myChart").getContext("2d");
  myChart = new Chart(ctx, {
    type: graphType, // Chart type: bar or line
    data: {
      labels: marksData.labels, // Use the labels from the fetched data
      datasets: marksData.datasets, // Use datasets prepared from the fetched data
    },
    options: {
      scales: {
        y: {
          beginAtZero: true, // Ensure Y-axis starts at zero
          max: 100, // Adjust this based on expected marks range
        },
      },
    },
  });
}


window.onload = createChart;

// Event listeners for graph type buttons
document.getElementById("lineGraph").addEventListener("click", () => {
  graphType = "line"; // Set graph type to line
  createChart(); // Re-create chart with the new type
});

document.getElementById("barGraph").addEventListener("click", () => {
  graphType = "bar"; // Set graph type to bar
  createChart(); // Re-create chart with the new type
});

document.getElementById("sortTotal").addEventListener("click", () => {
  sortType = 4;
  createChart();
});
document.getElementById("sortEnglish").addEventListener("click", () => {
  sortType = 0;
  createChart();
});
document.getElementById("sortLifeSkills").addEventListener("click", () => {
  sortType = 1;
  createChart();
});
document.getElementById("sortTech").addEventListener("click", () => {
  sortType = 2;
  createChart();
});
document.getElementById("sortProblemSolving").addEventListener("click", () => {
  sortType = 3;
  createChart();
});

document.getElementById("backButton").addEventListener("click",()=>{
  localStorage.setItem("monthly",true);
  window.history.back();
});