import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ShoppingCart, User, Phone, Check, AlertCircle, DollarSign, CreditCard, Calculator } from 'lucide-react';

const SellFormPanel = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  productId,
  insertSale 
}) => {
  const { t } = useTranslation();
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragStartY, setDragStartY] = useState(null);
  const [dragCurrentY, setDragCurrentY] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [sellForm, setSellForm] = useState({
    fullName: '',
    phoneNumber: '',
    price: '',
    paid_price: '',
    rest_price: ''
  });

  const panelRef = useRef(null);
  const backdropRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSellForm({ 
        fullName: '', 
        phoneNumber: '', 
        price: '', 
        paid_price: '', 
        rest_price: '' 
      });
      setShowConfirmPopup(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const sellPrice = parseFloat(sellForm.price) || 0.0;
    const paidPrice = parseFloat(sellForm.paid_price) || 0.0;
    const restPrice = sellPrice - paidPrice;
    
    if (sellForm.price && sellForm.paid_price) {
      setSellForm(prev => ({
        ...prev,
        rest_price: restPrice >= 0 ? restPrice.toFixed(2) : '0.00'
      }));
    } else if (!sellForm.paid_price || sellForm.paid_price === '') {
      setSellForm(prev => ({
        ...prev,
        rest_price: sellForm.price ? sellForm.price : ''
      }));
    }
  }, [sellForm.price, sellForm.paid_price]);

  const handleTouchStart = (e) => {
    setDragStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !dragStartY) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - dragStartY;
    
    if (diff > 0) {
      setDragCurrentY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const threshold = 100;
    if (dragCurrentY > threshold) {
      onClose();
    }
    
    setDragStartY(null);
    setDragCurrentY(null);
    setIsDragging(false);
  };

  const handleSellSubmit = (e) => {
    e.preventDefault();
    if (!sellForm.fullName.trim() || !sellForm.phoneNumber.trim() || !sellForm.price.trim() || !sellForm.paid_price.trim() || !sellForm.rest_price.trim()) {
      return;
    }
    setShowConfirmPopup(true);
  };

  const handleConfirmAction = async () => {
    setIsSubmitting(true);
    setShowConfirmPopup(false);
    
    try {
      const sellPrice = sellForm.price && sellForm.price.trim() !== '' 
        ? parseFloat(sellForm.price) 
        : 0;
      const paidPrice = sellForm.paid_price && sellForm.paid_price.trim() !== '' 
        ? parseFloat(sellForm.paid_price) 
        : 0;
      const restPrice = sellForm.rest_price && sellForm.rest_price.trim() !== '' 
        ? parseFloat(sellForm.rest_price) 
        : (sellPrice - paidPrice);

      const data = {
        type: 'sell',
        product_id: productId,
        sell_price: sellPrice,
        buyer_name: sellForm.fullName.trim(),
        buyer_phone: sellForm.phoneNumber.trim(),
        paid_price: paidPrice,
        rest_price: restPrice
      };
      
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
          <div className="flex justify-center py-3 bg-gray-50 rounded-t-3xl">
            <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
          </div>

          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-amber-800 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                {t('sell_form.title')}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

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
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-amber-800 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                {t('sell_form.title')}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

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
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-800" />
              </div>
              <h3 className="text-lg font-bold text-amber-800">
                {t('sell_form.confirm_title')}
              </h3>
            </div>
            <div className="text-gray-600 mb-6 space-y-2">
              <p dangerouslySetInnerHTML={{
                __html: t('sell_form.confirm_message', { name: sellForm.fullName })
              }} />
              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <div className="flex justify-between">
                  <span>{t('sell_form.sale_price')}</span>
                  <span className="font-medium">{sellForm.price} MAD</span>
                </div>
                {sellForm.paid_price && sellForm.paid_price.trim() !== '' && (
                  <>
                    <div className="flex justify-between">
                      <span>{t('sell_form.paid_amount')}</span>
                      <span className="font-medium text-green-600">{sellForm.paid_price} MAD</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('sell_form.remaining')}</span>
                      <span className="font-medium text-orange-600">{sellForm.rest_price} MAD</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmPopup(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {t('sell_form.cancel')}
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={isSubmitting}
                className="flex-1 bg-amber-800 hover:bg-amber-900 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {t('sell_form.processing')}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {t('sell_form.confirm_sale')}
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

const SellForm = ({ form, setForm, onSubmit, onCancel, isSubmitting }) => {
  const { t } = useTranslation();

  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleNumberInput = (field, value) => {
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      handleInputChange(field, value);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-amber-800 mb-2">
          <User className="w-4 h-4 inline mr-2" />
          {t('sell_form.fields.buyer_name')}
        </label>
        <input
          type="text"
          value={form.fullName}
          onChange={(e) => handleInputChange('fullName', e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-800/20 focus:border-amber-800 transition-colors"
          placeholder={t('sell_form.fields.buyer_name_placeholder')}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-amber-800 mb-2">
          <Phone className="w-4 h-4 inline mr-2" />
          {t('sell_form.fields.phone')}
        </label>
        <input
          type="tel"
          value={form.phoneNumber}
          onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-800/20 focus:border-amber-800 transition-colors"
          placeholder={t('sell_form.fields.phone_placeholder')}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-amber-800 mb-2">
          <DollarSign className="w-4 h-4 inline mr-2" />
          {t('sell_form.fields.sale_price')}
        </label>
        <input
          type="text"
          value={form.price}
          onChange={(e) => handleNumberInput('price', e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-800/20 focus:border-amber-800 transition-colors"
          placeholder={t('sell_form.fields.sale_price_placeholder')}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-amber-800 mb-2">
          <CreditCard className="w-4 h-4 inline mr-2" />
          {t('sell_form.fields.paid_amount')} <span className="text-gray-400">
            {t('sell_form.fields.optional')}
          </span>
        </label>
        <input
          type="text"
          value={form.paid_price}
          onChange={(e) => handleNumberInput('paid_price', e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-800/20 focus:border-amber-800 transition-colors"
          placeholder={t('sell_form.fields.paid_amount_placeholder')}
        />
      </div>

      {form.rest_price && form.rest_price !== '' && (
        <div>
          <label className="block text-sm font-medium text-amber-800 mb-2">
            <Calculator className="w-4 h-4 inline mr-2" />
            {t('sell_form.fields.remaining_amount')}
          </label>
          <input
            type="text"
            value={form.rest_price}
            readOnly
            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
            placeholder={t('sell_form.fields.remaining_placeholder')}
          />
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-3 px-4 rounded-lg transition-colors"
        >
          {t('sell_form.cancel')}
        </button>
        <button
          type="button"
          onClick={handleFormSubmit}
          disabled={isSubmitting || !form.fullName.trim() || !form.phoneNumber.trim() || !form.price.trim()}
          className="flex-1 bg-amber-800 hover:bg-amber-900 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          {t('sell_form.buttons.sell_product')}
        </button>
      </div>
    </div>
  );
};

export default SellFormPanel;