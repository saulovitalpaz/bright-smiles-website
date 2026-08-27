const sanitizeHtml = require('sanitize-html');

const safeFontFamily = /^[a-z0-9 ,"'_-]+$/i;
const safeFontSize = /^(?:0|\d+(?:\.\d+)?)(?:px|pt|pc|in|cm|mm|em|rem|ex|ch|vw|vh|vmin|vmax|%)$/i;
const safeColor = /^(?:#[0-9a-f]{3,8}|rgba?\(\s*[\d.,%\s]+\)|hsla?\(\s*[\d.,%\s]+\)|[a-z]+)$/i;
const safeLineHeight = /^(?:normal|1|(?:0|\d+(?:\.\d+)?)(?:px|pt|em|rem|%)?)$/i;

const sanitizeBlogContent = (content) => {
    if (typeof content !== 'string') return '';

    return sanitizeHtml(content, {
        allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'del', 'mark', 'sub', 'sup', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'blockquote', 'div', 'span', 'font', 'a'],
        allowedAttributes: {
            '*': ['style'],
            a: ['href', 'target', 'rel', 'title'],
            div: ['style'],
            p: ['style'],
            span: ['style'],
            font: ['size', 'face', 'color']
        },
        allowedStyles: {
            '*': {
                'font-family': [safeFontFamily],
                'font-size': [safeFontSize],
                color: [safeColor],
                'background-color': [safeColor],
                'line-height': [safeLineHeight],
                'text-align': [/^(left|center|right|justify)$/]
            }
        },
        allowedSchemes: ['http', 'https', 'mailto'],
        allowedSchemesByTag: { a: ['http', 'https', 'mailto'] },
        allowProtocolRelative: false,
        allowComments: false,
        transformTags: {
            font: (tagName, attribs) => {
                const { color, ...safeAttributes } = attribs;
                return {
                    tagName,
                    attribs: {
                        ...safeAttributes,
                        ...(color && safeColor.test(color) ? { color } : {}),
                    }
                };
            },
            a: (tagName, attribs) => ({
                tagName,
                attribs: {
                    ...attribs,
                    rel: 'noopener noreferrer'
                }
            })
        }
    });
};

module.exports = sanitizeBlogContent;
