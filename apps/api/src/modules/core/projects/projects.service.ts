import {
  isApproverRole,
  type CreateProjectBody,
  type ProjectDto,
  type UpdateProjectBody,
} from '@nacif/shared';
import { AppError, NotFoundError, ValidationError } from '../../../infra/http/errors';
import { usersRepository } from '../users/users.repository';
import { toProjectDto } from './project.mapper';
import { projectsRepository } from './projects.repository';

async function assertApprover(userId: string | null | undefined) {
  if (!userId) return;
  const user = await usersRepository.findById(userId);
  if (!user || !user.active || !isApproverRole(user.role)) {
    throw new AppError(
      422,
      'VALIDATION_ERROR',
      'O aprovador padrão precisa ser um aprovador ou administrador ativo.',
    );
  }
}

export const projectsService = {
  async list(): Promise<ProjectDto[]> {
    return (await projectsRepository.list()).map(toProjectDto);
  },
  async create(body: CreateProjectBody): Promise<ProjectDto> {
    await assertApprover(body.defaultApproverId);
    return toProjectDto(
      await projectsRepository.create({
        name: body.name,
        defaultApproverId: body.defaultApproverId ?? null,
      }),
    );
  },
  async update(id: string, body: UpdateProjectBody): Promise<ProjectDto> {
    const existing = await projectsRepository.findById(id);
    if (!existing) throw new NotFoundError('Projeto não encontrado.');
    if (body.defaultApproverId !== undefined) await assertApprover(body.defaultApproverId);
    return toProjectDto(await projectsRepository.update(id, body));
  },
};

/** Garante que todos os ids são de projetos ativos; devolve a lista sem repetição. */
export async function assertActiveProjects(projectIds: string[]): Promise<string[]> {
  const ids = [...new Set(projectIds)];
  const found = await projectsRepository.findActiveByIds(ids);
  const invalid = ids.filter((id) => !found.some((p) => p.id === id));
  if (invalid.length > 0) {
    throw new ValidationError('Projeto inválido ou inativo.', [
      { path: 'body.projectIds', message: 'Projeto inválido ou inativo.', invalid },
    ]);
  }
  return ids;
}
