import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({ open, onClose, title, children, footer, maxWidth = 'max-w-md' }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className={`bg-zinc-900 rounded-lg border border-zinc-800 p-6 w-full ${maxWidth}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white">{title}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div>{children}</div>
        {footer && <div className="flex gap-3 mt-6">{footer}</div>}
      </div>
    </div>
  );
}
