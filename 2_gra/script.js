document.addEventListener("DOMContentLoaded", () => {
    
    // UI Elements
    const overlay = document.getElementById('overlay');
    const msgTitle = document.getElementById('msgTitle');
    const msgText = document.getElementById('msgText');
    const actionBtn = document.getElementById('actionBtn');
    const diffButtons = document.querySelectorAll('.diff-btn');
    const diffContainer = document.querySelector('.difficulty-container');

    const scoreDisplay = document.getElementById('scoreDisplay');
    const levelDisplay = document.getElementById('levelDisplay');
    const timerBar = document.getElementById('timerBar');
    
    const seqText = document.getElementById('seqText');
    const optionButtons = document.querySelectorAll('.option-btn');

    // Game State
    let score = 0;
    let currentDifficulty = 'MEDIUM';
    let isPlaying = false;
    let timerInterval;
    let timeLeft; // %
    let currentCorrectAnswer = 0;
    let lives = 3;

    // --- GENERATOR CIĄGÓW ---
    function generateProblem(difficulty) {
        let sequence = [];
        let nextVal = 0;
        const length = 4; 
        let start = Math.floor(Math.random() * 10) + 1;

        if (difficulty === 'EASY') {
            const step = Math.floor(Math.random() * 9) + 1; 
            const sign = Math.random() > 0.3 ? 1 : -1; 
            for(let i=0; i<length; i++) sequence.push(start + (i * step * sign));
            nextVal = start + (length * step * sign);
        } else if (difficulty === 'MEDIUM') {
            const type = Math.random();
            if(type > 0.5) {
                const mult = Math.floor(Math.random() * 3) + 2; 
                start = Math.floor(Math.random() * 5) + 1; 
                for(let i=0; i<length; i++) sequence.push(start * Math.pow(mult, i));
                nextVal = start * Math.pow(mult, length);
            } else {
                const step = Math.floor(Math.random() * 15) + 10;
                for(let i=0; i<length; i++) sequence.push(start + (i * step));
                nextVal = start + (length * step);
            }
        } else if (difficulty === 'HARD') {
            const type = Math.random();
            if (type < 0.33) {
                let a = Math.floor(Math.random() * 5) + 1;
                let b = Math.floor(Math.random() * 5) + 5;
                sequence = [a, b];
                for(let i=2; i<length; i++) sequence.push(sequence[i-1] + sequence[i-2]);
                nextVal = sequence[length-1] + sequence[length-2];
            } else if (type < 0.66) {
                for(let i=1; i<=length; i++) sequence.push((start+i)**2);
                nextVal = (start+length+1)**2;
            } else {
                const add = Math.floor(Math.random() * 5) + 5;
                const sub = Math.floor(Math.random() * 3) + 1;
                let val = start;
                sequence.push(val);
                for(let i=1; i<length; i++) {
                    if(i%2 !== 0) val += add; else val -= sub;
                    sequence.push(val);
                }
                if(length%2 !== 0) nextVal = val + add; else nextVal = val - sub;
            }
        }
        return { sequence, nextVal };
    }

    function startGame() {
        score = 0;
        lives = 3;
        scoreDisplay.innerText = score;
        levelDisplay.innerText = currentDifficulty;
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
        isPlaying = true;
        nextRound();
    }

    function nextRound() {
        if (!isPlaying) return;
        optionButtons.forEach(btn => {
            btn.className = 'option-btn';
            btn.disabled = false;
        });

        const problem = generateProblem(currentDifficulty);
        currentCorrectAnswer = problem.nextVal;
        
        seqText.innerText = problem.sequence.join(', ') + ', ?';

        let options = [currentCorrectAnswer];
        while(options.length < 4) {
            const offset = Math.floor(Math.random() * 10) - 5; 
            const wrong = currentCorrectAnswer + offset;
            if(wrong !== currentCorrectAnswer && !options.includes(wrong)) {
                options.push(wrong);
            }
        }
        options.sort(() => Math.random() - 0.5);

        optionButtons.forEach((btn, index) => {
            btn.innerText = options[index];
            btn.onclick = () => checkAnswer(btn, options[index]);
        });
        resetTimer();
    }

    function resetTimer() {
        clearInterval(timerInterval);
        timeLeft = 100;
        timerBar.style.width = '100%';
        // KOLOR PASKA - ZIELEŃ
        timerBar.style.backgroundColor = '#10b981'; 

        let speed = 25; 
        if(currentDifficulty === 'EASY') speed = 40; 
        if(currentDifficulty === 'HARD') speed = 15; 

        timerInterval = setInterval(() => {
            timeLeft -= 0.5;
            timerBar.style.width = `${timeLeft}%`;
            
            if(timeLeft < 30) timerBar.style.backgroundColor = '#ef4444'; 

            if(timeLeft <= 0) {
                clearInterval(timerInterval);
                gameOver("Czas minął!");
            }
        }, speed);
    }

    function checkAnswer(btn, value) {
        clearInterval(timerInterval);
        
        if(value === currentCorrectAnswer) {
            btn.classList.add('correct');
            score += 10;
            if(currentDifficulty === 'HARD') score += 10;
            scoreDisplay.innerText = score;
            setTimeout(nextRound, 800);
        } else {
            btn.classList.add('wrong');
            optionButtons.forEach(b => {
                if(parseInt(b.innerText) === currentCorrectAnswer) b.classList.add('correct');
            });
            lives--;
            if(lives <= 0) setTimeout(() => gameOver("Koniec szans!"), 1000);
            else setTimeout(nextRound, 1000);
        }
    }

    function gameOver(reason) {
        isPlaying = false;
        msgTitle.innerText = "KONIEC GRY";
        // WYNIK NA ZIELONO
        msgText.innerHTML = `${reason}<br>Twój wynik: <strong style="color:#10b981">${score}</strong>`;
        actionBtn.innerText = "ZAGRAJ PONOWNIE";
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'all';
        diffContainer.style.display = 'flex'; 
    }

    diffButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            diffButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentDifficulty = btn.getAttribute('data-level');
        });
    });

    actionBtn.addEventListener('click', startGame);
});