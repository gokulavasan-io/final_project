const container = document.getElementById("handsontable");
const data = [
  ["", ""], // Initial data
];

// Initialize Handsontable
const hot = new Handsontable(container, {
  data: data,
  colHeaders: ["Student Name", "Marks"],
  columns: [
    { data: 0, type: "text" },
    { data: 1, type: "numeric" },
  ],
  rowHeaders: true,
  colWidths: [200, 100],
  licenseKey: "non-commercial-and-evaluation",
});

// Function to add a new row
document.getElementById("addRow").addEventListener("click", function () {
  hot.alter("insert_row"); // Inserts a new empty row at the end
});

document.getElementById("deleteLastRow").addEventListener("click", function () {
  const rowCount = hot.countRows(); // Get the total number of rows
  if (rowCount > 0) {
    // Check if there is at least one row
    hot.alter("remove_row", rowCount - 1); // Remove the last row
  } else {
    alert("No rows to delete."); // Alert if there are no rows
  }
});
