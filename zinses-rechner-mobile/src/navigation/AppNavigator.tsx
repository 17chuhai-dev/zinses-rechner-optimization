/**
 * 应用主导航器
 * 管理整个应用的导航结构
 */

import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createDrawerNavigator } from '@react-navigation/drawer'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { useTheme } from 'react-native-paper'

import { useAppSelector } from '../hooks/redux'
import { OnboardingScreen } from '../screens/OnboardingScreen'
import { HomeScreen } from '../screens/HomeScreen'
import { CalculatorsScreen } from '../screens/CalculatorsScreen'
import { HistoryScreen } from '../screens/HistoryScreen'
import { SettingsScreen } from '../screens/SettingsScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { CompoundInterestScreen } from '../screens/calculators/CompoundInterestScreen'
import { MortgageScreen } from '../screens/calculators/MortgageScreen'
import { LoanScreen } from '../screens/calculators/LoanScreen'
import { InvestmentScreen } from '../screens/calculators/InvestmentScreen'
import { ResultDetailScreen } from '../screens/ResultDetailScreen'
import { ShareScreen } from '../screens/ShareScreen'
import { AboutScreen } from '../screens/AboutScreen'
import { HelpScreen } from '../screens/HelpScreen'

export type RootStackParamList = {
  Onboarding: undefined
  Main: undefined
  CalculatorDetail: { type: string; title: string }
  ResultDetail: { result: any; calculatorType: string }
  Share: { result: any }
  About: undefined
  Help: undefined
}

export type MainTabParamList = {
  Home: undefined
  Calculators: undefined
  History: undefined
  Settings: undefined
}

export type DrawerParamList = {
  MainTabs: undefined
  Profile: undefined
  About: undefined
  Help: undefined
}

const Stack = createStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<MainTabParamList>()
const Drawer = createDrawerNavigator<DrawerParamList>()

const MainTabs: React.FC = () => {
  const theme = useTheme()

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string

          switch (route.name) {
            case 'Home':
              iconName = 'home'
              break
            case 'Calculators':
              iconName = 'calculate'
              break
            case 'History':
              iconName = 'history'
              break
            case 'Settings':
              iconName = 'settings'
              break
            default:
              iconName = 'help'
          }

          return <Icon name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Startseite' }}
      />
      <Tab.Screen 
        name="Calculators" 
        component={CalculatorsScreen}
        options={{ title: 'Rechner' }}
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen}
        options={{ title: 'Verlauf' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Einstellungen' }}
      />
    </Tab.Navigator>
  )
}

const DrawerNavigator: React.FC = () => {
  const theme = useTheme()

  return (
    <Drawer.Navigator
      screenOptions={{
        drawerStyle: {
          backgroundColor: theme.colors.surface,
        },
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.onSurfaceVariant,
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
      }}
    >
      <Drawer.Screen 
        name="MainTabs" 
        component={MainTabs}
        options={{ 
          title: 'Zinses Rechner',
          drawerIcon: ({ color, size }) => (
            <Icon name="calculate" size={size} color={color} />
          )
        }}
      />
      <Drawer.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ 
          title: 'Profil',
          drawerIcon: ({ color, size }) => (
            <Icon name="person" size={size} color={color} />
          )
        }}
      />
      <Drawer.Screen 
        name="About" 
        component={AboutScreen}
        options={{ 
          title: 'Über die App',
          drawerIcon: ({ color, size }) => (
            <Icon name="info" size={size} color={color} />
          )
        }}
      />
      <Drawer.Screen 
        name="Help" 
        component={HelpScreen}
        options={{ 
          title: 'Hilfe',
          drawerIcon: ({ color, size }) => (
            <Icon name="help" size={size} color={color} />
          )
        }}
      />
    </Drawer.Navigator>
  )
}

export const AppNavigator: React.FC = () => {
  const { isFirstLaunch } = useAppSelector(state => state.app)
  const theme = useTheme()

  return (
    <Stack.Navigator
      initialRouteName={isFirstLaunch ? 'Onboarding' : 'Main'}
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        cardStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Stack.Screen 
        name="Onboarding" 
        component={OnboardingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Main" 
        component={DrawerNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CalculatorDetail" 
        component={CalculatorDetailScreen}
        options={({ route }) => ({ 
          title: route.params.title,
          headerBackTitleVisible: false,
        })}
      />
      <Stack.Screen 
        name="ResultDetail" 
        component={ResultDetailScreen}
        options={{ 
          title: 'Ergebnis Details',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen 
        name="Share" 
        component={ShareScreen}
        options={{ 
          title: 'Teilen',
          headerBackTitleVisible: false,
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  )
}

// 计算器详情屏幕路由组件
const CalculatorDetailScreen: React.FC<any> = ({ route }) => {
  const { type } = route.params

  switch (type) {
    case 'compound-interest':
      return <CompoundInterestScreen />
    case 'mortgage':
      return <MortgageScreen />
    case 'loan':
      return <LoanScreen />
    case 'investment':
      return <InvestmentScreen />
    default:
      return <CompoundInterestScreen />
  }
}
