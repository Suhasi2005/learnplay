import { StyleSheet, Text } from 'react-native';
import BouncyButton from './BouncyButton';
import { colors, fonts, shadow } from '../theme';

// A solid white disc rather than a translucent scrim. The old version tinted
// whatever was behind it, so its contrast changed screen to screen; this is
// the same button everywhere, and it lifts off the background instead of
// sinking into it.
export default function BackButton({ onPress }) {
  return (
    <BouncyButton style={styles.button} onPress={onPress}>
      <Text style={styles.arrow} accessibilityLabel="Go back">←</Text>
    </BouncyButton>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute', top: 16, left: 16, zIndex: 10,
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center',
    ...shadow.sm,
  },
  arrow: { fontSize: 22, color: colors.ink, fontFamily: fonts.displayBold, includeFontPadding: false },
});
