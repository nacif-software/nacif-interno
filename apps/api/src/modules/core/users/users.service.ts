import type { UpdateUserBody, UserDto, UserOption, UsersListQuery } from '@nacif/shared';
import { and, eq, inArray, isNotNull, ne, type SQL } from 'drizzle-orm';
import { users } from '../../../db/schema';
import type { AuthenticatedUser } from '../../../infra/http/context';
import { AppError, NotFoundError } from '../../../infra/http/errors';
import { sessionService } from '../auth/session.service';
import { toUserDto, toUserOption } from './user.mapper';
import { usersRepository } from './users.repository';

export const usersService = {
  async list(actor: AuthenticatedUser, query: UsersListQuery): Promise<UserDto[]> {
    const conditions: SQL[] = [];
    if (query.role) conditions.push(eq(users.role, query.role));
    if (actor.role === 'ADMIN') {
      if (query.active !== undefined) conditions.push(eq(users.active, query.active));
    } else {
      conditions.push(eq(users.active, true));
    }
    const rows = await usersRepository.list(and(...conditions));
    return rows.map(toUserDto);
  },

  /** Opções para os selects do formulário: cobertura (qualquer pessoa ativa) ou aprovador (APPROVER/ADMIN). */
  async options(actor: AuthenticatedUser, purpose: 'cover' | 'approver'): Promise<UserOption[]> {
    const conditions: SQL[] = [
      eq(users.active, true),
      ne(users.id, actor.id),
      isNotNull(users.passwordHash),
    ];
    if (purpose === 'approver') conditions.push(inArray(users.role, ['APPROVER', 'ADMIN']));
    const rows = await usersRepository.list(and(...conditions));
    return rows.map(toUserOption).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
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
