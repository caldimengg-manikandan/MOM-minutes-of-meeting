import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Key, Shield, Plus, Search, Filter, 
  Edit, Trash2, X, Check, 
  ChevronUp, ChevronDown, CheckCircle, XCircle, Download
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const EmployeeAccess = () => {
  // Initial columns configuration
  const initialColumns = [
    { id: 'employee', label: 'Employee', visible: true, sortable: true, type: 'text', required: true },
    { id: 'department', label: 'Department', visible: true, sortable: true, type: 'text', required: true },
    { id: 'accessLevel', label: 'Access Level', visible: true, sortable: true, type: 'select', required: true },
    { id: 'modules', label: 'Modules', visible: true, sortable: false, type: 'modules', required: false },
    { id: 'status', label: 'Status', visible: true, sortable: true, type: 'select', required: true },
  ];

  const [employees, setEmployees] = useState([]);
  const [accessRules, setAccessRules] = useState([]);

  const [newRule, setNewRule] = useState({ 
    employee: '', 
    department: '', 
    accessLevel: 'User', 
    modules: [], 
    status: 'Active' 
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showDeletePrompt, setShowDeletePrompt] = useState(null);
  const [columns, setColumns] = useState(initialColumns);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  const accessLevels = ['Admin', 'Manager', 'User', 'Viewer'];
  const modulesList = ['Dashboard', 'Employee Master', 'Project Master', 'Reports', 'Settings', 'Analytics'];

  // ✅ FETCH DATA FROM BACKEND (ADDED)
  useEffect(() => {
    fetchEmployees();
    fetchAccessRules();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/employees`);
      setEmployees(res.data);
    } catch (err) {
      console.error('Failed to load employees', err);
    }
  };

  const fetchAccessRules = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/employee-access`);
      setAccessRules(res.data);
    } catch (err) {
      console.error('Failed to load access rules', err);
    }
  };

  // Filter rules
  const filteredRules = accessRules.filter(rule =>
    Object.values(rule).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Sort rules
  const sortedRules = React.useMemo(() => {
    if (!sortConfig.key) return filteredRules;

    return [...filteredRules].sort((a, b) => {
      const aVal = a[sortConfig.key] || '';
      const bVal = b[sortConfig.key] || '';
      if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
  }, [filteredRules, sortConfig]);

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 opacity-30" />;
    }
    return sortConfig.direction === 'ascending'
      ? <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
      : <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />;
  };

  const handleAddRuleClick = () => {
    setIsAddingNew(true);
    setNewRule({ employee: '', department: '', accessLevel: 'User', modules: [], status: 'Active' });
  };

  // ✅ SAVE TO BACKEND (MODIFIED ONLY HERE)
  const saveNewRule = async () => {
    if (!newRule.employee.trim() || !newRule.department.trim()) {
      alert('Employee name and department are required');
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/employee-access`, newRule);
      fetchAccessRules();
      setIsAddingNew(false);
      setNewRule({ employee: '', department: '', accessLevel: 'User', modules: [], status: 'Active' });
    } catch (err) {
      console.error('Failed to add access rule', err);
      alert('Failed to add access rule');
    }
  };

  // Cancel adding new rule
  const cancelNewRule = () => {
    setIsAddingNew(false);
    setNewRule({ employee: '', department: '', accessLevel: 'User', modules: [], status: 'Active' });
  };

  // Toggle module selection
  const toggleModule = (module) => {
    if (newRule.modules.includes(module)) {
      setNewRule({...newRule, modules: newRule.modules.filter(m => m !== module)});
    } else {
      setNewRule({...newRule, modules: [...newRule.modules, module]});
    }
  };

  // Show delete prompt
  const showDeleteConfirmation = (id, employee) => {
    setShowDeletePrompt({ id, employee });
  };

  // Confirm delete rule
  const confirmDeleteRule = () => {
    if (showDeletePrompt) {
      setAccessRules(accessRules.filter(rule => rule.id !== showDeletePrompt.id));
      setShowDeletePrompt(null);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeletePrompt(null);
  };

  // Start editing rule
  const startEditing = (rule) => {
    // Cancel any current add operation
    if (isAddingNew) {
      setIsAddingNew(false);
      setNewRule({ employee: '', department: '', accessLevel: 'User', modules: [], status: 'Active' });
    }
    
    setEditingId(rule.id);
    setEditForm({ ...rule });
  };

  // Save rule edit
  const saveEdit = () => {
    if (!editForm.employee.trim() || !editForm.department.trim()) {
      alert('Employee name and department are required');
      return;
    }
    
    setAccessRules(accessRules.map(rule => 
      rule.id === editingId ? { ...rule, ...editForm } : rule
    ));
    setEditingId(null);
    setEditForm({});
  };

  // Cancel rule edit
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // Handle new rule input change
  const handleNewRuleChange = (field, value) => {
    setNewRule({...newRule, [field]: value});
  };

  // Handle edit form change
  const handleEditFormChange = (field, value) => {
    setEditForm({...editForm, [field]: value});
  };

  // Toggle module in edit form
  const toggleEditModule = (module) => {
    const currentModules = editForm.modules || [];
    if (currentModules.includes(module)) {
      setEditForm({...editForm, modules: currentModules.filter(m => m !== module)});
    } else {
      setEditForm({...editForm, modules: [...currentModules, module]});
    }
  };

  // Render input based on column type
  const renderInput = (column, value, onChange, isEditMode = false) => {
    if (column.id === 'accessLevel') {
      return (
        <select
          value={value || 'User'}
          onChange={(e) => onChange(column.id, e.target.value)}
          className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded"
        >
          {accessLevels.map(level => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
      );
    } else if (column.id === 'modules') {
      if (isEditMode) {
        return (
          <div className="flex flex-wrap gap-1">
            {modulesList.map(module => (
              <button
                key={module}
                type="button"
                onClick={() => toggleEditModule(module)}
                className={`px-2 py-0.5 rounded text-[10px] sm:text-xs border ${
                  (editForm.modules || []).includes(module)
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : 'bg-gray-100 text-gray-700 border-gray-300'
                }`}
              >
                {module}
              </button>
            ))}
          </div>
        );
      }
      return null;
    } else if (column.id === 'status') {
      return (
        <select
          value={value || 'Active'}
          onChange={(e) => onChange(column.id, e.target.value)}
          className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded"
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      );
    } else {
      return (
        <input
          type="text"
          placeholder={!isEditMode ? `Enter ${column.label.toLowerCase()}` : ''}
          value={value || ''}
          onChange={(e) => onChange(column.id, e.target.value)}
          className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded"
        />
      );
    }
  };

  // Render cell content based on column type
  const renderCellContent = (column, value, rule) => {
    if (column.id === 'accessLevel') {
      return (
        <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs whitespace-nowrap ${
          value === 'Admin' ? 'bg-red-100 text-red-800' :
          value === 'Manager' ? 'bg-blue-100 text-blue-800' :
          value === 'User' ? 'bg-green-100 text-green-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      );
    } else if (column.id === 'modules') {
      const modules = rule.modules || [];
      return (
        <div className="flex flex-wrap gap-1">
          {modules.slice(0, 2).map(module => (
            <span key={module} className="px-2 py-0.5 bg-gray-100 rounded text-[10px] sm:text-xs">
              {module}
            </span>
          ))}
          {modules.length > 2 && (
            <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] sm:text-xs">
              +{modules.length - 2}
            </span>
          )}
        </div>
      );
    } else if (column.id === 'status') {
      return (
        <div className="flex items-center">
          {value === 'Active' ? (
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1" />
          ) : (
            <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mr-1" />
          )}
          <span className="text-xs sm:text-sm">{value}</span>
        </div>
      );
    }
    return <span className="whitespace-nowrap truncate max-w-[150px]">{value || '-'}</span>;
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Delete Rule Prompt Modal */}
      {showDeletePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Confirm Delete</h3>
              <button onClick={cancelDelete} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-xs sm:text-sm text-gray-600">
                Are you sure you want to delete access rule for <span className="font-medium">{showDeletePrompt.employee}</span>?
              </p>
              <p className="text-xs text-red-600 mt-1">This action cannot be undone.</p>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={cancelDelete}
                className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteRule}
                className="px-3 py-1.5 text-xs sm:text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
            <Key className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Employee Access
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">Manage employee permissions and access controls</p>
        </div>
        <button className="flex items-center justify-center sm:justify-start space-x-1 px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50 w-full sm:w-auto">
          <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>Audit Log</span>
        </button>
      </div>

      {/* Compact Stats - Responsive */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-white border border-gray-300 rounded p-3 sm:p-4 flex items-center">
          <div className="bg-gray-100 p-1.5 sm:p-2 rounded mr-2 sm:mr-3">
            <Key className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500">Access Rules</p>
            <p className="text-sm sm:text-base font-bold text-gray-900">{accessRules.length}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-300 rounded p-3 sm:p-4 flex items-center">
          <div className="bg-green-100 p-1.5 sm:p-2 rounded mr-2 sm:mr-3">
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500">Active Access</p>
            <p className="text-sm sm:text-base font-bold text-green-600">
              {accessRules.filter(r => r.status === 'Active').length}
            </p>
          </div>
        </div>
        <div className="bg-white border border-gray-300 rounded p-3 sm:p-4 flex items-center">
          <div className="bg-blue-100 p-1.5 sm:p-2 rounded mr-2 sm:mr-3">
            <Key className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500">Admin Users</p>
            <p className="text-sm sm:text-base font-bold text-blue-600">
              {accessRules.filter(r => r.accessLevel === 'Admin').length}
            </p>
          </div>
        </div>
        <div className="bg-white border border-gray-300 rounded p-3 sm:p-4 flex items-center">
          <div className="bg-yellow-100 p-1.5 sm:p-2 rounded mr-2 sm:mr-3">
            <Key className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500">Pending Review</p>
            <p className="text-sm sm:text-base font-bold text-yellow-600">2</p>
          </div>
        </div>
      </div>

      {/* Add Access Rule Form */}
      <div className="bg-white border border-gray-300 rounded p-3 sm:p-4">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">Add Access Rule</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
          <input
            type="text"
            placeholder="Employee Name"
            value={newRule.employee}
            onChange={(e) => handleNewRuleChange('employee', e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded"
          />
          <input
            type="text"
            placeholder="Department"
            value={newRule.department}
            onChange={(e) => handleNewRuleChange('department', e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded"
          />
          <select
            value={newRule.accessLevel}
            onChange={(e) => handleNewRuleChange('accessLevel', e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded"
          >
            {accessLevels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>
        
        <div className="mb-3 sm:mb-4">
          <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Allowed Modules</p>
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {modulesList.map(module => (
              <button
                key={module}
                type="button"
                onClick={() => toggleModule(module)}
                className={`px-2 py-1 rounded text-[10px] sm:text-xs border ${
                  newRule.modules.includes(module)
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : 'bg-gray-100 text-gray-700 border-gray-300'
                }`}
              >
                {module}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleAddRuleClick}
          className="flex items-center justify-center space-x-1 px-3 py-2 text-xs sm:text-sm bg-black text-white rounded hover:bg-gray-800 w-full"
        >
          <Key className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>Add Access Rule</span>
        </button>
      </div>

      {/* Table Container with Toolbar */}
      <div className="bg-white border border-gray-300 rounded p-3 sm:p-4">
        {/* Toolbar with Search and Add Rule */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-300 rounded"
              />
            </div>
            
            <div className="relative w-full sm:w-48">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              <select className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-gray-300 rounded">
                <option>All Access Levels</option>
                <option>Admin</option>
                <option>Manager</option>
                <option>User</option>
              </select>
            </div>
            
          </div>
          
          <button className="flex items-center justify-center sm:justify-start space-x-1 px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50 w-full sm:w-auto mt-2 sm:mt-0">
            <Download className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Export</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-300">
                {/* Render only visible columns */}
                {columns
                  .filter(col => col.visible)
                  .map((column) => (
                    <th 
                      key={column.id}
                      className="text-left py-2 px-2 sm:px-3 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                      onClick={() => column.sortable && handleSort(column.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <span>{column.label}</span>
                          {column.required && <span className="text-red-500">*</span>}
                          {column.sortable && getSortIcon(column.id)}
                        </div>
                      </div>
                    </th>
                  ))}
                <th className="text-left py-2 px-2 sm:px-3 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Existing rules */}
              {sortedRules.map((rule) => (
                <tr key={rule.id} className="border-b border-gray-200 hover:bg-gray-50">
                  {editingId === rule.id ? (
                    <>
                      {/* Edit mode for visible columns */}
                      {columns
                        .filter(col => col.visible)
                        .map((column) => (
                          <td key={column.id} className="py-2 px-2 sm:px-3">
                            {renderInput(column, editForm[column.id], handleEditFormChange, true)}
                          </td>
                        ))}
                      <td className="py-2 px-2 sm:px-3">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={saveEdit}
                            className="p-1 text-green-600 hover:text-green-800"
                            title="Save"
                          >
                            <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                          <button 
                            onClick={cancelEdit}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Cancel"
                          >
                            <X className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      {/* View mode for visible columns */}
                      {columns
                        .filter(col => col.visible)
                        .map((column) => (
                          <td key={column.id} className="py-2 px-2 sm:px-3">
                            {renderCellContent(column, rule[column.id], rule)}
                          </td>
                        ))}
                      <td className="py-2 px-2 sm:px-3">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => startEditing(rule)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                          <button 
                            onClick={() => showDeleteConfirmation(rule.id, rule.employee)}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}

              {/* Add new rule row at the bottom */}
              {isAddingNew && (
                <tr className="border-b border-gray-200 bg-blue-50">
                  <td className="py-2 px-2 sm:px-3">
                    <input
                      type="text"
                      placeholder="Enter employee"
                      value={newRule.employee}
                      onChange={(e) => handleNewRuleChange('employee', e.target.value)}
                      className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded"
                    />
                  </td>
                  <td className="py-2 px-2 sm:px-3">
                    <input
                      type="text"
                      placeholder="Enter department"
                      value={newRule.department}
                      onChange={(e) => handleNewRuleChange('department', e.target.value)}
                      className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded"
                    />
                  </td>
                  <td className="py-2 px-2 sm:px-3">
                    <select
                      value={newRule.accessLevel}
                      onChange={(e) => handleNewRuleChange('accessLevel', e.target.value)}
                      className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded"
                    >
                      {accessLevels.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-2 sm:px-3">
                    <div className="flex flex-wrap gap-1">
                      {modulesList.slice(0, 2).map(module => (
                        <span key={module} className="px-2 py-0.5 bg-gray-100 rounded text-[10px] sm:text-xs">
                          {module}
                        </span>
                      ))}
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] sm:text-xs">
                        +{newRule.modules.length - 2}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-2 sm:px-3">
                    <select
                      value={newRule.status}
                      onChange={(e) => handleNewRuleChange('status', e.target.value)}
                      className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </td>
                  <td className="py-2 px-2 sm:px-3">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={saveNewRule}
                        className="p-1 text-green-600 hover:text-green-800"
                        title="Save"
                      >
                        <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                      <button 
                        onClick={cancelNewRule}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Cancel"
                      >
                        <X className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Compact Pagination - Responsive */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0 mt-3 pt-3 border-t border-gray-300">
          <div className="text-[10px] sm:text-xs text-gray-600">
            Showing {sortedRules.length} of {accessRules.length} access rules
          </div>
          <div className="flex space-x-1">
            <button className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs border border-gray-300 rounded bg-gray-100">
              1
            </button>
            <button className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs border border-gray-300 rounded hover:bg-gray-50">
              2
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeAccess;