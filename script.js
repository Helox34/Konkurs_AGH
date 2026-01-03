document.addEventListener("DOMContentLoaded", () => {
    
    const staggeredElements = document.querySelectorAll('.fade-in-stagger');
    
    staggeredElements.forEach((el, index) => {
        el.style.animationDelay = `${index * 100}ms`;
    });

    const bg = document.querySelector('.bg-animation');
    document.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        
        bg.style.transform = `translate(-${x * 20}px, -${y * 20}px)`;
    });

});