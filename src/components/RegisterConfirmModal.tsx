"use client";

interface RegisterConfirmModalProps {
  isOpen: boolean;
  title?: string;
  dateText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function RegisterConfirmModal({
  isOpen,
  title,
  dateText,
  onConfirm,
  onCancel,
}: RegisterConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-xl border border-slate-100 text-center space-y-4">
        <div className="text-3xl">✨</div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-800">
            {title || "新しい旅程"}
          </h3>
          <p className="text-xs text-slate-500 font-semibold">{dateText}</p>
        </div>
        <p className="text-xs text-slate-600 font-medium">
          この内容で旅程を登録しますか？
        </p>
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-full hover:bg-slate-200 transition"
          >
            いいえ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-app-main text-white text-xs font-bold rounded-full hover:opacity-90 transition shadow-md"
          >
            はい
          </button>
        </div>
      </div>
    </div>
  );
}