VANTA.NET({
    el: "#background_animation",
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200.00,
    minWidth: 200.00,
    scale: 1.00,
    scaleMobile: 1.00,
    color: 0x24ff00,
    backgroundColor: 0x38,
    points: 11.00
})

document.addEventListener('DOMContentLoaded', function() {
    // Get all sections and nav links
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-link');
    const navbar = document.getElementById('navbar');
    
    // Mobile menu toggle functionality
    const hamburger = document.querySelector('.hamburger-menu');
    const navLinksContainer = document.querySelector('.nav-links');
    
    // Toggle mobile menu when hamburger is clicked
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinksContainer.classList.toggle('active');
    });
    
    // Close mobile menu when a link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinksContainer.classList.remove('active');
        });
    });
    
    // Mark that JS has loaded properly, enabling animations
    document.body.classList.add('js-loaded');
    
    // Split main heading text into individual letter spans with small delay
    const mainHeading = document.getElementById('main_heading');
    if (mainHeading) {
        const text = mainHeading.innerText;
        mainHeading.innerHTML = text.split('').map((char, i) => 
            `<span style="transition-delay: ${i * 0.03}s">${char === ' ' ? '&nbsp;' : char}</span>${char === ',' && window.innerWidth < 768 ? '<br>' : ''}`
        ).join('');
    }

    // Apply the same effect to all section headings
    const sectionHeadings = document.querySelectorAll('.section-heading');
    sectionHeadings.forEach(heading => {
        const text = heading.innerText;
        heading.innerHTML = text.split('').map((char, i) => 
            `<span style="transition-delay: ${i * 0.03}s">${char === ' ' ? '&nbsp;' : char}</span>`
        ).join('');
    });
    
    // Function to check if an element is in viewport
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.8 &&
            rect.bottom >= 0
        );
    }
    
    // Set up Intersection Observer for about section text animation
    const aboutObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // When about section enters the viewport
            if (entry.isIntersecting) {
                // Find all paragraphs in the about text
                const paragraphs = entry.target.querySelectorAll('.about-text p');
                // Add the reveal class with a slight delay between each
                paragraphs.forEach((p, index) => {
                    setTimeout(() => {
                        p.classList.add('reveal');
                    }, index * 200);
                });
                // Unobserve after animation has been triggered
                aboutObserver.unobserve(entry.target);
            }
        });
    }, { 
        threshold: 0.2, // Trigger when 20% of the element is visible
        rootMargin: '0px 0px -10% 0px' // Trigger slightly before the element enters the viewport
    });
    
    // Set up Intersection Observer for feature cards animation
    const featureCardsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // When feature card container enters the viewport
            if (entry.isIntersecting) {
                // Find all feature cards
                const featureCards = entry.target.querySelectorAll('.feature-card');
                // Add the animate class to each card (delay handled by CSS)
                featureCards.forEach(card => {
                    card.classList.add('animate');
                });
                // Unobserve after animation has been triggered
                featureCardsObserver.unobserve(entry.target);
            }
        });
    }, { 
        threshold: 0.15, // Trigger when 15% of the element is visible
        rootMargin: '0px 0px -10% 0px' // Trigger slightly before the element enters the viewport
    });
    
    // Handle animations for elements that are already in viewport on page load
    window.addEventListener('load', function() {
        // Check about content
        const aboutContent = document.querySelector('.about-content');
        if (aboutContent && isInViewport(aboutContent)) {
            const paragraphs = aboutContent.querySelectorAll('.about-text p');
            paragraphs.forEach((p, index) => {
                setTimeout(() => {
                    p.classList.add('reveal');
                }, index * 200);
            });
        } else if (aboutContent) {
            aboutObserver.observe(aboutContent);
        }
        
        // Check features grid
        const featuresGrid = document.querySelector('.features-grid');
        if (featuresGrid && isInViewport(featuresGrid)) {
            const featureCards = featuresGrid.querySelectorAll('.feature-card');
            featureCards.forEach(card => {
                card.classList.add('animate');
            });
        } else if (featuresGrid) {
            featureCardsObserver.observe(featuresGrid);
        }
    });
    
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