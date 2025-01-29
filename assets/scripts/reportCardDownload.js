const studentName = document.getElementById("student-name");
const studentName1 = document.getElementById("student-name1");
const teacherName = document.getElementById("teachers-name");
const rpSection = document.getElementById("rpSection");
const rpMonth = document.getElementById("rpMonth");
const rpYear = document.getElementById("rpYear");
const english = document.getElementById("rpEnglish");
const life_skills = document.getElementById("rpLifeSkills");
const tech = document.getElementById("rpTech");
const problem_solving = document.getElementById("rpProblemSolving");
const project = document.getElementById("rpProject");
const PET = document.getElementById("rpPET");
const attendance = document.getElementById("rpAttendance");
const behavior = document.getElementById("rpBehavior");
const overall = document.getElementById("rpOverall");
const class_eng = document.getElementById("classEng");
const class_els = document.getElementById("classLS");
const class_tech = document.getElementById("classTech");
const class_pb = document.getElementById("classPS");
const class_project = document.getElementById("classProject");
const class_PET = document.getElementById("classPET");
const class_overall = document.getElementById("classOverall");
const previous = document.getElementById("previous");
const downloadNow = document.getElementById("downloadNow");
const next = document.getElementById("next");
const downloadAll = document.getElementById("downloadAll");
const card = document.getElementById("report-card");
const remarks = document.getElementById("remark");

// // .................... variables end ............ //

// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
} from "https://www.gstatic.com/firebasejs/9.14.0/firebase-database.js";

import firebaseConfig from "../../config.js"
import * as constValues from "../scripts/constValues.js"



// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

let studentData;
let studentNames;
let month = localStorage.getItem("month");
let section = localStorage.getItem("section");
let index = 0;
let year = new Date().getFullYear();
let hasProject = false;
let hasPET=false;
let teacherNames =
  section == "ClassA"
    ? "Miss Sreekala && Miss Haripriya"
    : section == "ClassB"
    ? "Mr Bharatwaj && Miss Sukirthi"
    : "Mr Surya && Miss Niroshini";

async function fetchStudentNames() {
  const attendancePath = `/FSSA/${section}/${month}/Result/Attendance`;
  const attendanceSnapshot = await get(ref(database, attendancePath));

  studentNames = attendanceSnapshot.exists()
    ? Object.keys(attendanceSnapshot.val())
    : [];
}

async function fetchStudentMarks(month) {
  const dbRef = ref(database, `/FSSA/${section}/${month}/Result/finalResult`);
  const snapshot = await get(dbRef);

  if (snapshot.exists()) {
    return snapshot.val();
  } else {
    console.log("No data available");
    return {};
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await fetchStudentNames(section);
  studentData = await fetchStudentMarks(month);
  console.log(studentData);

  if ("Project" in studentData["Class Average"]) {
    hasProject = true;
  }
  if ("PET" in studentData["Class Average"]) {
    hasPET = true;
  }
  if (!hasProject) {
    changeToNotProjectOrPET("Project")
  }
  if(!hasPET){
    changeToNotProjectOrPET("PET")
  }
  displayStudentData(studentNames[index]);
  document.getElementById("loading").style.display = "none";
});

function displayStudentData(studentName) {
  let classAverage=studentData["Class Average"];
  let classEnglish = classAverage["English"];
  let classLS = classAverage["LifeSkills"];
  let classTech = classAverage["Tech"];
  let classPS = classAverage["ProblemSolving"];
  let classOverall = classAverage["Academic Overall"];
  let classProject = classAverage["Project"]||0;
  let classPET = classAverage["PET"]||0;

  const student = studentData[studentName];

  if (student) {
    name_change(studentName, teacherNames);
    smy_change(section.slice(-1), month.slice(0, 3), year);

    // to update scores
    score_fun(english, student.English);
    score_fun(tech, student.Tech);
    score_fun(life_skills, student.LifeSkills);
    score_fun(problem_solving, student.ProblemSolving);
    score_fun(overall, student["Academic Overall"]);
    score_fun(attendance, student.Attendance);
    score_fun(behavior, student.Behavior);

    // for class average
    score_fun(class_eng, classEnglish);
    score_fun(class_els, classLS);
    score_fun(class_tech, classTech);
    score_fun(class_pb, classPS);
    score_fun(class_overall, classOverall);

    if(hasProject){
      score_fun(project, student.Project||0);
      score_fun(class_project, classProject);
    }

    if(hasPET){
      score_fun(PET, student["PET"]||0);
      score_fun(class_PET, classPET);
    }
  }
}

// change the score in page and color via function
function score_fun(subject, score) {
  score=Math.round(score)
  subject.innerText = score;
  color_change(subject,score);
}

// background color change for scores
function color_change(subject,score) {
  subject.parentElement.style.backgroundColor = scores_color(score);
  if (score < 51) {
    subject.parentElement.style.color = "white";
  } else if (score >= 51 && score < 81) {
    subject.parentElement.style.color = "black";
  } else {
    subject.parentElement.style.color = "black";
  }
}

