// Leaderboard functionality
document.addEventListener('DOMContentLoaded', () => {
    setupFilterButtons();
});

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
            
            // You can implement different data loading based on filter
            // For now, we'll just show a visual indication
            console.log('Filtering by:', filter);
        });
    });
}

function updateLeaderboardTable(players) {
    const tbody = document.getElementById('leaderboardBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!players || players.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center;">No players yet. Start the server to see data!</td></tr>';
        return;
    }
    
    players.forEach((player) => {
        const row = createLeaderboardRow(player);
        tbody.appendChild(row);
    });
}

function createLeaderboardRow(player) {
    const row = document.createElement('tr');
    const rank = player.rank || 0;
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
                <span class="player-name">${escapeHtml(player.land || 'Unknown')}</span>
                ${player.player ? `<span class="player-subtext">${escapeHtml(player.player)}</span>` : ''}
            </div>
        </td>
        <td>${formatNumber(player.provinces)}</td>
        <td>${formatNumber(player.points)}</td>
        <td>${formatNumber(player.population)}</td>
        <td>${formatNumber(player.economy)}</td>
        <td>${formatNumber(player.income)}</td>
        <td>${formatNumber(player.damage)}</td>
        <td>${formatNumber(player.losses)}</td>
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
