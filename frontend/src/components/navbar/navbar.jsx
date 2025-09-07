import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {
  ShoppingCart,
  User,
  LogOut,
  MapPin,
  Menu,
  X,
  Search,
  Clock
} from 'lucide-react';
import './navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { getItemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const itemCount = getItemCount();

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setShowUserMenu(false);
  };

  const isActive = (path) => location.pathname === path;

  const onAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to={isAuthenticated ? '/' : '/login'} className="navbar-logo">
          <div className="logo-icon">🍽️</div>
          <span>Rotino</span>
        </Link>

        {/* Location (Desktop) */}
        {!onAuthPage && (
          <div className="navbar-location">
            <MapPin size={18} />
            <span>Mumbai, Maharashtra</span>
          </div>
        )}

        {/* Search Bar (Desktop) */}
        {!onAuthPage && (
          <div className="navbar-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search for restaurants, food..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.target.value) {
                  navigate(`/restaurants?search=${encodeURIComponent(e.target.value)}`);
                }
              }}
            />
          </div>
        )}

        {/* Desktop Navigation */}
        {!onAuthPage && (
          <div className="navbar-nav">
            {isAuthenticated && (
              <Link
                to="/restaurants"
                className={`nav-link ${isActive('/restaurants') ? 'active' : ''}`}
              >
                Restaurants
              </Link>
            )}

            {isAuthenticated && (
              <Link
                to="/orders"
                className={`nav-link ${isActive('/orders') ? 'active' : ''}`}
              >
                <Clock size={18} />
                Orders
              </Link>
            )}

            {/* Cart */}
            <Link to="/cart" className="cart-link">
              <div className="cart-icon">
                <ShoppingCart size={20} />
                {itemCount > 0 && (
                  <span className="cart-badge">{itemCount}</span>
                )}
              </div>
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="user-menu">
                <button
                  className="user-button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <User size={20} />
                  <span>{user?.name?.split(' ')[0]}</span>
                </button>

                {showUserMenu && (
                  <div className="user-dropdown">
                    <Link
                      to="/profile"
                      className="dropdown-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User size={16} />
                      Profile
                    </Link>
                    <Link
                      to="/orders"
                      className="dropdown-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Clock size={16} />
                      My Orders
                    </Link>
                    <button
                      className="dropdown-item logout"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn-secondary">Login</Link>
                <Link to="/register" className="btn-primary">Sign Up</Link>
              </div>
            )}
          </div>
        )}

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && !onAuthPage && (
        <div className="mobile-menu">
          {/* Mobile Search */}
          <div className="mobile-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search for restaurants, food..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.target.value) {
                  navigate(`/restaurants?search=${encodeURIComponent(e.target.value)}`);
                  setIsMenuOpen(false);
                }
              }}
            />
          </div>

          {/* Mobile Location */}
          <div className="mobile-location">
            <MapPin size={18} />
            <span>Mumbai, Maharashtra</span>
          </div>

          {/* Mobile Navigation Links */}
          <div className="mobile-nav">
            {isAuthenticated && (
              <Link
                to="/restaurants"
                className={`mobile-nav-link ${isActive('/restaurants') ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Restaurants
              </Link>
            )}

            {isAuthenticated && (
              <>
                <Link
                  to="/orders"
                  className={`mobile-nav-link ${isActive('/orders') ? 'active' : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Clock size={18} />
                  My Orders
                </Link>
                <Link
                  to="/profile"
                  className={`mobile-nav-link ${isActive('/profile') ? 'active' : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User size={18} />
                  Profile
                </Link>
              </>
            )}

            <Link
              to="/cart"
              className="mobile-nav-link"
              onClick={() => setIsMenuOpen(false)}
            >
              <ShoppingCart size={18} />
              Cart {itemCount > 0 && `(${itemCount})`}
            </Link>

            {isAuthenticated ? (
              <button
                className="mobile-nav-link logout"
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
              >
                <LogOut size={18} />
                Logout
              </button>
            ) : (
              <div className="mobile-auth">
                <Link
                  to="/login"
                  className="btn-secondary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
