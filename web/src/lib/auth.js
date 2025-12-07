const API_URL = 'https://recipe-saver-api.hamiltoon.workers.dev/graphql';
const GITHUB_CLIENT_ID = 'Ov23linhqwiqRIB7923L';
const GITHUB_OAUTH_URL = 'https://github.com/login/oauth/authorize';
const REDIRECT_URL = 'https://hamiltoon.github.io/animated-winner/';

export const auth = {
  getToken() {
    return localStorage.getItem('auth_token');
  },

  setToken(token) {
    localStorage.setItem('auth_token', token);
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  async getCurrentUser() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `
            query {
              me {
                id
                username
                email
                avatarUrl
                name
              }
            }
          `,
        }),
      });

      const result = await response.json();

      if (result.errors) {
        this.logout();
        return null;
      }

      return result.data.me;
    } catch (error) {
      console.error('Error fetching user:', error);
      this.logout();
      return null;
    }
  },

  login() {
    const state = Math.random().toString(36).substring(7);
    sessionStorage.setItem('oauth_state', state);

    const authUrl = `${GITHUB_OAUTH_URL}?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URL)}&state=${state}&scope=user:email`;

    window.location.href = authUrl;
  },

  async handleCallback(code, state) {
    const savedState = sessionStorage.getItem('oauth_state');
    if (state !== savedState) {
      throw new Error('Invalid state parameter');
    }
    sessionStorage.removeItem('oauth_state');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation AuthenticateGitHub($code: String!) {
              authenticateGitHub(code: $code) {
                success
                token
                user {
                  id
                  username
                  email
                  avatarUrl
                  name
                }
                error
              }
            }
          `,
          variables: { code },
        }),
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      const authResult = result.data.authenticateGitHub;

      if (!authResult.success) {
        throw new Error(authResult.error || 'Authentication failed');
      }

      this.setToken(authResult.token);
      return authResult.user;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  },

  logout() {
    localStorage.removeItem('auth_token');
  }
};

export { API_URL };
