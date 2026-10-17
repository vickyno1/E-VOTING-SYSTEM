import apiClient from './client';

export const voterApi = {
  getDashboard: async () => {
    const res = await apiClient.get('/voter/dashboard');
    return res.data;
  },

  getElections: async () => {
    const res = await apiClient.get('/voter/elections');
    return res.data;
  },

  getElection: async (electionId) => {
    const res = await apiClient.get(`/voter/elections/${electionId}`);
    return res.data;
  },

  getVoterStatus: async (electionId) => {
    const res = await apiClient.get(`/voter/elections/${electionId}/status`);
    return res.data;
  },

  castVote: async (electionId, candidateId) => {
    const res = await apiClient.post(`/voter/elections/${electionId}/vote`, {
      candidate_id: candidateId,
    });
    return res.data;
  },

  getResults: async (electionId) => {
    const res = await apiClient.get(`/voter/results/${electionId}`);
    return res.data;
  },
};
