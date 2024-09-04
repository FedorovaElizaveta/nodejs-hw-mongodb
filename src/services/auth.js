import createHttpError from 'http-errors';
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';

import { User } from '../db/models/user.js';
import { Session } from '../db/models/session.js';
import { ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL } from '../constants/index.js';

export const register = async (userData) => {
  const existingUser = await User.findOne({ email: userData.email });

  if (existingUser !== null) {
    throw createHttpError(409, 'Email in use');
  }

  userData.password = await bcrypt.hash(userData.password, 10);

  return User.create(userData);
};

export const login = async (email, password) => {
  const existingUser = await User.findOne({ email });

  if (existingUser === null) {
    throw createHttpError(404, 'User not found');
  }

  const doesPasswordMatch = await bcrypt.compare(
    password,
    existingUser.password,
  );

  if (!doesPasswordMatch) {
    throw createHttpError(401, 'Unauthorized');
  }

  await Session.deleteOne({ userId: existingUser._id });

  return Session.create({
    userId: existingUser._id,
    accessToken: crypto.randomBytes(30).toString('base64'),
    refreshToken: crypto.randomBytes(30).toString('base64'),
    accessTokenValidUntil: new Date(Date.now() + ACCESS_TOKEN_TTL),
    refreshTokenValidUntil: new Date(Date.now() + REFRESH_TOKEN_TTL),
  });
};

export const refresh = async (sessionId, refreshToken) => {
  const session = await Session.findOne({ _id: sessionId, refreshToken });

  if (session === null) {
    throw createHttpError(401, 'Session not found');
  }

  if (new Date() > new Date(session.refreshTokenValidUntil)) {
    throw createHttpError(401, 'Refresh token is expired');
  }

  await Session.deleteOne({ _id: sessionId });

  return Session.create({
    userId: session.userId,
    accessToken: crypto.randomBytes(30).toString('base64'),
    refreshToken: crypto.randomBytes(30).toString('base64'),
    accessTokenValidUntil: new Date(Date.now() + ACCESS_TOKEN_TTL),
    refreshTokenValidUntil: new Date(Date.now() + REFRESH_TOKEN_TTL),
  });
};

export const logout = async (sessionId) => {
  return Session.deleteOne({ _id: sessionId });
};
