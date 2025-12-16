export function checkCollision(object1, object2) {
    const bounds1 = object1.getBounds ? object1.getBounds() : object1;
    const bounds2 = object2.getBounds ? object2.getBounds() : object2;

    // Простая AABB проверка
    if (bounds1.x < bounds2.x + bounds2.width &&
        bounds1.x + bounds1.width > bounds2.x &&
        bounds1.y < bounds2.y + bounds2.height &&
        bounds1.y + bounds1.height > bounds2.y) {
        
        // Рассчитываем глубину проникновения с каждой стороны
        const overlapLeft = (bounds1.x + bounds1.width) - bounds2.x;
        const overlapRight = (bounds2.x + bounds2.width) - bounds1.x;
        const overlapTop = (bounds1.y + bounds1.height) - bounds2.y;
        const overlapBottom = (bounds2.y + bounds2.height) - bounds1.y;
        
        // Находим минимальное перекрытие
        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
        
        // Определяем направление коллизии на основе минимального перекрытия
        if (minOverlap === overlapTop) {
            return { direction: 'top', overlap: overlapTop };
        } else if (minOverlap === overlapBottom) {
            return { direction: 'bottom', overlap: overlapBottom };
        } else if (minOverlap === overlapLeft) {
            return { direction: 'left', overlap: overlapLeft };
        } else if (minOverlap === overlapRight) {
            return { direction: 'right', overlap: overlapRight };
        }
    }

    return null;
}

// Дополнительная функция для проверки столкновений с учетом типа объектов
export function checkPlatformCollision(player, platform) {
    const collision = checkCollision(player, platform);
    
    if (collision) {
        // Для смертельных платформ всегда возвращаем коллизию
        if (platform.type === 'deadly' && collision.direction === 'top') {
            return { ...collision, isDeadly: true };
        }
        
        // Для прыжковых платформ добавляем информацию
        if (platform.type === 'bouncy' && collision.direction === 'top') {
            return { ...collision, isBouncy: true };
        }
        
        return collision;
    }
    
    return null;
}

// Функция для проверки столкновений кругов (для снарядов)
export function checkCircleCollision(circle1, circle2) {
    const dx = (circle1.x + circle1.radius) - (circle2.x + circle2.radius);
    const dy = (circle1.y + circle1.radius) - (circle2.y + circle2.radius);
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance < circle1.radius + circle2.radius;
}

// Функция для проверки столкновения точки с прямоугольником
export function pointInRect(point, rect) {
    return point.x >= rect.x &&
           point.x <= rect.x + rect.width &&
           point.y >= rect.y &&
           point.y <= rect.y + rect.height;
}