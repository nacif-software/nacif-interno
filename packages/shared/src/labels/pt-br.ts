import type { CommunicationStatus } from '../enums/communication-status';
import type { FlowEventType } from '../enums/flow-event-type';
import type { Role } from '../enums/role';
import { ALLOWED_EMAIL_DOMAIN, REJECTION_MIN_CHARS } from '../constants';

/** Rótulos de status como aparecem em badges. */
export const STATUS_LABEL: Record<CommunicationStatus, string> = {
  IN_REVIEW: 'Em análise',
  APPROVED: 'Aprovada',
  REJECTED: 'Recusada',
  CANCELLED: 'Cancelada',
};

/** Rótulos de status em texto corrido (minúsculo). */
export const STATUS_LABEL_LOWER: Record<CommunicationStatus, string> = {
  IN_REVIEW: 'em análise',
  APPROVED: 'aprovada',
  REJECTED: 'recusada',
  CANCELLED: 'cancelada',
};

export const STATUS_LABEL_PLURAL: Record<CommunicationStatus, string> = {
  IN_REVIEW: 'Em análise',
  APPROVED: 'Aprovadas',
  REJECTED: 'Recusadas',
  CANCELLED: 'Canceladas',
};

export const ROLE_LABEL: Record<Role, string> = {
  MEMBER: 'Membro',
  APPROVER: 'Aprovador',
  ADMIN: 'Administrador',
};

export const FLOW_EVENT_LABEL: Record<FlowEventType, string> = {
  SUBMITTED: 'Enviada',
  IN_REVIEW: 'Em análise',
  DECISION: 'Decisão',
  CANCELLED: 'Cancelada',
  EDITED: 'Período editado',
  DECISION_REVERTED: 'Decisão desfeita',
};

export const MESSAGES = {
  /** Tela de login do portal: geral, não fala de um serviço específico (ADR 0010). */
  portalTitle: 'Serviços internos',
  portalLoginDescription: 'Acesse os serviços e recursos internos da Nacif.',
  domainNotAllowedTitle: 'Domínio não autorizado',
  domainNotAllowed: (email: string) =>
    `A conta ${email} não pertence ao domínio ${ALLOWED_EMAIL_DOMAIN}. Entre com seu e-mail Nacif.`,
  invalidCredentialsTitle: 'E-mail ou senha incorretos',
  invalidCredentials: 'Verifique os dados informados e tente novamente.',
  userInactiveTitle: 'Acesso desativado',
  userInactive: 'Sua conta está desativada. Procure um administrador.',
  onlyNacifAccounts: `Apenas contas @${ALLOWED_EMAIL_DOMAIN} têm acesso.`,
  onlyNacifAccountsLong: `Apenas contas @${ALLOWED_EMAIL_DOMAIN} têm acesso. Se você é prestador do time e não consegue entrar, procure um administrador.`,
  rejectionTooShort: `Informe uma justificativa com ao menos ${REJECTION_MIN_CHARS} caracteres.`,
  rejectionHint: `Mínimo de ${REJECTION_MIN_CHARS} caracteres.`,
  minimumNotice: (days: number) => `O início deve ser pelo menos ${days} dias após hoje.`,
  minimumNoticeConfigured: (days: number) => `Antecedência mínima configurada: ${days} dias.`,
  heroSubtitle: (days: number) =>
    `Comunique o período com pelo menos ${days} dias de antecedência.`,
  endBeforeStart: 'A data final deve ser igual ou posterior à data inicial.',
  noBusinessDays: 'O período precisa incluir ao menos um dia útil.',
  startInPast: 'A data inicial não pode estar no passado.',
  coverRequired: 'Informe quem cobre suas entregas.',
  approverRequired: 'Informe o aprovador.',
  coverIsSelf: 'A cobertura precisa ser outra pessoa do time.',
  approverIsSelf: 'O aprovador precisa ser outra pessoa.',
  invalidEmail: 'Informe um e-mail válido.',
  passwordTooShort: 'A senha precisa ter ao menos 8 caracteres.',
  nameRequired: 'Informe o nome.',
  sentTo: (approverName: string) => `Comunicação enviada a ${approverName}.`,
  rejectedToast: 'Comunicação recusada. O autor foi notificado.',
  approvedToast: 'Comunicação aprovada.',
  batchApprovedToast: (count: number) =>
    count === 1 ? '1 comunicação aprovada em lote.' : `${count} comunicações aprovadas em lote.`,
  batchUndoneToast: (count: number) =>
    count === 1 ? '1 aprovação desfeita.' : `${count} aprovações desfeitas.`,
  cancelledToast: 'Comunicação cancelada.',
  periodUpdatedToast: 'Período atualizado e reencaminhado ao aprovador.',
  settingsSavedToast: 'Configurações salvas.',
  inviteSentToast: 'Convite criado.',
  /** Modal do link de definição de senha: "Envie este link para <e-mail em mono>. <corpo>". */
  setupLinkSendTo: 'Envie este link para',
  setupLinkInviteTitle: 'Convite criado',
  setupLinkInviteBody: 'Ele vale por 7 dias e define nome e senha no primeiro acesso.',
  setupLinkResetTitle: 'Link de redefinição criado',
  setupLinkResetBody:
    'Ele vale por 7 dias, só pode ser usado uma vez e troca apenas a senha. A senha atual continua valendo até a redefinição.',
  resetPasswordAction: 'Redefinir senha',
  setPasswordTitle: 'Defina sua senha',
  resetPasswordTitle: 'Redefina sua senha',
  resetPasswordNoPassword: 'Esta pessoa ainda não definiu a senha. Gere um novo convite.',
  resetPasswordInactive: 'Esta pessoa está desativada.',
  emptyQueueTitle: 'Nada em análise',
  emptyQueueBody:
    'Nenhuma comunicação aguarda sua decisão. Novas aparecem aqui assim que enviadas.',
  emptyDashboardTitle: 'Nenhuma comunicação enviada',
  emptyDashboardBody:
    'Quando você precisar se ausentar, comunique o período aqui. O aprovador do seu projeto recebe e decide.',
  decisionPending: 'Pendente. Quem decidir e a justificativa aparecem aqui.',
  cancelModalBody: (range: string) =>
    `O período ${range} deixa de constar no calendário do time. A ação não pode ser desfeita.`,
  conflictTitle: (projectName: string) => `Conflito no projeto ${projectName}`,
  conflictBody: (name: string, range: string) =>
    `${name} já tem indisponibilidade aprovada de ${range} no mesmo projeto. Você pode seguir, mas o aprovador verá esse conflito.`,
  conflictBodyShort: (name: string, range: string) => `${name} está indisponível de ${range}.`,
  conflictFlagged: (name: string, range: string) => `Conflito sinalizado com ${name} (${range}).`,
  defaultApproverHint: 'Aprovador padrão do seu projeto.',
  defaultApproversHint: 'Usados quando o membro do time não escolhe um aprovador.',
} as const;
