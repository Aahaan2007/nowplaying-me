VANTA.NET({
    el: "#background_animation",
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200.00,
    minWidth: 200.00,
    scale: 1.00,
    scaleMobile: 1.00,
    color: 0x1aecf4,
    backgroundColor: 0x38
  })

document.addEventListener('DOMContentLoaded', function() {
    // Get all sections and nav links
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-link');
    const navbar = document.getElementById('navbar');
    
    // Split main heading text into individual letter spans with small delay
    const mainHeading = document.getElementById('main_heading');
    if (mainHeading) {
        const text = mainHeading.innerText;
        mainHeading.innerHTML = text.split('').map((char, i) => 
            `<span style="transition-delay: ${i * 0.03}s">${char === ' ' ? '&nbsp;' : char}</span>`
        ).join('');
    }
    
    // Handle smooth scrolling for nav links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            window.scrollTo({
                top: targetSection.offsetTop,
                behavior: 'smooth'
            });
            
            // Update active link
            navLinks.forEach(link => link.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Update active link on scroll and toggle navbar background
    window.addEventListener('scroll', function() {
        let current = '';
        
        // Toggle navbar background based on scroll position
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (pageYOffset >= (sectionTop - sectionHeight / 3)) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
});