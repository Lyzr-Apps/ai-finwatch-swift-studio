import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  LayoutDashboard,
  Flag,
  FileText,
  Database,
  Settings,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Upload,
  Download,
  Send,
  Filter,
  Search,
  BarChart,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  DollarSign,
  Shield,
  Activity,
  Loader2,
  X,
  ChevronRight,
  PlayCircle
} from 'lucide-react'
import { callAIAgent } from '@/utils/aiAgent'
import type { NormalizedAgentResponse } from '@/utils/aiAgent'
import { cn } from '@/lib/utils'

// Agent IDs from workflow.json
const WORKFLOW_COORDINATOR_ID = "696f93f13bd35d7a6606c88c"
const DATA_VALIDATION_ID = "696f93953bd35d7a6606c885"
const COMPLIANCE_ANALYSIS_ID = "696f93b4b50537828e0b233f"
const FLAG_CLASSIFICATION_ID = "696f93d1b50537828e0b2349"
const REPORT_GENERATION_ID = "696f942ab50537824e0b235b"

// TypeScript interfaces from actual test responses

// Workflow Coordinator Response
interface FlagItem {
  flag_id: string
  category: string
  severity: string
  title: string
  description: string
  source: string
  priority_score: number
  recommended_action: string
  assigned_to: string
}

interface WorkflowSummary {
  total_records_processed: number
  data_quality_issues: number
  compliance_violations: number
  total_flags: number
  high_priority_flags: number
}

interface DashboardInsights {
  critical_alerts: number
  trends: string
  top_risk_areas: string[]
  recommended_focus: string
}

interface SubAgentResults {
  data_validation: string
  compliance_analysis: string
  flag_classification: string
}

interface WorkflowCoordinatorResult {
  workflow_summary: WorkflowSummary
  prioritized_flags: FlagItem[]
  dashboard_insights: DashboardInsights
  sub_agent_results: SubAgentResults
}

// Report Generation Response
interface ReportMetadata {
  report_id: string
  reporting_period: string
  generated_at: string
  recipients: string[]
}

interface ExecutiveSummary {
  total_flags: number
  high_priority_flags: number
  trend: string
  key_highlights: string[]
  critical_actions_required: string[]
}

interface WeeklyTrends {
  flag_volume_trend: string
  category_breakdown: Record<string, number>
  severity_distribution: Record<string, number>
}

interface StakeholderSummary {
  stakeholder: string
  assigned_flags: number
  high_priority: number
  action_items: string[]
}

interface KPITracking {
  data_quality_score: number
  compliance_rate: number
  average_resolution_time: string
  flags_resolved: number
  flags_pending: number
}

interface ReportGenerationResult {
  report_metadata: ReportMetadata
  executive_summary: ExecutiveSummary
  weekly_trends: WeeklyTrends
  stakeholder_summaries: StakeholderSummary[]
  kpi_tracking: KPITracking
  recommendations: string[]
  email_status: {
    sent: boolean
    sent_to: string[]
    send_time: string | null
  }
}

// Data Source Card Component
function DataSourceCard({ name, status, lastSync, recordCount, onSync }: {
  name: string
  status: 'active' | 'syncing' | 'error'
  lastSync: string
  recordCount: number
  onSync: () => void
}) {
  const statusConfig = {
    active: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', text: 'Active' },
    syncing: { icon: Loader2, color: 'text-amber-500', bg: 'bg-amber-500/10', text: 'Syncing' },
    error: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10', text: 'Error' }
  }

  const config = statusConfig[status]
  const StatusIcon = config.icon

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg">{name}</CardTitle>
          <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full", config.bg)}>
            <StatusIcon className={cn("h-4 w-4", config.color, status === 'syncing' && "animate-spin")} />
            <span className={cn("text-sm font-medium", config.color)}>{config.text}</span>
          </div>
        </div>
        <CardDescription className="text-gray-400">
          Last sync: {lastSync}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-400">Records</span>
          <span className="text-2xl font-bold text-white">{recordCount.toLocaleString()}</span>
        </div>
        <Button
          onClick={onSync}
          disabled={status === 'syncing'}
          className="w-full"
          variant="outline"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", status === 'syncing' && "animate-spin")} />
          Sync Now
        </Button>
      </CardContent>
    </Card>
  )
}

