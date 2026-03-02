import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다').max(30),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9._]+$/, '영문, 숫자, ., _ 만 사용 가능합니다'),
  displayName: z.string().min(1, '이름을 입력하세요').max(50),
});

export const loginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
  password: z.string().min(1, '비밀번호를 입력하세요'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});
