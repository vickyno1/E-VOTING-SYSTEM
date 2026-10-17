import apiClient from './client';

export const staffApi = {
  getDashboard: async () => {
    const res = await apiClient.get('/staff/dashboard');
    return res.data;
  },

  getElections: async () => {
    const res = await apiClient.get('/staff/elections');
    return res.data;
  },

  createElection: async (electionData) => {
    const res = await apiClient.post('/staff/elections', electionData);
    return res.data;
  },

  getElection: async (electionId) => {
    const res = await apiClient.get(`/staff/elections/${electionId}`);
    return res.data;
  },

  updateElection: async (electionId, data) => {
    const res = await apiClient.put(`/staff/elections/${electionId}`, data);
    return res.data;
  },

  addCandidate: async (electionId, candidateData) => {
    const res = await apiClient.post(`/staff/elections/${electionId}/candidates`, candidateData);
    return res.data;
  },

  openElection: async (electionId) => {
    const res = await apiClient.post(`/staff/elections/${electionId}/open`);
    return res.data;
  },

  closeElection: async (electionId) => {
    const res = await apiClient.post(`/staff/elections/${electionId}/close`);
    return res.data;
  },

  publishResults: async (electionId) => {
    const res = await apiClient.post(`/staff/elections/${electionId}/publish-results`);
    return res.data;
  },

  getParticipation: async (electionId) => {
    const res = await apiClient.get(`/staff/elections/${electionId}/participation`);
    return res.data;
  },

  getResults: async (electionId) => {
    const res = await apiClient.get(`/staff/elections/${electionId}/results`);
    return res.data;
  },

  getAuditLogs: async (limit = 100, skip = 0) => {
    const res = await apiClient.get(`/staff/audit-logs?limit=${limit}&skip=${skip}`);
    return res.data;
  },
};
