// Google Apps Script Code
// Copy this code to your Google Apps Script project
// to create a web app that receives event registrations

function doPost(e) {
  try {
    // Get the active spreadsheet
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Parse the incoming JSON data
    var data = JSON.parse(e.postData.contents);
    
    // Prepare the row data
    var rowData = [
      data.timestamp,
      data.event,
      data.username,
      data.eventDate
    ];
    
    // Append the data to the sheet
    sheet.appendRow(rowData);
    
    // Return success response
    return ContentService.createTextOutput(JSON.stringify({
      'status': 'success',
      'message': 'Registration recorded'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Return error response
    return ContentService.createTextOutput(JSON.stringify({
      'status': 'error',
      'message': error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput('Event Registration API is running');
}

// Optional: Function to set up the spreadsheet headers
function setupSheet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var headers = ['Timestamp', 'Event Name', 'Discord Username', 'Event Date'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

// Test function to verify the script is working
function testScript() {
  var testData = {
    timestamp: new Date().toISOString(),
    event: 'Test Event',
    username: 'TestUser#1234',
    eventDate: new Date().toISOString()
  };
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rowData = [
    testData.timestamp,
    testData.event,
    testData.username,
    testData.eventDate
  ];
  
  sheet.appendRow(rowData);
  Logger.log('Test successful!');
}
