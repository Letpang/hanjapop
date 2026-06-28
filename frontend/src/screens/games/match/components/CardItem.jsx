import { memo } from 'react';
import { getCharacterScale, getCharacterTranslateY } from '../../../../utils/rankUtils.js';



const CardItem = memo(({ card, onClick, totalCards, backChar, backSrc }) => {
  const isFlipped = card.isFlipped || card.isMatched;
  const meaningLength = card.type === 'meaning' ? [...card.content].length : 0;
  const meaningDensityClass = meaningLength > 56
    ? 'match-card-copy--ultra-dense'
    : meaningLength > 36
      ? 'match-card-copy--dense'
      : meaningLength > 22
        ? 'match-card-copy--long'
        : '';

  return (
    <div
      className="match-card-item relative w-full aspect-[3/2] cursor-pointer active:scale-[0.97] transition-all duration-300"
      style={{ pointerEvents: card.isMatched ? 'none' : 'auto' }}
      onClick={() => onClick(card)}
    >
      <div className={`card-face-front absolute inset-0 rounded-[1.5rem] md:rounded-[2rem] bg-[var(--color-bg-surface)] border-2 border-[#E9EDF2] shadow-md flex items-center justify-center overflow-hidden ${isFlipped ? 'is-flipped' : ''}`}>
        <img
          src={backSrc}
          alt="?"
          className="match-card-character w-[112%] h-[112%] max-w-none object-contain"
          style={{ transform: `translateY(${getCharacterTranslateY(backChar)}) scale(${getCharacterScale(backChar, 'rank5')})` }}
          onError={(e) => { e.target.style.opacity = '0'; }}
        />
      </div>

      <div className={`card-face-back absolute inset-0 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center p-1.5 sm:p-2 shadow-2xl ${card.isMatched ? 'bg-[var(--color-bg-surface)] border-2 border-[#FF9B73]' : 'bg-[var(--color-bg-surface)] border-2 border-[#7C83FF]'} ${isFlipped ? 'is-flipped' : ''}`}>
        {card.isMatched && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#FF9B73] flex items-center justify-center shadow-lg">
            <span className="text-white text-xs-res font-normal leading-none">✓</span>
          </div>
        )}
        <span
          className={`match-card-copy match-card-copy--${card.type} ${meaningDensityClass} text-center tracking-normal w-full px-1 ${card.isMatched ? '!text-[#FF9B73]' : ''}`}
          style={{
            color: card.isMatched ? undefined : (
              card.type === 'hanja' ? 'var(--color-text-main)' :
              card.type === 'word' ? 'var(--color-primary-blue)' :
              'var(--color-text-subtle)'
            )
          }}
        >
          {card.content}
        </span>
      </div>
    </div>
  );
});

export default CardItem;
