import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const TopNav = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.name);
      } catch (e) {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10 w-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => navigate('/groups')}
          >
            <div className="bg-[#4f46e5] w-6 h-6 flex-shrink-0"></div>
            <span className="font-bold text-gray-800 tracking-wider uppercase">Spreetail Split</span>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                 {/* Dummy avatar using dicebear or text */}
                 <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${userName || 'User'}`} alt="avatar" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-sm text-gray-800 uppercase">{userName || 'User'}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="text-xs font-semibold uppercase tracking-wider text-gray-800 hover:text-[#4f46e5] transition-colors flex items-center border border-gray-300 px-3 py-1.5 rounded-sm"
            >
              [→ LOG OUT
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
};
