import { StyleSheet, Text } from 'react-native';
import BouncyButton from './BouncyButton';
import { colors } from '../theme';

export default function BackButton({ onPress }) {
  return (
    <BouncyButton style={styles.button} onPress={onPress}>
      <Text style={styles.arrow}>←</Text>
    </BouncyButton>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute', top: 14, left: 14, zIndex: 10,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.08)', alignItems: 'center', justifyContent: 'center',
  },
  arrow: { fontSize: 20, color: colors.ink },
});
