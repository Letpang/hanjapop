import LoggedInAccount from './account/LoggedInAccount.jsx';
import LoggedOutAccount from './account/LoggedOutAccount.jsx';
import { Section } from './SettingsPrimitives.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const AccountSection = ({
  user,
  onLogout,
  onLogin,
  isLoggingOut,
  logoutMessage,
}) => {
  const { t } = useLang();

  return (
    <Section title={t('ext_471')} color="#7C83FF">
      {user ? (
        <LoggedInAccount
          user={user}
          onLogout={onLogout}
          isLoggingOut={isLoggingOut}
          logoutMessage={logoutMessage}
        />
      ) : (
        <LoggedOutAccount onLogin={onLogin} />
      )}
    </Section>
  );
};

export default AccountSection;
