import { initializeApp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut ,onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-firestore.js";
import firebaseConfig from "../../config.js"



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
         localStorage.setItem("userEmail",userData.email);
        window.location.href = "../../pages/html/home.html";
      } else {
          hideLoading();
          showErrorMessage("You are not approved to access this site.",5000);
          await signOut(auth);
      }
    } else {
      hideLoading();
      updateNetworkStatus();
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
        localStorage.setItem("userEmail",userData.email);
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


const loading = document.getElementById("loading");
const noNetworkDiv = document.createElement("div");
noNetworkDiv.innerHTML = ` <div id="noNetworkMsg">
            <img src="../../assets/images/monthlySubjects_img/img_no_network.png" alt="">
            <div><p >No Network</p>
            <p>Please check your Internet Connection</p>
            </div>
        </div>`;

function updateNetworkStatus() {
  if (navigator.onLine) {
    if (document.getElementById("noNetworkMsg")) {
      document.getElementById("noNetworkMsg").style.display = "none";
      loading.style.display = "none";
    }
    document.getElementById("progressMessage").style.display = "flex";
  } else {
    loading.style.display = "flex";
    document.getElementById("progressMessage").style.display = "none";
    if (!document.getElementById("noNetworkMsg")) {
      loading.appendChild(noNetworkDiv);
    } else {
      document.getElementById("noNetworkMsg").style.display = "flex";
    }
  }
}

window.addEventListener("online", updateNetworkStatus);
window.addEventListener("offline", updateNetworkStatus);
updateNetworkStatus();

function hideLoading() {
  loading.style.display="none";
}