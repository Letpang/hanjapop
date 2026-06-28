const PremiumModalShell = ({ children, onClose }) => (
    <div
        className="fixed inset-0 z-50 flex items-end justify-center modal-dim"
        onClick={onClose}
    >
        <div
            className="premium-modal-card mobile-bottom-sheet w-full max-w-md rounded-t-[32px] pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]"
            style={{ background: '#FFFFFF' }}
            onClick={event => event.stopPropagation()}
        >
            <div className="flex justify-center pt-4 pb-2">
                <div className="w-12 h-1.5 rounded-full bg-gray-200" />
            </div>
            {children}
        </div>
    </div>
);

export default PremiumModalShell;
