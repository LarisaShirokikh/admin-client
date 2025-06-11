// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {},
    },
    plugins: [],
}

// postcss.config.js
module.exports = {
    plugins: {
        tailwindcss: {},
        autoprefixer: {},
    },
}