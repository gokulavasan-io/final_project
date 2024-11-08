// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.14.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
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

const role = localStorage.getItem("role");
let section = localStorage.getItem("section");

document.addEventListener("DOMContentLoaded", function () {
  if (role == "others") {
    document.getElementById("changeClass").style.display = "flex";
  }
});

document.getElementById("changeClass").addEventListener("click", function () {
  document.getElementById("showClassesForLead").style.display = "flex";
});

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

/// main container graphs manipulating according to class & role
let months = [];


if (role == "others") {
  changeToClass(section);
} else {
  changeToManagementSide();
}

function changeToManagementSide() {
  console.log("hi");
}

async function changeToClass(section) {
  await fetchMonths(section);
  await prepareTable(section);
}

async function fetchMonths(section) {

  const monthRef = ref(database, `/studentMarks/${section}/months`);
  const monthSnapshot = await get(monthRef);

  if (monthSnapshot.exists()) {
    months = [];
    months = Object.keys(monthSnapshot.val());
    console.log(months);
  } else {
    console.log(`No months available for ${section}.`);
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


async function getSubjectTopBottom(data,subject) {
  const { top5, bottom5 } = getTopBottomScores(data, subject);
  let topRows=[],bottomRows=[];
    top5.forEach((student, i) => {
      topRows[i] = student.split("-")[0];
    });
    bottom5.forEach((student, i) => {
      bottomRows[i]= student.split("-")[0];
    });

    return {topRows,bottomRows}
}


async function prepareTable() {
  const data = await fetchStudentMarks(months[months.length-1]);
  const subjects =["Tech","ProblemSolving"];

  let TechRows=await getSubjectTopBottom(data,subjects[0]) ;
  let psRows=await getSubjectTopBottom(data,subjects[1]) ;

  TechRows.topRows.forEach((mark,i)=>{
      document.getElementById(`techT${i+1}`).innerText=mark;
  })
  TechRows.bottomRows.reverse().forEach((mark,i)=>{
      document.getElementById(`techB${i+1}`).innerText=mark;
  })
  psRows.topRows.forEach((mark,i)=>{
      document.getElementById(`psT${i+1}`).innerText=mark;
  })
  psRows.bottomRows.reverse().forEach((mark,i)=>{
      document.getElementById(`psB${i+1}`).innerText=mark;
  })
  
  
}