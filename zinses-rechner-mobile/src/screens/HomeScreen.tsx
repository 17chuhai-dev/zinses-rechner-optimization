/**
 * 主屏幕组件
 * 显示应用概览、快速访问和最近计算
 */

import React, { useEffect, useState } from 'react'
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native'
import {
  Card,
  Title,
  Paragraph,
  Button,
  FAB,
  Chip,
  useTheme,
  Surface,
  Text,
  IconButton,
} from 'react-native-paper'
import { LineChart } from 'react-native-chart-kit'
import { useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialIcons'

import { useAppSelector, useAppDispatch } from '../hooks/redux'
import { QuickCalculatorCard } from '../components/home/QuickCalculatorCard'
import { RecentCalculationsCard } from '../components/home/RecentCalculationsCard'
import { MarketDataCard } from '../components/home/MarketDataCard'
import { WelcomeCard } from '../components/home/WelcomeCard'
import { loadRecentCalculations } from '../store/slices/calculationsSlice'
import { loadMarketData } from '../store/slices/marketSlice'

const { width: screenWidth } = Dimensions.get('window')

export const HomeScreen: React.FC = () => {
  const theme = useTheme()
  const navigation = useNavigation()
  const dispatch = useAppDispatch()
  
  const { user } = useAppSelector(state => state.auth)
  const { recentCalculations, isLoading } = useAppSelector(state => state.calculations)
  const { marketData } = useAppSelector(state => state.market)
  const { currency, theme: themeMode } = useAppSelector(state => state.settings)
  
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      await Promise.all([
        dispatch(loadRecentCalculations()),
        dispatch(loadMarketData()),
      ])
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const navigateToCalculator = (type: string, title: string) => {
    navigation.navigate('CalculatorDetail', { type, title })
  }

  const quickCalculators = [
    {
      id: 'compound-interest',
      title: 'Zinseszins',
      subtitle: 'Kapitalwachstum berechnen',
      icon: 'trending-up',
      color: theme.colors.primary,
      onPress: () => navigateToCalculator('compound-interest', 'Zinseszinsrechner'),
    },
    {
      id: 'mortgage',
      title: 'Hypothek',
      subtitle: 'Immobilienfinanzierung',
      icon: 'home',
      color: '#4CAF50',
      onPress: () => navigateToCalculator('mortgage', 'Hypothekenrechner'),
    },
    {
      id: 'loan',
      title: 'Kredit',
      subtitle: 'Kreditkosten ermitteln',
      icon: 'account-balance',
      color: '#FF9800',
      onPress: () => navigateToCalculator('loan', 'Kreditrechner'),
    },
    {
      id: 'investment',
      title: 'Investment',
      subtitle: 'Anlagestrategien vergleichen',
      icon: 'show-chart',
      color: '#9C27B0',
      onPress: () => navigateToCalculator('investment', 'Investmentrechner'),
    },
  ]

  // 示例图表数据
  const chartData = {
    labels: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun'],
    datasets: [
      {
        data: [20, 45, 28, 80, 99, 43],
        color: (opacity = 1) => `rgba(${theme.colors.primary}, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  }

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(${theme.colors.onSurface}, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${theme.colors.onSurface}, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 欢迎卡片 */}
        <WelcomeCard user={user} />

        {/* 市场数据卡片 */}
        <MarketDataCard data={marketData} />

        {/* 快速计算器 */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Title style={{ color: theme.colors.onSurface }}>
                Schnellrechner
              </Title>
              <IconButton
                icon="arrow-right"
                size={20}
                onPress={() => navigation.navigate('Calculators')}
              />
            </View>
            <View style={styles.quickCalculatorsGrid}>
              {quickCalculators.map((calculator) => (
                <QuickCalculatorCard
                  key={calculator.id}
                  {...calculator}
                />
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* 最近计算 */}
        <RecentCalculationsCard 
          calculations={recentCalculations}
          onViewAll={() => navigation.navigate('History')}
        />

        {/* 性能图表 */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={{ color: theme.colors.onSurface, marginBottom: 16 }}>
              Portfolio Performance
            </Title>
            <LineChart
              data={chartData}
              width={screenWidth - 64}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </Card.Content>
        </Card>

        {/* 提示和技巧 */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Title style={{ color: theme.colors.onSurface }}>
                Tipp des Tages
              </Title>
              <Icon name="lightbulb-outline" size={24} color={theme.colors.primary} />
            </View>
            <Paragraph style={{ color: theme.colors.onSurface, marginBottom: 12 }}>
              Nutzen Sie den Zinseszinseffekt zu Ihrem Vorteil: Je früher Sie anfangen zu sparen, 
              desto mehr profitieren Sie von der exponentiellen Wachstumskurve.
            </Paragraph>
            <View style={styles.chipContainer}>
              <Chip icon="school" mode="outlined" compact>
                Finanzbildung
              </Chip>
              <Chip icon="trending-up" mode="outlined" compact>
                Investieren
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {/* 底部间距 */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 浮动操作按钮 */}
      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="add"
        onPress={() => navigation.navigate('Calculators')}
        label="Neue Berechnung"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    marginVertical: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  quickCalculatorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
})
