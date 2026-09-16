import { LinearGradient } from 'expo-linear-gradient';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Sheen, TopHighlight } from '../premium';
import { ll, llRadius, llSurface, withAlpha } from '../tokens';

// One tap target in a bespoke game. It shakes when the flow marks it wrong
// (flow.missOn(id)), glows when it's the answer and the child has missed
// twice, and locks while a round is finishing. Grade 1 games use it for
// every option so that behaviour can't drift between sixteen screens.
//
// The premium pass gives it the same physicality as the hand-built pieces in
// the Junior KG games: a two-layer shadow (tight contact + soft cast), a
// gradient face rather than flat white, a white top highlight and a solid
// bottom edge. It's the single most-reused control in the app, so the
// difference shows up on sixteen screens at once.
//
// Props, states and behaviour are unchanged. A `style` prop carrying a
// `backgroundColor` (several screens colour their own options) still wins —
// the gradient is only used when no colour was passed.
export default function Choice({
  flow, id, onPress, isAnswer = false, selected = false, done = false, disabled = false,
  style, children, label, accessibilityLabel,
}) {
  // A caller-supplied backgroundColor takes precedence over the default
  // gradient face, so screens that colour their own pieces keep working.
  const flat = StyleSheet.flatten(style) || {};
  const custom = flat.backgroundColor;

  const face = done
    ? ['#F2FBF6', '#E2F5EA']
    : selected
      ? [ll.purpleTint, '#E9E1FB']
      : llSurface.white;

  const shadowColor = done ? ll.greenDeep : selected ? ll.purpleDeep : '#6054BE';

  return (
    <Animated.View style={flow.wrongId === id ? { transform: [{ translateX: flow.shakeX }] } : null}>
      <Pressable
        onPress={onPress}
        disabled={disabled || flow.isProcessing}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        style={({ pressed }) => [
          styles.cast,
          { shadowColor },
          done && styles.castDone,
          isAnswer && flow.hinting && !done && styles.castHint,
          disabled && styles.castDisabled,
          pressed && styles.pressed,
        ]}
      >
        <View style={[styles.contact, disabled && { shadowOpacity: 0 }]}>
          <LinearGradient
            colors={custom ? [custom, custom] : face}
            style={[
              styles.base,
              style,
              selected && styles.selected,
              done && styles.done,
              disabled && styles.disabled,
              isAnswer && flow.hinting && !done && styles.hint,
            ]}
          >
            {!custom ? <Sheen variant="tile" radius={llRadius.lg} /> : null}
            <TopHighlight radius={llRadius.lg} />
            {label != null ? <Text style={styles.label} numberOfLines={2} adjustsFontSizeToFit>{label}</Text> : null}
            {children}
          </LinearGradient>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export const choiceText = StyleSheet.create({
  big: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 30, lineHeight: 36, color: ll.ink, textAlign: 'center' },
  emoji: { fontSize: 40, textAlign: 'center' },
  small: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: ll.body, textAlign: 'center' },
});

const styles = StyleSheet.create({
  // The soft far shadow.
  cast: {
    borderRadius: llRadius.lg,
    shadowOpacity: 0.17, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 5,
  },
  castDone: { shadowOpacity: 0.34, shadowRadius: 22 },
  castHint: { shadowColor: ll.amber, shadowOpacity: 0.55, shadowRadius: 20 },
  castDisabled: { shadowOpacity: 0.06 },
  // The tight dark line directly underneath.
  contact: {
    borderRadius: llRadius.lg,
    shadowColor: '#2E2A63', shadowOpacity: 0.11, shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  base: {
    minWidth: 64, minHeight: 56, paddingHorizontal: 12, paddingVertical: 8, borderRadius: llRadius.lg,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    borderWidth: 3, borderColor: 'transparent',
    // A solid bottom edge reads as thickness, the same cue the primary
    // buttons use.
    borderBottomWidth: 4, borderBottomColor: withAlpha('#6054BE', 0.16),
  },
  label: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, lineHeight: 24, color: ll.ink, textAlign: 'center' },
  selected: { borderColor: ll.purple, borderBottomColor: ll.purpleDeep },
  done: { borderColor: ll.green, borderBottomColor: ll.greenDeep },
  disabled: { opacity: 0.4 },
  hint: { borderColor: ll.amber, borderBottomColor: '#D9A21C' },
  pressed: { transform: [{ translateY: 2 }, { scale: 0.98 }] },
});
