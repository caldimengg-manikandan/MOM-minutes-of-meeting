import React, { useState, useEffect } from 'react';
import { Building, Users, Target, Mail, Phone, Globe } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const DepartmentMaster = () => {
  // 🔹 remove mock data
  const [departments, setDepartments] = useState([]);

  const [newDept, setNewDept] = useState({
    name: '',
    head: '',
    budget: '',
    location: '',
  });

  // 🔹 fetch from backend
  useEffect(() => {
    fetch(`${API_BASE}/departments`)
      .then(res => res.json())
      .then(data => setDepartments(data))
      .catch(err => console.error("Failed to fetch departments", err));
  }, []);

  // 🔹 add department via backend
  const handleAddDepartment = async () => {
    if (!newDept.name || !newDept.head) return;

    const payload = {
      name: newDept.name,
      head: newDept.head,
      budget: parseFloat(newDept.budget) || 0,
      location: newDept.location,
    };

    try {
      const res = await fetch(`${API_BASE}/departments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) return;

      const saved = await res.json();
      setDepartments(prev => [...prev, saved]);

      setNewDept({ name: '', head: '', budget: '', location: '' });

    } catch (error) {
      console.error("Error adding department:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Building className="h-6 w-6 mr-2" />
            Department Master
          </h2>
          <p className="text-gray-600 mt-1">Organize departments, teams, and structure</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
          <Building className="h-4 w-4" />
          <span>New Department</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-300 rounded-xl p-4">
          <p className="text-sm text-gray-600">Total Departments</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{departments.length}</p>
        </div>
        <div className="bg-white border border-gray-300 rounded-xl p-4">
          <p className="text-sm text-gray-600">Total Employees</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {departments.reduce((sum, d) => sum + d.employees, 0)}
          </p>
        </div>
        <div className="bg-white border border-gray-300 rounded-xl p-4">
          <p className="text-sm text-gray-600">Total Budget</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            ${departments.reduce((sum, d) => sum + d.budget, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white border border-gray-300 rounded-xl p-4">
          <p className="text-sm text-gray-600">Avg. Dept Size</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {Math.round(departments.reduce((sum, d) => sum + d.employees, 0) / departments.length)}
          </p>
        </div>
      </div>

      {/* Add Department Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-300 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Department</h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Department Name"
              value={newDept.name}
              onChange={(e) => setNewDept({...newDept, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Department Head"
              value={newDept.head}
              onChange={(e) => setNewDept({...newDept, head: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Budget ($)"
                value={newDept.budget}
                onChange={(e) => setNewDept({...newDept, budget: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Location"
                value={newDept.location}
                onChange={(e) => setNewDept({...newDept, location: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <button
              onClick={handleAddDepartment}
              className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              Create Department
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-300 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Insights</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <p className="font-medium">Largest Department</p>
                  <p className="text-sm text-gray-600">
                    {departments.reduce((max, d) => d.employees > max.employees ? d : max, departments[0])?.name}
                  </p>
                </div>
              </div>
              <span className="text-lg font-bold">
                {departments.reduce((max, d) => d.employees > max.employees ? d : max, departments[0])?.employees}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <Target className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <p className="font-medium">Highest Budget</p>
                  <p className="text-sm text-gray-600">
                    {departments.reduce((max, d) => d.budget > max.budget ? d : max, departments[0])?.name}
                  </p>
                </div>
              </div>
              <span className="text-lg font-bold">
                ${departments.reduce((max, d) => d.budget > max.budget ? d : max, departments[0])?.budget?.toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium mb-2">Quick Actions</p>
              <div className="flex space-x-2">
                <button className="flex-1 flex items-center justify-center space-x-2 p-2 border border-gray-300 rounded-lg hover:bg-white">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">Email All</span>
                </button>
                <button className="flex-1 flex items-center justify-center space-x-2 p-2 border border-gray-300 rounded-lg hover:bg-white">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">Contact</span>
                </button>
                <button className="flex-1 flex items-center justify-center space-x-2 p-2 border border-gray-300 rounded-lg hover:bg-white">
                  <Globe className="h-4 w-4" />
                  <span className="text-sm">Website</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Departments Table */}
      <div className="bg-white border border-gray-300 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">All Departments</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Department</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Head</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Employees</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Budget</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <Building className="h-5 w-5 text-gray-500 mr-3" />
                      <span className="font-medium">{dept.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">{dept.head}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-gray-500 mr-2" />
                      <span>{dept.employees}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium">${dept.budget?.toLocaleString()}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      dept.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {dept.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">
                        Edit
                      </button>
                      <button className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm hover:bg-blue-200">
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DepartmentMaster;