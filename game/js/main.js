import { Game } from './Game.js';

class App {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Элементы UI
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.healthElement = document.getElementById('health');
        this.coinsElement = document.getElementById('coins');
        this.timerElement = document.getElementById('timer');
        this.enemiesElement = document.getElementById('enemies');
        this.buffsDisplay = document.getElementById('buffsDisplay');
        
        // Элементы экрана завершения игры
        this.finalScoreElement = document.getElementById('finalScore');
        this.finalLevelElement = document.getElementById('finalLevel');
        this.finalCoinsElement = document.getElementById('finalCoins');
        this.finalEnemiesElement = document.getElementById('finalEnemies');
        this.gameOverTitleElement = document.getElementById('gameOverTitle');
        this.resultMessageElement = document.getElementById('resultMessage');
        
        // Элементы экрана завершения уровня
        this.timeBonusElement = document.getElementById('timeBonus');
        this.healthBonusElement = document.getElementById('healthBonus');
        this.totalBonusElement = document.getElementById('totalBonus');
        this.currentLevelElement = document.getElementById('currentLevel');
        this.progressFillElement = document.getElementById('progressFill');
        this.levelUpMessageElement = document.getElementById('levelUpMessage');
        
        // Экраны
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.levelCompleteScreen = document.getElementById('levelCompleteScreen');
        
        // Кнопки
        this.startButton = document.getElementById('startButton');
        this.restartButton = document.getElementById('restartButton');
        this.nextLevelButton = document.getElementById('nextLevelButton');
        this.menuButton = document.getElementById('menuButton');
        
        this.game = null;
        this.gameRunning = false;
        this.lastTime = 0;
        this.fps = 60;
        this.frameInterval = 1000 / this.fps;
        this.frameTimer = 0;
        this.animationId = null;
        
