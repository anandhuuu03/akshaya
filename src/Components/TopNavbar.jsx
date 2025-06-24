import { Link, useLocation } from 'react-router-dom';

const TopNavbar = () => {
  const location = useLocation();
  const linkStyle = (path) =>
    `px-4 py-2 rounded-md text-sm font-medium ${
      location.pathname === path
        ? 'bg-blue-600 text-white'
        : 'text-gray-700 hover:bg-blue-100'
    }`;

  return (
    <div className="w-full bg-white shadow sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <h1 className="text-lg font-bold text-blue-700">💼 Akshaya Finance Tracker</h1>
        <nav className="flex gap-2">
          <Link to="/" className={linkStyle('/')}>
            Home
          </Link>
          <Link to="/history" className={linkStyle('/history')}>
            Edit
          </Link>
          <Link to="/report" className={linkStyle('/report')}>
            Daily
          </Link>
          <Link to="/weekly" className={linkStyle('/weekly')}>
            Weekly
          </Link>
          <Link to="/summary" className={linkStyle('/summary')}>
            Monthly
          </Link>
          
        </nav>
      </div>
    </div>
  );
};

export default TopNavbar;
