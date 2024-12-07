import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
} from "https://www.gstatic.com/firebasejs/9.14.0/firebase-database.js";
import {
  getFirestore,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/9.14.0/firebase-firestore.js";

import firebaseConfig from "../../config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const dbFirestore = getFirestore(app);
const dbRealtime = getDatabase(app);
const baseData = {};
const subjects = [
  "Academic Overall",
  "English",
  "LifeSkills",
  "Tech",
  "ProblemSolving",
  "PET",
  "Project",
];
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
Chart.register(ChartDataLabels);

let subject = "Academic Overall";
let selectedMonth = "All Months";
document.getElementById("months-dropdown").innerText = "All Months";
document.getElementById("subjectsDropdown").textContent = "All Subjects";

async function fetchData(className) {
  document.getElementById("pleaseSelect").style.display="none";

  showLoading();
  await fetchMonths(className);

  try {
    if (className === "All") {
      await fetchAllClasses(["ClassA", "ClassB", "ClassC"]);
      return;
    }

    let combinedAcademicData, baseData;

    if (selectedMonth === "All Months") {
      ({ combinedAcademicData, baseData } = await fetchClassData(className));
    } else {
      await fetchDataForMonth(className, selectedMonth);
      return;
    }

    if (!combinedAcademicData) return;

    createChartsForAllSubjects(combinedAcademicData);
    const topBottomData = calculateTopBottom(combinedAcademicData);
    renderHandsontable(topBottomData);
    processAndRender(combinedAcademicData, baseData);
    processAndRenderCharts(combinedAcademicData, baseData, subject);
  } catch (error) {
    console.error("Error fetching data: ", error);
  } finally {
    hideLoading();
  }
}

async function fetchAllClasses(classes) {
  let combinedAcademicData = {};
  let combinedBaseData = {};

  for (const className of classes) {
    const { combinedAcademicData: classAcademicData, baseData: classBaseData } =
      await fetchClassData(className);
    if (classAcademicData) {
      combinedAcademicData = { ...combinedAcademicData, ...classAcademicData };
      combinedBaseData = { ...combinedBaseData, ...classBaseData };
    }
  }

  const topBottomData = calculateTopBottom(combinedAcademicData);
  renderHandsontable(topBottomData);
  createChartsForAllSubjects(combinedAcademicData);
  processAndRender(combinedAcademicData, combinedBaseData);
  processAndRenderCharts(combinedAcademicData, combinedBaseData, subject);
}

async function fetchClassData(className, months = null) {
  // Fetch months if not provided
  if (!months) {
    const monthsRef = ref(dbRealtime, `/FSSA/${className}`);
    const monthsSnapshot = await get(monthsRef);

    if (!monthsSnapshot.exists()) {
      console.warn(`No months found for class: ${className}`);
      return null;
    }

    months = Object.keys(monthsSnapshot.val());
  }

  // Aggregate academic data
  let combinedAcademicData = {};
  let studentCount = {};
  for (const month of months) {
    const academicRef = ref(
      dbRealtime,
      `/FSSA/${className}/${month}/Result/finalResult`
    );
    const academicSnapshot = await get(academicRef);

    if (academicSnapshot.exists()) {
      const monthData = academicSnapshot.val();
      for (const student in monthData) {
        if (student === "Class Average") continue;

        if (!combinedAcademicData[student]) {
          combinedAcademicData[student] = {};
          studentCount[student] = {};
        }

        for (const subject in monthData[student]) {
          if (!combinedAcademicData[student][subject]) {
            combinedAcademicData[student][subject] = 0;
            studentCount[student][subject] = 0;
          }
          combinedAcademicData[student][subject] += monthData[student][subject];
          studentCount[student][subject]++;
        }
      }
    }
  }

  // Calculate averages
  for (const student in combinedAcademicData) {
    for (const subject in combinedAcademicData[student]) {
      combinedAcademicData[student][subject] /= studentCount[student][subject];
    }
  }

  // Fetch base data
  const baseDataRef = collection(
    dbFirestore,
    `FSSA/studentsBaseData/${className}`
  );
  const baseDataSnapshot = await getDocs(baseDataRef);
  let baseData = {};
  baseDataSnapshot.forEach((doc) => {
    baseData[doc.id] = doc.data();
  });

  return { combinedAcademicData, baseData };
}

document.addEventListener("DOMContentLoaded", () => {
  const dropdownItems = document.querySelectorAll(".dropdown-item");

  dropdownItems.forEach((item) => {
    item.addEventListener("click", (event) => {
      const selectedClass = event.target.dataset.class;
      document.getElementById("dropdownMenuButton").innerText =
        event.target.textContent;
        document.getElementById("noMonthMarks").style.display="none";
        document.querySelector(".mainContainer").style.display="block";
      fetchData(selectedClass);
    });
  });
});

function populateMonthsDropdown(months, className) {
  const dropdownMenu = document.getElementById("months-dropdown-menu");
  dropdownMenu.innerHTML = "";

  if (months.length > 0) {
    months.sort(
      (a, b) => orderedMonths.indexOf(a) - orderedMonths.indexOf(b)
    );
    months.forEach((month) => {
      const monthItem = document.createElement("a");
      monthItem.className = "dropdown-item";
      monthItem.href = "#";
      monthItem.textContent = month;
      monthItem.onclick = () => {
        selectedMonth = month;
        document.getElementById("noMonthMarks").style.display="none";
        document.querySelector(".mainContainer").style.display="block";
        document.getElementById("months-dropdown").innerText = month;
        fetchDataForMonth(className, month);
      };

      dropdownMenu.appendChild(monthItem);
    });
  } else {
    const noMonthsItem = document.createElement("span");
    noMonthsItem.className = "dropdown-item text-muted";
    noMonthsItem.textContent = "No months available";
    dropdownMenu.appendChild(noMonthsItem);
  }

  // Add "All Months" option
  const allMonthsItem = document.createElement("a");
  allMonthsItem.className = "dropdown-item";
  allMonthsItem.href = "#";
  allMonthsItem.textContent = "All Months";
  allMonthsItem.onclick = () => {
    selectedMonth = "All Months";
    document.getElementById("noMonthMarks").style.display="none";
    document.querySelector(".mainContainer").style.display="block";
    document.getElementById("months-dropdown").innerText = "All Months";
    fetchAllMonthsData(className, months);
  };

  dropdownMenu.appendChild(allMonthsItem);
}

async function fetchDataForMonth(className, month) {
  showLoading();
  try {
    const academicRef = ref(
      dbRealtime,
      `/FSSA/${className}/${month}/Result/finalResult`
    );
    const academicSnapshot = await get(academicRef);

    const baseDataRef = collection(
      dbFirestore,
      `FSSA/studentsBaseData/${className}`
    );
    const baseDataSnapshot = await getDocs(baseDataRef);

    baseDataSnapshot.forEach((doc) => {
      baseData[doc.id] = doc.data();
    });

    if (academicSnapshot.exists()) {
      const academicData = academicSnapshot.val();
      processAndRender(academicData, baseData);
      processAndRenderCharts(academicData, baseData, subject);
      const topBottomData = calculateTopBottom(academicData);
      createChartsForAllSubjects(academicData)
      renderHandsontable(topBottomData);
    } else {
      if(className!=="All Classes"){
        console.error("No data found for the selected month.");
      document.querySelector(".mainContainer").style.display="none";
      document.getElementById("noMonthMarks").style.display="flex";
      document.getElementById("monthName").innerText=selectedMonth;
      document.getElementById("classNameForNoMonth").innerText=className;
      }

    }
  } catch (error) {
    console.error("Error fetching data for the month: ", error);
  } finally {
    hideLoading();
  }
}

async function fetchAllMonthsData(className, months) {
  showLoading();
  let combinedAcademicData = {};
  let studentCount = {};

  try {
    for (const month of months) {
      const academicRef = ref(
        dbRealtime,
        `/FSSA/${className}/${month}/Result/finalResult`
      );
      const snapshot = await get(academicRef);

      if (snapshot.exists()) {
        const monthData = snapshot.val();

        for (const student in monthData) {
          if (student === "Class Average") continue;

          if (!combinedAcademicData[student]) {
            combinedAcademicData[student] = {};
            studentCount[student] = {};
          }

          for (const subject in monthData[student]) {
            if (!combinedAcademicData[student][subject]) {
              combinedAcademicData[student][subject] = 0;
              studentCount[student][subject] = 0;
            }
            combinedAcademicData[student][subject] +=
              monthData[student][subject];
            studentCount[student][subject]++;
          }
        }
      }
    }

    // Calculate averages
    for (const student in combinedAcademicData) {
      for (const subject in combinedAcademicData[student]) {
        combinedAcademicData[student][subject] /=
          studentCount[student][subject];
      }
    }
    const topBottomData = calculateTopBottom(combinedAcademicData);
    renderHandsontable(topBottomData);
    createChartsForAllSubjects(combinedAcademicData)
    processAndRender(combinedAcademicData, baseData);
    processAndRenderCharts(combinedAcademicData, baseData, subject);
  } catch (e) {
    console.log(e);
  } finally {
    hideLoading();
  }
}
function processAndRender(data, baseData) {
  const subjectButtonsContainer = document.getElementById(
    "subjectsDropdownList"
  );
  subjectButtonsContainer.innerHTML = "";
  subjects.forEach((sub) => {
    const subjectItem = document.createElement("a");
    subjectItem.textContent = sub == "Academic Overall" ? "All Subjects" : sub;
    subjectItem.href = "#";
    subjectItem.className = "dropdown-item";
    subjectItem.onclick = () => {
      document.getElementById("subjectsDropdown").textContent =
        sub == "Academic Overall" ? "All Subjects" : sub;
      subject = sub;
      document.getElementById("noMonthMarks").style.display="none";
      document.querySelector(".mainContainer").style.display="block";
      showLoading();
      renderSubjectData(sub, data, baseData);
      setTimeout(() => {
        hideLoading();
      }, 500);
    };
    subjectButtonsContainer.appendChild(subjectItem);

    if (sub === subject) {
      renderSubjectData(subject, data, baseData);
    }
  });
}

async function renderSubjectData(subject, data, baseData) {
  // Render Table
  const subjectData = [];
  for (const student in data) {
    if (student === "Class Average") continue;
    subjectData.push({
      Name: student,
      Marks: data[student][subject],
    });
  }
  renderAcademicOverallTable(subjectData, subject);
  processAndRenderCharts(data, baseData, subject);
}

// charts  and tables

let handsontableInstance = null;

async function fetchMonths(className) {
  if (className === "All") {
    const classes = ["ClassA", "ClassB", "ClassC"];
    let commonMonths = null;

    for (const singleClass of classes) {
      const monthsRef = ref(dbRealtime, `/FSSA/${singleClass}/`);
      const snapshot = await get(monthsRef);

      if (snapshot.exists()) {
        const months = Object.keys(snapshot.val());
        if (commonMonths === null) {
          // Initialize with months from the first class
          commonMonths = new Set(months);
        } else {
          // Keep only the intersection of months
          commonMonths = new Set(
            [...commonMonths].filter((month) => months.includes(month))
          );
        }
      } else {
        console.warn(`No months found for class: ${singleClass}`);
        commonMonths = new Set(); // If any class has no months, intersection is empty
        break;
      }
    }

    if (commonMonths && commonMonths.size > 0) {
      populateMonthsDropdown([...commonMonths], "All Classes");
    } else {
      console.warn("No common months found across all classes.");
      populateMonthsDropdown([], "All Classes");
    }
  } else {
    const monthsRef = ref(dbRealtime, `/FSSA/${className}/`);
    const snapshot = await get(monthsRef);

    if (snapshot.exists()) {
      const months = Object.keys(snapshot.val());
      populateMonthsDropdown(months, className);
    } else {
      console.error(`No months found for class: ${className}`);
      populateMonthsDropdown([], className);
    }
  }
}

async function renderAcademicOverallTable(subjectData, subject) {
  const container = document.getElementById("academic-overall-table");
  container.innerHTML = ""; // Clear existing table

  const ranges = {
    "80-100": [],
    "50-80": [],
    "0-50": [],
  };

  let isDataNotOk = subjectData.some((item) => item.Marks === undefined);

  if (isDataNotOk) {
    document.getElementById("subjectNameForNoMarks").innerText=subject;
    document.querySelector(".charts").style.display="none";
    document.querySelector("#academic-overall-table").style.display="none";
    document.getElementById("noMarksMsg").style.display="flex"

    return;
  }
  document.getElementById("noMarksMsg").style.display="none";
  document.querySelector(".charts").style.display="flex";
  document.querySelector("#academic-overall-table").style.display="block";

  subjectData.sort((a, b) => b.Marks - a.Marks);
  subjectData.forEach((entry) => {
    const score = entry.Marks;
    const nameScore = `${entry.Name} - ${Math.round(score * 10) / 10}`;

    if (score >= 80) {
      ranges["80-100"].push(nameScore);
    } else if (score >= 50) {
      ranges["50-80"].push(nameScore);
    } else if (score >= 0) {
      ranges["0-50"].push(nameScore);
    }
  });

  const maxRows = Math.max(
    ranges["80-100"].length,
    ranges["50-80"].length,
    ranges["0-50"].length
  );

  const tableData = Array.from({ length: maxRows }, (_, rowIndex) => ({
    "80-100": ranges["80-100"][rowIndex] || "",
    "50-80": ranges["50-80"][rowIndex] || "",
    "0-50": ranges["0-50"][rowIndex] || "",
  }));

  // Create a title for the subject
  const title = document.createElement("h3");
  title.textContent = `Subject : ${
    subject == "Academic Overall" ? "All Subjects" : subject
  }`;
  container.appendChild(title);

  // Render table
  const tableContainer = document.createElement("div");
  container.appendChild(tableContainer);

  handsontableInstance = new Handsontable(tableContainer, {
    data: tableData,
    colHeaders: ["80-100", "50-80", "0-50"],
    columns: [
      { data: "80-100", type: "text", readOnly: true },
      { data: "50-80", type: "text", readOnly: true },
      { data: "0-50", type: "text", readOnly: true },
    ],
    rowHeaders: true,
    stretchH: "all",
    width: container.offsetWidth,
    height: "auto",
    licenseKey: "non-commercial-and-evaluation",
    cells: function (row, col) {
      const cellProperties = {};
      if (row >= 0) cellProperties.className = "fonts";
      return cellProperties;
    },
  });
}

async function processAndRenderCharts(academicData, baseData, subject) {
  const studentData = [];
  for (const student in academicData) {
    if (student === "Class Average") continue;
    const marks = academicData[student][subject];
    if (baseData[student]) {
      studentData.push({
        name: student,
        marks: marks,
        ...baseData[student],
      });
    }
  }

  const groupData = (groupKey) => {
    const groups = {};
    studentData.forEach((student) => {
      const groupValue = student[groupKey];
      const marksRange =
        student.marks >= 80 ? "80-100" : student.marks >= 50 ? "50-80" : "0-50";
      if (!groups[groupValue]) {
        groups[groupValue] = { "80-100": 0, "50-80": 0, "0-50": 0 };
      }
      groups[groupValue][marksRange]++;
    });
    return groups;
  };

  function getGroupItems(groupKey) {
    if (groupKey == "medium") {
      return ["English", "Tamil"];
    } else if (groupKey == "school") {
      return ["Govt", "Private"];
    } else if (groupKey == "category") {
      return ["A", "B", "C+", "D", "E"];
    } else if (groupKey == "gender") {
      return ["Male", "Female"];
    } else {
      return ["17", "18", "19", "20", "21"];
    }
  }

  const renderCharts = (groupKey, containerId, titlePrefix) => {
    const groups = groupData(groupKey);

    const container = document.getElementById(containerId);
    container.innerHTML = "";

    const heading = document.createElement("h3");
    heading.textContent = capitalizeFirstLetter(groupKey);
    container.appendChild(heading);

    let groupItems = getGroupItems(groupKey);

    for (const group of groupItems) {
      if (!groups[group]) {
        console.warn(`No data found for group: ${group}`);
        continue;
      }

      const chartId = `${groupKey}-${group}-chart`;
      const canvas = document.createElement("canvas");
      canvas.id = chartId;
      container.appendChild(canvas);

      const data = Object.values(groups[group]);
      const labels = Object.keys(groups[group]);

      new Chart(canvas, {
        type: "pie",
        data: {
          labels: labels,
          datasets: [
            {
              data: data,
              backgroundColor: ["#4caf50", "#FFC107", "#f44336"],
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: false,
            },
            title: {
              display: true,
              text: `${
                group == "Govt"
                  ? "Govt / GovtAided"
                  : group == "Tamil"
                  ? "Tamil / Malayalam"
                  : group
              } - ${data.reduce((sum, val) => sum + val, 0)}`,
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const value = context.raw;
                  const total = context.dataset.data.reduce(
                    (sum, val) => sum + val,
                    0
                  );
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `  ${value} (${percentage}%)`;
                },
              },
            },
            datalabels: {
              display: true,
              color: "white",
              formatter: (value, context) => {
                // Get the total sum of the data
                const total = context.dataset.data.reduce(
                  (sum, val) => sum + val,
                  0
                );

                // Avoid division by zero and hide 0% labels
                if (total === 0 || value === 0) {
                  return null; // Return null to hide 0% labels
                }

                // Calculate the percentage
                const percentage = ((value / total) * 100).toFixed(2) + "%";
                return percentage; // Show percentage instead of count
              },
              font: {
                weight: "bold",
              },
              anchor: "center",
              align: "center",
              offset: 1,
            },
          },
        },
      });
    }
  };

  renderCharts("gender", "gender-charts", "Gender");
  renderCharts("category", "category-charts", "Category");
  renderCharts("age", "age-charts", "Age");
  renderCharts("medium", "medium-charts", "Medium");
  renderCharts("school", "school-charts", "School");
}

