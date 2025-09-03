/**
 * Zinses Rechner Mobile App
 * React Native应用主入口
 */

import React, { useEffect } from 'react'
import { StatusBar, Platform } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { Provider as PaperProvider } from 'react-native-paper'
import { Provider as ReduxProvider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import SplashScreen from 'react-native-splash-screen'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import { store, persistor } from './src/store'
import { AppNavigator } from './src/navigation/AppNavigator'
import { lightTheme, darkTheme } from './src/theme'
import { LoadingScreen } from './src/components/common/LoadingScreen'
import { ErrorBoundary } from './src/components/common/ErrorBoundary'
import { useAppSelector } from './src/hooks/redux'
import { NetworkProvider } from './src/providers/NetworkProvider'
import { AuthProvider } from './src/providers/AuthProvider'

const AppContent: React.FC = () => {
  const { theme: themeMode } = useAppSelector(state => state.settings)
  const theme = themeMode === 'dark' ? darkTheme : lightTheme

  useEffect(() => {
    // 隐藏启动屏幕
    if (Platform.OS === 'android') {
      SplashScreen.hide()
    }
  }, [])

  return (
    <PaperProvider theme={theme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar
          barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor={theme.colors.surface}
        />
        <NavigationContainer theme={theme}>
          <NetworkProvider>
            <AuthProvider>
              <AppNavigator />
            </AuthProvider>
          </NetworkProvider>
        </NavigationContainer>
      </GestureHandlerRootView>
    </PaperProvider>
  )
}

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ReduxProvider store={store}>
        <PersistGate loading={<LoadingScreen />} persistor={persistor}>
          <AppContent />
        </PersistGate>
      </ReduxProvider>
    </ErrorBoundary>
  )
}

export default App
