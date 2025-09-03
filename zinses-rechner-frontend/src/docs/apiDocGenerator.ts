/**
 * API文档生成器
 * 自动生成OpenAPI 3.0规范的API文档
 *
 * @version 1.0.0
 * @author Zinses-Rechner Team
 * @created 2025-01-01
 */

import { API_ENDPOINTS, API_STATUS_CODES } from '@/api/routes'
import type { CalculatorType } from '@/api/calculatorApi'

// OpenAPI文档接口
export interface OpenApiSpec {
  openapi: string
  info: ApiInfo
  servers: ApiServer[]
  paths: Record<string, PathItem>
  components: Components
  security: SecurityRequirement[]
  tags: Tag[]
}

export interface ApiInfo {
  title: string
  description: string
  version: string
  contact: {
    name: string
    email: string
    url: string
  }
  license: {
    name: string
    url: string
  }
  termsOfService: string
}

export interface ApiServer {
  url: string
  description: string
  variables?: Record<string, ServerVariable>
}

export interface ServerVariable {
  default: string
  description?: string
  enum?: string[]
}

export interface PathItem {
  summary?: string
  description?: string
  get?: Operation
  post?: Operation
  put?: Operation
  patch?: Operation
  delete?: Operation
  parameters?: Parameter[]
}

export interface Operation {
  tags: string[]
  summary: string
  description: string
  operationId: string
  parameters?: Parameter[]
  requestBody?: RequestBody
  responses: Record<string, Response>
  security?: SecurityRequirement[]
  deprecated?: boolean
}

export interface Parameter {
  name: string
  in: 'query' | 'header' | 'path' | 'cookie'
  description: string
  required: boolean
  schema: Schema
  example?: any
}

export interface RequestBody {
  description: string
  required: boolean
  content: Record<string, MediaType>
}

export interface Response {
  description: string
  headers?: Record<string, Header>
  content?: Record<string, MediaType>
}

export interface MediaType {
  schema: Schema
  example?: any
  examples?: Record<string, Example>
}

export interface Schema {
  type?: string
  format?: string
  properties?: Record<string, Schema>
  items?: Schema
  required?: string[]
  enum?: any[]
  minimum?: number
  maximum?: number
  pattern?: string
  description?: string
  example?: any
  $ref?: string
}

export interface Header {
  description: string
  schema: Schema
}

export interface Example {
  summary?: string
  description?: string
  value: any
}

export interface Components {
  schemas: Record<string, Schema>
  responses: Record<string, Response>
  parameters: Record<string, Parameter>
  examples: Record<string, Example>
  requestBodies: Record<string, RequestBody>
  headers: Record<string, Header>
  securitySchemes: Record<string, SecurityScheme>
}

export interface SecurityScheme {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect'
  description?: string
  name?: string
  in?: 'query' | 'header' | 'cookie'
  scheme?: string
  bearerFormat?: string
  flows?: OAuthFlows
  openIdConnectUrl?: string
}

export interface OAuthFlows {
  implicit?: OAuthFlow
  password?: OAuthFlow
  clientCredentials?: OAuthFlow
  authorizationCode?: OAuthFlow
}

export interface OAuthFlow {
  authorizationUrl?: string
  tokenUrl?: string
  refreshUrl?: string
  scopes: Record<string, string>
}

export interface SecurityRequirement {
  [name: string]: string[]
}

export interface Tag {
  name: string
  description: string
  externalDocs?: {
    description: string
    url: string
  }
}

class ApiDocGenerator {
  /**
   * 生成完整的OpenAPI文档
   */
  generateOpenApiSpec(): OpenApiSpec {
    return {
      openapi: '3.0.3',
      info: this.generateApiInfo(),
      servers: this.generateServers(),
      paths: this.generatePaths(),
      components: this.generateComponents(),
      security: this.generateSecurity(),
      tags: this.generateTags()
    }
  }

