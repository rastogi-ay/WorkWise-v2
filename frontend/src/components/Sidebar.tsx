import { NavLink } from 'react-router-dom';
import { UserButton } from '@clerk/react';
import EnvironmentSwitcher from './EnvironmentSwitcher';
import { useTheme } from '../ThemeContext';
import { ChartIcon, MegaphoneIcon, MailIcon, SunIcon, MoonIcon } from '../extras/icons';
import '../styles/Sidebar.css';

const NAV_ITEMS = [
  { to: '/analytics', label: 'Analytics', Icon: ChartIcon },
  { to: '/campaigns', label: 'Campaigns', Icon: MegaphoneIcon },
  { to: '/sequences', label: 'Sequences', Icon: MailIcon },
];

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__logo">W</span>
        <div className="sidebar__brand-text">
          <span className="sidebar__title">WorkWise</span>
          <span className="sidebar__subtitle">AI</span>
        </div>
      </div>

      <nav className="sidebar__nav">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
            }
          >
            <span className="sidebar__link-icon">
              <Icon size={18} />
            </span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <EnvironmentSwitcher />
        <button
          type="button"
          className="sidebar__theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle color theme"
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
        <div className="sidebar__user">
          <UserButton />
        </div>
      </div>
    </aside>
  );
}
