import { StyleSheet, Text, View } from 'react-native';
import BouncyButton from './BouncyButton';
import { OUTLINE_WIDTH, colors, fonts, radius, spacing } from '../theme';

// The bold banner every navigation screen wears.
//
// Replaces the old floating back-arrow and loose heading. A solid coloured
// band gives the screen a top edge to hang from, keeps the title and the star
// count in one fixed place across screens, and — because it is outlined like
// everything else — reads as part of the same sticker world rather than as
// chrome bolted on above it.
export default function ScreenHeader({
  title,
  subtitle,
  onBack,
  stars,
  color = colors.grape,
  right,
}) {
  return (
    <View style={[styles.bar, { backgroundColor: color }]}>
      <View style={styles.row}>
        {onBack ? (
          <BouncyButton
            onPress={onBack}
            accessibilityLabel="Go back"
            style={styles.backButton}
            depth={4}
          >
            <Text style={styles.backArrow}>←</Text>
          </BouncyButton>
        ) : (
          <View style={styles.backSpacer} />
        )}

        <View style={styles.titles}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>

        {right ?? (
          typeof stars === 'number' ? (
            <View style={styles.starPill}>
              <Text style={styles.starIcon}>⭐</Text>
              <Text style={styles.starCount}>{stars}</Text>
            </View>
          ) : <View style={styles.backSpacer} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: OUTLINE_WIDTH,
    borderBottomColor: colors.outline,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  backButton: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: colors.sun,
    alignItems: 'center', justifyContent: 'center',
  },
  backSpacer: { width: 46 },
  backArrow: {
    fontFamily: fonts.displayBold, fontSize: 22, color: colors.ink,
    includeFontPadding: false, marginTop: -2,
  },
  titles: { flex: 1, alignItems: 'center' },
  // White on every header colour: grape measures 5.2:1, and the accent
  // headers use their `deep` shade, which clears the same bar.
  title: { fontFamily: fonts.displayBold, fontSize: 21, color: colors.white },
  subtitle: { fontFamily: fonts.body, fontSize: 12.5, color: colors.white, opacity: 0.9 },
  starPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.sun,
    paddingVertical: 6, paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: OUTLINE_WIDTH, borderColor: colors.outline,
    minWidth: 46, justifyContent: 'center',
  },
  starIcon: { fontSize: 13 },
  starCount: { fontFamily: fonts.displayBold, fontSize: 15, color: colors.ink },
});
