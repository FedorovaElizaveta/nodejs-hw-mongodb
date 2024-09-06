import {
  register,
  login,
  refresh,
  logout,
  requestResetEmail,
  resetPassword,
  registerOrLoginWithGoogle,
} from '../services/auth.js';
import { generateAuthUrl } from '../utilts/googleOAuth2.js';

const createCookies = (res, session) => {
  res.cookie('refreshToken', session.refreshToken, {
    httpOnly: true,
    expires: session.refreshTokenValidUntil,
  });

  res.cookie('sessionId', session._id, {
    httpOnly: true,
    expires: session.refreshTokenValidUntil,
  });
};

export const registerController = async (req, res, next) => {
  const userData = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  };

  const registredUser = await register(userData);

  res.status(200).json({
    status: 200,
    message: 'Successfully registered a user!',
    data: registredUser,
  });
};

export const loginController = async (req, res, next) => {
  const { email, password } = req.body;

  const session = await login(email, password);

  createCookies(res, session);

  res.status(200).json({
    status: 200,
    message: 'Successfully logged in an user!',
    data: {
      accessToken: session.accessToken,
    },
  });
};

export const refreshController = async (req, res, next) => {
  const { sessionId, refreshToken } = req.cookies;

  const session = await refresh(sessionId, refreshToken);

  createCookies(res, session);

  res.status(200).json({
    status: 200,
    message: 'Successfully refreshed a session!',
    data: {
      accessToken: session.accessToken,
    },
  });
};

export const logoutController = async (req, res, next) => {
  const { sessionId } = req.cookies;

  if (typeof sessionId === 'string') {
    await logout(sessionId);
  }

  res.clearCookie('refreshToken');
  res.clearCookie('sessionId');

  res.status(204).end();
};

export const requestResetEmailController = async (req, res, next) => {
  const { email } = req.body;

  await requestResetEmail(email);

  res.status(200).json({
    status: 200,
    message: 'Reset password email has been successfully sent.',
    data: {},
  });
};

export const resetPasswordController = async (req, res, next) => {
  const { password, token } = req.body;

  await resetPassword(password, token);

  res.status(200).json({
    status: 200,
    message: 'Password has been successfully reset.',
    data: {},
  });
};

export const getOAuthURLController = async (req, res, next) => {
  const url = generateAuthUrl();

  res.status(200).json({
    status: 200,
    message: 'Successfully get Google OAuth URL',
    data: { url },
  });
};

export const confirmOauthController = async (req, res, next) => {
  const { code } = req.body;

  const session = await registerOrLoginWithGoogle(code);

  createCookies(res, session);

  res.send({
    status: 200,
    message: 'Login with Google completed',
    data: {
      accessToken: session.accessToken,
    },
  });
};
