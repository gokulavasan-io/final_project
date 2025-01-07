import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import {
    getDatabase,
    ref, child,
    get,
} from "https://www.gstatic.com/firebasejs/9.14.0/firebase-database.js";

import firebaseConfig from "../../config.js";

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function fetchFinalResults() {
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, "FSSA"));

    if (!snapshot.exists()) {
        console.log("No data available");
        return {};
    }

    const data = snapshot.val();
    const studentSectionMap = {};

    for (const [className, classData] of Object.entries(data)) {
        for (const [month, monthData] of Object.entries(classData)) {
            if (monthData.Result?.finalResult) {
                for (const [student, results] of Object.entries(monthData.Result.finalResult)) {
                    if (student !== "Class Average") {
                        if (!studentSectionMap[student]) {
                            studentSectionMap[student] = { className, months: {} };
                        }
                        studentSectionMap[student].months[month] = results;
                    }
                }
            }
        }
    }
    return studentSectionMap;
}

let studentSectionMap = {};

fetchFinalResults()
    .then((data) => {
        studentSectionMap = data;
        document.getElementById("loading").style.display='none'

        console.log("Data Loaded:", data);
    })
    .catch((error) => console.error("Error fetching data:", error));

document.getElementById("searchBox").addEventListener("input", () => {
    const query = document.getElementById("searchBox").value;
    const suggestionsBox = document.getElementById("suggestions");
    suggestionsBox.innerHTML = "";

    if (query.length === 0) return;

    const filteredData = Object.keys(studentSectionMap).filter((student) =>
        student.toLowerCase().includes(query.toLowerCase())
    );

    if (filteredData.length === 0) {
        const noMatch = document.createElement("div");
        noMatch.textContent = "No matches found";
        noMatch.classList.add("no-match");
        suggestionsBox.appendChild(noMatch);
        return;
    }

    filteredData.forEach((student) => {
        const suggestionItem = document.createElement("div");
        suggestionItem.textContent = student;
        suggestionItem.classList.add("suggestion-item", "list-group-item");

        suggestionItem.addEventListener("click", () => {
            document.getElementById("searchBox").value = student;
            suggestionsBox.innerHTML = "";
            displayStudentData(student);
        });

        suggestionsBox.appendChild(suggestionItem);
    });
});

function displayStudentData(student) {
    const chartsContainer = document.getElementById("charts");
    chartsContainer.innerHTML = "";
    
    const studentData = studentSectionMap[student];
    if (studentData) {
      const { className, months } = studentData;
      document.getElementById("sectionName").innerText=className.slice(-1)

        const subjects = new Set();
        for (const monthData of Object.values(months)) {
            Object.keys(monthData).forEach(subject => subjects.add(subject));
        }

        const subjectOrder = [
          "English", "LifeSkills", "Tech", "ProblemSolving", 
          "Project", "PET", "Attendance", "Behavior"
      ];

        const monthOrder = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const sortedMonths = Object.keys(months).sort(
            (a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b)
        );

        subjectOrder.forEach(subject => {
            const labels = sortedMonths;
            const totalColors = labels.length;

            const data = labels.map(month => months[month]?.[subject] || 0);

            const average = data.reduce((acc, value) => acc + value, 0) / data.length;

            data.push(average);

            const chartContainer = document.createElement("div");
            chartContainer.innerHTML = `<canvas id="chart-${subject}"></canvas> `;
            chartsContainer.appendChild(chartContainer);

            const ctx = document.getElementById(`chart-${subject}`).getContext("2d");
            new Chart(ctx, {
                type: "bar",
                data: {
                    labels: [...labels, 'Overall'], 
                    datasets: [{
                        label: subject,
                        data,
                        backgroundColor: [...labels, 'Overall'].map((_, index) => 
                            `hsl(${(index * (360 / ([...labels, 'Overall'].length)))}, 70%, 70%)`
                        ),
                        borderColor: [...labels, 'Overall'].map((_, index) => 
                            `hsl(${(index * (360 / ([...labels, 'Overall'].length)))}, 70%, 50%)`
                        ),
                        borderWidth: 1,
                    }],
                },                
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false },
                        title: {
                            display: true,
                            text: `${subject}`,
                        },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                stepSize:false,
                            },
                        },
                    },
                },
            });
        });

    }
}
