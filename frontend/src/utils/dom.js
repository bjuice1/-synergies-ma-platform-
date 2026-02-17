/**
 * DOM Manipulation Utilities
 * Helper functions for working with the DOM
 */

const DOMUtils = {
  /**
   * Safely get element by ID
   */
  getById(id) {
    const element = document.getElementById(id);
    if (!element) {
      console.warn(`Element with id "${id}" not found`);
    }
    return element;
  },

  /**
   * Create element with attributes and children
   */
  createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'dataset') {
        Object.entries(value).forEach(([dataKey, dataValue]) => {
          element.dataset[dataKey] = dataValue;
        });
      } else if (key.startsWith('on') && typeof value === 'function') {
        const event = key.slice(2).toLowerCase();
        element.addEventListener(event, value);
      } else {
        element.setAttribute(key, value);
      }
    });

    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        element.appendChild(child);
      }
    });

    return element;
  },

  /**
   * Clear all children from element
   */
  clearChildren(element) {
    if (!element) return;
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  },

  /**
   * Toggle class on element
   */
  toggleClass(element, className, force) {
    if (!element) return;
    element.classList.toggle(className, force);
  },

  /**
   * Add event listener with cleanup
   */
  addEventListener(element, event, handler) {
    if (!element) return () => {};
    element.addEventListener(event, handler);
    return () => element.removeEventListener(event, handler);
  },

  /**
   * Show/hide element
   */
  setVisible(element, visible) {
    if (!element) return;
    element.style.display = visible ? '' : 'none';
  }
};

module.exports = DOMUtils;