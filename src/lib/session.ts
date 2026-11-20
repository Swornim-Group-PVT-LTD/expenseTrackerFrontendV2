const activityKey = "expense-session-last-activity";
const idleMinutes = Number(process.env.NEXT_PUBLIC_SESSION_IDLE_MINUTES);
const idleTimeout =
  (Number.isFinite(idleMinutes) && idleMinutes >= 1 ? idleMinutes : 10) * 60_000;

export function getSessionToken() {
  return document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/)?.[1];
}

export function recordSessionActivity() {
  localStorage.setItem(activityKey, String(Date.now()));
}

export function clearSession() {
  document.cookie = "access_token=; Path=/; Max-Age=0; SameSite=Strict";
  localStorage.removeItem("user");
  localStorage.removeItem(activityKey);
}

export function endSession() {
  clearSession();
  if (/^\/dashboard(?:\/|$)/.test(window.location.pathname)) {
    window.location.replace("/authentication/login");
  }
}

export function hasActiveSession() {
  if (!getSessionToken()) return false;

  const lastActivity = Number(localStorage.getItem(activityKey));
  if (!lastActivity) {
    recordSessionActivity();
    return true;
  }

  return Date.now() - lastActivity < idleTimeout;
}
