import { Baloo2_500Medium, Baloo2_700Bold } from '@expo-google-fonts/baloo-2';
import { Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import AlphabetGameScreen from './src/screens/AlphabetGameScreen';
import CompletionScreen from './src/screens/CompletionScreen';
import GradeSelectScreen from './src/screens/GradeSelectScreen';
import SubjectSelectScreen from './src/screens/SubjectSelectScreen';
import TopicSelectScreen from './src/screens/TopicSelectScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Baloo2_500Medium,
    Baloo2_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sky }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="GradeSelect" component={GradeSelectScreen} />
          <Stack.Screen name="SubjectSelect" component={SubjectSelectScreen} />
          <Stack.Screen name="TopicSelect" component={TopicSelectScreen} />
          <Stack.Screen name="AlphabetGame" component={AlphabetGameScreen} />
          <Stack.Screen name="Completion" component={CompletionScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
