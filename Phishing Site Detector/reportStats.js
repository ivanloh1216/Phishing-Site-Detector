const browser = window.msBrowser || window.browser || window.chrome;

function updateReportStatsTable() {
  const reportStatsTable = document.getElementById('reportStatsTable');

  // Clear the existing table body
  const tableBody = reportStatsTable.getElementsByTagName('tbody')[0];
  tableBody.innerHTML = '';

  // Retrieve the report stats from the browser storage
  browser.storage.sync.get('reportStats', function(result) {
    const reportStats = result.reportStats || [];

    // Loop through the report stats and create table rows
    for (const report of reportStats) {
      const row = document.createElement('tr');

      // Create table cells for Report ID, URL, Timestamp, and Report Count
      const reportIdCell = document.createElement('td');
      reportIdCell.textContent = report.reportID;
      row.appendChild(reportIdCell);

      const urlCell = document.createElement('td');
      urlCell.textContent = report.url;
      row.appendChild(urlCell);

      const timestampCell = document.createElement('td');
      const timestamp = new Date(report.timestamp);
      const formattedTimestamp = timestamp.toLocaleString(); // Adjust the date and time formatting as needed
      timestampCell.textContent = formattedTimestamp;
      row.appendChild(timestampCell);

      // Append the row to the table body
      tableBody.appendChild(row);
    }
  });
}


updateReportStatsTable();