import { sql, type SQL, type SQLWrapper } from 'drizzle-orm';
import { userProjects } from '../../../db/schema';

/**
 * Condição "a pessoa (coluna dada) participa do projeto", via `user_projects`.
 * Usada por fila e calendário: a comunicação vale para todos os projetos de quem a enviou.
 */
export function memberOfProject(userColumn: SQLWrapper, projectId: string): SQL {
  return sql`exists (
    select 1 from ${userProjects} up
    where up.user_id = ${userColumn} and up.project_id = ${projectId}
  )`;
}
