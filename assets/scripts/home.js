import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
} from "https://www.gstatic.com/firebasejs/9.14.0/firebase-database.js";
import {
  getFirestore,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/9.14.0/firebase-firestore.js";
import firebaseConfig from "../../config.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.14.0/firebase-auth.js";
import * as constValues from "../scripts/constValues.js"


// Firebase Initialization
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const firestore = getFirestore(app);
const auth = getAuth();

let section;
let role;
const classes = ["ClassA", "ClassB", "ClassC"];
const chartInstances = {}; 
const userName = localStorage.getItem("userName");

window.onload = async () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDoc = await getUserData(user.email);
      if (userDoc) {
        role = userDoc.role;
        localStorage.setItem("userRole",userDoc.role);
        
        section = userDoc.section === "FSSA" ? "All" : userDoc.section.split(" ").join("");
        if (section != "All") {
          document.getElementById("classNow").textContent = section.slice(-1);
        } else {
          document.getElementById("classNow").textContent = "All";
        }
        localStorage.setItem("section", section=="All"?"All":section);
        initializeManagementSide();
      }
    }
  });
};


async function getUserData(email) {
  try {
    const docSnap = await getDoc(doc(firestore, "FSSA/users/teachers", email));
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error("Error fetching user data:", error);
  }
}

async function initializeManagementSide() {
  await Promise.all([baseDataFetch(), fetchMonthsAndData()]);
  document.getElementById("loading").style.display = "none";

  if (!["Tech coach", "ELS coach"].includes(role)) {
    const changeClassBtn = document.getElementById("changeClass");
    changeClassBtn.style.display = "flex";
    changeClassBtn.addEventListener("click", () =>
      document.getElementById("showClassesForLead").style.display = "flex"
    );
  }

  document.querySelectorAll("#showClassesForLead button").forEach((button) =>
    button.addEventListener("click", () => {
      let className=button.textContent;
      const selectedClass = className=="All"?"All":"Class" + className;
      localStorage.setItem("section", selectedClass=="All"?"All":selectedClass);
      section = selectedClass;
      document.getElementById("showClassesForLead").style.display = "none";
      if (className != "All") {
        document.getElementById("classNow").textContent = className;
      } else {
        document.getElementById("classNow").textContent = "All";
      }
      initializeManagementSide();

    })
  );
}

// Fetch and update base data
async function baseDataFetch() {
  try {
    let data;
    if (section === "All") {
      // Fetch data for all classes and aggregate it
      const classDataPromises = classes.map((cls) =>
        getDoc(doc(firestore, `FSSA/studentsBaseDataCount/classes/${cls}`))
      );
      const classDataSnaps = await Promise.all(classDataPromises);
      data = classDataSnaps.reduce((acc, docSnap) => {
        if (docSnap.exists()) {
          const classData = docSnap.data();
          // Aggregate the data for all classes
          Object.keys(acc.gender).forEach((key) => {
            acc.gender[key] += classData.gender[key];
          });
          Object.keys(acc.medium).forEach((key) => {
            acc.medium[key] += classData.medium[key];
          });
          Object.keys(acc.school).forEach((key) => {
            acc.school[key] += classData.school[key];
          });
          Object.keys(acc.age).forEach((key) => {
            acc.age[key] += classData.age[key];
          });
          Object.keys(acc.category).forEach((key) => {
            acc.category[key] += classData.category[key];
          });
        }
        return acc;
      }, {
        gender: { male: 0, female: 0 },
        medium: { english: 0, tamil: 0 },
        school: { private: 0, govt: 0 },
        age: { 17: 0, 18: 0, 19: 0, 20: 0, 21: 0 },
        category: { A: 0, B: 0, C: 0, D: 0, E: 0 },
      });
    } else {
      // If section is not 'all', fetch data for the specific section
      const docSnap = await getDoc(doc(firestore, `FSSA/studentsBaseDataCount/classes/${section}`));
      if (docSnap.exists()) {
        data = docSnap.data();
      } else {
        console.log("No base data found for section:", section);
      }
    }

    if (data) {
      updateBaseData(data);
    }
  } catch (error) {
    console.error("Error fetching base data:", error);
  }
}

