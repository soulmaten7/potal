import api from './api';

export const verificationService = {
  verifyIdCard: (data: { idCardType: string; realName: string; birthDate: string }) =>
    api.post('/verification/id-card', data),
  verifyFace: () => api.post('/verification/face'),
  getStatus: () => api.get('/verification/status'),
};
