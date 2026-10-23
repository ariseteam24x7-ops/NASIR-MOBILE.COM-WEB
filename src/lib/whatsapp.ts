import { Product, ProductCondition, WhatsAppSettings, FAQQuickReply } from '../types/index.ts';

/**
 * Frequently Asked Questions Quick Replies for WhatsApp Enquiry
 */
export const DEFAULT_FAQ_QUICK_REPLIES: FAQQuickReply[] = [
  {
    id: 'delivery',
    questionEn: 'Do you offer same-day delivery across Dubai & UAE?',
    questionAr: 'هل يتوفر توصيل في نفس اليوم داخل دبي والإمارات؟',
    icon: 'Truck',
  },
  {
    id: 'warranty',
    questionEn: 'Is there an official warranty included with this device?',
    questionAr: 'هل يشمل الجهاز ضماناً رسمياً معتمداً من المتجر؟',
    icon: 'ShieldCheck',
  },
  {
    id: 'photos',
    questionEn: 'Can you send live photos or video of the actual device?',
    questionAr: 'هل يمكن إرسال صور أو فيديو واقعي للجهاز الفعلي؟',
    icon: 'Camera',
  },
  {
    id: 'payment',
    questionEn: 'What payment methods do you accept (Cash, Card, Transfer)?',
    questionAr: 'ما هي طرق الدفع المقبولة (كاش، بطاقة، تحويل بنكي)؟',
    icon: 'CreditCard',
  },
  {
    id: 'trade_in',
    questionEn: 'Do you accept device trade-ins / exchange?',
    questionAr: 'هل تقبلون استبدال الأجهزة القديمة بأجهزة جديدة؟',
    icon: 'RefreshCw',
  },
  {
    id: 'pickup',
    questionEn: 'Can I inspect and pick up directly from your store in Dubai?',
    questionAr: 'هل يمكنني فحص الجهاز والاستلام مباشرة من المتجر في دبي؟',
    icon: 'MapPin',
  },
];

/**
 * Clean phone number for WhatsApp link (removes spaces, dashes, parentheses, plus sign)
 */
export const sanitizeWhatsAppNumber = (num: string): string => {
  return num.replace(/[^\d]/g, '');
};

/**
 * Format phone number for readable display in UI
 */
export const formatDisplayNumber = (num: string): string => {
  const clean = sanitizeWhatsAppNumber(num);
  if (clean.startsWith('971') && clean.length === 12) {
    return `+971 ${clean.substring(3, 5)} ${clean.substring(5, 8)} ${clean.substring(8)}`;
  }
  return num;
};

interface BuildWhatsAppUrlOptions {
  settings?: WhatsAppSettings;
  product?: Product;
  selectedVariant?: string;
  lang?: 'en' | 'ar';
  customMessage?: string;
  selectedQuestions?: string[];
  customNote?: string;
}

/**
 * Construct safe, properly encoded WhatsApp enquiry URL
 */
export const buildWhatsAppUrl = ({
  settings,
  product,
  selectedVariant,
  lang = 'en',
  customMessage,
  selectedQuestions = [],
  customNote,
}: BuildWhatsAppUrlOptions): string => {
  const number = settings?.activeNumber || '+971522523900';
  const cleanNumber = sanitizeWhatsAppNumber(number);
  const isAr = lang === 'ar';

  let message = '';

  if (customMessage) {
    message = customMessage;
  } else if (product) {
    const template = isAr
      ? settings?.templateAr ||
        'مرحباً ناصر موبايل دبي! أود الاستفسار عن {productName} ({brand}) [رمز المنتج: {sku}]. الحالة: {condition}. {variant}الرابط: {url}. يرجى تزويدي بالتفاصيل والتوفر.'
      : settings?.templateEn ||
        'Hello Nasir Mobile Dubai! I am inquiring about {productName} ({brand}) [SKU: {sku}]. Condition: {condition}. {variant}Link: {url}. Please share details and availability.';

    const productName = isAr ? product.nameAr || product.nameEn : product.nameEn;
    const brandName = product.brandName || 'Nasir Mobile';
    const condition = product.condition;
    const variantText = selectedVariant ? (isAr ? `الخيار المطلوب: ${selectedVariant}. ` : `Selected Option: ${selectedVariant}. `) : '';
    
    // Build safe product link
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://nasirmobile.com';
    const productUrl = `${currentOrigin}/#product-${product.slug}`;

    message = template
      .replace('{productName}', productName)
      .replace('{brand}', brandName)
      .replace('{sku}', product.sku)
      .replace('{condition}', condition)
      .replace('{variant}', variantText)
      .replace('{url}', productUrl);
  } else {
    message =
      isAr
        ? 'مرحباً ناصر موبايل دبي! أود الاستفسار عن الأجهزة المتوفرة والأسعار لديكم.'
        : 'Hello Nasir Mobile Dubai! I would like to inquire about device availability and recommendations.';
  }

  // Append selected FAQ Quick Questions if any
  if (selectedQuestions && selectedQuestions.length > 0) {
    const faqHeader = isAr ? '\n\n❓ الأسئلة الشائعة المحددة:' : '\n\n❓ Frequently Asked Questions:';
    const faqItems = selectedQuestions.map((q) => `• ${q}`).join('\n');
    message += `${faqHeader}\n${faqItems}`;
  }

  // Append custom customer note if provided
  if (customNote && customNote.trim()) {
    const noteLabel = isAr ? '\n\n📝 ملاحظة إضافية من العميل:' : '\n\n📝 Customer Note:';
    message += `${noteLabel}\n${customNote.trim()}`;
  }

  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message.trim())}`;
};
