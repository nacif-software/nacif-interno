import { and, count, eq, sql, type SQL } from 'drizzle-orm';
import { db } from '../../../db/client';
import { users } from '../../../db/schema';
import type { NewUser, UserWithProject } from '../../../db/types';

/** Ordem do papel como no enum original (ADMIN, APPROVER, MEMBER); em SQLite o texto ordenaria ao contrário. */
const roleRank = sql`case ${users.role} when 'ADMIN' then 0 when 'APPROVER' then 1 else 2 end`;
const nameCi = sql`${users.name} collate nocase`;

export const usersRepository = {
  findByEmail(email: string) {
    return db().query.users.findFirst({ where: eq(users.email, email) });
  },
  findById(id: string) {
    return db().query.users.findFirst({ where: eq(users.id, id) });
  },
  findByIdWithProject(id: string): Promise<UserWithProject | undefined> {
    return db().query.users.findFirst({ where: eq(users.id, id), with: { project: true } });
  },
  list(where?: SQL): Promise<UserWithProject[]> {
    return db().query.users.findMany({
      where,
      with: { project: true },
      orderBy: [roleRank, nameCi],
    });
  },
  /** Builder para compor em `batch()`; o chamador gera o `id` antes. */
  insert(data: NewUser & { id: string }) {
    return db().insert(users).values(data);
  },
  /** Builder para compor em `batch()`. */
  updateById(id: string, data: Partial<NewUser>) {
    return db().update(users).set(data).where(eq(users.id, id));
  },
  async create(data: NewUser): Promise<UserWithProject> {
    const id = data.id ?? crypto.randomUUID();
    await db()
      .insert(users)
      .values({ ...data, id });
    return this.mustFind(id);
  },
  async update(id: string, data: Partial<NewUser>): Promise<UserWithProject> {
    await db().update(users).set(data).where(eq(users.id, id));
    return this.mustFind(id);
  },
  async mustFind(id: string): Promise<UserWithProject> {
    const row = await this.findByIdWithProject(id);
    if (!row) throw new Error(`Usuário ${id} não encontrado após gravar.`);
    return row;
  },
  async countActiveAdmins(): Promise<number> {
    const [row] = await db()
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.role, 'ADMIN'), eq(users.active, true)));
    return row?.count ?? 0;
  },
};
