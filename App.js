import { Baloo2_500Medium, Baloo2_700Bold } from '@expo-google-fonts/baloo-2';
import { Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';
import { SoundProvider } from './src/context/SoundContext';
import AddItUpScreen from './src/screens/AddItUpScreen';
import AlphabetGameScreen from './src/screens/AlphabetGameScreen';
import BiggerOrSmallerScreen from './src/screens/BiggerOrSmallerScreen';
import CompletionScreen from './src/screens/CompletionScreen';
import DressForSeasonScreen from './src/screens/DressForSeasonScreen';
import GradeSelectScreen from './src/screens/GradeSelectScreen';
import GroupsOfScreen from './src/screens/GroupsOfScreen';
import LivingOrNotScreen from './src/screens/LivingOrNotScreen';
import MakeAmountScreen from './src/screens/MakeAmountScreen';
import NumberGameScreen from './src/screens/NumberGameScreen';
import NumberLineGapScreen from './src/screens/NumberLineGapScreen';
import OddOneOutScreen from './src/screens/OddOneOutScreen';
import OppositesMatchScreen from './src/screens/OppositesMatchScreen';
import ParentAreaScreen from './src/screens/ParentAreaScreen';
import ParentGateScreen from './src/screens/ParentGateScreen';
import PointToTheScreen from './src/screens/PointToTheScreen';
import ReadTheChartScreen from './src/screens/ReadTheChartScreen';
import ShapeSortScreen from './src/screens/ShapeSortScreen';
import StopOrGoScreen from './src/screens/StopOrGoScreen';
import SubjectSelectScreen from './src/screens/SubjectSelectScreen';
import TopicSelectScreen from './src/screens/TopicSelectScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import WhatComesNextScreen from './src/screens/WhatComesNextScreen';
import WhatTimeIsItScreen from './src/screens/WhatTimeIsItScreen';
import WhoSaysThatScreen from './src/screens/WhoSaysThatScreen';
import WhoUsesThisScreen from './src/screens/WhoUsesThisScreen';
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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream }}>
        <ActivityIndicator size="large" color={colors.grape} />
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
          <Stack.Screen name="OppositesMatch" component={OppositesMatchScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="AddItUp" component={AddItUpScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="ShapeSort" component={ShapeSortScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="StopOrGo" component={StopOrGoScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="WhatComesNext" component={WhatComesNextScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="BiggerOrSmaller" component={BiggerOrSmallerScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="OddOneOut" component={OddOneOutScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="MakeAmount" component={MakeAmountScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="WhatTimeIsIt" component={WhatTimeIsItScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="GroupsOf" component={GroupsOfScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="ReadTheChart" component={ReadTheChartScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="NumberLineGap" component={NumberLineGapScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="WhoUsesThis" component={WhoUsesThisScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="PointToThe" component={PointToTheScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="LivingOrNot" component={LivingOrNotScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="DressForSeason" component={DressForSeasonScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="WhoSaysThat" component={WhoSaysThatScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="Completion" component={CompletionScreen} options={{ animation: 'fade' }} />
          {/* Grown-up side. Presented modally so it reads as stepping out of
              the game world rather than deeper into it. */}
          <Stack.Screen name="ParentGate" component={ParentGateScreen} options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="ParentArea" component={ParentAreaScreen} options={{ animation: 'slide_from_bottom' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SoundProvider>
  );
}
