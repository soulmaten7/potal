import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("시드 데이터 삽입 시작...");

  await prisma.notification.deleteMany({});
  await prisma.chatMessage.deleteMany({});
  await prisma.chatRoom.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.block.deleteMany({});
  await prisma.bid.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.like.deleteMany({});
  await prisma.auctionImage.deleteMany({});
  await prisma.auction.deleteMany({});
  await prisma.postImage.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.follow.deleteMany({});
  await prisma.userVerification.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("기존 데이터 삭제 완료");

  const hashedPassword = await bcrypt.hash("Test1234!", 10);

  const user1 = await prisma.user.create({
    data: {
      email: "user1@test.com",
      password: hashedPassword,
      username: "testuser1",
      displayName: "테스트 유저 1",
      bio: "개발을 좋아하는 개발자입니다",
      profileImageUrl: "https://via.placeholder.com/300?text=testuser1",
      tier: "LEVEL_1",
      verificationStatus: "NONE",
      verificationBadge: false,
      city: "서울 강남구",
      isActive: true,
      isBanned: false,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: "user2@test.com",
      password: hashedPassword,
      username: "testuser2",
      displayName: "테스트 유저 2",
      bio: "마케팅 전문가입니다",
      profileImageUrl: "https://via.placeholder.com/300?text=testuser2",
      tier: "LEVEL_1",
      verificationStatus: "NONE",
      verificationBadge: false,
      city: "서울 강남구",
      isActive: true,
      isBanned: false,
    },
  });

  const host = await prisma.user.create({
    data: {
      email: "host1@test.com",
      password: hashedPassword,
      username: "hostuser1",
      displayName: "호스트 1",
      bio: "IT 커리어 상담해드립니다",
      profileImageUrl: "https://via.placeholder.com/300?text=hostuser1",
      tier: "LEVEL_2",
      verificationStatus: "VERIFIED",
      verificationBadge: true,
      city: "서울 강남구",
      isActive: true,
      isBanned: false,
      averageRating: 4.8,
      totalRatingCount: 15,
    },
  });

  await prisma.userVerification.create({
    data: {
      userId: host.id,
      idCardVerified: true,
      idCardType: "주민등록증",
      realName: "김개발",
      birthDate: new Date("1990-05-15"),
      faceVerified: true,
      livenessScore: 0.98,
      livenessCheckedAt: new Date(),
      verifiedAt: new Date(),
      reviewedBy: "SYSTEM",
    },
  });

  console.log("유저 3명 생성 완료");

  await prisma.follow.create({ data: { followerId: user1.id, followingId: host.id } });
  await prisma.follow.create({ data: { followerId: user2.id, followingId: host.id } });

  await prisma.user.update({ where: { id: host.id }, data: { followerCount: 2 } });
  await prisma.user.update({ where: { id: user1.id }, data: { followingCount: 1 } });
  await prisma.user.update({ where: { id: user2.id }, data: { followingCount: 1 } });

  console.log("팔로우 관계 생성 완료");

  const post1 = await prisma.post.create({
    data: {
      authorId: user1.id,
      caption: "새로운 프로젝트를 시작했습니다! React Native 멋있어요",
      locationName: "서울 강남구 코엑스",
      likeCount: 12,
      images: {
        create: [{ imageUrl: "https://via.placeholder.com/400x500?text=post1_img1", width: 400, height: 500, order: 0 }],
      },
    },
  });

  const post2 = await prisma.post.create({
    data: {
      authorId: user1.id,
      caption: "오늘 날씨 좋네요. 산책 다녀왔어요.",
      locationName: "서울 강남구 보라매공원",
      likeCount: 8,
      images: {
        create: [{ imageUrl: "https://via.placeholder.com/400x500?text=post2_img1", width: 400, height: 500, order: 0 }],
      },
    },
  });

  await prisma.user.update({ where: { id: user1.id }, data: { postCount: 2 } });
  console.log("게시물 2개 생성 완료");

  await prisma.like.create({ data: { userId: user2.id, targetType: "POST", postId: post1.id } });

  const auctionStartTime = new Date();
  const auctionEndTime = new Date(auctionStartTime.getTime() + 48 * 60 * 60 * 1000);

  const auction = await prisma.auction.create({
    data: {
      hostId: host.id,
      title: "IT 개발자와 커리어 상담 디너",
      description: "10년 경력의 IT 개발자입니다. 커리어 전환, 기술 스택, 이직 준비 등 다양한 주제로 상담해드립니다.",
      auctionDuration: "HOURS_48",
      mealDuration: "MIN_120",
      startPrice: 30000,
      buyNowPrice: 150000,
      currentPrice: 0,
      startsAt: auctionStartTime,
      endsAt: auctionEndTime,
      city: "서울 강남구",
      latitude: 37.4979,
      longitude: 127.0276,
      status: "ACTIVE",
      bidCount: 0,
      likeCount: 5,
      viewCount: 42,
      images: {
        create: [{ imageUrl: "https://via.placeholder.com/500x600?text=auction_img1", width: 500, height: 600, order: 0 }],
      },
    },
  });

  await prisma.user.update({ where: { id: host.id }, data: { auctionCount: 1 } });
  console.log("경매 1개 생성 완료");

  await prisma.like.create({ data: { userId: user1.id, targetType: "AUCTION", auctionId: auction.id } });
  await prisma.like.create({ data: { userId: user2.id, targetType: "AUCTION", auctionId: auction.id } });

  console.log("시드 데이터 삽입 완료!");
  console.log(`- 유저: ${user1.username}, ${user2.username}, ${host.username}`);
  console.log(`- 게시물: ${post1.id}, ${post2.id}`);
  console.log(`- 경매: ${auction.id}`);
}

main()
  .catch((e) => { console.error("시드 데이터 삽입 중 에러:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
