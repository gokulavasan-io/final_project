import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-storage.js";
import {
  getFirestore,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
  doc,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut ,onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

import firebaseConfig from "../../config.js"



// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const auth = getAuth(app);
const db = getFirestore();

document.getElementById("logout").addEventListener("click", function () {
  document.getElementById("logout-warning").style.display = "block";
});

document.getElementById("yes").addEventListener("click", function () {
  signOut(auth)
    .then(() => {
      deleteCookie("userLoggedIn"); // Assuming you have a deleteCookie function
      showLogoutMessage();

      // Redirect to index.html and disable back navigation
      setTimeout(() => {
        window.location.replace("../../index.html");
        history.pushState(null, null, "../../index.html");
        window.addEventListener("popstate", function (event) {
          history.pushState(null, null, "../../index.html");
        });
      }, 500);
    })
    .catch((error) => {
      console.log("An error happened.");
    });

  document.getElementById("logout-warning").style.display = "none";
});
function deleteCookie(name) {
  document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

document.getElementById("no").addEventListener("click", function () {
  document.getElementById("logout-warning").style.display = "none";
});

function showLogoutMessage() {
  const message = document.getElementById("logoutMessage");
  message.classList.add("show");
  setTimeout(() => {
    message.classList.remove("show");
  }, 500);
}

const membersList = document.getElementById("membersList");
const newMemberForm = document.getElementById("newMemberForm");
const editMemberForm = document.getElementById("editMemberForm");
const membersContainer = document.getElementById("members-container");

document.getElementById("showMembers").addEventListener("click", () => {
  document.getElementById("containerTitle").innerText = "Members";
  membersContainer.style.display = "block";
  document.getElementById("addMemberContainer").style.display = "none";
});

document.getElementById("addMember").addEventListener("click", () => {
  document.getElementById("containerTitle").innerText = "Add new member";
  membersContainer.style.display = "none";
  document.getElementById("addMemberContainer").style.display = "flex";
});

document.getElementById("cancelNewMember").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("containerTitle").innerText = "Members";
  membersContainer.style.display = "block";
  document.getElementById("addMemberContainer").style.display = "none";
  newMemberForm.reset();
  document.getElementById("newMemberRole").innerText = "select role";
  document.getElementById("newMemberClass").innerText = "select class";
  document.getElementById("forSelectClass").style.display = "flex";
});

document
  .getElementById("cancelEditMemberData")
  .addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("containerTitle").innerText = "Members";
    membersContainer.style.display = "block";
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
    console.log("No file provided.");
    return;
  }
  try {
    showLoading();
    const filePath = `FSSA/teachersPhotos/${emailForUploadProfile}`;
    const fileRef = storageRef(storage, filePath);

    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    console.log("File URL:", downloadURL);
    document.getElementById("userProfilePhoto").src = downloadURL;
    const userDocRef = doc(db, "FSSA/users/teachers", emailForUploadProfile);
    await setDoc(userDocRef, { profileLink: downloadURL }, { merge: true });
    console.log(`Profile link updated for ${emailForUploadProfile}`);
    fetchMembers();
  } catch (error) {
    console.error("Error uploading file or updating Firestore:", error);
  }finally{
    hideLoading();
  }
}

async function getProfilePic() {
  showLoading();
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log(user);

      const email = user.email;
      emailForUploadProfile = user.email;
      const docRef = doc(db, "FSSA/users/teachers", email);
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          console.log("Document data:", docSnap.data());
          let keys = ["name", "role", "section", "email"];

          ["userName", "userRole", "userSection", "userEmail"].forEach(
            (element, i) => {
              document.getElementById(element).innerText =
                docSnap.data()[keys[i]];
            }
          );
          if (docSnap.data()["role"] == "Management") {
            document.querySelector(".right-section").style.display = "block";
            document.getElementById("addMember").style.display = "block";
            document.querySelectorAll(".member-item button").forEach(btn=>{
              btn.style.display="block";
            })
          }

          const profileLink = docSnap.data().profileLink;
          if (profileLink) {
            document.getElementById("userProfilePhoto").src = profileLink;
          } else {
            document.getElementById("userProfilePhoto").src = profileLink;
          }

        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching document:", error);
      }finally{
        hideLoading();
      }
    } else {
      console.log("No user is currently signed in.");
    }
  });
}

getProfilePic();


function isUsernameValid(username) {
  return /^[a-zA-Z]{3,20}(?: [a-zA-Z]{1,20})*?$/.test(username);
}


