export function getToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem('sn_token') : null;
}

export async function getAuthToken(): Promise<string> {
  const token = getToken();
  if (!token) throw new Error('No token');
  return token;
}

export async function getAuthSub(): Promise<string> {
  const token = getToken();
  if (!token) throw new Error('No token');
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.sub as string;
}

export async function requireAuth(router: any, redirect = '/login'): Promise<string> {
  const token = getToken();
  if (!token) {
    router.push(redirect);
    throw new Error('Not authenticated');
  }
  return token;
}
