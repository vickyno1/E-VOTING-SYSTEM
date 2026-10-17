import apiClient from './client';

export const authApi = {
  register: async (userData) => {
    const res = await apiClient.post('/auth/register', userData);
    return res.data;
  },

  enrollFace: async (imageData, consent, enrollmentToken) => {
    const res = await apiClient.post('/auth/enroll-face', {
      image: imageData,
      consent,
      enrollment_token: enrollmentToken,
    });
    return res.data;
  },

  login: async (identifier, password) => {
    const res = await apiClient.post('/auth/login', {
      identifier,
      password,
    });
    return res.data;
  },

  verifyFace: async (challengeToken, imageData) => {
    const res = await apiClient.post('/auth/verify-face', {
      challenge_token: challengeToken,
      image: imageData,
    });
    return res.data;
  },

  logout: async () => {
    const res = await apiClient.post('/auth/logout');
    return res.data;
  },

  getMe: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
};
