import { checkCollision } from './Collision.js';
import { Projectile } from './Projectile.js';

export class Player {
    constructor(game) {
        this.game = game;
        this.width = 30;
        this.height = 50;
        this.reset();
        
        // Бусты
        this.speedBoost = 0;
        this.jumpBoost = 0;
        this.damageBoost = 0;
        this.hasShield = false;
        
        // Атака
        this.attackCooldown = 0;
        this.canAttack = true;
        
        // Неуязвимость после получения урона
        this.invulnerableTimer = 0;
        
        // Анимация
        this.animationFrame = 0;
        this.walkFrame = 0;
        this.isMoving = false;
        this.facingRight = true;
    }

    reset() {
        this.x = 50;
        this.y = 100;
        this.velocity = {
            x: 0,
            y: 0
        };
        this.baseSpeed = 8;
        this.baseJumpForce = -15;
        this.acceleration = 0.5;
        this.friction = 0.8;
        this.onGround = false;
        this.color = '#E74C3C';
        
        // Сбрасываем бусты
        this.speedBoost = 0;
        this.jumpBoost = 0;
        this.damageBoost = 0;
        this.hasShield = false;
        this.invulnerableTimer = 0;
        this.attackCooldown = 0;
        
        this.velocity.y = 1;
    }

    update(keys, platforms) {
        // Обновляем анимацию
        this.animationFrame++;
        
        // Обновляем бусты и таймеры
        if (this.speedBoost > 0) this.speedBoost--;
        if (this.jumpBoost > 0) this.jumpBoost--;
        if (this.damageBoost > 0) this.damageBoost--;
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.invulnerableTimer > 0) this.invulnerableTimer--;
        
        // Гравитация
        this.velocity.y += this.game.gravity;
        this.velocity.y = Math.min(this.velocity.y, 20);
        
        // Обработка управления
        this.handleMovement(keys);
        
        // Обработка атаки
        if ((keys['KeyF'] || keys['KeyE']) && this.attackCooldown === 0) {
            this.attack();
        }
        
        // Сохраняем старую позицию
        const oldX = this.x;
        const oldY = this.y;
        
        // Обновляем позицию
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        
        // Обрабатываем коллизии
        this.handleCollisions(platforms, oldX, oldY);
        
        // Обновляем анимацию ходьбы
        if (Math.abs(this.velocity.x) > 0.5) {
            this.isMoving = true;
            this.walkFrame = Math.floor(this.animationFrame / 5) % 4;
        } else {
            this.isMoving = false;
        }
        
