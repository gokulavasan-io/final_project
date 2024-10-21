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





document.getElementById("login").addEventListener("submit", function() {
    event.preventDefault();
    var email =  document.getElementById("email").value;
    var password = document.getElementById("password").value;
    
    signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed in 
      const user = userCredential.user;
      console.log(user);
    //   alert(user.email+" Login successfully!!!");
      window.location.href = "../html/main_page.html"
    
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log(errorMessage);
      alert(errorMessage);
    });		  		  
});