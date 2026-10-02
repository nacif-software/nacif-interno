import type { Prisma } from '../../../generated/prisma/client';
import { db, type DbOrTx } from '../../../infra/prisma/client';

export const usersRepository = {
  findByEmail(email: string) {
    return db.user.findUnique({ where: { email } });
  },
  findById(id: string, tx: DbOrTx = db) {
    return tx.user.findUnique({ where: { id } });
  },
  findByIdWithProject(id: string, tx: DbOrTx = db) {
    return tx.user.findUnique({ where: { id }, include: { project: true } });
  },
  list(where: Prisma.UserWhereInput) {
    return db.user.findMany({
      where,
      include: { project: true },
      orderBy: [{ role: 'desc' }, { name: 'asc' }],
    });
  },
  create(data: Prisma.UserUncheckedCreateInput, tx: DbOrTx = db) {
    return tx.user.create({ data, include: { project: true } });
  },
  update(id: string, data: Prisma.UserUncheckedUpdateInput, tx: DbOrTx = db) {
    return tx.user.update({ where: { id }, data, include: { project: true } });
  },
  countActiveAdmins() {
    return db.user.count({ where: { role: 'ADMIN', active: true } });
  },
};
