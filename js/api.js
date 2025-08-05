const BASE_URL = 'https://api.dupr.gg';

async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const token = localStorage.getItem('duprToken');

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
}

export async function login(email, password) {
    const response = await request('/auth/v1.0/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('duprToken', response.token);
    localStorage.setItem('duprUserId', response.userId);
    return response;
}

export function logout() {
    localStorage.removeItem('duprToken');
    localStorage.removeItem('duprUserId');
}

export async function getProfile(userId) {
    return request(`/user/v1.0/${userId}/profile`);
}

export async function getMatchHistory(userId) {
    return request(`/user/v1.0/${userId}/match-history`);
}
