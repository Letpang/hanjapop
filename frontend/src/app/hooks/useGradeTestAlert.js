import { useEffect } from 'react';
import DAILY_CURRICULUM from '../../data/dailyCurriculum.js';
import { SK } from '../../constants/storageKeys.js';
import { GRADE_HIERARCHY } from '../appConstants.js';

export function useGradeTestAlert(completedDay, setGradeTestAlert) {
    useEffect(() => {
        if (!completedDay) return;

        const alertGrade = DAILY_CURRICULUM[completedDay - 1]?.gradeTestAlert;
        if (!alertGrade) return;

        const normalizedAlertGrade = alertGrade.replace('Ⅱ', 'II');
        const currentGrade = localStorage.getItem(SK.UNLOCKED_GRADE);
        const alertGradeIndex = GRADE_HIERARCHY.indexOf(normalizedAlertGrade);
        const currentGradeIndex = GRADE_HIERARCHY.indexOf(currentGrade);

        if (currentGradeIndex < alertGradeIndex || currentGradeIndex === -1) {
            setGradeTestAlert(alertGrade);
        }
    }, [completedDay, setGradeTestAlert]);
}
