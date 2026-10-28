export type ThemeColors = {
  cream: string;
  sprout: string;
  chartreuse: string;
  emerald: string;
  pine: string;
  white: string;
  sand: string;
  muted: string;
  danger: string;
  surface: string;
  border: string;
  scrim: string;
  onScrim: string;
  onScrimMuted: string;
  onChartreuse: string;
};

export const lightColors: ThemeColors = {
  cream: '#FFFDEE',
  sprout: '#E2FBCE',
  chartreuse: '#E3EF26',
  emerald: '#076653',
  pine: '#0C342C',
  white: '#FFFFFF',
  sand: '#F3F0E3',
  muted: '#6B7568',
  danger: '#B54A3B',
  surface: '#FFFFFA',
  border: '#DBE5D5',
  scrim: '#0C342C',
  onScrim: '#FFFDEE',
  onScrimMuted: '#C9E4D3',
  onChartreuse: '#0C342C',
};

export const darkColors: ThemeColors = {
  cream: '#0B1512',
  sprout: '#173A2A',
  chartreuse: '#D7E82A',
  emerald: '#6FD6B0',
  pine: '#E8F1E9',
  white: '#12211C',
  sand: '#1B2B25',
  muted: '#A8B8AB',
  danger: '#FF9A8A',
  surface: '#12211C',
  border: '#2B4038',
  scrim: '#0C342C',
  onScrim: '#FFFDEE',
  onScrimMuted: '#C9E4D3',
  onChartreuse: '#0C342C',
};

export function createSurfaces(colors: ThemeColors) {
  return {
    card: {
      backgroundColor: colors.surface,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      shadowColor: colors.pine,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 12,
      elevation: 1,
    },
    input: {
      backgroundColor: colors.cream,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 50,
      paddingHorizontal: 16,
      color: colors.pine,
    },
  };
}

export type ThemeSurfaces = ReturnType<typeof createSurfaces>;

export const typography = {
  display: 32,
  title: 26,
  heading: 20,
  subheading: 16,
  body: 14,
  caption: 12,
} as const;
