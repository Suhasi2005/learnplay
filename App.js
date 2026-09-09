// Imported by exact file rather than from the package root. The root index
// re-exports every weight, which made Metro bundle all five Baloo 2 faces and
// all five Fredoka faces — about 1.9 MB of fonts for the four the app
// actually renders.
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import FloatingNav from './src/components/FloatingNav';
import { SoundProvider } from './src/context/SoundContext';
import { ActivitiesScreen, StoriesScreen } from './src/screens/shell/ComingSoonScreen';
import DiscoverScreen from './src/screens/shell/DiscoverScreen';
import GamesScreen from './src/screens/shell/GamesScreen';
import LessonsScreen from './src/screens/shell/LessonsScreen';
import MiaScreen from './src/screens/shell/MiaScreen';
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
const Tab = createBottomTabNavigator();

// The browsing shell. Five tabs, and three of them lead somewhere real:
// Lessons is the curriculum path, Games is every playable topic in one list,
// Discover suggests one. Stories and Activities are honest placeholders rather
// than dummy content that breaks the moment a child taps it.
function ShellTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingNav {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}
    >
      <Tab.Screen name="Lessons" component={LessonsScreen} options={{ title: 'Home', tabBarIcon: '🏠' }} />
      <Tab.Screen name="Games" component={GamesScreen} options={{ title: 'Games', tabBarIcon: '🎮' }} />
      <Tab.Screen name="Stories" component={StoriesScreen} options={{ title: 'Stories', tabBarIcon: '📖' }} />
      <Tab.Screen name="Activities" component={ActivitiesScreen} options={{ title: 'Activities', tabBarIcon: '🎨' }} />
      <Tab.Screen name="Discover" component={DiscoverScreen} options={{ title: 'Discover', tabBarIcon: '🧭' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Fredoka_600SemiBold: require('@expo-google-fonts/fredoka/600SemiBold/Fredoka_600SemiBold.ttf'),
    Fredoka_700Bold: require('@expo-google-fonts/fredoka/700Bold/Fredoka_700Bold.ttf'),
    Baloo2_500Medium: require('@expo-google-fonts/baloo-2/500Medium/Baloo2_500Medium.ttf'),
    Baloo2_700Bold: require('@expo-google-fonts/baloo-2/700Bold/Baloo2_700Bold.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream }}>
        <ActivityIndicator size="large" color={colors.grape} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SoundProvider>
        <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'fade_from_bottom',
            animationDuration: 220,
          }}
        >
          {/* Welcome is the door; Shell is the app behind it. */}
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Shell" component={ShellTabs} />
          <Stack.Screen name="Mia" component={MiaScreen} options={{ animation: 'slide_from_right' }} />
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
    </SafeAreaProvider>
  );
}
