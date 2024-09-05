import {
  register,
  login,
  refresh,
  logout,
  requestResetEmail,
  resetPassword,
} from '../services/auth.js';

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

  res.cookie('refreshToken', session.refreshToken, {
    httpOnly: true,
    expires: session.refreshTokenValidUntil,
  });

  res.cookie('sessionId', session._id, {
    httpOnly: true,
    expires: session.refreshTokenValidUntil,
  });

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

  res.cookie('refreshToken', session.refreshToken, {
    httpOnly: true,
    expires: session.refreshTokenValidUntil,
  });

  res.cookie('sessionId', session._id, {
    httpOnly: true,
    expires: session.refreshTokenValidUntil,
  });

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
