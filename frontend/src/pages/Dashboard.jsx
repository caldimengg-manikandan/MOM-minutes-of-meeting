import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  LogOut, 
  Menu,
  X,
  Users,
  Shield,
  FolderKanban,
  Package,
  Building,
  Upload,
  Settings,
  Folder,
  FileText,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

// import EmployeeMaster from "../pages/EmployeeMaster";
// import EmployeeAccess from "../pages/EmployeeAccess";
// import ProjectMaster from "../pages/ProjectMaster";
// import PartMaster from "../pages/PartMaster";
// import DepartmentMaster from "../pages/DepartmentMaster";
// import UploadTrackers from "../pages/UploadTrackers";
// import SystemSettings from "../pages/SystemSettings";
import MOMModule from "../pages/MOMModule";

// Utility function to manage sidebar modules
const sidebarManager = {
  loadDynamicModules: () => {
    try {
      const saved = localStorage.getItem('dynamic_modules');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading dynamic modules:', error);
      return [];
    }
  }
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeModule, setActiveModule] = useState('employee-master');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [dynamicModules, setDynamicModules] = useState([]);
  const [expandedModules, setExpandedModules] = useState({
    'upload-trackers': false // Default: Upload Trackers is collapsed
  });
  const [selectedFileId, setSelectedFileId] = useState(null); // NEW: Track selected file
  const profileMenuRef = useRef(null);

  // Load dynamic modules on component mount
  useEffect(() => {
    loadDynamicModules();
    
    // Load expanded states from localStorage
    const savedExpandedModules = localStorage.getItem('expanded_modules');
    if (savedExpandedModules) {
      setExpandedModules(JSON.parse(savedExpandedModules));
    }
  }, []);

  // Save expanded states when they change
  useEffect(() => {
    localStorage.setItem('expanded_modules', JSON.stringify(expandedModules));
  }, [expandedModules]);

  const loadDynamicModules = () => {
    const modules = sidebarManager.loadDynamicModules();
    setDynamicModules(modules);
  };

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }));
      setCurrentDate(now.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }));
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for sidebar update events
  useEffect(() => {
    const handleSidebarUpdate = () => {
      loadDynamicModules();
    };

    window.addEventListener('sidebarUpdate', handleSidebarUpdate);
    
    // Listen for storage changes
    const handleStorageChange = (e) => {
      if (e.key === 'dynamic_modules') {
        loadDynamicModules();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('sidebarUpdate', handleSidebarUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const staticModules = [
    // { id: 'employee-master', name: 'Employee Master', component: <EmployeeMaster />, icon: <Users className="h-5 w-5" /> },
    // { id: 'employee-access', name: 'Employee Access', component: <EmployeeAccess />, icon: <Shield className="h-5 w-5" /> },
    // { id: 'project-master', name: 'Project Master', component: <ProjectMaster />, icon: <FolderKanban className="h-5 w-5" /> },
    // { id: 'part-master', name: 'Part Master', component: <PartMaster />, icon: <Package className="h-5 w-5" /> },
    // { id: 'department-master', name: 'Department Master', component: <DepartmentMaster />, icon: <Building className="h-5 w-5" /> },
   //{ id: 'upload-trackers', name: 'Upload Trackers', component: <UploadTrackers selectedFileId={selectedFileId} onClearSelection={() => setSelectedFileId(null)} />, icon: <Upload className="h-5 w-5" />, hasSubmodules: true },
    { id: 'MOMModule', name: 'Minutes Of Meeting', component: <MOMModule />, icon: <Users className="h-5 w-5" /> },
    // { id: 'SystemSettings', name: 'Settings', component: <SystemSettings />, icon: <Settings className="h-5 w-5" /> },
  ];

  const activeModuleData = staticModules.find(m => m.id === activeModule) || staticModules[0];

  const getUserInitial = () =>
    user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U';

  const handleModuleClick = (moduleId) => {
    if (moduleId === 'upload-trackers') {
      // Always set as active module to show its content
      setActiveModule('upload-trackers');
      
      // Clear selected file when clicking on Upload Trackers main module
      setSelectedFileId(null);
      
      // Toggle expansion only if there are projects
      if (dynamicModules.length > 0) {
        setExpandedModules(prev => ({
          ...prev,
          [moduleId]: !prev[moduleId]
        }));
      }
    } else {
      setActiveModule(moduleId);
      // Clear selected file when switching to other modules
      setSelectedFileId(null);
    }
    
    if (isMobile) setSidebarOpen(false);
  };

  const toggleProjectExpansion = (projectId, e) => {
    e.stopPropagation(); // Prevent triggering parent click
    setExpandedModules(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  const renderUploadTrackersModule = () => {
    const isActive = activeModule === 'upload-trackers';
    const isExpanded = expandedModules['upload-trackers'] || false;
    const hasProjects = dynamicModules.length > 0;
    
    return (
      <div key="upload-trackers">
        <button
          onClick={() => handleModuleClick('upload-trackers')}
          className={`w-full flex items-center justify-between rounded-lg transition-all duration-200 ${
            isActive
              ? 'bg-white shadow-lg px-3 py-3 border-l-4 border-[#E30613]'
              : 'hover:bg-gray-200 p-3'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={isActive ? 'text-[#E30613]' : 'text-gray-500'}>
              <Upload className="h-5 w-5" />
            </div>
            <span className="font-semibold text-sm truncate">Upload Trackers</span>
          </div>
          {hasProjects && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandedModules(prev => ({
                  ...prev,
                  'upload-trackers': !prev['upload-trackers']
                }));
              }}
              className={`p-1 rounded hover:bg-gray-300 ${isActive ? 'text-[#E30613]' : 'text-gray-500'}`}
            >
              {isExpanded ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
            </button>
          )}
        </button>
        
        {/* Project submodules */}
        {isExpanded && hasProjects && (
          <div className="ml-6 mt-1 space-y-1">
            {dynamicModules.map(projectModule => renderProjectModule(projectModule))}
          </div>
        )}
      </div>
    );
  };

  const renderProjectModule = (projectModule) => {
    const isExpanded = expandedModules[projectModule.id] || false;
    const hasFiles = projectModule.submodules && projectModule.submodules.length > 0;
    
    return (
      <div key={projectModule.id} className="mt-1">
        <div className="flex items-center justify-between">
          <button
            onClick={(e) => toggleProjectExpansion(projectModule.id, e)}
            className="flex-1 flex items-center space-x-2 rounded-lg p-2 hover:bg-gray-200 transition-all duration-200 text-left"
          >
            <Folder className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-xs truncate">{projectModule.name}</span>
          </button>
          {hasFiles && (
            <button
              onClick={(e) => toggleProjectExpansion(projectModule.id, e)}
              className="p-1 rounded hover:bg-gray-300 text-gray-500 ml-1"
            >
              {isExpanded ? 
                <ChevronDown className="h-3 w-3" /> : 
                <ChevronRight className="h-3 w-3" />
              }
            </button>
          )}
        </div>
        
        {/* File submodules */}
        {isExpanded && hasFiles && (
          <div className="ml-4 mt-1 space-y-1">
            {projectModule.submodules.map(fileModule => renderFileModule(fileModule))}
          </div>
        )}
      </div>
    );
  };

  const renderFileModule = (fileModule) => {
    const isSelected = selectedFileId === fileModule.trackerId;
    
    return (
      <button
        key={fileModule.id}
        onClick={() => handleFileModuleClick(fileModule)}
        className={`w-full flex items-center space-x-2 rounded-lg p-2 transition-all duration-200 ml-2 text-left ${
          isSelected 
            ? 'bg-blue-100 border-l-2 border-blue-500' 
            : 'hover:bg-gray-200'
        }`}
      >
        <FileText className={`h-3 w-3 ${isSelected ? 'text-blue-500' : 'text-gray-500'}`} />
        <span className={`font-normal text-xs truncate ${isSelected ? 'text-blue-600 font-medium' : ''}`}>
          {fileModule.name}
        </span>
      </button>
    );
  };

  const handleFileModuleClick = (fileModule) => {
    console.log('File module clicked:', fileModule);
    
    // Set Upload Trackers as active module
    setActiveModule('upload-trackers');
    
    // Set the selected file ID
    setSelectedFileId(fileModule.trackerId);
    
    // If mobile, close sidebar
    if (isMobile) setSidebarOpen(false);
  };

  // Function to clear selected file (passed to UploadTrackers)
  const handleClearFileSelection = () => {
    setSelectedFileId(null);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Main container with full height and no overflow */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`
          fixed lg:relative inset-y-0 left-0 z-30 w-56 bg-gray-100
          transform transition-transform duration-300 ease-in-out lg:transform-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col border-r border-gray-200
        `}>
          <div className="pt-4 pb-3 px-4 flex justify-center">
            <img className="h-20 w-auto object-contain" />
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {/* Static Modules */}
            {staticModules.map(module => {
              if (module.id === 'upload-trackers') {
                return renderUploadTrackersModule();
              }
              
              return (
                <button
                  key={module.id}
                  onClick={() => handleModuleClick(module.id)}
                  className={`w-full flex items-center space-x-3 rounded-lg transition-all duration-200 ${
                    activeModule === module.id
                      ? 'bg-white shadow-lg px-3 py-3 border-l-4 border-[#E30613]'
                      : 'hover:bg-gray-200 p-3'
                  }`}
                >
                  <div className={activeModule === module.id ? 'text-[#E30613]' : 'text-gray-500'}>
                    {module.icon}
                  </div>
                  <span className="font-semibold text-sm truncate">{module.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area - This should scroll */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Header - Fixed height, no scroll */}
          <header className="hidden lg:block bg-gray-100 border-b flex-shrink-0">
            <div className="px-4 py-4 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">
                {activeModuleData.name}
                {selectedFileId && activeModule === 'upload-trackers' && (
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    • Viewing File
                  </span>
                )}
              </h1>
              <div className="flex items-center">
                <div className="text-right mr-2">
                  <p className="text-lg font-semibold text-gray-900">{currentTime}</p>
                  <p className="text-sm text-gray-600">{currentDate}</p>
                </div>
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center justify-center w-12 h-12 rounded-full bg-[#E30613] text-white font-semibold text-lg"
                  >
                    {getUserInitial()}
                  </button>
                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-semibold text-gray-900 truncate">{user?.full_name || 'User'}</p>
                        <p className="text-sm text-gray-600 capitalize">{user?.role || 'User'}</p>
                      </div>
                      <button
                        onClick={() => { logout(); setProfileMenuOpen(false); }}
                        className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Content Container - This scrolls */}
          <main className="flex-1 min-h-0 overflow-auto p-2">
            <div className="bg-white rounded-lg min-h-full w-full p-2">
              {/* Always pass the selectedFileId and onClearSelection to UploadTrackers */}
              {activeModule === 'upload-trackers' ? (
                <UploadTrackers 
                  selectedFileId={selectedFileId}
                  onClearSelection={handleClearFileSelection}
                />
              ) : (
                activeModuleData.component
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;