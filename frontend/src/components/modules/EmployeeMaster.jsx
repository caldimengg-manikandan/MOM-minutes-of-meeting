import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Download, Edit, Trash2, Users, 
  X, Check, ChevronUp, ChevronDown
} from 'lucide-react';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from "../../utils/employeeApi";


const EmployeeMaster = () => {
  // Initial columns configuration
  const initialColumns = [
    { id: 'name', label: 'Name', visible: true, sortable: true, type: 'text', required: true },
    { id: 'email', label: 'Email', visible: true, sortable: true, type: 'email', required: true },
    { id: 'department', label: 'Department', visible: true, sortable: true, type: 'text', required: false },
    { id: 'role', label: 'Role', visible: true, sortable: true, type: 'text', required: false },
    { id: 'status', label: 'Status', visible: true, sortable: true, type: 'select', required: true },
  ];

  const [employees, setEmployees] = useState([]);
  const [newEmployee, setNewEmployee] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showDeletePrompt, setShowDeletePrompt] = useState(null);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState('text');
  const [columns, setColumns] = useState(initialColumns);
  const [editingColumn, setEditingColumn] = useState(null);
  const [tempColumnName, setTempColumnName] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  // 🟢 Load employees from backend
  const loadEmployees = async () => {
    try {
      const res = await getEmployees();
      setEmployees(res.data);
    } catch (err) {
      console.error("Failed to load employees", err);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  // Filter employees based on search
  const filteredEmployees = employees.filter(emp =>
    Object.values(emp).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Sort employees
  const sortedEmployees = React.useMemo(() => {
    if (!sortConfig.key) return filteredEmployees;

    return [...filteredEmployees].sort((a, b) => {
      const aVal = a[sortConfig.key] || '';
      const bVal = b[sortConfig.key] || '';
      
      if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
  }, [filteredEmployees, sortConfig]);

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 opacity-30" />;
    return sortConfig.direction === 'ascending' 
      ? <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" /> 
      : <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />;
  };

  // Validate employee form
  const validateEmployeeForm = (employee) => {
    const requiredColumns = columns.filter(col => col.required && col.visible);
    for (const column of requiredColumns) {
      if (!employee[column.id]?.toString().trim()) {
        return `${column.label} is required`;
      }
      if (column.type === 'email' && !employee[column.id].includes('@')) {
        return 'Please enter a valid email address';
      }
    }
    return '';
  };

  // Add Employee
  const handleAddEmployeeClick = () => {
    setIsAddingNew(true);
    const initialEmployee = {};
    columns.filter(col => col.visible).forEach(col => {
      initialEmployee[col.id] = col.type === 'select' ? 'Active' : '';
    });
    setNewEmployee(initialEmployee);
  };

  const saveNewEmployee = async () => {
    const error = validateEmployeeForm(newEmployee);
    if (error) {
      alert(error);
      return;
    }
    try {
      await createEmployee(newEmployee);
      await loadEmployees();
      cancelNewEmployee();
    } catch {
      alert("Failed to add employee");
    }
  };

  const cancelNewEmployee = () => {
    setIsAddingNew(false);
    setNewEmployee({});
  };

  // Edit Employee
  const startEditing = (employee) => {
    if (isAddingNew) cancelNewEmployee();
    setEditingId(employee.id);
    const editData = { ...employee };
    columns.forEach(col => {
      if (!editData.hasOwnProperty(col.id)) editData[col.id] = col.type === 'select' ? 'Active' : '';
    });
    setEditForm(editData);
  };

  const saveEdit = async () => {
    const error = validateEmployeeForm(editForm);
    if (error) {
      alert(error);
      return;
    }
    try {
      await updateEmployee(editingId, editForm);
      await loadEmployees();
      cancelEdit();
    } catch {
      alert("Failed to update employee");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // Delete Employee
  const showDeleteConfirmation = (id, name) => {
    setShowDeletePrompt({ id, name });
  };

  const confirmDeleteEmployee = async () => {
    try {
      await deleteEmployee(showDeletePrompt.id);
      await loadEmployees();
      setShowDeletePrompt(null);
    } catch {
      alert("Failed to delete employee");
    }
  };

  const cancelDelete = () => setShowDeletePrompt(null);

  // Column management
  const handleAddColumn = () => {
    if (!newColumnName.trim()) return;

    const newColumnId = newColumnName.toLowerCase().replace(/\s+/g, '_');
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
    const defaultValue = newColumnType === 'select' ? 'Active' : '';
    setEmployees(employees.map(emp => ({ ...emp, [newColumnId]: defaultValue })));
    if (isAddingNew) setNewEmployee(prev => ({ ...prev, [newColumnId]: defaultValue }));

    setNewColumnName('');
    setNewColumnType('text');
  };

  const startEditColumn = (columnId, currentLabel) => {
    setEditingColumn(columnId);
    setTempColumnName(currentLabel);
  };

  const saveEditColumn = (columnId) => {
    if (!tempColumnName.trim()) return;
    setColumns(columns.map(col => col.id === columnId ? { ...col, label: tempColumnName } : col));
    setEditingColumn(null);
    setTempColumnName('');
  };

  const cancelEditColumn = () => {
    setEditingColumn(null);
    setTempColumnName('');
  };

  const handleDeleteColumn = (columnId) => {
    if (!window.confirm('Are you sure you want to delete this column?')) return;
    setColumns(columns.filter(col => col.id !== columnId));
    setEmployees(employees.map(emp => { const e = { ...emp }; delete e[columnId]; return e; }));
    if (isAddingNew) { const e = { ...newEmployee }; delete e[columnId]; setNewEmployee(e); }
  };

  const toggleColumnVisibility = (columnId) => {
    setColumns(columns.map(col => col.id === columnId ? { ...col, visible: !col.visible } : col));
  };

  const handleNewEmployeeChange = (field, value) => setNewEmployee({...newEmployee, [field]: value});
  const handleEditFormChange = (field, value) => setEditForm({...editForm, [field]: value});
  // Render input based on column type
  const renderInput = (column, value, onChange, placeholder = true) => {
    if (column.type === 'select') {
      return (
        <select
          value={value || 'Active'}
          onChange={(e) => onChange(column.id, e.target.value)}
          className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded"
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Pending">Pending</option>
        </select>
      );
    } else if (column.type === 'email') {
      return (
        <input
          type="email"
          placeholder={placeholder ? `Enter ${column.label.toLowerCase()}` : ''}
          value={value || ''}
          onChange={(e) => onChange(column.id, e.target.value)}
          className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded"
        />
      );
    } else {
      return (
        <input
          type="text"
          placeholder={placeholder ? `Enter ${column.label.toLowerCase()}` : ''}
          value={value || ''}
          onChange={(e) => onChange(column.id, e.target.value)}
          className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded"
        />
      );
    }
  };

  // Render cell content based on column type
  const renderCellContent = (column, value) => {
    if (column.type === 'select' || column.id === 'status') {
      return (
        <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs ${
          value === 'Active' 
            ? 'bg-green-100 text-green-800' 
            : value === 'Inactive'
            ? 'bg-red-100 text-red-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {value || '-'}
        </span>
      );
    }
    return value || '-';
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Delete Employee Prompt Modal */}
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
                onClick={confirmDeleteEmployee}
                className="px-3 py-1.5 text-xs sm:text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
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
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Manage Columns</h3>
              <button onClick={() => setShowColumnModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
            
            {/* Add New Column Form */}
            <div className="mb-4 p-3 border border-gray-300 rounded">
              <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">Add New Column</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Column name (e.g., Phone Number)"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  className="px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded"
                />
                {/* <select
                  value={newColumnType}
                  onChange={(e) => setNewColumnType(e.target.value)}
                  className="px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded"
                >
                  <option value="text">Text</option>
                  <option value="email">Email</option>
                  <option value="select">Dropdown</option>
                </select> */}
              </div>
              <button
                onClick={handleAddColumn}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-black text-white rounded hover:bg-gray-800"
              >
                Add Column
              </button>
            </div>
            
            {/* Existing Columns List */}
            <div className="mb-4">
              <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">Available Columns</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {columns.map((column) => (
                  <div key={column.id} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={column.visible}
                        onChange={() => toggleColumnVisibility(column.id)}
                        className="h-3 w-3 sm:h-4 sm:w-4"
                      />
                      {editingColumn === column.id ? (
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
                          {column.deletable && (
                            <span className="text-[8px] px-1 py-0.5 bg-gray-100 text-gray-600 rounded">
                              Custom
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {!['name', 'email', 'department', 'role', 'status'].includes(column.id) && (
                        <>
                          <button
                            onClick={() => startEditColumn(column.id, column.label)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteColumn(column.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
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

      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Employee Master
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">Manage employee records</p>
        </div>
        <button className="flex items-center justify-center sm:justify-start space-x-1 px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50 w-full sm:w-auto">
          <Download className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>Export</span>
        </button>
      </div>

      {/* Compact Stats - Responsive */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-white border border-gray-300 rounded p-3 sm:p-4 flex items-center">
          <div className="bg-gray-100 p-1.5 sm:p-2 rounded mr-2 sm:mr-3">
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500">Total</p>
            <p className="text-sm sm:text-base font-bold text-gray-900">{employees.length}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-300 rounded p-3 sm:p-4 flex items-center">
          <div className="bg-green-100 p-1.5 sm:p-2 rounded mr-2 sm:mr-3">
            <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500">Active</p>
            <p className="text-sm sm:text-base font-bold text-green-600">
              {employees.filter(e => e.status === 'Active').length}
            </p>
          </div>
        </div>
        <div className="bg-white border border-gray-300 rounded p-3 sm:p-4 flex items-center">
          <div className="bg-blue-100 p-1.5 sm:p-2 rounded mr-2 sm:mr-3">
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500">Departments</p>
            <p className="text-sm sm:text-base font-bold text-gray-900">
              {[...new Set(employees.map(e => e.department))].length}
            </p>
          </div>
        </div>
        <div className="bg-white border border-gray-300 rounded p-3 sm:p-4 flex items-center">
          <div className="bg-yellow-100 p-1.5 sm:p-2 rounded mr-2 sm:mr-3">
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-gray-500">Inactive</p>
            <p className="text-sm sm:text-base font-bold text-yellow-600">
              {employees.filter(e => e.status === 'Inactive').length}
            </p>
          </div>
        </div>
      </div>

      {/* Table Container with Toolbar */}
      <div className="bg-white border border-gray-300 rounded p-3 sm:p-4">
        {/* Toolbar with Search, Add Employee, Add Columns */}
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
            
            {/* Add Employee Button - Black */}
            <button
              onClick={handleAddEmployeeClick}
              className="flex items-center justify-center space-x-1 px-3 py-2 text-xs sm:text-sm bg-black text-white rounded hover:bg-gray-800 w-full sm:w-auto"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Add Employee</span>
            </button>

            {/* Add Columns Button */}
            <button 
              onClick={() => setShowColumnModal(true)}
             className="flex items-center justify-center space-x-1 px-3 py-2 text-xs sm:text-sm bg-black text-white rounded hover:bg-gray-800 w-full sm:w-auto"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Add Column</span>
            </button>
            
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <select className="w-full sm:w-auto px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded">
              <option>All Departments</option>
              <option>Engineering</option>
              <option>HR</option>
              <option>Sales</option>
            </select>
          </div>
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
              {/* Existing employees */}
              {sortedEmployees.map((employee) => (
                <tr key={employee.id} className="border-b border-gray-200 hover:bg-gray-50">
                  {editingId === employee.id ? (
                    <>
                      {/* Edit mode for visible columns */}
                      {columns
                        .filter(col => col.visible)
                        .map((column) => (
                          <td key={column.id} className="py-2 px-2 sm:px-3">
                            {renderInput(column, editForm[column.id], handleEditFormChange, false)}
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
                            {renderCellContent(column, employee[column.id])}
                          </td>
                        ))}
                      <td className="py-2 px-2 sm:px-3">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => startEditing(employee)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                          <button 
                            onClick={() => showDeleteConfirmation(employee.id, employee.name)}
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

              {/* Add new employee row at the bottom */}
              {isAddingNew && (
                <tr className="border-b border-gray-200 bg-blue-50">
                  {columns
                    .filter(col => col.visible)
                    .map((column) => (
                      <td key={column.id} className="py-2 px-2 sm:px-3">
                        {renderInput(column, newEmployee[column.id], handleNewEmployeeChange)}
                      </td>
                    ))}
                  <td className="py-2 px-2 sm:px-3">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={saveNewEmployee}
                        className="p-1 text-green-600 hover:text-green-800"
                        title="Save"
                      >
                        <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                      <button 
                        onClick={cancelNewEmployee}
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
            Showing {sortedEmployees.length} of {employees.length} employees
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

export default EmployeeMaster;