import { and, count, eq, sql, type SQL } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import { batchAll, db } from '../../../db/client';
import { userProjects, users } from '../../../db/schema';
import type { NewUser, UserWithProjects } from '../../../db/types';

/** Ordem do papel como no enum original (ADMIN, APPROVER, MEMBER); em SQLite o texto ordenaria ao contrário. */
const roleRank = sql`case ${users.role} when 'ADMIN' then 0 when 'APPROVER' then 1 else 2 end`;
const nameCi = sql`${users.name} collate nocase`;

/** Relação pessoa → projetos (N:N) que os mappers leem. */
function withProjects() {
  return { projects: { with: { project: true as const } } };
}

export const usersRepository = {
  findByEmail(email: string) {
    return db().query.users.findFirst({ where: eq(users.email, email) });
  },
  findById(id: string) {
    return db().query.users.findFirst({ where: eq(users.id, id) });
  },
  findByIdWithProjects(id: string): Promise<UserWithProjects | undefined> {
    return db().query.users.findFirst({ where: eq(users.id, id), with: withProjects() });
  },
  list(where?: SQL): Promise<UserWithProjects[]> {
    return db().query.users.findMany({
      where,
      with: withProjects(),
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
  /** Builders que substituem os projetos da pessoa (para compor em `batch()`). */
  setProjectsStatements(userId: string, projectIds: string[]): BatchItem<'sqlite'>[] {
    const statements: BatchItem<'sqlite'>[] = [
      db().delete(userProjects).where(eq(userProjects.userId, userId)),
    ];
    if (projectIds.length > 0) {
      statements.push(
        db()
          .insert(userProjects)
          .values(projectIds.map((projectId) => ({ userId, projectId }))),
      );
    }
    return statements;
  },
  async create(data: NewUser, projectIds: string[] = []): Promise<UserWithProjects> {
    const id = data.id ?? crypto.randomUUID();
    await batchAll([
      this.insert({ ...data, id }),
      ...(projectIds.length > 0 ? this.setProjectsStatements(id, projectIds) : []),
    ]);
    return this.mustFind(id);
  },
  async update(
    id: string,
    data: Partial<NewUser>,
    projectIds?: string[],
  ): Promise<UserWithProjects> {
    await batchAll([
      this.updateById(id, data),
      ...(projectIds ? this.setProjectsStatements(id, projectIds) : []),
    ]);
    return this.mustFind(id);
  },
  async mustFind(id: string): Promise<UserWithProjects> {
    const row = await this.findByIdWithProjects(id);
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
