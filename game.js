document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const startScreen = document.getElementById('startScreen');
    const gameOverScreen = document.getElementById('gameOver');
    const finalScoreElement = document.getElementById('finalScore');
    const startBtn = document.getElementById('startBtn');
    const restartBtn = document.getElementById('restartBtn');

    // Set canvas size based on container
    function resizeCanvas() {
        const container = document.querySelector('.game-container');
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Game assets
    const birdImg = new Image();
    birdImg.src = 'https://iili.io/38bT40Q.png';
    
    const pipeImg = new Image();
    pipeImg.src = 'https://iili.io/38bT6gV.png';
    
    // Game variables
    let bird = {
        x: 50,
        y: canvas.height / 2,
        width: 40,
        height: 30,
        velocity: 0,
        gravity: 0.5,
        jump: -10
    };

    let pipes = [];
    let score = 0;
    let gameRunning = false;
    let animationId;
    let pipeGap = 150;
    let pipeFrequency = 1500; // milliseconds
    let lastPipeTime = 0;
    let assetsLoaded = 0;

    // Check when assets are loaded
    function assetLoaded() {
        assetsLoaded++;
        if (assetsLoaded === 2) { // Both images loaded
            startBtn.disabled = false;
        }
    }

    birdImg.onload = assetLoaded;
    pipeImg.onload = assetLoaded;

    // Event listeners
    function handleJump() {
        if (gameRunning) {
            bird.velocity = bird.jump;
        }
    }

    canvas.addEventListener('click', handleJump);
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleJump();
    });

    document.addEventListener('keydown', (e) => {
        if ((e.code === 'Space' || e.key === 'ArrowUp') && gameRunning) {
            bird.velocity = bird.jump;
            e.preventDefault();
        }
    });

    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);

    function startGame() {
        // Reset game state
        bird.y = canvas.height / 2;
        bird.velocity = 0;
        pipes = [];
        score = 0;
        gameRunning = true;
        
        // Hide screens
        startScreen.style.display = 'none';
        gameOverScreen.style.display = 'none';
        
        // Start game loop
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        lastPipeTime = performance.now();
        gameLoop();
    }

    function gameLoop(timestamp = 0) {
        if (!gameRunning) return;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update game elements
        updateBird();
        updatePipes(timestamp);
        
        // Draw game elements
        drawBackground();
        drawPipes();
        drawBird();
        drawScore();
        
        // Check collisions
        if (checkCollisions()) {
            gameOver();
            return;
        }
        
        // Continue game loop
        animationId = requestAnimationFrame(gameLoop);
    }

    function updateBird() {
        bird.velocity += bird.gravity;
        bird.y += bird.velocity;
        
        // Prevent bird from going above canvas
        if (bird.y < 0) {
            bird.y = 0;
            bird.velocity = 0;
        }
    }

    function updatePipes(timestamp) {
        // Add new pipes
        if (timestamp - lastPipeTime > pipeFrequency) {
            const pipeHeight = Math.floor(Math.random() * (canvas.height - pipeGap - 100)) + 50;
            
            pipes.push({
                x: canvas.width,
                y: 0,
                width: 80,
                height: pipeHeight,
                passed: false
            });
            
            pipes.push({
                x: canvas.width,
                y: pipeHeight + pipeGap,
                width: 80,
                height: canvas.height - pipeHeight - pipeGap,
                passed: false
            });
            
            lastPipeTime = timestamp;
        }
        
        // Move pipes and check if passed
        for (let i = 0; i < pipes.length; i++) {
            pipes[i].x -= 2;
            
            // Check if bird passed the pipe
            if (!pipes[i].passed && pipes[i].x + pipes[i].width < bird.x) {
                pipes[i].passed = true;
                if (i % 2 === 0) { // Only count once per pair
                    score++;
                }
            }
        }
        
        // Remove pipes that are off screen
        if (pipes.length > 0 && pipes[0].x + pipes[0].width < 0) {
            pipes.shift();
            pipes.shift();
        }
    }

    function drawBackground() {
        // Background is set via CSS
    }

    function drawBird() {
        ctx.save();
        // Rotate bird based on velocity
        const rotation = Math.min(Math.max(bird.velocity * 3, -30), 30);
        ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.drawImage(birdImg, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
        ctx.restore();
    }

    function drawPipes() {
        for (let i = 0; i < pipes.length; i++) {
            const pipe = pipes[i];
            
            // Draw pipe image (repeat vertically for top pipes)
            if (i % 2 === 0) { // Top pipe
                const pipeSegments = Math.ceil(pipe.height / pipeImg.height);
                for (let j = 0; j < pipeSegments; j++) {
                    const segmentHeight = Math.min(pipeImg.height, pipe.height - (j * pipeImg.height));
                    ctx.drawImage(
                        pipeImg,
                        0, pipeImg.height - segmentHeight,
                        pipeImg.width, segmentHeight,
                        pipe.x, pipe.y + (j * pipeImg.height),
                        pipe.width, segmentHeight
                    );
                }
            } else { // Bottom pipe
                ctx.drawImage(
                    pipeImg,
                    0, 0,
                    pipeImg.width, pipeImg.height,
                    pipe.x, pipe.y,
                    pipe.width, pipe.height
                );
            }
        }
    }

    function drawScore() {
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.strokeText(score.toString(), canvas.width / 2, 50);
        ctx.fillText(score.toString(), canvas.width / 2, 50);
    }

    function checkCollisions() {
        // Check if bird hits the ground
        if (bird.y + bird.height > canvas.height) {
            return true;
        }
        
        // Check if bird hits any pipes
        for (let i = 0; i < pipes.length; i++) {
            const pipe = pipes[i];
            
            if (bird.x + bird.width > pipe.x && 
                bird.x < pipe.x + pipe.width && 
                bird.y + bird.height > pipe.y && 
                bird.y < pipe.y + pipe.height) {
                return true;
            }
        }
        
        return false;
    }

    function gameOver() {
        gameRunning = false;
        finalScoreElement.textContent = score;
        gameOverScreen.style.display = 'flex';
        cancelAnimationFrame(animationId);
    }

    // Disable start button until assets load
    startBtn.disabled = true;
});