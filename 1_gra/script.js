document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // UI Elements
    const overlay = document.getElementById('overlay');
    const msgTitle = document.getElementById('msgTitle');
    const msgText = document.getElementById('msgText');
    const actionBtn = document.getElementById('actionBtn');
    const movesContainer = document.getElementById('movesContainer');
    const diffButtons = document.querySelectorAll('.diff-btn');
    const diffContainer = document.querySelector('.difficulty-container');
    
    // Score Elements
    const scoreP_el = document.getElementById('scorePlayer');
    const areaP_el = document.getElementById('areaPlayer');
    const scoreC_el = document.getElementById('scoreCPU');
    const areaC_el = document.getElementById('areaCPU');

    const MAX_MOVES = 5;
    let movesLeft = MAX_MOVES;
    let round = 1;
    let scorePlayer = 0;
    let scoreCPU = 0;
    let gameState = 'START';
    let currentDifficulty = 'MEDIUM'; 

    let bases = [];
    const width = canvas.width;
    const height = canvas.height;

    // --- 1. UI ---
    diffButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            diffButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentDifficulty = btn.getAttribute('data-level');
        });
    });

    function updateMovesUI() {
        movesContainer.innerHTML = '';
        for(let i=0; i<MAX_MOVES; i++) {
            const dot = document.createElement('div');
            dot.style.width = '12px'; height = '12px';
            dot.style.borderRadius = '50%';
            // FIOLET dla dostępnych ruchów
            dot.style.background = i < movesLeft ? '#8b5cf6' : '#334155';
            dot.style.display = 'inline-block';
            dot.style.margin = '0 3px';
            dot.style.height = '12px'; // fix
            movesContainer.appendChild(dot);
        }
    }

    function clearCanvas() {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        for(let i=0; i<width; i+=50) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,height); ctx.stroke(); }
        for(let i=0; i<height; i+=50) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(width,i); ctx.stroke(); }
    }

    function drawBases() {
        bases.forEach(b => {
            ctx.beginPath();
            ctx.arc(b.x, b.y, 7, 0, Math.PI * 2);
            // KOLOR BAZY: FIOLET DLA GRACZA
            ctx.fillStyle = b.owner === 'P' ? '#8b5cf6' : '#ec4899';
            ctx.shadowBlur = 15;
            ctx.shadowColor = ctx.fillStyle;
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'white';
            ctx.stroke();
            ctx.shadowBlur = 0;
        });
    }

    function drawTerritories() {
        if (bases.length === 0) return 0;
        clearCanvas();

        const samples = 4000; 
        let pCount = 0;
        let cCount = 0;

        for(let i=0; i<samples; i++) {
            const rx = Math.random() * width;
            const ry = Math.random() * height;
            
            let minDist = Infinity;
            let owner = null;

            for (let b of bases) {
                const d = (rx - b.x)**2 + (ry - b.y)**2;
                if (d < minDist) {
                    minDist = d;
                    owner = b.owner;
                }
            }

            // KOLORY TERYTORIUM (FIOLET)
            if (owner === 'P') {
                ctx.fillStyle = 'rgba(139, 92, 246, 0.5)'; // Fiolet półprzezroczysty
                pCount++;
            } else {
                ctx.fillStyle = 'rgba(236, 72, 153, 0.5)'; // Róż
                cCount++;
            }
            ctx.fillRect(rx, ry, 4, 4);
        }

        drawBases();

        const total = pCount + cCount;
        const pPerc = total === 0 ? 0 : Math.round((pCount / total) * 100);
        const cPerc = total === 0 ? 0 : 100 - pPerc;
        
        areaP_el.innerText = pPerc + "%";
        areaC_el.innerText = cPerc + "%";
        
        return pPerc;
    }

    // --- 2. LOGIKA ---

    function playerMove(x, y) {
        bases.push({x, y, owner: 'P'});
        movesLeft--;
        updateMovesUI();
        drawTerritories();
        gameState = 'WAITING';
        if (movesLeft >= 0) setTimeout(cpuMove, 600);
    }

    function cpuMove() {
        let attempts = 1; 
        if(currentDifficulty === 'EASY') attempts = 5;
        if(currentDifficulty === 'MEDIUM') attempts = 100;
        if(currentDifficulty === 'HARD') attempts = 800;

        let bestCandidate = null;
        let maxScore = -1;

        for(let i=0; i<attempts; i++) {
            const cx = Math.random() * (width - 40) + 20; 
            const cy = Math.random() * (height - 40) + 20;
            
            let distToNearest = Infinity;
            let nearestOwner = null;
            
            if(bases.length === 0) {
                distToNearest = 100; 
            } else {
                for(let b of bases) {
                    const d = Math.sqrt((cx - b.x)**2 + (cy - b.y)**2);
                    if(d < distToNearest) {
                        distToNearest = d;
                        nearestOwner = b.owner;
                    }
                }
            }

            let score = distToNearest;
            if (currentDifficulty === 'HARD' && nearestOwner === 'P') score *= 1.5;

            if(score > maxScore) {
                maxScore = score;
                bestCandidate = {x: cx, y: cy};
            }
        }

        bases.push({x: bestCandidate.x, y: bestCandidate.y, owner: 'C'});
        
        if(movesLeft === 0) {
            const finalScore = drawTerritories();
            finishRound(finalScore);
        } else {
            drawTerritories();
            gameState = 'PLAYING';
        }
    }

    // --- 3. STAN ---

    function finishRound(playerPercent) {
        gameState = 'RESULT';
        setTimeout(() => {
            if(playerPercent > 50) {
                scorePlayer++;
                scoreP_el.innerText = scorePlayer;
                showOverlay("Runda dla Ciebie!", true);
            } else {
                scoreCPU++;
                scoreC_el.innerText = scoreCPU;
                showOverlay("Runda dla CPU!", false);
            }
        }, 500);
    }

    function showOverlay(title, isWin) {
        msgTitle.innerText = title;
        // Kolor tytułu: FIOLET vs RÓŻ
        msgTitle.style.color = isWin ? '#8b5cf6' : '#ec4899';
        diffContainer.style.display = 'none';

        if(scorePlayer >= 3 || scoreCPU >= 3) {
            endGame();
        } else {
            msgText.innerText = `Stan meczu: ${scorePlayer} - ${scoreCPU}`;
            actionBtn.innerText = "Następna Runda";
            overlay.style.opacity = '1';
            overlay.style.pointerEvents = 'all';
            round++;
        }
    }

    function endGame() {
        gameState = 'END';
        if(scorePlayer > scoreCPU) {
            msgTitle.innerText = "ZWYCIĘSTWO!";
            msgTitle.style.color = '#10b981';
            msgText.innerText = "Jesteś mistrzem strategii.";
        } else {
            msgTitle.innerText = "PORAŻKA";
            msgTitle.style.color = '#ef4444';
            msgText.innerText = "Algorytm okazał się lepszy.";
        }
        actionBtn.innerText = "Menu Główne";
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'all';
    }

    function startNewRound() {
        bases = [];
        movesLeft = MAX_MOVES;
        updateMovesUI();
        clearCanvas();
        areaP_el.innerText = "0%";
        areaC_el.innerText = "0%";
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
        gameState = 'PLAYING';
    }

    function fullReset() {
        scorePlayer = 0;
        scoreCPU = 0;
        round = 1;
        scoreP_el.innerText = '0';
        scoreC_el.innerText = '0';
        diffContainer.style.display = 'flex';
        msgTitle.innerText = "Nowa Gra";
        msgText.innerText = "Wybierz poziom trudności:";
        msgTitle.style.color = 'white';
        actionBtn.innerText = "START";
        startNewRound();
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'all';
        gameState = 'START';
    }

    // --- 4. INPUT ---

    actionBtn.addEventListener('click', () => {
        if(gameState === 'START' || gameState === 'RESULT') startNewRound();
        else if (gameState === 'END') fullReset();
    });

    canvas.addEventListener('mousedown', (e) => {
        if(gameState !== 'PLAYING') return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        for(let b of bases) {
            const dist = Math.sqrt((x - b.x)**2 + (y - b.y)**2);
            if(dist < 20) return;
        }
        playerMove(x, y);
    });

    clearCanvas();
    updateMovesUI();
});