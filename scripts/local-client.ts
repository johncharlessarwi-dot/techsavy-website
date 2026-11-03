import { defaultContent } from '../shared/domain';
// Development-only adapter. Never returns fake success for customer submissions.
export const api = {
  async get(path: string) {
    if (path.startsWith('/api/products'))
      return { data: { items: [], cursor: null } };
    if (path === '/api/content') {
      return { data: defaultContent };
    }
    throw new Error('The backend is available in the AppDeploy deployment.');
  },
  async post() {
    throw new Error(
      'Local design preview only. Open the deployed site to send a request.',
    );
  },
  async put() {
    throw new Error('Local design preview only.');
  },
  async delete() {
    throw new Error('Local design preview only.');
  },
};
export const auth = {
  async getUser() {
    return null;
  },
  async signInWithRedirect() {
    throw new Error('Admin sign-in is available on the deployed site.');
  },
  async signOut() {},
};
