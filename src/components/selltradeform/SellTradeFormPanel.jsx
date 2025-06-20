import React, { useState, useEffect, useRef } from 'react';
import { X, ShoppingCart, User, Phone, Check, AlertCircle, DollarSign } from 'lucide-react';

const SellFormPanel = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  productId,
  insertSale 
}) => {
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragStartY, setDragStartY] = useState(null);
  const [dragCurrentY, setDragCurrentY] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Form state
  const [sellForm, setSellForm] = useState({
    fullName: '',
    phoneNumber: '',
    price: ''
  });

  const panelRef = useRef(null);
  const backdropRef = useRef(null);

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      setSellForm({ fullName: '', phoneNumber: '', price: '' });
      setShowConfirmPopup(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Touch/drag handlers for mobile swipe-to-close
  const handleTouchStart = (e) => {
    setDragStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !dragStartY) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - dragStartY;
    
    if (diff > 0) { // Only allow downward drag
      setDragCurrentY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const threshold = 100; // Minimum drag distance to close
    if (dragCurrentY > threshold) {
      onClose();
    }
    
    setDragStartY(null);
    setDragCurrentY(null);
    setIsDragging(false);
  };

  // Handle form submission
  const handleSellSubmit = (e) => {
    e.preventDefault();
    if (!sellForm.fullName.trim() || !sellForm.phoneNumber.trim() || !sellForm.price.trim()) {
      return;
    }
    setShowConfirmPopup(true);
  };

  const handleConfirmAction = async () => {
    setIsSubmitting(true);
    setShowConfirmPopup(false);
    
    try {
      const data = {
        type: 'sell',
        productId,
        buyerName: sellForm.fullName,
        buyerPhone: sellForm.phoneNumber,
        price: parseFloat(sellForm.price),
        timestamp: new Date().toISOString()
      };
  
      // Simulate API call (replace with actual insertSale call)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // If insertSale is provided, call it
      if (insertSale) {
        await insertSale(data);
      }
      
      onSuccess?.(data);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const dragStyle = isDragging && dragCurrentY ? {
    transform: `translateY(${dragCurrentY}px)`,
    transition: 'none'
  } : {};

  return (
    <>
      {/* Backdrop */}
      <div 
        ref={backdropRef}
        className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Mobile Bottom Sheet */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-50">
        <div 
          ref={panelRef}
          className="bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden"
          style={dragStyle}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Drag Handle */}
          <div className="flex justify-center py-3 bg-gray-50 rounded-t-3xl">
            <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
          </div>

          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-oceanblue flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Sell Product
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-grey" />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 overflow-y-auto">
            <SellForm 
              form={sellForm}
              setForm={setSellForm}
              onSubmit={handleSellSubmit}
              onCancel={onClose}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>

      {/* Desktop Modal */}
      <div className="hidden lg:flex fixed inset-0 z-50 items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-oceanblue flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Sell Product
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-grey" />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 overflow-y-auto">
            <SellForm 
              form={sellForm}
              setForm={setSellForm}
              onSubmit={handleSellSubmit}
              onCancel={onClose}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>

      {/* Confirmation Popup */}
      {showConfirmPopup && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full z-[101]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-oceanblue/10 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-oceanblue" />
              </div>
              <h3 className="text-lg font-bold text-oceanblue">Confirm Sale</h3>
            </div>
            <p className="text-grey mb-6">
              Are you sure you want to sell this product to <strong>{sellForm.fullName}</strong> for <strong>${sellForm.price}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmPopup(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-grey font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={isSubmitting}
                className="flex-1 bg-oceanblue hover:bg-oceanblue/90 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Confirm Sale
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Sell Form Component
const SellForm = ({ form, setForm, onSubmit, onCancel, isSubmitting }) => {
  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-moderatelybrown mb-2">
          <User className="w-4 h-4 inline mr-2" />
          Buyer's Full Name
        </label>
        <input
          type="text"
          value={form.fullName}
          onChange={(e) => handleInputChange('fullName', e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-oceanblue/20 focus:border-oceanblue transition-colors"
          placeholder="Enter buyer's full name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-moderatelybrown mb-2">
          <Phone className="w-4 h-4 inline mr-2" />
          Phone Number
        </label>
        <input
          type="tel"
          value={form.phoneNumber}
          onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-oceanblue/20 focus:border-oceanblue transition-colors"
          placeholder="Enter buyer's phone number"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-moderatelybrown mb-2">
          <DollarSign className="w-4 h-4 inline mr-2" />
          Sale Price
        </label>
        <input
          type="number"
          value={form.price}
          onChange={(e) => handleInputChange('price', e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-oceanblue/20 focus:border-oceanblue transition-colors"
          placeholder="Enter sale price"
          required
          min="0"
          step="0.01"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-grey font-medium py-3 px-4 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !form.fullName.trim() || !form.phoneNumber.trim() || !form.price.trim()}
          className="flex-1 bg-oceanblue hover:bg-oceanblue/90 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          Sell Product
        </button>
      </div>
    </form>
  );
};

export default SellFormPanel;