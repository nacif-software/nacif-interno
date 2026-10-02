import type { TestAgent } from './app';
import { TEST_PASSWORD } from './factories';

/** Faz login com o agente (cookie fica no agente) e devolve o usuário de sessão. */
export async function loginAs(agent: TestAgent, email: string, password: string = TEST_PASSWORD) {
  const res = await agent.post('/api/auth/login').send({ email, password });
  if (res.status !== 200)
    throw new Error(`Login falhou para ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body as { user: { id: string; name: string } };
}
