import { NavLink } from 'react-router-dom';
import { UserButton } from '@clerk/react';
import EnvironmentSwitcher from './EnvironmentSwitcher';
import '../styles/AppNav.css';
import '../styles/App.css';

export default function AppNav() {
  return (
    <nav className="app-nav">
      <div className="app-nav__brand">
        <h1 className="app-nav__title">Stigg Example Implementation</h1>
      </div>
      <div className="app-nav__links">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            isActive ? 'app-nav__link app-nav__link--active' : 'app-nav__link'
          }
        >
          Analytics
        </NavLink>
        <EnvironmentSwitcher />
        <div className="app-nav__user">
          <UserButton />
        </div>
      </div>
    </nav>
  );
}
