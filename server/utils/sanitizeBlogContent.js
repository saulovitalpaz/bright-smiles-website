const sanitizeHtml = require('sanitize-html');

const sanitizeBlogContent = (content) => {
    if (typeof content !== 'string') return '';

    return sanitizeHtml(content, {
        allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'h1', 'h2', 'blockquote', 'div', 'span', 'font'],
        allowedAttributes: {
            div: ['style'],
            p: ['style'],
            span: ['style'],
            font: ['size']
        },
        allowedStyles: {
            '*': {
                'text-align': [/^(left|center|right|justify)$/]
            }
        }
    });
};

module.exports = sanitizeBlogContent;