// Flag Detail Dialog Component
function FlagDetailDialog({ flag, onClose, onResolve }: {
  flag: FlagItem | null
  onClose: () => void
  onResolve: () => void
}) {
  if (!flag) return null

  const severityConfig = {
    High: { color: 'text-red-500', bg: 'bg-red-500/10', icon: AlertCircle },
    Medium: { color: 'text-amber-500', bg: 'bg-amber-500/10', icon: AlertTriangle },
    Low: { color: 'text-green-500', bg: 'bg-green-500/10', icon: CheckCircle }
  }

  const config = severityConfig[flag.severity as keyof typeof severityConfig] || severityConfig.Medium
  const SeverityIcon = config.icon

  return (
    <Dialog open={!!flag} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <SeverityIcon className={cn("h-6 w-6", config.color)} />
            {flag.title}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Flag ID: {flag.flag_id} | Category: {flag.category}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-gray-400">Severity</Label>
            <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full mt-1", config.bg)}>
              <span className={cn("text-sm font-semibold", config.color)}>{flag.severity}</span>
              <span className="text-gray-400">Priority Score: {flag.priority_score}</span>
            </div>
          </div>

          <Separator className="bg-gray-700" />

          <div>
            <Label className="text-gray-400">Description</Label>
            <p className="text-white mt-1">{flag.description}</p>
          </div>

          <div>
            <Label className="text-gray-400">Recommended Action</Label>
            <p className="text-white mt-1">{flag.recommended_action}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-400">Source</Label>
              <p className="text-white mt-1">{flag.source}</p>
            </div>
            <div>
              <Label className="text-gray-400">Assigned To</Label>
              <p className="text-white mt-1">{flag.assigned_to}</p>
            </div>
          </div>

          <Separator className="bg-gray-700" />

          <div>
            <Label className="text-gray-400">Audit Trail</Label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-gray-400">Created: 2026-01-20 14:45:00</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-gray-500" />
                <span className="text-gray-400">Status: Open</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onResolve} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark Resolved
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Main Application Component
export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(false)
  const [analysisInput, setAnalysisInput] = useState('')
  const [workflowResponse, setWorkflowResponse] = useState<WorkflowCoordinatorResult | null>(null)
  const [reportResponse, setReportResponse] = useState<ReportGenerationResult | null>(null)
  const [selectedFlag, setSelectedFlag] = useState<FlagItem | null>(null)
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [reportType, setReportType] = useState('weekly')
  const [reportLoading, setReportLoading] = useState(false)

  // Demo data sources
  const [dataSources] = useState([
    { name: 'Swift Payments API', status: 'active' as const, lastSync: '2 min ago', recordCount: 1247 },
    { name: 'Accounting Ledger', status: 'active' as const, lastSync: '5 min ago', recordCount: 3892 },
    { name: 'Insurance PDFs', status: 'syncing' as const, lastSync: '1 hour ago', recordCount: 156 },
    { name: 'Broker Reports', status: 'active' as const, lastSync: '10 min ago', recordCount: 89 }
  ])

  // Load demo data on mount
  useEffect(() => {
    const demoData: WorkflowCoordinatorResult = {
      workflow_summary: {
        total_records_processed: 3,
        data_quality_issues: 3,
        compliance_violations: 3,
        total_flags: 3,
        high_priority_flags: 2
      },
      prioritized_flags: [
        {
          flag_id: "flag-002",
          category: "Insurance",
          severity: "High",
          title: "Overdue/Lapsed Insurance Renewal",
          description: "Insurance policy was due for renewal on 2026-01-10 but the renewal has not been processed, potentially resulting in lapses of coverage.",
          source: "Compliance",
          priority_score: 100,
          recommended_action: "Immediate escalation to risk management and insurance broker. Expedite insurance policy renewal and implement automated renewal tracking.",
          assigned_to: "Risk & Insurance Team"
        },
        {
          flag_id: "flag-001",
          category: "Budget",
          severity: "High",
          title: "Budget Overrun on Swift Payment",
          description: "A swift payment of $150,000 was executed against an approved budget of $120,000, resulting in a $30,000 overrun.",
          source: "Compliance",
          priority_score: 95,
          recommended_action: "Immediate investigation and justification for overrun. Strengthen approval workflow and integrate automated alerts.",
          assigned_to: "Finance Department"
        },
        {
          flag_id: "flag-003",
          category: "Operational",
          severity: "Medium",
          title: "SLA Breach - Broker Report Task C Review Pending",
          description: "Task C within the broker report review process has been pending for 8 days, exceeding the operational SLA for task completion.",
          source: "Compliance",
          priority_score: 72,
          recommended_action: "Reassign or escalate Task C review. Review and optimize workload allocation; automate SLA tracking.",
          assigned_to: "Operations Team Lead"
        }
      ],
      dashboard_insights: {
        critical_alerts: 2,
        trends: "Multiple high-severity, time-sensitive compliance violations - repeat issues in budget controls and insurance renewals indicate systemic process risk.",
        top_risk_areas: ["Insurance", "Budget"],
        recommended_focus: "Immediate attention required for insurance renewal lapse and over-budget payment. Escalate both to respective senior teams."
      },
      sub_agent_results: {
        data_validation: "3 records processed. All had data quality or integrity issues (out-of-range amounts, overdue renewal, SLA-breached task). Recommendations included automating data entry controls and deadline alerts.",
        compliance_analysis: "3 compliance violations detected: budget overrun, insurance lapse, and SLA breach. All compared against benchmarks showed above-average risk and non-compliance.",
        flag_classification: "2 high-severity flags (insurance lapse, budget overrun), 1 medium (SLA breach). Root causes linked to manual processes, poor controls, and lack of escalation."
      }
    }
    setWorkflowResponse(demoData)
  }, [])

  const handleRunAnalysis = async () => {
    if (!analysisInput.trim()) {
      setAnalysisInput("Analyze the following financial data: Swift payment of $150,000 to Vendor ABC dated 2026-01-15, budget allocated $120,000. Insurance policy renewal due 2026-01-10 but not yet processed. Broker report shows Task C review pending for 8 days.")
      return
    }

    setLoading(true)
    try {
      const result = await callAIAgent(analysisInput, WORKFLOW_COORDINATOR_ID)

      if (result.success && result.response.status === 'success') {
        setWorkflowResponse(result.response.result as WorkflowCoordinatorResult)
      }
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = async () => {
    setReportLoading(true)
    try {
      const message = `Generate ${reportType} summary report for week ending 2026-01-20. Flags detected: 12 High severity (8 Budget, 3 Insurance, 1 Operational), 18 Medium, 5 Low. Total flags resolved: 22. Top issues: Budget overages in Marketing department, Insurance renewal delays. KPI: Average flag resolution time 2.3 days.`

      const result = await callAIAgent(message, REPORT_GENERATION_ID)

      if (result.success && result.response.status === 'success') {
        setReportResponse(result.response.result as ReportGenerationResult)
      }
    } catch (error) {
      console.error('Report generation failed:', error)
    } finally {
      setReportLoading(false)
    }
  }

  const getSeverityBadge = (severity: string) => {
    const config = {
      High: 'bg-red-500/10 text-red-500 border-red-500/20',
      Medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      Low: 'bg-green-500/10 text-green-500 border-green-500/20'
    }
    return config[severity as keyof typeof config] || config.Medium
  }

  const getCategoryIcon = (category: string) => {
    const icons = {
      Budget: DollarSign,
      Insurance: Shield,
      Operational: Activity
    }
    const Icon = icons[category as keyof typeof icons] || Activity
    return <Icon className="h-4 w-4" />
  }

  const filteredFlags = workflowResponse?.prioritized_flags.filter(flag => {
    if (filterSeverity !== 'all' && flag.severity !== filterSeverity) return false
    if (filterCategory !== 'all' && flag.category !== filterCategory) return false
    return true
  }) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1f36] via-gray-900 to-gray-800">
      {/* Top Navigation */}
      <div className="border-b border-white/10 bg-[#1a1f36]/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">AIF-MAA</h1>
                <p className="text-xs text-gray-400">AI Financial Workflow Monitor</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="border-green-500/20 bg-green-500/10 text-green-500">
                <Activity className="h-3 w-3 mr-1" />
                System Online
              </Badge>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5 text-gray-400" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 border-r border-white/10 bg-[#1a1f36]/50 min-h-[calc(100vh-73px)] p-4">
          <nav className="space-y-2">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { id: 'flags', icon: Flag, label: 'Flags Management' },
              { id: 'reports', icon: FileText, label: 'Reports' },
              { id: 'datasources', icon: Database, label: 'Data Sources' }
            ].map(item => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                    activeTab === item.id
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white">Dashboard</h2>
                  <p className="text-gray-400 mt-1">Real-time financial workflow monitoring</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setAnalysisInput('')}
                    className="border-white/10 text-white hover:bg-white/5"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Data
                  </Button>
                  <Button
                    onClick={handleRunAnalysis}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Run Analysis
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Stats Row */}
              {workflowResponse ? (
                <div className="grid grid-cols-4 gap-4">
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-400">Total Active Flags</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-bold text-white">
                          {workflowResponse.workflow_summary.total_flags}
                        </span>
                        <Flag className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-400">High Severity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-bold text-red-500">
                          {workflowResponse.workflow_summary.high_priority_flags}
                        </span>
                        <AlertCircle className="h-8 w-8 text-red-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-400">Compliance Violations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-bold text-amber-500">
                          {workflowResponse.workflow_summary.compliance_violations}
                        </span>
                        <Shield className="h-8 w-8 text-amber-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 border-white/10">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-400">Data Quality Issues</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-bold text-white">
                          {workflowResponse.workflow_summary.data_quality_issues}
                        </span>
                        <Database className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <Card key={i} className="bg-white/5 border-white/10">
                      <CardHeader className="pb-3">
                        <Skeleton className="h-4 w-24 bg-white/10" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-10 w-16 bg-white/10" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Main Content Grid */}
              <div className="grid grid-cols-3 gap-6">
                {/* Flags List - Left 2 columns */}
                <div className="col-span-2">
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">Top Priority Flags</CardTitle>
                      <CardDescription className="text-gray-400">
                        Sorted by severity and priority score
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map(i => (
                            <Skeleton key={i} className="h-24 w-full bg-white/10" />
                          ))}
                        </div>
                      ) : workflowResponse ? (
                        <ScrollArea className="h-[400px]">
                          <div className="space-y-3">
                            {workflowResponse.prioritized_flags.map(flag => (
                              <div
                                key={flag.flag_id}
                                onClick={() => setSelectedFlag(flag)}
                                className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer transition-all"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    {getCategoryIcon(flag.category)}
                                    <span className="font-semibold text-white">{flag.title}</span>
                                  </div>
                                  <Badge className={getSeverityBadge(flag.severity)}>
                                    {flag.severity}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-400 mb-2">{flag.description}</p>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-500">ID: {flag.flag_id}</span>
                                  <span className="text-gray-500">Priority: {flag.priority_score}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      ) : null}
                    </CardContent>
                  </Card>
                </div>

                {/* Activity Timeline - Right column */}
                <div>
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">Activity Timeline</CardTitle>
                      <CardDescription className="text-gray-400">Recent events</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-4">
                          {workflowResponse?.prioritized_flags.map((flag, idx) => (
                            <div key={flag.flag_id} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className={cn(
                                  "h-8 w-8 rounded-full flex items-center justify-center",
                                  flag.severity === 'High' ? 'bg-red-500/10' :
                                  flag.severity === 'Medium' ? 'bg-amber-500/10' : 'bg-green-500/10'
                                )}>
                                  <AlertCircle className={cn(
                                    "h-4 w-4",
                                    flag.severity === 'High' ? 'text-red-500' :
                                    flag.severity === 'Medium' ? 'text-amber-500' : 'text-green-500'
                                  )} />
                                </div>
                                {idx < (workflowResponse?.prioritized_flags.length || 0) - 1 && (
                                  <div className="w-0.5 h-12 bg-white/10 mt-2" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-white">{flag.category} Flag</p>
                                <p className="text-xs text-gray-400 mt-1">{flag.assigned_to}</p>
                                <p className="text-xs text-gray-500 mt-1">Just now</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Insights Card */}
              {workflowResponse?.dashboard_insights && (
                <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Dashboard Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-gray-400">Trends Analysis</Label>
                      <p className="text-white mt-1">{workflowResponse.dashboard_insights.trends}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Recommended Focus</Label>
                      <p className="text-white mt-1">{workflowResponse.dashboard_insights.recommended_focus}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Top Risk Areas</Label>
                      <div className="flex gap-2 mt-2">
                        {workflowResponse.dashboard_insights.top_risk_areas.map((area, idx) => (
                          <Badge key={idx} className="bg-red-500/10 text-red-500 border-red-500/20">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Flags Management Tab */}
          {activeTab === 'flags' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white">Flags Management</h2>
                  <p className="text-gray-400 mt-1">Monitor and manage compliance flags</p>
                </div>
              </div>

              {/* Filters */}
              <Card className="bg-white/5 border-white/10">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label className="text-gray-400">Severity</Label>
                      <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-700">
                          <SelectItem value="all">All Severities</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label className="text-gray-400">Category</Label>
                      <Select value={filterCategory} onValueChange={setFilterCategory}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-700">
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="Budget">Budget</SelectItem>
                          <SelectItem value="Insurance">Insurance</SelectItem>
                          <SelectItem value="Operational">Operational</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label className="text-gray-400">Search</Label>
                      <div className="relative mt-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          placeholder="Search flags..."
                          className="pl-10 bg-white/5 border-white/10 text-white"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Flags Table */}
              <Card className="bg-white/5 border-white/10">
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-white/5">
                        <TableHead className="text-gray-400">ID</TableHead>
                        <TableHead className="text-gray-400">Type</TableHead>
                        <TableHead className="text-gray-400">Severity</TableHead>
                        <TableHead className="text-gray-400">Title</TableHead>
                        <TableHead className="text-gray-400">Assigned To</TableHead>
                        <TableHead className="text-gray-400">Priority</TableHead>
                        <TableHead className="text-gray-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFlags.map(flag => (
                        <TableRow
                          key={flag.flag_id}
                          className="border-white/10 hover:bg-white/5 cursor-pointer"
                          onClick={() => setSelectedFlag(flag)}
                        >
                          <TableCell className="text-white font-mono text-xs">{flag.flag_id}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-white">
                              {getCategoryIcon(flag.category)}
                              <span>{flag.category}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getSeverityBadge(flag.severity)}>
                              {flag.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-white max-w-xs truncate">{flag.title}</TableCell>
                          <TableCell className="text-gray-400">{flag.assigned_to}</TableCell>
                          <TableCell className="text-white font-semibold">{flag.priority_score}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white">Reports</h2>
                  <p className="text-gray-400 mt-1">Generate and view compliance reports</p>
                </div>
                <Button
                  onClick={handleGenerateReport}
                  disabled={reportLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {reportLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>

              {/* Report Type Selector */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Report Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {['weekly', 'monthly', 'stakeholder'].map(type => (
                      <button
                        key={type}
                        onClick={() => setReportType(type)}
                        className={cn(
                          "p-4 rounded-lg border transition-all",
                          reportType === type
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-white/10 bg-white/5 hover:bg-white/10"
                        )}
                      >
                        <div className="text-left">
                          <p className={cn(
                            "font-semibold capitalize",
                            reportType === type ? "text-blue-400" : "text-white"
                          )}>
                            {type} Summary
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {type === 'weekly' && 'Last 7 days analysis'}
                            {type === 'monthly' && 'Monthly trend report'}
                            {type === 'stakeholder' && 'Team-specific breakdown'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Report Preview */}
              {reportResponse && (
                <div className="space-y-6">
                  {/* Executive Summary */}
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">Executive Summary</CardTitle>
                      <CardDescription className="text-gray-400">
                        Period: {reportResponse.report_metadata.reporting_period}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                          <p className="text-sm text-gray-400">Total Flags</p>
                          <p className="text-3xl font-bold text-white mt-1">
                            {reportResponse.executive_summary.total_flags}
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                          <p className="text-sm text-gray-400">High Priority</p>
                          <p className="text-3xl font-bold text-red-500 mt-1">
                            {reportResponse.executive_summary.high_priority_flags}
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                          <p className="text-sm text-gray-400">Trend</p>
                          <div className="flex items-center gap-2 mt-1">
                            {reportResponse.executive_summary.trend === 'declining' ? (
                              <TrendingDown className="h-6 w-6 text-green-500" />
                            ) : (
                              <TrendingUp className="h-6 w-6 text-red-500" />
                            )}
                            <span className={cn(
                              "text-xl font-bold capitalize",
                              reportResponse.executive_summary.trend === 'declining' ? "text-green-500" : "text-red-500"
                            )}>
                              {reportResponse.executive_summary.trend}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Separator className="bg-white/10" />

                      <div>
                        <Label className="text-gray-400">Key Highlights</Label>
                        <ul className="mt-2 space-y-2">
                          {reportResponse.executive_summary.key_highlights.map((highlight, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-white">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <Label className="text-gray-400">Critical Actions Required</Label>
                        <ul className="mt-2 space-y-2">
                          {reportResponse.executive_summary.critical_actions_required.map((action, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-white">
                              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  {/* KPI Tracking */}
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">KPI Tracking</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-gray-400">Data Quality Score</Label>
                            <span className="text-2xl font-bold text-white">
                              {reportResponse.kpi_tracking.data_quality_score}%
                            </span>
                          </div>
                          <Progress
                            value={reportResponse.kpi_tracking.data_quality_score}
                            className="h-2"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-gray-400">Compliance Rate</Label>
                            <span className="text-2xl font-bold text-white">
                              {reportResponse.kpi_tracking.compliance_rate}%
                            </span>
                          </div>
                          <Progress
                            value={reportResponse.kpi_tracking.compliance_rate}
                            className="h-2"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-400">Average Resolution Time</Label>
                          <p className="text-2xl font-bold text-white mt-1">
                            {reportResponse.kpi_tracking.average_resolution_time}
                          </p>
                        </div>
                        <div>
                          <Label className="text-gray-400">Flags Status</Label>
                          <div className="flex gap-4 mt-1">
                            <div>
                              <p className="text-sm text-gray-400">Resolved</p>
                              <p className="text-xl font-bold text-green-500">
                                {reportResponse.kpi_tracking.flags_resolved}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Pending</p>
                              <p className="text-xl font-bold text-amber-500">
                                {reportResponse.kpi_tracking.flags_pending}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Stakeholder Summaries */}
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">Stakeholder Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        {reportResponse.stakeholder_summaries.map((stakeholder, idx) => (
                          <Card key={idx} className="bg-white/5 border-white/10">
                            <CardHeader>
                              <CardTitle className="text-white text-lg flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                {stakeholder.stakeholder}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Assigned Flags</span>
                                <span className="text-white font-semibold">{stakeholder.assigned_flags}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">High Priority</span>
                                <span className="text-red-500 font-semibold">{stakeholder.high_priority}</span>
                              </div>
                              <Separator className="bg-white/10" />
                              <div>
                                <Label className="text-gray-400 text-xs">Action Items</Label>
                                <ul className="mt-2 space-y-1">
                                  {stakeholder.action_items.map((item, i) => (
                                    <li key={i} className="text-sm text-white flex items-start gap-2">
                                      <span className="text-blue-400 flex-shrink-0">•</span>
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="pt-6">
                      <div className="flex gap-3">
                        <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                        <Button className="flex-1 bg-green-600 hover:bg-green-700">
                          <Send className="h-4 w-4 mr-2" />
                          Email Report
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* Data Sources Tab */}
          {activeTab === 'datasources' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white">Data Sources</h2>
                  <p className="text-gray-400 mt-1">Manage financial data integrations</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
              </div>

              {/* Data Source Cards */}
              <div className="grid grid-cols-2 gap-4">
                {dataSources.map((source, idx) => (
                  <DataSourceCard
                    key={idx}
                    name={source.name}
                    status={source.status}
                    lastSync={source.lastSync}
                    recordCount={source.recordCount}
                    onSync={() => console.log('Sync', source.name)}
                  />
                ))}
              </div>

              {/* Upload Zone */}
              <Card className="bg-white/5 border-white/10 border-dashed">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                      <Upload className="h-8 w-8 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Upload Financial Documents
                    </h3>
                    <p className="text-gray-400 mb-6">
                      Drag and drop PDF, CSV, or Excel files here
                    </p>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Select Files
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Uploads */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Recent Uploads</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-white/5">
                        <TableHead className="text-gray-400">File Name</TableHead>
                        <TableHead className="text-gray-400">Type</TableHead>
                        <TableHead className="text-gray-400">Size</TableHead>
                        <TableHead className="text-gray-400">Uploaded</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="border-white/10 hover:bg-white/5">
                        <TableCell className="text-white">insurance_policy_2026.pdf</TableCell>
                        <TableCell className="text-gray-400">PDF</TableCell>
                        <TableCell className="text-gray-400">2.4 MB</TableCell>
                        <TableCell className="text-gray-400">2 hours ago</TableCell>
                        <TableCell>
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                            Processed
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow className="border-white/10 hover:bg-white/5">
                        <TableCell className="text-white">swift_payments_q1.csv</TableCell>
                        <TableCell className="text-gray-400">CSV</TableCell>
                        <TableCell className="text-gray-400">856 KB</TableCell>
                        <TableCell className="text-gray-400">5 hours ago</TableCell>
                        <TableCell>
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                            Processed
                          </Badge>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Flag Detail Dialog */}
      <FlagDetailDialog
        flag={selectedFlag}
        onClose={() => setSelectedFlag(null)}
        onResolve={() => {
          console.log('Resolved:', selectedFlag?.flag_id)
          setSelectedFlag(null)
        }}
      />
    </div>
  )
}
