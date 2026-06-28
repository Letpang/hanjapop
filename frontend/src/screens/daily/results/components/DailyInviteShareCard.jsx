import { useLang } from '../../../../hooks/useLang.js';

const DailyInviteShareCard = ({ selectedCharacter, nickname: nicknameProp }) => {
  const { t } = useLang();
  const nickname = nicknameProp ?? t('ext_980');

  return (
    <div
      className="relative overflow-hidden text-slate-800"
      style={{ width: 800, height: 1000, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#D0F6EC_0%,#EEF8FF_48%,#FFF0CF_100%)]" />
      <div className="absolute left-[54px] right-[54px] top-[50px] bottom-[50px] rounded-[54px] bg-white/28 border-[7px] border-white/86 shadow-[inset_0_0_54px_rgba(255,255,255,0.62),0_24px_56px_rgba(66,82,100,0.10)]" />
      <div className="absolute left-1/2 top-[340px] h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.98)_0%,rgba(252,247,201,0.62)_43%,rgba(46,214,197,0.18)_72%,rgba(46,214,197,0)_100%)]" />
      <img
        src={`/assets/images/characters/${selectedCharacter || 'garae'}/rank_5.webp`}
        alt=""
        className="absolute left-1/2 top-[340px] z-10 h-[353px] w-[353px] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_18px_22px_rgba(66,82,100,0.12)]"
        onError={(event) => {
          event.target.src = '/assets/images/characters/default_3d.webp';
        }}
      />
      <div className="absolute left-[94px] right-[94px] top-[540px] z-20 flex h-[310px] flex-col items-center justify-center rounded-[42px] bg-white/54 px-12 text-center shadow-[0_16px_36px_rgba(66,82,100,0.08)]">
        <h1 className="text-[58px] font-extrabold leading-[1.12] tracking-normal text-[#4B423A] drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]">
          {t('ext_2510', { nickname })}<br />{t('ext_1576')}
        </h1>
        <p className="mt-8 text-[24px] font-extrabold leading-snug text-[#777777]">
          {t('ext_544')}{t('ext_2408')}<br />{t('ext_1816')}
        </p>
      </div>
    </div>
  );
};

export default DailyInviteShareCard;
