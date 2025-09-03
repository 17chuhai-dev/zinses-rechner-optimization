/**
 * 复合利息计算器屏幕
 * 移动端优化的复合利息计算界面
 */

import React, { useState, useEffect } from 'react'
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native'
import {
  Card,
  Title,
  TextInput,
  Button,
  SegmentedButtons,
  useTheme,
  Text,
  Surface,
  Divider,
  IconButton,
} from 'react-native-paper'
import { LineChart, PieChart } from 'react-native-chart-kit'
import { useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialIcons'

import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { calculateCompoundInterest } from '../../utils/calculations'
import { saveCalculation } from '../../store/slices/calculationsSlice'
import { formatCurrency, formatPercentage } from '../../utils/formatting'
import { ResultCard } from '../../components/calculators/ResultCard'
import { InputCard } from '../../components/calculators/InputCard'
import { ChartCard } from '../../components/calculators/ChartCard'

const { width: screenWidth } = Dimensions.get('window')

interface CalculationInputs {
  initialAmount: string
  monthlyContribution: string
  interestRate: string
  duration: string
  compoundingFrequency: string
}

export const CompoundInterestScreen: React.FC = () => {
  const theme = useTheme()
  const navigation = useNavigation()
  const dispatch = useAppDispatch()
  
  const { currency } = useAppSelector(state => state.settings)
  
  const [inputs, setInputs] = useState<CalculationInputs>({
    initialAmount: '10000',
    monthlyContribution: '500',
    interestRate: '5',
    duration: '10',
    compoundingFrequency: '12',
  })
  
  const [result, setResult] = useState<any>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [activeTab, setActiveTab] = useState('input')

  const compoundingOptions = [
    { value: '1', label: 'Jährlich' },
    { value: '4', label: 'Quartalsweise' },
    { value: '12', label: 'Monatlich' },
    { value: '365', label: 'Täglich' },
  ]

  useEffect(() => {
    // 自动计算当输入有效时
    if (isValidInput()) {
      handleCalculate()
    }
  }, [inputs])

  const isValidInput = (): boolean => {
    const { initialAmount, interestRate, duration } = inputs
    return (
      parseFloat(initialAmount) >= 0 &&
      parseFloat(interestRate) > 0 &&
      parseFloat(duration) > 0
    )
  }

  const handleInputChange = (field: keyof CalculationInputs, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }))
  }

  const handleCalculate = async () => {
    if (!isValidInput()) {
      Alert.alert('Ungültige Eingabe', 'Bitte überprüfen Sie Ihre Eingaben.')
      return
    }

    setIsCalculating(true)
    
    try {
      const calculationData = {
        initialAmount: parseFloat(inputs.initialAmount),
        monthlyContribution: parseFloat(inputs.monthlyContribution) || 0,
        interestRate: parseFloat(inputs.interestRate) / 100,
        duration: parseFloat(inputs.duration),
        compoundingFrequency: parseInt(inputs.compoundingFrequency),
      }

      const calculationResult = calculateCompoundInterest(calculationData)
      setResult(calculationResult)
      setActiveTab('result')
    } catch (error) {
      Alert.alert('Berechnungsfehler', 'Ein Fehler ist bei der Berechnung aufgetreten.')
      console.error('Calculation error:', error)
    } finally {
      setIsCalculating(false)
    }
  }

  const handleSaveCalculation = async () => {
    if (!result) return

    try {
      await dispatch(saveCalculation({
        type: 'compound-interest',
        title: 'Zinseszinsrechnung',
        inputs,
        result,
        createdAt: new Date().toISOString(),
      }))
      
      Alert.alert('Gespeichert', 'Die Berechnung wurde erfolgreich gespeichert.')
    } catch (error) {
      Alert.alert('Fehler', 'Die Berechnung konnte nicht gespeichert werden.')
    }
  }

  const handleShareResult = () => {
    if (result) {
      navigation.navigate('Share', { result })
    }
  }

  // 图表数据准备
  const chartData = result?.yearlyBreakdown ? {
    labels: result.yearlyBreakdown.slice(0, 6).map((_: any, index: number) => `Jahr ${index + 1}`),
    datasets: [
      {
        data: result.yearlyBreakdown.slice(0, 6).map((item: any) => item.totalAmount),
        color: (opacity = 1) => `rgba(${theme.colors.primary}, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  } : null

  const pieChartData = result ? [
    {
      name: 'Anfangskapital',
      amount: result.initialAmount,
      color: theme.colors.primary,
      legendFontColor: theme.colors.onSurface,
      legendFontSize: 12,
    },
    {
      name: 'Einzahlungen',
      amount: result.totalContributions || 0,
      color: '#4CAF50',
      legendFontColor: theme.colors.onSurface,
      legendFontSize: 12,
    },
    {
      name: 'Zinserträge',
      amount: result.totalInterest,
      color: '#FF9800',
      legendFontColor: theme.colors.onSurface,
      legendFontSize: 12,
    },
  ] : []

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
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 标签切换 */}
      <Surface style={[styles.tabContainer, { backgroundColor: theme.colors.surface }]}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            { value: 'input', label: 'Eingabe', icon: 'edit' },
            { value: 'result', label: 'Ergebnis', icon: 'analytics' },
            { value: 'chart', label: 'Diagramm', icon: 'show-chart' },
          ]}
        />
      </Surface>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 输入标签 */}
        {activeTab === 'input' && (
          <View style={styles.tabContent}>
            <InputCard title="Grunddaten">
              <TextInput
                label="Anfangskapital (€)"
                value={inputs.initialAmount}
                onChangeText={(value) => handleInputChange('initialAmount', value)}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="euro" />}
              />
              
              <TextInput
                label="Monatliche Einzahlung (€)"
                value={inputs.monthlyContribution}
                onChangeText={(value) => handleInputChange('monthlyContribution', value)}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="calendar-month" />}
              />
              
              <TextInput
                label="Zinssatz (%)"
                value={inputs.interestRate}
                onChangeText={(value) => handleInputChange('interestRate', value)}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="percent" />}
              />
              
              <TextInput
                label="Laufzeit (Jahre)"
                value={inputs.duration}
                onChangeText={(value) => handleInputChange('duration', value)}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="schedule" />}
              />
            </InputCard>

            <InputCard title="Zinseszins-Häufigkeit">
              <SegmentedButtons
                value={inputs.compoundingFrequency}
                onValueChange={(value) => handleInputChange('compoundingFrequency', value)}
                buttons={compoundingOptions}
              />
            </InputCard>

            <Button
              mode="contained"
              onPress={handleCalculate}
              loading={isCalculating}
              disabled={!isValidInput()}
              style={styles.calculateButton}
              icon="calculate"
            >
              Berechnen
            </Button>
          </View>
        )}

        {/* 结果标签 */}
        {activeTab === 'result' && result && (
          <View style={styles.tabContent}>
            <ResultCard
              title="Endergebnis"
              items={[
                {
                  label: 'Endkapital',
                  value: formatCurrency(result.finalAmount, currency),
                  highlight: true,
                },
                {
                  label: 'Anfangskapital',
                  value: formatCurrency(result.initialAmount, currency),
                },
                {
                  label: 'Gesamte Einzahlungen',
                  value: formatCurrency(result.totalContributions || 0, currency),
                },
                {
                  label: 'Zinserträge',
                  value: formatCurrency(result.totalInterest, currency),
                },
                {
                  label: 'Gesamtrendite',
                  value: formatPercentage(
                    ((result.finalAmount / result.initialAmount) - 1) * 100
                  ),
                },
              ]}
            />

            {/* 操作按钮 */}
            <View style={styles.actionButtons}>
              <Button
                mode="outlined"
                onPress={handleSaveCalculation}
                style={styles.actionButton}
                icon="bookmark"
              >
                Speichern
              </Button>
              <Button
                mode="contained"
                onPress={handleShareResult}
                style={styles.actionButton}
                icon="share"
              >
                Teilen
              </Button>
            </View>
          </View>
        )}

        {/* 图表标签 */}
        {activeTab === 'chart' && result && (
          <View style={styles.tabContent}>
            {chartData && (
              <ChartCard title="Kapitalentwicklung">
                <LineChart
                  data={chartData}
                  width={screenWidth - 64}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                />
              </ChartCard>
            )}

            <ChartCard title="Zusammensetzung">
              <PieChart
                data={pieChartData}
                width={screenWidth - 64}
                height={220}
                chartConfig={chartConfig}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="15"
                style={styles.chart}
              />
            </ChartCard>
          </View>
        )}

        {/* 底部间距 */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    margin: 16,
    padding: 8,
    borderRadius: 12,
    elevation: 2,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  tabContent: {
    paddingBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  calculateButton: {
    marginTop: 24,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
})
