// Google Apps Script Code
// Copy this code to your Google Apps Script project
// to create a web app that handles events and registrations

function doPost(e) {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);
    
    // Check if this is an event creation/update or a registration
    if (data.action === 'createEvent' || data.action === 'updateEvent' || data.action === 'deleteEvent') {
      return handleEventAction(spreadsheet, data);
    } else {
      return handleRegistration(spreadsheet, data);
    }
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      'status': 'error',
      'message': error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var action = e.parameter.action;
    
    if (action === 'getEvents') {
      return getEvents(spreadsheet);
    } else if (action === 'getRegistrations') {
      return getRegistrations(spreadsheet, e.parameter.eventId);
    }
    
    return ContentService.createTextOutput('Event Management API is running');
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      'status': 'error',
      'message': error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle event creation, update, or deletion
function handleEventAction(spreadsheet, data) {
  var eventsSheet = getOrCreateSheet(spreadsheet, 'Events');
  
  if (data.action === 'createEvent') {
    var rowData = [
      data.event.id,
      data.event.name,
      data.event.date,
      data.event.description,
      data.event.prize,
      data.event.status,
      new Date().toISOString()
    ];
    eventsSheet.appendRow(rowData);
    
  } else if (data.action === 'updateEvent') {
    var rows = eventsSheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] == data.event.id) {
        eventsSheet.getRange(i + 1, 1, 1, 7).setValues([[
          data.event.id,
          data.event.name,
          data.event.date,
          data.event.description,
          data.event.prize,
          data.event.status,
          new Date().toISOString()
        ]]);
        break;
      }
    }
    
  } else if (data.action === 'deleteEvent') {
    var rows = eventsSheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] == data.eventId) {
        eventsSheet.deleteRow(i + 1);
        break;
      }
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    'status': 'success',
    'message': 'Event action completed'
  })).setMimeType(ContentService.MimeType.JSON);
}

// Handle registration
function handleRegistration(spreadsheet, data) {
  var registrationsSheet = getOrCreateSheet(spreadsheet, 'Registrations');
  
  var rowData = [
    data.timestamp,
    data.event,
    data.username,
    data.eventDate
  ];
  
  registrationsSheet.appendRow(rowData);
  
  return ContentService.createTextOutput(JSON.stringify({
    'status': 'success',
    'message': 'Registration recorded'
  })).setMimeType(ContentService.MimeType.JSON);
}

// Get all events
function getEvents(spreadsheet) {
  var eventsSheet = getOrCreateSheet(spreadsheet, 'Events');
  var data = eventsSheet.getDataRange().getValues();
  
  var events = [];
  for (var i = 1; i < data.length; i++) {
    events.push({
      id: data[i][0],
      name: data[i][1],
      date: data[i][2],
      description: data[i][3],
      prize: data[i][4],
      status: data[i][5]
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    'status': 'success',
    'events': events
  })).setMimeType(ContentService.MimeType.JSON);
}

// Get registrations for a specific event
function getRegistrations(spreadsheet, eventId) {
  var registrationsSheet = getOrCreateSheet(spreadsheet, 'Registrations');
  var data = registrationsSheet.getDataRange().getValues();
  
  var registrations = [];
  for (var i = 1; i < data.length; i++) {
    registrations.push({
      timestamp: data[i][0],
      event: data[i][1],
      username: data[i][2],
      eventDate: data[i][3]
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    'status': 'success',
    'registrations': registrations
  })).setMimeType(ContentService.MimeType.JSON);
}

// Helper function to get or create a sheet
function getOrCreateSheet(spreadsheet, sheetName) {
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    if (sheetName === 'Events') {
      sheet.appendRow(['ID', 'Name', 'Date', 'Description', 'Prize', 'Status', 'Created At']);
    } else if (sheetName === 'Registrations') {
      sheet.appendRow(['Timestamp', 'Event Name', 'Discord Username', 'Event Date']);
    }
    sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
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
