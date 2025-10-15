// Events Management
let events = [

];

// Google Sheets Configuration
const GOOGLE_SHEETS_CONFIG = {
    // Replace this with your actual Google Apps Script Web App URL
    // Instructions to set up are in the setup-instructions.txt file
    scriptURL: 'https://script.google.com/macros/s/AKfycbxSSVDjRcgBlJ7ZUoZQbCw3OOliPrwmbyY0KoeRJsVW668Ij-wlVPuP3MAG2X_x3GIUrA/exec'
};

// Load events on page load
document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
    setupModalHandlers();
});

function loadEvents() {
    const eventsGrid = document.getElementById('eventsGrid');
    eventsGrid.innerHTML = '';

    if (events.length === 0) {
        const noEventsText = window.i18n ? window.i18n.t('events.noEvents') : 'NO EVENTS AVAILABLE';
        const noEventsDesc = window.i18n ? window.i18n.t('events.noEventsDesc') : 'Check back soon for upcoming events';
        
        eventsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">
                    <div class="icon-trophy" style="width: 100px; height: 100px; margin: 0 auto;"></div>
                </div>
                <h3 style="color: var(--text-secondary); font-size: 1.5rem; letter-spacing: 2px;">${noEventsText}</h3>
                <p style="color: var(--text-secondary); margin-top: 0.5rem;">${noEventsDesc}</p>
            </div>
        `;
        return;
    }

    events.forEach(event => {
        const eventCard = createEventCard(event);
        eventsGrid.appendChild(eventCard);
    });
}

function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card';
    
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const statusText = event.status === 'live' 
        ? (window.i18n ? window.i18n.t('events.live') : 'LIVE')
        : (window.i18n ? window.i18n.t('events.upcoming') : 'UPCOMING');
    
    const detailsText = window.i18n ? window.i18n.t('events.details') : 'DETAILS';
    const enterText = window.i18n ? window.i18n.t('events.enter') : 'ENTER';

    card.innerHTML = `
        <span class="event-status ${event.status}">${statusText}</span>
        <h3>${event.name}</h3>
        <span class="event-date"><span class="icon-calendar"></span> ${formattedDate}</span>
        <p class="event-description">${event.description}</p>
        <div class="event-prize"><span class="icon-trophy"></span> ${event.prize}</div>
        <div class="event-actions">
            <button class="btn btn-secondary" onclick="showEventDetails(${event.id})">${detailsText}</button>
            <button class="btn btn-primary" onclick="showEnterEvent(${event.id})">${enterText}</button>
        </div>
    `;

    return card;
}

function setupModalHandlers() {
    // Enter Event Form
    const enterEventForm = document.getElementById('enterEventForm');
    enterEventForm.onsubmit = (e) => {
        e.preventDefault();
        submitRegistration();
    };

    // Close buttons
    const closeButtons = document.getElementsByClassName('close');
    Array.from(closeButtons).forEach(btn => {
        btn.onclick = function() {
            this.parentElement.parentElement.style.display = 'none';
        };
    });

    // Close on outside click
    window.onclick = (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };
}

function showEventDetails(eventId) {
    const event = events.find(e => e.id === eventId);
    const modal = document.getElementById('eventDetailsModal');
    const content = document.getElementById('eventDetailsContent');

    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    content.innerHTML = `
        <h2>${event.name}</h2>
        <span class="event-status ${event.status}">${event.status.toUpperCase()}</span>
        <div style="margin: 2rem 0;">
            <p style="margin-bottom: 1rem;"><strong style="color: var(--primary-color);">Date:</strong> ${formattedDate}</p>
            <p style="margin-bottom: 1rem;"><strong style="color: var(--primary-color);">Prize:</strong> ${event.prize}</p>
            <p style="margin-bottom: 1rem;"><strong style="color: var(--primary-color);">Description:</strong></p>
            <p style="color: var(--text-secondary); line-height: 1.8;">${event.description}</p>
        </div>
        <button class="btn btn-primary" onclick="showEnterEvent(${event.id}); document.getElementById('eventDetailsModal').style.display='none';">ENTER EVENT</button>
    `;

    modal.style.display = 'block';
}

function showEnterEvent(eventId) {
    const event = events.find(e => e.id === eventId);
    const modal = document.getElementById('enterEventModal');
    const info = document.getElementById('enterEventInfo');

    info.innerHTML = `
        <div style="margin-bottom: 2rem; padding: 1rem; background: var(--darker-bg); border-left: 3px solid var(--primary-color);">
            <h3 style="color: var(--primary-color); margin-bottom: 0.5rem;">${event.name}</h3>
            <p style="color: var(--text-secondary);">Enter your Discord username to register</p>
        </div>
    `;

    // Store event ID for submission
    modal.dataset.eventId = eventId;
    modal.style.display = 'block';
}

async function submitRegistration() {
    const modal = document.getElementById('enterEventModal');
    const eventId = parseInt(modal.dataset.eventId);
    const event = events.find(e => e.id === eventId);
    const discordUsername = document.getElementById('discordUsername').value;

    // Prepare data for Google Sheets
    const registrationData = {
        timestamp: new Date().toISOString(),
        event: event.name,
        username: discordUsername,
        eventDate: event.date
    };

    // Send to Google Sheets
    try {
        if (GOOGLE_SHEETS_CONFIG.scriptURL !== 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
            await sendToGoogleSheets(registrationData);
            showNotification(`Successfully registered for ${event.name}!`);
        } else {
            // If Google Sheets is not configured, show success anyway (for demo purposes)
            console.log('Registration data:', registrationData);
            showNotification(`Successfully registered for ${event.name}! (Google Sheets not configured - check console for data)`);
        }
    } catch (error) {
        console.error('Error submitting registration:', error);
        showNotification('Error submitting registration. Please try again.', 'error');
    }

    modal.style.display = 'none';
    document.getElementById('enterEventForm').reset();
}

async function sendToGoogleSheets(data) {
    const response = await fetch(GOOGLE_SHEETS_CONFIG.scriptURL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });

    // Note: With 'no-cors' mode, we can't read the response
    // but the data will still be sent to Google Sheets
    return response;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 2rem;
        background: ${type === 'success' ? 'var(--primary-color)' : 'var(--accent-red)'};
        color: var(--dark-bg);
        font-weight: 600;
        border-radius: 4px;
        z-index: 3000;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
