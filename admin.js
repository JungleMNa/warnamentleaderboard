// Admin Panel JavaScript
// This manages events via Google Sheets

// YOUR GOOGLE SHEETS WEB APP URL (same as in events.js)
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzmkhPge93gabbrqUrAYBHNDPr6VEBZMpoZ9-nHzFrV3tn-ObHE3SU4jKwaJlfSup8uWw/exec';

let currentEvents = [];
let selectedEventId = null;

// Load events from Google Sheets on page load
document.addEventListener('DOMContentLoaded', () => {
    loadEventsFromGoogleSheets();
    
    // Auto-refresh admin panel every 5 seconds to stay synced
    setInterval(() => {
        loadEventsFromGoogleSheets(true);
    }, 5000);
});

// Load events from Google Sheets
async function loadEventsFromGoogleSheets(silent = false) {
    try {
        const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getEvents&t=${Date.now()}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            currentEvents = data.events || [];
            displayEventsList();
            updateStats();
        } else {
            if (!silent) {
                console.error('Error loading events:', data.message);
                // Show message to user
                document.getElementById('eventsList').innerHTML = `
                    <div class="no-data" style="color: var(--accent-red);">
                        Error loading events. Please check Google Sheets setup.
                    </div>
                `;
            }
        }
    } catch (error) {
        if (!silent) {
            console.error('Error fetching events:', error);
            // Fallback to showing empty state
            currentEvents = [];
            displayEventsList();
            updateStats();
        }
    }
}

