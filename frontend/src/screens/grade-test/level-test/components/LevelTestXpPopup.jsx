const LevelTestXpPopup = ({ popup }) => {
  if (!popup.show) return null;

  return (
    <div key={popup.key} className="xp-popup-wrapper">
      <div className="xp-popup-badge">
        ⭐ +{popup.amount} XP
      </div>
    </div>
  );
};

export default LevelTestXpPopup;
