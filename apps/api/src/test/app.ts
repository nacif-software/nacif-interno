import supertest from 'supertest';
import { createApp } from '../app';

export function buildTestApp() {
  const app = createApp();
  return supertest.agent(app);
}

export type TestAgent = ReturnType<typeof buildTestApp>;