        // Определяем направление
        if (this.velocity.x > 0) this.facingRight = true;
        if (this.velocity.x < 0) this.facingRight = false;
    }

    handleMovement(keys) {
        // Рассчитываем текущую скорость с учетом буста
        const currentMaxSpeed = this.baseSpeed * (this.speedBoost > 0 ? 1.5 : 1);
        const currentAcceleration = this.acceleration * (this.speedBoost > 0 ? 1.5 : 1);
        
        if (keys['ArrowLeft'] || keys['KeyA']) {
            this.velocity.x = Math.max(this.velocity.x - currentAcceleration, -currentMaxSpeed);
        } else if (keys['ArrowRight'] || keys['KeyD']) {
            this.velocity.x = Math.min(this.velocity.x + currentAcceleration, currentMaxSpeed);
        } else {
            this.velocity.x *= this.friction;
            if (Math.abs(this.velocity.x) < 0.5) this.velocity.x = 0;
        }

        // Прыжок с учетом буста
        const currentJumpForce = this.baseJumpForce * (this.jumpBoost > 0 ? 1.3 : 1);
        if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && this.onGround) {
            this.velocity.y = currentJumpForce;
            this.onGround = false;
        }
        
        // Двойной прыжок
        if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && !this.onGround && this.jumpBoost > 0 && this.velocity.y > -5) {
            this.velocity.y = currentJumpForce * 0.8;
        }
    }

    attack() {
        this.attackCooldown = 20; // 0.33 секунды при 60 FPS
        
        // Урон с учетом буста
        const damage = this.damageBoost > 0 ? 2 : 1;
        
        // Создаем снаряд в зависимости от направления
        const direction = this.facingRight ? 1 : -1;
        const projectile = new Projectile(
            this.x + this.width/2 + (direction * 15),
            this.y + this.height/2 - 5,
            direction * 12,
            0,
            damage,
            true
        );
        
        this.game.projectiles.push(projectile);
        
        // Небольшая отдача
        this.velocity.x -= direction * 2;
    }

    handleCollisions(platforms, oldX, oldY) {
        this.onGround = false;
        let collisionOccurred = false;
        
        // Проверяем коллизии со всеми платформами
        for (const platform of platforms) {
            const collision = checkCollision(this, platform);
            
            if (collision) {
                collisionOccurred = true;
                
                // Специальные эффекты платформ
                if (platform.type === 'deadly') {
                    this.game.playerTakeDamage(1);
                    continue;
                }
                
                if (platform.type === 'bouncy' && collision.direction === 'top') {
                    const bounceForce = platform.bounce();
                    if (bounceForce !== 0) {
                        this.velocity.y = bounceForce;
                        this.onGround = false;
                        continue;
                    }
                }
                
                // Корректируем позицию в зависимости от направления коллизии
                switch (collision.direction) {
                    case 'top': // Стоим на платформе
                        this.y = platform.y - this.height;
                        this.velocity.y = 0;
                        this.onGround = true;
                        break;
                        
                    case 'bottom': // Ударились головой
                        this.y = platform.y + platform.height;
                        this.velocity.y = 0;
                        break;
                        
                    case 'left': // Столкновение справа
                        this.x = platform.x - this.width;
                        this.velocity.x = 0;
                        break;
                        
                    case 'right': // Столкновение слева
                        this.x = platform.x + platform.width;
                        this.velocity.x = 0;
                        break;
                }
            }
        }
        
        // Если после всех проверок мы все еще не на земле, но очень близко к платформе - принудительно ставим на землю
        if (!this.onGround && !collisionOccurred) {
            this.checkGroundProximity(platforms);
        }
    }

    checkGroundProximity(platforms) {
        // Проверяем, близко ли мы к верхней части любой платформы
        for (const platform of platforms) {
            // Расширяем зону проверки на 5 пикселей ниже игрока
            const feetY = this.y + this.height;
            const platformTop = platform.y;
            
            // Если ноги игрока находятся близко к верху платформы и он движется вниз
            if (feetY >= platformTop - 5 && 
                feetY <= platformTop + 10 && 
                this.velocity.y >= 0 &&
                this.x + this.width > platform.x && 
                this.x < platform.x + platform.width) {
                
                // Принудительно ставим на платформу
                this.y = platformTop - this.height;
                this.velocity.y = 0;
                this.onGround = true;
                break;
            }
        }
    }

    draw(ctx) {
        // Сохраняем контекст для трансформаций
        ctx.save();
        
        // Отражение если смотрит влево
        if (!this.facingRight) {
            ctx.translate(this.x + this.width, this.y);
            ctx.scale(-1, 1);
        } else {
            ctx.translate(this.x, this.y);
        }
        
        // Эффект неуязвимости (мигание)
        if (this.invulnerableTimer > 0 && Math.floor(this.animationFrame / 5) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        // Щит (если есть)
        if (this.hasShield) {
            ctx.strokeStyle = '#1ABC9C';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.width/2, this.height/2, Math.max(this.width, this.height)/2 + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Основной спрайт
        ctx.fillStyle = this.color;
        
        // Анимация ходьбы
        let widthOffset = 0;
        let heightOffset = 0;
        
        if (this.isMoving) {
            // Легкая деформация при ходьбе
            widthOffset = Math.sin(this.walkFrame * Math.PI) * 2;
            heightOffset = Math.abs(Math.cos(this.walkFrame * Math.PI)) * 2;
        }
        
        // Анимация прыжка/падения
        if (!this.onGround) {
            heightOffset = Math.sin(this.animationFrame * 0.1) * 2;
        }
        
        // Рисуем тело
        ctx.fillRect(widthOffset/2, heightOffset/2, this.width - widthOffset, this.height - heightOffset);
        
        // Голова
        ctx.fillStyle = '#C0392B';
        ctx.fillRect(5 + widthOffset/2, 5 + heightOffset/2, this.width - 10 - widthOffset, 15);
        
        // Глаза
        ctx.fillStyle = 'white';
        const eyeX = this.facingRight ? 8 : this.width - 13;
        ctx.fillRect(eyeX + widthOffset/2, 10 + heightOffset/2, 5, 5);
        ctx.fillRect(eyeX + (this.facingRight ? 12 : -12) + widthOffset/2, 10 + heightOffset/2, 5, 5);
        
        ctx.fillStyle = 'black';
        ctx.fillRect(eyeX + 1 + widthOffset/2, 11 + heightOffset/2, 3, 3);
        ctx.fillRect(eyeX + (this.facingRight ? 13 : -13) + widthOffset/2, 11 + heightOffset/2, 3, 3);
        
        // Ноги при ходьбе
        if (this.isMoving) {
            ctx.fillStyle = '#C0392B';
            const legOffset = Math.sin(this.walkFrame * Math.PI) * 3;
            ctx.fillRect(5 + widthOffset/2, this.height - 10 + heightOffset/2, 8, 10);
            ctx.fillRect(this.width - 13 + widthOffset/2, this.height - 10 + legOffset + heightOffset/2, 8, 10);
        }
        
        // Анимация бустов
        if (this.speedBoost > 0) {
            ctx.fillStyle = '#3498DB40';
            ctx.fillRect(-5, -5, this.width + 10, this.height + 10);
        }
        if (this.jumpBoost > 0) {
            ctx.fillStyle = '#9B59B640';
            ctx.fillRect(-3, -3, this.width + 6, this.height + 6);
        }
        if (this.damageBoost > 0) {
            ctx.fillStyle = '#F39C1240';
            ctx.fillRect(-2, -2, this.width + 4, this.height + 4);
        }
        
        // Индикатор атаки
        if (this.attackCooldown > 0) {
            ctx.fillStyle = '#F39C12';
            const cooldownWidth = (this.width * this.attackCooldown) / 20;
            ctx.fillRect(0, -8, cooldownWidth, 3);
        }
        
        // Восстанавливаем прозрачность
        ctx.globalAlpha = 1;
        
        // Восстанавливаем контекст
        ctx.restore();
        
        // Отладочная граница
        if (this.game.state === 'playing' && this.game.currentLevel === 1) {
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}