import type { ConflictDto, DateRange, ProjectRef } from '@nacif/shared';
import { and, eq, gte, inArray, lte, ne } from 'drizzle-orm';
import { db } from '../../../db/client';
import { communications, projects, userProjects, users } from '../../../db/schema';

export interface ConflictLookup {
  /** Quem está comunicando (fica fora da busca). */
  authorId: string;
  /** Projetos da pessoa; a comunicação vale para todos eles. */
  projectIds: string[];
  range: DateRange;
  excludeCommunicationId?: string;
  maxSimultaneousPerProject: number;
}

export interface ConflictLookupResult {
  conflicts: ConflictDto[];
  limitReached: boolean;
  limitReachedProjects: ProjectRef[];
}

/**
 * Conflito = outra pessoa que divide ao menos um projeto com quem comunica e tem indisponibilidade
 * APROVADA sobrepondo o período. `limitReachedProjects` lista os projetos em que o número de pessoas
 * já aprovadas atinge o limite configurado.
 */
export async function findConflicts(input: ConflictLookup): Promise<ConflictLookupResult> {
  if (input.projectIds.length === 0) {
    return { conflicts: [], limitReached: false, limitReachedProjects: [] };
  }
  const rows = await db()
    .select({
      communication: communications,
      authorName: users.name,
      projectId: projects.id,
      projectName: projects.name,
    })
    .from(communications)
    .innerJoin(userProjects, eq(userProjects.userId, communications.authorId))
    .innerJoin(projects, eq(projects.id, userProjects.projectId))
    .innerJoin(users, eq(users.id, communications.authorId))
    .where(
      and(
        inArray(userProjects.projectId, input.projectIds),
        eq(communications.status, 'APPROVED'),
        ne(communications.authorId, input.authorId),
        input.excludeCommunicationId
          ? ne(communications.id, input.excludeCommunicationId)
          : undefined,
        lte(communications.startDate, input.range.endDate),
        gte(communications.endDate, input.range.startDate),
      ),
    );

  const byCommunication = new Map<string, ConflictDto>();
  const peopleByProject = new Map<string, { project: ProjectRef; people: Set<string> }>();
  for (const r of rows) {
    const c = r.communication;
    const existing = byCommunication.get(c.id);
    if (existing) {
      if (!existing.projectNames.includes(r.projectName)) existing.projectNames.push(r.projectName);
    } else {
      byCommunication.set(c.id, {
        userId: c.authorId,
        name: r.authorName,
        startDate: c.startDate,
        endDate: c.endDate,
        status: c.status,
        projectNames: [r.projectName],
      });
    }
    const bucket = peopleByProject.get(r.projectId) ?? {
      project: { id: r.projectId, name: r.projectName },
      people: new Set<string>(),
    };
    bucket.people.add(c.authorId);
    peopleByProject.set(r.projectId, bucket);
  }

  const collator = new Intl.Collator('pt-BR');
  const conflicts = [...byCommunication.values()]
    .map((c) => ({ ...c, projectNames: [...c.projectNames].sort(collator.compare) }))
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || collator.compare(a.name, b.name));
  const limitReachedProjects = [...peopleByProject.values()]
    .filter((b) => b.people.size >= input.maxSimultaneousPerProject)
    .map((b) => b.project)
    .sort((a, b) => collator.compare(a.name, b.name));
  return { conflicts, limitReached: limitReachedProjects.length > 0, limitReachedProjects };
}
