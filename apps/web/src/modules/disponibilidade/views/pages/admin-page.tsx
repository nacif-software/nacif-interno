import { useState } from 'react';
import { useProjects } from '@/modules/core/controllers/use-projects';
import { useUserOptions, useUsers } from '@/modules/core/controllers/use-users';
import { InviteForm } from '@/modules/core/views/components/invite-form';
import { PeopleTable } from '@/modules/core/views/components/people-table';
import { ProjectsTable } from '@/modules/core/views/components/projects-table';
import { SetupLinkModal } from '@/modules/core/views/components/setup-link-modal';
import { Card, SkeletonCard } from '@/ui';
import { useSettings } from '../../controllers/use-settings';
import { SettingsCard } from '../components/settings-card';

export function AdminPage() {
  const users = useUsers();
  const projects = useProjects();
  const approvers = useUserOptions('approver');
  const settings = useSettings();
  const [setup, setSetup] = useState<{ link: string; email: string } | null>(null);

  const loading = users.isPending || projects.isPending || settings.isPending;
  return (
    <div className="flex flex-col gap-7 xl:flex-row">
      <div className="flex flex-1 flex-col gap-7">
        <section className="flex flex-col gap-5">
          <h1 className="text-section-title md:text-screen-title">Pessoas</h1>
          {loading ? (
            <SkeletonCard />
          ) : (
            <Card className="overflow-hidden">
              <PeopleTable
                users={users.data ?? []}
                projects={projects.data ?? []}
                onSetupLink={(link, email) => setSetup({ link, email })}
              />
              <InviteForm onInvited={(link, email) => setSetup({ link, email })} />
            </Card>
          )}
        </section>
        <section className="flex flex-col gap-5">
          <h2 className="text-section-title">Projetos</h2>
          {projects.isPending ? (
            <SkeletonCard />
          ) : (
            <Card className="overflow-hidden">
              <ProjectsTable projects={projects.data ?? []} approvers={approvers.data ?? []} />
            </Card>
          )}
        </section>
      </div>
      <section className="flex flex-col gap-5 xl:w-[420px] xl:shrink-0">
        <h2 className="text-section-title md:text-screen-title">Configurações</h2>
        {settings.data ? (
          <SettingsCard
            key={JSON.stringify(settings.data)}
            settings={settings.data}
            approvers={approvers.data ?? []}
          />
        ) : (
          <SkeletonCard />
        )}
      </section>
      <SetupLinkModal
        link={setup?.link ?? null}
        email={setup?.email ?? null}
        onClose={() => setSetup(null)}
      />
    </div>
  );
}
