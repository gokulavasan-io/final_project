// const studentName = document.getElementById("student-name");
// const studentName1 = document.getElementById("student-name1");
// const teacherName = document.getElementById("teachers-name");
// const section = document.getElementById("section");
// const month = document.getElementById("month");
// const year = document.getElementById("year");
// const english = document.getElementById("english");
// const life_skills = document.getElementById("life-skills");
// const tech = document.getElementById("tech");
// const problem_solving = document.getElementById("problem-solving");
// const overall = document.getElementById("overall");
// const class_eng = document.getElementById("class-eng");
// const class_els = document.getElementById("class-els");
// const class_tech = document.getElementById("class-tech");
// const class_pb = document.getElementById("class-pb");
// const class_overall = document.getElementById("class-overall");
// const attendance = document.getElementById("attendance");
// const behavior = document.getElementById("behavior");
// const previous_name = document.getElementById("prev-name");
// const current_name = document.getElementById("current-name");
// const next_name = document.getElementById("next-name");
// const previous_person = document.getElementById("previous-person");
// const download = document.getElementById("download");
// const download_all = document.getElementById("download-all");
// const next_person = document.getElementById("next-person");
// const card = document.getElementById("report-card");
// const submit = document.getElementById("get_result");
// const remarks=document.getElementById("remark");

// // .................... variables end ............ //

// let studentData;
// let currentIndex = 0;  // Initialize currentIndex - for student

// // document.querySelector("#input-field").addEventListener("submit", (event) => {
// //   event.preventDefault(); // Prevent form submission

// //   try {
// //     // Parse JSON data directly from the textarea
// //     studentData = JSON.parse(document.getElementById("json").value);
// //     displayStudentData(currentIndex); // Display the data
// //   } catch (error) {
// //     console.error("Invalid JSON:", error);
// //     alert("Please enter valid JSON data.");
// //   }
// // });


// //  to display the current student's information

// function displayStudentData(index) {
//   const student = studentData[index];
//   if (student) {
//     name_change(capitalizeFirstLetter(student.name), student.teachers_name); // change student,teacher name
//     smy_change(student.section.toUpperCase(), student.month, student.year); // change section,month,year
//     changeRemark(student.remarks);

//     // to update scores
//     score_fun(english, student.english);
//     score_fun(tech, student.tech);
//     score_fun(life_skills, student.lifeskills);
//     score_fun(problem_solving, student.problem_solving);
//     score_fun(overall, student.overall);
//     score_fun(attendance, student.attendance);
//     score_fun(behavior, student.behavior);


//     // for class average
//     score_fun(class_eng,student.class_english);
//     score_fun(class_els,student.class_lifeskills);
//     score_fun(class_tech,student.class_tech);
//     score_fun(class_pb,student.class_problem_solving);
//     score_fun(class_overall,student.class_overall);    

//     // // to change previous and next name in bottom 
//     let prevIndex = index > 0 ? index - 1 : studentData.length - 1;
//     let nextIndex = index < studentData.length - 1 ? index + 1 : 0;
//     prev_next_name(capitalizeFirstLetter(studentData[prevIndex].name), capitalizeFirstLetter(studentData[nextIndex].name));
//   }
// }

// // change the score in page and color via function
// function score_fun(sub, score) {
//   sub.innerText = score;
//   color_change(sub);
// }

// // background color change for scores
// function color_change(sub) {
//   sub.parentElement.style.backgroundColor = scores_color(Number(sub.innerText));
// }

// // determine which color to change for scores
// function scores_color(score) {
//   if (score > 80 && score <= 100) {
//     return "#7ed957";
//   } else if (score > 50 && score <= 80) {
//     return "#ffde59";
//   } else {
//     return "#ff5757";
//   }
// }

// // change student and teachers name
// function name_change(student_name, teach_name) {
//   studentName.innerText = student_name.toUpperCase();
//   studentName1.innerText = student_name;
//   current_name.innerText = student_name;
//   teacherName.innerText = teach_name.toUpperCase();
// }

// // change section,month and year
// function smy_change(sec, mon, yr) {
//   section.innerText = sec;
//   month.innerText = mon;
//   year.innerText = yr;
// }

// function changeRemark(remark){
//   remarks.innerText=remark;
// }

// // change previous and next student name for navigation
// function prev_next_name(prev_name, nxt_name) {
//   previous_name.innerText = prev_name;
//   next_name.innerText = nxt_name;
// }

// // Event listener for the "Next" button
// next_person.addEventListener("click", () => {
//   if (currentIndex >= studentData.length - 1) {
//     alert("No more students available");
//   } else {
//     currentIndex++;
//     displayStudentData(currentIndex);
//   }
// });

// // Event listener for the "Previous" button
// previous_person.addEventListener("click", () => {
//   if (currentIndex <= 0) {
//     alert("No more students available");
//   } else {
//     currentIndex--;
//     displayStudentData(currentIndex);
//   }
// });


// // to capitalize the first letter of a name
// function capitalizeFirstLetter(str) {
//   return str[0].toUpperCase() + str.slice(1);
// }

// // to download report-card container as jpg

// document.getElementById("download").addEventListener("click", function () {
//   html2canvas(card, { willReadFrequently: true }).then((canvas) => {
//     canvas.toBlob(function (imageData) {
//       const link = document.createElement("a");
//       link.download = `${section.innerText.toUpperCase()} - ${studentName1.innerText} - report-card.jpg`;
//       link.href = URL.createObjectURL(imageData);

//       link.click();

//       URL.revokeObjectURL(link.href);
//     }, "image/jpeg");
//   });
// });




// // to download all students report card at once

// function download_all_student(student_name_download, student_sec) {
//   html2canvas(card, { willReadFrequently: true }).then((canvas) => {
//     canvas.toBlob(function (imageData) {
//       const link = document.createElement("a");
//       link.download = `${student_sec} - ${student_name_download} - report-card.jpg`;
//       link.href = URL.createObjectURL(imageData);
//       link.click();
//       URL.revokeObjectURL(link.href);
//     }, "image/jpeg");
//   });
// }

// download_all.addEventListener("click", () => {
//   for (let i = 0; i < studentData.length; i++) {
//     const student = studentData[i];
//     name_change(capitalizeFirstLetter(student.name), student.teachers_name);
//     smy_change(student.section, student.month, student.year);
//     changeRemark(student.remarks);
    
//     // to update scores
//     score_fun(english, student.english);
//     score_fun(tech, student.tech);
//     score_fun(life_skills, student.lifeskills);
//     score_fun(problem_solving, student.problem_solving);
//     score_fun(overall, student.overall);
//     score_fun(attendance, student.attendance);
//     score_fun(behavior, student.behavior);

//     // for class average
//     score_fun(class_eng,student.class_english);
//     score_fun(class_els,student.class_lifeskills);
//     score_fun(class_tech,student.class_tech);
//     score_fun(class_pb,student.class_problem_solving);
//     score_fun(class_overall,student.class_overall);


//     download_all_student(capitalizeFirstLetter(student.name), student.section.toUpperCase());
//   }
// });