        this.setupEventListeners();
        this.setupAudio();
        this.preventCanvasScroll();
        this.init();
    }

    init() {
        // Инициализация звуков
        this.sounds = {
            jump: document.getElementById('jumpSound'),
            coin: document.getElementById('coinSound'),
            attack: document.getElementById('attackSound')
        };
        
        // Установка громкости
        this.audioVolume = 0.3;
        Object.values(this.sounds).forEach(sound => {
            if (sound) sound.volume = this.audioVolume;
        });
        
        // Фокус на canvas
        this.canvas.setAttribute('tabindex', '0');
        this.canvas.focus();
        
        // Проверяем наличие необходимых элементов
        if (!this.buffsDisplay) {
            this.buffsDisplay = document.createElement('div');
            this.buffsDisplay.id = 'buffsDisplay';
            this.buffsDisplay.className = 'buffs-display';
            document.querySelector('.game-container').appendChild(this.buffsDisplay);
        }
    }

    setupEventListeners() {
        // Старт игры
        this.startButton.addEventListener('click', () => {
            this.startGame();
        });

        // Рестарт игры
        this.restartButton.addEventListener('click', () => {
            this.restartGame();
        });

        // Следующий уровень
        this.nextLevelButton.addEventListener('click', () => {
            this.nextLevel();
        });

        // Возврат в меню
        if (this.menuButton) {
            this.menuButton.addEventListener('click', () => {
                this.returnToMenu();
            });
        }

        // Старт по любой клавише
        document.addEventListener('keydown', (event) => {
            if (this.game === null && !this.startScreen.classList.contains('hidden')) {
                this.startGame();
            }
            
            // Пауза по ESC
            if (event.code === 'Escape' && this.game && this.game.state === 'playing') {
                this.game.state = 'paused';
            } else if (event.code === 'Escape' && this.game && this.game.state === 'paused') {
                this.game.state = 'playing';
                this.gameLoop();
            }
        });
        
        // Предотвращаем контекстное меню на canvas
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        // Обработка потери фокуса окна
        window.addEventListener('blur', () => {
            if (this.game && this.game.state === 'playing') {
                this.game.state = 'paused';
            }
        });
        
        // Обработка клика по canvas для фокуса
        this.canvas.addEventListener('click', () => {
            this.canvas.focus();
        });
        
        // Предотвращаем прокрутку страницы при использовании пробела
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.game && this.game.state === 'playing') {
                e.preventDefault();
            }
        });
    }

    setupAudio() {
        // Создаем элементы для звуков, если их нет
        if (!document.getElementById('jumpSound')) {
            this.createAudioElement('jumpSound', 'https://assets.mixkit.co/sfx/preview/mixkit-jump-arcade-game-166.mp3');
            this.createAudioElement('coinSound', 'https://assets.mixkit.co/sfx/preview/mixkit-coin-win-notification-199.mp3');
            this.createAudioElement('attackSound', 'https://assets.mixkit.co/sfx/preview/mixkit-laser-weapon-shot-1671.mp3');
            this.createAudioElement('damageSound', 'https://assets.mixkit.co/sfx/preview/mixkit-retro-game-emergency-alarm-1000.mp3');
            this.createAudioElement('powerupSound', 'https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3');
        }
    }

    createAudioElement(id, src) {
        const audio = document.createElement('audio');
        audio.id = id;
        audio.preload = 'auto';
        audio.volume = this.audioVolume || 0.3;
        
        const source = document.createElement('source');
        source.src = src;
        source.type = 'audio/mpeg';
        
        audio.appendChild(source);
        document.body.appendChild(audio);
    }

    playSound(soundId) {
        const sound = document.getElementById(soundId);
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => {
                console.log('Audio play failed:', e);
            });
        }
    }

    preventCanvasScroll() {
        // Предотвращаем прокрутку страницы при взаимодействии с игрой
        this.canvas.addEventListener('wheel', (e) => {
            if (this.game && this.game.state === 'playing') {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Предотвращаем прокрутку на тач-устройствах
        this.canvas.addEventListener('touchmove', (e) => {
            if (this.game && this.game.state === 'playing') {
                e.preventDefault();
            }
        }, { passive: false });
    }

    startGame() {
        console.log('Запуск игры');
        this.hideAllScreens();
        
        this.game = new Game(this.canvas.width, this.canvas.height);
        this.gameRunning = true;
        this.lastTime = performance.now();
        
        this.updateUI();
        this.gameLoop();
        
        // Фокус на canvas для обработки клавиш
        this.canvas.focus();
        
        // Проигрываем стартовый звук
        this.playSound('powerupSound');
    }

    hideAllScreens() {
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.levelCompleteScreen.classList.add('hidden');
    }

    restartGame() {
        console.log('Рестарт игры');
        this.gameOverScreen.classList.add('hidden');
        this.startGame();
    }

    nextLevel() {
        console.log('Переход на следующий уровень');
        this.levelCompleteScreen.classList.add('hidden');
        this.game.nextLevel();
        this.gameRunning = true;
        this.lastTime = performance.now();
        
        this.updateUI();
        this.gameLoop();
        
        // Проигрываем звук перехода на уровень
        this.playSound('powerupSound');
    }

    returnToMenu() {
        console.log('Возврат в меню');
        this.stopGame();
        this.startScreen.classList.remove('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.levelCompleteScreen.classList.add('hidden');
        this.game = null;
        
        // Фокус на кнопке старта
        this.startButton.focus();
    }

    stopGame() {
        this.gameRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    gameLoop(currentTime = 0) {
        if (!this.game || !this.gameRunning) {
            console.log('Игровой цикл остановлен');
            return;
        }

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        this.frameTimer += deltaTime;

        // Фиксированный шаг обновления для стабильной физики
        while (this.frameTimer >= this.frameInterval) {
            // Обновление игры
            this.game.update();
            
            // Очистка canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Отрисовка игры
            this.game.draw(this.ctx);
            
            // Обновление UI
            this.updateUI();
            
            // Проверка состояния игры
            if (this.game.state === 'gameOver' || this.game.state === 'levelComplete') {
                this.handleGameState();
                return;
            }
            
            this.frameTimer -= this.frameInterval;
        }

        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    handleGameState() {
        if (this.game) {
            console.log('Обработка состояния:', this.game.state);
            switch (this.game.state) {
                case 'gameOver':
                    this.showGameOverScreen();
                    break;
                    
                case 'levelComplete':
                    this.showLevelCompleteScreen();
                    break;
                    
                case 'paused':
                    // Пауза обрабатывается в updateUI
                    break;
            }
            
            if (this.game.state !== 'paused') {
                this.gameRunning = false;
            }
        }
    }

    showGameOverScreen() {
        // Основная информация
        if (this.finalScoreElement) {
            this.finalScoreElement.textContent = this.game.score;
        }
        
        if (this.finalLevelElement) {
            this.finalLevelElement.textContent = this.game.currentLevel;
        }
        
        // Дополнительная статистика
        if (this.finalCoinsElement) {
            this.finalCoinsElement.textContent = this.game.coinsCollected;
        }
        
        if (this.finalEnemiesElement) {
            const defeatedEnemies = this.game.enemies ? 
                this.game.enemies.filter(e => !e.isActive).length : 0;
            this.finalEnemiesElement.textContent = defeatedEnemies;
        }
        
        // Заголовок
        if (this.gameOverTitleElement) {
            if (this.game.currentLevel >= 5) {
                this.gameOverTitleElement.textContent = '🎉 Победа!';
            } else {
                this.gameOverTitleElement.textContent = '🎮 Игра окончена!';
            }
        }
        
        // Сообщение
        if (this.resultMessageElement) {
            if (this.game.currentLevel >= 5) {
                this.resultMessageElement.textContent = 'Вы прошли все уровни! Вы настоящий герой!';
                this.resultMessageElement.style.color = '#F39C12';
            } else if (this.game.score > 1000) {
                this.resultMessageElement.textContent = 'Отличный результат! Попробуйте пройти все уровни!';
                this.resultMessageElement.style.color = '#2ECC71';
            } else if (this.game.score > 500) {
                this.resultMessageElement.textContent = 'Хорошая игра! У вас отличный потенциал!';
                this.resultMessageElement.style.color = '#3498DB';
            } else {
                this.resultMessageElement.textContent = 'Попробуйте снова и улучшите свой результат!';
                this.resultMessageElement.style.color = '#E74C3C';
            }
        }
        
        // Показываем кнопку меню
        if (this.menuButton) {
            this.menuButton.style.display = 'inline-block';
        }
        
        this.gameOverScreen.classList.remove('hidden');
        
        // Проигрываем звук завершения игры
        if (this.game.currentLevel >= 5) {
            this.playSound('powerupSound');
        } else {
            this.playSound('damageSound');
        }
    }

    showLevelCompleteScreen() {
        // Вычисляем бонусы
        const timeLeft = this.game.levelTimeLimit - this.game.levelTime;
        const timeBonus = Math.max(0, timeLeft) * 2;
        const healthBonus = this.game.playerHealth * 50;
        const totalBonus = 100 + timeBonus + healthBonus;
        
        // Обновляем элементы
        if (this.timeBonusElement) {
            this.timeBonusElement.textContent = timeBonus;
        }
        
        if (this.healthBonusElement) {
            this.healthBonusElement.textContent = healthBonus;
        }
        
        if (this.totalBonusElement) {
            this.totalBonusElement.textContent = totalBonus;
        }
        
        if (this.currentLevelElement) {
            this.currentLevelElement.textContent = this.game.currentLevel;
        }
        
        // Обновляем прогресс-бар
        if (this.progressFillElement) {
            const progress = (this.game.currentLevel / 5) * 100;
            this.progressFillElement.style.width = `${progress}%`;
        }
        
        // Обновляем сообщение
        if (this.levelUpMessageElement) {
            if (this.game.currentLevel === 5) {
                this.levelUpMessageElement.textContent = 'Финальный босс ждет вас! Будьте осторожны!';
                this.levelUpMessageElement.style.color = '#F39C12';
            } else if (this.game.currentLevel === 4) {
                this.levelUpMessageElement.textContent = 'Отлично! Следующий уровень - финальный бой!';
                this.levelUpMessageElement.style.color = '#E74C3C';
            } else if (this.game.currentLevel === 3) {
                this.levelUpMessageElement.textContent = 'Потрясающе! Вы становитесь сильнее!';
                this.levelUpMessageElement.style.color = '#9B59B6';
            } else {
                this.levelUpMessageElement.textContent = 'Отличная работа! Готовьтесь к следующему вызову!';
                this.levelUpMessageElement.style.color = '#2ECC71';
            }
        }
        
        this.levelCompleteScreen.classList.remove('hidden');
        
        // Проигрываем звук завершения уровня
        this.playSound('coinSound');
    }

    updateUI() {
        if (this.game) {
            // Основная информация
            if (this.scoreElement) {
                this.scoreElement.textContent = this.game.score;
            }
            
            if (this.levelElement) {
                this.levelElement.textContent = this.game.currentLevel;
            }
            
            if (this.healthElement) {
                this.healthElement.textContent = this.game.playerHealth;
                
                // Анимация изменения здоровья
                if (this.game.playerHealthChanged) {
                    this.healthElement.classList.add('health-changed');
                    setTimeout(() => {
                        this.healthElement.classList.remove('health-changed');
                    }, 300);
                    this.game.playerHealthChanged = false;
                }
            }
            
            if (this.coinsElement) {
                this.coinsElement.textContent = `${this.game.coinsCollected}/${this.game.coinsToWin}`;
            }
            
            // Таймер
            if (this.timerElement) {
                const timeLeft = this.game.levelTimeLimit - this.game.levelTime;
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                this.timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                
                // Меняем цвет таймера при малом времени
                if (timeLeft < 30) {
                    this.timerElement.style.color = '#E74C3C';
                    this.timerElement.classList.add('blinking');
                } else {
                    this.timerElement.style.color = '#FFFFFF';
                    this.timerElement.classList.remove('blinking');
                }
            }
            
            // Количество активных врагов
            if (this.enemiesElement && this.game.enemies) {
                const activeEnemies = this.game.enemies.filter(e => e.isActive).length;
                this.enemiesElement.textContent = activeEnemies;
                
                // Особый стиль для босс-уровня
                if (this.game.currentLevel === 5) {
                    this.enemiesElement.style.color = '#F39C12';
                } else {
                    this.enemiesElement.style.color = '#FFFFFF';
                }
            }
            
            // Обновляем индикаторы бонусов
            this.updateBuffsDisplay();
            
            // Обновляем прогресс-бар
            this.updateProgressBar();
        }
    }

    updateBuffsDisplay() {
        if (!this.buffsDisplay) return;
        
        if (!this.game || !this.game.player) {
            this.buffsDisplay.innerHTML = '';
            return;
        }
        
        const player = this.game.player;
        const buffs = [];
        
        // Скорость
        if (player.speedBoost > 0) {
            const seconds = Math.ceil(player.speedBoost / 60);
            buffs.push({
                type: 'speed',
                icon: '⚡',
                text: `Скорость (${seconds}с)`,
                color: '#3498DB'
            });
        }
        
        // Прыжок
        if (player.jumpBoost > 0) {
            const seconds = Math.ceil(player.jumpBoost / 60);
            buffs.push({
                type: 'jump',
                icon: '👟',
                text: `Прыжок (${seconds}с)`,
                color: '#9B59B6'
            });
        }
        
        // Урон
        if (player.damageBoost > 0) {
            const seconds = Math.ceil(player.damageBoost / 60);
            buffs.push({
                type: 'damage',
                icon: '💥',
                text: `Урон x2 (${seconds}с)`,
                color: '#F39C12'
            });
        }
        
        // Щит
        if (player.hasShield) {
            buffs.push({
                type: 'shield',
                icon: '🛡️',
                text: 'Щит активен',
                color: '#1ABC9C'
            });
        }
        
        // Обновляем отображение
        this.buffsDisplay.innerHTML = buffs.map(buff => `
            <div class="buff-indicator buff-${buff.type}" style="border-color: ${buff.color};">
                <span style="color: ${buff.color}; font-size: 1.2em;">${buff.icon}</span>
                <span style="color: white; font-size: 0.9em;">${buff.text}</span>
            </div>
        `).join('');
        
        // Показываем/скрываем контейнер
        if (buffs.length > 0) {
            this.buffsDisplay.style.display = 'flex';
        } else {
            this.buffsDisplay.style.display = 'none';
        }
    }

    updateProgressBar() {
        if (this.progressFillElement && this.game) {
            const progress = (this.game.currentLevel / 5) * 100;
            this.progressFillElement.style.width = `${progress}%`;
        }
    }
}

// Запуск приложения когда DOM готов
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    
    // Добавляем стили для анимаций
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        @keyframes healthChange {
            0%, 100% { color: white; }
            50% { color: #E74C3C; transform: scale(1.2); }
        }
        
        .health-changed {
            animation: healthChange 0.3s ease;
        }
        
        .blinking {
            animation: blink 1s infinite;
        }
        
        .screen {
            animation: fadeIn 0.5s ease-out;
        }
        
        button:hover {
            animation: pulse 0.3s ease;
        }
        
        .loading {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: #1a1a2e;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            font-family: 'Press Start 2P', cursive;
            color: #3498db;
            font-size: 24px;
        }
        
        .loading::after {
            content: '🕹️ ЗАГРУЗКА...';
            animation: blink 1s infinite;
        }
        
        /* Адаптивные стили для HUD */
        @media (max-width: 800px) {
            .hud-item {
                padding: 8px 12px;
                font-size: 0.9em;
            }
            
            .hud-icon {
                font-size: 1.2em;
            }
            
            .hud-value {
                font-size: 1.2em;
            }
            
            .level-display {
                font-size: 0.9em;
                padding: 6px 15px;
            }
            
            .coins-display {
                font-size: 0.8em;
                padding: 5px 10px;
            }
            
            .buffs-display {
                bottom: 10px;
                right: 10px;
            }
            
            .buff-indicator {
                padding: 8px 12px;
                font-size: 0.8em;
            }
        }
        
        @media (max-height: 600px) {
            .game-hud {
                top: 10px;
                padding: 0 10px;
            }
            
            .hud-item {
                padding: 6px 10px;
            }
            
            .buffs-display {
                flex-direction: row;
                bottom: 5px;
                right: 5px;
                gap: 5px;
            }
            
            .buff-indicator {
                padding: 5px 8px;
            }
        }
        
        /* Улучшенные стили для скролла */
        .screen-content {
            max-height: 70vh;
            overflow-y: auto;
            padding-right: 10px;
        }
        
        .screen-content::-webkit-scrollbar {
            width: 8px;
        }
        
        .screen-content::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
        }
        
        .screen-content::-webkit-scrollbar-thumb {
            background: #3498db;
            border-radius: 4px;
        }
        
        .screen-content::-webkit-scrollbar-thumb:hover {
            background: #2980b9;
        }
    `;
    document.head.appendChild(style);
    
    // Показываем загрузку на короткое время
    const loading = document.createElement('div');
    loading.className = 'loading';
    document.body.appendChild(loading);
    
    // Скрываем загрузку через 1 секунду
    setTimeout(() => {
        loading.style.opacity = '0';
        loading.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            loading.remove();
            
            // Фокус на кнопке старта
            const startButton = document.getElementById('startButton');
            if (startButton) {
                startButton.focus();
            }
        }, 500);
    }, 1000);
    
    // Добавляем обработчик для адаптивности
    window.addEventListener('resize', () => {
        // Адаптируем размер canvas на мобильных устройствах
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer && window.innerWidth < 800) {
            const scale = Math.min(window.innerWidth / 800, 1);
            gameContainer.style.transform = `scale(${scale})`;
            gameContainer.style.transformOrigin = 'top center';
        } else if (gameContainer) {
            gameContainer.style.transform = 'none';
        }
    });
    
    // Вызываем сразу для инициализации
    window.dispatchEvent(new Event('resize'));
    
    // Добавляем поддержку тач-событий
    let touchStartX = 0;
    let touchStartY = 0;
    
    document.addEventListener('touchstart', (e) => {
        if (app.game && app.game.state === 'playing') {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }
    }, { passive: true });
    
    document.addEventListener('touchmove', (e) => {
        if (app.game && app.game.state === 'playing') {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Улучшаем доступность
    document.addEventListener('keydown', (e) => {
        // Навигация по интерфейсу с Tab
        if (e.key === 'Tab') {
            const focusableElements = document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            if (e.shiftKey && document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
            }
        }
        
        // Быстрые клавиши для отладки
        if (e.ctrlKey && e.key === 'd') {
            console.log('Текущее состояние игры:', app.game);
            e.preventDefault();
        }
    });
});