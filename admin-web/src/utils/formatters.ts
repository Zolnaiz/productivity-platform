/**
 * Тоо форматлах
 */
export const formatNumber = (
  value: number | string,
  options?: Intl.NumberFormatOptions
): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return '0';
  }

  return new Intl.NumberFormat('mn-MN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(num);
};

/**
 * Мөнгөн дүн форматлах
 */
export const formatCurrency = (
  amount: number | string,
  currency: string = 'MNT',
  options?: Intl.NumberFormatOptions
): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num)) {
    return `0 ${currency}`;
  }

  const formatter = new Intl.NumberFormat('mn-MN', {
    style: 'currency',
    currency: currency === 'MNT' ? 'MNT' : 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options,
  });

  // MNT-д тусгай формат
  if (currency === 'MNT') {
    return `${formatNumber(num, options)} ₮`;
  }

  return formatter.format(num);
};

/**
 * Огноо форматлах
 */
export const formatDate = (
  date: Date | string | number,
  format: string = 'YYYY-MM-DD'
): string => {
  const d = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;

  if (isNaN(d.getTime())) {
    return 'Н/О';
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD HH:mm':
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    case 'YYYY-MM-DD HH:mm:ss':
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    case 'HH:mm':
      return `${hours}:${minutes}`;
    case 'MMMM DD, YYYY':
      const monthNames = [
        'Нэгдүгээр сар', 'Хоёрдугаар сар', 'Гуравдугаар сар', 'Дөрөвдүгээр сар',
        'Тавдугаар сар', 'Зургаадугаар сар', 'Долоодугаар сар', 'Наймдугаар сар',
        'Есдүгээр сар', 'Аравдугаар сар', 'Арваннэгдүгээр сар', 'Арванхоёрдугаар сар'
      ];
      return `${monthNames[d.getMonth()]} ${day}, ${year}`;
    case 'relative':
      return formatRelativeTime(d);
    default:
      return `${year}-${month}-${day}`;
  }
};

/**
 * Харьцангуй цаг форматлах
 */
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} секунд`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} минут`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} цаг`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} хоног`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} сар`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} жил`;
};

/**
 * Файлын хэмжээ форматлах
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Төлөв форматлах
 */
export const formatStatus = (status: string): { text: string; color: string } => {
  const statusMap: Record<string, { text: string; color: string }> = {
    // Questionnaire statuses
    draft: { text: 'Ноорог', color: 'gray' },
    active: { text: 'Идэвхтэй', color: 'green' },
    paused: { text: 'Зогссон', color: 'yellow' },
    completed: { text: 'Дууссан', color: 'blue' },
    archived: { text: 'Архивлагдсан', color: 'gray' },
    
    // Response statuses
    pending: { text: 'Хүлээгдэж байна', color: 'gray' },
    in_progress: { text: 'Явагдаж байна', color: 'blue' },
    completed: { text: 'Дууссан', color: 'green' },
    reviewed: { text: 'Шалгагдсан', color: 'purple' },
    approved: { text: 'Баталгаажсан', color: 'green' },
    rejected: { text: 'Татгалзсан', color: 'red' },
    
    // Expense statuses
    submitted: { text: 'Илгээсэн', color: 'blue' },
    under_review: { text: 'Шалгагдаж байна', color: 'yellow' },
    paid: { text: 'Төлбөр хийгдсэн', color: 'green' },
  };

  return statusMap[status] || { text: status, color: 'gray' };
};

/**
 * Нэрний эхний үсэг авах
 */
export const getInitials = (name: string): string => {
  if (!name) return '?';
  
  const names = name.split(' ');
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

/**
 * Имэйл форматлах
 */
export const formatEmail = (email: string): string => {
  if (!email) return '';
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return email;
  
  // Эхний 2 үсэг болон сүүлийн 2 үсэг харуулах
  const maskedLocal = localPart.length > 4 
    ? `${localPart.substring(0, 2)}***${localPart.substring(localPart.length - 2)}`
    : localPart;
  
  return `${maskedLocal}@${domain}`;
};

/**
 * Утасны дугаар форматлах
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Зөвхөн тоонуудыг авна
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 8) {
    return `${cleaned.substring(0, 4)} ${cleaned.substring(4)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
  } else if (cleaned.length === 12) {
    return `+${cleaned.substring(0, 3)} (${cleaned.substring(3, 5)}) ${cleaned.substring(5, 8)}-${cleaned.substring(8)}`;
  }
  
  return phone;
};

/**
 * URL форматлах
 */
export const formatUrl = (url: string): string => {
  if (!url) return '';
  
  // http/https нэмэхгүй бол нэмнэ
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  
  return url;
};

/**
 * JSON форматлах
 */
export const formatJson = (obj: any): string => {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
};