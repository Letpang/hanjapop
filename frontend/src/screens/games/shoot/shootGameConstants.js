export const DIFFICULTY_CONFIG = {
    normal: {
        dropSpeedBase: 0.28,
        dropSpeedPerWave: 0.03,
        maxOnScreen: 3,
        spawnIntervalBase: 1400,
        spawnIntervalPerWave: -120,
        wrongAnswerMode: 'same_theme',
        wavesTotal: 1,
        killsPerWave: 8,
        hp: 5,
    },
};

export const DIFFICULTY_XP = {
    normal: { waveClear: 20, combo3: 0, combo5: 0 },
};

export const COSMIC_STARS = [
    { id: 1,  left: '8%',  top: '5%',  size: 4,  delay: '0s',   speed: '2.8s' },
    { id: 2,  left: '22%', top: '3%',  size: 6,  delay: '0.5s', speed: '3.5s' },
    { id: 3,  left: '45%', top: '7%',  size: 3,  delay: '1.2s', speed: '2.2s' },
    { id: 4,  left: '68%', top: '4%',  size: 5,  delay: '0.8s', speed: '4.0s' },
    { id: 5,  left: '88%', top: '6%',  size: 4,  delay: '1.8s', speed: '3.0s' },
    { id: 6,  left: '5%',  top: '18%', size: 7,  delay: '0.3s', speed: '4.5s' },
    { id: 7,  left: '35%', top: '15%', size: 3,  delay: '2.1s', speed: '2.6s' },
    { id: 8,  left: '78%', top: '20%', size: 5,  delay: '1.4s', speed: '3.8s' },
    { id: 9,  left: '93%', top: '15%', size: 4,  delay: '0.7s', speed: '2.9s' },
    { id: 10, left: '15%', top: '32%', size: 6,  delay: '1.6s', speed: '4.2s' },
    { id: 11, left: '55%', top: '28%', size: 3,  delay: '2.4s', speed: '2.4s' },
    { id: 12, left: '82%', top: '38%', size: 8,  delay: '0.9s', speed: '5.0s' },
    { id: 13, left: '3%',  top: '48%', size: 5,  delay: '1.3s', speed: '3.3s' },
    { id: 14, left: '42%', top: '55%', size: 4,  delay: '2.7s', speed: '3.7s' },
    { id: 15, left: '72%', top: '50%', size: 3,  delay: '0.4s', speed: '2.1s' },
    { id: 16, left: '95%', top: '55%', size: 6,  delay: '1.9s', speed: '4.8s' },
    { id: 17, left: '20%', top: '68%', size: 4,  delay: '0.6s', speed: '3.1s' },
    { id: 18, left: '60%', top: '72%', size: 5,  delay: '2.2s', speed: '3.9s' },
    { id: 19, left: '88%', top: '78%', size: 3,  delay: '1.1s', speed: '2.7s' },
    { id: 20, left: '38%', top: '82%', size: 7,  delay: '0.2s', speed: '4.4s' },
    { id: 21, left: '10%', top: '90%', size: 4,  delay: '1.5s', speed: '3.6s' },
    { id: 22, left: '75%', top: '88%', size: 5,  delay: '0.9s', speed: '2.3s' },
];

export const BOKEH_LIGHTS = [
    { id: 'b1', left: '12%', top: '28%', size: 36, delay: '0s',   speed: '8s'  },
    { id: 'b2', left: '72%', top: '18%', size: 52, delay: '2.5s', speed: '10s' },
    { id: 'b3', left: '42%', top: '62%', size: 44, delay: '1.2s', speed: '9s'  },
    { id: 'b4', left: '85%', top: '55%', size: 30, delay: '3.8s', speed: '7s'  },
];

export const FLOATING_PARTICLES = [
    { id: 1, left: '18%', top: '72%', size: 9,  delay: '0s',   speed: '7s'   },
    { id: 2, left: '44%', top: '80%', size: 6,  delay: '1.8s', speed: '8.5s' },
    { id: 3, left: '70%', top: '68%', size: 11, delay: '3.2s', speed: '7.5s' },
    { id: 4, left: '8%',  top: '62%', size: 7,  delay: '2.1s', speed: '9s'   },
    { id: 5, left: '86%', top: '74%', size: 5,  delay: '4.4s', speed: '6.5s' },
    { id: 6, left: '54%', top: '58%', size: 8,  delay: '0.9s', speed: '8s'   },
];

export const THEMES_CONFIG = {
    mint: {
        bgColor: 'linear-gradient(180deg, #A8DECE 0%, #CAEEE5 50%, #E8F8F4 100%)',
        animBg: 'linear-gradient(135deg, #A8DECE, #7EC8D8, #C5E8F0, #A8DEB8, #CAEEE5, #A8DECE)',
        nebulaColor: 'rgba(45, 212, 191, 0.32)',
        nebulaColor2: 'rgba(20, 184, 166, 0.20)',
        accentColor: '#2ED6C5',
        bottomGlow: 'rgba(45, 212, 191, 0.22)',
    },
    coral: {
        bgColor: 'linear-gradient(180deg, #F8B898 0%, #FAD4C0 50%, #FBF0E8 100%)',
        animBg: 'linear-gradient(135deg, #F8B898, #FAA070, #FBCAB0, #F8C8A8, #FAD4C0, #F8B898)',
        nebulaColor: 'rgba(251, 146, 60, 0.32)',
        nebulaColor2: 'rgba(234, 88, 12, 0.18)',
        accentColor: '#FF9B73',
        bottomGlow: 'rgba(251, 146, 60, 0.22)',
    },
    purple: {
        bgColor: 'linear-gradient(180deg, #B8ADFA 0%, #D4CEFC 50%, #EDEAFE 100%)',
        animBg: 'linear-gradient(135deg, #B8ADFA, #9C8FF8, #C8C2FF, #D4CEFC, #A8A0F8, #B8ADFA)',
        nebulaColor: 'rgba(139, 92, 246, 0.30)',
        nebulaColor2: 'rgba(99, 102, 241, 0.20)',
        accentColor: '#7C83FF',
        bottomGlow: 'rgba(139, 92, 246, 0.22)',
    },
    gold: {
        bgColor: 'linear-gradient(180deg, #FCCF62 0%, #FDE8A0 50%, #FAF6E0 100%)',
        animBg: 'linear-gradient(135deg, #FCCF62, #F8B830, #FDE8A0, #FAF0C0, #FCCF62, #FDE8A0)',
        nebulaColor: 'rgba(245, 158, 11, 0.30)',
        nebulaColor2: 'rgba(217, 119, 6, 0.18)',
        accentColor: '#EAB308',
        bottomGlow: 'rgba(245, 158, 11, 0.22)',
    }
};
