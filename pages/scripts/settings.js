import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-storage.js";
import {
  getDatabase,
  ref,
  set,
  get,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

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
const storage = getStorage(app);
const database = getDatabase(app);
const auth = getAuth(app);

function togglePasswordVisibility(inputId, iconId) {
  const inputField = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  if (inputField.type === "password") {
    inputField.type = "text";
    icon.innerHTML = `<img src="../../assets/images/changePassword_img/Eye alt.svg" alt="">`;
  } else {
    inputField.type = "password";
    icon.innerHTML = `<img src="../../assets/images/changePassword_img/Eye close.svg" alt="">`;
  }
}

document
  .getElementById("toggleOldPassword")
  .addEventListener("click", function () {
    togglePasswordVisibility("oldPassword", "toggleOldPassword");
  });
document
  .getElementById("toggleNewPassword")
  .addEventListener("click", function () {
    togglePasswordVisibility("newPassword", "toggleNewPassword");
  });
document
  .getElementById("toggleConfirmPassword")
  .addEventListener("click", function () {
    togglePasswordVisibility("confirmPassword", "toggleConfirmPassword");
  });

const membersContainer = document.getElementById("members-container");
const changePasswordContainer = document.getElementById(
  "change-password-container"
);

document.getElementById("showMembers").addEventListener("click", () => {
  document.getElementById("containerTitle").innerText = "Members";
  membersContainer.style.display = "block";
  changePasswordContainer.style.display = "none";
  document.getElementById("addMemberContainer").style.display = "none";
});
document.getElementById("showChangePassword").addEventListener("click", () => {
  document.getElementById("containerTitle").innerText = "Change Password";
  membersContainer.style.display = "none";
  changePasswordContainer.style.display = "flex";
  document.getElementById("addMemberContainer").style.display = "none";
});
document.getElementById("addMember").addEventListener("click", () => {
  document.getElementById("containerTitle").innerText = "Add new member";
  membersContainer.style.display = "none";
  changePasswordContainer.style.display = "none";
  document.getElementById("addMemberContainer").style.display = "flex";
});

document.getElementById("cancelNewMember").addEventListener("click", () => {
  document.getElementById("containerTitle").innerText = "Members";
  membersContainer.style.display = "block";
  changePasswordContainer.style.display = "none";
  document.getElementById("addMemberContainer").style.display = "none";
});

document.getElementById("editMemberDataBtn").addEventListener("click", () => {
  document.getElementById("containerTitle").innerText = "Edit Member Info";
  membersContainer.style.display = "none";
  changePasswordContainer.style.display = "none";
  document.getElementById("addMemberContainer").style.display = "none";
  document.getElementById("editMemberDataContainer").style.display = "flex";
});

document
  .getElementById("cancelEditMemberData")
  .addEventListener("click", () => {
    document.getElementById("containerTitle").innerText = "Members";
    membersContainer.style.display = "block";
    changePasswordContainer.style.display = "none";
    document.getElementById("addMemberContainer").style.display = "none";
    document.getElementById("editMemberDataContainer").style.display = "none";
  });

document.getElementById("changeProfileButton").addEventListener("click", () => {
  document.getElementById("profilePhotoInput").click();
});

document.getElementById("profilePhotoInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  uploadFile(file);
});

let emailForUploadProfile;
async function uploadFile(file) {
  if (!file) {
    console.log("no file");
    return;
  }
  try {
    const filePath = `FSSA/teachersPhotos/${emailForUploadProfile}`;
    const fileRef = storageRef(storage, filePath);
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    console.log("File URL:", downloadURL);
    document.getElementById("userProfilePhoto").src = downloadURL;
    const data = { profileLink: downloadURL };
    const userDataPath = `FSSA/TeachersData/${emailForUploadProfile}`;

    try {
      await set(ref(database, userDataPath), data);
      console.log(`Document written for ${emailForUploadProfile}`);
      location.reload();
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  } catch (error) {
    console.error("Error uploading file:", error);
  }
}

async function getProfilePic() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const email = user.email;
      const sanitizedEmail = email.replace(/[@.]/g, "_");
      emailForUploadProfile = sanitizedEmail;
      const userDataPath = `FSSA/TeachersData/${sanitizedEmail}`;
      const profileLinkRef = ref(database, userDataPath);
      get(profileLinkRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            const profileLink = snapshot.val();
            console.log(profileLink);
            document.getElementById("userProfilePhoto").src =
              profileLink.profileLink;
            document.getElementById("userProfilePic").src =
              profileLink.profileLink;
          } else {
            console.log("No data available at this path.");
          }
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
        });
    } else {
      console.log("No user is currently signed in.");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  getProfilePic();
});


function isUsernameValid(username) {
  const usernameRegex = /^[a-zA-Z0-9_]{3,15}$/; 
  return usernameRegex.test(username);
}

function isEmailValid(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Submit button event listener
document.getElementById("confirmNewMember").addEventListener("click", (e) => {
  e.preventDefault(); 

  const username = document.getElementById("newMemberUserName").value.trim();
  const email = document.getElementById("newMemberEmail").value.trim();
  const password = document.getElementById("newMemberPassword").placeholder;

  // Clear previous error messages
  document.getElementById("newMemberNameError").innerText = "";
  document.getElementById("newMemberEmailError").innerText = "";

  let isValid = true; 

  if (!isUsernameValid(username)) {
    isValid = false;
    document.getElementById("newMemberNameError").innerText =
      "Username must be 3-15 characters, alphanumeric, and can include underscores.";
  }

  if (!isEmailValid(email)) {
    isValid = false;
    document.getElementById("newMemberEmailError").innerText =
      "Please enter a valid email address.";
  }

  if (isValid) {
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        alert("User registered successfully!");
        console.log("Registered user:", userCredential.user);
      })
      .catch((error) => {
        alert("Error: " + error.message);
        console.error("Registration error:", error);
      });
  }
});
