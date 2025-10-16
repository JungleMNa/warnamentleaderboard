// Admin Panel JavaScript
// This manages events via Google Sheets

// sheets
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbz_is5E1jYRPebl_cQWDH3pqgSoOS1LYhvZGVI11IlSFtmNNTgVw9HB2XsIvXYh2Zxg2A/exec';

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
        // Get admin password from session (stored during login)
        const adminPassword = sessionStorage.getItem('adminPassword');
        
        if (!adminPassword) {
            alert('Session expired. Please log in again.');
            logout();
            return false;
        }
        
        const payload = {
            action: action,
            event: eventData,
            eventId: eventData.id,
            adminPassword: adminPassword  // Include password for verification
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

// Load total registrations count (only for existing events)
async function loadTotalRegistrations() {
    try {
        const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getRegistrations&t=${Date.now()}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            const allRegistrations = data.registrations || [];
            
            // Get list of existing event names
            const existingEventNames = currentEvents.map(e => e.name);
            
            // Filter registrations to only include those for existing events
            const validRegistrations = allRegistrations.filter(reg => 
                existingEventNames.includes(reg.event)
            );
            
            const count = validRegistrations.length;
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
        status: document.getElementById('eventStatusInput').value,
        tag: document.getElementById('eventTagInput').value.trim().toUpperCase() // Add tag field
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

// ========== TAB SWITCHING ==========
function switchAdminTab(tabName) {
    // Hide all tabs
    document.getElementById('eventsTab').style.display = 'none';
    document.getElementById('leaderboardTab').style.display = 'none';
    
    // Remove active class from all buttons
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.style.background = 'var(--darker-bg)';
        btn.style.color = 'var(--text-primary)';
        btn.style.border = '1px solid var(--border-color)';
    });
    
    // Show selected tab and activate button
    if (tabName === 'events') {
        document.getElementById('eventsTab').style.display = 'block';
        event.target.style.background = 'var(--primary-color)';
        event.target.style.color = 'var(--dark-bg)';
        event.target.style.border = 'none';
    } else if (tabName === 'leaderboard') {
        document.getElementById('leaderboardTab').style.display = 'block';
        event.target.style.background = 'var(--primary-color)';
        event.target.style.color = 'var(--dark-bg)';
        event.target.style.border = 'none';
        loadLeaderboardData();
    }
}

// ========== LEADERBOARD MANAGEMENT ==========
let leaderboardPlayers = [];
let selectedPlayerId = null;

// Load leaderboard from Google Sheets
async function loadLeaderboardData() {
    try {
        const response = await fetch(GOOGLE_SHEETS_URL + '?action=getLeaderboard');
        const data = await response.json();
        
        if (data.status === 'success' && data.players) {
            leaderboardPlayers = data.players;
            displayLeaderboardTable();
        } else {
            // If no leaderboard data, show empty state
            leaderboardPlayers = [];
            displayLeaderboardTable();
        }
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        document.getElementById('leaderboardTableBody').innerHTML = 
            '<tr><td colspan="5" style="padding: 2rem; text-align: center; color: var(--accent-red);">Error loading leaderboard data</td></tr>';
    }
}

// Display leaderboard table
function displayLeaderboardTable() {
    const tbody = document.getElementById('leaderboardTableBody');
    
    if (leaderboardPlayers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="padding: 2rem; text-align: center; color: var(--text-secondary);">No players yet. Click "Add Player" to get started!</td></tr>';
        return;
    }
    
    // Sort by points (descending)
    leaderboardPlayers.sort((a, b) => b.points - a.points);
    
    tbody.innerHTML = leaderboardPlayers.map((player, index) => {
        const rank = index + 1;
        
        return `
            <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 1rem; color: var(--primary-color); font-weight: bold;">#${rank}</td>
                <td style="padding: 1rem; color: var(--text-primary);">${player.name}</td>
                <td style="padding: 1rem; text-align: center; color: var(--accent-green);">${player.wins || 0}</td>
                <td style="padding: 1rem; text-align: center; color: var(--primary-color); font-weight: bold;">${player.points}</td>
                <td style="padding: 1rem; text-align: center;">
                    <button onclick="editPlayer('${player.id}')" style="background: var(--accent-blue); color: white; padding: 0.4rem 0.8rem; border: none; cursor: pointer; margin-right: 0.5rem; border-radius: 4px;">EDIT</button>
                    <button onclick="deletePlayer('${player.id}')" style="background: var(--accent-red); color: white; padding: 0.4rem 0.8rem; border: none; cursor: pointer; border-radius: 4px;">DELETE</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Show add player form
function showAddPlayerForm() {
    document.getElementById('playerModalTitle').textContent = 'Add New Player';
    document.getElementById('playerForm').dataset.mode = 'add';
    document.getElementById('playerNameInput').value = '';
    document.getElementById('playerWinsInput').value = '0';
    document.getElementById('playerPointsInput').value = '0';
    document.getElementById('playerModal').style.display = 'block';
}

// Edit player
function editPlayer(playerId) {
    const player = leaderboardPlayers.find(p => p.id === playerId);
    if (!player) return;
    
    selectedPlayerId = playerId;
    document.getElementById('playerModalTitle').textContent = 'Edit Player';
    document.getElementById('playerForm').dataset.mode = 'edit';
    document.getElementById('playerForm').dataset.playerId = playerId;
    document.getElementById('playerNameInput').value = player.name;
    document.getElementById('playerWinsInput').value = player.wins || 0;
    document.getElementById('playerPointsInput').value = player.points;
    document.getElementById('playerModal').style.display = 'block';
}

// Delete player
async function deletePlayer(playerId) {
    if (!confirm('Are you sure you want to delete this player?')) return;
    
    const adminPassword = sessionStorage.getItem('adminPassword');
    if (!adminPassword) {
        alert('Session expired. Please log in again.');
        logout();
        return;
    }
    
    try {
        await fetch(GOOGLE_SHEETS_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'deletePlayer',
                playerId: playerId,
                adminPassword: adminPassword
            })
        });
        
        // Remove from local array
        leaderboardPlayers = leaderboardPlayers.filter(p => p.id !== playerId);
        displayLeaderboardTable();
        alert('Player deleted successfully!');
    } catch (error) {
        console.error('Error deleting player:', error);
        alert('Error deleting player. Please try again.');
    }
}

// Close player modal
function closePlayerModal() {
    document.getElementById('playerModal').style.display = 'none';
    selectedPlayerId = null;
}

// Handle player form submission
document.getElementById('playerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target;
    const mode = form.dataset.mode;
    
    const playerData = {
        name: document.getElementById('playerNameInput').value.trim(),
        wins: parseInt(document.getElementById('playerWinsInput').value),
        points: parseInt(document.getElementById('playerPointsInput').value)
    };
    
    const adminPassword = sessionStorage.getItem('adminPassword');
    if (!adminPassword) {
        alert('Session expired. Please log in again.');
        logout();
        return;
    }
    
    if (mode === 'add') {
        // Generate new ID
        playerData.id = 'player_' + Date.now();
        
        await fetch(GOOGLE_SHEETS_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'createPlayer',
                player: playerData,
                adminPassword: adminPassword
            })
        });
        
        leaderboardPlayers.push(playerData);
    } else {
        // Edit existing
        const playerId = form.dataset.playerId;
        playerData.id = playerId;
        
        await fetch(GOOGLE_SHEETS_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'updatePlayer',
                player: playerData,
                adminPassword: adminPassword
            })
        });
        
        const index = leaderboardPlayers.findIndex(p => p.id === playerId);
        if (index !== -1) {
            leaderboardPlayers[index] = playerData;
        }
    }
    
    displayLeaderboardTable();
    closePlayerModal();
    alert('Player saved successfully!');
});
