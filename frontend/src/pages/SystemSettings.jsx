import React, { useState, useEffect } from 'react';
import { 
  Settings, Bell, Shield, Database, 
  X, Check, RefreshCw, Globe, Clock,
  Eye, EyeOff, Lock, Download, Upload, 
  Trash2, Edit, Plus, Search, ChevronDown, 
  Key, Briefcase, Folder, Building, Mail, 
  MessageSquare, AlertCircle, Zap, Calendar, 
  DollarSign, FileText, BarChart, ShieldCheck, 
  UserCheck, Columns, GitBranch, GitMerge,
  GitCommit, Package, Cloud, Cpu, Server,
  Send, Database as DatabaseIcon, HardDrive,
  Users as UsersIcon, Layout, Palette,
  Target, KeyRound, Monitor, UserPlus,
  Hash, GitPullRequest, QrCode, DatabaseBackup,
  HardDrive as HardDriveIcon, Barcode,
  CheckCircle, XCircle
} from 'lucide-react';

const SystemSettings = () => {
  
  // Simplified system settings configuration
  const initialSettings = [
    // General Settings
    { 
      id: 'app_name', 
      category: 'General',
      label: 'Application Name', 
      value: 'Employee Portal',
      type: 'text',
      description: 'Display name of the application',
      editable: true,
      required: true,
      icon: 'Layout'
    },
    { 
      id: 'timezone', 
      category: 'General',
      label: 'Time Zone', 
      value: 'UTC',
      type: 'select',
      options: ['UTC', 'EST', 'PST', 'IST', 'GMT'],
      description: 'Default time zone for the system',
      editable: true,
      required: true,
      icon: 'Globe'
    },
    { 
      id: 'date_format', 
      category: 'General',
      label: 'Date Format', 
      value: 'MM/DD/YYYY',
      type: 'select',
      options: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'],
      description: 'Default date display format',
      editable: true,
      required: true,
      icon: 'Calendar'
    },

    // Security Settings
    { 
      id: 'session_timeout', 
      category: 'Security',
      label: 'Session Timeout', 
      value: '30',
      type: 'number',
      unit: 'minutes',
      description: 'User session timeout duration',
      editable: true,
      required: true,
      icon: 'Clock'
    },
    { 
      id: 'password_expiry', 
      category: 'Security',
      label: 'Password Expiry', 
      value: '90',
      type: 'number',
      unit: 'days',
      description: 'Password expiry duration',
      editable: true,
      required: true,
      icon: 'Shield'
    },
    { 
      id: 'two_factor_auth', 
      category: 'Security',
      label: 'Two-Factor Authentication', 
      value: false,
      type: 'toggle',
      description: 'Enable 2FA for all users',
      editable: true,
      required: false,
      icon: 'ShieldCheck'
    },

    // Notification Settings
    { 
      id: 'email_notifications', 
      category: 'Notifications',
      label: 'Email Notifications', 
      value: true,
      type: 'toggle',
      description: 'Enable email notifications',
      editable: true,
      required: false,
      icon: 'Mail'
    },
    { 
      id: 'push_notifications', 
      category: 'Notifications',
      label: 'Push Notifications', 
      value: false,
      type: 'toggle',
      description: 'Enable push notifications',
      editable: true,
      required: false,
      icon: 'Bell'
    },

    // Employee Master Related Settings
    { 
      id: 'employee_auto_id', 
      category: 'Employee Management',
      label: 'Auto-generate Employee ID', 
      value: true,
      type: 'toggle',
      description: 'Automatically generate unique employee IDs',
      editable: true,
      required: false,
      icon: 'UserPlus'
    },
    { 
      id: 'employee_columns', 
      category: 'Employee Management',
      label: 'Customizable Columns', 
      value: true,
      type: 'toggle',
      description: 'Allow adding custom columns to employee table',
      editable: true,
      required: false,
      icon: 'Columns'
    },

    // Department Master Settings
    { 
      id: 'department_hierarchy', 
      category: 'Department Management',
      label: 'Department Hierarchy', 
      value: true,
      type: 'toggle',
      description: 'Enable hierarchical department structure',
      editable: true,
      required: false,
      icon: 'GitBranch'
    },

    // Project Master Settings
    { 
      id: 'project_auto_number', 
      category: 'Project Management',
      label: 'Auto Project Numbering', 
      value: true,
      type: 'toggle',
      description: 'Automatically generate project numbers',
      editable: true,
      required: false,
      icon: 'GitCommit'
    },

    // Part Master Settings
    { 
      id: 'part_barcode', 
      category: 'Part Management',
      label: 'Barcode Generation', 
      value: true,
      type: 'toggle',
      description: 'Generate barcodes for parts automatically',
      editable: true,
      required: false,
      icon: 'QrCode'
    },

    // Upload Trackers Settings
    { 
      id: 'auto_file_naming', 
      category: 'File Management',
      label: 'Auto File Naming', 
      value: true,
      type: 'toggle',
      description: 'Automatically rename uploaded files',
      editable: true,
      required: false,
      icon: 'FileText'
    },
    { 
      id: 'max_file_size', 
      category: 'File Management',
      label: 'Max File Size', 
      value: '10',
      type: 'number',
      unit: 'MB',
      description: 'Maximum file upload size',
      editable: true,
      required: true,
      icon: 'HardDrive'
    },

    // Backup Settings
    { 
      id: 'auto_backup', 
      category: 'Backup',
      label: 'Auto Backup', 
      value: true,
      type: 'toggle',
      description: 'Enable automatic daily backups',
      editable: true,
      required: false,
      icon: 'DatabaseBackup'
    },
  ];

  // Icon mapping - only using imported icons
  const iconComponents = {
    Layout, Globe, Calendar, Shield, Clock,
    ShieldCheck, Mail, Bell, UserPlus, Columns,
    GitBranch, GitCommit, QrCode, FileText, HardDrive,
    DatabaseBackup, Settings, Key, Briefcase, Folder,
    Building, AlertCircle, DollarSign, BarChart, Lock,
    Eye, EyeOff, Download, Upload, Trash2, Edit,
    Plus, Search, ChevronDown, MessageSquare, Zap,
    Package, Cloud, Cpu, Server, Send, DatabaseIcon,
    UsersIcon, Palette, Target, KeyRound, Monitor,
    Hash, GitPullRequest, GitMerge, HardDriveIcon,
    CheckCircle, XCircle
  };

  // Load settings from localStorage
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('system_settings');
    return savedSettings ? JSON.parse(savedSettings) : initialSettings;
  });

  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [showResetModal, setShowResetModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showAddSettingModal, setShowAddSettingModal] = useState(false);
  const [newSetting, setNewSetting] = useState({
    category: 'General',
    label: '',
    type: 'text',
    value: '',
    description: '',
    icon: 'Settings'
  });
  const [backupData, setBackupData] = useState('');

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('system_settings', JSON.stringify(settings));
  }, [settings]);

  // Get unique categories
  const categories = ['All Categories', ...new Set(settings.map(setting => setting.category))];

  // Filter settings based on search and category
  const filteredSettings = settings.filter(setting => {
    const matchesSearch = setting.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         setting.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All Categories' || 
                           setting.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get icon component
  const getIconComponent = (iconName) => {
    const Icon = iconComponents[iconName] || Settings;
    return <Icon className="h-4 w-4" />;
  };

  // Start editing a setting
  const startEditing = (setting) => {
    setEditingId(setting.id);
    setEditValue(setting.value);
  };

  // Save edit
  const saveEdit = () => {
    if (editingId) {
      setSettings(settings.map(setting => 
        setting.id === editingId ? { ...setting, value: editValue } : setting
      ));
      setEditingId(null);
      setEditValue('');
    }
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  // Reset all settings to defaults
  const resetToDefaults = () => {
    setSettings(initialSettings);
    setShowResetModal(false);
  };

  // Export settings as JSON
  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `system_settings_backup_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Import settings from JSON
  const importSettings = () => {
    try {
      const importedSettings = JSON.parse(backupData);
      if (Array.isArray(importedSettings)) {
        setSettings(importedSettings);
        setShowBackupModal(false);
        setBackupData('');
        alert('Settings imported successfully!');
      } else {
        alert('Invalid backup file format');
      }
    } catch (error) {
      alert('Error parsing backup file: ' + error.message);
    }
  };

  // Handle backup file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBackupData(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  // Add new setting
  const handleAddSetting = () => {
    if (newSetting.label.trim() && newSetting.category.trim()) {
      const newId = 'custom_' + newSetting.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
      
      if (settings.find(s => s.id === newId)) {
        alert('Setting with this label already exists');
        return;
      }
      
      const settingToAdd = {
        id: newId,
        category: newSetting.category,
        label: newSetting.label,
        type: newSetting.type,
        value: newSetting.type === 'toggle' ? false : newSetting.value,
        description: newSetting.description,
        editable: true,
        required: false,
        icon: newSetting.icon || 'Settings'
      };
      
      setSettings([...settings, settingToAdd]);
      setShowAddSettingModal(false);
      setNewSetting({
        category: 'General',
        label: '',
        type: 'text',
        value: '',
        description: '',
        icon: 'Settings'
      });
    }
  };

  // Delete a setting
  const deleteSetting = (id) => {
    if (window.confirm('Are you sure you want to delete this setting?')) {
      setSettings(settings.filter(setting => setting.id !== id));
    }
  };

  // Quick toggle function
  const quickToggle = (settingId) => {
    const setting = settings.find(s => s.id === settingId);
    if (setting && setting.type === 'toggle') {
      const newValue = !(setting.value === true || setting.value === 'true');
      setSettings(settings.map(s => 
        s.id === settingId ? { ...s, value: newValue } : s
      ));
    }
  };

  // Render input based on setting type
  const renderInput = (setting) => {
    if (setting.type === 'toggle') {
      return (
        <div className="flex items-center">
          <div className="relative inline-block w-10 mr-2 align-middle select-none">
            <input
              type="checkbox"
              checked={editValue === true || editValue === 'true'}
              onChange={(e) => setEditValue(e.target.checked)}
              className="sr-only"
              id={`toggle-${setting.id}`}
            />
            <label
              htmlFor={`toggle-${setting.id}`}
              className={`block overflow-hidden h-5 rounded-full cursor-pointer transition-colors ${
                editValue === true || editValue === 'true' ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white transform transition-transform ${
                  editValue === true || editValue === 'true' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </label>
          </div>
          <span className="text-xs text-gray-600">
            {editValue === true || editValue === 'true' ? 'ON' : 'OFF'}
          </span>
        </div>
      );
    } else if (setting.type === 'select') {
      return (
        <select
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="w-full px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded"
        >
          {setting.options?.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      );
    } else if (setting.type === 'number') {
      return (
        <div className="flex items-center">
          <input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded"
            min="0"
          />
          {setting.unit && (
            <span className="ml-2 text-xs text-gray-600">{setting.unit}</span>
          )}
        </div>
      );
    } else {
      return (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="w-full px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded"
        />
      );
    }
  };

  // Render display value based on setting type
  const renderDisplayValue = (setting) => {
    if (setting.type === 'toggle') {
      const isEnabled = setting.value === true || setting.value === 'true';
      return (
        <div className="flex items-center">
          <div className="relative inline-block w-10 mr-2 align-middle select-none">
            <div className={`block overflow-hidden h-5 rounded-full ${
              isEnabled ? 'bg-green-500' : 'bg-gray-300'
            }`}>
              <span
                className={`block h-5 w-5 rounded-full bg-white transform ${
                  isEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </div>
          <span className={`text-xs ${isEnabled ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
            {isEnabled ? 'ON' : 'OFF'}
          </span>
        </div>
      );
    } else if (setting.type === 'select') {
      return (
        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
          {setting.value}
        </span>
      );
    } else if (setting.type === 'number') {
      return (
        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
          {setting.value} {setting.unit && setting.unit}
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs break-all">
          {setting.value}
        </span>
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Reset Settings</h3>
              <button onClick={() => setShowResetModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to reset all settings to default values?
              </p>
              <p className="text-xs text-yellow-600 mt-1">This action cannot be undone.</p>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={resetToDefaults}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup/Restore Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Backup & Restore</h3>
              <button onClick={() => setShowBackupModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-3 border border-gray-300 rounded">
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Export Settings
                </h4>
                <p className="text-xs text-gray-600 mb-3">
                  Download all current settings as a JSON file
                </p>
                <button
                  onClick={exportSettings}
                  className="w-full px-3 py-2 text-sm bg-black text-white rounded hover:bg-gray-800 flex items-center justify-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export to JSON
                </button>
              </div>

              <div className="p-3 border border-gray-300 rounded">
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Settings
                </h4>
                <p className="text-xs text-gray-600 mb-3">
                  Upload a JSON file to restore settings
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="w-full mb-3 text-xs"
                />
                <textarea
                  placeholder="Or paste JSON content here..."
                  value={backupData}
                  onChange={(e) => setBackupData(e.target.value)}
                  className="w-full h-32 px-3 py-2 text-xs border border-gray-300 rounded mb-3"
                  rows="4"
                />
                <button
                  onClick={importSettings}
                  disabled={!backupData.trim()}
                  className={`w-full px-3 py-2 text-sm rounded flex items-center justify-center ${
                    backupData.trim()
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Setting Modal */}
      {showAddSettingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Add New Setting</h3>
              <button onClick={() => setShowAddSettingModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={newSetting.category}
                  onChange={(e) => setNewSetting({...newSetting, category: e.target.value})}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded"
                >
                  <option value="General">General</option>
                  <option value="Security">Security</option>
                  <option value="Notifications">Notifications</option>
                  <option value="Employee Management">Employee Management</option>
                  <option value="Department Management">Department Management</option>
                  <option value="Project Management">Project Management</option>
                  <option value="Part Management">Part Management</option>
                  <option value="File Management">File Management</option>
                  <option value="Backup">Backup</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Setting Label *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Two-Factor Authentication"
                  value={newSetting.label}
                  onChange={(e) => setNewSetting({...newSetting, label: e.target.value})}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Setting Type
                </label>
                <select
                  value={newSetting.type}
                  onChange={(e) => setNewSetting({...newSetting, type: e.target.value})}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="toggle">Toggle (On/Off)</option>
                  <option value="select">Dropdown</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Brief description of this setting..."
                  value={newSetting.description}
                  onChange={(e) => setNewSetting({...newSetting, description: e.target.value})}
                  className="w-full h-20 px-3 py-1.5 text-sm border border-gray-300 rounded"
                  rows="3"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowAddSettingModal(false)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSetting}
                className="px-3 py-1.5 text-sm bg-black text-white rounded hover:bg-gray-800"
              >
                Add Setting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            System Settings
          </h2>
          <p className="text-sm text-gray-600 mt-1">Configure system-wide settings and preferences</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowBackupModal(true)}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            <Database className="h-4 w-4" />
            <span>Backup/Restore</span>
          </button>
          <button
            onClick={() => setShowResetModal(true)}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reset All</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-300 rounded p-4 flex items-center">
          <div className="bg-gray-100 p-2 rounded mr-3">
            <Settings className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Settings</p>
            <p className="text-base font-bold text-gray-900">{settings.length}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-300 rounded p-4 flex items-center">
          <div className="bg-green-100 p-2 rounded mr-3">
            <Shield className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Security Settings</p>
            <p className="text-base font-bold text-green-600">
              {settings.filter(s => s.category === 'Security').length}
            </p>
          </div>
        </div>
        <div className="bg-white border border-gray-300 rounded p-4 flex items-center">
          <div className="bg-blue-100 p-2 rounded mr-3">
            <Bell className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Active Features</p>
            <p className="text-base font-bold text-gray-900">
              {settings.filter(s => s.type === 'toggle' && (s.value === true || s.value === 'true')).length}
            </p>
          </div>
        </div>
        <div className="bg-white border border-gray-300 rounded p-4 flex items-center">
          <div className="bg-yellow-100 p-2 rounded mr-3">
            <Shield className="h-4 w-4 text-yellow-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Modified</p>
            <p className="text-base font-bold text-yellow-600">
              {settings.filter(s => s.value !== initialSettings.find(is => is.id === s.id)?.value).length}
            </p>
          </div>
        </div>
      </div>

      {/* Settings Container */}
      <div className="bg-white border border-gray-300 rounded p-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search settings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full sm:w-auto pl-8 pr-8 py-2 text-sm border border-gray-300 rounded appearance-none bg-white"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <Settings className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>
            </div>

            <button
              onClick={() => setShowAddSettingModal(true)}
              className="flex items-center space-x-1 px-3 py-2 text-sm bg-black text-white rounded hover:bg-gray-800 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Add Setting</span>
            </button>
          </div>
        </div>

        {/* Settings Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-2 px-3 font-medium text-gray-700">Category</th>
                <th className="text-left py-2 px-3 font-medium text-gray-700">Setting</th>
                <th className="text-left py-2 px-3 font-medium text-gray-700">Current Value</th>
                <th className="text-left py-2 px-3 font-medium text-gray-700">Description</th>
                <th className="text-left py-2 px-3 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSettings.map((setting) => (
                <tr key={setting.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-2 px-3">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {setting.category}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center space-x-2">
                      <div className="p-1 bg-gray-100 rounded">
                        {getIconComponent(setting.icon)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{setting.label}</div>
                        <div className="flex items-center space-x-1 mt-0.5">
                          <span className="text-xs text-gray-500">{setting.type}</span>
                          {setting.required && (
                            <span className="text-xs px-1 py-0.5 bg-red-100 text-red-800 rounded">
                              Required
                            </span>
                          )}
                          {setting.id.startsWith('custom_') && (
                            <span className="text-xs px-1 py-0.5 bg-blue-100 text-blue-800 rounded">
                              Custom
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  {editingId === setting.id ? (
                    <td className="py-2 px-3">
                      {renderInput(setting)}
                    </td>
                  ) : (
                    <td className="py-2 px-3">
                      {setting.type === 'toggle' ? (
                        <button 
                          onClick={() => quickToggle(setting.id)}
                          className="transition-transform hover:scale-105"
                        >
                          {renderDisplayValue(setting)}
                        </button>
                      ) : (
                        renderDisplayValue(setting)
                      )}
                    </td>
                  )}
                  
                  <td className="py-2 px-3">
                    <div className="text-gray-600 max-w-xs text-xs">
                      {setting.description}
                    </div>
                  </td>
                  
                  <td className="py-2 px-3">
                    <div className="flex items-center space-x-2">
                      {editingId === setting.id ? (
                        <>
                          <button 
                            onClick={saveEdit}
                            className="p-1 text-green-600 hover:text-green-800"
                            title="Save"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={cancelEdit}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          {setting.editable && (
                            <button 
                              onClick={() => startEditing(setting)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {setting.id.startsWith('custom_') && (
                            <button 
                              onClick={() => deleteSetting(setting.id)}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4 pt-4 border-t border-gray-300">
          <div className="text-xs text-gray-600">
            Showing {filteredSettings.length} of {settings.length} settings
            {selectedCategory !== 'All Categories' && ` (Filtered by ${selectedCategory})`}
          </div>
        </div>
      </div>
    </div>
  );
};
export default SystemSettings;
