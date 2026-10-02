import type { CreateProjectBody, UpdateProjectBody } from '@nacif/shared';
import type { RequestHandler } from 'express';
import { getInput } from '../../../infra/http/validate';
import { projectsService } from './projects.service';

export const projectsController = {
  list: (async (_req, res) => {
    res.json(await projectsService.list());
  }) as RequestHandler,
  create: (async (_req, res) => {
    const { body } = getInput<CreateProjectBody>(res);
    res.status(201).json(await projectsService.create(body));
  }) as RequestHandler,
  update: (async (req, res) => {
    const { body } = getInput<UpdateProjectBody>(res);
    res.json(await projectsService.update(String(req.params.id), body));
  }) as RequestHandler,
};
