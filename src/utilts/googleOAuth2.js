import fs from 'node:fs';
import path from 'node:path';
import { OAuth2Client } from 'google-auth-library';
import createHttpError from 'http-errors';
import { env } from './env.js';

const CONFIG = JSON.parse(
  fs.readFileSync(path.resolve('src', 'google-oauth-credentials.json')),
  { encoding: 'utf-8' },
);

const googleOAuth2Client = new OAuth2Client({
  clientId: env('GOOGLE_AUTH_CLIENT_ID'),
  clientSecret: env('GOOGLE_AUTH_CLIENT_SECRET'),
  redirectUri: CONFIG['web']['redirect_uris'][0],
});

export const generateAuthUrl = () => {
  return googleOAuth2Client.generateAuthUrl({
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
  });
};

export const validateCode = async (code) => {
  try {
    const response = await googleOAuth2Client.getToken(code);

    return googleOAuth2Client.verifyIdToken({
      idToken: response.tokens.id_token,
    });
  } catch (err) {
    if (
      err.response &&
      err.response.status >= 400 &&
      err.response.status <= 499
    ) {
      throw createHttpError(401, 'Unauthorized');
    } else {
      throw err;
    }
  }
};
