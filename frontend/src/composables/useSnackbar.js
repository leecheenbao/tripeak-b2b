import { useToast } from 'vue-toastification';

/**
 * 通知功能的 Composable
 * 封裝 vue-toastification 提供的 toast 功能，方便統一管理通知樣式和行為
 */
export function useSnackbar() {
  const toast = useToast();
  
  /**
   * 顯示通知
   * @param {Object} options - 通知選項
   * @param {string} options.text - 通知文字內容
   * @param {string} [options.color='success'] - 通知顏色 (success, error, info, warning)
   * @param {number} [options.timeout=3000] - 通知顯示時間（毫秒）
   * @param {boolean} [options.closeButton=true] - 是否顯示關閉按鈕
   */
  const showSnackbar = ({ text, color = 'success', timeout = 3000, closeButton = true }) => {
    const toastOptions = {
      timeout,
      closeButton,
      position: 'top-right',
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    };
    
    switch (color) {
      case 'success':
        toast.success(text, toastOptions);
        break;
      case 'error':
        toast.error(text, toastOptions);
        break;
      case 'warning':
        toast.warning(text, toastOptions);
        break;
      case 'info':
        toast.info(text, toastOptions);
        break;
      default:
        toast.success(text, toastOptions);
        break;
    }
  };
  
  /**
   * 顯示成功通知
   * @param {string} text - 通知文字內容
   * @param {number} [timeout=3000] - 通知顯示時間（毫秒）
   */
  const showSuccess = (text, timeout = 3000) => {
    showSnackbar({ text, color: 'success', timeout });
  };
  
  /**
   * 顯示錯誤通知
   * @param {string} text - 通知文字內容
   * @param {number} [timeout=4000] - 通知顯示時間（毫秒）
   */
  const showError = (text, timeout = 4000) => {
    showSnackbar({ text, color: 'error', timeout });
  };
  
  /**
   * 顯示警告通知
   * @param {string} text - 通知文字內容
   * @param {number} [timeout=3500] - 通知顯示時間（毫秒）
   */
  const showWarning = (text, timeout = 3500) => {
    showSnackbar({ text, color: 'warning', timeout });
  };
  
  /**
   * 顯示信息通知
   * @param {string} text - 通知文字內容
   * @param {number} [timeout=3000] - 通知顯示時間（毫秒）
   */
  const showInfo = (text, timeout = 3000) => {
    showSnackbar({ text, color: 'info', timeout });
  };
  
  return {
    showSnackbar,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
} 