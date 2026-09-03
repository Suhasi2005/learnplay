export const colors = {
  sky: '#6EC6FF',
  skyDeep: '#3FA9F5',
  sun: '#FFC93C',
  sunDeep: '#FFB100',
  coral: '#FF6F59',
  coralDeep: '#F04E37',
  grass: '#4CD787',
  grassDeep: '#2FB86A',
  grape: '#A78BFA',
  grapeDeep: '#8B6EF0',
  cream: '#FFF8EC',
  ink: '#3A2E2E',
  muted: '#8C7B7B',
  white: '#FFFFFF',
  border: '#E4DED6',
  disabled: '#E4DED6',
};

// A rotating palette so choice cards feel varied and playful, not uniform.
export const cardPalette = [
  { bg: colors.sun, deep: colors.sunDeep },
  { bg: colors.coral, deep: colors.coralDeep },
  { bg: colors.grass, deep: colors.grassDeep },
  { bg: colors.sky, deep: colors.skyDeep },
  { bg: colors.grape, deep: colors.grapeDeep },
];

export const spacing = { xs: 6, sm: 12, md: 20, lg: 28, xl: 40 };
export const radius = { sm: 12, md: 20, lg: 28, pill: 999 };

export const fonts = {
  display: 'Fredoka_600SemiBold',
  displayBold: 'Fredoka_700Bold',
  body: 'Baloo2_500Medium',
  bodyBold: 'Baloo2_700Bold',
};