function isEmailValid(email) {
  return /^(?!\.)("[\w&'*+._%-]+(?:\\[\w&'*+._%-]+)*"|\w[\w&'*+._%-]*\w)@([A-Za-z0-9.-]+\.[A-Za-z]{2,})$/.test(email);
}

function clearErrorMessages() {
  document.getElementById("newMemberNameError").innerText = "";
  document.getElementById("newMemberEmailError").innerText = "";
}

function setErrorMessage(elementId, message) {
  document.getElementById(elementId).innerText = message;
}

document.getElementById("confirmNewMember").addEventListener("click", async (e) => {
  e.preventDefault();

  const username = document.getElementById("newMemberUserName").value.trim();
  const email = document.getElementById("newMemberEmail").value.trim();
  const role = document.getElementById("newMemberRole").innerText.trim();
  let section = document.getElementById("newMemberClass").innerText.trim();

  // Clear previous error messages
  clearErrorMessages();
  let isValid = true;

  // Validate inputs
  if (!isUsernameValid(username)) {
    setErrorMessage("newMemberNameError", "Username must be 3-15 characters and only contain alphabets.");
    isValid = false;
  }

  if (!isEmailValid(email)) {
    setErrorMessage("newMemberEmailError", "Please enter a valid email address.");
    isValid = false;
  }

  if (role.includes("elect")) {
    showErrorMessage("Please select a role", 3000);
    isValid = false;
    return;
  }



  if (
    section.includes("elect") &&
    !["Head coach", "Management"].includes(role)
  ) {
    showErrorMessage("Please select a class", 3000);
    isValid = false;
    return;
  }

  

  if (!isValid) return; // Stop further execution if validation fails

  if (["Head coach", "Management"].some((r) => role.includes(r))) {
    section = "FSSA";
  }

  if (!isValid) return;
  // Show loading indicator
  document.getElementById("loadingLine").style.display = "block";
  if (!isValid) return;
  try {
    if (!isValid) return;
    const docRef = doc(db, "FSSA/users/teachers", email);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      showErrorMessage("User already exists", 3000);
    } else {
      await setDoc(docRef, {
        name: username,
        role,
        section,
        email,
        profileLink: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSjzpcE0fw9En2Z0l34Z0hzY35QhY4P6g2eqK1eGgk_up0tmsbI1YuSEAzk3SXVkLfj6gg&usqp=CAU",
      });

      fetchMembers();
      document.getElementById("addMemberContainer").style.display = "none";
      document.getElementById("containerTitle").innerText = "Members";
      setTimeout(() => {
        membersContainer.style.display = "block";
        newMemberForm.reset();
        document.getElementById("newMemberRole").innerText = "Select Role";
        document.getElementById("newMemberClass").innerText = "Select Class";
        showSuccessMessage("Member added successfully");
      }, 1000);
    }
  } catch (error) {
    showErrorMessage("An error occurred while adding the user. Please try again.", 3000);
  } finally {
    document.getElementById("loadingLine").style.display = "none";
  }
});


document
  .getElementById("forSelectRole")
  .querySelectorAll("a")
  .forEach((role) => {
    role.addEventListener("click", () => {
      document.getElementById("newMemberRole").innerText = role.innerText;
      if (
        role.innerText.includes("Head") ||
        role.innerText.includes("Manage")
      ) {
        document.getElementById("forSelectClass").style.display = "none";
      } else {
        document.getElementById("forSelectClass").style.display = "flex";
      }
    });
  });
document
  .getElementById("forSelectClass")
  .querySelectorAll("a")
  .forEach((role) => {
    role.addEventListener("click", () => {
      document.getElementById("newMemberClass").innerText = role.innerText;
    });
  });

function showSuccessMessage(message) {
  const successMessageDiv = document.getElementById("successMessage");
  if (successMessageDiv) {
    successMessageDiv.innerText = message;
    successMessageDiv.style.display = "block";
    setTimeout(() => {
      successMessageDiv.style.display = "none";
    }, 2000);
  }
}
function showErrorMessage(str, time) {
  const errorPopup = document.getElementById("error-message");
  errorPopup.innerText = str;
  errorPopup.style.display = "block";
  setTimeout(() => {
    errorPopup.style.display = "none";
  }, time);
}

async function fetchMembers() {
  membersList.innerHTML = "";
  try {
    const docRef = collection(db, "FSSA/users/teachers");
    const querySnapshot = await getDocs(docRef);

    if (!querySnapshot.empty) {
      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({ email: doc.id, ...doc.data() });
      });

      users.forEach((user) => {
        const userData = document.createElement("div");
        userData.classList.add("member-item");
        if (user.role == "Head coach" || user.role == "Management") {
          user.section = "FSSA";
        }
        userData.innerHTML = ` 
              <img src="${user.profileLink}" alt="Member Avatar" class="rounded-circle img-fluid">
              <div>
                <p class="memberName">${user.name}</p>
                <p class="memberDetail"><span class="memberRole">${user.role}</span> - <span class="memberClass">${user.section}</span></p>
              </div>
              <div class="ms-auto" class="editMemberDataBtn">
                <button class="btn btn-sm btn-outline-primary"><i class="fas fa-pencil"></i></button>
              </div>`;
        membersList.append(userData);
        userData.querySelector(".btn").addEventListener("click", () => {
          editMemberData(user.email, user.name, user.role, user.section);
        });
      });
      
    } else {
      console.log("No users found!");
    }
  } catch (error) {
    console.error("Error fetching members:", error);
  }finally{
    hideLoading();
  }
}

