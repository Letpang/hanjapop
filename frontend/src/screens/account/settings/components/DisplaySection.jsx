import { Row, Section, Toggle } from './SettingsPrimitives.jsx';
import { useLang } from '../../../../hooks/useLang.js';

const DisplaySection = ({ isDarkMode, setIsDarkMode }) => {
  const { t } = useLang();
  
  return (
    <Section title={t('ext_472')} color="#5C9DC0">
      <Row label={t('ext_1490')} sub={t('ext_1814')}>
        <Toggle value={isDarkMode} onToggle={() => setIsDarkMode(!isDarkMode)} />
      </Row>
    </Section>
  );
};

export default DisplaySection;