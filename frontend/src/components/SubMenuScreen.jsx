import { useLang } from '../LangContext.jsx';

const SubMenuButton = ({ label, icon, onClick, bgColor, locked }) => (
    <button
        onClick={locked ? null : onClick}
        className={"clay-button flex flex-col items-center justify-center p-6 gap-4 transition-all duration-300 " + 
            (locked ? "opacity-50 grayscale cursor-not-allowed" : "active:scale-95 hover:-translate-y-2")}
        style={{ backgroundColor: bgColor || '#fff', borderColor: 'white' }}
    >
        <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 flex items-center justify-center">
            {locked ? (
                <span className="text-5xl">🔒</span>
            ) : (
                <img src={icon} alt={label} className="w-full h-full object-contain drop-shadow-md" />
            )}
        </div>
        <span className="font-black text-xl md:text-3xl text-slate-700">{label}</span>
    </button>
);

const SubMenuScreen = ({ category, onBack, onNavigate }) => {
    const { t } = useLang();

    const getCategoryConfig = () => {
        switch (category) {
            case 'study':
                return {
                    title: t('menuStudy'),
                    items: [
                        { id: 'flashcard', label: t('studyCard'), icon: '/assets/images/icons/icon_flashcard.webp', color: '#A8E6CF' },
                        { id: 'writing', label: t('studyWrite'), icon: '/assets/images/icons/icon_writing.webp', color: '#FFD3B6' }
                    ]
                };
            case 'game':
                return {
                    title: t('menuGame'),
                    items: [
                        { id: 'matchGame', label: t('gameMatch'), icon: '/assets/images/icons/icon_match.webp', color: '#BDB2FF' },
                        { id: 'shootGame', label: t('gameShoot'), icon: '/assets/images/icons/icon_monster.webp', color: '#FFADAD' }
                    ]
                };
            case 'quiz':
                return {
                    title: t('menuQuiz'),
                    items: [
                        { id: 'quiz', label: t('menuQuiz'), icon: '/assets/images/icons/icon_flashcard.webp', color: '#FDFFB6', locked: true }
                    ],
                    desc: t('quizComingSoon')
                };
            case 'level':
                return {
                    title: t('menuLevel'),
                    items: [
                        { id: 'ranking', label: t('levelRanking'), icon: '/assets/images/icons/icon_flashcard.webp', color: '#9BF6FF', locked: true }
                    ],
                    desc: '전체 사용자 중 나의 위치를 비교해볼 수 있습니다! (준비 중)'
                };
            default:
                return { title: '', items: [] };
        }
    };

    const config = getCategoryConfig();

    return (
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto min-h-screen px-6 pt-10 pb-32 gap-10">
            <div className="w-full flex justify-between items-center clay-panel p-6 px-8 rounded-[2.5rem] shadow-xl border-4 border-white">
                <button onClick={onBack} className="text-slate-600 font-black bg-white/50 px-6 py-3 rounded-2xl border-2 border-white/50 hover:bg-white active:scale-95 transition-all shadow-md">
                    ← {t('backMenu').replace('← ', '')}
                </button>
                <h1 className="text-3xl md:text-5xl font-black text-slate-700 m-0 premium-text-shadow">{config.title}</h1>
                <div className="w-[100px] hidden sm:block"></div>
            </div>

            {config.desc && (
                <div className="bg-white/60 backdrop-blur-md px-8 py-4 rounded-3xl border-2 border-white shadow-sm font-black text-slate-500 text-lg">
                    {config.desc}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-2xl mt-4">
                {config.items.map(item => (
                    <SubMenuButton
                        key={item.id}
                        label={item.label}
                        icon={item.icon}
                        bgColor={item.color}
                        locked={item.locked}
                        onClick={() => onNavigate(item.id)}
                    />
                ))}
            </div>
        </div>
    );
};

export default SubMenuScreen;
