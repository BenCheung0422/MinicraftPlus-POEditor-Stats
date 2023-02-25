// @ts-check

import { Card } from "./Card.js";
import { calculateCircleProgress, getStyles } from "./getStyles.js";
import { flexLayout, getCardColors, measureText } from "./utils.js";

const CARD_MIN_WIDTH = 480;
const CARD_DEFAULT_WIDTH = 550;

export class Project {
    /** @readonly @type {number} Integer */
    id;
    /** @readonly @type {string} */
    name;
    /** @readonly @type {string} */
    description;
    /** @readonly @type {number} Integer */
    public;
    /** @readonly @type {number} Integer */
    open;
    /** @readonly @type {string} */
    reference_language;
    /** @readonly @type {string} */
    fallback_language;
    /** @readonly @type {number} Integer */
    terms;
    /** @readonly @type {Date} */
    created;
    /** @param {object} obj The project object from response, this must be validated as valid. */
    constructor(obj) {
        this.id = obj.id;
        this.name = obj.name;
        this.description = obj.description;
        this.public = obj.public;
        this.open = obj.open;
        this.reference_language = obj.reference_language;
        this.fallback_language = obj.fallback_language;
        this.terms = obj.terms;
        this.created = new Date(obj.created);
    }
}

export class Language {
    /** @readonly @type {string} */
    name;
    /** @readonly @type {string} */
    code;
    /** @readonly @type {number} Integer */
    translations;
    /** @readonly @type {number} Decimal */
    percentage;
    /** @readonly @type {Date} */
    updated;
    /** @param {object} obj The language object from response, this must be validated as valid. */
    constructor(obj) {
        this.name = obj.name;
        this.code = obj.code;
        this.translations = obj.translations;
        this.percentage = obj.percentage;
        this.updated = new Date(obj.updated);
    }
}

const LINE_HEIGHT = 25;

/**
 * Create a stats card text item.
 * @param {object} createTextNodeParams Object that contains the createTextNode parameters.
 * @param {string} createTextNodeParams.label The label to display.
 * @param {string} createTextNodeParams.value The value to display.
 * @param {number} createTextNodeParams.index The index of the stat.
 * @param {number} createTextNodeParams.shiftValuePos Number of pixels the value has to be shifted to the right.
 * @returns
 */
const createTextNode = ({label, value, index, shiftValuePos}) => {
    const staggerDelay = (index + 3) * 150;
    return `
        <g class="stagger" style="animation-delay: ${staggerDelay}ms" transform="translate(25, 0)">
            <text class="stat bold" y="12.5">${label}:</text>
            <text
                class="stat bold"
                x="${120 + shiftValuePos}"
                y="12.5"
            >${value}</text>
        </g>
    `;
}

/**
 * Rendering the stats card.
 * @param {Project} project The project data.
 * @param {Language[]} languages The language data.
 * @returns {string} The stats card SVG object.
 */
