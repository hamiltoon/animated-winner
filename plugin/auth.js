// GitHub OAuth authentication for Chrome extension
const GITHUB_CLIENT_ID = 'Ov23linhqwiqRIB7923L';
const GITHUB_OAUTH_URL = 'https://github.com/login/oauth/authorize';
const API_URL = 'https://recipe-saver-api.hamiltoon.workers.dev/graphql';
const REDIRECT_URL = `https://${chrome.runtime.id}.chromiumapp.org/`;

const Auth = {
  // Get stored auth token
  getToken() {
    return localStorage.getItem('auth_token');
  },

  // Store auth token
  setToken(token) {
    localStorage.setItem('auth_token', token);
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getToken();
  },

  // Get current user from API
  async getCurrentUser() {
    const token = this.getToken();
    if (!token) {
      return null;
    }

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
        console.error('Error fetching user:', result.errors);
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

  // Initiate GitHub OAuth flow using chrome.identity
  async login() {
    const state = Math.random().toString(36).substring(7);
    sessionStorage.setItem('oauth_state', state);

    const authUrl = `${GITHUB_OAUTH_URL}?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URL)}&state=${state}&scope=user:email`;

    return new Promise((resolve, reject) => {
      chrome.identity.launchWebAuthFlow(
        {
          url: authUrl,
          interactive: true
        },
        async (responseUrl) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            return;
          }

          try {
            const url = new URL(responseUrl);
            const code = url.searchParams.get('code');
            const returnedState = url.searchParams.get('state');

            if (!code) {
              reject(new Error('No code received'));
              return;
            }

            // Verify state
            const savedState = sessionStorage.getItem('oauth_state');
            if (returnedState !== savedState) {
              reject(new Error('Invalid state parameter'));
              return;
            }
            sessionStorage.removeItem('oauth_state');

            // Exchange code for token
            const user = await this.handleCallback(code);
            resolve(user);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  },

  // Handle OAuth callback and exchange code for token
  async handleCallback(code) {
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
      this.setToken(authResult.token);

      return authResult.user;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  },

  // Logout
  logout() {
    localStorage.removeItem('auth_token');
  }
};