function calculateTopBottom(academicData) {
  const result = subjects.map((subject) => {
    const studentMarks = Object.entries(academicData)
      .filter(([student]) => student !== "Class Average") // Exclude class average
      .map(([student, scores]) => ({
        name: student,
        marks: scores[subject] || 0,
      }))
      .sort((a, b) => b.marks - a.marks); // Sort descending by marks
    return {
      subject,
      top5: studentMarks.slice(0, 5),
      bottom5: studentMarks.slice(-5),
    };
  });
  return result;
}

let handsontableInstanceForTopAndBottom;

async function renderHandsontable(topBottomData) {
  const tableData = [];

  const top5Data = Array(5)
    .fill(null)
    .map((_, rank) => {
      const row = [""];
      topBottomData.forEach((entry) => {
        row.push(`${entry.top5[rank]?.name} - ${Math.round(entry.top5[rank]?.marks*10)/10 || 0}`);
      });
      return row;
    });

  const bottom5Data = Array(5)
    .fill(null)
    .map((_, rank) => {
      const row = [""];
      topBottomData.forEach((entry) => {
        row.push(
          `${entry.bottom5[rank]?.name} - ${Math.round(entry.bottom5[rank]?.marks*10)/10 || 0}`
        );
      });
      return row;
    });
  top5Data[2][0] = "Top 5";
  bottom5Data[2][0] = "Bottom 5";

  tableData.push([...Array(subjects.length + 1).fill("")]);
  tableData.push(...top5Data);
  tableData.push([""]);
  tableData.push(...bottom5Data.reverse());

  const container = document.getElementById("top-bottom-table");

  if (handsontableInstanceForTopAndBottom) {
    handsontableInstanceForTopAndBottom.updateSettings({ data: tableData });
  } else {
    const headers = ["", ...subjects];
    handsontableInstanceForTopAndBottom = new Handsontable(container, {
      data: tableData,
      colHeaders: headers,
      rowHeaders: false,
      licenseKey: "non-commercial-and-evaluation",
      stretchH: "all",
      width: container.offsetWidth,
      height: "auto",
      cells: function (row, col) {
        const cellProperties = {};
        if (row >= 0) cellProperties.readOnly = true;
        if (row >= 0) cellProperties.className = "fonts";
        if (row == 4 && col == 0) cellProperties.className = "htCenter";
        if (row > 0 && col == 0 && row < 6 && col == 0)
          cellProperties.className = "top5Cells";
        if (row > 6 && col == 0 && row < 12 && col == 0)
          cellProperties.className = "bottom5Cells";
        return cellProperties;
      },
    });
  }
}

