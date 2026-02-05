import axios from 'axios';

const API_URL = 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
});

export const getTransactionFlow = async (chain: string, hash: string) => {
  const response = await api.get('/transaction/flow', {
    params: { chain, hash },
  });
  return response.data;
};