// Save event to Google Sheets
async function saveEventToGoogleSheets(eventData, action) {
    try {
        const payload = {
            action: action,
            event: eventData,
            eventId: eventData.id
        };
        
        const response = await fetch(GOOGLE_SHEETS_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        // Note: no-cors doesn't allow reading the response, so we assume success
        // Reload events to confirm (wait 2 seconds for Google Sheets to process)
        await new Promise(resolve => setTimeout(resolve, 2000));
        await loadEventsFromGoogleSheets();
        
        return true;
    } catch (error) {
        console.error('Error saving to Google Sheets:', error);
        alert('Error saving event. Please try again.');
        return false;
    }
}

// Display events list
function displayEventsList() {
    const eventsList = document.getElementById('eventsList');
    
    if (currentEvents.length === 0) {
        eventsList.innerHTML = '<div class="no-data">No events yet. Click "Add New Event" to create one.</div>';
        return;
    }
    
    eventsList.innerHTML = '';
    currentEvents.forEach(event => {
        const eventItem = document.createElement('div');
        eventItem.className = 'event-list-item' + (selectedEventId === event.id ? ' active' : '');
        eventItem.onclick = () => selectEvent(event.id);
        
        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        eventItem.innerHTML = `
            <h4>${event.name}</h4>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Prize:</strong> ${event.prize}</p>
            <p><strong>Status:</strong> ${event.status.toUpperCase()}</p>
            <div style="margin-top: 0.5rem;">
                <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; margin-right: 0.5rem;" onclick="event.stopPropagation(); editEvent(${event.id})">EDIT</button>
                <button class="btn-delete" onclick="event.stopPropagation(); deleteEvent(${event.id})">DELETE</button>
            </div>
        `;
        
        eventsList.appendChild(eventItem);
    });
}

// Select an event to view registrations
function selectEvent(eventId) {
    selectedEventId = eventId;
    displayEventsList();
    loadPlayersForEvent(eventId);
}

// Load players for selected event
async function loadPlayersForEvent(eventId) {
    const event = currentEvents.find(e => e.id === eventId);
    if (!event) return;
    
    document.getElementById('selectedEventName').textContent = `Registrations for: ${event.name}`;
    
    const playersList = document.getElementById('playersList');
    
    // Show loading state
    playersList.innerHTML = `
        <div class="no-data">
            <div class="loading-spinner" style="width: 40px; height: 40px; margin: 0 auto 1rem;"></div>
            <p>Loading registrations...</p>
        </div>
    `;
    
    try {
        // Fetch registrations from Google Sheets
        const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getRegistrations&t=${Date.now()}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            const allRegistrations = data.registrations || [];
            
            // Filter registrations for this specific event
            const eventRegistrations = allRegistrations.filter(reg => reg.event === event.name);
            
            if (eventRegistrations.length === 0) {
                playersList.innerHTML = `
                    <div class="no-data">
                        <p style="color: var(--text-secondary);">No registrations yet for this event.</p>
                        <p style="font-size: 0.85rem; margin-top: 0.5rem; color: var(--text-secondary); opacity: 0.7;">
                            Players will appear here when they register on the events page.
                        </p>
                    </div>
                `;
                return;
            }
            
            // Display registrations
            playersList.innerHTML = '';
            eventRegistrations.forEach(reg => {
                const playerItem = document.createElement('div');
                playerItem.className = 'player-item';
                
                const regDate = new Date(reg.timestamp);
                const formattedTime = regDate.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                playerItem.innerHTML = `
                    <div class="player-name">${reg.username}</div>
                    <div class="player-time">${formattedTime}</div>
                `;
                
                playersList.appendChild(playerItem);
            });
            
            // Update total registrations stat
            updateRegistrationCount(allRegistrations.length);
            
        } else {
            playersList.innerHTML = `
                <div class="no-data" style="color: var(--accent-red);">
                    <p>Error loading registrations.</p>
                    <p style="font-size: 0.85rem; margin-top: 0.5rem;">Check Google Sheets setup.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error fetching registrations:', error);
        playersList.innerHTML = `
            <div class="no-data">
                <p style="color: var(--text-secondary);">Unable to load registrations.</p>
                <p style="font-size: 0.85rem; margin-top: 0.5rem; color: var(--text-secondary);">
                    Make sure Google Sheets is configured correctly.
                </p>
            </div>
        `;
    }
}

// Update registration count
function updateRegistrationCount(count) {
    document.getElementById('totalRegistrations').textContent = count;
}

// Update statistics
function updateStats() {
    document.getElementById('totalEvents').textContent = currentEvents.length;
    const activeCount = currentEvents.filter(e => e.status === 'live').length;
    document.getElementById('activeEvents').textContent = activeCount;
    
    // Load total registrations count
    loadTotalRegistrations();
}

// Load total registrations count
async function loadTotalRegistrations() {
    try {
        const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getRegistrations&t=${Date.now()}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            const count = (data.registrations || []).length;
            document.getElementById('totalRegistrations').textContent = count;
        } else {
            document.getElementById('totalRegistrations').textContent = '-';
        }
    } catch (error) {
        document.getElementById('totalRegistrations').textContent = '-';
    }
}

// Show add event form
function showAddEventForm() {
    document.getElementById('modalTitle').textContent = 'Add New Event';
    document.getElementById('eventForm').reset();
    document.getElementById('eventForm').dataset.mode = 'add';
    document.getElementById('eventModal').style.display = 'block';
}

// Edit event
function editEvent(eventId) {
    const event = currentEvents.find(e => e.id === eventId);
    if (!event) return;
    
    document.getElementById('modalTitle').textContent = 'Edit Event';
    document.getElementById('eventNameInput').value = event.name;
    document.getElementById('eventDateInput').value = event.date;
    document.getElementById('eventDescInput').value = event.description;
    document.getElementById('eventPrizeInput').value = event.prize;
    document.getElementById('eventStatusInput').value = event.status;
    
    document.getElementById('eventForm').dataset.mode = 'edit';
    document.getElementById('eventForm').dataset.eventId = eventId;
    document.getElementById('eventModal').style.display = 'block';
}

// Delete event
async function deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    await saveEventToGoogleSheets({ id: eventId }, 'deleteEvent');
    
    if (selectedEventId === eventId) {
        selectedEventId = null;
        document.getElementById('playersList').innerHTML = '<div class="no-data">Select an event from the left</div>';
    }
}

// Close modal
function closeEventModal() {
    document.getElementById('eventModal').style.display = 'none';
}

// Handle form submission
document.getElementById('eventForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target;
    const mode = form.dataset.mode;
    
    const eventData = {
        name: document.getElementById('eventNameInput').value,
        date: document.getElementById('eventDateInput').value,
        description: document.getElementById('eventDescInput').value,
        prize: document.getElementById('eventPrizeInput').value,
        status: document.getElementById('eventStatusInput').value
    };
    
    if (mode === 'add') {
        // Generate new ID
        const newId = currentEvents.length > 0 ? Math.max(...currentEvents.map(e => e.id)) + 1 : 1;
        eventData.id = newId;
        await saveEventToGoogleSheets(eventData, 'createEvent');
    } else {
        // Edit existing
        const eventId = parseInt(form.dataset.eventId);
        eventData.id = eventId;
        await saveEventToGoogleSheets(eventData, 'updateEvent');
    }
    
    closeEventModal();
    alert('Event saved successfully! It will appear on the events page automatically.');
});

// Close modal when clicking outside
window.onclick = (event) => {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};
