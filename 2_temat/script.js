document.addEventListener("DOMContentLoaded", () => {
    
    // Animacje
    const elements = document.querySelectorAll('.fade-in-stagger');
    elements.forEach((el, index) => {
        el.style.animationDelay = `${index * 150}ms`;
    });

    // --- CZĘŚĆ 1: TABELA FIBONACCIEGO ---
    const tableBody = document.getElementById('fibTableBody');
    let a = 1, b = 1;
    // Pokażmy kilka pierwszych iteracji (np. od 3 do 10, żeby wyniki były ciekawsze)
    let rows = [];
    
    // Wstępne obliczenia (ukryte)
    for(let i=0; i<2; i++) { let temp = a+b; a=b; b=temp; }

    // Generowanie widocznych wierszy
    for (let i = 0; i < 7; i++) {
        let next = a + b;
        let ratio = (next / b).toFixed(5);
        
        let row = `<tr>
            <td>${b}</td>
            <td>${next}</td>
            <td style="color: #10b981; font-weight: bold;">${ratio}</td>
        </tr>`;
        rows.push(row);
        
        // Przesunięcie
        a = b;
        b = next;
    }
    tableBody.innerHTML = rows.join('');


    // --- CZĘŚĆ 2: SYMULACJA SŁONECZNIKA ---
    const canvas = document.getElementById('sunflowerCanvas');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    const slider = document.getElementById('angleSlider');
    const angleValueDisplay = document.getElementById('angleValue');
    
    // Parametry rysowania
    const numSeeds = 400; // Ilość nasion
    const scaleFactor = 10; // Odstępy między nasionami

    function drawSunflower(angleInDegrees) {
        ctx.clearRect(0, 0, width, height); // Czyszczenie
        
        // Konwersja stopni na radiany
        const angleInRadians = angleInDegrees * (Math.PI / 180);

        for (let n = 0; n < numSeeds; n++) {
            // Wzór na "phyllotaxis" (układ liści/nasion)
            // r = c * sqrt(n) - promień rośnie wolniej, żeby zapełnić koło równomiernie
            // theta = n * kąt
            
            const r = scaleFactor * Math.sqrt(n);
            const theta = n * angleInRadians;

            // Konwersja na współrzędne kartezjańskie (do rysowania na ekranie)
            const x = centerX + r * Math.cos(theta);
            const y = centerY + r * Math.sin(theta);

            // Rysowanie nasiona
            ctx.beginPath();
            
            // Kolor zmienia się w zależności od odległości od środka (dla efektu wizualnego)
            const hue = (n % 60) + 120; // Odcienie zieleni (120-180)
            ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
            
            // Wielkość nasiona może lekko rosnąć
            const size = 3 + (n / numSeeds) * 2;
            
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Obsługa suwaka
    slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        angleValueDisplay.innerText = val.toFixed(1);
        drawSunflower(val);
    });

    // Przyciski presetów
    document.getElementById('btnGolden').addEventListener('click', () => {
        slider.value = 137.5;
        angleValueDisplay.innerText = "137.5";
        drawSunflower(137.5);
    });

    document.getElementById('btnRational').addEventListener('click', () => {
        slider.value = 90;
        angleValueDisplay.innerText = "90.0";
        drawSunflower(90);
    });

    // Startowe rysowanie (Złoty Kąt)
    drawSunflower(137.5);
});