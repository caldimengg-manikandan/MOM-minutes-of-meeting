import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { 
  Key, Shield, Plus, Search, Filter, 
  Edit, Trash2, X, Check, 
  ChevronUp, ChevronDown, CheckCircle, XCircle, Download,
  Columns, Eye, EyeOff, Lock, ToggleLeft, ToggleRight,
  User, ChevronDown as ChevronDownIcon
} from 'lucide-react';

const EmployeeAccess = () => {
  // Initial columns configuration - Only ID, Name, Email, Role, Actions
  const initialColumns = [
    { id: 'id', label: 'ID', visible: true, sortable: true, type: 'text', required: true, deletable: false },
    { id: 'name', label: 'Name', visible: true, sortable: true, type: 'text', required: true, deletable: false },
    { id: 'email', label: 'Email', visible: true, sortable: true, type: 'email', required: true, deletable: false },
    { id: 'role', label: 'Role', visible: true, sortable: true, type: 'text', required: true, deletable: false },
    { id: 'department', label: 'Department', visible: true, sortable: true, type: 'text', required: true, deletable: false },
    { id: 'status', label: 'Status', visible: true, sortable: true, type: 'text', required: true, deletable: false },
  ];

  // Employee data state
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Access rules state
  const [accessRules, setAccessRules] = useState([]);
  
  const [newRule, setNewRule] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showDeletePrompt, setShowDeletePrompt] = useState(null);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState('text');
  
  // Load columns from localStorage
  const [columns, setColumns] = useState(() => {
    const savedColumns = localStorage.getItem('access_columns_v2');
    return savedColumns ? JSON.parse(savedColumns) : initialColumns;
  });
  
  const [editingColumn, setEditingColumn] = useState(null);
  const [tempColumnName, setTempColumnName] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  // Department filter state - Load from localStorage
  const [departmentFilter, setDepartmentFilter] = useState(() => {
    const savedFilter = localStorage.getItem('access_department_filter');
    return savedFilter || "All Departments";
  });

  // Access Level filter state
  const [accessLevelFilter, setAccessLevelFilter] = useState("All Access Levels");

  // State for Add Employee modal
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  
  // State for Edit Employee modal
  const [showEditEmployeeModal, setShowEditEmployeeModal] = useState(null);
  
  // New password fields for add modal
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Employee selector state
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  
  // All side modules (permissions) list
  const modulesList = ['Dashboard', 'Employee Master', 'Project Master', 'Settings'];

  const accessLevels = ['Admin', 'Manager', 'User', 'Viewer'];

  // Filter employees who don't already have access rules
  const availableEmployees = allEmployees.filter(employee => 
    !accessRules.some(rule => rule.employee_id === employee.id)
  );

  // Filter employees based on search
  const filteredEmployees = availableEmployees.filter(employee =>
    employeeSearch === '' || 
    employee.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    employee.email.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([fetchEmployees(), fetchAccessRules()]);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await API.get('/employees');
      if (Array.isArray(res.data)) {
        setAllEmployees(res.data);
      } else {
        console.warn("API /employees did not return an array:", res.data);
        setAllEmployees([]);
      }
    } catch (err) {
      console.error("Error fetching employees", err);
      throw err; 
    }
  };

  const fetchAccessRules = async () => {
    try {
      const res = await API.get('/employee-access/');
      if (Array.isArray(res.data)) {
        setAccessRules(res.data);
      } else {
        console.warn("API /employee-access/ did not return an array:", res.data);
        setAccessRules([]);
      }
    } catch (err) {
      console.error("Error fetching access rules", err);
      // We don't throw here strictly, as we can still show employees without rules
      // But for Promise.all, maybe we should?
    }
  };

  // Merge employees and access rules
  const mergedData = React.useMemo(() => {
    // Only display rows for existing access rules
    return accessRules.map(rule => {
      // Find full employee details from allEmployees if available, or use nested employee object
      // We prioritize the joined 'employee' object from backend response if available, then fallback to finding in allEmployees
      const empDetails = rule.employee || allEmployees.find(e => e.id === rule.employee_id) || {};
      
      // Determine the Display ID (Employee ID string)
      // rule.employee_code (from DB access table) OR empDetails.employee_id OR fallback to rule.employee_id (int)
      const displayId = rule.employee_code || empDetails.employee_id || (empDetails.id ? String(empDetails.id) : String(rule.employee_id));
      const displayName = rule.employee_name || empDetails.name || rule.name || 'Unknown';
      const displayEmail = rule.employee_email || empDetails.email || rule.email || 'Unknown';

      return {
        id: displayId, // Display ID for the table column
        accessRuleId: rule.id, // Actual Access Rule ID for API calls
        employeeId: rule.employee_id, // Employee DB PK
        name: displayName,
        email: displayEmail,
        role: rule.access_level || 'User',
        department: empDetails.department || '',
        status: rule.status,
        permissions: rule.modules || [],
        hasAccess: true,
        // Preserve other fields
        ...Object.keys(rule).reduce((acc, key) => {
          if (!['id', 'employee_id', 'access_level', 'status', 'modules', 'employee', 'name', 'email', 'employee_name', 'employee_email', 'employee_code'].includes(key)) {
             acc[key] = rule[key];
          }
          return acc;
        }, {})
      };
    });
  }, [allEmployees, accessRules]);

  // Save columns to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('access_columns_v2', JSON.stringify(columns));
  }, [columns]);

  // Save department filter preference
  useEffect(() => {
    localStorage.setItem('access_department_filter', departmentFilter);
  }, [departmentFilter]);

  // Get unique departments from access rules data
  const uniqueDepartments = ["All Departments", ...new Set(mergedData.map(rule => rule.department).filter(Boolean))];

  // Filter access rules based on search, department, and access level
  const filteredRules = mergedData.filter(rule => {
    // Search filter
    const matchesSearch = Object.values(rule).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Department filter
    const matchesDepartment = 
      departmentFilter === "All Departments" || 
      rule.department === departmentFilter;
    
    // Access Level filter
    const matchesAccessLevel = 
      accessLevelFilter === "All Access Levels" || 
      rule.role === accessLevelFilter || // Changed from accessLevel to role (which holds the display value)
      (accessLevelFilter === "No Access" && !rule.hasAccess);
    
    return matchesSearch && matchesDepartment && matchesAccessLevel;
  });

  // Sort rules
  const sortedRules = React.useMemo(() => {
    if (!sortConfig.key) return filteredRules;

    return [...filteredRules].sort((a, b) => {
      const aVal = a[sortConfig.key] || '';
      const bVal = b[sortConfig.key] || '';
      
      if (aVal < bVal) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aVal > bVal) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredRules, sortConfig]);

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Get sort icon for a column
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 opacity-30" />;
    }
    return sortConfig.direction === 'ascending' 
      ? <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" /> 
      : <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />;
  };

  // Validate access rule form
  const validateRuleForm = (rule) => {
    if (!rule.name?.trim()) {
      return 'Name is required';
    }
    if (!rule.email?.trim()) {
      return 'Email is required';
    }
    if (!rule.email.includes('@')) {
      return 'Please enter a valid email';
    }
    if (!rule.role?.trim()) {
      return 'Role is required';
    }
    return '';
  };

  // Handle Add Employee button click - Opens modal
  const handleAddEmployeeClick = () => {
    setShowAddEmployeeModal(true);
    // Reset form
    setNewRule({
      id: '',
      employee_id: '',
      name: '',
      email: '',
      role: 'User',
      permissions: []
    });
    setNewPassword('');
    setConfirmPassword('');
    setSelectedEmployee('');
    setEmployeeSearch('');
  };

  // Handle employee selection from dropdown
  const handleEmployeeSelect = (employeeId) => {
    const selected = allEmployees.find(emp => emp.id === parseInt(employeeId));
    if (selected) {
      setSelectedEmployee(employeeId);
      setNewRule({
        employee_id: selected.id, // Database ID (FK)
        id: selected.employee_id || selected.id, // Display ID (String ID)
        name: selected.name,
        email: selected.email,
        role: selected.role || 'User',
        permissions: []
      });
      setEmployeeSearch('');
    }
  };

  // Save new employee from modal
  const saveNewEmployee = async () => {
    // Check if passwords match
    if (!newPassword.trim()) {
      alert('Password is required');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    const error = validateRuleForm(newRule);
    if (error) {
      alert(error);
      return;
    }

    // Check if employee already has access
    if (accessRules.some(rule => rule.employeeId === newRule.employee_id)) {
      alert('This employee already has access permissions');
      return;
    }

    try {
      const payload = {
         employee_id: newRule.employee_id,
         access_level: newRule.role,
         status: 'Active',
         modules: newRule.permissions || [],
         password: newPassword
      };
      
      await API.post('/employee-access/', payload);
      await fetchAccessRules();
      
      setShowAddEmployeeModal(false);
      
      // Reset form
      setNewRule({});
      setNewPassword('');
      setConfirmPassword('');
      setSelectedEmployee('');
      setEmployeeSearch('');
    } catch (err) {
      console.error(err);
      alert('Error saving access rule: ' + (err.response?.data?.detail || err.message));
    }
  };

  // Cancel adding new employee
  const cancelNewEmployee = () => {
    setShowAddEmployeeModal(false);
    setNewRule({});
    setNewPassword('');
    setConfirmPassword('');
    setSelectedEmployee('');
    setEmployeeSearch('');
  };

  // Toggle module permission for add modal
  const togglePermission = (module) => {
    const currentPermissions = newRule.permissions || [];
    if (currentPermissions.includes(module)) {
      setNewRule({...newRule, permissions: currentPermissions.filter(m => m !== module)});
    } else {
      setNewRule({...newRule, permissions: [...currentPermissions, module]});
    }
  };

  // Toggle module in edit form
  const toggleEditPermission = (module) => {
    const currentPermissions = editForm.permissions || [];
    if (currentPermissions.includes(module)) {
      setEditForm({...editForm, permissions: currentPermissions.filter(m => m !== module)});
    } else {
      setEditForm({...editForm, permissions: [...currentPermissions, module]});
    }
  };

  // Show delete prompt
  const showDeleteConfirmation = (id, name) => {
    setShowDeletePrompt({ id, name });
  };

  // Confirm delete rule
  const confirmDeleteRule = async () => {
    if (showDeletePrompt) {
      try {
        await API.delete(`/employee-access/${showDeletePrompt.id}`);
        await fetchAccessRules();
        setShowDeletePrompt(null);
      } catch (err) {
        console.error(err);
        alert('Error deleting access rule: ' + (err.response?.data?.detail || err.message));
      }
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeletePrompt(null);
  };

  // Add new column
  const handleAddColumn = () => {
    if (newColumnName.trim()) {
      const newColumnId = newColumnName.toLowerCase().replace(/\s+/g, '_');
      
      // Check if column already exists
      if (columns.find(col => col.id === newColumnId)) {
        alert('Column with this name already exists');
        return;
      }
      
      const newColumn = {
        id: newColumnId,
        label: newColumnName,
        visible: true,
        sortable: true,
        type: newColumnType,
        editable: true,
        deletable: true,
        required: false
      };
      
      setColumns([...columns, newColumn]);
      
      // Add default value for this column to all existing rules
      let defaultValue = '';
      if (newColumnType === 'select') {
        defaultValue = 'Active';
      }
      
      setAccessRules(accessRules.map(rule => ({
        ...rule,
        [newColumnId]: defaultValue
      })));
      
      setNewColumnName('');
      setNewColumnType('text');
    }
  };

  // Edit column name
  const startEditColumn = (columnId, currentLabel) => {
    setEditingColumn(columnId);
    setTempColumnName(currentLabel);
  };

  // Save column edit
  const saveEditColumn = (columnId) => {
    if (tempColumnName.trim()) {
      setColumns(columns.map(col => 
        col.id === columnId ? { ...col, label: tempColumnName } : col
      ));
      setEditingColumn(null);
      setTempColumnName('');
    }
  };

  // Cancel column edit
  const cancelEditColumn = () => {
    setEditingColumn(null);
    setTempColumnName('');
  };

  // Delete column
  const handleDeleteColumn = (columnId) => {
    if (window.confirm('Are you sure you want to delete this column? This will remove this column from all access rules.')) {
      setColumns(columns.filter(col => col.id !== columnId));
      
      // Remove this column from all rules
      setAccessRules(accessRules.map(rule => {
        const newRule = { ...rule };
        delete newRule[columnId];
        return newRule;
      }));
    }
  };

  // Toggle column visibility
  const toggleColumnVisibility = (columnId) => {
    setColumns(columns.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ));
  };

  // Start editing rule - Opens modal
  const startEditing = (rule) => {
    // If user has no access, treat as creating new access but using Edit Modal
    if (!rule.hasAccess) {
        // We use a special flag or just handle it in saveEdit
        // We need to set showEditEmployeeModal to something. 
        // Since rule.id is a string like "no-access-1", we can use it.
        // We will pre-fill the form with employee data
        setEditForm({
            ...rule,
            role: 'User', // Default role for new access
            status: 'Active'
        });
    } else {
        setEditForm({ 
          ...rule,
          id: rule.id, // Display ID
          accessRuleId: rule.accessRuleId // Keep track of DB ID
        });
    }
    setShowEditEmployeeModal(rule.accessRuleId || rule.id); // Use accessRuleId for existing, rule.id (placeholder) for new
    setNewPassword('');
    setConfirmPassword('');
  };

  // Save rule edit from modal
  const saveEdit = async () => {
    // Check if passwords match
    if (newPassword && newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    const error = validateRuleForm(editForm);
    if (error) {
      alert(error);
      return;
    }
    
    try {
      const payload = {
          employee_id: editForm.employeeId,
          access_level: editForm.role,
          status: editForm.status || 'Active',
          modules: editForm.permissions || [],
          name: editForm.name,
          email: editForm.email
      };

      if (newPassword) {
        payload.password = newPassword;
      }
      
      if (editForm.hasAccess) {
          // Update existing rule
          await API.put(`/employee-access/${editForm.accessRuleId}`, payload);
      } else {
          // Create new rule for employee who had no access
          // Ensure we don't send the placeholder ID
          await API.post('/employee-access/', payload);
      }
      
      await fetchAccessRules();
      
      setShowEditEmployeeModal(null);
      setEditForm({});
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      alert('Error updating access rule: ' + (err.response?.data?.detail || err.message));
    }
  };

  // Cancel rule edit
  const cancelEdit = () => {
    setShowEditEmployeeModal(null);
    setEditForm({});
    setNewPassword('');
    setConfirmPassword('');
  };

  // Handle new rule input change
  const handleNewRuleChange = (field, value) => {
    setNewRule({...newRule, [field]: value});
  };

  // Handle edit form change
  const handleEditFormChange = (field, value) => {
    setEditForm({...editForm, [field]: value});
  };

  // Handle department filter change
  const handleDepartmentFilterChange = (dept) => {
    setDepartmentFilter(dept);
  };

  // Handle access level filter change
  const handleAccessLevelFilterChange = (level) => {
    setAccessLevelFilter(level);
  };

  // Render cell content based on column type
  const renderCellContent = (column, value, rule) => {
    if (column.id === 'role') {
      const displayValue = rule.hasAccess ? (value || 'User') : 'No Access';
      return (
        <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs whitespace-nowrap ${
          displayValue === 'Admin' ? 'bg-red-100 text-red-800' :
          displayValue === 'Manager' ? 'bg-blue-100 text-blue-800' :
          displayValue === 'User' ? 'bg-green-100 text-green-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {displayValue}
        </span>
      );
    }
    if (column.id === 'status') {
      const isActive = value === 'Active';
      return (
        <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs whitespace-nowrap ${
          isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value || 'Inactive'}
        </span>
      );
    }
    return value || '-';
  };

  return (
    <div className="space-y-3 sm:space-y-4 px-0">
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
                Are you sure you want to delete employee <span className="font-medium">{showDeletePrompt.name}</span>?
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

      {/* Add Employee Modal */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">
                <span className="bg-gray-200 px-2 py-0.5 rounded">
                  Add New Employee Access
                </span>
              </h3>
              <button
                onClick={cancelNewEmployee}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {/* Employee Selector Section */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Select Employee</h4>
              <div className="relative">
                <div className="flex items-center border border-gray-300 rounded px-3 py-2 bg-white">
                  <User className="h-4 w-4 text-gray-400 mr-2" />
                  <input
                    type="text"
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    placeholder="Search employee by name or email..."
                    className="flex-1 outline-none text-sm"
                  />
                  <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                </div>
                
                {/* Employee dropdown */}
                {employeeSearch && filteredEmployees.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
                    {filteredEmployees.map(employee => (
                      <div
                        key={employee.id}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => handleEmployeeSelect(employee.id)}
                      >
                        <div className="font-medium text-sm">{employee.name}</div>
                        <div className="text-xs text-gray-600">{employee.email} • {employee.department}</div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Or select from dropdown */}
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Or select from list:</label>
                  <select
                    value={selectedEmployee}
                    onChange={(e) => handleEmployeeSelect(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="">Select an employee...</option>
                    {availableEmployees.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} ({employee.email}) - {employee.department}
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedEmployee && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                    Selected: {allEmployees.find(e => e.id === parseInt(selectedEmployee))?.name}
                  </div>
                )}
              </div>
            </div>

            {/* Basic Information Section */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
  <label className="block text-xs font-medium text-gray-700 mb-1">ID <span className="text-red-500">*</span></label>
  <input
    type="text"
    value={newRule.id || ''}
    onChange={(e) => handleNewRuleChange('id', e.target.value)}
    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
    placeholder="Enter employee ID"
  />
</div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newRule.name || ''}
                    onChange={(e) => handleNewRuleChange('name', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="Select employee to auto-fill"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    value={newRule.email || ''}
                    onChange={(e) => handleNewRuleChange('email', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="Select employee to auto-fill"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Role <span className="text-red-500">*</span></label>
                  <select
                    value={newRule.role || 'User'}
                    onChange={(e) => handleNewRuleChange('role', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    {accessLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Password <span className="text-red-500">*</span></h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                      placeholder="Enter new password"
                    />
                    <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                      placeholder="Confirm new password"
                    />
                    <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Permissions Section */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Permissions</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {modulesList.map(module => (
                  <div key={module} className="flex flex-col items-center">
                    <div className="text-xs text-gray-600 mb-2 text-center">{module}</div>
                    <button
                      type="button"
                      onClick={() => togglePermission(module)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        (newRule.permissions || []).includes(module)
                          ? 'bg-blue-600'
                          : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          (newRule.permissions || []).includes(module)
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-xs text-gray-500 mt-1">
                      {(newRule.permissions || []).includes(module) ? 'ON' : 'OFF'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
           
            <div className="flex justify-end space-x-2">
              <button
                onClick={cancelNewEmployee}
                className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveNewEmployee}
                className="px-4 py-2 text-sm bg-black text-white rounded hover:bg-gray-800"
              >
                Save Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditEmployeeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">
                <span className="bg-gray-200 px-2 py-0.5 rounded">
                  Edit Employee Access
                </span>
              </h3>
              <button
                onClick={cancelEdit}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {/* Basic Information Section */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">ID</label>
                  <input
                    type="text"
                    value={editForm.id || ''}
                    disabled
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => handleEditFormChange('name', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => handleEditFormChange('email', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Role <span className="text-red-500">*</span></label>
                  <select
                    value={editForm.role || 'User'}
                    onChange={(e) => handleEditFormChange('role', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    {accessLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Password Reset Section */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Password Reset</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                      placeholder="Enter new password"
                    />
                    <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                      placeholder="Confirm new password"
                    />
                    <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Leave blank to keep current password</p>
            </div>

            {/* Permissions Section */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Permissions</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {modulesList.map(module => (
                  <div key={module} className="flex flex-col items-center">
                    <div className="text-xs text-gray-600 mb-2 text-center">{module}</div>
                    <button
                      type="button"
                      onClick={() => toggleEditPermission(module)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        (editForm.permissions || []).includes(module)
                          ? 'bg-blue-600'
                          : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          (editForm.permissions || []).includes(module)
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-xs text-gray-500 mt-1">
                      {(editForm.permissions || []).includes(module) ? 'ON' : 'OFF'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
           
            <div className="flex justify-end space-x-2">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 text-sm bg-black text-white rounded hover:bg-gray-800"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Column Management Modal */}
      {showColumnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <div></div>
              <button onClick={() => setShowColumnModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
           
            <div className="mb-4 p-3 rounded">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base -mt-5 mb-2">
                <span className="bg-gray-200 px-2 py-0.5 rounded">
                  Add New Custom Column
                </span>
              </h3>

              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Column name (e.g., Phone Number)"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  className="flex-grow px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded"
                />
                <button
                  onClick={handleAddColumn}
                  className="px-3 py-2 text-xs sm:text-sm bg-black text-white rounded hover:bg-gray-800 whitespace-nowrap"
                >
                  Add Column
                </button>
              </div>
            </div>            
            
            <div className="mb-4">
              <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">Available Columns</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {columns.map((column) => {
                  const isFixedColumn = ['id', 'name', 'email', 'role'].includes(column.id);
                  const isEditing = editingColumn === column.id;
                 
                  return (
                    <div key={column.id} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={column.visible}
                          onChange={() => toggleColumnVisibility(column.id)}
                          className="h-3 w-3 sm:h-4 sm:w-4"
                        />
                        {isEditing ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={tempColumnName}
                              onChange={(e) => setTempColumnName(e.target.value)}
                              className="px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded"
                            />
                            <button
                              onClick={() => saveEditColumn(column.id)}
                              className="text-green-600 hover:text-green-800"
                              title="Save"
                            >
                              <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                            <button
                              onClick={cancelEditColumn}
                              className="text-red-600 hover:text-red-800"
                              title="Cancel"
                            >
                              <X className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="text-xs sm:text-sm text-gray-700">{column.label}</span>
                            {column.required && (
                              <span className="text-[8px] px-1 py-0.5 bg-red-100 text-red-800 rounded">
                                Required
                              </span>
                            )}
                          </>
                        )}
                      </div>
                     
                      <div className="flex items-center space-x-2">
                        {/* View/Hide button */}
                        <button
                          onClick={() => toggleColumnVisibility(column.id)}
                          className={`${column.visible ? 'text-blue-600 hover:text-blue-800' : 'text-gray-400 hover:text-gray-600'}`}
                          title={column.visible ? "Hide column" : "Show column"}
                        >
                          {column.visible ? <Eye className="h-3 w-3 sm:h-4 sm:w-4" /> : <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />}
                        </button>

                        {/* Edit button for all columns */}
                        {!isEditing && (
                          <button
                            onClick={() => startEditColumn(column.id, column.label)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        )}
                       
                        {/* Delete button */}
                        {!isFixedColumn && (
                          <button
                            onClick={() => handleDeleteColumn(column.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
           
            <div className="flex justify-end">
              <button
                onClick={() => setShowColumnModal(false)}
                className="px-3 py-1.5 text-xs sm:text-sm bg-black text-white rounded hover:bg-gray-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN BORDER CONTAINER */}
      <div className="bg-white border border-gray-300 rounded mx-0">
       
        {/* Loading / Error State */}
        {loading && (
            <div className="p-8 text-center text-gray-500">
                Loading data...
            </div>
        )}
        
        {error && (
            <div className="p-8 text-center text-red-500">
                {error}
            </div>
        )}

        {!loading && !error && (
            <>
        {/* TOOLBAR SECTION */}
        <div className="p-4 border-b border-gray-300">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
           
            {/* LEFT SIDE */}
            <div className="flex flex-1 flex-col sm:flex-row gap-2 sm:gap-2 items-start sm:items-center">
              {/* Search */}
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full sm:w-48 h-10 pl-9 pr-3 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleAddEmployeeClick}
                  className="flex items-center gap-1 h-10 px-3 bg-black text-white rounded text-xs sm:text-sm hover:bg-gray-800"
                >
                  <Plus className="h-4 w-4" />
                  Add Access
                </button>

                <button
                  onClick={() => setShowColumnModal(true)}
                  className="flex items-center gap-1 h-10 px-3 bg-black text-white rounded text-xs sm:text-sm hover:bg-gray-800"
                >
                  <Plus className="h-4 w-4" />
                  Add Column
                </button>
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex gap-2 mt-2 sm:mt-0">
              {/* Department Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={departmentFilter}
                  onChange={(e) => handleDepartmentFilterChange(e.target.value)}
                  className="h-10 pl-9 pr-8 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black w-full sm:w-48 appearance-none bg-white"
                >
                  {uniqueDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Access Level Filter */}
              <div className="relative">
                <select
                  value={accessLevelFilter}
                  onChange={(e) => handleAccessLevelFilterChange(e.target.value)}
                  className="h-10 px-3 pr-8 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black w-full sm:w-48 appearance-none bg-white"
                >
                  <option value="All Access Levels">All Access Levels</option>
                  {accessLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* TABLE SECTION */}
        <div className="overflow-auto max-h-[calc(100vh-300px)]">
          <table className="min-w-full text-xs sm:text-sm border-collapse">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr className="border-b border-gray-300">
                {columns.filter(col => col.visible).map(col => (
                  <th
                    key={col.id}
                    className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-200 whitespace-nowrap border-r border-gray-300 last:border-r-0"
                    onClick={() => col.sortable && handleSort(col.id)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{col.label}</span>
                      {col.required && <span className="text-red-500">*</span>}
                      {col.sortable && getSortIcon(col.id)}
                    </div>
                  </th>
                ))}
                <th className="text-left py-3 px-4 font-medium text-gray-700 whitespace-nowrap border-r border-gray-300">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {sortedRules.map(rule => (
                <tr
                  key={rule.accessRuleId}
                  className="border-b border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  {columns.filter(col => col.visible).map(col => (
                    <td key={col.id} className="py-3 px-4 whitespace-nowrap border-r border-gray-300 last:border-r-0">
                      {renderCellContent(col, rule[col.id], rule)}
                    </td>
                  ))}
                  <td className="py-3 px-4 whitespace-nowrap border-r border-gray-300">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => startEditing(rule)} className="p-1 text-blue-600 hover:text-blue-800">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => showDeleteConfirmation(rule.accessRuleId, rule.name)} className="p-1 text-red-600 hover:text-red-800">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER SECTION */}
        <div className="px-4 py-3 border-t border-gray-300 text-xs text-gray-600 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Showing {sortedRules.length} employees
            {departmentFilter !== "All Departments" && ` (Filtered by Dept: ${departmentFilter})`}
            {accessLevelFilter !== "All Access Levels" && ` (Filtered by Access: ${accessLevelFilter})`}
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default EmployeeAccess;