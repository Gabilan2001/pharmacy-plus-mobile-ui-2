export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

export async function fetchJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, options);
  const data = await res.json();
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || 'Request failed';
    throw new Error(message);
  }
  return data as T;
}

// Prevent expo-router from treating this helper as a screen route by exporting a default noop component.
export default function ApiHelperFile() {
  return null;
}