  /**
   * 生成API基本信息
   */
  private generateApiInfo(): ApiInfo {
    return {
      title: 'Zinses-Rechner API',
      description: `
        # Zinses-Rechner API

        Die offizielle API für die Zinses-Rechner Plattform. Diese API bietet Zugang zu allen Berechnungsfunktionen,
        Benutzerverwaltung und Datenanalyse-Features.

        ## Funktionen

        - **Finanzrechner**: Zinseszins, Darlehen, Baufinanzierung
        - **Benutzerverwaltung**: Registrierung, Authentifizierung, Profilverwaltung
        - **Berechnungshistorie**: Speichern, Abrufen, Exportieren von Berechnungen
        - **Ziele und Tracking**: Finanzielle Ziele setzen und verfolgen
        - **Analytics**: Detaillierte Analysen und Berichte

        ## DSGVO-Konformität

        Diese API ist vollständig DSGVO-konform und respektiert die Privatsphäre der Nutzer.
        Alle personenbezogenen Daten werden verschlüsselt gespeichert und können jederzeit
        exportiert oder gelöscht werden.

        ## Rate Limiting

        Die API ist rate-limited um Missbrauch zu verhindern:
        - **Authentifizierte Benutzer**: 1000 Anfragen pro Stunde
        - **Anonyme Benutzer**: 100 Anfragen pro Stunde
        - **Enterprise**: Unbegrenzt (nach Vereinbarung)
      `,
      version: '1.0.0',
      contact: {
        name: 'Zinses-Rechner Support',
        email: 'api@zinses-rechner.de',
        url: 'https://zinses-rechner.de/support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      },
      termsOfService: 'https://zinses-rechner.de/terms'
    }
  }

  /**
   * 生成服务器配置
   */
  private generateServers(): ApiServer[] {
    return [
      {
        url: 'https://api.zinses-rechner.de/v1',
        description: 'Produktionsserver'
      },
      {
        url: 'https://staging-api.zinses-rechner.de/v1',
        description: 'Staging-Server'
      },
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Lokaler Entwicklungsserver'
      }
    ]
  }

  /**
   * 生成API路径
   */
  private generatePaths(): Record<string, PathItem> {
    const paths: Record<string, PathItem> = {}

    // 认证端点
    paths['/auth/login'] = {
      post: {
        tags: ['Authentication'],
        summary: 'Benutzer anmelden',
        description: 'Meldet einen Benutzer mit E-Mail und Passwort an',
        operationId: 'loginUser',
        requestBody: {
          description: 'Anmeldedaten',
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
              example: {
                email: 'user@example.com',
                password: 'securePassword123'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Erfolgreich angemeldet',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '422': { $ref: '#/components/responses/ValidationError' }
        }
      }
    }

    // 计算器端点
    const calculatorTypes: CalculatorType[] = ['compound-interest', 'loan', 'mortgage']

    calculatorTypes.forEach(type => {
      paths[`/calculators/${type}/calculate`] = {
        post: {
          tags: ['Calculators'],
          summary: `${this.getCalculatorName(type)} berechnen`,
          description: `Führt eine ${this.getCalculatorName(type)}-Berechnung durch`,
          operationId: `calculate${this.capitalize(type.replace('-', ''))}`,
          requestBody: {
            description: 'Berechnungsparameter',
            required: true,
            content: {
              'application/json': {
                schema: { $ref: `#/components/schemas/${this.capitalize(type.replace('-', ''))}Request` },
                example: this.getCalculatorExample(type)
              }
            }
          },
          responses: {
            '200': {
              description: 'Berechnung erfolgreich',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/CalculationResult' }
                }
              }
            },
            '400': { $ref: '#/components/responses/BadRequest' },
            '422': { $ref: '#/components/responses/ValidationError' }
          }
        }
      }
    })

