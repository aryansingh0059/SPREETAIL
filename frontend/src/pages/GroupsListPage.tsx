import React, { useEffect, useState } from 'react';
import { TopNav } from '../components/TopNav';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { Plus, User } from 'lucide-react';

export const GroupsListPage = () => {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await api.get('/groups');
        setGroups(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  const handleCreateGroup = async () => {
    const name = prompt('Enter the name for your new group:');
    if (!name || name.trim() === '') return;

    try {
      await api.post('/groups', {
        name: name.trim(),
        baseCurrencyCode: 'INR'
      });
      // Refetch groups
      const res = await api.get('/groups');
      setGroups(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to create group');
    }
  };

  return (
    <div className="min-h-screen bg-white font-['Inter'] flex flex-col">
      <TopNav />
      
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Header */}
        <div className="flex justify-between items-end border-b border-gray-200 pb-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wider mb-1">Your Groups</h1>
            <p className="text-sm text-gray-500">Manage shared budgets and settle up debts.</p>
          </div>
          <button 
            onClick={handleCreateGroup}
            className="bg-[#4f46e5] text-white px-4 py-2 font-bold text-xs uppercase tracking-wider hover:bg-[#4338ca] transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" /> New Group
          </button>
        </div>

        {loading ? (
          <div className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Loading groups...</div>
        ) : groups.length === 0 ? (
          <div className="text-gray-500 text-sm">No groups found. Create one to get started!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((g) => (
              <div 
                key={g.id} 
                onClick={() => navigate(`/groups/${g.id}`)}
                className="border border-gray-200 p-6 hover:shadow-md cursor-pointer transition-all bg-white flex flex-col"
              >
                <div className="flex justify-between items-start mb-6">
                  <span className="bg-gray-100 text-gray-800 text-[10px] font-bold px-2 py-1 uppercase tracking-wider">Home</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Role: {g.role || 'MEMBER'}</span>
                </div>
                
                <h2 className="text-lg font-bold text-gray-900 mb-6 uppercase tracking-wider">{g.name}</h2>
                
                <div className="flex items-center text-xs text-gray-400 mt-auto pt-4 border-t border-gray-100">
                  <User className="w-3 h-3 mr-1.5" />
                  <span>Created by: Aisha</span> {/* Demo hardcode */}
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
};
