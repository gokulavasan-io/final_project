// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
} from "https://www.gstatic.com/firebasejs/9.14.0/firebase-database.js";
import {
  getFirestore,
  doc,
  getDoc, // Use getDoc instead of get
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
const database = getDatabase(app);
const firestore = getFirestore(app);


const role = localStorage.getItem("role");
let section = localStorage.getItem("section");
let monthsForSelection = [];
let monthsForGraph=[];
const classes = ["ClassA", "ClassB", "ClassC"];

document.addEventListener("DOMContentLoaded", function () {
  if (role == "others") {
    document.getElementById("changeClass").style.display = "flex";
  }
  baseDataFetch();
  if (role != "others") {
    changeToClass();
  } else {
    changeToManagementSide();
  }
});

document.getElementById("changeClass").addEventListener("click", function () {
  document.getElementById("showClassesForLead").style.display = "flex";
});

document.getElementById("allMonth").addEventListener("click",()=>{
  calculateAndDisplayTopBottomAverages();
  document.getElementById("forMonth").querySelector("button").textContent = "All Month";

})


document.querySelectorAll("#showClassesForLead button").forEach((button) => {
  button.addEventListener("click", (event) => {
    if (event.target.id == "forA") {
      localStorage.setItem("section", "ClassA");
    } else if (event.target.id == "forB") {
      localStorage.setItem("section", "ClassB");
    } else {
      localStorage.setItem("section", "ClassC");
    }
    window.location.href = "../../pages/html/home.html";
  });
});

async function changeToManagementSide() {
  document.querySelector(".buttonForMonthChange").style.display = "none";
  document.querySelector(".forClass").style.display="none";
  await monthsReadyForbutton();
  await fetchMonthlyData();
  document.getElementById("loading").style.display = "none";
}

async function changeToClass() {
  document.querySelector(".forManagement").style.display="none";
  await monthsReadyForbutton();
  document.getElementById("forMonth").querySelector("button").textContent = "All Month";
  await calculateAndDisplayTopBottomAverages();
  await fetchMonthlyData();
}

async function fetchStudentMarks(month) {
  const dbRef = ref(
    database,
    `/studentMarks/${section}/months/${month}/result`
  );
  const snapshot = await get(dbRef);

  if (snapshot.exists()) {
    return snapshot.val();
  } else {
    console.log("No data available");
    return {};
  }
}

function getTopBottomScores(data, subject) {
  const scores = Object.entries(data)
    .filter(([name]) => name !== "classAverage")
    .map(([name, marks]) => ({ name, score: marks[subject] }))
    .sort((a, b) => b.score - a.score);

  const top5 = scores.slice(0, 5).map((item) => `${item.name} - ${item.score}`);
  const bottom5 = scores
    .slice(-5)
    .map((item) => `${item.name} - ${item.score}`);
  return { top5, bottom5 };
}

async function getSubjectTopBottom(data, subject) {
  const { top5, bottom5 } = getTopBottomScores(data, subject);
  let topRows = [],
    bottomRows = [];
  top5.forEach((student, i) => {
    topRows[i] = student;
  });
  bottom5.forEach((student, i) => {
    bottomRows[i] = student;
  });

  return { topRows, bottomRows };
}

async function prepareTable(month) {
  const data = await fetchStudentMarks(month);
  let subjects = role==="Tech"?["Tech", "ProblemSolving"]:["English","LifeSkills"];

  let TechRows = await getSubjectTopBottom(data, subjects[0]);
  let psRows = await getSubjectTopBottom(data, subjects[1]);

  TechRows.topRows.forEach((mark, i) => {
    document.getElementById(`techT${i + 1}`).innerText = mark;
  });
  TechRows.bottomRows.reverse().forEach((mark, i) => {
    document.getElementById(`techB${i + 1}`).innerText = mark;
  });
  psRows.topRows.forEach((mark, i) => {
    document.getElementById(`psT${i + 1}`).innerText = mark;
  });
  psRows.bottomRows.reverse().forEach((mark, i) => {
    document.getElementById(`psB${i + 1}`).innerText = mark;
  });
}

const orderedMonths = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

async function fetchMonthsForButton(section) {
  const monthRef = ref(database, `/studentMarks/${section}/months`);
  const monthSnapshot = await get(monthRef);

  if (monthSnapshot.exists()) {
    const newMonths = Object.keys(monthSnapshot.val());
    monthsForSelection = [...new Set([...monthsForSelection, ...newMonths])]; // Combine and deduplicate months
  } else {
    console.log(`No months available for ${section}.`);
  }
}

async function monthsReadyForbutton() {
  await Promise.all(classes.map(fetchMonthsForButton));
  monthsForSelection.sort(
    (a, b) => orderedMonths.indexOf(a) - orderedMonths.indexOf(b)
  );

  // Dynamically populate month dropdown items only if data exists for each month
  for (const month of monthsForSelection) {
    const data = await fetchStudentMarks(month);
    if (Object.keys(data).length > 0) {  // Only add the month if data exists
      let eachMonth = document.createElement("li");
      eachMonth.innerHTML = `<a class="dropdown-item" href="#" id="${month}">${month}</a>`;
      document.getElementById("monthsButton").appendChild(eachMonth);
      monthsForGraph.push(month);

      // Add click event listener to each dynamically created <li>
      eachMonth.addEventListener("click", () => {
        prepareTable(month);
        document.getElementById("forMonth").querySelector("button").textContent = month;
      });
    }
  }
}


// Calculate and display top 5 and bottom 5 students based on average scores across all months
async function calculateAndDisplayTopBottomAverages() {
  const studentScores = {};
  const subjects = role === "Tech" ? ["Tech", "ProblemSolving"] : ["English", "LifeSkills"];

  const headings = document.getElementsByClassName("subjectHeading");
  for (let i = 0; i < headings.length; i++) {
    headings[i].innerText = subjects[i];
  }
  

  for (const month of monthsForSelection) {
    const data = await fetchStudentMarks(month);
    if (Object.keys(data).length > 0) {
      for (const student in data) {
        if (!studentScores[student]) {
          studentScores[student] = { [subjects[0]]: [], [subjects[1]]: [] };
        }
        if (data[student][subjects[0]] != null) {
          studentScores[student][subjects[0]].push(data[student][subjects[0]]);
        }
        if (data[student][subjects[1]] != null) {
          studentScores[student][subjects[1]].push(data[student][subjects[1]]);
        }
      }
    }
  }

  const averages = [];
  for (const student in studentScores) {
    const avgSubject1 = calculateAverage(studentScores[student][subjects[0]]);
    const avgSubject2 = calculateAverage(studentScores[student][subjects[1]]);
    averages.push({ name: student, [subjects[0]]: avgSubject1, [subjects[1]]: avgSubject2 });
  }

  const sortedSubject1 = [...averages].sort((a, b) => b[subjects[0]] - a[subjects[0]]);
  const sortedSubject2 = [...averages].sort((a, b) => b[subjects[1]] - a[subjects[1]]);

  const top5Subject1 = sortedSubject1.slice(0, 5).map((student) => `${student.name} - ${student[subjects[0]].toFixed(2)}`);
  const bottom5Subject1 = sortedSubject1.slice(-5).reverse().map((student) => `${student.name} - ${student[subjects[0]].toFixed(2)}`);
  const top5Subject2 = sortedSubject2.slice(0, 5).map((student) => `${student.name} - ${student[subjects[1]].toFixed(2)}`);
  const bottom5Subject2 = sortedSubject2.slice(-5).reverse().map((student) => `${student.name} - ${student[subjects[1]].toFixed(2)}`);

  top5Subject1.forEach((mark, i) => {
    document.getElementById(`techT${i + 1}`).innerText = mark;
  });
  bottom5Subject1.forEach((mark, i) => {
    document.getElementById(`techB${i + 1}`).innerText = mark;
  });

  top5Subject2.forEach((mark, i) => {
    document.getElementById(`psT${i + 1}`).innerText = mark;
  });
  bottom5Subject2.forEach((mark, i) => {
    document.getElementById(`psB${i + 1}`).innerText = mark;
  });
  document.getElementById("loading").style.display = "none";
}


// Helper function to calculate the average of an array of numbers
function calculateAverage(scores) {
  const sum = scores.reduce((acc, score) => acc + score, 0);
  return scores.length ? sum / scores.length : 0;
}




async  function baseDataFetch() {
  // Construct the document path as a string
  const docPath = `FSSA/studentsBaseDataCount/classes/${section}`;

  // Get a reference to the Firestore document using the string path
  const docRef = doc(firestore, docPath);  // Use the doc() function here

  // Fetch the document data using getDoc
  getDoc(docRef).then((docSnapshot) => {
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      console.log(data);
      
      changeBaseDataCount(data);

      // You can update the UI with this data as well
    } else {
      console.log("No such document!");
    }
  }).catch((error) => {
    console.error("Error fetching document:", error);
  });
};