export const renderStatsCard = (project, languages) => {
    // returns theme based colors with proper overrides and defaults
    const { titleColor, textColor, bgColor, borderColor, ringColor } =
        getCardColors({
            title_color: "",
            text_color: "",
            bg_color: "",
            border_color: "",
            ring_color: "",
            theme: "default",
        });

    const STATS = {
        reference_language: {
            label: "Reference Language",
            value: languages.find(lang => lang.code === project.reference_language)?.name ?? "N/A"
        },
        terms: {
            label: "Terms",
            value: project.terms.toLocaleString("en-US")
        },
        languages: {
            label: "Languages",
            value: languages.length.toLocaleString("en-US")
        }
    };

    const statItems = Object.keys(STATS)
        .map((key, index) =>
            // create the text nodes, and pass index so that we can calculate the line spacing
            createTextNode({
                ...STATS[key],
                index,
                shiftValuePos: 79.01
            }),
        );

    // Calculate the card height depending on how many items there are
    // but if rank circle is visible clamp the minimum height to `150`
    let height = Math.max(45 + (statItems.length + 1) * LINE_HEIGHT + 60, 150);

    const progress = Math.round((languages.reduce((a, b) => a + b.translations, 0) / languages.length / project.terms * 100 + Number.EPSILON) * 100) / 100;
    const cssStyles = getStyles({
        titleColor,
        ringColor,
        textColor,
        progress
    });

    let width = CARD_DEFAULT_WIDTH;
    if (width < CARD_MIN_WIDTH) {
        width = CARD_MIN_WIDTH;
    }

    const card = new Card({
        title: project.name,
        width,
        height,
        colors: {
          titleColor,
          textColor,
          bgColor,
          borderColor,
        },
    });

    card.setHideBorder(false);
    card.setHideTitle(false);
    card.setCSS(cssStyles);

    /**
     * Calculates the right rank circle translation values such that the rank circle
     * keeps respecting the following padding:
     *
     * width > RANK_CARD_DEFAULT_WIDTH: The default right padding of 70 px will be used.
     * width < RANK_CARD_DEFAULT_WIDTH: The left and right padding will be enlarged
     *   equally from a certain minimum at RANK_CARD_MIN_WIDTH.
     *
     * @returns {number} - Rank circle translation value.
     */
    const calculateRankXTranslation = () => {
        const minXTranslation = CARD_MIN_WIDTH - 70;
        if (width > CARD_DEFAULT_WIDTH) {
            const xMaxExpansion = minXTranslation + (450 - CARD_MIN_WIDTH) / 2;
            return xMaxExpansion + width - CARD_DEFAULT_WIDTH;
        } else {
            return minXTranslation + (width - CARD_MIN_WIDTH) / 2;
        }
    };

    // Conditionally rendered elements
    const rankCircle =
        `<g data-testid="rank-circle"
            transform="translate(${calculateRankXTranslation()}, ${
            ((statItems.length-1) * LINE_HEIGHT + 16.8) / 2
        })">
            <circle class="rank-circle-rim" r="40" />
            <circle class="rank-circle" r="40" />
            <g class="rank-text">
            <text
                x="5"
                y="-3"
                dominant-baseline="middle"
                text-anchor="middle"
            >
                ${progress}%
            </text>
            </g>
        </g>`;

    // Accessibility Labels
    const labels = Object.keys(STATS)
        .map((key) => `${STATS[key].label}: ${STATS[key].value}`)
        .join(", ");

    card.setAccessibilityLabel({
        title: `${card.title}`,
        desc: labels,
    });

    card.setCSS(card.css + "\n" + languages.map(lang => `
        @keyframes langAnimation_${lang.code} {
            from {
                stroke-dashoffset: ${calculateCircleProgress(0, 20)};
            }
            to {
                stroke-dashoffset: ${calculateCircleProgress(lang.percentage, 20)};
            }
        }
    `).join("\n"));

    const langCircles =
        `<g data-testid="lang-circles"
            transform="translate(45, 115)">
            ${languages.map((lang, index) => `
                <g transform="translate(${index * (width-70) / languages.length})">
                    <circle class="lang-circle-rim" r="20" />
                    <circle class="lang-circle" r="20" style="animation: langAnimation_${lang.code} 1s forwards ease-in-out" />
                    <g class="lang-text">
                        <text
                            x="5"
                            y="-3"
                            dominant-baseline="middle"
                            text-anchor="middle"
                        >
                            <tspan x="5" dy="-5">${lang.name}</tspan>
                            <tspan x="5" dy="1em">${lang.percentage}%</tspan>
                        </text>
                    </g>
                </g>
            `).join("\n")}
        </g>`;

    return card.render(`
        ${rankCircle}
        <svg x="0" y="0">
            ${flexLayout({
                items: statItems,
                gap: LINE_HEIGHT,
                direction: "column",
            }).join("")}
        </svg>
        ${langCircles}
    `);
}

export default renderStatsCard;