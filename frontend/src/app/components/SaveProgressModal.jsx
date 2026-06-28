import { getCharacterImage, getCharacterScale, getCharacterTranslateY } from '../../utils/rankUtils.js';
import SaveProgressActions from './save-progress/SaveProgressActions.jsx';
import SaveProgressStats from './save-progress/SaveProgressStats.jsx';
import { useLang } from '../../hooks/useLang.js';

export default function SaveProgressModal({
    currentDay,
    onApple,
    onGoogle,
    onKakao,
    onSkip,
    platform,
    selectedCharacter,
    streak,
}) {
    const { t } = useLang();
    return (
        <div
            className="save-progress-modal fixed inset-0 z-[350] flex flex-col items-center justify-center px-6 animate-in fade-in duration-400 overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #C8EDE6 0%, #DDF1EA 40%, #EEF8F5 100%)' }}
        >
            <div className="absolute top-[-60px] left-[-60px] w-52 h-52 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #2ED6C5, transparent)' }} />
            <div className="absolute top-[10%] right-[-40px] w-36 h-36 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #0D9488, transparent)' }} />
            <div className="absolute bottom-[30%] left-[-30px] w-28 h-28 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #2ED6C5, transparent)' }} />

            <img
                src={getCharacterImage(selectedCharacter, 'success')}
                alt="save progress"
                className="w-44 h-44 object-contain drop-shadow-2xl mb-2 animate-in zoom-in duration-500"
                style={{ transform: `translateY(${getCharacterTranslateY(selectedCharacter, true)}) scale(${getCharacterScale(selectedCharacter, 'success')})` }}
            />

            <div className="text-center mb-5 px-2">
                <h2 className="text-[1.6rem] font-medium text-slate-800 leading-tight mb-2">
                    {t('ext_3181')}
                </h2>
                <p className="text-base font-normal text-slate-600 leading-relaxed break-keep">
                    {t('ext_3182')}<br />{t('ext_2148')}
                </p>
            </div>

            <SaveProgressStats currentDay={currentDay} streak={streak} />
            <SaveProgressActions
                onApple={onApple}
                onGoogle={onGoogle}
                onKakao={onKakao}
                onSkip={onSkip}
                platform={platform}
            />
        </div>
    );
}
