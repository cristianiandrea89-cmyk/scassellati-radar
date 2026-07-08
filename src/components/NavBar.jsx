import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Map, Table, PlusCircle, Tag } from 'lucide-react'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/nuova-macchina', label: 'Macchina', icon: PlusCircle },
  { to: '/mappa', label: 'Mappa', icon: Map },
  { to: '/lista', label: 'Lista', icon: Table },
]

export default function NavBar() {
  return (
    <nav className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-dgray px-4 py-4 sm:px-5">
      <div className="font-heading font-extrabold uppercase tracking-wide text-offwhite text-lg whitespace-nowrap">
        <span className="sm:hidden">Radar</span>
        <span className="hidden sm:inline">Scassellati Radar</span>
      </div>
      <div className="flex items-center gap-5 sm:gap-6 overflow-x-auto">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                isActive ? 'text-bronze' : 'text-gray hover:text-bronze'
              }`
            }
          >
            <Icon className="w-5 h-5 sm:w-4 sm:h-4" strokeWidth={1.5} />
            <span className="hidden sm:inline">{label}</span>
          </NavLink>
        ))}
        <NavLink
          to="/marchi"
          className={({ isActive }) =>
            `flex items-center gap-1 text-xs pl-3 ml-1 border-l border-gray/30 whitespace-nowrap transition-colors ${
              isActive ? 'text-bronze' : 'text-gray/60 hover:text-bronze'
            }`
          }
        >
          <Tag className="w-4 h-4 sm:w-[13px] sm:h-[13px]" strokeWidth={1.5} />
          <span className="hidden sm:inline">Marchi</span>
        </NavLink>
      </div>
    </nav>
  )
}