    return paths
  }

  /**
   * 生成组件定义
   */
  private generateComponents(): Components {
    return {
      schemas: this.generateSchemas(),
      responses: this.generateResponses(),
      parameters: this.generateParameters(),
      examples: this.generateExamples(),
      requestBodies: {},
      headers: {},
      securitySchemes: this.generateSecuritySchemes()
    }
  }

  /**
   * 生成数据模式
   */
  private generateSchemas(): Record<string, Schema> {
    return {
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'E-Mail-Adresse des Benutzers'
          },
          password: {
            type: 'string',
            minLength: 8,
            description: 'Passwort (mindestens 8 Zeichen)'
          }
        }
      },
      AuthResponse: {
        type: 'object',
        properties: {
          accessToken: {
            type: 'string',
            description: 'JWT Access Token'
          },
          refreshToken: {
            type: 'string',
            description: 'JWT Refresh Token'
          },
          expiresAt: {
            type: 'string',
            format: 'date-time',
            description: 'Token-Ablaufzeit'
          },
          user: {
            $ref: '#/components/schemas/User'
          }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Eindeutige Benutzer-ID'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'E-Mail-Adresse'
          },
          displayName: {
            type: 'string',
            description: 'Anzeigename'
          },
          type: {
            type: 'string',
            enum: ['anonymous', 'registered', 'enterprise'],
            description: 'Benutzertyp'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Erstellungsdatum'
          }
        }
      },
      CompoundInterestRequest: {
        type: 'object',
        required: ['principal', 'annualRate', 'years'],
        properties: {
          principal: {
            type: 'number',
            minimum: 0,
            description: 'Anfangskapital in Euro'
          },
          monthlyPayment: {
            type: 'number',
            minimum: 0,
            description: 'Monatliche Einzahlung in Euro'
          },
          annualRate: {
            type: 'number',
            minimum: 0,
            maximum: 100,
            description: 'Jährlicher Zinssatz in Prozent'
          },
          years: {
            type: 'number',
            minimum: 1,
            maximum: 100,
            description: 'Laufzeit in Jahren'
          },
          compoundFrequency: {
            type: 'string',
            enum: ['monthly', 'quarterly', 'annually'],
            description: 'Zinseszins-Häufigkeit'
          }
        }
      },
      CalculationResult: {
        type: 'object',
        properties: {
          finalAmount: {
            type: 'number',
            description: 'Endbetrag'
          },
          totalInterest: {
            type: 'number',
            description: 'Gesamte Zinsen'
          },
          totalContributions: {
            type: 'number',
            description: 'Gesamte Einzahlungen'
          },
          effectiveRate: {
            type: 'number',
            description: 'Effektiver Zinssatz'
          },
          yearlyBreakdown: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                year: { type: 'number' },
                startBalance: { type: 'number' },
                contributions: { type: 'number' },
                interest: { type: 'number' },
                endBalance: { type: 'number' }
              }
            }
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: 'Fehlertyp'
          },
          message: {
            type: 'string',
            description: 'Fehlermeldung'
          },
          code: {
            type: 'string',
            description: 'Fehlercode'
          },
          details: {
            type: 'object',
            description: 'Zusätzliche Fehlerdetails'
          }
        }
      }
    }
  }

  /**
   * 生成响应定义
   */
  private generateResponses(): Record<string, Response> {
    return {
      BadRequest: {
        description: 'Ungültige Anfrage',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      Unauthorized: {
        description: 'Nicht authentifiziert',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      ValidationError: {
        description: 'Validierungsfehler',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      }
    }
  }

  /**
   * 生成参数定义
   */
  private generateParameters(): Record<string, Parameter> {
    return {
      LimitParam: {
        name: 'limit',
        in: 'query',
        description: 'Anzahl der zurückzugebenden Elemente',
        required: false,
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 20
        }
      },
      OffsetParam: {
        name: 'offset',
        in: 'query',
        description: 'Anzahl der zu überspringenden Elemente',
        required: false,
        schema: {
          type: 'integer',
          minimum: 0,
          default: 0
        }
      }
    }
  }

  /**
   * 生成示例
   */
  private generateExamples(): Record<string, Example> {
    return {
      CompoundInterestExample: {
        summary: 'Zinseszins-Berechnung Beispiel',
        description: 'Beispiel für eine typische Zinseszins-Berechnung',
        value: {
          principal: 10000,
          monthlyPayment: 200,
          annualRate: 5.5,
          years: 20,
          compoundFrequency: 'monthly'
        }
      }
    }
  }

  /**
   * 生成安全方案
   */
  private generateSecuritySchemes(): Record<string, SecurityScheme> {
    return {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Bearer Token Authentifizierung'
      },
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API Key Authentifizierung für Enterprise-Kunden'
      }
    }
  }

  /**
   * 生成安全要求
   */
  private generateSecurity(): SecurityRequirement[] {
    return [
      { BearerAuth: [] },
      { ApiKeyAuth: [] }
    ]
  }

  /**
   * 生成标签
   */
  private generateTags(): Tag[] {
    return [
      {
        name: 'Authentication',
        description: 'Benutzerauthentifizierung und -verwaltung'
      },
      {
        name: 'Calculators',
        description: 'Finanzrechner und Berechnungen'
      },
      {
        name: 'Users',
        description: 'Benutzerprofil und -einstellungen'
      },
      {
        name: 'History',
        description: 'Berechnungshistorie und -verwaltung'
      },
      {
        name: 'Goals',
        description: 'Finanzielle Ziele und Tracking'
      },
      {
        name: 'Analytics',
        description: 'Datenanalyse und Berichte'
      }
    ]
  }

  // 辅助方法
  private getCalculatorName(type: CalculatorType): string {
    const names = {
      'compound-interest': 'Zinseszins',
      'loan': 'Darlehen',
      'mortgage': 'Baufinanzierung'
    }
    return names[type] || type
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  private getCalculatorExample(type: CalculatorType): any {
    const examples = {
      'compound-interest': {
        principal: 10000,
        monthlyPayment: 200,
        annualRate: 5.5,
        years: 20,
        compoundFrequency: 'monthly'
      },
      'loan': {
        principal: 200000,
        annualRate: 3.5,
        termYears: 25,
        paymentType: 'annuity'
      },
      'mortgage': {
        purchasePrice: 400000,
        downPayment: 80000,
        annualRate: 3.8,
        termYears: 25
      }
    }
    return examples[type] || {}
  }
}

// 导出单例实例
export const apiDocGenerator = new ApiDocGenerator()

// 导出类型
export type {
  OpenApiSpec,
  ApiInfo,
  PathItem,
  Operation,
  Schema,
  Components
}
