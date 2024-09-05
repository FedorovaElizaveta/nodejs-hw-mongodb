import createHttpError from 'http-errors';
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import fs from 'node:fs';
import path from 'node:path';
import handlebars from 'handlebars';

import { User } from '../db/models/user.js';
import { Session } from '../db/models/session.js';
import {
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
  SMTP,
} from '../constants/index.js';
import { sendMail } from '../utilts/sendMail.js';
import { env } from '../utilts/env.js';

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

export const requestResetEmail = async (email) => {
  const user = await User.findOne({ email });

  if (user === null) {
    throw createHttpError(404, 'User not found');
  }

  const resetToken = jwt.sign(
    {
      sub: user._id,
      email: user.email,
    },
    env('JWT_SECRET'),
    { expiresIn: '5m' },
  );

  const templateSource = fs.readFileSync(
    path.resolve('src/templates/reset-password.hbs'),
    {
      encoding: 'UTF-8',
    },
  );

  const template = handlebars.compile(templateSource);

  const html = template({
    name: user.name,
    resetToken,
    domen: env('APP_DOMAIN'),
  });

  try {
    await sendMail({
      from: SMTP.FROM_EMAIL,
      to: email,
      subject: 'Reset your password',
      html,
    });
  } catch {
    throw createHttpError(
      500,
      'Failed to send the email, please try again later.',
    );
  }
};

export const resetPassword = async (password, token) => {
  try {
    const decoded = jwt.verify(token, env('JWT_SECRET'));

    const user = await User.findOne({ _id: decoded.sub, email: decoded.email });

    if (user === null) {
      throw createHttpError(404, 'User not found');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.findOneAndUpdate(
      { _id: user._id },
      { password: hashedPassword },
    );

    // await Session.findOneAndDelete({ userId: user._id });
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      throw createHttpError(401, 'Token is expired or invalid.');
    }

    throw err;
  }
};
