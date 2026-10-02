import { usersRepository } from '../../users/users.repository';
import { verifyPassword } from '../password';
import type { AuthProvider } from './auth-provider';

export const localPasswordProvider: AuthProvider = {
  async authenticate({ email, password }) {
    if (!password) return null;
    const user = await usersRepository.findByEmail(email);
    if (!user?.passwordHash) return null;
    const ok = await verifyPassword(password, user.passwordHash);
    return ok ? user : null;
  },
};
