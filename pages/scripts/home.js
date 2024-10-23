// hamburger menu
const hamBurger = document.querySelector(".toggle-btn");

hamBurger.addEventListener("click", function () {
  document.querySelector("#sidebar").classList.toggle("expand");
});




 // Import the functions you need from the SDKs you need
 import { initializeApp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js";
 import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-analytics.js";
 import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js";
 
 
 const firebaseConfig = {
apiKey: "AIzaSyDROuHKj-0FhMQbQtPVeEGVb4h89oME5T0",
authDomain: "fir-demo-4a5b4.firebaseapp.com",
projectId: "fir-demo-4a5b4",
storageBucket: "fir-demo-4a5b4.appspot.com",
messagingSenderId: "716679557063",
appId: "1:716679557063:web:603a78f59045ceeaf133e2"
};

 // Initialize Firebase
 const app = initializeApp(firebaseConfig);
 const analytics = getAnalytics(app);
 const auth = getAuth();


 document.getElementById("logout").addEventListener("click", function() {
  document.getElementById("logout-warning").style.display = "block";
});

document.getElementById("yes").addEventListener("click", function() {
  signOut(auth).then(() => {
    console.log('Sign-out successful.');

    showLogoutMessage();

    setTimeout(() => {
        window.location.href = "../../index.html";
    }, 100);


  }).catch((error) => {
    console.log('An error happened.');
  });

  document.getElementById("logout-warning").style.display = "none";
});

document.getElementById("no").addEventListener("click", function() {
  document.getElementById("logout-warning").style.display = "none";
});


const user = document.getElementById("user");
const userInfo = document.querySelector(".user-info");

user.addEventListener("click", (e) => {
    e.preventDefault();
    if (userInfo.style.display === "none" || userInfo.style.display === "") {
        userInfo.style.display = "flex";
    } else {
        userInfo.style.display = "none";
    }
});

function showLogoutMessage() {
  const message = document.getElementById("logoutMessage");
  message.classList.add("show");
  setTimeout(() => {
      message.classList.remove("show");
  }, 500); 
}




function getQueryParameter(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

const section = getQueryParameter('section'); 
const allAs=document.querySelectorAll(".sidebar-item a");
const allSubjects=document.querySelectorAll(".subjects-container a")

for(let i=1;i<allAs.length;i++){
  allAs[i].href+=`&section=${section}`
}
for(let i=0;i<allSubjects.length;i++){
  allSubjects[i].href+=`&section=${section}`
}

allAs[0].href+=`?section=${section}`