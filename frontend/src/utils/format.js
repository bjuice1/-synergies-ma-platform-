/**
 * Data Formatting Utilities
 * Format data for display
 */

const FormatUtils = {
  /**
   * Format currency
   */
  currency(value, currency = 'USD') {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  },

  /**
   * Format percentage
   */
  percentage(value, decimals = 1) {
    if (value === null || value === undefined) return '-';
    return `${(value * 100).toFixed(decimals)}%`;
  },

  /**
   * Format date
   */
  date(dateString, format = 'short') {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    
    const options = format === 'short' 
      ? { year: 'numeric', month: 'short', day: 'numeric' }
      : { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    
    return new Intl.DateTimeFormat('en-US', options).format(date);
  },

  /**
   * Format large numbers
   */
  number(value, decimals = 0) {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  },

  /**
   * Truncate text
   */
  truncate(text, maxLength = 50) {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
  },

  /**
   * Format synergy value with color coding
   */
  synergyValue(value) {
    if (value === null || value === undefined) return { text: '-', class: '' };
    const formatted = this.currency(value);
    const cssClass = value >= 0 ? 'positive' : 'negative';
    return { text: formatted, class: cssClass };
  }
};

module.exports = FormatUtils;