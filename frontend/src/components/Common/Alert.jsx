import React from 'react';
import { FiAlertCircle, FiCheckCircle, FiInfo, FiAlertTriangle } from 'react-icons/fi';

const Alert = ({ type, message, onClose }) => {
  const types = {
    success: {
      icon: FiCheckCircle,
      bgColor: 'bg-green-50',
      textColor: 'text-green-800',
      borderColor: 'border-green-400',
      iconColor: 'text-green-400'
    },
    error: {
      icon: FiAlertCircle,
      bgColor: 'bg-red-50',
      textColor: 'text-red-800',
      borderColor: 'border-red-400',
      iconColor: 'text-red-400'
    },
    warning: {
      icon: FiAlertTriangle,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-400',
      iconColor: 'text-yellow-400'
    },
    info: {
      icon: FiInfo,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-400',
      iconColor: 'text-blue-400'
    }
  };

  const Icon = types[type]?.icon || FiInfo;
  const styles = types[type] || types.info;

  return (
    <div className={`${styles.bgColor} border-l-4 ${styles.borderColor} p-4 mb-4 rounded-md`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${styles.iconColor}`} />
        </div>
        <div className="ml-3 flex-1">
          <p className={`text-sm ${styles.textColor}`}>{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto flex-shrink-0"
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5 text-gray-400 hover:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;