import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const { language, t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      qEn: 'Why are prices not listed directly on the public catalogue?',
      qAr: 'لماذا لا تظهر الأسعار مباشرة على الكتالوج العام؟',
      aEn: 'As a high-turnover technology store in Dubai, electronics prices and supplier promotions fluctuate daily. Enquiring on WhatsApp allows our team to offer you the most competitive real-time Dubai market price, confirm exact physical stock and serials, and answer your exact hardware requirements instantly.',
      aAr: 'نظراً للتحديث اليومي لأسعار الأجهزة وسوق التكنولوجيا في دبي، يتيح الاستفسار عبر واتساب تقديم أفضل سعر فوري منافس، وتأكيد التوفر الفعلي للأجهزة وتقديم صور ومواصفات دقيقة في الوقت الفعلي.',
    },
    {
      qEn: 'What is the inspection standard for Used and Refurbished devices?',
      qAr: 'ما هي معايير فحص الأجهزة المستعملة والمجددة؟',
      aEn: 'Every pre-owned and refurbished device undergoes our rigorous multi-point technical checklist: battery health, display integrity, genuine parts verification, network compatibility (5G/LTE), Face ID/fingerprint sensors, cameras, and audio components.',
      aAr: 'يخضع كل جهاز مستعمل أو مجدد لفحص فني شامل يغطي كفاءة البطارية، الشاشة، القطع الأصلية، توافق شبكات الجيل الخامس، ومستشعرات بصمة الوجه والكاميرات ومكبرات الصوت لضمان جودة استثنائية.',
    },
    {
      qEn: 'How can I make an enquiry or purchase?',
      qAr: 'كيف يمكنني الاستفسار أو إتمام الشراء؟',
      aEn: 'Simply click the green WhatsApp enquiry button on any product card or page. The message is automatically pre-filled with the product name, SKU, and condition. Our sales team in Dubai will reply promptly with availability, payment options, and delivery or collection details.',
      aAr: 'ببساطة اضغط على زر استفسار واتساب الأخضر على أي منتج. سيتم تجهيز الرسالة تلقائياً مع اسم الجهاز والرمز والحالة. وسيقوم فريق المبيعات لدينا بالرد الفوري بكافة التفاصيل وخيارات الاستلام والدفع.',
    },
    {
      qEn: 'Where is your store located and what are your opening hours?',
      qAr: 'أين يقع متجركم وما هي ساعات العمل؟',
      aEn: 'We are located in Dubai, United Arab Emirates. We are open Saturday through Thursday from 10:00 AM to 10:30 PM, and on Friday from 3:00 PM to 10:30 PM. Store appointments and visits can be scheduled directly via WhatsApp.',
      aAr: 'يقع متجرنا في دبي، الإمارات العربية المتحدة. نستقبلكم من السبت إلى الخميس من 10:00 صباحاً حتى 10:30 مساءً، والجمعة من 3:00 عصراً حتى 10:30 مساءً. يمكنكم التنسيق المباشر للزيارة عبر واتساب.',
    },
    {
      qEn: 'Do you offer delivery across the UAE?',
      qAr: 'هل يتوفر توصيل في جميع أنحاء الإمارات؟',
      aEn: 'Yes! We arrange express same-day or next-day courier delivery across Dubai, Abu Dhabi, Sharjah, and all other Emirates upon WhatsApp order confirmation.',
      aAr: 'نعم! نوفر خدمة التوصيل السريع خلال نفس اليوم أو اليوم التالي في دبي وأبوظبي والشارقة وكافة إمارات الدولة عند تأكيد الطلب عبر واتساب.',
    },
  ];

  return (
    <section id="faq" className="py-16 sm:py-24 bg-[#151419] border-b border-white/5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#391548] text-[#B7F34B] text-xs font-bold uppercase tracking-widest mb-4">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{t('faq')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
            {language === 'ar' ? 'الأسئلة الشائعة والاستفسارات' : 'Frequently Asked Questions'}
          </h2>
          <p className="text-zinc-400 text-sm mt-2">
            {language === 'ar'
              ? 'كل ما تود معرفته عن أجهزة ناصر موبايل، الشراء، وطرق التواصل'
              : 'Everything you need to know about our devices, pricing policy, and Dubai orders'}
          </p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            const question = language === 'ar' ? faq.qAr : faq.qEn;
            const answer = language === 'ar' ? faq.aAr : faq.aEn;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="rounded-2xl bg-[#242129] border border-white/5 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 text-white font-bold text-base hover:text-[#B7F34B] transition-colors cursor-pointer"
                >
                  <span className="leading-snug">{question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-zinc-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#B7F34B]' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-zinc-300 text-sm leading-relaxed border-t border-white/5 pt-3">
                    {answer}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