function processScores(data) {
  const scoreRanges = { "0-50": 0, "51-80": 0, "81-100": 0 };
  const processedData = {};

  // Exclude non-student keys like "Class Average"
  const students = Object.keys(data).filter((key) => key !== "Class Average");

  subjects.forEach((subject) => {
    if (!processedData[subject]) {
      processedData[subject] = { ...scoreRanges };
    }
  });

  // Populate ranges for each subject
  students.forEach((student) => {
    Object.entries(data[student]).forEach(([subject, score]) => {
      if (processedData[subject]) {
        if (score <= 50) processedData[subject]["0-50"]++;
        else if (score <= 80) processedData[subject]["51-80"]++;
        else if (score <= 100) processedData[subject]["81-100"]++;
      }
    });
  });

  if (!Object.keys(students[0]).includes("PET")) {
    processedData["PET"]["0-50"] = students.length;
  }
  if (!Object.keys(students[0]).includes("Project")) {
    processedData["Project"]["0-50"] = students.length;
  }

  return processedData;
}

const existingCharts = {};

function createCharts(processedData) {
  Object.keys(processedData).forEach((subject) => {
    const canvasId = `chart-${subject}`;
    const canvas = document.getElementById(canvasId);

    if (!canvas) {
      console.error(`Canvas element with ID ${canvasId} not found.`);
      return;
    }

    // Destroy any existing chart for this canvas
    if (existingCharts[canvasId]) {
      existingCharts[canvasId].destroy();
    }

    const chartData = Object.values(processedData[subject]);
    const total = chartData.reduce((sum, val) => sum + val, 0);

    const labels = ["0-50", "51-80", "81-100"].filter(
      (_, idx) => chartData[idx] > 0
    );
    const dataValues = chartData.filter((value) => value > 0);

    const colorMap = {
      "0-50": "#f44336", // Red
      "51-80": "#FFC107", // Yellow
      "81-100": "#4caf50", // Green
    };
    const backgroundColors = labels.map((label) => colorMap[label]);

    const data = {
      labels,
      datasets: [
        {
          label: `${subject}`,
          data: dataValues,
          backgroundColor: backgroundColors,
          borderWidth: 0,
        },
      ],
    };

    // Create a pie chart
    const newChart = new Chart(canvas, {
      type: "pie",
      data,
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: `${subject}`,
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const value = context.raw;
                const percentage = ((value / total) * 100).toFixed(1);
                return `  ${value} (${percentage}%)`;
              },
            },
          },
          datalabels: {
            formatter: (value, context) => {
              const percentage = ((value / total) * 100).toFixed(1);
              return percentage > 0 ? `${percentage}%` : null;
            },
            color: "#fff",
            font: {
              weight: "bold",
            },
            anchor: "center",
            align: "center",
          },
        },
      },
      plugins: [],
    });

    // Store the new chart instance for later cleanup
    existingCharts[canvasId] = newChart;
  });
}

async function createChartsForAllSubjects(rawData) {
  const processedData = processScores(rawData);
  createCharts(processedData);
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function showLoading() {
  document.getElementById("loading").style.display = "flex";
}

function hideLoading() {
  document.getElementById("loading").style.display = "none";
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    hideLoading();
  }, 2000);
});
