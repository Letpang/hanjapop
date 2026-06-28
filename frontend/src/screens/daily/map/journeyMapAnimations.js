export const PULSE_CSS = `
@keyframes pulse-ring {
    0%   { transform: scale(0.95); opacity: 0.8; }
    50%  { transform: scale(1.4); opacity: 0; }
    100% { transform: scale(1.4); opacity: 0; }
}
@keyframes float-gentle {
    0%   { transform: translateY(0px); }
    50%  { transform: translateY(-8px); }
    100% { transform: translateY(0px); }
}
@keyframes float-active {
    0%   { transform: translateY(0px) scale(1.1); }
    50%  { transform: translateY(-12px) scale(1.12); }
    100% { transform: translateY(0px) scale(1.1); }
}
@keyframes twinkle {
    0%, 100% { opacity: 0.4; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.2); }
}
@keyframes cloud-drift {
    0%   { transform: translateX(-20px); }
    50%  { transform: translateX(20px); }
    100% { transform: translateX(-20px); }
}
@keyframes peek-monster {
    0%, 80%, 100% { transform: translate(10px, 20px) rotate(15deg); opacity: 0; }
    85%, 95%      { transform: translate(-15px, -30px) rotate(-10deg); opacity: 1; }
}
.node-pulse { position: relative; z-index: 10; }
.node-pulse::before {
    content: '';
    position: absolute;
    inset: -10px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(46,214,197,0.4) 0%, rgba(46,214,197,0) 70%);
    animation: pulse-ring 2.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
    z-index: -1;
    pointer-events: none;
}
.active-node-shadow {
    box-shadow: 0 16px 32px rgba(46,214,197,0.35), 0 0 20px rgba(46,214,197,0.4);
}
.float-gentle {
    animation: float-gentle 4s ease-in-out infinite;
}
.float-active {
    animation: float-active 3s ease-in-out infinite;
}
`;
