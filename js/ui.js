export function showLoginView() {
    document.getElementById('login-view').classList.remove('hidden');
    document.getElementById('profile-view').classList.add('hidden');
}

export function showProfileView() {
    document.getElementById('login-view').classList.add('hidden');
    document.getElementById('profile-view').classList.remove('hidden');
}

export function displayProfile(profile) {
    const profileInfo = document.getElementById('profile-info');
    profileInfo.innerHTML = `
        <h2>${profile.fullName}</h2>
        <p><b>Rating:</b> ${profile.rating}</p>
        <p><b>Singles:</b> ${profile.singlesRating}</p>
        <p><b>Doubles:</b> ${profile.doublesRating}</p>
    `;
}

export function displayMatchHistory(matches) {
    const matchHistory = document.getElementById('match-history');
    matchHistory.innerHTML = matches.map(match => `
        <div class="match">
            <p><b>${match.eventName}</b></p>
            <p>${match.date} - ${match.location}</p>
            <p>${match.team1.player1.fullName} & ${match.team1.player2.fullName} vs ${match.team2.player1.fullName} & ${match.team2.player2.fullName}</p>
            <p><b>Score:</b> ${match.score}</p>
        </div>
    `).join('');
}
