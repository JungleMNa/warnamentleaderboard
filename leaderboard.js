// Leaderboard functionality
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbz_is5E1jYRPebl_cQWDH3pqgSoOS1LYhvZGVI11IlSFtmNNTgVw9HB2XsIvXYh2Zxg2A/exec';

document.addEventListener('DOMContentLoaded', () => {
    setupFilterButtons();
    loadLeaderboardData();
});

// Load leaderboard data from Google Sheets
async function loadLeaderboardData() {
    const tbody = document.getElementById('leaderboardBody');
    
    try {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-secondary);">Loading leaderboard...</td></tr>';
        
        const response = await fetch(GOOGLE_SHEETS_URL + '?action=getLeaderboard');
        const data = await response.json();
        
        if (data.status === 'success' && data.players && data.players.length > 0) {
            updateLeaderboardTable(data.players);
        } else {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-secondary);">No players yet. Check back soon!</td></tr>';
        }
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: var(--accent-red);">Error loading leaderboard. Please try again later.</td></tr>';
    }
}

function setupFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Get filter type
            const filter = button.dataset.filter;
            
            // Reload data (in future can filter by date)
            loadLeaderboardData();
        });
    });
}

function updateLeaderboardTable(players) {
    const tbody = document.getElementById('leaderboardBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!players || players.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-secondary);">No players yet!</td></tr>';
        return;
    }
    
    // Sort by points (descending)
    players.sort((a, b) => b.points - a.points);
    
    players.forEach((player, index) => {
        const row = createLeaderboardRow(player, index + 1);
        tbody.appendChild(row);
    });
}

function createLeaderboardRow(player, rank) {
    const row = document.createElement('tr');
    row.className = rank <= 3 ? `rank-${rank}` : '';
    
    let rankBadgeClass = 'rank-badge';
    if (rank === 1) rankBadgeClass += ' gold';
    else if (rank === 2) rankBadgeClass += ' silver';
    else if (rank === 3) rankBadgeClass += ' bronze';
    
    // Format numbers with thousand separators
    const formatNumber = (num) => {
        return typeof num === 'number' ? num.toLocaleString() : num;
    };
    
    row.innerHTML = `
        <td><span class="${rankBadgeClass}">${rank}</span></td>
        <td>
            <div class="player-info">
                ${rank === 1 ? '<div class="player-avatar icon-crown"></div>' : ''}
                <span class="player-name">${escapeHtml(player.name || 'Unknown')}</span>
            </div>
        </td>
        <td>${formatNumber(player.wins || 0)}</td>
        <td>${formatNumber(player.points || 0)}</td>
    `;
    
    return row;
}

function showErrorMessage(message) {
    const tbody = document.getElementById('leaderboardBody');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: #ff6b6b;">${escapeHtml(message)}</td></tr>`;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
