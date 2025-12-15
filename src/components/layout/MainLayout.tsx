import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const MainLayout = () => {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 transition-all duration-300">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
