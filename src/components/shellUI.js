import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, shellRadius, shellShadow, shellType, shell } from '../theme';

// The shell's component vocabulary.
//
// Grouped in one file because these only ever appear together, on the browsing
// screens, and share a single visual register: wide soft shadows, generous
// radii, tinted fills, no outlines. The game components deliberately live
// elsewhere and look nothing like these.

// ---------------------------------------------------------------------------
// Screen background

export function ShellScreen({ children, style }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

// ---------------------------------------------------------------------------
// Greeting row: avatar, name, a small progress badge, and a corner action.

export function GreetingRow({ name, progressLabel, right }) {
  return (
    <View style={styles.greetRow}>
      <View style={styles.avatar}>
        <Text style={styles.avatarGlyph}>🙂</Text>
      </View>
      <View style={styles.greetBody}>
        <Text style={styles.greetName} numberOfLines={1}>Hello, {name}</Text>
        {progressLabel ? (
          <View style={styles.greetBadge}>
            <Text style={styles.greetBadgeText}>{progressLabel}</Text>
          </View>
        ) : null}
      </View>
      {right}
    </View>
  );
}

// ---------------------------------------------------------------------------
// The violet hero card carrying overall progress.

export function LevelCard({ title, subtitle, progress = 0, trailing, onPress }) {
  const fill = useRef(new Animated.Value(0)).current;
  const clamped = Math.max(0, Math.min(1, progress));

  // The bar animates from empty on mount. A progress bar that simply appears
  // at 40% reads as a static graphic; one that fills reads as something earned.
  useEffect(() => {
    const anim = Animated.timing(fill, {
      toValue: clamped, duration: 900, delay: 180, useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [clamped]);

  const width = fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined}>
      <LinearGradient
        colors={[shell.primary, shell.primaryDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.levelCard}
      >
        <View style={styles.levelBody}>
          <Text style={styles.levelTitle}>{title}</Text>
          {subtitle ? <Text style={styles.levelSub} numberOfLines={2}>{subtitle}</Text> : null}
          <View style={styles.track}>
            <Animated.View style={[styles.trackFill, { width }]} />
          </View>
        </View>
        {trailing ? <View style={styles.levelTrailing}>{trailing}</View> : null}
      </LinearGradient>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// The row of circular category shortcuts.

export function CategoryCircle({ icon, label, tint = shell.primarySoft, onPress, locked }) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.category}
      accessibilityRole="button"
      accessibilityLabel={locked ? `${label}, coming soon` : label}
      accessibilityState={{ disabled: !!locked }}
    >
      <View style={[styles.categoryDisc, { backgroundColor: locked ? shell.line : tint }]}>
        <Text style={[styles.categoryIcon, locked && styles.categoryIconLocked]}>
          {locked ? '🔒' : icon}
        </Text>
      </View>
      <Text style={[styles.categoryLabel, locked && styles.categoryLabelLocked]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// A content card: heading with a corner arrow, copy on the left, art on the right.

export function ContentCard({ icon, title, body, tint = shell.tintLavender, art, onPress, footer }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={title}
      style={({ pressed }) => [styles.contentCard, { backgroundColor: tint }, pressed && styles.pressed]}
    >
      <View style={styles.contentHead}>
        {icon ? <Text style={styles.contentIcon}>{icon}</Text> : null}
        <Text style={styles.contentTitle} numberOfLines={1}>{title}</Text>
        {onPress ? (
          <View style={styles.cornerArrow}>
            <Text style={styles.cornerArrowGlyph}>↗</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.contentRow}>
        <View style={styles.contentBody}>
          {body ? <Text style={styles.contentText}>{body}</Text> : null}
          {footer}
        </View>
        {art ? <View style={styles.contentArt}>{art}</View> : null}
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Filter chips.

export function FilterChips({ options, value, onChange }) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[styles.chip, active && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// A peach pill — the shell's call to action. Ink text, never white.

export function PeachButton({ label, icon, onPress, disabled, style, small }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.peach,
        small && styles.peachSmall,
        disabled && styles.peachDisabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {icon ? <Text style={styles.peachIcon}>{icon}</Text> : null}
      <Text style={[styles.peachText, small && styles.peachTextSmall, disabled && styles.peachTextDisabled]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// A headline with one word boxed, as in the reference.

export function HighlightTitle({ before, highlight, after }) {
  return (
    <Text style={styles.headline}>
      {before ? `${before} ` : ''}
      <Text style={styles.headlineMark}>{` ${highlight} `}</Text>
      {after ? ` ${after}` : ''}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// A small circular counter, e.g. 3/5.

export function CountBadge({ done, total }) {
  return (
    <View style={styles.countBadge}>
      <Text style={styles.countText}>{done}/{total}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: shell.bg },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.95 },

  greetRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: shell.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarGlyph: { fontSize: 20 },
  greetBody: { flex: 1 },
  greetName: { ...shellType.cardTitle, color: shell.ink },
  greetBadge: {
    alignSelf: 'flex-start', backgroundColor: shell.primarySoft,
    borderRadius: shellRadius.pill, paddingHorizontal: 8, paddingVertical: 2, marginTop: 2,
  },
  greetBadgeText: { ...shellType.small, color: shell.primaryDeep, fontFamily: fonts.bodyBold },

  levelCard: {
    borderRadius: shellRadius.lg, padding: 16, flexDirection: 'row',
    alignItems: 'center', gap: 12, ...shellShadow.card,
  },
  levelBody: { flex: 1 },
  levelTitle: { fontFamily: fonts.displayBold, fontSize: 19, color: shell.white },
  levelSub: { ...shellType.small, color: 'rgba(255,255,255,0.85)', marginTop: 1 },
  levelTrailing: { width: 54, alignItems: 'center' },
  track: {
    height: 9, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.28)',
    marginTop: 10, overflow: 'hidden',
  },
  trackFill: { height: '100%', borderRadius: 5, backgroundColor: shell.accent },

  category: { alignItems: 'center', width: 62, gap: 4 },
  categoryDisc: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  categoryIcon: { fontSize: 23 },
  categoryIconLocked: { fontSize: 17 },
  categoryLabel: { ...shellType.small, color: shell.ink, fontFamily: fonts.bodyBold },
  categoryLabelLocked: { color: shell.lock },

  contentCard: { borderRadius: shellRadius.lg, padding: 14, ...shellShadow.card },
  contentHead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  contentIcon: { fontSize: 17 },
  contentTitle: { ...shellType.cardTitle, color: shell.ink, flex: 1 },
  cornerArrow: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: shell.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  cornerArrowGlyph: { color: shell.white, fontSize: 14, includeFontPadding: false },
  contentRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 8 },
  contentBody: { flex: 1, gap: 8 },
  contentText: { ...shellType.body, color: shell.inkMuted },
  contentArt: { width: 96, height: 78, alignItems: 'center', justifyContent: 'flex-end' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 7, paddingHorizontal: 14, borderRadius: shellRadius.pill,
    backgroundColor: shell.surface,
  },
  chipActive: { backgroundColor: shell.ink },
  chipText: { ...shellType.label, color: shell.inkMuted },
  chipTextActive: { color: shell.white },

  peach: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: shell.accent, borderRadius: shellRadius.pill,
    paddingVertical: 14, paddingHorizontal: 24,
  },
  peachSmall: { paddingVertical: 8, paddingHorizontal: 16 },
  peachDisabled: { backgroundColor: shell.line },
  peachIcon: { fontSize: 15 },
  // Ink, not white — see the note on `accent` in theme.js.
  peachText: { fontFamily: fonts.displayBold, fontSize: 16, color: shell.onAccent, includeFontPadding: false },
  peachTextSmall: { fontSize: 13 },
  peachTextDisabled: { color: shell.lock },

  headline: { fontFamily: fonts.displayBold, fontSize: 27, lineHeight: 38, color: shell.ink },
  headlineMark: {
    color: shell.white, backgroundColor: shell.primary,
    fontFamily: fonts.displayBold, fontSize: 27, lineHeight: 38,
  },

  countBadge: {
    minWidth: 38, height: 38, borderRadius: 19, backgroundColor: shell.surface,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  countText: { fontFamily: fonts.displayBold, fontSize: 12.5, color: shell.ink },
});
