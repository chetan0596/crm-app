import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { clearPermissions, clearUserData } from "../utils/permissions";
import { clearAuthTokens } from "../utils/auth";
import SidebarNavigation from "../components/SidebarNavigation";
import UserDropdown from "../components/UserDropdown";

export default function AdminLayout() {

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Initialize sidebar to expanded state (default)
    document.body.classList.remove('sidebar-open');
  }, []);

  const logout = () => {
    clearAuthTokens();
    clearPermissions();
    clearUserData();
    window.location.href = "/login";
  };

  const toggleSidebar = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.innerWidth < 992) {
      // Mobile/tablet: slide-in overlay via body.sidebar-open
      const opened = document.body.classList.toggle('sidebar-open');
      setSidebarOpen(opened);
    } else {
      // Desktop: collapse to mini sidebar
      document.body.classList.toggle('sidebar-collapse');
    }
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    // Close sidebar only on mobile (< 992px)
    if (window.innerWidth < 992) {
      document.body.classList.add('sidebar-collapse');
      document.body.classList.remove('sidebar-open');
    }
  };

  // Close mobile sidebar when clicking on the backdrop
  useEffect(() => {
    const handleBackdropClick = (e) => {
      if (
        window.innerWidth < 992 &&
        document.body.classList.contains('sidebar-open') &&
        !e.target.closest('.main-sidebar') &&
        !e.target.closest('[data-widget="pushmenu"]')
      ) {
        document.body.classList.remove('sidebar-open');
        setSidebarOpen(false);
      }
    };
    document.addEventListener('click', handleBackdropClick);
    return () => document.removeEventListener('click', handleBackdropClick);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className={`wrapper sidebar-mini${sidebarOpen ? " sidebar-open" : ""}`}>

      {/* Navbar */}
      <nav className="main-header navbar navbar-expand navbar-white navbar-light">
        <ul className="navbar-nav">

          {/* Toggle */}
          <li className="nav-item">
            <a className="nav-link" href="#" onClick={toggleSidebar} aria-label="Toggle sidebar">
              <i className="fas fa-bars"></i>
            </a>
          </li>

        </ul>

        {/* Right side */}
        <ul className="navbar-nav ml-auto align-items-center">
          <UserDropdown logout={logout} />
        </ul>
      </nav>


      {/* Sidebar */}
      <aside className="main-sidebar sidebar-dark-primary elevation-4">

        <a href="#" className="brand-link">
          <span className="brand-text font-weight-light ms-2">
            CRM Admin
          </span>
        </a>

        <div className="sidebar">
          <SidebarNavigation closeSidebar={closeSidebar} />
        </div>

      </aside>

      {/* Content */}
      <div className="content-wrapper">

        <section className="content pt-3">
          <div className="container-fluid">

            {/* 🔥 Important */}
            <Outlet />

          </div>
        </section>

      </div>

    </div>
  );
}
