import React, { createContext, useContext, useState, useCallback } from 'react';

interface ModalProps {
  title?: string;
  content: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  onClose?: () => void;
  onConfirm?: () => Promise<void> | void;
  showCloseButton?: boolean;
  showFooter?: boolean;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

interface ModalContextType {
  showModal: (props: ModalProps) => void;
  hideModal: () => void;
  currentModal: ModalProps | null;
  isModalOpen: boolean;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentModal, setCurrentModal] = useState<ModalProps | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const showModal = useCallback((props: ModalProps) => {
    setCurrentModal(props);
  }, []);

  const hideModal = useCallback(() => {
    if (currentModal?.onClose) {
      currentModal.onClose();
    }
    setCurrentModal(null);
    setIsLoading(false);
  }, [currentModal]);

  const handleConfirm = useCallback(async () => {
    if (currentModal?.onConfirm) {
      setIsLoading(true);
      try {
        await currentModal.onConfirm();
        hideModal();
      } catch (error) {
        console.error('Modal confirm error:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      hideModal();
    }
  }, [currentModal, hideModal]);

  // Modal компонент
  const ModalComponent = () => {
    if (!currentModal) return null;

    const sizeClasses = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      full: 'max-w-full mx-4',
    };

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={hideModal}
          />

          {/* Modal */}
          <div
            className={`relative w-full ${
              sizeClasses[currentModal.size || 'md']
            } bg-white dark:bg-gray-800 rounded-lg shadow-xl transform transition-all`}
          >
            {/* Header */}
            {(currentModal.title || currentModal.showCloseButton !== false) && (
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                {currentModal.title && (
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {currentModal.title}
                  </h3>
                )}
                
                {currentModal.showCloseButton !== false && (
                  <button
                    onClick={hideModal}
                    disabled={isLoading}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    <svg
                      className="w-5 h-5 text-gray-500 dark:text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
              {currentModal.content}
            </div>

            {/* Footer */}
            {currentModal.showFooter !== false && (
              <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={hideModal}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                  >
                    {currentModal.cancelText || 'Цуцлах'}
                  </button>
                  {currentModal.onConfirm && (
                    <button
                      onClick={handleConfirm}
                      disabled={isLoading}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-500 border border-transparent rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <span className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Түр хүлээнэ үү...
                        </span>
                      ) : (
                        currentModal.confirmText || 'Баталгаажуулах'
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const value: ModalContextType = {
    showModal,
    hideModal,
    currentModal,
    isModalOpen: !!currentModal,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
      <ModalComponent />
    </ModalContext.Provider>
  );
};