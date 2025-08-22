import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getDisplayName, getDisplayInitial } from '../../utils/userUtils';
import { 
  Home, 
  BookOpen, 
  MessageSquare, 
  HelpCircle, 
  Map, 
  Settings, 
  LogOut,
  X,
  User,
  Lightbulb
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose, user }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/simplify', icon: BookOpen, label: 'Content Simplifier' },
    { path: '/chat', icon: MessageSquare, label: 'Study Chat' },
    { path: '/quiz', icon: HelpCircle, label: 'Quiz Builder' },
    { path: '/recommendations', icon: Lightbulb, label: 'Learning Recommendations' },
    // { path: '/progress', icon: HelpCircle, label: 'Progress Tracker' },
    // { path: '/learning-path', icon: Map, label: 'Learning Path' },
    { path: '/profile', icon: Settings, label: 'Profile Settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient">EduQuest</span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-600">
                  {getDisplayInitial(user)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {getDisplayName(user)}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                    ${isActive 
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                  onClick={onClose}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar; 