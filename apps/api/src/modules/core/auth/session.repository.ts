import { db } from '../../../infra/prisma/client';

export const sessionRepository = {
  create(data: { id: string; userId: string; expiresAt: Date }) {
    return db.session.create({ data });
  },
  findWithUser(id: string) {
    return db.session.findUnique({
      where: { id },
      include: { user: { include: { project: true } } },
    });
  },
  touch(id: string, lastSeenAt: Date, expiresAt: Date) {
    return db.session.update({ where: { id }, data: { lastSeenAt, expiresAt } });
  },
  delete(id: string) {
    return db.session.deleteMany({ where: { id } });
  },
  deleteAllForUser(userId: string) {
    return db.session.deleteMany({ where: { userId } });
  },
  deleteExpired(now: Date) {
    return db.session.deleteMany({ where: { expiresAt: { lt: now } } });
  },
};
