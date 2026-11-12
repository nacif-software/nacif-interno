import type { CommunicationStatus } from '../enums/communication-status';
import type { FlowEventType } from '../enums/flow-event-type';
import type { Role } from '../enums/role';
import { ALLOWED_EMAIL_DOMAIN, LEDGER_NOTE_MIN_CHARS, REJECTION_MIN_CHARS } from '../constants';

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
  // Saldo de dias
  ledgerNoteTooShort: `A nota precisa ter pelo menos ${LEDGER_NOTE_MIN_CHARS} caracteres.`,
  deductionNoteRequired: 'Explique o ajuste dos dias descontados.',
  balanceNegativeHint: 'Saldo negativo: fale com um administrador.',
  balanceAdminOnlyHint: 'Créditos e vendas são registrados por um administrador.',
  coverNotInformed: 'Não informada',
  noProject: 'Sem projeto',
  balanceTitle: 'Saldo de dias',
  balanceMine: 'Meu saldo',
  balanceOf: (name: string) => `Saldo de ${name}`,
  balanceMineLabel: 'Seu saldo',
  balanceCreditsLabel: 'Créditos',
  balanceSalesLabel: 'Vendas',
  balanceCommunicatedInYear: (days: number, year: number) =>
    `${days} ${days === 1 ? 'dia comunicado' : 'dias comunicados'} em ${year}.`,
  balanceAfterThis: (days: number) =>
    `Saldo após esta comunicação: ${days} ${Math.abs(days) === 1 ? 'dia' : 'dias'}.`,
  balanceNegativeWarningTitle: 'Saldo insuficiente',
  balanceNegativeWarning: (days: number) =>
    `Esta comunicação deixa seu saldo em ${days} ${Math.abs(days) === 1 ? 'dia' : 'dias'}. Você pode enviar; o aprovador vai ver isso.`,
  balanceAfterApproval: (before: number, after: number) => `Saldo: ${before} → ${after}`,
  balanceEmptyTitle: 'Nenhum lançamento ainda',
  balanceEmptyBody:
    'Créditos anuais, créditos manuais, vendas e comunicações aprovadas aparecem aqui.',
  balanceEntryAccrual: 'Crédito anual',
  balanceEntryGrant: 'Crédito',
  balanceEntrySale: 'Venda de dias',
  balanceEntryCommunication: 'Indisponibilidade',
  balanceBaseDate: (date: string) => `Data base do crédito: ${date}.`,
  balanceNoBaseDate: 'Sem data base do crédito: nenhum crédito anual automático.',
  adjustDeductionTitle: 'Ajustar dias descontados',
  adjustDeductionDescription: (businessDays: number) =>
    `O período tem ${businessDays} ${businessDays === 1 ? 'dia útil' : 'dias úteis'}. Informe quantos dias serão descontados do saldo e o motivo; a aprovação é registrada com o ajuste.`,
  adjustDeductionNoteLabel: 'Motivo do ajuste',
  adjustDeductionNoteHint: `Mínimo de ${LEDGER_NOTE_MIN_CHARS} caracteres. Fica visível no fluxo da comunicação.`,
  approveWithDays: (days: number) => `Aprovar com ${days} ${days === 1 ? 'dia' : 'dias'}`,
  deductedDaysLabel: 'Dias descontados',
  deductedDaysPending: 'Definidos na aprovação',
  deductedDaysAdjusted: 'Ajustado pelo aprovador',
  deductedDaysNotApplicable: 'Só comunicações aprovadas descontam',
  // Administração · saldos
  balancesTitle: 'Saldos de dias',
  balancesEmpty: 'Nenhuma pessoa cadastrada.',
  creditBaseDateLabel: 'Data base',
  creditBaseDateHint: 'Vazia = sem crédito anual automático.',
  creditBaseDateSaved: (name: string) => `Data base de ${name} salva. Créditos pendentes lançados.`,
  projectsLabel: 'Projetos',
  projectsAdd: '+ adicionar',
  lastEntryLabel: 'Último lançamento',
  grantAction: 'Lançar crédito',
  saleAction: 'Registrar venda',
  grantTitle: 'Lançar crédito',
  saleTitle: 'Registrar venda de dias',
  ledgerDaysLabel: 'Dias',
  ledgerDateLabel: 'Data',
  ledgerNoteLabel: 'Nota',
  ledgerNoteHint: `Mínimo de ${LEDGER_NOTE_MIN_CHARS} caracteres. Aparece no extrato da pessoa.`,
  grantToast: (days: number, name: string) =>
    `Crédito de ${days} ${days === 1 ? 'dia' : 'dias'} lançado para ${name}.`,
  saleToast: (days: number, name: string) =>
    `Venda de ${days} ${days === 1 ? 'dia' : 'dias'} registrada para ${name}.`,
  daysPerYearHint:
    'Lançado automaticamente todo dia às 00:00 de Brasília, no aniversário da data base.',
} as const;
