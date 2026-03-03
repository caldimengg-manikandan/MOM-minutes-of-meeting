import React, { useState, useEffect } from 'react';
import { Package, Hash, Box, Tag, Filter, BarChart } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const PartMaster = () => {
  // 🔹 Start with empty array (data comes from DB)
  const [parts, setParts] = useState([]);

  const [newPart, setNewPart] = useState({
    id: '',
    name: '',
    category: '',
    stock: '',
    reorderLevel: '',
    price: '',
  });

  // 🔹 Fetch parts from backend
  useEffect(() => {
    fetch(`${API_BASE}/parts`)
      .then(res => res.json())
      .then(data => {
        const mapped = data.map(p => ({
          ...p,
          reorderLevel: p.reorder_level, // backend → frontend mapping
        }));
        setParts(mapped);
      })
      .catch(err => console.error("Failed to fetch parts", err));
  }, []);

  // 🔹 Add part via backend
  const handleAddPart = async () => {
    if (!newPart.id || !newPart.name) return;

    const payload = {
      id: newPart.id,
      name: newPart.name,
      category: newPart.category,
      stock: parseInt(newPart.stock) || 0,
      reorder_level: parseInt(newPart.reorderLevel) || 0,
      price: parseFloat(newPart.price) || 0,
    };

    try {
      const res = await fetch(`${API_BASE}/parts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.detail || "Failed to add part");
        return;
      }

      const saved = await res.json();

      setParts(prev => [
        ...prev,
        { ...saved, reorderLevel: saved.reorder_level }
      ]);

      setNewPart({
        id: '',
        name: '',
        category: '',
        stock: '',
        reorderLevel: '',
        price: '',
      });

    } catch (error) {
      console.error("Error adding part:", error);
    }
  };

  const lowStockParts = parts.filter(p => p.stock <= p.reorderLevel);
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Package className="h-6 w-6 mr-2" />
            Part Master
          </h2>
          <p className="text-gray-600 mt-1">Manage inventory, parts, and components</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
          <BarChart className="h-4 w-4" />
          <span>Stock Report</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-300 rounded-xl p-4">
          <p className="text-sm text-gray-600">Total Parts</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{parts.length}</p>
        </div>
        <div className="bg-white border border-gray-300 rounded-xl p-4">
          <p className="text-sm text-gray-600">Total Value</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            ${parts.reduce((sum, p) => sum + (p.price * p.stock), 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white border border-gray-300 rounded-xl p-4">
          <p className="text-sm text-gray-600">Low Stock</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{lowStockParts.length}</p>
        </div>
        <div className="bg-white border border-gray-300 rounded-xl p-4">
          <p className="text-sm text-gray-600">Categories</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {[...new Set(parts.map(p => p.category))].length}
          </p>
        </div>
      </div>

      {/* Add Part Form */}
      <div className="bg-white border border-gray-300 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Part</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Part ID"
              value={newPart.id}
              onChange={(e) => setNewPart({...newPart, id: e.target.value})}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <input
            type="text"
            placeholder="Part Name"
            value={newPart.name}
            onChange={(e) => setNewPart({...newPart, name: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          <input
            type="text"
            placeholder="Category"
            value={newPart.category}
            onChange={(e) => setNewPart({...newPart, category: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          <input
            type="number"
            placeholder="Stock Quantity"
            value={newPart.stock}
            onChange={(e) => setNewPart({...newPart, stock: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          <input
            type="number"
            placeholder="Reorder Level"
            value={newPart.reorderLevel}
            onChange={(e) => setNewPart({...newPart, reorderLevel: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Price ($)"
            value={newPart.price}
            onChange={(e) => setNewPart({...newPart, price: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <button
          onClick={handleAddPart}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
        >
          <Package className="h-4 w-4" />
          <span>Add Part</span>
        </button>
      </div>

      {/* Parts Table */}
      <div className="bg-white border border-gray-300 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="relative w-64">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg">
              <option>All Categories</option>
              <option>Electronics</option>
              <option>Memory</option>
              <option>Storage</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <button className={`px-4 py-2 rounded-lg ${lowStockParts.length > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
              Low Stock ({lowStockParts.length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Part ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Category</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Stock</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Reorder Level</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Price</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {parts.map((part) => {
                const isLowStock = part.stock <= part.reorderLevel;
                return (
                  <tr key={part.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono">{part.id}</td>
                    <td className="py-3 px-4">{part.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {part.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <Box className={`h-4 w-4 mr-2 ${isLowStock ? 'text-red-500' : 'text-green-500'}`} />
                        <span className={isLowStock ? 'text-red-600 font-medium' : ''}>
                          {part.stock}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">{part.reorderLevel}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <Tag className="h-4 w-4 text-gray-500 mr-1" />
                        <span>${part.price.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        isLowStock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {isLowStock ? 'Reorder' : 'In Stock'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PartMaster;