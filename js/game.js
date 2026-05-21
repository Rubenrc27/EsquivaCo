import { Leaderboard } from './leaderboard.js';
import { Auth } from './auth.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const hud = document.getElementById('hud');
const loginScreen = document.getElementById('login-screen');
const startScreen = document.getElementById('start-screen');
const gameoverScreen = document.getElementById('gameover-screen');
const leaderboardScreen = document.getElementById('leaderboard-screen');
const finalScoreTxt = document.getElementById('final-score');
const highScoreTxt = document.getElementById('high-score');
const audioBtn = document.getElementById('audio-control');
const bgMusic = document.getElementById('bg-music');

// Game constants
const CX = 300;
const CY = 300;
const PLANET_RADIUS = 35;
const ORBIT_RADIUS = 125;

// Game state
let gameState = 'START';
let score = 0;
let highScore = localStorage.getItem('esquivaco_record') || 0;
let spawnTimer = 0;
let spawnRate = 75;
let screenShake = 0;
let isMuted = false;
let currentLevel = 1;
let hasShield = false;
let currentUser = null;

// Entities
let player = {
    angle: 0,
    speed: 0.045,
    baseSpeed: 0.045,
    direction: 1,
    radius: 8,
    x: 0,
    y: 0,
    trail: []
};

let obstacles = [];
let particles = [];

// Pointer Events
document.getElementById('game-container').addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    
    if (gameState === 'PLAYING') {
        player.direction *= -1;
    }
});

// Audio handling
function setupAudio() {
    bgMusic.volume = 0.5;
    audioBtn.addEventListener('click', () => {
        isMuted = !isMuted;
        bgMusic.muted = isMuted;
        audioBtn.innerHTML = isMuted ? '🔇' : '🔊';
    });
}

// Session handling
async function initSession() {
    console.log("Iniciando sesión...");
    try {
        currentUser = await Auth.getCurrentUser();
        console.log("Usuario actual:", currentUser);
        if (currentUser) {
            showStartScreen(currentUser);
        } else {
            showLoginScreen();
        }
    } catch (e) {
        console.error("Error en initSession:", e);
    }
}

function showStartScreen(user) {
    console.log("Mostrando pantalla de inicio");
    loginScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    const displayUser = document.getElementById('display-username');
    if (displayUser) {
        displayUser.innerText = user.user_metadata.username || user.email.split('@')[0];
    }
}

function showLoginScreen() {
    console.log("Mostrando pantalla de login");
    loginScreen.classList.remove('hidden');
    startScreen.classList.add('hidden');
}

window.handleAuth = async () => {
    console.log("handleAuth ejecutado");
    const usernameInput = document.getElementById('auth-username');
    const passwordInput = document.getElementById('auth-password');
    const errorMsg = document.getElementById('auth-error');

    if (!usernameInput || !passwordInput) {
        console.error("No se encontraron los inputs de auth");
        return;
    }

    const username = usernameInput.value;
    const password = passwordInput.value;
    
    if (!username || !password) {
        errorMsg.innerText = "Completa todos los campos";
        errorMsg.classList.remove('hidden');
        return;
    }

    errorMsg.classList.add('hidden');
    const { user, error } = await Auth.loginOrSignup(username, password);
    
    if (error) {
        console.error("Error de autenticación:", error);
        errorMsg.innerText = error;
        errorMsg.classList.remove('hidden');
    } else {
        console.log("Autenticación exitosa, cambiando pantalla...");
        currentUser = user;
        showStartScreen(user);
    }
};

window.logout = async () => {
    await Auth.logout();
};

// Game Functions
window.startGame = () => {
    hideAllScreens();
    hud.classList.remove('hidden');
    gameState = 'PLAYING';
    score = 0;
    currentLevel = 1;
    spawnRate = 75;
    hasShield = false;
    player.speed = player.baseSpeed;
    obstacles = [];
    particles = [];
    player.angle = 0;
    player.direction = 1;
    player.trail = [];
    hud.innerText = score;
    
    if (!isMuted) {
        bgMusic.play().catch(() => {
            console.log("Audio playback waiting for interaction");
        });
    }
};

window.restartGame = () => {
    window.startGame();
};

window.showLeaderboard = () => {
    hideAllScreens();
    leaderboardScreen.classList.remove('hidden');
    Leaderboard.render('leaderboard-list-container');
};

window.showMenu = () => {
    hideAllScreens();
    startScreen.classList.remove('hidden');
};

function hideAllScreens() {
    startScreen.classList.add('hidden');
    gameoverScreen.classList.add('hidden');
    leaderboardScreen.classList.add('hidden');
    hud.classList.add('hidden');
}

function triggerGameOver() {
    gameState = 'GAMEOVER';
    hud.classList.add('hidden');
    gameoverScreen.classList.remove('hidden');
    finalScoreTxt.innerText = score;
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('esquivaco_record', highScore);
    }
    highScoreTxt.innerText = highScore;
    
    if (currentUser) {
        Leaderboard.saveEntry(currentUser.id, score);
    }
    
    createExplosion(player.x, player.y, '#00ff66', 30);
    screenShake = 25;
}

function createExplosion(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            radius: Math.random() * 3 + 1,
            alpha: 1,
            color: color
        });
    }
}

