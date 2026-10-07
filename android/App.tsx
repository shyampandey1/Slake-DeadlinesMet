import React from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { AuthProvider } from './src/context/AuthContext';
import { TaskProvider } from './src/context/TaskContext';
import { TimerProvider } from './src/context/TimerContext';
import { VoiceProvider } from './src/context/VoiceContext';

import { TimerScreen } from './src/screens/TimerScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ReformersScreen } from './src/screens/ReformersScreen';
import { RewardsScreen } from './src/screens/RewardsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

import { BottomTabBar } from './src/components/navigation/BottomTabBar';
import { AgentDM } from './src/components/voice/AgentDM';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <TaskProvider>
          <TimerProvider>
            <VoiceProvider>
              <View style={styles.rootContainer}>
                <StatusBar style="light" backgroundColor="#020617" />

                <NavigationContainer>
                  <Tab.Navigator
                    tabBar={(props) => <BottomTabBar {...props} />}
                    screenOptions={{
                      headerShown: false,
                    }}
                    initialRouteName="Timer"
                  >
                    <Tab.Screen name="Timer" component={TimerScreen} />
                    <Tab.Screen name="Dashboard" component={DashboardScreen} />
                    <Tab.Screen name="Reformers" component={ReformersScreen} />
                    <Tab.Screen name="Rewards" component={RewardsScreen} />
                    <Tab.Screen name="Settings" component={SettingsScreen} />
                  </Tab.Navigator>
                </NavigationContainer>

                {/* Persistent Floating Neural Voice Agent DM HUD */}
                <AgentDM />
              </View>
            </VoiceProvider>
          </TimerProvider>
        </TaskProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#020617',
  },
});
