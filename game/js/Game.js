import { Player } from './Player.js';
import { Platform } from './Platform.js';
import { Coin } from './Coin.js';
import { Enemy } from './Enemy.js';
import { Projectile } from './Projectile.js';
import { PowerUp } from './PowerUp.js';
import { InputHandler } from './InputHandler.js';
import { checkCollision } from './Collision.js';

export class Game {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.gravity = 0.5;
        this.state = 'playing';
        this.score = 0;
        this.currentLevel = 1;
        this.coinsCollected = 0;
        this.coinsToWin = 3;
        this.playerHealth = 3;
        this.maxHealth = 3;
        this.totalLevels = 5;
        
        this.player = new Player(this);
        this.platforms = [];
        this.coins = [];
        this.enemies = [];
        this.projectiles = [];
        this.powerUps = [];
        this.input = new InputHandler();
        this.particleSystems = [];
        
        this.levelTime = 0;
        this.levelTimeLimit = 180; // 3 минуты в секундах
        this.gameTime = 0;
        this.isBossLevel = false;
        
        this.setupLevel();
        this.setupPauseHandler();
    }

    setupPauseHandler() {
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Escape' && this.state === 'playing') {
                this.state = 'paused';
            } else if (event.code === 'Escape' && this.state === 'paused') {
                this.state = 'playing';
            }
        });
    }

    setupLevel() {
        this.platforms = [];
        this.coins = [];
        this.enemies = [];
        this.projectiles = [];
        this.powerUps = [];
        this.coinsCollected = 0;
        this.levelTime = 0;
        this.isBossLevel = this.currentLevel === 5;
        
        // Настройки для разных уровней
        switch(this.currentLevel) {
            case 1:
                this.coinsToWin = 5;
                this.levelTimeLimit = 180;
                break;
            case 2:
                this.coinsToWin = 8;
                this.levelTimeLimit = 150;
                break;
            case 3:
                this.coinsToWin = 12;
                this.levelTimeLimit = 120;
                break;
            case 4:
                this.coinsToWin = 15;
                this.levelTimeLimit = 90;
                break;
            case 5: // Босс-уровень
                this.coinsToWin = 20;
                this.levelTimeLimit = 300;
                break;
        }
        
        this.generateLevel();
        this.player.reset();
        
        // Начальная позиция игрока
        const startPlatform = this.platforms.find(p => p.x <= 100 && p.x + p.width >= 100);
        if (startPlatform) {
            this.player.y = startPlatform.y - this.player.height - 10;
            this.player.x = startPlatform.x + 20;
        }
    }

    generateLevel() {
        this.platforms = [];
        this.enemies = [];
        this.powerUps = [];

        // Добавляем основную землю
        if (this.currentLevel !== 5) {
            this.platforms.push(new Platform(0, this.height - 40, this.width, 40, 'normal'));
        }

        switch(this.currentLevel) {
            case 1:
                this.generateLevel1();
                break;
            case 2:
                this.generateLevel2();
                break;
            case 3:
                this.generateLevel3();
                break;
            case 4:
                this.generateLevel4();
                break;
            case 5:
                this.generateLevel5();
                break;
        }
        
        // Добавляем случайные пауэр-апы
        this.generatePowerUps();
        
        // Генерируем монеты
        this.generateCoins(this.coinsToWin + 5);
    }

    generateLevel1() {
        // Базовый уровень с патрульными врагами
        const platformConfigs = [
            { x: 100, y: 450, width: 120, height: 20, type: 'normal' },
            { x: 300, y: 400, width: 100, height: 20, type: 'normal' },
            { x: 500, y: 350, width: 100, height: 20, type: 'moving' },
            { x: 200, y: 300, width: 90, height: 20, type: 'normal' },
            { x: 400, y: 250, width: 100, height: 20, type: 'normal' },
            { x: 600, y: 200, width: 80, height: 20, type: 'normal' },
            { x: 300, y: 150, width: 100, height: 20, type: 'normal' },
            { x: 100, y: 200, width: 80, height: 20, type: 'moving' }
        ];

        platformConfigs.forEach(config => {
            this.platforms.push(new Platform(config.x, config.y, config.width, config.height, config.type));
        });
        
        // Добавляем врагов
        this.enemies.push(new Enemy(200, 430, 'patrol'));
        this.enemies.push(new Enemy(450, 330, 'patrol'));
        this.enemies.push(new Enemy(150, 180, 'patrol'));
    }

    generateLevel2() {
        // Уровень с преследователями
        this.platforms.push(new Platform(0, this.height - 40, this.width * 0.4, 40, 'normal'));
        this.platforms.push(new Platform(this.width * 0.6, this.height - 40, this.width * 0.4, 40, 'normal'));

        const platformConfigs = [
            { x: 100, y: 450, width: 100, height: 20, type: 'normal' },
            { x: 250, y: 380, width: 90, height: 20, type: 'normal' },
            { x: 150, y: 300, width: 80, height: 20, type: 'moving' },
            { x: 350, y: 320, width: 100, height: 20, type: 'normal' },
            { x: 500, y: 280, width: 90, height: 20, type: 'normal' },
            { x: 650, y: 350, width: 100, height: 20, type: 'normal' },
            { x: 550, y: 250, width: 80, height: 20, type: 'moving' },
            { x: 700, y: 200, width: 70, height: 20, type: 'normal' },
            { x: 400, y: 180, width: 100, height: 20, type: 'normal' },
            { x: 200, y: 220, width: 80, height: 20, type: 'deadly' }
        ];

        platformConfigs.forEach(config => {
            this.platforms.push(new Platform(config.x, config.y, config.width, config.height, config.type));
        });
        
        // Добавляем врагов
        this.enemies.push(new Enemy(300, 430, 'chaser'));
        this.enemies.push(new Enemy(500, 260, 'chaser'));
        this.enemies.push(new Enemy(650, 330, 'patrol'));
    }

    generateLevel3() {
        // Лабиринтный уровень со стрелками
        const platformConfigs = [
            // Нижний уровень
            { x: 0, y: 550, width: 200, height: 20, type: 'normal' },
            { x: 300, y: 550, width: 200, height: 20, type: 'normal' },
            { x: 600, y: 550, width: 200, height: 20, type: 'normal' },
            
            // Средние платформы
            { x: 100, y: 450, width: 150, height: 20, type: 'normal' },
            { x: 350, y: 450, width: 150, height: 20, type: 'moving' },
            { x: 600, y: 450, width: 150, height: 20, type: 'normal' },
            
            // Верхние платформы
            { x: 200, y: 350, width: 120, height: 20, type: 'normal' },
            { x: 450, y: 350, width: 120, height: 20, type: 'deadly' },
            { x: 700, y: 350, width: 100, height: 20, type: 'normal' },
            
            // Прыжковые платформы
            { x: 100, y: 250, width: 80, height: 20, type: 'normal' },
            { x: 350, y: 250, width: 80, height: 20, type: 'bouncy' },
            { x: 600, y: 250, width: 80, height: 20, type: 'normal' },
            
            // Верх
            { x: 300, y: 150, width: 200, height: 20, type: 'normal' }
        ];

        platformConfigs.forEach(config => {
            this.platforms.push(new Platform(config.x, config.y, config.width, config.height, config.type));
        });
        
        // Добавляем врагов
        this.enemies.push(new Enemy(400, 530, 'shooter'));
        this.enemies.push(new Enemy(150, 430, 'patrol'));
        this.enemies.push(new Enemy(650, 430, 'chaser'));
        this.enemies.push(new Enemy(320, 330, 'shooter'));
    }

    generateLevel4() {
        // Сложный уровень со всеми типами врагов
        const platformConfigs = [
            // Основа
            { x: 0, y: 580, width: 800, height: 20, type: 'normal' },
            
            // Сложная структура
            { x: 50, y: 500, width: 100, height: 20, type: 'normal' },
            { x: 200, y: 450, width: 100, height: 20, type: 'moving' },
            { x: 350, y: 500, width: 100, height: 20, type: 'normal' },
            { x: 500, y: 450, width: 100, height: 20, type: 'deadly' },
            { x: 650, y: 500, width: 100, height: 20, type: 'normal' },
            
            { x: 100, y: 350, width: 120, height: 20, type: 'normal' },
            { x: 300, y: 300, width: 100, height: 20, type: 'bouncy' },
            { x: 500, y: 350, width: 120, height: 20, type: 'normal' },
            
            { x: 200, y: 200, width: 80, height: 20, type: 'moving' },
            { x: 400, y: 150, width: 150, height: 20, type: 'normal' },
            { x: 600, y: 200, width: 80, height: 20, type: 'deadly' },
            
            { x: 50, y: 100, width: 100, height: 20, type: 'normal' },
            { x: 650, y: 100, width: 100, height: 20, type: 'normal' }
        ];

        platformConfigs.forEach(config => {
            this.platforms.push(new Platform(config.x, config.y, config.width, config.height, config.type));
        });
        
        // Много врагов
        this.enemies.push(new Enemy(100, 480, 'patrol'));
        this.enemies.push(new Enemy(400, 480, 'chaser'));
        this.enemies.push(new Enemy(700, 480, 'patrol'));
        this.enemies.push(new Enemy(250, 330, 'shooter'));
        this.enemies.push(new Enemy(550, 330, 'shooter'));
        this.enemies.push(new Enemy(450, 130, 'chaser'));
    }

    generateLevel5() {
        // Уровень с боссом (арена)
        const platformConfigs = [
            // Большая арена
            { x: 0, y: 580, width: 800, height: 20, type: 'normal' },
            { x: 100, y: 450, width: 200, height: 20, type: 'normal' },
            { x: 500, y: 450, width: 200, height: 20, type: 'normal' },
            { x: 300, y: 300, width: 200, height: 20, type: 'normal' },
            { x: 50, y: 200, width: 100, height: 20, type: 'normal' },
            { x: 650, y: 200, width: 100, height: 20, type: 'normal' },
            { x: 200, y: 100, width: 80, height: 20, type: 'normal' },
            { x: 520, y: 100, width: 80, height: 20, type: 'normal' }
        ];

        platformConfigs.forEach(config => {
            this.platforms.push(new Platform(config.x, config.y, config.width, config.height, config.type));
        });
        
        // Создаем босса
        const boss = new Enemy(350, 80, 'boss');
        boss.width = 80;
        boss.height = 80;
        boss.health = 15;
        boss.speed = 1.5;
        boss.patrolDistance = 200;
        this.enemies.push(boss);
        
        // Миньоны босса
        this.enemies.push(new Enemy(200, 150, 'shooter'));
        this.enemies.push(new Enemy(600, 150, 'shooter'));
        this.enemies.push(new Enemy(100, 430, 'chaser'));
        this.enemies.push(new Enemy(700, 430, 'chaser'));
    }

    generateCoins(coinCount) {
        const normalPlatforms = this.platforms.filter(p => p.type === 'normal' || p.type === 'moving');
        
        // Распределяем монеты по платформам
        for (let i = 0; i < coinCount; i++) {
            if (normalPlatforms.length === 0) break;
            
            const platform = normalPlatforms[i % normalPlatforms.length];
            const x = platform.x + 10 + Math.random() * (platform.width - 30);
            const y = platform.y - 25;
            
            this.coins.push(new Coin(x, y, this));
        }
    }

    generatePowerUps() {
        const normalPlatforms = this.platforms.filter(p => p.type === 'normal');
        const powerUpTypes = ['health', 'speed', 'jump', 'damage', 'shield'];
        const count = this.currentLevel === 5 ? 2 : 3; // Меньше пауэр-апов на босс-уровне
        
        for (let i = 0; i < count && normalPlatforms.length > 0; i++) {
            const platform = normalPlatforms[Math.floor(Math.random() * normalPlatforms.length)];
            const x = platform.x + 10 + Math.random() * (platform.width - 40);
            const y = platform.y - 40;
            const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
            
            this.powerUps.push(new PowerUp(x, y, type));
        }
    }

    update() {
        if (this.state !== 'playing') {
            return;
        }

        this.gameTime++;
        this.levelTime = Math.floor(this.gameTime / 60);
        
        this.player.update(this.input.keys, this.platforms);
        
        // Обновление платформ
        this.platforms.forEach(platform => {
            if (platform.update) platform.update();
        });
        
        // Обновление врагов
        this.enemies.forEach(enemy => {
            enemy.update(this.player);
            
            // Проверка столкновений с игроком
            if (checkCollision(this.player, enemy) && enemy.isActive) {
                this.playerTakeDamage(1);
            }
            
            // Проверка стрельбы врагов
            if (enemy.type === 'shooter') {
                const projectile = enemy.update(this.player);
                if (projectile) {
                    this.projectiles.push(new Projectile(
                        projectile.x, projectile.y,
                        projectile.dx, projectile.dy,
                        projectile.damage, false
                    ));
                }
            }
            
            // Проверка столкновений снарядов игрока с врагами
            this.projectiles.forEach((projectile, index) => {
                if (projectile.isPlayer && checkCollision(projectile, enemy) && enemy.isActive) {
                    const enemyDestroyed = enemy.takeDamage(projectile.damage);
                    if (enemyDestroyed) {
                        this.score += enemy.type === 'boss' ? 500 : 100;
                    }
                    projectile.active = false;
                }
            });
        });
        
        // Обновление снарядов
        this.projectiles = this.projectiles.filter(projectile => {
            projectile.update();
            
            // Проверка столкновений снарядов врагов с игроком
            if (!projectile.isPlayer && checkCollision(this.player, projectile)) {
                this.playerTakeDamage(projectile.damage);
                return false;
            }
            
            // Проверка столкновений с платформами
            let hitPlatform = false;
            for (const platform of this.platforms) {
                if (checkCollision(projectile, platform)) {
                    hitPlatform = true;
                    break;
                }
            }
            
            return projectile.active && !hitPlatform;
        });
        
        // Обновление монет
        this.coins.forEach(coin => {
            coin.update();
            
            if (checkCollision(this.player, coin) && !coin.collected) {
                this.collectCoin(coin);
            }
        });
        
        // Обновление пауэр-апов
        this.powerUps = this.powerUps.filter(powerUp => {
            powerUp.update();
            
            if (checkCollision(this.player, powerUp) && !powerUp.collected) {
                this.collectPowerUp(powerUp);
                return false;
            }
            
            return true;
        });
        
        // Проверка условий победы/проигрыша
        this.checkGameConditions();
        
        // Проверка таймера
        if (this.levelTime >= this.levelTimeLimit) {
            this.state = 'gameOver';
            document.getElementById('finalScore').textContent = this.score;
            document.getElementById('gameOverTitle').textContent = 'Время вышло!';
        }
    }

    collectCoin(coin) {
        if (coin.collected) return;
        
        coin.collect();
        this.coinsCollected++;
        this.score += 10;
        
        // Дополнительные очки за серию
        if (this.coinsCollected % 5 === 0) {
            this.score += 50;
        }
        
        if (this.coinsCollected >= this.coinsToWin) {
            this.completeLevel();
        }
    }

    collectPowerUp(powerUp) {
        const type = powerUp.collect();
        
        switch(type) {
            case 'health':
                this.playerHealth = Math.min(this.maxHealth, this.playerHealth + 1);
                this.score += 25;
                break;
            case 'speed':
                this.player.speedBoost = 300; // 5 секунд буста
                this.score += 25;
                break;
            case 'jump':
                this.player.jumpBoost = 300;
                this.score += 25;
                break;
            case 'damage':
                this.player.damageBoost = 300;
                this.score += 25;
                break;
            case 'shield':
                this.player.hasShield = true;
                this.score += 25;
                break;
        }
    }

    playerTakeDamage(damage) {
        // Проверка неуязвимости после получения урона
        if (this.player.invulnerableTimer > 0) return;
        
        if (this.player.hasShield) {
            this.player.hasShield = false;
            this.player.invulnerableTimer = 30; // 0.5 секунды неуязвимости
            return;
        }
        
        this.playerHealth -= damage;
        this.player.invulnerableTimer = 60; // 1 секунда неуязвимости
        
        if (this.playerHealth <= 0) {
            this.state = 'gameOver';
            document.getElementById('finalScore').textContent = this.score;
            document.getElementById('gameOverTitle').textContent = 'Игра окончена!';
        }
    }

    completeLevel() {
        // Бонус за оставшееся время
        const timeBonus = Math.max(0, this.levelTimeLimit - this.levelTime) * 2;
        this.score += 100 + timeBonus;
        this.score += this.playerHealth * 50; // Бонус за здоровье
        
        // Дополнительный бонус за босс-уровень
        if (this.currentLevel === 5) {
            this.score += 1000;
        }
        
        this.state = 'levelComplete';
    }

    nextLevel() {
        this.currentLevel++;
        
        if (this.currentLevel > this.totalLevels) {
            this.state = 'gameOver';
            document.getElementById('finalScore').textContent = this.score;
            document.getElementById('gameOverTitle').textContent = 'Победа! Все уровни пройдены!';
        } else {
            this.setupLevel();
            this.state = 'playing';
        }
    }

    checkGameConditions() {
        // Падение за экран
        if (this.player.y > this.height + 100) {
            this.state = 'gameOver';
            document.getElementById('finalScore').textContent = this.score;
            document.getElementById('gameOverTitle').textContent = 'Игра окончена!';
        }
        
        // Все враги побеждены на босс-уровне
        if (this.currentLevel === 5 && this.enemies.every(enemy => !enemy.isActive)) {
            this.completeLevel();
        }
    }

    draw(ctx) {
        // Фон
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        if (this.currentLevel === 5) {
            // Темный фон для босс-уровня
            gradient.addColorStop(0, '#2C3E50');
            gradient.addColorStop(1, '#1C2833');
        } else {
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(1, '#98FB98');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Отрисовка платформ
        this.platforms.forEach(platform => platform.draw(ctx));
        
        // Отрисовка монет
        this.coins.forEach(coin => coin.draw(ctx));
        
        // Отрисовка врагов
        this.enemies.forEach(enemy => enemy.draw(ctx));
        
        // Отрисовка снарядов
        this.projectiles.forEach(projectile => projectile.draw(ctx));
        
        // Отрисовка пауэр-апов
        this.powerUps.forEach(powerUp => powerUp.draw(ctx));
        
        // Отрисовка игрока
        this.player.draw(ctx);
        
        // Отрисовка HUD
        this.drawHUD(ctx);
        
        // Отрисовка паузы
        if (this.state === 'paused') {
            this.drawPauseScreen(ctx);
        }
    }

    drawHUD(ctx) {
        const hudHeight = 60;
        
        // Фон HUD
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.width, hudHeight);
        
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        
        // Здоровье
        ctx.fillStyle = 'white';
        ctx.fillText('Здоровье:', 20, 30);
        for (let i = 0; i < this.maxHealth; i++) {
            if (i < this.playerHealth) {
                ctx.fillStyle = '#E74C3C';
            } else {
                ctx.fillStyle = '#666';
            }
            ctx.fillRect(100 + i * 25, 15, 20, 20);
        }
        
        ctx.fillStyle = 'white';
        ctx.fillText(`Очки: ${this.score}`, 20, 55);
        ctx.fillText(`Уровень: ${this.currentLevel}/${this.totalLevels}`, 150, 30);
        ctx.fillText(`Монеты: ${this.coinsCollected}/${this.coinsToWin}`, 150, 55);
        
        // Таймер уровня
        const timeLeft = this.levelTimeLimit - this.levelTime;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        ctx.fillStyle = timeLeft < 30 ? '#E74C3C' : 'white';
        ctx.fillText(`Время: ${minutes}:${seconds.toString().padStart(2, '0')}`, 320, 30);
        
        // Прогресс уровня
        if (this.currentLevel === 5) {
            const activeEnemies = this.enemies.filter(e => e.isActive).length;
            const totalEnemies = this.enemies.length;
            ctx.fillText(`Врагов: ${totalEnemies - activeEnemies}/${totalEnemies}`, 320, 55);
        }
        
        // Баффы игрока
        let buffX = this.width - 200;
        let buffY = 15;
        
        if (this.player.speedBoost > 0) {
            ctx.fillStyle = '#3498DB';
            ctx.fillRect(buffX, buffY, 10, 10);
            ctx.fillStyle = 'white';
            ctx.fillText('Скорость', buffX + 15, buffY + 10);
            buffY += 20;
        }
        if (this.player.jumpBoost > 0) {
            ctx.fillStyle = '#9B59B6';
            ctx.fillRect(buffX, buffY, 10, 10);
            ctx.fillStyle = 'white';
            ctx.fillText('Прыжок', buffX + 15, buffY + 10);
            buffY += 20;
        }
        if (this.player.damageBoost > 0) {
            ctx.fillStyle = '#F39C12';
            ctx.fillRect(buffX, buffY, 10, 10);
            ctx.fillStyle = 'white';
            ctx.fillText('Урон', buffX + 15, buffY + 10);
            buffY += 20;
        }
        if (this.player.hasShield) {
            ctx.fillStyle = '#1ABC9C';
            ctx.fillRect(buffX, buffY, 10, 10);
            ctx.fillStyle = 'white';
            ctx.fillText('Щит', buffX + 15, buffY + 10);
        }
        
        // Предупреждение о времени
        if (timeLeft < 30) {
            ctx.fillStyle = 'rgba(231, 76, 60, 0.5)';
            ctx.fillRect(0, 0, this.width, this.height);
            
            if (Math.floor(Date.now() / 500) % 2 === 0) {
                ctx.fillStyle = '#E74C3C';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('ВРЕМЯ ЗАКАНЧИВАЕТСЯ!', this.width / 2, this.height / 2);
                ctx.textAlign = 'left';
            }
        }
    }

    drawPauseScreen(ctx) {
        // Полупрозрачный черный фон
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Текст паузы
        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ПАУЗА', this.width / 2, this.height / 2 - 60);
        
        ctx.font = '20px Arial';
        ctx.fillText(`Уровень: ${this.currentLevel}/${this.totalLevels}`, this.width / 2, this.height / 2 - 20);
        ctx.fillText(`Очки: ${this.score}`, this.width / 2, this.height / 2 + 10);
        ctx.fillText(`Монеты: ${this.coinsCollected}/${this.coinsToWin}`, this.width / 2, this.height / 2 + 40);
        
        const timeLeft = this.levelTimeLimit - this.levelTime;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        ctx.fillText(`Время: ${minutes}:${seconds.toString().padStart(2, '0')}`, this.width / 2, this.height / 2 + 70);
        
        ctx.fillText('Нажми ESC для продолжения', this.width / 2, this.height / 2 + 120);
        
        // Возвращаем настройки по умолчанию
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }

    respawnCoin(coin) {
        const availablePlatforms = this.platforms.filter(p => p.type === 'normal' || p.type === 'moving');
        if (availablePlatforms.length > 0) {
            const randomPlatform = availablePlatforms[Math.floor(Math.random() * availablePlatforms.length)];
            coin.respawn(
                randomPlatform.x + Math.random() * (randomPlatform.width - coin.width),
                randomPlatform.y - coin.height - 5
            );
        }
    }
}