// Expenses.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import Sidebar from '../components/sidebar/Sidebar';
import BottomNavigation from '../components/bottombar/BottomNavigation';
import supabase from "../lib/supabaseClient"; // Import your Supabase client

const Expenses = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);
  const [activeItem, setActiveItem] = useState('expenses');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleToggle = () => setIsOpen(!isOpen);
  const handleItemClick = (item) => setActiveItem(item);
  const handleLogout = async () => {
    // Assuming signOut is available from your auth context or similar
    // await supabase.auth.signOut();
    console.log("User logged out");
  };

  // Fetch expenses from Supabase on initial render
  useEffect(() => {
    const fetchExpenses = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setExpenses(data || []);
      } catch (err) {
        console.error("Error fetching expenses:", err);
        setError(t('expenses.fetch_error', { message: err.message }));
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setError(null);

    if (!title || !amount || !category) {
      setError(t('expenses.form.error_required_fields'));
      return;
    }

    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount)) {
      setError(t('expenses.form.error_invalid_amount'));
      return;
    }

    setLoading(true);
    try {
      // Get current user ID (assuming user is authenticated via Supabase auth)
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await supabase
        .from('expenses')
        .insert([
          {
            title,
            amount: expenseAmount,
            category,
            notes,
            user_id: user ? user.id : null, // Link to user if authenticated
          },
        ])
        .select(); // Select the inserted row to get its data

      if (error) throw error;

      // Add the newly inserted expense to the state
      setExpenses(prevExpenses => [data[0], ...prevExpenses]);

      // Clear form fields
      setTitle('');
      setAmount('');
      setCategory('');
      setNotes('');

    } catch (err) {
      console.error("Error adding expense:", err);
      setError(t('expenses.add_error', { message: err.message }));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== id));
    } catch (err) {
      console.error("Error deleting expense:", err);
      setError(t('expenses.delete_error', { message: err.message }));
    } finally {
      setLoading(false);
    }
  };

  const totalMonthlyExpenses = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return expenses.reduce((sum, expense) => {
      const expenseDate = new Date(expense.created_at); // Use created_at from DB
      if (expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear) {
        return sum + expense.amount;
      }
      return sum;
    }, 0);
  }, [expenses]);

  const categories = [
    t('expenses.categories.food'),
    t('expenses.categories.transport'),
    t('expenses.categories.housing'),
    t('expenses.categories.entertainment'),
    t('expenses.categories.utilities'),
    t('expenses.categories.health'),
    t('expenses.categories.education'),
    t('expenses.categories.shopping'),
    t('expenses.categories.other'),
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex mb-12 lg:mb-0">
      {/* Sidebar for larger screens */}
      <div className="hidden lg:block fixed h-full">
        <Sidebar
          isOpen={isOpen}
          onToggle={handleToggle}
          activeItem={"/expenses"}
          onItemClick={handleItemClick}
          onLogout={handleLogout}
        />
      </div>

      {/* BottomNavigation for mobile screens */}
      <div className="block lg:hidden fixed bottom-0 left-0 right-0 z-10">
        <BottomNavigation
          activeItem={activeItem}
          onItemClick={handleItemClick}
          onLogout={handleLogout}
        />
      </div>

      <div className={`flex-1 overflow-hidden ${
          isOpen ? "lg:ml-64" : "lg:ml-20"
        } transition-all duration-200`}>

        <div className="min-h-screen bg-fog/10 p-6 pb-28 md:pb-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-2xl font-bold text-oceanblue mb-4">
              {t('expenses.header.title')}
            </h1>

            {/* Total Monthly Expenses Card */}
            <div className="bg-moderatelybrown text-white rounded-lg p-4 mb-6 shadow-sm">
              <p className="text-sm font-medium">{t('expenses.summary.total_this_month')}</p>
              <p className="text-xl font-semibold mt-1">{totalMonthlyExpenses.toFixed(2)} MAD</p>
            </div>

            {/* Add Expense Form */}
            <form onSubmit={handleAddExpense} className="space-y-4">
              <h2 className="text-xl font-semibold text-oceanblue">{t('expenses.form.add_expense')}</h2>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                  <strong className="font-bold">Error! </strong>
                  <span className="block sm:inline">{error}</span>
                </div>
              )}
              {loading && (
                 <div className="text-center py-2">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tumbleweed mx-auto"></div>
                   <p className="text-sm text-grey mt-2">{t('expenses.loading')}</p>
                 </div>
              )}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-grey">
                  {t('expenses.form.title')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-tumbleweed focus:ring-tumbleweed sm:text-sm"
                  placeholder={t('expenses.form.title_placeholder')}
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-grey">
                  {t('expenses.form.amount')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-tumbleweed focus:ring-tumbleweed sm:text-sm"
                  placeholder={t('expenses.form.amount_placeholder')}
                  step="0.01"
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-grey">
                  {t('expenses.form.category')} <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-tumbleweed focus:ring-tumbleweed sm:text-sm"
                  disabled={loading}
                >
                  <option value="">{t('expenses.form.select_category')}</option>
                  {categories.map((cat, index) => (
                    <option key={index} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-grey">
                  {t('expenses.form.notes')}
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="3"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-tumbleweed focus:ring-tumbleweed sm:text-sm"
                  placeholder={t('expenses.form.notes_placeholder')}
                  disabled={loading}
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-tumbleweed hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tumbleweed disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? t('expenses.form.saving') : t('expenses.form.save_expense')}
              </button>
            </form>
          </div>

          {/* Recent Expenses List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-oceanblue mb-4">
              {t('expenses.recent.title')}
            </h2>
            {expenses.length === 0 ? (
              <div className="text-center py-8 text-grey">
                <p>{t('expenses.recent.no_expenses')}</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <li key={expense.id} className="py-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-oceanblue">{expense.title}</p>
                      <p className="text-xs text-grey">
                        {expense.category} &bull; {new Date(expense.created_at).toLocaleDateString()} {/* Use created_at */}
                      </p>
                      {expense.notes && (
                        <p className="text-xs text-grey mt-1 italic">{expense.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center">
                      <p className="text-base font-semibold text-moderatelybrown mr-4">
                        -{expense.amount.toFixed(2)} MAD
                      </p>
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={t('expenses.recent.delete_expense')}
                        disabled={loading}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm2 6a1 1 0 100 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Expenses;