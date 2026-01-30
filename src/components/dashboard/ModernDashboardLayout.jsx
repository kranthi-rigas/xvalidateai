import React, { useEffect, useState, useMemo } from "react";
import { Link, Outlet, Navigate, useLocation } from "react-router-dom";
import Preloader from "@/components/common/Preloader";

export default function ModernDashboardLayout() {
  const location = useLocation();
  const isAuthenticated = localStorage.getItem("access_token");

  // Dynamic header content based on route
  const headerContent = useMemo(() => {
    const path = location.pathname;
    
    if (path === '/dashboard' || path === '/dashboard/') {
      return {
        title: 'Dashboard Overview',
        description: 'Welcome back to your compliance center.'
      };
    }
    
    if (path.startsWith('/dashboard/aicompliance')) {
      return {
        title: 'AI Compliance',
        description: 'Manage and monitor AI tool compliance assessments.'
      };
    }
    
    if (path.startsWith('/dashboard/ailiteracy')) {
      return {
        title: 'AI Literacy',
        description: 'Educational resources and training materials.'
      };
    }
    
    if (path.startsWith('/dashboard/organizations')) {
      return {
        title: 'Organizations',
        description: 'Manage your organization settings and members.'
      };
    }
    
    if (path.startsWith('/dashboard/settings')) {
      return {
        title: 'Settings',
        description: 'Configure your account and preferences.'
      };
    }
    
    if (path.startsWith('/dashboard/pricing')) {
      return {
        title: 'Pricing',
        description: 'View and manage your subscription plan.'
      };
    }
    
    // Default fallback
    return {
      title: 'Dashboard',
      description: 'Welcome back.'
    };
  }, [location.pathname]);

  return (
    <div className="bg-background text-foreground font-sans overflow-hidden h-screen w-full flex">
      {/* Sidebar */}
      <aside id="sidebar" className="w-64 bg-sidebar border-r border-sidebar-border h-full flex flex-col z-20 shadow-lg">
        <div className="h-20 flex items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-shield-halved text-secondary text-sm"></i>
            </div>
            <span className="text-lg font-bold text-primary">XVALIDATE<span className="text-secondary">AI</span></span>
          </div>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          <Link
            to="/dashboard"
            className={`nav-item flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group ${
              location.pathname === '/dashboard' || location.pathname === '/dashboard/'
                ? 'active'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <i className="fa-solid fa-table-columns w-5 h-5 mr-3 group-hover:text-primary transition-colors"></i>
            Dashboard
          </Link>
          
          <Link
            to="/dashboard/aicompliance"
            className={`nav-item flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group ${
              location.pathname.startsWith('/dashboard/aicompliance')
                ? 'active'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <i className="fa-solid fa-shield-virus w-5 h-5 mr-3 group-hover:text-primary transition-colors"></i>
            AI Compliance
          </Link>

          <Link
            to="/dashboard/ailiteracy"
            className={`nav-item flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group ${
              location.pathname.startsWith('/dashboard/ailiteracy')
                ? 'active'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <i className="fa-solid fa-graduation-cap w-5 h-5 mr-3 group-hover:text-primary transition-colors"></i>
            AI Literacy
          </Link>

          <div className="pt-2 pb-1">
            <div className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Management</div>
          </div>

          <Link
            to="/dashboard/organizations"
            className={`nav-item flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group justify-between ${
              location.pathname.startsWith('/dashboard/organizations')
                ? 'active'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <div className="flex items-center">
              <i className="fa-regular fa-building w-5 h-5 mr-3 group-hover:text-primary transition-colors"></i>
              Organization
            </div>
            <i className="fa-solid fa-chevron-right text-xs text-muted-foreground/50"></i>
          </Link>

          <Link
            to="/dashboard/settings"
            className={`nav-item flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group ${
              location.pathname.startsWith('/dashboard/settings')
                ? 'active'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <i className="fa-solid fa-gear w-5 h-5 mr-3 group-hover:text-primary transition-colors"></i>
            Settings
          </Link>

          <Link
            to="/dashboard/pricing"
            className={`nav-item flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group ${
              location.pathname.startsWith('/dashboard/pricing')
                ? 'active'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <i className="fa-solid fa-file-invoice-dollar w-5 h-5 mr-3 group-hover:text-primary transition-colors"></i>
            Pricing
          </Link>
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <Link to="/dashboard/faq" className="nav-item flex items-center px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors group mb-2">
            <i className="fa-regular fa-circle-question w-5 h-5 mr-3 group-hover:text-primary transition-colors"></i>
            FAQ's
          </Link>
          <div className="flex items-center p-3 bg-muted/50 rounded-lg border border-border">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs mr-3">
              RP
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Rakesh P.</p>
              <p className="text-xs text-muted-foreground truncate">Admin</p>
            </div>
            <button className="text-muted-foreground hover:text-foreground">
              <i className="fa-solid fa-arrow-right-from-bracket"></i>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-background relative">
        {/* Header */}
        <header id="header" className="h-20 bg-card border-b border-border flex items-center justify-between px-8 z-10 sticky top-0">
          <div>
            <h1 className="text-2xl font-bold text-primary">{headerContent.title}</h1>
            <p className="text-sm text-muted-foreground">{headerContent.description}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input type="text" placeholder="Search tools, vendors..." className="pl-10 pr-4 py-2 bg-muted border border-transparent focus:border-primary focus:bg-white rounded-lg text-sm w-64 transition-all outline-none" />
              <i className="fa-solid fa-search absolute left-3 top-2.5 text-muted-foreground text-sm"></i>
            </div>
            <button className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-secondary/10 transition-colors relative">
              <i className="fa-regular fa-bell"></i>
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div
          key={location.pathname}
          className="flex-1 overflow-y-auto p-8 pb-20"
        >
          {isAuthenticated ? (
            <Outlet />
          ) : (
            <Navigate to="/auth?mode=login" />
          )}
        </div>
      </main>
    </div>
  );
}

// Made with Bob
