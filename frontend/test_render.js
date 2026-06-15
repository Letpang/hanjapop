import React from 'react';
import { renderToString } from 'react-dom/server';
import IdiomScreen from './src/components/IdiomScreen.jsx';

const props = {
    onBack: () => {},
    onComplete: () => {},
    onHanjaAcquired: () => {},
    contentPool: { main: { hanjaIds: [] } },
    grade: '8급',
    day: 4,
    userXp: 100,
    selectedCharacter: 'chapssal',
    getRewardPreview: () => ({ type: 'xp', amount: 10 })
};

try {
    const html = renderToString(React.createElement(IdiomScreen, props));
    console.log("Render successful!");
    console.log(html.substring(0, 200) + "...");
} catch (e) {
    console.error("Render failed with error:", e);
}