function editMemberData(email, userName, role, section) {
  console.log(email, userName, role, section);

  document.getElementById("deleteMember").addEventListener("click", () => {
    const deleteWarningPopup=document.getElementById("delete-warning");
    deleteWarningPopup.style.display="flex";

    document.getElementById("deleteYes").addEventListener("click",()=>{
      deleteWarningPopup.style.display="none";
      deleteDocument(email);
    })
    document.getElementById("deleteNo").addEventListener("click",()=>{
      deleteWarningPopup.style.display="none";
    })

  });

  document.getElementById("containerTitle").innerText = "Edit Member Info";
  membersContainer.style.display = "none";
  document.getElementById("addMemberContainer").style.display = "none";
  document.getElementById("editMemberDataContainer").style.display = "flex";

  const memberNameInput = document.getElementById("editUserName");
  const memberEmailInput = document.getElementById("editEmailAddress");
  const memberRoleInput = document.getElementById("editMemberRole");
  const memberSectionInput = document.getElementById("editMemberClass");

  if (role == "Head coach" || role == "Management") {
    document.getElementById("forEditClass").style.display = "none";
  }

  memberNameInput.value = userName;
  memberEmailInput.placeholder = email;
  memberRoleInput.innerText = role;
  memberSectionInput.innerText = section;

  const confirmButton = document.getElementById("confirmEditMemberData");
  confirmButton.replaceWith(confirmButton.cloneNode(true));
  document
    .getElementById("confirmEditMemberData")
    .addEventListener("click", async (e) => {
      e.preventDefault();
      document.getElementById("editUserNameError").innerText = "";

      let isValid = true;
      const updatedName = memberNameInput.value;
      const updatedRole = memberRoleInput.innerText;
      let updatedSection = memberSectionInput.innerText;

      if (!isUsernameValid(updatedName)) {
        isValid = false;
        document.getElementById("editUserNameError").innerText =
          "Username must be 3-15 characters and only contains alphabets.";
      }

      if (updatedRole === "Select Role") {
        isValid = false;
        showErrorMessage("Please select a role", 3000);
      }

      if (
        updatedSection === "Choose class" &&
        updatedRole !== "Head coach" &&
        updatedRole !== "Management"
      ) {
        isValid = false;
        showErrorMessage("Please select a class", 3000);
      }

      if (!isValid) {
        return;
      }

      if (updatedRole === "Head coach" || updatedRole === "Management") {
        updatedSection = "FSSA";
        memberSectionInput.innerText = "FSSA";
      }

      if (isValid) {
        document.getElementById("loadingLine").style.display = "block";
        try {
          const docRef = doc(db, "FSSA/users/teachers", email);

          await setDoc(
            docRef,
            {
              name: updatedName,
              role: updatedRole,
              section: updatedSection,
            },
            { merge: true }
          );

          fetchMembers();

          if (email == localStorage.getItem("userEmail")) {
            getProfilePic();
          }

          showSuccessMessage("Member data updated successfully");
          setTimeout(() => {
            document.getElementById("loadingLine").style.display = "none";
            editMemberForm.reset();
            document.getElementById("containerTitle").innerText = "Members";
            membersContainer.style.display = "block";
            document.getElementById("editMemberDataContainer").style.display =
              "none";
          }, 3000);
        } catch (error) {
          console.error("Error updating member data:", error);
          showErrorMessage("Failed to update member data.");
        }
      }
    });

  document
    .getElementById("forEditRole")
    .querySelectorAll("a")
    .forEach((roleItem) => {
      roleItem.addEventListener("click", () => {
        memberRoleInput.innerText = roleItem.innerText;

        if (
          roleItem.innerText === "Head coach" ||
          roleItem.innerText === "Management"
        ) {
          document.getElementById("forEditClass").style.display = "none";
          memberSectionInput.innerText = "FSSA"; // Pre-fill with "FSSA"
        } else {
          document.getElementById("forEditClass").style.display = "flex";
          memberSectionInput.innerText = "Choose class"; // Reset to default
        }
      });
    });

  document
    .getElementById("forEditClass")
    .querySelectorAll("a")
    .forEach((sectionItem) => {
      sectionItem.addEventListener("click", () => {
        memberSectionInput.innerText = sectionItem.innerText;
      });
    });
}

async function deleteDocument(email) {
  try {
    const documentRef = doc(db, "FSSA/users/teachers", email);
    await deleteDoc(documentRef);
    document.getElementById("loadingLine").style.display = "block";
    showSuccessMessage("Member deleted successfully");
    fetchMembers();
    setTimeout(() => {
      document.getElementById("editMemberDataContainer").style.display = "none";
      document.getElementById("containerTitle").innerText = "Members";
      document.getElementById("loadingLine").style.display = "none";
      membersContainer.style.display = "block";
      editMemberForm.reset();
    }, 3000);
    console.log(`Document with email ${email} deleted successfully.`);
  } catch (error) {
    console.error("Error deleting document:", error);
  }
}

function showLoading() {
  document.getElementById("loading").style.display = "block";
}

function hideLoading() {
  document.getElementById("loading").style.display = "none";
}

document.addEventListener("DOMContentLoaded", () => {
  fetchMembers();
});