function changeBaseDataCount(data) {
  //gender
    document.getElementById("male").innerText=data.gender.male;
    document.getElementById("female").innerText=data.gender.female;
// medium
    document.getElementById("engMed").innerText=data.medium.english;
    document.getElementById("tamMed").innerText=data.medium.tamil;
// school
    document.getElementById("private").innerText=data.school.private;
    document.getElementById("govt").innerText=data.school.govt;
// age
    let age=[17,18,19,20,21];
    age.forEach(x=>{
      document.getElementById(`age${x}`).innerText=data.age[`${x}`];
    })

    let category=["A","B","C","D","E"];
    category.forEach(x=>{
      document.getElementById(`cat${x}`).innerText=data.category[x];
    })
}


//////////////////////////// for graph

// Fetch data for each month and create charts
async function fetchMonthlyData() {
  const subject1Data = [];
  const subject2Data = [];
  const subject3Data = [];
  const subject4Data = [];
  let subjects;
  if (role === "others") {
    subjects = ["English", "LifeSkills", "Tech", "ProblemSolving"];
  } else if (role === "Tech") {
    subjects = ["Tech", "ProblemSolving"];
  } else {
    subjects = ["English", "LifeSkills"];
  }

  let months = [...monthsForGraph]; // Clone months to avoid modifying the original
  for (let month of months) {
    const dbRef = ref(database, `/studentMarks/${section}/months/${month}/result/classAverage`);
    try {
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const data = snapshot.val();

        subject1Data.push(data[subjects[0]]);
        subject2Data.push(data[subjects[1]]);
        if (role === "others") {
          subject3Data.push(data[subjects[2]]);
          subject4Data.push(data[subjects[3]]);
        }
      } else {
        subject1Data.push(null);
        subject2Data.push(null);
        if (role === "others") {
          subject3Data.push(null);
          subject4Data.push(null);
        }
      }
    } catch (error) {
      console.error(`Error fetching data for ${month}:`, error);
    }
  }

  const calculateAverage = (data) => data.filter((val) => val !== null).reduce((sum, val) => sum + val, 0) / data.filter((val) => val !== null).length;

  const subject1Average = calculateAverage(subject1Data);
  const subject2Average = calculateAverage(subject2Data);
  const subject3Average = calculateAverage(subject3Data);
  const subject4Average = calculateAverage(subject4Data);

  subject1Data.push(subject1Average);
  subject2Data.push(subject2Average);
  if (role === "others") {
    subject3Data.push(subject3Average);
    subject4Data.push(subject4Average);
  }
  months.push("Total");

  if (role !== "others") {
    createChart('techChart', `${subjects[0]} Average by Month`, months, subject1Data);
    createChart('problemSolvingChart', `${subjects[1]} Average by Month`, months, subject2Data);
  } else {
    createChart('menglishChart', `${subjects[0]} Average by Month`, months, subject1Data);      
    createChart('mlsChart', `${subjects[1]} Average by Month`, months, subject2Data);
    createChart('mtechChart', `${subjects[2]} Average by Month`, months, subject3Data);
    createChart('mproblemSolvingChart', `${subjects[3]} Average by Month`, months, subject4Data);
  }
}



function createChart(chartId, label, labels, data) {
  const ctx = document.getElementById(chartId).getContext('2d');

  // Function to generate color in HSL format
  const generateColor = (index, opacity) => {
    const hue = (index * 137) % 360;  // 137 degrees to create unique hues
    return `hsla(${hue}, 70%, 50%, ${opacity})`;
  };

  // Generate background and border colors based on index
  const backgroundColors = labels.map((_, index) => generateColor(index, 0.2));
  const borderColors = labels.map((_, index) => generateColor(index, 1));

  new Chart(ctx, {
      type: 'line',
      data: {
          labels: labels,
          datasets: [{
              label: label,
              data: data,
              backgroundColor: backgroundColors,
              borderColor: borderColors,
              borderWidth: 1
          }]
      },
      options: {
          scales: {
              y: {
                  beginAtZero: true
              }
          }
      }
  });
}
