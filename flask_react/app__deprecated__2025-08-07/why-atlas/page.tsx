import Link from "next/link"
import { Button } from "@/components/ui"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui"
import {
  Shield,
  CheckCircle,
  X,
  FileText,
  Lock,
  Server,
  Database,
  FileSpreadsheet,
  BarChart3,
  Building2,
  CheckSquare,
} from "lucide-react"
import { Navbar } from "@/components/navbar"

export default function WhyAtlasPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-white to-gray-50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">Why Atlas?</h1>
                <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                  <em>Because real estate documents aren't casual reading</em>
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">"Can't I just use ChatGPT?"</h2>
                <p className="text-gray-500 md:text-xl">
                  You can — but not if accuracy, auditability, or client confidentiality matter.
                </p>
                <p className="text-gray-500 md:text-xl font-medium">
                  Atlas is built for commercial real estate documents.
                  <br />
                  With 98%+ accuracy and strict data permission controls, we make sure your files are right — and stay
                  private.
                </p>
              </div>
              <div className="flex items-center justify-center lg:justify-end">
                <div className="relative w-full max-w-[500px] rounded-lg border bg-background p-6 shadow-lg">
                  <div className="flex items-start space-x-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                      <X className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold">General AI Limitations</h3>
                      <ul className="space-y-2 text-sm text-gray-500">
                        <li className="flex items-start">
                          <X className="mr-2 h-4 w-4 text-red-500 mt-0.5" />
                          <span>Not trained on specialized CRE documents</span>
                        </li>
                        <li className="flex items-start">
                          <X className="mr-2 h-4 w-4 text-red-500 mt-0.5" />
                          <span>Lower accuracy on complex lease terms</span>
                        </li>
                        <li className="flex items-start">
                          <X className="mr-2 h-4 w-4 text-red-500 mt-0.5" />
                          <span>May use your data to train their models</span>
                        </li>
                        <li className="flex items-start">
                          <X className="mr-2 h-4 w-4 text-red-500 mt-0.5" />
                          <span>No audit trail for verification</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-6 flex items-start space-x-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold">Atlas Advantages</h3>
                      <ul className="space-y-2 text-sm text-gray-500">
                        <li className="flex items-start">
                          <CheckCircle className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                          <span>Purpose-built for CRE documents</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                          <span>98%+ first-pass accuracy</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                          <span>Private by default, your data stays yours</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                          <span>Complete audit trail for every field</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  ChatGPT is a generalist. Atlas is your lease-reading expert.
                </h2>
              </div>
            </div>
            <div className="mx-auto max-w-3xl mt-12">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Tool</TableHead>
                      <TableHead>Trained for CRE</TableHead>
                      <TableHead>Accuracy (1st pass)</TableHead>
                      <TableHead>Private by Default</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">ChatGPT</TableCell>
                      <TableCell>
                        <X className="h-5 w-5 text-red-500" />
                      </TableCell>
                      <TableCell>~85%</TableCell>
                      <TableCell>
                        <X className="h-5 w-5 text-red-500" />
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-primary/5 font-medium">
                      <TableCell className="font-bold">Atlas</TableCell>
                      <TableCell>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </TableCell>
                      <TableCell className="font-bold">98%+</TableCell>
                      <TableCell>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">You control the data. Always.</h2>
                <p className="text-gray-500 md:text-xl">
                  Many of your documents are protected by NDAs, legal agreements, or client relationships. Atlas
                  respects that — and enforces it by design.
                </p>
                <ul className="space-y-2 text-gray-500 md:text-lg">
                  <li className="flex items-start">
                    <CheckSquare className="mr-2 h-5 w-5 text-primary mt-0.5" />
                    <span>Documents are private by default</span>
                  </li>
                  <li className="flex items-start">
                    <CheckSquare className="mr-2 h-5 w-5 text-primary mt-0.5" />
                    <span>Only your team or designated users can view, download, or interact with outputs</span>
                  </li>
                  <li className="flex items-start">
                    <CheckSquare className="mr-2 h-5 w-5 text-primary mt-0.5" />
                    <span>Nothing is ever shared without your firm's explicit permission</span>
                  </li>
                </ul>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-[500px] h-[300px] rounded-lg border bg-background p-6 shadow-lg">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-64 h-64">
                      <div className="absolute inset-0 rounded-full border-4 border-dashed border-gray-200 animate-spin-slow"></div>
                      <div className="absolute inset-4 rounded-full border-2 border-primary bg-white flex items-center justify-center">
                        <Lock className="h-16 w-16 text-primary" />
                      </div>
                      <div className="absolute top-0 right-0 -mr-4 -mt-4 h-12 w-12 rounded-full bg-white border-2 border-primary flex items-center justify-center shadow-lg">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="absolute bottom-0 left-0 -ml-4 -mb-4 h-12 w-12 rounded-full bg-white border-2 border-primary flex items-center justify-center shadow-lg">
                        <Shield className="h-6 w-6 text-primary" />
                      </div>
                      <div className="absolute bottom-0 right-0 -mr-4 -mb-4 h-12 w-12 rounded-full bg-white border-2 border-primary flex items-center justify-center shadow-lg">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  Flexible architecture. Compliant by default.
                </h2>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:gap-12">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Server className="mr-2 h-5 w-5" />
                    Atlas-Hosted Cloud (on AWS)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-500">
                    <li className="flex items-start">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                      <span>SOC 2-compliant infrastructure</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                      <span>AES-256 encryption at rest, TLS 1.2+ encryption in transit</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                      <span>Secure key management via AWS KMS</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                      <span>Optional geographic region selection to meet data residency requirements</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="mr-2 h-5 w-5" />
                    Customer-Hosted (On-Premises or Hybrid)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-500">
                    <li className="flex items-start">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                      <span>Deploy Atlas within your own cloud or internal systems</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                      <span>Full control over data storage, network security, and integration</span>
                    </li>
                  </ul>
                  <div className="mt-4 pt-4 border-t text-sm text-gray-500">
                    With either deployment, your data never leaves your network unless you explicitly allow it.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  Structured. Auditable. Defensible.
                </h2>
                <p className="text-gray-500 md:text-xl">
                  Atlas doesn't just summarize — it extracts and organizes data into clean, ready-to-use formats with
                  full source traceability.
                </p>
                <ul className="space-y-2 text-gray-500 md:text-lg">
                  <li className="flex items-start">
                    <CheckSquare className="mr-2 h-5 w-5 text-primary mt-0.5" />
                    <span>Exportable to Excel, valuation models, or investor reports</span>
                  </li>
                  <li className="flex items-start">
                    <CheckSquare className="mr-2 h-5 w-5 text-primary mt-0.5" />
                    <span>Trace every field back to its original location in the PDF</span>
                  </li>
                  <li className="flex items-start">
                    <CheckSquare className="mr-2 h-5 w-5 text-primary mt-0.5" />
                    <span>Optional human QA for high-stakes or messy scans</span>
                  </li>
                </ul>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-[500px] rounded-lg border bg-background p-6 shadow-lg">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center">
                        <FileText className="mr-2 h-5 w-5 text-primary" />
                        <span className="font-medium">Lease Document</span>
                      </div>
                      <span className="text-xs text-gray-500">Source: Page 12, Section 4.2</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500">Lease Term</div>
                        <div className="font-medium">60 months</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Commencement Date</div>
                        <div className="font-medium">01/15/2023</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Base Rent</div>
                        <div className="font-medium">$5,250 /month</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Annual Escalation</div>
                        <div className="font-medium">3.0%</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2">
                      <div className="flex items-center">
                        <FileSpreadsheet className="mr-2 h-5 w-5 text-green-500" />
                        <span className="text-sm text-green-600">Export to Excel</span>
                      </div>
                      <div className="flex items-center">
                        <BarChart3 className="mr-2 h-5 w-5 text-blue-500" />
                        <span className="text-sm text-blue-600">View Analysis</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  A smarter way to protect, verify, and attribute your work
                </h2>
                <p className="text-gray-500 md:text-xl">
                  Each finalized abstraction is tokenized — which means it becomes a secure, immutable digital record.
                </p>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center space-y-2 text-center">
                        <Shield className="h-8 w-8 text-primary" />
                        <h3 className="font-bold">Proof of authorship</h3>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center space-y-2 text-center">
                        <CheckCircle className="h-8 w-8 text-primary" />
                        <h3 className="font-bold">Proof of integrity</h3>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center space-y-2 text-center">
                        <FileText className="h-8 w-8 text-primary" />
                        <h3 className="font-bold">Audit-ready</h3>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center space-y-2 text-center">
                        <BarChart3 className="h-8 w-8 text-primary" />
                        <h3 className="font-bold">Lifecycle tracking</h3>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-[500px] h-[400px] rounded-lg border bg-background p-6 shadow-lg">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full max-w-[400px] space-y-6">
                      <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white">
                              <Shield className="h-5 w-5" />
                            </div>
                            <div className="ml-3">
                              <div className="font-medium">Document Verified</div>
                              <div className="text-xs text-gray-500">Lease #A12345</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">04/11/2023</div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Document Hash:</span>
                            <span className="font-mono">8f4e2c...</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Verified By:</span>
                            <span>Atlas AI + J. Smith</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Confidence:</span>
                            <span className="text-green-600">99.2%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <div className="h-16 border-l-2 border-dashed border-gray-300"></div>
                      </div>
                      <div className="rounded-lg border bg-white p-4 shadow-sm">
                        <div className="flex items-center space-x-2 mb-2">
                          <FileText className="h-5 w-5 text-primary" />
                          <span className="font-medium">Audit Trail</span>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                            <span className="text-gray-500">Created: 04/10/2023 09:15 AM</span>
                          </div>
                          <div className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                            <span className="text-gray-500">Reviewed: 04/10/2023 02:30 PM</span>
                          </div>
                          <div className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-purple-500 mr-2"></div>
                            <span className="text-gray-500">Approved: 04/11/2023 10:45 AM</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="demo" className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Try the only AI abstraction tool built for professionals — and built for privacy.
                </h2>
                <p className="mx-auto max-w-[700px] text-primary-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Upload a lease, rent roll, or appraisal and see what structured, secure AI can really do.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <Button asChild size="lg" variant="secondary" className="px-8">
                  <Link href="#demo">Start a Free Demo</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="bg-transparent text-white border-white hover:bg-white/10 px-8"
                >
                  <Link href="#demo">Talk to Sales</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full border-t bg-background py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {new Date().getFullYear()} Atlas Data Co-op. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="#" className="underline underline-offset-4">
              Terms
            </Link>
            <Link href="#" className="underline underline-offset-4">
              Privacy
            </Link>
            <Link href="#" className="underline underline-offset-4">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
