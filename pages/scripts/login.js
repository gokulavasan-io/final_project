import { initializeApp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut ,onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyDROuHKj-0FhMQbQtPVeEGVb4h89oME5T0",
  authDomain: "fir-demo-4a5b4.firebaseapp.com",
  projectId: "fir-demo-4a5b4",
  storageBucket: "fir-demo-4a5b4",
  messagingSenderId: "716679557063",
  appId: "1:716679557063:web:603a78f59045ceeaf133e2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();
const provider = new GoogleAuthProvider();

window.onload = function () {
  onAuthStateChanged(auth,async (user) => {
    if (user) {const docRef = doc(db, "FSSA/users/teachers", user.email);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        let userData=docSnap.data();
        localStorage.setItem("userName",userData.name);
         localStorage.setItem("userRole",userData.role);
         localStorage.setItem("userEmail",userData.email);
        if(userData.section!="ClassA"||userData.section!="ClassB"||userData.section!="ClassC"){
          localStorage.setItem("section","ClassA")
        }
        else{
          localStorage.setItem("section",userData.section)
        }

          window.location.href = "../../pages/html/home.html";
      } else {
          showErrorMessage("You are not approved to access this site.",5000);
          await signOut(auth);
      }
    } else {
      console.log("User is not logged in.");
      window.history.pushState(null, null, window.location.href);
      window.addEventListener("popstate", function () {
      window.history.pushState(null, null, window.location.href);
      });
    }
  });
};

// Handle login form submission
document.getElementById("login").addEventListener("click",async function (event) {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    const docRef = doc(db, "FSSA/users/teachers", user.email);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        let userData=docSnap.data();
        localStorage.setItem("userName",userData.name);
         localStorage.setItem("userRole",userData.role);
         localStorage.setItem("userEmail",userData.email);
        if(userData.section!="ClassA"||userData.section!="ClassB"||userData.section!="ClassC"){
          localStorage.setItem("section","ClassA")
        }
        else{
          localStorage.setItem("section",userData.section)
        }

        showSuccessMessage();
        setTimeout(() => {
          window.location.href = "../../pages/html/home.html";
        }, 2000);
      } else {
        showErrorMessage("You are not approved to access this site.",5000);
        await signOut(auth);
      }
    } catch (error) {
      console.error("Error during sign-in:", error);
      alert("Error signing in. Please try again.");
    }
    
    
    
  });
  
  // Function to display success message
  function showSuccessMessage() {
    const message = document.getElementById("successMessage");
    message.classList.add("show");
    setTimeout(() => {
      message.classList.remove("show");
  }, 3000);
}

// Function to display error message
function showErrorMessage(str,time) {
  const errorPopup = document.getElementById("error-message");
  errorPopup.innerText=str;
  errorPopup.style.display = "block";
  setTimeout(() => {
    errorPopup.style.display = "none";
  }, time);
}

