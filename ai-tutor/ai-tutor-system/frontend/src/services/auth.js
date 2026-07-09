export function login(user) {
    localStorage.setItem("user", JSON.stringify(user));
}

export function logout() {
    localStorage.removeItem("user");
}

export function getUser() {
    const user = localStorage.getItem("user");

    if (!user) return null;

    return JSON.parse(user);
}

export function isLoggedIn() {
    return localStorage.getItem("user") !== null;
}