function updateBaseData(data) {
  const updateElement = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.innerText = value || "0";
  };

  updateElement("male", data.gender.male);
  updateElement("female", data.gender.female);
  updateElement("engMed", data.medium.english);
  updateElement("tamMed", data.medium.tamil);
  updateElement("private", data.school.private);
  updateElement("govt", data.school.govt);

  [17, 18, 19, 20, 21].forEach((age) =>
    updateElement(`age${age}`, data.age[age])
  );

  ["A", "B", "C", "D", "E"].forEach((cat) =>
    updateElement(`cat${cat}`, data.category[cat])
  );
}

async function fetchMonthsAndData() {
  const classesToFetch = section === "All" ? ["ClassA", "ClassB", "ClassC"] : [section];
  const monthsData = {};

  // Fetch months for each class
  for (const className of classesToFetch) {
    const monthRef = ref(database, `/FSSA/${className}`);
    const monthSnap = await get(monthRef);

    if (monthSnap.exists()) {
      Object.keys(monthSnap.val()).forEach((month) => {
        if (!monthsData[month]) monthsData[month] = {};
        monthsData[month][className] = monthSnap.val()[month];
      });
    }
  }

  // Sort months in chronological order
  const monthOrder = [
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
  const sortedMonths = Object.keys(monthsData).sort(
    (a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b)
  );

  // Fetch and compute average subject data, filtering out invalid months
  const { filteredMonths, subjectData } = await fetchAverageSubjectData(
    classesToFetch,
    sortedMonths,
    monthsData
  );

  // Plot charts with only valid months
  plotCharts(filteredMonths, subjectData);
}



async function fetchAverageSubjectData(classes, months, monthsData) {
  const subjects = ["English", "LifeSkills", "Tech", "ProblemSolving"];
  const subjectData = subjects.map(() => []); // One array per subject
  const validMonths = []; // To track months with valid data

  for (const month of months) {
    const subjectTotals = Array(subjects.length).fill(0); // Totals for each subject
    let classCount = 0;

    for (const className of classes) {
      const classMonthData = monthsData[month]?.[className];
      if (classMonthData?.Result?.finalResult?.["Class Average"]) {
        const data = classMonthData.Result.finalResult["Class Average"];

        // Accumulate subject data
        subjects.forEach((subject, index) => {
          if (data[subject] !== undefined) {
            subjectTotals[index] += data[subject];
          }
        });
        classCount++;
      }
    }

    // Calculate averages for the month
    if (classCount > 0) {
      const averages = subjectTotals.map((total) => (Math.round(total / classCount)*10)/10 || 0);

      // Check if any subject has valid data
      if (averages.some((avg) => avg > 0)) {
        validMonths.push(month);
        subjects.forEach((_, index) => {
          subjectData[index].push(averages[index]);
        });
      }
    }
  }

  return { filteredMonths: validMonths, subjectData };
}






function plotCharts(months, subjectData) {
  const subjects = ["English", "LifeSkills", "Tech", "ProblemSolving"];
  const validMonths = [...months, "Total"];

  subjectData.forEach((data, i) => {
    const average = calculateAverage(data);
    const finalData = [...data, average];
    createChart(
      `${subjects[i].toLowerCase()}Chart`,
      `${subjects[i]} `,
      validMonths,
      finalData
    );
  });
}

function createChart(chartId, label, labels, data) {
  const canvas = document.getElementById(chartId);
  if (!canvas) {
      console.error(`Canvas with id "${chartId}" does not exist.`);
      return; // Exit the function if the canvas doesn't exist
  }

  const ctx = canvas.getContext("2d");
  if (chartInstances[chartId]) {
      chartInstances[chartId].destroy();
  }

  const generateColor = (index, opacity) => {
      const hue = (index * 137) % 360;
      return `hsla(${hue}, 70%, 50%, ${opacity})`;
  };

  const backgroundColors = labels.map((_, index) => generateColor(index, 0.2));
  const borderColors = labels.map((_, index) => generateColor(index, 1));

  chartInstances[chartId] = new Chart(ctx, {
      type: "line",
      data: {
          labels: labels,
          datasets: [
              {
                  label: label,
                  data: data,
                  backgroundColor: backgroundColors,
                  borderColor: borderColors,
                  borderWidth: 1,
              },
          ],
      },
      options: {
          scales: {
              y: {
                  beginAtZero: true,
                  max: 100,
              },
          },
      },
  });
}


function calculateAverage(dataArray) {
  const validData = dataArray.filter((val) => val !== null);
  const sum = validData.reduce((acc, val) => acc + val, 0);
  return validData.length ? Math.round((sum / validData.length)*10/10) : 0;
}



document.addEventListener("DOMContentLoaded", () => {
  fetch(constValues.asideBarPath)
    .then((response) => response.text())
    .then((data) => {
      document.getElementById("sidebar").innerHTML = data;

      // Ensure these elements exist after loading the sidebar content
      const hamBurger = document.querySelector(".toggle-btn");
      if (hamBurger) {
        hamBurger.addEventListener("click", function () {
          document.querySelector("#sidebar").classList.toggle("expand");
        });
      }

      const subjectsAside = document.querySelectorAll(".subjectsAside a");
      subjectsAside.forEach((x) => {
        x.addEventListener("click", () => {
          if (section=="All"||!section) {
            showErrorMessage("Please choose a section",2000)
            return
          }
          localStorage.setItem("subject", x.textContent.split(" ").join(""));
          window.location.href =constValues.subjectsPath;
        });
      });

      const attendance = document.getElementById("attendance");
      if (attendance) {
        attendance.addEventListener("click", () => {
          if (section=="All"||!section) {
            showErrorMessage("Please choose a section",2000)
            return
          }
          localStorage.setItem("subject", "Attendance");
          window.location.href =constValues.subjectsPath;
        });
      }

      const backButton = document.getElementById("backButton");
      if (backButton) {
        backButton.addEventListener("click", () => {
          if (section=="All"||!section) {
            showErrorMessage("Please choose a section",2000)
            return
          }
          window.history.back();
        });
      }

      const analysisNav = document.getElementById("analysisNav");
      if (analysisNav) {
        analysisNav.addEventListener("click", () => {
          if (section=="All"||!section) {
            showErrorMessage("Please choose a section",2000)
            return
          }
          window.location.href = constValues.analysisHomePath;
        });
      }
      const monthlyReport = document.getElementById("monthlyReport");
      if (monthlyReport) {
        monthlyReport.addEventListener("click", () => {
          if (section=="All"||!section) {
            showErrorMessage("Please choose a section",2000)
            return
          }
          window.location.href = constValues.monthlyHomePath;
        });
      }

    });

  document.querySelector("header").innerHTML = `<div class="logo">Toodle</div>
<div class="d-flex gap-2 align-items-center">
    <button class="btn btn-outline-light " id="changeClass" style="display: none;">Choose Class</button>
    <div id="classNow">X</div>
</div>
<div class="user">
    <div class="userLogo"><span href="" id="user"><i class="lni lni-user"></i></span></div>
</div>`;

  if (userName) {
    document.getElementById("user").innerText = userName
      .slice(0, 1)
      .toUpperCase();
  }

  if (section != "All") {
    document.getElementById("classNow").textContent = section.slice(-1);
  } else {
    document.getElementById("classNow").textContent = "All";
  }
});



function showErrorMessage(str, time) {
  const errorPopup = document.getElementById("error-message");
  errorPopup.innerText = str;
  errorPopup.style.display = "block";
  setTimeout(() => {
    errorPopup.style.display = "none";
  }, time);
}
