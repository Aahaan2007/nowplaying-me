/**
 * Utility functions for text scrolling in the nowplaying widget
 */

/**
 * Check if an element needs scrolling and applies the appropriate class
 * @param {HTMLElement} element - The text element to check
 * @param {HTMLElement} container - The container element (parent or other reference)
 * @param {number} threshold - Extra space in pixels before triggering scroll (default 5px)
 * @returns {boolean} - Whether scrolling was applied
 */
function checkAndApplyTextScrolling(element, container, threshold = 5) {
    if (!element || !container) return false;
    
    // Reset any existing animation class
    element.classList.remove('scrolling');
    
    // Force a layout calculation to get accurate dimensions
    document.body.offsetHeight;
    
    // Get the actual dimensions
    const textWidth = element.scrollWidth;
    const containerWidth = container.clientWidth - threshold;
    
    console.log(`Text scroll check: "${element.textContent}"`);
    console.log(`- Text width: ${textWidth}px, Container width: ${containerWidth}px`);
      // Only apply scrolling if text is significantly wider than container
    // We're using a higher threshold (25px) to account for padding and avoid unnecessary scrolling
    if (textWidth > containerWidth + 25) {
        console.log('- Applying scrolling animation');
        element.classList.add('scrolling');
        return true;
    } else {
        console.log('- No scrolling needed');
        return false;
    }
}

// Export the utility function
window.textScrollUtils = {
    checkAndApply: checkAndApplyTextScrolling
};
