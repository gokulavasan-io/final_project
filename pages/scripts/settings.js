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
  getDoc,deleteDoc,
  collection,
  getDocs,
  doc,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
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
const auth = getAuth(app);
const db = getFirestore();




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

document.getElementById("cancelNewMember").addEventListener("click", () => {
  document.getElementById("containerTitle").innerText = "Members";
  membersContainer.style.display = "block";
  document.getElementById("addMemberContainer").style.display = "none";
  newMemberForm.reset();
  document.getElementById("newMemberRole").innerText = "select role";
  document.getElementById("newMemberClass").innerText = "select class";
});

document
  .getElementById("cancelEditMemberData")
  .addEventListener("click", () => {
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
  }
}

async function getProfilePic() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const email = user.email;
      emailForUploadProfile=user.email;
      const docRef = doc(db, "FSSA/users/teachers", email);
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          console.log("Document data:", docSnap.data());
          let keys=['name',"role","section","email"];
          
          ["userName","userRole","userSection","userEmail"].forEach((element,i)=>{
            document.getElementById(element).innerText=docSnap.data()[keys[i]];
        })
        if(docSnap.data()["role"]=="Management"){
          document.querySelector(".right-section").style.display="block";
        }
        if(docSnap.data()["role"]=="Management"){
          document.getElementById("showMembers").style.display="none";
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
      }
    } else {
      console.log("No user is currently signed in.");
    }
  });
}

getProfilePic();


function isUsernameValid(username) {
  const usernameRegex = /^[a-zA-Z]{3,15}$/;
  return usernameRegex.test(username);
}

function isEmailValid(email) {
  const emailRegex = /^[^\s@]+@[a-zA-Z]+\.[a-zA-Z]+$/;
  return emailRegex.test(email);
}

document.getElementById("confirmNewMember").addEventListener("click", async (e) => {
  e.preventDefault();

  const username = document.getElementById("newMemberUserName").value.trim();
  const email = document.getElementById("newMemberEmail").value.trim();
  const role = document.getElementById("newMemberRole").innerText.trim();
  const section = document.getElementById("newMemberClass").innerText.trim();

  // Clear previous error messages
  document.getElementById("newMemberNameError").innerText = "";
  document.getElementById("newMemberEmailError").innerText = "";

  let isValid = true;

  // Username validation
  if (!isUsernameValid(username)) {
    isValid = false;
    document.getElementById("newMemberNameError").innerText =
      "Username must be 3-15 characters and only contains alphabets.";
  }

  // Email validation
  if (!isEmailValid(email)) {
    isValid = false;
    document.getElementById("newMemberEmailError").innerText =
      "Please enter a valid email address.";
  }

  // Role validation
  if (role === "Select Role") {
    isValid = false;
    showErrorMessage("Please select a role", 3000);
  }

  // Class validation (only required if role is not 'admin')
  if (section === "Select Class" && role !== "Head coach"&& role!=="Management") {
    isValid = false;
    showErrorMessage("Please select a class", 3000);
  }

  if (!isValid) {
    return; // Stop further execution if validation fails
  }

  if (role.includes("Head")||role.includes("Manage")){
      section="FSSA"
  }
  // Proceed if all validations pass
  document.getElementById("loading").style.display = "block";
  try {
    const docRef = doc(db, "FSSA/users/teachers", email);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      showErrorMessage("User already exists", 3000);
    } else {
      await setDoc(docRef, {
        name: username,
        role: role,
        section: section,
        email: email,
        profileLink:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSjzpcE0fw9En2Z0l34Z0hzY35QhY4P6g2eqK1eGgk_up0tmsbI1YuSEAzk3SXVkLfj6gg&usqp=CAU",
      });

      fetchMembers();
      setTimeout(() => {
        document.getElementById("loading").style.display = "none";
        showSuccessMessage("Member added successfully");
        newMemberForm.reset();
        document.getElementById("containerTitle").innerText = "Members";
        membersContainer.style.display = "block";
        document.getElementById("addMemberContainer").style.display = "none";
        document.getElementById("newMemberRole").innerText = "Select Role";
        document.getElementById("newMemberClass").innerText = "Select Class";
      }, 3000);
    }
  } catch (error) {
    showErrorMessage(
      "An error occurred while adding the user. Please try again.",
      3000
    );
  } finally {
    document.getElementById("loading").style.display = "none";
  }
});

document
  .getElementById("forSelectRole")
  .querySelectorAll("a")
  .forEach((role) => {
    role.addEventListener("click", () => {
      document.getElementById("newMemberRole").innerText = role.innerText;
      if (role.innerText.includes("Head")||role.innerText.includes("Manage")) {
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
  membersList.innerHTML="";
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
        if(user.role=="Head coach" ||user.role== "Management"){
          user.section="FSSA"
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
  }
}

fetchMembers();
function editMemberData(email, userName, role, section) {
  console.log(email, userName, role, section);

  document.getElementById("deleteMember").addEventListener("click",()=>{
    deleteDocument(email);
  })

  document.getElementById("containerTitle").innerText = "Edit Member Info";
  membersContainer.style.display = "none";
  document.getElementById("addMemberContainer").style.display = "none";
  document.getElementById("editMemberDataContainer").style.display = "flex";

  const memberNameInput = document.getElementById("editUserName");
  const memberEmailInput = document.getElementById("editEmailAddress");
  const memberRoleInput = document.getElementById("editMemberRole");
  const memberSectionInput = document.getElementById("editMemberClass");

  if(role=="Head coach"|| role=="Management"){
    document.getElementById("forEditClass").style.display="none";
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
      const updatedSection = memberSectionInput.innerText;

      if (!isUsernameValid(updatedName)) {
        isValid = false;
        document.getElementById("editUserNameError").innerText =
          "Username must be 3-15 characters and only contains alphabets.";
      }

      if (updatedRole === "Select Role") {
        isValid = false;
        showErrorMessage("Please select a role", 3000);
      }
    
      // Class validation (only required if role is not 'admin')
      if (section === "Choose class" && updatedRole !== "Head coach"&& updatedRole!=="Management") {
        isValid = false;
        showErrorMessage("Please select a class", 3000);
      }
    
      if (!isValid) {
        return; // Stop further execution if validation fails
      }
    
      if (updatedRole.includes("Head")||updatedRole.includes("Manage")){
          section="FSSA"
      }

      if (isValid) {
        document.getElementById("loading").style.display = "block";
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


          if(email==localStorage.getItem("userEmail")){
            getProfilePic();
          }

          showSuccessMessage("Member data updated successfully");
          setTimeout(() => {
            document.getElementById("loading").style.display = "none";
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
        if (roleItem.innerText.includes("Head")||roleItem.innerText.includes("Manage")) {
          document.getElementById("forEditClass").style.display = "none";
        } else {
          document.getElementById("forEditClass").style.display = "flex";
          document.getElementById("editMemberClass").innerText="Choose class";
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

    // Delete the document
    await deleteDoc(documentRef);
    alert("deleted successfully")
    console.log(`Document with email ${email} deleted successfully.`);
  } catch (error) {
    console.error("Error deleting document:", error);
  }
}


