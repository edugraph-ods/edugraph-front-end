import Image from 'next/image';
import { FiUser, FiLogOut } from 'react-icons/fi';

interface DashboardHeaderProps {
  onLogout: () => void;
}

export const DashboardHeader = ({ onLogout }: DashboardHeaderProps) => {
  return (
    <header className="flex items-center justify-between p-4 bg-white shadow-sm">
      <div className="flex items-center space-x-2">
        <Image
          src="/logo.jpg"
          alt="EduGraph Logo"
          width={32}
          height={32}
          className="rounded-full"
        />
        <h1 className="text-xl font-bold">EduGraph</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 cursor-pointer group">
          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
            <FiUser className="text-indigo-600" />
          </div>
        </div>
        
        <button 
          onClick={onLogout}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          title="Cerrar sesión"
        >
          <FiLogOut size={20} />
        </button>
      </div>
    </header>
  );
};
