import CtaButton from './common/CtaButton.jsx';
import { useLang } from '../hooks/useLang.js';

const GRADE_INFO = {
    '8급':  { screen: 'gradeTest',   theme: 'indigo' },
    '7급Ⅱ': { screen: 'gradeTest72', theme: 'coral'  },
    '7급':  { screen: 'gradeTest7',  theme: 'coral'  },
    '6급Ⅱ': { screen: 'gradeTest62', theme: 'coral'  },
    '6급':  { screen: 'gradeTest6',  theme: 'indigo' },
};

export default function GradeTestAlertModal({ grade, onNavigate, onClose }) {
    const { t } = useLang();
    const info = GRADE_INFO[grade];
    if (!info) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center modal-dim"
            onClick={onClose}
        >
            <div
                className="mobile-bottom-sheet w-full max-w-md rounded-t-[32px] bg-white dark:bg-slate-800 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.35)]"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-center pt-4 pb-2">
                    <div className="w-12 h-1.5 rounded-full bg-gray-200 dark:bg-slate-600" />
                </div>

                <div className="px-6 pt-4 pb-6 text-center">
                    <span className="result-subtitle">{t('ext_2150', { grade })}</span>
                    <h2 className="result-title result-title--clear text-[1.6rem] mt-1">
                        {t('ext_2730')}
                    </h2>
                    <p className="text-sm font-normal text-slate-400 dark:text-slate-300 mt-2">
                        {t('ext_2975', { grade })}
                    </p>
                </div>

                <div className="px-6 flex flex-col gap-3">
                    <CtaButton
                        theme={info.theme}
                        onClick={() => { onClose(); onNavigate(info.screen); }}
                    >
                        <span className="quiz-cta-text">{t('ext_2151', { grade })}</span>
                    </CtaButton>
                    <button
                        onClick={onClose}
                        className="w-full py-3 text-base text-slate-400 font-normal"
                    >
                        {t('ext_2666')}
                    </button>
                </div>
            </div>
        </div>
    );
}