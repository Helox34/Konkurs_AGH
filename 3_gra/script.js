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
    
    const cipherDisplay = document.getElementById('cipherDisplay');
    const statusMessage = document.getElementById('statusMessage');
    const decoderSlider = document.getElementById('decoderSlider');
    const shiftValue = document.getElementById('shiftValue');
    const submitBtn = document.getElementById('submitBtn');

    // Baza słów
    const wordBank = {
        EASY: ["KOD", "AGH", "BIT", "NET", "WEB", "LAN", "PLIK", "DANE", "JAVA", "HTML"],
        MEDIUM: ["SYSTEM", "HACKER", "ACCESS", "SERVER", "ROUTER", "PYTHON", "CIPHER", "LOGIKA"],
        HARD: ["FIREWALL", "SECURITY", "PROTOCOL", "DATABASE", "ENCRYPTION", "ALGORITHM", "MAINFRAME"]
    };

    // Game State
    let currentDifficulty = 'MEDIUM';
    let currentWord = "";
    let currentShift = 0;
    let userShift = 0;
    
    let wordsSolved = 0;
    const wordsToWin = 5;
    let timeLeft = 100;
    let timerInterval;
    let isPlaying = false;

    // --- 1. FUNKCJE SZYFRUJĄCE ---
    function caesar(text, shift) {
        let result = "";
        for (let i = 0; i < text.length; i++) {
            let code = text.charCodeAt(i);
            if (code >= 65 && code <= 90) {
                let x = code - 65;
                let newX = (x + shift) % 26;
                if (newX < 0) newX += 26;
                result += String.fromCharCode(newX + 65);
            } else {
                result += text[i];
            }
        }
        return result;
    }

    // --- 2. LOGIKA ROZGRYWKI ---

    function nextRound() {
        if (!isPlaying) return;
        
        const words = wordBank[currentDifficulty];
        currentWord = words[Math.floor(Math.random() * words.length)];
        currentShift = Math.floor(Math.random() * 24) + 1;
        
        userShift = 0;
        decoderSlider.value = 0;
        
        updateScreen();
        statusMessage.innerText = "SZUKANIE CZĘSTOTLIWOŚCI...";
        statusMessage.className = "status-message";
    }

    function updateScreen() {
        const encryptedBase = caesar(currentWord, currentShift);
        const visualText = caesar(encryptedBase, userShift);
        cipherDisplay.innerText = visualText;
        shiftValue.innerText = userShift;
    }

    function checkAnswer() {
        const currentVisibleText = cipherDisplay.innerText;
        
        if (currentVisibleText === currentWord) {
            wordsSolved++;
            scoreDisplay.innerText = `${wordsSolved}/${wordsToWin}`;
            statusMessage.innerText = "DOSTĘP PRZYZNANY";
            statusMessage.className = "status-message success";
            
            // Bonusowy czas (trochę więcej niż wcześniej)
            timeLeft += 20; 
            if(timeLeft > 100) timeLeft = 100;
            
            if (wordsSolved >= wordsToWin) {
                gameOver(true);
            } else {
                setTimeout(nextRound, 800);
            }
        } else {
            timeLeft -= 10; // Mniejsza kara za błąd (było 15)
            statusMessage.innerText = "BŁĘDNY KLUCZ! -10% CZASU";
            statusMessage.style.color = "red";
            
            cipherDisplay.style.color = "red";
            setTimeout(() => {
                cipherDisplay.style.color = "var(--accent)";
                statusMessage.style.color = "#64748b";
            }, 500);
        }
    }

    function startGame() {
        wordsSolved = 0;
        scoreDisplay.innerText = "0/" + wordsToWin;
        levelDisplay.innerText = currentDifficulty;
        isPlaying = true;
        
        decoderSlider.disabled = false;
        submitBtn.disabled = false;
        
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
        
        timeLeft = 100;
        clearInterval(timerInterval);
        
        // --- ZMIANA PRĘDKOŚCI CZASU ---
        // Im wyższa liczba (ms), tym wolniej spada pasek.
        let speed = 100; // Medium (domyślnie) - ok. 50 sekund
        
        if(currentDifficulty === 'EASY') speed = 180; // Bardzo wolno - ok. 90 sekund
        if(currentDifficulty === 'HARD') speed = 60;  // Szybko - ok. 30 sekund

        timerInterval = setInterval(() => {
            timeLeft -= 0.2;
            timerBar.style.width = `${timeLeft}%`;
            
            if(timeLeft <= 0) {
                gameOver(false);
            }
        }, speed);

        nextRound();
    }

    function gameOver(win) {
        isPlaying = false;
        clearInterval(timerInterval);
        
        decoderSlider.disabled = true;
        submitBtn.disabled = true;

        msgTitle.innerText = win ? "SYSTEM ZŁAMANY" : "WYKRYTO WŁAMANIE";
        msgTitle.style.color = win ? "#10b981" : "#ef4444";
        msgText.innerText = win ? "Uzyskano pełny dostęp do danych." : "Połączenie przerwane przez serwer.";
        actionBtn.innerText = "RESTART SYSTEMU";
        
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'all';
        diffContainer.style.display = 'flex';
    }

    // --- 3. INPUTY ---
    decoderSlider.addEventListener('input', (e) => {
        userShift = parseInt(e.target.value);
        updateScreen();
    });

    submitBtn.addEventListener('click', checkAnswer);

    diffButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            diffButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentDifficulty = btn.getAttribute('data-level');
        });
    });

    actionBtn.addEventListener('click', startGame);

});