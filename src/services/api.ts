// Define API URL - change this to your deployed worker URL
const API_URL = import.meta.env.VITE_API_URL || 'https://dca-simulator-api.sonic980828.workers.dev';

export const getDeviceId = () => {
  let id = localStorage.getItem('dca_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('dca_device_id', id);
  }
  return id;
};

export const api = {
  login: async (referralCode?: string) => {
    const deviceId = getDeviceId();
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, referralCode }),
    });
    return res.json();
  },

  getUser: async (token: string) => {
    const res = await fetch(`${API_URL}/api/user/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return res.json();
  },

  redeemCode: async (token: string, code: string) => {
    const res = await fetch(`${API_URL}/api/code/redeem`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ code }),
    });
    return res.json();
  },
  
  createReferral: async (token: string) => {
    const res = await fetch(`${API_URL}/api/referral/create`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return res.json();
  }
};

