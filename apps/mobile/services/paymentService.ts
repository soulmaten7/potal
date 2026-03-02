import api from './api';

export const paymentService = {
  getPayments: () => api.get('/payments/me'),
};
