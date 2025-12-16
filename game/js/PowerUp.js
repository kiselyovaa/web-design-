export class PowerUp {
    constructor(x, y, type = 'health') {
        this.x = x;
        this.y = y;
        this.width = 25;
        this.height = 25;
        this.type = type;
        this.collected = false;
        this.animationFrame = 0;
        this.floatOffset = 0;
        this.colors = this.getColors();
    }

    getColors() {
        switch (this.type) {
            case 'health':
                return { main: '#E74C3C', glow: '#FF6B6B' };
            case 'speed':
                return { main: '#3498DB', glow: '#5DADE2' };
            case 'jump':
                return { main: '#9B59B6', glow: '#BB8FCE' };
            case 'damage':
                return { main: '#F39C12', glow: '#F7DC6F' };
            case 'shield':
                return { main: '#1ABC9C', glow: '#76D7C4' };
            default:
                return { main: '#2ECC71', glow: '#82E0AA' };
        }
    }

    update() {
        if (this.collected) return;
        
        this.animationFrame++;
        this.floatOffset = Math.sin(this.animationFrame * 0.05) * 5;
    }

    collect() {
        this.collected = true;
        return this.type;
    }

    draw(ctx) {
        if (this.collected) return;

        const centerX = this.x + this.width/2;
        const centerY = this.y + this.height/2 + this.floatOffset;

        // Свечение
        ctx.fillStyle = this.colors.glow + '40';
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.width, 0, Math.PI * 2);
        ctx.fill();

        // Основная форма
        ctx.fillStyle = this.colors.main;
        ctx.beginPath();
        
        switch (this.type) {
            case 'health':
                // Сердце
                ctx.moveTo(centerX, centerY + this.height/4);
                ctx.bezierCurveTo(
                    centerX, centerY - this.height/2,
                    centerX - this.width/2, centerY - this.height/2,
                    centerX - this.width/2, centerY
                );
                ctx.bezierCurveTo(
                    centerX - this.width/2, centerY + this.height/2,
                    centerX, centerY + this.height,
                    centerX, centerY + this.height
                );
                ctx.bezierCurveTo(
                    centerX, centerY + this.height,
                    centerX + this.width/2, centerY + this.height/2,
                    centerX + this.width/2, centerY
                );
                ctx.bezierCurveTo(
                    centerX + this.width/2, centerY - this.height/2,
                    centerX, centerY - this.height/2,
                    centerX, centerY + this.height/4
                );
                break;
            case 'speed':
                // Молния
                ctx.moveTo(centerX - this.width/3, centerY + this.height/3);
                ctx.lineTo(centerX, centerY - this.height/3);
                ctx.lineTo(centerX + this.width/6, centerY);
                ctx.lineTo(centerX + this.width/3, centerY - this.height/2);
                ctx.lineTo(centerX, centerY + this.height/3);
                ctx.lineTo(centerX - this.width/6, centerY);
                ctx.closePath();
                break;
            default:
                // Круг по умолчанию
                ctx.arc(centerX, centerY, this.width/2, 0, Math.PI * 2);
        }
        
        ctx.fill();

        // Блик
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(centerX - this.width/4, centerY - this.height/4, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y + this.floatOffset,
            width: this.width,
            height: this.height
        };
    }
}