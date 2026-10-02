import type { UpdateUserBody, UserDto, UserOption, UsersListQuery } from '@nacif/shared';
import type { Prisma } from '../../../generated/prisma/client';
import { AppError, NotFoundError } from '../../../infra/http/errors';
import type { AuthenticatedUser } from '../../../infra/http/require-auth';
import { sessionService } from '../auth/session.service';
import { toUserDto, toUserOption } from './user.mapper';
import { usersRepository } from './users.repository';

export const usersService = {
  async list(actor: AuthenticatedUser, query: UsersListQuery): Promise<UserDto[]> {
    const where: Prisma.UserWhereInput = {};
    if (query.role) where.role = query.role;
    if (actor.role === 'ADMIN') {
      if (query.active !== undefined) where.active = query.active;
    } else {
      where.active = true;
    }
    const users = await usersRepository.list(where);
    return users.map(toUserDto);
  },

  /** Opções para os selects do formulário: cobertura (qualquer pessoa ativa) ou aprovador (APPROVER/ADMIN). */
  async options(actor: AuthenticatedUser, purpose: 'cover' | 'approver'): Promise<UserOption[]> {
    const where: Prisma.UserWhereInput = {
      active: true,
      id: { not: actor.id },
      passwordHash: { not: null },
    };
    if (purpose === 'approver') where.role = { in: ['APPROVER', 'ADMIN'] };
    const users = await usersRepository.list(where);
    return users.map(toUserOption).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  },

  async update(actor: AuthenticatedUser, id: string, body: UpdateUserBody): Promise<UserDto> {
    const target = await usersRepository.findById(id);
    if (!target) throw new NotFoundError('Pessoa não encontrada.');

    if (actor.id === id && body.active === false) {
      throw new AppError(409, 'INVALID_STATE', 'Você não pode desativar o próprio acesso.');
    }
    if (actor.id === id && body.role && body.role !== 'ADMIN') {
      throw new AppError(
        409,
        'INVALID_STATE',
        'Você não pode remover o próprio papel de administrador.',
      );
    }
    if (target.role === 'ADMIN' && target.active) {
      const demoting = body.role !== undefined && body.role !== 'ADMIN';
      const deactivating = body.active === false;
      if ((demoting || deactivating) && (await usersRepository.countActiveAdmins()) <= 1) {
        throw new AppError(
          409,
          'INVALID_STATE',
          'É preciso manter ao menos um administrador ativo.',
        );
      }
    }

    const updated = await usersRepository.update(id, body);
    if (body.active === false) await sessionService.revokeAllForUser(id);
    return toUserDto(updated);
  },
};
