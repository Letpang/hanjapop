import AccountRoutes from './routes/AccountRoutes.jsx';
import GameRoutes from './routes/GameRoutes.jsx';
import GradeRoutes from './routes/GradeRoutes.jsx';
import MainRoute from './routes/MainRoute.jsx';
import QuizRoutes from './routes/QuizRoutes.jsx';
import StudyRoutes from './routes/StudyRoutes.jsx';

const STUDY_ROUTES = new Set(['flashcard', 'writing', 'calendar', 'review']);
const GAME_ROUTES = new Set(['matchGame', 'shootGame']);
const QUIZ_ROUTES = new Set(['sentenceQuiz', 'wordQuiz', 'idiomQuiz']);
const GRADE_ROUTES = new Set([
    'gradeTest',
    'gradeTest72',
    'gradeTest7',
    'gradeTest62',
    'gradeTest6',
    'gradeExamSelect',
    'gradeStudyDashboard',
    'levelTest',
]);
const ACCOUNT_ROUTES = new Set(['settings', 'mypage', 'vocabulary', 'wrongVocabulary']);

const AppScreenRouter = (props) => {
    const { currentScreen } = props;

    if (STUDY_ROUTES.has(currentScreen)) return <StudyRoutes {...props} />;
    if (GAME_ROUTES.has(currentScreen)) return <GameRoutes {...props} />;
    if (QUIZ_ROUTES.has(currentScreen)) return <QuizRoutes {...props} />;
    if (GRADE_ROUTES.has(currentScreen)) return <GradeRoutes {...props} />;
    if (ACCOUNT_ROUTES.has(currentScreen)) return <AccountRoutes {...props} />;

    return <MainRoute {...props} />;
};

export default AppScreenRouter;
