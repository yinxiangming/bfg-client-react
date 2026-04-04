import { getBaseUrl } from './platform-api';

// All auth goes through the Platform server (8011)
const getPlatformAuthUrl = () => `${getBaseUrl()}/api/v1/auth`;

async function platformAuthFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${getPlatformAuthUrl()}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || error.detail || `API error ${res.status}`);
  }
  return res.json();
}

// Login via Platform server (8011) → get platform-level JWT
export async function login(data: any) {
  return platformAuthFetch('/token/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Register via Platform server (8011) → creates user, then auto-creates workspace if store_name provided
export async function register(data: {
  email: string
  password: string
  password_confirm?: string
  first_name?: string
  last_name?: string
  store_name?: string
}) {
  return platformAuthFetch('/register/', {
    method: 'POST',
    body: JSON.stringify({
      email: data.email,
      password: data.password,
      password_confirm: data.password_confirm ?? data.password,
      first_name: data.first_name ?? '',
      last_name: data.last_name ?? '',
      store_name: data.store_name ?? '',
    }),
  });
}
