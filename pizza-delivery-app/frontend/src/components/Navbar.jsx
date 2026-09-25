import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Navbar = () => {
  const { user, admin, logoutUser, logoutAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (admin) {
      logoutAdmin();
      navigate('/admin/login');
    } else if (user) {
      logoutUser();
      navigate('/login');
    }
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        🍕 Pizza Hub
      </Link>
      <div className="navbar-links">
        {user && (
          <>
            <Link to="/dashboard">Menu</Link>
            <Link to="/orders">My Orders</Link>
            <span className="navbar-user">Hi, {user.name}</span>
            <button className="btn-link" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
        {admin && (
          <>
            <Link to="/admin/dashboard">Inventory</Link>
            <Link to="/admin/orders">Orders</Link>
            <span className="navbar-user">Admin: {admin.name}</span>
            <button className="btn-link" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
        {!user && !admin && (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
