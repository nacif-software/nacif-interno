import type { Prisma } from '../../../generated/prisma/client';
import { db } from '../../../infra/prisma/client';

export const projectsRepository = {
  list() {
    return db.project.findMany({
      include: {
        defaultApprover: true,
        _count: { select: { members: { where: { active: true } } } },
      },
      orderBy: { name: 'asc' },
    });
  },
  findById(id: string) {
    return db.project.findUnique({
      include: {
        defaultApprover: true,
        _count: { select: { members: { where: { active: true } } } },
      },
      where: { id },
    });
  },
  create(data: Prisma.ProjectUncheckedCreateInput) {
    return db.project.create({
      data,
      include: {
        defaultApprover: true,
        _count: { select: { members: { where: { active: true } } } },
      },
    });
  },
  update(id: string, data: Prisma.ProjectUncheckedUpdateInput) {
    return db.project.update({
      where: { id },
      data,
      include: {
        defaultApprover: true,
        _count: { select: { members: { where: { active: true } } } },
      },
    });
  },
};
