import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler.middleware';

export async function verifyIdCard(userId: string, _data: { idCardType: string; realName: string; birthDate: string }) {
  let verification = await prisma.userVerification.findUnique({ where: { userId } });
  if (!verification) {
    verification = await prisma.userVerification.create({
      data: { userId, idCardVerified: true, idCardType: _data.idCardType, realName: _data.realName, birthDate: new Date(_data.birthDate), reviewedBy: 'SYSTEM' },
    });
  } else {
    verification = await prisma.userVerification.update({
      where: { userId },
      data: { idCardVerified: true, idCardType: _data.idCardType, realName: _data.realName, birthDate: new Date(_data.birthDate) },
    });
  }

  await checkAndUpgradeTier(userId);
  return { verificationStatus: 'VERIFIED' };
}

export async function verifyFace(userId: string) {
  let verification = await prisma.userVerification.findUnique({ where: { userId } });
  if (!verification) {
    verification = await prisma.userVerification.create({
      data: { userId, faceVerified: true, livenessScore: 0.98, livenessCheckedAt: new Date(), reviewedBy: 'SYSTEM' },
    });
  } else {
    verification = await prisma.userVerification.update({
      where: { userId },
      data: { faceVerified: true, livenessScore: 0.98, livenessCheckedAt: new Date() },
    });
  }

  await checkAndUpgradeTier(userId);
  return { verificationStatus: 'VERIFIED' };
}

export async function getVerificationStatus(userId: string) {
  const verification = await prisma.userVerification.findUnique({ where: { userId } });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { tier: true, verificationStatus: true } });
  return { verification, tier: user?.tier, verificationStatus: user?.verificationStatus };
}

async function checkAndUpgradeTier(userId: string) {
  const verification = await prisma.userVerification.findUnique({ where: { userId } });
  if (verification?.idCardVerified && verification?.faceVerified) {
    await prisma.userVerification.update({ where: { userId }, data: { verifiedAt: new Date() } });
    await prisma.user.update({
      where: { id: userId },
      data: { tier: 'LEVEL_2', verificationStatus: 'VERIFIED', verificationBadge: true },
    });
    await prisma.notification.create({
      data: { userId, type: 'VERIFICATION_APPROVED', title: 'Lv.2 인증 완료', body: '축하합니다! 이제 경매를 등록하고 입찰할 수 있습니다.' },
    });
  }
}