// determine which color to change for scores
function scores_color(score) {
  if (score > constValues.yellowEndValue && score <= constValues.greenEndValue) {
    return "#7ed957";
  } else if (score > constValues.redEndValue && score <= constValues.yellowEndValue) {
    return "#ffde59";
  } else {
    return "#ff5757";
  }
}

// change student and teachers name
function name_change(student_name, teach_name) {
  let temp = student_name;

  if (student_name.length < 2) {
    student_name = prompt(
      `Please Enter a valid name for this student " ${temp} "`
    );
  }
  studentName.innerText = student_name;
  studentName1.innerText = student_name;
  teacherName.innerText = teach_name;
}

// change section,month and year
function smy_change(sec, mon, yr) {
  rpSection.innerText = sec;
  rpMonth.innerText = mon;
  rpYear.innerText = yr;
}


// // to download report-card container as jpg

downloadNow.addEventListener("click", function () {
  downloadReportCardNow();
});

function downloadReportCardNow() {
  html2canvas(card, { willReadFrequently: true }).then((canvas) => {
    canvas.toBlob(
      function (imageData) {
        const link = document.createElement("a");
        link.download = `${section.slice(-1)} - ${
          studentName1.innerText
        } - report-card.jpg`;
        link.href = URL.createObjectURL(imageData);

        link.click();

        URL.revokeObjectURL(link.href);
      },
      "image/jpeg",
      1.0
    );
  });
}

function download_all_student(student_sec) {
  return new Promise((resolve) => {
    html2canvas(card, { willReadFrequently: true }).then((canvas) => {
      canvas.toBlob(
        function (imageData) {
          const link = document.createElement("a");
          link.download = `${student_sec} - ${studentName1.innerText} - report-card.jpg`;
          link.href = URL.createObjectURL(imageData);
          link.click();
          URL.revokeObjectURL(link.href);
          resolve();
        },
        "image/png",
        1.0
      );
    });
  });
}

downloadAll.addEventListener("click", () => {
  console.log("Starting downloads...");

  studentNames
    .reduce((promise, studentName, i) => {
      return promise.then(() => {
        displayStudentData(studentName)
        return download_all_student(section.slice(-1));
      });
    }, Promise.resolve())
    .then(() => {
      console.log("All downloads complete.");
    });
});

document.getElementById("searchBox").addEventListener("input", () => {
  const query = document.getElementById("searchBox").value;
  const suggestionsBox = document.getElementById("suggestions");
  suggestionsBox.innerHTML = "";

  if (!studentNames || query.length === 0) return;

  // Filter student names based on search
  const filteredData = studentNames.filter((student) =>
    student.toLowerCase().includes(query.toLowerCase())
  );

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

previous.addEventListener("click", () => {
  index = index - 1;
  if (index >= 0) {
    displayStudentData(studentNames[index]);
  remarks.innerText="";
  document.getElementById("remarkInput").value="";

  } else {
    alert("No more Students !!!");
  }
});

next.addEventListener("click", () => {
  index = index + 1;
  if (index < studentNames.length) {
    displayStudentData(studentNames[index]);
  remarks.innerText="";
  document.getElementById("remarkInput").value="";

  } else {
    alert("No more Students !!!");
  }
});

function changeToNotProjectOrPET(subject) {
  if(subject=="Project"){
    document.getElementById("projectLabel").style.display = "none";
    project.parentElement.style.display = "none";
  class_project.parentElement.style.display = "none";

  }
  else{
    document.getElementById("petLabel").style.display = "none";
    PET.parentElement.style.display = "none";
    class_PET.parentElement.style.display = "none";
  }
  document.querySelector(".labels").style.gap = ".5rem";
  document.querySelector(".scores").style.gap = ".4rem";
  document.querySelector(".class-scores").style.gap = ".4rem";
  document.querySelector(".left-side").style.gap = ".6rem";
  document.querySelectorAll(".scores-bottom div").forEach((x) => {
    x.style.gap = ".4rem";
  });
}


window.addEventListener("keydown", function (e) {
  if (e.keyCode == 37) {
    index = index - 1;
    if (index >= 0) {
      displayStudentData(studentNames[index]);
  remarks.innerText="";
  document.getElementById("remarkInput").value="";

    } else {
      alert("No more Students !!!");
    }
  }
  if (e.keyCode == 39) {
    index = index + 1;
    if (index < studentNames.length) {
      displayStudentData(studentNames[index]);
  remarks.innerText="";
  document.getElementById("remarkInput").value="";

    } else {
      alert("No more Students !!!");
    }
  }
  if (e.keyCode == 13) {
    downloadReportCardNow();
  }
});

document.getElementById("addRemark").addEventListener("click",()=>{
  let remarkValue=document.getElementById("remarkInput").value;
  if (!remarkValue&&remarkValue=="") {
      alert("Please enter a remark");
      return;
  }
  remarks.innerText=remarkValue;
})