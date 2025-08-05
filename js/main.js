import * as api from './api.js';
import * as ui from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('duprToken');
    if (token) {
        loadProfile();
    } else {
        ui.showLoginView();
    }
});

document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        await api.login(email, password);
        loadProfile();
    } catch (error) {
        console.error('Login failed:', error);
        alert('Login failed. Please check your credentials and try again.');
    }
});

document.getElementById('logout-button').addEventListener('click', () => {
    api.logout();
    ui.showLoginView();
});

async function loadProfile() {
    ui.showProfileView();
    const userId = localStorage.getItem('duprUserId');

    try {
        const profile = await api.getProfile(userId);
        ui.displayProfile(profile);

        const matchHistory = await api.getMatchHistory(userId);
        ui.displayMatchHistory(matchHistory.results);
    } catch (error) {
        console.error('Failed to load profile or match history:', error);
        // Handle token expiration or other errors
        api.logout();
        ui.showLoginView();
        alert('Your session has expired. Please log in again.');
    }
}
