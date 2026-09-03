import { StyleSheet, Text, View } from 'react-native';
import BackButton from '../components/BackButton';
import BouncyButton from '../components/BouncyButton';
import { cardPalette, colors, fonts, radius, spacing } from '../theme';

const GRADES = [
  { id: 'jrkg', label: 'Junior KG', emoji: '🧸', available: true },
  { id: 'srkg', label: 'Senior KG', emoji: '🎈', available: false },
  { id: 'g1', label: 'Grade 1', emoji: '📘', available: false },
];

export default function GradeSelectScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <BackButton onPress={() => navigation.goBack()} />
      <Text style={styles.eyebrow}>Step 1</Text>
      <Text style={styles.title}>Which grade is your child in?</Text>

      <View style={styles.grid}>
        {GRADES.map((grade, i) => {
          const palette = cardPalette[i % cardPalette.length];
          return (
            <BouncyButton
              key={grade.id}
              disabled={!grade.available}
              style={[
                styles.card,
                { backgroundColor: grade.available ? palette.bg : '#E4DED6' },
              ]}
              onPress={() => navigation.navigate('SubjectSelect', { grade: grade.label })}
            >
              <Text style={styles.cardEmoji}>{grade.emoji}</Text>
              <Text style={[styles.cardLabel, !grade.available && styles.cardLabelDisabled]}>
                {grade.label}
              </Text>
              {!grade.available && <Text style={styles.soon}>Coming Soon</Text>}
            </BouncyButton>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: spacing.lg },
  eyebrow: { fontFamily: fonts.bodyBold, color: colors.grapeDeep, fontSize: 13, marginTop: spacing.md },
  title: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.ink, marginBottom: spacing.lg, marginTop: spacing.xs },
  grid: { gap: spacing.md },
  card: {
    borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  cardEmoji: { fontSize: 44, marginBottom: spacing.xs },
  cardLabel: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.white },
  cardLabelDisabled: { color: colors.muted },
  soon: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.muted, marginTop: 4 },
});
