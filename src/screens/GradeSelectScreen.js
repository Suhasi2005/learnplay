import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import BackButton from '../components/BackButton';
import BouncyButton from '../components/BouncyButton';
import FadeInCard from '../components/FadeInCard';
import { isGradeAvailable } from '../curriculum';
import { bgGradient, cardPalette, colors, fonts, radius, spacing } from '../theme';

const GRADES = [
  { id: 'jrkg', label: 'Junior KG', emoji: '🧸' },
  { id: 'srkg', label: 'Senior KG', emoji: '🎈' },
  { id: 'g1', label: 'Grade 1', emoji: '📘' },
];

export default function GradeSelectScreen({ navigation }) {
  return (
    <LinearGradient colors={bgGradient} style={styles.container}>
      <StatusBar style="dark" />
      <BackButton onPress={() => navigation.goBack()} />
      <Text style={styles.eyebrow}>Step 1</Text>
      <Text style={styles.title}>Which grade is your child in?</Text>

      <View style={styles.grid}>
        {GRADES.map((grade, i) => {
          const available = isGradeAvailable(grade.label);
          const palette = cardPalette[i % cardPalette.length];
          return (
            <FadeInCard key={grade.id} index={i}>
              <BouncyButton
                disabled={!available}
                style={[
                  styles.card,
                  { backgroundColor: available ? palette.bg : colors.disabled },
                ]}
                onPress={() => navigation.navigate('SubjectSelect', { grade: grade.label })}
              >
                <Text style={styles.cardEmoji}>{grade.emoji}</Text>
                <Text style={[styles.cardLabel, !available && styles.cardLabelDisabled]}>
                  {grade.label}
                </Text>
                {!available && <Text style={styles.soon}>Coming Soon</Text>}
              </BouncyButton>
            </FadeInCard>
          );
        })}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg },
  eyebrow: { fontFamily: fonts.bodyBold, color: colors.grapeDeep, fontSize: 13, marginTop: spacing.md },
  title: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.ink, marginBottom: spacing.lg, marginTop: spacing.xs },
  grid: { gap: spacing.md },
  card: {
    borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 3,
  },
  cardEmoji: { fontSize: 44, marginBottom: spacing.xs },
  // White text on these palette colors measured 1.5-2.7:1 contrast (WCAG AA
  // needs 3:1 minimum even for large bold text) — ink measures 4.8-8.5:1.
  cardLabel: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.ink },
  cardLabelDisabled: { color: colors.muted },
  soon: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.muted, marginTop: 4 },
});
