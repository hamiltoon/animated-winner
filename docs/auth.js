// GitHub OAuth authentication utilities
const GITHUB_CLIENT_ID = 'Ov23linhqwiqRIB7923L';
const GITHUB_OAUTH_URL = 'https://github.com/login/oauth/authorize';
const API_URL = 'https://recipe-saver-api.hamiltoon.workers.dev/graphql';

class Auth {
  constructor() {
    this.token = localStorage.getItem('auth_token');
    this.user = null;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token;
  }

  // Get current user from API
  async getCurrentUser() {
    if (!this.token) {
      return null;
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
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
        console.error('Error fetching user:', result.errors);
        this.logout();
        return null;
      }

      this.user = result.data.me;
      return this.user;
    } catch (error) {
      console.error('Error fetching user:', error);
      this.logout();
      return null;
    }
  }

  // Initiate GitHub OAuth flow
  login() {
    const redirectUri = `${window.location.origin}${window.location.pathname}auth/callback`;
    const state = Math.random().toString(36).substring(7);

    // Store state for CSRF protection
    sessionStorage.setItem('oauth_state', state);

    const authUrl = `${GITHUB_OAUTH_URL}?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=user:email`;

    window.location.href = authUrl;
  }

  // Handle OAuth callback and exchange code for token
  async handleCallback(code, state) {
    // Verify state for CSRF protection
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

      // Store token
      this.token = authResult.token;
      localStorage.setItem('auth_token', this.token);
      this.user = authResult.user;

      return authResult.user;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  // Logout
  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('auth_token');
  }

  // Get auth token for API requests
  getToken() {
    return this.token;
  }

  // Get current user (cached)
  getUser() {
    return this.user;
  }
}

// Export singleton instance
const auth = new Auth();
