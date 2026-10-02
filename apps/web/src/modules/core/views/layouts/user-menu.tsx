import { useNavigate } from 'react-router';
import { Avatar, DropdownMenu, MenuItem } from '@/ui';
import { useCurrentUser, useLogout } from '../../controllers/use-session';

export function UserMenu() {
  const user = useCurrentUser();
  const logout = useLogout();
  const navigate = useNavigate();
  return (
    <DropdownMenu
      trigger={({ open, ...props }) => (
        <button
          type="button"
          {...props}
          className="flex cursor-pointer items-center gap-3 rounded-badge py-1 pr-1 pl-2 hover:bg-canvas"
          aria-label={`Menu de ${user.name}`}
          aria-haspopup="menu"
        >
          <span className="hidden text-[14px] text-ink-muted md:inline">{user.name}</span>
          <Avatar
            initials={user.initials}
            name={user.name}
            size={34}
            className="max-md:size-[30px] max-md:text-[12px]"
          />
          <span
            aria-hidden
            className={`hidden border-x-4 border-t-[5px] border-x-transparent border-t-ink-muted md:block ${open ? 'rotate-180' : ''}`}
          />
        </button>
      )}
    >
      <div className="flex flex-col gap-0.5 px-3 py-2">
        <span className="text-[15px] font-semibold text-ink">{user.name}</span>
        <span className="font-mono text-[13px] text-ink-muted">{user.email}</span>
      </div>
      <div className="my-1 border-t border-line" />
      <MenuItem onClick={() => void navigate('/')}>Todos os serviços</MenuItem>
      <MenuItem
        onClick={() => {
          logout.mutate(undefined, { onSettled: () => void navigate('/login', { replace: true }) });
        }}
      >
        Sair
      </MenuItem>
    </DropdownMenu>
  );
}