function spawnObstacle() {
    let spawnAngle = Math.random() * Math.PI * 2;
    let startDist = 400; 
    let ox = CX + Math.cos(spawnAngle) * startDist;
    let oy = CY + Math.sin(spawnAngle) * startDist;
    let targetAngle = Math.atan2(CY - oy, CX - ox);
    
    // Level adjustments
    let speedMult = currentLevel >= 2 ? 1.5 : 1;
    let speedBase = (2.5 + Math.random() * 1.5 + Math.min(score * 0.05, 3)) * speedMult;
    
    let type = 'normal';
    let color = '#ff0055';
    
    // Random Shield Spawn (Low probability)
    if (Math.random() < 0.05) {
        type = 'shield';
        color = '#ffff00';
    } else if (currentLevel >= 3 && Math.random() < 0.2) {
        // Level 3 mechanic: Blue asteroids
        type = 'ghost';
        color = '#00f0ff';
    }

    obstacles.push({
        x: ox,
        y: oy,
        vx: Math.cos(targetAngle) * speedBase,
        vy: Math.sin(targetAngle) * speedBase,
        radius: type === 'shield' ? 12 : Math.random() * 5 + 9,
        type: type,
        color: color
    });
}

function update() {
    if (screenShake > 0) screenShake--;

    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;
        if (p.alpha <= 0) particles.splice(i, 1);
    }

    if (gameState !== 'PLAYING') return;

    // Level progression logic
    if (score >= 20 && currentLevel === 1) {
        currentLevel = 2;
        screenShake = 15;
    } else if (score >= 50 && currentLevel === 2) {
        currentLevel = 3;
        screenShake = 15;
    } else if (score >= 100 && currentLevel === 3) {
        currentLevel = 4;
        player.speed = player.baseSpeed * 1.6; // 60% speed boost
        screenShake = 20;
    }

    player.angle += player.speed * player.direction;
    player.x = CX + Math.cos(player.angle) * ORBIT_RADIUS;
    player.y = CY + Math.sin(player.angle) * ORBIT_RADIUS;

    player.trail.push({ x: player.x, y: player.y });
    if (player.trail.length > 12) player.trail.shift();

    spawnTimer++;
    if (spawnTimer >= spawnRate) {
        spawnTimer = 0;
        
        // Spawn multiple if level 2+
        let count = (currentLevel >= 2 && Math.random() < 0.3) ? 2 : 1;
        for (let i = 0; i < count; i++) {
            spawnObstacle();
        }

        if (spawnRate > 28 && score > 0 && score % 3 === 0) {
            spawnRate -= 1;
        }
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.x += obs.vx;
        obs.y += obs.vy;

        let distToPlayer = Math.hypot(player.x - obs.x, player.y - obs.y);
        if (distToPlayer < player.radius + obs.radius) {
            if (obs.type === 'shield') {
                hasShield = true;
                obstacles.splice(i, 1);
                createExplosion(obs.x, obs.y, '#ffff00', 15);
            } else {
                if (hasShield) {
                    hasShield = false;
                    obstacles.splice(i, 1);
                    createExplosion(player.x, player.y, '#ffff00', 20);
                    screenShake = 10;
                } else {
                    triggerGameOver();
                    return;
                }
            }
            continue;
        }

        let distToCenter = Math.hypot(CX - obs.x, CY - obs.y);
        
        if (obs.type === 'ghost') {
            // Ghost obstacles pass through but get removed when too far
            if (distToCenter > 500) {
                obstacles.splice(i, 1);
            }
        } else {
            if (distToCenter < PLANET_RADIUS + 4) {
                if (obs.type !== 'shield') {
                    createExplosion(obs.x, obs.y, obs.color, 6);
                    score++;
                    hud.innerText = score;
                }
                obstacles.splice(i, 1);
            }
        }
    }
}

function draw() {
    ctx.save();
    
    if (screenShake > 0) {
        let dx = (Math.random() - 0.5) * screenShake * 0.6;
        let dy = (Math.random() - 0.5) * screenShake * 0.6;
        ctx.translate(dx, dy);
    }

    ctx.fillStyle = 'rgba(8, 8, 16, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Level indicator
    if (gameState === 'PLAYING') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`LVL ${currentLevel}`, canvas.width - 20, 40);
        
        // Shield indicator
        if (hasShield) {
            ctx.fillStyle = '#ffff00';
            ctx.fillText('🛡️ ESCUDO', canvas.width - 20, 70);
        }
    }

    // Orbit guide
    ctx.beginPath();
    ctx.arc(CX, CY, ORBIT_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Planet
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00f0ff';
    ctx.beginPath();
    ctx.arc(CX, CY, PLANET_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#00f0ff';
    ctx.fill();

    // Obstacles
    obstacles.forEach(obs => {
        ctx.shadowBlur = obs.type === 'shield' ? 20 : 15;
        ctx.shadowColor = obs.color;
        ctx.fillStyle = obs.color;
        ctx.beginPath();
        if (obs.type === 'shield') {
            // Draw a diamond shape for the shield item
            ctx.moveTo(obs.x, obs.y - obs.radius);
            ctx.lineTo(obs.x + obs.radius, obs.y);
            ctx.lineTo(obs.x, obs.y + obs.radius);
            ctx.lineTo(obs.x - obs.radius, obs.y);
            ctx.closePath();
        } else {
            ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
        }
        ctx.fill();
    });

    // Trail
    ctx.shadowBlur = 0;
    player.trail.forEach((pos, idx) => {
        let alpha = (idx / player.trail.length) * 0.4;
        let rad = player.radius * (idx / player.trail.length);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, rad, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 102, ${alpha})`;
        ctx.fill();
    });

    // Player
    if (gameState === 'PLAYING') {
        ctx.shadowBlur = 15;
        ctx.shadowColor = hasShield ? '#ffff00' : '#00ff66';
        ctx.fillStyle = hasShield ? '#ffff00' : '#00ff66';
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Extra glow if shield active
        if (hasShield) {
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.radius + 4, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    // Particles
    ctx.shadowBlur = 5;
    particles.forEach(p => {
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    });

    ctx.restore();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

setupAudio();
initSession();
gameLoop();
