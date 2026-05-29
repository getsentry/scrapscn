import { ThemeToggle } from "@/components/theme-toggle";
import { CopyButton } from "@/components/copy-button";
import { CodePreview } from "@/components/code-preview";
import { SentryWordmark, SentryGlyph } from "@/components/sentry-logo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "@/components/ui/link";
import { Tag } from "@/components/ui/tag";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  ArrowUpRight,
  Bug,
  CheckCircle2,
  Clock,
  ExternalLink,
  GitBranch,
  Layers,
  Terminal,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

const BRAND_COLORS = [
  { name: "Black", hex: "#181225", ring: "ring-border" },
  { name: "Blurple", hex: "#7553FF", ring: "" },
  { name: "Violet", hex: "#36166B", ring: "" },
  { name: "Hot Pink", hex: "#FF45A8", ring: "" },
  { name: "Orchid", hex: "#A737B4", ring: "" },
  { name: "Yorange", hex: "#FDB81B", ring: "" },
  { name: "Green", hex: "#92DD00", ring: "" },
  { name: "!White", hex: "#F6F6F8", ring: "ring-border" },
  { name: "White", hex: "#FFFFFF", ring: "ring-border" },
];

const ISSUES = [
  {
    id: "FRONT-4KP",
    title: "TypeError: Cannot read properties of undefined (reading 'map')",
    project: "frontend",
    events: "2.8k",
    users: 412,
    firstSeen: "2h ago",
    trend: "up" as const,
  },
  {
    id: "API-3J2",
    title: "ConnectionError: Connection refused to database pool",
    project: "api-service",
    events: "1.2k",
    users: 89,
    firstSeen: "45m ago",
    trend: "up" as const,
  },
  {
    id: "FRONT-4KN",
    title: "Warning: Each child in a list should have a unique key prop",
    project: "frontend",
    events: "847",
    users: 203,
    firstSeen: "3d ago",
    trend: "down" as const,
  },
  {
    id: "WORKER-91",
    title: "TimeoutError: Task exceeded maximum execution time (30s)",
    project: "task-worker",
    events: "234",
    users: 18,
    firstSeen: "1w ago",
    trend: "down" as const,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center gap-2.5">
              <SentryGlyph size={24} />
              <span className="text-sm font-medium text-muted-foreground">
                /
              </span>
              <span className="font-medium tracking-tight">scrapscn</span>
            </a>
            <nav className="hidden items-center gap-5 text-sm sm:flex">
              <Link variant="muted" href="#components">
                Components
              </Link>
              <Link variant="muted" href="#tokens">
                Tokens
              </Link>
              <Link variant="muted" href="#voice">
                Voice
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link variant="muted" href="/storybook" external>
              Storybook <ExternalLink className="h-3 w-3" />
            </Link>
            <Link
              variant="muted"
              href="https://github.com/getsentry/scrapscn"
              external
            >
              GitHub <ExternalLink className="h-3 w-3" />
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main>
        {/* Hero — full gradient in light mode, texture in dark */}
        <section
          className="relative overflow-hidden border-b"
          style={{
            background:
              "linear-gradient(135deg, #181225 0%, #36166B 30%, #7553FF 60%, #A737B4 100%)",
          }}
        >
          <div className="absolute inset-0 bg-[url('/fuzzy-dot-bg.png')] bg-cover bg-center opacity-30" />
          <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32">
            <div className="max-w-3xl space-y-6">
              <Badge className="bg-white/15 text-white border-white/20 gap-1.5 backdrop-blur-sm">
                <Zap className="h-3 w-3" /> shadcn registry
              </Badge>
              <h1 className="font-heading text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
                Sentry&apos;s design system, built for&nbsp;shadcn
              </h1>
              <p className="max-w-xl text-lg text-white/70 leading-relaxed">
                Drop in Sentry&apos;s purple-tinted neutrals, Blurple accent,
                and Rubik typography. One install gives you the complete theme
                for both light and dark&nbsp;modes.
              </p>
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <div className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2.5 font-mono text-sm text-white">
                  <Terminal className="h-4 w-4 text-white/60 shrink-0" />
                  <code>npx shadcn add https://scrapscn.sentry.dev/r</code>
                  <CopyButton text="npx shadcn add https://scrapscn.sentry.dev/r" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-6">
          {/* Stat cards */}
          <section className="py-16 space-y-8">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="font-heading text-2xl font-bold" id="components">
                  What you get
                </h2>
                <p className="text-muted-foreground">
                  Everything maps to standard shadcn tokens. Your components
                  just work.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" /> Semantic tokens
                  </CardDescription>
                  <CardTitle className="text-3xl font-heading">26</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Light + dark mode CSS variables, including Sentry-specific
                    warning, success, and promotion
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1.5">
                    <Bug className="h-3.5 w-3.5" /> Components
                  </CardDescription>
                  <CardTitle className="text-3xl font-heading">13+</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    All standard shadcn components, pre-themed with
                    Sentry&apos;s color system
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1.5">
                    <GitBranch className="h-3.5 w-3.5" /> Fonts
                  </CardDescription>
                  <CardTitle className="text-3xl font-heading">3</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Dammit Sans (headlines), Rubik (body), Roboto Mono (code)
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Setup time
                  </CardDescription>
                  <CardTitle className="text-3xl font-heading">&lt;1m</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    One CLI command. Theme swaps in, components just work.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          <Separator />

          {/* Theme preview — both modes side by side */}
          <section className="py-16 space-y-8">
            <div>
              <h2 className="font-heading text-2xl font-bold">
                Both modes, one theme
              </h2>
              <p className="text-muted-foreground">
                Purple-tinted neutrals in both directions. Dark mode
                isn&apos;t an afterthought — it&apos;s where Sentry
                lives.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Light preview */}
              <div className="rounded-xl border bg-white p-6 space-y-4 text-[#302E36]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#6A6772]">
                    Light mode
                  </span>
                  <div className="h-5 w-5 rounded-full bg-primary" />
                </div>
                <Card className="bg-card">
                  <CardContent className="space-y-2">
                    <div className="text-sm font-medium">
                      ConnectionError in api-service
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Connection refused to database pool — 1.2k events, 89
                      users affected
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Badge variant="danger">Fatal</Badge>
                      <Badge variant="muted">api-service</Badge>
                    </div>
                  </CardContent>
                </Card>
                <div className="flex gap-2">
                  <Button size="xs">Resolve</Button>
                  <Button size="xs" variant="secondary">Ignore</Button>
                </div>
              </div>

              {/* Dark preview */}
              <div className="dark rounded-xl border border-[#46404F] bg-[#2E2936] p-6 space-y-4 text-[#E7E5EA]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#A49EAE]">
                    Dark mode
                  </span>
                  <div className="h-5 w-5 rounded-full bg-primary" />
                </div>
                <Card className="bg-card">
                  <CardContent className="space-y-2">
                    <div className="text-sm font-medium">
                      ConnectionError in api-service
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Connection refused to database pool — 1.2k events, 89
                      users affected
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Badge variant="danger">Fatal</Badge>
                      <Badge variant="muted">api-service</Badge>
                    </div>
                  </CardContent>
                </Card>
                <div className="flex gap-2">
                  <Button size="xs">Resolve</Button>
                  <Button size="xs" variant="secondary">Ignore</Button>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Component showcase — real Sentry-like UI */}
          <section className="py-16 space-y-8" id="tokens">
            <div>
              <h2 className="font-heading text-2xl font-bold">
                Components in action
              </h2>
              <p className="text-muted-foreground">
                These look like Sentry because they use Sentry&apos;s tokens.
                Not custom CSS — just the theme doing its&nbsp;job.
              </p>
            </div>

            <Tabs defaultValue="dashboard" className="w-full">
              <TabsList>
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="buttons">Buttons & badges</TabsTrigger>
                <TabsTrigger value="forms">Forms</TabsTrigger>
                <TabsTrigger value="alerts">Alerts</TabsTrigger>
              </TabsList>

              {/* Dashboard */}
              <TabsContent value="dashboard" className="space-y-6 pt-6">
                {/* Metric row */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardDescription>Unresolved issues</CardDescription>
                      <TrendingUp className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-heading font-bold">
                        1,284
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="text-destructive font-medium">
                          +12%
                        </span>{" "}
                        from last week
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardDescription>Crash-free sessions</CardDescription>
                      <TrendingUp className="h-4 w-4 text-success" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-heading font-bold">
                        99.2%
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="text-success font-medium">+0.3%</span>{" "}
                        since last release
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardDescription>Events (24h)</CardDescription>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-heading font-bold">
                        4.2M
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Across 12 projects
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Issues table */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Issues</CardTitle>
                      <CardDescription>
                        Unresolved errors across all projects
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select defaultValue="all">
                        <SelectTrigger className="h-8 w-[140px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All projects</SelectItem>
                          <SelectItem value="frontend">frontend</SelectItem>
                          <SelectItem value="api">api-service</SelectItem>
                          <SelectItem value="worker">task-worker</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Issue</TableHead>
                          <TableHead className="hidden sm:table-cell">
                            Project
                          </TableHead>
                          <TableHead className="text-right">Events</TableHead>
                          <TableHead className="text-right hidden sm:table-cell">
                            Users
                          </TableHead>
                          <TableHead className="text-right">Seen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ISSUES.map((issue) => (
                          <TableRow key={issue.id}>
                            <TableCell>
                              <div className="flex items-start gap-3">
                                <div
                                  className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                                    issue.trend === "up"
                                      ? "bg-destructive"
                                      : "bg-warning"
                                  }`}
                                />
                                <div className="min-w-0">
                                  <div className="text-sm font-medium font-mono truncate max-w-[400px]">
                                    {issue.title}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {issue.id}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <Badge variant="muted" className="text-xs">
                                {issue.project}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-sm">
                              {issue.events}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-sm hidden sm:table-cell">
                              {issue.users}
                            </TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                              {issue.firstSeen}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Release health */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Release health
                      </CardTitle>
                      <CardDescription>
                        v3.14.2 · deployed 2h ago
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Crash free
                          </span>
                          <span className="font-medium">99.2%</span>
                        </div>
                        <Progress value={99.2} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Adopted</span>
                          <span className="font-medium">87%</span>
                        </div>
                        <Progress value={87} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Sessions
                          </span>
                          <span className="font-medium">24.1k</span>
                        </div>
                        <Progress value={65} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Performance
                      </CardTitle>
                      <CardDescription>Last 24 hours</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        {
                          route: "/api/issues",
                          p50: "45ms",
                          p95: "320ms",
                          tpm: "12.4k",
                        },
                        {
                          route: "/api/events",
                          p50: "23ms",
                          p95: "180ms",
                          tpm: "8.2k",
                        },
                        {
                          route: "/api/users/me",
                          p50: "12ms",
                          p95: "95ms",
                          tpm: "3.1k",
                        },
                        {
                          route: "/api/projects",
                          p50: "67ms",
                          p95: "450ms",
                          tpm: "1.8k",
                        },
                      ].map((tx) => (
                        <div
                          key={tx.route}
                          className="flex items-center justify-between text-sm"
                        >
                          <code className="font-mono text-xs truncate max-w-[160px]">
                            {tx.route}
                          </code>
                          <div className="flex items-center gap-4 text-muted-foreground text-xs tabular-nums">
                            <span>{tx.p50}</span>
                            <span>{tx.p95}</span>
                            <span className="w-12 text-right">{tx.tpm}</span>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                        <span />
                        <div className="flex items-center gap-4">
                          <span>p50</span>
                          <span>p95</span>
                          <span className="w-12 text-right">tpm</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Buttons & Badges */}
              <TabsContent value="buttons" className="space-y-6 pt-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Chonky buttons
                    </h3>
                    <Badge variant="muted" className="text-xs">
                      Sentry signature
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    The default Button has Sentry&apos;s raised
                    &ldquo;embossed&rdquo; depth effect. Hover to lift,
                    click to press. Uses the snap easing curve at 160ms.
                  </p>
                </div>
                <CodePreview
                  code={`<Button>Resolve issue</Button>
<Button variant="secondary">Ignore</Button>
<Button variant="destructive">Delete project</Button>
<Button variant="warning">Quota alert</Button>
<Button variant="outline">View on GitHub</Button>
<Button variant="ghost">Cancel</Button>
<Button variant="link">Learn more</Button>`}
                >
                  <div className="flex flex-wrap gap-3">
                    <Button>
                      Resolve issue <CheckCircle2 className="ml-1.5 h-4 w-4" />
                    </Button>
                    <Button variant="secondary">Ignore</Button>
                    <Button variant="destructive">Delete project</Button>
                    <Button variant="warning">Quota alert</Button>
                    <Button variant="outline">
                      View on GitHub{" "}
                      <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost">Cancel</Button>
                    <Button variant="link">Learn more</Button>
                  </div>
                </CodePreview>

                <CodePreview
                  code={`<Badge variant="muted">Ignored</Badge>
<Badge variant="info">Unresolved</Badge>
<Badge variant="danger">Fatal</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="success">Resolved</Badge>
<Badge variant="promotion">Promoted</Badge>

{/* Feature badges */}
<Badge variant="alpha">Alpha</Badge>
<Badge variant="beta">Beta</Badge>
<Badge variant="new">New</Badge>`}
                >
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="muted">Ignored</Badge>
                      <Badge variant="info">Unresolved</Badge>
                      <Badge variant="danger">Fatal</Badge>
                      <Badge variant="warning">Warning</Badge>
                      <Badge variant="success">Resolved</Badge>
                      <Badge variant="promotion">Promoted</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="alpha">Alpha</Badge>
                      <Badge variant="beta">Beta</Badge>
                      <Badge variant="new">New</Badge>
                    </div>
                  </div>
                </CodePreview>

                <CodePreview
                  code={`<Alert variant="danger">
  <AlertTitle>Spike detected</AlertTitle>
  <AlertDescription>
    TypeError reported 2,847 times in the last hour.
  </AlertDescription>
</Alert>

<Alert variant="warning">
  <AlertTitle>Quota warning</AlertTitle>
  <AlertDescription>
    You've used 87% of your monthly error quota.
  </AlertDescription>
</Alert>`}
                >
                  <div className="w-full space-y-3">
                    <Alert variant="danger">
                      <AlertTitle>Spike detected</AlertTitle>
                      <AlertDescription>
                        TypeError reported 2,847 times in the last hour — 4x
                        above baseline.
                      </AlertDescription>
                    </Alert>
                    <Alert variant="warning">
                      <AlertTitle>Quota warning</AlertTitle>
                      <AlertDescription>
                        You&apos;ve used 87% of your monthly error quota.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CodePreview>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Avatars
                  </h3>
                  <div className="flex gap-2">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        SD
                      </AvatarFallback>
                    </Avatar>
                    <Avatar>
                      <AvatarFallback className="bg-chart-2 text-white text-xs">
                        JM
                      </AvatarFallback>
                    </Avatar>
                    <Avatar>
                      <AvatarFallback className="bg-chart-3 text-[#181225] text-xs">
                        AK
                      </AvatarFallback>
                    </Avatar>
                    <Avatar>
                      <AvatarFallback className="bg-chart-5 text-white text-xs">
                        BV
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              </TabsContent>

              {/* Forms */}
              <TabsContent value="forms" className="space-y-6 pt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Project settings
                    </CardTitle>
                    <CardDescription>
                      Configure your Sentry project
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Project name</Label>
                        <Input id="name" defaultValue="frontend" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="platform">Platform</Label>
                        <Select defaultValue="nextjs">
                          <SelectTrigger id="platform">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nextjs">Next.js</SelectItem>
                            <SelectItem value="react">React</SelectItem>
                            <SelectItem value="node">Node.js</SelectItem>
                            <SelectItem value="python">Python</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dsn">DSN</Label>
                      <Input
                        id="dsn"
                        defaultValue="https://abc123@o0.ingest.sentry.io/456"
                        readOnly
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Release notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Describe what changed..."
                        rows={3}
                      />
                    </div>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="autofix">
                            Auto-fix suggestions
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Let Seer suggest fixes for new issues
                          </p>
                        </div>
                        <Switch id="autofix" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="perf">Performance monitoring</Label>
                          <p className="text-xs text-muted-foreground">
                            Track transaction performance and web vitals
                          </p>
                        </div>
                        <Switch id="perf" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="replay">Session replay</Label>
                          <p className="text-xs text-muted-foreground">
                            Record user sessions for error reproduction
                          </p>
                        </div>
                        <Switch id="replay" />
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Notifications</Label>
                      <div className="flex items-center gap-2">
                        <Checkbox id="email" defaultChecked />
                        <Label htmlFor="email" className="font-normal">Email alerts for new issues</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox id="slack" defaultChecked />
                        <Label htmlFor="slack" className="font-normal">Slack notifications</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox id="webhook" />
                        <Label htmlFor="webhook" className="font-normal">Webhook integration</Label>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <Button variant="secondary">Cancel</Button>
                      <Button>Save changes</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Alerts */}
              <TabsContent value="alerts" className="space-y-4 pt-6">
                <Alert variant="info">
                  <AlertTitle>SDK update available</AlertTitle>
                  <AlertDescription>
                    Your project is using @sentry/nextjs 7.x. Upgrade to 8.x
                    for improved tree-shaking and smaller bundle sizes.
                  </AlertDescription>
                </Alert>
                <Alert variant="danger">
                  <AlertTitle>Spike detected</AlertTitle>
                  <AlertDescription>
                    TypeError: Cannot read properties of undefined has been
                    reported 2,847 times in the last hour — a 4x increase over
                    the baseline. This started after deploy v3.14.2.
                  </AlertDescription>
                </Alert>
                <Alert variant="warning">
                  <AlertTitle>Quota warning</AlertTitle>
                  <AlertDescription>
                    You&apos;ve used 87% of your monthly error quota. Consider
                    adjusting your sample rate or upgrading your plan.
                  </AlertDescription>
                </Alert>
                <Alert variant="success">
                  <AlertTitle>All clear</AlertTitle>
                  <AlertDescription>
                    No new issues in the last 24 hours. Your crash-free rate is
                    holding steady at 99.2%.
                  </AlertDescription>
                </Alert>
                <Alert variant="muted">
                  <AlertTitle>Tip</AlertTitle>
                  <AlertDescription>
                    Set up release tracking to correlate deploys with new issues
                    automatically.
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>
          </section>

          <Separator />

          {/* Block: Error detail page */}
          <section className="py-16 space-y-8">
            <div>
              <h2 className="font-heading text-2xl font-bold">
                Blocks
              </h2>
              <p className="text-muted-foreground">
                Composed layouts built entirely from themed shadcn components.
                No custom CSS — just the tokens doing their&nbsp;job.
              </p>
            </div>

            <Card>
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="danger">Fatal</Badge>
                    <Badge variant="muted" className="text-xs">
                      FRONT-4KP
                    </Badge>
                  </div>
                  <CardTitle className="font-mono text-base">
                    TypeError: Cannot read properties of undefined
                    (reading &apos;map&apos;)
                  </CardTitle>
                  <CardDescription>
                    frontend · v3.14.2 · first seen 2h ago · 2,847 events
                  </CardDescription>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="secondary">
                    Ignore
                  </Button>
                  <Button size="sm">
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Resolve
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Stack trace */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Stack trace</h3>
                  <div className="rounded-lg border bg-muted p-4 font-mono text-xs space-y-1.5 overflow-x-auto">
                    <p className="text-destructive font-medium">
                      TypeError: Cannot read properties of undefined (reading
                      &apos;map&apos;)
                    </p>
                    <p className="text-foreground">
                      at UserList{" "}
                      <span className="text-muted-foreground">
                        (./src/components/UserList.tsx:42:18)
                      </span>
                    </p>
                    <p className="text-muted-foreground">
                      at renderWithHooks (react-dom.js:14985:18)
                    </p>
                    <p className="text-muted-foreground">
                      at mountIndeterminateComponent
                      (react-dom.js:17811:13)
                    </p>
                    <p className="text-muted-foreground">
                      at beginWork (react-dom.js:19049:16)
                    </p>
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { k: "browser", v: "Chrome 125" },
                      { k: "os", v: "macOS 15.1" },
                      { k: "environment", v: "production" },
                      { k: "release", v: "v3.14.2" },
                      { k: "handled", v: "no" },
                    ].map((tag) => (
                      <Tag key={tag.k} variant="muted">
                        <span className="opacity-70">{tag.k}:</span> {tag.v}
                      </Tag>
                    ))}
                  </div>
                </div>

                {/* Event timeline */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Event frequency</h3>
                  <div className="flex items-end gap-0.5 h-16">
                    {[
                      3, 5, 2, 8, 12, 15, 9, 22, 45, 78, 95, 100, 88, 92, 96,
                      85, 72, 65, 58, 42, 38, 35, 30, 28,
                    ].map((v, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-sm bg-destructive/70"
                        style={{ height: `${v}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>24h ago</span>
                    <span>now</span>
                  </div>
                </div>

                {/* Assignee + breadcrumbs hint */}
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        SD
                      </AvatarFallback>
                    </Avatar>
                    <span>Assigned to you</span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    12 breadcrumbs · 3 replays available
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Gradient showcase */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div
                className="relative rounded-xl overflow-hidden h-48 bg-cover bg-center flex items-end p-6"
                style={{
                  backgroundImage: "url('/fuzzy-dot-bg.png')",
                }}
              >
                <div className="space-y-1">
                  <p className="text-white text-lg font-heading font-bold">
                    The signature gradient
                  </p>
                  <p className="text-white/70 text-sm">
                    Deep purple canvas with vivid mesh washes and dot
                    texture. This is what &ldquo;Sentry&rdquo; looks&nbsp;like.
                  </p>
                </div>
              </div>
              <div
                className="rounded-xl h-48 flex items-end p-6"
                style={{
                  background:
                    "linear-gradient(135deg, #181225 0%, #36166B 30%, #7553FF 60%, #A737B4 100%)",
                }}
              >
                <div className="space-y-1">
                  <p className="text-white text-lg font-heading font-bold">
                    CSS fallback
                  </p>
                  <p className="text-white/70 text-sm">
                    When the texture isn&apos;t available: Black → Violet →
                    Blurple → Orchid at 135°.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Color palette */}
          <section className="py-16 space-y-8">
            <div>
              <h2 className="font-heading text-2xl font-bold">Brand palette</h2>
              <p className="text-muted-foreground">
                Blurple is the star. We use a dark shade of purple rather than
                straight #000 black — it makes everything feel warmer and more
                intentional.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 sm:grid-cols-9">
              {BRAND_COLORS.map((c) => (
                <div key={c.name} className="space-y-2">
                  <div
                    className={`aspect-square rounded-xl ring-1 ring-inset ${c.ring || "ring-white/10"}`}
                    style={{ backgroundColor: c.hex }}
                  />
                  <div>
                    <div className="text-xs font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {c.hex}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Semantic tokens */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Semantic tokens — toggle the theme to see them adapt
              </h3>
              <div className="grid gap-2 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
                {[
                  { label: "bg", c: "bg-background text-foreground border" },
                  { label: "card", c: "bg-card text-card-foreground border" },
                  { label: "muted", c: "bg-muted text-muted-foreground" },
                  { label: "accent", c: "bg-accent text-accent-foreground" },
                  { label: "primary", c: "bg-primary text-primary-foreground" },
                  {
                    label: "secondary",
                    c: "bg-secondary text-secondary-foreground",
                  },
                  {
                    label: "destructive",
                    c: "bg-destructive text-destructive-foreground",
                  },
                  {
                    label: "popover",
                    c: "bg-popover text-popover-foreground border",
                  },
                ].map((t) => (
                  <div
                    key={t.label}
                    className={`rounded-lg p-3 text-center ${t.c}`}
                  >
                    <div className="text-xs font-medium">{t.label}</div>
                  </div>
                ))}
              </div>
              <div className="grid gap-2 grid-cols-3">
                <div className="rounded-lg bg-warning p-3 text-warning-foreground text-center">
                  <div className="text-xs font-medium">warning</div>
                </div>
                <div className="rounded-lg bg-success p-3 text-success-foreground text-center">
                  <div className="text-xs font-medium">success</div>
                </div>
                <div className="rounded-lg bg-promotion p-3 text-promotion-foreground text-center">
                  <div className="text-xs font-medium">promotion</div>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Typography */}
          <section className="py-16 space-y-8">
            <div>
              <h2 className="font-heading text-2xl font-bold">Typography</h2>
              <p className="text-muted-foreground">
                Dammit Sans for headlines. Rubik for everything else. Roboto
                Mono for code. Always sentence case.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-mono">
                    font-heading · Dammit Sans
                  </p>
                  <p className="font-heading text-5xl font-bold tracking-tight leading-tight">
                    Fix your bugs before your users find&nbsp;them
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-mono">
                    font-sans · Rubik 400
                  </p>
                  <p className="text-base leading-relaxed">
                    Sentry helps developers ship with confidence. Real-time
                    error tracking, performance monitoring, and session replay
                    give you the context you need to fix what&apos;s broken —
                    fast.
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-mono">
                    font-sans · Rubik 500
                  </p>
                  <p className="text-base font-medium">
                    Subheads use medium weight to create hierarchy without
                    shouting.
                  </p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-mono">
                    font-mono · Roboto Mono
                  </p>
                  <div className="rounded-lg bg-muted p-4 font-mono text-sm space-y-1">
                    <p className="text-destructive">
                      TypeError: Cannot read properties of undefined
                    </p>
                    <p className="text-muted-foreground">
                      {`  at UserList (./src/components/UserList.tsx:42:18)`}
                    </p>
                    <p className="text-muted-foreground">
                      {`  at renderWithHooks (react-dom.js:14985:18)`}
                    </p>
                    <p className="text-muted-foreground">
                      {`  at mountIndeterminateComponent (react-dom.js:17811:13)`}
                    </p>
                  </div>
                </div>
                <Card className="bg-muted">
                  <CardContent className="space-y-2 text-sm">
                    <p>
                      <strong>Sentence case always.</strong> Capitalize only the
                      first word and proper nouns.
                    </p>
                    <p className="text-success font-mono text-xs">
                      ✓ Welcome to Sentry
                    </p>
                    <p className="text-destructive font-mono text-xs">
                      ✗ Welcome To Sentry
                    </p>
                    <p className="text-success font-mono text-xs">
                      ✓ Set up your first project
                    </p>
                    <p className="text-destructive font-mono text-xs">
                      ✗ Set Up Your First Project
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          <Separator />

          {/* Voice */}
          <section className="py-16 space-y-8" id="voice">
            <div>
              <h2 className="font-heading text-2xl font-bold">Voice & tone</h2>
              <p className="text-muted-foreground">
                Sentry sounds like a veteran on the dev team who&apos;s seen
                some stuff but keeps it approachable. Not corporate. Not trying
                to sell you something.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  trait: "Informative",
                  desc: "Straightforward, accurate. We don't manipulate.",
                },
                {
                  trait: "Self-aware",
                  desc: "We're not curing cancer. We help developers.",
                },
                {
                  trait: "Unexcitable",
                  desc: 'Use "!" sparingly. Better for sarcasm than CTAs.',
                },
                {
                  trait: "Plain English",
                  desc: "No jargon. Write how you speak. American spelling.",
                },
                {
                  trait: "Gets our users",
                  desc: "They should feel understood, not marketed to.",
                },
                {
                  trait: "Fun",
                  desc: "Dry humor. Poke fun at universal dev struggles.",
                },
              ].map((v) => (
                <Card key={v.trait}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{v.trait}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{v.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-success/20">
                <CardContent>
                  <div className="mb-3 text-sm font-medium text-success flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Sounds like Sentry
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>&ldquo;Something broke. Here&apos;s the stack trace.&rdquo;</li>
                    <li>&ldquo;Your deploy is fine. Probably.&rdquo;</li>
                    <li>&ldquo;2,847 users hit this bug. You should probably fix it.&rdquo;</li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-destructive/20">
                <CardContent>
                  <div className="mb-3 text-sm font-medium text-destructive flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4" /> Doesn&apos;t sound like
                    Sentry
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>&ldquo;We&apos;re THRILLED to announce our latest feature!!!&rdquo;</li>
                    <li>&ldquo;Supercharge your developer experience today!&rdquo;</li>
                    <li>&ldquo;Empower your team to achieve software excellence.&rdquo;</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          <Separator />

          {/* Motion */}
          <section className="py-16 space-y-8">
            <div>
              <h2 className="font-heading text-2xl font-bold">
                Motion & animation
              </h2>
              <p className="text-muted-foreground">
                Sentry uses three speed tiers and five easing curves. Every
                transition should feel intentional — slow for storytelling,
                snappy for&nbsp;hype.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  speed: "Fast",
                  ms: "120ms",
                  desc: "Micro-interactions: hover, focus, toggle",
                },
                {
                  speed: "Moderate",
                  ms: "160ms",
                  desc: "State changes: expand, collapse, tab switch",
                },
                {
                  speed: "Slow",
                  ms: "240ms",
                  desc: "Entrances, exits, page transitions",
                },
              ].map((tier) => (
                <Card key={tier.speed}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      {tier.speed}
                      <code className="text-xs font-mono text-muted-foreground font-normal">
                        {tier.ms}
                      </code>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {tier.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Easing curves</CardTitle>
                  <CardDescription>
                    CSS cubic-bezier values for each motion style
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 font-mono text-sm">
                    {[
                      {
                        name: "smooth",
                        value: "cubic-bezier(0.72, 0, 0.16, 1)",
                        desc: "Default for most transitions",
                      },
                      {
                        name: "snap",
                        value: "cubic-bezier(0.8, -0.4, 0.5, 1)",
                        desc: "Playful bounce for toggles",
                      },
                      {
                        name: "enter",
                        value: "cubic-bezier(0.24, 1, 0.32, 1)",
                        desc: "Elements appearing on screen",
                      },
                      {
                        name: "exit",
                        value: "cubic-bezier(0.64, 0, 0.8, 0)",
                        desc: "Elements leaving the screen",
                      },
                      {
                        name: "spring",
                        value: "stiffness: 1000, damping: 50",
                        desc: "Physics-based for delight",
                      },
                    ].map((curve) => (
                      <div
                        key={curve.name}
                        className="flex items-baseline justify-between gap-4"
                      >
                        <div>
                          <span className="text-foreground font-medium">
                            {curve.name}
                          </span>
                          <span className="text-muted-foreground text-xs ml-2 font-sans">
                            {curve.desc}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Live preview</CardTitle>
                  <CardDescription>
                    Hover these to see each curve in action
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      name: "smooth",
                      cssVar: "--ease-smooth",
                      duration: "--duration-slow",
                      className:
                        "transition-all [transition-duration:var(--duration-slow)] [transition-timing-function:var(--ease-smooth)] hover:translate-x-4 hover:bg-primary hover:text-primary-foreground",
                    },
                    {
                      name: "snap",
                      cssVar: "--ease-snap",
                      duration: "--duration-moderate",
                      className:
                        "transition-all [transition-duration:var(--duration-moderate)] [transition-timing-function:var(--ease-snap)] hover:translate-x-4 hover:bg-chart-2 hover:text-white",
                    },
                    {
                      name: "enter",
                      cssVar: "--ease-enter",
                      duration: "--duration-slow",
                      className:
                        "transition-all [transition-duration:var(--duration-slow)] [transition-timing-function:var(--ease-enter)] hover:translate-x-4 hover:bg-success hover:text-success-foreground",
                    },
                    {
                      name: "exit",
                      cssVar: "--ease-exit",
                      duration: "--duration-fast",
                      className:
                        "transition-all [transition-duration:var(--duration-fast)] [transition-timing-function:var(--ease-exit)] hover:translate-x-4 hover:bg-warning hover:text-warning-foreground",
                    },
                  ].map((curve) => (
                    <div
                      key={curve.name}
                      className={`rounded-lg border px-4 py-3 text-sm font-medium cursor-pointer ${curve.className}`}
                    >
                      {curve.name}
                      <span className="ml-2 text-xs text-muted-foreground font-mono">
                        var({curve.cssVar})
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </section>

          <Separator />

          {/* Install */}
          <section className="py-16 space-y-6">
            <div>
              <h2 className="font-heading text-2xl font-bold">Get started</h2>
              <p className="text-muted-foreground">
                One command to install the base theme into any shadcn project.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">1. Install the theme</p>
                <div className="flex items-center gap-2 rounded-lg border bg-muted p-3 font-mono text-sm">
                  <Terminal className="h-4 w-4 text-muted-foreground shrink-0" />
                  <code className="flex-1">npx shadcn add https://scrapscn.sentry.dev/r/sentry-base</code>
                  <CopyButton text="npx shadcn add https://scrapscn.sentry.dev/r/sentry-base" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  2. Wrap your app with the theme provider
                </p>
                <div className="rounded-lg border bg-muted p-3 font-mono text-sm text-muted-foreground overflow-x-auto">
                  <code className="block whitespace-pre">{`import { ThemeProvider } from "@/components/theme-provider"

<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>`}</code>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">3. Use components</p>
                <p className="text-sm text-muted-foreground">
                  All shadcn components automatically pick up the Sentry
                  theme. No custom CSS needed.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-7xl px-6 py-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <SentryWordmark className="h-5 w-auto" />
          </div>
          <p className="text-sm text-muted-foreground">
            Built with shadcn/ui. Themed with Sentry&apos;s design tokens.
          </p>
        </div>
      </footer>
    </div>
  );
}
