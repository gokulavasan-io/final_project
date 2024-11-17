const studentName = document.getElementById("student-name");
const studentName1 = document.getElementById("student-name1");
const teacherName = document.getElementById("teachers-name");
const Rpsection = document.getElementById("rpsection");
const RPmonth = document.getElementById("rpmonth");
const RPyear = document.getElementById("rpyear");
const english = document.getElementById("rpenglish");
const life_skills = document.getElementById("rplifeSkills");
const tech = document.getElementById("rptech");
const problem_solving = document.getElementById("rpproblemSolving");
const project = document.getElementById("rpExtra");
const attendance = document.getElementById("rpattendance");
const behavior = document.getElementById("rpbehavior");
const overall = document.getElementById("rpoverall");
const class_eng = document.getElementById("classEng");
const class_els = document.getElementById("classLS");
const class_tech = document.getElementById("classTech");
const class_pb = document.getElementById("classPS");
const class_project = document.getElementById("classExtra");
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
import {
  getFirestore,
  getDocs,
  collection,
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

let studentData;
let studentNames;
let month = localStorage.getItem("month");
let section = localStorage.getItem("section");
let index = 0;
let year = new Date().getFullYear();
let hasProject=false;
let teacherNames =
  section == "ClassA"
    ? "Miss Sreekala && Miss Haripriya"
    : section == "ClassB"
    ? "Mr Bharatwaj && Miss Sukirthi"
    : "Mr Kanagalingam && Miss Niroshini";

async function fetchStudentNames(section) {
  try {
    const docRef = collection(firestore, `FSSA/studentsBaseData/${section}`);
    const docSnap = await getDocs(docRef);

    if (!docSnap.empty) {
      const studentNamesFromDB = docSnap.docs.map((doc) => doc.id);
      if (Array.isArray(studentNamesFromDB) && studentNamesFromDB.length > 0) {
        studentNames = [...studentNamesFromDB];
      } else {
        console.error("No student names found for the selected class.");
        alert("No student names found for the selected class.");
        return [];
      }
    } else {
      console.log("No such document!");
      alert("No such document for the selected class.");
      return [];
    }
  } catch (error) {
    console.error("Error fetching document:", error);
    alert("Error fetching student names.");
    return [];
  }
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

document.addEventListener("DOMContentLoaded", async () => {
  await fetchStudentNames(section);
  studentData = await fetchStudentMarks(month);
  if ("Project" in studentData.classAverage) {
    hasProject=true;
  }
  if(!hasProject){
   changeToNotProject();
  }
  displayStudentData(studentNames[index]);
  document.getElementById("loading").style.display = "none";
});

function displayStudentData(studentName) {
  let classEnglish = studentData.classAverage.English;
  let classLS = studentData.classAverage.LifeSkills;
  let classTech = studentData.classAverage.Tech;
  let classPS = studentData.classAverage.ProblemSolving;
  let classOverall = studentData.classAverage.AcademicOverall;
  let classProject = studentData.classAverage.Project;

  const student = studentData[studentName];

  if (student) {
    name_change(studentName, teacherNames);
    smy_change(section.slice(-1), month.slice(0, 3), year);
    changeRemark(student.Remark);

    // to update scores
    score_fun(english, student.English);
    score_fun(tech, student.Tech);
    score_fun(life_skills, student.LifeSkills);
    score_fun(problem_solving, student.ProblemSolving);
    score_fun(overall, student.AcademicOverall);
    score_fun(attendance, student.Attendance);
    score_fun(behavior, student.Behavior);

    // for class average
    score_fun(class_eng, classEnglish);
    score_fun(class_els, classLS);
    score_fun(class_tech, classTech);
    score_fun(class_pb, classPS);
    score_fun(class_overall, classOverall);

    // for project 
    if (hasProject) {
      score_fun(project, student.Project);
      score_fun(class_project, classProject);
    }
  }
}

// change the score in page and color via function
function score_fun(sub, score) {
  sub.innerText = Math.round(score);
  color_change(sub);
}

// background color change for scores
function color_change(sub) {
  sub.parentElement.style.backgroundColor = scores_color(Number(sub.innerText));
  if(Number(sub.innerText)<51){
    sub.parentElement.style.color="white";
  }
  else if(Number(sub.innerText)>=51 && Number(sub.innerText)<81){
    sub.parentElement.style.color="black";
  }
  else{
    sub.parentElement.style.color="black";

  }
}

// determine which color to change for scores
function scores_color(score) {
  if (score > 80 && score <= 100) {
    return "#7ed957";
  } else if (score > 50 && score <= 80) {
    return "#ffde59";
  } else {
    return "#ff5757";
  }
}

// change student and teachers name
function name_change(student_name, teach_name) {
  let temp=student_name;
  // if(student_name.length>15){
  //     student_name = prompt(`Please enter a smaller name for this student " ${student_name} " `);
  // }
  if(student_name.length<3){
      student_name=prompt(`Please Enter a valid name for this student " ${temp} "`)
  }
  studentName.innerText = student_name;
  studentName1.innerText = student_name;
  teacherName.innerText = teach_name;
}

// change section,month and year
function smy_change(sec, mon, yr) {
  Rpsection.innerText = sec;
  RPmonth.innerText = mon;
  RPyear.innerText = yr;
}

function changeRemark(remark) {
  if(remark.length>35){
    remark=prompt(`Please enter a shorter remark for this student : ${remark}`);
  }
  // if(remark==""){
  //   remark="";
  // }
  remarks.innerText = remark;
}

// // to download report-card container as jpg

downloadNow.addEventListener("click", function () {
    downloadReportCardNow();
});


function downloadReportCardNow() {
  html2canvas(card, { willReadFrequently: true }).then((canvas) => {
    canvas.toBlob(function (imageData) {
      const link = document.createElement("a");
      link.download = `${section.slice(-1)} - ${
        studentName1.innerText
      } - report-card.jpg`;
      link.href = URL.createObjectURL(imageData);

      link.click();

      URL.revokeObjectURL(link.href);
    }, "image/jpeg",1.0);
  });
}


function download_all_student( student_sec) {
  return new Promise((resolve) => {
    html2canvas(card, { willReadFrequently: true }).then((canvas) => {
      canvas.toBlob(function (imageData) {
        const link = document.createElement("a");
        link.download = `${student_sec} - ${studentName1.innerText} - report-card.jpg`;
        link.href = URL.createObjectURL(imageData);
        link.click();
        URL.revokeObjectURL(link.href);
        resolve();  
      }, "image/png",1.0);
    });
  });
}

downloadAll.addEventListener("click", () => {
  console.log("Starting downloads...");

  studentNames.reduce((promise, studentName, i) => {
    return promise.then(() => {
      let classEnglish = studentData.classAverage.English;
      let classLS = studentData.classAverage.LifeSkills;
      let classTech = studentData.classAverage.Tech;
      let classPS = studentData.classAverage.ProblemSolving;
      let classOverall = studentData.classAverage.AcademicOverall;
      let classProject = studentData.classAverage.Project;

      const student = studentData[studentName];

      if (student) {
        name_change(studentName, teacherNames);
        smy_change(section.slice(-1), month.slice(0, 3), year);

        // Update scores
        score_fun(english, student.English);
        score_fun(tech, student.Tech);
        score_fun(life_skills, student.LifeSkills);
        score_fun(problem_solving, student.ProblemSolving);
        score_fun(overall, student.AcademicOverall);
        score_fun(attendance, student.Attendance);
        score_fun(behavior, student.Behavior);
        score_fun(project, student.Project);

        // For class average
        score_fun(class_eng, classEnglish);
        score_fun(class_els, classLS);
        score_fun(class_tech, classTech);
        score_fun(class_pb, classPS);
        score_fun(class_overall, classOverall);
        score_fun(class_project, classProject);
      }

      return download_all_student( section.slice(-1));
    });
  }, Promise.resolve()).then(() => {
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


previous.addEventListener("click",()=>{
    index=index-1;
    if(index>=0){
      displayStudentData(studentNames[index]);
    }
    else{
      alert("No more Students !!!")
    }
})

next.addEventListener("click",()=>{
    index=index+1;
    if(index<studentNames.length){
      displayStudentData(studentNames[index]);
    }
    else{
      alert("No more Students !!!")
    }
});


function changeToNotProject() {
  document.getElementById("extraLabel").style.display="none";
  project.parentElement.style.display="none";
  class_project.parentElement.style.display="none";
  document.querySelector(".labels").style.gap=".5rem";
  document.querySelector(".scores").style.gap=".4rem";
  document.querySelector(".class-scores").style.gap=".4rem";
  document.querySelector(".left-side").style.gap=".6rem";
  document.querySelectorAll(".scores-bottom div").forEach(x=>{
    x.style.gap=".4rem";
  })

}


window.addEventListener('keydown', function (e) {
  if (e.keyCode == 37) {
    index=index-1;
    if(index>=0){
      displayStudentData(studentNames[index]);
    }
    else{
      alert("No more Students !!!")
    }
      
  }
  if (e.keyCode == 39) {
    index=index+1;
    if(index<studentNames.length){
      displayStudentData(studentNames[index]);
    }
    else{
      alert("No more Students !!!")
    }
      
  }
  if(e.keyCode==13){
    downloadReportCardNow();
  }

});

const extraLabel=document.getElementById("extraLabel");
const extraLabelPopup=document.getElementById("forExtraLabel");
extraLabel.addEventListener("click",()=>{
      extraLabelPopup.style.display="flex";

      document.getElementById("cancel").addEventListener("click",() => {
        extraLabelPopup.style.display = "none";
      });


      document.getElementById("confirm").addEventListener("click",() => {
        const extraLabelInput=document.getElementById("extraLabelInput").value;
        if(extraLabelInput=="") {
          extraLabelPopup.style.display = "none";
          return;
        }
        extraLabel.innerText=extraLabelInput;
        extraLabelPopup.style.display = "none";
      })
  
})