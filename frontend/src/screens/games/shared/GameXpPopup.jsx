const GameXpPopup = ({ label, popup }) => {
    if (!popup.show) return null;

    return (
        <div key={popup.key} className="xp-popup-wrapper xp-popup-wrapper--low">
            <div className="xp-popup-badge">
                ⭐ {label} +{popup.amount} XP
            </div>
        </div>
    );
};

export default GameXpPopup;
