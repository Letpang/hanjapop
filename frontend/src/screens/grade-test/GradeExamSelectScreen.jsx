import GradeExamCard from './grade-select/components/GradeExamCard.jsx';
import GradeExamGuide from './grade-select/components/GradeExamGuide.jsx';
import GradeExamHeader from './grade-select/components/GradeExamHeader.jsx';
import { GRADE_EXAM_ITEMS } from './grade-select/gradeExamData.js';

const GradeExamSelectScreen = ({ onBack, onSelectGrade }) => (
  <div className="grade-exam-select-screen">
    <GradeExamHeader onBack={onBack} />

    <main className="grade-exam-select-content">
      <GradeExamGuide />

      <div className="grade-exam-card-list">
        {GRADE_EXAM_ITEMS.map((item) => (
          <GradeExamCard
            key={item.id}
            item={item}
            onSelectGrade={onSelectGrade}
          />
        ))}
      </div>
    </main>
  </div>
);

export default GradeExamSelectScreen;
