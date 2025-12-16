export class Platform {
    constructor(x, y, width, height, type = 'normal') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.color = this.getColorByType();
        this.isPlatform = true;
        
        // Для движущихся платформ
        this.moveDirection = 1;
        this.moveSpeed = type === 'moving' ? 1.5 : 0;
        this.originalX = x;
        this.moveDistance = 100;
        
        // Для прыжковых платформ
        this.bounceTimer = 0;
        this.bounceForce = -18;
        
        // Анимация
        this.animationFrame = 0;
    }

    getColorByType() {
        switch (this.type) {
            case 'normal':
                return '#2ECC71';
            case 'moving':
                return '#3498DB';
            case 'deadly':
                return '#E74C3C';
            case 'bouncy':
                return '#9B59B6';
            case 'finish':
                return '#F39C12';
            case 'ice':
                return '#5DADE2';
            default:
                return '#2ECC71';
        }
    }

    update() {
        this.animationFrame++;
        
        // Движущиеся платформы
        if (this.type === 'moving') {
            this.x += this.moveSpeed * this.moveDirection;
            
            // Разворот при достижении границы
            if (this.x > this.originalX + this.moveDistance || this.x < this.originalX - this.moveDistance) {
                this.moveDirection *= -1;
            }
        }
        
        // Таймер отскока для прыжковых платформ
        if (this.bounceTimer > 0) {
            this.bounceTimer--;
        }
        
        // Анимация смертельных платформ
        if (this.type === 'deadly') {
            this.spikeHeight = 10 + Math.sin(this.animationFrame * 0.1) * 3;
        }
    }

    draw(ctx) {
        // Основной цвет
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        
        switch(this.type) {
            case 'normal':
                gradient.addColorStop(0, '#27AE60');
                gradient.addColorStop(1, '#2ECC71');
                break;
            case 'moving':
                gradient.addColorStop(0, '#2980B9');
                gradient.addColorStop(1, '#3498DB');
                break;
            case 'deadly':
                gradient.addColorStop(0, '#C0392B');
                gradient.addColorStop(1, '#E74C3C');
                break;
            case 'bouncy':
                gradient.addColorStop(0, '#8E44AD');
                gradient.addColorStop(1, '#9B59B6');
                break;
            case 'ice':
                gradient.addColorStop(0, '#85C1E9');
                gradient.addColorStop(1, '#5DADE2');
                break;
            default:
                gradient.addColorStop(0, '#27AE60');
                gradient.addColorStop(1, '#2ECC71');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Текстура
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < this.width; i += 10) {
            for (let j = 0; j < this.height; j += 10) {
                if ((i + j) % 20 === 0) {
                    ctx.fillRect(this.x + i, this.y + j, 5, 5);
                }
            }
        }
        
        // Бордюр
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(this.x, this.y, this.width, 3);
        ctx.fillRect(this.x, this.y + this.height - 3, this.width, 3);
        ctx.fillRect(this.x, this.y, 3, this.height);
        ctx.fillRect(this.x + this.width - 3, this.y, 3, this.height);
        
        // Специальные эффекты
        switch(this.type) {
            case 'moving':
                // Стрелки направления
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                const arrowCount = Math.floor(this.width / 20);
                for (let i = 0; i < arrowCount; i++) {
                    const arrowX = this.x + 10 + i * 20;
                    const arrowY = this.y + this.height / 2;
                    
                    ctx.beginPath();
                    if (this.moveDirection > 0) {
                        ctx.moveTo(arrowX - 5, arrowY - 3);
                        ctx.lineTo(arrowX + 5, arrowY);
                        ctx.lineTo(arrowX - 5, arrowY + 3);
                    } else {
                        ctx.moveTo(arrowX + 5, arrowY - 3);
                        ctx.lineTo(arrowX - 5, arrowY);
                        ctx.lineTo(arrowX + 5, arrowY + 3);
                    }
                    ctx.closePath();
                    ctx.fill();
                }
                break;
                
            case 'deadly':
                // Шипы
                ctx.fillStyle = '#922B21';
                const spikeCount = Math.floor(this.width / 15);
                for (let i = 0; i < spikeCount; i++) {
                    const spikeX = this.x + i * 15 + 7.5;
                    const spikeHeight = 10 + Math.sin(this.animationFrame * 0.1 + i) * 3;
                    
                    ctx.beginPath();
                    ctx.moveTo(spikeX, this.y + this.height);
                    ctx.lineTo(spikeX - 5, this.y + this.height - spikeHeight);
                    ctx.lineTo(spikeX + 5, this.y + this.height - spikeHeight);
                    ctx.closePath();
                    ctx.fill();
                }
                break;
                
            case 'bouncy':
                // Пружинящий эффект
                if (this.bounceTimer > 0) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.fillRect(this.x, this.y, this.width, this.height);
                }
                
                // Пружины
                ctx.fillStyle = '#76448A';
                const springCount = Math.floor(this.width / 25);
                for (let i = 0; i < springCount; i++) {
                    const springX = this.x + 12.5 + i * 25;
                    
                    // Верх пружины
                    ctx.fillRect(springX - 2, this.y - 5, 4, 5);
                    
                    // Спираль пружины
                    ctx.beginPath();
                    for (let j = 0; j < 3; j++) {
                        ctx.arc(springX, this.y - j * 3, 2, 0, Math.PI * 2);
                    }
                    ctx.fill();
                    
                    // Основание пружины
                    ctx.fillRect(springX - 2, this.y + 1, 4, 4);
                }
                break;
                
            case 'ice':
                // Ледяные блики
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.beginPath();
                ctx.arc(this.x + this.width * 0.7, this.y + this.height * 0.3, 10, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(this.x + this.width * 0.3, this.y + this.height * 0.7, 8, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
    }

    // Для прыжковых платформ
    bounce() {
        if (this.type === 'bouncy') {
            this.bounceTimer = 15;
            return this.bounceForce;
        }
        return 0;
    }

    // Для ледяных платформ
    getFriction() {
        return this.type === 'ice' ? 0.95 : 0.8;
    }

    getBounds() {
        // Для смертельных платформ учитываем шипы
        let height = this.height;
        if (this.type === 'deadly') {
            height += 10; // Высота шипов
        }
        
        return {
            x: this.x,
            y: this.type === 'deadly' ? this.y - 10 : this.y,
            width: this.width,
            height: height,
            isPlatform: true
        };
    }
}