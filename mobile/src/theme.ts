export const colors = {
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
} as const;

// Shared surfaces keep capture, catalogue, account and sync screens consistent.
export const surfaces = {
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
} as const;

export const typography = {
  display: 32,
  title: 26,
  heading: 20,
  subheading: 16,
  body: 14,
  caption: 12,
} as const;
