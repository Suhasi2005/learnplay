import { Baloo2_500Medium, Baloo2_700Bold } from '@expo-google-fonts/baloo-2';
import { Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';
import { SoundProvider } from './src/context/SoundContext';
import AlphabetGameScreen from './src/screens/AlphabetGameScreen';
import CompletionScreen from './src/screens/CompletionScreen';
import GradeSelectScreen from './src/screens/GradeSelectScreen';
import NumberGameScreen from './src/screens/NumberGameScreen';
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
    <SoundProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'fade_from_bottom',
            animationDuration: 220,
          }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="GradeSelect" component={GradeSelectScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="SubjectSelect" component={SubjectSelectScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="TopicSelect" component={TopicSelectScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="AlphabetGame" component={AlphabetGameScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="NumberGame" component={NumberGameScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="Completion" component={CompletionScreen} options={{ animation: 'fade' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SoundProvider>
  );
}
