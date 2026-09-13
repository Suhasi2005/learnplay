import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { ll, llRadius, llShadow } from '../tokens';

// One tap target in a bespoke game. It shakes when the flow marks it wrong
// (flow.missOn(id)), glows when it's the answer and the child has missed
// twice, and locks while a round is finishing. Grade 1 games use it for
// every option so that behaviour can't drift between sixteen screens.
export default function Choice({
  flow, id, onPress, isAnswer = false, selected = false, done = false, disabled = false,
  style, children, label, accessibilityLabel,
}) {
  return (
    <Animated.View style={flow.wrongId === id ? { transform: [{ translateX: flow.shakeX }] } : null}>
      <Pressable
        onPress={onPress}
        disabled={disabled || flow.isProcessing}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        style={({ pressed }) => [
          styles.base, style,
          selected && styles.selected,
          done && styles.done,
          disabled && styles.disabled,
          isAnswer && flow.hinting && !done && styles.hint,
          pressed && styles.pressed,
        ]}
      >
        {label != null ? <Text style={styles.label} numberOfLines={2} adjustsFontSizeToFit>{label}</Text> : null}
        {children}
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
  base: {
    minWidth: 64, minHeight: 56, paddingHorizontal: 12, paddingVertical: 8, borderRadius: llRadius.lg,
    backgroundColor: ll.white, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'transparent', ...llShadow.soft,
  },
  label: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, lineHeight: 24, color: ll.ink, textAlign: 'center' },
  selected: { borderColor: ll.purple, backgroundColor: ll.purpleTint },
  done: { borderColor: ll.green, backgroundColor: '#EFFAF3' },
  disabled: { opacity: 0.4 },
  hint: { borderColor: ll.amber },
  pressed: { transform: [{ scale: 0.96 }] },
});
