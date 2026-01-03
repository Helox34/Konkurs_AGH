document.addEventListener("DOMContentLoaded", () => {
    
    // Animacje wejścia
    const elements = document.querySelectorAll('.fade-in-stagger');
    elements.forEach((el, index) => {
        el.style.animationDelay = `${index * 150}ms`;
    });

    // --- LOGIKA SYMULACJI GEOMETRYCZNEJ ---
    const canvas = document.getElementById('geometryCanvas');
    const ctx = canvas.getContext('2d');
    
    // Ustawienie początkowe punktów
    // Współrzędne na canvasie (piksele)
    let pA = { x: 200, y: 300 };
    let pB = { x: 500, y: 100 };

    // Funkcja do rysowania
    function draw() {
        // Czyszczenie
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Rysowanie siatki (opcjonalne, dla efektu)
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        /*
        for(let i=0; i<canvas.width; i+=40) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
        for(let i=0; i<canvas.height; i+=40) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(canvas.width, i); ctx.stroke(); }
        */

        // 2. Rysowanie odcinka AB
        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pB.x, pB.y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]); // Linia przerywana
        ctx.stroke();
        ctx.setLineDash([]); // Reset

        // 3. Obliczenia matematyczne
        // Środek odcinka (Midpoint)
        const midX = (pA.x + pB.x) / 2;
        const midY = (pA.y + pB.y) / 2;

        // Współczynnik kierunkowy odcinka AB (m = dy / dx)
        const dx = pB.x - pA.x;
        const dy = pB.y - pA.y;
        
        // Rysowanie symetralnej
        // Symetralna jest prostopadła, więc jej nachylenie to -1/m (lub obrót wektora o 90 stopni)
        // Wektor [dx, dy] -> prostopadły [-dy, dx]
        
        ctx.beginPath();
        // Rysujemy długą linię przechodzącą przez Midpoint w kierunku prostopadłym
        // Mnożymy wektor przez dużą liczbę, żeby wyjść poza ekran
        const scale = 1000;
        ctx.moveTo(midX - (-dy * scale), midY - (dx * scale));
        ctx.lineTo(midX + (-dy * scale), midY + (dx * scale));
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'white';
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 4. Rysowanie Punktów
        drawPoint(pA, '#3b82f6', 'A'); // Niebieski
        drawPoint(pB, '#ec4899', 'B'); // Różowy
        drawPoint({x: midX, y: midY}, '#94a3b8', 'S', true); // Środek (mały)

        // 5. Aktualizacja tekstów
        updateInfo(dx, dy, midX, midY);
    }

    function drawPoint(p, color, label, isSmall = false) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, isSmall ? 4 : 8, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        
        // Podpis
        ctx.fillStyle = 'white';
        ctx.font = '14px Montserrat';
        ctx.fillText(label, p.x + 15, p.y - 10);
    }

    function updateInfo(dx, dy, midX, midY) {
        // Symulujemy układ współrzędnych kartezjańskich (środek ekranu to 0,0, Y w górę)
        // To tylko do wyświetlania, żeby liczby wyglądały "szkolnie"
        const mathAx = Math.round(pA.x / 10);
        const mathAy = Math.round((canvas.height - pA.y) / 10);
        const mathBx = Math.round(pB.x / 10);
        const mathBy = Math.round((canvas.height - pB.y) / 10);

        document.getElementById('coordA').innerText = `(${mathAx}, ${mathAy})`;
        document.getElementById('coordB').innerText = `(${mathBx}, ${mathBy})`;

        // Obliczanie równania prostej symetralnej y = ax + b
        // Nachylenie odcinka m = dy/dx. Nachylenie symetralnej a = -dx/dy (bo canvas Y jest odwrócony)
        // Ale uwaga: układ canvasa ma Y rosnący w dół. W matematyce szkolnej Y rośnie w górę.
        // Żeby nie mieszać uczniom, wyświetlimy uproszczoną wersję lub po prostu "zależność geometryczną".
        
        // Obliczenie prawdziwego a (slope) dla szkolnego układu:
        let slopeText = "";
        let bText = "";
        
        // Unikamy dzielenia przez zero
        if (dy !== 0) {
            // Slope symetralnej w szkolnym układzie
            const a = -dx / dy; 
            slopeText = a.toFixed(2) + "x";
            
            // y = ax + b => b = y - ax (używamy punktu środkowego)
            // Konwersja midY na szkolny:
            const mathMidY = (canvas.height - midY) / 10;
            const mathMidX = midX / 10;
            
            const b = mathMidY - (a * mathMidX);
            bText = (b >= 0 ? "+ " : "- ") + Math.abs(b).toFixed(2);
            
            document.getElementById('lineEq').innerText = `y = ${slopeText} ${bText}`;
        } else {
            document.getElementById('lineEq').innerText = "x = " + (midX/10).toFixed(0);
        }
    }

    // Interakcja - Kliknij, żeby przesunąć A
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        // Przesuwamy punkt A tam, gdzie kliknięto
        pA.x = e.clientX - rect.left;
        pA.y = e.clientY - rect.top;
        draw();
    });

    // Obsługa przesuwania (drag)
    canvas.addEventListener('mousemove', (e) => {
        if(e.buttons === 1) { // Jeśli przycisk myszy wciśnięty
            const rect = canvas.getBoundingClientRect();
            pA.x = e.clientX - rect.left;
            pA.y = e.clientY - rect.top;
            draw();
        }
    });

    // Pierwsze rysowanie
    draw();
});