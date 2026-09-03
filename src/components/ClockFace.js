import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

// A hand is a zero-size "pivot" positioned at the clock's exact center,
// containing a hand that extends *upward* from that point — rotating the
// pivot then rotates the hand correctly around the center, pointing at 12
// when the rotation is 0deg. Standard RN technique for gauges/clock hands.
export default function ClockFace({ hour, size = 170 }) {
  const hourAngle = (hour % 12) * 30; // 360deg / 12 hours

  return (
    <View style={[styles.face, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.number, styles.num12]}>12</Text>
      <Text style={[styles.number, styles.num3]}>3</Text>
      <Text style={[styles.number, styles.num6]}>6</Text>
      <Text style={[styles.number, styles.num9]}>9</Text>

      <View style={[styles.pivot, { transform: [{ rotate: '0deg' }] }]}>
        <View style={styles.minuteHand} />
      </View>
      <View style={[styles.pivot, { transform: [{ rotate: `${hourAngle}deg` }] }]}>
        <View style={styles.hourHand} />
      </View>
      <View style={styles.centerDot} />
    </View>
  );
}

const styles = StyleSheet.create({
  face: {
    borderWidth: 5, borderColor: colors.ink, backgroundColor: colors.white,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  pivot: { position: 'absolute', top: '50%', left: '50%', width: 0, height: 0 },
  hourHand: { position: 'absolute', top: -42, left: -4, width: 8, height: 42, backgroundColor: colors.grapeDeep, borderRadius: 4 },
  minuteHand: { position: 'absolute', top: -62, left: -2.5, width: 5, height: 62, backgroundColor: colors.coralDeep, borderRadius: 3 },
  centerDot: {
    position: 'absolute', top: '50%', left: '50%', width: 14, height: 14, marginTop: -7, marginLeft: -7,
    borderRadius: 7, backgroundColor: colors.ink, zIndex: 2,
  },
  number: { position: 'absolute', fontWeight: '700', fontSize: 16, color: colors.ink },
  num12: { top: 10, alignSelf: 'center', left: '50%', marginLeft: -8 },
  num6: { bottom: 10, alignSelf: 'center', left: '50%', marginLeft: -6 },
  num3: { right: 14, top: '50%', marginTop: -10 },
  num9: { left: 14, top: '50%', marginTop: -10 },
});
