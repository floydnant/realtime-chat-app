/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{html,ts,scss}'],
    theme: {
        extend: {
            colors: {
                primary: {
                    100: '#E1FFF8',
                    200: '#BBFFEE',
                    300: '#86FFE1',
                    400: '#00E5AC',
                    500: '#00A47B',
                    600: '#005B45',
                    700: '#003528',
                    800: '#00221A',
                    900: '#00130E',
                },
                secondary: {
                    100: '#D7AEFF',
                    200: '#B871FF',
                    300: '#9224FF',
                    400: '#8D1CFF',
                    500: '#5B00B7',
                    600: '#420083',
                    700: '#340068',
                    800: '#230046',
                    900: '#15002B',
                },
                red: {
                    100: '#FEB9D6',
                    200: '#FF84B8',
                    300: '#FD4A95',
                    400: '#F20166',
                    500: '#B9004E',
                    600: '#8C003B',
                    700: '#64002A',
                    800: '#40001B',
                    900: '#24000F',
                },
                gray: {
                    100: '#EFF0F0',
                    200: '#D4D8D7',
                    300: '#B9BFBE',
                    400: '#8F9A97',
                    500: '#6D7876',
                    600: '#505856',
                    700: '#383E3C',
                    800: '#222525',
                    900: '#131515',
                },
            },
            borderColor: {
                subtle: 'rgba(52, 66, 62, 0.42)',
            },
            backgroundImage: {
                'fade-to-top': 'linear-gradient(#131515 61.98%, rgba(19, 21, 21, 0) 100%)',
                'fade-to-bottom': 'linear-gradient(to bottom, #131515 61.98%, rgba(19, 21, 21, 0) 100%)',
                'fade-to-left': 'linear-gradient(to left, #131515 61.98%, rgba(19, 21, 21, 0) 100%)',
                'fade-to-right': 'linear-gradient(to right, #131515 61.98%, rgba(19, 21, 21, 0) 100%)',

                'fancy-400': 'linear-gradient(90deg, #7E00FD 0%, #00E5AC 97.92%)',
                'fancy-500': 'linear-gradient(90deg, #5B00B7 0%, #00A47B 97.92%)',

                'grad-secondary': 'linear-gradient(92.13deg, #9747FF 20.72%, #7E00FD 100%)',
            },
            boxShadow: {
                'glow-secondary': '0px 0px 10px 1px #9224FF',
                card: '0px 4px 4px rgba(0, 0, 0, 0.25), 0px 4px 10px rgba(0, 0, 0, 0.25), 0px 4px 20px rgba(0, 0, 0, 0.25)',
            },
            backdropBlur: {
                frosted: '40px',
            },
        },
    },
    plugins: [],
};
