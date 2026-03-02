import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AppError } from '../middlewares/errorHandler.middleware';

export async function signup(email: string, password: string, username: string, displayName: string) {
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) throw new AppError(409, 'EMAIL_EXISTS', '이미 사용 중인 이메일입니다');

  const existingUsername = await prisma.user.findUnique({ where: { username } });
  if (existingUsername) throw new AppError(409, 'USERNAME_EXISTS', '이미 사용 중인 사용자명입니다');

  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, username, displayName },
  });

  const tokenPayload = { userId: user.id, email: user.email, username: user.username, tier: user.tier };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

  return {
    user: { id: user.id, email: user.email, username: user.username, displayName: user.displayName, tier: user.tier, verificationBadge: user.verificationBadge, profileImageUrl: user.profileImageUrl },
    accessToken,
    refreshToken,
  };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError(401, 'INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다');
  if (!user.isActive || user.isBanned) throw new AppError(403, 'ACCOUNT_DISABLED', '비활성화된 계정입니다');

  const isValid = await comparePassword(password, user.password);
  if (!isValid) throw new AppError(401, 'INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다');

  const tokenPayload = { userId: user.id, email: user.email, username: user.username, tier: user.tier };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken, lastLoginAt: new Date() } });

  return {
    user: { id: user.id, email: user.email, username: user.username, displayName: user.displayName, tier: user.tier, verificationBadge: user.verificationBadge, profileImageUrl: user.profileImageUrl, bio: user.bio, city: user.city },
    accessToken,
    refreshToken,
  };
}

export async function refreshTokens(token: string) {
  const payload = verifyRefreshToken(token);
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.refreshToken !== token) throw new AppError(401, 'INVALID_REFRESH_TOKEN', '유효하지 않은 리프레시 토큰입니다');

  const tokenPayload = { userId: user.id, email: user.email, username: user.username, tier: user.tier };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

  return { accessToken, refreshToken };
}

export async function logout(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
}
