import type { ApiModule } from '../infra/http/module';
import { coreModule } from './core';
import { disponibilidadeModule } from './disponibilidade';

/** Ordem importa só para o registro de rotas; o core vem primeiro. */
export const modules: readonly ApiModule[] = [coreModule, disponibilidadeModule];
