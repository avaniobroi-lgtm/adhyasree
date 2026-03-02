// social.js – helpers only; main UI logic is in index.ejs

// Trigger leaderboard fetch when tab activated (already handled in inline script, this is a fallback)
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.tab === 'leaderboard') {
                if (typeof fetchLeaderboard === 'function') fetchLeaderboard();
            }
            if (btn.dataset.tab === 'social') {
                if (typeof fetchFriends === 'function') fetchFriends();
                if (typeof fetchChallenges === 'function') fetchChallenges();
            }
        });
    });
});
