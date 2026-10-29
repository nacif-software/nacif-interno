import { eq, getTableColumns, sql } from 'drizzle-orm';
import { db } from '../../../db/client';
import { projects, users } from '../../../db/schema';
import type { NewProject, ProjectRow } from '../../../db/types';

/** Membros ativos do projeto (o Prisma fazia `_count` filtrado). */
const memberCount = sql<number>`(
  select count(*) from ${users} where ${users.projectId} = ${projects.id} and ${users.active} = 1
)`.mapWith(Number);

function selectRows() {
  return db()
    .select({ ...getTableColumns(projects), memberCount, defaultApprover: users })
    .from(projects)
    .leftJoin(users, eq(projects.defaultApproverId, users.id));
}

export const projectsRepository = {
  list(): Promise<ProjectRow[]> {
    return selectRows().orderBy(sql`${projects.name} collate nocase`);
  },
  async findById(id: string): Promise<ProjectRow | undefined> {
    const [row] = await selectRows().where(eq(projects.id, id));
    return row;
  },
  async create(data: NewProject): Promise<ProjectRow> {
    const id = data.id ?? crypto.randomUUID();
    await db()
      .insert(projects)
      .values({ ...data, id });
    return this.mustFind(id);
  },
  async update(id: string, data: Partial<NewProject>): Promise<ProjectRow> {
    await db().update(projects).set(data).where(eq(projects.id, id));
    return this.mustFind(id);
  },
  async mustFind(id: string): Promise<ProjectRow> {
    const row = await this.findById(id);
    if (!row) throw new Error(`Projeto ${id} não encontrado após gravar.`);
    return row;
  },
};
