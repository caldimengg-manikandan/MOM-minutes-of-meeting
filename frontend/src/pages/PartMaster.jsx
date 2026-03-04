import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, X, Check, ChevronUp, ChevronDown, Filter, Download, Eye, EyeOff, Package, DollarSign, AlertTriangle, Box, TrendingUp, Hash, Tag } from 'lucide-react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const PartMaster = () => {
  // Fixed columns matching backend Part model
  const columns = [
    { id: 'id', label: 'Part ID', sortable: true, type: 'text', required: true, visible: true },
    { id: 'name', label: 'Part Name', sortable: true, type: 'text', required: true, visible: true },
    { id: 'category', label: 'Category', sortable: true, type: 'text', required: false, visible: true },
    { id: 'stock', label: 'Stock', sortable: true, type: 'number', required: true, visible: true },
    { id: 'reorderLevel', label: 'Reorder Level', sortable: true, type: 'number', required: false, visible: true },
    { id: 'price', label: 'Price', sortable: true, type: 'number', required: true, visible: true },
    { id: 'status', label: 'Status', sortable: true, type: 'select', required: false, visible: true },
  ];

  // Status colors mapping
  const statusColors = {
    'In Stock': 'bg-green-100 text-green-800',
    'Reorder': 'bg-yellow-100 text-yellow-800',
    'Out of Stock': 'bg-red-100 text-red-800'
  };

  // Load columns from backend (initial state is fixed columns)
  const [availableColumns, setAvailableColumns] = useState(columns);
  const [parts, setParts] = useState([]);
  const [newPart, setNewPart] = useState({});
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showDeletePrompt, setShowDeletePrompt] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState('text');
  const [editingColumn, setEditingColumn] = useState(null);
  const [tempColumnName, setTempColumnName] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showDeleteColumnPrompt, setShowDeleteColumnPrompt] = useState(null);
  const [showAddPartModal, setShowAddPartModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const envBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const API_BASE_URL = envBaseUrl 
    ? (envBaseUrl.endsWith('/api') ? envBaseUrl : `${envBaseUrl}/api`) 
    : 'http://localhost:8000/api';
  const API_URL = `${API_BASE_URL}/parts`;

  const fixedColumnIds = ['id', 'name', 'category', 'stock', 'reorderLevel', 'price', 'status', 'created_at', 'updated_at'];

  // Helper to flatten API response
  const transformPartFromApi = (apiPart) => {
    const { custom_fields, ...rest } = apiPart;
    return { ...rest, ...(custom_fields || {}) };
  };

  // Helper to nest custom fields for API request
  const transformPartForSave = (partData) => {
    const stock = parseInt(partData.stock) || 0;
    const reorderLevel = parseInt(partData.reorderLevel) || 0;
    
    const payload = {
      name: partData.name,
      category: partData.category || '',
      stock: stock,
      reorderLevel: reorderLevel,
      price: parseFloat(partData.price) || 0,
      status: stock <= reorderLevel ? 'Reorder' : 'In Stock',
      custom_fields: {}
    };

    Object.keys(partData).forEach(key => {
      if (!fixedColumnIds.includes(key) && key !== 'custom_fields' && key !== 'id') {
        payload.custom_fields[key] = partData[key];
      }
    });

    return payload;
  };

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Fetch parts from backend
  useEffect(() => {
    fetchParts();
    fetchColumns();
  }, []);

  const fetchParts = () => {
    axios.get(API_URL)
      .then(res => {
        const flattenedParts = res.data.map(transformPartFromApi);
        setParts(flattenedParts);
      })
      .catch(err => console.error('Error fetching parts:', err));
  };

  const fetchColumns = () => {
    axios.get(`${API_URL}/columns/all`)
      .then(res => {
        const dbColumns = res.data.map(col => ({
          id: col.column_name,
          label: col.column_label,
          type: col.data_type,
          required: col.is_required,
          sortable: true,
          visible: true, // Default to visible
          dbId: col.id
        }));

        const fixedCols = columns.filter(c => !dbColumns.some(dc => dc.id === c.id));
        const savedVisibility = JSON.parse(localStorage.getItem('partColumnVisibility')) || {};

        const mergedColumns = [...fixedCols, ...dbColumns].map(col => ({
          ...col,
          visible: savedVisibility[col.id] ?? true
        }));

        setAvailableColumns(mergedColumns);
      })
      .catch(err => console.error('Error fetching columns:', err));
  };

  // Toggle column visibility
  const toggleColumnVisibility = (columnId) => {
    const updatedColumns = availableColumns.map(col =>
      col.id === columnId ? { ...col, visible: !col.visible } : col
    );

    setAvailableColumns(updatedColumns);

    // save to localStorage
    const visibilityMap = {};
    updatedColumns.forEach(col => {
      visibilityMap[col.id] = col.visible;
    });

    localStorage.setItem('partColumnVisibility', JSON.stringify(visibilityMap));
  };

  // Get visible columns for table
  const visibleColumns = availableColumns.filter(col => col.visible);

  // Column editing functions
  const startEditColumn = (columnId, currentLabel) => {
    setEditingColumn(columnId);
    setTempColumnName(currentLabel);
  };

  const saveEditColumn = (columnId) => {
    if (tempColumnName.trim()) {
      const column = availableColumns.find(col => col.id === columnId);
      
      if (column && column.dbId) {
        axios.put(`${API_URL}/columns/${column.dbId}`, {
          column_label: tempColumnName
        })
        .then(() => {
          fetchColumns();
          setEditingColumn(null);
          setTempColumnName('');
          showNotification('Column updated successfully');
        })
        .catch(err => {
          console.error(err);
          const msg = err.response?.data?.detail || err.message;
          alert('Error updating column: ' + msg);
        });
      } else {
        setAvailableColumns(availableColumns.map(col =>
          col.id === columnId ? { ...col, label: tempColumnName } : col
        ));
        setEditingColumn(null);
        setTempColumnName('');
        showNotification('Column updated successfully');
      }
    }
  };

  const cancelEditColumn = () => {
    setEditingColumn(null);
    setTempColumnName('');
  };

  const handleDeleteColumn = (columnId) => {
    const column = availableColumns.find(col => col.id === columnId);
    const isFixedColumn = ['id', 'name', 'category', 'stock', 'reorderLevel', 'price', 'status'].includes(columnId);
   
    if (isFixedColumn) {
      setShowDeleteColumnPrompt({
        id: columnId,
        title: 'Cannot Delete Column',
        message: `Cannot delete fixed column: ${column.label}. Fixed columns are required for the Part Master.`,
        type: 'warning',
        columnLabel: column.label
      });
      return;
    }
   
    setShowDeleteColumnPrompt({
      id: columnId,
      title: 'Delete Column',
      columnLabel: column.label,
      type: 'delete'
    });
  };

  const confirmDeleteColumn = () => {
    if (!showDeleteColumnPrompt) return;
   
    const columnId = showDeleteColumnPrompt.id;
    const column = availableColumns.find(col => col.id === columnId);

    const cleanupAndClose = () => {
      if (isAddingNew) {
        const newPartData = { ...newPart };
        delete newPartData[columnId];
        setNewPart(newPartData);
      }
      setShowDeleteColumnPrompt(null);
      setShowColumnModal(false);
    };
   
    if (column && column.dbId) {
      axios.delete(`${API_URL}/columns/${column.dbId}`)
        .then(() => {
          fetchColumns();
          cleanupAndClose();
          showNotification('Column deleted successfully');
        })
        .catch(err => {
          console.error(err);
          const msg = err.response?.data?.detail || err.message;
          alert('Error deleting column: ' + msg);
        });
    } else {
      setAvailableColumns(availableColumns.filter(col => col.id !== columnId));
      cleanupAndClose();
      showNotification('Column deleted successfully');
    }
  };

  // Sorting
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 opacity-30" />;
    return sortConfig.direction === 'ascending' ? <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" /> : <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />;
  };

  // Validation
  const validatePartForm = (part) => {
    const errors = {};
    for (const col of availableColumns) {
      if (col.required && !part[col.id]?.toString().trim()) {
        errors[col.id] = `${col.label} is required`;
      }
      if (col.type === 'number') {
        const numValue = parseFloat(part[col.id]);
        if (col.required && (isNaN(numValue) || numValue < 0)) {
          errors[col.id] = `${col.label} must be a valid positive number`;
        }
      }
    }
    return errors;
  };

  // Add Part Modal Functions
  const handleAddPartClick = () => {
    setShowAddPartModal(true);
    setValidationErrors({});
    const initialPart = {};
    availableColumns.forEach(col => {
      if (col.id === 'status') {
        initialPart[col.id] = 'In Stock';
      } else if (col.type === 'number') {
        initialPart[col.id] = '0';
      } else {
        initialPart[col.id] = '';
      }
    });
    setNewPart(initialPart);
  };

  const saveNewPart = () => {
    const errors = validatePartForm(newPart);
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return; // Don't submit if there are errors
    }

    const payload = transformPartForSave(newPart);
    console.log('Saving part payload:', payload);

    axios.post(API_URL, payload)
      .then(() => {
        fetchParts();
        setShowAddPartModal(false);
        setValidationErrors({});
        // Reset form
        const initialPart = {};
        availableColumns.forEach(col => {
          if (col.id === 'status') {
            initialPart[col.id] = 'In Stock';
          } else if (col.type === 'number') {
            initialPart[col.id] = '0';
          } else {
            initialPart[col.id] = '';
          }
        });
        setNewPart(initialPart);
        showNotification('Part added successfully');
      })
      .catch(err => {
        console.error(err);
        const msg = err.response?.data?.detail || err.message;
        alert('Error saving part: ' + msg);
      });
  };

  const cancelNewPart = () => {
    setShowAddPartModal(false);
    setValidationErrors({});
    const initialPart = {};
    availableColumns.forEach(col => {
      if (col.id === 'status') {
        initialPart[col.id] = 'In Stock';
      } else if (col.type === 'number') {
        initialPart[col.id] = '0';
      } else {
        initialPart[col.id] = '';
      }
    });
    setNewPart(initialPart);
  };

  // Edit Part
  const startEditing = (part) => {
    if (isAddingNew) cancelNewPart();
    setEditingId(part.id);
    setEditForm({ ...part });
    setValidationErrors({});
  };

  const saveEdit = () => {
    const errors = validatePartForm(editForm);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    const payload = transformPartForSave(editForm);
    console.log('Updating part payload:', payload);

    axios.put(`${API_URL}/${editingId}`, payload)
      .then(() => { 
        fetchParts(); 
        setEditingId(null); 
        setEditForm({}); 
        setValidationErrors({}); 
        showNotification('Part updated successfully');
      })
      .catch(err => {
        console.error(err);
        const msg = err.response?.data?.detail || err.message;
        alert('Error updating part: ' + msg);
      });
  };

  const cancelEdit = () => { setEditingId(null); setEditForm({}); setValidationErrors({}); };

  // Delete Part
  const showDeleteConfirmation = (id, name) => setShowDeletePrompt({ id, name });

  const confirmDeletePart = () => {
    if (!showDeletePrompt) return;

    axios.delete(`${API_URL}/${showDeletePrompt.id}`)
      .then(() => { 
        fetchParts(); 
        setShowDeletePrompt(null); 
        showNotification('Part deleted successfully');
      })
      .catch(err => {
        console.error(err);
        const msg = err.response?.data?.detail || err.message;
        alert('Error deleting part: ' + msg);
      });
  };

  const cancelDelete = () => setShowDeletePrompt(null);

  // Add new column
  const handleAddColumn = () => {
    if (newColumnName.trim()) {
      const newColumnId = newColumnName.toLowerCase().replace(/\s+/g, '_');
      
      // Check if column already exists
      if (availableColumns.find(col => col.id === newColumnId)) {
        alert('Column with this name already exists');
        return;
      }
      
      const columnPayload = {
        column_name: newColumnId,
        column_label: newColumnName,
        data_type: newColumnType,
        is_required: false
      };

      axios.post(`${API_URL}/columns/create`, columnPayload)
        .then(() => {
          fetchColumns();
          setNewColumnName('');
          setNewColumnType('text');
          setShowColumnModal(false);
          showNotification('Column added successfully');
        })
        .catch(err => {
          console.error(err);
          const msg = err.response?.data?.detail || err.message;
          alert('Error creating column: ' + msg);
        });
    }
  };

  // Export functions
  const handleExport = (format) => {
    const dataToExport = sortedParts.map(part => {
      const row = {};
      availableColumns.forEach(col => {
        row[col.label] = part[col.id] || '';
      });
      return row;
    });
   
    let content, mimeType, filename;
   
    switch(format) {
      case 'excel':
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Parts");
        XLSX.writeFile(wb, "parts.xlsx");
        setShowExportDropdown(false);
        return;
      case 'csv':
        content = convertToCSV(dataToExport);
        mimeType = 'text/csv';
        filename = 'parts.csv';
        break;
      case 'json':
        content = JSON.stringify(dataToExport, null, 2);
        mimeType = 'application/json';
        filename = 'parts.json';
        break;
      case 'pdf':
        exportToPDF(dataToExport);
        setShowExportDropdown(false);
        return;
    }
   
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
   
    setShowExportDropdown(false);
  };

  const exportToPDF = (data) => {
    const doc = new jsPDF();
    const tableColumn = availableColumns.map(col => col.label);
    const tableRows = data.map(part => 
      availableColumns.map(col => part[col.label] || '')
    );

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save("parts.pdf");
  };

  const convertToCSV = (data) => {
    if (data.length === 0) return '';
   
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const cell = row[header];
          return typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell;
        }).join(',')
      )
    ];
   
    return csvRows.join('\n');
  };

  // Render Input Fields
  const handleInputChange = (field, value, isEdit=false) => {
    if (isEdit) {
      const updatedForm = { ...editForm, [field]: value };
      
      // Auto-update status if stock or reorder level changes
      if (field === 'stock' || field === 'reorderLevel') {
        const stock = parseInt(updatedForm.stock) || 0;
        const reorderLevel = parseInt(updatedForm.reorderLevel) || 0;
        updatedForm.status = stock <= reorderLevel ? 'Reorder' : 'In Stock';
      }
      
      setEditForm(updatedForm);
    } else {
      const updatedPart = { ...newPart, [field]: value };
      
      // Auto-update status if stock or reorder level changes
      if (field === 'stock' || field === 'reorderLevel') {
        const stock = parseInt(updatedPart.stock) || 0;
        const reorderLevel = parseInt(updatedPart.reorderLevel) || 0;
        updatedPart.status = stock <= reorderLevel ? 'Reorder' : 'In Stock';
      }
      
      setNewPart(updatedPart);
    }
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderInput = (col, value, onChange, error, isModal = false) => {
    const inputClass = `w-full px-3 py-2 text-sm border ${error ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-1 focus:ring-black`;
    
    const statusOptions = ['In Stock', 'Reorder', 'Out of Stock'];
   
    if (col.id === 'status' || col.type === 'select') return (
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">{col.label} {col.required && <span className="text-red-500">*</span>}</label>
        <select
          value={value||'In Stock'}
          onChange={e=>onChange(col.id,e.target.value)}
          className={inputClass}
        >
          {statusOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
    if (col.type === 'number') return (
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">{col.label} {col.required && <span className="text-red-500">*</span>}</label>
        <input
          type="number"
          value={value||''}
          onChange={e=>onChange(col.id,e.target.value)}
          className={inputClass}
          min="0"
          step={col.id === 'price' ? "0.01" : "1"}
          placeholder={`Enter ${col.label.toLowerCase()}`}
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
    return (
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">{col.label} {col.required && <span className="text-red-500">*</span>}</label>
        <input
          type="text"
          value={value||''}
          onChange={e=>onChange(col.id,e.target.value)}
          className={inputClass}
          placeholder={`Enter ${col.label.toLowerCase()}`}
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  };

  const renderCellContent = (col, value, part) => {
    if (col.id === 'status') {
      const isLowStock = part && part.stock <= part.reorderLevel;
      return (
        <div className="flex items-center">
          {isLowStock ? (
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 mr-1" />
          ) : (
            <Box className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1" />
          )}
          <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs ${statusColors[value] || 'bg-gray-100 text-gray-800'}`}>
            {value||'-'}
          </span>
        </div>
      );
    } else if (col.id === 'price') {
      return (
        <div className="flex items-center">
          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 mr-1" />
          <span className="font-medium">${(parseFloat(value) || 0).toFixed(2)}</span>
        </div>
      );
    } else if (col.id === 'stock' || col.id === 'reorderLevel') {
      const isLowStock = col.id === 'stock' && part && part.stock <= part.reorderLevel;
      return (
        <div className="flex items-center">
          {col.id === 'stock' && (
            isLowStock ? (
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 mr-1" />
            ) : (
              <Box className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1" />
            )
          )}
          <span className={isLowStock ? 'text-red-600 font-medium' : ''}>
            {value||'0'}
          </span>
        </div>
      );
    } else if (col.id === 'category') {
      return (
        <span className="px-2 py-1 bg-gray-100 rounded text-[10px] sm:text-xs">
          {value||'-'}
        </span>
      );
    } else if (col.id === 'id') {
      return (
        <span className="font-mono text-xs sm:text-sm">{value}</span>
      );
    }
    return value||'-';
  };

  // Filter & Sort
  const uniqueCategories = [...new Set(parts.map(part=>part.category).filter(Boolean))];
  const statusOptions = ['All Status', 'In Stock', 'Reorder', 'Out of Stock'];

  const filteredParts = parts.filter(part => {
    const matchesSearch = Object.values(part).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !categoryFilter || part.category?.toLowerCase().includes(categoryFilter.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || part.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const sortedParts = React.useMemo(() => {
    if (!sortConfig.key) return filteredParts;
    return [...filteredParts].sort((a,b)=>{
      const aVal = a[sortConfig.key]||'';
      const bVal = b[sortConfig.key]||'';
      if(aVal<bVal) return sortConfig.direction==='ascending'?-1:1;
      if(aVal>bVal) return sortConfig.direction==='ascending'?1:-1;
      return 0;
    });
  }, [filteredParts, sortConfig]);

  // Calculate part statistics
  const lowStockParts = parts.filter(p => p.stock <= p.reorderLevel);
  const totalInventoryValue = parts.reduce((sum, p) => sum + (parseFloat(p.price) || 0) * (parseInt(p.stock) || 0), 0);
  const uniqueCategoryCount = [...new Set(parts.map(p => p.category).filter(Boolean))].length;

  return (
    <div className="space-y-3 sm:space-y-4 px-0">
      {/* Notification Banner */}
      {notification.show && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
          notification.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 
          notification.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' : 
          'bg-blue-100 text-blue-800 border border-blue-200'
        }`}>
          <div className="flex items-center">
            <span className="text-sm font-medium">{notification.message}</span>
            <button 
              onClick={() => setNotification({ show: false, message: '', type: '' })} 
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Part Modal */}
      {showDeletePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Confirm Delete</h3>
              <button onClick={cancelDelete} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4 sm:h-5 sm:w-5"/></button>
            </div>
            <div className="mb-4">
              <p className="text-xs sm:text-sm text-gray-600">Delete part <span className="font-medium">{showDeletePrompt.name}</span>?</p>
              <p className="text-xs text-red-600 mt-1">This action cannot be undone.</p>
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={cancelDelete} className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
              <button onClick={confirmDeletePart} className="px-3 py-1.5 text-xs sm:text-sm bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Column Prompt */}
      {showDeleteColumnPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">
                {showDeleteColumnPrompt.title}
              </h3>
              <button
                onClick={() => setShowDeleteColumnPrompt(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5"/>
              </button>
            </div>

            <div className="mb-4">
              {showDeleteColumnPrompt.type === 'warning' ? (
                <p className="text-xs sm:text-sm text-gray-600">
                  {showDeleteColumnPrompt.message}
                </p>
              ) : (
                <>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Are you sure you want to delete column
                    <span className="font-medium">
                      {" "}{showDeleteColumnPrompt.columnLabel}
                    </span>?
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    This action cannot be undone.
                  </p>
                </>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteColumnPrompt(null)}
                className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                {showDeleteColumnPrompt.type === 'warning' ? 'OK' : 'Cancel'}
              </button>

              {showDeleteColumnPrompt.type === 'delete' && (
                <button
                  onClick={confirmDeleteColumn}
                  className="px-3 py-1.5 text-xs sm:text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              )}
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
                  placeholder="Column name (e.g., Supplier)"
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
                {availableColumns.map((column) => {
                  const isFixedColumn = ['id', 'name', 'category', 'stock', 'reorderLevel', 'price', 'status'].includes(column.id);
                  const isEditing = editingColumn === column.id;
                 
                  return (
                    <div key={column.id} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                      <div className="flex items-center space-x-2">
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
                            <span className="">{column.label}</span>
                            {column.required && (
                              <span className="">
                                {/* Required */}
                              </span>
                            )}
                            {isFixedColumn && (
                              <span className="">
                                {/* Fixed */}
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
                        <button
                          onClick={() => handleDeleteColumn(column.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
           
           
          </div>
        </div>
      )}

      {/* Add Part Modal */}
      {showAddPartModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">
                <span className="bg-gray-200 px-2 py-0.5 rounded">
                  Add New Part
                </span>
              </h3>
              <button
                onClick={cancelNewPart}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

           
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {availableColumns.map((col) => (
                <div key={col.id} className="col-span-1">
                  {renderInput(col, newPart[col.id], (f, v) => handleInputChange(f, v), validationErrors[col.id], true)}
                </div>
              ))}
            </div>
           
            <div className="flex justify-end space-x-2">
              <button
                onClick={cancelNewPart}
                className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveNewPart}
                className="px-4 py-2 text-sm bg-black text-white rounded hover:bg-gray-800"
              >
                Save Part
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MAIN BORDER CONTAINER */}
      <div className="bg-white border border-gray-300 rounded mx-0">
       
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
                  onClick={handleAddPartClick}
                  className="flex items-center gap-1 h-10 px-3 bg-black text-white rounded text-xs sm:text-sm hover:bg-gray-800"
                >
                  <Plus className="h-4 w-4" />
                  Add Part
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
              {/* Category Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter..."
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="h-10 pl-9 pr-3 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black w-full sm:w-48"
                />
                {categoryFilter && (
                  <button
                    onClick={() => setCategoryFilter('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                )}
              </div>

              {/* Export Button with Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  className="flex items-center gap-1 h-10 px-3 bg-black text-white rounded text-xs sm:text-sm hover:bg-gray-800"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
               
                {/* Export Dropdown */}
                {showExportDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowExportDropdown(false)}
                    />
                    <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-300 rounded shadow-lg z-50">
                      <button
                        onClick={() => handleExport('excel')}
                        className="block w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Export as Excel
                      </button>
                      <button
                        onClick={() => handleExport('csv')}
                        className="block w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Export as CSV
                      </button>
                      <button
                        onClick={() => handleExport('json')}
                        className="block w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Export as JSON
                      </button>
                      <button
                        onClick={() => handleExport('pdf')}
                        className="block w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Export as PDF
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* TABLE SECTION */}
        <div className="overflow-auto max-h-[calc(100vh-300px)]">
          <table className="min-w-full text-xs sm:text-sm border-collapse">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr className="border-b border-gray-300">
                {visibleColumns.map(col => (
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
              {sortedParts.map(part => (
                <tr
                  key={part.id}
                  className="border-b border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  {editingId === part.id ?
                    visibleColumns.map(col => (
                      <td key={col.id} className="py-3 px-4 whitespace-nowrap border-r border-gray-300 last:border-r-0">
                        {renderInput(col, editForm[col.id], (f, v) => handleInputChange(f, v, true), validationErrors[col.id])}
                      </td>
                    )) :
                    visibleColumns.map(col => (
                      <td key={col.id} className="py-3 px-4 whitespace-nowrap border-r border-gray-300 last:border-r-0">
                        {renderCellContent(col, part[col.id], part)}
                      </td>
                    ))
                  }
                  <td className="py-3 px-4 whitespace-nowrap border-r border-gray-300">
                    {editingId === part.id ? (
                      <div className="flex items-center space-x-2">
                        <button onClick={saveEdit} className="p-1 text-green-600 hover:text-green-800">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={cancelEdit} className="p-1 text-red-600 hover:text-red-800">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <button onClick={() => startEditing(part)} className="p-1 text-blue-600 hover:text-blue-800">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => showDeleteConfirmation(part.id, part.name)} className="p-1 text-red-600 hover:text-red-800">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER SECTION */}
        <div className="px-4 py-3 border-t border-gray-300 text-xs text-gray-600 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Showing {sortedParts.length} of {parts.length} parts
            {(categoryFilter || statusFilter !== "All Status") &&
              ` (Filtered${categoryFilter ? ` by Category: ${categoryFilter}` : ''}${statusFilter !== "All Status" ? ` by Status: ${statusFilter}` : ''})`
            }
            <span className="ml-2 text-blue-600">
              ({visibleColumns.length} of {availableColumns.length} columns visible)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartMaster;