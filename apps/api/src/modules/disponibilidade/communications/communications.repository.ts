import type { Prisma } from '../../../generated/prisma/client';
import { db, type DbOrTx } from '../../../infra/prisma/client';

export const communicationInclude = {
  author: true,
  cover: true,
  approver: true,
  project: true,
  decisions: { where: { revertedAt: null }, orderBy: { decidedAt: 'desc' as const }, take: 1 },
  events: { orderBy: { occurredAt: 'asc' as const }, include: { actor: true } },
} satisfies Prisma.CommunicationInclude;

export type CommunicationRow = Prisma.CommunicationGetPayload<{
  include: typeof communicationInclude;
}>;

export const communicationsRepository = {
  findById(id: string, tx: DbOrTx = db) {
    return tx.communication.findUnique({ where: { id }, include: communicationInclude });
  },
  findByCode(code: string, tx: DbOrTx = db) {
    return tx.communication.findUnique({ where: { code }, include: communicationInclude });
  },
  findMany(args: {
    where: Prisma.CommunicationWhereInput;
    skip?: number;
    take?: number;
    orderBy?:
      Prisma.CommunicationOrderByWithRelationInput | Prisma.CommunicationOrderByWithRelationInput[];
  }) {
    return db.communication.findMany({ ...args, include: communicationInclude });
  },
  count(where: Prisma.CommunicationWhereInput) {
    return db.communication.count({ where });
  },
  create(data: Prisma.CommunicationUncheckedCreateInput, tx: DbOrTx) {
    return tx.communication.create({ data, include: communicationInclude });
  },
  update(id: string, data: Prisma.CommunicationUncheckedUpdateInput, tx: DbOrTx = db) {
    return tx.communication.update({ where: { id }, data, include: communicationInclude });
  },
};
