import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import supabase from "../lib/supabaseClient";
import { useAuth } from "../features/auth/AuthContext";
import { Plus, X, Search, Filter, ChevronDown, ChevronUp, Check, Clock, AlertCircle, Phone, Calendar, DollarSign, Edit3, Trash2, CheckCircle } from 'lucide-react';
import Sidebar from "../components/sidebar/Sidebar";
import BottomNavigation from "../components/bottombar/BottomNavigation";

// Helper Functions
const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

// Status Icons Component
const StatusIcon = ({ status }) => {
  const icons = {
    pending: <Clock className="h-4 w-4" />,
    in_progress: <AlertCircle className="h-4 w-4" />,
    done: <Check className="h-4 w-4" />,
  };
  return icons[status] || null;
};

const ReparationService = () => {
  const { t } = useTranslation();
  
  // State Management
  const [isOpen, setIsOpen] = useState(true);
  const { signOut } = useAuth();
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [filter, setFilter] = useState('all');
  const [activeItem, setActiveItem] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRepair, setExpandedRepair] = useState(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [formValues, setFormValues] = useState({
    client_name: '', 
    client_phone: '', 
    phone_model: '',
    issue_description: '', 
    repair_cost: '', 
    status: 'pending', 
    notes: '',
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentRepairId, setCurrentRepairId] = useState(null);

  const handleToggle = () => setIsOpen(!isOpen);
  const handleItemClick = (item) => setActiveItem(item);
  const handleLogout = () => signOut();

  // Data Fetching
  useEffect(() => {
    fetchRepairs();
  }, []);

  const fetchRepairs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('repairs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRepairs(data || []);
    } catch (error) {
      console.error('Error fetching repairs:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Form Handlers
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isEditMode) {
        // Update existing repair
        const { error } = await supabase
          .from('repairs')
          .update(formValues)
          .eq('id', currentRepairId);
        
        if (error) throw error;
      } else {
        // Create new repair
        const { error } = await supabase.from('repairs').insert([formValues]);
        if (error) throw error;
      }
      
      await fetchRepairs();
      resetForm();
      setIsFormVisible(false);
    } catch (error) {
      console.error('Error saving repair:', error.message);
      alert(t('notifications.saveError'));
    }
  };
  
  const resetForm = () => {
    setFormValues({
      client_name: '', 
      client_phone: '', 
      phone_model: '',
      issue_description: '', 
      repair_cost: '', 
      status: 'pending', 
      notes: '',
    });
    setIsEditMode(false);
    setCurrentRepairId(null);
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    resetForm();
    setIsFormVisible(false);
  }

  const toggleRepairDetails = (id) => {
    setExpandedRepair(expandedRepair === id ? null : id);
  };

  // Repair Actions
  const handleEdit = (repair) => {
    setFormValues({
      client_name: repair.client_name,
      client_phone: repair.client_phone,
      phone_model: repair.phone_model,
      issue_description: repair.issue_description,
      repair_cost: repair.repair_cost,
      status: repair.status,
      notes: repair.notes,
    });
    setCurrentRepairId(repair.id);
    setIsEditMode(true);
    setIsFormVisible(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('actions.deleteConfirm'))) return;
    
    try {
      const { error } = await supabase
        .from('repairs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchRepairs();
    } catch (error) {
      console.error('Error deleting repair:', error.message);
      alert(t('notifications.deleteError'));
    }
  };

  const handleMarkDone = async (id) => {
    try {
      const { error } = await supabase
        .from('repairs')
        .update({ status: 'done' })
        .eq('id', id);
      
      if (error) throw error;
      await fetchRepairs();
    } catch (error) {
      console.error('Error marking repair as done:', error.message);
      alert(t('notifications.updateError'));
    }
  };

  // Memoization and Filtering
  const filteredRepairs = useMemo(() => {
    let result = repairs;
    
    if (filter !== 'all') {
      result = result.filter(repair => repair.status === filter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(repair => 
        repair.client_name.toLowerCase().includes(query) ||
        repair.client_phone.toLowerCase().includes(query) ||
        repair.phone_model.toLowerCase().includes(query))
    }
    
    return result;
  }, [repairs, filter, searchQuery]);

  // Status Badge Styles
  const statusBadgeStyle = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
    done: 'bg-green-100 text-green-800 border-green-200',
  };

  const statusIconStyle = {
    pending: 'text-yellow-600',
    in_progress: 'text-blue-600',
    done: 'text-green-600',
  };

  // Stats Calculation
  const stats = useMemo(() => {
    const pending = repairs.filter(r => r.status === 'pending').length;
    const inProgress = repairs.filter(r => r.status === 'in_progress').length;
    const completed = repairs.filter(r => r.status === 'done').length;
    const totalRevenue = repairs.reduce((sum, r) => sum + parseFloat(r.repair_cost || 0), 0);
    
    return { pending, inProgress, completed, totalRevenue };
  }, [repairs]);

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      <div className="hidden lg:block fixed h-full">
        <Sidebar
          isOpen={isOpen}
          onToggle={handleToggle}
          onItemClick={handleItemClick}
          onLogout={handleLogout}
        />
      </div>

      <div className="block lg:hidden">
        <BottomNavigation
          activeItem={activeItem}
          onItemClick={handleItemClick}
          onLogout={handleLogout}
        />
      </div>

      <div className={`flex-1 overflow-hidden ${isOpen ? "lg:ml-64" : "lg:ml-20"} transition-all duration-300 ease-in-out`}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4 md:p-6 pb-28 md:pb-6">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-center md:text-left text-3xl lg:text-4xl font-bold text-[#24333E] tracking-tight">
                  {t('header')}
                </h1>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsFormVisible(true)}
                  className="group relative overflow-hidden bg-[#21A179] hover:bg-[#1a8a68] text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-2">
                    <Plus className="h-5 w-5 transition-transform group-hover:rotate-90 duration-300" />
                    <span>{t('form.toggleButton')}</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/50 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6A8DA6] mb-1">Pending</p>
                    <p className="text-2xl font-bold text-[#24333E]">{stats.pending}</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/50 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6A8DA6] mb-1">In Progress</p>
                    <p className="text-2xl font-bold text-[#24333E]">{stats.inProgress}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <AlertCircle className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/50 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6A8DA6] mb-1">Completed</p>
                    <p className="text-2xl font-bold text-[#24333E]">{stats.completed}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/50 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6A8DA6] mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold text-[#24333E]">{formatCurrency(stats.totalRevenue)}</p>
                  </div>
                  <div className="p-3 bg-[#21A179]/10 rounded-full">
                    <DollarSign className="h-6 w-6 text-[#21A179]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-[#6A8DA6]" />
                </div>
                <input
                  type="text"
                  placeholder={t('product_management.search.placeholder')}
                  className="pl-12 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#21A179] focus:border-[#21A179] transition-all duration-200 text-[#24333E] placeholder-[#6A8DA6]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="relative">
                <button 
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-200 text-[#24333E] rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium min-w-[160px] justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-[#6A8DA6]" />
                    <span>{t(`filter.${filter}`)}</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-[#6A8DA6] transition-transform duration-200 ${showFilterDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showFilterDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-20 overflow-hidden">
                    {['all', 'pending', 'in_progress', 'done'].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setFilter(status);
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-all duration-200 ${
                          filter === status ? 'bg-[#21A179]/10 text-[#21A179] border-r-2 border-[#21A179]' : 'hover:bg-gray-50 text-[#24333E]'
                        }`}
                      >
                        <div className={statusIconStyle[status] || 'text-[#6A8DA6]'}>
                          <StatusIcon status={status} />
                        </div>
                        {t(`filter.${status}`)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Add/Edit Repair Form Modal */}
          {isFormVisible && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white p-6 border-b border-gray-200 flex justify-between items-center rounded-t-3xl">
                  <h2 className="text-2xl font-bold text-[#24333E]">
                    {isEditMode ? t('form.editTitle') : t('form.title')}
                  </h2>
                  <button 
                    onClick={handleCancel}
                    className="p-2 rounded-full hover:bg-gray-100 text-[#6A8DA6] hover:text-[#24333E] transition-all duration-200"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="p-6 space-y-4">
                  <form onSubmit={handleFormSubmit}>
                    <div className="space-y-4">
                      {/* Client Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('form.clientNamePlaceholder')}
                          </label>
                          <input
                            name="client_name"
                            value={formValues.client_name}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#21A179] focus:border-[#21A179] transition-all duration-200"
                            required
                            placeholder={t('form.clientNamePlaceholder')}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('form.clientPhonePlaceholder')}
                          </label>
                          <input
                            name="client_phone"
                            value={formValues.client_phone}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#21A179] focus:border-[#21A179] transition-all duration-200"
                            required
                            placeholder={t('form.clientPhonePlaceholder')}
                          />
                        </div>
                      </div>
                      
                      {/* Device Info */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('form.phoneModelPlaceholder')}
                        </label>
                        <input
                          name="phone_model"
                          value={formValues.phone_model}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#21A179] focus:border-[#21A179] transition-all duration-200"
                          required
                          placeholder={t('form.phoneModelPlaceholder')}
                        />
                      </div>
                      
                      {/* Repair Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('form.repairCost')}
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <DollarSign className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              name="repair_cost"
                              type="number"
                              step="0.01"
                              value={formValues.repair_cost}
                              onChange={handleInputChange}
                              className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#21A179] focus:border-[#21A179] transition-all duration-200"
                              required
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('form.status')}
                          </label>
                          <select
                            name="status"
                            value={formValues.status}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#21A179] focus:border-[#21A179] transition-all duration-200"
                          >
                            <option value="pending">{t('status.pending')}</option>
                            <option value="in_progress">{t('status.in_progress')}</option>
                            <option value="done">{t('status.done')}</option>
                          </select>
                        </div>
                      </div>
                      
                      {/* Issue Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('form.issueDescriptionPlaceholder')}
                        </label>
                        <textarea
                          name="issue_description"
                          value={formValues.issue_description}
                          onChange={handleInputChange}
                          rows="3"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#21A179] focus:border-[#21A179] transition-all duration-200"
                          placeholder={t('form.issueDescriptionPlaceholder')}
                        ></textarea>
                      </div>
                      
                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('form.notes')}
                        </label>
                        <textarea
                          name="notes"
                          value={formValues.notes}
                          onChange={handleInputChange}
                          rows="2"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#21A179] focus:border-[#21A179] transition-all duration-200"
                          placeholder={t('form.notesPlaceholder')}
                        ></textarea>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-6">
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all duration-200"
                      >
                        {t('form.cancelButton')}
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#21A179] text-white font-medium rounded-lg shadow hover:bg-[#1a8a68] transition-all duration-200"
                      >
                        {isEditMode ? t('form.updateButton') : t('form.submitButton')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Repairs List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#21A179] border-t-transparent"></div>
                <p className="mt-4 text-[#6A8DA6] font-medium">{t('loading')}</p>
              </div>
            ) : filteredRepairs.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {filteredRepairs.map(repair => (
                  <div key={repair.id} className="hover:bg-gray-50/50 transition-all duration-200">
                    <div 
                      className="p-6 cursor-pointer"
                      onClick={() => toggleRepairDetails(repair.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex-shrink-0 w-12 h-12 bg-[#21A179]/10 rounded-full flex items-center justify-center">
                              <Phone className="h-6 w-6 text-[#21A179]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-[#24333E] truncate">{repair.client_name}</h3>
                              <p className="text-[#6A8DA6] font-medium">{repair.phone_model}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-[#6A8DA6]" />
                              <span className="text-[#24333E] font-medium truncate">{repair.client_phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-[#6A8DA6]" />
                              <span className="text-[#24333E] font-bold">{formatCurrency(repair.repair_cost)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-[#6A8DA6]" />
                              <span className="text-[#6A8DA6]">{formatDate(repair.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusBadgeStyle[repair.status]}`}>
                                <div className={statusIconStyle[repair.status]}>
                                  <StatusIcon status={repair.status} />
                                </div>
                                {t(`status.${repair.status}`)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0 ml-4">
                          {expandedRepair === repair.id ? (
                            <ChevronUp className="h-5 w-5 text-[#6A8DA6]" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-[#6A8DA6]" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Expanded Details */}
                    {expandedRepair === repair.id && (
                      <div className="px-6 pb-6 border-t border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
                          <div>
                            <h4 className="text-sm font-bold text-[#24333E] mb-3">{t('details.issue')}</h4>
                            <p className="text-[#6A8DA6] leading-relaxed">{repair.issue_description || t('details.noDescription')}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-[#24333E] mb-3">{t('details.notes')}</h4>
                            <p className="text-[#6A8DA6] leading-relaxed">{repair.notes || t('details.noNotes')}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                          <button 
                            onClick={() => handleEdit(repair)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#21A179] hover:bg-[#21A179]/5 rounded-lg transition-all duration-200"
                          >
                            <Edit3 className="h-4 w-4" />
                            {t('actions.edit')}
                          </button>
                          <button 
                            onClick={() => handleDelete(repair.id)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                          >
                            <Trash2 className="h-4 w-4" />
                            {t('actions.delete')}
                          </button>
                          {repair.status !== 'done' && (
                            <button 
                              onClick={() => handleMarkDone(repair.id)}
                              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 ml-auto"
                            >
                              <CheckCircle className="h-4 w-4" />
                              {t('actions.markDone')}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Phone className="h-12 w-12 text-[#6A8DA6]" />
                </div>
                <h3 className="text-xl font-bold text-[#24333E] mb-2">{t('list.emptyTitle')}</h3>
                <p className="text-[#6A8DA6] mb-6 max-w-md mx-auto">{t('list.emptyDescription')}</p>
                <button
                  onClick={() => setIsFormVisible(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#21A179] text-white font-semibold rounded-xl shadow-lg hover:bg-[#1a8a68] transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Plus className="h-5 w-5" />
                  {t('form.toggleButton')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReparationService;