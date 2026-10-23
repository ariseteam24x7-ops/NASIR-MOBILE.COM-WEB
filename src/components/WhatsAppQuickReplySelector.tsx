import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { DEFAULT_FAQ_QUICK_REPLIES } from '../lib/whatsapp.ts';
import {
  Check,
  HelpCircle,
  Truck,
  ShieldCheck,
  Camera,
  CreditCard,
  RefreshCw,
  MapPin,
  ChevronDown,
  ChevronUp,
  MessageSquarePlus,
} from 'lucide-react';

interface WhatsAppQuickReplySelectorProps {
  selectedQuestions: string[];
  onChangeQuestions: (questions: string[]) => void;
  customNote: string;
  onChangeCustomNote: (note: string) => void;
  compact?: boolean;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Truck: <Truck className="w-3.5 h-3.5" />,
  ShieldCheck: <ShieldCheck className="w-3.5 h-3.5" />,
  Camera: <Camera className="w-3.5 h-3.5" />,
  CreditCard: <CreditCard className="w-3.5 h-3.5" />,
  RefreshCw: <RefreshCw className="w-3.5 h-3.5" />,
  MapPin: <MapPin className="w-3.5 h-3.5" />,
};

export const WhatsAppQuickReplySelector: React.FC<WhatsAppQuickReplySelectorProps> = ({
  selectedQuestions,
  onChangeQuestions,
  customNote,
  onChangeCustomNote,
  compact = false,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [showNoteInput, setShowNoteInput] = useState(Boolean(customNote));
  const [isExpanded, setIsExpanded] = useState(!compact);

  const toggleQuestion = (qText: string) => {
    if (selectedQuestions.includes(qText)) {
      onChangeQuestions(selectedQuestions.filter((q) => q !== qText));
    } else {
      onChangeQuestions([...selectedQuestions, qText]);
    }
  };

  return (
    <div className="rounded-2xl bg-[#1b1921] border border-white/10 p-3.5 sm:p-4 space-y-3">
      {/* Header with expand toggle on compact mode */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#922CB5]/20 border border-[#922CB5]/40 flex items-center justify-center text-[#B7F34B]">
            <HelpCircle className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              {isAr ? 'أسئلة شائعة سريعة قبل الإرسال' : 'Quick FAQ Questions'}
            </span>
            <span className="text-[10px] text-zinc-400">
              {isAr
                ? 'حدد الأسئلة التي تريد إرفاقها برسالة واتساب فورياً'
                : 'Tap questions to automatically include them in your WhatsApp enquiry'}
            </span>
          </div>
        </div>

        {compact && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-[#B7F34B] hover:text-[#c4f866] font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>{selectedQuestions.length > 0 ? `(${selectedQuestions.length})` : ''}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {isExpanded && (
        <>
          {/* Quick FAQ Question Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {DEFAULT_FAQ_QUICK_REPLIES.map((faq) => {
              const qText = isAr ? faq.questionAr : faq.questionEn;
              const isSelected = selectedQuestions.includes(qText);
              const iconEl = faq.icon && ICON_MAP[faq.icon] ? ICON_MAP[faq.icon] : null;

              return (
                <button
                  key={faq.id}
                  type="button"
                  onClick={() => toggleQuestion(qText)}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#391548]/90 border-[#B7F34B] text-white shadow-[0_0_12px_rgba(183,243,75,0.25)]'
                      : 'bg-[#151419] border-white/5 text-zinc-300 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-md mt-0.5 flex items-center justify-center shrink-0 border transition-all ${
                      isSelected
                        ? 'bg-[#B7F34B] border-[#B7F34B] text-[#151419]'
                        : 'border-white/20 bg-white/5 text-transparent'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>

                  <div className="flex-1 leading-snug">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <span className="text-[#B7F34B] shrink-0">{iconEl}</span>
                      <span>{qText}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Customer Custom Note Toggle & Input */}
          <div className="pt-1">
            {!showNoteInput ? (
              <button
                type="button"
                onClick={() => setShowNoteInput(true)}
                className="text-[11px] font-semibold text-zinc-400 hover:text-[#B7F34B] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                <span>{isAr ? '+ إضافة ملاحظة أو طلب مخصص' : '+ Add custom note or inquiry'}</span>
              </button>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="font-semibold text-white">
                    {isAr ? 'ملاحظة خاصة بك (تُرفق في الرسالة):' : 'Custom Note for Store Owner:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onChangeCustomNote('');
                      setShowNoteInput(false);
                    }}
                    className="text-zinc-500 hover:text-zinc-300 text-[10px]"
                  >
                    {isAr ? 'إلغاء' : 'Clear'}
                  </button>
                </div>
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => onChangeCustomNote(e.target.value)}
                  placeholder={
                    isAr
                      ? 'مثال: أود استلام الجهاز غداً الساعة 5 مساءً من المتجر'
                      : 'e.g. I can pick up tomorrow at 5 PM, is it ready?'
                  }
                  className="w-full bg-[#151419] border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#B7F34B]"
                />
              </div>
            )}
          </div>

          {/* Active selection feedback */}
          {selectedQuestions.length > 0 && (
            <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px] text-[#B7F34B]">
              <span>
                {isAr
                  ? `تم تحديد ${selectedQuestions.length} استفسار سريع`
                  : `${selectedQuestions.length} FAQ questions included in WhatsApp message`}
              </span>
              <button
                type="button"
                onClick={() => onChangeQuestions([])}
                className="text-zinc-400 hover:text-white underline cursor-pointer text-[10px]"
              >
                {isAr ? 'إعادة ضبط' : 'Deselect all'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
