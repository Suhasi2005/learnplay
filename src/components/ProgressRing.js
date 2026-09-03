import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts } from '../theme';

// A ring rather than a bar: it fits inside a round level badge, and "how much
// of the circle is filled" is legible to a child who can't yet read the
// fraction printed in the middle.
export default function ProgressRing({
  progress = 0,
  size = 56,
  strokeWidth = 6,
  color = colors.grass,
  trackColor = colors.border,
  children,
  style,
}) {
  const clamped = Math.max(0, Math.min(1, progress));
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * clamped;

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={trackColor} strokeWidth={strokeWidth} fill="none"
        />
        {clamped > 0 && (
          <Circle
            cx={size / 2} cy={size / 2} r={r}
            stroke={color} strokeWidth={strokeWidth} fill="none"
            strokeDasharray={`${dash} ${circumference - dash}`}
            // Start the sweep at 12 o'clock instead of 3 o'clock.
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeLinecap="round"
          />
        )}
      </Svg>
      <View style={styles.center} pointerEvents="none">{children}</View>
    </View>
  );
}

export function RingLabel({ children, size = 15 }) {
  return <Text style={[styles.label, { fontSize: size }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.displayBold, color: colors.ink, includeFontPadding: false },
});
