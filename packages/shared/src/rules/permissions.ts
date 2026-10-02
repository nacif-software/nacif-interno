import type { Role } from '../enums/role';

export interface ActorLike {
  id: string;
  role: Role;
}

export interface CommunicationLike {
  authorId: string;
  approverId: string;
}

/** Admin decide qualquer comunicação; aprovador só as endereçadas a ele; ninguém decide a própria. */
export function canDecideOn(actor: ActorLike, communication: CommunicationLike): boolean {
  if (actor.id === communication.authorId) return false;
  if (actor.role === 'ADMIN') return true;
  return actor.role === 'APPROVER' && communication.approverId === actor.id;
}

export function canViewCommunication(actor: ActorLike, communication: CommunicationLike): boolean {
  return (
    actor.role === 'ADMIN' ||
    actor.id === communication.authorId ||
    actor.id === communication.approverId
  );
}

export function isAuthor(actor: ActorLike, communication: CommunicationLike): boolean {
  return actor.id === communication.authorId;
}
