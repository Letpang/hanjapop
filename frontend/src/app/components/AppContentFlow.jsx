import { Suspense } from 'react';
import AppScreenRouter from './AppScreenRouter.jsx';
import DailySessionFlow from './DailySessionFlow.jsx';
import InitialAppFlow from './InitialAppFlow.jsx';
import {
    getAppFlowMode,
    getDailySessionFlowProps,
    getInitialAppFlowProps,
} from './appContentFlowProps.js';

const appFallback = (
    <div
        className="min-h-screen"
        style={{ background: 'linear-gradient(180deg, #DDF1EA 0%, #EAF6F2 100%)' }}
    />
);

const AppContentFlow = (props) => {
    const flowMode = getAppFlowMode(props);

    return (
        <Suspense fallback={appFallback}>
            {flowMode === 'initial' && <InitialAppFlow {...getInitialAppFlowProps(props)} />}
            {flowMode === 'daily' && <DailySessionFlow {...getDailySessionFlowProps(props)} />}
            {flowMode === 'router' && <AppScreenRouter {...props.routerProps} />}
        </Suspense>
    );
};

export default AppContentFlow;
