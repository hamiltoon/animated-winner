// Authentication utilities for GitHub OAuth and JWT

// Simple JWT implementation without external dependencies
export class JWT {
  static async sign(payload, secret) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));

    const signature = await this.createSignature(
      `${encodedHeader}.${encodedPayload}`,
      secret
    );

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  static async verify(token, secret) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const [encodedHeader, encodedPayload, signature] = parts;

      const expectedSignature = await this.createSignature(
        `${encodedHeader}.${encodedPayload}`,
        secret
      );

      if (signature !== expectedSignature) {
        throw new Error('Invalid signature');
      }

      const payload = JSON.parse(this.base64UrlDecode(encodedPayload));

      if (payload.exp && Date.now() >= payload.exp * 1000) {
        throw new Error('Token expired');
      }

      return payload;
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  static async createSignature(data, secret) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(data);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    return this.arrayBufferToBase64Url(signature);
  }

  static base64UrlEncode(str) {
    const base64 = btoa(str);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  static base64UrlDecode(str) {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return atob(base64);
  }

  static arrayBufferToBase64Url(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }
}

// GitHub OAuth helpers
export async function exchangeGitHubCode(code, clientId, clientSecret) {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error_description || data.error);
  }

  return data.access_token;
}

export async function getGitHubUser(accessToken) {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'User-Agent': 'Recipe-Saver-App',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  const user = await response.json();

  // Also get user's email if not public
  let email = user.email;
  if (!email) {
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'User-Agent': 'Recipe-Saver-App',
      },
    });

    if (emailResponse.ok) {
      const emails = await emailResponse.json();
      const primaryEmail = emails.find(e => e.primary);
      email = primaryEmail ? primaryEmail.email : emails[0]?.email;
    }
  }

  return {
    githubId: user.id.toString(),
    username: user.login,
    email: email,
    avatarUrl: user.avatar_url,
    name: user.name,
  };
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export async function getUserFromToken(token, jwtSecret) {
  if (!token) {
    return null;
  }

  try {
    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace(/^Bearer\s+/i, '');
    const payload = await JWT.verify(cleanToken, jwtSecret);
    return payload.userId;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}
