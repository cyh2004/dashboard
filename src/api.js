import axios from 'axios';

const token = process.env.REACT_APP_TOKEN;

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    // 可添加认证头
    'token': `${token}`,
  }
});

export const fetchOrgs = () => api.get('/orgs');
export const fetchGrouplist = (org_id) => api.get(`/orgs/${org_id}/grouplist`);
export const fetchDevices = (org_id, group_id) => api.get(`/orgs/${org_id}/groups/${group_id}/devices`);
export const fetchDeviceState = (org_id, device_id) => api.get(`/orgs/${org_id}/devicestate/${device_id}`);
export const fetchDevicePacket = (org_id, device_number) => api.get(`/orgs/${org_id}/devicepacket/${device_number}`);
export const postData = (payload) => api.post('/data', payload);